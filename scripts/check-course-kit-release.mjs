#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COURSE_IDS = [
  "responsible-ai",
  "agentic-quant-trading",
];

const CONTRACTS = {
  "responsible-ai": {
    exportName: "RESPONSIBLE_AI_COURSE",
    displayNumber: 16,
    milestoneCount: 12,
    drawCount: 12,
    passCount: 10,
    minutes: [50, 60, 60, 70, 55, 55, 70, 65, 75, 90],
    artifactIds: [
      "impact-assessment", "stakeholder-map", "risk-register", "data-map",
      "subgroup-test", "assurance-card", "override-appeal-flow",
      "red-team-incident-log", "go-no-go-memo",
    ],
  },
  "agentic-quant-trading": {
    exportName: "AGENTIC_QUANT_TRADING_COURSE",
    displayNumber: 17,
    milestoneCount: 14,
    drawCount: 12,
    passCount: 10,
    minutes: [55, 60, 65, 60, 65, 75, 70, 60, 75, 65, 60, 70],
    artifactIds: [
      "mandate-authority", "data-signal-lineage", "agent-experiment-ledger",
      "backtest-evaluation", "claim-debate-audit", "risk-gates",
      "paper-execution-reconciliation", "operations-release",
    ],
  },
};

function walk(directory, files = []) {
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function sameArray(left, right) {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function issue(issues, gate, message, details = undefined) {
  issues.push({ gate, message, ...(details ? { details } : {}) });
}

function provenanceResources(provenance) {
  const records = provenance.resources ?? provenance.files ?? [];
  return Array.isArray(records) ? records : [];
}

function rightsEligible(provenance) {
  const rights = provenance.rights;
  if (!rights || typeof rights !== "object") return false;
  if (rights.publication_eligible === true) return true;
  return rights.containsThirdPartyData === false
    && rights.containsPersonalData === false;
}

function checkAssets(courseId, issues, root) {
  const directory = join(root, "public/courses", courseId);
  if (!existsSync(directory)) {
    issue(issues, "assets", `Missing public/courses/${courseId}.`);
    return { files: 0, hashed: 0 };
  }
  const noticePath = join(directory, "NOTICE.md");
  if (!existsSync(noticePath)) {
    issue(issues, "rights", "NOTICE.md is missing.");
  } else {
    const notice = readFileSync(noticePath, "utf8");
    if (!/(?:original|原创|authored|synthetic|合成)/i.test(notice)) {
      issue(issues, "rights", "NOTICE.md does not identify original or synthetic authorship.");
    }
    if (!/(?:licen[cs]e|rights|权利|许可|CC0)/i.test(notice)) {
      issue(issues, "rights", "NOTICE.md does not record a rights or licence boundary.");
    }
  }

  const allFiles = walk(directory);
  const provenanceFiles = allFiles.filter((path) => /provenance(?:\.v\d+)?\.json$/i.test(path));
  if (!provenanceFiles.length) {
    issue(issues, "rights", "A machine-readable provenance JSON file is required.");
    return { files: allFiles.length, hashed: 0 };
  }

  const covered = new Set();
  let eligible = false;
  for (const provenancePath of provenanceFiles) {
    let provenance;
    try {
      provenance = JSON.parse(readFileSync(provenancePath, "utf8"));
    } catch (error) {
      issue(issues, "assets", `${relative(root, provenancePath)} is not valid JSON: ${error}`);
      continue;
    }
    eligible ||= rightsEligible(provenance);
    const records = provenanceResources(provenance);
    if (!records.length) {
      issue(issues, "assets", `${relative(root, provenancePath)} has no file hash records.`);
    }
    for (const record of records) {
      if (!record || typeof record.path !== "string" || typeof record.sha256 !== "string") {
        issue(issues, "assets", `${relative(root, provenancePath)} has a malformed hash record.`);
        continue;
      }
      const assetPath = resolve(directory, record.path);
      if (!assetPath.startsWith(`${resolve(directory)}/`)) {
        issue(issues, "assets", `Provenance path escapes its course directory: ${record.path}.`);
        continue;
      }
      covered.add(assetPath);
      if (!existsSync(assetPath)) {
        issue(issues, "assets", `Provenance references missing asset ${record.path}.`);
      } else if (sha256(assetPath) !== record.sha256.toLowerCase()) {
        issue(issues, "assets", `SHA-256 mismatch for ${record.path}.`);
      }
    }
  }
  if (!eligible) {
    issue(issues, "rights", "Provenance does not make an explicit publication-eligible original-data assertion.");
  }

  const payloadFiles = allFiles.filter((path) => {
    const name = relative(directory, path);
    return !/(^|\/)(?:NOTICE|LICENSE[^/]*)\.md$/i.test(name)
      && !/provenance(?:\.v\d+)?\.json$/i.test(name)
      && !/(^|\/)checksums\.sha256$/i.test(name);
  });
  for (const path of payloadFiles) {
    if (!covered.has(resolve(path))) {
      issue(issues, "assets", `${relative(directory, path)} is not covered by provenance SHA-256.`);
    }
  }
  return { files: allFiles.length, hashed: covered.size };
}

function checkStaticUi(courseId, issues, root, release) {
  const routeDirectory = join(
    root,
    "app/[locale]",
    ...(release ? [courseId] : ["_blocked", courseId]),
  );
  const expectedRouteFiles = [
    join(routeDirectory, "page.tsx"),
    join(routeDirectory, "[module]/page.tsx"),
  ];
  for (const path of expectedRouteFiles) {
    if (!existsSync(path)) issue(issues, "routes", `Missing ${relative(root, path)}.`);
  }
  const routeText = expectedRouteFiles
    .filter(existsSync)
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  for (const token of ["dynamicParams = false", "generateStaticParams", "Promise<", "await params"] ) {
    if (!routeText.includes(token)) issue(issues, "routes", `Route contract is missing ${token}.`);
  }

  const sharedDirectory = join(root, "components/course-kit");
  const uiFiles = [...walk(sharedDirectory), ...expectedRouteFiles.filter(existsSync)]
    .filter((path) => /\.tsx?$/.test(path));
  const uiText = uiFiles.map((path) => readFileSync(path, "utf8")).join("\n");
  if (/<main(?:\s|>)/i.test(uiText)) {
    issue(issues, "ui", "Course kit must not create a nested second <main>.");
  }
  if (/<(?:iframe|img|video|audio|source)\b[^>]*(?:src|poster)\s*=\s*["'`{][^>]*https?:\/\//i.test(uiText)) {
    issue(issues, "ui", "Course kit embeds remote media.");
  }

  const cssPath = join(sharedDirectory, "CourseKit.module.css");
  const css = existsSync(cssPath) ? readFileSync(cssPath, "utf8") : "";
  const declaredClasses = new Set(
    [...css.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)/g)].map((match) => match[1]),
  );
  for (const file of uiFiles) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)) {
      if (!declaredClasses.has(match[1])) {
        issue(issues, "ui", `${relative(root, file)} references undefined CSS class ${match[1]}.`);
      }
    }
  }
}

function checkDefinition(courseId, definition, contract, issues) {
  const { manifest, sources, copy, quiz, capstone } = definition;
  if (manifest.id !== courseId) issue(issues, "manifest", `Expected ID ${courseId}, found ${manifest.id}.`);
  if (manifest.displayNumber !== contract.displayNumber) {
    issue(issues, "manifest", `Expected Course ${contract.displayNumber}, found ${manifest.displayNumber}.`);
  }
  if (manifest.milestoneCount !== contract.milestoneCount) {
    issue(issues, "manifest", `Expected ${contract.milestoneCount} milestones.`);
  }
  const observedMinutes = manifest.modules.map((module) => module.minutes);
  if (!sameArray(observedMinutes, contract.minutes)) {
    issue(issues, "manifest", `Module-minute contract drift: ${JSON.stringify(observedMinutes)}.`);
  }
  const moduleTotal = observedMinutes.reduce((sum, minutes) => sum + minutes, 0);
  const expectedTotal = contract.minutes.reduce((sum, minutes) => sum + minutes, 0);
  if (moduleTotal !== expectedTotal) issue(issues, "manifest", `Expected ${expectedTotal} minutes, found ${moduleTotal}.`);

  const artifacts = capstone.artifacts.map((artifact) => artifact.id);
  if (contract.artifactIds && !sameArray(artifacts, contract.artifactIds)) {
    issue(issues, "capstone", `Capstone artifact contract drift: ${JSON.stringify(artifacts)}.`);
  }
  if (contract.artifactCount && artifacts.length !== contract.artifactCount) {
    issue(issues, "capstone", `Expected ${contract.artifactCount} capstone artifacts, found ${artifacts.length}.`);
  }

  const expectedBank = manifest.modules.length * 3;
  if (quiz.questions.length !== expectedBank) {
    issue(issues, "quiz", `Expected ${expectedBank} bank questions, found ${quiz.questions.length}.`);
  }
  if (quiz.drawCount !== contract.drawCount || quiz.passCount !== contract.passCount) {
    issue(
      issues,
      "quiz",
      `Expected draw/pass ${contract.drawCount}/${contract.passCount}, found ${quiz.drawCount}/${quiz.passCount}.`,
    );
  }
  const critical = quiz.questions.filter((question) => question.critical === true);
  if (!critical.length) issue(issues, "quiz", "At least one critical question is required.");
  if (critical.length >= quiz.drawCount) issue(issues, "quiz", "Critical questions must fit inside the fixed draw.");

  const expectedLocales = ["en", "zh-Hans"];
  if (!sameArray([...manifest.reviewedLocales], expectedLocales)) {
    issue(issues, "locales", "Reviewed locales must be exactly en and zh-Hans.");
  }
  if (!copy.en || !copy["zh-Hans"]) issue(issues, "locales", "Both reviewed copy bundles are required.");
  for (const locale of expectedLocales) {
    if (!copy[locale]) continue;
    if (!copy[locale].outcomes.length) issue(issues, "locales", `${locale} has no learning outcomes.`);
    for (const moduleManifest of manifest.modules) {
      const moduleCopy = copy[locale].modules[moduleManifest.slug];
      if (!moduleCopy) continue;
      if (moduleCopy.sections.length < 2) {
        issue(issues, "copy", `${locale}/${moduleManifest.slug} needs at least two teaching sections.`);
      }
      if (!moduleCopy.practice?.deliverable || !moduleCopy.practice?.reviewGate) {
        issue(issues, "assessment", `${locale}/${moduleManifest.slug} has no applied artifact and review gate.`);
      }
      if (!moduleCopy.checkpoint?.question) {
        issue(issues, "assessment", `${locale}/${moduleManifest.slug} has no checkpoint.`);
      }
    }
  }

  for (const source of sources) {
    if (!source.supports.trim() || !source.boundary.trim()) {
      issue(issues, "sources", `${source.id} lacks a precise supports/boundary contract.`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.accessedOn)) {
      issue(issues, "sources", `${source.id} lacks an ISO access date.`);
    }
    if (!source.reuseStatus) issue(issues, "rights", `${source.id} lacks a reuse status.`);
  }
}

function checkProgress(definition, helpers, issues) {
  const config = helpers.createCourseKitProgressConfig(definition);
  const validReceipt = (artifactPath) => JSON.stringify({
    schemaVersion: "aicourse.evidence-receipt.v1",
    artifactPath,
    sha256: "a".repeat(64),
    validator: {
      command: "python3 offline-validator.py --check",
      status: "pass",
      checkedOn: "2026-08-30",
    },
    reviewer: {
      name: "Named Human Reviewer",
      role: "Course release fixture reviewer",
      human: true,
      decision: "accept-with-limitations",
    },
    limitations: ["Release-fixture structure is not automatic substantive proof."],
  });
  if (helpers.courseKitProgressPercent({}, config) !== 0) {
    issue(issues, "progress", "Empty progress must be 0%.");
  }
  const firstModule = config.moduleSlugs[0];
  const partial = {
    [config.progressVersionKey]: config.courseVersion,
    [helpers.courseKitModuleCompleteKey(config.courseId, firstModule)]: true,
    [helpers.courseKitCheckpointKey(config.courseId, firstModule)]: {
      choice: 0,
      correct: true,
    },
  };
  if (config.moduleReceiptEvidence === "structured-receipt") {
    partial[helpers.courseKitModuleReceiptKey(config.courseId, firstModule)] =
      validReceipt(`outputs/${config.courseId}/${firstModule}.json`);
  }
  const expectedPartial = Math.round(100 / config.milestoneCount);
  if (helpers.courseKitProgressPercent(partial, config) !== expectedPartial) {
    issue(issues, "progress", `One milestone must equal ${expectedPartial}%.`);
  }
  const oldVersion = { ...partial, [config.progressVersionKey]: "obsolete-v0" };
  if (helpers.courseKitProgressPercent(oldVersion, config) !== 0) {
    issue(issues, "progress", "Old-version completion must be invalidated to 0%.");
  }
  const complete = { [config.progressVersionKey]: config.courseVersion };
  for (const slug of config.moduleSlugs) {
    complete[helpers.courseKitModuleCompleteKey(config.courseId, slug)] = true;
    complete[helpers.courseKitCheckpointKey(config.courseId, slug)] = {
      choice: 0,
      correct: true,
    };
    if (config.moduleReceiptEvidence === "structured-receipt") {
      complete[helpers.courseKitModuleReceiptKey(config.courseId, slug)] =
        validReceipt(`outputs/${config.courseId}/${slug}.json`);
    }
  }
  complete[helpers.courseKitQuizVersionKey(config.courseId)] = config.quizVersion;
  complete[helpers.courseKitQuizPassedKey(config.courseId)] = true;
  complete[helpers.courseKitCapstoneVersionKey(config.courseId)] = config.capstoneVersion;
  for (const id of config.capstoneArtifactIds) {
    complete[helpers.courseKitCapstoneArtifactKey(config.courseId, id)] = true;
    complete[helpers.courseKitCapstoneDraftKey(config.courseId, id)] =
      config.capstoneArtifactEvidence === "structured-receipt"
        ? validReceipt(`outputs/${config.courseId}/${id}.json`)
        : "Reviewed capstone artifact draft.";
  }
  complete[helpers.courseKitCapstoneCompleteKey(config.courseId)] = true;
  if (helpers.courseKitProgressPercent(complete, config) !== 100) {
    issue(issues, "progress", "Complete current-version progress must be 100%.");
  }
}

export function evaluateCourseKitFixture({ definition, contract, validationIssues = [], coverageIssues = [] }) {
  const issues = [];
  checkDefinition(definition.manifest.id, definition, contract, issues);
  for (const validationIssue of validationIssues) {
    issue(issues, "definition", `${validationIssue.path}: ${validationIssue.message}`);
  }
  for (const coverageIssue of coverageIssues) issue(issues, "coverage", coverageIssue);
  return { ok: issues.length === 0, issues };
}

export async function checkCourseKitRelease(courseId, projectRoot = ROOT, release = false) {
  const root = resolve(projectRoot);
  const contract = CONTRACTS[courseId];
  if (!contract) throw new Error(`Unknown Course Kit ID: ${courseId}.`);
  const cache = `course-kit-release=${Date.now()}`;
  const [courseModule, validationModule, coverageModule, progressModule, quizModule, localeModule] = await Promise.all([
    import(`${pathToFileURL(join(root, "lib", courseId, "index.ts")).href}?${cache}`),
    import(`${pathToFileURL(join(root, "lib/course-kit/validate.ts")).href}?${cache}`),
    import(`${pathToFileURL(join(root, "lib/course-kit/coverage.ts")).href}?${cache}`),
    import(`${pathToFileURL(join(root, "lib/course-kit/progress.ts")).href}?${cache}`),
    import(`${pathToFileURL(join(root, "lib/course-kit/quiz.ts")).href}?${cache}`),
    import(`${pathToFileURL(join(root, "lib/course-kit/locale.ts")).href}?${cache}`),
  ]);
  const definition = courseModule[contract.exportName];
  if (!definition) throw new Error(`${courseId} does not export ${contract.exportName}.`);
  const issues = [];
  checkDefinition(courseId, definition, contract, issues);
  for (const item of validationModule.validateCourseKitDefinition(definition)) {
    issue(issues, "definition", `${item.path}: ${item.message}`);
  }
  for (const item of coverageModule.validateCourseKitCoverage(definition)) {
    issue(issues, "coverage", item);
  }
  checkProgress(definition, progressModule, issues);

  const materialised = localeModule.materialiseCourseKit(definition, "en");
  const draw = quizModule.drawCourseKitQuizQuestions(
    materialised.quiz.questions,
    materialised.quiz.drawCount,
    `${courseId}:${materialised.quiz.version}`,
  );
  const criticalIds = definition.quiz.questions.filter((question) => question.critical).map((question) => question.id);
  if (!criticalIds.every((id) => draw.some((question) => question.id === id))) {
    issue(issues, "quiz", "The deterministic final draw omitted a critical question.");
  }
  const wrongCriticalAnswers = Object.fromEntries(
    draw.map((question) => [question.id, question.correctIndex]),
  );
  const firstCritical = draw.find((question) => question.critical);
  if (firstCritical) {
    wrongCriticalAnswers[firstCritical.id] = (firstCritical.correctIndex + 1) % 4;
    const grade = quizModule.gradeCourseKitQuiz(draw, wrongCriticalAnswers, materialised.quiz.passCount);
    if (grade.passed) issue(issues, "quiz", "A wrong critical answer incorrectly passed the final assessment.");
  }

  for (const requestedLocale of ["es", "fr", "de", "zh-Hant", "ja", "ko", "ar"]) {
    const locale = localeModule.resolveCourseKitLocale(requestedLocale);
    if (locale.contentLocale !== "en" || locale.canonicalLocale !== "en" || locale.contentDirection !== "ltr") {
      issue(issues, "locales", `${requestedLocale} is not an explicit English/LTR fallback.`);
    }
    if (requestedLocale === "ar" && locale.shellDirection !== "rtl") {
      issue(issues, "locales", "Arabic shell must remain RTL around the English LTR content surface.");
    }
  }

  const assetStats = checkAssets(courseId, issues, root);
  checkStaticUi(courseId, issues, root, release);
  return {
    courseId,
    ok: issues.length === 0,
    contract: {
      displayNumber: definition.manifest.displayNumber,
      modules: definition.manifest.modules.length,
      minutes: definition.manifest.modules.reduce((sum, module) => sum + module.minutes, 0),
      milestones: definition.manifest.milestoneCount,
      questions: definition.quiz.questions.length,
      criticalQuestions: definition.quiz.questions.filter((question) => question.critical).length,
      capstoneArtifacts: definition.capstone.artifacts.length,
      sources: definition.sources.length,
      assets: assetStats.files,
      hashedAssets: assetStats.hashed,
    },
    issues,
  };
}

export async function checkAllCourseKitReleases(
  projectRoot = ROOT,
  selectedIds = COURSE_IDS,
  release = false,
) {
  const results = [];
  for (const courseId of selectedIds) {
    results.push(await checkCourseKitRelease(courseId, projectRoot, release));
  }
  return { ok: results.every((result) => result.ok), results };
}

function format(result) {
  const lines = [];
  for (const course of result.results) {
    const contract = course.contract;
    lines.push(
      `${course.courseId}: ${course.ok ? "PASS" : "FAIL"} — ${contract.modules} modules / ${contract.minutes} min / ${contract.questions} questions / ${contract.capstoneArtifacts} capstone artifacts / ${contract.hashedAssets} hashed assets`,
    );
    for (const item of course.issues) lines.push(`  [${item.gate}] ${item.message}`);
  }
  lines.push(`course-kit release: ${result.ok ? "PASS" : "FAIL"}`);
  return lines.join("\n");
}

const invoked = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  const courseIndex = process.argv.indexOf("--course");
  const selected = courseIndex >= 0 ? [process.argv[courseIndex + 1]] : COURSE_IDS;
  if (!selected[0] || selected.some((id) => !COURSE_IDS.includes(id))) {
    console.error(`Use --course with one of: ${COURSE_IDS.join(", ")}`);
    process.exitCode = 2;
  } else {
    const result = await checkAllCourseKitReleases(
      ROOT,
      selected,
      process.argv.includes("--release"),
    );
    if (process.argv.includes("--json")) console.log(JSON.stringify(result, null, 2));
    else console.log(format(result));
    if (!result.ok) process.exitCode = 1;
  }
}
