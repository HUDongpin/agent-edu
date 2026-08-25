#!/usr/bin/env node

/**
 * Deterministic, offline release gate for Course 6: How to Use GitHub.
 *
 * It validates the curriculum, all nine locale bundles, the source and figure
 * ledgers, local image hashes, quiz stratification, routes, SEO registration,
 * and catalogue wiring. It intentionally does not fetch the web, so a release
 * result can be reproduced without credentials or network access.
 *
 *   node scripts/check-github-course.mjs
 *   node scripts/check-github-course.mjs --release
 *   node scripts/check-github-course.mjs --json
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { publishedReleaseIntegrationErrors } from "./lib/published-release-contract.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE = process.argv.includes("--release");
const JSON_OUTPUT = process.argv.includes("--json");
const PUBLISHED_ON = "2026-08-23";
const SNAPSHOT_ON = "2026-08-24";
const SOURCE_COMMIT = "4f8c3170cea7f72cf41fc976f5dbf4e8a0b8567f";

const EXPECTED_LOCALES = [
  "en",
  "es",
  "fr",
  "de",
  "zh-Hans",
  "zh-Hant",
  "ja",
  "ko",
  "ar",
];
const EXPECTED_UNITS = ["unit-1", "unit-2", "unit-3"];
const EXPECTED_LESSONS = [
  "start-secure",
  "repository-readme",
  "branches-commits",
  "pull-requests-reviews",
  "issues-discussions",
  "projects-office-work",
  "forks-conflicts",
  "notifications-governance",
  "software-automation",
  "research-reproducibility",
  "writing-publishing",
  "teaching-capstone",
];
const EXPECTED_QUIZ_IDS = Array.from(
  { length: 24 },
  (_, index) => `q${String(index + 1).padStart(2, "0")}`,
);
const EXPECTED_CORRECT_INDEXES = {
  q01: 1,
  q02: 2,
  q03: 0,
  q04: 3,
  q05: 1,
  q06: 2,
  q07: 0,
  q08: 3,
  q09: 2,
  q10: 1,
  q11: 0,
  q12: 3,
  q13: 1,
  q14: 2,
  q15: 0,
  q16: 3,
  q17: 2,
  q18: 1,
  q19: 0,
  q20: 3,
  q21: 1,
  q22: 2,
  q23: 0,
  q24: 3,
};
const EXPECTED_FIGURE_IDS = Array.from(
  { length: 21 },
  (_, index) => `fig-${String(index + 1).padStart(2, "0")}`,
);
const EXPECTED_SOURCE_COUNT = 44;
const EXPECTED_DURATION = 660;

const errors = [];
const warnings = [];
const fail = (message) => errors.push(message);

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function readJson(relativePath) {
  try {
    return JSON.parse(readFileSync(join(ROOT, relativePath), "utf8"));
  } catch (error) {
    fail(`${relativePath}: invalid or missing JSON (${error.message})`);
    return null;
  }
}

function readText(relativePath) {
  try {
    return readFileSync(join(ROOT, relativePath), "utf8");
  } catch (error) {
    fail(`${relativePath}: cannot be read (${error.message})`);
    return "";
  }
}

function exactSet(actual, expected, label) {
  const a = [...new Set(actual)].sort();
  const e = [...new Set(expected)].sort();
  if (JSON.stringify(a) !== JSON.stringify(e)) {
    const missing = e.filter((value) => !a.includes(value));
    const extra = a.filter((value) => !e.includes(value));
    fail(
      `${label}: missing ${missing.join(", ") || "none"}; extra ${extra.join(", ") || "none"}`,
    );
  }
  if (actual.length !== a.length) fail(`${label}: duplicate values found`);
}

function isHttps(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function shape(value) {
  if (Array.isArray(value)) return ["array", value.length, ...value.map(shape)];
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, shape(value[key])]),
    );
  }
  return typeof value;
}

function leafEntries(value, path = "", output = {}) {
  if (typeof value === "string") output[path] = value;
  else if (Array.isArray(value))
    value.forEach((item, index) =>
      leafEntries(item, `${path}[${index}]`, output),
    );
  else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      leafEntries(item, path ? `${path}.${key}` : key, output);
    }
  }
  return output;
}

function validateStrings(value, label) {
  if (typeof value === "string") {
    if (!value.trim()) fail(`${label}: empty string`);
    if (/[\u2013\u2014]/u.test(value))
      fail(`${label}: use a hyphen or rewrite instead of an en/em dash`);
    if (/\b(?:TODO|TBD)\b|\[(?:translation|translate)|�/u.test(value))
      fail(`${label}: placeholder or replacement character found`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateStrings(item, `${label}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value))
      validateStrings(item, `${label}.${key}`);
  }
}

function pngDimensions(buffer) {
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature)
    return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function publicPath(value) {
  return join(ROOT, "public", String(value).replace(/^\//, ""));
}

function loadLedgers() {
  const tsxLoader = join(ROOT, "node_modules", "tsx", "dist", "loader.mjs");
  if (!existsSync(tsxLoader)) {
    fail("the local tsx loader is required to import the Course 6 ledgers");
    return null;
  }
  const expression = [
    'import { GITHUB_COURSE_MANIFEST } from "./lib/github/manifest.ts";',
    'import { GITHUB_SOURCES } from "./lib/github/sources.ts";',
    'import { GITHUB_FIGURES } from "./lib/github/figures.ts";',
    'import { GITHUB_QUIZ, GITHUB_FINAL_QUIZ } from "./lib/github/quiz.ts";',
    'import { GITHUB_LOCALES, GITHUB_LESSON_SLUGS, GITHUB_QUIZ_IDS, GITHUB_FIGURE_IDS, GITHUB_SOURCE_IDS } from "./lib/github/types.ts";',
    "process.stdout.write(JSON.stringify({manifest:GITHUB_COURSE_MANIFEST,sources:GITHUB_SOURCES,figures:GITHUB_FIGURES,quiz:GITHUB_QUIZ,finalQuiz:GITHUB_FINAL_QUIZ,locales:GITHUB_LOCALES,lessonIds:GITHUB_LESSON_SLUGS,quizIds:GITHUB_QUIZ_IDS,figureIds:GITHUB_FIGURE_IDS,sourceIds:GITHUB_SOURCE_IDS}));",
  ].join(" ");
  const result = spawnSync(
    process.execPath,
    ["--import", tsxLoader, "--eval", expression],
    {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    },
  );
  if (result.error || result.status !== 0) {
    fail(
      `Course 6 TypeScript ledgers could not be imported: ${result.error?.message || result.stderr.trim() || `exit ${result.status}`}`,
    );
    return null;
  }
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    fail(`Course 6 TypeScript ledger output is invalid JSON: ${error.message}`);
    return null;
  }
}

function validateCopy(locale, copy, english) {
  if (!copy) return;
  validateStrings(copy, `messages/github/${locale}.json`);
  if (
    english &&
    JSON.stringify(shape(copy)) !== JSON.stringify(shape(english))
  ) {
    fail(`messages/github/${locale}.json: structure differs from English`);
    return;
  }
  if (locale !== "en" && english) {
    const enLeaves = leafEntries(english);
    const leaves = leafEntries(copy);
    const paths = Object.keys(enLeaves).filter(
      (path) => !path.endsWith(".code.value"),
    );
    const changed = paths.filter(
      (path) => leaves[path] !== enLeaves[path],
    ).length;
    if (changed / paths.length < 0.75) {
      fail(
        `messages/github/${locale}.json: appears to contain excessive English fallback (${changed}/${paths.length} changed leaves)`,
      );
    }
    const canonicalLiteralPaths = Object.keys(enLeaves).filter(
      (path) =>
        /^capstone\.artifacts\[\d+\]\.id$/.test(path) ||
        /\.code\.(?:language|value)$/.test(path) ||
        path === "quiz.q06.options[3]",
    );
    for (const path of canonicalLiteralPaths) {
      if (leaves[path] !== enLeaves[path])
        fail(
          `messages/github/${locale}.json: canonical LTR fixture changed at ${path}`,
        );
    }
  }

  exactSet(
    Object.keys(copy.units ?? {}),
    EXPECTED_UNITS,
    `${locale} unit keys`,
  );
  exactSet(
    Object.keys(copy.lessons ?? {}),
    EXPECTED_LESSONS,
    `${locale} lesson keys`,
  );
  exactSet(
    Object.keys(copy.quiz ?? {}),
    EXPECTED_QUIZ_IDS,
    `${locale} quiz keys`,
  );
  exactSet(
    Object.keys(copy.figures ?? {}),
    EXPECTED_FIGURE_IDS,
    `${locale} figure keys`,
  );

  for (const slug of EXPECTED_LESSONS) {
    const lesson = copy.lessons?.[slug];
    if (!lesson) continue;
    if (!Array.isArray(lesson.sections) || lesson.sections.length !== 3)
      fail(`${locale}.${slug}: exactly three sections required`);
    for (const [index, section] of (lesson.sections ?? []).entries()) {
      if (!Array.isArray(section.body) || section.body.length < 2)
        fail(
          `${locale}.${slug}.sections[${index}]: at least two explanatory paragraphs required`,
        );
      if (
        section.bullets &&
        (!Array.isArray(section.bullets) || section.bullets.length < 3)
      )
        fail(
          `${locale}.${slug}.sections[${index}]: bullet sets require at least three items`,
        );
    }
    if (
      !Array.isArray(lesson.practice?.steps) ||
      lesson.practice.steps.length < 4
    )
      fail(`${locale}.${slug}: practice requires at least four steps`);
    if (
      !Array.isArray(lesson.practice?.evidence) ||
      lesson.practice.evidence.length < 3
    )
      fail(
        `${locale}.${slug}: practice requires at least three evidence checks`,
      );
  }
  for (const id of EXPECTED_QUIZ_IDS) {
    if (copy.quiz?.[id]?.options?.length !== 4)
      fail(`${locale}.${id}: exactly four options required`);
  }
  if (!Array.isArray(copy.capstone?.steps) || copy.capstone.steps.length < 5)
    fail(`${locale}.capstone: at least five implementation steps required`);
  if (copy.capstone?.artifacts?.length !== 8)
    fail(`${locale}.capstone: exactly eight artifact checks required`);
}

function validateManifest(data) {
  const { manifest, sources, figures, quiz, finalQuiz } = data;
  if (manifest.id !== "how-to-use-github")
    fail(`manifest.id: expected how-to-use-github, found ${manifest.id}`);
  if (manifest.sequence !== 6)
    fail(`manifest.sequence: expected 6, found ${manifest.sequence}`);
  if (manifest.version !== "1.0.0")
    fail(`manifest.version: expected 1.0.0, found ${manifest.version}`);
  if (manifest.publishedOn !== PUBLISHED_ON)
    fail(`manifest publishedOn must remain ${PUBLISHED_ON}`);
  if (manifest.sourceSnapshotOn !== SNAPSHOT_ON)
    fail(`manifest sourceSnapshotOn must be ${SNAPSHOT_ON}`);
  exactSet(data.locales, EXPECTED_LOCALES, "locale registry");
  exactSet(data.lessonIds, EXPECTED_LESSONS, "lesson type registry");
  exactSet(data.quizIds, EXPECTED_QUIZ_IDS, "quiz type registry");
  exactSet(data.figureIds, EXPECTED_FIGURE_IDS, "figure type registry");
  exactSet(
    manifest.units.map((unit) => unit.id),
    EXPECTED_UNITS,
    "manifest unit ids",
  );
  exactSet(
    manifest.lessons.map((lesson) => lesson.slug),
    EXPECTED_LESSONS,
    "manifest lesson ids",
  );
  if (manifest.units.length !== 3)
    fail(`manifest: expected 3 units, found ${manifest.units.length}`);
  if (manifest.lessons.length !== 12)
    fail(`manifest: expected 12 lessons, found ${manifest.lessons.length}`);
  const duration = manifest.lessons.reduce(
    (total, lesson) => total + lesson.minutes,
    0,
  );
  if (duration !== EXPECTED_DURATION)
    fail(`manifest: expected ${EXPECTED_DURATION} minutes, found ${duration}`);

  const usedQuiz = [];
  const usedFigures = [];
  const usedSources = [];
  for (const [index, lesson] of manifest.lessons.entries()) {
    const label = `manifest.lessons[${index}]`;
    if (lesson.order !== index + 1 || lesson.slug !== EXPECTED_LESSONS[index])
      fail(`${label}: course order is not stable`);
    const expectedPrerequisites =
      index === 0 ? [] : [EXPECTED_LESSONS[index - 1]];
    if (
      JSON.stringify(lesson.prerequisites) !==
      JSON.stringify(expectedPrerequisites)
    )
      fail(`${label}: prerequisite must be the immediately preceding lesson`);
    if (lesson.quizIds.length !== 2)
      fail(`${label}: exactly two lesson questions required`);
    if (
      lesson.sections.length !== 3 ||
      lesson.sections.map((section) => section.copyIndex).join(",") !== "0,1,2"
    )
      fail(`${label}: section contract must be 0,1,2`);
    usedQuiz.push(...lesson.quizIds);
    usedFigures.push(
      ...lesson.sections.flatMap((section) => section.figureIds),
    );
    usedSources.push(...lesson.sourceIds);
  }
  exactSet(usedQuiz, EXPECTED_QUIZ_IDS, "quiz questions assigned to lessons");
  exactSet(usedFigures, EXPECTED_FIGURE_IDS, "figures assigned to lessons");
  const projects = manifest.lessons.find(
    (lesson) => lesson.slug === "projects-office-work",
  );
  if (
    JSON.stringify(projects?.sections?.[0]?.figureIds) !== "[]" ||
    JSON.stringify(projects?.sections?.[1]?.figureIds) !==
      JSON.stringify(["fig-12", "fig-13"])
  )
    fail(
      "figure placement: Project table and board must support the views section",
    );
  const writing = manifest.lessons.find(
    (lesson) => lesson.slug === "writing-publishing",
  );
  if (
    JSON.stringify(writing?.sections?.[1]?.figureIds) !== "[]" ||
    JSON.stringify(writing?.sections?.[2]?.figureIds) !==
      JSON.stringify(["fig-17"])
  )
    fail("figure placement: Releases link must support the publishing section");
  const unusedSources = data.sourceIds.filter(
    (id) => !new Set(usedSources).has(id),
  );
  if (JSON.stringify(unusedSources) !== JSON.stringify(["github-docs-license"]))
    fail(
      `source coverage: only github-docs-license may be course-level only; found ${unusedSources.join(", ") || "none"}`,
    );

  validateSources(sources, data.sourceIds);
  validateFigures(figures, manifest);
  validateQuiz(quiz, finalQuiz, manifest);
}

function validateSources(sources, sourceIds) {
  if (sources.length !== EXPECTED_SOURCE_COUNT)
    fail(`sources: expected ${EXPECTED_SOURCE_COUNT}, found ${sources.length}`);
  exactSet(
    sources.map((source) => source.id),
    sourceIds,
    "source ledger ids",
  );
  const urls = [];
  let primaryCount = 0;
  for (const source of sources) {
    const label = `source ${source.id}`;
    if (!isHttps(source.url)) fail(`${label}: URL must be HTTPS`);
    if (
      source.accessedOn !== SNAPSHOT_ON ||
      !String(source.verifiedAt).startsWith(SNAPSHOT_ON)
    )
      fail(`${label}: access and verification dates must match snapshot`);
    if (!Array.isArray(source.claimIds) || !source.claimIds.length)
      fail(`${label}: claimIds required`);
    if (!String(source.note || "").trim())
      fail(`${label}: evidence-boundary note required`);
    if (source.tier === "primary") primaryCount += 1;
    if (
      source.reuseMode === "asset-reused" &&
      !String(source.licence || "").includes("CC-BY-4.0")
    )
      fail(`${label}: reused asset needs its CC-BY-4.0 licence`);
    urls.push(source.url);
  }
  if (new Set(urls).size !== urls.length) fail("sources: duplicate URLs found");
  if (primaryCount < 25)
    fail(`sources: official/primary spine is too small (${primaryCount})`);
  const researchCase = sources.find(
    (source) => source.id === "plos-research-lab",
  );
  if (
    researchCase?.title !==
    "GitHub enables collaborative and reproducible laboratory research"
  ) {
    fail(
      "source plos-research-lab: title must match the published PLOS Biology article",
    );
  }
}

function validateFigures(figures, manifest) {
  if (figures.length !== 21)
    fail(`figures: expected 21, found ${figures.length}`);
  exactSet(
    figures.map((figure) => figure.id),
    EXPECTED_FIGURE_IDS,
    "figure ledger ids",
  );
  const referencedBy = new Map();
  for (const lesson of manifest.lessons) {
    for (const id of lesson.sections.flatMap((section) => section.figureIds))
      referencedBy.set(id, lesson.slug);
  }
  const hashes = [];
  for (const figure of figures) {
    const label = `figure ${figure.id}`;
    if (figure.lessonSlug !== referencedBy.get(figure.id))
      fail(`${label}: lesson assignment differs from manifest`);
    if (
      figure.sourceCommit !== SOURCE_COMMIT ||
      !String(figure.immutableSourceUrl).includes(SOURCE_COMMIT)
    )
      fail(`${label}: immutable source is not pinned to the audited commit`);
    if (
      !String(figure.sourceUrl).startsWith("https://docs.github.com/assets/") ||
      !String(figure.sourcePage).startsWith("https://docs.github.com/")
    )
      fail(`${label}: source must be a GitHub Docs asset and page`);
    if (figure.sourceLicence !== "CC-BY-4.0" || figure.privacyReviewed !== true)
      fail(`${label}: licence or privacy review is incomplete`);
    if (figure.observedOn !== SNAPSHOT_ON)
      fail(`${label}: observation date differs from the source snapshot`);

    const pngPath = publicPath(figure.src);
    const webpPath = publicPath(figure.webpSrc);
    if (!existsSync(pngPath)) {
      fail(`${label}: missing ${figure.src}`);
      continue;
    }
    if (!existsSync(webpPath)) fail(`${label}: missing ${figure.webpSrc}`);
    const png = readFileSync(pngPath);
    const dimensions = pngDimensions(png);
    if (
      !dimensions ||
      dimensions.width !== figure.width ||
      dimensions.height !== figure.height
    )
      fail(`${label}: PNG dimensions do not match the ledger`);
    const digest = sha256(png);
    if (digest !== figure.sha256)
      fail(`${label}: SHA-256 mismatch (${digest})`);
    if (!/^[a-f0-9]{64}$/.test(figure.sha256))
      fail(`${label}: invalid SHA-256 format`);
    hashes.push(figure.sha256);
    if (existsSync(webpPath)) {
      const webp = readFileSync(webpPath);
      if (
        webp.length < 1000 ||
        webp.subarray(0, 4).toString("ascii") !== "RIFF" ||
        webp.subarray(8, 12).toString("ascii") !== "WEBP"
      )
        fail(`${label}: invalid WebP derivative`);
    }
  }
  if (new Set(hashes).size !== hashes.length)
    fail("figures: duplicate PNG content found");
  const files = readdirSync(join(ROOT, "public/courses/github/figures"));
  const rasterFiles = files.filter((file) =>
    [".png", ".webp"].includes(extname(file)),
  );
  if (rasterFiles.length !== 42)
    fail(
      `figures directory: expected 42 raster files, found ${rasterFiles.length}`,
    );
}

function validateQuiz(quiz, finalQuiz, manifest) {
  if (quiz.length !== 24)
    fail(`quiz: expected 24 questions, found ${quiz.length}`);
  exactSet(
    quiz.map((question) => question.id),
    EXPECTED_QUIZ_IDS,
    "quiz ledger ids",
  );
  const lessonBySlug = new Map(
    manifest.lessons.map((lesson) => [lesson.slug, lesson]),
  );
  const unitCounts = Object.fromEntries(
    EXPECTED_UNITS.map((unit) => [unit, 0]),
  );
  for (const question of quiz) {
    const lesson = lessonBySlug.get(question.lessonSlug);
    if (!lesson || lesson.unitId !== question.unitId)
      fail(`quiz ${question.id}: lesson/unit mismatch`);
    if (
      !Number.isInteger(question.correctIndex) ||
      question.correctIndex < 0 ||
      question.correctIndex > 3
    )
      fail(`quiz ${question.id}: correctIndex must be 0 through 3`);
    if (question.correctIndex !== EXPECTED_CORRECT_INDEXES[question.id])
      fail(`quiz ${question.id}: fact-checked correctIndex changed`);
    if (
      !question.sourceIds.length ||
      question.sourceIds.some((id) => !lesson?.sourceIds.includes(id))
    )
      fail(`quiz ${question.id}: evidence must be available in its lesson`);
    unitCounts[question.unitId] += 1;
  }
  for (const id of ["q02", "q12"]) {
    const question = quiz.find((candidate) => candidate.id === id);
    if (
      JSON.stringify(question?.sourceIds) !==
      JSON.stringify(["github-sensitive-data"])
    )
      fail(`quiz ${id}: displayed evidence must match the assessed claim`);
  }
  if (
    !quiz
      .find((question) => question.id === "q20")
      ?.sourceIds.includes("github-immutable-releases")
  )
    fail("quiz q20: immutable-release lifecycle source is required");
  if (
    JSON.stringify(unitCounts) !==
    JSON.stringify({ "unit-1": 8, "unit-2": 8, "unit-3": 8 })
  )
    fail(
      `quiz: bank must contain eight questions per unit; found ${JSON.stringify(unitCounts)}`,
    );
  if (
    finalQuiz.questionCount !== 12 ||
    finalQuiz.questionsPerUnit !== 4 ||
    finalQuiz.passingCorrectAnswers !== 10
  )
    fail(
      "final quiz: required contract is 12 questions, four per unit, pass at 10 correct",
    );
  if (finalQuiz.bankVersion !== "github-quiz-2026-08-23-v2")
    fail("final quiz: corrected question bank must use the v2 storage version");
  for (const key of [
    finalQuiz.bestScoreStorageKey,
    finalQuiz.passedStorageKey,
    finalQuiz.versionStorageKey,
  ]) {
    if (!String(key).startsWith("github.quiz."))
      fail(`final quiz: storage key ${key} is not Course 6 scoped`);
  }
}

function validateCurrentClaims(copy) {
  if (!copy) return;
  const account = copy.lessons?.["start-secure"]?.sections?.[1];
  if (
    account?.heading !== "Secure the account associated with your work" ||
    !account.body?.[0]?.includes("TOTP authenticator application") ||
    !account.body?.[0]?.includes("security key as a backup method") ||
    !account.body?.[1]?.includes("commit-header email") ||
    !account.body?.[1]?.includes("connected to that account") ||
    !account.body?.[1]?.includes("GitHub-provided `noreply`") ||
    !account.body?.[1]?.includes("GPG, SSH, or S/MIME")
  ) {
    fail(
      "English current-claim contract: account security, attribution, signing, or 2FA sequence regressed",
    );
  }

  const reviewGate =
    copy.lessons?.["pull-requests-reviews"]?.sections?.[2]?.body?.[0] ?? "";
  const reviewCheckpoint =
    copy.lessons?.["pull-requests-reviews"]?.checkpoint?.answer ?? "";
  if (
    !reviewGate.includes("Require a pull request") ||
    !reviewGate.includes("write, admin, or owner") ||
    !reviewGate.includes("separate gates") ||
    !reviewCheckpoint.includes("write, admin, or owner") ||
    !reviewCheckpoint.includes("separate merge gates")
  ) {
    fail(
      "English current-claim contract: Request changes merge-gate conditions regressed",
    );
  }

  const issueLinking =
    copy.lessons?.["issues-discussions"]?.sections?.[2]?.body?.[0] ?? "";
  if (
    !issueLinking.includes("pull-request description") ||
    !issueLinking.includes("commit message instead") ||
    !issueLinking.includes("does not show the pull request as linked")
  ) {
    fail(
      "English current-claim contract: issue-closing keyword semantics regressed",
    );
  }

  const actions = copy.lessons?.["software-automation"]?.sections?.[1];
  if (
    !actions?.body?.[1]?.includes("verified full-length commit SHA") ||
    !actions?.code?.value?.includes("actions/checkout@v7")
  ) {
    fail(
      "English current-claim contract: Actions pinning guidance or checkout version regressed",
    );
  }

  if (
    !copy.quiz?.q11?.options?.[0]?.includes(
      "filters can show different subsets",
    )
  ) {
    fail(
      "English current-claim contract: Project filtered-view answer regressed",
    );
  }
  if (
    !copy.quiz?.q12?.explanation?.includes(
      "comes from the scenario, not from GitHub documentation",
    ) ||
    !copy.quiz?.q12?.explanation?.includes("sensitive-data guidance separately")
  ) {
    fail(
      "English current-claim contract: q12 scenario/source boundary regressed",
    );
  }
  if (
    !copy.quiz?.q19?.question?.includes(
      "repository root on the default branch",
    ) ||
    !copy.lessons?.[
      "research-reproducibility"
    ]?.sections?.[1]?.body?.[1]?.includes(
      "repository root on the default branch",
    ) ||
    !copy.figures?.["fig-18"]?.caption?.includes(
      "repository root on the default branch",
    )
  ) {
    fail(
      "English current-claim contract: CITATION.cff placement requirement regressed",
    );
  }
  if (!copy.quiz?.q20?.options?.[3]?.includes("immutable GitHub release")) {
    fail(
      "English current-claim contract: reproducible version reference regressed",
    );
  }
  const immutableRelease =
    copy.lessons?.["research-reproducibility"]?.sections?.[2]?.body?.[1] ?? "";
  if (
    !immutableRelease.includes("title and notes remain editable") ||
    !immutableRelease.includes("release itself can be deleted") ||
    !immutableRelease.includes("tag name cannot be reused")
  ) {
    fail(
      "English current-claim contract: immutable-release edit and deletion boundaries regressed",
    );
  }

  const requiredFigureSemantics = [
    [copy.figures?.["fig-02"]?.alt, "hello entered"],
    [copy.figures?.["fig-03"]?.alt, ".github/CODEOWNERS"],
    [copy.figures?.["fig-03"]?.caption, "supported content"],
    [copy.figures?.["fig-08"]?.alt, "Add a suggestion button"],
    [copy.figures?.["fig-09"]?.alt, "closed Review changes button"],
    [copy.figures?.["fig-12"]?.alt, "Assignees, Status, Labels, and Notes"],
  ];
  for (const [value, fragment] of requiredFigureSemantics) {
    if (!String(value).includes(fragment))
      fail(`English figure-semantic contract regressed: ${fragment}`);
  }

  const classroom =
    copy.lessons?.["teaching-capstone"]?.sections?.[1]?.body?.[0] ?? "";
  if (
    !classroom.includes("28 August 2026") ||
    !classroom.includes("4 September 2026")
  ) {
    fail(
      "English current-claim contract: Classroom transition dates regressed",
    );
  }
  if (
    !copy.lessons?.["writing-publishing"]?.sections?.[0]?.body?.[1]?.includes(
      "associated Manubot usage guide",
    )
  ) {
    fail(
      "English current-claim contract: sentence-per-line attribution regressed",
    );
  }
}

function validateIntegration() {
  const requiredFiles = [
    "app/[locale]/github/page.tsx",
    "app/[locale]/github/[lesson]/page.tsx",
    "components/github/CourseDashboard.tsx",
    "components/github/LessonView.tsx",
    "components/github/FinalQuiz.tsx",
    "components/github/CapstoneChecklist.tsx",
    "public/courses/github/ATTRIBUTION.md",
  ];
  for (const file of requiredFiles)
    if (!existsSync(join(ROOT, file)))
      fail(`${file}: required Course 6 file is missing`);

  const loader = readText("lib/github/load.ts");
  for (const locale of EXPECTED_LOCALES) {
    const key = locale.includes("-") ? `"${locale}"` : locale;
    const importPath = `"@/messages/github/${locale}.json"`;
    const ownLocaleImport = new RegExp(
      `${escapeRegExp(key)}\\s*:\\s*\\(\\)\\s*=>\\s*import\\(\\s*${escapeRegExp(importPath)}\\s*\\)`,
    );
    if (!ownLocaleImport.test(loader)) {
      fail(
        `lib/github/load.ts: ${locale} must import its own validated locale file`,
      );
    }
  }

  const catalogue = readText("lib/courses.ts");
  if (
    !catalogue.includes('id: "github"') ||
    !catalogue.includes("displayNumber: 6") ||
    !catalogue.includes('href: "/github/"')
  )
    fail("lib/courses.ts: Course 6 catalogue contract is incomplete");
  const coursesPage = readText("app/[locale]/courses/page.tsx");
  if (
    !coursesPage.includes("loadGithubCourse") ||
    !coursesPage.includes("courseSixParts") ||
    !coursesPage.includes("github: courseSixParts")
  )
    fail("courses page: GitHub hasPart structured data is not materialized");
  for (const locale of EXPECTED_LOCALES) {
    const root = readJson(`messages/${locale}.json`);
    if (!root) continue;
    for (const path of [
      ["cat", "course6"],
      ["c", "github", "title"],
      ["c", "github", "blurb"],
      ["c", "github", "level"],
      ["c", "github", "meta"],
      ["topic", "collaboration"],
      ["home", "course6Cta"],
      ["home", "githubPoint1"],
      ["home", "githubPoint2"],
      ["home", "githubPoint3"],
    ]) {
      const value = root[path.join(".")];
      if (typeof value !== "string" || !value.trim())
        fail(`messages/${locale}.json: missing ${path.join(".")}`);
    }
  }
  const attribution = readText("public/courses/github/ATTRIBUTION.md");
  if (
    !attribution.includes(SOURCE_COMMIT) ||
    !attribution.includes("CC BY 4.0") ||
    !attribution.includes("not affiliated with or endorsed by GitHub")
  )
    fail(
      "figure attribution: pinned commit, licence, or independence disclaimer is missing",
    );
  for (const error of publishedReleaseIntegrationErrors(
    ROOT,
    "github",
    "npm run github:check:release",
    ["github/", ...EXPECTED_LESSONS.map((slug) => `github/${slug}/`)],
  )) fail(error);
  const exceptionDocument = readJson("i18n-exceptions.json");
  const githubExceptions =
    exceptionDocument?.exceptions?.filter(
      (entry) => entry.domain === "github",
    ) ?? [];
  if (
    githubExceptions.length !== 27 ||
    githubExceptions.some(
      (entry) =>
        !entry.key ||
        entry.expectedLanguage !== "en" ||
        entry.expectedDirection !== "ltr",
    )
  ) {
    fail(
      "i18n exceptions: Course 6 requires exactly 27 narrow, key-level LTR fixture approvals",
    );
  }
}

const ledgers = loadLedgers();
const english = readJson("messages/github/en.json");
const localeFiles = existsSync(join(ROOT, "messages/github"))
  ? readdirSync(join(ROOT, "messages/github"))
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(/\.json$/, ""))
  : [];
exactSet(localeFiles, EXPECTED_LOCALES, "Course 6 locale files");
for (const locale of EXPECTED_LOCALES)
  validateCopy(locale, readJson(`messages/github/${locale}.json`), english);
validateCurrentClaims(english);
if (ledgers) validateManifest(ledgers);
validateIntegration();

const figuresBytes = existsSync(join(ROOT, "public/courses/github/figures"))
  ? readdirSync(join(ROOT, "public/courses/github/figures")).reduce(
      (total, file) =>
        total +
        statSync(join(ROOT, "public/courses/github/figures", file)).size,
      0,
    )
  : 0;
const result = {
  ok: errors.length === 0,
  release: RELEASE,
  course: "how-to-use-github",
  sequence: 6,
  lessons: ledgers?.manifest?.lessons?.length ?? 0,
  minutes:
    ledgers?.manifest?.lessons?.reduce(
      (total, lesson) => total + lesson.minutes,
      0,
    ) ?? 0,
  locales: localeFiles.length,
  sources: ledgers?.sources?.length ?? 0,
  figures: ledgers?.figures?.length ?? 0,
  figureBytes: figuresBytes,
  quizBank: ledgers?.quiz?.length ?? 0,
  finalQuiz: ledgers?.finalQuiz
    ? `${ledgers.finalQuiz.questionCount} questions; pass ${ledgers.finalQuiz.passingCorrectAnswers}`
    : "unknown",
  warnings,
  errors,
};

if (JSON_OUTPUT) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else if (result.ok) {
  console.log(
    `PASS Course 6 release gate: ${result.lessons} lessons, ${result.minutes} minutes, ${result.locales} locales, ${result.sources} sources, ${result.figures} authentic figures, ${result.quizBank}-question bank.`,
  );
  if (warnings.length)
    warnings.forEach((message) => console.warn(`WARN ${message}`));
} else {
  console.error(`FAIL Course 6 release gate with ${errors.length} error(s):`);
  errors.forEach((message) => console.error(`- ${message}`));
}

if (RELEASE && warnings.length) process.exitCode = 1;
if (errors.length) process.exitCode = 1;
