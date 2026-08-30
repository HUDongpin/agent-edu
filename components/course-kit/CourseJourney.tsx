"use client";

import Link from "next/link";
import {
  courseKitProgressSummary,
  isCourseKitCapstoneComplete,
  isCourseKitModuleComplete,
  isCourseKitQuizComplete,
} from "@/lib/course-kit/progress";
import type {
  CourseKitProgressClientConfig,
  CourseKitUiCopy,
} from "@/lib/course-kit/types";
import { useCourseKitProgress } from "./progress-store";
import styles from "./CourseKit.module.css";

interface JourneyModule {
  readonly slug: string;
  readonly order: number;
  readonly title: string;
}

interface JourneyPhase {
  readonly id: string;
  readonly title: string;
  readonly modules: readonly JourneyModule[];
}

export function CourseContinueLink({
  config,
  courseHref,
  modules,
  labels,
  startLabel,
  resumeLabel,
  assessmentHref,
  capstoneHref,
}: {
  readonly config: CourseKitProgressClientConfig;
  readonly courseHref: string;
  readonly modules: readonly JourneyModule[];
  readonly labels: CourseKitUiCopy;
  readonly startLabel: string;
  readonly resumeLabel: string;
  readonly assessmentHref: string;
  readonly capstoneHref: string;
}) {
  const { record } = useCourseKitProgress(config);
  const progress = courseKitProgressSummary(record, config);
  const nextModule = progress.next?.kind === "module"
    ? modules.find((module) => module.slug === progress.next?.id)
    : undefined;

  if (!progress.next) {
    return (
      <span className={`${styles.primaryButton} ${styles.continueComplete}`} role="status">
        <span>{labels.courseComplete}</span>
        <small>{progress.completed}/{progress.total}</small>
      </span>
    );
  }

  const href = progress.next.kind === "module"
    ? `${courseHref}${progress.next.id}/`
    : progress.next.kind === "quiz"
      ? assessmentHref
      : capstoneHref;
  const destination = progress.next.kind === "module"
    ? nextModule?.title ?? labels.modules
    : progress.next.kind === "quiz"
      ? labels.finalAssessment
      : labels.capstone;
  const label = progress.completed === 0 ? startLabel : resumeLabel;

  return (
    <Link
      className={`${styles.primaryButton} ${styles.continueButton}`}
      href={href}
      aria-label={`${label}: ${destination}`}
    >
      <span>{label}</span>
      <small>{destination}</small>
      <span aria-hidden="true">→</span>
    </Link>
  );
}

export function CourseModuleIndicator({
  config,
  moduleSlug,
  labels,
}: {
  readonly config: CourseKitProgressClientConfig;
  readonly moduleSlug: string;
  readonly labels: CourseKitUiCopy;
}) {
  const { record } = useCourseKitProgress(config);
  const progress = courseKitProgressSummary(record, config);
  const complete = isCourseKitModuleComplete(record, config, moduleSlug);
  const next = progress.next?.kind === "module" && progress.next.id === moduleSlug;

  if (!complete && !next) return null;
  return (
    <span
      className={styles.moduleStatus}
      data-complete={complete || undefined}
      data-next={next || undefined}
    >
      <span aria-hidden="true">{complete ? "✓" : "→"}</span>
      <span>
        {complete
          ? labels.moduleComplete
          : progress.completed === 0
            ? labels.startCourse
            : labels.resumeCourse}
      </span>
    </span>
  );
}

export function CourseModuleMap({
  phases,
  activeSlug,
  courseHref,
  config,
  labels,
  assessmentHref,
  capstoneHref,
}: {
  readonly phases: readonly JourneyPhase[];
  readonly activeSlug: string;
  readonly courseHref: string;
  readonly config: CourseKitProgressClientConfig;
  readonly labels: CourseKitUiCopy;
  readonly assessmentHref?: string;
  readonly capstoneHref?: string;
}) {
  const { record } = useCourseKitProgress(config);
  const progress = courseKitProgressSummary(record, config);

  return (
    <ol className={styles.courseMapList}>
      {phases.map((phase) => (
        <li key={phase.id}>
          <strong>{phase.title}</strong>
          <ol>
            {phase.modules.map((module) => {
              const complete = isCourseKitModuleComplete(record, config, module.slug);
              const next = progress.next?.kind === "module" && progress.next.id === module.slug;
              return (
                <li key={module.slug}>
                  <Link
                    href={`${courseHref}${module.slug}/`}
                    aria-current={module.slug === activeSlug ? "page" : undefined}
                    data-complete={complete || undefined}
                    data-next={next || undefined}
                  >
                    <span aria-hidden="true">{complete ? "✓" : String(module.order).padStart(2, "0")}</span>
                    <span>{module.title}</span>
                    <span className={styles.srOnly}>
                      {complete
                        ? labels.moduleComplete
                        : next
                          ? progress.completed === 0
                            ? labels.startCourse
                            : labels.resumeCourse
                          : ""}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </li>
      ))}
      {assessmentHref && capstoneHref ? (
        <li className={styles.courseMapFinish}>
          <strong>{labels.courseProgress}</strong>
          <ol>
            <li>
              <Link
                href={assessmentHref}
                data-complete={isCourseKitQuizComplete(record, config) || undefined}
                data-next={progress.next?.kind === "quiz" || undefined}
              >
                <span aria-hidden="true">
                  {isCourseKitQuizComplete(record, config) ? "✓" : "13"}
                </span>
                <span>{labels.finalAssessment}</span>
              </Link>
            </li>
            <li>
              <Link
                href={capstoneHref}
                data-complete={isCourseKitCapstoneComplete(record, config) || undefined}
                data-next={progress.next?.kind === "capstone" || undefined}
              >
                <span aria-hidden="true">
                  {isCourseKitCapstoneComplete(record, config) ? "✓" : "14"}
                </span>
                <span>{labels.capstone}</span>
              </Link>
            </li>
          </ol>
        </li>
      ) : null}
    </ol>
  );
}

export function CourseMilestoneLinks({
  config,
  labels,
  assessmentHref,
  assessmentTitle,
  capstoneHref,
  capstoneTitle,
  sourcesHref,
  sourceCount,
}: {
  readonly config: CourseKitProgressClientConfig;
  readonly labels: CourseKitUiCopy;
  readonly assessmentHref: string;
  readonly assessmentTitle: string;
  readonly capstoneHref: string;
  readonly capstoneTitle: string;
  readonly sourcesHref: string;
  readonly sourceCount: number;
}) {
  const { record } = useCourseKitProgress(config);
  const progress = courseKitProgressSummary(record, config);
  const quizComplete = isCourseKitQuizComplete(record, config);
  const capstoneComplete = isCourseKitCapstoneComplete(record, config);
  const links = [
    {
      href: assessmentHref,
      eyebrow: labels.finalAssessment,
      title: assessmentTitle,
      meta: quizComplete
        ? labels.moduleComplete
        : progress.next?.kind === "quiz"
          ? labels.resumeCourse
          : labels.completeModulesBeforeAssessment,
      complete: quizComplete,
      step: "13",
    },
    {
      href: capstoneHref,
      eyebrow: labels.capstone,
      title: capstoneTitle,
      meta: capstoneComplete
        ? labels.moduleComplete
        : progress.next?.kind === "capstone"
          ? labels.resumeCourse
          : labels.completeCourseBeforeCapstone,
      complete: capstoneComplete,
      step: "14",
    },
    {
      href: sourcesHref,
      eyebrow: labels.sources,
      title: labels.evidenceRegister,
      meta: `${sourceCount} ${labels.sources}`,
      complete: false,
      step: "↗",
    },
  ] as const;

  return (
    <nav className={styles.milestoneLinks} aria-label={labels.courseMap}>
      {links.map((link) => (
        <Link href={link.href} key={link.href} data-complete={link.complete || undefined}>
          <span aria-hidden="true">{link.step}</span>
          <span>
            <small>{link.eyebrow}</small>
            <strong>{link.title}</strong>
          </span>
          <span>{link.complete ? "✓" : link.meta}</span>
        </Link>
      ))}
    </nav>
  );
}
