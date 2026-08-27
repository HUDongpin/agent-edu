import { buildCourseKitDefinition } from "../course-kit/authoring";
import {
  RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_EN,
  RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_ZH_HANS,
  RESPONSIBLE_AI_RUBRIC_VERSION,
} from "../course-kit/responsible-ai-rubric";
import {
  DEEP_LEARNING_CAPSTONE_ARTIFACTS,
  DEEP_LEARNING_CAPSTONE_VERSION,
} from "./capstone";
import { DEEP_LEARNING_MODULES } from "./modules";
import {
  DEEP_LEARNING_QUESTION_BANK,
  DEEP_LEARNING_QUIZ_VERSION,
} from "./quiz";
import { DEEP_LEARNING_SOURCE_SEEDS } from "./sources";

/**
 * The complete, serialisable Course 20 contract. Construction is fail-closed:
 * the shared builder materialises every versioned schema and runs its validator.
 */
export const DEEP_LEARNING_COURSE = buildCourseKitDefinition({
  manifest: {
    id: "deep-learning",
    version: "2026.08.26-v1",
    displayNumber: 20,
    publishedOn: "2026-08-26",
    milestoneCount: 14,
    phases: [
      {
        id: "gradient-foundations",
        copy: {
          en: {
            title: "Gradient foundations",
            summary:
              "Make tensor semantics, derivatives, optimisation choices, train/evaluation state, and reproduction limits inspectable before increasing model scale.",
          },
          zhHans: {
            title: "梯度基础",
            summary:
              "在扩大模型规模前，使 tensor 语义、导数、优化选择、训练/评估状态与复现限制可检查。",
          },
        },
      },
      {
        id: "representation-systems",
        copy: {
          en: {
            title: "Representation systems",
            summary:
              "Compare convolution, transfer, recurrence, and attention through controlled tasks, explicit masks, bounded claims, and reviewable artifacts.",
          },
          zhHans: {
            title: "表示系统",
            summary:
              "通过受控任务、显式 mask、有边界声明与可审查产物比较卷积、迁移、递归与 attention。",
          },
        },
      },
      {
        id: "transformers-and-adaptation",
        copy: {
          en: {
            title: "Transformers and adaptation",
            summary:
              "Trace encoder–decoder information flow, audit tokenisation and pretraining boundaries, and compare full with parameter-efficient adaptation.",
          },
          zhHans: {
            title: "Transformer 与适配",
            summary:
              "追踪 encoder–decoder 信息流，审计 tokenisation 与预训练边界，并比较全量与参数高效适配。",
          },
        },
      },
      {
        id: "assurance-and-capstone",
        copy: {
          en: {
            title: "Assurance and capstone",
            summary:
              "Turn clean, corrupted, slice, cost, ablation, and reproducibility results into a bounded training card with a genuine human no-go path.",
          },
          zhHans: {
            title: "保障与毕业项目",
            summary:
              "把干净、corruption、切片、成本、消融与复现结果整理为有边界 training card，并保留真实的人类否决路径。",
          },
        },
      },
    ],
  },
  sources: DEEP_LEARNING_SOURCE_SEEDS,
  modules: DEEP_LEARNING_MODULES,
  courseCopy: {
    en: {
      meta: {
        title: "Deep Learning and Transformers",
        kicker: "Course 20 · Auditable neural-network training",
        summary:
          "Build neural models from tensor and gradient contracts through convolution, sequences, attention, Transformers, adaptation, robustness evaluation, and a reviewer-ready training card.",
        audience:
          "Learners who can train and evaluate conventional machine-learning baselines and now need a disciplined bridge to neural systems.",
        prerequisite:
          "Course 19 or equivalent supervised-learning, evaluation, Python, NumPy, and basic linear-algebra experience. The course does not assume production deployment authority.",
        level: "Intermediate to advanced",
        duration:
          "900 minutes across 12 modules, a deterministic 16-question final draw, and an eight-artifact capstone",
        evidenceNote:
          "Official documentation is pinned to the 2026-08-26 access boundary and original research is treated as historically bounded evidence. Every implementation claim must be rechecked against the installed version, hardware, fixture, data rights, seeds, and measurement conditions.",
      },
      principles: [
        "Prove tensor shape, dtype, device, graph, gradient, and loss semantics on a hand-checkable case before scaling.",
        "Keep train, validation, and test boundaries—and train/evaluation modes—explicit and mechanically checked.",
        "Treat architecture and optimiser choices as hypotheses tested under matched budgets, not as universal recipes.",
        "Version code, dependencies, hardware, data, schemas, seeds, masks, checkpoints, metrics, and every failed run.",
        "Separate clean performance, robustness, subgroup-like slices, calibration, compute, cost, energy proxies, and rights review.",
        "Require a named human to decide continue, revise, no-train, or no-deploy; course completion never grants deployment authority.",
      ],
      outcomes: [
        "Specify and debug tensor programs and computational graphs with executable shape and gradient assertions.",
        "Derive and numerically check backpropagation for a small network while documenting approximation limits.",
        "Compare optimisation, initialisation, normalisation, and regularisation under a controlled budget.",
        "Implement a reproducible training/validation loop with modes, checkpoints, early stopping, and failure receipts.",
        "Build and inspect a convolutional baseline without overclaiming transfer to a new visual domain.",
        "Compare frozen-feature and fine-tuning transfer strategies while auditing data rights and domain mismatch.",
        "Construct a recurrent sequence baseline with explicit padding, masking, state reset, and leakage checks.",
        "Trace attention scores and outputs while refusing to equate weights with causal explanations.",
        "Trace Transformer encoder–decoder paths, positional information, and causal/padding mask orientation.",
        "Audit tokenisation and pretraining objectives for vocabulary coverage, leakage, rights, and downstream mismatch.",
        "Compare full fine-tuning with parameter-efficient adaptation and inventory every trainable parameter and artifact.",
        "Deliver a reviewer-signed training dossier linking robustness, cost, limitations, reproducibility, and no-go conditions.",
      ],
      quiz: {
        title: "Deep Learning final assessment",
        intro:
          "A deterministic 16-question draw is selected from a 36-question bilingual bank. Score at least 13 and answer every selected critical reproducibility, leakage, data-rights, and human-authority question correctly.",
      },
      capstone: {
        title: "Auditable neural-training dossier",
        intro:
          "Train only against the original synthetic course fixture, then show what happened, what failed, what the evidence does not support, and who retains authority to stop training or deployment.",
        instructions: [
          "Verify fixture, schema, code, and environment hashes before the first run; record hardware, versions, seeds, deterministic settings, data-rights boundary, and known platform variance.",
          "Preserve every run—including failures—and reconcile configurations, split receipts, metrics, checkpoints, elapsed time, memory, compute, cost, and energy proxies.",
          "Complete all eight required artifacts and link each training-card claim to the exact run, slice, ablation, limitation, or reproduction receipt that supports it.",
          "Ask an independent named reviewer to reproduce the declared run, challenge at least one robustness or rights claim, and record continue, revise, no-train, or no-deploy with rationale.",
        ],
        responsibleAiRubric: RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_EN,
        attestation:
          "I verified the fixed synthetic fixture and versioned environment, retained failed runs and uncertainty, traced every submitted claim to bounded evidence, disclosed untested conditions and rights limits, and left the final train/deploy decision with a named human reviewer.",
      },
    },
    zhHans: {
      meta: {
        title: "深度学习与 Transformer",
        kicker: "课程 20 · 可审计的神经网络训练",
        summary:
          "从 tensor 与梯度合同出发，逐步学习卷积、序列、attention、Transformer、适配与鲁棒性评估，最终交付可供审查的 training card。",
        audience:
          "已经能够训练和评估传统机器学习基线、现在需要严谨进入神经系统的学习者。",
        prerequisite:
          "课程 19 或同等的监督学习、评估、Python、NumPy 与基础线性代数经验。本课程不预设任何生产部署权限。",
        level: "中级至高级",
        duration:
          "12 个模块共 900 分钟，另含 16 题确定性抽题终测与八产物毕业项目",
        evidenceNote:
          "官方文档钉定于 2026-08-26 访问边界，原始研究作为有历史边界的证据处理。所有实现声明都必须针对实际安装版本、硬件、fixture、数据权利、种子与测量条件重新核验。",
      },
      principles: [
        "扩大规模前，先在可手工核对案例中证明 tensor 形状、类型、设备、图、梯度与损失语义。",
        "显式且机械地检查训练、验证、测试边界以及 train/eval 模式。",
        "把架构与优化器选择视为在匹配预算下检验的假设，而非通用配方。",
        "版本化代码、依赖、硬件、数据、schema、种子、mask、checkpoint、指标与每次失败运行。",
        "分开评估干净表现、鲁棒性、类子群切片、校准、计算、成本、能耗代理与权利。",
        "要求具名人类决定继续、修订、no-train 或 no-deploy；完成课程绝不授予部署权。",
      ],
      outcomes: [
        "用可执行的形状与梯度断言定义并调试 tensor 程序和计算图。",
        "为小型网络推导并数值检查反向传播，同时记录近似限制。",
        "在受控预算下比较优化、初始化、归一化与正则化。",
        "实现含模式、checkpoint、早停与失败收据的可复现训练/验证循环。",
        "建立并检查卷积基线，同时不夸大其对新视觉领域的迁移。",
        "比较冻结特征与微调策略，并审计数据权利与领域不匹配。",
        "以显式 padding、mask、状态重置与泄漏检查构建递归序列基线。",
        "追踪 attention 分数与输出，同时拒绝把权重等同于因果解释。",
        "追踪 Transformer encoder–decoder 路径、位置信息及 causal/padding mask 方向。",
        "审计 tokenisation 与预训练目标的词表覆盖、泄漏、权利及下游不匹配。",
        "比较全量微调与参数高效适配，并清点每个可训练参数和产物。",
        "交付由审查者签署、连接鲁棒性、成本、限制、复现与停止条件的训练档案。",
      ],
      quiz: {
        title: "深度学习终测",
        intro:
          "系统从 36 道双语题中确定性抽取 16 题。至少答对 13 题，并答对所有被抽中的可复现、泄漏、数据权利与人类决定权关键题。",
      },
      capstone: {
        title: "可审计神经训练档案",
        intro:
          "只使用原创合成课程 fixture 训练，并说明发生了什么、哪些地方失败、证据不支持什么，以及谁保留停止训练或部署的权力。",
        instructions: [
          "首次运行前验证 fixture、schema、代码与环境哈希；记录硬件、版本、种子、确定性设置、数据权利边界与已知平台差异。",
          "保留包括失败在内的每次运行，并核对配置、切分收据、指标、checkpoint、耗时、内存、计算、成本与能耗代理。",
          "完成全部八项必需产物，并把 training card 的每项声明连接到确切运行、切片、消融、限制或复现收据。",
          "请独立具名审查者复现声明运行、挑战至少一项鲁棒性或权利声明，并记录继续、修订、no-train 或 no-deploy 及理由。",
        ],
        responsibleAiRubric: RESPONSIBLE_AI_CROSS_COURSE_RUBRIC_ZH_HANS,
        attestation:
          "我已验证固定合成 fixture 与版本化环境，保留失败运行和不确定性，把每项提交声明追溯到有边界证据，披露未测试条件与权利限制，并把最终训练/部署决定留给具名人类审查者。",
      },
    },
  },
  quiz: {
    version: DEEP_LEARNING_QUIZ_VERSION,
    questions: DEEP_LEARNING_QUESTION_BANK,
  },
  capstone: {
    version: DEEP_LEARNING_CAPSTONE_VERSION,
    artifacts: DEEP_LEARNING_CAPSTONE_ARTIFACTS,
    responsibleAiGate: {
      version: RESPONSIBLE_AI_RUBRIC_VERSION,
      criteria: [
        { id: "purpose-risk-stop", questionIds: ["q-fine-tuning-parameter-efficient-adaptation-boundary"], artifactIds: ["limitations", "training-card"] },
        { id: "data-rights-minimisation", questionIds: ["q-tokenisation-pretraining-boundary"], artifactIds: ["training-card", "reproducibility-receipt"] },
        { id: "subgroups-uncertainty", questionIds: ["q-robustness-evaluation-training-card-capstone-boundary"], artifactIds: ["error-slices", "limitations"] },
        { id: "human-authority-recourse", questionIds: ["q-fine-tuning-parameter-efficient-adaptation-boundary"], artifactIds: ["limitations", "training-card"] },
        { id: "challenge-incident-recovery", questionIds: ["q-training-loops-debugging-boundary"], artifactIds: ["ablation", "training-log"] },
        { id: "evidence-decision-expiry", questionIds: ["q-transformer-encoder-decoder-core", "q-robustness-evaluation-training-card-capstone-boundary"], artifactIds: ["training-card", "reproducibility-receipt"] },
      ],
    },
  },
});
