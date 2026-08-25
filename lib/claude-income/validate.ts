import { CLAUDE_INCOME_CAPSTONE } from "./capstone";
import { CLAUDE_INCOME_COURSE } from "./curriculum";
import { CLAUDE_INCOME_FIGURES, CLAUDE_INCOME_FIGURE_BY_ID } from "./figures";
import { CLAUDE_INCOME_FINAL_QUIZ, CLAUDE_INCOME_QUIZ_BANK } from "./quiz";
import { CLAUDE_INCOME_SOURCES, CLAUDE_INCOME_SOURCE_BY_ID } from "./sources";
import type {
  ClaudeIncomeFigure,
  ClaudeIncomeQuizQuestion,
  ClaudeIncomeSource,
} from "./types";

function stringsIn(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(stringsIn);
  }
  return [];
}

export function validateClaudeIncomeCourse(): string[] {
  const errors: string[] = [];
  const { lessons, units } = CLAUDE_INCOME_COURSE;
  const instructionalSourceIds = new Set([
    ...lessons.flatMap((lesson) => [
      ...lesson.sourceIds,
      ...lesson.sections.flatMap((section) => section.sourceIds),
    ]),
    ...(CLAUDE_INCOME_QUIZ_BANK as readonly ClaudeIncomeQuizQuestion[])
      .flatMap((question) => question.sourceIds),
  ]);

  if (CLAUDE_INCOME_COURSE.displayNumber !== 12) errors.push("Course display number must be the literal 12.");
  if (units.length !== 4) errors.push(`Expected 4 units, found ${units.length}.`);
  if (lessons.length !== 12) errors.push(`Expected 12 lessons, found ${lessons.length}.`);
  const totalMinutes = lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
  if (totalMinutes !== 895) errors.push(`Expected an 895-minute course, found ${totalMinutes} minutes.`);
  if (CLAUDE_INCOME_FIGURES.length < 7) errors.push("At least 7 audited real Claude UI figures are required.");
  if (CLAUDE_INCOME_QUIZ_BANK.length < 24) errors.push("At least 24 scenario questions are required.");

  const lessonSlugs = new Set<string>();
  const lessonOrders = new Set<number>();
  const unitIds = new Set(units.map((unit) => unit.id));
  for (const lesson of lessons) {
    if (lessonSlugs.has(lesson.slug)) errors.push(`Duplicate lesson slug: ${lesson.slug}.`);
    lessonSlugs.add(lesson.slug);
    if (lessonOrders.has(lesson.order)) errors.push(`Duplicate lesson order: ${lesson.order}.`);
    lessonOrders.add(lesson.order);
    if (!unitIds.has(lesson.unitId)) errors.push(`${lesson.slug} has unknown unit ${lesson.unitId}.`);
    if (lesson.sections.length < 3) errors.push(`${lesson.slug} needs at least 3 substantive sections.`);
    if (lesson.workflow.length < 5) errors.push(`${lesson.slug} needs a 5-step workflow.`);
    if (lesson.qualityGate.length < 4) errors.push(`${lesson.slug} needs at least 4 quality gates.`);
    if (lesson.redFlags.length < 3) errors.push(`${lesson.slug} needs at least 3 red flags.`);
    if (lesson.practice.deliverables.length < 1) errors.push(`${lesson.slug} needs a named practice deliverable.`);
    if (lesson.practice.doneWhen.length < 2) errors.push(`${lesson.slug} needs measurable completion rules.`);
    if (!lesson.promptTemplate.trim()) errors.push(`${lesson.slug} needs a reusable prompt template.`);

    for (const sourceId of lesson.sourceIds) {
      if (!CLAUDE_INCOME_SOURCE_BY_ID.has(sourceId)) errors.push(`${lesson.slug} references unknown source ${sourceId}.`);
    }
    for (const section of lesson.sections) {
      for (const sourceId of section.sourceIds) {
        if (!lesson.sourceIds.includes(sourceId)) {
          errors.push(`${lesson.slug} section source ${sourceId} is missing from the lesson source ledger.`);
        }
      }
    }
    for (const figureId of lesson.figureIds) {
      if (!CLAUDE_INCOME_FIGURE_BY_ID.has(figureId)) errors.push(`${lesson.slug} references unknown figure ${figureId}.`);
    }
  }

  for (let order = 1; order <= 12; order += 1) {
    if (!lessonOrders.has(order)) errors.push(`Missing lesson order ${order}.`);
  }

  for (const unit of units) {
    if (unit.lessonSlugs.length !== 3) errors.push(`${unit.id} must contain exactly 3 lessons.`);
    for (const slug of unit.lessonSlugs) {
      const lesson = lessons.find((item) => item.slug === slug);
      if (!lesson) errors.push(`${unit.id} references missing lesson ${slug}.`);
      else if (lesson.unitId !== unit.id) errors.push(`${slug} is assigned to ${lesson.unitId}, not ${unit.id}.`);
    }
  }

  const sourceIds = new Set<string>();
  for (const source of CLAUDE_INCOME_SOURCES as readonly ClaudeIncomeSource[]) {
    if (sourceIds.has(source.id)) errors.push(`Duplicate source ID: ${source.id}.`);
    sourceIds.add(source.id);
    if (!source.url.startsWith("https://")) errors.push(`${source.id} must use a direct HTTPS URL.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.accessedOn)) errors.push(`${source.id} needs an ISO access date.`);
    if (source.kind === "x-post" && source.rightsStatus !== "link-only") {
      errors.push(`${source.id} X evidence must remain link-only without separate permission.`);
    }
    if (source.kind === "x-post" && source.claimClass !== "practitioner-report") {
      errors.push(`${source.id} X evidence must be classified as a practitioner report.`);
    }
    if ((source.kind === "github" || source.kind === "case-study") && !source.license) {
      errors.push(`${source.id} needs a license-scope note.`);
    }
    if ((source.kind === "github" || source.kind === "case-study") && !/^[a-f0-9]{40}$/.test(source.pinnedRevision ?? "")) {
      errors.push(`${source.id} needs an immutable 40-character Git revision.`);
    }
    if ((source.kind === "github" || source.kind === "case-study")
      && (!source.immutableUrl?.startsWith("https://github.com/")
        || !source.immutableUrl.includes(source.pinnedRevision ?? "missing-revision"))) {
      errors.push(`${source.id} needs a GitHub permalink containing its pinned revision.`);
    }
    if (source.evidenceGrade === "D" && instructionalSourceIds.has(source.id)) {
      errors.push(`${source.id} is Grade D and must not support a lesson or assessment claim.`);
    }
  }

  const figureIds = new Set<string>();
  for (const figure of CLAUDE_INCOME_FIGURES as readonly ClaudeIncomeFigure[]) {
    if (figureIds.has(figure.id)) errors.push(`Duplicate figure ID: ${figure.id}.`);
    figureIds.add(figure.id);
    if (figure.captureBasis !== "course-authored-real-ui-capture") errors.push(`${figure.id} is not a real UI capture.`);
    if (figure.privacyReview !== "passed") errors.push(`${figure.id} has not passed privacy review.`);
    if (figure.rightsStatus !== "course-authored-capture") errors.push(`${figure.id} has an ambiguous rights status.`);
    if (!/^https:\/\/(?:academy|support)\.claude\.com\//.test(figure.sourceUrl)) {
      errors.push(`${figure.id} needs a direct official Claude guidance URL.`);
    }
    if (!/^[a-f0-9]{64}$/.test(figure.sha256)) errors.push(`${figure.id} has an invalid master hash.`);
    const seenWidths = new Set<number>();
    for (const variant of figure.variants) {
      if (seenWidths.has(variant.width) && variant.src !== figure.variants[0]?.src) {
        // Duplicate-width assets may exist as audit artifacts, but the renderer must deduplicate them.
        continue;
      }
      seenWidths.add(variant.width);
      if (!/^[a-f0-9]{64}$/.test(variant.sha256)) errors.push(`${figure.id} has an invalid variant hash.`);
    }
  }

  const questionIds = new Set<string>();
  const questionsByUnit = new Map<string, number>();
  for (const question of CLAUDE_INCOME_QUIZ_BANK as readonly ClaudeIncomeQuizQuestion[]) {
    if (questionIds.has(question.id)) errors.push(`Duplicate quiz ID: ${question.id}.`);
    questionIds.add(question.id);
    questionsByUnit.set(question.unitId, (questionsByUnit.get(question.unitId) ?? 0) + 1);
    if (!lessonSlugs.has(question.lessonSlug)) errors.push(`${question.id} references an unknown lesson.`);
    if (question.options.length !== 4) errors.push(`${question.id} must have exactly 4 options.`);
    if (question.correctIndex < 0 || question.correctIndex >= question.options.length) {
      errors.push(`${question.id} has an invalid correct answer index.`);
    }
    for (const sourceId of question.sourceIds) {
      if (!CLAUDE_INCOME_SOURCE_BY_ID.has(sourceId)) errors.push(`${question.id} references unknown source ${sourceId}.`);
    }
  }
  for (const unit of units) {
    if ((questionsByUnit.get(unit.id) ?? 0) < 6) errors.push(`${unit.id} needs at least 6 quiz questions.`);
    const critical = (CLAUDE_INCOME_QUIZ_BANK as readonly ClaudeIncomeQuizQuestion[])
      .filter((item) => item.unitId === unit.id && item.critical);
    if (critical.length < 1) errors.push(`${unit.id} needs at least one critical-boundary question.`);
    const nonCritical = (CLAUDE_INCOME_QUIZ_BANK as readonly ClaudeIncomeQuizQuestion[])
      .filter((item) => item.unitId === unit.id && !item.critical);
    if (nonCritical.length < CLAUDE_INCOME_FINAL_QUIZ.questionsPerUnit - 1) {
      errors.push(`${unit.id} needs enough non-critical questions for an exact-one-critical attempt.`);
    }
  }
  if (CLAUDE_INCOME_FINAL_QUIZ.questionsPerUnit * units.length !== CLAUDE_INCOME_FINAL_QUIZ.questionCount) {
    errors.push("Final quiz unit balance does not equal its question count.");
  }

  const rubricTotal = CLAUDE_INCOME_CAPSTONE.criteria.reduce((sum, criterion) => sum + criterion.points, 0);
  if (rubricTotal !== 100) errors.push(`Capstone rubric must total 100 points, found ${rubricTotal}.`);
  if (CLAUDE_INCOME_CAPSTONE.minimumScore !== 80) errors.push("Capstone passing score must be 80.");
  if (CLAUDE_INCOME_CAPSTONE.criticalFailures.length < 8) errors.push("Capstone needs at least 8 non-compensable critical failures.");

  const requiredDisclaimerPhrases = ["does not promise income", "Verify Claude's outputs"];
  for (const phrase of requiredDisclaimerPhrases) {
    if (!CLAUDE_INCOME_COURSE.disclaimer.includes(phrase)) errors.push(`Course disclaimer is missing: ${phrase}.`);
  }
  if (!CLAUDE_INCOME_COURSE.practitionerDisclaimer.includes("self-reported")) {
    errors.push("Practitioner disclaimer must say that examples are self-reported.");
  }
  if (!CLAUDE_INCOME_COURSE.independentProjectNotice.includes("not affiliated with, sponsored by, or endorsed by Anthropic")) {
    errors.push("Independent-project notice is incomplete.");
  }

  const visibleText = stringsIn({
    course: CLAUDE_INCOME_COURSE,
    quiz: CLAUDE_INCOME_QUIZ_BANK,
    figures: CLAUDE_INCOME_FIGURES,
    capstone: CLAUDE_INCOME_CAPSTONE,
  }).join("\n");
  if (/[\u2013\u2014]/.test(visibleText)) errors.push("Visible course copy contains an en or em dash.");

  return errors;
}

export function assertValidClaudeIncomeCourse(): void {
  const errors = validateClaudeIncomeCourse();
  if (errors.length) throw new Error(`Invalid Claude income course:\n${errors.join("\n")}`);
}
