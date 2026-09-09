"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import initHandbook from "@/lib/handbook/behaviour";
import { makeCopy, type WidgetTable } from "@/lib/handbook/copy";
import Next from "./Next";
import { useI18n } from "../I18nProvider";

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
  const startedFor = useRef<string | null>(null);
  /* Which body of markup failed to start, not merely that one did: switching
     language replaces the subtree, and a note about the markup a reader has
     already navigated away from would outlive its subject. */
  const [failedFor, setFailedFor] = useState<string | null>(null);

  /* The widgets' own strings. They arrive as a prop for the same reason the
     markup does — the table is chosen per locale on the server — but they
     are handed to the widgets rather than spliced, because none of this text
     exists until a reader presses something. */
  const C = useMemo(() => makeCopy(locale, copy), [locale, copy]);

  /* Start the widgets once per body of markup.
   *
   * Once, so React's development double-invoke does not bind everything
   * twice. Per body of markup, because switching language is a client-side
   * navigation: React replaces the subtree with the new locale's HTML, and
   * every listener the widgets had hung on it goes with the old nodes. */
  useEffect(() => {
    if (startedFor.current === html) return;
    startedFor.current = html;
    try {
      initHandbook(C);
    } catch (err) {
      // A broken widget must not blank the page — the articles and diagrams
      // still have value without it.
      //
      // initHandbook binds every widget in one pass, and behaviour.ts is a
      // byte-for-byte port that may not be restructured to bind them
      // separately. So a throw part-way through leaves the widgets before it
      // working and every widget after it inert: the rail still moves, a
      // later button does nothing, and nothing on the page says why. Logging
      // it told the maintainer and left the reader guessing, which is the
      // failure this repository gates everywhere else. Now it says so.
      console.error("handbook widget failed to start:", err);
      /* The one extra render this costs is the point of the exercise: a reader
         cannot be told by an effect that only writes to the console, and there
         is no external store to subscribe to instead — initHandbook either
         returned or it threw, once, at mount. */
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFailedFor(html);
    }
    // C is intentionally excluded: it and the markup are both chosen from the
    // locale on the server, so they arrive together and change together, and
    // the markup is the honest key — it is the thing the widgets bound to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  return (
    <>
      <div className="shellwrap">
        {!localised && locale !== "en" && <p className="langnote">{t("note.englishOnly")}</p>}
        {failedFor === html && (
          <p className="langnote" role="status">{t("note.widgetsFailed")}</p>
        )}
      </div>
      <div
        className={localised ? "hb" : "hb en-content"}
        dir={localised ? undefined : "ltr"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {/* After the handbook, not inside it: the markup is byte-stable and its
          prose is generated, so the offer that the frozen sections make exactly
          once — and one section before the ending — is repeated here, where it
          is reachable from every section. */}
      <Next />
    </>
  );
}
