import "server-only";

import Link from "next/link";
import { formatDeterministicInteger } from "@/lib/deterministic-format";
import { getMessages, metaFor, translator } from "@/lib/i18n";
import {
  CATALOG_COURSE_RELEASES,
  PUBLISHED_CATALOG_COURSES,
} from "@/lib/public-courses";
import {
  publicContentLocaleForCourse,
  type PublicCourseId,
} from "@/lib/public-release-surface";
import CourseShellProgress, {
  type CourseShellProgressLabels,
} from "./CourseShellProgress";

function prerequisiteKey(level: string): string {
  if (level === "intermediate-to-advanced" || level === "intermediate") {
    return "courseShell.prerequisiteIntermediate";
  }
  if (level === "advanced") return "courseShell.prerequisiteAdvanced";
  return "courseShell.prerequisiteBeginner";
}

function artifactKey(format: string): string {
  if (format === "project-based") return "courseShell.artifactProject";
  if (format === "guided") return "courseShell.artifactGuided";
  return "courseShell.artifactMixed";
}

export default async function CourseShell({
  courseId,
  locale,
  showBreadcrumb = true,
  showHeading = true,
  standalone = false,
  compact = false,
  progressStartLabel,
  progressResumeLabel,
  progressReviewLabel,
  allowBlockedPreview = false,
}: {
  readonly courseId: PublicCourseId;
  readonly locale: string;
  readonly showBreadcrumb?: boolean;
  readonly showHeading?: boolean;
  readonly standalone?: boolean;
  /** Keeps the platform facts and journey CTA while a bespoke dashboard supplies the H1. */
  readonly compact?: boolean;
  /** Allows a course's reviewed journey copy to remain authoritative in the shared shell. */
  readonly progressStartLabel?: string;
  readonly progressResumeLabel?: string;
  readonly progressReviewLabel?: string;
  /** Private `_blocked` implementations may render this without becoming public routes. */
  readonly allowBlockedPreview?: boolean;
}) {
  const release = (allowBlockedPreview
    ? CATALOG_COURSE_RELEASES
    : PUBLISHED_CATALOG_COURSES
  ).find(({ course }) => course.id === courseId);
  if (!release) throw new Error(`CourseShell requires a published course: ${courseId}`);

  const { course, surface } = release;
  const contentLocale = publicContentLocaleForCourse(courseId, locale)
    ?? surface.fallbackLocale;
  if (!contentLocale) {
    throw new Error(`Published CourseShell requires a content locale: ${courseId}`);
  }

  const messages = await getMessages(locale);
  const t = translator(messages);
  const languageName = metaFor(contentLocale).native;
  const requestedContentIsReviewed = surface.reviewedContentLocales.includes(locale as never);
  const usesFallback = contentLocale !== locale || !requestedContentIsReviewed;
  const formattedMinutes = course.minutes === null
    ? "—"
    : formatDeterministicInteger(course.minutes, locale);
  const progressLabels: CourseShellProgressLabels = {
    progress: t("courseShell.progress"),
    pending: t("courseShell.progressPending"),
    unavailable: t("courseShell.progressUnavailable"),
    notStarted: t("courseShell.progressNotStarted"),
    inProgress: t("courseShell.progressInProgress"),
    completed: t("courseShell.progressCompleted"),
    start: progressStartLabel ?? t("courseShell.start"),
    resume: progressResumeLabel ?? t("courseShell.resume"),
    review: progressReviewLabel ?? t("courseShell.review"),
  };
  const shellId = `course-shell-${courseId}`;

  return (
    <section
      className={`${standalone ? "shellwrap " : ""}shared-course-shell`}
      lang={locale}
      dir={metaFor(locale).dir}
      aria-label={`${t("courseShell.overview")}: ${t(course.titleKey)}`}
      data-course-shell={courseId}
      data-course-publication-state={surface.state}
      data-course-level={course.level}
      data-course-minutes={course.minutes ?? undefined}
      data-course-content-language={contentLocale}
      data-course-fallback={usesFallback ? "true" : "false"}
      data-course-progress-storage="browser-local"
      data-course-shell-compact={compact ? "true" : "false"}
    >
      {showBreadcrumb ? (
        <nav className="shared-course-breadcrumb" aria-label={t("nav.courses")}>
          <Link href={`/${locale}/courses/`}>{t("nav.courses")}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" data-audit-truncation="breadcrumb-current">{t(course.titleKey)}</span>
        </nav>
      ) : null}

      {showHeading && !compact ? (
        <div className="course-shell-heading">
          <span className="eyebrow">{t("courseShell.overview")}</span>
          <p className="course-shell-title">{t(course.titleKey)}</p>
        </div>
      ) : null}

      <dl className="shared-course-facts" aria-label={t(course.titleKey)}>
        <div data-course-shell-field="status">
          <dt>{t("courseShell.status")}</dt>
          <dd>{surface.state === "published" ? t("courseShell.available") : t("cat.soonBadge")}</dd>
        </div>
        <div data-course-shell-field="difficulty">
          <dt>{t("courseShell.difficulty")}</dt>
          <dd>{t(course.levelKey)}</dd>
        </div>
        <div data-course-shell-field="duration">
          <dt>{t("courseShell.duration")}</dt>
          <dd>{course.minutes === null ? "—" : `${formattedMinutes} ${t("cat.minutes")}`}</dd>
        </div>
        <div data-course-shell-field="content-language">
          <dt>{t("courseShell.contentLanguage")}</dt>
          <dd lang={contentLocale}>{languageName}</dd>
        </div>
      </dl>

      {usesFallback ? (
        <p className="course-shell-fallback" role="note" lang={locale}>
          {t("courseShell.fallbackNotice")} <strong lang={contentLocale}>{languageName}</strong>
        </p>
      ) : null}

      {surface.state === "published" ? (
        <CourseShellProgress
          courseId={courseId}
          locale={locale}
          labels={progressLabels}
          designateJourneyAction={compact}
        />
      ) : null}

      <details className="course-shell-syllabus">
        <summary>
          <span>{t("courseShell.syllabus")}</span>
          <small>{t("courseShell.syllabusSummary")}</small>
        </summary>
        <div className="course-shell-syllabus-grid">
          <section aria-labelledby={`${shellId}-prerequisites`}>
            <strong id={`${shellId}-prerequisites`}>{t("courseShell.prerequisites")}</strong>
            <p>{t(prerequisiteKey(course.level))}</p>
          </section>
          <section aria-labelledby={`${shellId}-outcome`}>
            <strong id={`${shellId}-outcome`}>{t("courseShell.outcome")}</strong>
            <p>{t(course.blurbKey)}</p>
          </section>
          <section aria-labelledby={`${shellId}-artifact`}>
            <strong id={`${shellId}-artifact`}>{t("courseShell.artifact")}</strong>
            <p>{t(artifactKey(course.format))}</p>
          </section>
        </div>
      </details>

      <p className="shared-course-storage-note" data-course-shell-field="local-progress">
        {t("courseShell.localNote")}
      </p>
    </section>
  );
}
