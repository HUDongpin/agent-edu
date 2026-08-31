"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { GithubUiCopy } from "@/lib/github";
import {
  hasGithubCourseProgress,
  resetGithubProgress,
} from "./progress-store";
import {
  selectGithubJourney,
  type GithubJourneyLesson,
} from "./course-journey";
import useGithubProgress, {
  useGithubStorageAvailable,
} from "./useGithubProgress";
import { useI18n } from "../I18nProvider";
import base from "./GithubCourseFoundation.module.css";
import styles from "./GithubCourse.module.css";

export function CourseJourneyAction({
  lessons,
  locale,
  startLabel,
  resumeLabel,
}: {
  lessons: readonly GithubJourneyLesson[];
  locale: string;
  startLabel: string;
  resumeLabel: string;
}) {
  const { t } = useI18n();
  const progress = useGithubProgress();
  const state = useMemo(
    () => selectGithubJourney(lessons, progress),
    [lessons, progress],
  );
  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const hasProgress = hasGithubCourseProgress(progress);
  const href = state.nextHref;
  if (!href) return null;

  return (
    <>
      <Link
        className={`${base.primaryAction} ${styles.courseAction}`}
        href={href}
        data-course-journey-action
        data-testid="github-hero-journey-action"
        onClick={(event) => {
          if (!href.startsWith("#")) return;
          const target = document.querySelector<HTMLElement>(href);
          if (!target) return;
          event.preventDefault();
          window.history.pushState(null, "", href);
          target.focus({ preventScroll: true });
          target.scrollIntoView({ block: "start" });
        }}
      >
        {state.courseCompleted
          ? t("cat.review")
          : hasProgress
            ? resumeLabel
            : startLabel}
        <span className={base.arrow} aria-hidden="true">
          →
        </span>
      </Link>
      <span className={base.srOnly}>
        {`${numberFormat.format(state.completed)}/${numberFormat.format(state.total)}`}
      </span>
    </>
  );
}

export default function CourseProgress({
  lessons,
  labels,
  locale,
}: {
  lessons: readonly GithubJourneyLesson[];
  labels: GithubUiCopy;
  locale: string;
}) {
  const progress = useGithubProgress();
  const storageAvailable = useGithubStorageAvailable();
  const [resetMessage, setResetMessage] = useState("");
  const [resetPersisted, setResetPersisted] = useState<boolean | null>(null);
  const resetStatus = useRef<HTMLParagraphElement>(null);
  const state = useMemo(
    () => selectGithubJourney(lessons, progress),
    [lessons, progress],
  );
  const formats = useMemo(() => ({
    number: new Intl.NumberFormat(locale),
    percent: new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 0,
    }),
  }), [locale]);
  const hasProgress = hasGithubCourseProgress(progress);

  return (
    <section
      className={base.progressPanel}
      aria-labelledby="github-course-progress-title"
      data-testid="github-course-progress"
    >
      <div className={base.progressHeading}>
        <div>
          <h2 id="github-course-progress-title">{labels.courseProgress}</h2>
          <p>{labels.browserStorageNote}</p>
        </div>
        <output className={base.progressValue} aria-live="polite">
          <strong data-testid="github-progress-percent">
            {formats.percent.format(state.completed / state.total)}
          </strong>
          <span>
            {formats.number.format(state.completed)}/{formats.number.format(state.total)}
          </span>
        </output>
      </div>

      {!storageAvailable ? (
        <p className={base.storageWarning} role="status">
          {labels.storageUnavailable}
        </p>
      ) : null}

      <progress
        className={base.progressBar}
        max={state.total}
        value={state.completed}
        aria-label={labels.courseProgress}
      />

      <div className={base.progressActions}>
        <button
          className={`${base.secondaryAction} ${styles.courseAction}`}
          type="button"
          disabled={!hasProgress}
          onClick={() => {
            if (!window.confirm(labels.resetConfirm)) return;
            const result = resetGithubProgress();
            setResetPersisted(result.persisted);
            setResetMessage(
              result.persisted ? labels.resetDone : labels.resetNotSaved,
            );
            window.requestAnimationFrame(() => resetStatus.current?.focus());
          }}
        >
          {labels.resetProgress}
        </button>
      </div>
      <p
        className={
          `${!resetMessage
            ? base.srOnly
            : resetPersisted
              ? base.resetStatus
              : base.storageWarning} ${styles.focusTarget}`
        }
        ref={resetStatus}
        role="status"
        tabIndex={-1}
      >
        {resetMessage}
      </p>
    </section>
  );
}
