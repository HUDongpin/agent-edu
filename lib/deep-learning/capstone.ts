import type { CourseKitCapstoneArtifactAuthoringSeed } from "../course-kit/authoring";
import {
  COURSE_KIT_CAPSTONE_SCHEMA_VERSION,
  type CourseKitCapstone,
  type CourseKitNonEmpty,
} from "../course-kit/types";
import type { DeepLearningSourceId } from "./sources";

export const DEEP_LEARNING_CAPSTONE_VERSION = "2026.08.26-capstone-v1";

export const DEEP_LEARNING_CAPSTONE_ARTIFACTS = [
  {
    id: "environment-lock",
    sourceIds: ["dl05-training-reproducibility"],
    copy: {
      en: {
        title: "Environment and data lock",
        description:
          "Machine, accelerator, operating system, framework and dependency versions; code, fixture and schema hashes; seed policy; deterministic-setting limits; data-rights note; and exact reconstruction commands.",
      },
      zhHans: {
        title: "环境与数据锁定",
        description:
          "机器、加速器、操作系统、框架与依赖版本；代码、fixture 与 schema 哈希；种子政策；确定性设置限制；数据权利说明；以及精确重建命令。",
      },
    },
  },
  {
    id: "training-log",
    sourceIds: ["dl03-optimisation-adam", "dl05-training-reproducibility"],
    copy: {
      en: {
        title: "Complete training log",
        description:
          "Every attempted run, configuration, split receipt, metric definition, train/evaluation mode, checkpoint, failure, stop reason, elapsed time and reviewer-visible exception—not only the best run.",
      },
      zhHans: {
        title: "完整训练日志",
        description:
          "记录每次尝试的运行、配置、切分收据、指标定义、训练/评估模式、checkpoint、失败、停止理由、耗时与审查者可见异常，而不只是最佳运行。",
      },
    },
  },
  {
    id: "cost-energy-record",
    sourceIds: ["dl05-training-reproducibility", "ra12-model-cards"],
    copy: {
      en: {
        title: "Compute, cost, and energy proxy record",
        description:
          "Declared measurement boundary, hardware-hours, wall time, peak memory, run count, failed-run cost, monetary estimate, energy proxy, uncertainty, and the decisions those measurements did and did not inform.",
      },
      zhHans: {
        title: "计算、成本与能耗代理记录",
        description:
          "声明测量边界、硬件小时、墙钟时间、峰值内存、运行次数、失败运行成本、金额估计、能耗代理、不确定性，以及这些测量支持和不支持的决策。",
      },
    },
  },
  {
    id: "error-slices",
    sourceIds: ["dl13-robustness", "ra12-model-cards"],
    copy: {
      en: {
        title: "Error and robustness slices",
        description:
          "Clean, corrupted and subgroup-like synthetic slices with denominators, uncertainty, representative errors, transformation receipts, selection rationale, missing tests, and explicit limits on generalisation.",
      },
      zhHans: {
        title: "错误与鲁棒性切片",
        description:
          "包含分母、不确定性、代表性错误、转换收据、选择理由、未做测试与明确泛化限制的干净、corruption 及合成类子群切片。",
      },
    },
  },
  {
    id: "ablation",
    sourceIds: ["dl03-optimisation-adam", "dl04-normalisation-regularisation"],
    copy: {
      en: {
        title: "Controlled ablation",
        description:
          "A predeclared, budget-matched comparison that changes one factor at a time, preserves all run receipts, reports multiple seeds and uncertainty, and refuses causal claims beyond the tested intervention.",
      },
      zhHans: {
        title: "受控消融实验",
        description:
          "预先声明、预算匹配、一次只改变一个因素的比较；保留全部运行收据，报告多种子与不确定性，并拒绝超出已测试干预的因果声明。",
      },
    },
  },
  {
    id: "training-card",
    sourceIds: ["ra12-model-cards", "dl13-robustness"],
    copy: {
      en: {
        title: "Training card",
        description:
          "Model purpose, architecture, data and rights boundary, optimisation, evaluation conditions, slice results, compute, intended and excluded uses, ethical considerations, owners, version and evidence-linked claims.",
      },
      zhHans: {
        title: "训练卡",
        description:
          "模型目的、架构、数据与权利边界、优化方法、评估条件、切片结果、计算资源、预期与排除用途、伦理考虑、负责人、版本及证据链接声明。",
      },
    },
  },
  {
    id: "limitations",
    sourceIds: ["dl13-robustness", "ra12-model-cards"],
    copy: {
      en: {
        title: "Limitations and no-go register",
        description:
          "Known failures, untested populations and shifts, data-rights uncertainties, safety and misuse risks, cost ceilings, invalid uses, stop conditions, remediation owners, and a real no-train/no-deploy path.",
      },
      zhHans: {
        title: "限制与禁止事项登记册",
        description:
          "已知失败、未测群体与漂移、数据权利不确定性、安全与滥用风险、成本上限、无效用途、停止条件、修复负责人，以及真实可用的 no-train/no-deploy 路径。",
      },
    },
  },
  {
    id: "reproducibility-receipt",
    sourceIds: ["dl05-training-reproducibility"],
    copy: {
      en: {
        title: "Independent reproducibility receipt",
        description:
          "A clean-room rerun by a named reviewer with command transcript, input and output hashes, tolerated numerical differences, failed checks, unresolved platform variance, decision and signed date.",
      },
      zhHans: {
        title: "独立可复现收据",
        description:
          "由具名审查者完成的 clean-room 重跑，包含命令记录、输入输出哈希、允许数值差异、失败检查、未解决平台差异、决定与签署日期。",
      },
    },
  },
] as const satisfies CourseKitNonEmpty<
  CourseKitCapstoneArtifactAuthoringSeed<string, DeepLearningSourceId>
>;

export type DeepLearningCapstoneArtifactId =
  (typeof DEEP_LEARNING_CAPSTONE_ARTIFACTS)[number]["id"];

export const DEEP_LEARNING_CAPSTONE = {
  schemaVersion: COURSE_KIT_CAPSTONE_SCHEMA_VERSION,
  version: DEEP_LEARNING_CAPSTONE_VERSION,
  artifacts: DEEP_LEARNING_CAPSTONE_ARTIFACTS.map((artifact) => ({
    id: artifact.id,
    sourceIds: artifact.sourceIds,
    required: true as const,
  })) as unknown as CourseKitCapstone<
    DeepLearningCapstoneArtifactId,
    DeepLearningSourceId
  >["artifacts"],
  evidenceContract: {
    schemaId: "aicourse.deep-learning.capstone.v1",
    schemaPath: "/courses/deep-learning/lab/capstone.schema.json",
    validatorId: "aicourse.deep-learning.validator.v1",
    validatorPath: "/courses/deep-learning/lab/validate.py",
    validatorCommand: "python public/courses/deep-learning/lab/validate.py --package <artifact-package.json>",
  },
} satisfies CourseKitCapstone<
  DeepLearningCapstoneArtifactId,
  DeepLearningSourceId
>;
