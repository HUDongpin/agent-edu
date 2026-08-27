import type { CourseKitModuleAuthoringSeed } from "../course-kit/authoring";
import type {
  CourseKitFourOptions,
  CourseKitNonEmpty,
  CourseKitOptionIndex,
} from "../course-kit/types";
import type { DeepLearningSourceId } from "./sources";

interface DeepLearningModuleText {
  readonly title: string;
  readonly summary: string;
  readonly objective: string;
  readonly artifact: string;
  readonly conceptHeading: string;
  readonly concept: string;
  readonly methodHeading: string;
  readonly method: string;
  readonly boundaryHeading: string;
  readonly boundary: string;
  readonly practiceTitle: string;
  readonly practiceBrief: string;
  readonly steps: CourseKitNonEmpty<string>;
  readonly deliverable: string;
  readonly reviewGate: string;
  readonly checkpointQuestion: string;
  readonly checkpointOptions: CourseKitFourOptions;
  readonly checkpointCorrectIndex: CourseKitOptionIndex;
  readonly checkpointExplanation: string;
  readonly takeaway: string;
}

function deepLearningModule<
  const Slug extends string,
  const PhaseId extends string,
  const SourceId extends DeepLearningSourceId,
>(seed: {
  readonly slug: Slug;
  readonly phaseId: PhaseId;
  readonly minutes: number;
  readonly sourceIds: CourseKitNonEmpty<SourceId>;
  readonly en: DeepLearningModuleText;
  readonly zhHans: DeepLearningModuleText;
}): CourseKitModuleAuthoringSeed<Slug, PhaseId, SourceId> {
  const copy = (text: DeepLearningModuleText) => ({
    title: text.title,
    summary: text.summary,
    objective: text.objective,
    artifact: text.artifact,
    sections: [
      {
        heading: text.conceptHeading,
        paragraphs: [text.concept],
        sourceIds: seed.sourceIds,
        evidenceMode: "source-grounded" as const,
      },
      {
        heading: text.methodHeading,
        paragraphs: [text.method],
        sourceIds: seed.sourceIds,
        evidenceMode: "instructional-synthesis" as const,
      },
      {
        heading: text.boundaryHeading,
        paragraphs: [text.boundary],
        sourceIds: seed.sourceIds,
        evidenceMode: "source-grounded" as const,
      },
    ] as const,
    practice: {
      title: text.practiceTitle,
      brief: text.practiceBrief,
      steps: text.steps,
      deliverable: text.deliverable,
      reviewGate: text.reviewGate,
    },
    checkpoint: {
      question: text.checkpointQuestion,
      options: text.checkpointOptions,
      correctIndex: text.checkpointCorrectIndex,
      explanation: text.checkpointExplanation,
    },
    takeaway: text.takeaway,
  });

  return {
    slug: seed.slug,
    phaseId: seed.phaseId,
    minutes: seed.minutes,
    sourceIds: seed.sourceIds,
    copy: { en: copy(seed.en), zhHans: copy(seed.zhHans) },
  };
}

export const DEEP_LEARNING_MODULES = [
  deepLearningModule({
    slug: "tensors-computational-graphs",
    phaseId: "gradient-foundations",
    minutes: 70,
    sourceIds: ["dl01-tensors-autograd"],
    en: {
      title: "Tensors and computational graphs",
      summary:
        "Treat shape, dtype, device, layout, and gradient connectivity as an executable contract rather than incidental implementation detail.",
      objective:
        "Trace a small tensor program from inputs to scalar loss while checking every shape, dtype, device transition, broadcast, and gradient edge.",
      artifact:
        "Tensor and graph ledger with shape, dtype, device, operation, gradient requirement, and expected failure for every edge",
      conceptHeading: "A tensor carries operational semantics",
      concept:
        "A tensor combines numerical values with shape, dtype, device, strides, and layout. Operations create new values and, when gradient tracking is enabled, autograd records the relationships needed for reverse-mode differentiation. Broadcasting can expand compatible dimensions without materialising the conceptual grid, while views, copies, in-place updates, detach, and device transfers affect storage or graph connectivity in different ways.",
      methodHeading: "Write the contract before the computation",
      method:
        "For each operator, write the semantic axes, expected input and output shapes, dtype, device, whether gradients are required, and one assertion that should fail for an invalid case. Run a tiny hand-checkable example, inspect the graph-facing properties, and compare the observed output with the ledger before scaling the batch or feature dimensions.",
      boundaryHeading: "Valid execution can still encode the wrong computation",
      boundary:
        "A broadcast can be syntactically legal while comparing the wrong axes; an in-place operation can invalidate a needed value; detach can intentionally or accidentally cut gradient flow. A tensor is therefore not interchangeable with an abstract array divorced from precision, layout, mutation, and execution device, and a successful forward pass does not establish that the model objective is meaningful.",
      practiceTitle: "Audit a six-operation graph",
      practiceBrief:
        "Construct a small linear scoring graph and inject one broadcasting error and one detached path.",
      steps: [
        "Declare the semantic meaning, shape, dtype, device, and gradient requirement of every tensor.",
        "Draw the six operations and predict the output shape and graph connectivity before execution.",
        "Run the correct graph, then inject a legal-but-wrong broadcast and a detach; record which assertions detect each fault.",
        "Save a compact receipt containing versions, inputs, observed values, gradients, and unresolved platform assumptions.",
      ],
      deliverable:
        "An annotated tensor ledger and paired passing/failing graph trace",
      reviewGate:
        "A reviewer can infer every tensor's semantic axes and identify both injected faults from assertions rather than from visual inspection alone.",
      checkpointQuestion:
        "Which check is most important before accepting a broadcasted tensor result?",
      checkpointOptions: [
        "The operation used the shortest available syntax",
        "The output shape and semantic axes match the intended observations, features, and comparisons",
        "The tensor was moved to a GPU",
        "The output contains no exact zero values",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "Broadcasting is trustworthy only when both dimensional compatibility and the meaning of each expanded axis match the intended computation.",
      takeaway:
        "Shape, dtype, device, mutation, and gradient connectivity are part of the model contract; successful execution alone is not validation.",
    },
    zhHans: {
      title: "Tensor 与计算图",
      summary:
        "把形状、数据类型、设备、布局与梯度连接当作可执行合同，而不是偶然的实现细节。",
      objective:
        "从输入到标量损失追踪一个小型 tensor 程序，检查每个形状、类型、设备转换、广播与梯度边。",
      artifact:
        "记录每条边的形状、类型、设备、操作、梯度要求与预期失败的 tensor 计算图台账",
      conceptHeading: "Tensor 携带操作语义",
      concept:
        "Tensor 把数值与形状、数据类型、设备、stride 和布局组合在一起。操作生成新值；启用梯度追踪时，autograd 会记录反向模式求导所需关系。广播能在不物化概念网格的情况下扩展兼容维度，而 view、copy、原地更新、detach 与设备迁移会以不同方式影响存储或计算图连接。",
      methodHeading: "先写合同，再做计算",
      method:
        "对每个算子写明语义轴、预期输入输出形状、类型、设备、是否需要梯度，以及一个应在无效案例中失败的断言。先运行可手工核对的微型示例，检查计算图属性，并在扩大 batch 或 feature 维度前把观测输出与台账逐项比较。",
      boundaryHeading: "能够运行仍可能算错东西",
      boundary:
        "广播可能语法合法却比较了错误的轴；原地操作可能破坏反向传播需要的值；detach 可能有意或意外切断梯度。Tensor 因此不能被视为脱离精度、布局、修改与设备的抽象数组；forward 成功也不能证明模型目标有意义。",
      practiceTitle: "审计六步计算图",
      practiceBrief:
        "构造一个小型线性评分图，并注入一个广播错误和一条 detach 路径。",
      steps: [
        "声明每个 tensor 的语义、形状、类型、设备与梯度要求。",
        "画出六个操作，并在执行前预测输出形状与图连接。",
        "运行正确图，再注入合法但错误的广播与 detach，记录哪些断言发现各自故障。",
        "保存包含版本、输入、观测值、梯度与未解决平台假设的简明收据。",
      ],
      deliverable: "一份带注释的 tensor 台账，以及成对的通过/失败计算图 trace",
      reviewGate:
        "审查者无需只靠目视即可推断每个 tensor 的语义轴，并从断言定位两项注入故障。",
      checkpointQuestion: "接受广播后的 tensor 结果前，最重要的检查是什么？",
      checkpointOptions: [
        "操作使用了最短语法",
        "输出形状与语义轴符合预期观察、特征和比较关系",
        "tensor 已移到 GPU",
        "输出中没有精确的零值",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "只有维度兼容且每个扩展轴的含义符合预期计算时，广播结果才可信。",
      takeaway:
        "形状、类型、设备、修改与梯度连接都是模型合同的一部分；仅仅运行成功不等于验证通过。",
    },
  }),
  deepLearningModule({
    slug: "backpropagation-autodiff",
    phaseId: "gradient-foundations",
    minutes: 70,
    sourceIds: ["dl01-tensors-autograd", "dl02-backpropagation"],
    en: {
      title: "Backpropagation and autodiff",
      summary:
        "Connect the chain rule, vector–Jacobian products, autograd, and finite-difference checks without confusing a correct derivative with a correct objective.",
      objective:
        "Derive and verify gradients for a three-parameter network using hand calculation, autograd, and finite differences under explicit numerical tolerances.",
      artifact:
        "Three-way gradient-check report with analytic derivation, autograd values, finite differences, tolerances, and fault diagnosis",
      conceptHeading: "Reverse mode accumulates local derivatives",
      concept:
        "Backpropagation applies the chain rule from a scalar output through composed operations, accumulating derivatives for parameters that influence the result. Modern autograd systems evaluate vector–Jacobian products over the recorded program graph. This avoids constructing a full Jacobian for the common many-parameter, scalar-loss case, but it still differentiates the exact program that ran, including unintended detach, mutation, or branch behavior.",
      methodHeading: "Triangulate gradients on a tiny problem",
      method:
        "Choose a deterministic three-parameter network, derive each partial derivative, compute autograd gradients, and estimate central finite differences at more than one step size. Compare absolute and relative error, disable stochastic layers, use suitable precision, and deliberately detach one intermediate to prove the check detects a broken path.",
      boundaryHeading: "Derivative correctness is narrower than model correctness",
      boundary:
        "Finite differences suffer truncation and rounding error, while nondifferentiable points and stochastic operations can make comparisons unstable. Even exact agreement only shows that the implementation matches the chosen mathematical expression locally; it does not show that the loss represents the right outcome, that labels are valid, or that optimization will generalise.",
      practiceTitle: "Break and repair a gradient path",
      practiceBrief:
        "Verify a tiny nonlinear network, insert detach, and diagnose the resulting mismatch.",
      steps: [
        "Derive the forward expression and all three parameter gradients on paper.",
        "Compare the derivation with autograd using a fixed input and double precision.",
        "Run central finite differences at two step sizes and state absolute and relative tolerances.",
        "Insert detach on one branch, show the failed check, repair it, and record the before/after receipt.",
      ],
      deliverable: "A reproducible gradient-check report with one diagnosed graph break",
      reviewGate:
        "The report separates analytic, autograd, and numerical evidence and explains why agreement does not validate the objective or data.",
      checkpointQuestion: "What does a successful finite-difference gradient check establish?",
      checkpointOptions: [
        "The model objective is ethically and statistically correct",
        "The optimizer will reach the global optimum",
        "For the checked inputs and tolerance, the implemented local derivative agrees with a numerical approximation",
        "The model will generalise to unseen data",
      ],
      checkpointCorrectIndex: 2,
      checkpointExplanation:
        "A gradient check is local implementation evidence under a stated tolerance; it does not validate the objective, data, optimizer, or generalisation.",
      takeaway:
        "Autodiff differentiates the program that executed; triangulate the derivative locally, then validate the objective and data separately.",
    },
    zhHans: {
      title: "反向传播与自动微分",
      summary:
        "连接链式法则、vector–Jacobian product、autograd 与有限差分检查，同时不把导数正确误认为目标正确。",
      objective:
        "在显式数值容差下，用手工推导、autograd 与有限差分推导并验证一个三参数网络的梯度。",
      artifact:
        "包含解析推导、autograd 数值、有限差分、容差与故障诊断的三方梯度检查报告",
      conceptHeading: "反向模式累积局部导数",
      concept:
        "反向传播从标量输出沿组合操作应用链式法则，为影响结果的参数累积导数。现代 autograd 系统在记录的程序图上计算 vector–Jacobian product，避免在多参数、标量损失的常见情形中构造完整 Jacobian；但它求导的是实际运行的程序，其中也包括非预期 detach、修改或分支行为。",
      methodHeading: "在微型问题上三方核对梯度",
      method:
        "选择确定性的三参数网络，推导每个偏导数，计算 autograd 梯度，并用多个步长估计中心有限差分。比较绝对与相对误差，关闭随机层，使用合适精度，再故意 detach 一个中间量，以证明检查能够发现断裂路径。",
      boundaryHeading: "导数正确比模型正确窄得多",
      boundary:
        "有限差分同时受截断与舍入误差影响，非光滑点和随机操作也会使比较不稳定。即使完全一致，也只表明实现在局部匹配所选数学表达式；它不能证明损失代表正确结果、标签有效或优化能够泛化。",
      practiceTitle: "破坏并修复梯度路径",
      practiceBrief: "验证一个微型非线性网络，插入 detach，并诊断不一致。",
      steps: [
        "在纸面推导 forward 表达式与三个参数梯度。",
        "在固定输入与双精度下，把推导结果与 autograd 比较。",
        "用两个步长运行中心有限差分，并声明绝对与相对容差。",
        "在一条分支插入 detach，展示失败检查，修复后保存前后收据。",
      ],
      deliverable: "一份可复现梯度检查报告，包含一项已诊断的计算图断裂",
      reviewGate:
        "报告把解析、autograd 与数值证据分开，并解释为何三者一致仍不能验证目标或数据。",
      checkpointQuestion: "有限差分梯度检查成功能够证明什么？",
      checkpointOptions: [
        "模型目标在伦理和统计上正确",
        "优化器会到达全局最优",
        "在被检查输入与容差下，实现的局部导数和数值近似一致",
        "模型会泛化到未见数据",
      ],
      checkpointCorrectIndex: 2,
      checkpointExplanation:
        "梯度检查是在声明容差下的局部实现证据，不能验证目标、数据、优化器或泛化。",
      takeaway:
        "Autodiff 对实际执行的程序求导；先在局部三方核对导数，再分别验证目标与数据。",
    },
  }),
  deepLearningModule({
    slug: "optimisation-initialisation-normalisation-regularisation",
    phaseId: "gradient-foundations",
    minutes: 75,
    sourceIds: ["dl03-optimisation-adam", "dl04-normalisation-regularisation"],
    en: {
      title: "Optimisation, initialisation, normalisation and regularisation",
      summary:
        "Study training dynamics as an interacting system of scales, updates, parameter starts, normalisation state, regularisation, and evaluation mode.",
      objective:
        "Run a controlled multi-seed ablation that changes one training choice at a time under the same data split, update budget, logging contract, and evaluation rule.",
      artifact:
        "Controlled training-dynamics ablation with configuration matrix, multi-seed curves, budget receipt, and bounded conclusion",
      conceptHeading: "Training behavior is jointly determined",
      concept:
        "Initial parameter scale affects signal and gradient propagation; an optimizer maps gradients and internal state into updates; learning-rate schedules change update magnitude over time; normalisation changes activation statistics; and regularisers alter training behavior or the objective. Adam, Batch Normalization, Dropout, and weight decay are distinct choices whose effects depend on architecture, data, batch regime, precision, and mode.",
      methodHeading: "Change one factor while holding the contract fixed",
      method:
        "Define a baseline, fixed split, maximum updates, stopping rule, seeds, metrics, and compute receipt. Compare only one factor per ablation, log train and validation behavior, preserve failed runs, and report both central tendency and seed variability. Confirm that training and evaluation modes are set intentionally before interpreting BatchNorm or Dropout results.",
      boundaryHeading: "A winning run is not a universal recipe",
      boundary:
        "Original-paper results are bounded by their datasets and architectures. Adaptive updates do not guarantee convergence; BatchNorm can behave poorly with unsuitable batches; Dropout and weight decay are not interchangeable; and tuning many alternatives on one validation set can overfit the comparison itself. Report the explored space and avoid claiming universal superiority.",
      practiceTitle: "Run a budget-matched ablation",
      practiceBrief:
        "Compare a baseline with one optimizer, one normalisation, and one regularisation change across three fixed seeds.",
      steps: [
        "Freeze the data split, update budget, stopping rule, metric definitions, and three seeds.",
        "Change exactly one factor per run and record all defaults that remain active.",
        "Plot training and validation curves with seed-level traces and inspect train/evaluation mode behavior.",
        "Write a conclusion limited to the tested architecture, data, budget, seeds, and metric uncertainty.",
      ],
      deliverable: "A budget-matched multi-seed ablation and decision note",
      reviewGate:
        "Every comparison has the same evaluation contract, exposes failed runs and variability, and avoids turning one observed winner into a general rule.",
      checkpointQuestion:
        "Which comparison best isolates the effect of a regularisation change?",
      checkpointOptions: [
        "Change the regulariser, optimizer, data split, and training budget together",
        "Keep the split, budget, seeds, optimizer, and evaluation rule fixed while changing only the regulariser",
        "Report only the best seed for each setting",
        "Select the setting with the lowest training loss without validation",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "A controlled ablation holds the rest of the experiment contract fixed and reports variability, so the changed factor is interpretable within the tested setting.",
      takeaway:
        "Optimisation choices interact; compare them under a fixed budget and multi-seed contract, then keep conclusions local to the tested regime.",
    },
    zhHans: {
      title: "优化、初始化、归一化与正则化",
      summary:
        "把训练动态视为尺度、更新、参数起点、归一化状态、正则化与评估模式相互作用的系统。",
      objective:
        "在相同数据切分、更新预算、日志合同与评估规则下，运行每次只改变一项训练选择的多种子受控消融。",
      artifact:
        "包含配置矩阵、多种子曲线、预算收据与有边界结论的受控训练动态消融",
      conceptHeading: "训练行为由多项选择共同决定",
      concept:
        "初始参数尺度影响信号和梯度传播；优化器把梯度与内部状态映射为更新；学习率调度随时间改变更新幅度；归一化改变激活统计；正则化则改变训练行为或目标。Adam、Batch Normalization、Dropout 与 weight decay 是不同选择，其效果取决于架构、数据、batch 条件、精度和模式。",
      methodHeading: "固定合同，一次只改一个因素",
      method:
        "定义 baseline、固定切分、最大更新数、停止规则、随机种子、指标与计算收据。每项消融只比较一个因素，记录训练和验证行为，保留失败运行，并同时报告集中趋势与种子差异。解释 BatchNorm 或 Dropout 前，要确认训练与评估模式设置符合意图。",
      boundaryHeading: "一次获胜运行不是普遍配方",
      boundary:
        "原论文结果受数据集和架构约束。自适应更新不保证收敛；不合适 batch 下 BatchNorm 可能表现不佳；Dropout 与 weight decay 不能互换；在同一验证集上调试许多备选方案还可能让比较本身过拟合。应报告探索空间，避免宣称普遍优越。",
      practiceTitle: "运行预算匹配的消融",
      practiceBrief:
        "在三个固定种子上，比较 baseline 与一项优化器、归一化和正则化变化。",
      steps: [
        "冻结数据切分、更新预算、停止规则、指标定义与三个随机种子。",
        "每次运行只改变一个因素，并记录仍然生效的全部默认值。",
        "绘制含种子级 trace 的训练/验证曲线，并检查 train/eval 模式行为。",
        "把结论限制在所测架构、数据、预算、种子与指标不确定性范围。",
      ],
      deliverable: "一份预算匹配的多种子消融与决策说明",
      reviewGate:
        "每项比较使用相同评估合同，公开失败运行与差异，且不把一个观测赢家变成普遍规则。",
      checkpointQuestion: "哪项比较最能隔离正则化变化的效果？",
      checkpointOptions: [
        "同时改变正则化、优化器、数据切分与训练预算",
        "固定切分、预算、种子、优化器与评估规则，只改变正则化",
        "每种设置只报告最佳种子",
        "不做验证，只选择训练损失最低的设置",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "受控消融固定实验合同其余部分并报告差异，因此改变因素在所测条件内才可解释。",
      takeaway:
        "优化选择会相互作用；应在固定预算和多种子合同下比较，并把结论限制在所测条件。",
    },
  }),
  deepLearningModule({
    slug: "training-loops-debugging",
    phaseId: "gradient-foundations",
    minutes: 75,
    sourceIds: ["dl05-training-reproducibility"],
    en: {
      title: "Training loops and debugging",
      summary:
        "Turn the training loop into an inspectable state machine with explicit modes, update order, validation, checkpoints, logs, and recovery tests.",
      objective:
        "Build and fault-test a training loop that can overfit one batch, resume from a checkpoint, and reproduce its declared result within a stated boundary.",
      artifact:
        "Training receipt with loop state machine, fault-injection log, checkpoint-resume comparison, environment lock, and reproducibility boundary",
      conceptHeading: "The loop is an ordered state transition",
      concept:
        "A defensible loop intentionally selects training or evaluation mode, clears or resets gradients, computes predictions and loss, runs backward propagation, applies an optimizer step, validates without unintended updates, records metrics, and checkpoints sufficient state. The order matters because gradients accumulate by default, stateful layers behave differently by mode, and optimizer and scheduler state affect continuation.",
      methodHeading: "Debug from the smallest falsifiable case",
      method:
        "First overfit a single batch to test whether data, labels, loss, gradient flow, and updates can cooperate. Add assertions for finite values and shapes, inspect gradients and update magnitudes, then expand to a tiny fixed split. Inject forgotten gradient reset, wrong evaluation mode, shifted labels, and incomplete checkpoint state; require each fault to produce a specific failed check.",
      boundaryHeading: "A deterministic-looking curve is not a reproducibility guarantee",
      boundary:
        "Loss decline does not establish data correctness or generalisation. Seeds, deterministic flags, environment locks, input hashes, and checkpoint receipts improve reconstruction, but cross-release, cross-platform, parallel, and hardware-level nondeterminism can remain. The claim must state whether equality is exact, tolerance-bounded, or limited to the same decision.",
      practiceTitle: "Fault-test and resume a loop",
      practiceBrief:
        "Start from a one-batch baseline, inject four loop faults, and prove a checkpoint can resume without silent drift.",
      steps: [
        "Overfit one fixed batch and record loss, gradients, update magnitudes, modes, and versions.",
        "Inject missing gradient reset, wrong eval mode, label shift, and a non-finite value; map each to a failing assertion.",
        "Checkpoint model, optimizer, scheduler, step, seed-related state, and data position, then resume in a fresh process.",
        "Compare uninterrupted and resumed runs under an explicit tolerance and document uncontrolled nondeterminism.",
      ],
      deliverable: "A fault-injection log and verified checkpoint-resume training receipt",
      reviewGate:
        "A reviewer can reproduce every injected failure, identify the saved state needed to resume, and see an honest exact-or-tolerance claim.",
      checkpointQuestion:
        "Which evidence is strongest for a claim that training can resume reproducibly?",
      checkpointOptions: [
        "A screenshot of a decreasing loss curve",
        "A saved model weight file without optimizer or step state",
        "A fresh-process comparison of uninterrupted and resumed runs using versioned inputs, complete state, and a declared tolerance",
        "Using the same seed while changing the library and hardware",
      ],
      checkpointCorrectIndex: 2,
      checkpointExplanation:
        "Resume evidence needs versioned inputs, the full continuation state, an independent fresh process, and an explicit comparison boundary.",
      takeaway:
        "Reproducible training is a tested receipt across inputs, environment, state, order, and tolerance—not a seed, checkpoint file, or smooth curve alone.",
    },
    zhHans: {
      title: "训练循环与调试",
      summary:
        "把训练循环转成可检查状态机，显式记录模式、更新顺序、验证、checkpoint、日志与恢复测试。",
      objective:
        "建立并故障测试一个能够过拟合单个 batch、从 checkpoint 恢复，并在声明边界内复现结果的训练循环。",
      artifact:
        "包含循环状态机、故障注入日志、checkpoint 恢复比较、环境锁与可复现边界的训练收据",
      conceptHeading: "循环是有顺序的状态转换",
      concept:
        "可辩护的循环会有意选择训练或评估模式，清除或重置梯度，计算预测与损失，执行反向传播，应用优化器 step，在不产生非预期更新的情况下验证，记录指标，并保存足够状态。顺序很重要，因为梯度默认累积，有状态层随模式改变行为，优化器与调度器状态也会影响继续训练。",
      methodHeading: "从最小可证伪案例开始调试",
      method:
        "先过拟合单个 batch，检查数据、标签、损失、梯度流与更新能否协同。加入有限值和形状断言，检查梯度与更新幅度，再扩展到微型固定切分。注入忘记重置梯度、错误评估模式、标签偏移与不完整 checkpoint 状态，并要求每种故障触发特定失败检查。",
      boundaryHeading: "看似确定的曲线不是可复现保证",
      boundary:
        "损失下降不能证明数据正确或能泛化。种子、确定性标志、环境锁、输入哈希与 checkpoint 收据能提高可重建性，但跨版本、平台、并行方式和硬件的非确定性仍可能存在。声明必须说明要求逐值相等、容差一致，还是只要求得到同一决策。",
      practiceTitle: "故障测试并恢复循环",
      practiceBrief:
        "从单 batch baseline 开始，注入四种循环故障，并证明 checkpoint 不会静默漂移。",
      steps: [
        "过拟合一个固定 batch，记录损失、梯度、更新幅度、模式与版本。",
        "注入未重置梯度、错误 eval 模式、标签偏移与非有限值，把每项映射到失败断言。",
        "保存模型、优化器、调度器、step、随机相关状态与数据位置，再在全新进程中恢复。",
        "在显式容差下比较不中断与恢复运行，并记录未受控非确定性。",
      ],
      deliverable: "一份故障注入日志与经过验证的 checkpoint 恢复训练收据",
      reviewGate:
        "审查者可以复现每项注入故障，识别恢复所需状态，并看到诚实的精确或容差声明。",
      checkpointQuestion: "哪项证据最能支持训练可复现恢复的声明？",
      checkpointOptions: [
        "一张损失下降曲线截图",
        "只有模型权重、没有优化器或 step 状态的文件",
        "在版本化输入、完整状态与声明容差下，从全新进程比较不中断和恢复运行",
        "改变库和硬件但仍使用同一个随机种子",
      ],
      checkpointCorrectIndex: 2,
      checkpointExplanation:
        "恢复证据需要版本化输入、完整继续状态、独立全新进程和显式比较边界。",
      takeaway:
        "可复现训练是跨输入、环境、状态、顺序与容差的测试收据，而不是只有种子、checkpoint 文件或平滑曲线。",
    },
  }),
  deepLearningModule({
    slug: "cnns-visual-representations",
    phaseId: "representation-systems",
    minutes: 75,
    sourceIds: ["dl06-cnn-resnet"],
    en: {
      title: "CNNs and visual representations",
      summary:
        "Build convolutional and residual baselines while keeping receptive field, invariance assumptions, benchmark scope, and interpretation limits visible.",
      objective:
        "Compare linear, convolutional, and residual-style baselines on an original synthetic shape task under a common split, budget, and corruption audit.",
      artifact:
        "Visual-baseline comparison with receptive-field map, parameter counts, clean/corrupted results, error slices, and interpretation boundary",
      conceptHeading: "Convolution encodes a locality prior",
      concept:
        "A convolutional layer applies shared kernels across a grid, creating local connectivity and translation-related parameter sharing. Stacking layers expands the effective receptive field and can form hierarchical representations. Residual blocks add an identity path around learned transformations, a design evaluated as helpful for training deeper image-recognition networks.",
      methodHeading: "Compare architectures on one transparent task",
      method:
        "Generate a labelled dataset of original geometric shapes with fixed train, validation, and test splits. Match training budgets, report parameter counts and receptive fields, and compare a linear baseline, a small CNN, and a residual-style model. Evaluate clean data plus original blur, noise, occlusion, and position-shift slices, and retain representative errors.",
      boundaryHeading: "Visual benchmark success does not transfer automatically",
      boundary:
        "Locality and weight sharing are useful priors, not universal truths. Synthetic geometry and historical image benchmarks do not establish performance for documents, faces, classrooms, medical images, or accessibility use. Saliency or feature maps are not causal explanations, and a deeper network can cost more or generalise worse.",
      practiceTitle: "Audit three visual baselines",
      practiceBrief:
        "Train budget-matched linear, CNN, and residual-style models on the synthetic shape fixture.",
      steps: [
        "Document fixture generation, labels, split hashes, transformations, and intended non-claims.",
        "Calculate parameter counts and receptive fields before training all three baselines under one budget.",
        "Evaluate clean and four corruption slices with uncertainty across fixed seeds.",
        "Review errors and write which conclusions remain specific to this synthetic task.",
      ],
      deliverable: "A three-model visual baseline and corruption-audit report",
      reviewGate:
        "The comparison controls budget and split, reports failures and uncertainty, and makes no claim about real people or untested visual domains.",
      checkpointQuestion: "What does weight sharing in a convolution directly provide?",
      checkpointOptions: [
        "A guarantee of rotation invariance and fairness",
        "The same learned kernel is applied across spatial locations, encoding a locality-related prior",
        "A causal explanation for every prediction",
        "A guarantee that a deeper model will be more accurate",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "Convolution reuses a kernel across locations and imposes a locality-related structure; stronger invariance, explanation, fairness, and performance claims require separate evidence.",
      takeaway:
        "CNN and residual designs encode useful visual priors, but their value and failure modes must be measured on the actual domain under matched baselines.",
    },
    zhHans: {
      title: "CNN 与视觉表示",
      summary:
        "建立卷积与残差 baseline，同时使 receptive field、不变性假设、基准范围与解释限制保持可见。",
      objective:
        "在共同切分、预算与 corruption 审计下，对原创合成形状任务比较线性、卷积和残差式 baseline。",
      artifact:
        "包含 receptive-field 图、参数量、干净/扰动结果、错误切片与解释边界的视觉 baseline 比较",
      conceptHeading: "卷积编码局部性先验",
      concept:
        "卷积层在网格上重复应用共享 kernel，形成局部连接与和位置平移有关的参数共享。堆叠层会扩大有效 receptive field，并可形成层级表示。残差 block 在学习变换外增加 identity path；该设计曾被评估为有助于训练更深的图像识别网络。",
      methodHeading: "在一个透明任务上比较架构",
      method:
        "生成带固定训练、验证和测试切分的原创几何形状标注数据。匹配训练预算，报告参数量与 receptive field，并比较线性 baseline、小型 CNN 和残差式模型。评估干净数据以及原创模糊、噪声、遮挡和位置偏移切片，并保留代表性错误。",
      boundaryHeading: "视觉基准成功不会自动迁移",
      boundary:
        "局部性与权重共享是有用先验，不是普遍真理。合成几何和历史图像基准不能证明模型在文档、人脸、课堂、医学图像或无障碍场景中的表现。Saliency 或 feature map 不是因果解释，更深网络也可能成本更高或泛化更差。",
      practiceTitle: "审计三个视觉 baseline",
      practiceBrief: "在合成形状 fixture 上训练预算匹配的线性、CNN 与残差式模型。",
      steps: [
        "记录 fixture 生成、标签、切分哈希、转换与明确不作出的声明。",
        "训练前三个 baseline 前，计算参数量与 receptive field，并统一预算。",
        "用固定种子评估干净数据和四项 corruption 切片及不确定性。",
        "审核错误，并写明哪些结论只适用于此合成任务。",
      ],
      deliverable: "一份三模型视觉 baseline 与 corruption 审计报告",
      reviewGate:
        "比较控制预算和切分，报告失败与不确定性，且不对真实人物或未测试视觉领域提出主张。",
      checkpointQuestion: "卷积中的权重共享直接提供什么？",
      checkpointOptions: [
        "旋转不变性与公平保证",
        "同一学习 kernel 在不同空间位置应用，从而编码与局部性有关的先验",
        "每次预测的因果解释",
        "更深模型一定更准确的保证",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "卷积跨位置复用 kernel 并施加局部性结构；更强的不变性、解释、公平和性能主张需要另外的证据。",
      takeaway:
        "CNN 与残差设计编码有用视觉先验，但其价值与失败模式必须在真实目标领域和匹配 baseline 下测量。",
    },
  }),
  deepLearningModule({
    slug: "transfer-learning",
    phaseId: "representation-systems",
    minutes: 75,
    sourceIds: ["dl07-transfer-learning"],
    en: {
      title: "Transfer learning",
      summary:
        "Compare training from scratch, fixed-feature extraction, partial unfreezing, and full fine-tuning as evidence-bearing choices rather than a guaranteed upgrade.",
      objective:
        "Evaluate four transfer strategies on a small target task while recording source model, frozen parameters, target-data size, compute, subgroup results, and licence boundary.",
      artifact:
        "Transfer comparison ledger with source provenance, freeze map, strategy matrix, cost, subgroup errors, and negative-transfer decision",
      conceptHeading: "Transfer reuses learned parameters under a new contract",
      concept:
        "A pretrained network supplies a parameter starting point or a fixed feature extractor. Strategies range from replacing only the task head, through unfreezing selected blocks, to updating the entire network. Each choice changes trainable parameter count, memory, optimisation sensitivity, and the degree to which the target task can reshape inherited representations.",
      methodHeading: "Make the source–target relationship testable",
      method:
        "Record the exact checkpoint, source-data statement, licence, preprocessing, and target-task contract. Compare scratch, frozen, partial, and full strategies on identical splits and budgets; log trainable parameters, wall time, peak memory, seed variability, and worst-group or slice results. Define negative transfer before inspecting outcomes and retain a scratch baseline.",
      boundaryHeading: "Pretraining can import mismatch, rights, and bias",
      boundary:
        "The official tutorial demonstrates one workflow, not universal improvement. Source and target domains may differ in features, labels, population, or task; inherited representations can harm a target slice. Performance does not resolve whether source data or weights may be used, nor does it establish safety or suitability for high-impact decisions.",
      practiceTitle: "Compare four transfer strategies",
      practiceBrief:
        "Run scratch, frozen, partial, and full adaptation on one fixed small-data fixture.",
      steps: [
        "Record source checkpoint identity, preprocessing, known source-data statement, licence, and target task.",
        "Create a freeze map and verify trainable parameter counts for all four strategies.",
        "Run matched splits, seeds, update budgets, and metrics, including one predefined difficult slice.",
        "Apply the negative-transfer rule and write a use, revise, or reject decision with cost and rights caveats.",
      ],
      deliverable: "A source-to-target transfer audit and strategy decision",
      reviewGate:
        "The scratch baseline, source provenance, freeze state, resource cost, slice results, and licence caveat are all independently reviewable.",
      checkpointQuestion: "Which result would be evidence of negative transfer?",
      checkpointOptions: [
        "A pretrained model has more parameters than the task head",
        "Under the matched evaluation contract, a transfer strategy performs reliably worse than the scratch baseline on the declared target criterion",
        "The source model was trained for more epochs",
        "The transfer tutorial uses a vision dataset",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "Negative transfer is demonstrated relative to a defined target criterion and matched scratch baseline, not by parameter count or provenance alone.",
      takeaway:
        "Transfer is a source-to-target hypothesis that must survive a scratch baseline, slice audit, cost comparison, and independent rights review.",
    },
    zhHans: {
      title: "迁移学习",
      summary:
        "把从头训练、固定特征提取、部分解冻与全量微调作为带证据的选择进行比较，而不是视为必然升级。",
      objective:
        "在小型目标任务上评估四种迁移策略，并记录源模型、冻结参数、目标数据量、计算、子群结果与许可边界。",
      artifact:
        "包含源来源、冻结图、策略矩阵、成本、子群错误与负迁移决策的迁移比较台账",
      conceptHeading: "迁移在新合同下复用已学习参数",
      concept:
        "预训练网络提供参数起点或固定特征提取器。策略可从只替换任务 head，到解冻部分 block，再到更新整个网络。每项选择都会改变可训练参数量、内存、优化敏感度，以及目标任务重塑继承表示的程度。",
      methodHeading: "使源域与目标域关系可测试",
      method:
        "记录精确 checkpoint、源数据声明、许可、预处理与目标任务合同。在相同切分和预算下比较 scratch、frozen、partial 与 full 策略；记录可训练参数、墙钟时间、峰值内存、种子差异和 worst-group 或切片结果。查看结果前定义负迁移，并始终保留 scratch baseline。",
      boundaryHeading: "预训练会带入不匹配、权利与偏差",
      boundary:
        "官方教程展示一种流程，不是普遍改进保证。源域和目标域可能在特征、标签、人群或任务上不同，继承表示也可能伤害目标切片。性能不能解决源数据或权重是否可使用的问题，也不能证明高影响决策的安全或适用性。",
      practiceTitle: "比较四种迁移策略",
      practiceBrief:
        "在一个固定小数据 fixture 上运行 scratch、frozen、partial 与 full adaptation。",
      steps: [
        "记录源 checkpoint 身份、预处理、已知源数据声明、许可与目标任务。",
        "创建冻结图并验证四种策略的可训练参数量。",
        "运行匹配的切分、种子、更新预算和指标，包含一个预定义困难切片。",
        "应用负迁移规则，写出使用、修订或拒绝决策，并注明成本与权利限制。",
      ],
      deliverable: "一份源到目标迁移审计与策略决策",
      reviewGate:
        "scratch baseline、源来源、冻结状态、资源成本、切片结果与许可限制都可独立审核。",
      checkpointQuestion: "哪项结果能构成负迁移证据？",
      checkpointOptions: [
        "预训练模型的参数比任务 head 多",
        "在匹配评估合同下，某迁移策略在声明目标标准上稳定差于 scratch baseline",
        "源模型训练 epoch 更多",
        "迁移教程使用视觉数据集",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "负迁移要相对于定义明确的目标标准与匹配 scratch baseline 证明，不能仅凭参数量或来源判定。",
      takeaway:
        "迁移是一项源到目标假设，必须通过 scratch baseline、切片审计、成本比较与独立权利审查。",
    },
  }),
  deepLearningModule({
    slug: "sequence-models-rnns-lstms",
    phaseId: "representation-systems",
    minutes: 70,
    sourceIds: ["dl08-lstm-sequences"],
    en: {
      title: "Sequence models, RNNs and LSTMs",
      summary:
        "Make recurrent state, gates, padding, masks, sequence length, and evaluation horizon explicit before claiming that a model learned temporal structure.",
      objective:
        "Implement and test a recurrent baseline on synthetic sequences, including state-reset, padding-mask, and length-extrapolation checks.",
      artifact:
        "Sequence-model audit with unrolled state diagram, mask tests, length slices, state-reset receipt, and error analysis",
      conceptHeading: "Recurrence carries state through ordered inputs",
      concept:
        "An RNN applies a recurrent transition to the current input and prior hidden state. LSTM adds gates and a cell state designed to control information flow and mitigate some vanishing-gradient difficulties. Batching variable-length sequences introduces padding and masks, while bidirectionality, teacher forcing, and state persistence each change what information the model can use.",
      methodHeading: "Test temporal assumptions directly",
      method:
        "Use original bracket or event sequences with controlled dependencies and separate length ranges. Draw the unrolled recurrence, assert that padded positions do not affect the loss, reset state between independent examples, and compare performance by length and dependency distance. Include a simple non-recurrent baseline so that sequence complexity must earn its place.",
      boundaryHeading: "Gating does not solve every long dependency",
      boundary:
        "LSTM mitigates particular optimisation problems but does not guarantee retention, compositional reasoning, or extrapolation. A model can exploit padding, position, or teacher-forcing artifacts; a random split can leak near-duplicate sequences; and good average accuracy can hide collapse on longer or rare patterns.",
      practiceTitle: "Audit state and length",
      practiceBrief:
        "Train a small recurrent model on synthetic event sequences, then challenge its masks, state reset, and length range.",
      steps: [
        "Define sequence grammar, independence boundaries, padding value, mask, and train/test length ranges.",
        "Unit-test that padded tokens do not change loss and state resets between independent sequences.",
        "Compare a non-recurrent baseline, an RNN, and an LSTM under one budget.",
        "Report performance and representative failures by length and dependency distance.",
      ],
      deliverable: "A state, mask, and length-extrapolation audit for a recurrent model",
      reviewGate:
        "Tests fail when padding contributes to loss or state crosses example boundaries, and the report does not hide long-sequence failures in an average.",
      checkpointQuestion: "Why must padded positions be masked in many sequence losses?",
      checkpointOptions: [
        "Padding always improves accuracy",
        "Otherwise artificial padding tokens can contribute to the objective and distort learning and evaluation",
        "Masks make every sequence the same true length",
        "A mask guarantees long-range generalisation",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "Padding is a batching artifact; without a correct mask it can affect loss, gradients, and metrics as if it were observed data.",
      takeaway:
        "Sequence claims require explicit state, masks, independence, and length-sliced evidence; an LSTM label alone proves none of them.",
    },
    zhHans: {
      title: "序列模型、RNN 与 LSTM",
      summary:
        "在声称模型学到时间结构前，明确递归状态、门、padding、mask、序列长度与评估范围。",
      objective:
        "在合成序列上实现并测试递归 baseline，包含状态重置、padding mask 与长度外推检查。",
      artifact:
        "包含展开状态图、mask 测试、长度切片、状态重置收据与错误分析的序列模型审计",
      conceptHeading: "递归通过有序输入传递状态",
      concept:
        "RNN 对当前输入和先前 hidden state 应用递归转换。LSTM 增加门与 cell state，以控制信息流并缓解部分梯度消失困难。对可变长度序列做 batch 需要 padding 与 mask，而双向结构、teacher forcing 与状态持久化都会改变模型能够使用的信息。",
      methodHeading: "直接测试时间假设",
      method:
        "使用具有受控依赖和分离长度范围的原创括号或事件序列。画出展开递归，断言 padding 位置不影响损失，在独立样本之间重置状态，并按长度与依赖距离比较表现。加入简单非递归 baseline，使序列复杂度必须用结果证明价值。",
      boundaryHeading: "门控不能解决所有长期依赖",
      boundary:
        "LSTM 缓解特定优化问题，但不保证记忆、组合推理或外推。模型可能利用 padding、位置或 teacher-forcing artifact；随机切分可能泄漏近重复序列；良好平均准确率也可能掩盖更长或稀有模式上的崩溃。",
      practiceTitle: "审计状态与长度",
      practiceBrief:
        "在合成事件序列上训练小型递归模型，再挑战其 mask、状态重置与长度范围。",
      steps: [
        "定义序列语法、独立边界、padding 值、mask 与训练/测试长度范围。",
        "单元测试 padding token 不改变损失，且独立序列之间重置状态。",
        "在统一预算下比较非递归 baseline、RNN 与 LSTM。",
        "按长度与依赖距离报告表现和代表性失败。",
      ],
      deliverable: "一份递归模型的状态、mask 与长度外推审计",
      reviewGate:
        "当 padding 计入损失或状态跨样本传递时测试会失败，报告也不会用平均值掩盖长序列失败。",
      checkpointQuestion: "为什么许多序列损失必须屏蔽 padding 位置？",
      checkpointOptions: [
        "padding 总能提高准确率",
        "否则人为 padding token 会像观测数据一样影响目标，扭曲学习与评估",
        "mask 会让每个序列的真实长度相同",
        "mask 能保证长期泛化",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "padding 是 batch artifact；没有正确 mask，它会像观测数据一样影响损失、梯度与指标。",
      takeaway:
        "序列主张需要显式状态、mask、独立性与长度切片证据；仅有 LSTM 名称不能证明这些条件。",
    },
  }),
  deepLearningModule({
    slug: "attention",
    phaseId: "representation-systems",
    minutes: 75,
    sourceIds: ["dl09-attention"],
    en: {
      title: "Attention",
      summary:
        "Compute query–key compatibility and value aggregation by hand, then test what attention weights do and do not support as evidence.",
      objective:
        "Derive a four-token attention calculation, verify masking and normalisation, and run perturbation tests before interpreting the weights.",
      artifact:
        "Four-token attention worksheet with scores, mask, normalised weights, output, perturbation tests, and interpretation limits",
      conceptHeading: "Attention is weighted information aggregation",
      concept:
        "An attention mechanism forms compatibility scores between a query and keys, applies a mask where information must be unavailable, normalises scores into weights, and aggregates corresponding values. Additive and dot-product forms differ in score construction, while multi-head variants learn several projections. The resulting coefficients participate in computation rather than serving as an automatic explanation layer.",
      methodHeading: "Calculate first, interpret second",
      method:
        "Use four small vectors to calculate scores, masked scores, softmax weights, and the weighted value sum. Check that prohibited positions receive no probability and that valid weights sum to one. Then swap an irrelevant token, perturb a high-weight token, and compare both weights and output; record whether the claimed interpretation survives.",
      boundaryHeading: "A large weight is not a causal attribution",
      boundary:
        "Attention weights can change under equivalent or compensating representations, and model outputs depend on values, residual paths, later layers, and other heads. They do not by themselves establish why a prediction occurred, what would happen under intervention, or whether a human-readable rationale is faithful.",
      practiceTitle: "Hand-audit four-token attention",
      practiceBrief:
        "Calculate one masked attention operation and challenge a proposed explanation with perturbations.",
      steps: [
        "Write the query, key, and value vectors and calculate all compatibility scores.",
        "Apply the information-availability mask before normalisation and verify the probability sum.",
        "Compute the weighted output and reproduce it with code under a stated tolerance.",
        "Run two token perturbations and write an interpretation that does not overclaim causality.",
      ],
      deliverable: "A hand-verified attention calculation and perturbation-based interpretation note",
      reviewGate:
        "The worksheet catches an incorrectly ordered mask and explicitly separates computational weight from causal or human explanation.",
      checkpointQuestion: "What can an attention weight directly establish?",
      checkpointOptions: [
        "The token causally caused the final decision",
        "Within that attention operation, the token's value contributes according to the computed coefficient",
        "The model's explanation is faithful to human reasoning",
        "The model is fair for all language groups",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "The coefficient has a defined role in one aggregation operation; causal, faithful-explanation, and fairness claims require additional methods and evidence.",
      takeaway:
        "Attention weights are computational coefficients; inspect masks, values, downstream paths, and perturbations before making any explanatory claim.",
    },
    zhHans: {
      title: "注意力机制",
      summary:
        "手工计算 query–key 兼容性与 value 聚合，再测试 attention 权重能与不能支持哪些证据主张。",
      objective:
        "推导四 token attention 计算，验证 mask 与归一化，并在解释权重前运行扰动测试。",
      artifact:
        "包含 score、mask、归一化权重、输出、扰动测试与解释限制的四 token attention 工作表",
      conceptHeading: "注意力机制是加权信息聚合",
      concept:
        "Attention 机制计算 query 与 key 的兼容性 score，在信息不可用处应用 mask，把 score 归一化为权重，再聚合对应 value。加性与点积形式的 score 构造不同，多头变体则学习多组投影。所得系数参与计算，而不是自动提供解释的层。",
      methodHeading: "先计算，再解释",
      method:
        "用四个小向量计算 score、mask 后 score、softmax 权重与加权 value 和。检查禁止位置没有概率，且有效权重总和为一。随后交换无关 token、扰动高权重 token，同时比较权重与输出，并记录提出的解释是否仍成立。",
      boundaryHeading: "大权重不是因果归因",
      boundary:
        "attention 权重可在等价或补偿表示下变化，模型输出还依赖 value、残差路径、后续层与其他 head。它们本身不能证明预测为何发生、干预后会怎样，或人类可读理由是否忠实。",
      practiceTitle: "手工审计四 token attention",
      practiceBrief: "计算一次带 mask 的 attention 操作，并用扰动挑战一项解释。",
      steps: [
        "写出 query、key 与 value 向量，计算全部兼容性 score。",
        "在归一化前应用信息可见性 mask，并验证概率总和。",
        "计算加权输出，并在声明容差下用代码复现。",
        "运行两项 token 扰动，写出不夸大因果性的解释。",
      ],
      deliverable: "一份手工验证的 attention 计算与基于扰动的解释说明",
      reviewGate:
        "工作表能发现顺序错误的 mask，并明确分开计算权重与因果或人类解释。",
      checkpointQuestion: "attention 权重能够直接证明什么？",
      checkpointOptions: [
        "该 token 导致了最终决策",
        "在该 attention 操作内，token 的 value 按计算系数参与聚合",
        "模型解释忠实于人类推理",
        "模型对所有语言群体都公平",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "系数在一次聚合操作中有明确作用；因果、忠实解释与公平主张需要其他方法与证据。",
      takeaway:
        "attention 权重是计算系数；提出解释前要检查 mask、value、下游路径与扰动结果。",
    },
  }),
  deepLearningModule({
    slug: "transformer-encoder-decoder",
    phaseId: "transformers-and-adaptation",
    minutes: 75,
    sourceIds: ["dl10-transformer"],
    en: {
      title: "Transformer encoder and decoder",
      summary:
        "Trace embeddings, positions, self-attention, cross-attention, feed-forward blocks, residual paths, normalisation, and masks as one information-flow contract.",
      objective:
        "Specify and test encoder, padding, and causal masks so a Transformer cannot access prohibited tokens or future labels.",
      artifact:
        "Transformer information-flow map with mask truth tables, tensor shapes, future-token leakage tests, and version boundary",
      conceptHeading: "Transformer blocks alternate mixing and transformation",
      concept:
        "The original encoder–decoder Transformer combines token and positional representations with multi-head attention, feed-forward sublayers, residual connections, and normalisation. Encoder self-attention mixes permitted source positions; decoder causal self-attention restricts access to future targets; cross-attention connects decoder queries to encoder outputs. Concrete ordering and implementation details vary across model families.",
      methodHeading: "Treat each mask as a security-style policy",
      method:
        "Write a truth table naming every query and key position that may interact, including padding and causal constraints. Assert mask shape, type, convention, and broadcast behavior at runtime. Create two target sequences with identical prefixes but different future tokens and prove logits for an earlier position remain unchanged; add a deliberately shifted target to catch label leakage.",
      boundaryHeading: "A wrong mask can create silent future leakage",
      boundary:
        "Training metrics can look excellent when targets are shifted incorrectly or the causal mask exposes future information. The 2017 architecture does not specify every modern pre-norm, rotary-position, sparse-attention, or cache implementation. Complexity and memory depend on sequence length, batching, kernel, precision, and cache policy rather than on the word Transformer alone.",
      practiceTitle: "Prove future tokens are invisible",
      practiceBrief:
        "Build a mask truth table and a regression test that fails when future information leaks.",
      steps: [
        "Draw encoder, decoder, residual, and cross-attention paths with tensor shapes.",
        "Define padding and causal mask truth tables and assert their runtime shapes and conventions.",
        "Change future target tokens while holding the prefix fixed and compare earlier logits exactly or within tolerance.",
        "Introduce an off-by-one target shift, demonstrate the failed leakage test, and save the repair receipt.",
      ],
      deliverable: "A mask contract and passing future-token leakage regression test",
      reviewGate:
        "The tests fail under an off-by-one target shift or permissive causal mask and show that earlier logits cannot use changed future tokens.",
      checkpointQuestion: "Which test most directly detects causal-mask leakage?",
      checkpointOptions: [
        "Check that training loss decreases",
        "Change future tokens while keeping a prefix fixed and verify logits for earlier positions do not change",
        "Count the model parameters",
        "Confirm that attention weights sum to one",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "A causal information-flow test holds the observable prefix fixed, changes only prohibited future information, and checks that earlier outputs remain invariant.",
      takeaway:
        "Masking is an information-authority contract; future-token invariance must be tested, not inferred from a familiar Transformer API.",
    },
    zhHans: {
      title: "Transformer encoder–decoder 系统",
      summary:
        "把 embedding、位置、自注意力、交叉注意力、feed-forward block、残差路径、归一化与 mask 作为一份信息流合同追踪。",
      objective:
        "规定并测试 encoder、padding 与 causal mask，使 Transformer 无法访问被禁止的 token 或未来标签。",
      artifact:
        "包含 mask 真值表、tensor 形状、未来 token 泄漏测试与版本边界的 Transformer 信息流图",
      conceptHeading: "Transformer block 交替混合与转换表示",
      concept:
        "原始 encoder–decoder Transformer 把 token 与位置表示同多头 attention、feed-forward 子层、残差连接和归一化结合。Encoder 自注意力混合允许的源位置；decoder causal 自注意力限制未来目标；cross-attention 把 decoder query 连接到 encoder 输出。具体顺序与实现细节会随模型家族变化。",
      methodHeading: "把每个 mask 当作类似安全策略的合同",
      method:
        "写出真值表，列明每个 query 和 key 位置能否交互，包含 padding 与 causal 约束。运行时断言 mask 形状、类型、约定与广播行为。创建前缀相同、未来 token 不同的两个目标序列，证明较早位置 logits 保持不变；再加入故意错位的 target 以捕获标签泄漏。",
      boundaryHeading: "错误 mask 会造成静默未来泄漏",
      boundary:
        "当 target 错位或 causal mask 暴露未来信息时，训练指标可能看起来异常优秀。2017 年架构并不规定所有现代 pre-norm、旋转位置、稀疏 attention 或 cache 实现。复杂度与内存取决于序列长度、batch、kernel、精度和 cache 策略，而不是只取决于 Transformer 名称。",
      practiceTitle: "证明未来 token 不可见",
      practiceBrief: "建立 mask 真值表和在未来信息泄漏时必然失败的回归测试。",
      steps: [
        "画出 encoder、decoder、残差与 cross-attention 路径及 tensor 形状。",
        "定义 padding 与 causal mask 真值表，并断言运行时形状与约定。",
        "保持前缀固定、改变未来目标 token，精确或在容差内比较较早 logits。",
        "引入错一位 target shift，展示泄漏测试失败并保存修复收据。",
      ],
      deliverable: "一份 mask 合同与通过的未来 token 泄漏回归测试",
      reviewGate:
        "测试会在 target 错位或 causal mask 过宽时失败，并显示较早 logits 不能使用改变后的未来 token。",
      checkpointQuestion: "哪项测试最直接发现 causal-mask 泄漏？",
      checkpointOptions: [
        "检查训练损失是否下降",
        "保持前缀固定、改变未来 token，并验证较早位置 logits 不变",
        "统计模型参数量",
        "确认 attention 权重总和为一",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "因果信息流测试固定可观察前缀，只改变被禁止的未来信息，并检查较早输出是否保持不变。",
      takeaway:
        "Mask 是信息权限合同；未来 token 不变性必须测试，不能从熟悉的 Transformer API 推断。",
    },
  }),
  deepLearningModule({
    slug: "tokenisation-pretraining",
    phaseId: "transformers-and-adaptation",
    minutes: 75,
    sourceIds: ["dl11-tokenisation-pretraining"],
    en: {
      title: "Tokenisation and pretraining",
      summary:
        "Audit the mapping from text to token IDs and the evidence boundary between a pretraining objective, a corpus, and downstream capability claims.",
      objective:
        "Compare tokenisation behavior across English, Simplified Chinese, numbers, emoji, and rare characters while documenting reversibility, cost, unknown tokens, normalisation, and data-rights questions.",
      artifact:
        "Multiscript tokenisation and pretraining audit with text/token pairs, normalisation tests, cost ratios, corpus provenance questions, and non-claims",
      conceptHeading: "A tokenizer defines the model's input units",
      concept:
        "Subword tokenizers learn or apply a vocabulary that maps text segments to IDs, often with normalisation and special-token rules. SentencePiece demonstrated language-independent training from raw sentences, while BERT paired WordPiece-style tokenisation with masked-language and sentence-level pretraining objectives. The tokenizer, vocabulary, objective, corpus, and sequence policy jointly determine what signals are available.",
      methodHeading: "Audit representation before measuring model quality",
      method:
        "Use original strings covering English, Simplified Chinese, mixed scripts, numbers, whitespace, emoji, combining characters, and rare symbols. Record normalised text, token IDs, token pieces, round-trip result, unknown or byte behavior, and tokens per character. Pair this with a provenance checklist for corpus identity, rights, consent, exclusions, dates, languages, filtering, and known gaps.",
      boundaryHeading: "Tokens are not words, and pretraining is not permission",
      boundary:
        "Token counts can differ sharply across scripts and models, affecting context and cost. Round-trip behavior can be lossy under normalisation. A pretraining paper's downstream results do not prove factuality, safety, equal language service, lawful corpus acquisition, or fitness for a new task; proprietary vocabularies and corpora must not be copied into the fixture.",
      practiceTitle: "Run a multiscript token audit",
      practiceBrief:
        "Compare one declared tokenizer on an original 24-string suite and review the associated corpus evidence questions.",
      steps: [
        "Version the tokenizer and create original strings spanning scripts, whitespace, numbers, emoji, and rare forms.",
        "Record normalisation, pieces, IDs, round-trip output, and tokens-per-character for every string.",
        "Identify the three largest cost or reversibility differences and test whether preprocessing caused them.",
        "Complete the corpus provenance checklist and write explicit capability, rights, and language-equity non-claims.",
      ],
      deliverable: "A multiscript tokenisation receipt and corpus-provenance boundary memo",
      reviewGate:
        "Every string is original, tokenizer/version details are recorded, disparities remain visible, and performance is not used as a substitute for data-rights evidence.",
      checkpointQuestion: "Which statement about token counts is defensible?",
      checkpointOptions: [
        "One token always equals one word",
        "Token counts depend on the tokenizer, vocabulary, normalisation, and input script, so language and cost comparisons must be measured",
        "A lower token count proves better factual accuracy",
        "Round-trip decoding always restores the exact original Unicode sequence",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "Token units are tokenizer-specific and can vary by script and normalisation; counts and reversibility must be measured for the actual configuration.",
      takeaway:
        "Tokenisation fixes an input representation and cost boundary; pretraining results do not settle language equity, factuality, safety, or corpus rights.",
    },
    zhHans: {
      title: "Tokenisation 与预训练",
      summary:
        "审计文本到 token ID 的映射，并明确预训练目标、语料与下游能力主张之间的证据边界。",
      objective:
        "比较英文、简中、数字、emoji 与罕见字符的 tokenisation 行为，并记录可逆性、成本、未知 token、归一化与数据权利问题。",
      artifact:
        "包含文本/token 对、归一化测试、成本比、语料来源问题与非声明的多脚本 tokenisation/预训练审计",
      conceptHeading: "Tokenizer 定义模型输入单元",
      concept:
        "子词 tokenizer 学习或应用把文本片段映射为 ID 的词表，通常还带归一化与特殊 token 规则。SentencePiece 展示了从原始句子训练、较少依赖语言特定预处理的方法，BERT 则把 WordPiece 风格 tokenisation 与 masked-language 和句级预训练目标结合。Tokenizer、词表、目标、语料与序列策略共同决定可用信号。",
      methodHeading: "衡量模型质量前先审计表示",
      method:
        "使用覆盖英文、简中、混合脚本、数字、空白、emoji、组合字符与罕见符号的原创字符串。记录归一化文本、token ID、片段、round-trip 结果、未知或 byte 行为，以及每字符 token 数。再配套语料身份、权利、同意、排除、日期、语言、过滤与已知缺口来源清单。",
      boundaryHeading: "Token 不是词，预训练也不是许可",
      boundary:
        "不同脚本和模型的 token 数可能差异很大，影响上下文与成本；归一化还可能使 round-trip 有损。预训练论文的下游结果不能证明事实性、安全、语言服务平等、语料获取合法或适合新任务；fixture 也不得复制专有词表或语料。",
      practiceTitle: "运行多脚本 token 审计",
      practiceBrief: "在原创 24 字符串套件上比较一个声明版本的 tokenizer，并审核语料证据问题。",
      steps: [
        "版本化 tokenizer，创建覆盖脚本、空白、数字、emoji 与罕见形式的原创字符串。",
        "逐项记录归一化、片段、ID、round-trip 输出与每字符 token 数。",
        "识别三项最大成本或可逆性差异，并测试是否由预处理造成。",
        "完成语料来源清单，明确写出能力、权利与语言公平的非声明。",
      ],
      deliverable: "一份多脚本 tokenisation 收据与语料来源边界备忘录",
      reviewGate:
        "所有字符串均为原创，tokenizer/版本有记录，差异保持可见，且没有用性能替代数据权利证据。",
      checkpointQuestion: "关于 token 数，哪项陈述可辩护？",
      checkpointOptions: [
        "一个 token 永远等于一个词",
        "token 数取决于 tokenizer、词表、归一化与输入脚本，因此语言和成本比较必须实测",
        "token 更少能证明事实准确率更高",
        "round-trip 解码总能恢复完全相同的原始 Unicode 序列",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "Token 单元由具体 tokenizer 决定，并会随脚本与归一化变化；必须针对实际配置测量数量与可逆性。",
      takeaway:
        "Tokenisation 固定输入表示与成本边界；预训练结果不能解决语言公平、事实性、安全或语料权利问题。",
    },
  }),
  deepLearningModule({
    slug: "fine-tuning-parameter-efficient-adaptation",
    phaseId: "transformers-and-adaptation",
    minutes: 65,
    sourceIds: ["dl12-lora-peft"],
    en: {
      title: "Fine-tuning and parameter-efficient adaptation",
      summary:
        "Compare full, frozen, and low-rank adaptation across trainable parameters, memory, checkpoints, merging, evaluation, and inherited risk.",
      objective:
        "Calculate and verify a LoRA update's shapes and trainable parameters, then compare full, frozen, and LoRA strategies under one quality–cost–risk contract.",
      artifact:
        "Adaptation decision matrix with LoRA shape proof, parameter counts, memory and time receipts, evaluation slices, merge test, and licence boundary",
      conceptHeading: "LoRA constrains the trainable update",
      concept:
        "Full fine-tuning updates base parameters, a frozen baseline updates only an added head or prompt-side component, and LoRA represents selected weight updates through lower-rank factors while leaving base weights fixed during training. Rank, target modules, scaling, dropout, checkpoint format, and merge behavior are configuration choices rather than properties guaranteed by the method name.",
      methodHeading: "Account for the whole adaptation lifecycle",
      method:
        "For one linear layer, derive the base and low-rank factor shapes and parameter count, then verify them in code. Pin the base model and PEFT version, target modules, rank, scaling, preprocessing, data, seeds, budget, precision, and checkpoint format. Compare quality slices, peak memory, wall time, stored bytes, load behavior, and merged-versus-unmerged outputs.",
      boundaryHeading: "Parameter efficiency is not system efficiency or safety",
      boundary:
        "Fewer trainable parameters can reduce some memory or storage costs but may not reduce inference cost, data preparation, evaluation, operational complexity, or total energy. It does not guarantee quality, stability, privacy, safety, or reproducibility. The base model and data licences, use restrictions, and inherited limitations remain in force.",
      practiceTitle: "Audit a low-rank adaptation",
      practiceBrief:
        "Prove LoRA shapes on a tiny layer and compare three adaptation strategies using one receipt.",
      steps: [
        "Derive base, A, and B matrix shapes and calculate trainable parameters for two candidate ranks.",
        "Verify targeted modules and trainable counts in the pinned implementation before training.",
        "Run frozen, full, and LoRA strategies under matched data, seeds, budget, and evaluation slices.",
        "Compare memory, time, stored artifacts, merge equivalence, quality, and inherited licence and safety limits.",
      ],
      deliverable: "A verified LoRA shape worksheet and full lifecycle adaptation decision",
      reviewGate:
        "Reported savings name the measured lifecycle stage, merged and unmerged outputs are checked, and no efficiency number is promoted to a safety or licence conclusion.",
      checkpointQuestion: "What does a lower LoRA trainable-parameter count prove by itself?",
      checkpointOptions: [
        "The adapted model is safer and more accurate",
        "Only that fewer parameters are updated under that configuration; end-to-end cost, quality, safety, and licence still need evidence",
        "Inference always uses less memory",
        "The base model's licence no longer applies",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "Trainable-parameter count is one resource measure. It does not settle inference, lifecycle cost, quality, safety, reproducibility, or rights.",
      takeaway:
        "PEFT constrains what is trained, not what must be evaluated, operated, licensed, or governed.",
    },
    zhHans: {
      title: "微调与参数高效适配",
      summary:
        "从可训练参数、内存、checkpoint、合并、评估与继承风险比较全量、冻结和低秩适配。",
      objective:
        "计算并验证 LoRA 更新的形状与可训练参数，再在同一质量–成本–风险合同下比较 full、frozen 与 LoRA 策略。",
      artifact:
        "包含 LoRA 形状证明、参数量、内存/时间收据、评估切片、合并测试与许可边界的适配决策矩阵",
      conceptHeading: "LoRA 约束可训练更新",
      concept:
        "全量微调更新基础参数，冻结 baseline 只更新新增 head 或 prompt 侧组件，LoRA 则通过低秩因子表示选定权重更新，并在训练中保持基础权重固定。Rank、目标模块、scaling、dropout、checkpoint 格式与合并行为都是配置选择，不是方法名称自动保证的属性。",
      methodHeading: "核算完整适配生命周期",
      method:
        "对一个线性层推导基础矩阵和低秩因子形状与参数量，再用代码验证。钉定基础模型和 PEFT 版本、目标模块、rank、scaling、预处理、数据、种子、预算、精度与 checkpoint 格式。比较质量切片、峰值内存、墙钟时间、存储字节、加载行为与合并/未合并输出。",
      boundaryHeading: "参数高效不等于系统高效或安全",
      boundary:
        "可训练参数更少可降低部分内存或存储成本，但未必降低推理、数据准备、评估、运营复杂度或总能耗，也不保证质量、稳定、隐私、安全或可复现。基础模型和数据许可、使用限制与继承局限仍然有效。",
      practiceTitle: "审计低秩适配",
      practiceBrief: "在微型层上证明 LoRA 形状，并用一份收据比较三种适配策略。",
      steps: [
        "推导基础、A 与 B 矩阵形状，计算两个候选 rank 的可训练参数。",
        "训练前在钉定实现中验证目标模块与可训练参数量。",
        "在匹配数据、种子、预算与评估切片下运行 frozen、full 与 LoRA。",
        "比较内存、时间、存储产物、合并等价性、质量及继承许可和安全限制。",
      ],
      deliverable: "一份经过验证的 LoRA 形状工作表与全生命周期适配决策",
      reviewGate:
        "节省声明明确指出所测生命周期阶段，合并/未合并输出经过核对，且没有把效率数字提升为安全或许可结论。",
      checkpointQuestion: "更低的 LoRA 可训练参数量本身能证明什么？",
      checkpointOptions: [
        "适配模型更安全且更准确",
        "只能证明该配置更新的参数更少；全生命周期成本、质量、安全与许可仍需证据",
        "推理内存一定更低",
        "基础模型许可不再适用",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "可训练参数量只是一项资源指标，不能解决推理、生命周期成本、质量、安全、可复现或权利问题。",
      takeaway: "PEFT 约束训练什么，但不会减少必须评估、运营、许可或治理的事项。",
    },
  }),
  deepLearningModule({
    slug: "robustness-evaluation-training-card-capstone",
    phaseId: "assurance-and-capstone",
    minutes: 100,
    sourceIds: [
      "dl13-robustness",
      "dl05-training-reproducibility",
      "ra12-model-cards",
    ],
    en: {
      title: "Robustness, evaluation and training-card capstone",
      summary:
        "Integrate clean, corruption, subgroup, shift, multi-seed, cost, provenance, and failure evidence into a training card that can support a no-train or no-deploy decision.",
      objective:
        "Evaluate a small model under an original corruption suite and deliver an eight-artifact training dossier with explicit limitations, stop conditions, and human approval boundary.",
      artifact:
        "Eight-artifact training dossier with environment lock, training log, cost record, error slices, ablation, training card, limitations, and reproducibility receipt",
      conceptHeading: "Robustness is a family of bounded evaluations",
      concept:
        "Clean performance, synthetic corruptions, subgroup slices, distribution shifts, multiple seeds, ablations, calibration, and resource measurements answer different questions. A corruption benchmark such as ImageNet-C defines particular transformations and severities; it does not cover every natural shift, adversarial behavior, social harm, or downstream decision. A training card links the tested conditions to intended use and limitations.",
      methodHeading: "Build a claim–evidence–decision dossier",
      method:
        "Version the original fixture, environment, code, seeds, architecture, budget, metrics, and corruption generator. Report clean and slice-level results with uncertainty, retain failed runs and representative errors, and connect every summary claim to a receipt. Define stop rules before final evaluation and require a named human reviewer to choose continue, revise, no-train, or no-deploy.",
      boundaryHeading: "Documentation and robustness scores do not authorize deployment",
      boundary:
        "A high corruption score can coexist with subgroup harm, untested shifts, unsafe use, unclear rights, or excessive cost. A reproducible run only reconstructs the tested process; a training card can be incomplete or stale. Completion of this course and browser milestones grants no authority to train on real protected data or deploy a model into consequential decisions.",
      practiceTitle: "Defend a stop-or-release decision",
      practiceBrief:
        "Use the original synthetic fixture to assemble all eight artifacts and conduct an adversarial human review.",
      steps: [
        "Verify fixture, schema, environment, and code hashes before running the clean and corruption suites.",
        "Report multi-seed clean, corruption, subgroup, and failure slices alongside compute and energy-proxy receipts.",
        "Complete the training card, limitations, ablation, errors, and reproducibility receipt with claim links.",
        "Ask an independent reviewer to challenge one unsupported claim and record continue, revise, no-train, or no-deploy with reasons.",
      ],
      deliverable: "A signed eight-artifact training dossier and human go/no-go record",
      reviewGate:
        "Every claim resolves to versioned evidence, at least one stop path is credible, unresolved rights and safety limits are visible, and only a named human records the decision.",
      checkpointQuestion: "When should a robustness result support a no-deploy decision?",
      checkpointOptions: [
        "Never; a passing clean metric always overrides robustness evidence",
        "When a predeclared critical slice or stop condition fails, pending human review and remediation rather than automatic deployment",
        "Only when every corruption score is exactly zero",
        "Whenever two random seeds differ by any amount",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "Predeclared critical failures should stop automatic progression and trigger human review; aggregate clean performance does not cancel a failed safety boundary.",
      takeaway:
        "Robustness evidence is condition-specific, and a training card is documentation; deployment remains a separate human-authority decision with a real no-go path.",
    },
    zhHans: {
      title: "鲁棒性评估与 training-card 结课项目",
      summary:
        "把干净、corruption、子群、漂移、多种子、成本、来源与失败证据整合为可支持 no-train 或 no-deploy 决策的训练卡。",
      objective:
        "在原创 corruption suite 下评估小型模型，交付含显式限制、停止条件与人类批准边界的八产物训练档案。",
      artifact:
        "包含环境锁、训练日志、成本记录、错误切片、消融、training card、限制与可复现收据的八产物训练档案",
      conceptHeading: "鲁棒性是一组有边界评估",
      concept:
        "干净表现、合成 corruption、子群切片、分布变化、多种子、消融、校准与资源测量回答不同问题。ImageNet-C 等 corruption 基准定义特定转换和严重度，不覆盖所有自然漂移、对抗行为、社会伤害或下游决策。Training card 把所测条件连接到预期用途与限制。",
      methodHeading: "建立主张–证据–决策档案",
      method:
        "版本化原创 fixture、环境、代码、种子、架构、预算、指标与 corruption 生成器。带不确定性报告干净和切片结果，保留失败运行与代表性错误，把每项摘要主张连接到收据。最终评估前定义停止规则，并要求具名人类审查者选择继续、修订、no-train 或 no-deploy。",
      boundaryHeading: "文档与鲁棒分数不会授权部署",
      boundary:
        "高 corruption 分数可与子群伤害、未测试漂移、不安全用途、权利不清或成本过高同时存在。可复现运行只重建所测过程；training card 也可能不完整或过期。完成本课程和浏览器里程碑不会授予用真实受保护数据训练或把模型部署到重大决策中的权限。",
      practiceTitle: "为停止或发布决策辩护",
      practiceBrief: "使用原创合成 fixture 组装八项产物，并进行对抗式人工审查。",
      steps: [
        "运行干净与 corruption suite 前，验证 fixture、schema、环境与代码哈希。",
        "报告多种子干净、corruption、子群与失败切片，并附计算与能耗代理收据。",
        "完成 training card、限制、消融、错误与可复现收据，并连接主张。",
        "请独立审查者挑战一项不受支持主张，记录继续、修订、no-train 或 no-deploy 及理由。",
      ],
      deliverable: "一份已签署八产物训练档案与人类 go/no-go 记录",
      reviewGate:
        "每项主张都解析到版本化证据，至少一条停止路径真实可用，未解决权利与安全限制可见，且只有具名人类记录决策。",
      checkpointQuestion: "鲁棒性结果何时应支持 no-deploy 决策？",
      checkpointOptions: [
        "永不；干净指标通过就能覆盖鲁棒性证据",
        "预先声明的关键切片或停止条件失败时，应停止自动推进并等待人工审查与修复",
        "只有每项 corruption 分数都精确为零时",
        "任何两个随机种子有一点差异时",
      ],
      checkpointCorrectIndex: 1,
      checkpointExplanation:
        "预先声明的关键失败应阻止自动推进并触发人工审查；总体干净表现不能抵消安全边界失败。",
      takeaway:
        "鲁棒性证据受条件约束，training card 只是文档；部署仍是具备真实 no-go 路径的人类决定权事项。",
    },
  }),
] as const;

export type DeepLearningModuleSlug =
  (typeof DEEP_LEARNING_MODULES)[number]["slug"];
