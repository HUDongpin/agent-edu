import type { PromptCourseCopy, PromptExampleCopy } from "@/lib/prompts";
import { CopyPrompt } from "./PromptInteractions";
import styles from "./PromptCourse.module.css";

export default function PromptExample({
  prompt,
  labels,
}: {
  prompt: PromptExampleCopy;
  labels: PromptCourseCopy["ui"];
}) {
  return (
    <section className={styles.promptStudio} aria-labelledby="real-prompt-title">
      <header>
        <div>
          <p className={styles.kicker}>{labels.promptLabel}</p>
          <h2 id="real-prompt-title">{prompt.title}</h2>
        </div>
        <CopyPrompt text={prompt.text} labels={labels} />
      </header>
      <div className={styles.promptCompare}>
        <div className={styles.weakPrompt}>
          <span>{labels.weakPrompt}</span>
          <p dir="ltr">{prompt.weak}</p>
        </div>
        <div className={styles.strongPrompt}>
          <span>{labels.strongPrompt}</span>
          <pre dir="ltr"><code>{prompt.text}</code></pre>
        </div>
      </div>
      <details className={styles.promptAnalysis}>
        <summary>{labels.whyItWorks}</summary>
        <ol>{prompt.annotations.map((annotation) => <li key={annotation}>{annotation}</li>)}</ol>
      </details>
    </section>
  );
}
