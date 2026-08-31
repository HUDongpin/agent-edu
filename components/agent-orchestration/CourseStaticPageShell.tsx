import Link from "next/link";
import type { ReactNode } from "react";
import type { MaterializedAgentOrchestrationCourse } from "@/lib/agent-orchestration";
import CourseShell from "../course-shell/CourseShell";
import CourseNavigator, {
  type AgentOrchestrationCourseDestination,
} from "./CourseNavigator";
import styles from "./AgentOrchestrationCourse.module.css";
import navigationStyles from "./CourseNavigation.module.css";

function uiLabel(
  labels: Readonly<Record<string, string>>,
  key: string,
  fallback: string,
): string {
  const value = labels[key];
  return value && value.trim() ? value : fallback;
}

export default function CourseStaticPageShell({
  catalogLabel,
  children,
  course,
  current,
  eyebrow,
  summary,
  testId,
  title,
}: {
  catalogLabel: string;
  children: ReactNode;
  course: MaterializedAgentOrchestrationCourse;
  current: Extract<AgentOrchestrationCourseDestination, "assessment" | "capstone">;
  eyebrow: string;
  summary?: string;
  testId: string;
  title: string;
}) {
  const courseHref = `/${course.locale}/agent-orchestration/`;
  const chinese = course.contentLocale === "zh-Hans";

  return (
    <div
      className={`shellwrap ${styles.root} ${navigationStyles.staticCoursePage}`}
      lang={course.contentLocale}
      dir={course.contentDirection}
      data-testid={testId}
    >
      {course.locale !== course.contentLocale ? (
        <p className={styles.languageNotice}>{course.copy.meta.translationNote}</p>
      ) : null}

      <nav
        className={styles.topBreadcrumb}
        aria-label={uiLabel(
          course.copy.ui,
          "breadcrumb",
          chinese ? "面包屑导航" : "Breadcrumb",
        )}
      >
        <Link href={courseHref}>
          <span aria-hidden="true">←</span>
          {uiLabel(course.copy.ui, "courseMap", chinese ? "课程地图" : "Course map")}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{eyebrow}</span>
      </nav>

      <CourseShell
        courseId="agent-orchestration"
        locale={course.locale}
        showBreadcrumb={false}
      />
      <CourseNavigator
        contentLocale={course.contentLocale}
        current={current}
        locale={course.locale}
      />

      <header className={navigationStyles.staticCourseHero}>
        <p className={styles.kicker}>{eyebrow}</p>
        <h1>{title}</h1>
        {summary ? (
          <p className={navigationStyles.staticCourseSummary}>{summary}</p>
        ) : null}
      </header>

      <div className={navigationStyles.staticCourseBody}>{children}</div>

      <p className={styles.backLink}>
        <Link href={`/${course.locale}/courses/`}>
          <span aria-hidden="true">←</span>
          {catalogLabel}
        </Link>
        <Link href={courseHref}>
          {uiLabel(course.copy.ui, "course", chinese ? "课程 15" : "Course 15")}
        </Link>
      </p>
    </div>
  );
}
