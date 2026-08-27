import {
  AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT,
  getAgenticTeachingCheckpointContract,
} from "../contracts";
import {
  AGENTIC_TEACHING_MODULE_SLUGS,
  type AgenticTeachingCheckpointCopy,
  type AgenticTeachingContentLocale,
  type AgenticTeachingCourseCopy,
  type AgenticTeachingModuleCopy,
  type AgenticTeachingOptionCopy,
  type AgenticTeachingQuizQuestion,
} from "../types";

type RawOptions = readonly [string, string, string, string];

type RawCheckpointCopy = Omit<AgenticTeachingCheckpointCopy, "options"> & {
  readonly options: RawOptions;
  /** Editorial migration assertion only; it is removed before copy reaches the UI. */
  readonly correctIndex: 0 | 1 | 2 | 3;
};

type RawModuleCopy = Omit<AgenticTeachingModuleCopy, "checkpoint"> & {
  readonly checkpoint: RawCheckpointCopy;
};

type RawQuizQuestion = Omit<AgenticTeachingQuizQuestion, "options"> & {
  readonly options: RawOptions;
  /** Editorial migration assertion only; runtime grading never consumes it. */
  readonly correctIndex: 0 | 1 | 2 | 3;
};

type RawCourseCopy = Omit<AgenticTeachingCourseCopy, "modules" | "quiz"> & {
  readonly modules: Readonly<
    Record<(typeof AGENTIC_TEACHING_MODULE_SLUGS)[number], RawModuleCopy>
  >;
  readonly quiz: Omit<AgenticTeachingCourseCopy["quiz"], "questions"> & {
    readonly questions: readonly [RawQuizQuestion, ...RawQuizQuestion[]];
  };
};

function bindOptions(
  labels: RawOptions,
  optionIds: readonly [string, string, string, string],
): readonly [
  AgenticTeachingOptionCopy,
  AgenticTeachingOptionCopy,
  AgenticTeachingOptionCopy,
  AgenticTeachingOptionCopy,
] {
  if (new Set(optionIds).size !== optionIds.length) {
    throw new Error("Course 18 option IDs must be unique within each question");
  }
  return [
    { id: optionIds[0], label: labels[0] },
    { id: optionIds[1], label: labels[1] },
    { id: optionIds[2], label: labels[2] },
    { id: optionIds[3], label: labels[3] },
  ];
}

function assertEditorialAnswer(
  context: string,
  correctIndex: number,
  optionIds: readonly string[],
  correctOptionId: string,
): void {
  if (optionIds[correctIndex] !== correctOptionId) {
    throw new Error(
      `${context}: editorial answer does not match canonical semantic option ${correctOptionId}`,
    );
  }
}

/**
 * Migrates reviewed source copy from positional editorial assertions to
 * `{id, label}` options. Positional answers are deliberately discarded here:
 * the browser, receipts and validators consume semantic IDs only.
 */
export function bindAgenticTeachingCourseOptions(
  raw: RawCourseCopy,
  contentLocale: AgenticTeachingContentLocale,
): AgenticTeachingCourseCopy {
  const modules = Object.fromEntries(
    AGENTIC_TEACHING_MODULE_SLUGS.map((slug) => {
      const courseModule = raw.modules[slug];
      const checkpoint = courseModule.checkpoint;
      const contract = getAgenticTeachingCheckpointContract(slug, contentLocale);
      assertEditorialAnswer(
        `${contentLocale}/${slug}/checkpoint`,
        checkpoint.correctIndex,
        contract.optionIds,
        contract.correctOptionId,
      );
      return [
        slug,
        {
          ...courseModule,
          checkpoint: {
            question: checkpoint.question,
            options: bindOptions(checkpoint.options, contract.optionIds),
            explanation: checkpoint.explanation,
          },
        },
      ];
    }),
  ) as AgenticTeachingCourseCopy["modules"];

  const questions = raw.quiz.questions.map((question, index) => {
    const contract = AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT.questions[index];
    if (!contract || contract.id !== question.id) {
      throw new Error(
        `${contentLocale}/${question.id}: quiz ID and order must match the canonical contract`,
      );
    }
    assertEditorialAnswer(
      `${contentLocale}/${question.id}`,
      question.correctIndex,
      contract.optionIds,
      contract.correctOptionId,
    );
    return {
      id: question.id,
      prompt: question.prompt,
      options: bindOptions(question.options, contract.optionIds),
      explanation: question.explanation,
      sourceIds: question.sourceIds,
      ...(question.critical === undefined
        ? {}
        : { critical: question.critical }),
    } satisfies AgenticTeachingQuizQuestion;
  }) as unknown as AgenticTeachingCourseCopy["quiz"]["questions"];

  return {
    ...raw,
    modules,
    quiz: {
      ...raw.quiz,
      questions,
    },
  };
}
