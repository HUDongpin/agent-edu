"use client";

import { useState } from "react";
import styles from "./IncomeCourse.module.css";

export default function CopyPrompt({ prompt }: { prompt: string }) {
  const [copyResult, setCopyResult] = useState<{ prompt: string; message: string } | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyResult({ prompt, message: "Copied" });
    } catch {
      setCopyResult({ prompt, message: "Copy failed. Select the text manually." });
    }
  }

  return (
    <div className={styles.promptBox}>
      <pre><code>{prompt}</code></pre>
      <button type="button" onClick={copy}>Copy task contract</button>
      <span role="status" aria-live="polite">{copyResult?.prompt === prompt ? copyResult.message : ""}</span>
    </div>
  );
}
