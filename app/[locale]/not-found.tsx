"use client";

import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

export default function LocaleNotFound() {
  const { locale, t } = useI18n();

  return (
    <section
      className="recovery-surface"
      aria-labelledby="locale-not-found-title"
      data-testid="locale-not-found"
    >
      <div className="recovery-panel">
        <p className="eyebrow" aria-hidden="true">404</p>
        <h1 id="locale-not-found-title">{t("error.notFound.title")}</h1>
        <p className="recovery-detail">{t("error.notFound.body")}</p>
        <div className="recovery-actions">
          <Link className="btn primary" href={`/${locale}/`}>
            {t("error.home")}
          </Link>
          <Link className="btn" href={`/${locale}/courses/`}>
            {t("error.courses")}
          </Link>
        </div>
      </div>
    </section>
  );
}
