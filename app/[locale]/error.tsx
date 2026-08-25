"use client";

import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";

export default function LocaleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale, t } = useI18n();

  return (
    <section
      className="recovery-surface"
      aria-labelledby="locale-error-title"
      role="alert"
      data-testid="locale-error"
    >
      <div className="recovery-panel">
        <p className="eyebrow" aria-hidden="true">{t("brand.name")}</p>
        <h1 id="locale-error-title">{t("error.unexpected.title")}</h1>
        <p className="recovery-detail">{t("error.unexpected.body")}</p>
        <div className="recovery-actions">
          <button className="btn primary" type="button" onClick={reset}>
            {t("error.retry")}
          </button>
          <Link className="btn" href={`/${locale}/`}>
            {t("error.home")}
          </Link>
        </div>
      </div>
    </section>
  );
}
