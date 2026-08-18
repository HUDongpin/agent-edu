import { LOCALE_CODES, DEFAULT_LOCALE } from "@/lib/i18n";

/**
 * The root page, `/`.
 *
 * A static export has no server and no middleware, so `redirect()` cannot
 * work here — it builds an error page instead, which is what every visitor
 * to the bare domain would have seen. So `/` is a real HTML page that sends
 * the reader on itself:
 *
 *   - a <meta refresh> to /en/, which works with JavaScript disabled;
 *   - a script that runs first and picks the reader's own language instead,
 *     from a previous choice or from Accept-Language.
 *
 * The visible text is the no-JS fallback, and it is why this page has a
 * <noscript>-friendly link rather than a blank body.
 */
export default function RootPage() {
  const script = `
(function () {
  var LOCALES = ${JSON.stringify(LOCALE_CODES)};
  var target = ${JSON.stringify(DEFAULT_LOCALE)};
  try {
    var saved = localStorage.getItem("ae.lang");
    if (saved && LOCALES.indexOf(saved) !== -1) {
      target = saved;
    } else {
      var wanted = navigator.languages || [navigator.language || ""];
      for (var i = 0; i < wanted.length; i++) {
        var w = String(wanted[i] || "");
        if (LOCALES.indexOf(w) !== -1) { target = w; break; }
        if (/^zh\\b/i.test(w)) {
          target = /Hant|TW|HK|MO/i.test(w) ? "zh-Hant" : "zh-Hans"; break;
        }
        var base = w.split("-")[0];
        if (LOCALES.indexOf(base) !== -1) { target = base; break; }
      }
    }
  } catch (e) { /* private browsing: fall through to the default */ }
  location.replace("/" + target + "/");
})();`;

  return (
    <html lang={DEFAULT_LOCALE}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="refresh" content={`0; url=/${DEFAULT_LOCALE}/`} />
        <link rel="canonical" href={`https://aicourse.top/${DEFAULT_LOCALE}/`} />
        <title>aicourse.top</title>
        <script dangerouslySetInnerHTML={{ __html: script }} />
      </head>
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <p>
          Continue to <a href={`/${DEFAULT_LOCALE}/`}>aicourse.top</a>.
        </p>
      </body>
    </html>
  );
}
