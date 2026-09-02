import {
  CLAUDE_CAPSTONE,
  CLAUDE_CAPSTONE_ARTIFACT_IDS,
  CLAUDE_CAPSTONE_CRITICAL_CLEAR_KEY,
  CLAUDE_CAPSTONE_PASSING_SCORE,
  CLAUDE_CAPSTONE_PROGRESS_KEY,
  CLAUDE_CAPSTONE_RUBRIC,
  CLAUDE_CAPSTONE_SCHEMA_VERSION,
} from "./capstone";
import { CLAUDE_FIGURES } from "./figures";
import { CLAUDE_COURSE_MANIFEST } from "./manifest";
import { CLAUDE_PRACTICES } from "./practices";
import {
  CLAUDE_PROGRESS_MILESTONES,
  claudeProgressPercent,
} from "./progress";
import {
  CLAUDE_FINAL_QUIZ,
  CLAUDE_FINAL_QUIZ_IDS,
  CLAUDE_QUIZ,
  CLAUDE_QUIZ_BANK_VERSION,
} from "./quiz";
import {
  CLAUDE_ACADEMY_CATALOG,
  CLAUDE_SOURCE_BY_ID,
  CLAUDE_SOURCES,
} from "./sources";
import {
  CLAUDE_FIGURE_IDS,
  CLAUDE_LESSON_SLUGS,
  CLAUDE_LOCALES,
  CLAUDE_PRACTICE_IDS,
  CLAUDE_QUIZ_IDS,
  CLAUDE_SOURCE_IDS,
  CLAUDE_UNIT_IDS,
  type ClaudeCourseCopy,
  type ClaudeFigureManifest,
  type ClaudeLocale,
} from "./types";

export interface ClaudeValidationIssue {
  readonly locale: ClaudeLocale | "manifest";
  readonly path: string;
  readonly message: string;
}

const TOP_LEVEL_COPY_KEYS = [
  "meta",
  "ui",
  "units",
  "lessons",
  "quiz",
  "figures",
  "capstone",
] as const;

const META_COPY_KEYS = Object.keys({
  title: true,
  kicker: true,
  summary: true,
  audience: true,
  duration: true,
  sourceNote: true,
  figureNote: true,
  startCta: true,
  resumeCta: true,
} satisfies Record<keyof ClaudeCourseCopy["meta"], true>);

const UI_COPY_KEYS = Object.keys({
  lessons: true,
  minutes: true,
  objectives: true,
  evidence: true,
  practice: true,
  checkpoint: true,
  sources: true,
  quiz: true,
  previous: true,
  next: true,
  capturePending: true,
  optionalAdvanced: true,
  progress: true,
  courseProgress: true,
  completed: true,
  markComplete: true,
  markedComplete: true,
  resetProgress: true,
  question: true,
  of: true,
  checkAnswer: true,
  checkAnswers: true,
  correct: true,
  incorrect: true,
  tryAgain: true,
  score: true,
  quizPassed: true,
  quizNeedsReview: true,
  capstoneArtifacts: true,
  capstoneReceipt: true,
  artifactReady: true,
  rubric: true,
  rubricComplete: true,
  passingScore: true,
  weight: true,
  status: true,
  notStarted: true,
  printReceipt: true,
  browserStorageNote: true,
  backToCourse: true,
  allLessons: true,
  recordCompletion: true,
  finalQuizTitle: true,
  finalQuizIntro: true,
  beginQuiz: true,
  nextQuestion: true,
  retryQuiz: true,
  bestScore: true,
  passRequirement: true,
  source: true,
  sourceVerifiedOn: true,
  figureObservedOn: true,
  stars: true,
  license: true,
  storageUnavailable: true,
  receiptInstructions: true,
  receiptSchemaLabel: true,
  fixtureVersionLabel: true,
  fixtureHashLabel: true,
  requiredChecksLabel: true,
  pasteReceipt: true,
  verifyReceipt: true,
  receiptValid: true,
  receiptInvalidJson: true,
  receiptWrongSchema: true,
  receiptWrongVersion: true,
  receiptWrongHash: true,
  receiptIncomplete: true,
  downloadStarter: true,
  completionSummary: true,
  exportSummary: true,
  finishQuiz: true,
  questionProgressTemplate: true,
  scoreSummaryTemplate: true,
  bestScoreTemplate: true,
  resetConfirm: true,
  resetDone: true,
  capstonePath: true,
} satisfies Record<keyof ClaudeCourseCopy["ui"], true>);

const LESSON_COPY_KEYS = [
  "kicker",
  "title",
  "summary",
  "objective",
  "sections",
  "practice",
  "checkpoint",
  "takeaway",
] as const;

const CAPSTONE_COPY_KEYS = [
  "title",
  "summary",
  "scenario",
  "instructions",
  "artifacts",
  "rubric",
  "pass",
  "retry",
  "completion",
] as const;

const EXPECTED_DURATIONS = [
  35,
  45,
  40,
  50,
  45,
  50,
  45,
  60,
  50,
  60,
  70,
  70,
  70,
  60,
  120,
] as const;

const EXPECTED_UNIT_LESSON_COUNTS = [4, 4, 3, 4] as const;
const EXPECTED_BANK_COUNTS = [8, 8, 6, 8] as const;
const EXPECTED_RUBRIC_IDS = [
  "delegation",
  "description",
  "discernment",
  "diligence",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function hasExactKeys(
  value: unknown,
  expected: readonly string[],
  locale: ClaudeLocale,
  path: string,
  issues: ClaudeValidationIssue[],
): value is Record<string, unknown> {
  if (!isRecord(value)) {
    issues.push({ locale, path, message: "Expected an object." });
    return false;
  }

  const actual = Object.keys(value);
  const missing = expected.filter((key) => !actual.includes(key));
  const extra = actual.filter((key) => !expected.includes(key));
  if (missing.length || extra.length) {
    issues.push({
      locale,
      path,
      message: `Key mismatch. Missing: ${missing.join(", ") || "none"}. Extra: ${extra.join(", ") || "none"}.`,
    });
    return false;
  }
  return true;
}

function walkStrings(
  value: unknown,
  locale: ClaudeLocale,
  path: string,
  issues: ClaudeValidationIssue[],
): void {
  if (typeof value === "string") {
    if (!value.trim()) {
      issues.push({ locale, path, message: "Visible copy must not be empty." });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkStrings(item, locale, `${path}[${index}]`, issues));
    return;
  }
  if (isRecord(value)) {
    Object.entries(value).forEach(([key, item]) => walkStrings(item, locale, `${path}.${key}`, issues));
    return;
  }
  issues.push({
    locale,
    path,
    message: "Localized copy may contain only objects, arrays, and strings.",
  });
}

function structureSignature(value: unknown, path = "$", output: string[] = []): string[] {
  if (typeof value === "string") {
    output.push(`${path}:string`);
  } else if (Array.isArray(value)) {
    output.push(`${path}:array:${value.length}`);
    value.forEach((item, index) => structureSignature(item, `${path}[${index}]`, output));
  } else if (isRecord(value)) {
    const keys = Object.keys(value).sort();
    output.push(`${path}:object:${keys.join("|")}`);
    keys.forEach((key) => structureSignature(value[key], `${path}.${key}`, output));
  } else {
    output.push(`${path}:${String(value)}`);
  }
  return output;
}

function placeholderSignature(value: string): string {
  return [...value.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)]
    .map((match) => match[1])
    .sort()
    .join("|");
}

const PROTECTED_TECH_TOKEN_PATTERN =
  /(?<![A-Za-z0-9])(?:CLAUDE\.md|DOCX|XLSX|PPTX|PDF|GitHub)(?![A-Za-z0-9])/g;

function protectedTechnicalTokenSignature(value: string): string {
  return [...value.matchAll(PROTECTED_TECH_TOKEN_PATTERN)]
    .map((match) => match[0])
    .sort()
    .join("|");
}

const REQUIRED_RESEARCH_TOKEN_PATHS = [
  ["lessons", "research-with-citations", "summary"],
  ["lessons", "research-with-citations", "objective"],
  ["lessons", "research-with-citations", "sections", 0, "body"],
  ["lessons", "research-with-citations", "practice", "brief"],
  ["quiz", "q15", "options", 0],
  ["quiz", "q15", "explanation"],
] as const;

const REQUIRED_ARTIFACT_TOKEN_PATHS = [
  ["quiz", "q13", "question"],
  ["quiz", "q13", "explanation"],
  ["quiz", "q14", "question"],
] as const;

function valueAtPath(
  value: unknown,
  segments: readonly (string | number)[],
): unknown {
  let cursor = value;
  for (const segment of segments) {
    if (typeof segment === "number") {
      if (!Array.isArray(cursor)) return undefined;
      cursor = cursor[segment];
      continue;
    }
    if (!isRecord(cursor)) return undefined;
    cursor = cursor[segment];
  }
  return cursor;
}

function displayPath(segments: readonly (string | number)[]): string {
  return segments.reduce<string>((path, segment) => (
    typeof segment === "number" ? `${path}[${segment}]` : `${path}.${segment}`
  ), "$");
}

function validateRequiredProductTokens(
  copy: unknown,
  locale: ClaudeLocale,
  issues: ClaudeValidationIssue[],
): void {
  for (const segments of REQUIRED_RESEARCH_TOKEN_PATHS) {
    const value = valueAtPath(copy, segments);
    if (typeof value !== "string" || !value.includes("Research")) {
      issues.push({
        locale,
        path: displayPath(segments),
        message: "Copy must preserve the Claude product name Research at this product-identity boundary.",
      });
    }
  }

  const artifactAliases = locale === "ja"
    ? ["Artifact", "Artifacts", "アーティファクト"]
    : ["Artifact", "Artifacts"];
  for (const segments of REQUIRED_ARTIFACT_TOKEN_PATHS) {
    const value = valueAtPath(copy, segments);
    if (typeof value !== "string"
      || !artifactAliases.some((alias) => value.includes(alias))) {
      issues.push({
        locale,
        path: displayPath(segments),
        message: "Copy must preserve the Claude product name Artifact at this product-identity boundary.",
      });
    }
  }
}

function numericSignature(value: string): string {
  const normalised = [...value].map((character) => {
    const code = character.codePointAt(0)!;
    if (code >= 0x30 && code <= 0x39) return character;
    if (code >= 0x660 && code <= 0x669) return String(code - 0x660);
    if (code >= 0x6f0 && code <= 0x6f9) return String(code - 0x6f0);
    if (code >= 0xff10 && code <= 0xff19) return String(code - 0xff10);
    return character;
  }).join("");
  return normalised.match(/\d+/g)?.join("|") ?? "";
}

function comparePlaceholderParity(
  reference: unknown,
  candidate: unknown,
  locale: ClaudeLocale,
  path: string,
  issues: ClaudeValidationIssue[],
): void {
  if (typeof reference === "string" && typeof candidate === "string") {
    const expected = placeholderSignature(reference);
    const actual = placeholderSignature(candidate);
    if (actual !== expected) {
      issues.push({
        locale,
        path,
        message: `Placeholder mismatch. Expected: ${expected || "none"}. Actual: ${actual || "none"}.`,
      });
    }
    const expectedTechnicalTokens = protectedTechnicalTokenSignature(reference);
    const actualTechnicalTokens = protectedTechnicalTokenSignature(candidate);
    if (actualTechnicalTokens !== expectedTechnicalTokens) {
      issues.push({
        locale,
        path,
        message: `Protected technical-token mismatch. Expected: ${expectedTechnicalTokens || "none"}. Actual: ${actualTechnicalTokens || "none"}.`,
      });
    }
    const expectedNumbers = numericSignature(reference).split("|").filter(Boolean);
    const actualNumbers = numericSignature(candidate).split("|").filter(Boolean);
    if (expectedNumbers.length >= 2) {
      const remaining = [...actualNumbers];
      const missing = expectedNumbers.filter((number) => {
        const index = remaining.indexOf(number);
        if (index < 0) return true;
        remaining.splice(index, 1);
        return false;
      });
      if (missing.length) {
        issues.push({
          locale,
          path,
          message: `Localized copy is missing numeric values from the English contract: ${missing.join(", ")}.`,
        });
      }
    }
    return;
  }
  if (Array.isArray(reference) && Array.isArray(candidate)) {
    reference.forEach((item, index) => {
      comparePlaceholderParity(item, candidate[index], locale, `${path}[${index}]`, issues);
    });
    return;
  }
  if (isRecord(reference) && isRecord(candidate)) {
    Object.keys(reference).forEach((key) => {
      comparePlaceholderParity(reference[key], candidate[key], locale, `${path}.${key}`, issues);
    });
  }
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string"
    && /^\d{4}-\d{2}-\d{2}/.test(value)
    && !Number.isNaN(Date.parse(value));
}

function isExactCalendarDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

const PERMISSION_CLEARANCE_KEYS = [
  "evidenceReference",
  "evidenceSha256",
  "grantor",
  "grantedOn",
  "scope",
  "expiresOn",
  "reviewedBy",
  "reviewedOn",
] as const;

const AUTHENTICITY_REVIEWED_KEYS = [
  "status",
  "reviewedOn",
  "sourceAssetUrl",
  "sourceSha256",
  "sourceWidth",
  "sourceHeight",
  "transformation",
] as const;

const AUTHENTICITY_UNVERIFIED_KEYS = [
  "status",
  "reviewedOn",
  "blockerCode",
  "reason",
] as const;

export function validateClaudeFigureAuthenticity(
  figure: ClaudeFigureManifest,
): readonly string[] {
  if (figure.status !== "available") return [];

  const record = figure as unknown as Record<string, unknown>;
  const review = record.authenticityReview;
  if (figure.provenance === "licensed-community") {
    return review === undefined
      ? []
      : ["Repository figures bind authenticity to their pinned source record and must not add an Academy authenticityReview."];
  }
  if (!isRecord(review)) {
    return ["First-party figures require an authenticity review independent of republication rights."];
  }

  const issues: string[] = [];
  if (review.status === "source-provenance-reviewed") {
    const actualKeys = Object.keys(review).sort();
    const expectedKeys = [...AUTHENTICITY_REVIEWED_KEYS].sort();
    if (!sameOrder(actualKeys, expectedKeys)) {
      issues.push("Reviewed authenticity evidence must use the exact source-provenance fields.");
    }
    if (!isExactCalendarDate(review.reviewedOn)
      || typeof review.sourceAssetUrl !== "string"
      || !review.sourceAssetUrl.startsWith("https://")
      || typeof review.sourceSha256 !== "string"
      || !/^[a-f0-9]{64}$/.test(review.sourceSha256)
      || !Number.isInteger(review.sourceWidth)
      || (review.sourceWidth as number) < 1
      || !Number.isInteger(review.sourceHeight)
      || (review.sourceHeight as number) < 1
      || !isNonEmptyString(review.transformation)) {
      issues.push("Reviewed authenticity requires an exact review date, immutable HTTPS source asset, source SHA-256, positive source dimensions, and transformation record.");
    }
    return issues;
  }

  if (review.status === "provenance-unverified") {
    const actualKeys = Object.keys(review).sort();
    const expectedKeys = [...AUTHENTICITY_UNVERIFIED_KEYS].sort();
    if (!sameOrder(actualKeys, expectedKeys)) {
      issues.push("Unverified authenticity evidence must use the exact fail-closed fields.");
    }
    if (figure.id !== "fig-01"
      || review.blockerCode !== "CLAUDE-FIG-01-PROVENANCE-UNVERIFIED"
      || !isExactCalendarDate(review.reviewedOn)
      || !isNonEmptyString(review.reason)) {
      issues.push("The Figure 01 provenance blocker requires its exact code, review date, and non-empty reason.");
    }
    return issues;
  }

  return ["Authenticity review has an unknown status."];
}

export function isClaudeFigureAuthenticityReleaseReady(
  figure: ClaudeFigureManifest,
): boolean {
  if (figure.status !== "available") return false;
  if (figure.provenance === "licensed-community") return true;
  return figure.authenticityReview.status === "source-provenance-reviewed";
}

export function validateClaudeFigureAuthenticityCurrentness(
  figure: ClaudeFigureManifest,
  today: string,
): readonly string[] {
  if (figure.status !== "available"
    || figure.provenance === "licensed-community"
    || figure.authenticityReview.status !== "source-provenance-reviewed") {
    return [];
  }
  if (!isExactCalendarDate(today)) {
    return ["Authenticity currentness requires an exact YYYY-MM-DD calendar date."];
  }
  if (!isExactCalendarDate(figure.authenticityReview.reviewedOn)) {
    return ["Authenticity currentness cannot be evaluated until reviewedOn is a valid calendar date."];
  }
  if (Date.parse(figure.authenticityReview.reviewedOn) > Date.parse(today)) {
    return ["Authenticity review date cannot be in the future on the release calendar."];
  }
  return [];
}

export function validateClaudeFigureRights(
  figure: ClaudeFigureManifest,
): readonly string[] {
  if (figure.status !== "available") return [];

  const issues: string[] = [];
  const record = figure as unknown as Record<string, unknown>;
  const rightsStatus = record.rightsStatus;
  const clearance = record.permissionClearance;

  if (figure.provenance === "licensed-community") {
    if (rightsStatus !== "repository-licence-reviewed"
      || typeof record.thirdPartySourceUrl !== "string"
      || !record.thirdPartySourceUrl.startsWith("https://")
      || !isNonEmptyString(record.thirdPartyLicense)
      || typeof record.sourceCommit !== "string"
      || !/^[a-f0-9]{40}$/.test(record.sourceCommit)
      || typeof record.sourceSha256 !== "string"
      || !/^[a-f0-9]{64}$/.test(record.sourceSha256)
      || !isNonEmptyString(record.modifications)) {
      issues.push("Repository figure requires reviewed licence, source URL, pinned commit, source SHA-256, and a modification record.");
    }
    if (clearance !== undefined) {
      issues.push("Repository-licence records must not include a written-permission clearance record.");
    }
    return issues;
  }

  if (rightsStatus === "permission-required") {
    if (clearance !== undefined) {
      issues.push("Pending permission records must not include permissionClearance evidence.");
    }
    return issues;
  }
  if (rightsStatus !== "written-permission-reviewed") {
    issues.push("First-party imagery must remain pending or have reviewed written permission.");
    return issues;
  }
  if (!isRecord(clearance)) {
    issues.push("Reviewed written permission requires a permissionClearance record.");
    return issues;
  }

  const actualKeys = Object.keys(clearance).sort();
  const expectedKeys = [...PERMISSION_CLEARANCE_KEYS].sort();
  if (!sameOrder(actualKeys, expectedKeys)) {
    issues.push("Written-permission evidence must use the exact clearance-record fields.");
  }

  const requiredStrings = [
    clearance.evidenceReference,
    clearance.grantor,
    clearance.scope,
    clearance.reviewedBy,
    clearance.grantedOn,
    clearance.reviewedOn,
  ];
  if (requiredStrings.some((value) => !isNonEmptyString(value))) {
    issues.push("Written permission requires non-empty evidence reference, grantor, scope, reviewer, and review dates.");
  }
  if (typeof clearance.evidenceReference === "string"
    && /^https?:\/\//i.test(clearance.evidenceReference)) {
    issues.push("Permission evidenceReference must be a non-secret internal record ID, not a public URL.");
  }
  if (typeof clearance.evidenceSha256 !== "string"
    || !/^[a-f0-9]{64}$/.test(clearance.evidenceSha256)) {
    issues.push("Written permission requires the lowercase SHA-256 of the immutable original evidence.");
  }

  const grantedIsValid = isExactCalendarDate(clearance.grantedOn);
  const reviewedIsValid = isExactCalendarDate(clearance.reviewedOn);
  const expiresIsValid = clearance.expiresOn === null || isExactCalendarDate(clearance.expiresOn);
  if (!grantedIsValid || !reviewedIsValid || !expiresIsValid) {
    issues.push("Permission grant, review, and optional expiry dates must be exact YYYY-MM-DD calendar dates.");
    return issues;
  }

  const grantedAt = Date.parse(clearance.grantedOn as string);
  const reviewedAt = Date.parse(clearance.reviewedOn as string);
  if (grantedAt > reviewedAt) {
    issues.push("Permission cannot be reviewed before it is granted.");
  }
  if (typeof clearance.expiresOn === "string"
    && Date.parse(clearance.expiresOn) < grantedAt) {
    issues.push("Permission expiry cannot precede the grant date.");
  }
  if (typeof clearance.expiresOn === "string"
    && Date.parse(clearance.expiresOn) < reviewedAt) {
    issues.push("Permission cannot be reviewed after it expires.");
  }
  return issues;
}

export function validateClaudeFigurePermissionCurrentness(
  figure: ClaudeFigureManifest,
  today: string,
): readonly string[] {
  if (figure.status !== "available"
    || figure.rightsStatus !== "written-permission-reviewed") {
    return [];
  }
  if (!isExactCalendarDate(today)) {
    return ["Release currentness requires an exact YYYY-MM-DD calendar date."];
  }

  const clearance = figure.permissionClearance;
  if (!isExactCalendarDate(clearance.grantedOn)
    || !isExactCalendarDate(clearance.reviewedOn)
    || (clearance.expiresOn !== null && !isExactCalendarDate(clearance.expiresOn))) {
    return ["Permission currentness cannot be evaluated until its calendar dates are valid."];
  }

  const todayAt = Date.parse(today);
  const grantedAt = Date.parse(clearance.grantedOn);
  const reviewedAt = Date.parse(clearance.reviewedOn);
  const issues: string[] = [];
  if (grantedAt > todayAt || reviewedAt > todayAt) {
    issues.push("Permission grant and review dates cannot be in the future on the release calendar.");
  }
  if (clearance.expiresOn !== null && Date.parse(clearance.expiresOn) < todayAt) {
    issues.push("Written permission is expired on the release calendar.");
  }
  return issues;
}

function sameOrder(actual: readonly string[], expected: readonly string[]): boolean {
  return actual.length === expected.length
    && actual.every((value, index) => value === expected[index]);
}

export function validateClaudeCopy(
  locale: ClaudeLocale,
  copy: unknown,
  englishReference?: ClaudeCourseCopy,
): readonly ClaudeValidationIssue[] {
  const issues: ClaudeValidationIssue[] = [];
  if (!hasExactKeys(copy, TOP_LEVEL_COPY_KEYS, locale, "$", issues)) {
    return issues;
  }

  hasExactKeys(copy.meta, META_COPY_KEYS, locale, "$.meta", issues);
  hasExactKeys(copy.ui, UI_COPY_KEYS, locale, "$.ui", issues);
  hasExactKeys(copy.units, CLAUDE_UNIT_IDS, locale, "$.units", issues);
  hasExactKeys(copy.lessons, CLAUDE_LESSON_SLUGS, locale, "$.lessons", issues);
  hasExactKeys(copy.quiz, CLAUDE_QUIZ_IDS, locale, "$.quiz", issues);
  hasExactKeys(copy.figures, CLAUDE_FIGURE_IDS, locale, "$.figures", issues);

  if (isRecord(copy.units)) {
    for (const unitId of CLAUDE_UNIT_IDS) {
      hasExactKeys(copy.units[unitId], ["title", "summary"], locale, `$.units.${unitId}`, issues);
    }
  }

  if (isRecord(copy.lessons)) {
    for (const slug of CLAUDE_LESSON_SLUGS) {
      const lessonPath = `$.lessons.${slug}`;
      const lesson = copy.lessons[slug];
      if (!hasExactKeys(lesson, LESSON_COPY_KEYS, locale, lessonPath, issues)) continue;

      if (!Array.isArray(lesson.sections) || lesson.sections.length !== 3) {
        issues.push({
          locale,
          path: `${lessonPath}.sections`,
          message: "Every lesson must contain exactly three teaching sections.",
        });
      } else {
        lesson.sections.forEach((section, index) => {
          hasExactKeys(section, ["heading", "body"], locale, `${lessonPath}.sections[${index}]`, issues);
        });
      }

      if (hasExactKeys(
        lesson.practice,
        ["title", "brief", "steps", "evidence", "safety"],
        locale,
        `${lessonPath}.practice`,
        issues,
      )) {
        if (!Array.isArray(lesson.practice.steps) || lesson.practice.steps.length !== 3) {
          issues.push({
            locale,
            path: `${lessonPath}.practice.steps`,
            message: "Every guided practice must contain exactly three observable steps.",
          });
        }
        if (!Array.isArray(lesson.practice.evidence) || lesson.practice.evidence.length !== 2) {
          issues.push({
            locale,
            path: `${lessonPath}.practice.evidence`,
            message: "Every guided practice must request exactly two evidence items.",
          });
        }
      }

      hasExactKeys(
        lesson.checkpoint,
        ["prompt", "answer"],
        locale,
        `${lessonPath}.checkpoint`,
        issues,
      );
    }
  }

  if (isRecord(copy.quiz)) {
    for (const id of CLAUDE_QUIZ_IDS) {
      const path = `$.quiz.${id}`;
      const question = copy.quiz[id];
      if (!hasExactKeys(question, ["question", "options", "explanation"], locale, path, issues)) continue;
      if (!Array.isArray(question.options) || question.options.length !== 4) {
        issues.push({
          locale,
          path: `${path}.options`,
          message: "Every quiz question must have exactly four options.",
        });
      }
    }
  }

  if (isRecord(copy.figures)) {
    for (const id of CLAUDE_FIGURE_IDS) {
      const figure = copy.figures[id];
      if (!isRecord(figure)) {
        issues.push({ locale, path: `$.figures.${id}`, message: "Expected an object." });
        continue;
      }
      const expectedKeys = "callouts" in figure ? ["alt", "caption", "callouts"] : ["alt", "caption"];
      hasExactKeys(figure, expectedKeys, locale, `$.figures.${id}`, issues);
    }
    if (locale === "en") {
      const figureEight = copy.figures["fig-08"];
      const expectedCaption = "Unverified example—do not use these medical or research claims as evidence. Polished research output is an audit target, not proof. Open each original paper and verify titles, designs, numbers, quotations, and claim fit.";
      if (!isRecord(figureEight) || figureEight.caption !== expectedCaption) {
        issues.push({
          locale,
          path: "$.figures.fig-08.caption",
          message: "Figure 08 must visibly identify its medical and research claims as an unverified audit example.",
        });
      }
    }
  }

  if (hasExactKeys(copy.capstone, CAPSTONE_COPY_KEYS, locale, "$.capstone", issues)) {
    hasExactKeys(
      copy.capstone.artifacts,
      CLAUDE_CAPSTONE_ARTIFACT_IDS,
      locale,
      "$.capstone.artifacts",
      issues,
    );
    hasExactKeys(
      copy.capstone.rubric,
      EXPECTED_RUBRIC_IDS,
      locale,
      "$.capstone.rubric",
      issues,
    );
    if (!Array.isArray(copy.capstone.instructions)
      || copy.capstone.instructions.length !== CLAUDE_CAPSTONE_ARTIFACT_IDS.length) {
      issues.push({
        locale,
        path: "$.capstone.instructions",
        message: `Capstone must contain ${CLAUDE_CAPSTONE_ARTIFACT_IDS.length} ordered instructions.`,
      });
    }

    if (isRecord(copy.capstone.artifacts)) {
      for (const id of CLAUDE_CAPSTONE_ARTIFACT_IDS) {
        hasExactKeys(
          copy.capstone.artifacts[id],
          ["title", "description"],
          locale,
          `$.capstone.artifacts.${id}`,
          issues,
        );
      }
    }
    if (isRecord(copy.capstone.rubric)) {
      for (const id of EXPECTED_RUBRIC_IDS) {
        hasExactKeys(
          copy.capstone.rubric[id],
          ["title", "description"],
          locale,
          `$.capstone.rubric.${id}`,
          issues,
        );
      }
    }
  }

  if (isRecord(copy.ui)) {
    const requiredTemplates = {
      questionProgressTemplate: "current|total",
      scoreSummaryTemplate: "score|total",
      bestScoreTemplate: "score|total",
    } as const;
    for (const [key, expected] of Object.entries(requiredTemplates)) {
      const value = copy.ui[key];
      if (typeof value !== "string" || placeholderSignature(value) !== expected) {
        issues.push({
          locale,
          path: `$.ui.${key}`,
          message: `Template must contain exactly these placeholders: ${expected}.`,
        });
      }
    }
    if (locale === "en" && copy.ui.checkpoint !== "Discernment checkpoint") {
      issues.push({
        locale,
        path: "$.ui.checkpoint",
        message: "The English course must name the recurring checkpoint as Discernment checkpoint.",
      });
    }
    if (locale === "en" && copy.ui.browserStorageNote
      !== "This course stores only Claude-course progress in this browser: 15 lesson completion flags; the quiz best score, pass flag, and bank version; six capstone artifact checks; four rubric self-scores; the critical-risk review attestation; and the final capstone completion flag. It never stores prompts, selected quiz answers, or files.") {
      issues.push({
        locale,
        path: "$.ui.browserStorageNote",
        message: "The English browser-storage disclosure must enumerate every persisted Claude-course value and distinguish non-persisted quiz answers, prompts, and files.",
      });
    }
    if (locale === "en" && isRecord(copy.lessons)) {
      const softwareLesson = copy.lessons["software-engineering"];
      const firstSection = isRecord(softwareLesson)
        && Array.isArray(softwareLesson.sections)
        ? softwareLesson.sections[0]
        : undefined;
      const practice = isRecord(softwareLesson) ? softwareLesson.practice : undefined;
      if (!isRecord(firstSection)
        || typeof firstSection.body !== "string"
        || !firstSection.body.includes("paid or organisation-entitled extension")
        || !firstSection.body.includes("On the free path")
        || !isRecord(practice)
        || typeof practice.brief !== "string"
        || !practice.brief.includes("Chat plus your own local tools on the free path")) {
        issues.push({
          locale,
          path: "$.lessons.software-engineering",
          message: "The English software-engineering lesson must mark Claude Code as an entitled extension and provide a viable Chat-plus-local-tools free path.",
        });
      }
    }
  }

  walkStrings(copy, locale, "$", issues);
  validateRequiredProductTokens(copy, locale, issues);

  if (englishReference) {
    const reference = structureSignature(englishReference).join("\n");
    const candidate = structureSignature(copy).join("\n");
    if (reference !== candidate) {
      issues.push({
        locale,
        path: "$",
        message: "Localized copy structure does not match the English reference.",
      });
    }
    comparePlaceholderParity(englishReference, copy, locale, "$", issues);
  }

  return issues;
}

export function validateClaudeManifests(): readonly ClaudeValidationIssue[] {
  const issues: ClaudeValidationIssue[] = [];
  const add = (path: string, message: string) => {
    issues.push({ locale: "manifest", path, message });
  };

  if (CLAUDE_COURSE_MANIFEST.id !== "how-to-use-claude") {
    add("course.id", "Course ID differs from the locked product contract.");
  }
  if (!/^\d+\.\d+\.\d+$/.test(CLAUDE_COURSE_MANIFEST.version)) {
    add("course.version", "Course version must use semantic versioning.");
  }
  if (!isValidDate(CLAUDE_COURSE_MANIFEST.preparedOn)
    || !isValidDate(CLAUDE_COURSE_MANIFEST.sourceSnapshotOn)
    || (CLAUDE_COURSE_MANIFEST.publishedOn !== null
      && !isValidDate(CLAUDE_COURSE_MANIFEST.publishedOn))) {
    add("course.dates", "Preparation, source-snapshot, and optional publication dates must be valid ISO dates.");
  }
  const publicationStatus = String(CLAUDE_COURSE_MANIFEST.publicationStatus);
  const publishedOn = CLAUDE_COURSE_MANIFEST.publishedOn as string | null;
  if (publicationStatus === "rights-gated" && publishedOn !== null) {
    add("course.publication", "A rights-gated course must not claim a publication date.");
  }
  if (publicationStatus === "published" && publishedOn === null) {
    add("course.publication", "A published course requires a publication date.");
  }

  if (CLAUDE_COURSE_MANIFEST.units.length !== 4) {
    add("units", "Course must contain exactly four units.");
  }
  if (CLAUDE_COURSE_MANIFEST.lessons.length !== 15) {
    add("lessons", "Course must contain exactly fifteen lessons.");
  }
  if (CLAUDE_PROGRESS_MILESTONES !== 17) {
    add("progress.milestones", "Claude progress must use fifteen lessons, one quiz, and one strict capstone milestone.");
  }
  if (CLAUDE_QUIZ.length !== 30) {
    add("quiz", "Course must contain exactly thirty quiz questions.");
  }
  if (CLAUDE_FIGURES.length !== 15) {
    add("figures", "Course must contain exactly fifteen figures.");
  }
  if (CLAUDE_PRACTICES.length !== 15) {
    add("practices", "Course must contain exactly fifteen guided practices.");
  }

  const lessonOrder = CLAUDE_COURSE_MANIFEST.lessons.map((lesson) => lesson.slug);
  if (!sameOrder(lessonOrder, CLAUDE_LESSON_SLUGS)) {
    add("lessons", "Lesson slugs or order differ from the locked course contract.");
  }

  const unitOrder = CLAUDE_COURSE_MANIFEST.units.map((unit) => unit.id);
  if (!sameOrder(unitOrder, CLAUDE_UNIT_IDS)) {
    add("units", "Unit IDs or order differ from the locked course contract.");
  }
  CLAUDE_COURSE_MANIFEST.units.forEach((unit, index) => {
    if (unit.order !== index + 1) {
      add(`units.${unit.id}.order`, `Unit order must be ${index + 1}.`);
    }
    if (unit.lessonSlugs.length !== EXPECTED_UNIT_LESSON_COUNTS[index]) {
      add(
        `units.${unit.id}.lessonSlugs`,
        `Unit must contain ${EXPECTED_UNIT_LESSON_COUNTS[index]} lessons.`,
      );
    }
  });
  const unitLessonOrder = CLAUDE_COURSE_MANIFEST.units.flatMap((unit) => unit.lessonSlugs);
  if (!sameOrder(unitLessonOrder, CLAUDE_LESSON_SLUGS)) {
    add("units.lessonSlugs", "Units must partition all lessons exactly once and in course order.");
  }

  const actualDurations = CLAUDE_COURSE_MANIFEST.lessons.map((lesson) => lesson.durationMinutes);
  if (!sameOrder(actualDurations.map(String), EXPECTED_DURATIONS.map(String))) {
    add("lessons.durationMinutes", "Lesson durations differ from the locked 870-minute contract.");
  }
  if (actualDurations.reduce((sum, minutes) => sum + minutes, 0) !== 870) {
    add("lessons.durationMinutes", "Guided lesson durations must total 870 minutes.");
  }

  const sourceIds = new Set(CLAUDE_SOURCES.map((source) => source.id));
  const quizIds = new Set(CLAUDE_QUIZ.map((question) => question.id));
  const figureIds = new Set(CLAUDE_FIGURES.map((figure) => figure.id));
  const practiceIds = new Set(CLAUDE_PRACTICES.map((practice) => practice.id));

  for (const [lessonIndex, lesson] of CLAUDE_COURSE_MANIFEST.lessons.entries()) {
    const path = `lessons.${lesson.slug}`;
    if (lesson.order !== lessonIndex + 1) {
      add(`${path}.order`, `Lesson order must be ${lessonIndex + 1}.`);
    }
    if (lesson.minutes !== lesson.durationMinutes) {
      add(`${path}.minutes`, "minutes and durationMinutes aliases must match.");
    }
    if (!lesson.objectiveKeys.length || !lesson.objectiveKeys.every(isNonEmptyString)) {
      add(`${path}.objectiveKeys`, "Lesson must expose localized objective keys.");
    }
    if (!lesson.quizTags.length || !lesson.quizTags.every(isNonEmptyString)) {
      add(`${path}.quizTags`, "Lesson must expose stable quiz tags.");
    }
    if (new Set(lesson.prerequisites).size !== lesson.prerequisites.length) {
      add(`${path}.prerequisites`, "Prerequisites must not contain duplicates.");
    }
    for (const prerequisite of lesson.prerequisites) {
      const prerequisiteIndex = lessonOrder.indexOf(prerequisite);
      if (prerequisiteIndex < 0 || prerequisiteIndex >= lessonIndex) {
        add(`${path}.prerequisites`, `Prerequisite must name an earlier lesson: ${prerequisite}.`);
      }
    }

    const unit = CLAUDE_COURSE_MANIFEST.units.find((item) => item.id === lesson.unitId);
    if (!(unit?.lessonSlugs as readonly string[] | undefined)?.includes(lesson.slug)) {
      add(`${path}.unitId`, "Lesson must appear in its declared unit.");
    }
    if (lesson.quizIds.length !== 2 || lesson.quizIds.some((id) => !quizIds.has(id))) {
      add(`${path}.quizIds`, "Every lesson must reference exactly two known quiz questions.");
    }
    if (lesson.figureIds.length !== 1 || lesson.figureIds.some((id) => !figureIds.has(id))) {
      add(`${path}.figureIds`, "Every lesson must reference exactly one known real-interface figure.");
    }
    if (!practiceIds.has(lesson.practiceId)) {
      add(`${path}.practiceId`, "Lesson references an unknown guided practice.");
    }
    if (!lesson.sourceIds.length || lesson.sourceIds.some((id) => !sourceIds.has(id))) {
      add(`${path}.sourceIds`, "Lesson must reference only known evidence sources.");
    }

    const proseSections = lesson.blocks
      .filter((block) => block.type === "prose")
      .map((block) => block.sectionIndex);
    if (!sameOrder(proseSections.map(String), ["0", "1", "2"])) {
      add(`${path}.blocks`, "Lesson blocks must render all three teaching sections once and in order.");
    }
    const blockFigures = lesson.blocks
      .filter((block) => block.type === "figure")
      .map((block) => block.figureId);
    if (!sameOrder(blockFigures, lesson.figureIds)) {
      add(`${path}.blocks`, "Figure blocks must match figureIds in order.");
    }
    const exerciseBlocks = lesson.blocks.filter((block) => block.type === "exercise");
    if (exerciseBlocks.length !== 1 || exerciseBlocks[0]?.practiceId !== lesson.practiceId) {
      add(`${path}.blocks`, "Exactly one exercise block must reference the lesson practice.");
    }
    const sourceNotes = lesson.blocks.filter((block) => block.type === "source-note");
    if (sourceNotes.length !== 1
      || !sameOrder(sourceNotes[0]?.sourceIds ?? [], lesson.sourceIds)) {
      add(`${path}.blocks`, "Exactly one source note must match lesson sources.");
    }
  }

  if (sourceIds.size !== CLAUDE_SOURCE_IDS.length
    || !sameOrder(CLAUDE_SOURCES.map((source) => source.id), CLAUDE_SOURCE_IDS)) {
    add("sources", "Source IDs must be unique and match the locked evidence ledger.");
  }
  for (const source of CLAUDE_SOURCES) {
    const path = `sources.${source.id}`;
    if (!source.url.startsWith("https://") || !source.exactAnchor.startsWith("https://")) {
      add(`${path}.url`, "Source URL and exact anchor must use HTTPS.");
    }
    if (source.supportingAnchors?.some((anchor) => !anchor.startsWith("https://"))) {
      add(`${path}.supportingAnchors`, "Supporting source anchors must use HTTPS.");
    }
    if (!source.claimIds.length || source.claimIds.some((claim) => !claim.trim())) {
      add(`${path}.claimIds`, "Source requires one or more stable claim IDs.");
    }
    if (new Set(source.claimIds).size !== source.claimIds.length) {
      add(`${path}.claimIds`, "Claim IDs must not contain duplicates.");
    }
    if (!isValidDate(source.accessedOn) || !isValidDate(source.verifiedAt)) {
      add(`${path}.dates`, "Source access and verification dates must be valid ISO dates.");
    }
    if (source.kind === "official-doc") {
      if (source.tier !== "primary") {
        add(`${path}.tier`, "Official Academy and Help Centre sources must be primary evidence.");
      }
      continue;
    }

    if (!source.license.trim()) {
      add(`${path}.license`, "GitHub evidence requires an explicit licence assessment.");
    }
    if (!source.commit || !/^[a-f0-9]{40}$/.test(source.commit)) {
      add(`${path}.commit`, "GitHub evidence requires a pinned forty-character commit hash.");
    }
    if (source.kind === "community-github" && source.tier !== "corroborating") {
      add(`${path}.tier`, "Community GitHub evidence may only be corroborating.");
    }
    if (source.stars !== undefined
      && (!Number.isInteger(source.stars) || source.stars < 0 || !isValidDate(source.starsSnapshotOn))) {
      add(`${path}.stars`, "Any star count must be non-negative and date-stamped.");
    }
  }

  if (practiceIds.size !== CLAUDE_PRACTICE_IDS.length
    || !sameOrder(CLAUDE_PRACTICES.map((practice) => practice.id), CLAUDE_PRACTICE_IDS)) {
    add("practices", "Practice IDs must be unique and match the locked course contract.");
  }
  for (const practice of CLAUDE_PRACTICES) {
    const path = `practices.${practice.id}`;
    const lesson = CLAUDE_COURSE_MANIFEST.lessons.find((item) => item.slug === practice.lessonSlug);
    if (!lesson || lesson.practiceId !== practice.id) {
      add(`${path}.lessonSlug`, "Practice must map one-to-one to its lesson.");
    }
    if (!Number.isInteger(practice.estimatedMinutes)
      || practice.estimatedMinutes < 1
      || (lesson && practice.estimatedMinutes > lesson.durationMinutes)) {
      add(`${path}.estimatedMinutes`, "Practice time must be positive and fit inside the lesson duration.");
    }
    if (practice.evidenceItems !== 2
      || practice.observableActionCount !== 3
      || practice.selfCheckCriteriaCount !== 2) {
      add(`${path}.evidence`, "Practice must lock three actions, two evidence items, and two self-check criteria.");
    }
    if (practice.promptKey !== `lessons.${practice.lessonSlug}.practice.brief`) {
      add(`${path}.promptKey`, "Practice prompt key must match the localized lesson brief.");
    }
    if (practice.completionKey !== `claude.lesson.${practice.lessonSlug}`) {
      add(`${path}.completionKey`, "Practice completion key must match its lesson.");
    }
  }

  if (quizIds.size !== CLAUDE_QUIZ_IDS.length
    || !sameOrder(CLAUDE_QUIZ.map((question) => question.id), CLAUDE_QUIZ_IDS)) {
    add("quiz", "Quiz IDs must be unique and match the locked thirty-question bank.");
  }
  for (const question of CLAUDE_QUIZ) {
    const path = `quiz.${question.id}`;
    const lesson = CLAUDE_COURSE_MANIFEST.lessons.find((item) => item.slug === question.lessonSlug);
    if (!lesson
      || !(lesson.quizIds as readonly string[]).includes(question.id)
      || lesson.unitId !== question.unitId) {
      add(`${path}.lessonSlug`, "Quiz question must map to its declared lesson and unit.");
    }
    if (question.correctIndex < 0 || question.correctIndex > 3) {
      add(`${path}.correctIndex`, "Correct option index must be between zero and three.");
    }
    if (!question.sourceIds.length || question.sourceIds.some((id) => !sourceIds.has(id))) {
      add(`${path}.sourceIds`, "Quiz explanation must trace to one or more known sources.");
    }
    if (lesson && question.sourceIds.some(
      (id) => !(lesson.sourceIds as readonly string[]).includes(id),
    )) {
      add(`${path}.sourceIds`, "Quiz evidence must be included in the lesson's visible source ledger.");
    }
  }

  if (new Set(CLAUDE_FINAL_QUIZ_IDS).size !== 30
    || !sameOrder(CLAUDE_FINAL_QUIZ_IDS, CLAUDE_QUIZ_IDS)
    || CLAUDE_FINAL_QUIZ.bankSize !== 30) {
    add("finalQuiz.bankQuestionIds", "Final quiz must use the complete thirty-question bank.");
  }
  if (CLAUDE_FINAL_QUIZ.questionCount !== 16
    || CLAUDE_FINAL_QUIZ.questionsPerUnit !== 4
    || CLAUDE_FINAL_QUIZ.passingCorrectAnswers !== 13) {
    add("finalQuiz.selection", "Final quiz must draw four questions per unit and require thirteen of sixteen.");
  }
  if (CLAUDE_FINAL_QUIZ.selectionPolicy !== "stratified-random"
    || CLAUDE_FINAL_QUIZ.scorePolicy !== "best-score"
    || CLAUDE_FINAL_QUIZ.bankVersion !== CLAUDE_QUIZ_BANK_VERSION) {
    add("finalQuiz.policy", "Final quiz must use versioned stratified attempts and retain the best score.");
  }
  CLAUDE_UNIT_IDS.forEach((unitId, index) => {
    const count = CLAUDE_QUIZ.filter((question) => question.unitId === unitId).length;
    if (count !== EXPECTED_BANK_COUNTS[index]) {
      add(`quiz.${unitId}`, `Question bank must contain ${EXPECTED_BANK_COUNTS[index]} items for this unit.`);
    }
    if (count < CLAUDE_FINAL_QUIZ.questionsPerUnit) {
      add(`finalQuiz.${unitId}`, "Unit does not have enough questions for a balanced attempt.");
    }
  });

  if (figureIds.size !== CLAUDE_FIGURE_IDS.length
    || !sameOrder(CLAUDE_FIGURES.map((figure) => figure.id), CLAUDE_FIGURE_IDS)) {
    add("figures", "Figure IDs must be unique and match the locked figure ledger.");
  }
  const allAssetPaths = new Set<string>();
  for (const rawFigure of CLAUDE_FIGURES) {
    const figure = rawFigure as ClaudeFigureManifest;
    const path = `figures.${figure.id}`;
    for (const callout of figure.callouts ?? []) {
      if (!isNonEmptyString(callout.id) || !isNonEmptyString(callout.labelKey)) {
        add(`${path}.callouts`, "Callouts require stable IDs and localized label keys.");
      }
      if (callout.xPercent < 0 || callout.xPercent > 100
        || callout.yPercent < 0 || callout.yPercent > 100) {
        add(`${path}.callouts.${callout.id}`, "Callout coordinates must be percentages from zero to one hundred.");
      }
    }
    if (figure.status !== "available") {
      add(`${path}.status`, "Every lesson requires an available real-interface figure.");
      continue;
    }

    const lesson = CLAUDE_COURSE_MANIFEST.lessons.find((item) => item.slug === figure.lessonSlug);
    if (!(lesson?.figureIds as readonly string[] | undefined)?.includes(figure.id)) {
      add(`${path}.lessonSlug`, "Figure must map one-to-one to its lesson.");
    }
    const localPaths = [
      figure.src,
      figure.srcSet.webpLarge,
      figure.srcSet.webpSmall,
      ...(figure.srcSet.mobile ? [figure.srcSet.mobile] : []),
    ];
    if (localPaths.some((src) => !src.startsWith("/") || src.startsWith("//"))) {
      add(`${path}.srcSet`, "Figure assets must use root-relative local paths.");
    }
    if (new Set(localPaths).size !== localPaths.length) {
      add(`${path}.srcSet`, "Master and responsive figure assets must use distinct paths.");
    }
    for (const assetPath of localPaths) {
      if (allAssetPaths.has(assetPath)) {
        add(`${path}.srcSet`, `Figure asset is reused by another record: ${assetPath}.`);
      }
      allAssetPaths.add(assetPath);
    }
    if (!Number.isInteger(figure.width) || figure.width < 1
      || !Number.isInteger(figure.height) || figure.height < 1) {
      add(`${path}.dimensions`, "Figure requires positive intrinsic dimensions.");
    }
    if (figure.srcSet.largeWidth > figure.width
      || figure.srcSet.smallWidth >= figure.srcSet.largeWidth
      || figure.srcSet.smallWidth < 1) {
      add(`${path}.srcSet`, "Responsive widths must be positive, ordered, and no wider than the master.");
    }
    if (!/^[a-f0-9]{64}$/.test(figure.srcSet.largeSha256)
      || !/^[a-f0-9]{64}$/.test(figure.srcSet.smallSha256)) {
      add(`${path}.srcSet`, "Every responsive derivative requires a lowercase SHA-256 digest.");
    }
    const hasMobile = typeof figure.srcSet.mobile === "string";
    const hasMobileWidth = Number.isInteger(figure.srcSet.mobileWidth)
      && (figure.srcSet.mobileWidth ?? 0) > 0;
    const hasMobileHash = typeof figure.srcSet.mobileSha256 === "string"
      && /^[a-f0-9]{64}$/.test(figure.srcSet.mobileSha256);
    if (hasMobile !== hasMobileWidth || hasMobile !== hasMobileHash) {
      add(`${path}.srcSet.mobile`, "A mobile derivative requires a path, positive width, and lowercase SHA-256 together.");
    }
    if (!isValidDate(figure.observedOn)) {
      add(`${path}.observedOn`, "Figure requires a valid observation date.");
    }
    if (!isNonEmptyString(figure.observedUi)
      || !isNonEmptyString(figure.captureIntent)
      || !isNonEmptyString(figure.attribution)) {
      add(`${path}.provenance`, "Figure requires UI observation, teaching intent, and attribution.");
    }
    if (!/^[a-f0-9]{64}$/.test(figure.sha256)) {
      add(`${path}.sha256`, "Figure requires a lowercase SHA-256 digest.");
    }
    if (figure.privacyReviewed !== true || figure.privacyChecklist.length < 4) {
      add(`${path}.privacyReviewed`, "Figure requires completed privacy review and a recorded checklist.");
    }
    if (!figure.sourceUrl.startsWith("https://")) {
      add(`${path}.sourceUrl`, "Figure requires an HTTPS provenance URL.");
    }
    for (const message of validateClaudeFigureRights(figure)) {
      add(`${path}.rights`, message);
    }
    for (const message of validateClaudeFigureAuthenticity(figure)) {
      add(`${path}.authenticity`, message);
    }
  }

  if (!sameOrder(CLAUDE_CAPSTONE_ARTIFACT_IDS, [
    "task-brief",
    "input-log",
    "run-log",
    "deliverable",
    "verification-record",
    "disclosure-reflection",
  ])) {
    add("capstone.artifactIds", "Capstone must preserve the six-artifact evidence portfolio.");
  }
  if (!sameOrder(CLAUDE_CAPSTONE_RUBRIC.map((item) => item.id), EXPECTED_RUBRIC_IDS)) {
    add("capstone.rubric", "Capstone rubric must implement all four AI Fluency dimensions.");
  }
  if (CLAUDE_CAPSTONE_RUBRIC.reduce((sum, item) => sum + item.weight, 0) !== 100) {
    add("capstone.rubric", "Capstone rubric weights must total one hundred.");
  }
  if (CLAUDE_CAPSTONE_SCHEMA_VERSION !== "1.0.0"
    || CLAUDE_CAPSTONE_PASSING_SCORE !== 80
    || CLAUDE_CAPSTONE_PROGRESS_KEY !== "claude.capstone.v1"
    || CLAUDE_CAPSTONE_CRITICAL_CLEAR_KEY !== "claude.capstone.criticalClear") {
    add("capstone.contract", "Capstone schema, passing score, or storage keys differ from the locked contract.");
  }
  if (CLAUDE_CAPSTONE.schemaVersion !== CLAUDE_CAPSTONE_SCHEMA_VERSION
    || CLAUDE_CAPSTONE.artifactIds !== CLAUDE_CAPSTONE_ARTIFACT_IDS
    || CLAUDE_CAPSTONE.rubric !== CLAUDE_CAPSTONE_RUBRIC
    || CLAUDE_CAPSTONE.criticalClearKey !== CLAUDE_CAPSTONE_CRITICAL_CLEAR_KEY) {
    add("capstone", "Exported capstone contract must reference the canonical artifact and rubric manifests.");
  }

  const completeProgress: Record<string, unknown> = Object.fromEntries(
    CLAUDE_LESSON_SLUGS.map((slug) => [`claude.lesson.${slug}`, true]),
  );
  completeProgress[CLAUDE_FINAL_QUIZ.bestScoreStorageKey] = CLAUDE_FINAL_QUIZ.questionCount;
  completeProgress[CLAUDE_FINAL_QUIZ.passedStorageKey] = true;
  completeProgress[CLAUDE_FINAL_QUIZ.versionStorageKey] = CLAUDE_QUIZ_BANK_VERSION;
  for (const id of CLAUDE_CAPSTONE_ARTIFACT_IDS) {
    completeProgress[`claude.capstone.artifact.${id}`] = true;
  }
  for (const criterion of CLAUDE_CAPSTONE_RUBRIC) {
    completeProgress[`claude.capstone.rubric.${criterion.id}`] = criterion.weight;
  }
  completeProgress[CLAUDE_CAPSTONE_CRITICAL_CLEAR_KEY] = true;
  completeProgress[CLAUDE_CAPSTONE_PROGRESS_KEY] = true;
  if (claudeProgressPercent(completeProgress) !== 100
    || claudeProgressPercent({ "claude.lesson.choose-your-surface": true }) !== 6
    || claudeProgressPercent({ [CLAUDE_CAPSTONE_PROGRESS_KEY]: true }) !== 0
    || claudeProgressPercent(null) !== 0) {
    add("progress.adapter", "Catalogue progress must count exactly seventeen strict, equal milestones.");
  }

  const generatedAt = Date.parse(CLAUDE_ACADEMY_CATALOG.generatedAt);
  const staleAfter = Date.parse(CLAUDE_ACADEMY_CATALOG.staleAfter);
  if (!Number.isFinite(generatedAt)
    || !Number.isFinite(staleAfter)
    || generatedAt >= staleAfter) {
    add("academyCatalog.dates", "Academy catalogue generation time must precede its stale-after gate.");
  }
  if (CLAUDE_ACADEMY_CATALOG.itemCount !== 289
    || !CLAUDE_ACADEMY_CATALOG.url.startsWith("https://")) {
    add("academyCatalog", "Academy catalogue snapshot must record the verified 289-item HTTPS source.");
  }
  if (!isValidDate(CLAUDE_ACADEMY_CATALOG.fetchedOn)) {
    add("academyCatalog.fetchedOn", "Academy catalogue fetch date must be valid.");
  }

  for (const id of CLAUDE_SOURCE_IDS) {
    if (!CLAUDE_SOURCE_BY_ID[id]) {
      add(`sources.${id}`, "Source lookup table is missing a declared source.");
    }
  }

  return issues;
}

export async function validateBundledClaudeContent(): Promise<readonly ClaudeValidationIssue[]> {
  const { loadClaudeCopy } = await import("./load");
  const english = await loadClaudeCopy("en");
  const issues = [
    ...validateClaudeManifests(),
    ...validateClaudeCopy("en", english),
  ];
  for (const locale of CLAUDE_LOCALES) {
    if (locale === "en") continue;
    const copy = await loadClaudeCopy(locale);
    issues.push(...validateClaudeCopy(locale, copy, english));
  }
  return issues;
}

export async function assertBundledClaudeContent(): Promise<void> {
  const issues = await validateBundledClaudeContent();
  if (issues.length) {
    const detail = issues
      .map((issue) => `[${issue.locale}] ${issue.path}: ${issue.message}`)
      .join("\n");
    throw new Error(`Claude course validation failed:\n${detail}`);
  }
}
