"use client";

import { useState } from "react";
import styles from "./Course3Launchpad.module.css";

export interface CourseCommandBlockProps {
  code: string;
  label: string;
  copyLabel: string;
  copiedLabel: string;
  copyErrorLabel: string;
}

export default function CourseCommandBlock({
  code,
  label,
  copyLabel,
  copiedLabel,
  copyErrorLabel,
}: CourseCommandBlockProps) {
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyCommand() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setStatus(copiedLabel);
    } catch {
      setCopied(false);
      setStatus(copyErrorLabel);
    }
  }

  return (
    <div className={styles.command} data-course-command>
      <div className={styles.commandToolbar}>
        <span className={styles.commandLabel}>{label}</span>
        <button
          className={styles.copyButton}
          type="button"
          onClick={copyCommand}
          data-command-copy
        >
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <pre
        className={styles.commandScroll}
        dir="ltr"
        tabIndex={0}
        aria-label={label}
        data-command-scroll
      ><code translate="no">{code}</code></pre>
      <span
        className={styles.commandStatus}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        data-command-status
      >{status}</span>
    </div>
  );
}
