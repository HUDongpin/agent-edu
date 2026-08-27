import {
  CODEX_CAPSTONE_ARTIFACT_IDS,
  CODEX_CAPSTONE_FIXTURE_SHA256,
  CODEX_CAPSTONE_FIXTURE_VERSION,
  CODEX_CAPSTONE_RECEIPT_SCHEMA,
  CODEX_CAPSTONE_REQUIRED_CHECKS,
  CODEX_CAPSTONE_RUBRIC,
  CODEX_CAPSTONE_STAGE_IDS,
  validateCodexCapstoneReceipt,
} from "./capstone";
import { CODEX_FIGURES } from "./figures";
import { CODEX_COURSE_MANIFEST } from "./manifest";
import { CODEX_PRACTICES } from "./practices";
import { CODEX_FINAL_QUIZ, CODEX_FINAL_QUIZ_IDS, CODEX_QUIZ } from "./quiz";
import { CODEX_SOURCE_BY_ID, CODEX_SOURCES } from "./sources";
import {
  CODEX_FIGURE_AUDIT_SCHEMA,
  CODEX_DIAGRAM_RIGHTS_SCHEMA,
  CODEX_FIGURE_IDS,
  CODEX_FIGURE_METADATA_CHECK_IDS,
  CODEX_FIGURE_METADATA_CHECKLIST_VERSION,
  CODEX_FIGURE_OCR_CHECK_IDS,
  CODEX_FIGURE_OCR_CHECKLIST_VERSION,
  CODEX_FIGURE_PRIVACY_CHECK_IDS,
  CODEX_FIGURE_PRIVACY_CHECKLIST_VERSION,
  CODEX_ORIGINAL_DIAGRAM_FIGURE_IDS,
  CODEX_ORIGINAL_DIAGRAM_LABEL,
  CODEX_ORIGINAL_DIAGRAM_RENDER_ENVIRONMENT,
  CODEX_ORIGINAL_DIAGRAM_RENDERER_VERSION,
  CODEX_PRODUCT_UI_CAPTURE_FIGURE_IDS,
  CODEX_LESSON_SLUGS,
  CODEX_LOCALES,
  CODEX_QUIZ_IDS,
  CODEX_UNIT_IDS,
  type CodexBlock,
  type CodexCourseCopy,
  type CodexFigureAvailable,
  type CodexFigureManifest,
  type CodexOriginalDiagramFigure,
  type CodexLocale,
} from "./types";
import figureAuditLedger from "./figure-audits.json";
import diagramRightsLedger from "./diagram-rights.json";

export interface CodexValidationIssue {
  readonly locale: CodexLocale | "manifest";
  readonly path: string;
  readonly message: string;
}

const COPY_META_KEYS = [
  "title", "kicker", "summary", "audience", "duration", "sourceNote",
  "figureNote", "startCta", "resumeCta",
] as const;

const COPY_UI_KEYS = [
  "lessons", "minutes", "objectives", "evidence", "practice", "checkpoint",
  "sources", "quiz", "previous", "next", "capturePending", "optionalAdvanced",
  "progress", "courseProgress", "completed", "markComplete", "markedComplete",
  "resetProgress", "question", "of", "checkAnswer", "checkAnswers", "correct",
  "incorrect", "tryAgain", "score", "quizPassed", "quizNeedsReview",
  "capstoneArtifacts", "capstoneReceipt", "artifactReady", "rubric",
  "rubricComplete", "passingScore", "weight", "status", "notStarted",
  "printReceipt", "browserStorageNote", "backToCourse", "allLessons",
  "recordCompletion", "finalQuizTitle", "finalQuizIntro", "beginQuiz",
  "nextQuestion", "retryQuiz", "bestScore", "passRequirement", "source",
  "sourceVerifiedOn", "stars", "license", "storageUnavailable",
  "receiptInstructions", "receiptSchemaLabel", "fixtureVersionLabel",
  "fixtureHashLabel", "requiredChecksLabel", "pasteReceipt", "verifyReceipt",
  "receiptValid", "receiptInvalidJson", "receiptWrongSchema",
  "receiptWrongVersion", "receiptWrongHash", "receiptIncomplete", "downloadStarter",
  "completionSummary", "exportSummary", "finishQuiz", "questionProgressTemplate",
  "scoreSummaryTemplate", "bestScoreTemplate", "resetConfirm", "resetDone",
  "capstonePath",
] as const;

const COPY_LESSON_KEYS = [
  "kicker", "title", "summary", "objective", "sections", "practice",
  "checkpoint", "takeaway",
] as const;
const COPY_PRACTICE_KEYS = ["title", "brief", "steps", "evidence", "safety"] as const;
const COPY_CAPSTONE_KEYS = [
  "title", "summary", "scenario", "instructions", "artifacts", "rubric", "pass",
  "retry", "completion",
] as const;

const PROTECTED_TECHNICAL_LITERALS = {
  "quiz.q15.explanation": ["AGENTS.md"],
  "lessons.implement-steer.sections[0].body": ["/plan", "/goal"],
  "lessons.review-diff.sections[1].body": ["chatgpt.reviewDelivery"],
  "lessons.cli.sections[0].body": [
    "npm install -g @openai/codex",
    "codex login",
    "codex login status",
    "printenv OPENAI_API_KEY | codex login --with-api-key",
    "AGENTS.md",
  ],
  "lessons.cli.sections[1].body": [
    "/status", "/permissions", "/model", "/init", "AGENTS.md", "/diff",
    "/review", "/resume", "codex resume --last", "--all",
  ],
  "lessons.cli.sections[2].body": [
    "codex exec", "--json", "--output-schema", "./schema.json", "-o",
    "./result.json", "--sandbox read-only", "--sandbox workspace-write",
    "codex exec resume --last",
  ],
  "lessons.cli.checkpoint.prompt": ["codex exec"],
  "lessons.ide.sections[0].body": ["/ide-context"],
  "lessons.ide.sections[1].body": ["/review"],
  "lessons.ide.sections[2].body": ["/cloud", "/cloud-environment", "/local", "/worktree"],
  "lessons.cloud-parallel.sections[1].body": ["/agent", "/goal"],
  "lessons.automation-capstone.sections[0].body": [
    "actions/checkout", "persist-credentials: false", "contents: read",
    "openai/codex-action@v1", "@v1", "codex-version", "permission-profile",
    ":workspace", "safety-strategy", "sandbox", "drop-sudo", "unprivileged-user",
  ],
  "lessons.automation-capstone.sections[1].body": [
    "${{ ... }}", "env", "codex-home", "OPENAI_API_KEY",
  ],
} as const;

const REQUIRED_ENGLISH_SEMANTIC_GUARDS = {
  "lessons.cli.sections[2].body": [
    "unconfigured default as read-only",
    "an omitted --sandbox inherits the active configuration",
    "must therefore not assume read-only",
    "--sandbox read-only explicitly",
  ],
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(
  value: unknown,
  expected: readonly string[],
  locale: CodexLocale,
  path: string,
  issues: CodexValidationIssue[],
): value is Record<string, unknown> {
  if (!isRecord(value)) {
    issues.push({ locale, path, message: "Expected an object." });
    return false;
  }
  const actual = Object.keys(value);
  const missing = expected.filter((key) => !actual.includes(key));
  const extra = actual.filter((key) => !expected.includes(key));
  if (missing.length || extra.length) {
    issues.push({ locale, path, message: `Key mismatch. Missing: ${missing.join(", ") || "none"}. Extra: ${extra.join(", ") || "none"}.` });
    return false;
  }
  return true;
}

function walkStrings(
  value: unknown,
  locale: CodexLocale,
  path: string,
  issues: CodexValidationIssue[],
): void {
  if (typeof value === "string") {
    if (!value.trim()) issues.push({ locale, path, message: "Visible copy must not be empty." });
    if (value.includes("\u2014")) issues.push({ locale, path, message: "Visible copy contains a prohibited em dash character." });
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
  issues.push({ locale, path, message: "Localized copy may contain only objects, arrays, and strings." });
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

function inlineCodeLiteralSignature(value: string): string {
  return [...value.matchAll(/`([^`\n]+)`/g)]
    .map((match) => match[1])
    .sort()
    .join("|");
}

function copyValueAtPath(root: unknown, copyKey: string): unknown {
  const segments = [...copyKey.matchAll(/(?:^|\.)([^.[\]]+)|\[(\d+)\]/g)]
    .map((match) => match[1] ?? match[2]);
  if (!segments.length) return undefined;
  return segments.reduce<unknown>((value, segment) => {
    if (Array.isArray(value) && /^\d+$/.test(segment)) return value[Number(segment)];
    if (isRecord(value) && segment in value) return value[segment];
    return undefined;
  }, root);
}

function comparePlaceholderParity(
  reference: unknown,
  candidate: unknown,
  locale: CodexLocale,
  path: string,
  issues: CodexValidationIssue[],
): void {
  if (typeof reference === "string" && typeof candidate === "string") {
    const expected = placeholderSignature(reference);
    const actual = placeholderSignature(candidate);
    if (actual !== expected) {
      issues.push({ locale, path, message: `Placeholder mismatch. Expected: ${expected || "none"}. Actual: ${actual || "none"}.` });
    }
    return;
  }
  if (Array.isArray(reference) && Array.isArray(candidate)) {
    reference.forEach((item, index) => comparePlaceholderParity(item, candidate[index], locale, `${path}[${index}]`, issues));
    return;
  }
  if (isRecord(reference) && isRecord(candidate)) {
    Object.keys(reference).forEach((key) => comparePlaceholderParity(reference[key], candidate[key], locale, `${path}.${key}`, issues));
  }
}

function compareInlineCodeLiteralParity(
  reference: unknown,
  candidate: unknown,
  locale: CodexLocale,
  path: string,
  issues: CodexValidationIssue[],
): void {
  if (typeof reference === "string" && typeof candidate === "string") {
    const expected = inlineCodeLiteralSignature(reference);
    const actual = inlineCodeLiteralSignature(candidate);
    if (actual !== expected) {
      issues.push({
        locale,
        path,
        message: `Inline code literal mismatch. Expected: ${expected || "none"}. Actual: ${actual || "none"}.`,
      });
    }
    return;
  }
  if (Array.isArray(reference) && Array.isArray(candidate)) {
    reference.forEach((item, index) => compareInlineCodeLiteralParity(item, candidate[index], locale, `${path}[${index}]`, issues));
    return;
  }
  if (isRecord(reference) && isRecord(candidate)) {
    Object.keys(reference).forEach((key) => compareInlineCodeLiteralParity(reference[key], candidate[key], locale, `${path}.${key}`, issues));
  }
}

export function validateCodexCopy(
  locale: CodexLocale,
  copy: unknown,
  englishReference?: CodexCourseCopy,
): readonly CodexValidationIssue[] {
  const issues: CodexValidationIssue[] = [];
  if (!isRecord(copy)) {
    return [{ locale, path: "$", message: "Course copy must be an object." }];
  }

  exactKeys(copy, ["meta", "ui", "units", "lessons", "quiz", "figures", "capstone"], locale, "$", issues);
  exactKeys(copy.meta, COPY_META_KEYS, locale, "$.meta", issues);
  exactKeys(copy.ui, COPY_UI_KEYS, locale, "$.ui", issues);
  exactKeys(copy.units, CODEX_UNIT_IDS, locale, "$.units", issues);
  exactKeys(copy.lessons, CODEX_LESSON_SLUGS, locale, "$.lessons", issues);
  exactKeys(copy.quiz, CODEX_QUIZ_IDS, locale, "$.quiz", issues);
  exactKeys(copy.figures, CODEX_FIGURE_IDS, locale, "$.figures", issues);

  if (isRecord(copy.units)) {
    for (const unitId of CODEX_UNIT_IDS) {
      exactKeys(copy.units[unitId], ["title", "summary"], locale, `$.units.${unitId}`, issues);
    }
  }

  if (isRecord(copy.lessons)) {
    for (const slug of CODEX_LESSON_SLUGS) {
      const lesson = copy.lessons[slug];
      if (!isRecord(lesson)) continue;
      exactKeys(lesson, COPY_LESSON_KEYS, locale, `$.lessons.${slug}`, issues);
      if (!Array.isArray(lesson.sections) || lesson.sections.length !== 3) {
        issues.push({ locale, path: `$.lessons.${slug}.sections`, message: "Every lesson must contain exactly three teaching sections." });
      } else {
        lesson.sections.forEach((section, index) => {
          exactKeys(section, ["heading", "body"], locale, `$.lessons.${slug}.sections[${index}]`, issues);
        });
      }
      if (isRecord(lesson.practice)) {
        exactKeys(lesson.practice, COPY_PRACTICE_KEYS, locale, `$.lessons.${slug}.practice`, issues);
        if (!Array.isArray(lesson.practice.steps) || lesson.practice.steps.length !== 3) {
          issues.push({ locale, path: `$.lessons.${slug}.practice.steps`, message: "Every practice must contain exactly three steps." });
        }
        if (!Array.isArray(lesson.practice.evidence) || lesson.practice.evidence.length !== 2) {
          issues.push({ locale, path: `$.lessons.${slug}.practice.evidence`, message: "Every practice must request exactly two evidence items." });
        }
      }
      exactKeys(lesson.checkpoint, ["prompt", "answer"], locale, `$.lessons.${slug}.checkpoint`, issues);

      const manifest = CODEX_COURSE_MANIFEST.lessons.find((item) => item.slug === slug);
      const localizedBlocks = (manifest?.blocks ?? []) as readonly CodexBlock[];
      for (const [blockIndex, block] of localizedBlocks.entries()) {
        const blockPath = `$.lessons.${slug}.blocks[${blockIndex}]`;
        switch (block.type) {
          case "steps": {
            const value = copyValueAtPath(copy, block.copyKey);
            if (!Array.isArray(value) || value.length === 0 || !value.every((item) => typeof item === "string" && item.trim())) {
              issues.push({ locale, path: blockPath, message: `Steps copyKey must resolve to a non-empty string array: ${block.copyKey}.` });
            }
            break;
          }
          case "callout": {
            const value = copyValueAtPath(copy, block.copyKey);
            if (typeof value !== "string" || !value.trim()) {
              issues.push({ locale, path: blockPath, message: `Callout copyKey must resolve to a non-empty string: ${block.copyKey}.` });
            }
            break;
          }
          case "comparison": {
            const headers = block.columns.map((key) => copyValueAtPath(copy, key));
            if (headers.some((value) => typeof value !== "string" || !value.trim())) {
              issues.push({ locale, path: blockPath, message: "Every comparison column must resolve to a non-empty localized string." });
            }
            const rows = copyValueAtPath(copy, block.copyKey);
            if (!Array.isArray(rows) || rows.length === 0 || !rows.every((row) => (
              Array.isArray(row)
              && row.length === block.columns.length
              && row.every((cell) => typeof cell === "string" && cell.trim())
            ))) {
              issues.push({ locale, path: blockPath, message: `Comparison copyKey must resolve to non-empty rows with ${block.columns.length} columns: ${block.copyKey}.` });
            }
            break;
          }
          case "prose":
          case "code":
          case "figure":
          case "exercise":
          case "source-note":
            break;
        }
      }
    }
  }

  if (isRecord(copy.quiz)) {
    for (const id of CODEX_QUIZ_IDS) {
      const question = copy.quiz[id];
      if (isRecord(question)) {
        exactKeys(question, ["question", "options", "explanation"], locale, `$.quiz.${id}`, issues);
        if (!Array.isArray(question.options) || question.options.length !== 4) {
          issues.push({ locale, path: `$.quiz.${id}.options`, message: "Every quiz question must have exactly four options." });
        }
      }
    }
  }

  if (isRecord(copy.figures)) {
    for (const id of CODEX_FIGURE_IDS) {
      const figure = copy.figures[id];
      if (!isRecord(figure)) continue;
      const manifest = CODEX_FIGURES.find((item) => item.id === id) as CodexFigureManifest | undefined;
      const calloutKeys = (manifest?.callouts ?? []).map((callout) => callout.labelKey);
      exactKeys(
        figure,
        calloutKeys.length
          ? ["alt", "caption", "callouts"]
          : ["alt", "caption"],
        locale,
        `$.figures.${id}`,
        issues,
      );
      if (calloutKeys.length) {
        exactKeys(figure.callouts, calloutKeys, locale, `$.figures.${id}.callouts`, issues);
      }
    }
  }

  if (isRecord(copy.capstone)) {
    exactKeys(copy.capstone, COPY_CAPSTONE_KEYS, locale, "$.capstone", issues);
    exactKeys(copy.capstone.artifacts, CODEX_CAPSTONE_ARTIFACT_IDS, locale, "$.capstone.artifacts", issues);
    exactKeys(copy.capstone.rubric, CODEX_CAPSTONE_RUBRIC.map((item) => item.id), locale, "$.capstone.rubric", issues);
    if (isRecord(copy.capstone.artifacts)) {
      for (const id of CODEX_CAPSTONE_ARTIFACT_IDS) {
        exactKeys(copy.capstone.artifacts[id], ["title", "description"], locale, `$.capstone.artifacts.${id}`, issues);
      }
    }
    if (isRecord(copy.capstone.rubric)) {
      for (const { id } of CODEX_CAPSTONE_RUBRIC) {
        exactKeys(copy.capstone.rubric[id], ["title", "description"], locale, `$.capstone.rubric.${id}`, issues);
      }
    }
    if (!Array.isArray(copy.capstone.instructions) || copy.capstone.instructions.length !== CODEX_CAPSTONE_STAGE_IDS.length) {
      issues.push({ locale, path: "$.capstone.instructions", message: `Capstone must contain ${CODEX_CAPSTONE_STAGE_IDS.length} ordered stage instructions.` });
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
        issues.push({ locale, path: `$.ui.${key}`, message: `Template must contain exactly these placeholders: ${expected}.` });
      }
    }
  }

  for (const [copyKey, literals] of Object.entries(PROTECTED_TECHNICAL_LITERALS)) {
    const value = copyValueAtPath(copy, copyKey);
    if (typeof value !== "string") {
      issues.push({ locale, path: `$.${copyKey}`, message: "Protected technical copy must resolve to a string." });
      continue;
    }
    for (const literal of literals) {
      if (!value.includes(literal)) {
        issues.push({ locale, path: `$.${copyKey}`, message: `Required technical literal is missing: ${literal}.` });
      }
    }
  }

  if (locale === "en") {
    for (const [copyKey, fragments] of Object.entries(REQUIRED_ENGLISH_SEMANTIC_GUARDS)) {
      const value = copyValueAtPath(copy, copyKey);
      if (typeof value !== "string") continue;
      for (const fragment of fragments) {
        if (!value.includes(fragment)) {
          issues.push({ locale, path: `$.${copyKey}`, message: `Required semantic guard is missing: ${fragment}.` });
        }
      }
    }
  }

  walkStrings(copy, locale, "$", issues);

  if (englishReference) {
    const reference = structureSignature(englishReference).join("\n");
    const candidate = structureSignature(copy).join("\n");
    if (reference !== candidate) {
      issues.push({ locale, path: "$", message: "Localized copy structure does not match the English reference." });
    }
    comparePlaceholderParity(englishReference, copy, locale, "$", issues);
    compareInlineCodeLiteralParity(englishReference, copy, locale, "$", issues);
  }

  return issues;
}

type ManifestIssueAdder = (path: string, message: string) => void;

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const AUDIT_ID_PATTERN = /^codex-figure-audit\.fig-(?:0[1-9]|1\d|2[0-4])\.[a-z0-9][a-z0-9._-]*$/;
const DIAGRAM_RIGHTS_ID_PATTERN = /^codex-diagram-rights\.fig-(?:0[1-9]|1\d|2[0-4])\.[a-z0-9][a-z0-9._-]*$/;
const PLACEHOLDER_HUMAN_REVIEWER = /(?:^|[-_.\s])(?:tbd|pending|unknown|anonymous|ai|codex|bot|agent)(?:$|[-_.\s])/iu;

function exactManifestKeys(
  value: unknown,
  expected: readonly string[],
  path: string,
  add: ManifestIssueAdder,
): value is Record<string, unknown> {
  if (!isRecord(value)) {
    add(path, "Expected an object.");
    return false;
  }
  const actual = Object.keys(value);
  const missing = expected.filter((key) => !actual.includes(key));
  const extra = actual.filter((key) => !expected.includes(key));
  if (missing.length || extra.length) {
    add(path, `Key mismatch. Missing: ${missing.join(", ") || "none"}. Extra: ${extra.join(", ") || "none"}.`);
    return false;
  }
  return true;
}

function isValidDateOnly(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_ONLY_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function requireDateOnly(value: unknown, path: string, add: ManifestIssueAdder): value is string {
  if (!isValidDateOnly(value)) {
    add(path, "Expected a real calendar date in YYYY-MM-DD form.");
    return false;
  }
  return true;
}

function requireNonEmptyString(value: unknown, path: string, add: ManifestIssueAdder): value is string {
  if (typeof value !== "string" || !value.trim()) {
    add(path, "Expected a non-empty string.");
    return false;
  }
  return true;
}

function requireHumanReviewerId(value: unknown, path: string, add: ManifestIssueAdder): value is string {
  if (!requireNonEmptyString(value, path, add)) return false;
  if (value.trim() !== value || PLACEHOLDER_HUMAN_REVIEWER.test(value)) {
    add(path, "Expected a non-placeholder stable human reviewer ID.");
    return false;
  }
  return true;
}

function requireNonFutureDateOnly(value: unknown, path: string, add: ManifestIssueAdder): value is string {
  if (!requireDateOnly(value, path, add)) return false;
  if (value > new Date().toISOString().slice(0, 10)) {
    add(path, "Review dates may not be in the future.");
    return false;
  }
  return true;
}

function requireSha256(value: unknown, path: string, add: ManifestIssueAdder): value is string {
  if (typeof value !== "string" || !SHA256_PATTERN.test(value)) {
    add(path, "Expected a lowercase 64-character SHA-256 digest.");
    return false;
  }
  return true;
}

function validateBooleanChecklist(
  value: unknown,
  requiredKeys: readonly string[],
  path: string,
  add: ManifestIssueAdder,
): void {
  if (!exactManifestKeys(value, requiredKeys, path, add)) return;
  for (const key of requiredKeys) {
    if (value[key] !== true) add(`${path}.${key}`, "Mandatory review result must be true.");
  }
}

function validateReviewHeader(
  review: Record<string, unknown>,
  expectedChecklistVersion: string,
  path: string,
  add: ManifestIssueAdder,
): void {
  requireHumanReviewerId(review.reviewer, `${path}.reviewer`, add);
  requireNonFutureDateOnly(review.reviewedOn, `${path}.reviewedOn`, add);
  if (review.checklistVersion !== expectedChecklistVersion) {
    add(`${path}.checklistVersion`, `Expected checklist version ${expectedChecklistVersion}.`);
  }
}

function validateServedAsset(
  value: unknown,
  role: "png2240" | "webp2240" | "webp1120" | "mobile",
  path: string,
  add: ManifestIssueAdder,
): value is Record<string, unknown> {
  if (!exactManifestKeys(value, ["path", "mediaType", "width", "height", "sha256"], path, add)) return false;
  const expectedMediaType = role === "png2240" ? "image/png" : "image/webp";
  const expectedWidth = role === "png2240" || role === "webp2240" ? 2240 : role === "webp1120" ? 1120 : null;
  if (typeof value.path !== "string" || !/^\/courses\/codex\/(?!.*(?:\.\.|[?#]))[^\s]+$/.test(value.path)) {
    add(`${path}.path`, "Served figure assets must use clean root-relative paths under /courses/codex/.");
  }
  if (value.mediaType !== expectedMediaType) add(`${path}.mediaType`, `Expected ${expectedMediaType}.`);
  if (!Number.isInteger(value.width) || Number(value.width) < 1) add(`${path}.width`, "Asset width must be a positive integer.");
  if (expectedWidth !== null && value.width !== expectedWidth) add(`${path}.width`, `Expected the locked ${expectedWidth}-pixel width.`);
  if (!Number.isInteger(value.height) || Number(value.height) < 1) add(`${path}.height`, "Asset height must be a positive integer.");
  requireSha256(value.sha256, `${path}.sha256`, add);
  return true;
}

/**
 * Validates the external figure-audit ledger and its two-way bindings to every
 * available Course 2 figure. A legacy privacyReviewed flag can never satisfy
 * this release contract without a complete matching audit record.
 */
export function validateCodexFigureAuditLedger(
  figures: readonly CodexFigureManifest[] = CODEX_FIGURES as readonly CodexFigureManifest[],
  ledger: unknown = figureAuditLedger,
): readonly CodexValidationIssue[] {
  const issues: CodexValidationIssue[] = [];
  const add: ManifestIssueAdder = (path, message) => issues.push({ locale: "manifest", path, message });
  const figureById = new Map(figures.map((figure) => [figure.id, figure]));
  const auditById = new Map<string, Record<string, unknown>>();
  const auditIdByFigureId = new Map<string, string>();

  if (!exactManifestKeys(ledger, ["schema", "audits"], "figureAudits", add)) {
    for (const figure of figures) {
      if (figure.kind === "product-ui-capture") add(`figures.${figure.id}.auditId`, "Product UI capture has no usable external audit ledger.");
    }
    return issues;
  }
  if (ledger.schema !== CODEX_FIGURE_AUDIT_SCHEMA) {
    add("figureAudits.schema", `Expected ${CODEX_FIGURE_AUDIT_SCHEMA}.`);
  }
  if (!Array.isArray(ledger.audits)) {
    add("figureAudits.audits", "Audit ledger must contain an audits array.");
    for (const figure of figures) {
      if (figure.kind === "product-ui-capture") add(`figures.${figure.id}.auditId`, "Product UI capture has no usable external audit records.");
    }
    return issues;
  }

  for (const [auditIndex, auditValue] of ledger.audits.entries()) {
    const path = `figureAudits.audits[${auditIndex}]`;
    if (!exactManifestKeys(
      auditValue,
      ["id", "figureId", "status", "binding", "rawSource", "servedAssets", "product", "officialSupportingSourceId", "reviews", "provenance"],
      path,
      add,
    )) continue;

    const audit = auditValue;
    const auditId = audit.id;
    const figureId = audit.figureId;
    if (typeof auditId !== "string" || !AUDIT_ID_PATTERN.test(auditId)) {
      add(`${path}.id`, "Audit ID must bind a figure using codex-figure-audit.fig-XX.<stable-suffix>.");
    } else if (auditById.has(auditId)) {
      add(`${path}.id`, `Duplicate audit ID: ${auditId}.`);
    } else {
      auditById.set(auditId, audit);
    }
    if (typeof figureId !== "string" || !CODEX_FIGURE_IDS.includes(figureId as (typeof CODEX_FIGURE_IDS)[number])) {
      add(`${path}.figureId`, "Audit must reference a known Course 2 figure ID.");
    } else if (auditIdByFigureId.has(figureId)) {
      add(`${path}.figureId`, `Figure already has audit ${auditIdByFigureId.get(figureId)}.`);
    } else if (typeof auditId === "string") {
      auditIdByFigureId.set(figureId, auditId);
    }
    if (audit.status !== "approved") add(`${path}.status`, "Only an explicitly approved audit may release a figure.");

    if (exactManifestKeys(audit.binding, ["lessonSlug", "surface"], `${path}.binding`, add)) {
      if (typeof audit.binding.lessonSlug !== "string" || !CODEX_LESSON_SLUGS.includes(audit.binding.lessonSlug as (typeof CODEX_LESSON_SLUGS)[number])) {
        add(`${path}.binding.lessonSlug`, "Audit binding must reference a known Course 2 lesson.");
      }
      if (!["app", "cli", "ide", "cloud", "github"].includes(String(audit.binding.surface))) {
        add(`${path}.binding.surface`, "Audit binding must use a supported Codex surface.");
      }
    }

    let rawSourceKind: unknown;
    if (exactManifestKeys(
      audit.rawSource,
      ["kind", "archivalRef", "mediaType", "width", "height", "sha256", "retainedOutsidePublic"],
      `${path}.rawSource`,
      add,
    )) {
      rawSourceKind = audit.rawSource.kind;
      if (!["course-authored-capture", "third-party-original"].includes(String(rawSourceKind))) {
        add(`${path}.rawSource.kind`, "Raw source must be a course-authored capture or third-party original.");
      }
      if (requireNonEmptyString(audit.rawSource.archivalRef, `${path}.rawSource.archivalRef`, add)) {
        if (/^(?:\/|~[/\\]|[A-Za-z]:[\\/]|https?:\/\/)/.test(audit.rawSource.archivalRef) || audit.rawSource.archivalRef.includes("..")) {
          add(`${path}.rawSource.archivalRef`, "Use a stable audit-vault reference, not an absolute path, URL, or traversal path.");
        }
        if (/^public(?:\/|$)/.test(audit.rawSource.archivalRef)) {
          add(`${path}.rawSource.archivalRef`, "Raw captures must remain outside the public asset tree.");
        }
      }
      if (!["image/png", "image/webp"].includes(String(audit.rawSource.mediaType))) {
        add(`${path}.rawSource.mediaType`, "Raw source must declare image/png or image/webp.");
      }
      if (!Number.isInteger(audit.rawSource.width) || Number(audit.rawSource.width) < 1) add(`${path}.rawSource.width`, "Raw width must be a positive integer.");
      if (!Number.isInteger(audit.rawSource.height) || Number(audit.rawSource.height) < 1) add(`${path}.rawSource.height`, "Raw height must be a positive integer.");
      requireSha256(audit.rawSource.sha256, `${path}.rawSource.sha256`, add);
      if (audit.rawSource.retainedOutsidePublic !== true) add(`${path}.rawSource.retainedOutsidePublic`, "Raw source must be retained outside public assets.");
    }

    const servedAssetRecords = new Map<string, Record<string, unknown>>();
    if (isRecord(audit.servedAssets)) {
      const keys = Object.keys(audit.servedAssets);
      const required = ["png2240", "webp2240", "webp1120"];
      const missing = required.filter((key) => !keys.includes(key));
      const extra = keys.filter((key) => ![...required, "mobile"].includes(key));
      if (missing.length || extra.length) {
        add(`${path}.servedAssets`, `Key mismatch. Missing: ${missing.join(", ") || "none"}. Extra: ${extra.join(", ") || "none"}.`);
      }
      for (const role of [...required, ...(keys.includes("mobile") ? ["mobile"] : [])] as ("png2240" | "webp2240" | "webp1120" | "mobile")[]) {
        const asset = audit.servedAssets[role];
        if (validateServedAsset(asset, role, `${path}.servedAssets.${role}`, add)) servedAssetRecords.set(role, asset);
      }
      const paths = [...servedAssetRecords.values()].map((asset) => asset.path).filter((value): value is string => typeof value === "string");
      if (new Set(paths).size !== paths.length) add(`${path}.servedAssets`, "Every served derivative must have a distinct path.");
      const png = servedAssetRecords.get("png2240");
      const webp2240 = servedAssetRecords.get("webp2240");
      const webp1120 = servedAssetRecords.get("webp1120");
      if (png && webp2240 && png.height !== webp2240.height) {
        add(`${path}.servedAssets.webp2240.height`, "The 2240-pixel WebP must preserve the PNG master's height.");
      }
      if (png && webp1120 && typeof png.height === "number" && typeof webp1120.height === "number" && Math.abs(webp1120.height * 2 - png.height) > 1) {
        add(`${path}.servedAssets.webp1120.height`, "The 1120-pixel WebP must preserve the master aspect ratio.");
      }
    } else {
      add(`${path}.servedAssets`, "Expected an object containing frozen served assets.");
    }

    let capturedOn: string | undefined;
    if (exactManifestKeys(audit.product, ["capturedOn", "codexVersion", "operatingSystem"], `${path}.product`, add)) {
      if (requireDateOnly(audit.product.capturedOn, `${path}.product.capturedOn`, add)) capturedOn = audit.product.capturedOn;
      requireNonEmptyString(audit.product.codexVersion, `${path}.product.codexVersion`, add);
      requireNonEmptyString(audit.product.operatingSystem, `${path}.product.operatingSystem`, add);
    }

    const supportingSource = typeof audit.officialSupportingSourceId === "string"
      ? CODEX_SOURCES.find((source) => source.id === audit.officialSupportingSourceId)
      : undefined;
    if (!supportingSource || supportingSource.kind !== "official-doc") {
      add(`${path}.officialSupportingSourceId`, "Audit must reference a current official OpenAI documentation source ID.");
    }

    const reviewDates: string[] = [];
    if (exactManifestKeys(audit.reviews, ["ocr", "metadata", "privacy"], `${path}.reviews`, add)) {
      if (exactManifestKeys(
        audit.reviews.ocr,
        ["reviewer", "reviewedOn", "checklistVersion", "engine", "engineVersion", "transcriptSha256", "checks"],
        `${path}.reviews.ocr`,
        add,
      )) {
        validateReviewHeader(audit.reviews.ocr, CODEX_FIGURE_OCR_CHECKLIST_VERSION, `${path}.reviews.ocr`, add);
        if (isValidDateOnly(audit.reviews.ocr.reviewedOn)) reviewDates.push(audit.reviews.ocr.reviewedOn);
        requireNonEmptyString(audit.reviews.ocr.engine, `${path}.reviews.ocr.engine`, add);
        requireNonEmptyString(audit.reviews.ocr.engineVersion, `${path}.reviews.ocr.engineVersion`, add);
        requireSha256(audit.reviews.ocr.transcriptSha256, `${path}.reviews.ocr.transcriptSha256`, add);
        validateBooleanChecklist(audit.reviews.ocr.checks, CODEX_FIGURE_OCR_CHECK_IDS, `${path}.reviews.ocr.checks`, add);
      }
      if (exactManifestKeys(
        audit.reviews.metadata,
        ["reviewer", "reviewedOn", "checklistVersion", "tool", "toolVersion", "checks"],
        `${path}.reviews.metadata`,
        add,
      )) {
        validateReviewHeader(audit.reviews.metadata, CODEX_FIGURE_METADATA_CHECKLIST_VERSION, `${path}.reviews.metadata`, add);
        if (isValidDateOnly(audit.reviews.metadata.reviewedOn)) reviewDates.push(audit.reviews.metadata.reviewedOn);
        requireNonEmptyString(audit.reviews.metadata.tool, `${path}.reviews.metadata.tool`, add);
        requireNonEmptyString(audit.reviews.metadata.toolVersion, `${path}.reviews.metadata.toolVersion`, add);
        validateBooleanChecklist(audit.reviews.metadata.checks, CODEX_FIGURE_METADATA_CHECK_IDS, `${path}.reviews.metadata.checks`, add);
      }
      if (exactManifestKeys(
        audit.reviews.privacy,
        ["reviewer", "reviewedOn", "checklistVersion", "checks"],
        `${path}.reviews.privacy`,
        add,
      )) {
        validateReviewHeader(audit.reviews.privacy, CODEX_FIGURE_PRIVACY_CHECKLIST_VERSION, `${path}.reviews.privacy`, add);
        if (isValidDateOnly(audit.reviews.privacy.reviewedOn)) reviewDates.push(audit.reviews.privacy.reviewedOn);
        validateBooleanChecklist(audit.reviews.privacy.checks, CODEX_FIGURE_PRIVACY_CHECK_IDS, `${path}.reviews.privacy.checks`, add);
      }
    }
    if (capturedOn) {
      for (const reviewedOn of reviewDates) {
        if (reviewedOn < capturedOn) add(`${path}.reviews`, "OCR, metadata, and privacy reviews may not predate the captured pixels.");
      }
    }

    if (!isRecord(audit.provenance)) {
      add(`${path}.provenance`, "Expected structured provenance.");
    } else if (audit.provenance.kind === "course-authored-editorial-capture") {
      if (exactManifestKeys(
        audit.provenance,
        ["kind", "capturedBy", "rightsHolder", "editorialPurpose", "rightsReviewer", "rightsReviewedOn", "originalCaptureConfirmed", "syntheticDataConfirmed", "publicationApproved"],
        `${path}.provenance`,
        add,
      )) {
        for (const key of ["capturedBy", "rightsHolder", "editorialPurpose"] as const) {
          requireNonEmptyString(audit.provenance[key], `${path}.provenance.${key}`, add);
        }
        requireHumanReviewerId(audit.provenance.rightsReviewer, `${path}.provenance.rightsReviewer`, add);
        requireNonFutureDateOnly(audit.provenance.rightsReviewedOn, `${path}.provenance.rightsReviewedOn`, add);
        for (const key of ["originalCaptureConfirmed", "syntheticDataConfirmed", "publicationApproved"] as const) {
          if (audit.provenance[key] !== true) add(`${path}.provenance.${key}`, "Course-authored publication assertion must be true.");
        }
      }
      if (rawSourceKind !== "course-authored-capture") add(`${path}.rawSource.kind`, "Editorial capture provenance requires a course-authored raw source.");
    } else if (audit.provenance.kind === "third-party-reuse") {
      if (exactManifestKeys(
        audit.provenance,
        ["kind", "sourceAssetUrl", "rightsBasis", "rightsReferenceUrl", "license", "attribution", "rightsReviewer", "rightsReviewedOn", "localHostingAllowed", "derivativesAllowed", "coursePublicationAllowed"],
        `${path}.provenance`,
        add,
      )) {
        if (typeof audit.provenance.sourceAssetUrl !== "string" || !/^https:\/\//.test(audit.provenance.sourceAssetUrl)) add(`${path}.provenance.sourceAssetUrl`, "Third-party source asset URL must use HTTPS.");
        if (!["license", "written-permission", "published-reuse-terms"].includes(String(audit.provenance.rightsBasis))) add(`${path}.provenance.rightsBasis`, "Third-party reuse requires an explicit rights basis.");
        if (typeof audit.provenance.rightsReferenceUrl !== "string" || !/^https:\/\//.test(audit.provenance.rightsReferenceUrl)) add(`${path}.provenance.rightsReferenceUrl`, "Rights evidence must use an HTTPS reference URL.");
        for (const key of ["license", "attribution"] as const) {
          requireNonEmptyString(audit.provenance[key], `${path}.provenance.${key}`, add);
        }
        requireHumanReviewerId(audit.provenance.rightsReviewer, `${path}.provenance.rightsReviewer`, add);
        requireNonFutureDateOnly(audit.provenance.rightsReviewedOn, `${path}.provenance.rightsReviewedOn`, add);
        for (const key of ["localHostingAllowed", "derivativesAllowed", "coursePublicationAllowed"] as const) {
          if (audit.provenance[key] !== true) add(`${path}.provenance.${key}`, "Third-party reuse permission must be explicitly true.");
        }
      }
      if (rawSourceKind !== "third-party-original") add(`${path}.rawSource.kind`, "Third-party reuse provenance requires a third-party raw source.");
    } else {
      add(`${path}.provenance.kind`, "Provenance must distinguish course-authored editorial capture from third-party reuse.");
    }

    if (typeof figureId === "string") {
      const boundFigure = figureById.get(figureId as (typeof CODEX_FIGURE_IDS)[number]);
      if (!boundFigure) {
        add(`${path}.figureId`, "Audit is orphaned from the Course 2 figure manifest.");
      } else if (boundFigure.kind !== "product-ui-capture") {
        add(`${path}.figureId`, "Product UI audits may bind only figures classified as product-ui-capture.");
      }
    }
  }

  const lessonBySlug = new Map(CODEX_COURSE_MANIFEST.lessons.map((lesson) => [lesson.slug, lesson]));
  const productCaptureOnlyFields = [
    "auditId", "officialSupportingSourceId", "captureIntent", "capturedOn", "codexVersion", "os",
    "sha256", "privacyReviewed", "sourceUrl", "thirdPartySourceUrl", "thirdPartyLicense",
  ];
  const originalDiagramOnlyFields = [
    "rightsRecordId", "officialSupportingSourceIds", "instructionalPurpose", "rendererVersion",
    "provenanceLabel", "privacyClassification", "nonImpersonationClassification",
  ];
  for (const figure of figures) {
    const owningLesson = lessonBySlug.get(figure.lessonSlug);
    const assignedFigureIds = owningLesson?.figureIds as readonly string[] | undefined;
    if (!assignedFigureIds?.includes(figure.id)) add(`figures.${figure.id}.lessonSlug`, "Figure must be listed by its owning lesson.");
    for (const callout of figure.callouts ?? []) {
      if (!callout.id.trim() || !callout.labelKey.trim()) add(`figures.${figure.id}.callouts`, "Callouts require stable IDs and localized label keys.");
      if (callout.xPercent < 0 || callout.xPercent > 100 || callout.yPercent < 0 || callout.yPercent > 100) {
        add(`figures.${figure.id}.callouts.${callout.id}`, "Callout coordinates must be percentages between zero and one hundred.");
      }
    }
    if (figure.kind === "course-original-diagram") {
      const fields = Object.keys(figure);
      for (const field of productCaptureOnlyFields.filter((candidate) => fields.includes(candidate))) {
        add(`figures.${figure.id}.${field}`, "Course-original diagrams must not carry product capture or screenshot metadata.");
      }
      continue;
    }

    const available = figure as CodexFigureAvailable;
    for (const field of originalDiagramOnlyFields.filter((candidate) => Object.keys(available).includes(candidate))) {
      add(`figures.${figure.id}.${field}`, "Product UI captures must not be relabeled with original-diagram provenance.");
    }
    const localSources = [
      available.src,
      available.srcSet?.webp2240,
      available.srcSet?.webp1120,
      ...(available.srcSet?.mobile ? [available.srcSet.mobile] : []),
    ];
    if (localSources.some((src) => typeof src !== "string" || !/^\/courses\/codex\/(?!.*(?:\.\.|[?#]))[^\s]+$/.test(src))) {
      add(`figures.${figure.id}.srcSet`, "Available figures must use clean root-relative assets under /courses/codex/.");
    }
    if (new Set(localSources).size !== localSources.length) add(`figures.${figure.id}.srcSet`, "Every available figure derivative must use a distinct path.");
    if (available.width !== 2240 || !Number.isInteger(available.height) || available.height < 1) {
      add(`figures.${figure.id}.dimensions`, "Available figures need a 2240-pixel PNG master and positive intrinsic height.");
    }
    if (!requireDateOnly(available.capturedOn, `figures.${figure.id}.capturedOn`, add)) {
      // The date-specific freshness check below is intentionally skipped.
    } else {
      const capturedTime = Date.parse(`${available.capturedOn}T00:00:00Z`);
      const ageDays = (Date.now() - capturedTime) / 86_400_000;
      if (ageDays < -1) add(`figures.${figure.id}.capturedOn`, "Capture date is unexpectedly in the future.");
      if (ageDays > 90) add(`figures.${figure.id}.capturedOn`, "Capture is older than the required 90-day freshness window.");
    }
    if (!available.codexVersion?.trim() || !available.os?.trim()) add(`figures.${figure.id}.product`, "Available figures need Codex version and operating system provenance.");
    requireSha256(available.sha256, `figures.${figure.id}.sha256`, add);
    if (available.privacyReviewed !== true) add(`figures.${figure.id}.privacyReviewed`, "Compatibility flag must be true, but does not replace the external audit.");
    if (typeof available.auditId !== "string" || !AUDIT_ID_PATTERN.test(available.auditId)) add(`figures.${figure.id}.auditId`, "Available figure requires a stable external audit ID.");

    const assetHashKeys = ["png2240", "webp2240", "webp1120", ...(available.srcSet?.mobile ? ["mobile"] : [])];
    if (exactManifestKeys(available.assetSha256, assetHashKeys, `figures.${figure.id}.assetSha256`, add)) {
      for (const key of assetHashKeys) requireSha256(available.assetSha256[key], `figures.${figure.id}.assetSha256.${key}`, add);
      if (available.sha256 !== available.assetSha256.png2240) add(`figures.${figure.id}.sha256`, "Compatibility master hash must equal assetSha256.png2240.");
    }

    const officialSource = CODEX_SOURCES.find((source) => source.id === available.officialSupportingSourceId);
    if (!officialSource || officialSource.kind !== "official-doc") {
      add(`figures.${figure.id}.officialSupportingSourceId`, "Available figure must name an official OpenAI documentation source ID.");
    } else if (available.sourceUrl !== officialSource.exactAnchor) {
      add(`figures.${figure.id}.sourceUrl`, "Compatibility sourceUrl must equal the official source record's exact anchor.");
    }

    const audit = typeof available.auditId === "string" ? auditById.get(available.auditId) : undefined;
    if (!audit) {
      add(`figures.${figure.id}.auditId`, "No matching approved external audit record exists; privacyReviewed alone is insufficient.");
      continue;
    }
    if (audit.id !== available.auditId || audit.figureId !== figure.id || audit.status !== "approved") {
      add(`figures.${figure.id}.auditId`, "Audit ID, figure ID, and approval status must form an exact two-way binding.");
    }
    if (isRecord(audit.binding)) {
      if (audit.binding.lessonSlug !== figure.lessonSlug) add(`figures.${figure.id}.auditId`, "Audit lesson binding differs from the figure manifest.");
      if (audit.binding.surface !== figure.surface) add(`figures.${figure.id}.auditId`, "Audit surface binding differs from the figure manifest.");
    }
    if (isRecord(audit.product)) {
      if (audit.product.capturedOn !== available.capturedOn || audit.product.codexVersion !== available.codexVersion || audit.product.operatingSystem !== available.os) {
        add(`figures.${figure.id}.auditId`, "Audit product provenance differs from the figure manifest.");
      }
    }
    if (audit.officialSupportingSourceId !== available.officialSupportingSourceId) {
      add(`figures.${figure.id}.officialSupportingSourceId`, "Manifest and audit must reference the same official source ID.");
    }

    const expectedAssets = {
      png2240: { path: available.src, width: available.width, height: available.height, sha256: available.assetSha256?.png2240 },
      webp2240: { path: available.srcSet?.webp2240, width: 2240, height: available.height, sha256: available.assetSha256?.webp2240 },
      webp1120: { path: available.srcSet?.webp1120, width: 1120, sha256: available.assetSha256?.webp1120 },
      ...(available.srcSet?.mobile ? { mobile: { path: available.srcSet.mobile, sha256: available.assetSha256?.mobile } } : {}),
    } as const;
    if (!isRecord(audit.servedAssets)) {
      add(`figures.${figure.id}.auditId`, "Bound audit has no frozen served-asset records.");
    } else {
      const auditRoles = Object.keys(audit.servedAssets).sort();
      const expectedRoles = Object.keys(expectedAssets).sort();
      if (auditRoles.join("|") !== expectedRoles.join("|")) add(`figures.${figure.id}.auditId`, "Audit derivative roles differ from the served manifest.");
      for (const [role, expected] of Object.entries(expectedAssets)) {
        const frozen = audit.servedAssets[role];
        if (!isRecord(frozen)) {
          add(`figures.${figure.id}.auditId`, `Audit is missing frozen asset ${role}.`);
          continue;
        }
        if (frozen.path !== expected.path || frozen.sha256 !== expected.sha256) add(`figures.${figure.id}.auditId`, `Served path or SHA-256 differs from frozen audit asset ${role}.`);
        if ("width" in expected && frozen.width !== expected.width) add(`figures.${figure.id}.auditId`, `Served width differs from frozen audit asset ${role}.`);
        if ("height" in expected && frozen.height !== expected.height) add(`figures.${figure.id}.auditId`, `Served height differs from frozen audit asset ${role}.`);
      }
    }

    if (isRecord(audit.provenance) && audit.provenance.kind === "third-party-reuse") {
      if (available.thirdPartySourceUrl !== undefined && available.thirdPartySourceUrl !== audit.provenance.sourceAssetUrl) add(`figures.${figure.id}.thirdPartySourceUrl`, "Legacy third-party URL differs from audited provenance.");
      if (available.thirdPartyLicense !== undefined && available.thirdPartyLicense !== audit.provenance.license) add(`figures.${figure.id}.thirdPartyLicense`, "Legacy third-party license differs from audited provenance.");
    } else if (available.thirdPartySourceUrl !== undefined || available.thirdPartyLicense !== undefined) {
      add(`figures.${figure.id}.thirdPartySourceUrl`, "Course-authored captures must not carry legacy third-party reuse fields.");
    }
  }

  const productCaptureIds = figures
    .filter((figure) => figure.kind === "product-ui-capture")
    .map((figure) => figure.id)
    .sort();
  const expectedProductCaptureIds = [...CODEX_PRODUCT_UI_CAPTURE_FIGURE_IDS].sort();
  if (productCaptureIds.join("|") !== expectedProductCaptureIds.join("|")) {
    add("figures.productUiCaptures", `Expected exactly the audited capture set: ${expectedProductCaptureIds.join(", ")}.`);
  }
  if (auditIdByFigureId.size !== expectedProductCaptureIds.length) {
    add("figureAudits.audits", `Expected exactly ${expectedProductCaptureIds.length} product UI audit records.`);
  }

  return issues;
}

/**
 * Validates the independent provenance contract for locally rendered course
 * diagrams. Diagram records can never stand in for product-UI capture audits,
 * and capture metadata is forbidden on this branch of the union.
 */
export function validateCodexDiagramRightsLedger(
  figures: readonly CodexFigureManifest[] = CODEX_FIGURES as readonly CodexFigureManifest[],
  ledger: unknown = diagramRightsLedger,
): readonly CodexValidationIssue[] {
  const issues: CodexValidationIssue[] = [];
  const add: ManifestIssueAdder = (path, message) => issues.push({ locale: "manifest", path, message });
  const diagramById = new Map(
    figures
      .filter((figure): figure is CodexOriginalDiagramFigure => figure.kind === "course-original-diagram")
      .map((figure) => [figure.id, figure]),
  );
  const lessonBySlug = new Map(CODEX_COURSE_MANIFEST.lessons.map((lesson) => [lesson.slug, lesson]));
  const recordById = new Map<string, Record<string, unknown>>();
  const recordByFigureId = new Map<string, Record<string, unknown>>();

  if (!exactManifestKeys(
    ledger,
    ["schema", "renderer", "notice", "assetContract", "policy", "records"],
    "diagramRights",
    add,
  )) return issues;

  if (ledger.schema !== CODEX_DIAGRAM_RIGHTS_SCHEMA) {
    add("diagramRights.schema", `Expected ${CODEX_DIAGRAM_RIGHTS_SCHEMA}.`);
  }
  if (exactManifestKeys(ledger.renderer, ["path", "version", "sha256", "environment"], "diagramRights.renderer", add)) {
    if (ledger.renderer.path !== "scripts/render-codex-original-diagrams.mjs") add("diagramRights.renderer.path", "Renderer path must name the committed Course 2 renderer.");
    if (ledger.renderer.version !== CODEX_ORIGINAL_DIAGRAM_RENDERER_VERSION) add("diagramRights.renderer.version", `Expected ${CODEX_ORIGINAL_DIAGRAM_RENDERER_VERSION}.`);
    requireSha256(ledger.renderer.sha256, "diagramRights.renderer.sha256", add);
    if (exactManifestKeys(
      ledger.renderer.environment,
      Object.keys(CODEX_ORIGINAL_DIAGRAM_RENDER_ENVIRONMENT),
      "diagramRights.renderer.environment",
      add,
    )) {
      for (const [key, expected] of Object.entries(CODEX_ORIGINAL_DIAGRAM_RENDER_ENVIRONMENT)) {
        if (ledger.renderer.environment[key] !== expected) add(`diagramRights.renderer.environment.${key}`, `Expected ${expected}.`);
      }
    }
  }
  if (exactManifestKeys(ledger.notice, ["path", "sha256"], "diagramRights.notice", add)) {
    if (ledger.notice.path !== "public/courses/codex/NOTICE.md") add("diagramRights.notice.path", "Notice path must name the public Course 2 notice.");
    requireSha256(ledger.notice.sha256, "diagramRights.notice.sha256", add);
  }
  const expectedAssetContract = {
    root: "/courses/codex/figures",
    pngPathTemplate: "fig-XX-master.png",
    webp2240PathTemplate: "fig-XX-2240.webp",
    webp1120PathTemplate: "fig-XX-1120.webp",
    masterWidth: 2240,
    masterHeight: 1260,
    responsiveWidth: 1120,
    responsiveHeight: 630,
  } as const;
  if (exactManifestKeys(ledger.assetContract, Object.keys(expectedAssetContract), "diagramRights.assetContract", add)) {
    for (const [key, expected] of Object.entries(expectedAssetContract)) {
      if (ledger.assetContract[key] !== expected) add(`diagramRights.assetContract.${key}`, `Expected ${expected}.`);
    }
  }

  if (exactManifestKeys(ledger.policy, ["classification", "authorship", "privacy", "nonImpersonation"], "diagramRights.policy", add)) {
    if (ledger.policy.classification !== "course-original-abstract-diagram") add("diagramRights.policy.classification", "Rights policy must classify these assets as course-original abstract diagrams.");
    if (exactManifestKeys(
      ledger.policy.authorship,
      ["rightsBasis", "rightsHolder", "license", "licensePath", "licenseSha256", "thirdPartyPixels", "thirdPartyAssets"],
      "diagramRights.policy.authorship",
      add,
    )) {
      if (ledger.policy.authorship.rightsBasis !== "course-original-work") add("diagramRights.policy.authorship.rightsBasis", "Rights basis must be course-original-work.");
      if (ledger.policy.authorship.rightsHolder !== "HU Dongpin") add("diagramRights.policy.authorship.rightsHolder", "Rights holder must match the repository MIT license.");
      if (ledger.policy.authorship.license !== "MIT" || ledger.policy.authorship.licensePath !== "LICENSE") add("diagramRights.policy.authorship.license", "Course-original assets must bind to the repository MIT LICENSE.");
      requireSha256(ledger.policy.authorship.licenseSha256, "diagramRights.policy.authorship.licenseSha256", add);
      if (ledger.policy.authorship.thirdPartyPixels !== false) add("diagramRights.policy.authorship.thirdPartyPixels", "Original diagrams must explicitly contain no third-party pixels.");
      if (!Array.isArray(ledger.policy.authorship.thirdPartyAssets) || ledger.policy.authorship.thirdPartyAssets.length !== 0) add("diagramRights.policy.authorship.thirdPartyAssets", "Original diagrams must have an empty third-party asset list.");
    }
    if (exactManifestKeys(
      ledger.policy.privacy,
      ["dataClass", "containsPersonalData", "containsSecrets", "containsAccountOrRepositoryIdentifiers", "metadataStripped"],
      "diagramRights.policy.privacy",
      add,
    )) {
      if (ledger.policy.privacy.dataClass !== "synthetic-labels-only") add("diagramRights.policy.privacy.dataClass", "Diagram labels must be synthetic-only.");
      for (const key of ["containsPersonalData", "containsSecrets", "containsAccountOrRepositoryIdentifiers"] as const) {
        if (ledger.policy.privacy[key] !== false) add(`diagramRights.policy.privacy.${key}`, "Privacy-negative assertions must be false.");
      }
      if (ledger.policy.privacy.metadataStripped !== true) add("diagramRights.policy.privacy.metadataStripped", "Published derivatives must be metadata-stripped.");
    }
    if (exactManifestKeys(
      ledger.policy.nonImpersonation,
      ["depiction", "productUiCapture", "simulatedProductUi", "vendorLogoIncluded", "tradeDressReproduction", "visibleLabel", "labelEmbeddedInPixels"],
      "diagramRights.policy.nonImpersonation",
      add,
    )) {
      if (ledger.policy.nonImpersonation.depiction !== "abstract-process-diagram") add("diagramRights.policy.nonImpersonation.depiction", "Depiction must be an abstract process diagram.");
      for (const key of ["productUiCapture", "simulatedProductUi", "vendorLogoIncluded", "tradeDressReproduction"] as const) {
        if (ledger.policy.nonImpersonation[key] !== false) add(`diagramRights.policy.nonImpersonation.${key}`, "Non-impersonation assertions must be false.");
      }
      if (ledger.policy.nonImpersonation.visibleLabel !== CODEX_ORIGINAL_DIAGRAM_LABEL || ledger.policy.nonImpersonation.labelEmbeddedInPixels !== true) {
        add("diagramRights.policy.nonImpersonation.visibleLabel", "Every derivative must embed the locked course-original, not-product-UI label.");
      }
    }
  }

  if (!Array.isArray(ledger.records)) {
    add("diagramRights.records", "Rights ledger must contain a records array.");
    return issues;
  }
  for (const [index, recordValue] of ledger.records.entries()) {
    const path = `diagramRights.records[${index}]`;
    if (!exactManifestKeys(
      recordValue,
      ["id", "figureId", "status", "binding", "instructionalPurpose", "officialSupportingSourceIds", "assetSha256"],
      path,
      add,
    )) continue;
    const record = recordValue;
    if (typeof record.id !== "string" || !DIAGRAM_RIGHTS_ID_PATTERN.test(record.id)) {
      add(`${path}.id`, "Rights record ID must use codex-diagram-rights.fig-XX.<stable-suffix>.");
    } else if (recordById.has(record.id)) {
      add(`${path}.id`, `Duplicate rights record ID: ${record.id}.`);
    } else {
      recordById.set(record.id, record);
    }
    if (typeof record.figureId !== "string" || !CODEX_ORIGINAL_DIAGRAM_FIGURE_IDS.includes(record.figureId as never)) {
      add(`${path}.figureId`, "Rights record must bind one of the eighteen locked original-diagram IDs.");
      continue;
    }
    if (recordByFigureId.has(record.figureId)) add(`${path}.figureId`, `Duplicate rights binding for ${record.figureId}.`);
    else recordByFigureId.set(record.figureId, record);
    const figure = diagramById.get(record.figureId as CodexOriginalDiagramFigure["id"]);
    if (!figure) {
      add(`${path}.figureId`, "Rights record is orphaned or points to a product UI capture.");
      continue;
    }
    if (record.status !== "publishable") add(`${path}.status`, "Original diagram rights status must be publishable.");
    if (exactManifestKeys(record.binding, ["lessonSlug", "surface"], `${path}.binding`, add)) {
      if (record.binding.lessonSlug !== figure.lessonSlug || record.binding.surface !== figure.surface) add(`${path}.binding`, "Rights binding must match the figure lesson and subject surface.");
    }
    if (record.instructionalPurpose !== figure.instructionalPurpose) add(`${path}.instructionalPurpose`, "Rights record and figure instructional purpose must match exactly.");
    if (!Array.isArray(record.officialSupportingSourceIds) || record.officialSupportingSourceIds.length === 0) {
      add(`${path}.officialSupportingSourceIds`, "At least one official source ID is required.");
    } else {
      if (record.officialSupportingSourceIds.join("|") !== figure.officialSupportingSourceIds.join("|")) add(`${path}.officialSupportingSourceIds`, "Rights record and figure source bindings must match exactly.");
      const lesson = lessonBySlug.get(figure.lessonSlug);
      for (const sourceId of record.officialSupportingSourceIds) {
        const source = typeof sourceId === "string" ? CODEX_SOURCES.find((candidate) => candidate.id === sourceId) : undefined;
        if (!source || source.kind !== "official-doc") add(`${path}.officialSupportingSourceIds`, `Unknown or non-official source ID: ${String(sourceId)}.`);
        if (!lesson?.sourceIds.includes(sourceId as never)) add(`${path}.officialSupportingSourceIds`, `Source ${String(sourceId)} is not cited by the owning lesson.`);
      }
    }
    if (exactManifestKeys(record.assetSha256, ["png2240", "webp2240", "webp1120"], `${path}.assetSha256`, add)) {
      for (const role of ["png2240", "webp2240", "webp1120"] as const) {
        requireSha256(record.assetSha256[role], `${path}.assetSha256.${role}`, add);
        if (record.assetSha256[role] !== figure.assetSha256[role]) add(`${path}.assetSha256.${role}`, "Rights record digest differs from the figure manifest.");
      }
    }
    if (record.id !== figure.rightsRecordId) add(`${path}.id`, "Figure and rights record must form an exact two-way binding.");
  }

  const expectedDiagramIds = [...CODEX_ORIGINAL_DIAGRAM_FIGURE_IDS].sort();
  const actualDiagramIds = [...diagramById.keys()].sort();
  if (actualDiagramIds.join("|") !== expectedDiagramIds.join("|")) {
    add("figures.originalDiagrams", `Expected exactly the original-diagram set: ${expectedDiagramIds.join(", ")}.`);
  }
  if (recordByFigureId.size !== expectedDiagramIds.length) add("diagramRights.records", `Expected exactly ${expectedDiagramIds.length} original-diagram rights records.`);

  const forbiddenCaptureFields = [
    "auditId", "officialSupportingSourceId", "captureIntent", "capturedOn", "capturedAt", "codexVersion",
    "productVersion", "os", "sha256", "privacyReviewed", "sourceUrl", "thirdPartySourceUrl", "thirdPartyLicense",
  ];
  for (const figure of diagramById.values()) {
    for (const field of forbiddenCaptureFields.filter((candidate) => Object.hasOwn(figure, candidate))) {
      add(`figures.${figure.id}.${field}`, "Original diagrams must not carry screenshot capture metadata or a product UI audit binding.");
    }
    if (!figure.instructionalPurpose.trim()) add(`figures.${figure.id}.instructionalPurpose`, "Original diagrams require a concrete instructional purpose.");
    if (!figure.privacyChecklist.length) add(`figures.${figure.id}.privacyChecklist`, "Original diagrams require a privacy and non-impersonation checklist.");
    if (figure.width !== 2240 || figure.height !== 1260) add(`figures.${figure.id}.dimensions`, "Original diagram masters must be exactly 2240 by 1260 pixels.");
    const canonical = {
      src: `/courses/codex/figures/${figure.id}-master.png`,
      webp2240: `/courses/codex/figures/${figure.id}-2240.webp`,
      webp1120: `/courses/codex/figures/${figure.id}-1120.webp`,
    };
    if (figure.src !== canonical.src || figure.srcSet.webp2240 !== canonical.webp2240 || figure.srcSet.webp1120 !== canonical.webp1120) add(`figures.${figure.id}.srcSet`, "Original diagram paths must use the canonical local derivative names.");
    if (figure.rendererVersion !== CODEX_ORIGINAL_DIAGRAM_RENDERER_VERSION) add(`figures.${figure.id}.rendererVersion`, "Original diagram renderer version is not the locked release renderer.");
    if (figure.provenanceLabel !== CODEX_ORIGINAL_DIAGRAM_LABEL) add(`figures.${figure.id}.provenanceLabel`, "Original diagram must carry the locked visible non-UI provenance label.");
    if (figure.privacyClassification !== "synthetic-labels-only") add(`figures.${figure.id}.privacyClassification`, "Original diagram must declare synthetic-only labels.");
    if (figure.nonImpersonationClassification !== "abstract-model-not-product-ui") add(`figures.${figure.id}.nonImpersonationClassification`, "Original diagram must declare that it is an abstract model, not product UI.");
    const record = recordByFigureId.get(figure.id);
    if (!record || record.id !== figure.rightsRecordId) add(`figures.${figure.id}.rightsRecordId`, "No matching publishable original-diagram rights record exists.");
  }

  return issues;
}

export function validateCodexManifests(): readonly CodexValidationIssue[] {
  const issues: CodexValidationIssue[] = [];
  const add = (path: string, message: string) => issues.push({ locale: "manifest", path, message });

  if (CODEX_COURSE_MANIFEST.units.length !== 4) add("units", "Course must contain exactly four units.");
  if (CODEX_COURSE_MANIFEST.lessons.length !== 12) add("lessons", "Course must contain exactly twelve lessons.");
  if (CODEX_QUIZ.length !== 24) add("quiz", "Course must contain exactly twenty-four quiz questions.");
  if (CODEX_FIGURES.length !== 24) add("figures", "Course must contain exactly twenty-four figures.");
  if (CODEX_PRACTICES.length !== 12) add("practices", "Course must contain exactly twelve practices.");

  const expectedDurations = [35, 40, 45, 50, 45, 55, 45, 50, 55, 50, 60, 130];
  const actualDurations = CODEX_COURSE_MANIFEST.lessons.map((lesson) => lesson.durationMinutes);
  if (actualDurations.join("|") !== expectedDurations.join("|")) {
    add("lessons.durationMinutes", "Lesson durations differ from the locked 660-minute course contract.");
  }
  if (actualDurations.reduce((sum, minutes) => sum + minutes, 0) !== 660) {
    add("lessons.durationMinutes", "Guided lesson durations must total 660 minutes.");
  }
  for (const lesson of CODEX_COURSE_MANIFEST.lessons) {
    if (lesson.minutes !== lesson.durationMinutes) add(`lessons.${lesson.slug}.minutes`, "minutes and durationMinutes aliases must match.");
  }

  const lessonOrder = CODEX_COURSE_MANIFEST.lessons.map((lesson) => lesson.slug);
  if (lessonOrder.join("|") !== CODEX_LESSON_SLUGS.join("|")) add("lessons", "Lesson slugs or order differ from the locked course contract.");
  const unitOrder = CODEX_COURSE_MANIFEST.units.map((unit) => unit.id);
  if (unitOrder.join("|") !== CODEX_UNIT_IDS.join("|")) add("units", "Unit IDs or order differ from the locked course contract.");

  const sourceIds = new Set(CODEX_SOURCES.map((source) => source.id));
  const lessonBySlug = new Map(CODEX_COURSE_MANIFEST.lessons.map((lesson) => [lesson.slug, lesson]));
  const quizById = new Map(CODEX_QUIZ.map((question) => [question.id, question]));
  const referencedQuizIds: string[] = [];
  for (const [lessonIndex, lesson] of CODEX_COURSE_MANIFEST.lessons.entries()) {
    if (!lesson.objectiveKeys.length) add(`lessons.${lesson.slug}.objectiveKeys`, "Lesson must expose at least one localized objective key.");
    if (!lesson.quizTags.length) add(`lessons.${lesson.slug}.quizTags`, "Lesson must expose stable quiz tags.");
    if (new Set(lesson.prerequisites).size !== lesson.prerequisites.length) {
      add(`lessons.${lesson.slug}.prerequisites`, "Prerequisites must not contain duplicates.");
    }
    for (const prerequisite of lesson.prerequisites) {
      const prerequisiteIndex = lessonOrder.indexOf(prerequisite);
      if (prerequisiteIndex < 0 || prerequisiteIndex >= lessonIndex) {
        add(`lessons.${lesson.slug}.prerequisites`, `Prerequisite must name an earlier lesson: ${prerequisite}.`);
      }
    }

    const blockFigures = lesson.blocks.filter((block) => block.type === "figure").map((block) => block.figureId);
    if (blockFigures.join("|") !== lesson.figureIds.join("|")) {
      add(`lessons.${lesson.slug}.blocks`, "Figure blocks must match figureIds in order.");
    }
    const proseSectionIndices = lesson.blocks
      .filter((block) => block.type === "prose")
      .map((block) => block.sectionIndex);
    if (proseSectionIndices.join("|") !== "0|1|2") {
      add(`lessons.${lesson.slug}.blocks`, "Prose blocks must reference localized sections 0, 1, and 2 exactly once and in order.");
    }
    const exerciseBlocks = lesson.blocks.filter((block) => block.type === "exercise");
    if (exerciseBlocks.length !== 1 || exerciseBlocks[0]?.practiceId !== lesson.practiceId) {
      add(`lessons.${lesson.slug}.blocks`, "Exactly one exercise block must reference the lesson practice.");
    }
    const sourceNotes = lesson.blocks.filter((block) => block.type === "source-note");
    if (sourceNotes.length !== 1 || sourceNotes[0]?.sourceIds.join("|") !== lesson.sourceIds.join("|")) {
      add(`lessons.${lesson.slug}.blocks`, "Exactly one source-note block must match lesson sources.");
    }

    for (const [blockIndex, block] of (lesson.blocks as readonly CodexBlock[]).entries()) {
      const path = `lessons.${lesson.slug}.blocks[${blockIndex}]`;
      switch (block.type) {
        case "steps":
        case "callout":
          if (!block.copyKey.trim()) add(path, `${block.type} blocks require a non-empty copyKey.`);
          break;
        case "code":
          if (!block.language.trim() || !block.code.trim()) add(path, "Code blocks require a language and non-empty code.");
          break;
        case "comparison":
          if (!block.copyKey.trim()) add(path, "Comparison blocks require a non-empty row copyKey.");
          if (block.columns.length < 2 || block.columns.some((key) => !key.trim()) || new Set(block.columns).size !== block.columns.length) {
            add(path, "Comparison blocks require at least two unique, non-empty localized column keys.");
          }
          break;
        case "prose":
        case "figure":
        case "exercise":
        case "source-note":
          break;
      }
    }

    const communityCount = lesson.sourceIds.filter((id) => CODEX_SOURCE_BY_ID[id]?.kind === "community-github").length;
    if (communityCount > 1) add(`lessons.${lesson.slug}.sourceIds`, "A lesson may cite at most one community repository.");
    const officialCount = lesson.sourceIds.filter((id) => CODEX_SOURCE_BY_ID[id]?.kind === "official-doc").length;
    if (officialCount < 1) add(`lessons.${lesson.slug}.sourceIds`, "Every lesson must cite at least one official OpenAI documentation anchor.");
    for (const sourceId of lesson.sourceIds) {
      if (!sourceIds.has(sourceId)) add(`lessons.${lesson.slug}.sourceIds`, `Unknown source ID: ${sourceId}.`);
    }

    if (!lesson.quizIds.length) add(`lessons.${lesson.slug}.quizIds`, "Every lesson must reference at least one quiz question.");
    for (const quizId of lesson.quizIds) {
      referencedQuizIds.push(quizId);
      const question = quizById.get(quizId);
      if (!question) add(`lessons.${lesson.slug}.quizIds`, `Unknown quiz ID: ${quizId}.`);
      else if (question.lessonSlug !== lesson.slug) add(`lessons.${lesson.slug}.quizIds`, `Quiz ${quizId} belongs to ${question.lessonSlug}.`);
    }
  }

  for (const source of CODEX_SOURCES) {
    if (!/^https:\/\//.test(source.exactAnchor)) add(`sources.${source.id}.exactAnchor`, "Source requires an exact HTTPS anchor.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.accessedOn) || Number.isNaN(Date.parse(source.accessedOn))) {
      add(`sources.${source.id}.accessedOn`, "Source requires a valid YYYY-MM-DD access date.");
    }
    if (source.accessedOn !== CODEX_COURSE_MANIFEST.sourceSnapshotOn) {
      add(`sources.${source.id}.accessedOn`, "Source access date must match the course source snapshot date.");
    }
    if (Number.isNaN(Date.parse(source.verifiedAt))) add(`sources.${source.id}.verifiedAt`, "Source requires a valid verification timestamp.");
    if (source.supportingAnchors?.some((anchor) => !/^https:\/\//.test(anchor))) {
      add(`sources.${source.id}.supportingAnchors`, "Supporting source anchors must use HTTPS.");
    }
    if (source.kind === "official-doc") continue;
    if (!source.exactAnchor.includes("github.com/") || !source.exactAnchor.includes("/blob/")) {
      add(`sources.${source.id}.exactAnchor`, "GitHub evidence must link to an exact repository file or section.");
    }
    if (!/^[a-f0-9]{40}$/.test(source.verifiedRevision)) {
      add(`sources.${source.id}.verifiedRevision`, "GitHub evidence requires the immutable 40-character commit that was reviewed.");
    }
    const anchoredRevision = /github\.com\/[^/]+\/[^/]+\/blob\/([a-f0-9]{40})\//.exec(source.exactAnchor)?.[1];
    if (anchoredRevision !== source.verifiedRevision) {
      add(`sources.${source.id}.exactAnchor`, "GitHub evidence anchor must be pinned to verifiedRevision, not a moving branch or a different commit.");
    }
    if (source.supportingAnchors?.some((anchor) => (
      /github\.com\/[^/]+\/[^/]+\/blob\/([a-f0-9]{40})\//.exec(anchor)?.[1] !== source.verifiedRevision
    ))) {
      add(`sources.${source.id}.supportingAnchors`, "Every GitHub supporting anchor must be pinned to verifiedRevision.");
    }
    if (!Number.isInteger(source.stars) || source.stars < 0) add(`sources.${source.id}.stars`, "GitHub source requires a non-negative star snapshot.");
    if (!/^\d{4}-\d{2}-\d{2}/.test(source.starsSnapshotOn)) add(`sources.${source.id}.starsSnapshotOn`, "GitHub source requires a dated star snapshot.");
    if (source.starsSnapshotOn !== source.accessedOn) add(`sources.${source.id}.starsSnapshotOn`, "GitHub star and access snapshots must use the same date.");
    if (!source.license.trim()) add(`sources.${source.id}.license`, "GitHub source requires a license record.");
  }

  for (const practice of CODEX_PRACTICES) {
    if (!practice.promptKey.trim()) add(`practices.${practice.id}.promptKey`, "Practice requires a localized prompt key.");
    if (practice.observableActionCount < 1 || practice.selfCheckCriteriaCount < 1) {
      add(`practices.${practice.id}`, "Practice requires observable actions and self-check criteria.");
    }
    if (practice.completionKey !== `codex.lesson.${practice.lessonSlug}`) {
      add(`practices.${practice.id}.completionKey`, "Practice completion key must match its lesson.");
    }
  }

  for (const question of CODEX_QUIZ) {
    if (question.correctIndex < 0 || question.correctIndex > 3) add(`quiz.${question.id}`, "Correct option index must be between zero and three.");
    const lesson = lessonBySlug.get(question.lessonSlug);
    if (!lesson) add(`quiz.${question.id}.lessonSlug`, "Quiz question references an unknown lesson.");
    else if (question.unitId !== lesson.unitId) add(`quiz.${question.id}.unitId`, "Quiz unit must match the owning lesson unit.");
  }

  if (new Set(referencedQuizIds).size !== referencedQuizIds.length) add("lessons.quizIds", "Quiz questions must be referenced by exactly one lesson.");
  if (new Set(referencedQuizIds).size !== CODEX_QUIZ.length || CODEX_QUIZ.some((question) => !referencedQuizIds.includes(question.id))) {
    add("lessons.quizIds", "Every quiz question must be referenced once by its owning lesson.");
  }

  if (new Set(CODEX_FINAL_QUIZ_IDS).size !== 24 || CODEX_FINAL_QUIZ.bankSize !== 24) {
    add("finalQuiz.bankQuestionIds", "Final quiz must use the complete 24-question bank.");
  }
  if (CODEX_FINAL_QUIZ.questionCount !== 12) {
    add("finalQuiz.questionCount", "Each final-quiz attempt must contain twelve questions.");
  }
  if (CODEX_FINAL_QUIZ.questionsPerUnit !== 3) add("finalQuiz.questionsPerUnit", "Final quiz must draw exactly three questions from each unit.");
  if (CODEX_FINAL_QUIZ.passingCorrectAnswers !== 10) add("finalQuiz.passingCorrectAnswers", "Final quiz must require ten correct answers out of twelve.");
  if (CODEX_FINAL_QUIZ.scorePolicy !== "best-score") add("finalQuiz.scorePolicy", "Final quiz must retain the learner's best score.");
  if (CODEX_FINAL_QUIZ.selectionPolicy !== "stratified-random") add("finalQuiz.selectionPolicy", "Final quiz attempts must be newly stratified selections.");
  if (CODEX_FINAL_QUIZ.bankVersion !== "1") add("finalQuiz.bankVersion", "Question bank must carry its release version.");

  const questionsById = quizById;
  if (CODEX_FINAL_QUIZ_IDS.some((id) => !questionsById.has(id))) {
    add("finalQuiz.bankQuestionIds", "Final quiz bank references an unknown question.");
  }
  for (const unitId of CODEX_UNIT_IDS) {
    const available = CODEX_FINAL_QUIZ_IDS.filter((id) => questionsById.get(id)?.unitId === unitId).length;
    if (available < CODEX_FINAL_QUIZ.questionsPerUnit) {
      add(`finalQuiz.${unitId}`, "Question bank must support three questions from this unit per attempt.");
    }
  }
  const hasRetryAlternative = CODEX_UNIT_IDS.some((unitId) => (
    CODEX_FINAL_QUIZ_IDS.filter((id) => questionsById.get(id)?.unitId === unitId).length
      > CODEX_FINAL_QUIZ.questionsPerUnit
  ));
  if (!hasRetryAlternative) {
    add("finalQuiz.bankQuestionIds", "The bank needs at least one unused per-unit alternative so a retry can draw a distinct stratified question set.");
  }
  issues.push(...validateCodexFigureAuditLedger());
  issues.push(...validateCodexDiagramRightsLedger());

  const rubricWeight = CODEX_CAPSTONE_RUBRIC.reduce((sum, item) => sum + item.weight, 0);
  if (rubricWeight !== 100) add("capstone.rubric", "Capstone rubric weights must total 100.");
  if (CODEX_CAPSTONE_RECEIPT_SCHEMA !== "aicourse.codex.capstone.v1") add("capstone.receiptSchema", "Capstone receipt schema differs from the locked contract.");
  if (CODEX_CAPSTONE_FIXTURE_VERSION !== "1") add("capstone.fixtureVersion", "Capstone fixture version differs from the locked contract.");
  if (CODEX_CAPSTONE_FIXTURE_SHA256 !== "66b0eacf5bf947fc0ac530ee31803404ee896550266699cb818908a2deca1d95") {
    add("capstone.fixtureSha256", "Capstone fixture hash differs from the locked contract.");
  }
  const expectedChecks = ["tests", "lint", "build", "routesPreserved", "keyboardBehavior", "noNewDependencies"];
  if (CODEX_CAPSTONE_REQUIRED_CHECKS.join("|") !== expectedChecks.join("|")) add("capstone.requiredChecks", "Capstone required checks differ from the locked contract.");
  const validReceipt = JSON.stringify({
    schema: CODEX_CAPSTONE_RECEIPT_SCHEMA,
    fixtureVersion: CODEX_CAPSTONE_FIXTURE_VERSION,
    fixtureSha256: CODEX_CAPSTONE_FIXTURE_SHA256,
    checks: Object.fromEntries(CODEX_CAPSTONE_REQUIRED_CHECKS.map((check) => [check, true])),
  });
  if (!validateCodexCapstoneReceipt(validReceipt).valid) add("capstone.receiptValidator", "Receipt validator rejected the canonical passing receipt.");
  return issues;
}

export async function validateBundledCodexContent(): Promise<readonly CodexValidationIssue[]> {
  const { loadCodexCopy } = await import("./load");
  const english = await loadCodexCopy("en");
  const issues = [...validateCodexManifests(), ...validateCodexCopy("en", english)];
  for (const locale of CODEX_LOCALES) {
    if (locale === "en") continue;
    issues.push(...validateCodexCopy(locale, await loadCodexCopy(locale), english));
  }
  return issues;
}

export async function assertBundledCodexContent(): Promise<void> {
  const issues = await validateBundledCodexContent();
  if (issues.length) {
    const detail = issues.map((issue) => `[${issue.locale}] ${issue.path}: ${issue.message}`).join("\n");
    throw new Error(`Codex course validation failed:\n${detail}`);
  }
}
