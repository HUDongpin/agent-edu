import assert from "node:assert/strict";
import {
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

type ReleaseCourse = {
  readonly id: string;
  readonly state: string;
};

type ReleaseManifest = {
  readonly courses: readonly ReleaseCourse[];
};

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const COMPONENTS = resolve(ROOT, "components");
const manifest = JSON.parse(
  readFileSync(resolve(ROOT, "config/course-release-manifest.json"), "utf8"),
) as ReleaseManifest;
const publishedIds = new Set(
  manifest.courses.filter((course) => course.state === "published").map((course) => course.id),
);
const nonPublishedIds = new Set(
  manifest.courses.filter((course) => course.state !== "published").map((course) => course.id),
);

const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);
const STYLESHEET_EXTENSIONS = new Set([".css", ".less", ".sass", ".scss"]);

function filesBelow(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...filesBelow(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function importedStylesheets(path: string): string[] {
  const source = readFileSync(path, "utf8");
  const extension = extname(path);
  const pattern = SOURCE_EXTENSIONS.has(extension)
    ? /(?:from\s+|import\s*)["']([^"']+\.(?:css|less|sass|scss))["']/gu
    : /@import\s+(?:url\(\s*)?["']([^"']+\.(?:css|less|sass|scss))["']/gu;
  return [...source.matchAll(pattern)].map((match) => match[1]);
}

function resolveLocalImport(importer: string, specifier: string): string | null {
  if (specifier.startsWith("@/")) return resolve(ROOT, specifier.slice(2));
  if (specifier.startsWith(".")) return resolve(dirname(importer), specifier);
  return null;
}

function courseOwnerForStylesheet(path: string): string | null {
  const fromComponents = relative(COMPONENTS, path);
  if (
    fromComponents === ""
    || fromComponents === ".."
    || fromComponents.startsWith(`..${sep}`)
  ) return null;
  return fromComponents.split(sep)[0] ?? null;
}

test("stylesheet ownership resolves every canonical non-published state fail closed", () => {
  assert.ok(publishedIds.size > 0, "canonical release manifest must name published courses");
  assert.ok(nonPublishedIds.size > 0, "canonical release manifest must name non-published courses");

  const importer = resolve(COMPONENTS, "github/CourseDashboard.tsx");
  for (const courseId of nonPublishedIds) {
    const target = resolveLocalImport(
      importer,
      `@/components/${courseId}/Course.module.css`,
    );
    assert.ok(target);
    assert.equal(courseOwnerForStylesheet(target), courseId);
  }
});

test("published course components do not import non-published course stylesheets", () => {
  const violations: string[] = [];
  let scannedPublishedDirectories = 0;

  for (const courseId of [...publishedIds].sort()) {
    const directory = resolve(COMPONENTS, courseId);
    try {
      if (!statSync(directory).isDirectory()) continue;
    } catch {
      continue;
    }
    scannedPublishedDirectories += 1;

    for (const path of filesBelow(directory)) {
      const extension = extname(path);
      if (!SOURCE_EXTENSIONS.has(extension) && !STYLESHEET_EXTENSIONS.has(extension)) continue;
      for (const specifier of importedStylesheets(path)) {
        const target = resolveLocalImport(path, specifier);
        if (!target) continue;
        const targetOwner = courseOwnerForStylesheet(target);
        if (!targetOwner || !nonPublishedIds.has(targetOwner)) continue;
        violations.push(
          `${relative(ROOT, path).split(sep).join("/")} imports ${specifier} `
          + `(canonical state for ${targetOwner} is not published)`,
        );
      }
    }
  }

  assert.ok(scannedPublishedDirectories > 0, "no published course component directories were scanned");
  assert.deepEqual(violations, []);
});

test("the GitHub-owned foundation defines every base class that GitHub renders", () => {
  const githubDirectory = resolve(COMPONENTS, "github");
  const referenced = new Set<string>();
  for (const path of filesBelow(githubDirectory)) {
    if (!SOURCE_EXTENSIONS.has(extname(path))) continue;
    const source = readFileSync(path, "utf8");
    for (const match of source.matchAll(/\bbase\.([A-Za-z0-9_]+)/gu)) referenced.add(match[1]);
  }

  const foundation = readFileSync(
    resolve(githubDirectory, "GithubCourseFoundation.module.css"),
    "utf8",
  );
  const defined = new Set(
    [...foundation.matchAll(/\.([_a-zA-Z]+[\w-]*)/gu)].map((match) => match[1]),
  );
  assert.ok(referenced.size > 0, "GitHub base style references unexpectedly disappeared");
  assert.deepEqual([...referenced].filter((name) => !defined.has(name)).sort(), []);
});
