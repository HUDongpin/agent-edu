"use client";

import { useRef } from "react";
import { tabTargetIndex } from "@/lib/tab-navigation";
import { useI18n } from "../I18nProvider";

export interface Stage {
  /** Message key for the short name shown on the tab. */
  name: string;
  /** Does this step send anything to a model? */
  needsKey: boolean;
  done: boolean;
}

/**
 * The four steps, as a real tablist.
 *
 * The markup claimed role="tablist" before but had no panels wired to it, no
 * roving tabindex and no arrow keys — so a screen-reader user was told
 * "tab 1 of 4" and then found nothing it controlled, and a keyboard user had
 * to tab through all four to reach the content. The pattern is cheap to do
 * properly and this is the site's main interactive lesson.
 *
 * The numbering starts at 1. "Stage 0" is a programmer's habit, and the
 * people this course is written for count from one.
 */
export default function Stages({
  stages, current, onPick, panelId, disabled = false,
}: {
  stages: Stage[];
  current: number;
  onPick: (i: number) => void;
  panelId: string;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const box = useRef<HTMLDivElement>(null);

  function keys(e: React.KeyboardEvent) {
    if (disabled) return;
    const rtl = (box.current
      ? getComputedStyle(box.current).direction
      : document.documentElement.dir) === "rtl";
    const next = tabTargetIndex(e.key, current, stages.length, "horizontal", rtl);
    if (next === null) return;
    e.preventDefault();
    onPick(next);
    box.current?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus();
  }

  return (
    <div className="steps" role="tablist" aria-label={t("lab.stepsLabel")} ref={box} onKeyDown={keys}>
      {stages.map((s, i) => (
        <button
          key={s.name}
          id={`${panelId}-tab-${i}`}
          className={"step" + (s.done ? " done" : "")}
          role="tab"
          type="button"
          aria-selected={current === i}
          aria-controls={panelId}
          tabIndex={current === i ? 0 : -1}
          disabled={disabled}
          /* Spelled out, because the visible text concatenates to
             "Step 1Your first call🔑needs your key" when read aloud. */
          aria-label={[
            `${t("lab.step")} ${i + 1}: ${t(s.name)}`,
            s.needsKey ? t("lab.needKey") : t("lab.noKeyNeeded"),
            s.done ? t("lab.done") : "",
          ].filter(Boolean).join(" — ")}
          onClick={() => onPick(i)}
        >
          <span className="n">
            {t("lab.step")} {i + 1}
            {s.done && <span className="tickmark" aria-hidden="true"> ✓</span>}
          </span>
          <span className="t">{t(s.name)}</span>
          <span className={"needs " + (s.needsKey ? "key" : "free")}>
            {s.needsKey && <span aria-hidden="true">🔑</span>}
            {s.needsKey ? t("lab.needKey") : t("lab.noKeyNeeded")}
          </span>
        </button>
      ))}
    </div>
  );
}
