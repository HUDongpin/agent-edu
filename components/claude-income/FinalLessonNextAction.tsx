"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { CLAUDE_INCOME_CAPSTONE } from "@/lib/claude-income/capstone";
import { CLAUDE_INCOME_FINAL_QUIZ } from "@/lib/claude-income/quiz";
import { useCourseHydrated, useCourseProgress } from "./useCourseProgress";
import styles from "./ClaudeIncomeCourse.module.css";

export default function FinalLessonNextAction({ courseHref }: { courseHref: string }) {
  const progress = useCourseProgress();
  const hydrated = useCourseHydrated();
  const quizPassed = progress[CLAUDE_INCOME_FINAL_QUIZ.versionStorageKey]
      === CLAUDE_INCOME_FINAL_QUIZ.bankVersion
    && progress[CLAUDE_INCOME_FINAL_QUIZ.passedStorageKey] === true;
  const capstoneComplete = progress[CLAUDE_INCOME_CAPSTONE.passedStorageKey] === true;

  function focusCapstone(event: MouseEvent<HTMLAnchorElement>) {
    const target = document.querySelector<HTMLElement>("#claude-income-capstone-audit-title");
    if (!target) return;
    event.preventDefault();
    window.history.pushState(null, "", "#claude-income-capstone-audit-title");
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start" });
  }

  if (!hydrated) {
    return (
      <div
        className={styles.lessonPagerPending}
        data-testid="claude-income-final-next-action"
      >
        <span>Next milestone uses your saved course record.</span>
        <noscript>
          <p className={styles.noScriptNextAction}>
            JavaScript is needed to choose the saved-state action.
            <Link href={courseHref}>Open Course 12 dashboard</Link>
          </p>
        </noscript>
      </div>
    );
  }

  if (!quizPassed) {
    return (
      <Link href={`${courseHref}#final-quiz`} rel="next">
        <span>Next milestone</span>
        <strong>Take final quiz</strong>
      </Link>
    );
  }

  if (!capstoneComplete) {
    return (
      <Link href="#claude-income-capstone-audit-title" rel="next" onClick={focusCapstone}>
        <span>Next milestone</span>
        <strong>Continue capstone audit</strong>
      </Link>
    );
  }

  return (
    <Link href={courseHref}>
      <span>Course complete</span>
      <strong>Review course</strong>
    </Link>
  );
}
