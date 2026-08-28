import {
  DEEP_LEARNING_SOURCE_SEEDS,
  getDeepLearningClaims,
  type DeepLearningModuleSlug,
} from "@/lib/deep-learning";
import styles from "./DeepLearningLab.module.css";

const LAB = "/courses/deep-learning/lab";

const MODULE_HANDOFF: Record<DeepLearningModuleSlug, { en: string; zh: string }> = {
  "tensors-computational-graphs": { en: "Inspect shape, layout, shared storage, broadcasting, graph connectivity, and detach boundaries on the foundation fixture.", zh: "在基础 fixture 上检查 shape、layout、共享存储、广播、计算图连接与 detach 边界。" },
  "backpropagation-autodiff": { en: "Require analytic, autograd, and finite-difference gradients to agree under declared epsilon and tolerance.", zh: "要求解析梯度、autograd 与有限差分在声明的 epsilon 和容差下相符。" },
  "training-loops-debugging": { en: "Prove one-batch overfit, gradient reset, train/eval state, fault detection, and checkpoint/resume equivalence.", zh: "验证单批过拟合、梯度清零、train/eval 状态、故障检测与 checkpoint/resume 等价性。" },
  "optimisation-initialisation-normalisation-regularisation": { en: "Run the three-seed, matched-budget LayerNorm ablation only after the training-loop contract passes.", zh: "仅在训练循环合同通过后，运行三种子、匹配预算的 LayerNorm 消融。" },
  "cnns-visual-representations": { en: "Execute linear, CNN, and residual-CNN comparisons on the original visual fixture and verify receptive-field arithmetic.", zh: "在原创视觉 fixture 上执行 linear、CNN 与 residual-CNN 对照，并验证感受野计算。" },
  "transfer-learning": { en: "Use the course-owned checkpoint to compare scratch, frozen, partial-unfreeze, and full fine-tuning under one target-domain budget.", zh: "使用课程自有 checkpoint，在同一目标域预算下比较 scratch、冻结、部分解冻与完整微调。" },
  "sequence-models-rnns-lstms": { en: "Train real RNN and LSTM baselines; audit embedding shapes, padding exclusion, state reset, and held-out lengths.", zh: "训练真实 RNN 与 LSTM 基线；审计 embedding 形状、padding 排除、状态重置与未见长度。" },
  attention: { en: "Compute scaled QKᵀ, apply the declared mask before stable softmax, and retain perturbation and all-masked-row negative controls.", zh: "计算缩放 QKᵀ，在稳定 softmax 前应用声明的 mask，并保留扰动与全屏蔽行负例。" },
  "transformer-encoder-decoder": { en: "Train the tiny Transformer and require future-token invariance in eval mode, with an open-mask negative control that must fail.", zh: "训练微型 Transformer，并要求 eval 模式下未来 token 不影响早期 logits，同时让开放 mask 负例必须失败。" },
  "tokenisation-pretraining": { en: "Audit multilingual NFKC tokenization, normalized round trips, the next-token objective, and the original corpus-rights boundary.", zh: "审计多文字 NFKC tokenization、规范化往返、next-token 目标与原创语料权利边界。" },
  "fine-tuning-parameter-efficient-adaptation": { en: "Compare frozen, LoRA, and full parameter counts, train a rank-2 adapter, and require merge-output equivalence.", zh: "比较冻结、LoRA 与完整微调参数量，训练 rank-2 adapter，并要求合并输出等价。" },
  "robustness-evaluation-training-card-capstone": { en: "Assemble clean, corruption, and held-out-length evidence plus resource limits and a human-owned no-deploy draft; the learner final remains separate.", zh: "汇总 clean、corruption 与未见长度证据、资源边界及人类负责的 no-deploy 草案；学习者最终项目仍独立验证。" },
};

function isChinese(locale: string) {
  return locale === "zh-Hans";
}

function evidenceModeLabel(
  mode: ReturnType<typeof getDeepLearningClaims>[number]["evidenceMode"],
  zh: boolean,
) {
  const labels = zh
    ? {
        "source-grounded": "来源支持",
        "instructional-synthesis": "课程综合",
        "course-policy": "课程政策",
        "version-watch": "版本观察",
      }
    : {
        "source-grounded": "Source-grounded",
        "instructional-synthesis": "Course synthesis",
        "course-policy": "Course policy",
        "version-watch": "Version watch",
      };
  return labels[mode];
}

export function DeepLearningLabDashboard({ locale }: { readonly locale: string }) {
  const zh = isChinese(locale);
  const guide = `${LAB}/${zh ? "README.zh-Hans.md" : "README.md"}`;
  return (
    <section className={styles.panel} aria-labelledby="deep-learning-lab-title">
      <p className={styles.eyebrow}>{zh ? "离线 CPU 深度学习实验室" : "Offline CPU deep-learning lab"}</p>
      <h2 id="deep-learning-lab-title">{zh ? "从 MLP 机制参考到可执行 Transformer 证据链" : "From an MLP mechanics reference to executable Transformer evidence"}</h2>
      <p>{zh ? "纯标准库 MLP 只作为 M1–M4 的 foundation reference。必做 PyTorch 2.13 CPU 路径会真实执行 CNN/Residual、四种迁移策略、RNN/LSTM、scaled dot-product attention、Transformer causal-mask 回归、Unicode tokenizer 与 LoRA merge；运行时不下载数据、不使用 GPU，也不授予训练或部署权。" : "The standard-library MLP is only an M1–M4 foundation reference. The required PyTorch 2.13 CPU lane actually executes CNN/residual comparisons, four transfer strategies, RNN/LSTM, scaled dot-product attention, a Transformer causal-mask regression, a Unicode tokenizer audit, and LoRA merge equivalence. Runtime downloads, GPU use, and train/deploy authority are excluded."}</p>
      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>{zh ? "锁定运行环境" : "Locked runtime"}</h3>
          <p>{zh ? "CPython 3.11 · PyTorch 2.13.0 · NumPy 2.4.1 · CPU · 离线 · 峰值 2 GB / 10 分钟发布预算。" : "CPython 3.11 · PyTorch 2.13.0 · NumPy 2.4.1 · CPU · offline · 2 GB / 10 minute release budget."}</p>
        </div>
        <div className={styles.card}>
          <h3>{zh ? "三个不同证明层" : "Three distinct evidence layers"}</h3>
          <p><code lang="en" dir="ltr">aicourse.deep-learning.module.&lt;module-slug&gt;.v2</code> · <code lang="en" dir="ltr">aicourse.deep-learning.reference-validator.v1</code> · <code lang="en" dir="ltr">aicourse.deep-learning.validator.v2</code></p>
        </div>
        <div className={styles.card}>
          <h3>{zh ? "声明边界" : "Claim boundary"}</h3>
          <p>{zh ? "模块 PASS 证明固定课程任务可重算；不证明外部效度、公平、安全、审核者身份或部署适用性。" : "A module PASS establishes recomputation on the fixed course task; it does not establish external validity, fairness, safety, reviewer identity, or deployment fitness."}</p>
        </div>
      </div>
      <code className={styles.command} lang="en" dir="ltr">python3 test_lab.py{"\n"}python3 run_modules.py --all --output-dir work/modules{"\n"}python3 validate_reference.py --package work/reference/submission.generated.json{"\n"}python3 validate_capstone.py --package work/learner-final.json</code>
      <ul className={styles.links}>
        <li><a href={`${LAB}/readiness.template.json`} download>{zh ? "先做 R0 readiness" : "Start with R0 readiness"}</a></li>
        <li><a href={guide} download>{zh ? "下载运行说明" : "Download run guide"}</a></li>
        <li><a href={`${LAB}/run_modules.py`} download>{zh ? "下载模块 runner" : "Download module runner"}</a></li>
        <li><a href={`${LAB}/validate_module.py`} download>{zh ? "下载模块 validator" : "Download module validator"}</a></li>
        <li><a href={`${LAB}/reference.schema.json`} download>{zh ? "下载 reference schema" : "Download reference schema"}</a></li>
        <li><a href={`${LAB}/capstone.schema.json`} download>{zh ? "下载 learner-final schema" : "Download learner-final schema"}</a></li>
        <li><a href={`${LAB}/submission.template.json`} download>{zh ? "下载不完整提交模板" : "Download incomplete submission template"}</a></li>
      </ul>
      <p className={styles.boundary}>{zh ? "reference 只能返回 REFERENCE_PASS 且 capstoneEligible=false。learner-final PASS 只表示证据在结构与语义上可评审；本地 validator 不认证 reviewer 身份，具名人类仍拥有 no-train/no-deploy 决策权。" : "The reference can return only REFERENCE_PASS with capstoneEligible=false. A learner-final PASS means the evidence is structurally and semantically reviewable; the local validator does not authenticate reviewer identity, and a named human retains every no-train/no-deploy decision."}</p>
    </section>
  );
}

export function DeepLearningModuleLab({ locale, moduleSlug }: { readonly locale: string; readonly moduleSlug: DeepLearningModuleSlug }) {
  const zh = isChinese(locale);
  const handoff = MODULE_HANDOFF[moduleSlug];
  const guide = `${LAB}/${zh ? "README.zh-Hans.md" : "README.md"}`;
  const claims = getDeepLearningClaims(moduleSlug);
  const sourceById = new Map(
    DEEP_LEARNING_SOURCE_SEEDS.map((source) => [source.record.id, source.record]),
  );
  return (
    <>
      <section className={`${styles.panel} ${styles.claimLedger}`} aria-labelledby={`${moduleSlug}-claims-title`}>
        <p className={styles.eyebrow}>{zh ? "段落级证据合同" : "Paragraph-level evidence contract"}</p>
        <h2 id={`${moduleSlug}-claims-title`}>{zh ? "原子主张、精确定位符与证据边界" : "Atomic claims, exact locators, and evidence boundaries"}</h2>
        <p>{zh
          ? "模块与段落旁的 source ID 只是阅读集合，不会把来源支持自动继承给整段文字。下列账本才是发布合同：外部事实逐项绑定一个 source ID、该来源记录中的精确 URL 与章节/API 定位符；课程综合与课程政策保持课程自有且不伪装成外部事实。"
          : "Source IDs beside modules and sections are a reading set; they do not transfer support to an entire paragraph. The ledger below is the publication contract: every external fact binds one source ID, one exact URL from that source record, and one section/API locator. Course synthesis and course policy remain course-owned rather than impersonating external facts."}</p>
        <ol className={styles.claimList}>
          {claims.map((claim) => {
            const source = claim.sourceId ? sourceById.get(claim.sourceId) : undefined;
            return (
              <li className={styles.claimItem} data-claim-id={claim.id} data-evidence-mode={claim.evidenceMode} key={claim.id}>
                <div className={styles.claimMeta}>
                  <span>{evidenceModeLabel(claim.evidenceMode, zh)}</span>
                  <code lang="en" dir="ltr">{claim.id}</code>
                  <span>{zh ? `第 ${claim.sectionIndex + 1} 节 · 第 ${claim.paragraphIndex + 1} 段` : `Section ${claim.sectionIndex + 1} · paragraph ${claim.paragraphIndex + 1}`}</span>
                </div>
                <p>{zh ? claim.claimZhHans : claim.claim}</p>
                <dl className={styles.claimDetails}>
                  <div>
                    <dt>{zh ? "证据模式" : "Evidence mode"}</dt>
                    <dd>{evidenceModeLabel(claim.evidenceMode, zh)}</dd>
                  </div>
                  <div>
                    <dt>{zh ? "精确定位符" : "Exact locator"}</dt>
                    <dd>
                      {claim.evidenceUrl ? (
                        <><a href={claim.evidenceUrl} target="_blank" rel="noopener noreferrer">{source?.title ?? claim.sourceId}</a>{" · "}</>
                      ) : null}
                      {claim.locator}
                    </dd>
                  </div>
                  <div>
                    <dt>{zh ? "边界" : "Boundary"}</dt>
                    <dd>{zh ? claim.boundaryZhHans : claim.boundary}</dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={styles.panel} aria-labelledby={`${moduleSlug}-lab-title`}>
        <p className={styles.eyebrow}>{zh ? "课程 20 · 模块级证据" : "Course 20 · module-level evidence"}</p>
        <h2 id={`${moduleSlug}-lab-title`}>{zh ? "把本模块接入可重算 artifact lineage" : "Connect this module to recomputable artifact lineage"}</h2>
        <p>{zh ? handoff.zh : handoff.en}</p>
        <code className={styles.command} lang="en" dir="ltr">python3 run_modules.py --all --output-dir work/modules{"\n"}python3 validate_module.py --module {moduleSlug} --package work/modules/{moduleSlug}.json --receipt work/receipts/{moduleSlug}.json</code>
        <ul className={styles.links}>
          <li><a href={guide}>{zh ? "实验说明" : "Lab guide"}</a></li>
          <li><a href={`${LAB}/environment.lock.json`}>{zh ? "环境锁" : "Environment lock"}</a></li>
          <li><a href={`${LAB}/validate_module.py`}>{zh ? "模块校验器" : "Module validator"}</a></li>
          <li><a href={`${LAB}/capstone.schema.json`}>{zh ? "学习者最终项目 schema" : "Learner-final schema"}</a></li>
        </ul>
      </section>
    </>
  );
}
