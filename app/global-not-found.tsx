import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 · aicourse.top",
  description: "Choose a language and return to the free Agentic Engineering course.",
};

const LANGUAGES = [
  { code: "en", native: "English", missing: "Page not found", home: "Home", courses: "Courses" },
  { code: "es", native: "Español", missing: "Página no encontrada", home: "Inicio", courses: "Cursos" },
  { code: "fr", native: "Français", missing: "Page introuvable", home: "Accueil", courses: "Cours" },
  { code: "de", native: "Deutsch", missing: "Seite nicht gefunden", home: "Startseite", courses: "Kurse" },
  { code: "zh-Hans", native: "简体中文", missing: "找不到页面", home: "首页", courses: "课程" },
  { code: "zh-Hant", native: "繁體中文", missing: "找不到頁面", home: "首頁", courses: "課程" },
  { code: "ja", native: "日本語", missing: "ページが見つかりません", home: "ホーム", courses: "コース" },
  { code: "ko", native: "한국어", missing: "페이지를 찾을 수 없습니다", home: "홈", courses: "강좌" },
  { code: "ar", native: "العربية", missing: "الصفحة غير موجودة", home: "الرئيسية", courses: "الدورات" },
] as const;

export default function GlobalNotFound() {
  return (
    <html lang="und">
      <body>
        <main className="recovery404">
          <p className="eyebrow">aicourse.top · 404</p>
          <h1>404</h1>

          <section aria-labelledby="recovery-languages">
            <h2 id="recovery-languages" className="recovery404-langs">
              <span lang="en">Language</span>
              <span lang="es">Idioma</span>
              <span lang="fr">Langue</span>
              <span lang="de">Sprache</span>
              <span lang="zh-Hans">语言</span>
              <span lang="zh-Hant">語言</span>
              <span lang="ja">言語</span>
              <span lang="ko">언어</span>
              <span lang="ar" dir="rtl">اللغة</span>
            </h2>
            <ul className="recovery404-grid">
              {LANGUAGES.map((language) => (
                <li key={language.code} lang={language.code} dir={language.code === "ar" ? "rtl" : "ltr"}>
                  <span className="recovery404-copy">
                    <strong>{language.native}</strong>
                    <span className="recovery404-missing">{language.missing}</span>
                  </span>
                  <span className="recovery404-links">
                    <a href={`/${language.code}/`}>{language.home}</a>
                    <a href={`/${language.code}/courses/`}>{language.courses}</a>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </body>
    </html>
  );
}
