import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";

export const MANIFEST_RELATIVE_PATH = "config/course-release-manifest.json";
export const RELEASE_SURFACE_RELATIVE_PATH = "config/course-release-surface.json";
export const PUBLIC_SURFACE_RELATIVE_PATH = "config/course-public-surface.json";

export const SITE_LOCALES = [
  "en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar",
];

/**
 * The executable half of the one-iteration intake freeze. Comparing manifest
 * state only to a manifest-owned allowlist would let one change alter both and
 * silently admit a new public course.
 */
export const FROZEN_PUBLISHED_COURSE_IDS = [
  "agentic",
  "grok",
  "github",
  "prompts",
  "software-engineering",
  "rag",
  "mcp",
  "make-money-with-codex",
  "claude-income",
  "ai-tutor",
  "product-management",
  "agent-orchestration",
];

export const FROZEN_BLOCKED_COURSE_IDS = [
  "codex",
  "claude",
  "cursor",
  "responsible-ai",
  "agentic-quant-trading",
  "ai-teaching",
  "math-animation",
];

export const FROZEN_ROADMAP_COURSE_IDS = ["ai-research"];

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertStringArray(value, label) {
  invariant(Array.isArray(value), `${label} must be an array`);
  invariant(value.every((item) => typeof item === "string"), `${label} must contain strings`);
  invariant(new Set(value).size === value.length, `${label} must be unique`);
}

function assertExactArray(actual, expected, label) {
  assertStringArray(actual, label);
  invariant(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label} must exactly equal ${expected.join(", ")}`,
  );
}

function assertExactSet(actual, expected, label) {
  assertStringArray(actual, label);
  invariant(
    JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort()),
    `${label} must exactly equal ${expected.join(", ")}`,
  );
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function manifestSource(manifestText) {
  return { path: MANIFEST_RELATIVE_PATH, sha256: sha256(manifestText) };
}

function assertGateExists(command, packageJson, projectRoot, label) {
  invariant(typeof command === "string" && command.trim(), `${label} must be a command`);
  const npmGate = /^npm run ([a-z0-9:-]+)$/.exec(command);
  if (npmGate) {
    invariant(
      typeof packageJson?.scripts?.[npmGate[1]] === "string",
      `${label} names missing package script ${npmGate[1]}`,
    );
    return;
  }
  const nodeGate = /^node(?: --import tsx)? (scripts\/[a-z0-9-]+\.mjs)(?: --release)?$/.exec(command);
  invariant(nodeGate, `${label} has unsupported command shape: ${command}`);
  invariant(existsSync(resolve(projectRoot, nodeGate[1])), `${label} file is missing: ${nodeGate[1]}`);
}

function assertLanguageContract(record, siteLocales, label, { allowEmpty = false } = {}) {
  assertExactArray(record.interfaceLocales, siteLocales, `${label}.interfaceLocales`);
  assertStringArray(record.reviewedContentLocales, `${label}.reviewedContentLocales`);
  invariant(
    record.reviewedContentLocales.every((locale) => record.interfaceLocales.includes(locale)),
    `${label}.reviewedContentLocales must be a subset of interfaceLocales`,
  );
  if (allowEmpty && record.reviewedContentLocales.length === 0) {
    invariant(record.fallbackLocale === null, `${label}.fallbackLocale must be null without reviewed content`);
    return;
  }
  invariant(record.reviewedContentLocales.length > 0, `${label} must declare reviewed content`);
  invariant(
    typeof record.fallbackLocale === "string"
      && record.reviewedContentLocales.includes(record.fallbackLocale),
    `${label}.fallbackLocale must be one of reviewedContentLocales`,
  );
}

export function validateCourseReleaseManifest(manifest, options = {}) {
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const packageJson = options.packageJson ?? readJson(resolve(projectRoot, "package.json"));
  invariant(isRecord(manifest), "course release manifest must be an object");
  invariant(manifest.schemaVersion === 3, "course release manifest schemaVersion must be 3");
  invariant(
    manifest.manifestKind === "course-release-manifest",
    "course release manifestKind must be course-release-manifest",
  );
  assertExactArray(manifest.siteLocales, SITE_LOCALES, "siteLocales");
  invariant(isRecord(manifest.intakeFreeze), "intakeFreeze is required");
  invariant(
    manifest.intakeFreeze.policy === "fixed-published-allowlist",
    "intakeFreeze.policy must be fixed-published-allowlist",
  );
  invariant(
    manifest.intakeFreeze.iteration === "platform-release-v1",
    "intakeFreeze.iteration must be platform-release-v1",
  );
  assertExactArray(
    manifest.intakeFreeze.publishedCourseIds,
    FROZEN_PUBLISHED_COURSE_IDS,
    "intakeFreeze.publishedCourseIds",
  );
  invariant(isRecord(manifest.core), "core release contract is required");
  assertLanguageContract(manifest.core, manifest.siteLocales, "core");
  assertStringArray(manifest.core.routes, "core.routes");
  invariant(Array.isArray(manifest.courses), "courses must be an array");

  const ids = manifest.courses.map((course) => course?.id);
  assertStringArray(ids, "course ids");
  const published = manifest.courses.filter((course) => course.state === "published");
  const blocked = manifest.courses.filter((course) => course.state === "blocked");
  const staged = manifest.courses.filter((course) => course.state === "staged");
  const roadmap = manifest.courses.filter((course) => course.state === "roadmap");
  invariant(published.length === 12, "manifest must contain exactly 12 published courses");
  invariant(
    blocked.length === FROZEN_BLOCKED_COURSE_IDS.length,
    `manifest must contain exactly ${FROZEN_BLOCKED_COURSE_IDS.length} blocked courses`,
  );
  invariant(staged.length === 1, "manifest must contain exactly 1 staged course");
  invariant(
    roadmap.length === FROZEN_ROADMAP_COURSE_IDS.length,
    `manifest must contain exactly ${FROZEN_ROADMAP_COURSE_IDS.length} roadmap courses`,
  );
  invariant(
    published.length + blocked.length + staged.length + roadmap.length === manifest.courses.length,
    "every course must be published, blocked, staged, or roadmap",
  );
  assertExactSet(
    published.map((course) => course.id),
    FROZEN_PUBLISHED_COURSE_IDS,
    "published course ids",
  );
  assertExactSet(
    blocked.map((course) => course.id),
    FROZEN_BLOCKED_COURSE_IDS,
    "blocked course ids",
  );
  assertExactSet(
    roadmap.map((course) => course.id),
    FROZEN_ROADMAP_COURSE_IDS,
    "roadmap course ids",
  );

  const allRoutes = [...manifest.core.routes];
  for (const [index, course] of manifest.courses.entries()) {
    const label = `courses[${index}] (${String(course?.id)})`;
    invariant(isRecord(course), `${label} must be an object`);
    invariant(
      ["published", "blocked", "staged", "roadmap"].includes(course.state),
      `${label}.state is invalid`,
    );
    invariant(typeof course.titleKey === "string" && course.titleKey, `${label}.titleKey is required`);
    assertLanguageContract(course, manifest.siteLocales, label, { allowEmpty: course.state === "roadmap" });
    assertStringArray(course.routes, `${label}.routes`);
    invariant(
      course.routes.every((route) => route && !route.startsWith("/") && route.endsWith("/")),
      `${label}.routes must be relative and slash-terminated`,
    );
    if (course.state === "roadmap") {
      invariant(course.href === null, `${label}.href must be null`);
      invariant(course.reviewedContentLocales.length === 0, `${label} cannot claim reviewed content`);
      invariant(course.routes.length === 0, `${label}.routes must be empty`);
      invariant(course.releaseGate === null, `${label}.releaseGate must be null`);
      invariant(course.progress === null, `${label}.progress must be null`);
      continue;
    }

    invariant(typeof course.href === "string", `${label}.href is required`);
    invariant(course.routes.length > 0, `${label}.routes must not be empty`);
    invariant(course.href === `/${course.routes[0]}`, `${label}.href must target the first route`);
    const root = course.routes[0].replace(/\/$/, "");
    invariant(!root.includes("/"), `${label} dashboard route must have one segment`);
    if (course.id === "agentic") {
      assertExactArray(course.routes, ["handbook/", "lab/", "build/"], `${label}.routes`);
    } else {
      invariant(
        course.routes.every((route) => route === `${root}/` || route.startsWith(`${root}/`)),
        `${label}.routes must share the dashboard root`,
      );
    }
    assertGateExists(course.releaseGate, packageJson, projectRoot, `${label}.releaseGate`);
    if (course.state === "staged") {
      invariant(course.progress === null, `${label}.progress must remain null while staged`);
    } else {
      invariant(isRecord(course.progress), `${label}.progress is required`);
      invariant(typeof course.progress.strategy === "string" && course.progress.strategy, `${label}.progress.strategy is required`);
      invariant(typeof course.progress.storageKey === "string" && course.progress.storageKey, `${label}.progress.storageKey is required`);
      invariant(
        course.progress.event === null || typeof course.progress.event === "string",
        `${label}.progress.event must be a string or null`,
      );
    }
    if (course.state === "blocked" || course.state === "staged") {
      assertStringArray(course.blockers, `${label}.blockers`);
      invariant(course.blockers.length > 0, `${label}.blockers must not be empty`);
    }
    allRoutes.push(...course.routes);
  }
  assertStringArray(allRoutes, "localized routes");

  const creator = manifest.courses.find((course) => course.id === "creator-ops");
  invariant(creator?.state === "staged", "creator-ops must remain staged during the intake freeze");
  assertExactArray(creator.interfaceLocales, SITE_LOCALES, "creator-ops.interfaceLocales");
  assertExactArray(
    creator.reviewedContentLocales,
    ["en", "zh-Hans"],
    "creator-ops.reviewedContentLocales",
  );
  invariant(creator.fallbackLocale === "en", "creator-ops.fallbackLocale must be en");
  invariant(creator.progress === null, "creator-ops.progress must be null while staged");
  invariant(creator.routes.length === 11, "creator-ops must declare its dashboard plus 10 future modules");
  invariant(
    creator.releaseGate === "npm run creator-ops:check:staged",
    "creator-ops releaseGate must run the staged checker",
  );
  return { manifest, published, blocked, staged, roadmap };
}

function compatibilityCourseProjection(course) {
  return {
    id: course.id,
    state: course.state,
    href: course.href,
    titleKey: course.titleKey,
    interfaceLocales: course.interfaceLocales,
    reviewedContentLocales: course.reviewedContentLocales,
    fallbackLocale: course.fallbackLocale,
    primaryLocale: course.fallbackLocale,
    contentLocales: course.reviewedContentLocales,
    routes: course.routes,
    releaseGate: course.releaseGate,
    progress: course.progress,
    ...(course.blockers ? { blockers: course.blockers } : {}),
  };
}

function defaultSourceFor(manifest) {
  return manifestSource(`${JSON.stringify(manifest, null, 2)}\n`);
}

export function projectCourseReleaseSurface(manifest, source = defaultSourceFor(manifest)) {
  return {
    schemaVersion: 3,
    manifestKind: "course-release-surface-projection",
    source,
    siteLocales: manifest.siteLocales,
    core: {
      interfaceLocales: manifest.core.interfaceLocales,
      reviewedContentLocales: manifest.core.reviewedContentLocales,
      fallbackLocale: manifest.core.fallbackLocale,
      primaryLocale: manifest.core.fallbackLocale,
      contentLocales: manifest.core.reviewedContentLocales,
      routes: manifest.core.routes,
    },
    courses: manifest.courses.map(compatibilityCourseProjection),
  };
}

export function projectPublicCourseSurface(manifest, source = defaultSourceFor(manifest)) {
  invariant(Array.isArray(manifest?.courses), "release manifest courses are missing");
  return {
    schemaVersion: 3,
    manifestKind: "course-public-surface-projection",
    source,
    siteLocales: manifest.siteLocales,
    courses: manifest.courses
      .filter((course) => course.state !== "staged")
      .map((course) => ({
        id: course.id,
        state: course.state,
        href: course.state === "published" ? course.href : null,
        titleKey: course.titleKey,
        interfaceLocales: course.interfaceLocales,
        reviewedContentLocales: course.reviewedContentLocales,
        fallbackLocale: course.fallbackLocale,
        primaryLocale: course.fallbackLocale,
        contentLocales: course.reviewedContentLocales,
        progressEvent: course.state === "published" ? course.progress?.event ?? null : null,
      })),
  };
}

function generatedHeader() {
  return "// Generated by scripts/sync-course-public-surface.mjs. Do not edit.\n";
}

function publishedDashboardSource(courseId, privateFolder) {
  return `${generatedHeader()}import { courseLocaleParams } from "@/lib/release-surface";

export { default, generateMetadata } from "../${privateFolder}/${courseId}/page";

export const dynamicParams = false;

export function generateStaticParams() {
  return courseLocaleParams("${courseId}");
}
`;
}

function publishedChildSource(courseId, parameter, privateFolder) {
  return `${generatedHeader()}import {
  courseChildParams,
  courseChildRouteValues,
} from "@/lib/release-surface";

export { default, generateMetadata } from "../../${privateFolder}/${courseId}/[${parameter}]/page";

export const dynamicParams = false;

export function generateStaticParams() {
  return courseChildParams(
    "${courseId}",
    "${parameter}",
    courseChildRouteValues("${courseId}"),
  );
}
`;
}

function publishedFixedSource(courseId, pageName, privateFolder) {
  return `${generatedHeader()}import { courseLocaleParams } from "@/lib/release-surface";

export { default, generateMetadata } from "../../${privateFolder}/${courseId}/${pageName}/page";

export const dynamicParams = false;

export function generateStaticParams() {
  return courseLocaleParams("${courseId}");
}
`;
}

function publishedLayoutSource(courseId, privateFolder) {
  return `${generatedHeader()}export { default } from "../${privateFolder}/${courseId}/layout";
`;
}

export function projectAuthoredCourseRouteWrappers(manifest, projectRoot = process.cwd()) {
  invariant(Array.isArray(manifest?.courses), "release manifest courses are missing");
  const appRoot = resolve(projectRoot, "app/[locale]");
  const discovered = new Map();
  for (const privateFolder of ["_blocked", "_staged"]) {
    const implementationRoot = resolve(appRoot, privateFolder);
    if (!existsSync(implementationRoot)) continue;
    for (const entry of readdirSync(implementationRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const courseId = entry.name;
      invariant(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(courseId), `unsafe authored course id: ${courseId}`);
      invariant(!discovered.has(courseId), `${courseId} must have exactly one private implementation root`);
      discovered.set(courseId, privateFolder);
    }
  }

  const wrappers = [];
  for (const [courseId, privateFolder] of discovered) {
    const course = manifest.courses.find((item) => item.id === courseId);
    invariant(course, `authored course is missing from manifest: ${courseId}`);
    invariant(
      privateFolder === "_blocked"
        ? course.state === "blocked" || course.state === "published"
        : course.state === "staged" || course.state === "published",
      `${courseId} has state ${course.state} incompatible with ${privateFolder}`,
    );
    const routeRoot = course.routes?.[0]?.replace(/\/$/, "");
    invariant(routeRoot && !routeRoot.includes("/"), `${courseId} must have a one-segment dashboard route`);
    invariant(routeRoot === courseId, `${courseId} private root must match manifest route root ${routeRoot}`);
    const implementationDirectory = resolve(appRoot, privateFolder, courseId);
    invariant(existsSync(join(implementationDirectory, "page.tsx")), `${courseId} private dashboard is missing`);
    const dynamicEntries = readdirSync(implementationDirectory, { withFileTypes: true })
      .filter((child) => child.isDirectory() && /^\[[^\]]+\]$/.test(child.name));
    invariant(dynamicEntries.length === 1, `${courseId} must have exactly one private dynamic child route`);
    const parameter = dynamicEntries[0].name.slice(1, -1);
    invariant(
      existsSync(join(implementationDirectory, dynamicEntries[0].name, "page.tsx")),
      `${courseId} private child implementation is missing`,
    );
    wrappers.push({
      courseId,
      privateFolder,
      path: resolve(appRoot, routeRoot, "page.tsx"),
      source: course.state === "published"
        ? publishedDashboardSource(courseId, privateFolder)
        : null,
    });
    wrappers.push({
      courseId,
      privateFolder,
      path: resolve(appRoot, routeRoot, `[${parameter}]`, "page.tsx"),
      source: course.state === "published"
        ? publishedChildSource(courseId, parameter, privateFolder)
        : null,
    });
    const fixedEntries = readdirSync(implementationDirectory, { withFileTypes: true })
      .filter((child) => child.isDirectory() && !/^\[[^\]]+\]$/.test(child.name))
      .filter((child) => existsSync(join(implementationDirectory, child.name, "page.tsx")));
    for (const fixedEntry of fixedEntries) {
      invariant(
        course.routes.includes(`${courseId}/${fixedEntry.name}/`),
        `${courseId} private fixed page is absent from manifest routes: ${fixedEntry.name}`,
      );
      wrappers.push({
        courseId,
        privateFolder,
        path: resolve(appRoot, routeRoot, fixedEntry.name, "page.tsx"),
        source: course.state === "published"
          ? publishedFixedSource(courseId, fixedEntry.name, privateFolder)
          : null,
      });
    }
    if (existsSync(join(implementationDirectory, "layout.tsx"))) {
      wrappers.push({
        courseId,
        privateFolder,
        path: resolve(appRoot, routeRoot, "layout.tsx"),
        source: course.state === "published"
          ? publishedLayoutSource(courseId, privateFolder)
          : null,
      });
    }
  }
  return wrappers.sort((left, right) => left.path.localeCompare(right.path));
}

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function syncCourseReleaseArtifacts(options = {}) {
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const manifestPath = resolve(projectRoot, MANIFEST_RELATIVE_PATH);
  invariant(existsSync(manifestPath), "authoritative course release manifest is missing");
  const manifestText = readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(manifestText);
  const packageJson = readJson(resolve(projectRoot, "package.json"));
  validateCourseReleaseManifest(manifest, { projectRoot, packageJson });
  const source = manifestSource(manifestText);
  const projections = [
    {
      path: resolve(projectRoot, RELEASE_SURFACE_RELATIVE_PATH),
      text: serialize(projectCourseReleaseSurface(manifest, source)),
    },
    {
      path: resolve(projectRoot, PUBLIC_SURFACE_RELATIVE_PATH),
      text: serialize(projectPublicCourseSurface(manifest, source)),
    },
  ];
  const wrappers = projectAuthoredCourseRouteWrappers(manifest, projectRoot);
  const staleProjections = projections.filter(({ path, text }) => (
    !existsSync(path) || readFileSync(path, "utf8") !== text
  ));
  const staleWrappers = wrappers.filter(({ path, source: wrapperSource }) => (
    wrapperSource === null
      ? existsSync(path)
      : !existsSync(path) || readFileSync(path, "utf8") !== wrapperSource
  ));
  const changed = staleProjections.length > 0 || staleWrappers.length > 0;
  if (options.check === true) {
    const stale = [
      ...staleProjections.map(({ path }) => path),
      ...staleWrappers.map(({ path }) => path),
    ];
    invariant(!changed, `generated release artifacts are stale: ${stale.join(", ")}`);
  } else {
    for (const { path, text } of staleProjections) writeFileSync(path, text);
    for (const { path, source: wrapperSource } of staleWrappers) {
      if (wrapperSource === null) {
        const existing = readFileSync(path, "utf8");
        invariant(
          existing.startsWith(generatedHeader()),
          `refusing to remove non-generated public route wrapper: ${path}`,
        );
        rmSync(path);
      } else {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, wrapperSource);
      }
    }
  }
  return {
    changed: options.check === true ? false : changed,
    manifest,
    sourceSha256: source.sha256,
    releaseSurface: projectCourseReleaseSurface(manifest, source),
    publicSurface: projectPublicCourseSurface(manifest, source),
    outputPaths: projections.map(({ path }) => path),
    wrapperPaths: wrappers.map(({ path }) => path),
  };
}

/** Every independent release/development/progress/i18n entry point calls this. */
export function assertReleaseArtifactsCurrent(options = {}) {
  return syncCourseReleaseArtifacts({ ...options, check: true });
}
