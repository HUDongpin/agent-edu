"use client";

import { mcpLessonProgressKey, updateMcpProgress } from "./progress-store";
import { useMcpProgress, useMcpStorageAvailable } from "./useMcpProgress";
import type { McpUiCopy } from "@/lib/mcp/copy";
import styles from "./McpCourse.module.css";

export default function LessonCompletion({ slug, ui }: { slug: string; ui: McpUiCopy }) {
  const progress = useMcpProgress();
  const storageAvailable = useMcpStorageAvailable();
  const key = mcpLessonProgressKey(slug);
  const complete = progress[key] === true;

  return (
    <section className={styles.lessonCompletion} aria-labelledby="mcp-completion-title">
      <div>
        <p className={styles.eyebrow}>{ui.completionEyebrow}</p>
        <h2 id="mcp-completion-title">{ui.completionTitle}</h2>
        <p>{ui.completionBody}</p>
        {!storageAvailable ? (
          <p role="status" className={styles.storageNotice}>
            {ui.completionStorageUnavailable}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        className={complete ? styles.secondaryButton : styles.primaryButton}
        aria-pressed={complete}
        onClick={() => updateMcpProgress((next) => { next[key] = !complete; })}
      >
        {complete ? ui.completionMarked : ui.completionMark}
      </button>
    </section>
  );
}
