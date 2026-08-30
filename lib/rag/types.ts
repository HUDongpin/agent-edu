export const RAG_SOURCE_SNAPSHOT_ON = "2026-08-23" as const;
export const RAG_COURSE_ID = "rag" as const;

export const RAG_LOCALES = [
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

export const RAG_UNIT_IDS = ["frame", "index", "answer", "operate"] as const;

export const RAG_LESSON_SLUGS = [
  "choose-rag",
  "trace-the-pipeline",
  "corpus-contract",
  "parse-and-chunk",
  "embeddings-and-indexes",
  "retrieval-engineering",
  "rerank-and-assemble",
  "ground-and-cite",
  "advanced-patterns",
  "evaluate-rag",
  "secure-and-refresh",
  "production-capstone",
] as const;

export const RAG_FIGURE_IDS = [
  "rag-decision-map",
  "dify-rag-workflow",
  "corpus-control-plane",
  "dify-chunk-settings",
  "dify-chunk-inspector",
  "retrieval-scoreboard",
  "context-budget",
  "claude-support-rag-ui",
  "anthropic-knowledge-wiki-architecture",
  "evaluation-stack",
  "threat-boundary",
  "dify-citations-ui",
] as const;

export const RAG_CONCEPT_IDS = [
  "rag-definition",
  "selection-boundary",
  "long-context",
  "fine-tuning",
  "search-tools-sql",
  "source-authority",
  "permissions-provenance",
  "parsing-ocr-layout",
  "chunking",
  "metadata-versioning",
  "embeddings",
  "vector-index",
  "dense-retrieval",
  "sparse-retrieval",
  "hybrid-fusion",
  "query-transformation",
  "filters-acl",
  "reranking-diversity",
  "context-assembly",
  "grounding-abstention",
  "citations",
  "agentic-multihop",
  "multimodal-rag",
  "graph-rag",
  "retrieval-evaluation",
  "answer-evaluation",
  "citation-evaluation",
  "observability",
  "prompt-injection-poisoning",
  "privacy-tenancy",
  "freshness-deletion",
  "cost-latency",
  "production-reliability",
  "domain-contexts",
] as const;

export const RAG_SOURCE_IDS = [
  "anthropic-academy-api",
  "anthropic-academy-vertex",
  "anthropic-contextual-retrieval",
  "anthropic-context-engineering",
  "anthropic-prompt-injection-defences",
  "anthropic-citations",
  "anthropic-projects-rag-help",
  "anthropic-quickstarts",
  "openai-academy-rag-bootcamp",
  "openai-academy-graphrag",
  "openai-retrieval-guide",
  "openai-file-search-guide",
  "openai-evaluation-guide",
  "openai-data-controls",
  "openai-knowledge-retrieval",
  "openai-multimodal-rag",
  "google-skills-boost-rag",
  "google-rag-engine-overview",
  "google-rag-reference-architecture",
  "google-parse-chunk",
  "google-hybrid-search",
  "google-ranking",
  "google-check-grounding",
  "google-model-armor",
  "lewis-rag-paper",
  "self-rag-paper",
  "microsoft-graphrag",
  "owasp-rag-security",
  "azure-search-rag-demo",
  "paperqa",
  "sourcegraph-cody-context",
  "privategpt",
  "ragflow",
  "langchain-rag-from-scratch",
  "dify-docs",
  "user-report-sourcegraph-no-context",
  "user-report-ragflow-reading-order",
  "user-report-paperqa-vendor-leak",
  "user-report-privategpt-wrong-answer",
  "user-report-azure-missing-citations",
] as const;

export type RagLocale = (typeof RAG_LOCALES)[number];
export type RagUnitId = (typeof RAG_UNIT_IDS)[number];
export type RagLessonSlug = (typeof RAG_LESSON_SLUGS)[number];
export type RagFigureId = (typeof RAG_FIGURE_IDS)[number];
export type RagConceptId = (typeof RAG_CONCEPT_IDS)[number];
export type RagSourceId = (typeof RAG_SOURCE_IDS)[number];
export type RagSourceUrl = `https://${string}`;

export interface RagUnitManifest {
  readonly id: RagUnitId;
  readonly order: number;
  readonly lessonSlugs: readonly RagLessonSlug[];
}

export interface RagLessonManifest {
  readonly slug: RagLessonSlug;
  readonly order: number;
  readonly unitId: RagUnitId;
  readonly minutes: number;
  readonly figureId: RagFigureId;
  readonly conceptIds: readonly [RagConceptId, ...RagConceptId[]];
  readonly sourceIds: readonly [RagSourceId, ...RagSourceId[]];
}

export interface RagCourseManifest {
  readonly id: typeof RAG_COURSE_ID;
  readonly version: string;
  readonly displayNumber: 9;
  readonly publishedOn: string;
  readonly sourceSnapshotOn: typeof RAG_SOURCE_SNAPSHOT_ON;
  readonly units: readonly RagUnitManifest[];
  readonly lessons: readonly RagLessonManifest[];
}

export interface RagSectionCopy {
  readonly heading: string;
  readonly paragraphs: readonly [string, ...string[]];
}

export interface RagPracticeCopy {
  readonly title: string;
  readonly brief: string;
  readonly steps: readonly [string, ...string[]];
  readonly evidence: readonly [string, ...string[]];
  readonly boundary: string;
}

export interface RagCheckpointCopy {
  readonly question: string;
  readonly options: readonly [string, string, string, string];
  readonly correctIndex: 0 | 1 | 2 | 3;
  readonly sourceId: RagSourceId;
  readonly explanation: string;
}

export interface RagFigureCopy {
  readonly title: string;
  readonly caption: string;
  readonly alt: string;
  readonly transcript: readonly [string, ...string[]];
}

export interface RagLessonCopy {
  readonly kicker: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly sections: readonly [RagSectionCopy, RagSectionCopy, RagSectionCopy];
  readonly figure: RagFigureCopy;
  readonly practice: RagPracticeCopy;
  readonly checkpoint: RagCheckpointCopy;
  readonly takeaway: string;
}

export interface RagCourseCopy {
  readonly meta: {
    readonly title: string;
    readonly kicker: string;
    readonly summary: string;
    readonly audience: string;
    readonly duration: string;
    readonly sourceNote: string;
    readonly uiNote: string;
    readonly startCta: string;
    readonly resumeCta: string;
  };
  readonly ui: Readonly<Record<string, string>>;
  readonly units: Readonly<Record<RagUnitId, { readonly title: string; readonly summary: string }>>;
  readonly lessons: Readonly<Record<RagLessonSlug, RagLessonCopy>>;
  readonly lab: {
    readonly kicker: string;
    readonly title: string;
    readonly description: string;
    readonly disclosure: string;
    readonly scenarioLabel: string;
    readonly strategyLabel: string;
    readonly topKLabel: string;
    readonly thresholdLabel: string;
    readonly rerankLabel: string;
    readonly rerankOn: string;
    readonly rerankOff: string;
    readonly selectedContext: string;
    readonly answerPreview: string;
    readonly noContext: string;
    readonly unsupportedContext: string;
    readonly sourceScore: string;
    readonly dense: string;
    readonly keyword: string;
    readonly hybrid: string;
    readonly included: string;
    readonly excluded: string;
    readonly scenarios: readonly [
      {
        readonly id: "paraphrase";
        readonly title: string;
        readonly query: string;
        readonly candidates: readonly [string, string, string, string];
        readonly answer: string;
        readonly supplements: Readonly<Partial<Record<"C1" | "C2" | "C3" | "C4", string>>>;
      },
      {
        readonly id: "identifier";
        readonly title: string;
        readonly query: string;
        readonly candidates: readonly [string, string, string, string];
        readonly answer: string;
        readonly supplements: Readonly<Partial<Record<"C1" | "C2" | "C3" | "C4", string>>>;
      },
      {
        readonly id: "conflict";
        readonly title: string;
        readonly query: string;
        readonly candidates: readonly [string, string, string, string];
        readonly answer: string;
        readonly supplements: Readonly<Partial<Record<"C1" | "C2" | "C3" | "C4", string>>>;
      },
    ];
  };
  readonly capstone: {
    readonly title: string;
    readonly summary: string;
    readonly required: readonly [string, ...string[]];
    readonly rubric: readonly [string, ...string[]];
  };
}

export interface RagSourceRecord {
  readonly id: RagSourceId;
  readonly evidenceLabel:
    | "official-course"
    | "official-event"
    | "official-video"
    | "official-doc"
    | "official-repository"
    | "research-paper"
    | "maintainer-repository"
    | "security-guidance"
    | "individual-user-report";
  readonly title: string;
  readonly publisher: string;
  readonly url: RagSourceUrl;
  readonly exactAnchor: RagSourceUrl;
  readonly accessedOn: typeof RAG_SOURCE_SNAPSHOT_ON;
  readonly licence: "site-terms" | "MIT" | "Apache-2.0" | "CC-BY-4.0" | "CC-BY-SA-4.0" | "undeclared";
  readonly licenceUrl: RagSourceUrl | null;
  readonly reuse: "link-and-synthesise" | "licensed-local-figure" | "original-only";
  readonly note: string;
  readonly caveat: string;
  readonly commit?: string;
}

export interface RagRasterAsset {
  readonly pngPath: `/${string}.png`;
  readonly webpPath: `/${string}.webp`;
  readonly width: number;
  readonly height: number;
  readonly pngSha256: string;
  readonly webpSha256: string;
  readonly upstreamUrl: RagSourceUrl;
  readonly upstreamCommit: string;
  readonly observedOn: typeof RAG_SOURCE_SNAPSHOT_ON;
  readonly privacyReview: "no-personal-data-visible";
}

export interface RagVectorAsset {
  readonly svgPath: `/${string}.svg`;
  readonly width: number;
  readonly height: number;
  readonly svgSha256: string;
  readonly upstreamUrl: RagSourceUrl;
  readonly upstreamCommit: string;
  readonly observedOn: string;
  readonly privacyReview: "no-personal-data-visible";
}

export interface RagFigureManifest {
  readonly id: RagFigureId;
  readonly format: "semantic-html" | "authentic-ui-screenshot" | "official-teaching-diagram";
  readonly status: "available";
  readonly sourceId: RagSourceId | null;
  readonly authenticUi: boolean;
  readonly product: "Claude-powered Anthropic quickstart" | "Anthropic knowledge-wiki architecture" | "Dify" | null;
  readonly rightsStatus: "course-original" | "licensed-local-figure";
  readonly raster: RagRasterAsset | null;
  readonly vector?: RagVectorAsset | null;
}

export interface MaterializedRagLesson extends RagLessonManifest {
  readonly copy: RagLessonCopy;
  readonly sources: readonly RagSourceRecord[];
  readonly figure: RagFigureManifest;
}

export interface MaterializedRagUnit extends RagUnitManifest {
  readonly copy: RagCourseCopy["units"][RagUnitId];
  readonly lessons: readonly MaterializedRagLesson[];
}

export interface MaterializedRagCourse {
  readonly locale: RagLocale;
  readonly contentLocale: RagLocale;
  readonly manifest: RagCourseManifest;
  readonly copy: RagCourseCopy;
  readonly units: readonly MaterializedRagUnit[];
}
