"use client";

import { useSyncExternalStore } from "react";
import {
  readLearningState,
  readLearningStateOnServer,
  resetLearningState,
  selectHandbookProgress,
  selectLabProgress,
  subscribeLearningState,
} from "@/lib/progress";
import { useI18n } from "./I18nProvider";

type Item = { label: string; done: boolean; note: string };

/**
 * Progress lives in localStorage and nowhere else — no account, nothing sent
 * anywhere. Rendered client-side because a static export has no per-reader
 * server state, which is exactly the property we wanted to keep.
 */
export default function Progress({ locale }: { locale: string }) {
  const { t } = useI18n();
  const state = useSyncExternalStore(
    subscribeLearningState,
    readLearningState,
    readLearningStateOnServer,
  );
  const handbook = selectHandbookProgress(state);
  const lab = selectLabProgress(state);
  const items: Item[] = [
    {
      label: t("track.1.title"),
      done: handbook.completed,
      note: `${handbook.exploredSections} ${t("ui.of")} ${handbook.totalSections}`,
    },
    {
      label: t("track.2.title"),
      done: lab.completed,
      note: `${lab.completedCount} ${t("ui.of")} ${lab.totalSteps}`,
    },
  ];
  const started = handbook.status !== "not-started" || lab.status !== "not-started";

  if (!started) return <div className="progwrap"><div className="muted">{t("home.progNone")}</div></div>;

  const done = items.filter((i) => i.done).length;

  return (
    <div className="progwrap" data-locale={locale}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <strong>{done} {t("ui.of")} {items.length}</strong>
        <button
          className="iconbtn"
          type="button"
          onClick={() => resetLearningState("all")}
        >
          {t("home.progReset")}
        </button>
      </div>
      <div className="progbar"><span style={{ width: `${(done / items.length) * 100}%` }} /></div>
      <ul className="proglist">
        {items.map((i) => (
          <li key={i.label} className={i.done ? "done" : ""}>
            <span className="tick">{i.done ? "✓" : "○"}</span>
            <span>{i.label}{i.note ? `  ${i.note}` : ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
