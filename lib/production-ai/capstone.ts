import type { CourseKitCapstoneArtifactAuthoringSeed } from "../course-kit/authoring";
import {
  COURSE_KIT_CAPSTONE_SCHEMA_VERSION,
  type CourseKitCapstone,
  type CourseKitNonEmpty,
} from "../course-kit/types";
import type { ProductionAiSourceId } from "./sources";

export const PRODUCTION_AI_CAPSTONE_VERSION = "2026.08.26-capstone-v1";

export const PRODUCTION_AI_CAPSTONE_ARTIFACTS = [
  {
    id: "lineage-manifest",
    sourceIds: ["pa03-mlmd", "pa04-openlineage"],
    copy: {
      en: { title: "Dual-system lineage manifest", description: "Bidirectional, content-addressed lineage for data, features, documents, embeddings, models, indexes, prompts, evaluations, packages, deployments, outputs, approvals, deletion obligations, and instrumented unknowns." },
      zhHans: { title: "双系统 lineage manifest", description: "针对数据、feature、document、embedding、model、index、prompt、evaluation、package、deployment、output、approval、删除义务与已接入未知项的双向内容寻址 lineage。" },
    },
  },
  {
    id: "experiment-record",
    sourceIds: ["pa05-mlflow-tracking"],
    copy: {
      en: { title: "Experiment and reproduction record", description: "Successful, repeated, and failed runs linked to code, data, environments, configurations, seeds, semantic metric definitions, artifacts, resources, parent runs, clean-room replay, and unresolved variance." },
      zhHans: { title: "实验与复现记录", description: "把成功、重复与失败 run 连接到代码、数据、环境、配置、种子、指标语义定义、产物、资源、parent run、clean-room 重放与未解决变异。" },
    },
  },
  {
    id: "registry-entry",
    sourceIds: ["pa06-mlflow-registry", "ra12-model-cards"],
    copy: {
      en: { title: "Registry, card, and approval record", description: "Immutable classifier and retrieval-generation versions, dependencies, intended and excluded uses, limitations, evidence, expiry, rejection path, independent risk review, named owner decision, release alias, and verified rollback targets." },
      zhHans: { title: "Registry、card 与批准记录", description: "不可变分类器与检索生成版本、依赖、预期/排除用途、限制、证据、到期、拒绝路径、独立风险审查、具名负责人决定、release alias 与已验证 rollback target。" },
    },
  },
  {
    id: "serving-contract",
    sourceIds: ["pa07-kserve", "pa08-tf-serving", "pa01-slos"],
    copy: {
      en: { title: "Serving and SLO contract", description: "Separate batch and online schemas, operation identity, idempotency, timeouts, retries, partial results, version receipts, side effects, reconciliation, fallbacks, plus distinct classifier and RAG SLI/SLO formulas and owners." },
      zhHans: { title: "Serving 与 SLO 合同", description: "分别定义 batch/online schema、operation identity、幂等、timeout、retry、partial result、版本收据、副作用、核对、fallback，以及不同 classifier/RAG SLI/SLO 公式与负责人。" },
    },
  },
  {
    id: "monitoring-dashboard",
    sourceIds: ["pa14-observability", "pa01-slos"],
    copy: {
      en: { title: "Observability and evaluation dashboard", description: "Correlated traces, metrics, logs, evaluation and audit events with versioned schemas, redaction, retention, completeness checks, request and successful-task denominators, alert rationale, cost, capacity, and owners." },
      zhHans: { title: "Observability 与评测 dashboard", description: "相关 trace、metric、log、evaluation/audit event，以及版本化 schema、redaction、保留、完整性检查、request/成功 task 分母、告警理由、成本、容量与负责人。" },
    },
  },
  {
    id: "drift-evidence",
    sourceIds: ["pa15-tfdv"],
    copy: {
      en: { title: "Continuous-evaluation and drift evidence", description: "Versioned reference/current windows, schemas, sampling, missingness, detectors, thresholds, uncertainty, critical slices, label delay, false alarms, misses, action rules, and proof that unlabeled difference is not called task degradation." },
      zhHans: { title: "持续评测与 drift 证据", description: "版本化 reference/current window、schema、抽样、缺失、detector、threshold、不确定性、关键切片、标签延迟、误报、漏报、行动规则，以及不把无标签差异称为任务退化的证明。" },
    },
  },
  {
    id: "alert-runbook",
    sourceIds: ["pa16-incident-postmortem", "pa17-nist-incident"],
    copy: {
      en: { title: "Alert and incident runbook", description: "Severity, incident command, roles, secure evidence, communication, containment, degradation, legal or sector escalation triggers, recovery tests, stakeholder channels, human authority, and a fail-closed unknown-state path." },
      zhHans: { title: "告警与事件 runbook", description: "严重度、incident command、角色、安全证据、沟通、遏制、降级、法律/行业升级触发、恢复测试、stakeholder channel、人类决定权与 fail-closed 未知状态路径。" },
    },
  },
  {
    id: "rollback-evidence",
    sourceIds: ["pa13-canary-openfeature", "pa16-incident-postmortem"],
    copy: {
      en: { title: "Rollout and rollback evidence", description: "Dark, shadow, canary, hold, release and rollback transitions; cohort and guardrail definitions; flag authorization and expiry; verified target bytes and dependencies; kill-switch test; ambiguous-command reconciliation; and prior-outcome ledger." },
      zhHans: { title: "Rollout 与 rollback 证据", description: "Dark、shadow、canary、hold、release 与 rollback transition；cohort/guardrail 定义；flag 授权与到期；已验证 target bytes/依赖；kill-switch 测试；模糊命令核对；以及先前结果 ledger。" },
    },
  },
  {
    id: "postmortem",
    sourceIds: ["pa16-incident-postmortem", "pa17-nist-incident"],
    copy: {
      en: { title: "Blameless postmortem and consequence repair", description: "Timestamped event and decision timeline, contributing system conditions, detection and response gaps, external consequences, notices, corrections, reprocessing, unresolved harms, corrective controls, named owners, dates, and effectiveness tests." },
      zhHans: { title: "无责复盘与后果修复", description: "带时间戳事件/决定 timeline、促成系统条件、检测与响应缺口、外部后果、通知、更正、重处理、未解决伤害、纠正控制、具名负责人、日期与 effectiveness test。" },
    },
  },
  {
    id: "governance-approval",
    sourceIds: ["ra12-model-cards", "pa11-nist-ssdf", "pa17-nist-incident"],
    copy: {
      en: { title: "Scoped human go/no-go record", description: "Independent review of reproducibility, data rights, security, service contracts, model/RAG quality, drift, cost, rollback and incidents, followed by a named, time-bounded, use-bounded go, revise, no-go, or no-deploy decision with revocation conditions." },
      zhHans: { title: "有范围人类 go/no-go 记录", description: "独立审查复现、数据权利、安全、服务合同、模型/RAG 质量、drift、成本、rollback 与事件，再由具名人类作出有期限/用途边界的 go、revise、no-go 或 no-deploy 决定并声明撤销条件。" },
    },
  },
] as const satisfies CourseKitNonEmpty<
  CourseKitCapstoneArtifactAuthoringSeed<string, ProductionAiSourceId>
>;

export type ProductionAiCapstoneArtifactId =
  (typeof PRODUCTION_AI_CAPSTONE_ARTIFACTS)[number]["id"];

export const PRODUCTION_AI_CAPSTONE = {
  schemaVersion: COURSE_KIT_CAPSTONE_SCHEMA_VERSION,
  version: PRODUCTION_AI_CAPSTONE_VERSION,
  artifacts: PRODUCTION_AI_CAPSTONE_ARTIFACTS.map((artifact) => ({
    id: artifact.id,
    sourceIds: artifact.sourceIds,
    required: true as const,
  })) as unknown as CourseKitCapstone<
    ProductionAiCapstoneArtifactId,
    ProductionAiSourceId
  >["artifacts"],
  evidenceContract: {
    schemaId: "aicourse.production-ai.capstone.v1",
    schemaPath: "/courses/production-ai/lab/capstone.schema.json",
    validatorId: "aicourse.production-ai.validator.v1",
    validatorPath: "/courses/production-ai/lab/validate.py",
    validatorCommand: "python public/courses/production-ai/lab/validate.py --package <artifact-package.json>",
  },
} satisfies CourseKitCapstone<
  ProductionAiCapstoneArtifactId,
  ProductionAiSourceId
>;
