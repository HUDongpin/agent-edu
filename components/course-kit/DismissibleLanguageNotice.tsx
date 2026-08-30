"use client";

import { useState } from "react";
import styles from "./CourseKit.module.css";

export function DismissibleLanguageNotice({
  titleId,
  contentLocale,
  contentDirection,
  label,
  notice,
  dismissLabel,
}: {
  readonly titleId: string;
  readonly contentLocale: string;
  readonly contentDirection: "ltr" | "rtl";
  readonly label: string;
  readonly notice: string;
  readonly dismissLabel: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <aside
      className={styles.languageNotice}
      aria-labelledby={titleId}
      lang={contentLocale}
      dir={contentDirection}
    >
      <strong id={titleId}>{label}: {contentLocale}</strong>
      <p>{notice}</p>
      <button
        type="button"
        className={styles.languageNoticeDismiss}
        aria-label={dismissLabel}
        onClick={() => setDismissed(true)}
      >
        <span aria-hidden="true">×</span>
        <span>{dismissLabel}</span>
      </button>
    </aside>
  );
}
