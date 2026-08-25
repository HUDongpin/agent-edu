#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CURSOR_CAPSTONE_FIXTURE_SHA256,
  CURSOR_CAPSTONE_ARCHIVE_SHA256,
  CURSOR_CAPSTONE_ARTIFACT_IDS,
  CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY,
  CURSOR_CAPSTONE_REQUIRED_CHECKS,
  CURSOR_COURSE_MANIFEST,
  CURSOR_FIGURES,
  CURSOR_FINAL_QUIZ,
  CURSOR_LOCALES,
  CURSOR_PRACTICES,
  CURSOR_CAPSTONE_PROGRESS_KEY,
  CURSOR_CAPSTONE_META_PROGRESS_KEY,
  CURSOR_CAPSTONE_PROGRESS_META,
  CURSOR_LESSON_PROGRESS_KEYS,
  CURSOR_PROGRESS_CACHE_CONTRACT,
  CURSOR_PROGRESS_MILESTONES,
  CURSOR_OPEN_GRAPH_LOCALES,
  CURSOR_QUIZ,
  CURSOR_QUIZ_IDS,
  CURSOR_QUIZ_OPTION_IDS,
  CURSOR_SOURCES,
  cursorProgressCompletedMilestones,
  cursorProgressPercent,
  createCursorCapstoneProgressAssessment,
  isCursorCapstoneProgressPassed,
  validateCursorCopy,
  validateCursorManifests,
} from "../lib/cursor/index.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const release = process.argv.includes("--release");
const failures = [];
const pass = (message) => console.log(`PASS  ${message}`);
const warn = (message) => console.warn(`WARN  ${message}`);
const fail = (message) => failures.push(message);
const text = (path) => readFileSync(join(ROOT, path), "utf8");
const json = (path) => JSON.parse(text(path));
const digest = (path) => createHash("sha256").update(readFileSync(join(ROOT, path))).digest("hex");

function capture(command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: null,
    env: { ...process.env, LC_ALL: "C", TZ: "UTC" },
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} exited with status ${result.status}: ${Buffer.from(result.stderr ?? []).toString("utf8").trim()}`);
  }
  return Buffer.from(result.stdout ?? []);
}

function inspectPng(path) {
  const bytes = readFileSync(join(ROOT, path));
  const signature = bytes.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a" || bytes.length < 24 || bytes.toString("ascii", 12, 16) !== "IHDR") {
    return { valid: false, width: 0, height: 0, metadata: [], malformed: true };
  }
  const metadata = [];
  let malformed = false;
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > bytes.length) {
      malformed = true;
      break;
    }
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    if (["tEXt", "zTXt", "iTXt", "eXIf"].includes(type)) metadata.push(type);
    offset = end;
  }
  return {
    valid: !malformed,
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    metadata,
    malformed,
  };
}

function inspectWebp(path) {
  const bytes = readFileSync(join(ROOT, path));
  if (bytes.length < 12 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP") {
    return { valid: false, metadata: [], malformed: true };
  }
  const metadata = [];
  let malformed = false;
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const type = bytes.toString("ascii", offset, offset + 4);
    const length = bytes.readUInt32LE(offset + 4);
    const end = offset + 8 + length + (length % 2);
    if (end > bytes.length) {
      malformed = true;
      break;
    }
    if (["EXIF", "XMP "].includes(type)) metadata.push(type.trim());
    offset = end;
  }
  return { valid: !malformed, metadata, malformed };
}

function signature(value, path = "$", output = []) {
  if (typeof value === "string") output.push(`${path}:string`);
  else if (Array.isArray(value)) {
    output.push(`${path}:array:${value.length}`);
    value.forEach((item, index) => signature(item, `${path}[${index}]`, output));
  } else if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    output.push(`${path}:object:${keys.join("|")}`);
    keys.forEach((key) => signature(value[key], `${path}.${key}`, output));
  } else output.push(`${path}:${String(value)}`);
  return output;
}

function placeholders(value, path = "$", output = new Map()) {
  if (typeof value === "string") {
    output.set(path, [...value.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)].map((match) => match[1]).sort().join("|"));
  } else if (Array.isArray(value)) {
    value.forEach((item, index) => placeholders(item, `${path}[${index}]`, output));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => placeholders(item, `${path}.${key}`, output));
  }
  return output;
}

function listFiles(directory) {
  return readdirSync(join(ROOT, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

for (const issue of validateCursorManifests()) fail(`[${issue.locale}] ${issue.path}: ${issue.message}`);
if (!failures.length) pass("typed manifests satisfy the 14-lesson, 28-question, 800-minute contract");

const expectedDurations = [40, 45, 50, 55, 60, 60, 55, 55, 65, 60, 55, 55, 55, 90];
if (CURSOR_COURSE_MANIFEST.lessons.map((item) => item.minutes).join("|") !== expectedDurations.join("|")) {
  fail("lesson durations differ from the locked course design");
}
if (CURSOR_COURSE_MANIFEST.lessons.reduce((sum, item) => sum + item.minutes, 0) !== 800) fail("course must total 800 minutes");
if (CURSOR_PRACTICES.length !== 14) fail("course must expose 14 observable practices");
const expectedPracticeWorkspaces = {
  "rules-skills-mcp": "disposable",
  "cloud-parallel": "either",
};
for (const [lessonSlug, workspace] of Object.entries(expectedPracticeWorkspaces)) {
  const practice = CURSOR_PRACTICES.find((item) => item.lessonSlug === lessonSlug);
  if (practice?.workspace !== workspace) fail(`${lessonSlug} practice workspace must remain ${workspace}`);
}
if (CURSOR_QUIZ.length !== 28 || CURSOR_FINAL_QUIZ.bankSize !== 28) fail("final quiz must use a 28-question bank");
if (CURSOR_COURSE_MANIFEST.lessons.some((lesson) => lesson.quizIds.length !== 2)) {
  fail("every lesson must render exactly two formative questions");
}
if (CURSOR_FINAL_QUIZ.questionCount !== 12 || CURSOR_FINAL_QUIZ.questionsPerUnit !== 3 || CURSOR_FINAL_QUIZ.passingCorrectAnswers !== 10) {
  fail("final quiz must draw 12 questions, three per unit, with 10 required to pass");
}
const adapterQuizPass = {
  [CURSOR_FINAL_QUIZ.versionStorageKey]: CURSOR_FINAL_QUIZ.bankVersion,
  [CURSOR_FINAL_QUIZ.bestScoreStorageKey]: CURSOR_FINAL_QUIZ.passingCorrectAnswers,
  [CURSOR_FINAL_QUIZ.passedStorageKey]: true,
};
const adapterCapstoneAssessment = createCursorCapstoneProgressAssessment(
  Object.fromEntries(CURSOR_CAPSTONE_ARTIFACT_IDS.map((id) => [id, true])),
  { scope: true, safety: true, implementation: false, verification: true, handoff: true },
);
const adapterComplete = {
  ...Object.fromEntries(CURSOR_LESSON_PROGRESS_KEYS.map((key) => [key, true])),
  ...adapterQuizPass,
  [CURSOR_CAPSTONE_PROGRESS_KEY]: true,
  [CURSOR_CAPSTONE_META_PROGRESS_KEY]: CURSOR_CAPSTONE_PROGRESS_META,
  [CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY]: adapterCapstoneAssessment,
};
const sharedProgressComponent = text("components/Progress.tsx");
/* The reset button delegates to one registry, so the ordering and the await
   that this contract depends on are asserted where they now live. */
const sharedResetRegistry = text("components/progress-reset.ts");
const sharedCodexResetIndex = sharedResetRegistry.indexOf("resetAllCourseProgress();");
const sharedCursorResetIndex = sharedResetRegistry.indexOf("await resetCursorProgressAfterGlobalReset()");
if (CURSOR_PROGRESS_MILESTONES !== 16
  || cursorProgressCompletedMilestones(adapterComplete) !== 16
  || cursorProgressPercent(adapterComplete) !== 100
  || cursorProgressPercent({ ...adapterComplete, [CURSOR_CAPSTONE_PROGRESS_KEY]: false }) !== 94
  || isCursorCapstoneProgressPassed({ [CURSOR_CAPSTONE_PROGRESS_KEY]: true })
  || isCursorCapstoneProgressPassed({
    [CURSOR_CAPSTONE_PROGRESS_KEY]: true,
    [CURSOR_CAPSTONE_META_PROGRESS_KEY]: { ...CURSOR_CAPSTONE_PROGRESS_META, fixtureVersion: "stale" },
    [CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY]: adapterCapstoneAssessment,
  })
  || cursorProgressPercent({ [CURSOR_FINAL_QUIZ.passedStorageKey]: true }) !== 0
  || CURSOR_PROGRESS_CACHE_CONTRACT.storageKey !== "aicourse.cursor.progress.v1"
  || CURSOR_PROGRESS_CACHE_CONTRACT.lockName !== "aicourse:cursor-progress"
  || CURSOR_PROGRESS_CACHE_CONTRACT.boundedCommitAttempts !== 3
  || CURSOR_PROGRESS_CACHE_CONTRACT.storageIsolation !== "course-specific record; no cross-course writers"
  || CURSOR_PROGRESS_CACHE_CONTRACT.nonCooperatingWriterStrategy !== "isolated-record-no-cross-course-writers"
  || CURSOR_PROGRESS_CACHE_CONTRACT.globalReset.adapter !== "resetCursorProgressAfterGlobalReset"
  || CURSOR_PROGRESS_CACHE_CONTRACT.globalReset.awaitAdapter !== true
  || !/import\s+\{\s*resetCursorProgressAfterGlobalReset\s*\}\s+from\s+["']\.\/cursor\/progress-store["']/.test(sharedResetRegistry)
  || !/import\s+\{\s*resetEveryCourseProgress\s*\}\s+from\s+["']\.\/progress-reset["']/.test(sharedProgressComponent)
  || !sharedProgressComponent.includes("await resetEveryCourseProgress();")
  || sharedCodexResetIndex < 0
  || sharedCursorResetIndex <= sharedCodexResetIndex) {
  fail("pure sixteen-milestone progress or global-reset cache contract changed");
} else {
  pass("pure progress adapter counts 14 lesson flags, strict quiz pass, and versioned capstone");
}
if (Object.keys(CURSOR_OPEN_GRAPH_LOCALES).length !== 9
  || CURSOR_OPEN_GRAPH_LOCALES["zh-Hans"] !== "zh_CN"
  || CURSOR_OPEN_GRAPH_LOCALES["zh-Hant"] !== "zh_TW"
  || CURSOR_OPEN_GRAPH_LOCALES.ar !== "ar_SA") {
  fail("Open Graph locale mapping is incomplete or uses site tags instead of og:locale values");
} else {
  pass("Open Graph metadata maps all nine site locales and emits alternate locales");
}

const english = json("messages/cursor/en.json");
const englishSignature = signature(english).join("\n");
const englishPlaceholders = placeholders(english);
for (const locale of CURSOR_LOCALES) {
  const path = `messages/cursor/${locale}.json`;
  if (!existsSync(join(ROOT, path))) {
    fail(`${path} is missing`);
    continue;
  }
  let copy;
  try {
    copy = json(path);
  } catch (error) {
    fail(`${path} is not valid JSON: ${error.message}`);
    continue;
  }
  for (const issue of validateCursorCopy(locale, copy, locale === "en" ? undefined : english)) {
    fail(`[${locale}] ${issue.path}: ${issue.message}`);
  }
  if (signature(copy).join("\n") !== englishSignature) fail(`${path} does not match the English structure`);
  const current = placeholders(copy);
  for (const [key, expected] of englishPlaceholders) {
    if (current.get(key) !== expected) fail(`${path} placeholder mismatch at ${key}`);
  }
}
if (!failures.some((item) => item.includes("messages/cursor"))) pass("all nine locale files have exact structure and placeholder parity");

const quizGateFailureStart = failures.length;
const expectedQuizAnswerIds = {
  q01: "b", q02: "c", q03: "a", q04: "d", q05: "c", q06: "b", q07: "d", q08: "a",
  q09: "b", q10: "c", q11: "a", q12: "d", q13: "b", q14: "c", q15: "d", q16: "a",
  q17: "c", q18: "b", q19: "a", q20: "d", q21: "b", q22: "c", q23: "d", q24: "a",
  q25: "c", q26: "b", q27: "a", q28: "d",
};
const actualQuizAnswerIds = Object.fromEntries(CURSOR_QUIZ.map((question) => [question.id, question.correctOptionId]));
if (JSON.stringify(actualQuizAnswerIds) !== JSON.stringify(expectedQuizAnswerIds)
  || CURSOR_FINAL_QUIZ.bankVersion !== "2") {
  fail("stable quiz answer IDs or bank version differ from the fact-checked v2 lock");
}

// These fingerprints freeze the native-review result after the positional-to-ID
// migration. Canonical option order makes object insertion order irrelevant,
// while moving a translated meaning between IDs changes the digest.
const expectedQuizFingerprints = {
  en: "17f773e3d615394caaa829006919bc85cee2b9f29ecceeeb5a342068cd4f7ed4",
  es: "bf1bd5c10f6018da350f94eaac67a245eba1415fc4454f4736756697e760fe6d",
  fr: "a3fe3e4e38badf637b5b3a8e9969b44667cd9707128cf721e8f1a5766404491d",
  de: "a1454f64bd77c9aa1e2e0c78e74efc33b7610cfbf7bc76108b7877e508c5dfbb",
  "zh-Hans": "9e92fab34143c81447253d70e50f180153c9303dd40ca0ca8e8d3aa35ba1fa0d",
  "zh-Hant": "9983ee8d0db0f8730b500927cfa65b2a05c2cf6c568d79a9308e00856d32a242",
  ja: "dd54b2427d8aee4f8cb01b63111e92f6d3afc56a4299db5404c67b3f03d75b62",
  ko: "2a0e6f129334c17e8a4a60b606945e6497bba6080d7858efa537117a680e1cc2",
  ar: "477ab1047e8a12a81671f113fe270368164451ad709afb0e699280d0158d9f04",
};
for (const locale of CURSOR_LOCALES) {
  const copy = json(`messages/cursor/${locale}.json`);
  const canonicalQuiz = CURSOR_QUIZ_IDS.map((id) => {
    const question = copy.quiz[id];
    const optionKeys = question?.options && typeof question.options === "object" && !Array.isArray(question.options)
      ? Object.keys(question.options).sort()
      : [];
    if (optionKeys.join("|") !== CURSOR_QUIZ_OPTION_IDS.join("|")) {
      fail(`[${locale}] quiz.${id}.options must contain exactly stable IDs a, b, c, and d`);
    }
    const manifest = CURSOR_QUIZ.find((item) => item.id === id);
    if (!manifest || typeof question?.options?.[manifest.correctOptionId] !== "string"
      || !question.options[manifest.correctOptionId].trim()) {
      fail(`[${locale}] quiz.${id} does not resolve its correctOptionId to visible copy`);
    }
    return {
      id,
      question: question?.question,
      options: Object.fromEntries(CURSOR_QUIZ_OPTION_IDS.map((optionId) => [optionId, question?.options?.[optionId]])),
      explanation: question?.explanation,
    };
  });
  const fingerprint = createHash("sha256").update(JSON.stringify(canonicalQuiz)).digest("hex");
  if (fingerprint !== expectedQuizFingerprints[locale]) {
    fail(`[${locale}] reviewed stable-ID quiz fingerprint changed: ${fingerprint}`);
  }
}
if (failures.length === quizGateFailureStart) {
  pass("all nine reviewed quiz bundles retain stable answer IDs and v2 semantics");
}

const staleCoreLabels = [
  /\bComposer\b/,
  /\bYOLO\b/,
  /\bBackground Agent\b/,
  /\.cursorrules\b/,
  /Ask Every Time/,
  /Run in Sandbox/,
];
const assessedQuiz = JSON.stringify(english.quiz);
for (const pattern of staleCoreLabels) {
  if (pattern.test(assessedQuiz)) fail(`assessed quiz contains stale product terminology: ${pattern}`);
}
for (const required of ["Agents Window", "Auto-review", "Allowlist", "Run Everything", ".cursor/rules", "Cloud Agents", "Privacy Mode"]) {
  if (!JSON.stringify(english).includes(required)) fail(`English course is missing current core term: ${required}`);
}

const accuracyLocks = [
  [english.meta.figureNote, "before any public release or redistribution", "figure publication-rights boundary"],
  [english.lessons["orient-privacy"].sections[0].body, "targets Cursor Desktop 3.17", "Desktop interface scope"],
  [english.lessons["orient-privacy"].sections[0].body, "Open IDE", "current return-to-editor command"],
  [english.lessons["orient-privacy"].sections[0].body, "Cursor CLI is a separate terminal surface", "CLI scope boundary"],
  [english.lessons["tab-inline-edit"].sections[1].body, "User Rules are not applied to Inline Edit", "Inline Edit rule scope"],
  [english.lessons["tab-inline-edit"].sections[1].body, "not an access or security boundary", "Inline Edit selection boundary"],
  [english.lessons["orient-privacy"].sections[1].body, "abuse detectors trigger", "Privacy Mode abuse-investigation exception"],
  [english.lessons["orient-privacy"].sections[1].body, "non-ZDR models", "Privacy Mode non-ZDR exception"],
  [english.lessons["orient-privacy"].sections[1].body, "do not treat it alone as a complete terminal or MCP boundary", ".cursorignore defence-in-depth boundary"],
  [english.lessons["rules-skills-mcp"].sections[1].body, "A Cursor Plugin can bundle", "Plugin supply-chain surface"],
  [english.lessons["rules-skills-mcp"].sections[2].body, "Only command-based pre-action Hooks", "Hooks deterministic decision boundary"],
  [english.lessons["rules-skills-mcp"].sections[2].body, "prompt-based Hooks", "Hooks model-evaluated decision boundary"],
  [english.lessons["rules-skills-mcp"].sections[2].body, "Hook failures are fail-open by default", "Hooks default failure mode"],
  [english.lessons["rules-skills-mcp"].sections[2].body, "failClosed", "Hooks fail-closed option"],
  [english.lessons["rules-skills-mcp"].sections[2].body, "Hooks cover only documented events", "Hooks event-coverage boundary"],
  [english.lessons["cloud-parallel"].sections[1].body, "context isolation is not file isolation", "Subagents shared-checkout boundary"],
  [english.lessons["cloud-parallel"].sections[1].body, "does not remove inherited write-capable MCP tools", "readonly Subagent external-tool boundary"],
  [english.lessons["cloud-parallel"].sections[2].body, "Do not assume that local Hooks run the same way in Cloud Agents", "Cloud Hooks transfer boundary"],
  [english.lessons["cloud-parallel"].sections[2].body, "create pull requests, use persistent memory, and use computer tools", "Automation default-capability boundary"],
  [english.lessons["software-studio"].sections[1].body, "enterprise administrator has enabled Browser Origin Allowlist", "Browser Origin Allowlist entitlement"],
  [english.lessons["software-studio"].sections[1].body, "best-effort layer", "Browser Origin Allowlist limitation"],
  [english.lessons["software-studio"].sections[1].body, "Browser cookies and web storage persist per workspace", "Browser persistent-state boundary"],
  [english.lessons["writing-studio"].sections[1].body, "shows a concrete implementation", "practitioner evidence effectiveness boundary"],
  [english.ui.receiptInstructions, "cannot prove that commands ran", "receipt non-attestation boundary"],
  [english.ui.receiptWrongHash, "course-fixture.json", "receipt fixture-manifest error boundary"],
  [english.quiz.q15.question, "file-isolation boundary", "Subagent isolation assessment"],
  [english.quiz.q15.explanation, "share the parent checkout by default", "Subagent shared-checkout assessment"],
  [english.quiz.q28.explanation, "does not replace their evidence", "capstone declared-results assessment"],
  [english.lessons["workflow-capstone"].sections[2].body, "is not proof that commands ran", "unsigned local receipt limitation"],
  [english.lessons["workflow-capstone"].sections[2].body, "not signed", "receipt trust model"],
];
for (const [copy, required, boundary] of accuracyLocks) {
  if (!copy.includes(required)) fail(`English course lost its locked ${boundary}: ${required}`);
}
if (JSON.stringify(english).includes("Rules and hooks are workflow guardrails, not security boundaries")) {
  fail("English course conflates non-deterministic Rules with blocking Hooks");
}
if (english.lessons["writing-studio"].sections[1].body.includes("shows the value")) {
  fail("English writing lesson infers effectiveness from an implementation example");
}
for (const figureId of ["fig-01", "fig-03"]) {
  const figure = CURSOR_FIGURES.find((item) => item.id === figureId);
  if (figure?.status !== "available"
    || figure.cursorVersion !== "Current Agents Window docs; Desktop 3.17 latest when checked") {
    fail(`${figureId} overstates image-level Desktop 3.17 provenance`);
  }
}
if (JSON.stringify(english.lessons["workflow-capstone"]).includes("machine-verifiable")) {
  fail("English capstone overclaims the unsigned client-side receipt as machine-verifiable proof");
}

const sourceIds = new Set(CURSOR_SOURCES.map((item) => item.id));
if (sourceIds.size !== CURSOR_SOURCES.length) fail("source IDs must be unique");
if (!CURSOR_SOURCES.some((item) => item.kind === "official-doc") || !CURSOR_SOURCES.some((item) => item.kind === "community-github")) {
  fail("source ledger must include both official product authority and community workflow evidence");
}
for (const source of CURSOR_SOURCES) {
  if (!source.url.startsWith("https://") || !source.exactAnchor.startsWith("https://")) fail(`${source.id} lacks HTTPS provenance`);
  if (source.kind === "community-github" && (!/^[a-f0-9]{40}$/.test(source.revision ?? "") || !source.license)) {
    fail(`${source.id} lacks an immutable commit revision or licence evidence`);
  }
  if ((source.kind === "community-github" || source.kind === "official-github")
    && source.revision
    && !source.exactAnchor.includes(source.revision)) {
    fail(`${source.id} exact anchor does not contain its recorded immutable revision`);
  }
  if (source.tier === "corroborating" && source.note.length < 20) fail(`${source.id} lacks an evidence-boundary note`);
}
const usedSourceIds = new Set([
  ...CURSOR_COURSE_MANIFEST.lessons.flatMap((lesson) => lesson.sourceIds),
  ...CURSOR_QUIZ.flatMap((question) => question.sourceIds),
]);
for (const source of CURSOR_SOURCES) {
  if (!usedSourceIds.has(source.id)) fail(`source ledger contains an orphaned record: ${source.id}`);
}
for (const context of [
  "cursor-agent-security",
  "cursor-security-hardening",
  "cursor-plugins",
  "cursor-subagents",
  "cursor-worktrees",
  "cursor-hooks",
  "github-metamask-design",
  "github-alibaba-hooks",
  "github-domain-agent",
  "github-strapi-docs",
  "github-product-managers",
  "github-tutor",
]) {
  if (!sourceIds.has(context)) fail(`required cross-context evidence source is absent: ${context}`);
}
const softwareSourceIds = CURSOR_COURSE_MANIFEST.lessons.find((lesson) => lesson.slug === "software-studio")?.sourceIds ?? [];
for (const sourceId of ["cursor-rules", "cursor-skills", "github-metamask-design"]) {
  if (!softwareSourceIds.includes(sourceId)) fail(`software-studio lost required claim-level provenance: ${sourceId}`);
}
const q08 = CURSOR_QUIZ.find((question) => question.id === "q08");
if (!q08 || q08.sourceIds.join("|") !== "cursor-planning") {
  fail("q08 must cite only the official planning source that supports conflict escalation");
}
pass("source ledger separates current official authority from revision-pinned practitioner patterns");

const figureIds = new Set();
for (const figure of CURSOR_FIGURES) {
  if (figure.status !== "available") {
    fail(`${figure.id} is not technically available`);
    continue;
  }
  if (figureIds.has(figure.id)) fail(`duplicate figure ID: ${figure.id}`);
  figureIds.add(figure.id);
  for (const localPath of [figure.src, figure.srcSet.webpLarge, figure.srcSet.webpSmall]) {
    const path = localPath.replace(/^\//, "");
    if (!existsSync(join(ROOT, "public", path.replace(/^courses\//, "courses/")))) {
      fail(`${figure.id} local asset missing: ${localPath}`);
    }
  }
  const masterPath = `public${figure.src}`;
  if (existsSync(join(ROOT, masterPath))) {
    if (digest(masterPath) !== figure.sha256) fail(`${figure.id} master SHA-256 mismatch`);
    const master = inspectPng(masterPath);
    if (!master.valid) fail(`${figure.id} master is not a well-formed PNG`);
    if (master.width !== figure.width || master.height !== figure.height) {
      fail(`${figure.id} intrinsic dimensions differ from the manifest`);
    }
    if (master.metadata.length) fail(`${figure.id} master contains embedded text or EXIF metadata: ${master.metadata.join(", ")}`);
  }
  for (const responsivePath of [figure.srcSet.webpLarge, figure.srcSet.webpSmall]) {
    const localPath = `public${responsivePath}`;
    if (!existsSync(join(ROOT, localPath))) continue;
    const responsive = inspectWebp(localPath);
    if (!responsive.valid) fail(`${figure.id} responsive asset is not a well-formed WebP: ${responsivePath}`);
    if (responsive.metadata.length) fail(`${figure.id} responsive asset contains EXIF or XMP metadata: ${responsivePath}`);
  }
  if (!figure.sourceUrl.startsWith("https://") || !figure.sourcePageUrl.startsWith("https://")) fail(`${figure.id} lacks first-party provenance`);
  if (/\.mp4(?:$|\?)/.test(figure.sourceUrl)) {
    if (!/^[a-f0-9]{64}$/.test(figure.sourceAssetSha256 ?? "")) fail(`${figure.id} lacks a source video SHA-256`);
    if (typeof figure.frameTimeSeconds !== "number" || !Number.isFinite(figure.frameTimeSeconds) || figure.frameTimeSeconds < 0) {
      fail(`${figure.id} lacks a valid source-video frame timestamp`);
    }
  }
  if (figure.visiblePublicDemoIdentifiers?.some((item) => !item.trim())) fail(`${figure.id} has a blank public-demo identifier disclosure`);
  if (figure.privacyChecklist.some((item) => /no .*private repository content/i.test(item))) {
    fail(`${figure.id} privacy checklist overclaims the absence of publicly disclosed demo repository identifiers`);
  }
  if (!figure.copyrightNotice.includes("Anysphere") || !figure.copyrightNotice.includes("not affiliated")) fail(`${figure.id} lacks rights and independence notice`);
  if (figure.privacyReviewed !== true || figure.privacyChecklist.length < 3) fail(`${figure.id} lacks completed privacy review`);
  if (figure.uiFreshness === "historical-interface" && !english.figures[figure.id].caption.toLowerCase().includes("historical")) {
    fail(`${figure.id} historical interface is not disclosed in its teaching caption`);
  }
}
const usedFigures = CURSOR_COURSE_MANIFEST.lessons.flatMap((lesson) => lesson.figureIds);
if (usedFigures.length !== 14 || new Set(usedFigures).size !== 14) fail("every lesson must use exactly one unique authentic figure");
if ([...figureIds].some((id) => !usedFigures.includes(id))) fail("figure ledger contains an unused figure");
pass("14 real first-party Cursor figures are technically present, integrity-checked, privacy-reviewed, and source-attributed");

for (const required of [
  "app/[locale]/cursor/page.tsx",
  "app/[locale]/cursor/[lesson]/page.tsx",
  "lib/cursor/seo.ts",
  "examples/cursor-course-demo/course-fixture.json",
  "outputs/cursor-course-research-brief.md",
  "outputs/cursor-course-research-brief.provenance.md",
  "public/courses/cursor/aicourse-cursor-demo-v1.zip",
  "public/courses/cursor/aicourse-cursor-demo-v1.sha256",
  "public/courses/cursor/CAPSTONE_CONTRACT.md",
  "public/courses/cursor/THIRD_PARTY_NOTICES.md",
]) {
  if (!existsSync(join(ROOT, required))) fail(`required course file missing: ${required}`);
}
const fixturePath = "examples/cursor-course-demo/course-fixture.json";
const fixtureArchiveFiles = [
  ".gitignore",
  "LICENSE",
  "README.md",
  "app/courses/page.tsx",
  "app/layout.tsx",
  "app/page.tsx",
  "app/styles.css",
  "components/CourseList.tsx",
  "course-fixture.json",
  "eslint.config.mjs",
  "lib/courses.ts",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "scripts/course-verify.mjs",
  "tests/CourseList.test.tsx",
  "tsconfig.json",
];
const fixtureIgnoredNames = new Set([".DS_Store", ".next", "course-receipt.json", "next-env.d.ts", "node_modules", "out"]);
function listFixtureSourceFiles(directory, base = directory) {
  return readdirSync(join(ROOT, directory), { withFileTypes: true }).flatMap((entry) => {
    if (fixtureIgnoredNames.has(entry.name)) return [];
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listFixtureSourceFiles(path, base);
    return [relative(base, path)];
  });
}
const fixtureSourceFiles = listFixtureSourceFiles("examples/cursor-course-demo").sort();
if (fixtureSourceFiles.join("|") !== [...fixtureArchiveFiles].sort().join("|")) {
  fail(`capstone fixture source differs from the explicit 17-file archive allowlist: ${fixtureSourceFiles.join(", ")}`);
}
if (digest(fixturePath) !== CURSOR_CAPSTONE_FIXTURE_SHA256) fail("capstone fixture manifest SHA-256 differs from the receipt contract");
const verifier = text("examples/cursor-course-demo/scripts/course-verify.mjs");
if (!verifier.includes(CURSOR_CAPSTONE_FIXTURE_SHA256)) fail("fixture verifier is not pinned to the published fixture hash");
for (const check of CURSOR_CAPSTONE_REQUIRED_CHECKS) {
  if (!verifier.includes(check)) fail(`fixture verifier is missing check: ${check}`);
}
const fixturePackage = json("examples/cursor-course-demo/package.json");
const fixtureTests = text("examples/cursor-course-demo/tests/CourseList.test.tsx");
if (fixturePackage.scripts?.["test:keyboard"] !== "node --import tsx --test --test-name-pattern=keyboard-contract tests/CourseList.test.tsx"
  || !verifier.includes('const keyboardBehavior = run("test:keyboard")')) {
  fail("fixture keyboardBehavior must be derived from the named keyboard-contract tests");
}
for (const token of ["transitionFilter", "renderToStaticMarkup", 'aria-pressed="true"']) {
  if (!fixtureTests.includes(token)) fail(`fixture keyboard-contract tests are missing the behavioral token: ${token}`);
}
const archiveChecksum = text("public/courses/cursor/aicourse-cursor-demo-v1.sha256").trim().split(/\s+/)[0];
if (archiveChecksum !== digest("public/courses/cursor/aicourse-cursor-demo-v1.zip")) fail("starter archive checksum file does not match the archive");
if (archiveChecksum !== CURSOR_CAPSTONE_ARCHIVE_SHA256) fail("published archive checksum differs from the learner-facing capstone contract");
try {
  const archivePath = join(ROOT, "public/courses/cursor/aicourse-cursor-demo-v1.zip");
  const members = capture("unzip", ["-Z1", archivePath]).toString("utf8").split(/\r?\n/).filter(Boolean);
  if (members.join("|") !== fixtureArchiveFiles.join("|")) {
    fail(`published starter archive members differ from the explicit fixture allowlist: ${members.join(", ")}`);
  } else {
    for (const fileName of fixtureArchiveFiles) {
      const archived = capture("unzip", ["-p", archivePath, fileName]);
      const source = readFileSync(join(ROOT, "examples/cursor-course-demo", fileName));
      if (!archived.equals(source)) fail(`published starter archive member differs from fixture source: ${fileName}`);
    }
  }
} catch (error) {
  fail(`published starter archive could not be inspected: ${error instanceof Error ? error.message : String(error)}`);
}
const capstoneContract = text("public/courses/cursor/CAPSTONE_CONTRACT.md");
if (!capstoneContract.includes(CURSOR_CAPSTONE_ARCHIVE_SHA256)
  || !capstoneContract.includes(CURSOR_CAPSTONE_FIXTURE_SHA256)
  || !capstoneContract.includes("cursor.capstoneMeta.v1")
  || !capstoneContract.includes("cursor.capstoneAssessment.v1")
  || !capstoneContract.includes("aicourse.cursor.progress.v1")
  || !/score must reach 80\/100/i.test(capstoneContract)
  || !/unsigned local structural self-check/i.test(capstoneContract)
  || !/not proof that commands ran/i.test(capstoneContract)) {
  fail("public capstone contract does not lock both hashes and the unsigned non-attestation boundary");
}
if (!verifier.includes("rmSync(RECEIPT_FILE, { force: true })")) {
  fail("fixture verifier does not remove a stale passing receipt before current checks");
}
const mediaNotice = text("public/courses/cursor/THIRD_PARTY_NOTICES.md");
if (!/not covered by\s+this repository's MIT licence/i.test(mediaNotice)
  || !/not affiliated with\s+or endorsed by Cursor/i.test(mediaNotice)
  || !/status:\s*`?available`?.*technical.*does not mean publication rights are cleared/is.test(mediaNotice)
  || !/before\s+any public release\s+or redistribution/i.test(mediaNotice)) {
  fail("Cursor media notice does not clearly separate third-party rights from the repository licence");
}
pass("capstone fixture, verifier, archive, checksum, and receipt contract agree");

const namespaceFiles = [
  ...listFiles("app/[locale]/cursor"),
  ...listFiles("components/cursor"),
  ...listFiles("lib/cursor"),
  "scripts/check-cursor-course.mjs",
];
for (const path of namespaceFiles) {
  const value = text(path);
  if (/from\s+["']@\/lib\/(?:codex|claude|grok|github)/.test(value)) fail(`${path} imports another product course namespace`);
  if (/<(?:img|source)[^>]+(?:src|srcSet)=["']https?:\/\//i.test(value)) fail(`${path} loads remote runtime media`);
  if (/\bsk-(?:proj-)?[A-Za-z0-9_-]{16,}\b/.test(value)) fail(`${path} contains a secret-like token`);
}
pass("Cursor slice is namespace-isolated and contains no remote runtime image references or secret-like tokens");

const appPage = text("app/[locale]/cursor/page.tsx");
const lessonPage = text("app/[locale]/cursor/[lesson]/page.tsx");
for (const token of ["generateStaticParams", "dynamicParams = false", "Course", "BreadcrumbList"]) {
  if (!appPage.includes(token)) fail(`dashboard route is missing ${token}`);
}
for (const token of ["generateStaticParams", "dynamicParams = false", "LearningResource", "BreadcrumbList"]) {
  if (!lessonPage.includes(token)) fail(`lesson route is missing ${token}`);
}
if (!text("components/cursor/LessonView.tsx").includes("LessonKnowledgeCheck")) {
  fail("lesson route does not render the two-question formative knowledge check");
}
const completionSummary = text("components/cursor/CompletionSummary.tsx");
const capstoneReceipt = text("components/cursor/CapstoneReceipt.tsx");
const progressStore = text("components/cursor/progress-store.ts");
for (const token of [
  "applyCursorProgressPatch",
  "navigator.locks.request",
  "CURSOR_PROGRESS_LOCK_NAME",
  "readCursorRecordForCommit",
  "patchSatisfied",
  "attempt < 3",
]) {
  if (!progressStore.includes(token)) fail(`Cursor progress store lost cross-tab merge safeguard: ${token}`);
}
if (progressStore.includes("updateCourseProgress(")) {
  fail("Cursor progress store reintroduced an arbitrary record updater");
}
for (const token of [
  "copy.artifacts",
  "copy.rubric",
  "config.passingScore",
  "criticalRubricReady",
  "CURSOR_CAPSTONE_META_PROGRESS_KEY",
  "CURSOR_CAPSTONE_PROGRESS_META",
  "CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY",
  "createCursorCapstoneProgressAssessment",
  "labels.learnerSelfAssessment",
]) {
  if (!capstoneReceipt.includes(token)) fail(`capstone assessment or version-matched progress gate is missing ${token}`);
}
for (const boundary of [
  "capstoneReceiptFormatChecked: true",
  "capstoneReceiptContractMatched: CURSOR_CAPSTONE_PROGRESS_META",
  "capstoneSelfAssessment",
  "evidenceReviewedBySite: false",
  "selfReported: true",
  "attestation: false",
  "credential: false",
]) {
  if (!completionSummary.includes(boundary)) fail(`completion export lost trust boundary: ${boundary}`);
}
if (completionSummary.includes("capstoneReceiptVerified")) fail("completion export overclaims receipt verification");
const cursorSeo = text("lib/cursor/seo.ts");
if (!cursorSeo.includes("x-default")) fail("Cursor SEO helper lacks x-default hreflang");
if (!cursorSeo.includes("alternateLocale") || !cursorSeo.includes("CURSOR_OPEN_GRAPH_LOCALES[input.locale]")) {
  fail("Cursor SEO helper lacks mapped primary and alternate Open Graph locales");
}
pass("static dashboard and lesson routes expose localised metadata and structured data hooks");

const imageCount = listFiles("public/courses/cursor").filter((path) => /fig-\d{2}-(?:master\.png|1600\.webp|960\.webp)$/.test(path)).length;
if (imageCount !== 42) fail(`expected 42 responsive figure assets, found ${imageCount}`);
for (const path of listFiles("public/courses/cursor")) {
  if (statSync(join(ROOT, path)).size === 0) fail(`${path} is empty`);
}

const rightsReviewRequired = CURSOR_FIGURES.filter(
  (item) => item.status === "available" && item.rightsStatus === "rights-review-required",
);
if (rightsReviewRequired.length) {
  const ids = rightsReviewRequired.map((item) => item.id).join(", ");
  const message = `${rightsReviewRequired.length} first-party Cursor figures are technically available but lack an evidence-bearing publication-rights determination: ${ids}`;
  if (release) fail(message);
  else warn(message);
}
if (release && (CURSOR_COURSE_MANIFEST.publicationStatus !== "published" || CURSOR_COURSE_MANIFEST.publishedOn === null)) {
  fail("release mode requires publicationStatus=published and a non-null publication date");
}
if (failures.length) {
  console.error("\nCursor course validation failed:");
  failures.forEach((message) => console.error(`FAIL  ${message}`));
  process.exit(1);
}
console.log(`\nCursor course validation passed${release ? " (release mode)" : ""}.`);
