import { buildCourseKitDefinition } from "../course-kit/authoring";
import { RESPONSIBLE_AI_RUBRIC_VERSION } from "../course-kit/responsible-ai-rubric";
import {
  AI_RESEARCH_CAPSTONE_ARTIFACTS,
  AI_RESEARCH_CAPSTONE_VERSION,
} from "./capstone";
import { AI_RESEARCH_EN_COURSE_COPY } from "./copy/en";
import { AI_RESEARCH_ZH_HANS_COURSE_COPY } from "./copy/zh-Hans";
import { AI_RESEARCH_MODULES } from "./modules";
import {
  AI_RESEARCH_QUESTION_BANK,
  AI_RESEARCH_QUIZ_VERSION,
} from "./quiz";
import { AI_RESEARCH_SOURCE_SEEDS } from "./sources";

export const AI_RESEARCH_COURSE = buildCourseKitDefinition({
  manifest: {
    id: "ai-research",
    version: "2026.08.26-v1",
    displayNumber: 17,
    publishedOn: "2026-08-26",
    milestoneCount: 12,
    phases: [
      {
        id: "protocol-and-search",
        copy: {
          en: { title: "Protocol and search", summary: "Precommit the question, preserve executable search receipts, and make every screening decision reconstructable." },
          zhHans: { title: "协议与检索", summary: "预先承诺研究问题，保存可执行检索收据，并使每项筛选决定可重建。" },
        },
      },
      {
        id: "extract-and-verify",
        copy: {
          en: { title: "Extract and verify", summary: "Calibrate claims to designs, extract with page- and cell-level provenance, and use RAG only to locate primary evidence." },
          zhHans: { title: "抽取与核验", summary: "让主张与研究设计匹配，以页和单元格级 provenance 抽取，并只用 RAG 定位一手证据。" },
        },
      },
      {
        id: "analyse-with-boundaries",
        copy: {
          en: { title: "Analyse with boundaries", summary: "Separate estimands, assumptions, calculations, qualitative interpretation, negative evidence, and allowed wording." },
          zhHans: { title: "有边界地分析", summary: "分开 estimand、假设、计算、定性解释、反证与允许措辞。" },
        },
      },
      {
        id: "reproduce-and-publish",
        copy: {
          en: { title: "Reproduce and publish", summary: "Package code, evidence, citations, uncertainty, AI use, failures, and non-claims into an independently auditable review." },
          zhHans: { title: "复现与发布", summary: "把代码、证据、引文、不确定性、AI 使用、失败与非声明打包为可独立审计的综述。" },
        },
      },
    ],
  },
  sources: AI_RESEARCH_SOURCE_SEEDS,
  modules: AI_RESEARCH_MODULES,
  courseCopy: {
    en: AI_RESEARCH_EN_COURSE_COPY,
    zhHans: AI_RESEARCH_ZH_HANS_COURSE_COPY,
  },
  quiz: {
    version: AI_RESEARCH_QUIZ_VERSION,
    questions: AI_RESEARCH_QUESTION_BANK,
  },
  capstone: {
    version: AI_RESEARCH_CAPSTONE_VERSION,
    artifacts: AI_RESEARCH_CAPSTONE_ARTIFACTS,
    responsibleAiGate: {
      version: RESPONSIBLE_AI_RUBRIC_VERSION,
      criteria: [
        { id: "purpose-risk-stop", questionIds: ["q-auditable-mini-review-capstone-core"], artifactIds: ["protocol", "ai-disclosure-failure-log"] },
        { id: "data-rights-minimisation", questionIds: ["q-question-protocol-preregistration-boundary"], artifactIds: ["extraction-sheet", "ai-disclosure-failure-log"] },
        { id: "subgroups-uncertainty", questionIds: ["q-screening-inclusion-exclusion-core"], artifactIds: ["claim-evidence-matrix"] },
        { id: "human-authority-recourse", questionIds: ["q-auditable-mini-review-capstone-core"], artifactIds: ["ai-disclosure-failure-log"] },
        { id: "challenge-incident-recovery", questionIds: ["q-reproducibility-uncertainty-ai-disclosure-core"], artifactIds: ["analysis-reproduction-package", "ai-disclosure-failure-log"] },
        { id: "evidence-decision-expiry", questionIds: ["q-citation-verification-rag-locator-core"], artifactIds: ["claim-evidence-matrix", "citation-audit"] },
      ],
    },
  },
});
