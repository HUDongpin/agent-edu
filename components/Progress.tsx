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
import { clearLabDraft } from "@/lib/lab/draft";
import { clearLabRun } from "@/lib/lab/run";
import Link from "next/link";
import { useI18n } from "./I18nProvider";
import Rich from "./Rich";

type Item = { label: string; done: boolean; note: ReactNode; href: string; action: string };

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
  /* The most valuable click a returning learner has is "take me back to where I
     stopped", and this section offered three lines of plain text. The catalogue
     had already solved it: selectCourseProgress picks between start, resume,
     finish and review, and all four words exist in every locale — so saying
     which one applies, and linking to it, costs no string.

     It also settles a readout that looked like a bug. The tick comes from a
     finished Control Room run and the count from sections visited, so a reader
     who had opened all eleven and submitted no brief saw "11 of 11" beside an
     empty circle with nothing saying what remained. The action word says it:
     "finish". */
  const action = (id: string) => {
    const p = selectCourseProgress(state, id);
    if (p.kind === "external") return p.declaredComplete ? "review" : "start";
    return p.kind === "tracked" ? p.action : "start";
  };
  const items: Item[] = [
    {
      label: t("track.1.title"),
      done: handbook.completed,
      href: `/${locale}/handbook/`,
      action: action("handbook"),
      /* Show the number they earned, not only the one they attended. The store
         keeps a Control Room best and a best Eval score and the interface
         reported neither, so the only thing on screen was how many tabs were
         opened. Attendance plus one earned number is a far more honest claim. */
      note: <>
        <Rich k="cat.count.sections"
          vars={{ current: handbook.exploredSections, total: handbook.totalSections }} />
        {handbook.bestScore === undefined ? null : <>
          {" · "}<Rich k="home.progRoomBest" vars={{ n: handbook.bestScore }} />
        </>}
      </>,
    },
    {
      label: t("track.2.title"),
      done: lab.completed,
      href: `/${locale}/lab/`,
      action: action("lab"),
      note: <>
        <Rich k="cat.count.steps"
          vars={{ current: lab.completedCount, total: lab.totalSteps }} />
        {lab.evalBest === undefined ? null : <>
          {" · "}<Rich k="home.progEvalBest" vars={{ n: lab.evalBest }} />
        </>}
      </>,
    },
    {
      label: t("track.3.title"),
      done: buildDone,
      href: `/${locale}/build/`,
      action: buildDone ? "review" : "start",
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
        {/* "all" means all. The learning record and the Lab draft are separate
            keys, and this button used to clear only the first — so someone on a
            shared or classroom machine pressed the one control that reads as
            "clear me off this computer" and walked away leaving their prompt and
            their edited rules behind, in the store the Lab itself warns them not
            to paste secrets into. It also left the site contradicting itself:
            the Lab reopening mid-journey with their work intact while this
            widget said nothing had happened yet. */}
        <button
          className="iconbtn"
          type="button"
          onClick={() => {
            /* One click used to erase everything, at the widest scope, with no
               account and no server to restore it from. Confirming is the whole
               fix: the library already supports narrower scopes, and a reader
               who meant it loses nothing by saying so twice. */
            if (!confirm(t("home.progResetConfirm"))) return;
            resetLearningState("all");
            clearLabDraft();
            clearLabRun();
          }}
        >
          {t("home.progReset")}
        </button>
      </div>
      <div className="progbar"><span style={{ width: `${(done / items.length) * 100}%` }} /></div>
      <ul className="proglist">
        {items.map((i) => (
          <li key={i.label} className={i.done ? "done" : ""}>
            <span className="tick">{i.done ? "✓" : "○"}</span>
            <span>
              <Link href={i.href}>{i.label}</Link>
              {i.note ? <>{"  "}{i.note}</> : ""}
              {"  "}<span className="mono-note">{t(`cat.${i.action}`)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
