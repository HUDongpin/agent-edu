import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { LOCALE_CODES, LOCALES, coverage, isLocale, metaFor, translator } from "../lib/i18n";
import { PAGES, alternatesFor, urlFor } from "../lib/seo";
import { contentLocalesForPage, releaseSurfaceForPage } from "../lib/release-surface";
import {
  assertAlternateContract,
  collectJsonLdUrls,
  expandManifest,
  internalPagePath,
} from "../scripts/check-routes.mjs";
import { expectedSitemapUrlCount } from "../scripts/generate-sitemaps.mjs";
import { contentFindings, pathFindings } from "../scripts/check-secrets.mjs";
import { vercelReleaseBuildCommandErrors } from "../scripts/lib/published-release-contract.mjs";

test("the locale contract is nine unique languages with Arabic as the only RTL locale", () => {
  assert.equal(LOCALE_CODES.length, 9);
  assert.equal(new Set(LOCALE_CODES).size, 9);
  assert.equal(metaFor("ar").dir, "rtl");
  assert.deepEqual(LOCALES.filter((locale) => locale.dir === "rtl").map((locale) => locale.code), ["ar"]);
  assert.equal(isLocale("zh-Hant"), true);
  assert.equal(isLocale("xx"), false);
});

test("translation helpers preserve fallback and coverage boundaries", () => {
  assert.equal(translator({ hello: "Bonjour" })("hello"), "Bonjour");
  assert.equal(translator({})("missing.key"), "missing.key");
  assert.equal(coverage({ a: "A" }, { a: "A", b: "B", "brand.name": "Agent Edu" }), 50);
});

test("the shell locale loader cannot enumerate nested blocked-course dictionaries", () => {
  const source = readFileSync("lib/i18n.ts", "utf8");
  for (const locale of LOCALE_CODES) {
    assert.ok(source.includes(`messages/${locale}.json`));
  }
  assert.doesNotMatch(source, /import\(`@\/messages\/\$\{locale\}\.json`\)/);
});

test("every page has reciprocal truthful-language SEO alternates and x-default", () => {
  for (const page of PAGES) {
    const locales = contentLocalesForPage(page);
    const requestedLocale = locales.includes("fr") ? "fr" : "fr";
    const canonicalLocale = locales.includes(requestedLocale)
      ? requestedLocale
      : releaseSurfaceForPage(page)?.primaryLocale ?? "en";
    const alternates = alternatesFor(requestedLocale, page);
    assert.equal(alternates.canonical, urlFor(canonicalLocale, page));
    assert.equal(Object.keys(alternates.languages).length, locales.length + 1);
    for (const locale of locales) {
      assert.equal(alternates.languages[locale], urlFor(locale, page));
    }
    assert.equal(alternates.languages["x-default"], urlFor("en", page));
  }
});

test("the committed route manifest expands to the build-page route set", () => {
  const manifest = JSON.parse(readFileSync("config/route-manifest.json", "utf8"));
  const releaseSurface = JSON.parse(
    readFileSync("config/course-release-surface.json", "utf8"),
  );
  const expanded = expandManifest(manifest, releaseSurface);
  const localizedRouteCount = expectedSitemapUrlCount(releaseSurface);
  const expectedPublicCount = manifest.staticRoutes.length + localizedRouteCount;
  const expectedPrerenderCount = expectedPublicCount + manifest.internalRoutes.length;
  assert.equal(expanded.publicRoutes.length, expectedPublicCount);
  assert.equal(expanded.prerenderRoutes.length, expectedPrerenderCount);
  assert.equal(new Set(expanded.prerenderRoutes).size, expectedPrerenderCount);
  assert.deepEqual(expanded.requiredArtifactText["out/404.html"], [
    'lang="und"',
    "Página no encontrada",
    "/ar/courses/",
  ]);
  assert.ok(expanded.requiredArtifactText["out/en/build/index.html"].includes("course/progress.json"));
  assert.deepEqual(expanded.requiredArtifactText["out/teacher-pack.txt"], [
    "20 generator + up to 8 judge = 28 calls",
    "Never share the teacher key",
    "npm run course:offline",
    "replace the empty QUESTION string",
    "Projection cues",
    "Reference-answer boundary",
    "Project rubric",
  ]);
});

test("public route consumers are normalized without query/hash and JSON-LD URLs stay inspectable", () => {
  assert.equal(
    internalPagePath("/en/prompts/?fromLocale=ar#lesson"),
    "/en/prompts",
  );
  assert.equal(internalPagePath("https://example.com/course/"), null);
  assert.equal(internalPagePath("/media/course-card.webp"), null);
  const alternateContract = {
    page: "rag/",
    contentLocales: ["en", "ar"],
    primaryLocale: "en",
  };
  assert.doesNotThrow(() => assertAlternateContract([
    { hreflang: "en", href: "https://aicourse.top/en/rag/" },
    { hreflang: "ar", href: "https://aicourse.top/ar/rag/" },
    { hreflang: "x-default", href: "https://aicourse.top/en/rag/" },
  ], alternateContract, "fixture"));
  assert.throws(() => assertAlternateContract([
    { hreflang: "en", href: "https://aicourse.top/en/rag/" },
    { hreflang: "ar", href: "https://aicourse.top/ar/rag/" },
    { hreflang: "x-default", href: "https://aicourse.top/ar/rag/" },
  ], alternateContract, "fixture"), /x-default mismatch/);
  assert.deepEqual(
    collectJsonLdUrls({
      "@id": "https://aicourse.top/#org",
      hasPart: [
        { url: "https://aicourse.top/en/rag/" },
        { item: { url: "https://aicourse.top/en/rag/choose-rag/" } },
      ],
      mainEntity: { item: "https://aicourse.top/en/courses/" },
    }),
    [
      "https://aicourse.top/#org",
      "https://aicourse.top/en/rag/",
      "https://aicourse.top/en/rag/choose-rag/",
      "https://aicourse.top/en/courses/",
    ],
  );
  const source = readFileSync("scripts/check-routes.mjs", "utf8");
  assert.match(source, /auditPublicConsumers\(releaseSurface, expected\.publicRoutes\)/);
  assert.match(source, /auditHtmlSeo\(contracts, releaseSurface, expected\.publicRoutes\)/);
  assert.match(source, /assertAlternateContract\(\s*entry\.alternates/);
  assert.match(source, /does not expose every published course dashboard/);
  assert.match(source, /JSON-LD names an undeclared public route/);
  assert.doesNotMatch(readFileSync("scripts/generate-sitemaps.mjs", "utf8"), /\b732\b/);
});

test("tracked-file secret rules fail closed without echoing matched values", () => {
  assert.deepEqual(pathFindings("notes/private.env"), ["environment-file"]);
  assert.ok(pathFindings("All API Keys.docx").includes("sensitive-extension"));
  const privateKey = ["-----BEGIN ", "PRIVATE KEY-----"].join("");
  const providerKey = ["sk", "-", "A".repeat(28)].join("");
  assert.equal(contentFindings(privateKey).at(0)?.id, "private-key");
  assert.equal(contentFindings(providerKey).at(0)?.id, "deepseek-key");
  assert.deepEqual(contentFindings("Authorization: " + "Bearer $" + "{key}"), []);
});

test("the secret scanner covers untracked release candidates and tolerates staged deletions", () => {
  const source = readFileSync("scripts/check-secrets.mjs", "utf8");
  const inventory = readFileSync("scripts/lib/source-inventory.mjs", "utf8");
  assert.match(inventory, /"--cached", "--others", "--exclude-standard"/);
  assert.match(inventory, /mode: "uploaded-source"/);
  assert.match(source, /sourceInventory\(\{ root \}\)/);
  assert.match(source, /!info\.isFile\(\) \|\| info\.isSymbolicLink\(\)/);
});

test("the Vercel upload keeps the secret scanner required by build:release", () => {
  const vercelIgnore = readFileSync(".vercelignore", "utf8");
  assert.match(vercelIgnore, /\*secret\*\n!scripts\/check-secrets\.mjs\n/);
  assert.doesNotMatch(vercelIgnore, /^course\/$/m);
  assert.match(vercelIgnore, /^\/output\/$/m);
  for (const privateRuntimePath of [
    "/course/cafe/fixtures.*.json",
    "/course/progress.json",
    "/legacy/course-python/cafe/fixtures.*.json",
  ]) {
    assert.ok(
      vercelIgnore.split("\n").includes(privateRuntimePath),
      `${privateRuntimePath} must be excluded before the Vercel upload`,
    );
  }
  for (const generatedPrivatePath of [
    "/browser-evidence/",
    "/.playwright-raw/",
    "/.playwright-private/",
    "/.playwright-evidence-contract-safe/",
    "/.playwright-evidence-contract-private/",
    "/course_review_2026-08-23/",
  ]) {
    assert.match(vercelIgnore, new RegExp(`^${generatedPrivatePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m"));
  }
  assert.match(vercelIgnore, /^\/examples\/$/m);
  assert.doesNotMatch(vercelIgnore, /^\/tests\/$/m);
  for (const requiredReleaseFixture of [
    "tests/fixtures/codex-course-demo/package.json",
    "tests/fixtures/cursor-course-demo/package.json",
    "tests/fixtures/mcp-courseops/package.json",
  ]) {
    assert.ok(
      existsSync(requiredReleaseFixture),
      `${requiredReleaseFixture} must remain in the Vercel source upload for build:release`,
    );
  }
});

test("the Vercel release command gate survives config normalization and fails closed", () => {
  assert.deepEqual(
    vercelReleaseBuildCommandErrors('{"outputDirectory":"out","buildCommand":"npm run build:release"}'),
    [],
  );
  assert.deepEqual(
    vercelReleaseBuildCommandErrors('{"buildCommand":"npm run build"}'),
    ["vercel.json: production builds must use the release-gated build command"],
  );
  assert.match(vercelReleaseBuildCommandErrors("not-json")[0], /^vercel\.json: invalid JSON/);

  const i18nAudit = readFileSync("scripts/check-i18n-release.mjs", "utf8");
  assert.match(i18nAudit, /stdio:\s*\["ignore", "pipe", "ignore"\]/);
});

test("the protected Preview verifier uses one branch-bound short-lived OIDC identity", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  const verifier = readFileSync("scripts/verify-vercel-preview.mjs", "utf8");
  assert.equal(workflow.match(/id-token:\s*write/g)?.length, 1);
  assert.match(
    workflow,
    /preview-verification:[\s\S]*?permissions:[\s\S]*?id-token:\s*write/,
  );
  assert.match(
    workflow,
    /actions\/github-script@ed597411d8f924073f98dfc5c65a23a2325f34cd # v8/,
  );
  assert.match(
    workflow,
    /core\.getIDToken\('https:\/\/vercel\.com\/HUDongpin\/agent-edu\/preview-verifier'\)/,
  );
  assert.match(
    workflow,
    /VERCEL_TRUSTED_OIDC_TOKEN:\s*\$\{\{ steps\.vercel_oidc\.outputs\.token \}\}/,
  );
  assert.match(verifier, /x-vercel-trusted-oidc-idp-token/);
  assert.doesNotMatch(workflow, /VERCEL_AUTOMATION_BYPASS_SECRET/);
  assert.doesNotMatch(verifier, /x-vercel-protection-bypass/);
});

test("the Agentic release gate is independently closed over Handbook, Lab, content and static resources", () => {
  const source = readFileSync("scripts/check-agentic-course.mjs", "utf8");
  for (const requiredContract of [
    "scripts/extract-handbook.mjs",
    "scripts/check-handbook-i18n.mjs",
    "scripts/check-widgets.mjs",
    "scripts/check-styles.mjs",
    "scripts/check-media-optimization.mjs",
    "tests/course-truth.test.ts",
    "tests/handbook-copy.test.ts",
    "tests/handbook-p0.test.ts",
    "tests/lab-draft.test.ts",
    "tests/lab-integration.test.ts",
    "tests/lab-rules.test.ts",
    "tests/lab-runner.test.ts",
    "tests/lab-vitals.test.ts",
    "tests/progress.test.ts",
  ]) {
    assert.ok(source.includes(requiredContract), `${requiredContract} must belong to the Agentic gate`);
  }
});

test("the deploy build type-checks only files present in the Vercel upload", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(
    packageJson.scripts.typecheck,
    "tsc -p tsconfig.json --noEmit --incremental false",
  );

  const rootTypecheckConfig = JSON.parse(readFileSync("tsconfig.json", "utf8"));
  assert.ok(rootTypecheckConfig.exclude.includes("tests/fixtures/**"));

  const buildConfig = JSON.parse(readFileSync("tsconfig.build.json", "utf8"));
  assert.equal(buildConfig.extends, "./tsconfig.json");
  assert.deepEqual(buildConfig.exclude, ["node_modules"]);
  assert.ok(buildConfig.include.includes("app/**/*.tsx"));
  assert.ok(buildConfig.include.includes("components/**/*.tsx"));
  assert.ok(buildConfig.include.includes("lib/**/*.ts"));
  assert.equal(buildConfig.include.some((entry: string) => entry.startsWith("tests/")), false);
  assert.equal(buildConfig.include.some((entry: string) => entry.startsWith("course/")), false);

  const nextConfig = readFileSync("next.config.ts", "utf8");
  assert.match(nextConfig, /tsconfigPath:\s*isBuild\s*\?\s*"tsconfig\.build\.json"\s*:\s*"tsconfig\.json"/);

  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  assert.match(workflow, /quality:[\s\S]*?- run: npm run build:release/);
  assert.match(packageJson.scripts["verify:source"], /npm run typecheck/);
  assert.match(packageJson.scripts["build:release"], /npm run verify:source/);
  assert.match(
    packageJson.scripts["build:release"],
    /npm run sitemaps:generate[\s\S]*npm run i18n:check:release[\s\S]*npm run routes:check/,
  );
  assert.equal(
    packageJson.scripts["i18n:check:release"],
    "node scripts/check-i18n-release.mjs --release --post-build",
  );
  assert.equal(packageJson.engines.node, ">=24 <25");
  assert.equal(packageJson.packageManager, "npm@11.12.1");
  assert.match(workflow, /hashFiles\([^\n]*'tsconfig\.json', 'tsconfig\.build\.json'\)/);
});

test("the published-course browser gate uses a closed all-engine spec allowlist", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>;
  };
  const config = readFileSync("tests/published-playwright.config.ts", "utf8");
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  const requiredSpecs = [
    "e2e/published-courses.spec.ts",
    "e2e/published-course-contracts.spec.ts",
    "tests/ai-tutor-course.spec.ts",
    "tests/claude-income-course.spec.ts",
    "tests/github-course.spec.ts",
    "tests/grok-course.spec.ts",
    "tests/mcp-course.spec.ts",
    "tests/prompts-course.spec.ts",
    "tests/rag-course.spec.ts",
    "tests/software-engineering-course.spec.ts",
  ];

  for (const spec of requiredSpecs) assert.ok(config.includes(`"${spec}"`), spec);
  for (const blockedSpec of [
    "tests/codex-course.spec.ts",
    "tests/claude-course.spec.ts",
    "tests/cursor-course.spec.ts",
  ]) {
    assert.equal(config.includes(`"${blockedSpec}"`), false, blockedSpec);
  }
  for (const engine of ["chromium", "firefox", "webkit"]) {
    assert.match(config, new RegExp(`name: "${engine}"`));
  }
  assert.match(config, /screenshot: "off"/);
  assert.match(config, /trace: "off"/);
  assert.match(config, /video: "off"/);
  assert.match(config, /outputDir: "\.\.\/\.playwright-raw"/);
  assert.match(config, /preserveOutput: "never"/);
  assert.equal(
    packageJson.scripts["test:published-courses"],
    "npm run evidence:prepare && PLAYWRIGHT_NO_COPY_PROMPT=1 playwright test --config tests/published-playwright.config.ts",
  );
  assert.match(
    workflow,
    /published-courses:[\s\S]*?playwright install --with-deps chromium firefox webkit[\s\S]*?run: npm run test:published-courses/,
  );
});
