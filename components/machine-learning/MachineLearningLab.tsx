import type { MachineLearningModuleSlug } from "@/lib/machine-learning";
import styles from "./MachineLearningLab.module.css";

const BASE = "/courses/machine-learning";
const LAB = `${BASE}/lab`;

const MODULE_OUTPUT: Record<MachineLearningModuleSlug, { en: string; zh: string }> = {
  "framing-baselines-splits": { en: "Inspect the immutable 20/5/5 split contract before fitting anything.", zh: "在拟合任何模型前，检查不可变的 20/5/5 切分合同。" },
  "linear-regression-loss-residuals": { en: "Use the pipeline's bounded score and residual calculations as mechanics, never causal evidence.", zh: "把管线中的分数与残差计算只作为机制练习，绝不作为因果证据。" },
  "logistic-regression-classification": { en: "Separate fitted probabilities, the illustrative threshold, class labels, and any human action.", zh: "分离拟合概率、示例阈值、类别标签与任何人类行动。" },
  "optimisation-scaling-features": { en: "Audit training-only scaling and verify identifiers and partition labels never enter the feature matrix.", zh: "审计仅训练集缩放，并核验标识符与 partition 标签从未进入特征矩阵。" },
  "regularisation-bias-variance": { en: "Keep model choice on train/validation and preserve the one-shot holdout receipt.", zh: "把模型选择限制在 train/validation，并保留一次性 holdout 收据。" },
  "trees-ensembles": { en: "Treat the stdlib logistic model as the required CPU baseline; optional models must use the same frozen split.", zh: "把标准库逻辑回归作为必需 CPU 基线；可选模型必须使用同一冻结切分。" },
  "imbalanced-data-metrics": { en: "Recalculate prevalence, precision, recall, specificity, Brier score, and denominators.", zh: "重新计算流行率、precision、recall、specificity、Brier 分数与分母。" },
  "calibration-thresholds-error-analysis": { en: "Inspect calibration bins and errors without converting the illustrative 0.5 threshold into policy.", zh: "检查校准分箱与错误，但不得把示例 0.5 阈值变成政策。" },
  clustering: { en: "Keep any cluster exploration outside the consequential student-support decision path.", zh: "确保任何聚类探索都在有后果的学生支持决策路径之外。" },
  "anomaly-detection": { en: "Do not turn rare or surprising synthetic rows into accusations or automated review.", zh: "不得把稀有或意外的合成记录变成指控或自动审查。" },
  "recommender-systems": { en: "Use the fictional event log only to inspect exposure gaps and offline metric boundaries.", zh: "仅用虚构事件日志检查曝光缺口与离线指标边界。" },
  "leakage-reproducibility-model-card-capstone": { en: "Generate the eight-artifact dossier and require an explicit no-deploy decision plus validator pass.", zh: "生成八项产物档案，并要求明确 no-deploy 决定与 validator 通过。" },
};

function isChinese(locale: string) {
  return locale === "zh-Hans";
}

export function MachineLearningLabDashboard({ locale }: { readonly locale: string }) {
  const zh = isChinese(locale);
  const guide = `${LAB}/${zh ? "README.zh-Hans.md" : "README.md"}`;
  return (
    <section className={styles.panel} aria-labelledby="machine-learning-lab-title">
      <p className={styles.eyebrow}>{zh ? "离线 CPU 课程实验室" : "Offline CPU course lab"}</p>
      <h2 id="machine-learning-lab-title">
        {zh ? "固定切分、可校准、可复核且默认不部署的模型包" : "A fixed-split, calibrated, reviewable, no-deploy model pack"}
      </h2>
      <p>
        {zh
          ? "标准库管线只读取随课程发布的 30 行原创合成数据，以训练集拟合缩放与逻辑回归，在 validation 比较 prevalence baseline，并且只在冻结选择后打开一次 holdout。它生成校准、错误切片、亚组审计、model card 与强制 no-deploy 决定。"
          : "The standard-library pipeline reads only the 30-row original synthetic fixture, fits scaling and logistic regression on train, compares against a prevalence baseline on validation, and opens holdout once after selection is frozen. It emits calibration, error slices, subgroup audit, a model card, and a mandatory no-deploy decision."}
      </p>
      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>{zh ? "运行合同" : "Run contract"}</h3>
          <p>{zh ? "Python 3.11+；标准库、CPU、无网络；随机种子与迭代数固定。" : "Python 3.11+; standard library, CPU, no network; fixed seed and iteration count."}</p>
        </div>
        <div className={styles.card}>
          <h3>{zh ? "验证合同" : "Validation contract"}</h3>
          <p><code>aicourse.machine-learning.validator.v1</code></p>
        </div>
        <div className={styles.card}>
          <h3>{zh ? "权限合同" : "Authority contract"}</h3>
          <p>{zh ? "预测不得自动触发处分、分流、排名、支持分配或任何现实行动。" : "Predictions cannot trigger discipline, routing, ranking, support allocation, or any real-world action."}</p>
        </div>
      </div>
      <code className={styles.command}>python3 run_pipeline.py --output-dir work{"\n"}python3 validate.py --package work/submission.generated.json</code>
      <ul className={styles.links}>
        <li><a href={guide} download>{zh ? "下载运行说明" : "Download run guide"}</a></li>
        <li><a href={`${LAB}/run_pipeline.py`} download>{zh ? "下载 CPU 管线" : "Download CPU pipeline"}</a></li>
        <li><a href={`${LAB}/capstone.schema.json`} download>{zh ? "下载 capstone schema" : "Download capstone schema"}</a></li>
        <li><a href={`${LAB}/submission.template.json`} download>{zh ? "下载产物模板" : "Download artifact template"}</a></li>
        <li><a href={`${LAB}/validate.py`} download>{zh ? "下载 validator" : "Download validator"}</a></li>
      </ul>
      <p className={styles.boundary}>
        {zh ? "固定数据上的高分、校准表或 validator 通过都不能升级为真实人群有效性、公平性或部署授权。" : "A high score, calibration table, or passing validator on this fixed fixture cannot be upgraded into population validity, fairness, or deployment authorization."}
      </p>
    </section>
  );
}

export function MachineLearningModuleLab({
  locale,
  moduleSlug,
}: {
  readonly locale: string;
  readonly moduleSlug: MachineLearningModuleSlug;
}) {
  const zh = isChinese(locale);
  const output = MODULE_OUTPUT[moduleSlug];
  const guide = `${LAB}/${zh ? "README.zh-Hans.md" : "README.md"}`;
  return (
    <section className={styles.panel} aria-labelledby={`${moduleSlug}-lab-title`}>
      <p className={styles.eyebrow}>{zh ? "课程 19 实验交接" : "Course 19 lab handoff"}</p>
      <h2 id={`${moduleSlug}-lab-title`}>{zh ? "把本模块检查接入冻结的建模管线" : "Connect this module check to the frozen modeling pipeline"}</h2>
      <p>{zh ? output.zh : output.en}</p>
      <code className={styles.command}>python3 run_pipeline.py --output-dir work{"\n"}python3 validate.py --package work/submission.generated.json</code>
      <ul className={styles.links}>
        <li><a href={guide}>{zh ? "实验说明" : "Lab guide"}</a></li>
        <li><a href={`${LAB}/environment.lock.json`}>{zh ? "环境锁" : "Environment lock"}</a></li>
        <li><a href={`${LAB}/capstone.schema.json`}>{zh ? "结课项目 schema" : "Capstone schema"}</a></li>
      </ul>
    </section>
  );
}
