"use client";

import ErrorSurface from "@/components/ErrorSurface";
import { useI18n } from "@/components/I18nProvider";

export default function LocaleError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { locale, t } = useI18n();
  const homeHref = `/${locale}/`;

  return (
    <ErrorSurface
      eyebrow={t("error.unexpectedEyebrow")}
      title={t("error.unexpectedTitle")}
      body={t("error.unexpectedBody")}
      retryLabel={t("ui.retry")}
      onRetry={retry}
      homeLabel={t("nav.home")}
      homeHref={homeHref}
      coursesLabel={t("nav.courses")}
      coursesHref={`${homeHref}courses/`}
      referenceLabel={t("error.reference")}
      reference={error.digest}
      alert
      focusKey={error.digest ?? locale}
    />
  );
}
