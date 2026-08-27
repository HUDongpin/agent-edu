import type { CourseKitModuleAuthoringSeed } from "../course-kit/authoring";
import type { CourseKitTenModules } from "../course-kit/types";
import { AI_RESEARCH_EN_MODULES } from "./copy/en";
import { AI_RESEARCH_ZH_HANS_MODULES } from "./copy/zh-Hans";
import type { AiResearchSourceId } from "./sources";

export const AI_RESEARCH_MODULES = [
  {
    slug: "question-protocol-preregistration",
    phaseId: "protocol-and-search",
    minutes: 55,
    sourceIds: ["osf-preregistration", "prisma-2020"],
    copy: { en: AI_RESEARCH_EN_MODULES["question-protocol-preregistration"], zhHans: AI_RESEARCH_ZH_HANS_MODULES["question-protocol-preregistration"] },
  },
  {
    slug: "transparent-search-search-log",
    phaseId: "protocol-and-search",
    minutes: 65,
    sourceIds: ["prisma-search", "cochrane-search"],
    copy: { en: AI_RESEARCH_EN_MODULES["transparent-search-search-log"], zhHans: AI_RESEARCH_ZH_HANS_MODULES["transparent-search-search-log"] },
  },
  {
    slug: "screening-inclusion-exclusion",
    phaseId: "protocol-and-search",
    minutes: 65,
    sourceIds: ["prisma-2020", "cochrane-selection"],
    copy: { en: AI_RESEARCH_EN_MODULES["screening-inclusion-exclusion"], zhHans: AI_RESEARCH_ZH_HANS_MODULES["screening-inclusion-exclusion"] },
  },
  {
    slug: "evidence-hierarchy-claim-source-ledger",
    phaseId: "extract-and-verify",
    minutes: 60,
    sourceIds: ["grade-book-current", "cochrane-bias"],
    copy: { en: AI_RESEARCH_EN_MODULES["evidence-hierarchy-claim-source-ledger"], zhHans: AI_RESEARCH_ZH_HANS_MODULES["evidence-hierarchy-claim-source-ledger"] },
  },
  {
    slug: "pdf-table-extraction-boundaries",
    phaseId: "extract-and-verify",
    minutes: 60,
    sourceIds: ["cochrane-data-collection", "pdf-2-spec", "grobid-evaluation"],
    copy: { en: AI_RESEARCH_EN_MODULES["pdf-table-extraction-boundaries"], zhHans: AI_RESEARCH_ZH_HANS_MODULES["pdf-table-extraction-boundaries"] },
  },
  {
    slug: "citation-verification-rag-locator",
    phaseId: "extract-and-verify",
    minutes: 65,
    sourceIds: ["crossref-rest", "niso-jats", "rag-original"],
    copy: { en: AI_RESEARCH_EN_MODULES["citation-verification-rag-locator"], zhHans: AI_RESEARCH_ZH_HANS_MODULES["citation-verification-rag-locator"] },
  },
  {
    slug: "quantitative-analysis-boundaries",
    phaseId: "analyse-with-boundaries",
    minutes: 60,
    sourceIds: ["asa-pvalues", "tidy-data"],
    copy: { en: AI_RESEARCH_EN_MODULES["quantitative-analysis-boundaries"], zhHans: AI_RESEARCH_ZH_HANS_MODULES["quantitative-analysis-boundaries"] },
  },
  {
    slug: "qualitative-synthesis-boundaries",
    phaseId: "analyse-with-boundaries",
    minutes: 60,
    sourceIds: ["entreq", "coreq", "srqr"],
    copy: { en: AI_RESEARCH_EN_MODULES["qualitative-synthesis-boundaries"], zhHans: AI_RESEARCH_ZH_HANS_MODULES["qualitative-synthesis-boundaries"] },
  },
  {
    slug: "reproducibility-uncertainty-ai-disclosure",
    phaseId: "reproduce-and-publish",
    minutes: 60,
    sourceIds: ["acm-artifact-review", "icmje-ai", "fair-principles"],
    copy: { en: AI_RESEARCH_EN_MODULES["reproducibility-uncertainty-ai-disclosure"], zhHans: AI_RESEARCH_ZH_HANS_MODULES["reproducibility-uncertainty-ai-disclosure"] },
  },
  {
    slug: "auditable-mini-review-capstone",
    phaseId: "reproduce-and-publish",
    minutes: 100,
    sourceIds: ["prisma-2020", "osf-preregistration", "grade-book-current", "acm-artifact-review", "fair-principles"],
    copy: { en: AI_RESEARCH_EN_MODULES["auditable-mini-review-capstone"], zhHans: AI_RESEARCH_ZH_HANS_MODULES["auditable-mini-review-capstone"] },
  },
] as const satisfies CourseKitTenModules<
  CourseKitModuleAuthoringSeed<string, string, AiResearchSourceId>
>;

export type AiResearchModuleSlug =
  (typeof AI_RESEARCH_MODULES)[number]["slug"];

export type AiResearchPhaseId =
  (typeof AI_RESEARCH_MODULES)[number]["phaseId"];
