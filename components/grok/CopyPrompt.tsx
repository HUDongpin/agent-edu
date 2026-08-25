"use client";

import { useRef, useState } from "react";
import { useGrokHydrated } from "./useGrokProgress";
import styles from "./GrokCourse.module.css";

export default function CopyPrompt({
  prompt,
  label,
  copiedLabel,
  failedLabel,
}: {
  prompt: string;
  label: string;
  copiedLabel: string;
  failedLabel: string;
}) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const hydrated = useGrokHydrated();
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setStatus("idle"), 2400);
  }

  return (
    <div className={styles.promptBox}>
      <pre tabIndex={0}>{prompt}</pre>
      <div className={styles.promptActions}>
        <button type="button" disabled={!hydrated} onClick={copy} className={styles.secondaryAction}>
          {status === "copied" ? copiedLabel : label}
        </button>
        <span role="status" aria-live="polite">
          {status === "failed" ? failedLabel : status === "copied" ? copiedLabel : ""}
        </span>
      </div>
    </div>
  );
}
