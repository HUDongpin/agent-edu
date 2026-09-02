"use client";

import { useSyncExternalStore } from "react";
import {
  declareCourseComplete,
  readLearningState,
  readLearningStateOnServer,
  selectCourseProgress,
  subscribeLearningState,
} from "@/lib/progress";
import { useI18n } from "../I18nProvider";

/**
 * The reader's own record that Part 3 is finished.
 *
 * This is a declaration, not a measurement. The site is a static export and
 * cannot read `course/progress.json`, so nothing here verifies anything — it
 * records that the reader pressed a button, in their own browser, and it is
 * reversible for exactly that reason. The copy says so rather than letting a
 * tick imply the site checked.
 */
export default function Declare() {
  const { t } = useI18n();
  const state = useSyncExternalStore(
    subscribeLearningState,
    readLearningState,
    readLearningStateOnServer,
  );
  const progress = selectCourseProgress(state, "build");
  const done = progress.kind === "external" && progress.declaredComplete;

  return (
    <div className="declare">
      <p className="muted">{t("build.declareBody")}</p>
      <div className="acts">
        <button
          type="button"
          className={done ? "iconbtn" : "btn"}
          aria-pressed={done}
          onClick={() => declareCourseComplete("build", !done)}
        >
          {done ? t("build.declaredCta") : t("build.declareCta")}
        </button>
        {/*
          Always present so it is a live region before it has anything to say —
          a span rendered only once `done` flips announces nothing in most
          screen readers. The tick is decorative; the sentence carries the
          meaning, and it must therefore read correctly on its own, without the
          paragraph above it.
        */}
        <span className="declared-note" role="status">
          {done ? <><span aria-hidden="true">✓ </span>{t("build.declaredNote")}</> : null}
        </span>
      </div>
    </div>
  );
}
