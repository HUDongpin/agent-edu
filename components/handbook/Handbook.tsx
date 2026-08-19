"use client";

import { useEffect, useRef, useState } from "react";
import MARKUP from "@/lib/handbook/markup";
import initHandbook from "@/lib/handbook/behaviour";
import { useI18n } from "../I18nProvider";

/**
 * The handbook: verified markup rendered by React, driven by the original
 * imperative widgets.
 *
 * Same split as the flowchart engine — React owns mounting, the code that was
 * already verified owns behaviour. Once mounted we translate the rail labels
 * in place, so the navigation is localised even though the articles are not.
 *
 * The markup is rendered, not assigned to innerHTML in an effect. Assigning it
 * meant the eleven sections existed only after JavaScript ran: the served HTML
 * for /en/handbook/ was an empty <div>, so the site's largest body of teaching
 * text had no <h1>, no headings and no prose for a crawler or a reader without
 * JavaScript — on a site whose whole reason for per-locale URLs was being
 * indexable. React does not diff dangerouslySetInnerHTML content, so the
 * widgets are still free to mutate the subtree afterwards.
 */
export default function Handbook() {
  const { t, locale } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!host.current || started.current) return;
    started.current = true;
    try {
      initHandbook();
    } catch (err) {
      // A broken widget must not blank the page — the articles and diagrams
      // still have value without it.
      console.error("handbook widget failed to start:", err);
    }
    setReady(true);
  }, []);

  /* Translate the rail after mount, and again when the language changes.
   *
   * Every element the markup marks with data-i18n, not a hard-coded list of
   * rail ids: the closing call to action into the lab carries
   * data-i18n="track.2.cta" and was rendering as an empty button because the
   * list only covered hb.* keys. */
  useEffect(() => {
    if (!ready || !host.current) return;
    for (const el of host.current.querySelectorAll<HTMLElement>("[data-i18n]")) {
      const key = el.dataset.i18n;
      if (key) el.textContent = t(key);
    }
  }, [ready, locale, t]);

  return (
    <>
      <div className="shellwrap">
        {locale !== "en" && <p className="langnote">{t("note.englishOnly")}</p>}
      </div>
      <div
        ref={host}
        className="hb en-content"
        dir="ltr"
        dangerouslySetInnerHTML={{ __html: MARKUP }}
      />
    </>
  );
}
