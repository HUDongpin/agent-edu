"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CursorCourseCopy,
  CursorLessonSlug,
} from "@/lib/cursor";
import { lessonProgressKey } from "./progress-store";
import useCourseProgress from "./useCourseProgress";
import styles from "./CursorCourse.module.css";

type NavigationLesson = {
  readonly slug: CursorLessonSlug;
  readonly order: number;
  readonly title: string;
  readonly href: string;
};

type NavigationUnit = {
  readonly id: string;
  readonly title: string;
  readonly lessons: readonly NavigationLesson[];
};

export type LessonSectionLink = {
  readonly id: string;
  readonly label: string;
};

type ProgressState = "completed" | "current" | "next" | undefined;
type LearningState = Exclude<ProgressState, "current">;

export default function CourseLessonNavigation({
  units,
  currentSlug,
  labels,
  sections,
  direction,
}: {
  units: readonly NavigationUnit[];
  currentSlug: CursorLessonSlug;
  labels: CursorCourseCopy["ui"];
  sections: readonly LessonSectionLink[];
  direction: "ltr" | "rtl";
}) {
  const progress = useCourseProgress();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const sectionDetailsRef = useRef<HTMLDetailsElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const mobileCurrentLinkRef = useRef<HTMLAnchorElement>(null);
  const scrollFrame = useRef<number | null>(null);
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "");
  const lessons = units.flatMap((unit) => unit.lessons);
  const currentLesson = lessons.find((lesson) => lesson.slug === currentSlug)!;
  const nextLesson = lessons.find((lesson) => progress[lessonProgressKey(lesson.slug)] !== true);

  const revealCurrentLesson = useCallback(() => {
    window.requestAnimationFrame(() => {
      const nav = mobileNavRef.current;
      const link = mobileCurrentLinkRef.current;
      if (!nav || !link) return;

      const navBounds = nav.getBoundingClientRect();
      const linkBounds = link.getBoundingClientRect();
      const alreadyVisible = linkBounds.top >= navBounds.top
        && linkBounds.bottom <= navBounds.bottom;
      if (alreadyVisible) return;

      const centeredTop = nav.scrollTop
        + linkBounds.top
        - navBounds.top
        - (nav.clientHeight - linkBounds.height) / 2;
      nav.scrollTo({ top: Math.max(0, centeredTop), behavior: "auto" });
    });
  }, []);

  useEffect(() => {
    if (detailsRef.current?.open) revealCurrentLesson();
  }, [currentSlug, revealCurrentLesson]);

  const updateActiveSection = useCallback(() => {
    const targets = sections.flatMap((section) => {
      const target = document.getElementById(section.id);
      return target ? [{ id: section.id, target }] : [];
    });
    if (!targets.length) return;

    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      setActiveSectionId(targets[targets.length - 1].id);
      return;
    }

    const headerBottom = document.querySelector("header.topbar")?.getBoundingClientRect().bottom ?? 0;
    const mobileMap = sectionDetailsRef.current;
    const mobileMapBottom = mobileMap && window.getComputedStyle(mobileMap).display !== "none"
      ? mobileMap.getBoundingClientRect().bottom
      : 0;
    // Fragment targets intentionally settle with breathing room below the
    // sticky UI. Treat that visible landing band as active instead of waiting
    // for the heading to slide underneath the header/control.
    const activationLine = Math.max(headerBottom, mobileMapBottom) + 40;
    let active = targets[0].id;
    for (const { id, target } of targets) {
      if (target.getBoundingClientRect().top > activationLine) break;
      active = id;
    }
    setActiveSectionId(active);
  }, [sections]);

  useEffect(() => {
    const scheduleUpdate = () => {
      if (scrollFrame.current !== null) return;
      scrollFrame.current = window.requestAnimationFrame(() => {
        scrollFrame.current = null;
        updateActiveSection();
      });
    };
    const syncHash = () => {
      const hashId = window.location.hash.slice(1);
      if (sections.some((section) => section.id === hashId)) setActiveSectionId(hashId);
      scheduleUpdate();
    };

    syncHash();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("hashchange", syncHash);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("hashchange", syncHash);
      if (scrollFrame.current !== null) window.cancelAnimationFrame(scrollFrame.current);
    };
  }, [sections, updateActiveSection]);

  const lessonLinks = (mobile: boolean) => units.map((unit) => (
    <div className={styles.railUnit} key={unit.id}>
      <p className={styles.railGroup}>{unit.title}</p>
      <ol>
        {unit.lessons.map((lesson) => {
          const isCurrent = lesson.slug === currentSlug;
          const learningState: LearningState = progress[lessonProgressKey(lesson.slug)] === true
            ? "completed"
            : lesson.slug === nextLesson?.slug
              ? "next"
              : undefined;
          const progressState: ProgressState = isCurrent ? "current" : learningState;
          const statusLabel = learningState === "completed"
            ? labels.completed
            : learningState === "next"
              ? labels.next
              : null;

          return (
            <li key={lesson.slug}>
              <Link
                href={lesson.href}
                aria-current={isCurrent ? "page" : undefined}
                data-progress-state={progressState}
                data-learning-state={learningState}
                ref={mobile && isCurrent ? mobileCurrentLinkRef : undefined}
              >
                <span className={styles.railOrder}>{lesson.order}</span>
                <span className={styles.railTitle}>{lesson.title}</span>
                <span
                  className={`${styles.railState}${learningState === "next" ? ` ${styles.arrow}` : ""}`}
                  aria-hidden="true"
                >
                  {learningState === "completed" ? "✓" : learningState === "next" ? "→" : isCurrent ? "●" : ""}
                </span>
                {statusLabel ? <span className={styles.srOnly}>{statusLabel}</span> : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  ));

  const sectionLinks = (mobile: boolean) => (
    <ol>
      {sections.map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            aria-current={activeSectionId === section.id ? "location" : undefined}
            onClick={() => {
              setActiveSectionId(section.id);
              if (mobile && sectionDetailsRef.current) sectionDetailsRef.current.open = false;
              window.requestAnimationFrame(() => {
                document.getElementById(section.id)?.focus({ preventScroll: true });
              });
            }}
          >
            {section.label}
          </a>
        </li>
      ))}
    </ol>
  );

  const activeSectionLabel = sections.find((section) => section.id === activeSectionId)?.label
    ?? sections[0]?.label;

  return (
    <>
      <aside className={styles.lessonRail}>
        <nav
          className={styles.sectionMap}
          aria-label={labels.inThisLesson}
          dir={direction}
          data-testid="cursor-desktop-section-nav"
        >
          <strong>{labels.inThisLesson}</strong>
          {sectionLinks(false)}
        </nav>
        <nav
          className={styles.courseLessonMap}
          aria-label={labels.allLessons}
          dir={direction}
          data-testid="cursor-desktop-lesson-nav"
        >
          <strong>{labels.allLessons}</strong>
          {lessonLinks(false)}
        </nav>
      </aside>

      <div className={styles.lessonMobileNavigation}>
        <details
          className={styles.lessonRailMobile}
          data-testid="cursor-mobile-lesson-nav"
          ref={detailsRef}
          onToggle={(event) => {
            if (event.currentTarget.open) revealCurrentLesson();
          }}
        >
          <summary>
            <span>{labels.allLessons}</span>
            <span data-testid="cursor-mobile-lesson-position" dir="ltr">
              {currentLesson.order} / {lessons.length}
            </span>
          </summary>
          <nav ref={mobileNavRef} aria-label={labels.allLessons} dir={direction}>
            {lessonLinks(true)}
          </nav>
        </details>

        <details
          className={styles.sectionMapMobile}
          data-testid="cursor-mobile-section-nav"
          ref={sectionDetailsRef}
        >
          <summary>
            <span>{labels.inThisLesson}</span>
            <span>{activeSectionLabel}</span>
          </summary>
          <nav aria-label={labels.inThisLesson} dir={direction}>
            {sectionLinks(true)}
          </nav>
        </details>
      </div>
    </>
  );
}
