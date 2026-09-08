/**
 * What a route costs a reader, held to a number.
 *
 * `scripts/check-static-assets.mjs` budgets the files on disk and says so:
 * uncompressed bytes in the export, not HTTP transfer. Nothing measured what
 * a route actually pulls, so four commits of payload work moved no gate at
 * all — the export shrank by 11 MB and every check stayed exactly as green as
 * it had been.
 *
 * This gates the other number. `scripts/measure-lab-vitals.mjs` records what
 * each route transferred, and this compares it against
 * `config/transfer-budget.json`.
 *
 * Why by kind, and not one figure per route
 * ----------------------------------------
 * Shared JavaScript is 135-182 kB of every route here and rarely moves. A
 * regression in the document hides inside a total that large: putting the
 * whole message dictionary back into every page — the thing this was built
 * after removing — adds about 10 kB, which is 4% of a 250 kB route and would
 * sit inside any tolerance loose enough to be usable. Against the document
 * alone it is closer to +100%, and there is nowhere for it to hide.
 *
 * Why a tolerance at all, when the measurement is exact
 * ----------------------------------------------------
 * It is exact: byte-identical across five samples, across separate runs and
 * across both network profiles. The tolerance is not for measurement noise.
 * It is because these are *compressed* bytes and the compressor is not the
 * same everywhere — Node's zlib and the system gzip disagree by 0.19% on the
 * same file at the same level, and CI runs a different Node than a laptop
 * does. The allowance covers that and nothing more; it is not permission to
 * grow.
 *
 * Growth that is intended is not an error, it is a diff. Re-run with
 * --update, commit the new numbers, and the cost of the change is visible in
 * review as bytes rather than as an adjective.
 *
 *   npm run transfer:check              measure, then check
 *   npm run transfer:check -- --report=r.json    check an existing report
 *   npm run transfer:update             rewrite the budget from a measurement
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { LAB_VITALS_ROUTES, runLabVitals } from "./measure-lab-vitals.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUDGET_PATH = join(ROOT, "config/transfer-budget.json");

export const KINDS = Object.freeze(["document", "script", "stylesheet", "payload", "other"]);

/** Enough to absorb a different zlib, and nothing like enough to hide a regression. */
export const HEADROOM = Object.freeze({ fraction: 0.03, minimumBytes: 512 });

export function limitFor(baseline) {
  return Math.max(Math.ceil(baseline * (1 + HEADROOM.fraction)), baseline + HEADROOM.minimumBytes);
}

/**
 * The cold, first-visit figures, which are the ones a budget is about.
 *
 * Transfer does not vary by network profile — the same bytes arrive, more
 * slowly — so whichever profile the report carries is read, preferring the
 * unthrottled one because it is the cheaper of the two to produce.
 */
export function coldTransferFromReport(report) {
  const out = {};
  for (const route of report?.routes ?? []) {
    const profiles = route.profiles ?? {};
    const profileId = profiles.none ? "none" : Object.keys(profiles)[0];
    const cold = profiles[profileId]?.cold;
    if (!cold?.samples?.length) throw new Error(`report has no cold samples for ${route.id}`);
    const first = cold.samples[0];
    if (!first.transferByKind) {
      throw new Error(`report for ${route.id} predates the per-kind transfer breakdown`);
    }
    /* Samples are byte-identical, so any one of them is the figure; taking
       the first rather than a median keeps the recorded number a thing that
       was actually observed rather than a computed one. */
    for (const sample of cold.samples) {
      if (sample.transferBytes !== first.transferBytes) {
        throw new Error(
          `${route.id} transferred ${first.transferBytes} then ${sample.transferBytes} bytes ` +
          `in the same run — this gate assumes an exact measurement, and that assumption ` +
          `has just failed. Investigate before recording a budget.`,
        );
      }
    }
    out[route.id] = { total: first.transferBytes, byKind: { ...first.transferByKind } };
  }
  return out;
}

export function compare(budget, measured) {
  const problems = [];
  const slack = [];
  const budgeted = Object.keys(budget.routes ?? {});
  const seen = Object.keys(measured);

  for (const id of budgeted) {
    if (!seen.includes(id)) problems.push(`route ${id} is budgeted but was not measured`);
  }
  for (const id of seen) {
    if (!budgeted.includes(id)) {
      problems.push(`route ${id} was measured but has no budget — run with --update`);
    }
  }

  for (const id of budgeted.filter((route) => seen.includes(route))) {
    const want = budget.routes[id];
    const got = measured[id];
    const entries = [["total", want.total, got.total]];
    for (const kind of KINDS) entries.push([kind, want.byKind?.[kind], got.byKind?.[kind]]);

    for (const [label, baseline, actual] of entries) {
      if (!Number.isFinite(baseline)) {
        problems.push(`${id}/${label} has no recorded baseline — run with --update`);
        continue;
      }
      const limit = limitFor(baseline);
      if (actual > limit) {
        problems.push(
          `${id}/${label} transferred ${actual} bytes; budget ${baseline}, limit ${limit} ` +
          `(+${actual - baseline} bytes, +${((100 * (actual - baseline)) / (baseline || 1)).toFixed(1)}%)`,
        );
      } else if (baseline > 0 && actual < baseline - limitFor(0) && actual < baseline * 0.97) {
        slack.push(
          `${id}/${label} is ${baseline - actual} bytes below its budget ` +
          `(${baseline} -> ${actual}); --update to keep the gate tight`,
        );
      }
    }
  }
  return { problems, slack };
}

function usage() {
  return [
    "Usage: npm run transfer:check [-- --report=PATH] [--update]",
    "",
    "Compares what each route transfers against config/transfer-budget.json.",
    "With no --report, one measurement is taken (1 sample, no network emulation);",
    "transfer does not vary by network profile, so that is the cheap one.",
  ].join("\n");
}

async function measure(reportPath) {
  if (reportPath) {
    return JSON.parse(readFileSync(resolve(reportPath), "utf8"));
  }
  return runLabVitals({ samples: 1, port: 4176, headless: true, networks: ["none"] });
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const update = argv.includes("--update");
  const reportArg = argv.find((argument) => argument.startsWith("--report="));
  const unknown = argv.find((argument) => !["--update", "--help", "-h"].includes(argument)
    && !argument.startsWith("--report="));
  if (unknown) throw new Error(`unknown argument: ${unknown}`);

  const report = await measure(reportArg?.slice("--report=".length));
  const measured = coldTransferFromReport(report);

  if (update) {
    const routes = {};
    for (const route of LAB_VITALS_ROUTES) {
      if (measured[route.id]) routes[route.id] = measured[route.id];
    }
    writeFileSync(BUDGET_PATH, `${JSON.stringify({
      note: "Cold-cache HTTP transfer per route, in bytes, as measured by "
        + "scripts/measure-lab-vitals.mjs. Generated by `npm run transfer:update`; "
        + "the allowance around these numbers lives in scripts/check-transfer-budget.mjs.",
      headroom: HEADROOM,
      routes,
    }, null, 2)}\n`);
    process.stdout.write(`transfer: budget rewritten for ${Object.keys(routes).length} routes\n`);
    return;
  }

  if (!existsSync(BUDGET_PATH)) {
    throw new Error("config/transfer-budget.json is missing; run `npm run transfer:update`");
  }
  const budget = JSON.parse(readFileSync(BUDGET_PATH, "utf8"));
  const { problems, slack } = compare(budget, measured);

  for (const note of slack) process.stdout.write(`transfer: ${note}\n`);
  if (problems.length) {
    process.stderr.write(`\ntransfer: ${problems.length} problem(s)\n\n`);
    for (const problem of problems) process.stderr.write(`  ${problem}\n`);
    process.stderr.write(
      "\n  If the growth is intended, run `npm run transfer:update` and commit the\n"
      + "  new numbers, so the cost of the change is reviewable as bytes.\n\n",
    );
    process.exitCode = 1;
    return;
  }
  const total = Object.values(measured).reduce((sum, route) => sum + route.total, 0);
  process.stdout.write(
    `transfer: ${Object.keys(measured).length} routes within budget, `
    + `${(total / 1024).toFixed(0)} kB across all of them\n`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await main();
  } catch (error) {
    process.stderr.write(`transfer: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
