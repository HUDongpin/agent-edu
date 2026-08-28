import type {
  CourseKitMaterialisedQuizQuestion,
  CourseKitOptionIndex,
  CourseKitThreeQuizForms,
} from "./types";

export interface CourseKitQuizGrade {
  readonly score: number;
  readonly total: number;
  readonly passCount: number;
  readonly criticalCorrect: number;
  readonly criticalTotal: number;
  readonly allCriticalCorrect: boolean;
  readonly passed: boolean;
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function validateCourseKitQuizForms<
  Question extends Pick<
    CourseKitMaterialisedQuizQuestion,
    "id" | "critical" | "moduleSlug"
  >,
>(
  questions: readonly Question[],
  forms: CourseKitThreeQuizForms<string> | readonly { readonly id: string; readonly questionIds: readonly string[] }[],
  drawCount: 12 | 16,
  moduleSlugs: readonly string[],
): readonly string[] {
  const issues: string[] = [];
  if (forms.length !== 3) issues.push("Exactly three quiz forms are required.");
  const formIds = forms.map((form) => form.id);
  if (new Set(formIds).size !== formIds.length) {
    issues.push("Quiz form IDs must be unique.");
  }
  const questionById = new Map(questions.map((question) => [question.id, question]));
  const criticalIds = questions
    .filter((question) => question.critical)
    .map((question) => question.id);
  const bankIds = new Set(questions.map((question) => question.id));
  const union = new Set<string>();

  questions.forEach((question) => {
    if (!question.moduleSlug || !moduleSlugs.includes(question.moduleSlug)) {
      issues.push(`Question ${question.id} must name a manifest moduleSlug.`);
    }
  });
  forms.forEach((form, formIndex) => {
    const path = `forms[${formIndex}]`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.id)) {
      issues.push(`${path}.id must be lowercase kebab-case.`);
    }
    if (form.questionIds.length !== drawCount) {
      issues.push(`${path} must contain exactly ${drawCount} question IDs.`);
    }
    if (new Set(form.questionIds).size !== form.questionIds.length) {
      issues.push(`${path} repeats a question ID.`);
    }
    const selectedModules = new Set<string>();
    for (const questionId of form.questionIds) {
      union.add(questionId);
      const question = questionById.get(questionId);
      if (!question) issues.push(`${path} references unknown question ${questionId}.`);
      else if (question.moduleSlug) selectedModules.add(question.moduleSlug);
    }
    for (const criticalId of criticalIds) {
      if (!form.questionIds.includes(criticalId)) {
        issues.push(`${path} omits critical question ${criticalId}.`);
      }
    }
    for (const moduleSlug of moduleSlugs) {
      if (!selectedModules.has(moduleSlug)) {
        issues.push(`${path} omits module ${moduleSlug}.`);
      }
    }
  });
  if (union.size !== bankIds.size
    || [...bankIds].some((questionId) => !union.has(questionId))) {
    issues.push("The three-form union must cover the entire question bank.");
  }
  return issues;
}

/** Select one explicit form deterministically, preserving its audited order. */
export function selectCourseKitQuizForm(
  forms: CourseKitThreeQuizForms<string>,
  seed: string,
  preferredFormId?: string,
) {
  return forms.find((form) => form.id === preferredFormId)
    ?? forms[stableHash(seed) % forms.length];
}

export function selectCourseKitQuizFormQuestions<Question extends { readonly id: string }>(
  questions: readonly Question[],
  forms: CourseKitThreeQuizForms<string>,
  seed: string,
  preferredFormId?: string,
): readonly Question[] {
  const form = selectCourseKitQuizForm(forms, seed, preferredFormId);
  const questionById = new Map(questions.map((question) => [question.id, question]));
  return form.questionIds.map((questionId) => {
    const question = questionById.get(questionId);
    if (!question) throw new Error(`Quiz form ${form.id} references unknown question ${questionId}.`);
    return question;
  });
}

/**
 * Produce a deterministic fixed-size draw. All declared critical questions are
 * included first; the remaining bank is selected by a stable course/version seed.
 */
export function drawCourseKitQuizQuestions<
  Question extends Pick<CourseKitMaterialisedQuizQuestion, "id" | "critical">,
>(
  questions: readonly Question[],
  drawCount: 12 | 16,
  seed: string,
): readonly Question[] {
  const critical = questions.filter((question) => question.critical);
  if (critical.length >= drawCount) {
    throw new Error("Critical question count must be lower than the quiz draw count.");
  }
  if (questions.length < drawCount) {
    throw new Error(`Quiz bank has ${questions.length} questions; ${drawCount} are required.`);
  }

  const selectedIds = new Set(critical.map((question) => question.id));
  const remainder = questions
    .filter((question) => !selectedIds.has(question.id))
    .map((question, index) => ({
      question,
      index,
      rank: stableHash(`${seed}:${question.id}`),
    }))
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .slice(0, drawCount - critical.length)
    .map(({ question }) => question);

  return [...critical, ...remainder]
    .map((question, index) => ({
      question,
      index,
      rank: stableHash(`${seed}:order:${question.id}`),
    }))
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map(({ question }) => question);
}

export function gradeCourseKitQuiz(
  questions: readonly Pick<
    CourseKitMaterialisedQuizQuestion,
    "id" | "correctIndex" | "critical"
  >[],
  answers: Readonly<Record<string, CourseKitOptionIndex | undefined>>,
  passCount: 10 | 13,
): CourseKitQuizGrade {
  let score = 0;
  let criticalCorrect = 0;
  let criticalTotal = 0;

  for (const question of questions) {
    const correct = answers[question.id] === question.correctIndex;
    if (correct) score += 1;
    if (question.critical) {
      criticalTotal += 1;
      if (correct) criticalCorrect += 1;
    }
  }

  const allCriticalCorrect = criticalCorrect === criticalTotal;
  return {
    score,
    total: questions.length,
    passCount,
    criticalCorrect,
    criticalTotal,
    allCriticalCorrect,
    passed: score >= passCount && allCriticalCorrect,
  };
}
