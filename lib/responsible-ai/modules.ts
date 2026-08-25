import type { CourseKitModuleAuthoringSeed } from "../course-kit/authoring";
import type { CourseKitTenModules } from "../course-kit/types";
import {
  RESPONSIBLE_AI_EN_MODULES,
} from "./copy/en";
import {
  RESPONSIBLE_AI_ZH_HANS_MODULES,
} from "./copy/zh-Hans";
import type { ResponsibleAiSourceId } from "./sources";

export const RESPONSIBLE_AI_MODULES = [
  {
    slug: "purpose-risk-classification",
    phaseId: "scope-and-rights",
    minutes: 50,
    sourceIds: ["nist-ai-rmf", "oecd-ai-principles"],
    copy: { en: RESPONSIBLE_AI_EN_MODULES["purpose-risk-classification"], zhHans: RESPONSIBLE_AI_ZH_HANS_MODULES["purpose-risk-classification"] },
  },
  {
    slug: "stakeholders-impact-assessment",
    phaseId: "scope-and-rights",
    minutes: 60,
    sourceIds: ["nist-ai-rmf", "algorithmic-impact-assessment"],
    copy: { en: RESPONSIBLE_AI_EN_MODULES["stakeholders-impact-assessment"], zhHans: RESPONSIBLE_AI_ZH_HANS_MODULES["stakeholders-impact-assessment"] },
  },
  {
    slug: "data-rights-privacy-minimisation",
    phaseId: "scope-and-rights",
    minutes: 60,
    sourceIds: ["oecd-privacy", "nist-privacy-framework", "eu-gdpr"],
    copy: { en: RESPONSIBLE_AI_EN_MODULES["data-rights-privacy-minimisation"], zhHans: RESPONSIBLE_AI_ZH_HANS_MODULES["data-rights-privacy-minimisation"] },
  },
  {
    slug: "fairness-subgroup-audit",
    phaseId: "test-and-document",
    minutes: 70,
    sourceIds: ["fairlearn-user-guide", "gender-shades", "nist-sp-1270"],
    copy: { en: RESPONSIBLE_AI_EN_MODULES["fairness-subgroup-audit"], zhHans: RESPONSIBLE_AI_ZH_HANS_MODULES["fairness-subgroup-audit"] },
  },
  {
    slug: "explainability-uncertainty-limitations",
    phaseId: "test-and-document",
    minutes: 55,
    sourceIds: ["nist-ai-rmf", "uncertainty-calibration"],
    copy: { en: RESPONSIBLE_AI_EN_MODULES["explainability-uncertainty-limitations"], zhHans: RESPONSIBLE_AI_ZH_HANS_MODULES["explainability-uncertainty-limitations"] },
  },
  {
    slug: "model-data-system-cards",
    phaseId: "test-and-document",
    minutes: 55,
    sourceIds: ["model-cards", "datasheets", "nist-genai-profile"],
    copy: { en: RESPONSIBLE_AI_EN_MODULES["model-data-system-cards"], zhHans: RESPONSIBLE_AI_ZH_HANS_MODULES["model-data-system-cards"] },
  },
  {
    slug: "human-authority-oversight-boundaries",
    phaseId: "authority-and-recourse",
    minutes: 70,
    sourceIds: ["nist-ai-rmf", "nist-ai-rmf-playbook", "eu-hleg-ethics-guidelines-2019-historical", "eu-ai-act-2024"],
    copy: { en: RESPONSIBLE_AI_EN_MODULES["human-authority-oversight-boundaries"], zhHans: RESPONSIBLE_AI_ZH_HANS_MODULES["human-authority-oversight-boundaries"] },
  },
  {
    slug: "escalation-appeal-contestability",
    phaseId: "authority-and-recourse",
    minutes: 65,
    sourceIds: ["unesco-ai-ethics", "algorithmic-impact-assessment", "nist-ai-rmf-playbook"],
    copy: { en: RESPONSIBLE_AI_EN_MODULES["escalation-appeal-contestability"], zhHans: RESPONSIBLE_AI_ZH_HANS_MODULES["escalation-appeal-contestability"] },
  },
  {
    slug: "red-teaming-incidents-disclosure",
    phaseId: "operate-and-decide",
    minutes: 75,
    sourceIds: ["nist-genai-profile", "nist-incident-response-r3"],
    copy: { en: RESPONSIBLE_AI_EN_MODULES["red-teaming-incidents-disclosure"], zhHans: RESPONSIBLE_AI_ZH_HANS_MODULES["red-teaming-incidents-disclosure"] },
  },
  {
    slug: "governance-dossier-capstone",
    phaseId: "operate-and-decide",
    minutes: 90,
    sourceIds: ["nist-ai-rmf", "nist-ai-rmf-playbook", "oecd-ai-principles"],
    copy: { en: RESPONSIBLE_AI_EN_MODULES["governance-dossier-capstone"], zhHans: RESPONSIBLE_AI_ZH_HANS_MODULES["governance-dossier-capstone"] },
  },
] as const satisfies CourseKitTenModules<
  CourseKitModuleAuthoringSeed<string, string, ResponsibleAiSourceId>
>;

export type ResponsibleAiModuleSlug =
  (typeof RESPONSIBLE_AI_MODULES)[number]["slug"];

export type ResponsibleAiPhaseId =
  (typeof RESPONSIBLE_AI_MODULES)[number]["phaseId"];
