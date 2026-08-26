"use client";

import Link from "next/link";
import {
  PUBLISHED_CATALOG_COURSES,
} from "@/lib/public-courses";
import {
  publicContentLocaleForCourse,
  type PublicCourseId,
} from "@/lib/public-release-surface";
import { metaFor } from "@/lib/i18n";
import { formatDeterministicInteger } from "@/lib/deterministic-format";
import { useI18n } from "./I18nProvider";

export default function SharedCourseShell({
  courseId,
  locale,
  showBreadcrumb = true,
  standalone = false,
}: {
  courseId: PublicCourseId;
  locale: string;
  showBreadcrumb?: boolean;
  standalone?: boolean;
}) {
  const { t } = useI18n();
  const release = PUBLISHED_CATALOG_COURSES.find(({ course }) => course.id === courseId);
  if (!release) throw new Error(`Shared course shell requires a published course: ${courseId}`);

  const { course, surface } = release;
  const contentLocale = publicContentLocaleForCourse(courseId, locale) ?? surface.primaryLocale;
  if (!contentLocale) {
    throw new Error(`Published course shell requires a content locale: ${courseId}`);
  }
  // Intl.DisplayNames is not byte-stable across the server's ICU data and
  // every browser engine (notably "español" versus "Español" in WebKit).
  // The nine-locale product registry is the deterministic label authority.
  const languageName = metaFor(contentLocale).native;
  const formattedMinutes = course.minutes === null
    ? "—"
    : formatDeterministicInteger(course.minutes, contentLocale);

  return (
    <aside
      className={`${standalone ? "shellwrap " : ""}shared-course-shell`}
      data-course-shell={courseId}
      data-course-publication-state={surface.state}
      data-course-level={course.level}
      data-course-minutes={course.minutes ?? undefined}
      data-course-content-language={contentLocale ?? undefined}
      data-course-progress-storage="browser-local"
    >
      {showBreadcrumb ? (
        <nav className="shared-course-breadcrumb" aria-label={t("nav.courses")}>
          <Link href={`/${locale}/courses/`}>{t("nav.courses")}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{t(course.titleKey)}</span>
        </nav>
      ) : null}
      <div className="shared-course-facts" aria-label={t(course.titleKey)}>
        <span data-course-shell-field="status">{t("status.available")}</span>
        <span data-course-shell-field="difficulty">{t(course.levelKey)}</span>
        <span data-course-shell-field="duration">
          {course.minutes === null ? "—" : `${formattedMinutes} ${t("cat.minutes")}`}
        </span>
        <span data-course-shell-field="content-language" lang={contentLocale ?? undefined}>
          {languageName}
        </span>
      </div>
      <p className="shared-course-storage-note" data-course-shell-field="local-progress">
        {t("learning.localNote")}
      </p>
    </aside>
  );
}
