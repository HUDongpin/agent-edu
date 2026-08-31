"use client";

import { useState, useSyncExternalStore } from "react";
import {
  declareCourseCompleteWithResult,
  readLearningState,
  readLearningStateOnServer,
  selectCourseProgress,
  subscribeLearningState,
} from "@/lib/progress";
import { useI18n } from "../I18nProvider";
import styles from "./Declare.module.css";

/**
 * A reversible learner note for the external Build-an-Agent module.
 *
 * The static site cannot inspect `course/progress.json`. This control therefore
 * records only what the learner says in the existing `ae.learning.v2` owner; it
 * does not measure the local stages or certify their result.
 */
export default function Declare() {
  const { t } = useI18n();
  const state = useSyncExternalStore(
    subscribeLearningState,
    readLearningState,
    readLearningStateOnServer,
  );
  const [storageWarning, setStorageWarning] = useState(false);
  const progress = selectCourseProgress(state, "build");
  const done = progress.kind === "external" && progress.declaredComplete;

  const toggle = () => {
    const result = declareCourseCompleteWithResult("build", !done);
    setStorageWarning(!result.persisted);
  };

  return (
    <div className={styles.declaration}>
      <p className="muted" id="build-declaration-explanation">
        {t("build.declareBody")}
      </p>
      <div className={`acts ${styles.actions}`}>
        <button
          type="button"
          className={done ? "iconbtn" : "btn"}
          aria-describedby="build-declaration-explanation"
          aria-pressed={done}
          onClick={toggle}
        >
          {done ? t("build.declaredCta") : t("build.declareCta")}
        </button>
        {/*
          Keep the live region mounted before the mutation. The confirmation
          must also stand alone because assistive technology announces it
          without the explanatory paragraph above.
        */}
        <span className={styles.status} role="status" aria-live="polite" aria-atomic="true">
          {done ? (
            <span>
              <span aria-hidden="true">✓ </span>
              {t("build.declaredNote")}
            </span>
          ) : null}
          {storageWarning ? (
            <span className={styles.storageWarning}>{t("progress.storageUnavailable")}</span>
          ) : null}
        </span>
      </div>
    </div>
  );
}
