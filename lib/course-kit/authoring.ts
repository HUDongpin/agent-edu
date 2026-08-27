import {
  COURSE_KIT_CAPSTONE_SCHEMA_VERSION,
  COURSE_KIT_COPY_SCHEMA_VERSION,
  COURSE_KIT_FALLBACK_LOCALE,
  COURSE_KIT_MANIFEST_SCHEMA_VERSION,
  COURSE_KIT_QUIZ_SCHEMA_VERSION,
  COURSE_KIT_CONTENT_LOCALES,
  COURSE_KIT_SCHEMA_VERSION,
  COURSE_KIT_SOURCE_SCHEMA_VERSION,
  type CourseKitCapstone,
  type CourseKitCourseCopy,
  type CourseKitCourseNumber,
  type CourseKitCriticalCategory,
  type CourseKitDefinition,
  type CourseKitEvidenceMode,
  type CourseKitFourOptions,
  type CourseKitNonEmpty,
  type CourseKitOptionIndex,
  type CourseKitPracticeCopy,
  type CourseKitQuiz,
  type CourseKitResponsibleAiGate,
  type CourseKitSourceRecord,
  type CourseKitTenModules,
  type CourseKitTwelveModules,
  type CourseKitUiCopy,
} from "./types";
import {
  COURSE_KIT_SOURCE_DEFAULT_TRANSFORMATION_EN,
  COURSE_KIT_SOURCE_LICENCE_RIGHTS_EN,
  COURSE_KIT_SOURCE_LINK_ONLY_RIGHTS_EN,
} from "./source-presentation";
import { COURSE_KIT_UI_EN, COURSE_KIT_UI_ZH_HANS } from "./ui-copy";
import { assertValidCourseKitDefinition } from "./validate";

export interface CourseKitBilingual<T> {
  readonly en: T;
  readonly zhHans: T;
}

export interface CourseKitPhaseAuthoringSeed<PhaseId extends string = string> {
  readonly id: PhaseId;
  readonly copy: CourseKitBilingual<{
    readonly title: string;
    readonly summary: string;
  }>;
}

export interface CourseKitSectionAuthoringSeed<SourceId extends string = string> {
  readonly heading: string;
  readonly paragraphs: CourseKitNonEmpty<string>;
  readonly bullets?: CourseKitNonEmpty<string>;
  /** Defaults to the parent module's sourceIds. */
  readonly sourceIds?: CourseKitNonEmpty<SourceId>;
  readonly evidenceMode?: CourseKitEvidenceMode;
}

export interface CourseKitModuleCopyAuthoringSeed<
  SourceId extends string = string,
> {
  readonly kicker?: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  /** Defaults to practice.deliverable. */
  readonly artifact?: string;
  readonly sections: CourseKitNonEmpty<
    CourseKitSectionAuthoringSeed<SourceId>
  >;
  readonly practice: CourseKitPracticeCopy;
  readonly checkpoint: {
    readonly question: string;
    readonly options: CourseKitFourOptions;
    readonly correctIndex: CourseKitOptionIndex;
    readonly explanation: string;
  };
  /** Defaults to objective. Prefer an explicit operating boundary when relevant. */
  readonly takeaway?: string;
}

export interface CourseKitModuleAuthoringSeed<
  ModuleSlug extends string = string,
  PhaseId extends string = string,
  SourceId extends string = string,
> {
  readonly slug: ModuleSlug;
  readonly phaseId: PhaseId;
  readonly minutes: number;
  readonly sourceIds: CourseKitNonEmpty<SourceId>;
  readonly copy: CourseKitBilingual<
    CourseKitModuleCopyAuthoringSeed<SourceId>
  >;
}

export type CourseKitSourceAuthoringRecord<SourceId extends string = string> =
  Omit<
    CourseKitSourceRecord<SourceId>,
    "schemaVersion" | "conceptDomain" | "transformation" | "rightsBoundary"
  > & {
    readonly schemaVersion?: typeof COURSE_KIT_SOURCE_SCHEMA_VERSION;
    readonly conceptDomain?: string;
    readonly transformation?: string;
    readonly rightsBoundary?: string;
  };

export interface CourseKitSourceAuthoringSeed<SourceId extends string = string> {
  /** `supports` and `boundary` are the authored English annotations. */
  readonly record: CourseKitSourceAuthoringRecord<SourceId>;
  readonly zhHans: {
    readonly supports: string;
    readonly boundary: string;
  };
}

export interface CourseKitQuizQuestionCopyAuthoringSeed {
  readonly prompt: string;
  readonly options: CourseKitFourOptions;
  readonly explanation: string;
}

export interface CourseKitQuizQuestionAuthoringSeed<
  QuestionId extends string = string,
  SourceId extends string = string,
> {
  readonly id: QuestionId;
  readonly correctIndex: CourseKitOptionIndex;
  readonly sourceIds: CourseKitNonEmpty<SourceId>;
  readonly critical?: boolean;
  readonly criticalCategory?: CourseKitCriticalCategory;
  readonly copy: CourseKitBilingual<CourseKitQuizQuestionCopyAuthoringSeed>;
}

export interface CourseKitCapstoneArtifactAuthoringSeed<
  ArtifactId extends string = string,
  SourceId extends string = string,
> {
  readonly id: ArtifactId;
  readonly sourceIds: CourseKitNonEmpty<SourceId>;
  readonly copy: CourseKitBilingual<{
    readonly title: string;
    readonly description: string;
  }>;
}

export interface CourseKitLocaleAuthoringSeed {
  readonly meta: {
    readonly title: string;
    readonly kicker: string;
    readonly summary: string;
    readonly audience: string;
    readonly prerequisite: string;
    readonly level: string;
    readonly duration?: string;
    readonly startCta?: string;
    readonly resumeCta?: string;
    readonly fallbackNotice?: string;
    readonly evidenceNote?: string;
  };
  readonly principles: CourseKitNonEmpty<string>;
  readonly outcomes: CourseKitNonEmpty<string>;
  readonly quiz: {
    readonly title: string;
    readonly intro: string;
  };
  readonly capstone: {
    readonly title: string;
    readonly intro: string;
    readonly instructions: CourseKitNonEmpty<string>;
    readonly responsibleAiRubric?: CourseKitNonEmpty<string>;
    readonly attestation: string;
  };
  readonly ui?: Partial<CourseKitUiCopy>;
}

interface CourseKitManifestAuthoringSeed<
  CourseId extends string,
  PhaseId extends string,
> {
  readonly id: CourseId;
  readonly version: string;
  readonly displayNumber: CourseKitCourseNumber;
  readonly publishedOn: string;
  readonly phases: CourseKitNonEmpty<CourseKitPhaseAuthoringSeed<PhaseId>>;
}

interface CourseKitAuthoringSeedBase<
  SourceId extends string,
  QuestionId extends string,
  ArtifactId extends string,
> {
  readonly sources: CourseKitNonEmpty<CourseKitSourceAuthoringSeed<SourceId>>;
  readonly courseCopy: CourseKitBilingual<CourseKitLocaleAuthoringSeed>;
  readonly quiz: {
    readonly version: string;
    readonly questions: CourseKitNonEmpty<
      CourseKitQuizQuestionAuthoringSeed<QuestionId, SourceId>
    >;
  };
  readonly capstone: {
    readonly version: string;
    readonly artifacts: CourseKitNonEmpty<
      CourseKitCapstoneArtifactAuthoringSeed<ArtifactId, SourceId>
    >;
    readonly responsibleAiGate?: CourseKitResponsibleAiGate<
      QuestionId,
      ArtifactId
    >;
  };
}

export type CourseKitAuthoringSeed<
  CourseId extends string = string,
  ModuleSlug extends string = string,
  PhaseId extends string = string,
  SourceId extends string = string,
  QuestionId extends string = string,
  ArtifactId extends string = string,
> = CourseKitAuthoringSeedBase<
  SourceId,
  QuestionId,
  ArtifactId
> &
  (
    | {
        readonly manifest: CourseKitManifestAuthoringSeed<CourseId, PhaseId> & {
          readonly milestoneCount: 12;
        };
        readonly modules: CourseKitTenModules<
          CourseKitModuleAuthoringSeed<ModuleSlug, PhaseId, SourceId>
        >;
      }
    | {
        readonly manifest: CourseKitManifestAuthoringSeed<CourseId, PhaseId> & {
          readonly milestoneCount: 14;
        };
        readonly modules: CourseKitTwelveModules<
          CourseKitModuleAuthoringSeed<ModuleSlug, PhaseId, SourceId>
        >;
      }
  );

export type CourseKitGeneratedQuestionId<ModuleSlug extends string> =
  `q-${ModuleSlug}-${"core" | "evidence" | "boundary"}`;

function selectDistinctDistractors(
  values: readonly string[],
  correctIndex: number,
  count: number,
): string[] {
  const correct = values[correctIndex];
  const distractors: string[] = [];
  for (let offset = 1; offset < values.length && distractors.length < count; offset += 1) {
    const candidate = values[(correctIndex + offset) % values.length];
    if (candidate !== correct && !distractors.includes(candidate)) distractors.push(candidate);
  }
  if (distractors.length !== count) {
    throw new Error("Question-bank generation requires four distinct artifacts and takeaways.");
  }
  return distractors;
}

function placeCorrectOption(
  correct: string,
  distractors: readonly [string, string, string],
  correctIndex: CourseKitOptionIndex,
): CourseKitFourOptions {
  const options = [...distractors];
  options.splice(correctIndex, 0, correct);
  return options as unknown as CourseKitFourOptions;
}

/**
 * Generate three stable bilingual questions per module. The core question reuses
 * the checkpoint; evidence and boundary questions contrast neighbouring modules.
 */
export function buildModuleQuestionBank<
  ModuleSlug extends string,
  PhaseId extends string,
  SourceId extends string,
>(
  modules: readonly CourseKitModuleAuthoringSeed<
    ModuleSlug,
    PhaseId,
    SourceId
  >[],
  options: {
    readonly criticalQuestionIds?: readonly CourseKitGeneratedQuestionId<ModuleSlug>[];
    readonly criticalQuestionCategories?: Readonly<
      Partial<
        Record<
          CourseKitGeneratedQuestionId<ModuleSlug>,
          CourseKitCriticalCategory
        >
      >
    >;
  } = {},
): CourseKitQuizQuestionAuthoringSeed<
  CourseKitGeneratedQuestionId<ModuleSlug>,
  SourceId
>[] {
  if (modules.length < 4) {
    throw new Error("Question-bank generation needs at least four modules.");
  }
  const criticalIds = new Set<string>(options.criticalQuestionIds ?? []);
  const criticalCategories = (options.criticalQuestionCategories ?? {}) as Readonly<
    Partial<
      Record<CourseKitGeneratedQuestionId<ModuleSlug>, CourseKitCriticalCategory>
    >
  >;
  for (const questionId of Object.keys(criticalCategories)) {
    criticalIds.add(questionId);
  }
  const enArtifacts = modules.map(
    (module) => module.copy.en.artifact ?? module.copy.en.practice.deliverable,
  );
  const zhArtifacts = modules.map(
    (module) => module.copy.zhHans.artifact ?? module.copy.zhHans.practice.deliverable,
  );
  const enTakeaways = modules.map(
    (module) => module.copy.en.takeaway ?? module.copy.en.objective,
  );
  const zhTakeaways = modules.map(
    (module) => module.copy.zhHans.takeaway ?? module.copy.zhHans.objective,
  );
  const bank: CourseKitQuizQuestionAuthoringSeed<
    CourseKitGeneratedQuestionId<ModuleSlug>,
    SourceId
  >[] = [];

  modules.forEach((module, moduleIndex) => {
    const coreId = `q-${module.slug}-core` as CourseKitGeneratedQuestionId<ModuleSlug>;
    const evidenceId = `q-${module.slug}-evidence` as CourseKitGeneratedQuestionId<ModuleSlug>;
    const boundaryId = `q-${module.slug}-boundary` as CourseKitGeneratedQuestionId<ModuleSlug>;
    const evidenceCorrectIndex = (moduleIndex % 4) as CourseKitOptionIndex;
    const boundaryCorrectIndex = ((moduleIndex + 1) % 4) as CourseKitOptionIndex;
    const enArtifact = enArtifacts[moduleIndex];
    const zhArtifact = zhArtifacts[moduleIndex];
    const enTakeaway = enTakeaways[moduleIndex];
    const zhTakeaway = zhTakeaways[moduleIndex];

    bank.push({
      id: coreId,
      correctIndex: module.copy.en.checkpoint.correctIndex,
      sourceIds: module.sourceIds,
      critical: criticalIds.has(coreId),
      criticalCategory: criticalCategories[coreId],
      copy: {
        en: {
          prompt: module.copy.en.checkpoint.question,
          options: module.copy.en.checkpoint.options,
          explanation: module.copy.en.checkpoint.explanation,
        },
        zhHans: {
          prompt: module.copy.zhHans.checkpoint.question,
          options: module.copy.zhHans.checkpoint.options,
          explanation: module.copy.zhHans.checkpoint.explanation,
        },
      },
    });

    bank.push({
      id: evidenceId,
      correctIndex: evidenceCorrectIndex,
      sourceIds: module.sourceIds,
      critical: criticalIds.has(evidenceId),
      criticalCategory: criticalCategories[evidenceId],
      copy: {
        en: {
          prompt: `Which artifact gives the most auditable evidence for the objective in “${module.copy.en.title}”?`,
          options: placeCorrectOption(
            enArtifact,
            selectDistinctDistractors(enArtifacts, moduleIndex, 3) as [string, string, string],
            evidenceCorrectIndex,
          ),
          explanation: `The module's stated auditable artifact is: ${enArtifact}`,
        },
        zhHans: {
          prompt: `哪一项产物最能为“${module.copy.zhHans.title}”的学习目标提供可审查证据？`,
          options: placeCorrectOption(
            zhArtifact,
            selectDistinctDistractors(zhArtifacts, moduleIndex, 3) as [string, string, string],
            evidenceCorrectIndex,
          ),
          explanation: `本模块明确要求的可审查产物是：${zhArtifact}`,
        },
      },
    });

    bank.push({
      id: boundaryId,
      correctIndex: boundaryCorrectIndex,
      sourceIds: module.sourceIds,
      critical: criticalIds.has(boundaryId),
      criticalCategory: criticalCategories[boundaryId],
      copy: {
        en: {
          prompt: `Which statement best captures the takeaway or operating boundary in “${module.copy.en.title}”?`,
          options: placeCorrectOption(
            enTakeaway,
            selectDistinctDistractors(enTakeaways, moduleIndex, 3) as [string, string, string],
            boundaryCorrectIndex,
          ),
          explanation: `The module's stated takeaway is: ${enTakeaway}`,
        },
        zhHans: {
          prompt: `哪项陈述最准确地概括“${module.copy.zhHans.title}”的核心要点或操作边界？`,
          options: placeCorrectOption(
            zhTakeaway,
            selectDistinctDistractors(zhTakeaways, moduleIndex, 3) as [string, string, string],
            boundaryCorrectIndex,
          ),
          explanation: `本模块明确给出的核心要点是：${zhTakeaway}`,
        },
      },
    });
  });

  const generatedIds = new Set<string>(bank.map((question) => question.id));
  const unknownCriticalId = [...criticalIds].find((id) => !generatedIds.has(id));
  if (unknownCriticalId) {
    throw new Error(`Unknown critical question ID: ${unknownCriticalId}.`);
  }
  return bank;
}

function buildLocaleCopy<
  ModuleSlug extends string,
  PhaseId extends string,
  SourceId extends string,
  QuestionId extends string,
  ArtifactId extends string,
>(
  seed: CourseKitAuthoringSeed<
    string,
    ModuleSlug,
    PhaseId,
    SourceId,
    QuestionId,
    ArtifactId
  >,
  locale: "en" | "zhHans",
  totalMinutes: number,
): CourseKitCourseCopy<
  ModuleSlug,
  PhaseId,
  SourceId,
  QuestionId,
  ArtifactId
> {
  const localeSeed = seed.courseCopy[locale];
  const ui = locale === "en" ? COURSE_KIT_UI_EN : COURSE_KIT_UI_ZH_HANS;
  const phaseCopy = Object.fromEntries(
    seed.manifest.phases.map((phase) => [phase.id, phase.copy[locale]]),
  );
  const phaseTitles = new Map(
    seed.manifest.phases.map((phase) => [phase.id, phase.copy[locale].title]),
  );
  const modules = Object.fromEntries(
    seed.modules.map((module) => {
      const moduleCopy = module.copy[locale];
      return [
        module.slug,
        {
          kicker: moduleCopy.kicker ?? phaseTitles.get(module.phaseId) ?? module.phaseId,
          title: moduleCopy.title,
          summary: moduleCopy.summary,
          objective: moduleCopy.objective,
          artifact: moduleCopy.artifact ?? moduleCopy.practice.deliverable,
          sections: moduleCopy.sections.map((section) => ({
            ...section,
            sourceIds: section.sourceIds ?? module.sourceIds,
            evidenceMode: section.evidenceMode ?? "source-grounded",
          })),
          practice: moduleCopy.practice,
          checkpoint: moduleCopy.checkpoint,
          takeaway: moduleCopy.takeaway ?? moduleCopy.objective,
        },
      ];
    }),
  );
  const sourceAnnotations = Object.fromEntries(
    seed.sources.map((source) => [
      source.record.id,
      locale === "en"
        ? { supports: source.record.supports, boundary: source.record.boundary }
        : source.zhHans,
    ]),
  );
  const questions = Object.fromEntries(
    seed.quiz.questions.map((question) => [question.id, question.copy[locale]]),
  );
  const artifacts = Object.fromEntries(
    seed.capstone.artifacts.map((artifact) => [artifact.id, artifact.copy[locale]]),
  );
  const english = locale === "en";

  return {
    schemaVersion: COURSE_KIT_COPY_SCHEMA_VERSION,
    locale: english ? "en" : "zh-Hans",
    version: seed.manifest.version,
    meta: {
      title: localeSeed.meta.title,
      kicker: localeSeed.meta.kicker,
      summary: localeSeed.meta.summary,
      audience: localeSeed.meta.audience,
      prerequisite: localeSeed.meta.prerequisite,
      level: localeSeed.meta.level,
      duration:
        localeSeed.meta.duration ??
        (english ? `${totalMinutes} minutes` : `${totalMinutes} 分钟`),
      startCta: localeSeed.meta.startCta ?? ui.startCourse,
      resumeCta: localeSeed.meta.resumeCta ?? ui.resumeCourse,
      fallbackNotice:
        localeSeed.meta.fallbackNotice ??
        (english
          ? "This course is not available in your selected content language. The English edition is shown left to right."
          : "本课程提供完整的简体中文正文。"),
      evidenceNote: localeSeed.meta.evidenceNote ?? ui.evidenceNote,
    },
    ui: { ...ui, ...localeSeed.ui },
    principles: localeSeed.principles,
    outcomes: localeSeed.outcomes,
    phases: phaseCopy,
    modules,
    sourceAnnotations,
    quiz: {
      title: localeSeed.quiz.title,
      intro: localeSeed.quiz.intro,
      questions,
    },
    capstone: {
      title: localeSeed.capstone.title,
      intro: localeSeed.capstone.intro,
      instructions: localeSeed.capstone.instructions,
      responsibleAiRubric: localeSeed.capstone.responsibleAiRubric ?? [],
      artifacts,
      attestation: localeSeed.capstone.attestation,
    },
  } as unknown as CourseKitCourseCopy<
    ModuleSlug,
    PhaseId,
    SourceId,
    QuestionId,
    ArtifactId
  >;
}

export function buildCourseKitDefinition<
  const CourseId extends string,
  const ModuleSlug extends string,
  const PhaseId extends string,
  const SourceId extends string,
  const QuestionId extends string,
  const ArtifactId extends string,
>(
  seed: CourseKitAuthoringSeed<
    CourseId,
    ModuleSlug,
    PhaseId,
    SourceId,
    QuestionId,
    ArtifactId
  >,
): CourseKitDefinition<
  CourseId,
  ModuleSlug,
  PhaseId,
  SourceId,
  QuestionId,
  ArtifactId
> {
  const totalMinutes = seed.modules.reduce(
    (sum, module) => sum + module.minutes,
    0,
  );
  const manifestModules = seed.modules.map((module, index) => ({
    slug: module.slug,
    order: index + 1,
    phaseId: module.phaseId,
    minutes: module.minutes,
    sourceIds: module.sourceIds,
  }));
  const manifestPhases = seed.manifest.phases.map((phase, index) => ({
    id: phase.id,
    order: index + 1,
    moduleSlugs: seed.modules
      .filter((module) => module.phaseId === phase.id)
      .map((module) => module.slug),
  }));
  const sources = seed.sources.map((source) => {
    const conceptModules = seed.modules
      .filter((module) => module.sourceIds.includes(source.record.id))
      .map((module) => module.slug);
    const linkOnly = source.record.reuseStatus === "link-and-paraphrase-only";
    return {
      ...source.record,
      schemaVersion: COURSE_KIT_SOURCE_SCHEMA_VERSION,
      conceptDomain:
        source.record.conceptDomain
        ?? `${seed.manifest.id}: ${conceptModules.join(", ")}`,
      transformation:
        source.record.transformation
        ?? COURSE_KIT_SOURCE_DEFAULT_TRANSFORMATION_EN,
      rightsBoundary:
        source.record.rightsBoundary
        ?? (linkOnly
          ? COURSE_KIT_SOURCE_LINK_ONLY_RIGHTS_EN
          : COURSE_KIT_SOURCE_LICENCE_RIGHTS_EN),
    };
  });
  const earlyCourse = seed.manifest.displayNumber <= 18;
  const quiz: CourseKitQuiz<QuestionId, SourceId> = {
    schemaVersion: COURSE_KIT_QUIZ_SCHEMA_VERSION,
    version: seed.quiz.version,
    drawCount: earlyCourse ? 12 : 16,
    passCount: earlyCourse ? 10 : 13,
    questions: seed.quiz.questions.map((question) => ({
      id: question.id,
      correctIndex: question.correctIndex,
      sourceIds: question.sourceIds,
      critical: question.critical === true,
      criticalCategory: question.criticalCategory,
    })) as unknown as CourseKitQuiz<QuestionId, SourceId>["questions"],
  };
  const capstone: CourseKitCapstone<ArtifactId, SourceId, QuestionId> = {
    schemaVersion: COURSE_KIT_CAPSTONE_SCHEMA_VERSION,
    version: seed.capstone.version,
    artifacts: seed.capstone.artifacts.map((artifact) => ({
      id: artifact.id,
      sourceIds: artifact.sourceIds,
      required: true as const,
    })) as unknown as CourseKitCapstone<ArtifactId, SourceId>["artifacts"],
    responsibleAiGate: seed.capstone.responsibleAiGate,
    evidenceContract: {
      schemaId: `aicourse.${seed.manifest.id}.capstone.v1`,
      schemaPath: `/courses/${seed.manifest.id}/lab/capstone.schema.json`,
      validatorId: `aicourse.${seed.manifest.id}.validator.v1`,
      validatorPath: `/courses/${seed.manifest.id}/lab/validate.py`,
      validatorCommand: `python public/courses/${seed.manifest.id}/lab/validate.py --package <artifact-package.json>`,
    },
  };

  const definition = {
    schemaVersion: COURSE_KIT_SCHEMA_VERSION,
    manifest: {
      schemaVersion: COURSE_KIT_MANIFEST_SCHEMA_VERSION,
      id: seed.manifest.id,
      version: seed.manifest.version,
      displayNumber: seed.manifest.displayNumber,
      publishedOn: seed.manifest.publishedOn,
      contentLocales: COURSE_KIT_CONTENT_LOCALES,
      fallbackLocale: COURSE_KIT_FALLBACK_LOCALE,
      milestoneCount: seed.manifest.milestoneCount,
      phases: manifestPhases,
      modules: manifestModules,
      sourceIds: seed.sources.map((source) => source.record.id),
    },
    sources,
    copy: {
      en: buildLocaleCopy(seed, "en", totalMinutes),
      "zh-Hans": buildLocaleCopy(seed, "zhHans", totalMinutes),
    },
    quiz,
    capstone,
  } as unknown as CourseKitDefinition<
    CourseId,
    ModuleSlug,
    PhaseId,
    SourceId,
    QuestionId,
    ArtifactId
  >;

  assertValidCourseKitDefinition(definition);
  return definition;
}
