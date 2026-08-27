/**
 * Course 16's horizontal acceptance layer for Courses 17–21.
 *
 * These are not optional reading prompts. Each downstream capstone must show
 * evidence for every item before the learner can make its local completion
 * attestation. The browser records only self-attested completion; it does not
 * certify that the evidence is sufficient or authorize a real deployment.
 */
export const RESPONSIBLE_AI_RUBRIC_VERSION = "2026.08.26-v1" as const;

export const RESPONSIBLE_AI_CROSS_COURSE_RUBRIC = [
  {
    id: "purpose-risk-stop",
    en: "Purpose and risk: state the intended decision or use, affected people, prohibited uses, accountable owner, and explicit stop or no-deploy conditions.",
    zhHans: "目的与风险：说明预期决定或用途、受影响者、禁止用途、责任人，以及明确停止或 no-deploy 条件。",
  },
  {
    id: "data-rights-minimisation",
    en: "Data rights and privacy: record source, permission and confidentiality boundaries, minimise sensitive data, and define access, retention, deletion, and prohibited reuse.",
    zhHans: "数据权利与隐私：记录来源、许可和保密边界，最小化敏感数据，并定义访问、保留、删除与禁止复用。",
  },
  {
    id: "subgroups-uncertainty",
    en: "Fairness and uncertainty: expose denominators, missingness, coverage or subgroup slices, uncertainty, reporting gaps, and every population claim the evidence cannot support.",
    zhHans: "公平与不确定性：公开分母、缺失、覆盖或子群切片、不确定性、报告缺口，以及证据无法支持的所有总体声明。",
  },
  {
    id: "human-authority-recourse",
    en: "Human authority and recourse: name the reviewer and reserved decisions, then provide feasible override, stop, escalation, appeal, correction, or retraction paths for consequential errors.",
    zhHans: "人类权限与救济：明确审查者与保留决定，并为重要错误提供可行的覆盖、停止、升级、申诉、更正或撤回路径。",
  },
  {
    id: "challenge-incident-recovery",
    en: "Challenge and recovery: test plausible misuse and failure, preserve the log, and define detection, containment, rollback or correction, disclosure, and treatment of irreversible consequences.",
    zhHans: "挑战与恢复：测试合理的误用和失败，保留日志，并定义检测、遏制、回滚或更正、披露及不可逆后果的处理。",
  },
  {
    id: "evidence-decision-expiry",
    en: "Evidence-linked decision: connect claims and limitations to exact artifacts, owners, versions, expiry and re-review triggers, then record go, revise, no-go, or no-deploy without treating course completion as authorization.",
    zhHans: "证据链接决定：把主张和局限连接到确切产物、负责人、版本、到期与复核触发器，再记录 go、revise、no-go 或 no-deploy；不得把完成课程视为授权。",
  },
] as const;

export type ResponsibleAiCriterionId =
  (typeof RESPONSIBLE_AI_CROSS_COURSE_RUBRIC)[number]["id"];

export const RESPONSIBLE_AI_CRITERION_IDS =
  RESPONSIBLE_AI_CROSS_COURSE_RUBRIC.map((item) => item.id) as unknown as readonly [
    ResponsibleAiCriterionId,
    ResponsibleAiCriterionId,
    ResponsibleAiCriterionId,
    ResponsibleAiCriterionId,
    ResponsibleAiCriterionId,
    ResponsibleAiCriterionId,
  ];

export const RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_EN =
  RESPONSIBLE_AI_CROSS_COURSE_RUBRIC.map((item) => item.en) as unknown as readonly [
    string,
    ...string[],
  ];

export const RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_ZH_HANS =
  RESPONSIBLE_AI_CROSS_COURSE_RUBRIC.map((item) => item.zhHans) as unknown as readonly [
    string,
    ...string[],
  ];
