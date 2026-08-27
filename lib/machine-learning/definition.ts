import { buildCourseKitDefinition } from "../course-kit/authoring";
import {
  RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_EN,
  RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_ZH_HANS,
  RESPONSIBLE_AI_RUBRIC_VERSION,
} from "../course-kit/responsible-ai-rubric";
import {
  MACHINE_LEARNING_CAPSTONE_ARTIFACTS,
  MACHINE_LEARNING_CAPSTONE_VERSION,
  type MachineLearningCapstoneArtifactId,
} from "./capstone";
import {
  MACHINE_LEARNING_MODULES,
  type MachineLearningModuleSlug,
  type MachineLearningPhaseId,
} from "./modules";
import {
  MACHINE_LEARNING_QUESTION_BANK,
  MACHINE_LEARNING_QUIZ_VERSION,
  type MachineLearningQuestionId,
} from "./quiz";
import {
  MACHINE_LEARNING_SOURCE_SEEDS,
  type MachineLearningSourceId,
} from "./sources";

export const MACHINE_LEARNING_COURSE = buildCourseKitDefinition<
  "machine-learning",
  MachineLearningModuleSlug,
  MachineLearningPhaseId,
  MachineLearningSourceId,
  MachineLearningQuestionId,
  MachineLearningCapstoneArtifactId
>({
  manifest: {
    id: "machine-learning",
    version: "2026.08.26-v1",
    displayNumber: 19,
    publishedOn: "2026-08-26",
    milestoneCount: 14,
    phases: [
      {
        id: "supervised-foundations",
        copy: {
          en: { title: "Supervised foundations", summary: "Frame a prediction-time contract, freeze leakage-aware evidence, and build interpretable regression and classification baselines." },
          zhHans: { title: "监督学习基础", summary: "框定预测时点合同、冻结防泄漏证据，并建立可解释回归与分类基线。" },
        },
      },
      {
        id: "models-and-generalisation",
        copy: {
          en: { title: "Models and generalization", summary: "Audit feature pipelines, optimization, regularization, trees, ensembles, stability, complexity, and selection evidence." },
          zhHans: { title: "模型与泛化", summary: "审计特征管线、优化、正则化、树、集成、稳定性、复杂度与选择证据。" },
        },
      },
      {
        id: "evaluation-and-decisions",
        copy: {
          en: { title: "Evaluation and decisions", summary: "Connect prevalence, metrics, calibration, thresholds, capacity, uncertainty, and error analysis without transferring authority to a score." },
          zhHans: { title: "评价与决策", summary: "连接基率、指标、校准、阈值、容量、不确定性与错误分析，但不把权限转交给分数。" },
        },
      },
      {
        id: "unsupervised-and-recommendation",
        copy: {
          en: { title: "Unsupervised learning and recommendation", summary: "Treat clusters, anomalies, and recommendations as task-bounded summaries shaped by geometry, exposure, candidates, and review policy." },
          zhHans: { title: "无监督学习与推荐", summary: "把聚类、异常与推荐视为受任务限制、由几何、曝光、候选与审查政策塑造的汇总。" },
        },
      },
      {
        id: "capstone-assurance",
        copy: {
          en: { title: "Capstone assurance", summary: "Rebuild the full experiment, challenge leakage and provenance, link every model-card claim to evidence, and issue a no-deploy decision." },
          zhHans: { title: "毕业保证", summary: "重建完整实验，挑战泄漏与来源，把每项模型卡声明连接到证据，并作出不可部署决定。" },
        },
      },
    ],
  },
  sources: MACHINE_LEARNING_SOURCE_SEEDS,
  modules: MACHINE_LEARNING_MODULES,
  courseCopy: {
    en: {
      meta: {
        title: "Machine Learning Foundations",
        kicker: "Course 19 · Predictive modeling with evidence and human authority",
        summary: "Learn regression, classification, feature pipelines, regularization, ensembles, imbalanced metrics, calibration, clustering, anomaly detection, and recommendation through one fixed fictional experiment that ends in a no-deploy review.",
        audience: "Learners who can use Python and tabular data and want a rigorous, decision-aware foundation in classical machine learning.",
        prerequisite: "Course 18 or equivalent ability to build tested Python data pipelines, reason about tables and missingness, and report descriptive uncertainty.",
        level: "Intermediate",
        duration: "840 minutes across 12 modules, a 16-question final draw, and an eight-artifact assurance capstone",
        evidenceNote: "scikit-learn behavior is pinned to the reviewed 1.9.x documentation. Original papers support definitions and reported studies only; they do not establish universal superiority or deployment fitness.",
      },
      principles: [
        "Frame the human decision, prediction time, target, action, and non-goals before fitting a model.",
        "Freeze group- and time-aware partitions, and keep every learned transformation inside training evidence.",
        "Compare against strong simple baselines under identical partitions, candidates, metrics, and budgets.",
        "Separate ranking, probability quality, thresholds, capacity, error harms, and human authority.",
        "Report variation, residuals, calibration, subgroup counts, error cases, complexity, and non-claims—not one winning score.",
        "Treat documentation as an auditable claim map, never as legal, ethical, safety, or deployment approval.",
      ],
      outcomes: [
        "Write a prediction-time and split contract that blocks target, group, and temporal leakage.",
        "Build and diagnose linear-regression and logistic-classification baselines.",
        "Compose fold-local feature transformations with estimators in reproducible pipelines.",
        "Use learning curves, regularization, repeated validation, and stability checks without spending the holdout.",
        "Compare trees and ensembles across predictive, stochastic, explanatory, and operational tradeoffs.",
        "Choose metric evidence from prevalence, costs, denominators, uncertainty, subgroups, and review capacity.",
        "Separate calibration, threshold tuning, final testing, and reproducible error analysis.",
        "Audit clustering as an algorithm-dependent partition rather than discovered human identity.",
        "Route anomaly scores to bounded review without equating unusualness with error, fraud, or need.",
        "Evaluate recommenders with temporal exposure-aware candidates, popularity and matrix-factorization baselines, coverage, and cold-start limits.",
        "Create an evidence-linked model card with intended use, exclusions, dependencies, limitations, oversight, and expiry triggers.",
        "Deliver an independently challenged eight-artifact assurance dossier ending in an explicit no-deploy decision.",
      ],
      quiz: {
        title: "Machine Learning final assessment",
        intro: "A deterministic 16-question draw is selected from a 36-question bilingual bank. Score at least 13 and answer every selected critical question correctly.",
      },
      capstone: {
        title: "Fictional student-support model assurance dossier",
        intro: "Build and audit a predictive experiment using only the fixed synthetic fixture. The capstone assesses experimental discipline and evidence boundaries; it cannot authorize use with real learners.",
        instructions: [
          "Verify the fixture, schema, environment, split, pipeline, and output checksums before interpreting metrics.",
          "Complete all eight artifacts while keeping baseline, validation, calibration, threshold, subgroup, error, and holdout evidence separated.",
          "Map every model-card claim to a file, command, result, owner, and recheck condition; label assumptions and unresolved risks.",
          "Ask an independent reviewer to inject one leakage or provenance failure and record whether each release gate detects it.",
          "Conclude with a signed no-deploy decision that preserves human authority, appeal, and requirements for real legal, population, security, and operational review.",
        ],
        responsibleAiRubric: RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_EN,
        attestation: "I rebuilt the experiment from fixed fictional inputs, kept design choices out of final holdout evidence, traced every material claim, recorded the independent challenge and residual risks, and did not authorize real-person prediction, ranking, triage, personalization, or deployment.",
      },
    },
    zhHans: {
      meta: {
        title: "机器学习基础",
        kicker: "课程 19 · 以证据与人类权限为核心的预测建模",
        summary: "围绕一个最终作出不可部署决定的固定虚构实验，学习回归、分类、特征管线、正则化、集成、不平衡指标、校准、聚类、异常检测与推荐。",
        audience: "能够使用 Python 和表格数据，并希望建立严谨、决策感知经典机器学习基础的学习者。",
        prerequisite: "完成课程 18，或具备建立受测 Python 数据管线、推理表格与缺失、报告描述性不确定性的同等能力。",
        level: "中级",
        duration: "12 个模块共 840 分钟，另含 16 题固定抽题终测与八产物保证毕业项目",
        evidenceNote: "scikit-learn 行为钉住到经审查的 1.9.x 文档。原始论文只支持定义与报告研究，不证明普遍优越或适合部署。",
      },
      principles: [
        "拟合模型前先框定人类决策、预测时点、目标、行动与非目标。",
        "冻结群组与时间感知分区，把每项学习型转换限制在训练证据内。",
        "在相同分区、候选、指标与预算下与强简单基线比较。",
        "分开排序、概率质量、阈值、容量、错误危害与人类权限。",
        "报告变异、残差、校准、子群数量、错误案例、复杂度与非声明，而不是一个获胜分数。",
        "把文档视为可审查声明图，绝不视为法律、伦理、安全或部署批准。",
      ],
      outcomes: [
        "撰写阻断目标、群组与时间泄漏的预测时点和切分合同。",
        "建立并诊断线性回归与逻辑分类基线。",
        "在可复现管线中组合折内特征转换与估计器。",
        "使用学习曲线、正则化、重复验证与稳定性检查而不消耗留出集。",
        "跨预测、随机、解释与运营取舍比较树和集成。",
        "依据基率、成本、分母、不确定性、子群与审查容量选择指标证据。",
        "分开校准、阈值调参、最终测试与可复现错误分析。",
        "把聚类审计为算法依赖划分，而非发现的人类身份。",
        "把异常分数送往有边界审查，而不把罕见等同于错误、欺诈或需要。",
        "用时间与曝光感知候选、流行度和矩阵分解基线、覆盖与冷启动限制评价推荐。",
        "建立证据链接模型卡，包含预期用途、排除、依赖、限制、监督与到期触发器。",
        "交付经独立挑战的八产物保证档案，并以明确不可部署决定结束。",
      ],
      quiz: {
        title: "机器学习终测",
        intro: "系统从 36 道双语题中确定性抽取 16 题。至少答对 13 题，并答对所有被抽中的关键题。",
      },
      capstone: {
        title: "虚构学生支持模型保证档案",
        intro: "只使用固定合成 fixture 建立并审计预测实验。毕业项目评估实验纪律与证据边界，不能授权对真实学习者使用。",
        instructions: [
          "解释指标前验证 fixture、schema、环境、切分、管线与输出校验和。",
          "完成全部八项产物，同时分开基线、验证、校准、阈值、子群、错误与留出证据。",
          "把每项模型卡声明映射到文件、命令、结果、负责人和复核条件，并标注假设与未解决风险。",
          "请独立审查者注入一个泄漏或来源故障，并记录每道发布门能否检测。",
          "以签署不可部署决定结束，保留人类权限、申诉，以及真实法律、总体、安全与运营审查要求。",
        ],
        responsibleAiRubric: RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_ZH_HANS,
        attestation: "我已从固定虚构输入重建实验，没有让设计选择进入最终留出证据，追溯每项重大声明，记录独立挑战与残余风险，也没有授权真实人群预测、排序、分诊、个性化或部署。",
      },
    },
  },
  quiz: {
    version: MACHINE_LEARNING_QUIZ_VERSION,
    questions: MACHINE_LEARNING_QUESTION_BANK,
  },
  capstone: {
    version: MACHINE_LEARNING_CAPSTONE_VERSION,
    artifacts: MACHINE_LEARNING_CAPSTONE_ARTIFACTS,
    responsibleAiGate: {
      version: RESPONSIBLE_AI_RUBRIC_VERSION,
      criteria: [
        { id: "purpose-risk-stop", questionIds: ["q-leakage-reproducibility-model-card-capstone-boundary"], artifactIds: ["problem-split-contract", "no-deploy-review"] },
        { id: "data-rights-minimisation", questionIds: ["q-framing-baselines-splits-core"], artifactIds: ["problem-split-contract", "reproducible-pipeline"] },
        { id: "subgroups-uncertainty", questionIds: ["q-imbalanced-data-metrics-boundary"], artifactIds: ["metrics-calibration", "subgroup-error-audit"] },
        { id: "human-authority-recourse", questionIds: ["q-calibration-thresholds-error-analysis-core", "q-anomaly-detection-boundary"], artifactIds: ["model-card", "no-deploy-review"] },
        { id: "challenge-incident-recovery", questionIds: ["q-leakage-reproducibility-model-card-capstone-boundary"], artifactIds: ["model-comparison", "subgroup-error-audit", "no-deploy-review"] },
        { id: "evidence-decision-expiry", questionIds: ["q-leakage-reproducibility-model-card-capstone-core"], artifactIds: ["model-card", "no-deploy-review"] },
      ],
    },
  },
});
