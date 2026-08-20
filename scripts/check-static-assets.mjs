import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const PROJECT = resolve(process.cwd());
const OUT = join(PROJECT, "out");
const STATIC = join(OUT, "_next", "static");
const PRERENDER = join(PROJECT, ".next", "prerender-manifest.json");
const BUILD_ID = join(PROJECT, ".next", "BUILD_ID");

// Baseline: release candidate 60f7edc, built with Node 20 and Next 16.3.1.
// Limits deliberately allow roughly 31–43% growth. They catch accidental asset
// duplication or a new large dependency without pretending these bytes are CWV.
const BUDGETS = {
  staticBytes: { baseline: 2_055_566, limit: 2_750_000 },
  javascriptBytes: { baseline: 1_985_800, limit: 2_650_000 },
  cssBytes: { baseline: 69_766, limit: 100_000 },
  largestAssetBytes: { baseline: 229_156, limit: 300_000 },
};

function kindFor(path) {
  const extension = extname(path).toLowerCase();
  if (extension === ".js") return "javascript";
  if (extension === ".css") return "css";
  if ([".woff", ".woff2", ".ttf", ".otf"].includes(extension)) return "font";
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg"].includes(extension)) return "image";
  return extension.slice(1) || "other";
}

function filesBelow(root, buildId) {
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) {
        const path = relative(PROJECT, absolute).split(sep).join("/")
          .replace(`out/_next/static/${buildId}/`, "out/_next/static/<build-id>/");
        files.push({ path, bytes: statSync(absolute).size, kind: kindFor(path) });
      }
    }
  };
  visit(root);
  return files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
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

export function checkStaticAssets() {
  if (!existsSync(STATIC) || !existsSync(PRERENDER) || !existsSync(BUILD_ID)) {
    throw new Error("fresh build output is missing; run npm run build before npm run assets:check");
  }

  const prerender = JSON.parse(readFileSync(PRERENDER, "utf8"));
  if (!prerender.routes || Object.keys(prerender.routes).length === 0) {
    throw new Error("the Next prerender manifest has no routes");
  }

  const buildId = readFileSync(BUILD_ID, "utf8").trim();
  if (!buildId || buildId.includes("/") || buildId.includes("\\")) {
    throw new Error("the Next build ID is missing or invalid");
  }

  const files = filesBelow(STATIC, buildId);
  if (files.length === 0) throw new Error("out/_next/static contains no files");

  const staticBytes = files.reduce((sum, file) => sum + file.bytes, 0);
  const javascriptBytes = files.filter((file) => file.kind === "javascript")
    .reduce((sum, file) => sum + file.bytes, 0);
  const cssBytes = files.filter((file) => file.kind === "css")
    .reduce((sum, file) => sum + file.bytes, 0);
  const largestAssetBytes = Math.max(...files.map((file) => file.bytes));
  const budgets = {
    staticBytes: evaluatedBudget("staticBytes", staticBytes),
    javascriptBytes: evaluatedBudget("javascriptBytes", javascriptBytes),
    cssBytes: evaluatedBudget("cssBytes", cssBytes),
    largestAssetBytes: evaluatedBudget("largestAssetBytes", largestAssetBytes),
  };
  const passed = Object.values(budgets).every((budget) => budget.pass);

  const inventory = {
    schemaVersion: 1,
    source: "out/_next/static",
    prerenderRouteCount: Object.keys(prerender.routes).length,
    summary: {
      fileCount: files.length,
      staticBytes,
      javascriptBytes,
      cssBytes,
      largestAssetBytes,
    },
    budgets,
    files,
    passed,
  };
  process.stdout.write(`${JSON.stringify(inventory, null, 2)}\n`);

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
