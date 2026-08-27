import { buildCourseKitDefinition } from "../course-kit/authoring";
import {
  RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_EN,
  RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_ZH_HANS,
  RESPONSIBLE_AI_RUBRIC_VERSION,
} from "../course-kit/responsible-ai-rubric";
import {
  PRODUCTION_AI_CAPSTONE_ARTIFACTS,
  PRODUCTION_AI_CAPSTONE_VERSION,
} from "./capstone";
import { PRODUCTION_AI_MODULES } from "./modules";
import {
  PRODUCTION_AI_QUESTION_BANK,
  PRODUCTION_AI_QUIZ_VERSION,
} from "./quiz";
import { PRODUCTION_AI_SOURCE_SEEDS } from "./sources";

/** Complete, serialisable, fail-closed Course 21 data contract. */
export const PRODUCTION_AI_COURSE = buildCourseKitDefinition({
  manifest: {
    id: "production-ai",
    version: "2026.08.26-v1",
    displayNumber: 21,
    publishedOn: "2026-08-26",
    milestoneCount: 14,
    phases: [
      {
        id: "contracts-and-lineage",
        copy: {
          en: { title: "Contracts and lineage", summary: "Define measurable service outcomes, typed pipeline executions, and bidirectional provenance before promoting any artifact." },
          zhHans: { title: "合同与 lineage", summary: "在推进任何产物前，定义可测服务结果、typed pipeline execution 与双向 provenance。" },
        },
      },
      {
        id: "evidence-and-release",
        copy: {
          en: { title: "Evidence and release identity", summary: "Bind experiments, model and index versions, human approvals, and batch/online operations to immutable, reproducible evidence." },
          zhHans: { title: "证据与 release 身份", summary: "把实验、model/index 版本、人类批准与 batch/online operation 绑定到不可变、可复现证据。" },
        },
      },
      {
        id: "secure-rollout-and-observability",
        copy: {
          en: { title: "Secure rollout and observability", summary: "Package with provenance and least privilege, stage exposure through fail-closed rollouts, and observe execution without confusing it with evaluation." },
          zhHans: { title: "安全 rollout 与 observability", summary: "以 provenance 与最小权限打包，通过 fail-closed rollout 分阶段暴露，并观察执行但不把它混同为评测。" },
        },
      },
      {
        id: "evaluation-and-response",
        copy: {
          en: { title: "Continuous evaluation and response", summary: "Interpret change signals within their limits, exercise rollback and incident repair, and defend a scoped human go/no-go decision." },
          zhHans: { title: "持续评测与响应", summary: "在边界内解释变化信号，演练 rollback 与事件修复，并为有范围人类 go/no-go 决定辩护。" },
        },
      },
    ],
  },
  sources: PRODUCTION_AI_SOURCE_SEEDS,
  modules: PRODUCTION_AI_MODULES,
  courseCopy: {
    en: {
      meta: {
        title: "Production AI and MLOps",
        kicker: "Course 21 · Responsible operation of dual AI systems",
        summary: "Move from a runnable model to an accountable service by operating a conventional prediction system and a retrieval-generation system through contracts, lineage, reproducibility, secure release, observability, drift evaluation, rollback, and incident response.",
        audience: "Engineers, technical leads, evaluators, and product or governance partners who need a shared evidence model for operating predictive and generative AI services.",
        prerequisite: "Course 19 is the common prerequisite. The RAG/LLM operations track also recommends the RAG and Software Engineering courses. No course milestone grants access to real production systems or data.",
        level: "Advanced",
        duration: "900 minutes across 12 modules, a deterministic 16-question final draw, and a ten-artifact dual-system capstone",
        evidenceNote: "All implementation surfaces are pinned to the 2026-08-26 research boundary. Platform documentation is an example, not a universal architecture; no source is used to imply exactly-once execution, absence of drift or downtime, unlimited cost, automatic compliance, or deployment authority.",
      },
      principles: [
        "Define user outcomes, populations, denominators, windows, owners, and consequences before selecting platform metrics.",
        "Make every data, feature, document, model, index, prompt, configuration, execution, approval, and output traceable in both directions.",
        "Preserve failed and repeated runs; test reproducibility from a clean environment rather than inferring it from tracking metadata.",
        "Separate artifact identity, technical PASS, independent risk and rights review, named approval, release activation, and rollback verification.",
        "Assume retries, caches, networks, queues, and rollbacks can produce ambiguous or non-reversible outcomes; reconcile them explicitly.",
        "Keep secrets out of all artifacts and telemetry, minimize privileges, and treat supply-chain attestations as bounded provenance evidence.",
        "Treat observability, model evaluation, user outcomes, drift detection, cost, privacy, and safety as related but non-interchangeable signals.",
        "Require real hold, kill-switch, rollback, escalation, appeal, no-go, and no-deploy paths under named human authority.",
      ],
      outcomes: [
        "Define separate, computable service contracts and SLOs for a classifier and a retrieval-generation service.",
        "Build a typed training pipeline whose artifacts, caches, validations, failures, and external-state limits are auditable.",
        "Answer backward provenance and forward deletion-impact questions across datasets, features, models, indexes, prompts, and outputs.",
        "Create complete experiment records and conduct a clean-room reproduction that preserves unexplained variance and failed runs.",
        "Operate an immutable registry with distinct evidence, risk/rights, named approval, release, expiry, rejection, and rollback states.",
        "Specify batch and online serving contracts with operation identity, idempotency, version receipts, side effects, and reconciliation.",
        "Audit package provenance, least privilege, dependencies, and the full secret rotation, revocation, purge, and verification lifecycle.",
        "Execute dark, shadow, canary, hold, release, kill-switch, and rollback transitions under predeclared critical guardrails.",
        "Design correlated telemetry and evaluation surfaces with redaction, retention, completeness, ownership, and cost-per-success evidence.",
        "Distinguish schema, quality, skew, distribution, concept, and measured performance change before authorizing an action.",
        "Respond to AI incidents with evidence preservation, verified rollback or degradation, outcome reconciliation, notices, and owned postmortem actions.",
        "Deliver a ten-artifact dual-system dossier and defend a scoped, time-bounded, revocable human go/no-go decision.",
      ],
      quiz: {
        title: "Production AI final assessment",
        intro: "A deterministic 16-question draw is selected from a 36-question bilingual bank. Score at least 13 and answer every selected critical reproducibility, secrets, human-authority, rollback, and bounded-deployment question correctly.",
      },
      capstone: {
        title: "Dual-system production dossier",
        intro: "Operate the fictional classifier and retrieval-generation services through the complete evidence, release, evaluation, rollback, and incident cycle. Local success demonstrates only this bounded educational exercise—not a real deployment.",
        instructions: [
          "Verify fixture, schema, environment, source, build, model, index, prompt, configuration, evaluation, registry, and rollback-target identities before operating either service.",
          "Complete all ten required artifacts and link every SLO, service-card, quality, security, drift, cost, release, and incident claim to exact evidence, version, owner, expiry, and boundary.",
          "Run both systems through shadow and canary; inject the declared wrong-alias and unsupported-answer failures; activate hold or rollback; verify current state; and reconcile every prior outcome, disclosure, queue, and cache.",
          "Have independent reviewers challenge reproducibility, lineage completeness, secrets, service quality, drift interpretation, rollback limits, data rights, and human authority before a named person records go, revise, no-go, or no-deploy.",
        ],
        responsibleAiRubric: RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_EN,
        attestation: "I verified the original synthetic fixture and exact artifact identities, preserved failures and ambiguous outcomes, traced every claim to bounded evidence, reconciled rollback consequences, disclosed unresolved rights, security, reliability, and evaluation limits, and left any further use to a scoped, revocable decision by named humans.",
      },
    },
    zhHans: {
      meta: {
        title: "生产 AI 与 MLOps",
        kicker: "课程 21 · 负责任运营双 AI 系统",
        summary: "通过合同、lineage、可复现、安全 release、observability、drift 评测、rollback 与事件响应，运营一个传统预测系统和一个检索生成系统，从可运行模型走向可问责服务。",
        audience: "需要共享证据模型来运营预测式与生成式 AI 服务的工程师、技术负责人、评测人员以及产品或治理合作伙伴。",
        prerequisite: "课程 19 是共同先修；RAG/LLM 运营路径还建议先修 RAG 与软件工程课程。任何课程里程碑都不授予真实生产系统或数据访问权。",
        level: "高级",
        duration: "12 个模块共 900 分钟，另含 16 题确定性抽题终测与十产物双系统毕业项目",
        evidenceNote: "所有实现界面钉定于 2026-08-26 研究边界。平台文档只是示例，不是通用架构；任何来源都不得用来暗示 exactly-once、无漂移、无停机、无成本上限、自动合规或部署权限。",
      },
      principles: [
        "选择平台指标前先定义用户结果、群体、分母、窗口、负责人与后果。",
        "使每项数据、feature、document、model、index、prompt、配置、执行、批准与输出都可双向追溯。",
        "保留失败和重复 run；从干净环境测试复现，而不从 tracking metadata 推断。",
        "分开产物身份、技术 PASS、独立风险/权利审查、具名批准、release activation 与 rollback 验证。",
        "假定 retry、cache、network、queue 与 rollback 会产生模糊或不可逆结果，并显式核对。",
        "阻止 secret 进入任何 artifact 与 telemetry，最小化权限，并把供应链 attestation 视为有边界 provenance 证据。",
        "把 observability、模型评测、用户结果、drift 检测、成本、隐私与安全视为相关但不可互换的信号。",
        "在具名人类决定权下保留真实 hold、kill-switch、rollback、escalation、appeal、no-go 与 no-deploy 路径。",
      ],
      outcomes: [
        "为分类器和检索生成服务定义不同且可计算的服务合同与 SLO。",
        "构建 typed training pipeline，使产物、cache、validation、failure 与外部状态限制可审计。",
        "跨 dataset、feature、model、index、prompt 与 output 回答反向 provenance 与正向删除影响问题。",
        "创建完整实验记录并执行 clean-room 复现，保留未解释变异与失败 run。",
        "运营不可变 registry，分开证据、风险/权利、具名批准、release、到期、拒绝与 rollback 状态。",
        "定义含 operation identity、幂等、版本收据、副作用与核对的 batch/online serving 合同。",
        "审计 package provenance、最小权限、依赖与完整 secret 轮换、撤销、清理和验证生命周期。",
        "在预先声明关键 guardrail 下执行 dark、shadow、canary、hold、release、kill-switch 与 rollback transition。",
        "设计含 redaction、retention、completeness、ownership 与每成功任务成本证据的相关 telemetry 和评测界面。",
        "在授权行动前区分 schema、质量、skew、distribution、concept 与已测 performance change。",
        "以证据保全、已验证 rollback/degradation、结果核对、通知与有负责人 postmortem action 响应 AI 事件。",
        "交付十产物双系统档案，并为有范围、有期限、可撤销的人类 go/no-go 决定辩护。",
      ],
      quiz: {
        title: "生产 AI 终测",
        intro: "系统从 36 道双语题中确定性抽取 16 题。至少答对 13 题，并答对所有被抽中的可复现、secret、人类决定权、rollback 与有边界部署关键题。",
      },
      capstone: {
        title: "双系统生产档案",
        intro: "让虚构分类器与检索生成服务经过完整证据、release、评测、rollback 与事件周期。本地成功只证明这项有边界教学练习，而不代表真实部署。",
        instructions: [
          "运营任一服务前，验证 fixture、schema、环境、source、build、model、index、prompt、config、evaluation、registry 与 rollback-target 身份。",
          "完成全部十项必需产物，并把每项 SLO、service-card、质量、安全、drift、成本、release 与 incident 声明连接到确切证据、版本、负责人、到期与边界。",
          "让两个系统运行 shadow 与 canary，注入已声明 wrong-alias 与 unsupported-answer 故障，启动 hold/rollback，验证当前状态，并核对每项先前结果、披露、queue 与 cache。",
          "请独立审查者挑战复现、lineage 完整性、secret、服务质量、drift 解释、rollback 限制、数据权利与人类决定权，再由具名人类记录 go、revise、no-go 或 no-deploy。",
        ],
        responsibleAiRubric: RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_ZH_HANS,
        attestation: "我已验证原创合成 fixture 与确切产物身份，保留失败与模糊结果，把每项声明追溯到有边界证据，核对 rollback 后果，披露未解决权利、安全、可靠性与评测限制，并把任何进一步使用留给具名人类作出的有范围、可撤销决定。",
      },
    },
  },
  quiz: {
    version: PRODUCTION_AI_QUIZ_VERSION,
    questions: PRODUCTION_AI_QUESTION_BANK,
  },
  capstone: {
    version: PRODUCTION_AI_CAPSTONE_VERSION,
    artifacts: PRODUCTION_AI_CAPSTONE_ARTIFACTS,
    responsibleAiGate: {
      version: RESPONSIBLE_AI_RUBRIC_VERSION,
      criteria: [
        { id: "purpose-risk-stop", questionIds: ["q-model-registry-approval-cards-core"], artifactIds: ["serving-contract", "governance-approval"] },
        { id: "data-rights-minimisation", questionIds: ["q-packaging-security-secrets-boundary"], artifactIds: ["lineage-manifest", "serving-contract"] },
        { id: "subgroups-uncertainty", questionIds: ["q-monitoring-performance-cost-boundary"], artifactIds: ["monitoring-dashboard", "drift-evidence"] },
        { id: "human-authority-recourse", questionIds: ["q-model-registry-approval-cards-core", "q-dual-system-production-capstone-boundary"], artifactIds: ["registry-entry", "governance-approval"] },
        { id: "challenge-incident-recovery", questionIds: ["q-shadow-canary-feature-flags-boundary", "q-incident-response-rollback-postmortem-core"], artifactIds: ["alert-runbook", "rollback-evidence", "postmortem"] },
        { id: "evidence-decision-expiry", questionIds: ["q-experiment-tracking-reproducibility-boundary"], artifactIds: ["experiment-record", "registry-entry", "governance-approval"] },
      ],
    },
  },
});
