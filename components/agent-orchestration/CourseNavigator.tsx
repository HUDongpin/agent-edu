import Link from "next/link";
import styles from "./CourseNavigation.module.css";

export type AgentOrchestrationCourseDestination =
  | "overview"
  | "curriculum"
  | "assessment"
  | "capstone"
  | "sources";

const NAVIGATION_COPY = {
  en: {
    label: "Course sections",
    current: "Current",
    overview: "Overview",
    curriculum: "Curriculum",
    assessment: "Assessment",
    capstone: "Capstone",
    sources: "Sources",
  },
  "zh-Hans": {
    label: "课程分区",
    current: "当前",
    overview: "概览",
    curriculum: "课程模块",
    assessment: "结课测评",
    capstone: "综合项目",
    sources: "来源",
  },
} as const;

export default function CourseNavigator({
  contentLocale,
  current,
  locale,
}: {
  contentLocale: string;
  current: AgentOrchestrationCourseDestination;
  locale: string;
}) {
  const copy = contentLocale === "zh-Hans"
    ? NAVIGATION_COPY["zh-Hans"]
    : NAVIGATION_COPY.en;
  const courseHref = `/${locale}/agent-orchestration/`;
  const destinations: readonly {
    href: string;
    id: AgentOrchestrationCourseDestination;
    label: string;
  }[] = [
    { id: "overview", label: copy.overview, href: courseHref },
    {
      id: "curriculum",
      label: copy.curriculum,
      href: `${courseHref}#agent-orchestration-curriculum`,
    },
    { id: "assessment", label: copy.assessment, href: `${courseHref}assessment/` },
    { id: "capstone", label: copy.capstone, href: `${courseHref}capstone/` },
    {
      id: "sources",
      label: copy.sources,
      href: `${courseHref}#agent-orchestration-sources`,
    },
  ];

  return (
    <nav
      className={styles.courseNavigator}
      aria-label={copy.label}
      data-testid="agent-orchestration-course-navigator"
    >
      <ol>
        {destinations.map((destination, index) => {
          const isCurrent = destination.id === current;
          return (
            <li className={styles.courseNavItem} key={destination.id}>
              <Link
                className={styles.courseNavLink}
                href={destination.href}
                aria-current={isCurrent ? "page" : undefined}
                prefetch={false}
              >
                <span className={styles.courseNavOrder} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{destination.label}</span>
                {isCurrent ? (
                  <span
                    className={styles.courseNavState}
                    data-nav-state
                    aria-hidden="true"
                  >
                    {copy.current}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
