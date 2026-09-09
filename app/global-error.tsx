"use client";

import { useEffect } from "react";

/**
 * The last resort: the root layout itself threw.
 *
 * app/[locale]/error.tsx catches a page. This catches the thing that renders
 * <html> and <body>, so it has to render them itself and it replaces the
 * Shell — no header, no footer, no language menu, and no I18nProvider to ask
 * what language the reader speaks.
 *
 * So it does what app/global-not-found.tsx does for the same reason: names
 * the nine languages itself and lets the reader pick the way out. Both files
 * sit outside the locale tree, and neither can reach messages/*.json.
 *
 * The styles are inline, and that is not a shortcut. globals.css cannot be
 * imported here: global-not-found.tsx is a server component and imports it
 * for free, but this is a client one, and importing the stylesheet from a
 * client component put it in a chunk every route's prefetch payload then
 * referenced — measured at +13 kB on /en/, +24.8% of that route's payload,
 * for a page almost nobody reaches. It would also have been optimistic: if
 * the root layout threw, a separate stylesheet arriving is not something to
 * depend on. So this file paints itself, and carries the three theme states
 * app/globals.css carries — light, dark by preference, dark by choice —
 * because the reader's hand-set theme has to survive to here too.
 */
const LANGUAGES = [
  { code: "en", native: "English", wrong: "Something went wrong", home: "Home" },
  { code: "es", native: "Español", wrong: "Algo ha salido mal", home: "Inicio" },
  { code: "fr", native: "Français", wrong: "Une erreur est survenue", home: "Accueil" },
  { code: "de", native: "Deutsch", wrong: "Etwas ist schiefgelaufen", home: "Startseite" },
  { code: "zh-Hans", native: "简体中文", wrong: "出错了", home: "首页" },
  { code: "zh-Hant", native: "繁體中文", wrong: "發生錯誤", home: "首頁" },
  { code: "ja", native: "日本語", wrong: "問題が発生しました", home: "ホーム" },
  { code: "ko", native: "한국어", wrong: "문제가 발생했습니다", home: "홈" },
  { code: "ar", native: "العربية", wrong: "حدث خطأ ما", home: "الرئيسية" },
] as const;

const STYLE = `
:root{--bg:#FBFBFD;--ink:#15181F;--ink-3:#5C6474;--line:#DCDFE9;--card:#FFF}
@media(prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --bg:#12151F;--ink:#E7E9F0;--ink-3:#99A1B3;--line:#2C3244;--card:#171B27}}
:root[data-theme="dark"]{
  --bg:#12151F;--ink:#E7E9F0;--ink-3:#99A1B3;--line:#2C3244;--card:#171B27}
body{margin:0;background:var(--bg);color:var(--ink);
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.55}
.ge{width:min(920px,calc(100% - 32px));margin:0 auto;padding:clamp(48px,10vw,112px) 0}
.ge h1{font-size:clamp(28px,6vw,48px);line-height:1.1;margin:12px 0 20px}
.ge-brand{font-size:11px;letter-spacing:.11em;text-transform:uppercase;
  color:var(--ink-3);margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.ge-btn{font:inherit;font-size:14.5px;font-weight:650;padding:10px 18px;border-radius:10px;
  border:1px solid var(--line);background:var(--card);color:var(--ink);cursor:pointer}
.ge-btn:focus-visible{outline:2px solid currentColor;outline-offset:2px}
.ge-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;
  padding:0;margin:32px 0 0;list-style:none}
.ge-grid li{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;
  min-width:0;padding:14px;border:1px solid var(--line);border-radius:11px;background:var(--card)}
.ge-copy{display:flex;min-width:0;flex-direction:column;gap:3px}
.ge-wrong{color:var(--ink-3);font-size:13px;line-height:1.35}
.ge-grid a{color:inherit}
@media(forced-colors:active){.ge-grid li{border-color:CanvasText}}
`;

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    /* Nothing collects this — a static export has no endpoint to send it to.
       It is written so a reader who reports a blank page can be asked what
       the console says. */
    console.error("root layout failed:", error);
  }, [error]);

  useEffect(() => {
    /* The reader's theme, applied here rather than by a script in the head.
     *
     * This component renders the document itself, from the client, after the
     * layout that normally carries the pre-paint theme script has gone. An
     * inline <script> written into that head would not help: a script the
     * browser receives as part of a client render is inert, so the attribute
     * has to be set from an effect. It lands after first paint, which is the
     * honest cost of getting here at all; the media query above means a
     * dark-by-preference reader never sees white regardless. */
    try {
      const chosen = localStorage.getItem("ae.theme");
      if (chosen) document.documentElement.setAttribute("data-theme", chosen);
    } catch {
      /* Private browsing: prefers-color-scheme still applies. */
    }
  }, []);

  return (
    <html lang="und" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <title>Error · aicourse.top</title>
        <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      </head>
      <body>
        <main className="ge">
          <p className="ge-brand">aicourse.top</p>
          <h1 lang="en">Something went wrong</h1>

          <p>
            <button type="button" className="ge-btn" onClick={() => retry()} lang="en">
              Try again
            </button>
          </p>

          <ul className="ge-grid">
            {LANGUAGES.map((language) => (
              <li
                key={language.code}
                lang={language.code}
                dir={language.code === "ar" ? "rtl" : "ltr"}
              >
                <span className="ge-copy">
                  <strong>{language.native}</strong>
                  <span className="ge-wrong">{language.wrong}</span>
                </span>
                <a href={`/${language.code}/`}>{language.home}</a>
              </li>
            ))}
          </ul>
        </main>
      </body>
    </html>
  );
}
