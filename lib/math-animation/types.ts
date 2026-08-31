export const MATH_ANIMATION_COURSE_ID = "math-animation" as const;
export const MATH_ANIMATION_VERSION = "1.0.0" as const;

export const MATH_ANIMATION_LOCALES = [
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

export const MATH_ANIMATION_PHASE_IDS = [
  "frame",
  "animate",
  "direct",
  "prove",
] as const;

export const MATH_ANIMATION_MODULE_SLUGS = [
  "outcome-before-engine",
  "repository-evidence-lab",
  "scene-contract-storyboard",
  "manim-environment-first-scene",
  "transformations-camera-continuity",
  "equations-graphs-geometry",
  "codex-implementation-loop",
  "claude-direction-review",
  "motion-canvas-web-track",
  "voice-slides-remotion",
  "mathematical-visual-accessibility-qa",
  "capstone-release-pack",
] as const;

export const MATH_ANIMATION_SOURCE_IDS = [
  "github-manim-ce",
  "docs-manim-quickstart",
  "github-manimgl",
  "github-3b1b-videos-claude",
  "github-manim-slides",
  "github-manim-voiceover",
  "github-motion-canvas",
  "docs-motion-canvas-quickstart",
  "github-remotion",
  "github-remotion-skills",
  "github-mafs",
  "github-jsxgraph",
  "openai-codex-use-cases",
  "openai-model-guidance",
  "anthropic-claude-code-overview",
  "anthropic-claude-memory",
  "x-remotion-agent-skills",
  "x-minchoi-claude-manim",
  "x-cintas-claude-pythagoras",
  "x-dhruv-math-animation-thread",
  "x-tobi-manim-skill",
  "w3c-animation-interactions",
  "ffmpeg-general",
] as const;

export type MathAnimationLocale = (typeof MATH_ANIMATION_LOCALES)[number];
export type MathAnimationPhaseId = (typeof MATH_ANIMATION_PHASE_IDS)[number];
export type MathAnimationModuleSlug = (typeof MATH_ANIMATION_MODULE_SLUGS)[number];
export type MathAnimationSourceId = (typeof MATH_ANIMATION_SOURCE_IDS)[number];

export type MathAnimationSourceKind =
  | "github-repository"
  | "official-documentation"
  | "x-post"
  | "web-standard";

export type MathAnimationEvidenceRole =
  | "core-implementation"
  | "workflow"
  | "discovery-signal"
  | "quality-boundary";

export interface MathAnimationSourceRecord {
  readonly id: MathAnimationSourceId;
  readonly title: string;
  readonly publisher: string;
  readonly url: string;
  readonly kind: MathAnimationSourceKind;
  readonly role: MathAnimationEvidenceRole;
  readonly accessedOn: "2026-08-26";
  readonly versionOrRevision: string;
  readonly versionAnchorUrl?: string;
  readonly claimEvidenceUrls: readonly [string, ...string[]];
  readonly licenseOrRights: string;
  readonly licenseOrRightsZhHans: string;
  readonly licenseUrl?: string;
  readonly supports: string;
  readonly supportsZhHans: string;
  readonly boundary: string;
  readonly boundaryZhHans: string;
}

export type RepositoryVerdict = "core" | "advanced" | "extension" | "companion";
export type RepositorySmokeStatus = "rendered" | "validated" | "blocked";

export interface RepositoryScoreBreakdown {
  readonly mathSemantics: number;
  readonly deterministicTimeline: number;
  readonly agentReadable: number;
  readonly iterationPreview: number;
  readonly renderOutput: number;
  readonly maintenance: number;
  readonly licenseClarity: number;
  readonly accessibility: number;
  readonly ecosystem: number;
}

export interface MathAnimationRepositoryEvaluation {
  readonly sourceId:
    | "github-manim-ce"
    | "github-manimgl"
    | "github-manim-slides"
    | "github-manim-voiceover"
    | "github-motion-canvas"
    | "github-remotion"
    | "github-remotion-skills"
    | "github-mafs"
    | "github-jsxgraph";
  readonly verdict: RepositoryVerdict;
  readonly score: number;
  readonly breakdown: RepositoryScoreBreakdown;
  readonly bestFor: string;
  readonly bestForZhHans: string;
  readonly primaryLimit: string;
  readonly primaryLimitZhHans: string;
  readonly testedRevision: string;
  readonly smokeStatus: RepositorySmokeStatus;
  readonly smokeEvidence: string;
  readonly smokeEvidenceZhHans: string;
  readonly adoptionSnapshot: {
    readonly stars: number;
    readonly defaultBranchHeadDate: string;
    readonly latestRelease: string | null;
    readonly latestReleasePublishedOn: string | null;
    readonly capturedOn: "2026-08-26";
  };
}

export interface MathAnimationPhaseManifest {
  readonly id: MathAnimationPhaseId;
  readonly order: number;
  readonly moduleSlugs: readonly [
    MathAnimationModuleSlug,
    MathAnimationModuleSlug,
    MathAnimationModuleSlug,
  ];
}

export interface MathAnimationModuleManifest {
  readonly slug: MathAnimationModuleSlug;
  readonly order: number;
  readonly phaseId: MathAnimationPhaseId;
  readonly minutes: number;
  readonly sourceIds: readonly [MathAnimationSourceId, ...MathAnimationSourceId[]];
  readonly codeExampleId?: MathAnimationCodeExampleId;
}

export interface MathAnimationCourseManifest {
  readonly id: typeof MATH_ANIMATION_COURSE_ID;
  readonly version: string;
  readonly displayNumber: 19;
  readonly publishedOn: "2026-08-26";
  readonly modules: readonly MathAnimationModuleManifest[];
  readonly phases: readonly MathAnimationPhaseManifest[];
}

export const MATH_ANIMATION_CODE_EXAMPLE_IDS = [
  "scene-contract",
  "manim-first-scene",
  "manim-transform",
  "manim-graph",
  "agent-instructions",
  "motion-canvas-scene",
  "ffmpeg-export",
  "qa-script",
] as const;

export type MathAnimationCodeExampleId =
  (typeof MATH_ANIMATION_CODE_EXAMPLE_IDS)[number];

export interface MathAnimationCodeExample {
  readonly id: MathAnimationCodeExampleId;
  readonly language: "markdown" | "python" | "typescript" | "shell";
  readonly filename: string;
  readonly code: string;
}

export interface MathAnimationSectionCopy {
  readonly heading: string;
  readonly evidenceMode: "source-grounded" | "engineering-synthesis" | "version-watch";
  readonly sourceIds: readonly [MathAnimationSourceId, ...MathAnimationSourceId[]];
  readonly paragraphs: readonly [string, ...string[]];
  readonly bullets?: readonly [string, ...string[]];
}

export interface MathAnimationCheckpointCopy {
  readonly question: string;
  readonly options: readonly [string, string, string, string];
  readonly correctIndex: 0 | 1 | 2 | 3;
  readonly explanation: string;
}

export interface MathAnimationModuleCopy {
  readonly kicker: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly artifact: string;
  readonly sections: readonly [
    MathAnimationSectionCopy,
    MathAnimationSectionCopy,
    MathAnimationSectionCopy,
  ];
  readonly agentPrompt: string;
  readonly verificationGate: readonly [string, ...string[]];
  readonly checkpoint: MathAnimationCheckpointCopy;
}

export interface MathAnimationAssessmentQuestion {
  readonly id: string;
  readonly question: string;
  readonly options: readonly [string, string, string, string];
  readonly correctIndex: 0 | 1 | 2 | 3;
  readonly explanation: string;
}

export interface MathAnimationUiCopy {
  readonly course: string;
  readonly courseNumber: string;
  readonly modules: string;
  readonly minutes: string;
  readonly phases: string;
  readonly sources: string;
  readonly learningOutcomes: string;
  readonly curriculum: string;
  readonly evidenceBoundary: string;
  readonly repositoryLab: string;
  readonly repositoryLabIntro: string;
  readonly score: string;
  readonly verdict: string;
  readonly bestFor: string;
  readonly limit: string;
  readonly core: string;
  readonly advanced: string;
  readonly extension: string;
  readonly companion: string;
  readonly chooseGoal: string;
  readonly goalVideo: string;
  readonly goalWeb: string;
  readonly goalTalk: string;
  readonly recommendation: string;
  readonly start: string;
  readonly resume: string;
  readonly progress: string;
  readonly reset: string;
  readonly resetConfirm: string;
  readonly markComplete: string;
  readonly completeModule: string;
  readonly completed: string;
  readonly artifactEvidence: string;
  readonly artifactEvidenceHelp: string;
  readonly verificationEvidence: string;
  readonly verificationEvidenceHelp: string;
  readonly evidenceRequired: string;
  readonly saving: string;
  readonly saved: string;
  readonly storageNote: string;
  readonly storageUnavailable: string;
  readonly resetDone: string;
  readonly resetMemory: string;
  readonly objective: string;
  readonly practiceArtifact: string;
  readonly agentPrompt: string;
  readonly copyPrompt: string;
  readonly copied: string;
  readonly copyFailed: string;
  readonly codeDependency: string;
  readonly verificationGate: string;
  readonly checkpoint: string;
  readonly checkAnswer: string;
  readonly correct: string;
  readonly incorrect: string;
  readonly answerCorrect: string;
  readonly answerIncorrect: string;
  readonly correctAnswer: string;
  readonly sourceLedger: string;
  readonly sourceBoundary: string;
  readonly accessedOn: string;
  readonly previous: string;
  readonly next: string;
  readonly backToCourse: string;
  readonly allModules: string;
  readonly finalAssessment: string;
  readonly submitAssessment: string;
  readonly startAssessment: string;
  readonly retryAssessment: string;
  readonly bestScore: string;
  readonly scoreResult: string;
  readonly assessmentPassed: string;
  readonly assessmentRetry: string;
  readonly answered: string;
  readonly capstone: string;
  readonly markCapstone: string;
  readonly capstoneComplete: string;
  readonly capstoneEvidence: string;
  readonly capstoneEvidenceHelp: string;
  readonly capstoneAttestationBoundary: string;
  readonly allChecksRequired: string;
  readonly characters: string;
  readonly minimum: string;
  readonly motionLab: string;
  readonly play: string;
  readonly pause: string;
  readonly scrubber: string;
  readonly reducedMotion: string;
  readonly languageFallback: string;
}

export interface MathAnimationCourseCopy {
  readonly meta: {
    readonly kicker: string;
    readonly title: string;
    readonly summary: string;
    readonly audience: string;
    readonly prerequisite: string;
    readonly level: string;
    readonly evidenceNote: string;
  };
  readonly ui: MathAnimationUiCopy;
  readonly principles: readonly [string, string, string, string];
  readonly outcomes: readonly [string, string, string, string, string, string];
  readonly phases: Readonly<Record<MathAnimationPhaseId, {
    readonly title: string;
    readonly summary: string;
  }>>;
  readonly modules: Readonly<Record<MathAnimationModuleSlug, MathAnimationModuleCopy>>;
  readonly assessment: readonly MathAnimationAssessmentQuestion[];
  readonly capstone: {
    readonly title: string;
    readonly summary: string;
    readonly scenario: string;
    readonly artifacts: readonly [string, string, string, string, string, string];
    readonly releaseRule: string;
  };
}

export interface MaterializedMathAnimationModule extends MathAnimationModuleManifest {
  readonly copy: MathAnimationModuleCopy;
  readonly sources: readonly MathAnimationSourceRecord[];
  readonly codeExample?: MathAnimationCodeExample;
}

export interface MaterializedMathAnimationPhase extends MathAnimationPhaseManifest {
  readonly copy: MathAnimationCourseCopy["phases"][MathAnimationPhaseId];
  readonly modules: readonly [
    MaterializedMathAnimationModule,
    MaterializedMathAnimationModule,
    MaterializedMathAnimationModule,
  ];
}

export interface MaterializedMathAnimationCourse {
  readonly locale: MathAnimationLocale;
  readonly contentLocale: "en" | "zh-Hans";
  readonly contentDirection: "ltr";
  readonly manifest: MathAnimationCourseManifest;
  readonly copy: MathAnimationCourseCopy;
  readonly modules: readonly MaterializedMathAnimationModule[];
  readonly phases: readonly MaterializedMathAnimationPhase[];
  readonly repositories: readonly MathAnimationRepositoryEvaluation[];
}
