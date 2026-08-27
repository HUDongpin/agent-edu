import type { ProductionAiModuleSlug } from "@/lib/production-ai";
import styles from "./ProductionAiLab.module.css";

const LAB = "/courses/production-ai/lab";

const MODULE_HANDOFF: Record<ProductionAiModuleSlug, { en: string; zh: string }> = {
  "production-contract-slis-slos": { en: "Recompute each classifier and RAG SLI from the emitted local HTTP transcript.", zh: "根据生成的本地 HTTP transcript 重算分类器与 RAG 的每项 SLI。" },
  "data-training-pipelines": { en: "Trace the fixed fixture through the predictive and retrieval preparation stages.", zh: "追踪固定 fixture 经过预测与检索准备阶段的过程。" },
  "dataset-feature-lineage-versioning": { en: "Reconcile fixture, code, model, index, environment, and output hashes in lineage.json.", zh: "在 lineage.json 中核对 fixture、代码、模型、index、环境与输出哈希。" },
  "experiment-tracking-reproducibility": { en: "Compare clean, injected-failure, and post-rollback runs without deleting failed evidence.", zh: "比较干净、注入故障与回滚后运行，且不删除失败证据。" },
  "model-registry-approval-cards": { en: "Inspect candidate, held, rolled-back, and verified states plus the named human decision.", zh: "检查 candidate、held、rolled-back、verified 状态与具名人类决定。" },
  "batch-online-serving": { en: "Run both localhost HTTP services and verify request, response, and idempotency contracts.", zh: "运行两个 localhost HTTP 服务并核验请求、响应与幂等合同。" },
  "packaging-security-secrets": { en: "Confirm the planted marker is blocked and no real secret or network dependency exists.", zh: "确认植入标记被阻止，且不存在真实密钥或网络依赖。" },
  "shadow-canary-feature-flags": { en: "Hold both canaries after critical quality signals and preserve a deterministic rollback path.", zh: "关键质量信号出现后暂停两个 canary，并保留确定性回滚路径。" },
  "monitoring-performance-cost": { en: "Inspect quality, support, trace, logical-cost, and latency-budget signals separately.", zh: "分别检查质量、支持性、trace、逻辑成本与延迟预算信号。" },
  "data-concept-drift-continuous-evaluation": { en: "Actively inject a numeric feature shift and a contaminated retrieval index, then retain the evidence.", zh: "主动注入数值特征漂移与受污染检索 index，并保留证据。" },
  "incident-response-rollback-postmortem": { en: "Follow the alert/runbook, verify both rollback targets, and preserve the blameless timeline.", zh: "遵循 alert/runbook，核验两个回滚目标并保留无责时间线。" },
  "dual-system-production-capstone": { en: "Emit all ten artifacts, pass destructive validator tests, and end with time-bounded no-deploy approval.", zh: "生成全部十项产物，通过破坏性 validator 测试，并以有期限 no-deploy 审批结束。" },
};

function isChinese(locale: string) { return locale === "zh-Hans"; }

export function ProductionAiLabDashboard({ locale }: { readonly locale: string }) {
  const zh = isChinese(locale);
  const guide = `${LAB}/${zh ? "README.zh-Hans.md" : "README.md"}`;
  return (
    <section className={styles.panel} aria-labelledby="production-ai-lab-title">
      <p className={styles.eyebrow}>{zh ? "离线双系统生产实验室" : "Offline dual-system production lab"}</p>
      <h2 id="production-ai-lab-title">{zh ? "真实 localhost 服务、主动退化、告警与可验证回滚" : "Real localhost services, active degradation, alerts, and verified rollback"}</h2>
      <p>{zh ? "标准库 runner 会实际启动预测与 RAG 两个 localhost HTTP 服务，发出请求，注入数值数据漂移与受污染检索 index，观察质量、支持性、trace、成本和延迟预算信号，触发告警并回滚两个版本。最后生成 lineage、实验、registry、服务合同、dashboard 数据、drift、runbook、rollback、postmortem 与治理审批十项产物。" : "The standard-library runner starts real predictive and RAG HTTP services on localhost, sends requests, injects numeric data drift and a contaminated retrieval index, observes quality, support, trace, cost, and latency-budget signals, fires alerts, and rolls back both versions. It then emits the ten required lineage, experiment, registry, serving-contract, dashboard-data, drift, runbook, rollback, postmortem, and governance artifacts."}</p>
      <div className={styles.grid}>
        <div className={styles.card}><h3>{zh ? "运行合同" : "Run contract"}</h3><p>{zh ? "CPython 3.9.6 参考锁；纯标准库；仅 127.0.0.1 临时端口；无外网、API key、真实数据或密钥。" : "CPython 3.9.6 reference lock; stdlib only; ephemeral 127.0.0.1 ports; no external network, API key, real data, or secret."}</p></div>
        <div className={styles.card}><h3>{zh ? "验证合同" : "Validation contract"}</h3><p><code>aicourse.production-ai.validator.v1</code></p></div>
        <div className={styles.card}><h3>{zh ? "权限合同" : "Authority contract"}</h3><p>{zh ? "演练强制以 no-deploy 结束；validator 通过绝不是生产授权。" : "The exercise ends in mandatory no-deploy; a validator pass is never production authorization."}</p></div>
      </div>
      <code className={styles.command}>python3 run_capstone.py --output-dir work{"\n"}python3 validate.py --package work/submission.generated.json{"\n"}python3 test_lab.py</code>
      <ul className={styles.links}>
        <li><a href={guide} download>{zh ? "下载运行说明" : "Download run guide"}</a></li>
        <li><a href={`${LAB}/services.py`} download>{zh ? "下载双服务" : "Download dual services"}</a></li>
        <li><a href={`${LAB}/run_capstone.py`} download>{zh ? "下载故障演练" : "Download failure exercise"}</a></li>
        <li><a href={`${LAB}/capstone.schema.json`} download>{zh ? "下载 capstone schema" : "Download capstone schema"}</a></li>
        <li><a href={`${LAB}/submission.template.json`} download>{zh ? "下载提交模板" : "Download submission template"}</a></li>
        <li><a href={`${LAB}/validate.py`} download>{zh ? "下载 validator" : "Download validator"}</a></li>
      </ul>
      <p className={styles.boundary}>{zh ? "所有服务、请求、模型、文档、故障与指标均为本地虚构教学对象；结果不得外推为真实可靠性、安全、合规或部署准备度。" : "Every service, request, model, document, failure, and metric is a local fictional teaching object; results cannot be generalized into real reliability, safety, compliance, or deployment readiness."}</p>
    </section>
  );
}

export function ProductionAiModuleLab({ locale, moduleSlug }: { readonly locale: string; readonly moduleSlug: ProductionAiModuleSlug }) {
  const zh = isChinese(locale);
  const handoff = MODULE_HANDOFF[moduleSlug];
  const guide = `${LAB}/${zh ? "README.zh-Hans.md" : "README.md"}`;
  return (
    <section className={styles.panel} aria-labelledby={`${moduleSlug}-lab-title`}>
      <p className={styles.eyebrow}>{zh ? "课程 21 实验交接" : "Course 21 lab handoff"}</p>
      <h2 id={`${moduleSlug}-lab-title`}>{zh ? "把模块产物接入可执行双系统演练" : "Connect this module artifact to the executable dual-system exercise"}</h2>
      <p>{zh ? handoff.zh : handoff.en}</p>
      <code className={styles.command}>python3 run_capstone.py --output-dir work{"\n"}python3 validate.py --package work/submission.generated.json</code>
      <ul className={styles.links}><li><a href={guide}>{zh ? "实验说明" : "Lab guide"}</a></li><li><a href={`${LAB}/environment.lock.json`}>{zh ? "环境锁" : "Environment lock"}</a></li><li><a href={`${LAB}/capstone.schema.json`}>{zh ? "结课项目 schema" : "Capstone schema"}</a></li></ul>
    </section>
  );
}
