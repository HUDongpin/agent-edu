"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/I18nProvider";

/**
 * The page-level boundary.
 *
 * Everything above this file survives. `app/[locale]/layout.tsx` renders
 * <html>, <body> and the Shell, and an error.tsx does not wrap the layout in
 * its own segment — so a page that throws loses the page and keeps the
 * header, the footer, the language menu, the theme the reader chose and the
 * reading direction. They can leave by any of the six nav links instead of
 * meeting a document with nothing in it.
 *
 * Without this file the fallback is Next's own, which renders its own
 * document and does not include globals.css: no chrome, no locale, and a
 * light page for a reader who had set dark by hand.
 *
 * The copy is inlined rather than read from messages/*.json, for the same
 * reason app/global-not-found.tsx inlines its own. The strings a scope sends
 * to the browser are generated from the import graph by
 * scripts/extract-i18n-scopes.mjs, and its entry points are page.tsx files.
 * An error.tsx is not one, so a t() call here would be collected into no
 * scope and would print `error.title` to the reader — and the gate that
 * catches precisely that reads out/, where an error state never appears.
 * Nine short strings in one table is the honest version of that trade; the
 * alternative is a silent failure in the one place nobody is looking.
 */
const COPY = {
  "en": { dir: "ltr", title: "Something went wrong", body: "This page ran into an error. The rest of the site is unaffected.", retry: "Try again" },
  "es": { dir: "ltr", title: "Algo ha salido mal", body: "Esta página ha encontrado un error. El resto del sitio no está afectado.", retry: "Reintentar" },
  "fr": { dir: "ltr", title: "Une erreur est survenue", body: "Cette page a rencontré une erreur. Le reste du site n'est pas affecté.", retry: "Réessayer" },
  "de": { dir: "ltr", title: "Etwas ist schiefgelaufen", body: "Auf dieser Seite ist ein Fehler aufgetreten. Der Rest der Website ist nicht betroffen.", retry: "Erneut versuchen" },
  "zh-Hans": { dir: "ltr", title: "出错了", body: "此页面遇到错误。网站其余部分不受影响。", retry: "重试" },
  "zh-Hant": { dir: "ltr", title: "發生錯誤", body: "此頁面發生錯誤。網站其餘部分不受影響。", retry: "重試" },
  "ja": { dir: "ltr", title: "問題が発生しました", body: "このページでエラーが発生しました。サイトの他の部分には影響ありません。", retry: "再試行" },
  "ko": { dir: "ltr", title: "문제가 발생했습니다", body: "이 페이지에서 오류가 발생했습니다. 사이트의 나머지 부분은 영향을 받지 않습니다.", retry: "다시 시도" },
  "ar": { dir: "rtl", title: "حدث خطأ ما", body: "واجهت هذه الصفحة خطأ. بقية الموقع لم تتأثر.", retry: "إعادة المحاولة" },
} as const;

export default function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { locale } = useI18n();
  const code = (locale in COPY ? locale : "en") as keyof typeof COPY;
  const copy = COPY[code];

  useEffect(() => {
    /* A static export has no server and no reporting endpoint, so the console
       is the only place this can go. It is still worth writing: a reader who
       says "the lab went blank" can be asked what it says. */
    console.error("route error:", error);
  }, [error]);

  useEffect(() => {
    /* Put the reader's theme back.
     *
     * app/[locale]/layout.tsx sets data-theme from localStorage in a script
     * that runs before paint, imperatively — the attribute is not in any JSX.
     * When the error was thrown during hydration React recovers by rendering
     * the document again from the client, and <html> comes back without it:
     * measured on a built export, data-theme was null on the errored page and
     * "dark" on every other page in the same session. A reader who had chosen
     * dark by hand would meet this page, and only this page, in white. */
    try {
      const chosen = localStorage.getItem("ae.theme");
      if (chosen) document.documentElement.setAttribute("data-theme", chosen);
    } catch {
      /* Private browsing: prefers-color-scheme still applies. */
    }
  }, []);

  return (
    <div className="shellwrap errorbox">
      <div role="alert" lang={code} dir={copy.dir}>
        <p className="eyebrow">aicourse.top</p>
        <h1>{copy.title}</h1>
        <p className="small">{copy.body}</p>
        <p>
          <button type="button" className="btn" onClick={() => retry()}>
            {copy.retry}
          </button>
        </p>
      </div>
    </div>
  );
}
