import type { AgenticVideoEditingCourseCopy } from "@/lib/agentic-video-editing";
import styles from "./AgenticVideoEditingCourse.module.css";

export default function PipelineMap({
  labels,
  locale,
}: {
  labels: AgenticVideoEditingCourseCopy["ui"];
  locale: "en" | "zh-Hans";
}) {
  const steps = locale === "zh-Hans"
    ? ["意图", "证据", "计划", "预览", "执行", "验证", "批准"]
    : ["Intent", "Evidence", "Plan", "Preview", "Execute", "Verify", "Approve"];
  return (
    <figure className={styles.pipelineMap} aria-labelledby="agentic-video-pipeline-caption">
      <div className={styles.previewFrame} aria-hidden="true">
        <div className={styles.previewImage}>
          <span className={styles.safeFrame} />
          <span className={styles.playhead} />
          <span className={styles.captionLine}>EVIDENCE → CUT</span>
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
      <figcaption id="agentic-video-pipeline-caption">
        <strong>{labels.pipeline ?? "Production loop"}</strong>
        <span>{locale === "zh-Hans" ? "每一步都留下可检查对象；最后一道门只由人开启。" : "Every stage leaves an inspectable object. Only a human opens the final gate."}</span>
      </figcaption>
    </figure>
  );
}
