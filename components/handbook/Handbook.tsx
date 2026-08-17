"use client";

import { useEffect, useRef, useState } from "react";
import MARKUP from "@/lib/handbook/markup";
import initHandbook from "@/lib/handbook/behaviour";
import { useI18n } from "../I18nProvider";

const RAIL = ["start", "code", "prompt", "context", "loop", "graph",
  "harness", "evals", "security", "compare", "play"];

/**
 * The handbook: verified markup mounted by React, driven by the original
 * imperative widgets.
 *
 * Same split as the flowchart engine — React owns mounting, the code that was
 * already verified owns behaviour. Once mounted we translate the rail labels
 * in place, so the navigation is localised even though the articles are not.
 */
export default function Handbook() {
  const { t, locale } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!host.current || ready) return;
    host.current.innerHTML = MARKUP;
    try {
      initHandbook();
    } catch (err) {
      // A broken widget must not blank the page — the articles and diagrams
      // still have value without it.
      console.error("handbook widget failed to start:", err);
    }
    setReady(true);
  }, [ready]);

  /* Translate the rail after mount, and again when the language changes. */
  useEffect(() => {
    if (!ready || !host.current) return;
    for (const id of RAIL) {
      const el = host.current.querySelector(`[data-i18n="hb.${id}"]`);
      if (el) el.textContent = t(`hb.${id}`);
    }
  }, [ready, locale, t]);

  return (
    <>
      <div className="shellwrap">
        {locale !== "en" && <p className="langnote">{t("note.englishOnly")}</p>}
      </div>
      <div ref={host} className="en-content" dir="ltr" />
    </>
  );
}
