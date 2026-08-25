"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "../I18nProvider";
import type { ProgressStoreSummary } from "../progress-adapters";

const startSummary = (locale: string): ProgressStoreSummary => ({
  state: "not-started",
  percent: 0,
  nextHref: `/${locale}/handbook/#start`,
});

/** The single public Start / Resume / Review action for Agentic Engineering. */
export default function CourseJourney({ locale }: { locale: string }) {
  const { t } = useI18n();
  const [summary, setSummary] = useState<ProgressStoreSummary>(() => startSummary(locale));

  useEffect(() => {
    let cancelled = false;
    let removeListeners = () => {};
    void import("../progress-adapters").then(({ createPublishedProgressAdapters }) => {
      if (cancelled) return;
      const adapter = createPublishedProgressAdapters(locale)
        .find((candidate) => candidate.courseId === "agentic");
      if (!adapter) return;
      const refresh = () => {
        const current = adapter.readSummary();
        if (!cancelled) setSummary(current);
      };
      refresh();
      window.addEventListener(adapter.progressEvent, refresh);
      window.addEventListener("storage", refresh);
      window.addEventListener("focus", refresh);
      removeListeners = () => {
        window.removeEventListener(adapter.progressEvent, refresh);
        window.removeEventListener("storage", refresh);
        window.removeEventListener("focus", refresh);
      };
    });
    return () => {
      cancelled = true;
      removeListeners();
    };
  }, [locale]);

  const unavailable = summary.state === "unavailable" || !summary.nextHref;
  const href = unavailable ? `/${locale}/handbook/#start` : summary.nextHref;
  const label = summary.state === "completed"
    ? t("cat.review")
    : summary.state === "in-progress"
      ? t("cat.resume")
      : t("cat.start");

  return (
    <aside className="handbook-journey" aria-label={t("c.agentic.title")}>
      <div>
        <strong>{t("c.agentic.title")}</strong>
        <span>{unavailable ? t("progress.storageUnavailable") : `${summary.percent}%`}</span>
      </div>
      <Link className="btn primary" href={href} data-course-journey-action>
        {label}<span className="arrow" aria-hidden="true">→</span>
      </Link>
    </aside>
  );
}
