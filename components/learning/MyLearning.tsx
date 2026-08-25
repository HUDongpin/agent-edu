"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PUBLISHED_CATALOG_COURSES } from "@/lib/public-courses";
import { withPublicCourseReturnLocale } from "@/lib/public-release-surface";
import { useI18n } from "../I18nProvider";
import {
  createPublishedProgressAdapters,
  type ProgressStoreAdapter,
  type ProgressSummaryState,
  type PublishedProgressCourseId,
} from "../progress-adapters";
import {
  PROGRESS_RECENCY_EVENT,
  readProgressRecency,
  sortCourseIdsByRecentActivity,
  type ProgressActivity,
} from "../progress-recency";
import { resetEveryCourseProgress } from "../progress-reset";

type LearningState = ProgressSummaryState;

type LearningCourse = {
  readonly id: PublishedProgressCourseId;
  readonly titleKey: string;
  readonly state: LearningState;
  readonly percent: number | null;
  readonly nextHref: string | null;
};

const titleKeyById = new Map(
  PUBLISHED_CATALOG_COURSES.map(({ course }) => [course.id, course.titleKey] as const),
);

function readCourse(adapter: ProgressStoreAdapter, locale: string): LearningCourse {
  const titleKey = titleKeyById.get(adapter.courseId) ?? `c.${adapter.courseId}.title`;
  try {
    const progress = adapter.readSummary();
    if (progress.state === "unavailable" || !progress.nextHref) {
      return {
        id: adapter.courseId,
        titleKey,
        state: "unavailable",
        percent: null,
        nextHref: null,
      };
    }
    return {
      id: adapter.courseId,
      titleKey,
      ...progress,
      nextHref: withPublicCourseReturnLocale(progress.nextHref, locale),
    };
  } catch {
    return {
      id: adapter.courseId,
      titleKey,
      state: "unavailable",
      percent: null,
      nextHref: null,
    };
  }
}

function LearningCard({ course }: { course: LearningCourse }) {
  const { t } = useI18n();
  const completed = course.state === "completed";
  const label = completed ? t("learning.review") : t("learning.resume");

  return (
    <article className="learning-course-card">
      <div className="learning-course-heading">
        <h3>{t(course.titleKey)}</h3>
        <span>{course.percent}%</span>
      </div>
      <div
        className="progbar"
        role="progressbar"
        aria-label={`${t(course.titleKey)}: ${t("cat.progress")}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={course.percent ?? undefined}
      >
        <span style={{ width: `${course.percent ?? 0}%` }} />
      </div>
      {course.nextHref ? (
        <Link className="btn primary learning-course-action" href={course.nextHref}>
          {label}<span className="arrow" aria-hidden="true">→</span>
        </Link>
      ) : null}
    </article>
  );
}

export default function MyLearning({ locale }: { locale: string }) {
  const { t } = useI18n();
  const adapters = useMemo(() => createPublishedProgressAdapters(locale), [locale]);
  const [courses, setCourses] = useState<readonly LearningCourse[] | null>(null);
  const [activity, setActivity] = useState<ProgressActivity>({});
  const [recencyPersistent, setRecencyPersistent] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const read = useCallback(() => {
    const recency = readProgressRecency();
    setActivity(recency.activity);
    setRecencyPersistent(recency.persistence === "persistent");
    setCourses(adapters.map((adapter) => readCourse(adapter, locale)));
  }, [adapters, locale]);

  useEffect(() => {
    const initialRead = window.requestAnimationFrame(read);
    const listeners = adapters.map((adapter) => {
      const listener = () => read();
      window.addEventListener(adapter.progressEvent, listener);
      return { event: adapter.progressEvent, listener };
    });
    window.addEventListener(PROGRESS_RECENCY_EVENT, read);
    window.addEventListener("storage", read);
    window.addEventListener("focus", read);
    return () => {
      window.cancelAnimationFrame(initialRead);
      for (const { event, listener } of listeners) window.removeEventListener(event, listener);
      window.removeEventListener(PROGRESS_RECENCY_EVENT, read);
      window.removeEventListener("storage", read);
      window.removeEventListener("focus", read);
    };
  }, [adapters, read]);

  const sorted = useMemo(() => {
    if (!courses) return [];
    const orderedIds = sortCourseIdsByRecentActivity(
      courses.map((course) => course.id),
      activity,
    );
    const rank = new Map(orderedIds.map((courseId, index) => [courseId, index]));
    return [...courses].sort((left, right) =>
      (rank.get(left.id) ?? Number.MAX_SAFE_INTEGER)
      - (rank.get(right.id) ?? Number.MAX_SAFE_INTEGER));
  }, [activity, courses]);

  const inProgress = sorted.filter((course) => course.state === "in-progress");
  const completed = sorted.filter((course) => course.state === "completed");
  const unavailable = sorted.filter((course) => course.state === "unavailable");
  const fresh = courses !== null && inProgress.length === 0 && completed.length === 0;

  return (
    <div className="learning-dashboard" aria-busy={courses === null}>
      {unavailable.length || !recencyPersistent ? (
        <p className="langnote learning-storage-warning" role="status" aria-live="polite">
          {t("learning.storageUnavailable")}
        </p>
      ) : null}

      {courses === null ? (
        <div className="learning-loading" aria-hidden="true" />
      ) : fresh ? (
        <section className="learning-fresh" aria-labelledby="learning-fresh-title">
          <div>
            <h2 id="learning-fresh-title">{t("learning.freshTitle")}</h2>
            <p>{t("learning.freshBody")}</p>
          </div>
          <Link className="btn primary" href={`/${locale}/courses/`}>
            {t("learning.browse")}<span className="arrow" aria-hidden="true">→</span>
          </Link>
        </section>
      ) : (
        <div className="learning-groups">
          {inProgress.length ? (
            <section aria-labelledby="learning-in-progress-title">
              <h2 id="learning-in-progress-title">{t("learning.inProgress")}</h2>
              <div className="learning-course-grid">
                {inProgress.map((course) => <LearningCard key={course.id} course={course} />)}
              </div>
            </section>
          ) : null}
          {completed.length ? (
            <section aria-labelledby="learning-completed-title">
              <h2 id="learning-completed-title">{t("learning.completed")}</h2>
              <div className="learning-course-grid">
                {completed.map((course) => <LearningCard key={course.id} course={course} />)}
              </div>
            </section>
          ) : null}
        </div>
      )}

      <aside className="learning-local-note">
        <p>{t("learning.localNote")}</p>
        <Link href={`/${locale}/privacy/`}>{t("privacy.title")}</Link>
      </aside>

      <section className="learning-reset-panel" aria-labelledby="learning-reset-title">
        <div>
          <h2 id="learning-reset-title">{t("learning.resetTitle")}</h2>
          <p>{t("learning.resetBody")}</p>
        </div>
        <button
          className="btn"
          type="button"
          onClick={async () => {
            if (!window.confirm(t("progress.resetConfirm"))) return;
            const result = await resetEveryCourseProgress();
            read();
            setFeedback(result.persistent
              ? result.quarantinedStores.length
                ? t("progress.resetQuarantined")
                : t("progress.resetComplete")
              : t("progress.resetSessionOnly"));
          }}
        >
          {t("learning.reset")}
        </button>
        {feedback ? <p className="learning-reset-feedback" role="status" aria-live="polite">{feedback}</p> : null}
      </section>
    </div>
  );
}
