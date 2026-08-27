import type { CourseKitSourceAuthoringSeed } from "../course-kit/authoring";
import type { CourseKitNonEmpty } from "../course-kit/types";

const ACCESSED_ON = "2026-08-26";

/** Canonical evidence records for Course 21; all teaching prose is original. */
export const PRODUCTION_AI_SOURCE_SEEDS = [
  {
    record: {
      id: "pa01-slos",
      title: "Site Reliability Engineering: Service Level Objectives",
      publisher: "Google",
      url: "https://sre.google/sre-book/service-level-objectives/",
      evidenceUrls: ["https://sre.google/sre-book/service-level-objectives/"],
      accessedOn: ACCESSED_ON,
      revision: "Live Google SRE book edition snapshot accessed 2026-08-26; no stable page revision exposed",
      kind: "official-guidance",
      stability: "current-documentation",
      reuseStatus: "link-and-paraphrase-only",
      licence: "Google SRE book CC BY-NC-ND 4.0; link and paraphrase only",
      supports:
        "Defining service indicators and objectives from user-visible behavior, measurement windows, and an error-budget operating practice.",
      boundary:
        "An SLI or SLO is not an SLA, statute, compliance certificate, or universal threshold. A target needs a declared population, denominator, window, owner, and consequence.",
    },
    zhHans: {
      supports: "支持从用户可见行为、测量窗口与错误预算实践定义服务指标和目标。",
      boundary: "SLI/SLO 不是 SLA、法规、合规证书或通用阈值；目标必须声明群体、分母、窗口、负责人和后果。",
    },
  },
  {
    record: {
      id: "pa02-tfx-pipelines",
      title: "Understanding TFX Pipelines",
      publisher: "TensorFlow",
      url: "https://www.tensorflow.org/tfx/guide/understanding_tfx_pipelines",
      evidenceUrls: ["https://www.tensorflow.org/tfx/guide/understanding_tfx_pipelines"],
      accessedOn: ACCESSED_ON,
      revision: "page updated 2023-05-09; TFX release must be pinned by implementers",
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "Documentation CC BY 4.0; code Apache-2.0; linked and paraphrased",
      supports:
        "A component-and-artifact DAG model for machine-learning pipelines, including dependencies, executions, caching, validation, and generated artifacts.",
      boundary:
        "TFX is one implementation. A successful DAG run does not prove data semantics, model quality, external-state capture, idempotence, or reproducibility.",
    },
    zhHans: {
      supports: "支持由组件、产物、依赖、执行、缓存与验证组成的机器学习管线 DAG 模型。",
      boundary: "TFX 只是一种实现；DAG 成功不能证明数据语义、模型质量、外部状态捕获、幂等或可复现。",
    },
  },
  {
    record: {
      id: "pa03-mlmd",
      title: "ML Metadata",
      publisher: "TensorFlow",
      url: "https://www.tensorflow.org/tfx/guide/mlmd",
      evidenceUrls: ["https://www.tensorflow.org/tfx/guide/mlmd"],
      accessedOn: ACCESSED_ON,
      revision: "Live TensorFlow MLMD documentation snapshot accessed 2026-08-26; no stable page version exposed",
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "Documentation CC BY 4.0; code Apache-2.0; linked and paraphrased",
      supports:
        "Representing artifacts, executions, events, types, and contexts so instrumented pipeline outputs can be traced to generating runs.",
      boundary:
        "Metadata captures only instrumented state. It does not automatically record external services, human decisions, rights, semantic quality, or deleted dependencies.",
    },
    zhHans: {
      supports: "支持用 artifact、execution、event、type 与 context 追踪已接入管线的生成关系。",
      boundary: "metadata 只捕获已接入状态，不会自动记录外部服务、人类决定、权利、语义质量或已删除依赖。",
    },
  },
  {
    record: {
      id: "pa04-openlineage",
      title: "OpenLineage schema specification",
      publisher: "OpenLineage project",
      url: "https://openlineage.io/docs/spec/schemas/",
      evidenceUrls: ["https://openlineage.io/docs/spec/schemas/"],
      accessedOn: ACCESSED_ON,
      revision: "rolling site; compatible specification and release must be pinned",
      kind: "normative-standard",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "Apache-2.0 project; linked and paraphrased",
      supports:
        "An interoperable event vocabulary for jobs, runs, datasets, inputs, outputs, and extensible lineage facets.",
      boundary:
        "A valid lineage event does not prove that instrumentation is complete, that identifiers refer to immutable data, or that processing is permitted or correct.",
    },
    zhHans: {
      supports: "支持描述 job、run、dataset、输入输出与可扩展 lineage facet 的互操作事件词汇。",
      boundary: "有效事件不能证明 instrumentation 完整、标识符指向不可变数据，也不能证明处理获准或正确。",
    },
  },
  {
    record: {
      id: "pa05-mlflow-tracking",
      title: "MLflow Tracking",
      publisher: "MLflow project",
      url: "https://mlflow.org/docs/latest/ml/tracking/",
      evidenceUrls: ["https://mlflow.org/docs/latest/ml/tracking/"],
      accessedOn: ACCESSED_ON,
      revision: "MLflow 3.7 documentation family at access",
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "Apache-2.0 project; linked and paraphrased",
      supports:
        "Recording run parameters, metrics, tags, artifacts, relationships, and experiment organization in the pinned MLflow documentation family.",
      boundary:
        "A tracking record is not a reproduction guarantee: code, data, environment, metric definitions, external state, failed runs, and artifact availability must be verified.",
    },
    zhHans: {
      supports: "支持在钉定 MLflow 文档族中记录 run 参数、指标、标签、产物、关系与实验组织。",
      boundary: "tracking 记录不保证复现；仍需验证代码、数据、环境、指标定义、外部状态、失败运行与产物可用性。",
    },
  },
  {
    record: {
      id: "pa06-mlflow-registry",
      title: "MLflow Model Registry workflow",
      publisher: "MLflow project",
      url: "https://mlflow.org/docs/latest/ml/model-registry/workflow",
      evidenceUrls: ["https://mlflow.org/docs/latest/ml/model-registry/workflow"],
      accessedOn: ACCESSED_ON,
      revision: "MLflow 3.7 documentation family at access",
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "Apache-2.0 project; linked and paraphrased",
      supports:
        "Versioned registered models, metadata, aliases, and workflow operations in the pinned MLflow registry surface.",
      boundary:
        "A registry alias or stage label is not independent evidence review, risk acceptance, human authorization, safety certification, or proof that referenced artifacts remain usable.",
    },
    zhHans: {
      supports: "支持钉定 MLflow registry 中的版本化模型、metadata、alias 与工作流操作。",
      boundary: "registry alias 或 stage 标签不等于独立证据审查、风险接受、人类授权、安全认证或产物持续可用。",
    },
  },
  {
    record: {
      id: "pa07-kserve",
      title: "KServe documentation and v0.18.0 release",
      publisher: "KServe project",
      url: "https://kserve.github.io/website/",
      evidenceUrls: [
        "https://kserve.github.io/website/",
        "https://github.com/kserve/kserve/releases/tag/v0.18.0"
      ],
      accessedOn: ACCESSED_ON,
      revision: "v0.18.0, released 2026-04-29",
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "Apache-2.0 project; linked and paraphrased",
      supports:
        "One Kubernetes-native implementation surface for model inference services and declarative serving resources.",
      boundary:
        "KServe does not define every platform, guarantee availability or correctness, make requests idempotent, or remove the need to pin Kubernetes, runtime, protocol, and API versions.",
    },
    zhHans: {
      supports: "支持一种 Kubernetes 原生模型推理服务与声明式 serving resource 实现界面。",
      boundary: "KServe 不定义所有平台，也不保证可用性、正确性或请求幂等；仍需钉定 Kubernetes、runtime、协议与 API 版本。",
    },
  },
  {
    record: {
      id: "pa08-tf-serving",
      title: "TensorFlow Serving configuration",
      publisher: "TensorFlow",
      url: "https://www.tensorflow.org/tfx/serving/serving_config",
      evidenceUrls: ["https://www.tensorflow.org/tfx/serving/serving_config"],
      accessedOn: ACCESSED_ON,
      revision: "Live TensorFlow Serving documentation snapshot accessed 2026-08-26; no stable page version exposed",
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "Documentation CC BY 4.0; code Apache-2.0; linked and paraphrased",
      supports:
        "TensorFlow-specific model-server configuration, model naming, version policies, and configuration reload behavior.",
      boundary:
        "This is one serving implementation. Version policies do not define business compatibility, safe rollback, request deduplication, authorization, or schema semantics.",
    },
    zhHans: {
      supports: "支持 TensorFlow 特定的模型服务配置、命名、版本政策与配置重载行为。",
      boundary: "这只是一种 serving 实现；版本政策不定义业务兼容、安全回滚、请求去重、授权或 schema 语义。",
    },
  },
  {
    record: {
      id: "pa09-oci-image",
      title: "OCI Image Format Specification",
      publisher: "Open Container Initiative",
      url: "https://specs.opencontainers.org/image-spec/manifest/",
      evidenceUrls: ["https://specs.opencontainers.org/image-spec/manifest/"],
      accessedOn: ACCESSED_ON,
      revision: "OCI Image Specification 1.1 family; exact compatible release must be pinned",
      kind: "normative-standard",
      stability: "version-pinned",
      reuseStatus: "link-and-paraphrase-only",
      licence: "OCI specification terms and patent policy; linked and paraphrased",
      supports:
        "An interoperable image manifest and content-addressed descriptor model for packaging container images.",
      boundary:
        "A valid image manifest does not make a container a sandbox, establish minimal privileges, prove provenance, remove vulnerabilities, or prevent embedded secrets.",
    },
    zhHans: {
      supports: "支持用于打包容器镜像的互操作 manifest 与内容寻址 descriptor 模型。",
      boundary: "有效镜像 manifest 不会把容器变成 sandbox，也不证明最小权限、来源、无漏洞或没有嵌入 secret。",
    },
  },
  {
    record: {
      id: "pa10-slsa",
      title: "SLSA specification v1.2",
      publisher: "OpenSSF / SLSA community",
      url: "https://slsa.dev/spec/v1.2/",
      evidenceUrls: ["https://slsa.dev/spec/v1.2/"],
      accessedOn: ACCESSED_ON,
      publishedOn: "2025-11-24",
      revision: "v1.2",
      kind: "normative-standard",
      stability: "version-pinned",
      reuseStatus: "link-and-paraphrase-only",
      licence: "Community Specification License 1.0; linked and paraphrased",
      supports:
        "Versioned requirements and terminology for build provenance and software supply-chain integrity controls.",
      boundary:
        "An attestation or SLSA level does not prove application correctness, absence of vulnerabilities, safe configuration, trusted dependencies, or regulatory compliance.",
    },
    zhHans: {
      supports: "支持构建 provenance 与软件供应链完整性控制的版本化要求与术语。",
      boundary: "attestation 或 SLSA 等级不能证明应用正确、无漏洞、配置安全、依赖可信或合规。",
    },
  },
  {
    record: {
      id: "pa11-nist-ssdf",
      title: "NIST SP 800-218: Secure Software Development Framework 1.1",
      publisher: "National Institute of Standards and Technology",
      url: "https://csrc.nist.gov/pubs/sp/800/218/final",
      evidenceUrls: ["https://csrc.nist.gov/pubs/sp/800/218/final"],
      accessedOn: ACCESSED_ON,
      publishedOn: "2022-02-03",
      revision: "v1.1 final; v1.2 was an initial public draft at the access boundary",
      jurisdiction: "United States federal guidance",
      kind: "official-guidance",
      stability: "version-pinned",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "A risk-based set of secure software development practices for preparing organizations, protecting software, producing well-secured software, and responding to vulnerabilities.",
      boundary:
        "SSDF is a framework rather than a product certification or complete sector-specific legal control set; the 2026 v1.2 initial public draft is not treated as final.",
    },
    zhHans: {
      supports: "支持涵盖组织准备、软件保护、安全生产与漏洞响应的风险导向安全开发实践。",
      boundary: "SSDF 是框架，不是产品认证或完整行业法律控制；2026 年 v1.2 初始草案不能当作最终版。",
    },
  },
  {
    record: {
      id: "pa12-owasp-secrets",
      title: "OWASP Secrets Management Cheat Sheet",
      publisher: "OWASP Foundation",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html",
      evidenceUrls: ["https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html"],
      accessedOn: ACCESSED_ON,
      revision: "Live OWASP Cheat Sheet Series snapshot accessed 2026-08-26; no stable page revision exposed",
      kind: "official-guidance",
      stability: "current-documentation",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "Lifecycle-oriented guidance for secret creation, storage, access, rotation, revocation, auditing, and recovery.",
      boundary:
        "A checklist does not implement a secret manager or prove that values are absent from images, logs, traces, prompts, model artifacts, backups, or client code.",
    },
    zhHans: {
      supports: "支持 secret 创建、存储、访问、轮换、撤销、审计与恢复的生命周期指导。",
      boundary: "清单不会自动实现 secret manager，也不能证明 secret 未进入镜像、日志、trace、prompt、模型产物、备份或客户端代码。",
    },
  },
  {
    record: {
      id: "pa13-canary-openfeature",
      title: "Canarying Releases and OpenFeature flag evaluation",
      publisher: "Google and OpenFeature project",
      url: "https://sre.google/workbook/canarying-releases/",
      evidenceUrls: [
        "https://sre.google/workbook/canarying-releases/",
        "https://openfeature.dev/specification/sections/flag-evaluation/"
      ],
      accessedOn: ACCESSED_ON,
      revision: "rolling guidance and OpenFeature specification at access",
      kind: "official-guidance",
      stability: "version-pinned",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "Comparing a small release cohort against a control before expansion and a vendor-neutral flag-evaluation contract for separating release from activation.",
      boundary:
        "A canary can miss rare harms and a shadow still processes data and consumes resources. A feature flag is not authorization, and evaluation context must not carry secrets.",
    },
    zhHans: {
      supports: "支持扩大发布前比较小流量 cohort 与 control，以及用厂商中立 flag 合同分离 release 和 activation。",
      boundary: "canary 会漏掉稀有伤害，shadow 仍处理数据并耗资源；feature flag 不是授权，evaluation context 也不能携带 secret。",
    },
  },
  {
    record: {
      id: "pa14-observability",
      title: "OpenTelemetry specification and SRE monitoring guidance",
      publisher: "OpenTelemetry project and Google",
      url: "https://opentelemetry.io/docs/specs/otel/",
      evidenceUrls: [
        "https://opentelemetry.io/docs/specs/otel/",
        "https://sre.google/sre-book/monitoring-distributed-systems/"
      ],
      accessedOn: ACCESSED_ON,
      revision: "OpenTelemetry specification 1.60.0 family at access; Google SRE page rolling",
      kind: "normative-standard",
      stability: "version-pinned",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "Separate telemetry signals and an operating distinction between symptoms, causes, latency, traffic, errors, saturation, and actionable monitoring.",
      boundary:
        "Signal and component stability differ. A trace is not a model evaluation, a metric anomaly is not automatically user harm, and telemetry can itself leak sensitive content.",
    },
    zhHans: {
      supports: "支持区分 telemetry signals，并从症状、原因、延迟、流量、错误、饱和度与可行动性设计监控。",
      boundary: "各 signal 与组件稳定度不同；trace 不是模型评测，指标异常不自动等于用户伤害，telemetry 本身也可能泄漏敏感内容。",
    },
  },
  {
    record: {
      id: "pa15-tfdv",
      title: "TensorFlow Data Validation: Data Analysis and Validation in Continuous ML Pipelines",
      publisher: "Google Research / SIGMOD",
      url: "https://research.google/pubs/tensorflow-data-validation-data-analysis-and-validation-in-continuous-ml-pipelines/",
      evidenceUrls: ["https://research.google/pubs/tensorflow-data-validation-data-analysis-and-validation-in-continuous-ml-pipelines/"],
      accessedOn: ACCESSED_ON,
      publishedOn: "2020-06-14",
      kind: "research",
      stability: "stable-concept",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "Schema, anomaly, skew, and drift analysis as data-validation controls in continuously operating machine-learning pipelines.",
      boundary:
        "Distributional difference without outcome labels does not prove concept drift or task-performance degradation. Thresholds and actions remain context-dependent.",
    },
    zhHans: {
      supports: "支持把 schema、anomaly、skew 与 drift 分析作为持续机器学习管线的数据验证控制。",
      boundary: "没有结果标签的分布差异不能证明概念漂移或任务性能下降；阈值与行动仍依赖情境。",
    },
  },
  {
    record: {
      id: "pa16-incident-postmortem",
      title: "Google SRE incident response and postmortem culture",
      publisher: "Google",
      url: "https://sre.google/workbook/incident-response/",
      evidenceUrls: [
        "https://sre.google/workbook/incident-response/",
        "https://sre.google/sre-book/postmortem-culture/"
      ],
      accessedOn: ACCESSED_ON,
      revision: "Live Google SRE workbook/book edition snapshot accessed 2026-08-26; no stable page revision exposed",
      kind: "official-guidance",
      stability: "current-documentation",
      reuseStatus: "link-and-paraphrase-only",
      licence: "Google SRE materials CC BY-NC-ND 4.0; link and paraphrase only",
      supports:
        "Incident roles, coordination, mitigation, communication, recovery, learning, and a blameless postmortem practice.",
      boundary:
        "This practice does not define statutory reporting, sector duties, compensation, or complete harm repair. Restoring service and rolling back code cannot undo every external consequence.",
    },
    zhHans: {
      supports: "支持事件角色、协调、缓解、沟通、恢复、学习与无责复盘实践。",
      boundary: "该实践不定义法定报告、行业义务、补偿或完整伤害修复；恢复服务与回滚代码无法撤销所有外部后果。",
    },
  },
  {
    record: {
      id: "pa17-nist-incident",
      title: "NIST SP 800-61 Revision 3: Incident Response Recommendations and Considerations",
      publisher: "National Institute of Standards and Technology",
      url: "https://csrc.nist.gov/pubs/sp/800/61/r3/final",
      evidenceUrls: ["https://csrc.nist.gov/pubs/sp/800/61/r3/final"],
      accessedOn: ACCESSED_ON,
      publishedOn: "2025-04-03",
      revision: "Revision 3 final; Revision 2 withdrawn",
      jurisdiction: "United States federal guidance",
      kind: "official-guidance",
      stability: "version-pinned",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "Integrating cybersecurity incident-response preparation and execution with Cybersecurity Framework 2.0 risk management.",
      boundary:
        "The publication is a general framework, not sector-specific legal advice, a notification clock for every jurisdiction, or proof that an AI-specific incident has been fully repaired.",
    },
    zhHans: {
      supports: "支持把网络安全事件响应准备与执行纳入 Cybersecurity Framework 2.0 风险管理。",
      boundary: "该文档是通用框架，不是行业法律意见、所有法域通知时限，也不能证明 AI 特定事件已完全修复。",
    },
  },
  {
    record: {
      id: "ra12-model-cards",
      title: "Model Cards for Model Reporting",
      publisher: "Google Research / FAT*",
      url: "https://research.google/pubs/model-cards-for-model-reporting/",
      evidenceUrls: ["https://research.google/pubs/model-cards-for-model-reporting/"],
      accessedOn: ACCESSED_ON,
      publishedOn: "2019-01-29",
      kind: "research",
      stability: "stable-concept",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "Structured reporting of intended use, evaluation conditions, performance, limitations, and relevant ethical considerations.",
      boundary:
        "A model card is documentation, not independent validation, governance approval, safety certification, or evidence that its claims remain current.",
    },
    zhHans: {
      supports: "支持结构化报告预期用途、评测条件、性能、限制与相关伦理考虑。",
      boundary: "model card 是文档，不是独立验证、治理批准、安全认证，也不证明其主张持续有效。",
    },
  },
  {
    record: {
      id: "ml11-production-readiness",
      title: "The ML Test Score: A Rubric for ML Production Readiness and Technical Debt Reduction",
      publisher: "Google Research",
      url: "https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/",
      evidenceUrls: ["https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/"],
      accessedOn: ACCESSED_ON,
      publishedOn: "2017-09-01",
      kind: "research",
      stability: "historical",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "A historically influential rubric connecting data, model, infrastructure, and monitoring tests to production-readiness discussion.",
      boundary:
        "The rubric is not a certification, current universal standard, legal checklist, or guarantee that a passing system is reliable, safe, or appropriate.",
    },
    zhHans: {
      supports: "支持把数据、模型、基础设施与监控测试连接到生产就绪讨论的历史性 rubric。",
      boundary: "该 rubric 不是认证、当前通用标准、法律清单，也不能保证通过的系统可靠、安全或适用。",
    },
  },
] as const satisfies CourseKitNonEmpty<CourseKitSourceAuthoringSeed>;

export type ProductionAiSourceId =
  (typeof PRODUCTION_AI_SOURCE_SEEDS)[number]["record"]["id"];
