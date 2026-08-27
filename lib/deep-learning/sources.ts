import type { CourseKitSourceAuthoringSeed } from "../course-kit/authoring";
import type { CourseKitNonEmpty } from "../course-kit/types";

const ACCESSED_ON = "2026-08-26";

/** Canonical evidence records for Course 20; all teaching prose is original. */
export const DEEP_LEARNING_SOURCE_SEEDS = [
  {
    record: {
      id: "dl01-tensors-autograd",
      title: "PyTorch tensors and autograd documentation",
      publisher: "PyTorch project",
      url: "https://docs.pytorch.org/tutorials/beginner/basics/tensorqs_tutorial.html",
      evidenceUrls: [
        "https://docs.pytorch.org/tutorials/beginner/basics/tensorqs_tutorial.html",
        "https://docs.pytorch.org/docs/stable/autograd",
      ],
      accessedOn: ACCESSED_ON,
      revision: "current PyTorch 2.13 documentation family at access",
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "PyTorch BSD-style project licence; linked and paraphrased only",
      supports:
        "Tensor shape, dtype, device, layout, broadcasting, computational graphs, and reverse-mode automatic differentiation in the pinned PyTorch documentation family.",
      boundary:
        "These pages describe one implementation surface. Tensor operations can change semantics through broadcasting, mutation, detach, device placement, and release-specific behavior; autodiff does not validate the objective.",
    },
    zhHans: {
      supports:
        "支持钉定 PyTorch 文档族中的 tensor 形状、类型、设备、布局、广播、计算图与反向模式自动微分。",
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
      publishedOn: "1986-10-09",
      kind: "research",
      stability: "historical",
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
      id: "dl03-optimisation-adam",
      title: "torch.optim documentation and Adam",
      publisher: "PyTorch project and the Adam authors",
      url: "https://docs.pytorch.org/docs/stable/optim.html",
      evidenceUrls: [
        "https://docs.pytorch.org/docs/stable/optim.html",
        "https://arxiv.org/abs/1412.6980",
      ],
      accessedOn: ACCESSED_ON,
      revision: "PyTorch 2.13 documentation family; Adam paper version current at access",
      kind: "research",
      stability: "version-pinned",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "The optimizer step abstraction in current PyTorch and the Adam method's adaptive first- and second-moment update as originally proposed.",
      boundary:
        "An optimizer implementation and an original benchmark do not guarantee convergence, generalization, stability, or superiority under a new loss, schedule, numerical precision, or data regime.",
    },
    zhHans: {
      supports:
        "支持当前 PyTorch 的优化器 step 抽象，以及 Adam 原论文提出的自适应一阶与二阶矩更新。",
      boundary:
        "优化器实现与原始基准不能保证在新的损失、调度、数值精度或数据条件下收敛、泛化、稳定或更优。",
    },
  },
  {
    record: {
      id: "dl04-normalisation-regularisation",
      title: "Batch Normalization and Dropout",
      publisher: "PMLR and Journal of Machine Learning Research",
      url: "https://proceedings.mlr.press/v37/ioffe15.html",
      evidenceUrls: [
        "https://proceedings.mlr.press/v37/ioffe15.html",
        "https://www.jmlr.org/papers/v15/srivastava14a.html",
      ],
      accessedOn: ACCESSED_ON,
      kind: "research",
      stability: "stable-concept",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "The specific Batch Normalization and Dropout methods, their stated mechanisms, and the experiments reported in their original publications.",
      boundary:
        "The reported experiments are architecture- and dataset-bounded. Train/evaluation behavior, batch composition, placement, probability, and interaction with other regularizers must be tested for the actual system.",
    },
    zhHans: {
      supports:
        "支持 Batch Normalization 与 Dropout 的具体方法、论文所述机制及其原始实验。",
      boundary:
        "论文结果受架构和数据集边界约束；训练/评估行为、批次组成、放置位置、概率及与其他正则化的交互必须在实际系统中验证。",
    },
  },
  {
    record: {
      id: "dl05-training-reproducibility",
      title: "PyTorch training tutorial and reproducibility notes",
      publisher: "PyTorch project",
      url: "https://docs.pytorch.org/tutorials/beginner/introyt/trainingyt.html",
      evidenceUrls: [
        "https://docs.pytorch.org/tutorials/beginner/introyt/trainingyt.html",
        "https://docs.pytorch.org/docs/stable/notes/randomness.html",
      ],
      accessedOn: ACCESSED_ON,
      revision: "current PyTorch 2.13 documentation family at access",
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "PyTorch BSD-style project licence; linked and paraphrased only",
      supports:
        "A standard train/validation loop, mode changes, gradient updates, checkpoints, and documented controls and limitations for reproducibility.",
      boundary:
        "Loss reduction is not evidence of correct data or generalization. PyTorch explicitly does not guarantee complete reproducibility across releases, commits, platforms, or CPU and GPU execution.",
    },
    zhHans: {
      supports:
        "支持标准训练/验证循环、模式切换、梯度更新、checkpoint，以及官方说明的可复现控制与限制。",
      boundary:
        "损失下降不能证明数据正确或能够泛化；PyTorch 明确不保证跨版本、提交、平台或 CPU/GPU 执行完全可复现。",
    },
  },
  {
    record: {
      id: "dl06-cnn-resnet",
      title: "Gradient-based learning applied to document recognition and Deep Residual Learning",
      publisher: "IEEE and CVPR",
      url: "https://doi.org/10.1109/5.726791",
      evidenceUrls: [
        "https://doi.org/10.1109/5.726791",
        "https://openaccess.thecvf.com/content_cvpr_2016/html/He_Deep_Residual_Learning_CVPR_2016_paper.html",
      ],
      accessedOn: ACCESSED_ON,
      kind: "research",
      stability: "historical",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "Convolutional networks with local connectivity and shared parameters, and residual connections as evaluated for training deeper image-recognition networks.",
      boundary:
        "Historical image benchmarks do not establish performance, causal explanation, fairness, or safety for a new visual domain. Greater depth does not guarantee a better system.",
    },
    zhHans: {
      supports:
        "支持使用局部连接与共享参数的卷积网络，以及在深层图像识别网络中评估的残差连接。",
      boundary:
        "历史图像基准不能证明新视觉领域中的性能、因果解释、公平或安全；网络更深也不保证系统更好。",
    },
  },
  {
    record: {
      id: "dl07-transfer-learning",
      title: "Transfer Learning for Computer Vision Tutorial",
      publisher: "PyTorch project",
      url: "https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html",
      evidenceUrls: [
        "https://docs.pytorch.org/tutorials/beginner/transfer_learning_tutorial.html",
      ],
      accessedOn: ACCESSED_ON,
      revision: "current PyTorch 2.13 tutorial family at access",
      kind: "official-documentation",
      stability: "version-pinned",
      reuseStatus: "licence-noted-no-copy",
      licence: "PyTorch BSD-style project licence; linked and paraphrased only",
      supports:
        "A concrete comparison between fixed-feature extraction and fine-tuning for one small computer-vision transfer-learning example.",
      boundary:
        "The tutorial is an implementation example, not evidence of universal positive transfer. Source-data rights, domain mismatch, subgroup effects, and compute must be assessed separately.",
    },
    zhHans: {
      supports:
        "支持在一个小型计算机视觉示例中比较固定特征提取与微调的具体实现。",
      boundary:
        "教程不是普遍正迁移的证据；源数据权利、领域不匹配、子群影响与计算成本必须分别评估。",
    },
  },
  {
    record: {
      id: "dl08-lstm-sequences",
      title: "Long Short-Term Memory and PyTorch sequence models",
      publisher: "Neural Computation and PyTorch project",
      url: "https://doi.org/10.1162/neco.1997.9.8.1735",
      evidenceUrls: [
        "https://doi.org/10.1162/neco.1997.9.8.1735",
        "https://docs.pytorch.org/tutorials/beginner/nlp/sequence_models_tutorial.html",
      ],
      accessedOn: ACCESSED_ON,
      revision: "1997 LSTM paper; rolling PyTorch tutorial snapshot accessed 2026-08-26",
      kind: "research",
      stability: "version-pinned",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "The LSTM gating and cell-state method and a current PyTorch implementation pattern for recurrent sequence models.",
      boundary:
        "LSTM mitigates some training difficulties but does not solve every long dependency. Padding, masking, state reset, sequence-length distribution, and teacher forcing can change conclusions.",
    },
    zhHans: {
      supports:
        "支持 LSTM 门控与 cell state 方法，以及当前 PyTorch 中递归序列模型的实现模式。",
      boundary:
        "LSTM 只缓解部分训练困难，并不能解决所有长期依赖；padding、mask、状态重置、序列长度分布与 teacher forcing 都会改变结论。",
    },
  },
  {
    record: {
      id: "dl09-attention",
      title: "Neural Machine Translation by Jointly Learning to Align and Translate",
      publisher: "ICLR / arXiv",
      url: "https://arxiv.org/abs/1409.0473",
      evidenceUrls: ["https://arxiv.org/abs/1409.0473"],
      accessedOn: ACCESSED_ON,
      kind: "research",
      stability: "stable-concept",
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
      id: "dl10-transformer",
      title: "Attention Is All You Need and the PyTorch transformer tutorial",
      publisher: "NeurIPS and PyTorch project",
      url: "https://papers.neurips.cc/paper/7181-attention-is-all-you-need",
      evidenceUrls: [
        "https://papers.neurips.cc/paper/7181-attention-is-all-you-need",
        "https://docs.pytorch.org/tutorials/beginner/transformer_tutorial.html",
      ],
      accessedOn: ACCESSED_ON,
      revision: "2017 Transformer paper; rolling PyTorch tutorial snapshot accessed 2026-08-26",
      kind: "research",
      stability: "version-pinned",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "The original Transformer encoder-decoder architecture and a current PyTorch implementation tutorial for attention masks and sequence modeling.",
      boundary:
        "The 2017 architecture is not every modern Transformer. Mask semantics, positional methods, attention complexity, cache behavior, and tutorial lifecycle are implementation- and version-specific.",
    },
    zhHans: {
      supports:
        "支持原始 Transformer encoder-decoder 架构，以及当前 PyTorch 对 attention mask 与序列建模的实现教程。",
      boundary:
        "2017 年架构不等于所有现代 Transformer；mask 语义、位置方法、attention 复杂度、cache 行为与教程生命周期均受实现和版本约束。",
    },
  },
  {
    record: {
      id: "dl11-tokenisation-pretraining",
      title: "SentencePiece and BERT",
      publisher: "ACL Anthology",
      url: "https://aclanthology.org/D18-2012/",
      evidenceUrls: [
        "https://aclanthology.org/D18-2012/",
        "https://aclanthology.org/N19-1423/",
      ],
      accessedOn: ACCESSED_ON,
      kind: "research",
      stability: "stable-concept",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "The SentencePiece data-driven subword tokenization method and BERT's bidirectional Transformer pretraining objectives and reported task evaluations.",
      boundary:
        "Token counts are not word counts. The papers do not establish equal language cost, lawful or representative training data, factuality, safety, or general performance for a different model and corpus.",
    },
    zhHans: {
      supports:
        "支持 SentencePiece 的数据驱动子词切分方法，以及 BERT 的双向 Transformer 预训练目标与论文所报任务评测。",
      boundary:
        "token 数不等于词数；论文不能证明不同语言成本相同，也不能证明训练数据合法或具代表性、模型事实可靠、安全或能在不同语料上普遍有效。",
    },
  },
  {
    record: {
      id: "dl12-lora-peft",
      title: "LoRA and Hugging Face PEFT documentation",
      publisher: "ICLR / OpenReview and Hugging Face",
      url: "https://openreview.net/forum?id=nZeVKeeFYf9",
      evidenceUrls: [
        "https://openreview.net/forum?id=nZeVKeeFYf9",
        "https://huggingface.co/docs/peft/index",
      ],
      accessedOn: ACCESSED_ON,
      revision: "LoRA ICLR 2022; rolling PEFT documentation at access",
      kind: "research",
      stability: "version-pinned",
      reuseStatus: "link-and-paraphrase-only",
      supports:
        "LoRA's low-rank adaptation method and a current PEFT implementation surface for adapter configuration, training, saving, and merging.",
      boundary:
        "Fewer trainable parameters do not guarantee better quality, lower end-to-end cost, safety, reproducibility, or licence compatibility. PEFT APIs are rolling and must be pinned.",
    },
    zhHans: {
      supports:
        "支持 LoRA 的低秩适配方法，以及当前 PEFT 对 adapter 配置、训练、保存与合并的实现界面。",
      boundary:
        "可训练参数更少不保证质量更好、全生命周期成本更低、安全、可复现或许可兼容；PEFT API 持续变化，必须钉定版本。",
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
      kind: "research",
      stability: "stable-concept",
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
      id: "ra12-model-cards",
      title: "Model Cards for Model Reporting",
      publisher: "Google Research / FAT*",
      url: "https://research.google/pubs/model-cards-for-model-reporting/",
      evidenceUrls: [
        "https://research.google/pubs/model-cards-for-model-reporting/",
      ],
      accessedOn: ACCESSED_ON,
      publishedOn: "2019-01-29",
      kind: "research",
      stability: "stable-concept",
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
