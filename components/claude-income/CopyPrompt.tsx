"use client";

import { useRef, useState } from "react";
import styles from "./ClaudeIncomeCourse.module.css";

export default function CopyPrompt({ prompt }: { prompt: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setStatus("idle"), 2200);
  }

  return (
    <>
      <button className={styles.copyButton} type="button" onClick={copy}>
        {status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy prompt"}
      </button>
      <span className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">
        {status === "copied"
          ? "Prompt copied to clipboard."
          : status === "failed"
            ? "Copy failed. Select and copy the prompt manually."
            : ""}
      </span>
    </>
  );
}
