import type { CourseKitCapstoneArtifactAuthoringSeed } from "../course-kit/authoring";
import {
  COURSE_KIT_CAPSTONE_SCHEMA_VERSION,
  type CourseKitCapstone,
  type CourseKitNonEmpty,
} from "../course-kit/types";
import type { DeepLearningSourceId } from "./sources";

export const DEEP_LEARNING_CAPSTONE_VERSION = "2026.08.28-capstone-v2";

export const DEEP_LEARNING_CAPSTONE_ARTIFACTS = [
  {
    id: "environment-lock",
    sourceIds: ["dl03-pytorch-training-state-2-13"],
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
    id: "run-ledger",
    sourceIds: ["dl03-pytorch-training-state-2-13", "dl04-pytorch-optim-2-13"],
    copy: {
      en: {
        title: "Three-or-more-seed run ledger",
        description:
          "At least three declared seeds with every attempted run, configuration, split receipt, metric definition, train/evaluation mode, checkpoint, stop reason, elapsed time and linked module-artifact receipt—not only the best run.",
      },
      zhHans: {
        title: "至少三种子的运行台账",
        description:
          "记录至少三个声明种子的每次运行、配置、切分收据、指标定义、训练/评估模式、checkpoint、停止理由、耗时及连接的模块产物收据，而不只是最佳运行。",
      },
    },
  },
  {
    id: "failure-ledger",
    sourceIds: ["dl03-pytorch-training-state-2-13", "ra12-model-cards"],
    copy: {
      en: {
        title: "Failure and recovery ledger",
        description:
          "Every failed, interrupted, rejected, or excluded run with seed, observed symptom, triggered invariant, retained evidence, recovery action, disposition, owner, and link back to the run ledger.",
      },
      zhHans: {
        title: "失败与恢复台账",
        description:
          "记录每次失败、中断、拒绝或排除运行的种子、现象、触发 invariant、保留证据、恢复动作、处置、负责人及其 run ledger 链接。",
      },
    },
  },
  {
    id: "resource-record",
    sourceIds: ["dl03-pytorch-training-state-2-13", "ra12-model-cards"],
    copy: {
      en: {
        title: "Compute, cost, and energy-proxy record",
        description:
          "Declared measurement boundary, hardware and runtime, wall time, peak memory, run and failed-run counts, monetary estimate, energy proxy, uncertainty, and decisions those measurements do and do not inform.",
      },
      zhHans: {
        title: "计算、成本与能耗代理记录",
        description:
          "声明测量边界、硬件与 runtime、墙钟时间、峰值内存、运行与失败运行数、金额估计、能耗代理、不确定性，以及测量支持和不支持的决定。",
      },
    },
  },
  {
    id: "evaluation-slices",
    sourceIds: ["dl13-robustness", "dl12-calibration-paper", "ra12-model-cards"],
    copy: {
      en: {
        title: "Evaluation, calibration, and robustness slices",
        description:
          "Clean, corrupted, calibration, error, and synthetic subgroup-like slices with denominators, uncertainty, representative errors, transformation receipts, one controlled ablation, missing tests, and explicit generalisation limits.",
      },
      zhHans: {
        title: "评估、校准与鲁棒性切片",
        description:
          "包含分母、不确定性、代表性错误、变换收据、一项受控消融、未做测试与显式泛化限制的干净、corruption、校准、错误及合成类子群切片。",
      },
    },
  },
  {
    id: "training-dossier",
    sourceIds: ["ra12-model-cards", "dl13-robustness", "dl12-calibration-paper"],
    copy: {
      en: {
        title: "Course-local training dossier",
        description:
          "A course-local dossier—not a certification—covering purpose, architecture, data and rights, optimization, evaluation, resources, intended and excluded uses, owners, version, and claims linked to the exact run/failure/module receipts.",
      },
      zhHans: {
        title: "课程本地训练档案",
        description:
          "这是课程本地档案而非认证，覆盖目的、架构、数据与权利、优化、评估、资源、预期/排除用途、负责人、版本，以及连接确切 run/failure/module 收据的声明。",
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
    id: "reviewer-decision",
    sourceIds: ["dl03-pytorch-training-state-2-13", "ra12-model-cards"],
    copy: {
      en: {
        title: "Named reviewer challenge and no-deploy decision",
        description:
          "A named human review with independent challenge, command or evidence transcript, input/output hashes, failed checks, unresolved variance, remediation, explicit no-deploy or stricter decision, rationale, and signed date.",
      },
      zhHans: {
        title: "具名审查挑战与 no-deploy 决定",
        description:
          "具名人类审查包含独立 challenge、命令或证据记录、输入输出哈希、失败检查、未解决差异、修复、显式 no-deploy 或更严格决定、理由与签署日期。",
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
    schemaId: "aicourse.deep-learning.capstone.v2",
    schemaPath: "/courses/deep-learning/lab/capstone.schema.json",
    validatorId: "aicourse.deep-learning.validator.v2",
    validatorPath: "/courses/deep-learning/lab/validate_capstone.py",
    validatorCommand: "python3 public/courses/deep-learning/lab/validate_capstone.py --package <learner-package.json> --receipt-dir <receipt-directory>",
  },
  referenceEvidenceContract: {
    schemaId: "aicourse.deep-learning.reference-package.v2",
    schemaPath: "/courses/deep-learning/lab/reference.schema.json",
    validatorId: "aicourse.deep-learning.reference-validator.v1",
    validatorPath: "/courses/deep-learning/lab/validate_reference.py",
    validatorCommand: "python3 public/courses/deep-learning/lab/validate_reference.py --package <reference-package.json>",
  },
} satisfies CourseKitCapstone<
  DeepLearningCapstoneArtifactId,
  DeepLearningSourceId
>;
