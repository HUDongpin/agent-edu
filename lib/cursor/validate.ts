import {
  CURSOR_CAPSTONE_ARTIFACT_IDS,
  CURSOR_CAPSTONE_ARCHIVE_SHA256,
  CURSOR_CAPSTONE_FIXTURE_SHA256,
  CURSOR_CAPSTONE_FIXTURE_VERSION,
  CURSOR_CAPSTONE_RECEIPT_SCHEMA,
  CURSOR_CAPSTONE_RECEIPT_VERSION,
  CURSOR_CAPSTONE_REQUIRED_CHECKS,
  CURSOR_CAPSTONE_RUBRIC,
  CURSOR_CAPSTONE_STAGE_IDS,
  validateCursorCapstoneReceipt,
} from "./capstone";
import { CURSOR_FIGURES } from "./figures";
import { CURSOR_COURSE_MANIFEST } from "./manifest";
import { CURSOR_PRACTICES } from "./practices";
import {
  CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY,
  CURSOR_CAPSTONE_PROGRESS_KEY,
  CURSOR_CAPSTONE_META_PROGRESS_KEY,
  CURSOR_CAPSTONE_PROGRESS_META,
  CURSOR_GLOBAL_RESET_ADAPTER,
  CURSOR_LESSON_PROGRESS_KEYS,
  CURSOR_PROGRESS_CACHE_CONTRACT,
  CURSOR_PROGRESS_EVENT,
  CURSOR_PROGRESS_LOCK_NAME,
  CURSOR_PROGRESS_MILESTONES,
  CURSOR_PROGRESS_PREFIX,
  CURSOR_PROGRESS_STORAGE_KEY,
  cursorProgressCompletedMilestones,
  cursorProgressPercent,
  createCursorCapstoneProgressAssessment,
  isCursorCapstoneProgressPassed,
} from "./progress";
import { CURSOR_FINAL_QUIZ, CURSOR_FINAL_QUIZ_IDS, CURSOR_QUIZ } from "./quiz";
import { CURSOR_SOURCE_BY_ID, CURSOR_SOURCES } from "./sources";
import { CURSOR_OPEN_GRAPH_LOCALES } from "./seo";
import {
  CURSOR_FIGURE_IDS,
  CURSOR_LESSON_SLUGS,
  CURSOR_LOCALES,
  CURSOR_QUIZ_IDS,
  CURSOR_QUIZ_OPTION_IDS,
  CURSOR_UNIT_IDS,
  type CursorCourseCopy,
  type CursorFigureManifest,
  type CursorLessonManifest,
  type CursorLocale,
  type CursorPracticeManifest,
  type CursorQuizManifest,
} from "./types";

export interface CursorValidationIssue {
  readonly locale: CursorLocale | "manifest";
  readonly path: string;
  readonly message: string;
}

export function validateCursorOwnershipRelations(input: {
  readonly lessons: readonly CursorLessonManifest[];
  readonly quiz: readonly CursorQuizManifest[];
  readonly practices: readonly CursorPracticeManifest[];
  readonly figures: readonly CursorFigureManifest[];
}): readonly CursorValidationIssue[] {
  const issues: CursorValidationIssue[] = [];
  const add = (path: string, message: string) => issues.push({ locale: "manifest" as const, path, message });
  const lessonsBySlug = new Map(input.lessons.map((lesson) => [lesson.slug, lesson]));

  for (const question of input.quiz) {
    const assignedLesson = input.lessons.find((lesson) => lesson.quizIds.includes(question.id));
    if (assignedLesson && question.unitId !== assignedLesson.unitId) {
      add(`quiz.${question.id}.unitId`, "Question unitId must match the unit of its assigned lesson.");
    }
  }

  for (const lesson of input.lessons) {
    const practices = input.practices.filter((practice) => practice.lessonSlug === lesson.slug);
    if (practices.length !== 1 || practices[0]?.id !== lesson.practiceId) {
      add(`lessons.${lesson.slug}.practiceId`, "Every lesson must own exactly one matching practice.");
    }

    const referencedFigures = input.figures.filter((figure) => lesson.figureIds.includes(figure.id));
    if (referencedFigures.length !== lesson.figureIds.length
      || referencedFigures.some((figure) => figure.lessonSlug !== lesson.slug)) {
      add(`lessons.${lesson.slug}.figureIds`, "Every referenced figure must exist and name this lesson as its owner.");
    }
  }

  for (const practice of input.practices) {
    if (!lessonsBySlug.has(practice.lessonSlug)) {
      add(`practices.${practice.id}.lessonSlug`, "Practice names an unknown lesson.");
    }
  }
  for (const figure of input.figures) {
    const owners = input.lessons.filter((lesson) => lesson.figureIds.includes(figure.id));
    if (owners.length !== 1 || owners[0]?.slug !== figure.lessonSlug) {
      add(`figures.${figure.id}.lessonSlug`, "Every figure must have exactly one matching lesson owner.");
    }
  }

  return issues;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(
  value: unknown,
  expected: readonly string[],
  locale: CursorLocale,
  path: string,
  issues: CursorValidationIssue[],
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
  locale: CursorLocale,
  path: string,
  issues: CursorValidationIssue[],
): void {
  if (typeof value === "string") {
    if (!value.trim()) issues.push({ locale, path, message: "Visible copy must not be empty." });
    if (value.includes("\u2014")) issues.push({ locale, path, message: "Visible copy contains a prohibited em dash character." });
    if (/[\u0080-\u009f\ufffd]/u.test(value)
      || /(?:Ã|Â)[\u0080-\u00bf]/u.test(value)
      || /â[\u0080-\u009f]/u.test(value)
      || value.includes("ï¿½")) {
      issues.push({ locale, path, message: "Visible copy contains an encoding-corruption marker." });
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

function comparePlaceholderParity(
  reference: unknown,
  candidate: unknown,
  locale: CursorLocale,
  path: string,
  issues: CursorValidationIssue[],
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

const REQUIRED_TECHNICAL_LITERALS = [
  "Cursor",
  "Cursor CLI",
  "Agents Window",
  "Editor",
  "Open IDE",
  "Tab",
  "Inline Edit",
  "Agent",
  "Plan Mode",
  "Project Rules",
  "User Rules",
  "Always Apply",
  "Apply Intelligently",
  "Apply to Specific Files",
  "Apply Manually",
  "Privacy Mode",
  "ZDR",
  "Run Modes",
  "Auto-review",
  "Allowlist",
  "Run Everything",
  ".cursorignore",
  ".cursor/rules",
  ".mdc",
  "AGENTS.md",
  ".cursor/skills",
  ".agents/skills",
  "Skills",
  "Subagents",
  "readonly",
  "Hooks",
  "hooks.json",
  "failClosed",
  "MCP",
  "Cloud Agents",
  "Browser",
  "Browser Origin Allowlist",
  "Git",
  "Anysphere",
  "aicourse.top",
  "SHA-256",
  "CourseList.tsx",
  "CourseList.test.tsx",
  "course-receipt.json",
  "aicourse.cursor.capstone.v1",
  "/courses/",
  "rules.txt",
] as const;

function compareTechnicalLiteralParity(
  reference: unknown,
  candidate: unknown,
  locale: CursorLocale,
  path: string,
  issues: CursorValidationIssue[],
): void {
  if (typeof reference === "string" && typeof candidate === "string") {
    for (const literal of REQUIRED_TECHNICAL_LITERALS) {
      if (reference.includes(literal) && !candidate.includes(literal)) {
        issues.push({ locale, path, message: `Localized copy must preserve technical literal: ${literal}.` });
      }
    }
    return;
  }
  if (Array.isArray(reference) && Array.isArray(candidate)) {
    reference.forEach((item, index) => compareTechnicalLiteralParity(item, candidate[index], locale, `${path}[${index}]`, issues));
    return;
  }
  if (isRecord(reference) && isRecord(candidate)) {
    Object.keys(reference).forEach((key) => compareTechnicalLiteralParity(reference[key], candidate[key], locale, `${path}.${key}`, issues));
  }
}

export function validateCursorCopy(
  locale: CursorLocale,
  copy: unknown,
  englishReference?: CursorCourseCopy,
): readonly CursorValidationIssue[] {
  const issues: CursorValidationIssue[] = [];
  if (!isRecord(copy)) {
    return [{ locale, path: "$", message: "Course copy must be an object." }];
  }

  exactKeys(copy, ["meta", "ui", "units", "lessons", "quiz", "figures", "capstone"], locale, "$", issues);
  exactKeys(copy.units, CURSOR_UNIT_IDS, locale, "$.units", issues);
  exactKeys(copy.lessons, CURSOR_LESSON_SLUGS, locale, "$.lessons", issues);
  exactKeys(copy.quiz, CURSOR_QUIZ_IDS, locale, "$.quiz", issues);
  exactKeys(copy.figures, CURSOR_FIGURE_IDS, locale, "$.figures", issues);

  if (isRecord(copy.lessons)) {
    for (const slug of CURSOR_LESSON_SLUGS) {
      const lesson = copy.lessons[slug];
      if (!isRecord(lesson)) continue;
      if (!Array.isArray(lesson.sections) || lesson.sections.length !== 3) {
        issues.push({ locale, path: `$.lessons.${slug}.sections`, message: "Every lesson must contain exactly three teaching sections." });
      }
      if (isRecord(lesson.practice)) {
        if (!Array.isArray(lesson.practice.steps) || lesson.practice.steps.length !== 3) {
          issues.push({ locale, path: `$.lessons.${slug}.practice.steps`, message: "Every practice must contain exactly three steps." });
        }
        if (!Array.isArray(lesson.practice.evidence) || lesson.practice.evidence.length !== 2) {
          issues.push({ locale, path: `$.lessons.${slug}.practice.evidence`, message: "Every practice must request exactly two evidence items." });
        }
      }
    }
  }

  if (isRecord(copy.quiz)) {
    for (const id of CURSOR_QUIZ_IDS) {
      const question = copy.quiz[id];
      if (isRecord(question)) {
        exactKeys(
          question,
          ["question", "options", "explanation"],
          locale,
          `$.quiz.${id}`,
          issues,
        );
        exactKeys(
          question.options,
          CURSOR_QUIZ_OPTION_IDS,
          locale,
          `$.quiz.${id}.options`,
          issues,
        );
      }
    }
  }

  if (isRecord(copy.capstone)) {
    exactKeys(copy.capstone.artifacts, CURSOR_CAPSTONE_ARTIFACT_IDS, locale, "$.capstone.artifacts", issues);
    exactKeys(copy.capstone.rubric, CURSOR_CAPSTONE_RUBRIC.map((item) => item.id), locale, "$.capstone.rubric", issues);
    if (!Array.isArray(copy.capstone.instructions) || copy.capstone.instructions.length !== CURSOR_CAPSTONE_STAGE_IDS.length) {
      issues.push({ locale, path: "$.capstone.instructions", message: `Capstone must contain ${CURSOR_CAPSTONE_STAGE_IDS.length} ordered stage instructions.` });
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

  walkStrings(copy, locale, "$", issues);

  if (englishReference) {
    const reference = structureSignature(englishReference).join("\n");
    const candidate = structureSignature(copy).join("\n");
    if (reference !== candidate) {
      issues.push({ locale, path: "$", message: "Localized copy structure does not match the English reference." });
    }
    comparePlaceholderParity(englishReference, copy, locale, "$", issues);
    compareTechnicalLiteralParity(englishReference, copy, locale, "$", issues);
    const englishRuleOptions = englishReference.quiz.q13.options;
    const candidateRuleOptions = isRecord(copy.quiz) && isRecord(copy.quiz.q13)
      ? copy.quiz.q13.options
      : undefined;
    if (!isRecord(candidateRuleOptions)
      || CURSOR_QUIZ_OPTION_IDS.some((id) => candidateRuleOptions[id] !== englishRuleOptions[id])) {
      issues.push({ locale, path: "$.quiz.q13.options", message: "Rule-path assessment options must remain exact technical literals." });
    }
  }

  return issues;
}

export function validateCursorManifests(): readonly CursorValidationIssue[] {
  const issues: CursorValidationIssue[] = [];
  const add = (path: string, message: string) => issues.push({ locale: "manifest", path, message });

  issues.push(...validateCursorOwnershipRelations({
    lessons: CURSOR_COURSE_MANIFEST.lessons,
    quiz: CURSOR_QUIZ,
    practices: CURSOR_PRACTICES,
    figures: CURSOR_FIGURES,
  }));

  if (CURSOR_COURSE_MANIFEST.units.length !== 4) add("units", "Course must contain exactly four units.");
  if (CURSOR_COURSE_MANIFEST.lessons.length !== 14) add("lessons", "Course must contain exactly fourteen lessons.");
  if (CURSOR_QUIZ.length !== 28) add("quiz", "Course must contain exactly twenty-eight quiz questions.");
  if (CURSOR_FIGURES.length !== 14) add("figures", "Course must contain exactly fourteen figures.");
  if (CURSOR_PRACTICES.length !== 14) add("practices", "Course must contain exactly fourteen practices.");

  const publicationStatus = String(CURSOR_COURSE_MANIFEST.publicationStatus);
  const publishedOn: string | null = CURSOR_COURSE_MANIFEST.publishedOn;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(CURSOR_COURSE_MANIFEST.preparedOn)) {
    add("course.preparedOn", "Course preparation date must use YYYY-MM-DD.");
  }
  if (publicationStatus === "rights-gated" && publishedOn !== null) {
    add("course.publication", "A rights-gated course must not claim a publication date.");
  }
  if (publicationStatus === "published" && publishedOn === null) {
    add("course.publication", "A published course requires a publication date.");
  }
  if (publishedOn !== null && (!/^\d{4}-\d{2}-\d{2}$/.test(publishedOn) || Number.isNaN(Date.parse(publishedOn)))) {
    add("course.publishedOn", "Publication date must be a valid YYYY-MM-DD value.");
  }
  for (const figure of CURSOR_FIGURES as readonly CursorFigureManifest[]) {
    if (publicationStatus !== "published") continue;
    if (figure.status !== "available") {
      add(`figures.${figure.id}.status`, "A published course cannot contain a pending figure.");
    } else if (figure.kind === "course-original-diagram") {
      if (String(figure.rightsStatus) !== "original-authorship-reviewed") {
        add(`figures.${figure.id}.rightsStatus`, "A course-original figure requires reviewed authorship evidence.");
      }
    } else if (figure.rightsStatus !== "publication-cleared") {
      add(`figures.${figure.id}.rightsStatus`, "A third-party capture requires evidence-bearing publication clearance.");
    }
  }

  const expectedDurations = [40, 45, 50, 55, 60, 60, 55, 55, 65, 60, 55, 55, 55, 90];
  const actualDurations = CURSOR_COURSE_MANIFEST.lessons.map((lesson) => lesson.durationMinutes);
  if (actualDurations.join("|") !== expectedDurations.join("|")) {
    add("lessons.durationMinutes", "Lesson durations differ from the locked 800-minute course contract.");
  }
  if (actualDurations.reduce((sum, minutes) => sum + minutes, 0) !== 800) {
    add("lessons.durationMinutes", "Guided lesson durations must total 800 minutes.");
  }
  for (const lesson of CURSOR_COURSE_MANIFEST.lessons) {
    if (lesson.minutes !== lesson.durationMinutes) add(`lessons.${lesson.slug}.minutes`, "minutes and durationMinutes aliases must match.");
  }

  const lessonOrder = CURSOR_COURSE_MANIFEST.lessons.map((lesson) => lesson.slug);
  if (lessonOrder.join("|") !== CURSOR_LESSON_SLUGS.join("|")) add("lessons", "Lesson slugs or order differ from the locked course contract.");
  const unitOrder = CURSOR_COURSE_MANIFEST.units.map((unit) => unit.id);
  if (unitOrder.join("|") !== CURSOR_UNIT_IDS.join("|")) add("units", "Unit IDs or order differ from the locked course contract.");

  const sourceIds = new Set(CURSOR_SOURCES.map((source) => source.id));
  const assignedQuizIds: string[] = [];
  for (const [lessonIndex, lesson] of CURSOR_COURSE_MANIFEST.lessons.entries()) {
    if (!lesson.objectiveKeys.length) add(`lessons.${lesson.slug}.objectiveKeys`, "Lesson must expose at least one localized objective key.");
    if (!lesson.quizTags.length) add(`lessons.${lesson.slug}.quizTags`, "Lesson must expose stable quiz tags.");
    if (new Set(lesson.prerequisites).size !== lesson.prerequisites.length) {
      add(`lessons.${lesson.slug}.prerequisites`, "Prerequisites must not contain duplicates.");
    }
    if (lesson.quizIds.length !== 2) {
      add(`lessons.${lesson.slug}.quizIds`, "Every lesson must assign exactly two formative questions.");
    }
    assignedQuizIds.push(...lesson.quizIds);
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
    const exerciseBlocks = lesson.blocks.filter((block) => block.type === "exercise");
    if (exerciseBlocks.length !== 1 || exerciseBlocks[0]?.practiceId !== lesson.practiceId) {
      add(`lessons.${lesson.slug}.blocks`, "Exactly one exercise block must reference the lesson practice.");
    }
    const sourceNotes = lesson.blocks.filter((block) => block.type === "source-note");
    if (sourceNotes.length !== 1 || sourceNotes[0]?.sourceIds.join("|") !== lesson.sourceIds.join("|")) {
      add(`lessons.${lesson.slug}.blocks`, "Exactly one source-note block must match lesson sources.");
    }

    const communityCount = lesson.sourceIds.filter((id) => CURSOR_SOURCE_BY_ID[id]?.kind === "community-github").length;
    if (communityCount > 2) add(`lessons.${lesson.slug}.sourceIds`, "A lesson may cite at most two community repositories.");
    for (const sourceId of lesson.sourceIds) {
      if (!sourceIds.has(sourceId)) add(`lessons.${lesson.slug}.sourceIds`, `Unknown source ID: ${sourceId}.`);
    }
  }
  if (assignedQuizIds.length !== 28 || new Set(assignedQuizIds).size !== 28) {
    add("lessons.quizIds", "The lesson-level checks must assign every quiz question exactly once.");
  }

  for (const source of CURSOR_SOURCES) {
    if (!/^https:\/\//.test(source.exactAnchor)) add(`sources.${source.id}.exactAnchor`, "Source requires an exact HTTPS anchor.");
    if (source.supportingAnchors?.some((anchor) => !/^https:\/\//.test(anchor))) {
      add(`sources.${source.id}.supportingAnchors`, "Supporting source anchors must use HTTPS.");
    }
    if (source.kind === "community-github" && !source.license?.trim()) {
      add(`sources.${source.id}.license`, "Community GitHub source requires a license or citation-only record.");
    }
    if (source.kind === "community-github" && !/^[a-f0-9]{40}$/.test(source.revision ?? "")) {
      add(`sources.${source.id}.revision`, "Community GitHub source requires an immutable 40-character commit revision.");
    }
    if ((source.kind === "community-github" || source.kind === "official-github")
      && source.revision
      && !source.exactAnchor.includes(source.revision)) {
      add(`sources.${source.id}.exactAnchor`, "GitHub exact anchor must contain the recorded immutable revision.");
    }
  }

  for (const practice of CURSOR_PRACTICES) {
    if (!practice.promptKey.trim()) add(`practices.${practice.id}.promptKey`, "Practice requires a localized prompt key.");
    if (practice.observableActionCount < 1 || practice.selfCheckCriteriaCount < 1) {
      add(`practices.${practice.id}`, "Practice requires observable actions and self-check criteria.");
    }
    if (practice.completionKey !== `cursor.lesson.${practice.lessonSlug}`) {
      add(`practices.${practice.id}.completionKey`, "Practice completion key must match its lesson.");
    }
  }

  for (const question of CURSOR_QUIZ) {
    if (!CURSOR_QUIZ_OPTION_IDS.includes(question.correctOptionId)) {
      add(`quiz.${question.id}`, "Correct option ID must be one of a, b, c, or d.");
    }
    const assignedLesson = CURSOR_COURSE_MANIFEST.lessons.find((lesson) => lesson.quizIds.includes(question.id));
    if (assignedLesson?.slug !== question.lessonSlug) {
      add(`quiz.${question.id}.lessonSlug`, "Question lessonSlug must match its formative lesson assignment.");
    }
    if (assignedLesson && question.unitId !== assignedLesson.unitId) {
      add(`quiz.${question.id}.unitId`, "Question unitId must match its assigned lesson unitId.");
    }
    if (!question.sourceIds.length) add(`quiz.${question.id}.sourceIds`, "Every assessed answer requires at least one source.");
    for (const sourceId of question.sourceIds) {
      if (!sourceIds.has(sourceId)) add(`quiz.${question.id}.sourceIds`, `Unknown source ID: ${sourceId}.`);
      if (!assignedLesson?.sourceIds.includes(sourceId)) {
        add(`quiz.${question.id}.sourceIds`, `Assessment source must appear in its lesson ledger: ${sourceId}.`);
      }
    }
  }

  if (new Set(CURSOR_FINAL_QUIZ_IDS).size !== 28 || CURSOR_FINAL_QUIZ.bankSize !== 28) {
    add("finalQuiz.bankQuestionIds", "Final quiz must use the complete 28-question bank.");
  }
  if (CURSOR_FINAL_QUIZ.questionCount !== 12) {
    add("finalQuiz.questionCount", "Each final-quiz attempt must contain twelve questions.");
  }
  if (CURSOR_FINAL_QUIZ.questionsPerUnit !== 3) add("finalQuiz.questionsPerUnit", "Final quiz must draw exactly three questions from each unit.");
  if (CURSOR_FINAL_QUIZ.passingCorrectAnswers !== 10) add("finalQuiz.passingCorrectAnswers", "Final quiz must require ten correct answers out of twelve.");
  if (CURSOR_FINAL_QUIZ.scorePolicy !== "best-score") add("finalQuiz.scorePolicy", "Final quiz must retain the learner's best score.");
  if (CURSOR_FINAL_QUIZ.selectionPolicy !== "stratified-random") add("finalQuiz.selectionPolicy", "Final quiz attempts must be newly stratified selections.");
  if (CURSOR_FINAL_QUIZ.bankVersion !== "2") add("finalQuiz.bankVersion", "Question bank must carry its release version.");

  if (CURSOR_LESSON_PROGRESS_KEYS.length !== 14 || new Set(CURSOR_LESSON_PROGRESS_KEYS).size !== 14) {
    add("progress.lessonKeys", "Progress adapter must expose fourteen unique lesson flags.");
  }
  if (CURSOR_PROGRESS_MILESTONES !== 16) add("progress.milestones", "Progress adapter must use sixteen equal milestones.");
  if (CURSOR_PROGRESS_STORAGE_KEY !== "aicourse.cursor.progress.v1") {
    add("progress.storageKey", "Progress adapter must read the isolated versioned Cursor record.");
  }
  if (CURSOR_PROGRESS_EVENT !== "cursor:progress-change") add("progress.event", "Same-tab progress invalidation event changed.");
  if (CURSOR_PROGRESS_PREFIX !== "cursor.") add("progress.prefix", "Cursor progress reset prefix changed.");
  if (CURSOR_CAPSTONE_PROGRESS_KEY !== "cursor.capstone.v1") add("progress.capstoneKey", "Versioned capstone progress key changed.");
  if (CURSOR_CAPSTONE_META_PROGRESS_KEY !== "cursor.capstoneMeta.v1") add("progress.capstoneMetaKey", "Versioned capstone metadata key changed.");
  if (CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY !== "cursor.capstoneAssessment.v1") {
    add("progress.capstoneAssessmentKey", "Versioned capstone self-assessment key changed.");
  }
  if (CURSOR_CAPSTONE_PROGRESS_META.receiptSchema !== CURSOR_CAPSTONE_RECEIPT_SCHEMA
    || CURSOR_CAPSTONE_PROGRESS_META.receiptVersion !== CURSOR_CAPSTONE_RECEIPT_VERSION
    || CURSOR_CAPSTONE_PROGRESS_META.fixtureVersion !== CURSOR_CAPSTONE_FIXTURE_VERSION
    || CURSOR_CAPSTONE_PROGRESS_META.fixtureSha256 !== CURSOR_CAPSTONE_FIXTURE_SHA256
    || CURSOR_CAPSTONE_PROGRESS_META.requiredChecks !== CURSOR_CAPSTONE_REQUIRED_CHECKS.join("|")) {
    add("progress.capstoneMeta", "Stored capstone metadata must exactly identify the current public receipt contract.");
  }
  if (CURSOR_GLOBAL_RESET_ADAPTER !== "resetCursorProgressAfterGlobalReset") {
    add("progress.globalReset", "Global-reset adapter name changed.");
  }
  if (CURSOR_PROGRESS_CACHE_CONTRACT.storageKey !== CURSOR_PROGRESS_STORAGE_KEY
    || CURSOR_PROGRESS_CACHE_CONTRACT.sameTabEvent !== CURSOR_PROGRESS_EVENT
    || CURSOR_PROGRESS_CACHE_CONTRACT.crossTabEvent !== "storage"
    || CURSOR_PROGRESS_CACHE_CONTRACT.focusEvent !== "focus"
    || CURSOR_PROGRESS_CACHE_CONTRACT.lockName !== CURSOR_PROGRESS_LOCK_NAME
    || CURSOR_PROGRESS_CACHE_CONTRACT.boundedCommitAttempts !== 3
    || CURSOR_PROGRESS_CACHE_CONTRACT.storageIsolation !== "course-specific record; no cross-course writers"
    || CURSOR_PROGRESS_CACHE_CONTRACT.cooperativeWriterScope !== "Cursor tabs"
    || CURSOR_PROGRESS_CACHE_CONTRACT.nonCooperatingWriterStrategy !== "isolated-record-no-cross-course-writers"
    || CURSOR_PROGRESS_CACHE_CONTRACT.globalReset.callAfter !== "resetAllCourseProgress"
    || CURSOR_PROGRESS_CACHE_CONTRACT.globalReset.adapter !== CURSOR_GLOBAL_RESET_ADAPTER
    || CURSOR_PROGRESS_CACHE_CONTRACT.globalReset.awaitAdapter !== true) {
    add("progress.cacheContract", "Progress cache or global-reset integration contract changed.");
  }

  const expectedOpenGraphLocales = {
    en: "en_US",
    es: "es_ES",
    fr: "fr_FR",
    de: "de_DE",
    "zh-Hans": "zh_CN",
    "zh-Hant": "zh_TW",
    ja: "ja_JP",
    ko: "ko_KR",
    ar: "ar_SA",
  };
  if (JSON.stringify(CURSOR_OPEN_GRAPH_LOCALES) !== JSON.stringify(expectedOpenGraphLocales)) {
    add("seo.openGraphLocales", "Open Graph locales must map site language tags to territory-qualified og:locale values.");
  }

  const allLessonProgress = Object.fromEntries(CURSOR_LESSON_PROGRESS_KEYS.map((key) => [key, true]));
  const strictQuizProgress = {
    [CURSOR_FINAL_QUIZ.versionStorageKey]: CURSOR_FINAL_QUIZ.bankVersion,
    [CURSOR_FINAL_QUIZ.bestScoreStorageKey]: CURSOR_FINAL_QUIZ.passingCorrectAnswers,
    [CURSOR_FINAL_QUIZ.passedStorageKey]: true,
  };
  const passingCapstoneAssessment = createCursorCapstoneProgressAssessment(
    Object.fromEntries(CURSOR_CAPSTONE_ARTIFACT_IDS.map((id) => [id, true])),
    { scope: true, safety: true, implementation: false, verification: true, handoff: true },
  );
  const completeProgress = {
    ...allLessonProgress,
    ...strictQuizProgress,
    [CURSOR_CAPSTONE_PROGRESS_KEY]: true,
    [CURSOR_CAPSTONE_META_PROGRESS_KEY]: CURSOR_CAPSTONE_PROGRESS_META,
    [CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY]: passingCapstoneAssessment,
  };
  const progressCases: readonly [string, unknown, number, number][] = [
    ["null", null, 0, 0],
    ["array", [], 0, 0],
    ["unrelated keys", { "codex.lesson.example": true }, 0, 0],
    ["one lesson", { [CURSOR_LESSON_PROGRESS_KEYS[0]]: true }, 1, 6],
    ["all lessons", allLessonProgress, 14, 88],
    ["bare capstone Boolean", { [CURSOR_CAPSTONE_PROGRESS_KEY]: true }, 0, 0],
    ["stale capstone metadata", {
      [CURSOR_CAPSTONE_PROGRESS_KEY]: true,
      [CURSOR_CAPSTONE_META_PROGRESS_KEY]: { ...CURSOR_CAPSTONE_PROGRESS_META, fixtureSha256: "stale" },
      [CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY]: passingCapstoneAssessment,
    }, 0, 0],
    ["capstone without self-assessment", {
      [CURSOR_CAPSTONE_PROGRESS_KEY]: true,
      [CURSOR_CAPSTONE_META_PROGRESS_KEY]: CURSOR_CAPSTONE_PROGRESS_META,
    }, 0, 0],
    ["current capstone", {
      [CURSOR_CAPSTONE_PROGRESS_KEY]: true,
      [CURSOR_CAPSTONE_META_PROGRESS_KEY]: CURSOR_CAPSTONE_PROGRESS_META,
      [CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY]: passingCapstoneAssessment,
    }, 1, 6],
    ["unversioned quiz Boolean", { [CURSOR_FINAL_QUIZ.passedStorageKey]: true }, 0, 0],
    ["sub-threshold quiz", {
      [CURSOR_FINAL_QUIZ.versionStorageKey]: CURSOR_FINAL_QUIZ.bankVersion,
      [CURSOR_FINAL_QUIZ.bestScoreStorageKey]: CURSOR_FINAL_QUIZ.passingCorrectAnswers - 1,
      [CURSOR_FINAL_QUIZ.passedStorageKey]: true,
    }, 0, 0],
    ["complete", completeProgress, 16, 100],
  ];
  for (const [label, value, expectedCompleted, expectedPercent] of progressCases) {
    if (cursorProgressCompletedMilestones(value) !== expectedCompleted
      || cursorProgressPercent(value) !== expectedPercent) {
      add(`progress.cases.${label}`, `Pure progress adapter failed the ${label} regression case.`);
    }
  }
  if (!isCursorCapstoneProgressPassed(completeProgress)) {
    add("progress.capstoneMetadata", "Current version-matched capstone metadata was rejected.");
  }

  const questionsById = new Map(CURSOR_QUIZ.map((question) => [question.id, question]));
  if (CURSOR_FINAL_QUIZ_IDS.some((id) => !questionsById.has(id))) {
    add("finalQuiz.bankQuestionIds", "Final quiz bank references an unknown question.");
  }
  for (const unitId of CURSOR_UNIT_IDS) {
    const available = CURSOR_FINAL_QUIZ_IDS.filter((id) => questionsById.get(id)?.unitId === unitId).length;
    if (available < CURSOR_FINAL_QUIZ.questionsPerUnit) {
      add(`finalQuiz.${unitId}`, "Question bank must support three questions from this unit per attempt.");
    }
  }
  const expectedBankCounts = [8, 8, 8, 4];
  CURSOR_UNIT_IDS.forEach((unitId, index) => {
    const actual = CURSOR_QUIZ.filter((question) => question.unitId === unitId).length;
    if (actual !== expectedBankCounts[index]) add(`quiz.${unitId}`, `Question bank must contain ${expectedBankCounts[index]} items for this unit.`);
  });

  const availableOnlyFields = [
    "src", "srcSet", "width", "height", "sha256", "rightsStatus", "createdOn",
    "capturedOn", "cursorVersion", "os", "privacyReviewed", "sourceUrl",
    "sourceAssetSha256", "frameTimeSeconds", "visiblePublicDemoIdentifiers",
    "rightsEvidence", "license", "rightsPath", "provenancePath",
  ];
  for (const figure of CURSOR_FIGURES as readonly CursorFigureManifest[]) {
    for (const callout of figure.callouts ?? []) {
      if (!callout.id.trim() || !callout.labelKey.trim()) add(`figures.${figure.id}.callouts`, "Callouts require stable IDs and localized label keys.");
      if (callout.xPercent < 0 || callout.xPercent > 100 || callout.yPercent < 0 || callout.yPercent > 100) {
        add(`figures.${figure.id}.callouts.${callout.id}`, "Callout coordinates must be percentages between zero and one hundred.");
      }
    }
    if (figure.status === "capture-required") {
      const fields = Object.keys(figure);
      const found = availableOnlyFields.find((field) => fields.includes(field));
      if (found) add(`figures.${figure.id}.${found}`, "Pending figures must not invent capture metadata.");
      if (!figure.teachingIntent.trim()) add(`figures.${figure.id}.teachingIntent`, "Pending figures need a concrete teaching intent.");
      if (!figure.privacyChecklist.length) add(`figures.${figure.id}.privacyChecklist`, "Pending figures need a privacy checklist.");
      continue;
    }

    if (!figure.teachingIntent.trim()) {
      add(`figures.${figure.id}.teachingIntent`, "Available figures need a concrete teaching intent.");
    }
    if (!figure.privacyChecklist.length || figure.privacyChecklist.some((item) => !item.trim())) {
      add(`figures.${figure.id}.privacyChecklist`, "Available figures need a non-empty privacy checklist.");
    }
    if (!figure.src.startsWith("/") || /^\/\//.test(figure.src)) {
      add(`figures.${figure.id}.src`, "Available figures must use a root-relative local asset.");
    }
    if (!Number.isInteger(figure.width) || figure.width < 1 || !Number.isInteger(figure.height) || figure.height < 1) {
      add(`figures.${figure.id}.dimensions`, "Available figures need positive intrinsic dimensions.");
    }
    if (!/^[a-f0-9]{64}$/.test(figure.sha256)) {
      add(`figures.${figure.id}.sha256`, "Available figures need a lowercase SHA-256 digest.");
    }

    if (figure.kind === "course-original-diagram") {
      if (!/^\/courses\/cursor\/fig-\d{2}-concept\.svg$/.test(figure.src)) {
        add(`figures.${figure.id}.src`, "Course-original figures must use the canonical local SVG path.");
      }
      if (String(figure.rightsStatus) !== "original-authorship-reviewed") {
        add(`figures.${figure.id}.rightsStatus`, "Course-original figures require reviewed authorship evidence.");
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(figure.createdOn) || Number.isNaN(Date.parse(figure.createdOn))) {
        add(`figures.${figure.id}.createdOn`, "Course-original figures need a valid creation date.");
      }
      if (!figure.diagramVersion.trim() || figure.author !== "aicourse.top course team" || figure.license !== "MIT") {
        add(`figures.${figure.id}.authorship`, "Course-original figures need versioned MIT authorship metadata.");
      }
      if (figure.noticePath !== "/courses/cursor/THIRD_PARTY_NOTICES.md"
        || figure.rightsPath !== "/courses/cursor/figure-rights.json"
        || figure.provenancePath !== "/courses/cursor/figure-provenance.json") {
        add(`figures.${figure.id}.evidencePaths`, "Course-original figures must link the canonical notice, rights, and provenance records.");
      }
      if (!figure.evidenceSourceIds.length || figure.evidenceSourceIds.some((id) => !sourceIds.has(id))) {
        add(`figures.${figure.id}.evidenceSourceIds`, "Course-original teaching claims require known evidence sources.");
      }
      continue;
    }

    const localSources = [
      figure.src,
      figure.srcSet.webpLarge,
      figure.srcSet.webpSmall,
      ...(figure.srcSet.mobile ? [figure.srcSet.mobile] : []),
    ];
    if (localSources.some((src) => !src.startsWith("/") || /^\/\//.test(src))) {
      add(`figures.${figure.id}.srcSet`, "Third-party captures must use root-relative local assets.");
    }
    if (!/^\d{4}-\d{2}-\d{2}/.test(figure.capturedOn) || Number.isNaN(Date.parse(figure.capturedOn))) {
      add(`figures.${figure.id}.capturedOn`, "Third-party captures need a valid capture date.");
    }
    if (!figure.cursorVersion.trim() || !figure.os.trim()) {
      add(`figures.${figure.id}.product`, "Third-party captures need Cursor version and operating system provenance.");
    }
    if (figure.privacyReviewed !== true) add(`figures.${figure.id}.privacyReviewed`, "Available figures require completed privacy review.");
    if (!/^https:\/\//.test(figure.sourceUrl)) add(`figures.${figure.id}.sourceUrl`, "Available figures need an HTTPS provenance URL.");
    if (!/^https:\/\//.test(figure.sourcePageUrl)) add(`figures.${figure.id}.sourcePageUrl`, "Available figures need an HTTPS source-page URL.");
    if (/\.mp4(?:$|\?)/.test(figure.sourceUrl)) {
      if (!/^[a-f0-9]{64}$/.test(figure.sourceAssetSha256 ?? "")) {
        add(`figures.${figure.id}.sourceAssetSha256`, "Video-derived figures need the source asset SHA-256.");
      }
      if (typeof figure.frameTimeSeconds !== "number" || !Number.isFinite(figure.frameTimeSeconds) || figure.frameTimeSeconds < 0) {
        add(`figures.${figure.id}.frameTimeSeconds`, "Video-derived figures need a non-negative frame timestamp.");
      }
    }
    if (figure.visiblePublicDemoIdentifiers?.some((item) => !item.trim())) {
      add(`figures.${figure.id}.visiblePublicDemoIdentifiers`, "Public demo identifier disclosures cannot be blank.");
    }
    if (!figure.copyrightNotice.trim()) add(`figures.${figure.id}.copyrightNotice`, "Available figures need a copyright and independence notice.");
    if (figure.rightsStatus === "publication-cleared") {
      const evidence = figure.rightsEvidence;
      if (!evidence.reviewedBy.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(evidence.reviewedOn)
        || Number.isNaN(Date.parse(evidence.reviewedOn)) || !evidence.basis.trim()
        || !evidence.scope.trim() || !/^https:\/\//.test(evidence.evidenceUrl)
        || evidence.exactAssetSha256 !== figure.sha256) {
        add(`figures.${figure.id}.rightsEvidence`, "Publication clearance must be reviewable, dated, scoped, linked, and bound to the exact asset hash.");
      }
    }
  }

  const rubricWeight = CURSOR_CAPSTONE_RUBRIC.reduce((sum, item) => sum + item.weight, 0);
  if (rubricWeight !== 100) add("capstone.rubric", "Capstone rubric weights must total 100.");
  if (CURSOR_CAPSTONE_RECEIPT_SCHEMA !== "aicourse.cursor.capstone.v1") add("capstone.receiptSchema", "Capstone receipt schema differs from the locked contract.");
  if (CURSOR_CAPSTONE_FIXTURE_VERSION !== "1") add("capstone.fixtureVersion", "Capstone fixture version differs from the locked contract.");
  if (CURSOR_CAPSTONE_FIXTURE_SHA256 !== "3b6f1f3749ec0be076c86725f494a1780a4c126e1a9480c55f5c2d8433b5e31b") {
    add("capstone.fixtureSha256", "Capstone fixture hash differs from the locked contract.");
  }
  if (CURSOR_CAPSTONE_ARCHIVE_SHA256 !== "4d7623fee2771309cac1d87c33da30883bec58938bcdc67a8f3995156f31a34e") {
    add("capstone.archiveSha256", "Capstone download archive hash differs from the locked contract.");
  }
  const expectedChecks = ["tests", "lint", "build", "routesPreserved", "keyboardBehavior", "noNewDependencies"];
  if (CURSOR_CAPSTONE_REQUIRED_CHECKS.join("|") !== expectedChecks.join("|")) add("capstone.requiredChecks", "Capstone required checks differ from the locked contract.");
  const validReceipt = JSON.stringify({
    schema: CURSOR_CAPSTONE_RECEIPT_SCHEMA,
    fixtureVersion: CURSOR_CAPSTONE_FIXTURE_VERSION,
    fixtureSha256: CURSOR_CAPSTONE_FIXTURE_SHA256,
    checks: Object.fromEntries(CURSOR_CAPSTONE_REQUIRED_CHECKS.map((check) => [check, true])),
  });
  if (!validateCursorCapstoneReceipt(validReceipt).valid) add("capstone.receiptValidator", "Receipt validator rejected the canonical passing receipt.");
  return issues;
}

export async function validateBundledCursorContent(): Promise<readonly CursorValidationIssue[]> {
  const { loadCursorCopy } = await import("./load");
  const english = await loadCursorCopy("en");
  const issues = [...validateCursorManifests(), ...validateCursorCopy("en", english)];
  for (const locale of CURSOR_LOCALES) {
    if (locale === "en") continue;
    issues.push(...validateCursorCopy(locale, await loadCursorCopy(locale), english));
  }
  return issues;
}

export async function assertBundledCursorContent(): Promise<void> {
  const issues = await validateBundledCursorContent();
  if (issues.length) {
    const detail = issues.map((issue) => `[${issue.locale}] ${issue.path}: ${issue.message}`).join("\n");
    throw new Error(`Cursor course validation failed:\n${detail}`);
  }
}
