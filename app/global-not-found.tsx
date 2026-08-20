import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 · aicourse.top",
  description: "Choose a language and return to the free Agentic Engineering course.",
};

const LANGUAGES = [
  { code: "en", native: "English", home: "Home", courses: "Courses" },
  { code: "es", native: "Español", home: "Inicio", courses: "Cursos" },
  { code: "fr", native: "Français", home: "Accueil", courses: "Cours" },
  { code: "de", native: "Deutsch", home: "Startseite", courses: "Kurse" },
  { code: "zh-Hans", native: "简体中文", home: "首页", courses: "课程" },
  { code: "zh-Hant", native: "繁體中文", home: "首頁", courses: "課程" },
  { code: "ja", native: "日本語", home: "ホーム", courses: "コース" },
  { code: "ko", native: "한국어", home: "홈", courses: "강좌" },
  { code: "ar", native: "العربية", home: "الرئيسية", courses: "الدورات" },
] as const;

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main className="recovery404">
          <p className="eyebrow">aicourse.top · 404</p>
          <h1>Page not found</h1>
          <p className="recovery404-lede">
            The address may have changed. Choose your language, then return to the course or curriculum.
          </p>
          <p className="recovery404-langs" aria-label="Page not found in other languages">
            <span lang="es">Página no encontrada</span>
            <span lang="fr">Page introuvable</span>
            <span lang="de">Seite nicht gefunden</span>
            <span lang="zh-Hans">找不到页面</span>
            <span lang="zh-Hant">找不到頁面</span>
            <span lang="ja">ページが見つかりません</span>
            <span lang="ko">페이지를 찾을 수 없습니다</span>
            <span lang="ar" dir="rtl">الصفحة غير موجودة</span>
          </p>

          <section aria-labelledby="recovery-languages">
            <h2 id="recovery-languages">Choose a language</h2>
            <ul className="recovery404-grid">
              {LANGUAGES.map((language) => (
                <li key={language.code} lang={language.code} dir={language.code === "ar" ? "rtl" : "ltr"}>
                  <strong>{language.native}</strong>
                  <span>
                    <a href={`/${language.code}/`}>{language.home}</a>
                    <a href={`/${language.code}/courses/`}>{language.courses}</a>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <nav className="acts" aria-label="English course shortcuts">
            <Link className="btn primary" href="/en/">Home</Link>
            <Link className="btn" href="/en/handbook/">Handbook</Link>
            <Link className="btn" href="/en/lab/">Lab</Link>
            <Link className="btn" href="/en/build/">TypeScript course</Link>
          </nav>
        </main>
      </body>
    </html>
  );
}
