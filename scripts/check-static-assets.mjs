import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

// Baselines: the 2026-08-21 release candidate, built with Node 20 and
// Next 16.3.1. Limits leave 30.9–47.5% headroom. These are uncompressed
// static-export byte budgets, not HTTP transfer sizes or Web Vitals.
export const BUDGETS = {
  nextStaticBytes: { baseline: 2_055_566, limit: 2_750_000 },
  javascriptBytes: { baseline: 1_985_800, limit: 2_650_000 },
  cssBytes: { baseline: 69_766, limit: 100_000 },
  largestNextStaticBytes: { baseline: 229_156, limit: 300_000 },
  emittedPublicBytes: { baseline: 1_136_379, limit: 1_600_000 },
  largestPublicAssetBytes: { baseline: 373_193, limit: 500_000 },
  routePayloadBytes: { baseline: 20_978_583, limit: 30_000_000 },
  largestRoutePayloadBytes: { baseline: 338_889, limit: 500_000 },
  totalExportBytes: { baseline: 24_141_664, limit: 34_000_000 },
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
