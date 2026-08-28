import type { CourseKitSourceAuthoringSeed } from "../course-kit/authoring";
import type { CourseKitNonEmpty } from "../course-kit/types";

const ACCESSED_ON = "2026-08-28";
const ACCESSED_AT = "2026-08-28T00:00:00+08:00";

/** Canonical evidence records for Course 20; all teaching prose is original. */
export const DEEP_LEARNING_SOURCE_SEEDS = [
  {
    record: {
      id: "dl01-pytorch-tensors-autograd-2-13",
      title: "PyTorch 2.13 tensors, views, broadcasting, and autograd",
      publisher: "PyTorch project",
      url: "https://docs.pytorch.org/docs/2.13/tensors.html",
      evidenceUrls: [
        "https://docs.pytorch.org/docs/2.13/tensors.html",
        "https://docs.pytorch.org/docs/2.13/tensor_view.html",
        "https://docs.pytorch.org/docs/2.13/notes/broadcasting.html",
        "https://docs.pytorch.org/docs/2.13/autograd.html",
        "https://docs.pytorch.org/docs/2.13/notes/autograd.html",
        "https://github.com/pytorch/pytorch/tree/cf30153c4c131c8164ee7798e5022d810682e2cb",
      ],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      revision: "PyTorch v2.13.0; release commit cf30153c4c131c8164ee7798e5022d810682e2cb",
      immutableRef: {
        kind: "commit-sha",
        value: "cf30153c4c131c8164ee7798e5022d810682e2cb",
        url: "https://github.com/pytorch/pytorch/commit/cf30153c4c131c8164ee7798e5022d810682e2cb",
      },
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "PyTorch BSD-style project licence; linked and paraphrased only",
      supports:
        "PyTorch 2.13 tensor shape, dtype, device, strides, layout, views, broadcasting, computational graphs, and reverse-mode automatic differentiation.",
      boundary:
        "These pages describe one implementation surface. Tensor operations can change semantics through broadcasting, mutation, detach, device placement, and release-specific behavior; autodiff does not validate the objective.",
    },
    zhHans: {
      supports:
        "支持 PyTorch 2.13 的 tensor 形状、类型、设备、stride、布局、view、广播、计算图与反向模式自动微分。",
      boundary:
        "这些页面说明一种实现界面；广播、原地修改、detach、设备位置与版本行为都可能改变语义，自动微分也不会验证目标函数是否正确。",
    },
  },
  {
    record: {
      id: "dl02-backpropagation",
      title: "Learning representations by back-propagating errors",
      publisher: "Nature",
      url: "https://doi.org/10.1038/323533a0",
      evidenceUrls: ["https://doi.org/10.1038/323533a0"],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      publishedOn: "1986-10-09",
      kind: "research",
      stability: "historical-snapshot",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "A classic demonstration that multilayer networks can learn internal representations by propagating output error derivatives backward through the network.",
      boundary:
        "The historical paper is not a claim of sole invention, a modern API specification, or evidence that backpropagation will find a useful solution for every architecture, loss, dataset, or optimizer.",
    },
    zhHans: {
      supports:
        "支持多层网络通过把输出误差导数向后传播来学习内部表示的经典方法与实验。",
      boundary:
        "该历史论文不是唯一发明权主张，也不是现代 API 规范，更不能证明反向传播对所有架构、损失、数据集或优化器都能找到有用解。",
    },
  },
  {
    record: {
      id: "dl04-pytorch-optim-2-13",
      title: "PyTorch 2.13 torch.optim documentation",
      publisher: "PyTorch project",
      url: "https://docs.pytorch.org/docs/2.13/optim.html",
      evidenceUrls: [
        "https://docs.pytorch.org/docs/2.13/optim.html",
        "https://github.com/pytorch/pytorch/tree/cf30153c4c131c8164ee7798e5022d810682e2cb",
      ],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      revision: "PyTorch v2.13.0; release commit cf30153c4c131c8164ee7798e5022d810682e2cb",
      immutableRef: {
        kind: "commit-sha",
        value: "cf30153c4c131c8164ee7798e5022d810682e2cb",
        url: "https://github.com/pytorch/pytorch/commit/cf30153c4c131c8164ee7798e5022d810682e2cb",
      },
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "PyTorch BSD-style project licence; linked and paraphrased only",
      supports:
        "The PyTorch 2.13 optimizer step abstraction, parameter groups, optimizer state, and implementation-specific options.",
      boundary:
        "An optimizer API and its defaults do not guarantee convergence, generalization, stability, or superiority under a new loss, schedule, precision, or data regime.",
    },
    zhHans: {
      supports:
        "支持 PyTorch 2.13 的优化器 step 抽象、参数组、优化器状态与实现专属选项。",
      boundary:
        "优化器 API 与默认值不能保证在新的损失、调度、数值精度或数据条件下收敛、泛化、稳定或更优。",
    },
  },
  {
    record: {
      id: "dl02-pytorch-gradcheck-2-13",
      title: "PyTorch 2.13 gradcheck mechanics",
      publisher: "PyTorch project",
      url: "https://docs.pytorch.org/docs/2.13/notes/gradcheck.html",
      evidenceUrls: [
        "https://docs.pytorch.org/docs/2.13/notes/gradcheck.html",
        "https://github.com/pytorch/pytorch/tree/cf30153c4c131c8164ee7798e5022d810682e2cb",
      ],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      revision: "PyTorch v2.13.0; release commit cf30153c4c131c8164ee7798e5022d810682e2cb",
      immutableRef: {
        kind: "commit-sha",
        value: "cf30153c4c131c8164ee7798e5022d810682e2cb",
        url: "https://github.com/pytorch/pytorch/commit/cf30153c4c131c8164ee7798e5022d810682e2cb",
      },
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "PyTorch BSD-style project licence; linked and paraphrased only",
      supports:
        "Comparison of analytical automatic-differentiation Jacobians with central finite-difference estimates and the numerical scope of gradcheck.",
      boundary:
        "A tolerance-bounded local derivative check does not validate the loss, labels, data-generating process, optimizer, or deployment decision.",
    },
    zhHans: {
      supports:
        "支持把自动微分的解析 Jacobian 与中心有限差分估计比较，并说明 gradcheck 的数值范围。",
      boundary:
        "有容差的局部导数检查不能验证损失、标签、数据生成过程、优化器或部署决定。",
    },
  },
  {
    record: {
      id: "dl04-adam-paper",
      title: "Adam: A Method for Stochastic Optimization",
      publisher: "ICLR / arXiv",
      url: "https://arxiv.org/abs/1412.6980",
      evidenceUrls: ["https://arxiv.org/abs/1412.6980"],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      publishedOn: "2014-12-22",
      kind: "research",
      stability: "historical-snapshot",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "Adam's adaptive first- and second-moment update as proposed and the experiments reported by its authors.",
      boundary:
        "The original experiments do not guarantee Adam is best, convergent, stable, or well tuned for another architecture, loss, precision, or data regime.",
    },
    zhHans: {
      supports: "支持 Adam 原论文提出的自适应一阶与二阶矩更新及作者所报实验。",
      boundary:
        "原始实验不保证 Adam 在另一架构、损失、精度或数据条件下最优、收敛、稳定或调参合适。",
    },
  },
  {
    record: {
      id: "dl04-adamw-paper",
      title: "Decoupled Weight Decay Regularization",
      publisher: "ICLR / OpenReview",
      url: "https://openreview.net/forum?id=Bkg6RiCqY7",
      evidenceUrls: ["https://openreview.net/forum?id=Bkg6RiCqY7"],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      publishedOn: "2018-09-27",
      kind: "research",
      stability: "historical-snapshot",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "The distinction between L2 regularization and decoupled weight decay for adaptive gradient methods, with case-bounded experiments.",
      boundary:
        "Decoupled weight decay does not make its coefficient universally correct or make it interchangeable with Dropout and normalization.",
    },
    zhHans: {
      supports:
        "支持自适应梯度方法中 L2 正则化与解耦 weight decay 的区别及有案例边界的实验。",
      boundary:
        "解耦 weight decay 不会使其系数普遍正确，也不会使其可与 Dropout 或归一化互换。",
    },
  },
  {
    record: {
      id: "dl04-pytorch-initialisation-2-13",
      title: "PyTorch 2.13 module initialization documentation",
      publisher: "PyTorch project",
      url: "https://docs.pytorch.org/docs/2.13/nn.init.html",
      evidenceUrls: [
        "https://docs.pytorch.org/docs/2.13/nn.init.html",
        "https://docs.pytorch.org/docs/2.13/notes/modules.html",
        "https://github.com/pytorch/pytorch/tree/cf30153c4c131c8164ee7798e5022d810682e2cb",
      ],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      revision: "PyTorch v2.13.0; release commit cf30153c4c131c8164ee7798e5022d810682e2cb",
      immutableRef: {
        kind: "commit-sha",
        value: "cf30153c4c131c8164ee7798e5022d810682e2cb",
        url: "https://github.com/pytorch/pytorch/commit/cf30153c4c131c8164ee7798e5022d810682e2cb",
      },
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "PyTorch BSD-style project licence; linked and paraphrased only",
      supports:
        "PyTorch 2.13 parameter-initialization functions, module initialization state, and implementation parameters.",
      boundary:
        "An initializer name does not guarantee stable signal or gradient propagation for every activation, width, depth, precision, or data distribution.",
    },
    zhHans: {
      supports:
        "支持 PyTorch 2.13 参数初始化函数、module 初始化状态及实现参数。",
      boundary:
        "初始化器名称不保证在所有激活、宽度、深度、精度或数据分布下信号与梯度稳定。",
    },
  },
  {
    record: {
      id: "dl04-batch-normalization-paper",
      title: "Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift",
      publisher: "PMLR",
      url: "https://proceedings.mlr.press/v37/ioffe15.html",
      evidenceUrls: ["https://proceedings.mlr.press/v37/ioffe15.html"],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      kind: "research",
      stability: "historical-snapshot",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "The Batch Normalization method, its mini-batch statistics, learned parameters, train/inference behavior, and the experiments reported in the paper.",
      boundary:
        "The reported experiments are bounded by the evaluated architectures, datasets, mini-batch conditions, placement, and training regime; they do not establish universal benefit or equivalence with other normalization or regularization methods.",
    },
    zhHans: {
      supports:
        "支持 Batch Normalization 方法、mini-batch 统计量、学习参数、训练/推理行为及论文所报实验。",
      boundary:
        "论文结果受所评估架构、数据集、mini-batch 条件、放置方式与训练制度约束；不能证明普遍收益，也不能证明与其他归一化或正则化方法等价。",
    },
  },
  {
    record: {
      id: "dl04-dropout-paper",
      title: "Dropout: A Simple Way to Prevent Neural Networks from Overfitting",
      publisher: "Journal of Machine Learning Research",
      url: "https://www.jmlr.org/papers/v15/srivastava14a.html",
      evidenceUrls: ["https://www.jmlr.org/papers/v15/srivastava14a.html"],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      kind: "research",
      stability: "historical-snapshot",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "The Dropout method, stochastic unit omission during training, its inference-time computation, and the experiments reported in the paper.",
      boundary:
        "The reported experiments are bounded by the evaluated architectures, datasets, dropout settings, placement, and train/test computation; they do not establish universal benefit or equivalence with weight decay or normalization.",
    },
    zhHans: {
      supports:
        "支持 Dropout 方法、训练时随机省略单元、推理时计算方式及论文所报实验。",
      boundary:
        "论文结果受所评估架构、数据集、dropout 设置、放置方式与训练/测试计算约束；不能证明普遍收益，也不能证明与 weight decay 或归一化等价。",
    },
  },
  {
    record: {
      id: "dl03-pytorch-training-state-2-13",
      title: "PyTorch 2.13 module state, optimizer state, and reproducibility",
      publisher: "PyTorch project",
      url: "https://docs.pytorch.org/docs/2.13/notes/modules.html",
      evidenceUrls: [
        "https://docs.pytorch.org/docs/2.13/notes/modules.html",
        "https://docs.pytorch.org/docs/2.13/generated/torch.optim.Optimizer.state_dict.html",
        "https://docs.pytorch.org/docs/2.13/notes/randomness.html",
        "https://docs.pytorch.org/docs/2.13/generated/torch.optim.lr_scheduler.LRScheduler.state_dict.html",
        "https://github.com/pytorch/pytorch/tree/cf30153c4c131c8164ee7798e5022d810682e2cb",
      ],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      revision: "PyTorch v2.13.0; release commit cf30153c4c131c8164ee7798e5022d810682e2cb",
      immutableRef: {
        kind: "commit-sha",
        value: "cf30153c4c131c8164ee7798e5022d810682e2cb",
        url: "https://github.com/pytorch/pytorch/commit/cf30153c4c131c8164ee7798e5022d810682e2cb",
      },
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "PyTorch BSD-style project licence; linked and paraphrased only",
      supports:
        "Module train/evaluation state, model, optimizer and learning-rate-scheduler state, and documented reproducibility controls and limits in PyTorch 2.13.",
      boundary:
        "Loss reduction is not evidence of correct data or generalization. PyTorch explicitly does not guarantee complete reproducibility across releases, commits, platforms, or CPU and GPU execution.",
    },
    zhHans: {
      supports:
        "支持 PyTorch 2.13 的 module 训练/评估状态、模型、优化器与 learning-rate-scheduler 状态，以及官方说明的可复现控制与限制。",
      boundary:
        "损失下降不能证明数据正确或能够泛化；PyTorch 明确不保证跨版本、提交、平台或 CPU/GPU 执行完全可复现。",
    },
  },
  {
    record: {
      id: "dl05-convolutional-document-recognition-paper",
      title: "Gradient-Based Learning Applied to Document Recognition",
      publisher: "IEEE",
      url: "https://doi.org/10.1109/5.726791",
      evidenceUrls: ["https://doi.org/10.1109/5.726791"],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      kind: "research",
      stability: "historical-snapshot",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "Convolutional networks with local receptive fields, shared parameters, stacked feature maps, and the document-recognition experiments reported in the paper.",
      boundary:
        "The historical document-recognition experiments do not establish performance, causal explanation, fairness, or safety for a new visual domain.",
    },
    zhHans: {
      supports:
        "支持使用局部感受野、共享参数与堆叠特征图的卷积网络，以及论文所报文档识别实验。",
      boundary:
        "历史文档识别实验不能证明新视觉领域中的性能、因果解释、公平或安全。",
    },
  },
  {
    record: {
      id: "dl05-resnet-paper",
      title: "Deep Residual Learning for Image Recognition",
      publisher: "CVPR",
      url: "https://openaccess.thecvf.com/content_cvpr_2016/html/He_Deep_Residual_Learning_CVPR_2016_paper.html",
      evidenceUrls: [
        "https://openaccess.thecvf.com/content_cvpr_2016/html/He_Deep_Residual_Learning_CVPR_2016_paper.html",
      ],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      kind: "research",
      stability: "historical-snapshot",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "Identity shortcut connections, residual blocks, and their reported evaluation for training deeper image-recognition networks.",
      boundary:
        "The reported image benchmarks do not establish universal benefit, transfer, explanation, fairness, or safety; greater depth does not guarantee a better system.",
    },
    zhHans: {
      supports:
        "支持 identity shortcut、residual block，以及论文对更深图像识别网络训练的评估。",
      boundary:
        "论文所报图像基准不能证明普遍收益、迁移、解释、公平或安全；网络更深也不保证系统更好。",
    },
  },
  {
    record: {
      id: "dl06-pytorch-transfer-snapshot-d445c1f",
      title: "PyTorch transfer-learning tutorial source snapshot",
      publisher: "PyTorch tutorials GitHub repository",
      url: "https://github.com/pytorch/tutorials/blob/d445c1f91cadf17d0cd686a5541c2202a6c799d3/beginner_source/transfer_learning_tutorial.py",
      evidenceUrls: [
        "https://github.com/pytorch/tutorials/blob/d445c1f91cadf17d0cd686a5541c2202a6c799d3/beginner_source/transfer_learning_tutorial.py",
        "https://github.com/pytorch/tutorials/commit/d445c1f91cadf17d0cd686a5541c2202a6c799d3",
      ],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      revision: "Historical access-cutoff snapshot; pytorch/tutorials commit d445c1f91cadf17d0cd686a5541c2202a6c799d3",
      immutableRef: {
        kind: "commit-sha",
        value: "d445c1f91cadf17d0cd686a5541c2202a6c799d3",
        url: "https://github.com/pytorch/tutorials/commit/d445c1f91cadf17d0cd686a5541c2202a6c799d3",
      },
      kind: "repository",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "PyTorch BSD-style project licence; linked and paraphrased only",
      supports:
        "A commit-pinned comparison between fixed-feature extraction and full fine-tuning for one small computer-vision example.",
      boundary:
        "The tutorial is an implementation example, not evidence of universal positive transfer. Source-data rights, domain mismatch, subgroup effects, and compute must be assessed separately.",
    },
    zhHans: {
      supports:
        "支持在一个小型计算机视觉示例中比较固定特征提取与全量微调的 commit-pinned 实现。",
      boundary:
        "教程不是普遍正迁移的证据；源数据权利、领域不匹配、子群影响与计算成本必须分别评估。",
    },
  },
  {
    record: {
      id: "dl07-lstm-paper",
      title: "Long Short-Term Memory",
      publisher: "Neural Computation",
      url: "https://doi.org/10.1162/neco.1997.9.8.1735",
      evidenceUrls: [
        "https://doi.org/10.1162/neco.1997.9.8.1735",
      ],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      publishedOn: "1997-11-15",
      kind: "research",
      stability: "historical-snapshot",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "The original LSTM gating and cell-state method and its motivation around long-lag learning.",
      boundary:
        "LSTM mitigates some training difficulties but does not solve every long dependency. Padding, masking, state reset, sequence-length distribution, and teacher forcing can change conclusions.",
    },
    zhHans: {
      supports:
        "支持原始 LSTM 门控、cell state 方法及其长期滞后学习动机。",
      boundary:
        "LSTM 只缓解部分训练困难，并不能解决所有长期依赖；padding、mask、状态重置、序列长度分布与 teacher forcing 都会改变结论。",
    },
  },
  {
    record: {
      id: "dl07-pytorch-lstm-2-13",
      title: "PyTorch 2.13 LSTM API",
      publisher: "PyTorch project",
      url: "https://docs.pytorch.org/docs/2.13/generated/torch.nn.modules.rnn.LSTM.html",
      evidenceUrls: [
        "https://docs.pytorch.org/docs/2.13/generated/torch.nn.modules.rnn.LSTM.html",
        "https://github.com/pytorch/pytorch/tree/cf30153c4c131c8164ee7798e5022d810682e2cb",
      ],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      revision: "PyTorch v2.13.0; release commit cf30153c4c131c8164ee7798e5022d810682e2cb",
      immutableRef: {
        kind: "commit-sha",
        value: "cf30153c4c131c8164ee7798e5022d810682e2cb",
        url: "https://github.com/pytorch/pytorch/commit/cf30153c4c131c8164ee7798e5022d810682e2cb",
      },
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "PyTorch BSD-style project licence; linked and paraphrased only",
      supports:
        "PyTorch 2.13 LSTM input, output, hidden and cell state shapes, bidirectionality, layers, dropout option, and packed inputs.",
      boundary:
        "An API shape contract does not establish correct independence boundaries, teacher forcing, padding loss masks, or length extrapolation.",
    },
    zhHans: {
      supports:
        "支持 PyTorch 2.13 LSTM 输入输出、hidden/cell state 形状、双向结构、层、dropout 选项及 packed 输入。",
      boundary:
        "API 形状合同不能证明独立性边界、teacher forcing、padding 损失 mask 或长度外推正确。",
    },
  },
  {
    record: {
      id: "dl07-pytorch-packed-sequence-2-13",
      title: "PyTorch 2.13 PackedSequence API",
      publisher: "PyTorch project",
      url: "https://docs.pytorch.org/docs/2.13/generated/torch.nn.utils.rnn.PackedSequence.html",
      evidenceUrls: [
        "https://docs.pytorch.org/docs/2.13/generated/torch.nn.utils.rnn.PackedSequence.html",
        "https://github.com/pytorch/pytorch/tree/cf30153c4c131c8164ee7798e5022d810682e2cb",
      ],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      revision: "PyTorch v2.13.0; release commit cf30153c4c131c8164ee7798e5022d810682e2cb",
      immutableRef: {
        kind: "commit-sha",
        value: "cf30153c4c131c8164ee7798e5022d810682e2cb",
        url: "https://github.com/pytorch/pytorch/commit/cf30153c4c131c8164ee7798e5022d810682e2cb",
      },
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "PyTorch BSD-style project licence; linked and paraphrased only",
      supports:
        "The PyTorch 2.13 representation and construction boundary for packed variable-length recurrent inputs.",
      boundary:
        "Packing inputs does not automatically mask a task loss, prevent state leakage, or validate the sequence split.",
    },
    zhHans: {
      supports: "支持 PyTorch 2.13 对可变长度递归 packed 输入的表示与构造边界。",
      boundary:
        "打包输入不会自动屏蔽任务损失、防止状态泄漏或验证序列切分。",
    },
  },
  {
    record: {
      id: "dl08-bahdanau-attention-paper",
      title: "Neural Machine Translation by Jointly Learning to Align and Translate",
      publisher: "ICLR / arXiv",
      url: "https://arxiv.org/abs/1409.0473",
      evidenceUrls: ["https://arxiv.org/abs/1409.0473"],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      kind: "research",
      stability: "historical-snapshot",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "An additive attention mechanism that computes compatibility weights over source annotations while generating a target sequence.",
      boundary:
        "Attention weights are learned aggregation coefficients in this method; they are not automatically human explanations, causal attributions, or evidence of faithful reasoning.",
    },
    zhHans: {
      supports:
        "支持生成目标序列时对源端表示计算兼容性权重的加性 attention 方法。",
      boundary:
        "attention 权重是该方法中的学习聚合系数，并不自动构成人类可理解解释、因果归因或忠实推理证据。",
    },
  },
  {
    record: {
      id: "dl08-attention-not-explanation-paper",
      title: "Attention is not Explanation",
      publisher: "ACL Anthology / NAACL",
      url: "https://aclanthology.org/N19-1357/",
      evidenceUrls: ["https://aclanthology.org/N19-1357/"],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      publishedOn: "2019-06-01",
      kind: "research",
      stability: "historical-snapshot",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "Empirical tests in selected NLP models finding weak correlations with some feature-importance measures and alternative attention distributions with similar predictions.",
      boundary:
        "The experiments do not prove every attention mechanism is useless for every definition, audience, or purpose of explanation.",
    },
    zhHans: {
      supports:
        "支持在所测 NLP 模型中发现 attention 与部分特征重要性度量相关较弱、不同 attention 分布可产生相似预测的实验。",
      boundary:
        "这些实验不能证明所有 attention 机制对所有解释定义、受众或用途都无用。",
    },
  },
  {
    record: {
      id: "dl08-attention-not-not-explanation-paper",
      title: "Attention is not not Explanation",
      publisher: "ACL Anthology / EMNLP-IJCNLP",
      url: "https://aclanthology.org/D19-1002/",
      evidenceUrls: ["https://aclanthology.org/D19-1002/"],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      publishedOn: "2019-11-01",
      kind: "research",
      stability: "historical-snapshot",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "A critique that attention-as-explanation claims depend on their definition and must account for the full model and evaluation protocol.",
      boundary:
        "The critique does not turn raw attention weights into automatic causal explanations or faithful human rationales.",
    },
    zhHans: {
      supports:
        "支持 attention 是否构成解释取决于定义，并必须考虑完整模型与评估协议的批判。",
      boundary:
        "该批判不会让原始 attention 权重自动成为因果解释或忠实的人类理由。",
    },
  },
  {
    record: {
      id: "dl09-transformer-paper",
      title: "Attention Is All You Need",
      publisher: "NeurIPS",
      url: "https://papers.neurips.cc/paper/7181-attention-is-all-you-need",
      evidenceUrls: [
        "https://papers.neurips.cc/paper/7181-attention-is-all-you-need",
      ],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      publishedOn: "2017-12-04",
      kind: "research",
      stability: "historical-snapshot",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "The original Transformer encoder-decoder architecture, scaled dot-product and multi-head attention, positions, residual paths, normalization, and causal decoder masking.",
      boundary:
        "The 2017 architecture is not every modern Transformer. Mask semantics, positional methods, attention complexity, cache behavior, and tutorial lifecycle are implementation- and version-specific.",
    },
    zhHans: {
      supports:
        "支持原始 Transformer encoder-decoder 架构、scaled dot-product 与 multi-head attention、位置、残差、归一化及 decoder 因果 mask。",
      boundary:
        "2017 年架构不等于所有现代 Transformer；mask 语义、位置方法、attention 复杂度、cache 行为与教程生命周期均受实现和版本约束。",
    },
  },
  {
    record: {
      id: "dl09-pytorch-transformer-2-13",
      title: "PyTorch 2.13 Transformer and scaled-dot-product-attention APIs",
      publisher: "PyTorch project",
      url: "https://docs.pytorch.org/docs/2.13/generated/torch.nn.Transformer.html",
      evidenceUrls: [
        "https://docs.pytorch.org/docs/2.13/generated/torch.nn.Transformer.html",
        "https://docs.pytorch.org/docs/2.13/generated/torch.nn.functional.scaled_dot_product_attention.html",
        "https://github.com/pytorch/pytorch/tree/cf30153c4c131c8164ee7798e5022d810682e2cb",
      ],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      revision: "PyTorch v2.13.0; release commit cf30153c4c131c8164ee7798e5022d810682e2cb",
      immutableRef: {
        kind: "commit-sha",
        value: "cf30153c4c131c8164ee7798e5022d810682e2cb",
        url: "https://github.com/pytorch/pytorch/commit/cf30153c4c131c8164ee7798e5022d810682e2cb",
      },
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "PyTorch BSD-style project licence; linked and paraphrased only",
      supports:
        "PyTorch 2.13 Transformer mask shapes, Boolean and additive conventions, causal hints, and the distinct scaled-dot-product-attention mask surface.",
      boundary:
        "Boolean mask polarity differs between these APIs; incorrect causal hints or conventions can silently change forward and backward behavior.",
    },
    zhHans: {
      supports:
        "支持 PyTorch 2.13 Transformer mask 形状、Boolean/加性约定、因果提示，以及不同的 scaled-dot-product-attention mask 界面。",
      boundary:
        "这些 API 的 Boolean mask 极性不同；错误因果提示或约定会静默改变前向与反向行为。",
    },
  },
  {
    record: {
      id: "dl10-sentencepiece-paper",
      title: "SentencePiece: A simple and language independent subword tokenizer and detokenizer for Neural Text Processing",
      publisher: "ACL Anthology",
      url: "https://aclanthology.org/D18-2012/",
      evidenceUrls: ["https://aclanthology.org/D18-2012/"],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      kind: "research",
      stability: "historical-snapshot",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "SentencePiece's data-driven subword training from raw sentences, normalization behavior, vocabulary interface, and reported experiments.",
      boundary:
        "The reported interface and experiments do not establish equal token efficiency, lossless normalization, equal downstream quality, or lawful and representative data for every script and corpus.",
    },
    zhHans: {
      supports:
        "支持 SentencePiece 从原始句子进行数据驱动子词训练、normalization 行为、词表界面及论文所报实验。",
      boundary:
        "论文所报界面与实验不能证明所有文字系统和语料具有相同 token 效率、无损 normalization、相同下游质量或合法且具代表性的数据。",
    },
  },
  {
    record: {
      id: "dl10-bert-paper",
      title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
      publisher: "ACL Anthology",
      url: "https://aclanthology.org/N19-1423/",
      evidenceUrls: ["https://aclanthology.org/N19-1423/"],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      kind: "research",
      stability: "historical-snapshot",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "BERT's WordPiece input representation, masked-language-model and next-sentence pretraining objectives, and reported downstream evaluations.",
      boundary:
        "The reported downstream evaluations do not establish factuality, safety, lawful corpus acquisition, equal language service, or fitness for a different model, corpus, or use.",
    },
    zhHans: {
      supports:
        "支持 BERT 的 WordPiece 输入表示、masked-language-model 与 next-sentence 预训练目标，以及论文所报下游评估。",
      boundary:
        "论文所报下游评估不能证明事实可靠、安全、语料取得合法、语言服务平等，或适用于不同模型、语料与用途。",
    },
  },
  {
    record: {
      id: "dl11-lora-paper",
      title: "LoRA: Low-Rank Adaptation of Large Language Models",
      publisher: "ICLR / OpenReview",
      url: "https://openreview.net/forum?id=nZeVKeeFYf9",
      evidenceUrls: [
        "https://openreview.net/forum?id=nZeVKeeFYf9",
      ],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      publishedOn: "2022-01-31",
      kind: "research",
      stability: "historical-snapshot",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "LoRA's low-rank adaptation method, frozen base weights during training, and its reported parameter-efficiency experiments.",
      boundary:
        "Fewer trainable parameters do not guarantee better quality, lower end-to-end cost, safety, reproducibility, or licence compatibility. PEFT APIs are rolling and must be pinned.",
    },
    zhHans: {
      supports:
        "支持 LoRA 的低秩适配方法、训练时冻结基础权重，以及论文所报参数效率实验。",
      boundary:
        "可训练参数更少不保证质量更好、全生命周期成本更低、安全、可复现或许可兼容；PEFT API 持续变化，必须钉定版本。",
    },
  },
  {
    record: {
      id: "dl11-peft-v0-20-0",
      title: "Hugging Face PEFT v0.20.0 LoRA and checkpoint documentation",
      publisher: "Hugging Face PEFT GitHub repository",
      url: "https://github.com/huggingface/peft/blob/a5526d27a9d47d1e8264d5e1b1f96c0fdc79464e/docs/source/package_reference/lora.md",
      evidenceUrls: [
        "https://github.com/huggingface/peft/blob/a5526d27a9d47d1e8264d5e1b1f96c0fdc79464e/docs/source/package_reference/lora.md",
        "https://github.com/huggingface/peft/blob/a5526d27a9d47d1e8264d5e1b1f96c0fdc79464e/docs/source/developer_guides/checkpoint.md",
        "https://github.com/huggingface/peft/tree/v0.20.0",
        "https://github.com/huggingface/peft/commit/a5526d27a9d47d1e8264d5e1b1f96c0fdc79464e",
      ],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      revision: "PEFT v0.20.0; annotated tag dcb81da6ad92be5a9f4e07795c09d55cf35a19d1; commit a5526d27a9d47d1e8264d5e1b1f96c0fdc79464e",
      immutableRef: {
        kind: "commit-sha",
        value: "a5526d27a9d47d1e8264d5e1b1f96c0fdc79464e",
        url: "https://github.com/huggingface/peft/commit/a5526d27a9d47d1e8264d5e1b1f96c0fdc79464e",
      },
      kind: "repository",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "Apache-2.0 project; linked and paraphrased",
      supports:
        "PEFT v0.20.0 LoRA configuration and implementation concepts including rank, target modules, initialization, adapter state, and merge behavior.",
      boundary:
        "The PEFT project licence does not override base-model, checkpoint, tokenizer, or data rights; v0.20.0 behavior is not a future-version guarantee.",
    },
    zhHans: {
      supports:
        "支持 PEFT v0.20.0 的 LoRA 配置与实现概念，包括 rank、目标模块、初始化、adapter state 与合并行为。",
      boundary:
        "PEFT 项目许可不会覆盖基础模型、checkpoint、tokenizer 或数据权利；v0.20.0 行为也不保证未来版本。",
    },
  },
  {
    record: {
      id: "dl13-robustness",
      title: "Benchmarking Neural Network Robustness to Common Corruptions and Perturbations",
      publisher: "arXiv / ICLR",
      url: "https://arxiv.org/abs/1903.12261",
      evidenceUrls: ["https://arxiv.org/abs/1903.12261"],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      kind: "research",
      stability: "historical-snapshot",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "A specific image-corruption benchmark and metrics for evaluating robustness to the defined common corruptions and perturbations.",
      boundary:
        "ImageNet-C is not a complete out-of-distribution, adversarial, fairness, or safety evaluation. Robustness results remain model-, data-, severity-, and corruption-bounded.",
    },
    zhHans: {
      supports:
        "支持针对所定义常见 corruption 与 perturbation 的具体图像鲁棒性基准与指标。",
      boundary:
        "ImageNet-C 不是完整的分布外、对抗、公平或安全评测；鲁棒性结果仍受模型、数据、严重度与 corruption 类型约束。",
    },
  },
  {
    record: {
      id: "dl12-calibration-paper",
      title: "On Calibration of Modern Neural Networks",
      publisher: "PMLR",
      url: "https://proceedings.mlr.press/v70/guo17a.html",
      evidenceUrls: ["https://proceedings.mlr.press/v70/guo17a.html"],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      publishedOn: "2017-08-06",
      kind: "research",
      stability: "historical-snapshot",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "Calibration evaluation and temperature scaling as studied on the paper's modern neural-network benchmarks.",
      boundary:
        "Calibration is distribution-, model-, metric-, and sample-bounded and does not establish correctness, robustness, fairness, or safety.",
    },
    zhHans: {
      supports: "支持论文在现代神经网络基准上研究的校准评估与 temperature scaling。",
      boundary:
        "校准受分布、模型、指标与样本约束，不能证明正确、鲁棒、公平或安全。",
    },
  },
  {
    record: {
      id: "ra12-model-cards",
      title: "Model Cards for Model Reporting",
      publisher: "Google Research / FAT*",
      url: "https://research.google/pubs/model-cards-for-model-reporting/",
      evidenceUrls: [
        "https://research.google/pubs/model-cards-for-model-reporting/",
      ],
      accessedOn: ACCESSED_ON,
      accessedAt: ACCESSED_AT,
      publishedOn: "2019-01-29",
      kind: "research",
      stability: "historical-snapshot",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "A structured reporting approach for intended use, evaluation conditions, performance, limitations, and relevant ethical considerations.",
      boundary:
        "A card is documentation rather than independent validation, governance approval, safety certification, or proof that its claims remain current.",
    },
    zhHans: {
      supports:
        "支持按预期用途、评测条件、性能、限制与相关伦理考虑组织模型报告。",
      boundary:
        "卡片是文档，不是独立验证、治理批准、安全认证，也不能证明其中主张持续有效。",
    },
  },
] as const satisfies CourseKitNonEmpty<CourseKitSourceAuthoringSeed>;

export type DeepLearningSourceId =
  (typeof DEEP_LEARNING_SOURCE_SEEDS)[number]["record"]["id"];
