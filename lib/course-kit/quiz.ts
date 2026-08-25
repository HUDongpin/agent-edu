import type {
  CourseKitMaterialisedQuizQuestion,
  CourseKitOptionIndex,
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
