/**
 * One fail-closed platform release boundary for every currently available course.
 *
 * Course inventory comes from the live TOP_LEVEL_COURSES/CATALOG_COURSES
 * exports. Route expectations come from those manifests, SEO comes from PAGES,
 * and sitemap evidence comes from the actual sitemap function. No page or
 * course count is hard-coded. Course-specific release checkers remain the
 * authority for detailed curriculum, asset-integrity, and publication-rights
 * assertions; this gate proves that each available course has one, runs it, and
 * refuses to treat pending production evidence as green.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { checkReleaseReadiness } from "./check-release-readiness.mjs";
import { checkProgressContract } from "./check-progress-contract.mjs";

const DEFAULT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function gate(status, issues = [], evidence = {}) {
  return { status, issues, ...evidence };
}

function normalisePage(href) {
  return String(href).replace(/^\/+/, "").replace(/#.*$/, "").replace(/\/+$/, "") + "/";
}

function commandScriptPaths(command) {
  return [...String(command).matchAll(/(?:^|\s)([\w./-]+\.(?:mjs|ts))(?:\s|$)/g)]
    .map((match) => match[1]);
}

function countFiles(directory) {
  if (!existsSync(directory)) return 0;
  let count = 0;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) count += countFiles(path);
    else if (entry.isFile()) count += 1;
  }
  return count;
}

function compactOutput(value) {
  const lines = String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("> aicourse-top@"));
  const failures = lines.filter((line) => /(?:FAIL|ERROR|require|missing|pending|blocked|failed)/i.test(line));
  const signal = failures.length
    ? failures
    : lines.filter((line) => /(?:passed|PASS|Passed)/i.test(line));
  return (signal.length ? signal : lines).slice(-8);
}

function checkerProfile(course, scripts, useReleaseCheckers) {
  const releaseExact = `${course.id}:check:release`;
  const localExact = `${course.id}:check`;
  if (typeof scripts[releaseExact] === "string" && scripts[releaseExact].trim()) {
    const executionScript = !useReleaseCheckers
      && typeof scripts[localExact] === "string"
      && scripts[localExact].trim()
      ? localExact
      : releaseExact;
    return {
      scripts: [executionScript],
      releaseScripts: [releaseExact],
      kind: "course",
    };
  }

  // Course 1 is the legacy three-part platform course. Detect it from the live
  // route-shaped manifest rather than from an assumed sequence number.
  const modules = new Set(course.moduleIds || []);
  const isPlatformCourse = String(course.href).includes("#")
    && ["handbook", "lab", "build"].every((module) => modules.has(module));
  if (isPlatformCourse) {
    const composite = ["handbook:check", "widgets:check", "course:offline"]
      .filter((name) => typeof scripts[name] === "string" && scripts[name].trim());
    return {
      scripts: composite,
      releaseScripts: composite,
      kind: "platform-composite",
    };
  }
  return { scripts: [], releaseScripts: [], kind: "missing" };
}

function runRegisteredChecker(profile, projectRoot) {
  if (!profile.scripts.length) {
    return gate("fail", ["no release checker is registered"], { scripts: [] });
  }
  const runs = [];
  for (const script of profile.scripts) {
    const result = spawnSync("npm", ["run", script, "--", "--json"], {
      cwd: projectRoot,
      encoding: "utf8",
      env: { ...process.env, CI: "1", FORCE_COLOR: "0" },
      maxBuffer: 16 * 1024 * 1024,
    });
    const exitCode = typeof result.status === "number" ? result.status : 1;
    runs.push({
      script,
      exitCode,
      summary: compactOutput(`${result.stdout || ""}\n${result.stderr || ""}`),
    });
  }
  const failed = runs.filter((run) => run.exitCode !== 0);
  return gate(
    failed.length ? "fail" : "pass",
    failed.map((run) => `${run.script} exited ${run.exitCode}`),
    { scripts: profile.scripts, kind: profile.kind, runs },
  );
}

function expectedPages(course, catalogRecord) {
  if (String(course.href).includes("#")) {
    return [...new Set((course.moduleIds || []).map((module) => normalisePage(`/${module}/`)))];
  }
  const base = normalisePage(catalogRecord?.href || course.href);
  return [base, ...(course.moduleIds || []).map((module) => `${base}${module}/`)];
}

function routeGate(course, catalogRecord, projectRoot) {
  const issues = [];
  const patterns = [];
  if (String(course.href).includes("#")) {
    for (const moduleId of course.moduleIds || []) {
      const path = `app/[locale]/${moduleId}/page.tsx`;
      patterns.push(path);
      if (!existsSync(join(projectRoot, path))) issues.push(`missing ${path}`);
    }
  } else {
    const base = normalisePage(catalogRecord?.href || course.href).replace(/\/$/, "");
    const dashboard = `app/[locale]/${base}/page.tsx`;
    patterns.push(dashboard);
    if (!existsSync(join(projectRoot, dashboard))) issues.push(`missing ${dashboard}`);
    if ((course.moduleIds || []).length) {
      const directory = join(projectRoot, `app/[locale]/${base}`);
      const dynamicPages = existsSync(directory)
        ? readdirSync(directory, { withFileTypes: true })
          .filter((entry) => entry.isDirectory() && /^\[.+\]$/.test(entry.name))
          .map((entry) => `app/[locale]/${base}/${entry.name}/page.tsx`)
          .filter((path) => existsSync(join(projectRoot, path)))
        : [];
      patterns.push(...dynamicPages);
      if (!dynamicPages.length) issues.push(`missing a dynamic lesson/module page below app/[locale]/${base}`);
    }
  }
  return gate(issues.length ? "fail" : "pass", issues, { patterns });
}

function manifestGate(course, availableCount) {
  const issues = [];
  if (!Number.isInteger(course.displayNumber)
      || course.displayNumber < 1
      || course.displayNumber > availableCount) {
    issues.push("displayNumber is outside the live available-course sequence");
  }
  if (!Number.isFinite(course.durationMinutes) || course.durationMinutes <= 0) {
    issues.push("durationMinutes must be a positive finite number");
  }
  if (course.durationMinutes !== course.minutes) {
    issues.push("durationMinutes and minutes disagree");
  }
  if (!Array.isArray(course.moduleIds) || course.moduleIds.length === 0) {
    issues.push("the normalized release manifest exposes no moduleIds");
  }
  if (new Set(course.moduleIds || []).size !== (course.moduleIds || []).length) {
    issues.push("moduleIds contain duplicates");
  }
  return gate(issues.length ? "fail" : "pass", issues, {
    displayNumber: course.displayNumber,
    durationMinutes: course.durationMinutes,
    moduleCount: course.moduleIds?.length || 0,
  });
}

function catalogGate(course, catalogRecord, coursesPageText) {
  const issues = [];
  if (!catalogRecord) return gate("fail", ["no available CATALOG_COURSES record"]);
  if (catalogRecord.status !== "available") issues.push("catalog record is not available");
  if (!catalogRecord.href || catalogRecord.href === "#") issues.push("available catalog record is not linkable");
  if (!Number.isFinite(catalogRecord.minutes) || catalogRecord.minutes <= 0) {
    issues.push("available catalog record has no positive duration");
  }
  if (catalogRecord.displayNumber !== course.displayNumber) issues.push("catalog displayNumber drift");
  if (typeof catalogRecord.progress !== "function") issues.push("available catalog record has no progress adapter");
  const key = course.id.includes("-") ? `"${course.id}"` : course.id;
  const explicitParts = new RegExp(`${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:`)
    .test(coursesPageText);
  const generatedCourseKitParts = course.displayNumber >= 16
    && course.displayNumber <= 21
    && coursesPageText.includes("COURSE_KIT_DEFINITIONS")
    && coursesPageText.includes("Object.fromEntries(courseKitParts)");
  if (!explicitParts && !generatedCourseKitParts) {
    issues.push("catalog JSON-LD partsByCourse has no entry");
  }
  return gate(issues.length ? "fail" : "pass", issues, {
    href: catalogRecord.href,
    minutes: catalogRecord.minutes,
  });
}

function progressGate(course, catalogRecord, progressResult, storeDirs) {
  const issues = progressResult.issues
    .filter((item) => item.courseId === course.id)
    .map((item) => `${item.code}: ${item.message}`);
  if (typeof course.progress === "function" && !course.progressEvent) {
    if (!issues.some((item) => item.includes("progress-event-missing"))) {
      issues.push("top-level progress adapter has no same-tab event");
    }
  }
  if (typeof catalogRecord?.progress === "function"
      && catalogRecord.progressEvent !== course.progressEvent) {
    issues.push("catalog progressEvent does not match the top-level manifest");
  }
  const usesSharedCourseKitStore = course.progressEvent === "ae:course-kit:progress"
    && storeDirs.has("course-kit");
  if (!String(course.href).includes("#") && !storeDirs.has(course.id)
      && !usesSharedCourseKitStore) {
    issues.push("no course progress-store.ts was discovered");
  }
  return gate(issues.length ? "fail" : "pass", issues, {
    progressEvent: course.progressEvent || null,
    progressStorageKey: course.progressStorageKey || "ae.progress",
  });
}

function checkerCoverageGate(course, profile, scripts, projectRoot) {
  const sourcePaths = profile.releaseScripts
    .flatMap((script) => commandScriptPaths(scripts[script]));
  const source = sourcePaths
    .filter((path) => existsSync(join(projectRoot, path)))
    .map((path) => readFileSync(join(projectRoot, path), "utf8"))
    .join("\n");
  const assetDirectory = join(projectRoot, "public/courses", course.id);
  const assetCount = countFiles(assetDirectory);
  const hasAssetAssertions = assetCount === 0 || (
    /(?:figure|asset|media)/i.test(source)
    && /(?:existsSync|statSync|readFileSync|sha256|digest|dimensions)/.test(source)
  );
  const hasRightsAssertions = assetCount === 0 || (
    /(?:rights|licen[cs]e|permission|publication|releaseEligibility|releaseStatus)/i.test(source)
  );
  return {
    assets: gate(hasAssetAssertions ? (assetCount ? "pass" : "not-applicable") : "fail",
      hasAssetAssertions ? [] : ["public course assets exist but checker source has no integrity assertion"],
      { assetDirectory: assetCount ? relative(projectRoot, assetDirectory) : null, assetCount, checkerSources: sourcePaths }),
    rights: gate(hasRightsAssertions ? (assetCount ? "pass" : "not-applicable") : "fail",
      hasRightsAssertions ? [] : ["public course assets exist but checker source has no rights/publication assertion"],
      { assetCount, checkerSources: sourcePaths }),
  };
}

function failGateFromSignals(base, signals) {
  if (!signals.length) return base;
  return {
    ...base,
    status: "fail",
    issues: [...base.issues, ...signals],
  };
}

/** Pure structural fixture evaluator used by negative tests. */
export function evaluateCourseFixture({
  course,
  catalogRecord,
  availableCount,
  checkerRegistered,
  routePresent,
  seoPresent,
  sitemapPresent,
}) {
  const gates = {
    manifest: manifestGate(course, availableCount),
    catalog: catalogRecord ? gate("pass") : gate("fail", ["no available catalog record"]),
    checker: checkerRegistered ? gate("pass") : gate("fail", ["no release checker is registered"]),
    routes: routePresent ? gate("pass") : gate("fail", ["route is missing"]),
    seo: seoPresent ? gate("pass") : gate("fail", ["SEO page is missing"]),
    sitemap: sitemapPresent ? gate("pass") : gate("fail", ["sitemap page is missing"]),
  };
  return {
    status: Object.values(gates).every((item) => item.status === "pass") ? "pass" : "fail",
    gates,
  };
}

export async function buildCoursePlatformMatrix({
  projectRoot = DEFAULT_ROOT,
  runCheckers = true,
  useReleaseCheckers = true,
  requireProductionEvidence = true,
  requireFrozenStaticExport = true,
} = {}) {
  const root = resolve(projectRoot);
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const scripts = packageJson.scripts || {};
  const cacheKey = `platform-release=${Date.now()}`;
  const [{ TOP_LEVEL_COURSES, CATALOG_COURSES }, { PAGES }, sitemapModule] = await Promise.all([
    import(`${pathToFileURL(join(root, "lib/courses.ts")).href}?${cacheKey}`),
    import(`${pathToFileURL(join(root, "lib/seo.ts")).href}?${cacheKey}`),
    import(`${pathToFileURL(join(root, "app/sitemap.ts")).href}?${cacheKey}`),
  ]);
  const progressResult = await checkProgressContract(root);
  const releaseReadiness = checkReleaseReadiness(root);
  const availableCatalog = CATALOG_COURSES.filter((course) => course.status === "available");
  const catalogById = new Map(availableCatalog.map((course) => [course.id, course]));
  const topById = new Map(TOP_LEVEL_COURSES.map((course) => [course.id, course]));
  const storeDirs = new Set(
    readdirSync(join(root, "components"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .filter((entry) => existsSync(join(root, "components", entry.name, "progress-store.ts")))
      .map((entry) => entry.name),
  );
  const coursesPage = readFileSync(join(root, "app/[locale]/courses/page.tsx"), "utf8");
  const sitemap = await sitemapModule.default();
  const sitemapUrls = new Set(sitemap.map((entry) => entry.url));
  const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim();
  const worktreeDirty = Boolean(spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
  }).stdout.trim());
  const expectedNumbers = TOP_LEVEL_COURSES.map((course) => course.displayNumber).sort((a, b) => a - b);
  const sequenceIssues = expectedNumbers
    .map((number, index) => number === index + 1 ? null : `display sequence expected ${index + 1}, found ${number}`)
    .filter(Boolean);
  const inventoryIssues = [];
  if (new Set(TOP_LEVEL_COURSES.map((course) => course.id)).size !== TOP_LEVEL_COURSES.length) {
    inventoryIssues.push("TOP_LEVEL_COURSES contains duplicate ids");
  }
  if (new Set(availableCatalog.map((course) => course.id)).size !== availableCatalog.length) {
    inventoryIssues.push("available CATALOG_COURSES contains duplicate ids");
  }
  for (const id of topById.keys()) if (!catalogById.has(id)) inventoryIssues.push(`${id} is top-level but not available in catalog`);
  for (const id of catalogById.keys()) if (!topById.has(id)) inventoryIssues.push(`${id} is available in catalog but absent from top-level manifests`);
  inventoryIssues.push(...sequenceIssues);

  const courseRows = [];
  for (const course of [...TOP_LEVEL_COURSES].sort((left, right) => left.displayNumber - right.displayNumber)) {
    const catalogRecord = catalogById.get(course.id);
    const pages = expectedPages(course, catalogRecord);
    const profile = checkerProfile(course, scripts, useReleaseCheckers);
    const checker = runCheckers
      ? runRegisteredChecker(profile, root)
      : gate(profile.scripts.length ? "registered" : "fail",
        profile.scripts.length ? [] : ["no release checker is registered"],
        { scripts: profile.scripts, kind: profile.kind });
    const coverage = checkerCoverageGate(course, profile, scripts, root);
    const failedCheckerSignals = (checker.runs || [])
      .filter((run) => run.exitCode !== 0)
      .flatMap((run) => run.summary);
    const rightsSignals = failedCheckerSignals.filter((line) => (
      /(?:rights|permission|publication|licen[cs]e)/i.test(line)
    ));
    const progressSignals = failedCheckerSignals.filter((line) => (
      /(?:progress|global reset|cache contract)/i.test(line)
    ));
    const assetSignals = failedCheckerSignals.filter((line) => (
      /(?:capture .* required|asset .* missing|missing .* (?:figure|asset|media))/i.test(line)
      && !/(?:rights|permission|publication|licen[cs]e)/i.test(line)
    ));
    const seoMissing = pages.filter((page) => !PAGES.includes(page));
    const sitemapMissing = pages.filter((page) => ![...sitemapUrls].some((url) => {
      try { return new URL(url).pathname.endsWith(`/${page}`); } catch { return false; }
    }));
    const gates = {
      manifest: manifestGate(course, TOP_LEVEL_COURSES.length),
      checker,
      routes: routeGate(course, catalogRecord, root),
      catalog: catalogGate(course, catalogRecord, coursesPage),
      seo: gate(seoMissing.length ? "fail" : "pass", seoMissing.map((page) => `PAGES is missing ${page}`), { expectedPages: pages }),
      sitemap: gate(sitemapMissing.length ? "fail" : "pass", sitemapMissing.map((page) => `sitemap is missing ${page}`), { expectedPages: pages }),
      progress: failGateFromSignals(
        progressGate(course, catalogRecord, progressResult, storeDirs),
        progressSignals,
      ),
      assets: failGateFromSignals(coverage.assets, assetSignals),
      rights: failGateFromSignals(coverage.rights, rightsSignals),
    };
    const blocking = Object.values(gates).some((item) => item.status === "fail");
    courseRows.push({
      id: course.id,
      displayNumber: course.displayNumber,
      href: catalogRecord?.href || course.href,
      status: blocking ? "fail" : (runCheckers ? "pass" : "registered"),
      gates,
    });
  }

  const buildCommand = String(scripts["build:release"] || scripts.build || "");
  const nextBuildIndex = buildCommand.indexOf("next build");
  const unifiedScriptNames = Object.entries(scripts)
    .filter(([, command]) => String(command).includes("scripts/check-course-platform-release.mjs"))
    .map(([name]) => name);
  const unifiedWiredBeforeBuild = unifiedScriptNames.some((name) => {
    const index = buildCommand.indexOf(`npm run ${name}`);
    return index >= 0 && (nextBuildIndex < 0 || index < nextBuildIndex);
  });
  const unwiredCheckers = unifiedWiredBeforeBuild
    ? []
    : courseRows.flatMap((row) => row.gates.checker.scripts || [])
      .filter((name) => buildCommand.indexOf(`npm run ${name}`) < 0
        || (nextBuildIndex >= 0 && buildCommand.indexOf(`npm run ${name}`) > nextBuildIndex));
  const frozenConfig = JSON.parse(readFileSync(join(root, "config/release-readiness.json"), "utf8"));
  const outExists = existsSync(join(root, "out")) && statSync(join(root, "out")).isDirectory();
  const exportBoundToHead = outExists
    && frozenConfig.releaseTarget?.candidateCommitSha === head
    && releaseReadiness.ready;
  const globalGates = {
    inventory: gate(inventoryIssues.length ? "fail" : "pass", inventoryIssues, {
      availableCourseCount: TOP_LEVEL_COURSES.length,
      catalogAvailableCount: availableCatalog.length,
    }),
    progress: gate(progressResult.ok ? "pass" : "fail", progressResult.issues.map((item) => `${item.code}: ${item.message}`), { counts: progressResult.counts }),
    releaseCheckerWiring: gate(unwiredCheckers.length ? "fail" : "pass", unwiredCheckers.map((name) => `${name} is not before next build`), {
      unifiedScriptNames,
      unifiedWiredBeforeBuild,
    }),
    productionReadiness: gate(
      !requireProductionEvidence || releaseReadiness.ready ? "pass" : "fail",
      !requireProductionEvidence ? [] : [
      ...releaseReadiness.configIssues.map((item) => `${item.code}: ${item.message}`),
      ...releaseReadiness.messageIssues.map((item) => `${item.code}: ${item.message}`),
      ...releaseReadiness.evidence.filter((item) => item.status !== "pass")
        .map((item) => `${item.label}: ${item.status}`),
      ],
      { evidence: releaseReadiness.evidence, required: requireProductionEvidence },
    ),
    worktreeClean: gate(
      !requireProductionEvidence || !worktreeDirty ? "pass" : "fail",
      requireProductionEvidence && worktreeDirty
        ? ["production release requires an exact clean commit"]
        : [],
      { worktreeDirty, required: requireProductionEvidence },
    ),
    frozenStaticExport: gate(
      !requireFrozenStaticExport || exportBoundToHead ? "pass" : "fail",
      requireFrozenStaticExport && !exportBoundToHead ? [
        "out/ is not proven to be a fresh static export bound to the current approved release target",
      ] : [],
      {
        outExists,
        candidateCommitSha: frozenConfig.releaseTarget?.candidateCommitSha || null,
        head,
        required: requireFrozenStaticExport,
      },
    ),
  };
  const blockingGlobal = Object.values(globalGates).some((item) => item.status !== "pass");
  const blockingCourses = courseRows.some((row) => row.status === "fail");

  return {
    schemaVersion: 1,
    snapshot: {
      commit: head,
      catalogSource: "lib/courses.ts#TOP_LEVEL_COURSES+CATALOG_COURSES",
      seoSource: "lib/seo.ts#PAGES",
      sitemapSource: "app/sitemap.ts#default",
      availableCourseCount: TOP_LEVEL_COURSES.length,
      checkerExecution: runCheckers ? "executed" : "structural-only",
      checkerMode: useReleaseCheckers ? "release" : "local",
      worktreeDirty,
    },
    status: blockingGlobal || blockingCourses ? "fail" : "pass",
    globalGates,
    courses: courseRows,
  };
}

/** Compact, committed snapshot: statuses and blockers without duplicating PAGES. */
export function toCommittedCourseMatrix(matrix) {
  return {
    schemaVersion: matrix.schemaVersion,
    snapshot: matrix.snapshot,
    status: matrix.status,
    globalGates: Object.fromEntries(Object.entries(matrix.globalGates).map(([name, result]) => [
      name,
      {
        status: result.status,
        issues: result.issues,
        ...(result.counts ? { counts: result.counts } : {}),
        ...(result.availableCourseCount ? { availableCourseCount: result.availableCourseCount } : {}),
        ...(result.catalogAvailableCount ? { catalogAvailableCount: result.catalogAvailableCount } : {}),
      },
    ])),
    courses: matrix.courses.map((course) => ({
      id: course.id,
      displayNumber: course.displayNumber,
      href: course.href,
      status: course.status,
      moduleCount: course.gates.manifest.moduleCount,
      checkerScripts: course.gates.checker.scripts,
      checkerExitCodes: (course.gates.checker.runs || []).map((run) => run.exitCode),
      checkerSignals: (course.gates.checker.runs || [])
        .filter((run) => run.exitCode !== 0)
        .flatMap((run) => run.summary),
      gates: Object.fromEntries(Object.entries(course.gates).map(([name, result]) => [name, result.status])),
      blockers: Object.entries(course.gates)
        .filter(([, result]) => result.status === "fail")
        .flatMap(([name, result]) => result.issues.map((message) => ({ gate: name, message }))),
    })),
  };
}

export function formatCoursePlatformMatrix(matrix) {
  const lines = [
    `course platform release: ${matrix.status.toUpperCase()}`,
    `courses: ${matrix.snapshot.availableCourseCount} available manifests discovered at ${matrix.snapshot.commit.slice(0, 12)}`,
  ];
  for (const [name, result] of Object.entries(matrix.globalGates)) {
    lines.push(`global ${name}: ${String(result.status).toUpperCase()}${result.issues.length ? ` — ${result.issues[0]}` : ""}`);
  }
  for (const course of matrix.courses) {
    const failed = Object.entries(course.gates)
      .filter(([, result]) => result.status === "fail")
      .map(([name]) => name);
    lines.push(`${String(course.displayNumber).padStart(2, "0")} ${course.id}: ${course.status.toUpperCase()}${failed.length ? ` (${failed.join(", ")})` : ""}`);
  }
  return lines.join("\n");
}

const invoked = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  const localOnly = process.argv.includes("--local");
  const matrix = await buildCoursePlatformMatrix({
    runCheckers: !process.argv.includes("--structural-only"),
    useReleaseCheckers: !localOnly,
    requireProductionEvidence: !localOnly,
    requireFrozenStaticExport: !localOnly,
  });
  if (process.argv.includes("--matrix")) {
    console.log(JSON.stringify(toCommittedCourseMatrix(matrix), null, 2));
  } else if (process.argv.includes("--json")) console.log(JSON.stringify(matrix, null, 2));
  else console.log(formatCoursePlatformMatrix(matrix));
  if (matrix.status !== "pass") process.exitCode = 1;
}
