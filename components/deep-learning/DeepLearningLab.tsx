import type { DeepLearningModuleSlug } from "@/lib/deep-learning";
import styles from "./DeepLearningLab.module.css";

const LAB = "/courses/deep-learning/lab";

const MODULE_HANDOFF: Record<DeepLearningModuleSlug, { en: string; zh: string }> = {
  "tensors-computational-graphs": { en: "Inspect the 4×4 tensor shape and deterministic forward-pass contract before training.", zh: "训练前检查 4×4 tensor 形状与确定性前向传播合同。" },
  "backpropagation-autodiff": { en: "Compare the hand-coded gradients with a finite-difference check on one fixed example.", zh: "在一个固定样本上比较手写梯度与有限差分检查。" },
  "optimisation-initialisation-normalisation-regularisation": { en: "Keep the seed, initialization range, learning rate, and matched epoch budget fixed.", zh: "固定种子、初始化范围、学习率与匹配的 epoch 预算。" },
  "training-loops-debugging": { en: "Retain milestone logs and every failed invariant instead of reporting only the final score.", zh: "保留里程碑日志与每个失败 invariant，而不是只报告最终分数。" },
  "cnns-visual-representations": { en: "Use the tiny line-grid task to inspect spatial structure; do not infer real-image validity.", zh: "用微型线条网格任务检查空间结构；不得推断真实图像有效性。" },
  "transfer-learning": { en: "Treat transfer learning as an optional extension; the required CPU run starts from the locked local seed.", zh: "把迁移学习作为可选扩展；必做 CPU 运行从锁定本地种子开始。" },
  "sequence-models-rnns-lstms": { en: "Reshape only as an explicit mechanics exercise and record why the image task is not sequence evidence.", zh: "仅把 reshape 作为显式机制练习，并记录为何图像任务不是序列证据。" },
  attention: { en: "Trace weights as computation, never as a causal explanation of the classifier decision.", zh: "把权重作为计算追踪，绝不把它当作分类决定的因果解释。" },
  "transformer-encoder-decoder": { en: "Keep Transformer work optional; completion depends on the auditable CPU reference experiment.", zh: "Transformer 实验保持可选；课程完成依赖可审计 CPU 参考实验。" },
  "tokenisation-pretraining": { en: "Record that this numeric fixture has no tokenisation or pretraining-data rights claim.", zh: "记录此数值 fixture 不支持任何 tokenisation 或预训练数据权利声明。" },
  "fine-tuning-parameter-efficient-adaptation": { en: "Compare trainable-parameter inventories only under a matched data and evaluation contract.", zh: "只在匹配的数据与评估合同下比较可训练参数清单。" },
  "robustness-evaluation-training-card-capstone": { en: "Generate all eight artifacts, run destructive validator tests, and retain a human no-deploy decision.", zh: "生成全部八项产物，运行破坏性 validator 测试，并保留人类 no-deploy 决定。" },
};

function isChinese(locale: string) {
  return locale === "zh-Hans";
}

export function DeepLearningLabDashboard({ locale }: { readonly locale: string }) {
  const zh = isChinese(locale);
  const guide = `${LAB}/${zh ? "README.zh-Hans.md" : "README.md"}`;
  return (
    <section className={styles.panel} aria-labelledby="deep-learning-lab-title">
      <p className={styles.eyebrow}>{zh ? "离线 CPU 神经训练实验室" : "Offline CPU neural-training lab"}</p>
      <h2 id="deep-learning-lab-title">{zh ? "确定性基线、微型神经网络与八产物训练档案" : "A deterministic baseline, tiny neural model, and eight-artifact training dossier"}</h2>
      <p>{zh ? "标准库 runner 读取随课发布的 12 条原创合成 4×4 线条数据，在 CPU 上比较方向规则基线与手写微型神经网络，生成训练日志、鲁棒性切片、受控消融、逻辑运算成本/能耗代理、training card、限制与复现收据。GPU 仅是可选扩展。" : "The standard-library runner reads the 12 original synthetic 4×4 line examples shipped with the course. On CPU it compares an orientation-rule baseline with a hand-coded tiny neural network and emits training logs, robustness slices, a controlled ablation, a logical-operation cost/energy proxy, a training card, limitations, and a reproducibility receipt. GPU work is optional only."}</p>
      <div className={styles.grid}>
        <div className={styles.card}><h3>{zh ? "运行合同" : "Run contract"}</h3><p>{zh ? "CPython 3.9.6 参考锁；纯标准库；CPU；无网络；固定种子与 epoch。" : "CPython 3.9.6 reference lock; standard library only; CPU; no network; fixed seed and epochs."}</p></div>
        <div className={styles.card}><h3>{zh ? "验证合同" : "Validation contract"}</h3><p><code>aicourse.deep-learning.validator.v1</code></p></div>
        <div className={styles.card}><h3>{zh ? "声明边界" : "Claim boundary"}</h3><p>{zh ? "微型合成数据上的通过结果不证明真实图像、群体、公平、安全或部署适用性。" : "Passing on tiny synthetic data proves nothing about real images, populations, fairness, safety, or deployment fitness."}</p></div>
      </div>
      <code className={styles.command}>python3 run_experiment.py --output-dir work{"\n"}python3 validate.py --package work/submission.generated.json{"\n"}python3 test_lab.py</code>
      <ul className={styles.links}>
        <li><a href={guide} download>{zh ? "下载运行说明" : "Download run guide"}</a></li>
        <li><a href={`${LAB}/run_experiment.py`} download>{zh ? "下载 CPU 实验" : "Download CPU experiment"}</a></li>
        <li><a href={`${LAB}/capstone.schema.json`} download>{zh ? "下载 capstone schema" : "Download capstone schema"}</a></li>
        <li><a href={`${LAB}/submission.template.json`} download>{zh ? "下载提交模板" : "Download submission template"}</a></li>
        <li><a href={`${LAB}/validate.py`} download>{zh ? "下载 validator" : "Download validator"}</a></li>
      </ul>
      <p className={styles.boundary}>{zh ? "validator 只核验此固定包的结构、可重跑计算与证据绑定；最终训练或部署决定始终属于具名人类审查者。" : "The validator checks only this fixed package's structure, rerunnable computation, and evidence binding; a named human reviewer retains every train or deploy decision."}</p>
    </section>
  );
}

export function DeepLearningModuleLab({ locale, moduleSlug }: { readonly locale: string; readonly moduleSlug: DeepLearningModuleSlug }) {
  const zh = isChinese(locale);
  const handoff = MODULE_HANDOFF[moduleSlug];
  const guide = `${LAB}/${zh ? "README.zh-Hans.md" : "README.md"}`;
  return (
    <section className={styles.panel} aria-labelledby={`${moduleSlug}-lab-title`}>
      <p className={styles.eyebrow}>{zh ? "课程 20 实验交接" : "Course 20 lab handoff"}</p>
      <h2 id={`${moduleSlug}-lab-title`}>{zh ? "把模块产物接入可执行神经训练包" : "Connect this module artifact to the executable neural-training pack"}</h2>
      <p>{zh ? handoff.zh : handoff.en}</p>
      <code className={styles.command}>python3 run_experiment.py --output-dir work{"\n"}python3 validate.py --package work/submission.generated.json</code>
      <ul className={styles.links}><li><a href={guide}>{zh ? "实验说明" : "Lab guide"}</a></li><li><a href={`${LAB}/environment.lock.json`}>{zh ? "环境锁" : "Environment lock"}</a></li><li><a href={`${LAB}/capstone.schema.json`}>{zh ? "结课项目 schema" : "Capstone schema"}</a></li></ul>
    </section>
  );
}
