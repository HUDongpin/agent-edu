import { createHash } from "node:crypto";

import type { CourseKitEvidenceMode } from "../course-kit/types";
import { DEEP_LEARNING_MODULES, type DeepLearningModuleSlug } from "./modules";
import {
  DEEP_LEARNING_SOURCE_SEEDS,
  type DeepLearningSourceId,
} from "./sources";

export interface DeepLearningClaimRecord {
  readonly id: string;
  readonly moduleSlug: DeepLearningModuleSlug;
  readonly sectionIndex: 0 | 1 | 2;
  readonly paragraphIndex: number;
  readonly evidenceMode: CourseKitEvidenceMode;
  readonly claim: string;
  readonly claimZhHans: string;
  readonly sourceId?: DeepLearningSourceId;
  readonly evidenceUrl?: string;
  /** Exact page, section, API heading, or course-contract locator. */
  readonly locator: string;
  readonly boundary: string;
  readonly boundaryZhHans: string;
}

type LocatedClaim = Pick<
  DeepLearningClaimRecord,
  | "id"
  | "moduleSlug"
  | "sectionIndex"
  | "claim"
  | "claimZhHans"
  | "locator"
> & { readonly paragraphIndex?: number };

function sourceClaim(
  input: LocatedClaim & {
    readonly sourceId: DeepLearningSourceId;
    readonly evidenceUrlIndex?: number;
    readonly evidenceMode?: "source-grounded" | "version-watch";
    readonly boundary?: string;
    readonly boundaryZhHans?: string;
  },
): DeepLearningClaimRecord {
  const {
    sourceId,
    evidenceUrlIndex = 0,
    evidenceMode = "source-grounded",
    boundary,
    boundaryZhHans,
    ...claim
  } = input;
  const source = DEEP_LEARNING_SOURCE_SEEDS.find(
    (candidate) => candidate.record.id === sourceId,
  );
  const evidenceUrl = source?.record.evidenceUrls[evidenceUrlIndex];
  if (!source || !evidenceUrl) {
    throw new Error(
      `Missing Deep Learning claim evidence: ${sourceId}[${evidenceUrlIndex}]`,
    );
  }
  return {
    ...claim,
    paragraphIndex: claim.paragraphIndex ?? 0,
    evidenceMode,
    sourceId,
    evidenceUrl,
    boundary: boundary ?? source.record.boundary,
    boundaryZhHans: boundaryZhHans ?? source.zhHans.boundary,
  };
}

function ownedClaim(
  input: LocatedClaim & {
    readonly evidenceMode: "instructional-synthesis" | "course-policy";
    readonly boundary: string;
    readonly boundaryZhHans: string;
  },
): DeepLearningClaimRecord {
  return { ...input, paragraphIndex: input.paragraphIndex ?? 0 };
}

/**
 * Atomic Course 20 publication ledger.
 *
 * Module and section source IDs are only a reading set. They do not transfer
 * support to a paragraph. This ledger is the narrower claim contract: every
 * externally grounded atom names one source, one exact evidence URL, one exact
 * locator, and a bilingual boundary. Course synthesis and course policy remain
 * visibly course-owned and intentionally have no source/evidence URL.
 */
export const DEEP_LEARNING_CLAIMS: readonly DeepLearningClaimRecord[] = [
  sourceClaim({
    id: "c20-m1-p1-tensor-attributes",
    moduleSlug: "tensors-computational-graphs",
    sectionIndex: 0,
    sourceId: "dl01-pytorch-tensors-autograd-2-13",
    claim: "PyTorch tensors carry dtype, device, layout, and stride metadata in addition to numerical values and shape.",
    claimZhHans: "PyTorch tensor 除数值与形状外，还携带 dtype、device、layout 与 stride 元数据。",
    locator: "PyTorch 2.13 Tensor documentation — Tensor Attributes and torch.Tensor",
  }),
  sourceClaim({
    id: "c20-m1-p1-broadcasting",
    moduleSlug: "tensors-computational-graphs",
    sectionIndex: 0,
    sourceId: "dl01-pytorch-tensors-autograd-2-13",
    evidenceUrlIndex: 2,
    claim: "PyTorch broadcasting expands compatible dimensions according to documented trailing-dimension rules without requiring a conceptual expanded grid to be materialised.",
    claimZhHans: "PyTorch 广播依照文档中的尾部维度规则扩展兼容维度，而不要求把概念上的完整网格实体化。",
    locator: "PyTorch 2.13 Broadcasting semantics — General semantics",
  }),
  sourceClaim({
    id: "c20-m1-p1-autograd-graph",
    moduleSlug: "tensors-computational-graphs",
    sectionIndex: 0,
    sourceId: "dl01-pytorch-tensors-autograd-2-13",
    evidenceUrlIndex: 3,
    claim: "When gradient tracking is enabled, PyTorch autograd records an operation graph used to compute reverse-mode derivatives.",
    claimZhHans: "启用梯度追踪时，PyTorch autograd 会记录运算图，用于计算反向模式导数。",
    locator: "PyTorch 2.13 Autograd documentation — Computational graph and automatic differentiation",
  }),
  sourceClaim({
    id: "c20-m1-p1-view-copy-storage",
    moduleSlug: "tensors-computational-graphs",
    sectionIndex: 0,
    sourceId: "dl01-pytorch-tensors-autograd-2-13",
    evidenceUrlIndex: 1,
    claim: "PyTorch 2.13 distinguishes tensor views, which share underlying storage with a base tensor, from operations that allocate copied storage.",
    claimZhHans: "PyTorch 2.13 区分与 base tensor 共享底层 storage 的 view，以及分配复制 storage 的操作。",
    locator: "PyTorch 2.13 Tensor Views — view semantics, contiguous tensors, reshape, and copy behavior",
  }),
  sourceClaim({
    id: "c20-m1-p1-device-transition",
    moduleSlug: "tensors-computational-graphs",
    sectionIndex: 0,
    sourceId: "dl01-pytorch-tensors-autograd-2-13",
    claim: "PyTorch tensor attributes include the device on which tensor storage resides, so device placement is part of the executable tensor contract.",
    claimZhHans: "PyTorch tensor 属性包含 storage 所在 device，因此设备位置属于可执行 tensor 合同。",
    locator: "PyTorch 2.13 Tensor documentation — Tensor Attributes and device",
  }),
  ownedClaim({
    id: "c20-m1-p2-ledger-method",
    moduleSlug: "tensors-computational-graphs",
    sectionIndex: 1,
    evidenceMode: "instructional-synthesis",
    claim: "The course requires a semantic-axis and expected-failure ledger before scaling a tensor computation.",
    claimZhHans: "课程要求在扩展 tensor 计算前建立语义轴与预期失败账本。",
    locator: "Course 20 v2 synthesis — M1 tensor-graph-ledger method",
    boundary: "This is a course-designed audit method, not a claim that PyTorch prescribes one universal ledger format.",
    boundaryZhHans: "这是课程设计的审计方法，并非声称 PyTorch 规定了唯一通用的账本格式。",
  }),
  sourceClaim({
    id: "c20-m1-p3-broadcast-boundary",
    moduleSlug: "tensors-computational-graphs",
    sectionIndex: 2,
    sourceId: "dl01-pytorch-tensors-autograd-2-13",
    evidenceUrlIndex: 2,
    claim: "PyTorch broadcasting compares trailing dimensions and treats dimensions as compatible when their sizes are equal, one size is one, or one dimension is absent.",
    claimZhHans: "PyTorch 广播从尾部维度比较；尺寸相等、其中一个尺寸为一，或其中一个维度不存在时，维度被视为兼容。",
    locator: "PyTorch 2.13 Broadcasting semantics — trailing-dimension compatibility rules",
  }),
  ownedClaim({
    id: "c20-m1-p3-semantic-axis-risk",
    moduleSlug: "tensors-computational-graphs",
    sectionIndex: 2,
    evidenceMode: "instructional-synthesis",
    claim: "The course treats dimensional compatibility as insufficient evidence that a program paired the intended semantic axes.",
    claimZhHans: "课程把维度兼容视为不足以证明程序配对了预期语义轴。",
    locator: "Course 20 v2 synthesis — M1 semantic-axis failure contract",
    boundary: "This is a course-designed fault model derived from the gap between dimensional syntax and learner-declared semantics, not a claim made by the broadcasting API documentation.",
    boundaryZhHans: "这是课程基于维度语法与学习者声明语义之间差距设计的故障模型，不是 broadcasting API 文档直接提出的主张。",
  }),
  sourceClaim({
    id: "c20-m1-p3-mutation-detach-boundary",
    moduleSlug: "tensors-computational-graphs",
    sectionIndex: 2,
    sourceId: "dl01-pytorch-tensors-autograd-2-13",
    evidenceUrlIndex: 4,
    claim: "In-place operations and explicit gradient-disabling or detach boundaries can change or invalidate autograd connectivity.",
    claimZhHans: "原地操作以及显式关闭梯度或 detach 的边界会改变或破坏 autograd 连接。",
    locator: "PyTorch 2.13 Autograd mechanics — in-place correctness checks and locally disabling gradient computation",
  }),

  sourceClaim({
    id: "c20-m2-p1-backprop-chain-rule",
    moduleSlug: "backpropagation-autodiff",
    sectionIndex: 0,
    sourceId: "dl02-backpropagation",
    claim: "The classic multilayer-network procedure propagates output-error derivatives backward to adjust internal representations and parameters.",
    claimZhHans: "经典多层网络过程把输出误差导数向后传播，用于调整内部表示与参数。",
    locator: "Rumelhart, Hinton & Williams (1986), Nature 323, pp. 533–536 — learning procedure",
  }),
  sourceClaim({
    id: "c20-m2-p1-vector-jacobian-products",
    moduleSlug: "backpropagation-autodiff",
    sectionIndex: 0,
    sourceId: "dl01-pytorch-tensors-autograd-2-13",
    evidenceUrlIndex: 3,
    claim: "PyTorch autograd evaluates vector–Jacobian products over the recorded operation graph.",
    claimZhHans: "PyTorch autograd 在已记录的运算图上计算 vector–Jacobian product。",
    locator: "PyTorch 2.13 Autograd documentation — vector-Jacobian product and graph execution",
    boundary: "The calculation differentiates the recorded program; it does not determine whether that program or objective matches the learner's intended mathematics.",
    boundaryZhHans: "该计算对已记录程序求导；它不会判断程序或目标是否符合学习者预期的数学。",
  }),
  ownedClaim({
    id: "c20-m2-p2-three-way-gradient-proof",
    moduleSlug: "backpropagation-autodiff",
    sectionIndex: 1,
    evidenceMode: "instructional-synthesis",
    claim: "The course compares analytic, autograd, and central finite-difference gradients at declared step sizes and tolerances.",
    claimZhHans: "课程在声明的步长与容差下比较解析梯度、autograd 与中心有限差分。",
    locator: "Course 20 v2 synthesis — M2 gradient-check-report protocol",
    boundary: "This triangulation is a local implementation check; it does not establish that the selected loss, labels, or task are valid.",
    boundaryZhHans: "这种三路核对只是局部实现检查，不能证明所选损失、标签或任务有效。",
  }),
  sourceClaim({
    id: "c20-m2-p3-finite-difference-limits",
    moduleSlug: "backpropagation-autodiff",
    sectionIndex: 2,
    sourceId: "dl02-pytorch-gradcheck-2-13",
    claim: "Finite-difference gradcheck is tolerance-bounded and can be affected by nondifferentiability and numerical precision.",
    claimZhHans: "有限差分 gradcheck 受容差约束，并可能受不可微点与数值精度影响。",
    locator: "PyTorch 2.13 Gradcheck mechanics — finite differences, tolerances, nondifferentiable points, and precision notes",
  }),
  sourceClaim({
    id: "c20-m2-p3-historical-result-boundary",
    moduleSlug: "backpropagation-autodiff",
    sectionIndex: 2,
    sourceId: "dl02-backpropagation",
    claim: "The 1986 paper reports applying its back-propagation learning procedure to the tasks described in the publication.",
    claimZhHans: "1986 年论文报告了把其反向传播学习过程应用于论文所述任务。",
    locator: "Rumelhart, Hinton & Williams (1986), Nature 323, pp. 533–536 — reported experiments and scope",
    boundary: "Those reported tasks do not guarantee useful optimization or generalization for every modern architecture, loss, dataset, or system.",
    boundaryZhHans: "这些论文所报任务不能保证所有现代架构、损失、数据集或系统都能有效优化或泛化。",
  }),

  sourceClaim({
    id: "c20-m3-p1-train-eval-mode",
    moduleSlug: "training-loops-debugging",
    sectionIndex: 0,
    sourceId: "dl03-pytorch-training-state-2-13",
    claim: "PyTorch modules expose distinct training and evaluation modes that affect mode-sensitive layers.",
    claimZhHans: "PyTorch module 提供不同的训练与评估模式，并会影响对模式敏感的层。",
    locator: "PyTorch 2.13 Modules note — Module state and training/evaluation modes",
  }),
  sourceClaim({
    id: "c20-m3-p1-checkpoint-state",
    moduleSlug: "training-loops-debugging",
    sectionIndex: 0,
    sourceId: "dl03-pytorch-training-state-2-13",
    evidenceUrlIndex: 1,
    claim: "Optimizer continuation depends on serialized optimizer state and parameter-group metadata, not model weights alone.",
    claimZhHans: "优化器续训依赖序列化的优化器状态与参数组元数据，而不只依赖模型权重。",
    locator: "PyTorch 2.13 Optimizer.state_dict — state and param_groups return contract",
  }),
  sourceClaim({
    id: "c20-m3-p1-scheduler-state",
    moduleSlug: "training-loops-debugging",
    sectionIndex: 0,
    sourceId: "dl03-pytorch-training-state-2-13",
    evidenceUrlIndex: 3,
    claim: "PyTorch 2.13 learning-rate schedulers expose serializable scheduler state whose values participate in resumed scheduling behavior.",
    claimZhHans: "PyTorch 2.13 learning-rate scheduler 提供可序列化状态，其数值会参与恢复后的调度行为。",
    locator: "PyTorch 2.13 LRScheduler.state_dict — scheduler state serialization contract",
  }),
  sourceClaim({
    id: "c20-m3-p1-gradient-accumulation",
    moduleSlug: "training-loops-debugging",
    sectionIndex: 0,
    sourceId: "dl03-pytorch-training-state-2-13",
    claim: "PyTorch parameter gradients accumulate unless the training loop clears or resets them intentionally.",
    claimZhHans: "除非训练循环主动清除或重置，PyTorch 参数梯度会累积。",
    locator: "PyTorch 2.13 Modules note — gradients, zero_grad, and optimizer update lifecycle",
  }),
  ownedClaim({
    id: "c20-m3-p2-fault-injection-method",
    moduleSlug: "training-loops-debugging",
    sectionIndex: 1,
    evidenceMode: "instructional-synthesis",
    claim: "The course requires one-batch overfit plus named fault injections before a learner expands the training split.",
    claimZhHans: "课程要求学习者在扩大训练 split 前完成单批过拟合与具名故障注入。",
    locator: "Course 20 v2 synthesis — M3 training-state-receipt protocol",
    boundary: "One-batch overfit is a diagnostic for pipeline cooperation, not evidence of generalization or production fitness.",
    boundaryZhHans: "单批过拟合只是管线协同的诊断，不是泛化或生产适用性的证据。",
  }),
  sourceClaim({
    id: "c20-m3-p3-reproducibility-limit",
    moduleSlug: "training-loops-debugging",
    sectionIndex: 2,
    sourceId: "dl03-pytorch-training-state-2-13",
    evidenceUrlIndex: 2,
    claim: "PyTorch does not guarantee complete reproducibility across releases, commits, platforms, or CPU/GPU execution even when seeds are controlled.",
    claimZhHans: "即使控制随机种子，PyTorch 也不保证跨版本、提交、平台或 CPU/GPU 执行完全可复现。",
    locator: "PyTorch 2.13 Reproducibility note — reproducibility limitations and deterministic operations",
  }),

  sourceClaim({
    id: "c20-m4-p1-optimizer-state",
    moduleSlug: "optimisation-initialisation-normalisation-regularisation",
    sectionIndex: 0,
    sourceId: "dl04-pytorch-optim-2-13",
    claim: "PyTorch optimizers map gradients and optimizer state into parameter updates through an implementation-specific step interface.",
    claimZhHans: "PyTorch 优化器通过实现专属的 step 界面，把梯度与优化器状态映射为参数更新。",
    locator: "PyTorch 2.13 torch.optim — How to use an optimizer and per-parameter options",
  }),
  sourceClaim({
    id: "c20-m4-p1-adam",
    moduleSlug: "optimisation-initialisation-normalisation-regularisation",
    sectionIndex: 0,
    sourceId: "dl04-adam-paper",
    claim: "Adam proposes adaptive parameter updates using first- and second-moment estimates of gradients.",
    claimZhHans: "Adam 提出使用梯度的一阶与二阶矩估计进行自适应参数更新。",
    locator: "Kingma & Ba (2015), Adam — Algorithm 1 and Section 2",
  }),
  sourceClaim({
    id: "c20-m4-p1-adamw",
    moduleSlug: "optimisation-initialisation-normalisation-regularisation",
    sectionIndex: 0,
    sourceId: "dl04-adamw-paper",
    claim: "AdamW separates weight decay from the adaptive gradient update rather than treating it as ordinary L2 regularization.",
    claimZhHans: "AdamW 把 weight decay 与自适应梯度更新解耦，而不是把它当作普通 L2 正则化。",
    locator: "Loshchilov & Hutter, Decoupled Weight Decay Regularization — Sections 2–3",
  }),
  sourceClaim({
    id: "c20-m4-p1-initialisation",
    moduleSlug: "optimisation-initialisation-normalisation-regularisation",
    sectionIndex: 0,
    sourceId: "dl04-pytorch-initialisation-2-13",
    claim: "PyTorch 2.13 exposes explicit initialization functions whose parameters depend on layer and activation assumptions.",
    claimZhHans: "PyTorch 2.13 提供显式初始化函数，其参数依赖层与激活函数假设。",
    locator: "PyTorch 2.13 nn.init — Xavier and Kaiming initialization functions and parameter notes",
  }),
  sourceClaim({
    id: "c20-m4-p1-batch-normalisation",
    moduleSlug: "optimisation-initialisation-normalisation-regularisation",
    sectionIndex: 0,
    sourceId: "dl04-batch-normalization-paper",
    claim: "Batch Normalization normalizes activations using batch-derived statistics with distinct learned parameters and reported training behavior.",
    claimZhHans: "Batch Normalization 使用批次统计量归一化激活，并具有独立学习参数与论文所报训练行为。",
    locator: "Ioffe & Szegedy (2015), Batch Normalization — Sections 3 and 3.1",
  }),
  sourceClaim({
    id: "c20-m4-p1-dropout",
    moduleSlug: "optimisation-initialisation-normalisation-regularisation",
    sectionIndex: 0,
    sourceId: "dl04-dropout-paper",
    claim: "Dropout stochastically omits units during training and uses a different inference-time computation.",
    claimZhHans: "Dropout 在训练时随机省略单元，并在推理时采用不同的计算方式。",
    locator: "Srivastava et al. (2014), Dropout — Sections 2 and 3",
  }),
  ownedClaim({
    id: "c20-m4-p2-single-variable-ablation",
    moduleSlug: "optimisation-initialisation-normalisation-regularisation",
    sectionIndex: 1,
    evidenceMode: "instructional-synthesis",
    claim: "The course requires matched-budget, one-factor-at-a-time ablations across three declared seeds with failed runs retained.",
    claimZhHans: "课程要求在三个已声明种子上进行匹配预算、一次只改变一个因素的消融，并保留失败运行。",
    locator: "Course 20 v2 synthesis — M4 optimisation-ablation-report protocol",
    boundary: "This experimental design improves attribution inside the fixed fixture but does not create universal optimizer rankings.",
    boundaryZhHans: "该实验设计提高固定 fixture 内的归因能力，但不会产生普遍适用的优化器排名。",
  }),
  sourceClaim({
    id: "c20-m4-p3-adam-boundary",
    moduleSlug: "optimisation-initialisation-normalisation-regularisation",
    sectionIndex: 2,
    sourceId: "dl04-adam-paper",
    claim: "The Adam paper reports experiments on the models and tasks described in Sections 4 through 6.",
    claimZhHans: "Adam 论文在第 4 至 6 节报告了其所述模型与任务上的实验。",
    locator: "Kingma & Ba (2015), Adam — Sections 4–6, reported experiments and conclusions",
    boundary: "The reported experiments do not establish universal convergence or superiority for every architecture, objective, optimizer budget, and data regime.",
    boundaryZhHans: "论文所报实验不能证明其对所有架构、目标、优化预算与数据条件都普遍收敛或更优。",
  }),
  sourceClaim({
    id: "c20-m4-p3-adamw-boundary",
    moduleSlug: "optimisation-initialisation-normalisation-regularisation",
    sectionIndex: 2,
    sourceId: "dl04-adamw-paper",
    claim: "The AdamW paper treats decoupled weight decay as a separately tuned update component for adaptive optimization rather than ordinary L2 regularization.",
    claimZhHans: "AdamW 论文把解耦 weight decay 视为自适应优化中单独调节的更新组成，而不是普通 L2 正则化。",
    locator: "Loshchilov & Hutter, Decoupled Weight Decay Regularization — empirical scope and hyperparameter discussion",
    boundary: "The paper does not make weight decay interchangeable with Dropout or normalization; those mechanisms require separately controlled comparisons in the actual system.",
    boundaryZhHans: "论文不会使 weight decay 与 Dropout 或归一化可互换；这些机制必须在实际系统中分别进行受控比较。",
  }),
  sourceClaim({
    id: "c20-m4-p3-batchnorm-reported-scope",
    moduleSlug: "optimisation-initialisation-normalisation-regularisation",
    sectionIndex: 2,
    sourceId: "dl04-batch-normalization-paper",
    claim: "The Batch Normalization paper reports results for the architectures, datasets, and mini-batch conditions evaluated in Sections 4 and 5.",
    claimZhHans: "Batch Normalization 论文在第 4 与 5 节报告了所评估架构、数据集与 mini-batch 条件下的结果。",
    locator: "Ioffe & Szegedy (2015), Batch Normalization — Sections 4–5, reported experimental scope",
  }),
  sourceClaim({
    id: "c20-m4-p3-dropout-reported-scope",
    moduleSlug: "optimisation-initialisation-normalisation-regularisation",
    sectionIndex: 2,
    sourceId: "dl04-dropout-paper",
    claim: "The Dropout paper reports results for the architectures, datasets, dropout settings, and train/test computations evaluated in Sections 6 through 8.",
    claimZhHans: "Dropout 论文在第 6 至 8 节报告了所评估架构、数据集、dropout 设置与训练/测试计算下的结果。",
    locator: "Srivastava et al. (2014), Dropout — Sections 6–8, reported experimental scope",
  }),
  ownedClaim({
    id: "c20-m4-p3-mechanism-noninterchangeability",
    moduleSlug: "optimisation-initialisation-normalisation-regularisation",
    sectionIndex: 2,
    evidenceMode: "instructional-synthesis",
    claim: "The course treats weight decay, Dropout, and normalization as distinct mechanisms that cannot be substituted without a new controlled comparison.",
    claimZhHans: "课程把 weight decay、Dropout 与归一化视为不同机制；若无新的受控比较，不能互相替代。",
    locator: "Course 20 v2 synthesis — M4 mechanism-comparison boundary",
    boundary: "This is a course synthesis across distinct mechanisms, not a direct head-to-head conclusion reported by any one of the cited papers.",
    boundaryZhHans: "这是课程对不同机制的综合，不是任一所引论文直接报告的 head-to-head 结论。",
  }),

  sourceClaim({
    id: "c20-m5-p1-convolution",
    moduleSlug: "cnns-visual-representations",
    sectionIndex: 0,
    sourceId: "dl05-convolutional-document-recognition-paper",
    claim: "Convolutional networks use local connectivity and shared parameters to process spatially organized inputs.",
    claimZhHans: "卷积网络使用局部连接与共享参数处理具有空间组织的输入。",
    locator: "LeCun et al. (1998), Gradient-Based Learning Applied to Document Recognition — Sections II–III",
  }),
  sourceClaim({
    id: "c20-m5-p1-stacked-feature-maps",
    moduleSlug: "cnns-visual-representations",
    sectionIndex: 0,
    sourceId: "dl05-convolutional-document-recognition-paper",
    claim: "The document-recognition architecture stacks convolutional and subsampling stages so later feature maps depend on progressively larger regions of the input.",
    claimZhHans: "该文档识别架构堆叠 convolution 与 subsampling 阶段，使后续 feature map 依赖输入中逐步扩大的区域。",
    locator: "LeCun et al. (1998), Gradient-Based Learning Applied to Document Recognition — Section II, LeNet feature-map hierarchy",
  }),
  sourceClaim({
    id: "c20-m5-p1-residual-blocks",
    moduleSlug: "cnns-visual-representations",
    sectionIndex: 0,
    sourceId: "dl05-resnet-paper",
    claim: "Residual networks add identity shortcuts around learned transformations and were evaluated for training deeper image-recognition networks.",
    claimZhHans: "残差网络在学习变换外加入 identity shortcut，并在更深图像识别网络的训练中接受评估。",
    locator: "He et al. (2016), Deep Residual Learning — Sections 3.1–3.4",
  }),
  ownedClaim({
    id: "c20-m5-p2-visual-comparison",
    moduleSlug: "cnns-visual-representations",
    sectionIndex: 1,
    evidenceMode: "instructional-synthesis",
    claim: "The course compares linear, CNN, and residual models under one original synthetic-data and compute contract.",
    claimZhHans: "课程在同一原创合成数据与计算合同下比较 linear、CNN 与 residual 模型。",
    locator: "Course 20 v2 synthesis — M5 visual-baseline-audit protocol",
    boundary: "The controlled comparison supports only the course fixture and declared corruption slices.",
    boundaryZhHans: "该受控对照只支持课程 fixture 与已声明 corruption 切片。",
  }),
  ownedClaim({
    id: "c20-m5-p3-visual-domain-policy",
    moduleSlug: "cnns-visual-representations",
    sectionIndex: 2,
    evidenceMode: "course-policy",
    claim: "The course forbids generalizing synthetic-geometry or historical-benchmark results to sensitive visual domains without new evidence and authority.",
    claimZhHans: "课程禁止在没有新证据与权限时，把合成几何或历史基准结果推广到敏感视觉领域。",
    locator: "Course 20 v2 policy — M5 external-validity and high-impact-use boundary",
    boundary: "This is a conservative course release rule; it does not assert that every external visual task must fail.",
    boundaryZhHans: "这是保守的课程发布规则，并非断言所有外部视觉任务都会失败。",
  }),

  sourceClaim({
    id: "c20-m6-p1-transfer-patterns",
    moduleSlug: "transfer-learning",
    sectionIndex: 0,
    sourceId: "dl06-pytorch-transfer-snapshot-d445c1f",
    claim: "The pinned PyTorch tutorial demonstrates fine-tuning a pretrained network and using it as a fixed feature extractor on one small vision task.",
    claimZhHans: "固定提交的 PyTorch 教程在一个小型视觉任务上展示了预训练网络的完整微调与固定特征提取两种模式。",
    locator: "transfer_learning_tutorial.py at d445c1f — Finetuning the ConvNet and ConvNet as fixed feature extractor",
  }),
  ownedClaim({
    id: "c20-m6-p2-four-strategy-comparison",
    moduleSlug: "transfer-learning",
    sectionIndex: 1,
    evidenceMode: "instructional-synthesis",
    claim: "The course adds scratch, frozen, partial-unfreeze, and full comparisons under identical target-domain splits and budgets.",
    claimZhHans: "课程在相同目标域 split 与预算下加入 scratch、冻结、部分解冻与完整微调对照。",
    locator: "Course 20 v2 synthesis — M6 transfer-strategy-ledger protocol",
    boundary: "The four-way comparison is course-authored and extends beyond the two patterns demonstrated in the pinned tutorial.",
    boundaryZhHans: "四路对照由课程原创，范围超出固定教程展示的两种模式。",
  }),
  ownedClaim({
    id: "c20-m6-p3-transfer-authority-policy",
    moduleSlug: "transfer-learning",
    sectionIndex: 2,
    evidenceMode: "course-policy",
    claim: "The course requires a scratch baseline, source/target rights record, and no-use path when inherited weights or data are not authorized.",
    claimZhHans: "课程要求 scratch baseline、源域/目标域权利记录，以及在继承权重或数据未获授权时采用 no-use 路径。",
    locator: "Course 20 v2 policy — M6 rights, negative-transfer, and no-use gate",
    boundary: "This policy is not legal advice and cannot itself grant rights to a checkpoint or dataset.",
    boundaryZhHans: "该政策不是法律意见，也不能自行授予 checkpoint 或数据集使用权。",
  }),

  sourceClaim({
    id: "c20-m7-p1-recurrent-transition",
    moduleSlug: "sequence-models-rnns-lstms",
    sectionIndex: 0,
    sourceId: "dl07-lstm-paper",
    claim: "The LSTM paper describes conventional recurrent networks as updating hidden state from the current input and preceding recurrent state before introducing its gated alternative.",
    claimZhHans: "LSTM 论文在提出门控替代方案前，把传统递归网络描述为根据当前输入与先前递归状态更新 hidden state。",
    locator: "Hochreiter & Schmidhuber (1997), Long Short-Term Memory — Section 2, recurrent-network preliminaries",
  }),
  sourceClaim({
    id: "c20-m7-p1-lstm-gates",
    moduleSlug: "sequence-models-rnns-lstms",
    sectionIndex: 0,
    sourceId: "dl07-lstm-paper",
    claim: "LSTM introduces gated state and a cell pathway to address particular long-lag error-flow problems in recurrent learning.",
    claimZhHans: "LSTM 引入门控状态与 cell 路径，用于缓解递归学习中的特定长时距误差流问题。",
    locator: "Hochreiter & Schmidhuber (1997), Long Short-Term Memory — Sections 3–4",
  }),
  sourceClaim({
    id: "c20-m7-p1-lstm-api-shapes",
    moduleSlug: "sequence-models-rnns-lstms",
    sectionIndex: 0,
    sourceId: "dl07-pytorch-lstm-2-13",
    claim: "PyTorch 2.13 defines LSTM input, output, hidden-state, cell-state, layer, and bidirectionality shapes.",
    claimZhHans: "PyTorch 2.13 定义 LSTM 输入、输出、hidden state、cell state、层数与双向形状合同。",
    locator: "PyTorch 2.13 torch.nn.LSTM — Inputs, Outputs, and Variables",
  }),
  sourceClaim({
    id: "c20-m7-p1-packed-sequence",
    moduleSlug: "sequence-models-rnns-lstms",
    sectionIndex: 0,
    sourceId: "dl07-pytorch-packed-sequence-2-13",
    claim: "PackedSequence represents variable-length sequence batches through packed data and batch-size metadata.",
    claimZhHans: "PackedSequence 通过 packed data 与 batch-size 元数据表示变长序列批次。",
    locator: "PyTorch 2.13 PackedSequence — class contract and attributes",
  }),
  ownedClaim({
    id: "c20-m7-p1-task-mask-independence",
    moduleSlug: "sequence-models-rnns-lstms",
    sectionIndex: 0,
    evidenceMode: "instructional-synthesis",
    claim: "The course treats task-loss masking and state independence between examples as responsibilities separate from the LSTM and PackedSequence API shape contracts.",
    claimZhHans: "课程把 task-loss mask 与样本间状态独立视为独立于 LSTM 和 PackedSequence API 形状合同的责任。",
    locator: "Course 20 v2 synthesis — M7 task-mask and state-independence boundary",
    boundary: "This responsibility split is a course audit design; the cited APIs describe tensor and packed-sequence behavior but do not certify a learner's loss mask or dataset independence.",
    boundaryZhHans: "这种责任划分是课程审计设计；所引 API 描述 tensor 与 packed-sequence 行为，但不认证学习者的 loss mask 或数据独立性。",
  }),
  ownedClaim({
    id: "c20-m7-p2-sequence-audit",
    moduleSlug: "sequence-models-rnns-lstms",
    sectionIndex: 1,
    evidenceMode: "instructional-synthesis",
    claim: "The course requires explicit padding-loss exclusion, state reset, teacher-forcing declaration, and held-out-length evaluation.",
    claimZhHans: "课程要求显式排除 padding loss、重置状态、声明 teacher forcing，并评估未见长度。",
    locator: "Course 20 v2 synthesis — M7 sequence-state-mask-audit protocol",
    boundary: "These tests expose selected leakage and extrapolation failures but do not certify general sequence reasoning.",
    boundaryZhHans: "这些测试揭示特定泄漏与外推失败，但不认证通用序列推理能力。",
  }),
  ownedClaim({
    id: "c20-m7-p3-sequence-limit-policy",
    moduleSlug: "sequence-models-rnns-lstms",
    sectionIndex: 2,
    evidenceMode: "course-policy",
    claim: "The course does not accept average random-split accuracy as evidence of retention, compositional reasoning, or length extrapolation.",
    claimZhHans: "课程不把随机 split 的平均准确率当作记忆、组合推理或长度外推的证据。",
    locator: "Course 20 v2 policy — M7 leakage and extrapolation boundary",
    boundary: "This fail-closed rule does not imply that recurrent models can never learn useful sequence structure.",
    boundaryZhHans: "该 fail-closed 规则并不意味着递归模型永远无法学习有用的序列结构。",
  }),

  sourceClaim({
    id: "c20-m8-p1-additive-attention",
    moduleSlug: "attention",
    sectionIndex: 0,
    sourceId: "dl08-bahdanau-attention-paper",
    claim: "Bahdanau attention computes learned compatibility scores over encoder annotations and forms a weighted context for decoding.",
    claimZhHans: "Bahdanau attention 在 encoder annotation 上计算学习到的兼容分数，并为解码形成加权 context。",
    locator: "Bahdanau, Cho & Bengio (2015) — Sections 3.1–3.2, alignment model and context vector",
  }),
  sourceClaim({
    id: "c20-m8-p1-scaled-multihead-attention",
    moduleSlug: "attention",
    sectionIndex: 0,
    sourceId: "dl09-transformer-paper",
    claim: "The Transformer paper defines scaled dot-product attention and multi-head projections over queries, keys, and values.",
    claimZhHans: "Transformer 论文定义了作用于 query、key 与 value 的 scaled dot-product attention 与 multi-head projection。",
    locator: "Vaswani et al. (2017), Attention Is All You Need — Sections 3.2.1–3.2.2",
  }),
  sourceClaim({
    id: "c20-m8-p1-query-mask-softmax-values",
    moduleSlug: "attention",
    sectionIndex: 0,
    sourceId: "dl09-transformer-paper",
    claim: "Scaled dot-product attention forms query–key scores, applies the declared mask before softmax normalization, and uses the resulting weights to aggregate values.",
    claimZhHans: "Scaled dot-product attention 形成 query–key 分数，在 softmax 归一化前应用声明的 mask，并用所得权重聚合 value。",
    locator: "Vaswani et al. (2017), Attention Is All You Need — Section 3.2.1, scaled dot-product attention equation and masking",
  }),
  ownedClaim({
    id: "c20-m8-p1-explanation-separation",
    moduleSlug: "attention",
    sectionIndex: 0,
    evidenceMode: "instructional-synthesis",
    claim: "The course treats attention coefficients as computational intermediates rather than an automatic explanation layer.",
    claimZhHans: "课程把 attention coefficient 视为计算中间量，而不是自动解释层。",
    locator: "Course 20 v2 synthesis — M8 computation-versus-explanation distinction",
    boundary: "This course synthesis is informed by the separately cited interpretability debate; it does not claim that attention can never contribute to a bounded explanation.",
    boundaryZhHans: "该课程综合参考了另行引用的可解释性争论；它并不声称 attention 永远不能对有边界的解释作出贡献。",
  }),
  ownedClaim({
    id: "c20-m8-p2-mask-worksheet",
    moduleSlug: "attention",
    sectionIndex: 1,
    evidenceMode: "instructional-synthesis",
    claim: "The course worksheet fixes additive mask semantics, rejects all-masked rows, and checks zero blocked mass and unit valid mass within 1e-12.",
    claimZhHans: "课程工作表固定 additive mask 语义、拒绝全屏蔽行，并以 1e-12 容差检查被屏蔽概率为零及有效概率和为一。",
    locator: "Course 20 v2 synthesis — M8 attention-mask-worksheet numerical contract",
    boundary: "The tolerance and all-masked-row policy are course choices for this fixture, not universal defaults for every attention API.",
    boundaryZhHans: "该容差与全屏蔽行政策是本课程 fixture 的选择，并非所有 attention API 的通用默认值。",
  }),
  sourceClaim({
    id: "c20-m8-p3-attention-not-explanation",
    moduleSlug: "attention",
    sectionIndex: 2,
    sourceId: "dl08-attention-not-explanation-paper",
    claim: "One empirical study found that attention weights can be weakly related to other importance measures and can admit adversarial alternatives.",
    claimZhHans: "一项实证研究发现，attention weight 与其他重要性度量可能关联较弱，并可能存在对抗性替代分布。",
    locator: "Jain & Wallace (2019), Attention is not Explanation — Sections 4–5",
  }),
  sourceClaim({
    id: "c20-m8-p3-attention-debate-boundary",
    moduleSlug: "attention",
    sectionIndex: 2,
    sourceId: "dl08-attention-not-not-explanation-paper",
    claim: "A counter-study argues that the evidentiary standard for explanation depends on the claim and that alternative attention distributions do not settle every interpretability question.",
    claimZhHans: "一项反驳研究主张，解释证据标准取决于具体主张，替代 attention 分布不能解决所有可解释性问题。",
    locator: "Wiegreffe & Pinter (2019), Attention is not not Explanation — Sections 2–4",
  }),

  sourceClaim({
    id: "c20-m9-p1-transformer-architecture",
    moduleSlug: "transformer-encoder-decoder",
    sectionIndex: 0,
    sourceId: "dl09-transformer-paper",
    claim: "The original Transformer combines positional representations, multi-head attention, feed-forward sublayers, residual paths, and normalization in encoder and decoder stacks.",
    claimZhHans: "原始 Transformer 在 encoder 与 decoder stack 中组合位置表示、multi-head attention、feed-forward 子层、残差路径与归一化。",
    locator: "Vaswani et al. (2017), Attention Is All You Need — Sections 3.1–3.5 and Figure 1",
  }),
  sourceClaim({
    id: "c20-m9-p2-transformer-mask-polarity",
    moduleSlug: "transformer-encoder-decoder",
    sectionIndex: 1,
    sourceId: "dl09-pytorch-transformer-2-13",
    evidenceMode: "version-watch",
    claim: "In PyTorch 2.13 nn.Transformer, a True Boolean mask position is not allowed to participate in attention.",
    claimZhHans: "在 PyTorch 2.13 nn.Transformer 中，Boolean mask 的 True 位置不允许参与 attention。",
    locator: "PyTorch 2.13 torch.nn.Transformer — forward mask arguments and Boolean-mask note",
  }),
  sourceClaim({
    id: "c20-m9-p2-sdpa-mask-polarity",
    moduleSlug: "transformer-encoder-decoder",
    sectionIndex: 1,
    sourceId: "dl09-pytorch-transformer-2-13",
    evidenceUrlIndex: 1,
    evidenceMode: "version-watch",
    claim: "In PyTorch 2.13 scaled_dot_product_attention, a True Boolean attention-mask position is allowed to participate, the opposite polarity of nn.Transformer.",
    claimZhHans: "在 PyTorch 2.13 scaled_dot_product_attention 中，Boolean attention mask 的 True 位置允许参与，极性与 nn.Transformer 相反。",
    locator: "PyTorch 2.13 scaled_dot_product_attention — attn_mask Boolean semantics and reference implementation",
  }),
  sourceClaim({
    id: "c20-m9-p3-causal-mask-architecture",
    moduleSlug: "transformer-encoder-decoder",
    sectionIndex: 2,
    sourceId: "dl09-transformer-paper",
    claim: "The original decoder masks subsequent positions so a target-position prediction cannot depend on future target tokens.",
    claimZhHans: "原始 decoder 屏蔽后续位置，使目标位置预测不能依赖未来目标 token。",
    locator: "Vaswani et al. (2017), Attention Is All You Need — Section 3.1 decoder masking",
  }),
  sourceClaim({
    id: "c20-m9-p3-api-complexity-boundary",
    moduleSlug: "transformer-encoder-decoder",
    sectionIndex: 2,
    sourceId: "dl09-pytorch-transformer-2-13",
    claim: "PyTorch 2.13 nn.Transformer exposes the documented constructor, forward arguments, mask parameters, and tensor-shape contract.",
    claimZhHans: "PyTorch 2.13 nn.Transformer 提供文档所列 constructor、forward 参数、mask 参数与 tensor 形状合同。",
    locator: "PyTorch 2.13 torch.nn.Transformer — class scope, parameters, and shape contract",
    boundary: "This reference API does not define every modern normalization, positional, sparsity, or cache design, so those choices need separate versioned evidence.",
    boundaryZhHans: "该 reference API 不定义所有现代归一化、位置、稀疏或 cache 设计，因此这些选择需要独立的版本化证据。",
  }),

  sourceClaim({
    id: "c20-m10-p1-sentencepiece",
    moduleSlug: "tokenisation-pretraining",
    sectionIndex: 0,
    sourceId: "dl10-sentencepiece-paper",
    claim: "SentencePiece reports language-independent subword training directly from raw sentences with explicit normalization and vocabulary behavior.",
    claimZhHans: "SentencePiece 报告从原始句子进行语言无关的 subword 训练，并具有显式 normalization 与词表行为。",
    locator: "Kudo & Richardson (2018), SentencePiece — Sections 2–3",
  }),
  sourceClaim({
    id: "c20-m10-p1-bert-objectives",
    moduleSlug: "tokenisation-pretraining",
    sectionIndex: 0,
    sourceId: "dl10-bert-paper",
    claim: "BERT uses WordPiece tokenization with masked-language-model and next-sentence pretraining objectives in its reported setup.",
    claimZhHans: "BERT 在其报告设置中使用 WordPiece tokenization、masked-language-model 与 next-sentence 预训练目标。",
    locator: "Devlin et al. (2019), BERT — Sections 3.1–3.4",
  }),
  sourceClaim({
    id: "c20-m10-p1-text-segment-id-interface",
    moduleSlug: "tokenisation-pretraining",
    sectionIndex: 0,
    sourceId: "dl10-sentencepiece-paper",
    claim: "SentencePiece describes normalization, segmentation into vocabulary pieces, and conversion between those pieces and integer IDs as parts of its text interface.",
    claimZhHans: "SentencePiece 把 normalization、切分为词表 piece，以及 piece 与整数 ID 的转换描述为文本界面的组成。",
    locator: "Kudo & Richardson (2018), SentencePiece — Sections 2–3, normalization, segmentation, vocabulary, and ID interface",
  }),
  ownedClaim({
    id: "c20-m10-p1-signal-contract-synthesis",
    moduleSlug: "tokenisation-pretraining",
    sectionIndex: 0,
    evidenceMode: "instructional-synthesis",
    claim: "The course treats tokenizer, vocabulary, special-token rules, objective, corpus, and sequence policy as one combined input-signal contract.",
    claimZhHans: "课程把 tokenizer、词表、special-token 规则、目标、语料与序列政策视为一个组合输入信号合同。",
    locator: "Course 20 v2 synthesis — M10 combined input-signal contract",
    boundary: "This combined contract is a course audit synthesis; neither the SentencePiece nor BERT paper alone specifies every component for arbitrary modern systems.",
    boundaryZhHans: "该组合合同是课程审计综合；SentencePiece 或 BERT 任一论文都不会单独规定任意现代系统的所有组成。",
  }),
  ownedClaim({
    id: "c20-m10-p2-multiscript-audit",
    moduleSlug: "tokenisation-pretraining",
    sectionIndex: 1,
    evidenceMode: "instructional-synthesis",
    claim: "The course requires a multiscript normalization, token-ID, round-trip, unknown-symbol, and corpus-rights audit on original strings.",
    claimZhHans: "课程要求在原创字符串上进行多文字系统 normalization、token ID、round-trip、未知符号与语料权利审计。",
    locator: "Course 20 v2 synthesis — M10 tokenisation-provenance-audit protocol",
    boundary: "The fixture diagnoses declared strings and policies only; it does not establish equal service across languages or lawful rights for an external corpus.",
    boundaryZhHans: "该 fixture 只诊断已声明字符串与政策，不能证明跨语言服务平等或外部语料权利合法。",
  }),
  sourceClaim({
    id: "c20-m10-p3-tokenisation-boundary",
    moduleSlug: "tokenisation-pretraining",
    sectionIndex: 2,
    sourceId: "dl10-sentencepiece-paper",
    claim: "The SentencePiece paper reports its raw-sentence subword interface, normalization behavior, and experiments for the models and data it evaluates.",
    claimZhHans: "SentencePiece 论文报告了其原始句子子词界面、normalization 行为，以及所评估模型与数据上的实验。",
    locator: "Kudo & Richardson (2018), SentencePiece — normalization, subword model, and reported experiments",
    boundary: "The reported interface does not guarantee equal token efficiency, lossless normalization, or equal downstream quality for every script and corpus.",
    boundaryZhHans: "论文所报界面不保证所有文字系统与语料具有相同 token 效率、无损 normalization 或相同下游质量。",
  }),
  sourceClaim({
    id: "c20-m10-p3-pretraining-boundary",
    moduleSlug: "tokenisation-pretraining",
    sectionIndex: 2,
    sourceId: "dl10-bert-paper",
    claim: "The BERT paper reports downstream evaluations on the tasks described in Sections 4 and 5.",
    claimZhHans: "BERT 论文在第 4 与 5 节报告了所述任务上的下游评估。",
    locator: "Devlin et al. (2019), BERT — Sections 4–5, reported evaluation scope",
    boundary: "Those evaluations do not establish factuality, safety, lawful corpus acquisition, equal language service, or fitness for a new use.",
    boundaryZhHans: "这些评估不能证明事实可靠、安全、语料获取合法、语言服务平等或适合新的用途。",
  }),

  ownedClaim({
    id: "c20-m11-p1-adaptation-baseline-definitions",
    moduleSlug: "fine-tuning-parameter-efficient-adaptation",
    sectionIndex: 0,
    evidenceMode: "instructional-synthesis",
    claim: "For this course comparison, full fine-tuning updates the selected base parameters while the frozen baseline keeps base parameters fixed and updates only the declared added component.",
    claimZhHans: "在本课程对照中，full fine-tuning 更新所选基础参数，而 frozen baseline 保持基础参数固定，只更新声明的新增组件。",
    locator: "Course 20 v2 synthesis — M11 adaptation-baseline definitions",
    boundary: "These are course comparison definitions; external libraries and papers may use broader or different names, so every trainable-parameter map still has to be recorded.",
    boundaryZhHans: "这些是课程对照定义；外部库与论文可能使用更宽或不同名称，因此仍必须记录每项可训练参数映射。",
  }),
  sourceClaim({
    id: "c20-m11-p1-lora-method",
    moduleSlug: "fine-tuning-parameter-efficient-adaptation",
    sectionIndex: 0,
    sourceId: "dl11-lora-paper",
    claim: "LoRA freezes pretrained weights and injects trainable low-rank factors into selected weight updates.",
    claimZhHans: "LoRA 冻结预训练权重，并把可训练低秩因子注入选定权重更新。",
    locator: "Hu et al. (2022), LoRA — Sections 3–4",
  }),
  sourceClaim({
    id: "c20-m11-p1-peft-configuration",
    moduleSlug: "fine-tuning-parameter-efficient-adaptation",
    sectionIndex: 0,
    sourceId: "dl11-peft-v0-20-0",
    claim: "PEFT v0.20.0 exposes rank, target modules, scaling, dropout, and bias through LoRA configuration, and exposes merge-related behavior through its LoRA model API.",
    claimZhHans: "PEFT v0.20.0 通过 LoRA 配置提供 rank、target module、scaling、dropout 与 bias，并通过 LoRA model API 提供 merge 相关行为。",
    locator: "PEFT v0.20.0 lora.md at a5526d2 — LoraConfig and LoRA model reference",
  }),
  sourceClaim({
    id: "c20-m11-p2-peft-version-watch",
    moduleSlug: "fine-tuning-parameter-efficient-adaptation",
    sectionIndex: 1,
    sourceId: "dl11-peft-v0-20-0",
    evidenceMode: "version-watch",
    claim: "The course's target-module, rank, scaling, and merge checks are bound to the pinned PEFT v0.20.0 configuration surface.",
    claimZhHans: "课程的 target module、rank、scaling 与 merge 检查绑定到固定的 PEFT v0.20.0 配置界面。",
    locator: "PEFT v0.20.0 lora.md at a5526d2 — configuration and merge methods",
  }),
  sourceClaim({
    id: "c20-m11-p2-checkpoint-version-watch",
    moduleSlug: "fine-tuning-parameter-efficient-adaptation",
    sectionIndex: 1,
    sourceId: "dl11-peft-v0-20-0",
    evidenceUrlIndex: 1,
    evidenceMode: "version-watch",
    claim: "PEFT v0.20.0 checkpoint documentation describes adapter-specific configuration, adapter weights, and the corresponding loading format.",
    claimZhHans: "PEFT v0.20.0 checkpoint 文档描述 adapter 专属配置、adapter 权重及相应加载格式。",
    locator: "PEFT v0.20.0 checkpoint.md at a5526d2 — PEFT checkpoint format",
    boundary: "The course requires version binding because loading behavior can change; that requirement is a course policy applied to the documented v0.20.0 format.",
    boundaryZhHans: "课程因加载行为可能变化而要求版本绑定；这是课程对文档所述 v0.20.0 格式施加的政策。",
  }),
  ownedClaim({
    id: "c20-m11-p3-adaptation-authority-policy",
    moduleSlug: "fine-tuning-parameter-efficient-adaptation",
    sectionIndex: 2,
    evidenceMode: "course-policy",
    claim: "The course does not treat fewer trainable parameters as proof of lower total cost, safety, privacy, licence clearance, or deployment fitness.",
    claimZhHans: "课程不把更少可训练参数当作更低总成本、安全、隐私、许可证已清理或适合部署的证明。",
    locator: "Course 20 v2 policy — M11 adaptation lifecycle and inherited-limitations gate",
    boundary: "This policy separates measured resource changes from unmeasured system-level outcomes and preserves base-model and data restrictions.",
    boundaryZhHans: "该政策区分已测资源变化与未测系统级结果，并保留基础模型与数据限制。",
  }),

  sourceClaim({
    id: "c20-m12-p1-imagenet-c",
    moduleSlug: "robustness-evaluation-training-card-capstone",
    sectionIndex: 0,
    sourceId: "dl13-robustness",
    claim: "ImageNet-C defines a particular set of common image corruptions and severity levels for bounded robustness evaluation.",
    claimZhHans: "ImageNet-C 定义一组特定常见图像 corruption 与严重度，用于有边界的鲁棒性评估。",
    locator: "Hendrycks & Dietterich (2019), Benchmarking Neural Network Robustness — Sections 2–3",
  }),
  sourceClaim({
    id: "c20-m12-p1-calibration",
    moduleSlug: "robustness-evaluation-training-card-capstone",
    sectionIndex: 0,
    sourceId: "dl12-calibration-paper",
    claim: "Calibration evaluates whether model confidence aligns with observed correctness under a declared evaluation distribution and binning or scoring method.",
    claimZhHans: "Calibration 在声明的评估分布及分箱或评分方法下，检查模型置信度是否与观察正确率一致。",
    locator: "Guo et al. (2017), On Calibration of Modern Neural Networks — Sections 2–4",
  }),
  sourceClaim({
    id: "c20-m12-p1-model-card-reporting",
    moduleSlug: "robustness-evaluation-training-card-capstone",
    sectionIndex: 0,
    sourceId: "ra12-model-cards",
    claim: "Model Cards propose structured reporting of intended uses, evaluation conditions, limitations, and relevant performance characteristics.",
    claimZhHans: "Model Cards 提议结构化报告预期用途、评估条件、限制与相关性能特征。",
    locator: "Mitchell et al. (2019), Model Cards for Model Reporting — Sections 2–4",
  }),
  ownedClaim({
    id: "c20-m12-p1-course-dossier-status",
    moduleSlug: "robustness-evaluation-training-card-capstone",
    sectionIndex: 0,
    evidenceMode: "instructional-synthesis",
    claim: "The Course 20 training dossier adapts selected reporting ideas into a course-owned artifact and is not a published standard, certification, or deployment approval.",
    claimZhHans: "第20课训练档案把部分报告理念改编为课程自有产物，并非已发布标准、认证或部署批准。",
    locator: "Course 20 v2 synthesis — M12 course-local dossier status",
    boundary: "The dossier borrows reporting ideas without claiming conformance to Model Cards or any external certification scheme.",
    boundaryZhHans: "该档案借鉴报告理念，但不声称符合 Model Cards 或任何外部认证方案。",
  }),
  ownedClaim({
    id: "c20-m12-p2-dossier-policy",
    moduleSlug: "robustness-evaluation-training-card-capstone",
    sectionIndex: 1,
    evidenceMode: "course-policy",
    claim: "The course requires separate run, failure, resource, slice, and reviewer-decision evidence with at least three seeds and an explicit no-train/no-deploy path.",
    claimZhHans: "课程要求分离运行、失败、资源、切片与 reviewer decision 证据，至少三个种子，并保留显式 no-train/no-deploy 路径。",
    locator: "Course 20 v2 policy — M12 learner-final dossier and human-decision contract",
    boundary: "The training dossier is a course-original artifact inspired by reporting practices; it is not the Model Cards standard, certification, or deployment authorization.",
    boundaryZhHans: "training dossier 是受报告实践启发的课程原创产物，不是 Model Cards 标准、认证或部署授权。",
  }),
  ownedClaim({
    id: "c20-m12-p3-no-deploy-policy",
    moduleSlug: "robustness-evaluation-training-card-capstone",
    sectionIndex: 2,
    evidenceMode: "course-policy",
    claim: "A validator pass never overrides unresolved rights, subgroup, shift, safety, cost, or human-authority failures; evidence-supported no-train/no-deploy remains a valid course outcome.",
    claimZhHans: "validator PASS 绝不覆盖未解决的权利、subgroup、shift、安全、成本或人类权限失败；有证据的 no-train/no-deploy 是有效课程结果。",
    locator: "Course 20 v2 policy — M12 release-authority and stop-decision boundary",
    boundary: "Repository checks can validate declared structure and hashes but cannot authenticate reviewer identity, legal rights, external validity, or deployment suitability.",
    boundaryZhHans: "仓库检查可验证声明的结构与 hash，但不能认证 reviewer 身份、法律权利、外部效度或部署适用性。",
  }),
];

export function getDeepLearningClaims(
  moduleSlug: DeepLearningModuleSlug,
  sectionIndex?: number,
  paragraphIndex?: number,
): readonly DeepLearningClaimRecord[] {
  return DEEP_LEARNING_CLAIMS.filter((claim) => (
    claim.moduleSlug === moduleSlug
    && (sectionIndex === undefined || claim.sectionIndex === sectionIndex)
    && (paragraphIndex === undefined || claim.paragraphIndex === paragraphIndex)
  ));
}

const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

type DeepLearningClaimModule = (typeof DEEP_LEARNING_MODULES)[number];
type DeepLearningClaimSource = (typeof DEEP_LEARNING_SOURCE_SEEDS)[number];

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
}

function sha256Canonical(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

export function computeDeepLearningParagraphCopySha256(
  modules: readonly DeepLearningClaimModule[] = DEEP_LEARNING_MODULES,
): string {
  return sha256Canonical(modules.flatMap((courseModule) => (
    courseModule.copy.en.sections.flatMap((enSection, sectionIndex) => (
      enSection.paragraphs.map((paragraphEn, paragraphIndex) => ({
        moduleSlug: courseModule.slug,
        sectionIndex,
        paragraphIndex,
        evidenceMode: enSection.evidenceMode,
        sourceIds: enSection.sourceIds ?? courseModule.sourceIds,
        paragraphEn,
        paragraphZhHans:
          courseModule.copy.zhHans.sections[sectionIndex]?.paragraphs[paragraphIndex] ?? null,
      }))
    ))
  )));
}

export function computeDeepLearningClaimContractSha256(
  claims: readonly DeepLearningClaimRecord[] = DEEP_LEARNING_CLAIMS,
  sources: readonly DeepLearningClaimSource[] = DEEP_LEARNING_SOURCE_SEEDS,
): string {
  return sha256Canonical({
    claims: [...claims].sort((left, right) => (
      left.id < right.id ? -1 : left.id > right.id ? 1 : 0
    )),
    sources: [...sources]
      .sort((left, right) => (
        left.record.id < right.record.id ? -1 : left.record.id > right.record.id ? 1 : 0
      ))
      .map((source) => ({ record: source.record, zhHans: source.zhHans })),
  });
}

export const DEEP_LEARNING_CLAIM_REVIEW_SNAPSHOT = {
  status: "pending-human" as const,
  reviewerId: "PENDING_HUMAN",
  reviewedAt: null,
  paragraphCopySha256: "b69d86e417fc3ed088ea4a020385ee0711318230a314d86c94d5cad791527f52",
  claimContractSha256: "bc5ab7e5c196762d00f240ded73118dcd542ee983d98de1e2e4dc1dba96639a7",
  boundary:
    "These hashes freeze the candidate paragraph and claim/source contract. They do not replace the pending named-human bilingual technical review.",
} as const;

export function validateDeepLearningClaimLedger(
  claims: readonly DeepLearningClaimRecord[] = DEEP_LEARNING_CLAIMS,
  modules: readonly DeepLearningClaimModule[] = DEEP_LEARNING_MODULES,
  sources: readonly DeepLearningClaimSource[] = DEEP_LEARNING_SOURCE_SEEDS,
): string[] {
  const errors: string[] = [];
  const sourceById = new Map(
    sources.map((source) => [source.record.id, source.record]),
  );
  const moduleBySlug = new Map(
    modules.map((courseModule) => [courseModule.slug, courseModule]),
  );
  const ids = claims.map((claim) => claim.id);
  if (new Set(ids).size !== ids.length) errors.push("Deep Learning claim IDs must be unique.");
  for (const source of sources) {
    if (source.record.kind === "research" && source.record.evidenceUrls.length !== 1) {
      errors.push(`${source.record.id}: one research provenance record must identify one publication URL.`);
    }
  }

  for (const claim of claims) {
    const path = `claims.${claim.id}`;
    if (!SAFE_ID.test(claim.id)) errors.push(`${path}: id must be lowercase kebab-case.`);
    const courseModule = moduleBySlug.get(claim.moduleSlug);
    if (!courseModule) {
      errors.push(`${path}: unknown moduleSlug ${claim.moduleSlug}.`);
      continue;
    }
    const enSection = courseModule.copy.en.sections[claim.sectionIndex];
    const zhSection = courseModule.copy.zhHans.sections[claim.sectionIndex];
    if (!enSection || !zhSection
      || !enSection.paragraphs[claim.paragraphIndex]
      || !zhSection.paragraphs[claim.paragraphIndex]) {
      errors.push(`${path}: paragraph locator does not resolve in both content locales.`);
      continue;
    }
    if (enSection.evidenceMode !== zhSection.evidenceMode) {
      errors.push(`${path}: EN and zh-Hans section evidenceMode values must match.`);
    }
    if (claim.claim.trim().length < 30 || claim.claimZhHans.trim().length < 12) {
      errors.push(`${path}: bilingual atomic claim text is incomplete.`);
    }
    if (claim.locator.trim().length < 16) {
      errors.push(`${path}: exact section/page/API/course-contract locator is required.`);
    }
    if (claim.boundary.trim().length < 40 || claim.boundaryZhHans.trim().length < 16) {
      errors.push(`${path}: bilingual evidence boundary is incomplete.`);
    }

    const externallyGrounded = claim.evidenceMode === "source-grounded"
      || claim.evidenceMode === "version-watch";
    if (externallyGrounded) {
      if (!claim.sourceId || !claim.evidenceUrl) {
        errors.push(`${path}: externally grounded claims require sourceId and exact evidenceUrl.`);
        continue;
      }
      const source = sourceById.get(claim.sourceId);
      if (!source) {
        errors.push(`${path}: sourceId ${claim.sourceId} does not resolve.`);
        continue;
      }
      const enSourceIds = (enSection.sourceIds ?? courseModule.sourceIds) as readonly string[];
      const zhSourceIds = (zhSection.sourceIds ?? courseModule.sourceIds) as readonly string[];
      if (!enSourceIds.some((sourceId) => sourceId === claim.sourceId)
        || !zhSourceIds.some((sourceId) => sourceId === claim.sourceId)) {
        errors.push(`${path}: sourceId must belong to the bilingual paragraph reading set.`);
      }
      if (!(source.evidenceUrls as readonly string[]).includes(claim.evidenceUrl)) {
        errors.push(`${path}: evidenceUrl must exactly match the source record's evidenceUrls.`);
      }
      if (!claim.evidenceUrl.startsWith("https://")) {
        errors.push(`${path}: evidenceUrl must use HTTPS.`);
      }
    } else if (claim.sourceId || claim.evidenceUrl) {
      errors.push(`${path}: course-owned synthesis/policy must not impersonate an external source.`);
    }
  }

  for (const courseModule of modules) {
    courseModule.copy.en.sections.forEach((section, sectionIndex) => {
      section.paragraphs.forEach((_, paragraphIndex) => {
        const paragraphClaims = claims.filter((claim) => (
          claim.moduleSlug === courseModule.slug
          && claim.sectionIndex === sectionIndex
          && claim.paragraphIndex === paragraphIndex
        ));
        const path = `${courseModule.slug}/section-${sectionIndex + 1}/paragraph-${paragraphIndex + 1}`;
        if (paragraphClaims.length === 0) {
          errors.push(`${path}: paragraph has no atomic claim mapping.`);
          return;
        }
        if (!paragraphClaims.some((claim) => claim.evidenceMode === section.evidenceMode)) {
          errors.push(`${path}: paragraph has no claim for its declared evidenceMode.`);
        }
        if (section.evidenceMode === "source-grounded"
          || section.evidenceMode === "version-watch") {
          const sourceIds = (section.sourceIds ?? courseModule.sourceIds) as readonly string[];
          for (const sourceId of sourceIds) {
            if (!paragraphClaims.some((claim) => claim.sourceId === sourceId)) {
              errors.push(`${path}: reading-set source ${sourceId} has no atomic claim mapping.`);
            }
          }
        }
      });
    });
  }

  if (computeDeepLearningParagraphCopySha256(modules)
    !== DEEP_LEARNING_CLAIM_REVIEW_SNAPSHOT.paragraphCopySha256) {
    errors.push("Deep Learning paragraph copy drifted from the frozen atomic-claim review snapshot.");
  }
  if (computeDeepLearningClaimContractSha256(claims, sources)
    !== DEEP_LEARNING_CLAIM_REVIEW_SNAPSHOT.claimContractSha256) {
    errors.push("Deep Learning claim/source/locator contract drifted from the frozen review snapshot.");
  }

  return errors;
}

export function assertValidDeepLearningClaimLedger(): void {
  const errors = validateDeepLearningClaimLedger();
  if (errors.length > 0) {
    throw new Error(`Invalid Deep Learning atomic claim ledger:\n${errors.join("\n")}`);
  }
}
