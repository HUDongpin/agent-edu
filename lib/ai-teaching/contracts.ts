import {
  AGENTIC_TEACHING_VERSION,
  type AgenticTeachingArtifactRubric,
  type AgenticTeachingContentLocale,
  type AgenticTeachingModuleSlug,
} from "./types";

type RubricRegistry = Readonly<
  Record<
    AgenticTeachingContentLocale,
    Readonly<Record<AgenticTeachingModuleSlug, AgenticTeachingArtifactRubric>>
  >
>;

export const AGENTIC_TEACHING_ARTIFACT_RUBRIC_SCHEMA = 1 as const;

export interface AgenticTeachingFinalQuizQuestionContract {
  readonly id: string;
  readonly optionIds: readonly [string, string, string, string];
  readonly correctOptionId: string;
  /** Reviewed visible labels, keyed by content locale and hashed in option order. */
  readonly optionLabelFingerprints: Readonly<
    Record<AgenticTeachingContentLocale, string>
  >;
  readonly critical: boolean;
  readonly sourceIds: readonly [string, ...string[]];
}

export interface AgenticTeachingFinalQuizContract {
  readonly schema: number;
  readonly courseVersion: string;
  readonly questionCount: number;
  readonly requiredCorrect: number;
  readonly questions: readonly AgenticTeachingFinalQuizQuestionContract[];
}

/**
 * Canonical machine-checkable artifact contracts.
 *
 * Copy, UI gates and persisted completion selectors all consume this registry,
 * so a visible rubric can never drift away from the receipt contract.
 */
export const AGENTIC_TEACHING_ARTIFACT_RUBRICS = {
  en: {
    "agentic-teaching-boundaries": {
      minimumCharacters: 260,
      requiredLabels: ["Purpose:", "Agent action:", "Human authority:", "Stop condition:", "Learning evidence:"],
      evidenceRequirements: [
        "Name the learning move, not a vague productivity goal.",
        "Separate what the agent drafts from what a qualified educator decides.",
        "Specify one observable stop condition and one no-AI learning measure.",
      ],
    },
    "learning-design-task-contracts": {
      minimumCharacters: 300,
      requiredLabels: ["Learners:", "Outcome:", "Approved sources:", "Allowed tools:", "Approval gate:", "No-go:"],
      evidenceRequirements: [
        "Identify age, context and the independent capability learners should retain.",
        "List source and tool scopes precisely enough to audit.",
        "Name the accountable person and at least two prohibited actions.",
      ],
    },
    "teacher-copilot-workflows": {
      minimumCharacters: 300,
      requiredLabels: ["Objective:", "Source trail:", "Learner activity:", "Accessibility check:", "Teacher sign-off:"],
      evidenceRequirements: [
        "Align every activity with one observable objective.",
        "Retain links from claims and materials to approved sources.",
        "Record the educator edit that materially changed the draft.",
      ],
    },
    "tutoring-feedback-agents": {
      minimumCharacters: 320,
      requiredLabels: ["Diagnostic:", "Learner attempt:", "Hint ladder:", "Human review:", "No-AI transfer:"],
      evidenceRequirements: [
        "Require a learner attempt before revealing a worked answer.",
        "Provide at least three increasingly explicit hints.",
        "End with a novel task completed without agent assistance.",
      ],
    },
    "multi-agent-inquiry": {
      minimumCharacters: 300,
      requiredLabels: ["Single-agent baseline:", "Specialist roles:", "Join contract:", "Conflict rule:", "Comparison decision:"],
      evidenceRequirements: [
        "Give each role a non-overlapping input, output and authority boundary.",
        "Define how disagreements remain visible to the educator.",
        "Compare quality, latency, cost and failure rate against one agent.",
      ],
    },
    "knowledge-tools-mcp": {
      minimumCharacters: 280,
      requiredLabels: ["Approved corpus:", "Read tools:", "Write tools:", "Provenance output:", "Revocation test:"],
      evidenceRequirements: [
        "Expose only the smallest approved resource collection.",
        "Keep write tools absent or separately approved.",
        "Show source, version and retrieval date in every generated artifact.",
      ],
    },
    "k12-safeguards": {
      minimumCharacters: 340,
      requiredLabels: ["Child context:", "Data flow:", "Adult escalation:", "AI disclosure:", "Incident response:", "Exit decision:"],
      evidenceRequirements: [
        "Use synthetic or de-identified data in the learning exercise.",
        "Name age, jurisdiction and institutional policy checks without treating guidance as law.",
        "Define a qualified adult escalation and an immediate stop path.",
      ],
    },
    "higher-ed-integrity": {
      minimumCharacters: 300,
      requiredLabels: ["Policy anchor:", "Permitted support:", "Authorship record:", "Appeal path:", "Instructor decision:"],
      evidenceRequirements: [
        "Quote or link the governing syllabus or institutional policy.",
        "Separate formative support from final academic judgement.",
        "Provide disclosure, accessibility, opt-out and appeal routes.",
      ],
    },
    "evals-learning-evidence": {
      minimumCharacters: 360,
      requiredLabels: ["Baseline:", "Test set:", "Learning transfer:", "Safety failures:", "Human takeover:", "Release threshold:"],
      evidenceRequirements: [
        "Measure trace correctness and learning outcomes as different layers.",
        "Include a new, no-AI transfer task and failure examples read by a person.",
        "Precommit a threshold that can produce a no-release decision.",
      ],
    },
    "pilot-capstone": {
      minimumCharacters: 400,
      requiredLabels: ["Pilot scope:", "Owner:", "Approval points:", "Evidence window:", "Kill switch:", "Go/no-go decision:"],
      evidenceRequirements: [
        "Move through shadow, teacher-only and bounded learner-facing stages.",
        "Name one owner with authority to pause and restore the prior process.",
        "Base the release decision on learning, safety, equity and operational evidence.",
      ],
    },
  },
  "zh-Hans": {
    "agentic-teaching-boundaries": {
      minimumCharacters: 240,
      requiredLabels: ["任务边界：", "人类责任人：", "允许自主度：", "停止条件：", "无 AI 迁移证据："],
      evidenceRequirements: [
        "写出一个不用智能体也能完成任务的基线",
        "区分系统能力证据与学习效果证据",
        "指定至少一个必须由教师作出的决定",
      ],
    },
    "learning-design-task-contracts": {
      minimumCharacters: 340,
      requiredLabels: ["学习结果：", "批准来源：", "数据与权限：", "审批与升级：", "禁止动作：", "停止条件：", "成功指标："],
      evidenceRequirements: [
        "学习结果必须描述学习者离开 AI 后能独立完成的表现",
        "来源须含版本、地区或更新时间边界",
        "权限须明确到读、写、发送、发布或删除动作",
      ],
    },
    "teacher-copilot-workflows": {
      minimumCharacters: 320,
      requiredLabels: ["教学目标：", "只读来源：", "学习者活动：", "副驾驶产出：", "可访问性检查：", "教师签发点：", "发布禁区："],
      evidenceRequirements: [
        "每个关键教学主张都能回链到批准资源",
        "教师在材料进入课堂或 LMS 前完成核验与签发",
        "注明资源许可、地区对齐与适龄性仍需人工复核",
      ],
    },
    "tutoring-feedback-agents": {
      minimumCharacters: 320,
      requiredLabels: ["先行判断：", "提示阶梯：", "教师审批：", "禁止输出：", "无 AI 迁移任务："],
      evidenceRequirements: [
        "学习者或教师必须先产生可观察判断，再由 AI 提供支持",
        "至少包含三个逐步增加信息量的提示层级",
        "迁移任务不得复用原题答案或保留 AI 帮助",
      ],
    },
    "multi-agent-inquiry": {
      minimumCharacters: 280,
      requiredLabels: ["单智能体基线：", "角色与接口：", "冲突保留：", "比较指标：", "回退条件："],
      evidenceRequirements: [
        "先定义单智能体的质量、成本、延迟与失败率",
        "每个角色都有独立输入、输出和验收标准",
        "多智能体没有达到预注册增益时回退到较简单方案",
      ],
    },
    "knowledge-tools-mcp": {
      minimumCharacters: 260,
      requiredLabels: ["资源范围：", "Host 责任：", "工具权限：", "版本记录：", "拒绝与升级："],
      evidenceRequirements: [
        "首个连接只暴露无个人数据的批准课程资源",
        "把 MCP 能力协商与教学脚本、授权、审计分别描述",
        "写操作必须独立列出并默认关闭或逐次审批",
      ],
    },
    "k12-safeguards": {
      minimumCharacters: 390,
      requiredLabels: ["儿童权利：", "数据流与保留：", "AI 身份说明：", "成人升级路径：", "事件响应：", "退出/停止决定：", "禁止自动决定："],
      evidenceRequirements: [
        "列出每个数据字段的采集、发送、存储、访问和删除路径",
        "说明当地法律、学校政策和供应商条款仍须机构核验",
        "危机、健康、纪律及权益决定必须转交合格成年人",
      ],
    },
    "higher-ed-integrity": {
      minimumCharacters: 300,
      requiredLabels: ["课程政策：", "人类学术判断：", "AI 可编辑草稿：", "披露与署名：", "申诉与退出："],
      evidenceRequirements: [
        "教师或 TA 在 AI 起草反馈前完成学术判断",
        "区分形成性支持、最终评分和学术不端裁决",
        "学习者可获得人工复核、申诉与可行的非 AI 路径",
      ],
    },
    "evals-learning-evidence": {
      minimumCharacters: 370,
      requiredLabels: ["工程评测：", "学习评测：", "安全与公平：", "人工抽检：", "无 AI 迁移：", "发布门槛："],
      evidenceRequirements: [
        "分别测量轨迹是否按约运行与学习者是否真正学会",
        "包含正常、来源冲突、越权、隐私和可访问性失败案例",
        "按相关学习者群体切片并读取失败样本而非只看平均分",
      ],
    },
    "pilot-capstone": {
      minimumCharacters: 390,
      requiredLabels: ["试点阶段：", "具名责任人：", "审批点：", "发布门槛：", "停止开关：", "事件与申诉：", "发布决定："],
      evidenceRequirements: [
        "按 shadow、teacher-only、小范围学习者试点逐级扩大",
        "把安全关键失败设为一票否决而非由平均分抵消",
        "记录具名责任人的发布或不发布理由及下一次复核日期",
      ],
    },
  },
} as const satisfies RubricRegistry;

/**
 * Locale-neutral scoring contract for the final assessment.
 *
 * Copy may be translated, but order, semantic option identities, correct
 * answers, critical gates, source mappings and the threshold are release
 * contracts. Persisted quiz receipts are bound to a hash of this whole object.
 */
export const AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT = {
  schema: 2,
  courseVersion: AGENTIC_TEACHING_VERSION,
  questionCount: 12,
  requiredCorrect: 10,
  questions: [
    {
      id: "q01-capability-boundary",
      optionIds: [
        "inspectable-framework-capability",
        "general-learning-gain",
        "school-compliance",
        "teacher-time-reduction",
      ],
      correctOptionId: "inspectable-framework-capability",
      optionLabelFingerprints: { en: "7149ad13", "zh-Hans": "1a732101" },
      critical: true,
      sourceIds: ["S01", "S05"],
    },
    {
      id: "q02-x-signal",
      optionIds: [
        "independent-impact-evidence",
        "dated-identified-announcement",
        "current-license-authority",
        "safety-certification",
      ],
      correctOptionId: "dated-identified-announcement",
      optionLabelFingerprints: { en: "81fe1801", "zh-Hans": "1a63dd07" },
      critical: true,
      sourceIds: ["S12", "S13", "S14"],
    },
    {
      id: "q03-independent-learning",
      optionIds: [
        "completion-unmeasurable",
        "assisted-completion-without-transfer",
        "ai-always-harms-learning",
        "satisfaction-only",
      ],
      correctOptionId: "assisted-completion-without-transfer",
      optionLabelFingerprints: { en: "455d42f7", "zh-Hans": "14f6b3b3" },
      critical: true,
      sourceIds: ["S09", "S10"],
    },
    {
      id: "q04-mcp-boundary",
      optionIds: [
        "resource-tool-names",
        "host-institution-governance",
        "protocol-messages",
        "capability-negotiation",
      ],
      correctOptionId: "host-institution-governance",
      optionLabelFingerprints: { en: "a0dfaead", "zh-Hans": "d9202bfc" },
      critical: true,
      sourceIds: ["S02", "S06"],
    },
    {
      id: "q05-child-data",
      optionIds: [
        "autonomous-diagnosis-caregiver-contact",
        "trusted-confidant-retention",
        "stop-and-qualified-adult-escalation",
        "continue-until-model-clears-risk",
      ],
      correctOptionId: "stop-and-qualified-adult-escalation",
      optionLabelFingerprints: { en: "d02de63a", "zh-Hans": "f3123add" },
      critical: true,
      sourceIds: ["S15", "S16"],
    },
    {
      id: "q06-human-judgement",
      optionIds: [
        "ai-grades-ta-polishes",
        "human-judges-ai-drafts-feedback",
        "ai-decides-misconduct",
        "feedback-length-proves-learning",
      ],
      correctOptionId: "human-judges-ai-drafts-feedback",
      optionLabelFingerprints: { en: "043f7341", "zh-Hans": "6c0d11c5" },
      critical: true,
      sourceIds: ["S11"],
    },
    {
      id: "q07-multi-agent",
      optionIds: [
        "advanced-appearance",
        "preregistered-benefit-justifies-complexity",
        "agent-consensus",
        "release-announcement",
      ],
      correctOptionId: "preregistered-benefit-justifies-complexity",
      optionLabelFingerprints: { en: "6729ccd6", "zh-Hans": "f4adc41b" },
      critical: false,
      sourceIds: ["S05", "S08", "S12", "S14"],
    },
    {
      id: "q08-trace-privacy",
      optionIds: [
        "retain-raw-traces-forever",
        "minimize-deidentify-restrict-delete",
        "debug-trace-policy-exemption",
        "trace-proves-learning",
      ],
      correctOptionId: "minimize-deidentify-restrict-delete",
      optionLabelFingerprints: { en: "7388af9e", "zh-Hans": "cd7deb6f" },
      critical: true,
      sourceIds: ["S01"],
    },
    {
      id: "q09-browser-action",
      optionIds: [
        "reuse-real-profile",
        "preview-approve-verify",
        "visible-ui-implies-permission",
        "agent-decides-consequence",
      ],
      correctOptionId: "preview-approve-verify",
      optionLabelFingerprints: { en: "c82f0565", "zh-Hans": "f632d5fe" },
      critical: true,
      sourceIds: ["S03", "S04"],
    },
    {
      id: "q10-tutor-copilot",
      optionIds: [
        "reuse-editable-pattern-with-bounds",
        "replace-every-teacher",
        "generalize-effect-worldwide",
        "skip-transfer-check",
      ],
      correctOptionId: "reuse-editable-pattern-with-bounds",
      optionLabelFingerprints: { en: "ed009367", "zh-Hans": "3dad90e2" },
      critical: false,
      sourceIds: ["S07"],
    },
    {
      id: "q11-higher-ed-rct",
      optionIds: [
        "short-term-gains-studied-lessons",
        "bounded-context",
        "universal-teacher-replacement",
        "need-local-transfer-equity-workload",
      ],
      correctOptionId: "universal-teacher-replacement",
      optionLabelFingerprints: { en: "a8c8e9a5", "zh-Hans": "d5468769" },
      critical: false,
      sourceIds: ["S10"],
    },
    {
      id: "q12-release-gate",
      optionIds: [
        "wording-change",
        "cost-overrun",
        "unresolved-critical-safety-failure",
        "simpler-baseline",
      ],
      correctOptionId: "unresolved-critical-safety-failure",
      optionLabelFingerprints: { en: "6616bcb3", "zh-Hans": "1b49d5bf" },
      critical: true,
      sourceIds: ["S01", "S03", "S04", "S09", "S15", "S16"],
    },
  ],
} as const satisfies AgenticTeachingFinalQuizContract;

interface AgenticTeachingCheckpointContract {
  readonly optionIds: readonly [string, string, string, string];
  readonly correctOptionId: string;
  readonly optionLabelFingerprint: string;
  readonly version: 1;
}

type CheckpointRegistry = Readonly<
  Record<
    AgenticTeachingContentLocale,
    Readonly<Record<AgenticTeachingModuleSlug, AgenticTeachingCheckpointContract>>
  >
>;

/** Stable semantic answer IDs keep persisted receipts independent of translated option text. */
export const AGENTIC_TEACHING_CHECKPOINT_CONTRACTS = {
  en: {
    "agentic-teaching-boundaries": {
      optionIds: ["agent-assisted-item-completion", "positive-interface-rating", "novel-no-ai-transfer", "runtime-error-free-trace"],
      correctOptionId: "novel-no-ai-transfer",
      optionLabelFingerprint: "22ada67f",
      version: 1,
    },
    "learning-design-task-contracts": {
      optionIds: ["general-teacher-responsibility", "aspirational-helpful-personalized-feedback", "paused-write-named-approver", "safety-prompt-only"],
      correctOptionId: "paused-write-named-approver",
      optionLabelFingerprint: "6532b59a",
      version: 1,
    },
    "teacher-copilot-workflows": {
      optionIds: ["generated-lessons-improve-achievement", "implementation-inspectability-only", "universal-curriculum-fit", "universal-root-license-coverage"],
      correctOptionId: "implementation-inspectability-only",
      optionLabelFingerprint: "3aa642fe",
      version: 1,
    },
    "tutoring-feedback-agents": {
      optionIds: ["ai-grades-and-publishes", "ai-drafts-grade-before-ta-review", "human-judgement-before-editable-support", "students-vote-on-ai-grade"],
      correctOptionId: "human-judgement-before-editable-support",
      optionLabelFingerprint: "68ccc6b6",
      version: 1,
    },
    "multi-agent-inquiry": {
      optionIds: ["engaging-personas-only", "separable-checkable-roles-beat-baseline", "agent-consensus-only", "x-subagent-announcement-only"],
      correctOptionId: "separable-checkable-roles-beat-baseline",
      optionLabelFingerprint: "cee4046a",
      version: 1,
    },
    "knowledge-tools-mcp": {
      optionIds: ["prove-tutoring-learning-effect", "auto-certify-server-safety", "host-governs-permission-consent-context", "grant-servers-full-conversation"],
      correctOptionId: "host-governs-permission-consent-context",
      optionLabelFingerprint: "ccc7a911",
      version: 1,
    },
    "k12-safeguards": {
      optionIds: ["identifiable-data-in-personal-model", "synthetic-or-approved-deidentified-first", "reuse-learner-sso-profile", "guidance-proves-legal-compliance"],
      correctOptionId: "synthetic-or-approved-deidentified-first",
      optionLabelFingerprint: "517ba4cc",
      version: 1,
    },
    "higher-ed-integrity": {
      optionIds: ["ai-grading-improves-learning", "bounded-feedback-provision-result", "universal-marking-time-reduction", "workflow-removes-appeals"],
      correctOptionId: "bounded-feedback-provision-result",
      optionLabelFingerprint: "9bc90b91",
      version: 1,
    },
    "evals-learning-evidence": {
      optionIds: ["educational-effectiveness-conclusion", "compliance-conclusion", "trace-is-not-learning-evidence", "no-ai-transfer-conclusion"],
      correctOptionId: "trace-is-not-learning-evidence",
      optionLabelFingerprint: "8753ac70",
      version: 1,
    },
    "pilot-capstone": {
      optionIds: ["launch-despite-learning-failure", "conceal-transfer-use-satisfaction", "stop-revise-after-transfer-failure", "add-agents-and-launch"],
      correctOptionId: "stop-revise-after-transfer-failure",
      optionLabelFingerprint: "d48768ef",
      version: 1,
    },
  },
  "zh-Hans": {
    "agentic-teaching-boundaries": {
      optionIds: ["repository-popularity", "assisted-speed-on-seen-items", "novel-no-ai-transfer", "x-learning-feature-announcement"],
      correctOptionId: "novel-no-ai-transfer",
      optionLabelFingerprint: "747b8c68",
      version: 1,
    },
    "learning-design-task-contracts": {
      optionIds: ["generated-question-count", "independent-transfer-on-new-material", "system-response-latency", "teacher-interface-impression"],
      correctOptionId: "independent-transfer-on-new-material",
      optionLabelFingerprint: "2f2403d9",
      version: 1,
    },
    "teacher-copilot-workflows": {
      optionIds: ["auto-publish-to-lms", "open-source-implies-direct-adoption", "teacher-local-review-and-signoff", "model-vote-decision"],
      correctOptionId: "teacher-local-review-and-signoff",
      optionLabelFingerprint: "76522931",
      version: 1,
    },
    "tutoring-feedback-agents": {
      optionIds: ["ai-final-grade-before-ta", "immediate-full-answer", "human-judgement-before-editable-support", "satisfaction-as-learning-proof"],
      correctOptionId: "human-judgement-before-editable-support",
      optionLabelFingerprint: "4da3de93",
      version: 1,
    },
    "multi-agent-inquiry": {
      optionIds: ["more-roles-only", "separable-checkable-roles-beat-baseline", "model-vote-as-truth", "short-linear-low-risk-task"],
      correctOptionId: "separable-checkable-roles-beat-baseline",
      optionLabelFingerprint: "f83cd8d1",
      version: 1,
    },
    "knowledge-tools-mcp": {
      optionIds: ["host-client-server-boundary", "capability-negotiation", "mcp-does-not-guarantee-pedagogy-permission-compliance", "client-server-protocol-structure"],
      correctOptionId: "mcp-does-not-guarantee-pedagogy-permission-compliance",
      optionLabelFingerprint: "e95d8c49",
      version: 1,
    },
    "k12-safeguards": {
      optionIds: ["collect-identifiable-full-dialogues", "personal-lms-first-permission-later", "minimize-deidentify-limit-retention-escalate", "parental-consent-automatic-discipline"],
      correctOptionId: "minimize-deidentify-limit-retention-escalate",
      optionLabelFingerprint: "d853bec7",
      version: 1,
    },
    "higher-ed-integrity": {
      optionIds: ["ai-auto-grade-and-publish", "human-judgement-before-editable-feedback", "satisfaction-replaces-learning-eval", "model-vote-academic-misconduct"],
      correctOptionId: "human-judgement-before-editable-feedback",
      optionLabelFingerprint: "436b7d9c",
      version: 1,
    },
    "evals-learning-evidence": {
      optionIds: ["trace-proves-learning", "trace-process-transfer-learning", "tool-success-no-human-audit", "average-quality-offsets-pii-leak"],
      correctOptionId: "trace-process-transfer-learning",
      optionLabelFingerprint: "f5898fac",
      version: 1,
    },
    "pilot-capstone": {
      optionIds: ["one-error-free-demo", "repo-activity-and-x-buzz", "all-gates-pass-owner-can-stop", "average-quality-despite-crisis-miss"],
      correctOptionId: "all-gates-pass-owner-can-stop",
      optionLabelFingerprint: "13726024",
      version: 1,
    },
  },
} as const satisfies CheckpointRegistry;

export function stableContractHash(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/** Hashes the exact reviewed label-to-option ordering without exposing scoring by position. */
export function agenticTeachingOptionLabelsFingerprint(
  labels: readonly string[],
): string {
  return stableContractHash({ schema: 1, labels: [...labels] });
}

export function getAgenticTeachingArtifactRubric(
  slug: AgenticTeachingModuleSlug,
  contentLocale: AgenticTeachingContentLocale,
): AgenticTeachingArtifactRubric {
  return AGENTIC_TEACHING_ARTIFACT_RUBRICS[contentLocale][slug];
}

export function agenticTeachingArtifactRubricFingerprint(
  slug: AgenticTeachingModuleSlug,
  contentLocale: AgenticTeachingContentLocale,
): string {
  const rubric = getAgenticTeachingArtifactRubric(slug, contentLocale);
  return fingerprintAgenticTeachingArtifactRubricContract(
    slug,
    contentLocale,
    rubric,
  );
}

export function fingerprintAgenticTeachingArtifactRubricContract(
  slug: AgenticTeachingModuleSlug,
  contentLocale: AgenticTeachingContentLocale,
  rubric: AgenticTeachingArtifactRubric,
): string {
  const contract = {
    rubricSchema: AGENTIC_TEACHING_ARTIFACT_RUBRIC_SCHEMA,
    courseVersion: AGENTIC_TEACHING_VERSION,
    slug,
    contentLocale,
    rubric: {
      minimumCharacters: rubric.minimumCharacters,
      requiredLabels: [...rubric.requiredLabels],
      evidenceRequirements: [...rubric.evidenceRequirements],
    },
  };
  return `course18.rubric.${slug}.${contentLocale}.${stableContractHash(contract)}`;
}

export function agenticTeachingFinalQuizBlueprintId(
  contract: AgenticTeachingFinalQuizContract = AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT,
): string {
  return `course18.quiz.${stableContractHash(contract)}`;
}

export function getAgenticTeachingFinalQuizQuestionContract(
  questionId: string,
): AgenticTeachingFinalQuizQuestionContract {
  const contract = AGENTIC_TEACHING_FINAL_QUIZ_CONTRACT.questions.find(
    (question) => question.id === questionId,
  );
  if (!contract) {
    throw new Error(`Unknown Course 18 final quiz question: ${questionId}`);
  }
  return contract;
}

export function getAgenticTeachingCheckpointContract(
  slug: AgenticTeachingModuleSlug,
  contentLocale: AgenticTeachingContentLocale,
): AgenticTeachingCheckpointContract {
  return AGENTIC_TEACHING_CHECKPOINT_CONTRACTS[contentLocale][slug];
}

export function agenticTeachingCheckpointBlueprintId(
  slug: AgenticTeachingModuleSlug,
  contentLocale: AgenticTeachingContentLocale,
): string {
  const contract = getAgenticTeachingCheckpointContract(slug, contentLocale);
  return `course18.checkpoint.${slug}.${contentLocale}.${stableContractHash({
    courseVersion: AGENTIC_TEACHING_VERSION,
    slug,
    contentLocale,
    ...contract,
  })}`;
}
