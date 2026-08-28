import {
  selectCourseKitQuizForm,
  validateCourseKitQuizForms,
} from "../course-kit/quiz";
import { buildModuleQuestionBank } from "../course-kit/authoring";
import type { CourseKitQuizQuestionCopyAuthoringSeed } from "../course-kit/authoring";
import {
  COURSE_KIT_QUIZ_SCHEMA_VERSION,
  type CourseKitNonEmpty,
  type CourseKitQuiz,
  type CourseKitThreeQuizForms,
} from "../course-kit/types";
import { DEEP_LEARNING_MODULES } from "./modules";
import type { DeepLearningSourceId } from "./sources";

export const DEEP_LEARNING_QUIZ_VERSION = "2026.08.28-quiz-v2";

export const DEEP_LEARNING_CAPABILITY_TAGS = [
  "shape",
  "gradient",
  "receptive-field",
  "attention",
  "mask",
  "lora-parameter-count",
  "fault-diagnosis",
] as const;

export type DeepLearningCapabilityTag =
  (typeof DEEP_LEARNING_CAPABILITY_TAGS)[number];

export const DEEP_LEARNING_MIN_CAPABILITY_QUESTIONS_PER_FORM = 6;
export const DEEP_LEARNING_CURRENT_FORM_SEED =
  `deep-learning:${DEEP_LEARNING_QUIZ_VERSION}`;

const generatedQuestionBankBase = buildModuleQuestionBank(DEEP_LEARNING_MODULES, {
  criticalQuestionCategories: {
    "q-training-loops-debugging-boundary": "rollback",
    "q-transformer-encoder-decoder-core": "reproducibility",
    "q-tokenisation-pretraining-boundary": "leakage",
    "q-fine-tuning-parameter-efficient-adaptation-boundary": "human-authority",
    "q-robustness-evaluation-training-card-capstone-boundary": "reproducibility",
  },
});

type GeneratedDeepLearningQuestion = (typeof generatedQuestionBankBase)[number];
type GeneratedDeepLearningQuestionId = GeneratedDeepLearningQuestion["id"];

interface DeepLearningCapabilityQuestionOverride {
  readonly correctIndex: 0 | 1 | 2 | 3;
  readonly capabilityTags: CourseKitNonEmpty<DeepLearningCapabilityTag>;
  readonly capabilityAssessmentMode: "computational" | "diagnostic";
  readonly copy: {
    readonly en: CourseKitQuizQuestionCopyAuthoringSeed;
    readonly zhHans: CourseKitQuizQuestionCopyAuthoringSeed;
  };
}

/**
 * Deliberately authored capability items. Generated artifact-title and
 * takeaway-selection questions remain recall checks and cannot become
 * capability evidence merely by receiving a tag.
 */
const DEEP_LEARNING_CAPABILITY_QUESTION_OVERRIDES = {
  "q-training-loops-debugging-boundary": {
    correctIndex: 1,
    capabilityTags: ["fault-diagnosis"],
    capabilityAssessmentMode: "diagnostic",
    copy: {
      en: {
        prompt:
          "A loop calls loss.backward() and optimizer.step() for each batch but never clears gradients. If batch 1 contributes g1 and batch 2 contributes g2, what does the second step use when accumulation was not intended?",
        options: [
          "Only g2; no repair is needed",
          "g1 + g2; clear gradients before the second backward pass, then rerun the affected steps",
          "(g1 + g2) / 2; switch the model to eval mode",
          "Zero; detach the loss before backward",
        ],
        explanation:
          "Parameter gradients accumulate by default. Without zero_grad (or setting gradients to None) before the next backward pass, the second update uses g1 + g2; the affected run must be repaired or rolled back.",
      },
      zhHans: {
        prompt:
          "训练循环对每个 batch 调用 loss.backward() 与 optimizer.step()，却从未清除梯度。若 batch 1 贡献 g1、batch 2 贡献 g2，而原计划并非梯度累积，第二次更新实际使用什么？",
        options: [
          "只使用 g2；无需修复",
          "使用 g1 + g2；第二次 backward 前清除梯度，并重跑受影响步骤",
          "使用 (g1 + g2) / 2；把模型切换到 eval 模式",
          "使用零梯度；在 backward 前 detach loss",
        ],
        explanation:
          "参数梯度默认会累积。若下一次 backward 前没有 zero_grad（或把梯度设为 None），第二次更新会使用 g1 + g2；该运行必须修复或回滚。",
      },
    },
  },
  "q-transformer-encoder-decoder-core": {
    correctIndex: 0,
    capabilityTags: ["mask"],
    capabilityAssessmentMode: "computational",
    copy: {
      en: {
        prompt:
          "For a length-4 decoder sequence, PyTorch 2.13 nn.Transformer interprets True in a Boolean target mask as blocked. Which mask row is correct for query position 2 (zero-indexed) in causal self-attention?",
        options: [
          "[false, false, false, true]",
          "[true, true, true, false]",
          "[false, false, true, true]",
          "[true, false, false, false]",
        ],
        explanation:
          "At position 2 the decoder may attend to positions 0, 1, and 2, but not future position 3. Under nn.Transformer's Boolean convention, only index 3 is True (blocked).",
      },
      zhHans: {
        prompt:
          "长度为 4 的 decoder 序列中，PyTorch 2.13 nn.Transformer 把 Boolean target mask 的 True 解释为禁止参与。对从零计数的 query 位置 2，哪一行 causal self-attention mask 正确？",
        options: [
          "[false, false, false, true]",
          "[true, true, true, false]",
          "[false, false, true, true]",
          "[true, false, false, false]",
        ],
        explanation:
          "位置 2 可以关注位置 0、1、2，但不能关注未来位置 3。按 nn.Transformer 的 Boolean 约定，只有索引 3 为 True（被屏蔽）。",
      },
    },
  },
  "q-tokenisation-pretraining-boundary": {
    correctIndex: 2,
    capabilityTags: ["fault-diagnosis"],
    capabilityAssessmentMode: "diagnostic",
    copy: {
      en: {
        prompt:
          "A held-out sentence is canonically equivalent to a pretraining sentence after Unicode normalization, but deduplication ran before normalization and placed the two forms in different splits. What is the defensible diagnosis?",
        options: [
          "The test remains independent because the raw byte sequences differ",
          "Only the tokenizer vocabulary size needs to be reported",
          "Treat it as split leakage: pin the normalization/tokenizer contract, deduplicate across normalized splits, and invalidate or rerun the affected evaluation",
          "Increase the context length so both forms receive the same token count",
        ],
        explanation:
          "Different byte encodings do not preserve independence when the strings normalize to the same content. The evaluation is contaminated until normalization-aware cross-split deduplication and a rerun establish a clean boundary.",
      },
      zhHans: {
        prompt:
          "一条留出句子经 Unicode normalization 后与预训练语料中的句子规范等价，但去重发生在 normalization 之前，两个形式因此落入不同 split。最合理的诊断是什么？",
        options: [
          "原始字节序列不同，所以测试仍然独立",
          "只需报告 tokenizer 词表大小",
          "将其视为 split 泄漏：钉定 normalization/tokenizer 合同，对规范化后的各 split 跨集去重，并作废或重跑受影响评估",
          "增大 context length，让两种形式得到相同 token 数",
        ],
        explanation:
          "当字符串规范化为同一内容时，不同字节编码并不能保证独立性。只有完成基于 normalization 的跨 split 去重并重跑后，才能重新建立干净评估边界。",
      },
    },
  },
  "q-fine-tuning-parameter-efficient-adaptation-boundary": {
    correctIndex: 2,
    capabilityTags: ["lora-parameter-count"],
    capabilityAssessmentMode: "computational",
    copy: {
      en: {
        prompt:
          "A frozen linear weight W has shape 12 × 8. A rank-2 LoRA adapter uses A with shape 2 × 8 and B with shape 12 × 2, with no adapter bias. Which statement is correct?",
        options: [
          "It adds 24 trainable parameters and validator PASS authorizes deployment",
          "It adds 96 trainable parameters and no reviewer decision is needed",
          "It adds 40 trainable parameters; that count is auditable, but deployment still requires the named human decision",
          "It adds 160 trainable parameters and must always be merged before evaluation",
        ],
        explanation:
          "The adapter count is 2 × 8 + 12 × 2 = 40 trainable parameters. Correct arithmetic and merge checks are capability evidence, not deployment authority; the named human decision remains required.",
      },
      zhHans: {
        prompt:
          "冻结线性权重 W 的形状为 12 × 8。rank-2 LoRA adapter 使用形状为 2 × 8 的 A 与形状为 12 × 2 的 B，且无 adapter bias。哪项陈述正确？",
        options: [
          "新增 24 个可训练参数，validator PASS 即授权部署",
          "新增 96 个可训练参数，无需审查者决定",
          "新增 40 个可训练参数；该计数可审计，但部署仍需具名人类决定",
          "新增 160 个可训练参数，并且评估前必须始终 merge",
        ],
        explanation:
          "adapter 参数量为 2 × 8 + 12 × 2 = 40。正确计数与 merge 检查是能力证据，不是部署授权；仍必须保留具名人类决定。",
      },
    },
  },
  "q-robustness-evaluation-training-card-capstone-boundary": {
    correctIndex: 3,
    capabilityTags: ["fault-diagnosis"],
    capabilityAssessmentMode: "diagnostic",
    copy: {
      en: {
        prompt:
          "A dossier reports the mean of three successful seeds, omits one failed run, gives no slice denominators, and the reviewer cannot resume the declared checkpoint. What is the valid release decision?",
        options: [
          "Deploy because three successful seeds satisfy the run-count gate",
          "Delete the failed run and report only the best seed",
          "Replace the missing evidence with module-complete booleans",
          "Record no-deploy (or revise), retain the failed run, restore denominators and checkpoint evidence, then repeat independent review",
        ],
        explanation:
          "Run count cannot compensate for omitted failures, denominator-free slices, or a broken resume path. A bounded no-deploy/revise decision is valid while the dossier and review are repaired.",
      },
      zhHans: {
        prompt:
          "训练档案报告了三个成功 seed 的均值，却遗漏一次失败运行、未给出切片分母，而且审查者无法从声明的 checkpoint 恢复。有效的发布决定是什么？",
        options: [
          "已有三个成功 seed，满足运行次数即可部署",
          "删除失败运行，只报告最佳 seed",
          "用模块完成 Boolean 替代缺失证据",
          "记录 no-deploy（或修订），保留失败运行，补齐分母与 checkpoint 证据，再重新进行独立复核",
        ],
        explanation:
          "运行次数不能弥补遗漏失败、无分母切片或损坏的恢复路径。在修复档案并重新独立复核期间，有边界的 no-deploy/修订决定是有效结果。",
      },
    },
  },
  "q-tensors-computational-graphs-core": {
    correctIndex: 1,
    capabilityTags: ["shape"],
    capabilityAssessmentMode: "computational",
    copy: {
      en: {
        prompt:
          "A batch tensor X has shape [2, 3] (batch, features) and bias b has shape [3]. What is the broadcast result shape of X + b, and which axis does b align with?",
        options: [
          "[3, 2], aligned with the batch axis",
          "[2, 3], aligned with the feature axis",
          "[2, 1], aligned with a new singleton axis",
          "[6], with both axes flattened",
        ],
        explanation:
          "Trailing dimensions align during broadcasting. b's length 3 matches X's feature dimension, so it is reused across the two batch rows and the result remains [2, 3].",
      },
      zhHans: {
        prompt:
          "batch tensor X 的形状为 [2, 3]（batch, features），bias b 的形状为 [3]。X + b 的广播结果形状是什么，b 与哪条轴对齐？",
        options: [
          "[3, 2]，与 batch 轴对齐",
          "[2, 3]，与 feature 轴对齐",
          "[2, 1]，与新增 singleton 轴对齐",
          "[6]，两条轴均被展平",
        ],
        explanation:
          "广播从尾部维度对齐。b 的长度 3 匹配 X 的 feature 维，因此会跨两个 batch 行复用，结果仍为 [2, 3]。",
      },
    },
  },
  "q-backpropagation-autodiff-core": {
    correctIndex: 0,
    capabilityTags: ["gradient"],
    capabilityAssessmentMode: "computational",
    copy: {
      en: {
        prompt:
          "Let y = tanh(wx) and L = 1/2(y - t)^2. At w = 0, x = 2, and t = 1, what is dL/dw?",
        options: ["-2", "-1", "0", "2"],
        explanation:
          "At w = 0, y = 0. The chain rule gives (y - t)(1 - y²)x = (0 - 1)(1 - 0)2 = -2.",
      },
      zhHans: {
        prompt:
          "设 y = tanh(wx)，L = 1/2(y - t)^2。当 w = 0、x = 2、t = 1 时，dL/dw 等于多少？",
        options: ["-2", "-1", "0", "2"],
        explanation:
          "w = 0 时 y = 0。由 chain rule，(y - t)(1 - y²)x = (0 - 1)(1 - 0)2 = -2。",
      },
    },
  },
  "q-cnns-visual-representations-core": {
    correctIndex: 2,
    capabilityTags: ["receptive-field"],
    capabilityAssessmentMode: "computational",
    copy: {
      en: {
        prompt:
          "Two 3 × 3 convolutions use stride 1, dilation 1, and no pooling. What receptive-field width does one activation after the second convolution have in the input?",
        options: ["3", "4", "5", "6"],
        explanation:
          "The first layer sees width 3. The second 3-wide kernel adds two input positions at stride 1, so the receptive-field width is 3 + 2 = 5.",
      },
      zhHans: {
        prompt:
          "两个 3 × 3 convolution 均使用 stride 1、dilation 1，且无 pooling。第二层后一个 activation 在输入上的 receptive-field 宽度是多少？",
        options: ["3", "4", "5", "6"],
        explanation:
          "第一层感受宽度为 3；第二个宽度为 3 的 kernel 在 stride 1 下再增加两个输入位置，因此 receptive-field 宽度为 3 + 2 = 5。",
      },
    },
  },
  "q-tensors-computational-graphs-evidence": {
    correctIndex: 3,
    capabilityTags: ["shape"],
    capabilityAssessmentMode: "computational",
    copy: {
      en: {
        prompt:
          "X has shape [4, 3], W has shape [3, 2], and b has shape [2]. What is the shape of X @ W + b?",
        options: ["[3, 3]", "[4, 3]", "[2, 4]", "[4, 2]"],
        explanation:
          "Matrix multiplication contracts the shared dimension 3, producing [4, 2]; b then broadcasts across the four rows without changing that shape.",
      },
      zhHans: {
        prompt:
          "X 的形状为 [4, 3]，W 为 [3, 2]，b 为 [2]。X @ W + b 的形状是什么？",
        options: ["[3, 3]", "[4, 3]", "[2, 4]", "[4, 2]"],
        explanation:
          "矩阵乘法收缩共同维度 3，得到 [4, 2]；随后 b 跨四行广播，不改变结果形状。",
      },
    },
  },
  "q-attention-evidence": {
    correctIndex: 1,
    capabilityTags: ["attention"],
    capabilityAssessmentMode: "computational",
    copy: {
      en: {
        prompt:
          "A query produces unnormalised attention scores [0, ln(3)] over values [0, 4]. What scalar output does softmax-weighted attention return?",
        options: ["1", "3", "4", "ln(3)"],
        explanation:
          "softmax([0, ln(3)]) = [1/4, 3/4]. The weighted value is (1/4)·0 + (3/4)·4 = 3.",
      },
      zhHans: {
        prompt:
          "一个 query 对 values [0, 4] 产生未归一化 attention scores [0, ln(3)]。softmax 加权 attention 返回哪个标量？",
        options: ["1", "3", "4", "ln(3)"],
        explanation:
          "softmax([0, ln(3)]) = [1/4, 3/4]，加权值为 (1/4)·0 + (3/4)·4 = 3。",
      },
    },
  },
  "q-transformer-encoder-decoder-evidence": {
    correctIndex: 2,
    capabilityTags: ["mask", "fault-diagnosis"],
    capabilityAssessmentMode: "diagnostic",
    copy: {
      en: {
        prompt:
          "In eval mode with fixed batching, cache state, and tolerance, changing only decoder token 3 changes the logits at decoder position 1. What does this regression result show?",
        options: [
          "The model has learned a better positional encoding",
          "The batch is too small to evaluate",
          "Future information leaked through the causal path; inspect mask orientation, offset, and cache before accepting the run",
          "The change is expected because all decoder positions may attend bidirectionally",
        ],
        explanation:
          "With causal masking, a future-token perturbation must not change an earlier position under controlled eval conditions. The observed change is evidence of leakage, commonly from polarity, offset, or cache mistakes.",
      },
      zhHans: {
        prompt:
          "在 eval 模式、固定 batching、cache 状态与 tolerance 的条件下，只改变 decoder token 3，却导致 decoder 位置 1 的 logits 改变。这个 regression 结果说明什么？",
        options: [
          "模型学到了更好的 positional encoding",
          "batch 太小，无法评估",
          "未来信息通过 causal 路径泄漏；接受运行前应检查 mask 方向、offset 与 cache",
          "这是预期行为，因为所有 decoder 位置都可双向关注",
        ],
        explanation:
          "在受控 eval 条件和 causal masking 下，改变未来 token 不应影响更早位置。观测到变化说明存在泄漏，常见原因包括 polarity、offset 或 cache 错误。",
      },
    },
  },
  "q-backpropagation-autodiff-boundary": {
    correctIndex: 1,
    capabilityTags: ["gradient"],
    capabilityAssessmentMode: "computational",
    copy: {
      en: {
        prompt:
          "For epsilon = 0.01, a loss is 1.210 at theta + epsilon and 1.190 at theta - epsilon. What central finite-difference gradient should be compared with autograd?",
        options: ["0.1", "1.0", "2.0", "20.0"],
        explanation:
          "The central difference is (1.210 - 1.190) / (2 × 0.01) = 0.020 / 0.020 = 1.0. Agreement still validates only this local derivative under the declared tolerance.",
      },
      zhHans: {
        prompt:
          "当 epsilon = 0.01 时，theta + epsilon 处的 loss 为 1.210，theta - epsilon 处为 1.190。应与 autograd 比较的 central finite-difference gradient 是多少？",
        options: ["0.1", "1.0", "2.0", "20.0"],
        explanation:
          "central difference 为 (1.210 - 1.190) / (2 × 0.01) = 0.020 / 0.020 = 1.0。即使一致，也只验证声明 tolerance 下的局部导数。",
      },
    },
  },
  "q-cnns-visual-representations-boundary": {
    correctIndex: 0,
    capabilityTags: ["receptive-field"],
    capabilityAssessmentMode: "computational",
    copy: {
      en: {
        prompt:
          "A 5 × 5 convolution is followed by a 3 × 3 convolution; both use stride 1 and dilation 1 with no pooling. What is the final receptive-field width?",
        options: ["7", "8", "9", "15"],
        explanation:
          "The first layer sees width 5, and the second adds 3 - 1 = 2 positions at stride 1, giving width 7.",
      },
      zhHans: {
        prompt:
          "一个 5 × 5 convolution 后接一个 3 × 3 convolution；二者均为 stride 1、dilation 1 且无 pooling。最终 receptive-field 宽度是多少？",
        options: ["7", "8", "9", "15"],
        explanation:
          "第一层感受宽度为 5，第二层在 stride 1 下增加 3 - 1 = 2 个位置，因此最终宽度为 7。",
      },
    },
  },
  "q-attention-boundary": {
    correctIndex: 2,
    capabilityTags: ["attention"],
    capabilityAssessmentMode: "computational",
    copy: {
      en: {
        prompt:
          "An attention row has probabilities [0.25, 0.75] and scalar values [2, 6]. What is the attended output?",
        options: ["2", "4", "5", "8"],
        explanation:
          "The weighted sum is 0.25 × 2 + 0.75 × 6 = 0.5 + 4.5 = 5. Attention weights alone still do not establish causal explanation.",
      },
      zhHans: {
        prompt:
          "一行 attention probabilities 为 [0.25, 0.75]，对应 scalar values 为 [2, 6]。attended output 是多少？",
        options: ["2", "4", "5", "8"],
        explanation:
          "加权和为 0.25 × 2 + 0.75 × 6 = 0.5 + 4.5 = 5。attention 权重本身仍不能建立因果解释。",
      },
    },
  },
} as const satisfies Partial<
  Record<GeneratedDeepLearningQuestionId, DeepLearningCapabilityQuestionOverride>
>;

const generatedQuestionBank = generatedQuestionBankBase.map((question) => {
  const owner = DEEP_LEARNING_MODULES.find((module) =>
    question.id.startsWith(`q-${module.slug}-`),
  );
  if (!owner) throw new Error(`Deep Learning question has no module owner: ${question.id}`);
  const capabilityOverride =
    DEEP_LEARNING_CAPABILITY_QUESTION_OVERRIDES[
      question.id as keyof typeof DEEP_LEARNING_CAPABILITY_QUESTION_OVERRIDES
    ];
  return {
    ...question,
    moduleSlug: owner.slug,
    ...(capabilityOverride ?? {}),
  };
});

if (generatedQuestionBank.length !== 36) {
  throw new Error(
    `Deep Learning requires exactly 36 quiz questions; found ${generatedQuestionBank.length}.`,
  );
}

export const DEEP_LEARNING_QUESTION_BANK = generatedQuestionBank as unknown as
  CourseKitNonEmpty<(typeof generatedQuestionBank)[number]>;

export type DeepLearningQuestionId =
  (typeof DEEP_LEARNING_QUESTION_BANK)[number]["id"];

export const DEEP_LEARNING_CRITICAL_QUESTION_IDS = Object.freeze(
  DEEP_LEARNING_QUESTION_BANK.filter(
    (question) => question.critical === true,
  ).map((question) => question.id),
);

export const DEEP_LEARNING_CAPABILITY_QUESTION_IDS = Object.freeze(
  Object.keys(DEEP_LEARNING_CAPABILITY_QUESTION_OVERRIDES) as GeneratedDeepLearningQuestionId[],
);

export const DEEP_LEARNING_QUIZ_FORMS = [
  {
    id: "deep-learning-form-a",
    questionIds: [
      "q-training-loops-debugging-boundary",
      "q-transformer-encoder-decoder-core",
      "q-tokenisation-pretraining-boundary",
      "q-fine-tuning-parameter-efficient-adaptation-boundary",
      "q-robustness-evaluation-training-card-capstone-boundary",
      "q-tensors-computational-graphs-core",
      "q-backpropagation-autodiff-core",
      "q-optimisation-initialisation-normalisation-regularisation-core",
      "q-cnns-visual-representations-core",
      "q-transfer-learning-core",
      "q-sequence-models-rnns-lstms-core",
      "q-attention-core",
      "q-training-loops-debugging-core",
      "q-tokenisation-pretraining-core",
      "q-fine-tuning-parameter-efficient-adaptation-core",
      "q-robustness-evaluation-training-card-capstone-core",
    ],
  },
  {
    id: "deep-learning-form-b",
    questionIds: [
      "q-training-loops-debugging-boundary",
      "q-transformer-encoder-decoder-core",
      "q-tokenisation-pretraining-boundary",
      "q-fine-tuning-parameter-efficient-adaptation-boundary",
      "q-robustness-evaluation-training-card-capstone-boundary",
      "q-tensors-computational-graphs-evidence",
      "q-backpropagation-autodiff-evidence",
      "q-optimisation-initialisation-normalisation-regularisation-evidence",
      "q-cnns-visual-representations-evidence",
      "q-transfer-learning-evidence",
      "q-sequence-models-rnns-lstms-evidence",
      "q-attention-evidence",
      "q-training-loops-debugging-evidence",
      "q-transformer-encoder-decoder-evidence",
      "q-tokenisation-pretraining-evidence",
      "q-fine-tuning-parameter-efficient-adaptation-evidence",
    ],
  },
  {
    id: "deep-learning-form-c",
    questionIds: [
      "q-training-loops-debugging-boundary",
      "q-transformer-encoder-decoder-core",
      "q-tokenisation-pretraining-boundary",
      "q-fine-tuning-parameter-efficient-adaptation-boundary",
      "q-robustness-evaluation-training-card-capstone-boundary",
      "q-tensors-computational-graphs-boundary",
      "q-backpropagation-autodiff-boundary",
      "q-optimisation-initialisation-normalisation-regularisation-boundary",
      "q-cnns-visual-representations-boundary",
      "q-transfer-learning-boundary",
      "q-sequence-models-rnns-lstms-boundary",
      "q-attention-boundary",
      "q-transformer-encoder-decoder-boundary",
      "q-robustness-evaluation-training-card-capstone-evidence",
      "q-training-loops-debugging-core",
      "q-tokenisation-pretraining-core",
    ],
  },
] as const;

interface DeepLearningQuestionCoverageInput {
  readonly id: string;
  readonly moduleSlug?: string;
  readonly critical?: boolean;
  readonly capabilityTags?: readonly string[];
  readonly capabilityAssessmentMode?: "computational" | "diagnostic";
  readonly copy?: {
    readonly en: CourseKitQuizQuestionCopyAuthoringSeed;
    readonly zhHans: CourseKitQuizQuestionCopyAuthoringSeed;
  };
}

export interface DeepLearningQuizCoverageSlice {
  readonly questionIds: readonly string[];
  readonly questionCount: number;
  readonly uniqueQuestionCount: number;
  readonly bankCoverageCount: number;
  readonly bankCoveragePercent: number;
  readonly moduleCoverageCount: number;
  readonly criticalCoverageCount: number;
  readonly capabilityQuestionCount: number;
  readonly capabilityTagCounts: Readonly<Record<DeepLearningCapabilityTag, number>>;
}

export interface DeepLearningQuizCoverageReport {
  readonly bank: DeepLearningQuizCoverageSlice;
  readonly currentDeliveredForm: DeepLearningQuizCoverageSlice & { readonly formId: string };
  readonly forms: readonly (DeepLearningQuizCoverageSlice & { readonly formId: string })[];
  readonly threeFormUnion: DeepLearningQuizCoverageSlice;
  readonly minimumCapabilityQuestionsPerForm: number;
}

function buildCoverageSlice(
  questionIds: readonly string[],
  questionById: ReadonlyMap<string, DeepLearningQuestionCoverageInput>,
  bankSize: number,
): DeepLearningQuizCoverageSlice {
  const uniqueQuestionIds = [...new Set(questionIds)];
  const selected = uniqueQuestionIds
    .map((questionId) => questionById.get(questionId))
    .filter((question): question is DeepLearningQuestionCoverageInput => Boolean(question));
  const capabilityTagCounts = Object.fromEntries(
    DEEP_LEARNING_CAPABILITY_TAGS.map((tag) => [
      tag,
      selected.filter((question) => question.capabilityTags?.includes(tag)).length,
    ]),
  ) as Record<DeepLearningCapabilityTag, number>;
  const bankCoverageCount = selected.length;
  return {
    questionIds: uniqueQuestionIds,
    questionCount: questionIds.length,
    uniqueQuestionCount: uniqueQuestionIds.length,
    bankCoverageCount,
    bankCoveragePercent: bankSize === 0
      ? 0
      : Number(((bankCoverageCount / bankSize) * 100).toFixed(2)),
    moduleCoverageCount: new Set(selected.map((question) => question.moduleSlug).filter(Boolean)).size,
    criticalCoverageCount: selected.filter((question) => question.critical === true).length,
    capabilityQuestionCount: selected.filter(
      (question) => (question.capabilityTags?.length ?? 0) > 0,
    ).length,
    capabilityTagCounts,
  };
}

export function buildDeepLearningQuizCoverageReport(
  questionBank: readonly DeepLearningQuestionCoverageInput[] = DEEP_LEARNING_QUESTION_BANK,
  forms: readonly { readonly id: string; readonly questionIds: readonly string[] }[] =
    DEEP_LEARNING_QUIZ_FORMS,
  currentFormSeed = DEEP_LEARNING_CURRENT_FORM_SEED,
): DeepLearningQuizCoverageReport {
  const questionById = new Map(questionBank.map((question) => [question.id, question]));
  const selectedForm = selectCourseKitQuizForm(
    forms as CourseKitThreeQuizForms<string>,
    currentFormSeed,
  );
  const formCoverage = forms.map((form) => ({
    formId: form.id,
    ...buildCoverageSlice(form.questionIds, questionById, questionBank.length),
  }));
  return {
    bank: buildCoverageSlice(
      questionBank.map((question) => question.id),
      questionById,
      questionBank.length,
    ),
    currentDeliveredForm: {
      formId: selectedForm.id,
      ...buildCoverageSlice(selectedForm.questionIds, questionById, questionBank.length),
    },
    forms: formCoverage,
    threeFormUnion: buildCoverageSlice(
      forms.flatMap((form) => form.questionIds),
      questionById,
      questionBank.length,
    ),
    minimumCapabilityQuestionsPerForm: DEEP_LEARNING_MIN_CAPABILITY_QUESTIONS_PER_FORM,
  };
}

const GENERATED_RECALL_PROMPT = /(?:Which artifact gives the most auditable evidence|Which statement best captures the takeaway|哪一项产物最能|哪项陈述最准确地概括)/;

export function validateDeepLearningQuizCapabilityCoverage(
  questionBank: readonly DeepLearningQuestionCoverageInput[] = DEEP_LEARNING_QUESTION_BANK,
  forms: readonly { readonly id: string; readonly questionIds: readonly string[] }[] =
    DEEP_LEARNING_QUIZ_FORMS,
): readonly string[] {
  const issues: string[] = [];
  const moduleSlugs = DEEP_LEARNING_MODULES.map((module) => module.slug);
  issues.push(...validateCourseKitQuizForms(
    questionBank.map((question) => ({
      id: question.id,
      critical: question.critical === true,
      moduleSlug: question.moduleSlug,
    })),
    forms,
    16,
    moduleSlugs,
  ));
  if (questionBank.length !== 36) {
    issues.push(`Deep Learning capability coverage requires a 36-question bank; found ${questionBank.length}.`);
  }

  const allowedTags = new Set<string>(DEEP_LEARNING_CAPABILITY_TAGS);
  const expectedCapabilityIds = new Set<string>(DEEP_LEARNING_CAPABILITY_QUESTION_IDS);
  for (const question of questionBank) {
    const tags = question.capabilityTags ?? [];
    const expected = DEEP_LEARNING_CAPABILITY_QUESTION_OVERRIDES[
      question.id as keyof typeof DEEP_LEARNING_CAPABILITY_QUESTION_OVERRIDES
    ];
    if (new Set(tags).size !== tags.length) {
      issues.push(`Question ${question.id} repeats a capability tag.`);
    }
    for (const tag of tags) {
      if (!allowedTags.has(tag)) {
        issues.push(`Question ${question.id} uses unsupported capability tag ${tag}.`);
      }
    }
    if (tags.length > 0 && !question.capabilityAssessmentMode) {
      issues.push(`Question ${question.id} has capability tags but no computational/diagnostic mode.`);
    }
    if (tags.length === 0 && question.capabilityAssessmentMode) {
      issues.push(`Question ${question.id} declares a capability mode without capability tags.`);
    }
    if (tags.length > 0 && !expectedCapabilityIds.has(question.id)) {
      issues.push(`Question ${question.id} is not an explicitly authored capability item.`);
    }
    if (expected && tags.length === 0) {
      issues.push(`Authored capability question ${question.id} lost its capability tags.`);
    }
    if (expected) {
      if (question.capabilityAssessmentMode !== expected.capabilityAssessmentMode) {
        issues.push(`Question ${question.id} changed its capability assessment mode.`);
      }
      if (JSON.stringify(tags) !== JSON.stringify(expected.capabilityTags)) {
        issues.push(`Question ${question.id} changed its audited capability tags.`);
      }
      if (question.copy && JSON.stringify(question.copy) !== JSON.stringify(expected.copy)) {
        issues.push(`Question ${question.id} no longer matches its authored bilingual capability item.`);
      }
    }
    if (tags.length > 0 && question.copy
      && (GENERATED_RECALL_PROMPT.test(question.copy.en.prompt)
        || GENERATED_RECALL_PROMPT.test(question.copy.zhHans.prompt))) {
      issues.push(`Question ${question.id} is a generated recall/title item and cannot count as capability evidence.`);
    }
  }

  const report = buildDeepLearningQuizCoverageReport(questionBank, forms);
  for (const form of report.forms) {
    if (form.capabilityQuestionCount < DEEP_LEARNING_MIN_CAPABILITY_QUESTIONS_PER_FORM) {
      issues.push(
        `${form.formId} has ${form.capabilityQuestionCount} capability questions; `
        + `${DEEP_LEARNING_MIN_CAPABILITY_QUESTIONS_PER_FORM} are required.`,
      );
    }
  }
  return issues;
}

export const DEEP_LEARNING_QUIZ_COVERAGE_REPORT =
  buildDeepLearningQuizCoverageReport();

const quizCoverageIssues = validateDeepLearningQuizCapabilityCoverage();
if (quizCoverageIssues.length > 0) {
  throw new Error(`Invalid Deep Learning quiz capability coverage:\n${quizCoverageIssues.join("\n")}`);
}

export const DEEP_LEARNING_QUIZ = {
  schemaVersion: COURSE_KIT_QUIZ_SCHEMA_VERSION,
  version: DEEP_LEARNING_QUIZ_VERSION,
  drawCount: 16,
  passCount: 13,
  questions: DEEP_LEARNING_QUESTION_BANK.map((question) => ({
    id: question.id,
    moduleSlug: question.moduleSlug,
    correctIndex: question.correctIndex,
    sourceIds: question.sourceIds,
    critical: question.critical === true,
    criticalCategory: question.criticalCategory,
    capabilityTags: question.capabilityTags,
    capabilityAssessmentMode: question.capabilityAssessmentMode,
  })) as unknown as CourseKitQuiz<
    DeepLearningQuestionId,
    DeepLearningSourceId
  >["questions"],
  forms: DEEP_LEARNING_QUIZ_FORMS,
} as const;
