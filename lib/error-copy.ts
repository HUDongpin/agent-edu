export const ERROR_LOCALES = [
  "en",
  "es",
  "fr",
  "de",
  "zh-Hans",
  "zh-Hant",
  "ja",
  "ko",
  "ar",
] as const;

export type ErrorLocale = (typeof ERROR_LOCALES)[number];

export interface GlobalErrorCopy {
  eyebrow: string;
  title: string;
  body: string;
  retry: string;
  home: string;
  courses: string;
  reference: string;
}

/**
 * `global-error.tsx` replaces the locale layout, so its small recovery
 * dictionary must be self-contained. The contract test keeps these strings
 * aligned with the normal message bundles without shipping all nine, much
 * larger dictionaries in the global error chunk.
 */
export const GLOBAL_ERROR_COPY: Record<ErrorLocale, GlobalErrorCopy> = {
  en: {
    eyebrow: "Page recovery",
    title: "This page could not finish loading.",
    body: "Your saved course progress remains in this browser. Try loading this page again, or return home.",
    retry: "Try again",
    home: "Home",
    courses: "Courses",
    reference: "Error reference",
  },
  es: {
    eyebrow: "Recuperación de la página",
    title: "Esta página no ha podido terminar de cargarse.",
    body: "El progreso de tus cursos sigue guardado en este navegador. Intenta cargar la página de nuevo o vuelve al inicio.",
    retry: "Intentar de nuevo",
    home: "Inicio",
    courses: "Cursos",
    reference: "Referencia del error",
  },
  fr: {
    eyebrow: "Récupération de la page",
    title: "Le chargement de cette page n’a pas pu aboutir.",
    body: "Votre progression reste enregistrée dans ce navigateur. Essayez de recharger la page ou retournez à l’accueil.",
    retry: "Réessayer",
    home: "Accueil",
    courses: "Cours",
    reference: "Référence de l’erreur",
  },
  de: {
    eyebrow: "Seite wiederherstellen",
    title: "Diese Seite konnte nicht vollständig geladen werden.",
    body: "Ihr Kursfortschritt bleibt in diesem Browser gespeichert. Versuchen Sie, die Seite erneut zu laden, oder kehren Sie zur Startseite zurück.",
    retry: "Erneut versuchen",
    home: "Start",
    courses: "Kurse",
    reference: "Fehlerreferenz",
  },
  "zh-Hans": {
    eyebrow: "页面恢复",
    title: "这个页面未能完成加载。",
    body: "你的课程进度仍保存在此浏览器中。请重新加载此页面，或返回首页。",
    retry: "重试",
    home: "首页",
    courses: "课程",
    reference: "错误编号",
  },
  "zh-Hant": {
    eyebrow: "頁面復原",
    title: "這個頁面未能完成載入。",
    body: "你的課程進度仍保存在此瀏覽器中。請重新載入此頁面，或返回首頁。",
    retry: "重試",
    home: "首頁",
    courses: "課程",
    reference: "錯誤編號",
  },
  ja: {
    eyebrow: "ページの復旧",
    title: "このページを最後まで読み込めませんでした。",
    body: "講座の進捗はこのブラウザに保存されたままです。もう一度読み込むか、ホームに戻ってください。",
    retry: "再試行",
    home: "ホーム",
    courses: "講座",
    reference: "エラー参照番号",
  },
  ko: {
    eyebrow: "페이지 복구",
    title: "이 페이지를 끝까지 불러오지 못했습니다.",
    body: "강의 진행 상황은 이 브라우저에 그대로 저장되어 있습니다. 페이지를 다시 불러오거나 홈으로 돌아가세요.",
    retry: "다시 시도",
    home: "홈",
    courses: "강의",
    reference: "오류 참조 번호",
  },
  ar: {
    eyebrow: "استعادة الصفحة",
    title: "تعذّر إكمال تحميل هذه الصفحة.",
    body: "يبقى تقدّمك في الدورات محفوظًا في هذا المتصفح. حاول تحميل الصفحة مرة أخرى أو عُد إلى الصفحة الرئيسية.",
    retry: "أعد المحاولة",
    home: "الرئيسية",
    courses: "الدورات",
    reference: "مرجع الخطأ",
  },
};

const ERROR_LOCALE_SET = new Set<string>(ERROR_LOCALES);

export function errorLocaleFromPathname(pathname: string): ErrorLocale {
  const firstSegment = pathname.split("/").find(Boolean);
  return firstSegment && ERROR_LOCALE_SET.has(firstSegment)
    ? firstSegment as ErrorLocale
    : "en";
}

export function errorDirection(locale: ErrorLocale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}
