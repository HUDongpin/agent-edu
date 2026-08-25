export const AI_TUTOR_COURSE_ID = "ai-tutor" as const;
export const AI_TUTOR_CONTENT_LOCALE = "en" as const;

export const AI_TUTOR_LOCALES = [
  "en",
  "es",
  "fr",
  "de",
  "zh-Hans",
  "zh-Hant",
  "ja",
  "ko",
  "ar",
] as const;

export const AI_TUTOR_PHASE_IDS = ["frame", "adapt", "validate", "govern"] as const;

export const AI_TUTOR_MODULE_SLUGS = [
  "objectives-concept-map",
  "diagnostic-engine",
  "adaptive-scaffolding",
  "formative-assessment-loop",
  "item-validation",
  "learner-modeling",
  "learning-impact-experiment",
  "safety-teacher-oversight",
] as const;

export const AI_TUTOR_SOURCE_IDS = [
  "constructive-alignment",
  "concept-mapping",
  "evidence-centered-design",
  "scaffolding-review",
  "apa-formative-assessment",
  "testing-standards",
  "knowledge-tracing",
  "negotiated-learner-modeling",
  "wwc-standards",
  "unesco-genai-guidance",
  "nist-ai-rmf",
] as const;

export const AI_TUTOR_RELATION_IDS = [
  "defines-evidence",
  "selects-support",
  "creates-response",
  "audits-signal",
  "strengthens-inference",
  "updates-action",
  "provides-adaptation-state",
  "supports-release",
  "revises-contract",
] as const;

export const AI_TUTOR_UI_KEYS = [
  "course",
  "modules",
  "module",
  "minutes",
  "phases",
  "allModules",
  "curriculumTitle",
  "curriculumIntro",
  "learningOutcomes",
  "learningOutcomesTitle",
  "conceptMap",
  "relation",
  "courseProgress",
  "browserStorageNote",
  "storageUnavailable",
  "resetProgress",
  "resetConfirm",
  "resetDone",
  "resetDoneMemory",
  "markModuleComplete",
  "markedModuleComplete",
  "moduleComplete",
  "moduleIncomplete",
  "finalAssessment",
  "finalAssessmentTitle",
  "finalAssessmentIntro",
  "startAssessment",
  "checkAnswer",
  "correct",
  "incorrect",
  "nextQuestion",
  "finishAssessment",
  "assessmentPassed",
  "assessmentNotPassed",
  "retryAssessment",
  "criticalBoundary",
  "capstone",
  "capstoneArtifacts",
  "capstoneReview",
  "capstoneInstructions",
  "markCapstoneComplete",
  "capstoneComplete",
  "systemContract",
  "systemContractTitle",
  "signal",
  "inference",
  "action",
  "outcomeEvidence",
  "stopRule",
  "objective",
  "objectiveTitle",
  "workshop",
  "steps",
  "deliverables",
  "reviewGate",
  "safetyBoundary",
  "checkpoint",
  "takeaway",
  "sources",
  "source",
  "supports",
  "limitation",
  "research",
  "standard",
  "officialGuidance",
  "teachingGuidance",
  "previous",
  "next",
  "backToCourse",
  "openCourseMap",
  "phase",
  "evidenceBoundary",
  "courseIntegrity",
  "courseIntegrityTitle",
  "modulePosition",
  "moduleMapPosition",
  "phasePosition",
  "estimatedModuleTime",
  "progressPosition",
  "questionPosition",
  "scorePosition",
  "bestScorePosition",
  "artifactWithValue",
  "minutesWithValue",
  "accessedOn",
] as const;

export type AiTutorLocale = (typeof AI_TUTOR_LOCALES)[number];
export type AiTutorPhaseId = (typeof AI_TUTOR_PHASE_IDS)[number];
export type AiTutorModuleSlug = (typeof AI_TUTOR_MODULE_SLUGS)[number];
export type AiTutorSourceId = (typeof AI_TUTOR_SOURCE_IDS)[number];
export type AiTutorRelationId = (typeof AI_TUTOR_RELATION_IDS)[number];
export type AiTutorUiKey = (typeof AI_TUTOR_UI_KEYS)[number];

export interface AiTutorPhaseManifest {
  readonly id: AiTutorPhaseId;
  readonly order: number;
  readonly moduleSlugs: readonly [AiTutorModuleSlug, AiTutorModuleSlug];
}

export interface AiTutorModuleManifest {
  readonly slug: AiTutorModuleSlug;
  readonly order: number;
  readonly phaseId: AiTutorPhaseId;
  readonly minutes: number;
  readonly sourceIds: readonly [AiTutorSourceId, ...AiTutorSourceId[]];
}

export interface AiTutorConceptEdge {
  readonly from: AiTutorModuleSlug;
  readonly to: AiTutorModuleSlug;
  readonly relationId: AiTutorRelationId;
}

export interface AiTutorCourseManifest {
  readonly id: typeof AI_TUTOR_COURSE_ID;
  readonly version: string;
  readonly displayNumber: 13;
  readonly publishedOn: string;
  readonly contentLocale: typeof AI_TUTOR_CONTENT_LOCALE;
  readonly phases: readonly AiTutorPhaseManifest[];
  readonly modules: readonly AiTutorModuleManifest[];
  readonly conceptEdges: readonly AiTutorConceptEdge[];
}

export interface AiTutorSectionCopy {
  readonly heading: string;
  readonly paragraphs: readonly [string, ...string[]];
  readonly bullets?: readonly [string, ...string[]];
  readonly sourceIds: readonly [AiTutorSourceId, ...AiTutorSourceId[]];
}

export interface AiTutorSystemContractCopy {
  readonly signal: string;
  readonly inference: string;
  readonly action: string;
  readonly outcomeEvidence: string;
  readonly stopRule: string;
}

export interface AiTutorWorkshopCopy {
  readonly title: string;
  readonly brief: string;
  readonly steps: readonly [string, ...string[]];
  readonly deliverables: readonly [string, ...string[]];
  readonly reviewGate: string;
  readonly safetyBoundary: string;
}

export interface AiTutorCheckpointCopy {
  readonly question: string;
  readonly options: readonly [string, string, string, string];
  readonly correctIndex: 0 | 1 | 2 | 3;
  readonly explanation: string;
  readonly critical?: boolean;
}

export interface AiTutorModuleCopy {
  readonly kicker: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly artifact: string;
  readonly sections: readonly [AiTutorSectionCopy, AiTutorSectionCopy, AiTutorSectionCopy];
  readonly systemContract: AiTutorSystemContractCopy;
  readonly workshop: AiTutorWorkshopCopy;
  readonly checkpoint: AiTutorCheckpointCopy;
  readonly takeaway: string;
}

export interface AiTutorCourseCopy {
  readonly meta: {
    readonly title: string;
    readonly kicker: string;
    readonly summary: string;
    readonly audience: string;
    readonly prerequisite: string;
    readonly level: string;
    readonly duration: string;
    readonly startCta: string;
    readonly resumeCta: string;
    readonly englishOnly: string;
    readonly evidenceNote: string;
  };
  readonly ui: Readonly<Record<AiTutorUiKey, string>>;
  readonly principles: readonly [string, string, string];
  readonly outcomes: readonly [string, string, string, string, string, string, string, string];
  readonly phases: Readonly<Record<AiTutorPhaseId, {
    readonly title: string;
    readonly summary: string;
  }>>;
  readonly conceptMap: {
    readonly title: string;
    readonly summary: string;
    readonly center: string;
    readonly teacherBoundary: string;
    readonly relations: Readonly<Record<AiTutorRelationId, string>>;
    readonly nodes: Readonly<Record<AiTutorModuleSlug, {
      readonly shortTitle: string;
      readonly role: string;
    }>>;
  };
  readonly sourceAnnotations: Readonly<Record<AiTutorSourceId, {
    readonly supports: string;
    readonly limitation: string;
  }>>;
  readonly modules: Readonly<Record<AiTutorModuleSlug, AiTutorModuleCopy>>;
  readonly capstone: {
    readonly title: string;
    readonly summary: string;
    readonly scenario: string;
    readonly artifacts: readonly [string, string, string, string, string, string, string, string];
    readonly reviewQuestions: readonly [string, ...string[]];
    readonly completionStatement: string;
  };
}

export interface AiTutorSourceRecord {
  readonly id: AiTutorSourceId;
  readonly title: string;
  readonly publisher: string;
  readonly url: `https://${string}`;
  readonly accessedOn: string;
  readonly evidenceType: "research" | "standard" | "official-guidance" | "teaching-guidance";
}

export interface MaterializedAiTutorModule extends AiTutorModuleManifest {
  readonly copy: AiTutorModuleCopy;
  readonly sources: readonly AiTutorSourceRecord[];
}

export interface MaterializedAiTutorPhase extends AiTutorPhaseManifest {
  readonly copy: AiTutorCourseCopy["phases"][AiTutorPhaseId];
  readonly modules: readonly [MaterializedAiTutorModule, MaterializedAiTutorModule];
}

export interface MaterializedAiTutorCourse {
  readonly locale: AiTutorLocale;
  readonly contentLocale: AiTutorLocale;
  readonly contentDirection: "ltr" | "rtl";
  readonly manifest: AiTutorCourseManifest;
  readonly copy: AiTutorCourseCopy;
  readonly phases: readonly MaterializedAiTutorPhase[];
  readonly modules: readonly MaterializedAiTutorModule[];
}
