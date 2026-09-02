"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import {
  readLearningState,
  readLearningStateOnServer,
  resetLearningState,
  selectCourseProgress,
  selectHandbookProgress,
  selectLabProgress,
  subscribeLearningState,
} from "@/lib/progress";
import { useI18n } from "./I18nProvider";
import Rich from "./Rich";

type Item = { label: string; done: boolean; note: ReactNode };

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
  const build = selectCourseProgress(state, "build");
  // Part 3 runs off-site, so it carries the reader's own declaration and no
  // count — a "0 of 9" beside it would imply the site had looked, and it cannot.
  const buildDone = build.kind === "external" && build.declaredComplete;
  const items: Item[] = [
    {
      label: t("track.1.title"),
      done: handbook.completed,
      note: <Rich k="cat.count.sections"
        vars={{ current: handbook.exploredSections, total: handbook.totalSections }} />,
    },
    {
      label: t("track.2.title"),
      done: lab.completed,
      note: <Rich k="cat.count.steps"
        vars={{ current: lab.completedCount, total: lab.totalSteps }} />,
    },
    {
      label: t("track.3.title"),
      done: buildDone,
      note: "",
    },
  ];
  const started = handbook.status !== "not-started"
    || lab.status !== "not-started"
    || buildDone;

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
            <span>{i.label}{i.note ? <>{"  "}{i.note}</> : ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
