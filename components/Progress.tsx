"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "./I18nProvider";
import {
  PUBLISHED_CATALOG_COURSES,
} from "@/lib/public-courses";
import { withPublicCourseReturnLocale } from "@/lib/public-release-surface";
import type {
  PublishedProgressCourseId,
  ProgressSummaryState,
} from "@/lib/public-progress-contract";

type CourseProgress = {
  id: PublishedProgressCourseId;
  state: ProgressSummaryState;
  percent: number;
  nextHref: string | null;
};

type ProgressView = {
  courses: CourseProgress[];
  persistent: boolean;
};

export interface ProgressFeedbackCopy {
  readonly resetConfirm?: string;
  readonly storageUnavailable?: string;
  readonly resetComplete?: string;
  readonly resetSessionOnly?: string;
}

export interface ProgressProps {
  readonly locale: string;
  /**
   * Optional until the root locale bundles expose the four progress feedback
   * messages. English fallbacks keep storage failure and reset outcomes honest.
   */
  readonly feedbackCopy?: ProgressFeedbackCopy;
}

const FALLBACK_FEEDBACK = {
  storageUnavailable:
    "Browser storage is unavailable. Learning still works, but progress will last only for this session.",
} as const;

const titleKeyById = new Map(
  PUBLISHED_CATALOG_COURSES.map(({ course }) => [course.id, course.titleKey] as const),
);

/**
 * A private, course-level return state. Progress is read from this browser and
 * never sent to the site, so the statically exported page remains account-free.
 */
export default function Progress({ locale, feedbackCopy }: ProgressProps) {
  const { t } = useI18n();
  const [view, setView] = useState<ProgressView | null>(null);

  useEffect(() => {
    let cancelled = false;
    let removeListeners = () => {};
    void import("./progress-adapters").then(({ createPublishedProgressAdapters }) => {
      if (cancelled) return;
      const adapters = createPublishedProgressAdapters(locale);
      const refresh = () => {
        const courses = adapters.map((adapter) => ({
          id: adapter.courseId,
          ...adapter.readSummary(),
        }));
        if (!cancelled) {
          setView({
            courses,
            persistent: courses.every((course) => course.state !== "unavailable"),
          });
        }
      };
      refresh();
      const progressEvents = new Set(adapters.map((adapter) => adapter.progressEvent));
      window.addEventListener("focus", refresh);
      window.addEventListener("storage", refresh);
      for (const event of progressEvents) window.addEventListener(event, refresh);
      removeListeners = () => {
        window.removeEventListener("focus", refresh);
        window.removeEventListener("storage", refresh);
        for (const event of progressEvents) window.removeEventListener(event, refresh);
      };
    });
    return () => {
      cancelled = true;
      removeListeners();
    };
  }, [locale]);

  const active = view?.courses.filter(
    (course) => course.state === "in-progress" || course.state === "completed",
  ) ?? [];
  const statusMessage = view && !view.persistent
    ? feedbackCopy?.storageUnavailable ?? FALLBACK_FEEDBACK.storageUnavailable
    : null;

  if (!view) {
    return <div className="progwrap progress-empty" aria-hidden="true" />;
  }

  if (!active.length) {
    return (
      <div className="progwrap progress-empty">
        <div>
          <strong>{t("home.progNoneTitle")}</strong>
          <p>{t("home.progNone")}</p>
          {statusMessage ? <p role="status" aria-live="polite">{statusMessage}</p> : null}
        </div>
        <Link className="btn primary" href={`/${locale}/courses/`}>
          {t("home.progBrowse")}<span className="arrow" aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="progwrap">
      <div className="progress-course-list">
        {active.slice(0, 2).map((course) => {
          const title = t(titleKeyById.get(course.id) ?? `c.${course.id}.title`);
          const label = course.state === "completed" ? t("cat.review") : t("cat.resume");

          return (
            <article className="progress-course" key={course.id}>
              <div className="progress-course-heading">
                <strong>{title}</strong>
                <span>{course.percent}%</span>
              </div>
              <div
                className="progbar"
                role="progressbar"
                aria-label={`${title}: ${t("cat.progress")}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={course.percent}
              >
                <span style={{ width: `${course.percent}%` }} />
              </div>
              {course.nextHref ? (
                <Link
                  className="text-link"
                  href={withPublicCourseReturnLocale(course.nextHref, locale)}
                >
                  {label}<span aria-hidden="true">→</span>
                </Link>
              ) : null}
            </article>
          );
        })}
      </div>
      {statusMessage ? <p role="status" aria-live="polite">{statusMessage}</p> : null}
      <Link className="btn progress-manage" href={`/${locale}/learning/`}>
        {t("nav.learning")}<span className="arrow" aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
