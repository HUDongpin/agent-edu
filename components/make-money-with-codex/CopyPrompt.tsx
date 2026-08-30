"use client";

import { useRef, useState } from "react";
import styles from "./IncomeCourse.module.css";

export default function CopyPrompt({ prompt }: { prompt: string }) {
  const [copyResult, setCopyResult] = useState<{ prompt: string; message: string } | null>(null);
  const promptRef = useRef<HTMLPreElement>(null);

  function selectPrompt() {
    const target = promptRef.current;
    if (!target) return;
    target.focus();
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(target);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopyResult({ prompt, message: "Copied" });
    } catch {
      setCopyResult({
        prompt,
        message: "Copy failed. The task contract is selected; press Control+C or Command+C.",
      });
      window.requestAnimationFrame(selectPrompt);
    }
  }

  return (
    <div className={styles.promptBox}>
      <pre ref={promptRef} tabIndex={0} aria-label="Task contract text"><code>{prompt}</code></pre>
      <button type="button" onClick={copy}>Copy task contract</button>
      <span role="status" aria-live="polite">{copyResult?.prompt === prompt ? copyResult.message : ""}</span>
    </div>
  );
}
