import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const PROJECT = resolve(process.cwd());
const MANIFEST_PATH = join(PROJECT, "config", "route-manifest.json");
const PRERENDER_PATH = join(PROJECT, ".next", "prerender-manifest.json");
const OUT = join(PROJECT, "out");

function sortedUnique(values, label) {
  const sorted = [...values].sort();
  const duplicates = sorted.filter((value, index) => value === sorted[index - 1]);
  if (duplicates.length) {
    throw new Error(label + " contains duplicate entries: " + [...new Set(duplicates)].join(", "));
  }
  return sorted;
}

export function expandManifest(manifest) {
  if (manifest?.version !== 1) throw new Error("route manifest version must be 1");
  const localized = manifest.locales.flatMap((locale) =>
    manifest.localizedPaths.map((page) => "/" + locale + (page ? "/" + page : "")),
  );
  return {
    prerenderRoutes: sortedUnique(
      [...manifest.staticRoutes, ...localized, ...manifest.internalRoutes],
      "prerender route list",
    ),
    publicRoutes: sortedUnique([...manifest.staticRoutes, ...localized], "public route list"),
    requiredArtifacts: sortedUnique(manifest.requiredArtifacts, "required artifact list"),
  };
}

export function diffSets(expected, actual) {
  const wanted = new Set(expected);
  const found = new Set(actual);
  return {
    missing: expected.filter((item) => !found.has(item)),
    extra: actual.filter((item) => !wanted.has(item)),
  };
}

function artifactFor(route) {
  if (route === "/") return "out/index.html";
  if (route.endsWith(".txt") || route.endsWith(".xml")) return "out" + route;
  return "out" + route + "/index.html";
}

function routeArtifacts(dir) {
  const found = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "_next") walk(full);
        continue;
      }
      const rel = relative(PROJECT, full).split(sep).join("/");
      if (
        entry.name === "index.html" ||
        rel === "out/404.html" ||
        rel === "out/robots.txt" ||
        rel === "out/sitemap.xml"
      ) {
        found.push(rel);
      }
    }
  };
  walk(dir);
  return sortedUnique(found, "built route artifact list");
}

function failDiff(label, diff) {
  if (!diff.missing.length && !diff.extra.length) return;
  const lines = [label + " does not match config/route-manifest.json."];
  if (diff.missing.length) lines.push("Missing: " + diff.missing.join(", "));
  if (diff.extra.length) lines.push("Unexpected: " + diff.extra.join(", "));
  throw new Error(lines.join("\n"));
}

export function checkRoutes() {
  if (!existsSync(PRERENDER_PATH) || !existsSync(OUT)) {
    throw new Error("build output is missing; run npm run build before npm run routes:check");
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const expected = expandManifest(manifest);
  const prerender = JSON.parse(readFileSync(PRERENDER_PATH, "utf8"));
  const actualRoutes = sortedUnique(Object.keys(prerender.routes ?? {}), "Next prerender route list");
  failDiff("Next prerender routes", diffSets(expected.prerenderRoutes, actualRoutes));

  const expectedArtifacts = sortedUnique(
    [...expected.publicRoutes.map(artifactFor), ...expected.requiredArtifacts],
    "expected route artifact list",
  );
  failDiff("Static route artifacts", diffSets(expectedArtifacts, routeArtifacts(OUT)));

  console.log(
    "routes: " + expected.publicRoutes.length + " public + " +
    manifest.internalRoutes.length + " internal = " + expected.prerenderRoutes.length + "; " +
    expectedArtifacts.length + " route artifacts verified",
  );
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  try {
    checkRoutes();
  } catch (error) {
    console.error("routes: FAIL — " + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  }
}
