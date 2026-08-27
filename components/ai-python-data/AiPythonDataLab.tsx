import type { AiPythonDataModuleSlug } from "@/lib/ai-python-data";
import styles from "./AiPythonDataLab.module.css";

const BASE = "/courses/ai-python-data";
const LAB = `${BASE}/lab`;

const MODULE_OUTPUT: Record<AiPythonDataModuleSlug, { en: string; zh: string }> = {
  "environment-notebooks-seeds-reproducibility": {
    en: "Verify the environment lock, fixture hashes, deterministic seed, and notebook structure.",
    zh: "核验环境锁、fixture 哈希、确定性随机种子与 notebook 结构。",
  },
  "execution-values-functions-state": {
    en: "Trace the pure parsing and summarisation functions before allowing file writes.",
    zh: "在允许文件写入前，追踪纯解析与汇总函数。",
  },
  "tests-errors-types-debugging": {
    en: "Run the negative mutation test and preserve the validator's exact failure as evidence.",
    zh: "运行负向变异测试，并保留 validator 的确切失败信息作为证据。",
  },
  "numpy-arrays-vectorisation": {
    en: "Use the generated numerical summary as a reference result; document any optional NumPy reimplementation separately.",
    zh: "把生成的数值汇总作为参考结果；任何可选 NumPy 重写都需另行记录。",
  },
  "pandas-tidy-tabular-data": {
    en: "Audit the declared row grain, primary key, field types, and the cohort lookup join.",
    zh: "审计已声明的行粒度、主键、字段类型与 cohort lookup 连接。",
  },
  "cleaning-missingness-validation-provenance": {
    en: "Explain every missing value without silently imputing it, then review input/output hashes.",
    zh: "解释每个缺失值且不静默插补，然后复核输入与输出哈希。",
  },
  "descriptive-statistics-sampling-uncertainty": {
    en: "Reproduce the seeded bootstrap interval and keep the tiny synthetic-sample boundary attached.",
    zh: "复现固定种子的 bootstrap 区间，并始终附带小型合成样本边界。",
  },
  "visualisation-honest-charts": {
    en: "Inspect the generated original SVG, its denominator, alt text, and misleading-chart diagnosis.",
    zh: "检查生成的原创 SVG、分母、替代文本与误导性图表诊断。",
  },
  "files-apis-joins-reproducible-pipelines": {
    en: "Reconcile the CSV, schema, lookup, notebook, and generated-output hashes without network access.",
    zh: "在无网络条件下核对 CSV、schema、lookup、notebook 与生成输出哈希。",
  },
  "education-data-audit-capstone": {
    en: "Generate the eight-artifact dossier and require the bound course validator to pass before submission.",
    zh: "生成八项产物档案，并在提交前要求绑定课程的 validator 通过。",
  },
};

function isChinese(locale: string) {
  return locale === "zh-Hans";
}

export function AiPythonDataLabDashboard({ locale }: { readonly locale: string }) {
  const zh = isChinese(locale);
  const guide = `${LAB}/${zh ? "README.zh-Hans.md" : "README.md"}`;
  return (
    <section className={styles.panel} aria-labelledby="ai-python-data-lab-title">
      <p className={styles.eyebrow}>{zh ? "离线课程实验室" : "Offline course lab"}</p>
      <h2 id="ai-python-data-lab-title">
        {zh ? "可下载、可重跑、可验证的毕业项目包" : "A downloadable, rerunnable, validator-bound capstone pack"}
      </h2>
      <p>
        {zh
          ? "这套实验只处理课程随附的 18 行原创合成数据。标准库脚本会核验输入、运行数据审计、生成原创 SVG 和八项 capstone 产物，再由课程专用 validator 拒绝错误课程版本、错误产物 ID 或缺失证据。"
          : "This lab uses only the 18-row original synthetic fixture shipped with the course. A standard-library runner verifies inputs, performs the audit, generates an original SVG and all eight capstone artifacts, then a course-specific validator rejects wrong versions, wrong artifact IDs, or missing evidence."}
      </p>
      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>{zh ? "运行合同" : "Run contract"}</h3>
          <p>{zh ? "Python 3.11+；标准库运行；无需网络、API key 或远程 notebook。" : "Python 3.11+; standard-library runtime; no network, API key, or remote notebook."}</p>
        </div>
        <div className={styles.card}>
          <h3>{zh ? "验证合同" : "Validation contract"}</h3>
          <p><code>aicourse.ai-python-data.validator.v1</code></p>
        </div>
        <div className={styles.card}>
          <h3>{zh ? "数据边界" : "Data boundary"}</h3>
          <p>{zh ? "完全虚构、CC0 fixture；不得提出关于真实学习者的总体、因果或部署声明。" : "Fully fictional CC0 fixture; no population, causal, or deployment claim about real learners."}</p>
        </div>
      </div>
      <code className={styles.command}>python3 run_notebook.py --output-dir work{"\n"}python3 validate.py --package work/submission.generated.json</code>
      <ul className={styles.links}>
        <li><a href={guide} download>{zh ? "下载运行说明" : "Download run guide"}</a></li>
        <li><a href={`${LAB}/audit.ipynb`} download>{zh ? "下载 notebook" : "Download notebook"}</a></li>
        <li><a href={`${LAB}/run_notebook.py`} download>{zh ? "下载 notebook runner" : "Download notebook runner"}</a></li>
        <li><a href={`${LAB}/capstone.schema.json`} download>{zh ? "下载 capstone schema" : "Download capstone schema"}</a></li>
        <li><a href={`${LAB}/submission.template.json`} download>{zh ? "下载产物模板" : "Download artifact template"}</a></li>
        <li><a href={`${LAB}/validate.py`} download>{zh ? "下载 validator" : "Download validator"}</a></li>
      </ul>
      <p className={styles.boundary}>
        {zh ? "validator 通过只证明本地结构与指定检查通过，不证明数据真实、分析正确或系统获准部署。" : "A passing validator proves only that the local structure and declared checks pass. It does not prove truth, analytical validity, or deployment authorization."}
      </p>
    </section>
  );
}

export function AiPythonDataModuleLab({
  locale,
  moduleSlug,
}: {
  readonly locale: string;
  readonly moduleSlug: AiPythonDataModuleSlug;
}) {
  const zh = isChinese(locale);
  const output = MODULE_OUTPUT[moduleSlug];
  const guide = `${LAB}/${zh ? "README.zh-Hans.md" : "README.md"}`;
  return (
    <section className={styles.panel} aria-labelledby={`${moduleSlug}-lab-title`}>
      <p className={styles.eyebrow}>{zh ? "课程 18 实验交接" : "Course 18 lab handoff"}</p>
      <h2 id={`${moduleSlug}-lab-title`}>{zh ? "把本模块产物接入可执行审计包" : "Connect this module artifact to the executable audit pack"}</h2>
      <p>{zh ? output.zh : output.en}</p>
      <code className={styles.command}>python3 run_notebook.py --output-dir work{"\n"}python3 validate.py --package work/submission.generated.json</code>
      <ul className={styles.links}>
        <li><a href={guide}>{zh ? "实验说明" : "Lab guide"}</a></li>
        <li><a href={`${LAB}/environment.lock.json`}>{zh ? "环境锁" : "Environment lock"}</a></li>
        <li><a href={`${LAB}/capstone.schema.json`}>{zh ? "结课项目 schema" : "Capstone schema"}</a></li>
      </ul>
    </section>
  );
}
