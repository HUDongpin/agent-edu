import type { CourseKitCapstoneArtifactAuthoringSeed } from "../course-kit/authoring";
import {
  COURSE_KIT_CAPSTONE_SCHEMA_VERSION,
  type CourseKitCapstone,
  type CourseKitNonEmpty,
} from "../course-kit/types";
import type { ResponsibleAiSourceId } from "./sources";

export const RESPONSIBLE_AI_CAPSTONE_VERSION = "2026.08.26-capstone-v1";

export const RESPONSIBLE_AI_CAPSTONE_ARTIFACTS = [
  { id: "impact-assessment", sourceIds: ["nist-ai-rmf", "algorithmic-impact-assessment"], copy: { en: { title: "Impact assessment", description: "Bounded purpose, affected people, benefit and harm pathways, severity, likelihood, reversibility, evidence, assumptions, owner, and re-review trigger." }, zhHans: { title: "影响评估", description: "有界目的、受影响者、利益与伤害路径、严重度、可能性、可逆性、证据、假设、负责人和复核触发器。" } } },
  { id: "stakeholder-map", sourceIds: ["algorithmic-impact-assessment", "nist-ai-rmf"], copy: { en: { title: "Stakeholder power and voice map", description: "Direct and indirect stakeholders, exposure, power, decision rights, consultation evidence, unanswered concerns, and the response made by the team." }, zhHans: { title: "利益相关者权力与话语图", description: "直接与间接利益相关者、暴露、权力、决定权、参与证据、未回答关切，以及团队作出的回应。" } } },
  { id: "risk-register", sourceIds: ["nist-ai-rmf", "nist-ai-rmf-playbook"], copy: { en: { title: "Risk and control register", description: "Stable risk IDs linked to causes, harms, controls, tests, evidence, residual risk, owner, due date, monitoring signal, stop condition, and status." }, zhHans: { title: "风险与控制登记册", description: "把稳定风险 ID 连接到原因、伤害、控制、测试、证据、残余风险、负责人、期限、监测信号、停止条件与状态。" } } },
  { id: "data-map", sourceIds: ["oecd-privacy", "nist-privacy-framework", "eu-gdpr"], copy: { en: { title: "Data-rights and minimisation map", description: "Field-level purpose, source, data subject, access, retention, sharing, deletion, rights path, necessity decision, unresolved legal question, and prohibited reuse." }, zhHans: { title: "数据权利与最小化地图", description: "逐字段记录目的、来源、数据主体、访问、保留、共享、删除、权利路径、必要性决定、未决法律问题与禁止复用。" } } },
  { id: "subgroup-test", sourceIds: ["fairlearn-user-guide", "gender-shades", "nist-sp-1270"], copy: { en: { title: "Subgroup and uncertainty audit", description: "Declared groups, sample counts, missingness, performance and error measures, intervals, threshold policy, small-sample warning, harm interpretation, and unresolved evidence gaps." }, zhHans: { title: "子群与不确定性审计", description: "已声明群体、样本数、缺失、性能与错误指标、区间、阈值政策、小样本警示、伤害解释与未解决证据缺口。" } } },
  { id: "explanation-limitations-card", sourceIds: ["nist-ai-rmf", "uncertainty-calibration"], copy: { en: { title: "Explanation and limitations card", description: "Audience-specific explanation of the output, uncertainty and abstention conditions, supported and unsupported inferences, known limitations, excluded uses, next action, and contest or correction path." }, zhHans: { title: "解释与局限卡", description: "面向不同受众说明输出、不确定性与弃答条件、可支持与不可支持的推断、已知局限、排除用途、下一步行动，以及质疑或更正路径。" } } },
  { id: "override-appeal-flow", sourceIds: ["nist-ai-rmf-playbook", "eu-ai-act-2024", "unesco-ai-ethics"], copy: { en: { title: "Human authority, override, and appeal flow", description: "Named roles, reserved decisions, information and workload requirements, pause/override/rollback steps, notice, evidence access, independent review, remedy, and record retention." }, zhHans: { title: "人工权限、覆盖与申诉流程", description: "具名角色、保留决定、信息与工作量要求、暂停/覆盖/回滚步骤、通知、证据访问、独立复核、救济与记录保留。" } } },
  { id: "red-team-incident-log", sourceIds: ["nist-genai-profile", "nist-incident-response-r3"], copy: { en: { title: "Red-team and incident package", description: "Threat and harm hypotheses, versioned tests, evidence, severity, remediation and retest, detection, containment, recovery, notification, disclosure decision, and postmortem actions." }, zhHans: { title: "红队与事件包", description: "威胁与伤害假设、版本化测试、证据、严重度、修复与复测、侦测、控制、恢复、通知、披露决定与复盘行动。" } } },
  { id: "go-no-go-memo", sourceIds: ["nist-ai-rmf", "nist-ai-rmf-playbook", "oecd-ai-principles"], copy: { en: { title: "Go, conditional-go, or no-go memo", description: "Decision, bounded release, evidence links, residual risks, dissent, owner, conditions, verifier, deadline, monitoring, rollback trigger, no-deploy rationale, and next review date." }, zhHans: { title: "上线、有条件上线或不上线备忘录", description: "决定、有界发布、证据链接、残余风险、异议、负责人、条件、核验人、期限、监测、回滚触发器、不部署理由与下次复核日。" } } },
] as const satisfies CourseKitNonEmpty<CourseKitCapstoneArtifactAuthoringSeed<string, ResponsibleAiSourceId>>;

export type ResponsibleAiCapstoneArtifactId = (typeof RESPONSIBLE_AI_CAPSTONE_ARTIFACTS)[number]["id"];

export const RESPONSIBLE_AI_CAPSTONE = {
  schemaVersion: COURSE_KIT_CAPSTONE_SCHEMA_VERSION,
  version: RESPONSIBLE_AI_CAPSTONE_VERSION,
  artifacts: RESPONSIBLE_AI_CAPSTONE_ARTIFACTS.map((artifact) => ({ id: artifact.id, sourceIds: artifact.sourceIds, required: true as const })) as unknown as CourseKitCapstone<ResponsibleAiCapstoneArtifactId, ResponsibleAiSourceId>["artifacts"],
  evidenceContract: {
    schemaId: "aicourse.responsible-ai.capstone.v1",
    schemaPath: "/courses/responsible-ai/lab/capstone.schema.json",
    validatorId: "aicourse.responsible-ai.validator.v1",
    validatorPath: "/courses/responsible-ai/lab/validate.py",
    validatorCommand: "python public/courses/responsible-ai/lab/validate.py --package <artifact-package.json>",
  },
} satisfies CourseKitCapstone<ResponsibleAiCapstoneArtifactId, ResponsibleAiSourceId>;
