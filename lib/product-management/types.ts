export const PRODUCT_MANAGEMENT_COURSE_ID = "product-management" as const;
export const PRODUCT_MANAGEMENT_CONTENT_LOCALE = "en" as const;

export const PRODUCT_MANAGEMENT_LOCALES = [
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

export const PRODUCT_MANAGEMENT_PHASE_IDS = [
  "imagine",
  "decide",
  "build",
  "launch",
] as const;

export const PRODUCT_MANAGEMENT_MODULE_SLUGS = [
  "product-judgment-operating-model",
  "vision-strategy-business-model",
  "customer-market-discovery",
  "synthesis-opportunity-definition",
  "outcomes-metrics-analytics",
  "prioritization-roadmaps-portfolio",
  "solution-discovery-experiments",
  "product-design-experience-systems",
  "requirements-prd-decisions",
  "ai-capability-architecture",
  "delivery-engineering-ai-agents",
  "quality-safety-governance",
  "launch-go-to-market-growth",
  "experimentation-operations-leadership",
] as const;

export const PRODUCT_MANAGEMENT_CONCEPT_DOMAIN_IDS = [
  "role-leadership",
  "strategy-business",
  "discovery-research",
  "definition-scope",
  "metrics-analytics",
  "prioritization-roadmaps",
  "experimentation",
  "design-experience",
  "requirements-technical",
  "ai-products",
  "delivery-collaboration",
  "risk-governance",
  "launch-growth",
  "operations-leadership",
] as const;

export type ProductManagementLocale = (typeof PRODUCT_MANAGEMENT_LOCALES)[number];
export type ProductManagementPhaseId = (typeof PRODUCT_MANAGEMENT_PHASE_IDS)[number];
export type ProductManagementModuleSlug = (typeof PRODUCT_MANAGEMENT_MODULE_SLUGS)[number];
export type ProductManagementConceptDomainId =
  (typeof PRODUCT_MANAGEMENT_CONCEPT_DOMAIN_IDS)[number];

export type ProductManagementSourceKind =
  | "primary-course"
  | "official-guidance"
  | "research"
  | "law"
  | "open-source"
  | "industry-practice";

export interface ProductManagementSourceRecord {
  readonly id: string;
  readonly title: string;
  readonly publisher: string;
  readonly url: string;
  readonly accessedOn: string;
  readonly kind: ProductManagementSourceKind;
  readonly license?: string;
  /** What this source is used to support inside the course. */
  readonly supports: string;
  /** A visible boundary against treating one source as universal truth. */
  readonly boundary: string;
}

export interface ProductManagementPhaseManifest {
  readonly id: ProductManagementPhaseId;
  readonly order: number;
  readonly moduleSlugs: readonly ProductManagementModuleSlug[];
}

export interface ProductManagementModuleManifest {
  readonly slug: ProductManagementModuleSlug;
  readonly order: number;
  readonly phaseId: ProductManagementPhaseId;
  readonly minutes: number;
  readonly sourceIds: readonly [string, ...string[]];
  readonly conceptDomainIds: readonly [
    ProductManagementConceptDomainId,
    ...ProductManagementConceptDomainId[],
  ];
}

export interface ProductManagementCourseManifest {
  readonly id: typeof PRODUCT_MANAGEMENT_COURSE_ID;
  readonly version: string;
  readonly displayNumber: 14;
  readonly publishedOn: string;
  readonly contentLocale: typeof PRODUCT_MANAGEMENT_CONTENT_LOCALE;
  readonly phases: readonly ProductManagementPhaseManifest[];
  readonly modules: readonly ProductManagementModuleManifest[];
}

export interface ProductManagementSectionCopy {
  readonly heading: string;
  readonly paragraphs: readonly [string, ...string[]];
  readonly bullets?: readonly [string, ...string[]];
  readonly sourceIds: readonly [string, ...string[]];
}

export interface ProductManagementDecisionCopy {
  readonly title: string;
  readonly question: string;
  readonly options: readonly [string, string, string];
  readonly recommendation: string;
  readonly tradeoff: string;
}

export interface ProductManagementPracticeCopy {
  readonly title: string;
  readonly brief: string;
  readonly steps: readonly [string, ...string[]];
  readonly artifact: string;
  readonly reviewGate: string;
  readonly aiPairing: string;
  readonly template: string;
}

export interface ProductManagementCheckpointCopy {
  readonly question: string;
  readonly options: readonly [string, string, string, string];
  readonly correctIndex: 0 | 1 | 2 | 3;
  readonly explanation: string;
}

export interface ProductManagementFinalQuestionCopy
  extends ProductManagementCheckpointCopy {
  readonly id: string;
  readonly moduleTitle: string;
}

export interface ProductManagementModuleCopy {
  readonly kicker: string;
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly artifact: string;
  readonly concepts: readonly [string, ...string[]];
  readonly sections: readonly [
    ProductManagementSectionCopy,
    ProductManagementSectionCopy,
    ProductManagementSectionCopy,
  ];
  readonly decision: ProductManagementDecisionCopy;
  readonly practice: ProductManagementPracticeCopy;
  readonly checkpoint: ProductManagementCheckpointCopy;
  readonly takeaway: string;
}

export interface ProductManagementConceptDomainCopy {
  readonly title: string;
  readonly summary: string;
  readonly concepts: readonly [string, ...string[]];
}

export interface ProductManagementCourseCopy {
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
  readonly ui: Readonly<Record<string, string>>;
  readonly principles: readonly [string, string, string, string];
  readonly outcomes: readonly [
    string,
    string,
    string,
    string,
    string,
    string,
    string,
    string,
  ];
  readonly phases: Readonly<Record<ProductManagementPhaseId, {
    readonly title: string;
    readonly summary: string;
    readonly verb: string;
  }>>;
  readonly conceptDomains: Readonly<Record<
    ProductManagementConceptDomainId,
    ProductManagementConceptDomainCopy
  >>;
  readonly modules: Readonly<Record<
    ProductManagementModuleSlug,
    ProductManagementModuleCopy
  >>;
  readonly finalAssessment: {
    readonly title: string;
    readonly summary: string;
    readonly passPercent: number;
    readonly questions: readonly [
      ProductManagementFinalQuestionCopy,
      ...ProductManagementFinalQuestionCopy[],
    ];
  };
  readonly capstone: {
    readonly title: string;
    readonly summary: string;
    readonly scenario: string;
    readonly artifacts: readonly [string, ...string[]];
    readonly completionStatement: string;
    readonly reviewQuestions: readonly [string, ...string[]];
  };
}

export interface MaterializedProductManagementModule
  extends ProductManagementModuleManifest {
  readonly copy: ProductManagementModuleCopy;
  readonly sources: readonly ProductManagementSourceRecord[];
}

export interface MaterializedProductManagementPhase
  extends ProductManagementPhaseManifest {
  readonly copy: ProductManagementCourseCopy["phases"][ProductManagementPhaseId];
  readonly modules: readonly MaterializedProductManagementModule[];
}

export interface MaterializedProductManagementCourse {
  readonly locale: ProductManagementLocale;
  readonly contentLocale: ProductManagementLocale;
  readonly contentDirection: "ltr" | "rtl";
  readonly manifest: ProductManagementCourseManifest;
  readonly copy: ProductManagementCourseCopy;
  readonly modules: readonly MaterializedProductManagementModule[];
  readonly phases: readonly MaterializedProductManagementPhase[];
}
