"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "./I18nProvider";
import { TOP_LEVEL_COURSES } from "@/lib/courses";
import { PROG, SECTIONS } from "@/lib/progress";
import { resetEveryCourseProgress } from "./progress-reset";

type CourseProgress = {
  id: (typeof TOP_LEVEL_COURSES)[number]["id"];
  percent: number;
};

/**
 * A private, course-level return state. Progress is read from this browser and
 * never sent to the site, so the statically exported page remains account-free.
 */
export default function Progress({ locale }: { locale: string }) {
  const { t } = useI18n();
  const [courses, setCourses] = useState<CourseProgress[] | null>(null);

  const read = useCallback((): CourseProgress[] => {
    let sectionsSeen = 0;

    try {
      sectionsSeen = (localStorage.getItem(SECTIONS) || "")
        .split(",")
        .filter(Boolean).length;
    } catch {
      // Storage can be unavailable in private browsing. Learning still works.
    }

    const records = new Map<string, Record<string, unknown>>();
    const progressFor = (storageKey: string): Record<string, unknown> => {
      const cached = records.get(storageKey);
      if (cached) return cached;
      let record: Record<string, unknown> = {};
      try {
        const stored: unknown = JSON.parse(localStorage.getItem(storageKey) || "{}");
        if (stored && typeof stored === "object" && !Array.isArray(stored)) {
          record = stored as Record<string, unknown>;
        }
      } catch {
        // Treat malformed or unavailable browser data as zero progress.
      }
      records.set(storageKey, record);
      return record;
    };

    return TOP_LEVEL_COURSES.map((course) => ({
      id: course.id,
      percent: course.progress(
        progressFor(course.progressStorageKey ?? PROG),
        sectionsSeen,
      ),
    }));
  }, []);

  useEffect(() => {
    const refresh = () => setCourses(read());
    refresh();
    const progressEvents = new Set(
      TOP_LEVEL_COURSES
        .map((course) => course.progressEvent)
        .filter((event): event is string => Boolean(event)),
    );
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    for (const event of progressEvents) window.addEventListener(event, refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      for (const event of progressEvents) window.removeEventListener(event, refresh);
    };
  }, [read, locale]);

  const active = courses?.filter((course) => course.percent > 0) ?? [];

  if (!courses) {
    return <div className="progwrap progress-empty" aria-hidden="true" />;
  }

  if (!active.length) {
    return (
      <div className="progwrap progress-empty">
        <div>
          <strong>{t("home.progNoneTitle")}</strong>
          <p>{t("home.progNone")}</p>
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
        {active.map((course) => {
          const definition = TOP_LEVEL_COURSES.find((item) => item.id === course.id)!;
          const title = t(`c.${course.id}.title`);
          const href = course.id === "agentic"
            ? `/${locale}/handbook/`
            : `/${locale}${definition.href}`;
          const label = course.percent >= 100 ? t("cat.review") : t("cat.resume");

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
              <Link className="text-link" href={href}>
                {label}<span aria-hidden="true">→</span>
              </Link>
            </article>
          );
        })}
      </div>
      <button
        className="iconbtn progress-reset"
        type="button"
        onClick={async () => {
          await resetEveryCourseProgress();
          setCourses(read());
        }}
      >
        {t("home.progReset")}
      </button>
    </div>
  );
}
