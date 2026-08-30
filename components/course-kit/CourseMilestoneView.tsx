import Link from "next/link";
import type { ReactNode } from "react";
import type { CourseKitMaterialisedCourse } from "@/lib/course-kit/types";
import { CourseLanguageNotice } from "./CourseLanguageNotice";
import { CourseProgress } from "./CourseProgress";
import styles from "./CourseKit.module.css";

export type CourseMilestoneSection = "assessment" | "capstone" | "sources";

export function CourseMilestoneView({
  course,
  current,
  title,
  summary,
  children,
  previousHref,
  previousTitle,
  nextHref,
  nextTitle,
  coursePath = course.id,
}: {
  readonly course: CourseKitMaterialisedCourse;
  readonly current: CourseMilestoneSection;
  readonly title: string;
  readonly summary: string;
  readonly children: ReactNode;
  readonly previousHref: string;
  readonly previousTitle: string;
  readonly nextHref?: string;
  readonly nextTitle?: string;
  readonly coursePath?: string;
}) {
  const courseHref = `/${course.locale.requestedLocale}/${coursePath}/`;
  const sectionLinks = [
    { key: "assessment", href: `${courseHref}assessment/`, label: course.copy.ui.finalAssessment },
    { key: "capstone", href: `${courseHref}capstone/`, label: course.copy.ui.capstone },
    { key: "sources", href: `${courseHref}sources/`, label: course.copy.ui.evidenceRegister },
  ] as const;

  return (
    <div
      className={`shellwrap ${styles.root} ${styles.milestonePage}`}
      lang={course.locale.contentLocale}
      dir={course.locale.contentDirection}
      data-course-kit={course.id}
      data-course-section={current}
    >
      <CourseLanguageNotice course={course} />

      <nav
        className={styles.breadcrumb}
        aria-label={`${course.copy.ui.course}: ${course.copy.ui.backToCourse}`}
      >
        <Link href={courseHref}>
          <span aria-hidden="true">←</span>
          {course.copy.ui.backToCourse}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{title}</span>
      </nav>

      <nav className={styles.journeyNav} aria-label={course.copy.ui.courseMap}>
        <Link href={`${courseHref}#curriculum`}>{course.copy.ui.modules}</Link>
        {sectionLinks.map((link) => (
          <Link
            href={link.href}
            key={link.key}
            aria-current={link.key === current ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <header className={styles.milestoneHero}>
        <p className={styles.eyebrow}>
          {course.copy.ui.course} {course.displayNumber}
        </p>
        <h1>{title}</h1>
        <p>{summary}</p>
      </header>

      <CourseProgress
        config={course.progress}
        labels={course.copy.ui}
        compact
        idSuffix={current}
      />

      <div className={styles.milestoneContent}>{children}</div>

      <nav
        className={styles.modulePager}
        aria-label={`${course.copy.ui.previousStep} / ${course.copy.ui.nextStep}`}
      >
        <Link href={previousHref} rel="prev">
          <span>{course.copy.ui.previousStep}</span>
          <strong>{previousTitle}</strong>
        </Link>
        {nextHref && nextTitle ? (
          <Link href={nextHref} rel="next">
            <span>{course.copy.ui.nextStep}</span>
            <strong>{nextTitle}</strong>
          </Link>
        ) : (
          <Link href={courseHref}>
            <span>{course.copy.ui.backToCourse}</span>
            <strong>{course.copy.meta.title}</strong>
          </Link>
        )}
      </nav>
    </div>
  );
}

export default CourseMilestoneView;
