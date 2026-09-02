import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CREATOR_OPS_COURSE_MANIFEST } from "../staging/course-src/creator-ops/lib/manifest.ts";
import { CREATOR_OPS_TRANSLATED_LOCALES } from "../staging/course-src/creator-ops/lib/load.ts";
import { validateCreatorOpsCourse } from "../staging/course-src/creator-ops/lib/validate.ts";
import { assertReleaseArtifactsCurrent } from "./sync-course-public-surface.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const STAGED_ROUTE_ROOT = resolve(ROOT, "app/[locale]/_staged/creator-ops");
const STAGED_SOURCE_ROOT = resolve(ROOT, "staging/course-src/creator-ops");
const STAGED_ASSET_ROOT = resolve(ROOT, "staging/course-assets/creator-ops");
const PUBLIC_ROUTE_ROOT = resolve(ROOT, "app/[locale]/creator-ops");
const PUBLIC_ASSET_ROOT = resolve(ROOT, "public/courses/creator-ops");

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function requireTokens(path, tokens) {
  const source = readFileSync(path, "utf8");
  const relativePath = path.slice(ROOT.length + 1);
  for (const token of tokens) {
    invariant(
      source.includes(token),
      `${relativePath} is missing the mapped Course 16 UX contract token: ${token}`,
    );
  }
  return source;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function verifyStagedAssetManifest() {
  const labRoot = resolve(STAGED_ASSET_ROOT, "lab");
  const lines = readFileSync(resolve(labRoot, "manifest.sha256"), "utf8")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
  invariant(lines.length > 0, "creator-ops staged asset manifest must not be empty");
  for (const line of lines) {
    const match = /^([a-f0-9]{64})  ([A-Za-z0-9./-]+)$/u.exec(line);
    invariant(match, `invalid staged asset manifest entry: ${line}`);
    const [, expected, relativePath] = match;
    const absolutePath = resolve(labRoot, relativePath);
    invariant(
      absolutePath.startsWith(`${labRoot}/`) && existsSync(absolutePath),
      `missing staged creator-ops asset: ${relativePath}`,
    );
    invariant(
      sha256(absolutePath) === expected,
      `staged creator-ops asset hash mismatch: ${relativePath}`,
    );
  }
}

function verifyMappedUiUxContract() {
  requireTokens(resolve(STAGED_SOURCE_ROOT, "components/CourseDashboard.tsx"), [
    "CourseFragmentFocusManager",
    "CoursePrimaryAction",
    "splitCourseTitle",
    "courseJumpNav",
    'id="curriculum" tabIndex={-1}',
    'id="capstone" tabIndex={-1}',
    'id="source-atlas" tabIndex={-1}',
    "moduleLinks={navigationItems}",
    "course.manifest.authoredOn",
  ]);
  requireTokens(resolve(STAGED_SOURCE_ROOT, "components/Interactions.tsx"), [
    "nextCreatorOpsStep",
    "export function CoursePrimaryAction",
    "export function ModuleNavigator",
    "aria-busy={!ready}",
    'name={draftId}',
    'autoComplete="off"',
    "checkpointPassedEarlier",
    "assessmentEarlierPass",
    "creator-ops-question-feedback",
  ]);
  requireTokens(resolve(STAGED_SOURCE_ROOT, "components/ModuleView.tsx"), [
    "catalogLabel: string",
    "<ModuleNavigator",
    "LAB_RESOURCE_LABELS",
    "moduleContents",
    "lessonPager",
    'translate="no"',
  ]);
  requireTokens(resolve(STAGED_SOURCE_ROOT, "components/CreatorOpsCourse.module.css"), [
    "color-scheme: light",
    ':global(:root[data-theme="dark"]) .root',
    ".courseJumpNav",
    ".progressModules",
    ".moduleNavigator",
    ".moduleContents",
    ".lessonPager",
    "min-height: 44px",
    "@media (prefers-reduced-motion: reduce)",
    "@media print",
  ]);
  requireTokens(resolve(STAGED_SOURCE_ROOT, "lib/progress.ts"), [
    'CREATOR_OPS_PROGRESS_VERSION = "1.0.2:progress-v1"',
    "isCompatibleCreatorOpsProgressVersion",
    "export function nextCreatorOpsStep",
  ]);
  for (const locale of ["en", "zh-Hans"]) {
    const copy = requireTokens(resolve(STAGED_SOURCE_ROOT, `lib/copy/${locale}.ts`), [
      "courseNavigation",
      "onThisPage",
      "progressLoading",
      "checkpointPassedEarlier",
      "assessmentEarlierPass",
      "reviewCourse",
    ]);
    invariant(
      !/[—–]/u.test(copy),
      `staging/course-src/creator-ops/lib/copy/${locale}.ts must use sentence punctuation instead of em/en dashes`,
    );
  }
  requireTokens(resolve(STAGED_ROUTE_ROOT, "[module]/page.tsx"), [
    'catalogLabel={t("nav.courses")}',
  ]);
}

export function checkCreatorOpsStaged() {
  const releaseArtifacts = assertReleaseArtifactsCurrent({ projectRoot: ROOT });
  const releaseRecord = releaseArtifacts.manifest.courses.find(
    (course) => course.id === "creator-ops",
  );
  invariant(releaseRecord?.state === "staged", "canonical creator-ops state must be staged");
  invariant(
    JSON.stringify(releaseRecord.interfaceLocales) === JSON.stringify(releaseArtifacts.manifest.siteLocales),
    "canonical creator-ops interfaceLocales must cover all site locales",
  );
  invariant(
    JSON.stringify(releaseRecord.reviewedContentLocales) === JSON.stringify(["en", "zh-Hans"]),
    "canonical creator-ops reviewedContentLocales must be en and zh-Hans",
  );
  invariant(releaseRecord.fallbackLocale === "en", "canonical creator-ops fallbackLocale must be en");
  invariant(releaseRecord.progress === null, "canonical creator-ops progress must remain null");
  invariant(
    releaseRecord.releaseGate === "npm run creator-ops:check:staged",
    "canonical creator-ops gate must run the staged checker",
  );
  invariant(
    JSON.stringify(releaseRecord.routes) === JSON.stringify([
      "creator-ops/",
      ...CREATOR_OPS_COURSE_MANIFEST.modules.map((module) => `creator-ops/${module.slug}/`),
    ]),
    "canonical creator-ops routes must match the staged course modules",
  );
  const validation = validateCreatorOpsCourse();
  invariant(validation.errors.length === 0, validation.errors.join("\n"));
  invariant(
    CREATOR_OPS_COURSE_MANIFEST.releaseState === "staged",
    "creator-ops internal manifest must remain staged",
  );
  invariant(
    /^\d{4}-\d{2}-\d{2}$/u.test(CREATOR_OPS_COURSE_MANIFEST.authoredOn),
    "creator-ops authoredOn must be YYYY-MM-DD",
  );
  invariant(
    JSON.stringify(CREATOR_OPS_TRANSLATED_LOCALES) === JSON.stringify(["en", "zh-Hans"]),
    "creator-ops reviewed content locales must remain en and zh-Hans",
  );
  invariant(existsSync(resolve(STAGED_ROUTE_ROOT, "page.tsx")), "staged dashboard is missing");
  invariant(
    existsSync(resolve(STAGED_ROUTE_ROOT, "[module]/page.tsx")),
    "staged module route is missing",
  );
  invariant(existsSync(STAGED_ASSET_ROOT), "staged creator-ops assets are missing");
  invariant(existsSync(resolve(STAGED_SOURCE_ROOT, "lib/index.ts")), "staged course library is missing");
  invariant(
    existsSync(resolve(STAGED_SOURCE_ROOT, "components/CourseDashboard.tsx")),
    "staged course components are missing",
  );
  invariant(!existsSync(PUBLIC_ROUTE_ROOT), "creator-ops must not expose a public route");
  invariant(!existsSync(PUBLIC_ASSET_ROOT), "creator-ops must not expose public static assets");

  const seoSource = readFileSync(resolve(ROOT, "lib/seo.ts"), "utf8");
  const sitemapSource = readFileSync(resolve(ROOT, "app/sitemap.ts"), "utf8");
  invariant(!seoSource.includes('"creator-ops/"'), "SEO projection must exclude creator-ops");
  invariant(!sitemapSource.includes("creator-ops"), "sitemap source must exclude creator-ops");
  verifyStagedAssetManifest();
  verifyMappedUiUxContract();

  return {
    state: CREATOR_OPS_COURSE_MANIFEST.releaseState,
    reviewedContentLocales: CREATOR_OPS_TRANSLATED_LOCALES,
    modules: CREATOR_OPS_COURSE_MANIFEST.modules.length,
    publicRoutes: 0,
    publicAssets: 0,
    uiUxContract: "mapped",
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = checkCreatorOpsStaged();
    console.log(
      `creator-ops staged: PASS — ${result.modules} modules, `
      + `${result.reviewedContentLocales.join("+")}, 0 public routes, 0 public assets`,
    );
  } catch (error) {
    console.error(
      `creator-ops staged: FAIL — ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
