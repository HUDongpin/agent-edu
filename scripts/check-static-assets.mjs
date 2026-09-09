import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

// Baselines: measured on this branch, built with Node 20 and Next 16.3.1.
// Limits leave 26.7-43.3% headroom. These are uncompressed static-export byte
// budgets, not HTTP transfer sizes or Web Vitals — for what a route actually
// pulls over the wire, see scripts/check-transfer-budget.mjs.
//
// Rebaselined from the 2026-08-21 candidate `60f7edc`, where three of these
// had stopped being able to catch anything: the export halved, and a budget
// written around 24 MB went on passing an export of 13 MB with 60% of its
// limit unused. A gate that cannot fail is not a gate.
//
// Two rules held while rebaselining, and worth holding again:
//
//   Baselines move to what is measured. Two of these are *larger* than the
//   2026-08-21 figures — the JavaScript bundle has grown 5.3% over the
//   thirty-odd commits on this branch — and recording that is the point.
//   A baseline that only ever records improvements is a scoreboard.
//
//   Limits fall where the measurement fell, and none is raised. A pass that
//   loosens a limit is not a tightening pass, and the moment to argue for
//   more room is when something needs it, in the commit that needs it.
//
// The three that moved leave room for roughly three more localised routes —
// nine pages each — before the tightest of them binds.
export const BUDGETS = {
  nextStaticBytes: { baseline: 2_161_232, limit: 2_750_000 },
  javascriptBytes: { baseline: 2_091_129, limit: 2_650_000 },
  cssBytes: { baseline: 70_103, limit: 100_000 },
  largestNextStaticBytes: { baseline: 229_156, limit: 300_000 },
  emittedPublicBytes: { baseline: 1_136_508, limit: 1_600_000 },
  largestPublicAssetBytes: { baseline: 373_193, limit: 500_000 },
  routePayloadBytes: { baseline: 10_117_399, limit: 14_500_000 },
  largestRoutePayloadBytes: { baseline: 301_813, limit: 430_000 },
  totalExportBytes: { baseline: 13_415_139, limit: 19_000_000 },
};

function kindFor(path) {
  const extension = extname(path).toLowerCase();
  if ([".js", ".mjs"].includes(extension)) return "javascript";
  if (extension === ".css") return "css";
  if ([".html", ".htm"].includes(extension)) return "html";
  if (extension === ".txt") return "text-payload";
  if ([".woff", ".woff2", ".ttf", ".otf"].includes(extension)) return "font";
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg"].includes(extension)) {
    return "image";
  }
  return extension.slice(1) || "other";
}

function regularFilesBelow(root) {
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) {
        const info = lstatSync(absolute);
        if (!info.isFile() || info.isSymbolicLink()) {
          throw new Error(`non-regular export asset: ${absolute}`);
        }
        files.push({ absolute, bytes: info.size });
      } else {
        throw new Error(`non-regular export asset: ${absolute}`);
      }
    }
  };
  visit(root);
  return files;
}

function normalizedPath(projectRoot, absolute, buildId) {
  return relative(projectRoot, absolute).split(sep).join("/")
    .replace(`out/_next/static/${buildId}/`, "out/_next/static/<build-id>/");
}

function evaluatedBudget(name, actual) {
  const budget = BUDGETS[name];
  return {
    baseline: budget.baseline,
    limit: budget.limit,
    headroomBytes: budget.limit - budget.baseline,
    headroomPercent: Number((((budget.limit / budget.baseline) - 1) * 100).toFixed(1)),
    actual,
    pass: actual <= budget.limit,
  };
}

function total(files, predicate = () => true) {
  return files.filter(predicate).reduce((sum, file) => sum + file.bytes, 0);
}

function largest(files) {
  return files.length === 0 ? 0 : Math.max(...files.map((file) => file.bytes));
}

export function checkStaticAssets(options = {}) {
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const out = join(projectRoot, "out");
  const staticRoot = join(out, "_next", "static");
  const publicRoot = join(projectRoot, "public");
  const prerenderPath = join(projectRoot, ".next", "prerender-manifest.json");
  const buildIdPath = join(projectRoot, ".next", "BUILD_ID");
  if (
    !existsSync(out) ||
    !existsSync(staticRoot) ||
    !existsSync(publicRoot) ||
    !existsSync(prerenderPath) ||
    !existsSync(buildIdPath)
  ) {
    throw new Error("fresh build output is missing; run npm run build before npm run assets:check");
  }

  const prerender = JSON.parse(readFileSync(prerenderPath, "utf8"));
  if (!prerender.routes || Object.keys(prerender.routes).length === 0) {
    throw new Error("the Next prerender manifest has no routes");
  }

  const buildId = readFileSync(buildIdPath, "utf8").trim();
  if (!buildId || buildId.includes("/") || buildId.includes("\\")) {
    throw new Error("the Next build ID is missing or invalid");
  }

  const publicFiles = regularFilesBelow(publicRoot);
  const publicByRelativePath = new Map(publicFiles.map((file) => [
    relative(publicRoot, file.absolute).split(sep).join("/"),
    file,
  ]));
  const allFiles = regularFilesBelow(out).map((file) => {
    const outRelative = relative(out, file.absolute).split(sep).join("/");
    const category = outRelative.startsWith("_next/static/")
      ? "next-static"
      : publicByRelativePath.has(outRelative)
        ? "emitted-public"
        : "route-payload";
    return {
      path: normalizedPath(projectRoot, file.absolute, buildId),
      bytes: file.bytes,
      kind: kindFor(file.absolute),
      category,
      outRelative,
    };
  });
  if (allFiles.length === 0) throw new Error("out contains no files");

  const byOutRelative = new Map(allFiles.map((file) => [file.outRelative, file]));
  for (const [path, source] of publicByRelativePath) {
    const emitted = byOutRelative.get(path);
    if (!emitted) throw new Error(`public asset was not emitted: public/${path}`);
    if (
      emitted.bytes !== source.bytes ||
      !readFileSync(join(out, path)).equals(readFileSync(source.absolute))
    ) {
      throw new Error(`emitted public asset contents drifted: public/${path}`);
    }
  }

  const nextStatic = allFiles.filter((file) => file.category === "next-static");
  const emittedPublic = allFiles.filter((file) => file.category === "emitted-public");
  const routePayloads = allFiles.filter((file) => file.category === "route-payload");
  if (nextStatic.length === 0) throw new Error("out/_next/static contains no files");
  if (routePayloads.length === 0) throw new Error("out contains no route payloads");

  const actuals = {
    nextStaticBytes: total(nextStatic),
    javascriptBytes: total(nextStatic, (file) => file.kind === "javascript"),
    cssBytes: total(nextStatic, (file) => file.kind === "css"),
    largestNextStaticBytes: largest(nextStatic),
    emittedPublicBytes: total(emittedPublic),
    largestPublicAssetBytes: largest(emittedPublic),
    routePayloadBytes: total(routePayloads),
    largestRoutePayloadBytes: largest(routePayloads),
    totalExportBytes: total(allFiles),
  };
  const budgets = Object.fromEntries(
    Object.entries(actuals).map(([name, actual]) => [name, evaluatedBudget(name, actual)]),
  );
  const passed = Object.values(budgets).every((budget) => budget.pass);

  const inventory = {
    schemaVersion: 2,
    source: "out",
    buildIdNormalized: true,
    prerenderRouteCount: Object.keys(prerender.routes).length,
    categories: {
      nextStatic: { fileCount: nextStatic.length, bytes: actuals.nextStaticBytes },
      emittedPublic: { fileCount: emittedPublic.length, bytes: actuals.emittedPublicBytes },
      routePayloads: { fileCount: routePayloads.length, bytes: actuals.routePayloadBytes },
    },
    summary: {
      fileCount: allFiles.length,
      ...actuals,
    },
    budgets,
    files: allFiles
      .map((file) => ({
        path: file.path,
        bytes: file.bytes,
        kind: file.kind,
        category: file.category,
      }))
      .sort((left, right) => left.path.localeCompare(right.path)),
    passed,
  };
  if (options.emit !== false) process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);

  if (!passed) {
    const failed = Object.entries(budgets)
      .filter(([, budget]) => !budget.pass)
      .map(([name, budget]) => `${name} ${budget.actual} > ${budget.limit}`);
    throw new Error(`static asset budget exceeded: ${failed.join(", ")}`);
  }
  return inventory;
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  try {
    checkStaticAssets();
  } catch (error) {
    console.error(`assets: FAIL — ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
