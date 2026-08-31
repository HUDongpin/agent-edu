import type { AgenticVideoEditingCourseCopy } from "@/staging/course-src/agentic-video-editing";
import styles from "./AgenticVideoEditingCourse.module.css";

export default function PipelineMap({
  labels,
  locale,
}: {
  labels: AgenticVideoEditingCourseCopy["ui"];
  locale: "en" | "zh-Hans";
}) {
  const steps = locale === "zh-Hans"
    ? ["意图", "素材与权利", "证据", "计划批准", "工具权限", "Mutation dry-run", "交付合同", "受控执行", "验证", "人工决定"]
    : ["Intent", "Assets & rights", "Evidence", "Plan approval", "Tool authority", "Mutation dry-run", "Delivery contract", "Controlled execution", "Verification", "Human decision"];
  const feedbackSteps = locale === "zh-Hans"
    ? ["验证失败", "相关上游产物", "重新渲染", "重新验证"]
    : ["Failed verification", "Relevant upstream artifact", "Re-render", "Re-verify"];
  return (
    <figure className={styles.pipelineMap} aria-labelledby="agentic-video-pipeline-caption">
      <div className={styles.previewFrame} aria-hidden="true">
        <div className={styles.previewImage}>
          <span className={styles.safeFrame} />
          <span className={styles.playhead} />
          <span className={styles.captionLine}>{locale === "zh-Hans" ? "证据 → 剪辑" : "EVIDENCE → CUT"}</span>
        </div>
        <div className={styles.timelineTracks}>
          <span><i /><i /><i /></span>
          <span><i /><i /></span>
          <span><i /></span>
        </div>
      </div>
      <ol>
        {steps.map((step, index) => (
          <li key={step} data-gate={index === steps.length - 1 || undefined}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{step}</strong>
          </li>
        ))}
      </ol>
      <div className={styles.pipelineFeedback} role="note">
        <span>{locale === "zh-Hans" ? "有边界的修复环" : "Bounded repair loop"}</span>
        <ol aria-label={locale === "zh-Hans" ? "验证后的修复顺序" : "Post-verification repair sequence"}>
          {feedbackSteps.map((step, index) => (
            <li key={step}>
              <strong>{step}</strong>
              {index < feedbackSteps.length - 1 ? <span aria-hidden="true">↝</span> : null}
            </li>
          ))}
        </ol>
      </div>
      <figcaption id="agentic-video-pipeline-caption">
        <strong>{labels.pipeline ?? "Production loop"}</strong>
        <span>{locale === "zh-Hans" ? "每一步都留下可检查对象。验证失败只回到相关上游产物；修复后必须重新渲染、重新验证，最后一道门只由人开启。" : "Every stage leaves an inspectable object. A failed check returns only to the relevant upstream artifact; every repair must be re-rendered and re-verified, and only a human opens the final gate."}</span>
      </figcaption>
    </figure>
  );
}
