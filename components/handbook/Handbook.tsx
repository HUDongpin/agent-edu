"use client";

import { useEffect, useMemo, useRef } from "react";
import initHandbook from "@/lib/handbook/behaviour";
import { makeCopy, type WidgetTable } from "@/lib/handbook/copy";
import { useI18n } from "../I18nProvider";

const NO_SCRIPT_CSS = `
  .hb .rail,
  .hb .section-nav,
  .hb #themeBtn { display: none !important; }
  .hb .panel {
    display: block !important;
    animation: none !important;
    padding-block: 28px;
    border-block-end: 1px solid var(--line);
    scroll-margin-block-start: 20px;
  }
  @media (max-width: 860px) {
    .topbar { position: static; }
    .topbar-in { flex-wrap: wrap; }
    .navwrap { order: 3; flex: 1 0 100%; width: 100%; }
    .mainnav {
      display: flex !important;
      position: static;
      box-shadow: none;
      border-block-end: 0;
    }
    .navtoggle { display: none !important; }
  }
`;

/**
 * The handbook: verified markup rendered by React, driven by the original
 * imperative widgets.
 *
 * Same split as the flowchart engine — React owns mounting, the code that was
 * already verified owns behaviour. The markup arrives as a prop because the
 * text in it is now chosen per locale, on the server, at build time: see
 * lib/handbook/localise.ts. Doing that swap in the browser, as this component
 * used to, meant a crawler on /zh-Hans/handbook/ was served an entirely
 * English page down to the rail labels, and the closing call into the lab was
 * an empty button until script ran.
 *
 * The markup is rendered, not assigned to innerHTML in an effect. Assigning it
 * meant the eleven sections existed only after JavaScript ran: the served HTML
 * for /en/handbook/ was an empty <div>, so the site's largest body of teaching
 * text had no <h1>, no headings and no prose for a crawler or a reader without
 * JavaScript — on a site whose whole reason for per-locale URLs was being
 * indexable. React does not diff dangerouslySetInnerHTML content, so the
 * widgets are still free to mutate the subtree afterwards.
 */
export default function Handbook(
  { html, localised, copy }: { html: string; localised: boolean; copy: WidgetTable },
) {
  const { t, locale } = useI18n();
  const active = useRef<{
    html: string;
    cleanup: () => void;
    pendingCleanup: boolean;
  } | null>(null);

  /* The widgets' own strings. They arrive as a prop for the same reason the
     markup does — the table is chosen per locale on the server — but they
     are handed to the widgets rather than spliced, because none of this text
     exists until a reader presses something. */
  const C = useMemo(() => makeCopy(locale, copy), [locale, copy]);

  /* Start one widget lifetime per body of markup. React development performs
   * an immediate setup → cleanup → setup probe. Its second setup cancels the
   * pending development cleanup and reuses the still-valid imperative DOM;
   * a real unmount gets disposed at the end of the current task. Production
   * cleanup remains synchronous. Locale changes always dispose the old body
   * before binding the replacement. */
  useEffect(() => {
    let lifetime = active.current;
    if (lifetime?.html === html) {
      lifetime.pendingCleanup = false;
    } else {
      if (lifetime) {
        lifetime.pendingCleanup = false;
        lifetime.cleanup();
      }
      let cleanup = () => {};
      try {
        cleanup = initHandbook(C);
      } catch (err) {
        // A broken widget must not blank the page — the articles and diagrams
        // still have value without it.
        console.error("handbook widget failed to start:", err);
      }
      lifetime = { html, cleanup, pendingCleanup: false };
      active.current = lifetime;
    }

    const ownedLifetime = lifetime;
    return () => {
      const dispose = () => {
        if (!ownedLifetime.pendingCleanup) return;
        ownedLifetime.cleanup();
        if (active.current === ownedLifetime) active.current = null;
      };
      ownedLifetime.pendingCleanup = true;
      if (process.env.NODE_ENV === "production") dispose();
      else queueMicrotask(dispose);
    };
    // C is intentionally excluded: it and the markup are both chosen from the
    // locale on the server, so they arrive together and change together, and
    // the markup is the honest key — it is the thing the widgets bound to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  return (
    <>
      <div className="shellwrap">
        {!localised && locale !== "en" && <p className="langnote">{t("note.englishOnly")}</p>}
      </div>
      <noscript dangerouslySetInnerHTML={{ __html: `<style>${NO_SCRIPT_CSS}</style>` }} />
      <div
        className={localised ? "hb" : "hb en-content"}
        dir={localised ? undefined : "ltr"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
