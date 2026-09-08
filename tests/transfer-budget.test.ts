import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  compare,
  coldTransferFromReport,
  HEADROOM,
  KINDS,
  limitFor,
} from "../scripts/check-transfer-budget.mjs";
import { LAB_VITALS_ROUTES } from "../scripts/measure-lab-vitals.mjs";

/**
 * The gate exists because the export shrank by 11 MB and nothing noticed.
 * These tests are about the gate rather than the budget: that it accepts the
 * numbers as recorded, and that it fails on each shape it was written to
 * catch — most of all the one it was built after, a document that grows back
 * inside a total too large to show it.
 */
const BUDGET = JSON.parse(readFileSync("config/transfer-budget.json", "utf8"));

function reportFrom(routes: Record<string, { total: number; byKind: Record<string, number> }>) {
  return {
    routes: LAB_VITALS_ROUTES.filter((route) => routes[route.id]).map((route) => ({
      id: route.id,
      profiles: {
        none: {
          cold: {
            samples: [{
              transferBytes: routes[route.id].total,
              transferByKind: routes[route.id].byKind,
            }],
          },
        },
      },
    })),
  };
}

const asMeasured = () => structuredClone(BUDGET.routes);

test("the recorded budget covers every measured route, by kind", () => {
  assert.deepEqual(Object.keys(BUDGET.routes).sort(), LAB_VITALS_ROUTES.map((r) => r.id).sort());
  for (const [id, route] of Object.entries(BUDGET.routes) as [string, { total: number; byKind: Record<string, number> }][]) {
    assert.deepEqual(Object.keys(route.byKind).sort(), [...KINDS].sort(), `${id} kinds`);
    const summed = KINDS.reduce((sum, kind) => sum + route.byKind[kind], 0);
    assert.equal(summed, route.total, `${id} kinds must sum to its total`);
  }
});

test("the allowance covers a different compressor and nothing more", () => {
  // Node's zlib and the system gzip disagree by 0.19% on the same file; CI
  // runs a different Node than a laptop does. 3% covers that with room, and
  // is far below the ~100% a re-added dictionary shows on a document.
  assert.ok(HEADROOM.fraction >= 0.01 && HEADROOM.fraction <= 0.05);
  assert.equal(limitFor(100_000), 103_000);
  // Small numbers get an absolute floor so they are not hair-triggered.
  assert.equal(limitFor(0), HEADROOM.minimumBytes);
  assert.equal(limitFor(1_000), 1_000 + HEADROOM.minimumBytes);
});

test("the budget as recorded passes against itself", () => {
  const { problems } = compare(BUDGET, coldTransferFromReport(reportFrom(asMeasured())));
  assert.deepEqual(problems, []);
});

test("a document that grows back is caught, where the total alone would hide it", () => {
  // The regression this was built after: the whole message dictionary back in
  // every page. About 10 kB — 4% of a 250 kB route, ~100% of its document.
  const measured = asMeasured();
  measured.home.byKind.document += 10_000;
  measured.home.total += 10_000;
  const { problems } = compare(BUDGET, coldTransferFromReport(reportFrom(measured)));
  assert.ok(problems.some((p) => /home\/document .*\+97\.\d%/.test(p)), problems.join("\n"));
});

test("growth small enough to hide in a total is still caught on its own kind", () => {
  // Deliberately below the total's tolerance, so only the per-kind figure can
  // catch it. This is the case that justifies the breakdown existing.
  const measured = asMeasured();
  const bump = Math.ceil(measured.lab.byKind.document * 0.5);
  measured.lab.byKind.document += bump;
  measured.lab.total += bump;
  assert.ok(measured.lab.total < limitFor(BUDGET.routes.lab.total), "must hide inside the total");
  const { problems } = compare(BUDGET, coldTransferFromReport(reportFrom(measured)));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /lab\/document/);
});

test("a route measured with no budget, or budgeted and not measured, fails", () => {
  const measured = asMeasured();
  delete measured.teach;
  const missing = compare(BUDGET, coldTransferFromReport(reportFrom(measured)));
  assert.ok(missing.problems.some((p) => /teach is budgeted but was not measured/.test(p)));

  const extra = compare(
    { ...BUDGET, routes: Object.fromEntries(Object.entries(BUDGET.routes).filter(([id]) => id !== "lab")) },
    coldTransferFromReport(reportFrom(asMeasured())),
  );
  assert.ok(extra.problems.some((p) => /lab was measured but has no budget/.test(p)));
});

test("a route that has fallen well below budget is reported, not failed", () => {
  const measured = asMeasured();
  measured.teach.byKind.script -= 40_000;
  measured.teach.total -= 40_000;
  const { problems, slack } = compare(BUDGET, coldTransferFromReport(reportFrom(measured)));
  assert.deepEqual(problems, []);
  assert.ok(slack.some((s) => /teach\/script is 40000 bytes below its budget/.test(s)));
});

test("a run whose samples disagree is refused rather than recorded", () => {
  // The gate rests on the measurement being exact. If it stops being exact,
  // that is a finding about the harness, not a number to average away.
  const report = reportFrom(asMeasured());
  report.routes[0].profiles.none.cold.samples.push({
    transferBytes: BUDGET.routes.home.total + 17,
    transferByKind: BUDGET.routes.home.byKind,
  });
  assert.throws(() => coldTransferFromReport(report), /assumption\s+has just failed/);
});

test("a report from before the per-kind breakdown is named as such", () => {
  const report = reportFrom(asMeasured());
  delete (report.routes[0].profiles.none.cold.samples[0] as { transferByKind?: unknown }).transferByKind;
  assert.throws(() => coldTransferFromReport(report), /predates the per-kind transfer breakdown/);
});
