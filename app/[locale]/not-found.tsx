"use client";

import ErrorSurface from "@/components/ErrorSurface";
import { useI18n } from "@/components/I18nProvider";

export default function NotFound() {
  const { locale, t } = useI18n();
  const homeHref = `/${locale}/`;

  return (
    <ErrorSurface
      eyebrow={t("error.notFoundEyebrow")}
      title={t("error.notFoundTitle")}
      body={t("error.notFoundBody")}
      homeLabel={t("nav.home")}
      homeHref={homeHref}
      coursesLabel={t("nav.courses")}
      coursesHref={`${homeHref}courses/`}
      focusKey={locale}
    />
  );
}
