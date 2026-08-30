"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import {
  progressOnServer,
  progressSnapshot,
  readProgress,
  subscribeProgress,
} from "@/lib/progress";
import {
  agenticTeachingNextStep,
  isAgenticTeachingModuleComplete,
} from "@/lib/ai-teaching/progress";
import type {
  AgenticTeachingModuleSlug,
  AgenticTeachingUiCopy,
} from "@/lib/ai-teaching/types";
import styles from "./AgenticTeachingCourse.module.css";

export interface TeachingNavigationModule {
  readonly slug: AgenticTeachingModuleSlug;
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly minutes: number;
  readonly sourceCount: number;
}

export interface TeachingNavigationPhase {
  readonly id: string;
  readonly order: number;
  readonly title: string;
  readonly summary: string;
  readonly modules: readonly TeachingNavigationModule[];
}

function useProgressRecord() {
  const snapshot = useSyncExternalStore(
    subscribeProgress,
    progressSnapshot,
    progressOnServer,
  );
  return useMemo(() => readProgress(snapshot), [snapshot]);
}

export function CoursePrimaryAction({
  locale,
  modules,
  labels,
}: {
  readonly locale: string;
  readonly modules: readonly TeachingNavigationModule[];
  readonly labels: AgenticTeachingUiCopy;
}) {
  const record = useProgressRecord();
  const step = agenticTeachingNextStep(record);

  if (step.kind === "module") {
    const destination = modules.find((candidate) => candidate.slug === step.slug);
    return (
      <Link
        className={styles.primaryAction}
        href={`/${locale}/ai-teaching/${step.slug}/`}
      >
        <span>{step.resume ? labels.resume : labels.start}</span>
        {destination ? (
          <small>{labels.module} {destination.order}</small>
        ) : null}
        <span aria-hidden="true">→</span>
      </Link>
    );
  }

  const target = step.kind === "final-assessment"
    ? { href: "#final-assessment", label: labels.finalAssessment }
    : step.kind === "capstone"
      ? { href: "#capstone", label: labels.capstone }
      : { href: "#course-map", label: labels.courseMap };
  return (
    <a className={styles.primaryAction} href={target.href}>
      <span>{target.label}</span>
      <span aria-hidden="true">↓</span>
    </a>
  );
}

function ModuleState({
  completed,
  next,
  labels,
}: {
  readonly completed: boolean;
  readonly next: boolean;
  readonly labels: AgenticTeachingUiCopy;
}) {
  if (!completed && !next) return null;
  return (
    <span className={styles.moduleState}>
      <span aria-hidden="true">{completed ? "✓" : "→"}</span>
      {completed ? labels.moduleCompleted : labels.next}
    </span>
  );
}

export function CourseModuleGrid({
  locale,
  phases,
  labels,
}: {
  readonly locale: string;
  readonly phases: readonly TeachingNavigationPhase[];
  readonly labels: AgenticTeachingUiCopy;
}) {
  const record = useProgressRecord();
  const nextStep = agenticTeachingNextStep(record);

  return phases.map((phase) => (
    <section
      className={styles.phaseGroup}
      key={phase.id}
      aria-labelledby={`phase-${phase.id}`}
    >
      <header className={styles.phaseHeader}>
        <span>{String(phase.order).padStart(2, "0")}</span>
        <div>
          <h3 id={`phase-${phase.id}`}>{phase.title}</h3>
          <p>{phase.summary}</p>
        </div>
      </header>
      <div className={styles.moduleGrid}>
        {phase.modules.map((module) => {
          const completed = isAgenticTeachingModuleComplete(record, module.slug);
          const next = nextStep.kind === "module" && nextStep.slug === module.slug;
          return (
            <Link
              className={styles.moduleCard}
              data-state={completed ? "completed" : next ? "next" : "upcoming"}
              href={`/${locale}/ai-teaching/${module.slug}/`}
              key={module.slug}
            >
              <span className={styles.moduleNumber}>
                {completed ? <span aria-hidden="true">✓</span> : String(module.order).padStart(2, "0")}
              </span>
              <div>
                <h4>{module.title}</h4>
                <p>{module.summary}</p>
                <div className={styles.moduleCardFooter}>
                  <small>
                    {module.minutes} {labels.minutes} · {module.sourceCount} {labels.sources}
                  </small>
                  <ModuleState completed={completed} next={next} labels={labels} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  ));
}

export function CompactCourseMap({
  locale,
  phases,
  activeSlug,
  labels,
}: {
  readonly locale: string;
  readonly phases: readonly TeachingNavigationPhase[];
  readonly activeSlug: AgenticTeachingModuleSlug;
  readonly labels: AgenticTeachingUiCopy;
}) {
  const record = useProgressRecord();
  const nextStep = agenticTeachingNextStep(record);

  return (
    <ol className={styles.moduleMap}>
      {phases.map((phase) => (
        <li key={phase.id}>
          <strong>{phase.title}</strong>
          <ol>
            {phase.modules.map((module) => {
              const completed = isAgenticTeachingModuleComplete(record, module.slug);
              const next = nextStep.kind === "module" && nextStep.slug === module.slug;
              return (
                <li key={module.slug}>
                  <Link
                    href={`/${locale}/ai-teaching/${module.slug}/`}
                    aria-current={module.slug === activeSlug ? "page" : undefined}
                    data-state={completed ? "completed" : next ? "next" : "upcoming"}
                  >
                    <span>{String(module.order).padStart(2, "0")}</span>
                    <span>{module.title}</span>
                    {completed || next ? (
                      <span className={styles.moduleMapState}>
                        <span aria-hidden="true">{completed ? "✓" : "→"}</span>
                        <span className={styles.srOnly}>
                          {completed ? labels.moduleCompleted : labels.next}
                        </span>
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ol>
        </li>
      ))}
    </ol>
  );
}
