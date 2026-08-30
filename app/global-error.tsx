"use client";

import { useSyncExternalStore } from "react";
import "./globals.css";

const COPY = {
  en: {
    title: "This page stopped working.",
    body: "No technical details are shown here. Try the page again, or return home.",
    retry: "Try again",
    home: "Return home",
  },
  es: {
    title: "Esta página dejó de funcionar.",
    body: "Aquí no se muestran detalles técnicos. Vuelve a intentarlo o regresa al inicio.",
    retry: "Intentar de nuevo",
    home: "Volver al inicio",
  },
  fr: {
    title: "Cette page a cessé de fonctionner.",
    body: "Aucun détail technique n’est affiché ici. Réessayez ou revenez à l’accueil.",
    retry: "Réessayer",
    home: "Revenir à l’accueil",
  },
  de: {
    title: "Diese Seite funktioniert gerade nicht.",
    body: "Hier werden keine technischen Details angezeigt. Versuchen Sie es erneut oder kehren Sie zur Startseite zurück.",
    retry: "Erneut versuchen",
    home: "Zur Startseite",
  },
  "zh-Hans": {
    title: "这个页面暂时无法正常运行。",
    body: "这里不会显示技术细节。请重试，或返回首页。",
    retry: "重试",
    home: "返回首页",
  },
  "zh-Hant": {
    title: "這個頁面暫時無法正常運作。",
    body: "這裡不會顯示技術細節。請重試，或返回首頁。",
    retry: "重試",
    home: "返回首頁",
  },
  ja: {
    title: "このページは現在正常に動作していません。",
    body: "技術的な詳細はここには表示されません。もう一度試すか、ホームに戻ってください。",
    retry: "もう一度試す",
    home: "ホームに戻る",
  },
  ko: {
    title: "이 페이지가 지금 정상적으로 작동하지 않습니다.",
    body: "기술 세부 정보는 여기에 표시되지 않습니다. 다시 시도하거나 홈으로 돌아가세요.",
    retry: "다시 시도",
    home: "홈으로 돌아가기",
  },
  ar: {
    title: "توقفت هذه الصفحة عن العمل.",
    body: "لا نعرض التفاصيل التقنية هنا. حاول مرة أخرى أو عُد إلى الصفحة الرئيسية.",
    retry: "حاول مرة أخرى",
    home: "العودة إلى الرئيسية",
  },
} as const;

type RecoveryLocale = keyof typeof COPY;

const subscribeToNothing = () => () => {};

function isRecoveryLocale(value: string | undefined): value is RecoveryLocale {
  return typeof value === "string" && Object.hasOwn(COPY, value);
}

function localeFromPath(): RecoveryLocale {
  if (typeof window === "undefined") return "en";
  const candidate = window.location.pathname.split("/").filter(Boolean)[0];
  return isRecoveryLocale(candidate) ? candidate : "en";
}

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useSyncExternalStore<RecoveryLocale>(
    subscribeToNothing,
    localeFromPath,
    () => "en",
  );
  const copy = COPY[locale];

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning>
      <body>
        <main
          className="recovery-surface recovery-document"
          aria-labelledby="global-error-title"
          role="alert"
          data-testid="global-error"
        >
          <title>{copy.title} · aicourse.top</title>
          <div className="recovery-panel">
            <p className="eyebrow" aria-hidden="true">aicourse.top</p>
            <h1 id="global-error-title">{copy.title}</h1>
            <p className="recovery-detail">{copy.body}</p>
            <div className="recovery-actions">
              <button className="btn primary" type="button" onClick={reset}>
                {copy.retry}
              </button>
              <a className="btn" href={`/${locale}/`}>
                {copy.home}
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
