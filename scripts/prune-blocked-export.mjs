import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

function normalizedRelative(root, absolute) {
  return relative(root, absolute).split(sep).join("/");
}

function filesBelow(root) {
  if (!existsSync(root)) return [];
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) files.push(absolute);
      else throw new Error(`non-regular export entry: ${absolute}`);
    }
  };
  visit(root);
  return files;
}

function loadRegistry(projectRoot) {
  const registryPath = join(projectRoot, "config", "course-release-surface.json");
  if (!existsSync(registryPath)) {
    throw new Error("course release registry is missing");
  }
  const registry = JSON.parse(readFileSync(registryPath, "utf8"));
  if (!Array.isArray(registry.siteLocales) || !Array.isArray(registry.courses)) {
    throw new Error("course release registry has an invalid shape");
  }
  return registry;
}

function routeArtifactCandidates(out, locale, route) {
  const routeWithoutSlash = route.replace(/^\/+|\/+$/g, "");
  const localized = join(out, locale, routeWithoutSlash);
  return [
    localized,
    `${localized}.html`,
    join(localized, "index.html"),
  ];
}

export function pruneBlockedExport(options = {}) {
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const out = join(projectRoot, "out");
  if (!existsSync(out) || !lstatSync(out).isDirectory()) {
    throw new Error("static export is missing; run next build before pruning blocked assets");
  }

  const registry = loadRegistry(projectRoot);
  const blockedCourses = registry.courses
    .filter((course) => course.state === "blocked")
    .sort((left, right) => left.id.localeCompare(right.id));

  const blockedIds = blockedCourses.map((course) => course.id);
  for (const id of blockedIds) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      throw new Error(`unsafe blocked course id: ${id}`);
    }
  }

  const htmlFiles = filesBelow(out).filter((file) => file.endsWith(".html"));
  for (const htmlFile of htmlFiles) {
    const html = readFileSync(htmlFile, "utf8");
    for (const id of blockedIds) {
      if (html.includes(`/courses/${id}/`)) {
        throw new Error(
          `published export references blocked course media: ${normalizedRelative(out, htmlFile)} -> /courses/${id}/`,
        );
      }
    }
  }

  for (const course of blockedCourses) {
    for (const locale of registry.siteLocales) {
      for (const route of course.routes ?? []) {
        for (const candidate of routeArtifactCandidates(out, locale, route)) {
          if (existsSync(candidate)) {
            throw new Error(
              `blocked public route was generated: ${normalizedRelative(out, candidate)}`,
            );
          }
        }
      }
    }
  }

  const coursesRoot = resolve(out, "courses");
  const removed = [];
  const absent = [];
  for (const id of blockedIds) {
    const target = resolve(coursesRoot, id);
    if (!target.startsWith(`${coursesRoot}${sep}`)) {
      throw new Error(`refusing unsafe blocked export target: ${target}`);
    }
    if (!existsSync(target)) {
      absent.push(id);
      continue;
    }
    if (lstatSync(target).isSymbolicLink()) {
      throw new Error(`refusing symlinked blocked export target: ${target}`);
    }
    rmSync(target, { recursive: true, force: false });
    if (existsSync(target)) {
      throw new Error(`blocked export target still exists after pruning: ${target}`);
    }
    removed.push(id);
  }

  const result = {
    schemaVersion: 1,
    blockedCourseIds: blockedIds,
    removed,
    alreadyAbsent: absent,
    scannedHtmlFiles: htmlFiles.length,
    passed: true,
  };
  if (options.emit !== false) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  try {
    pruneBlockedExport();
  } catch (error) {
    console.error(`export:prune-blocked: FAIL — ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
