"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { McpUiCopy } from "@/lib/mcp/copy";
import { formatMcpCopy, formatMcpInteger } from "@/lib/mcp/format";
import type { McpDirection } from "@/lib/mcp/types";
import { isMcpQuizPassed, resetMcpProgress } from "./progress-store";
import { useMcpProgress, useMcpStorageAvailable } from "./useMcpProgress";
import styles from "./McpCourse.module.css";
import { useI18n } from "../I18nProvider";

export default function CourseProgress({
  locale,
  lessons,
  direction,
  ui,
}: {
  locale: string;
  lessons: readonly { slug: string; title: string }[];
  direction: McpDirection;
  ui: McpUiCopy;
}) {
  const { t } = useI18n();
  const progress = useMcpProgress();
  const storageAvailable = useMcpStorageAvailable();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetFailed, setResetFailed] = useState(false);
  const resetStatus = useRef<HTMLParagraphElement>(null);
  const resetTrigger = useRef<HTMLButtonElement>(null);
  const cancelAction = useRef<HTMLButtonElement>(null);
  const completed = lessons.filter((lesson) => progress[`mcp.lesson.${lesson.slug}`] === true).length;
  const quiz = isMcpQuizPassed(progress) ? 1 : 0;
  const capstone = progress["mcp.capstone.v1"] === true ? 1 : 0;
  const hasMcpProgress = Object.keys(progress).some((key) => key.startsWith("mcp."));
  const total = lessons.length + 2;
  const percent = Math.round(((completed + quiz + capstone) / total) * 100);
  const courseCompleted = completed + quiz + capstone === total;
  const next = lessons.find((lesson) => progress[`mcp.lesson.${lesson.slug}`] !== true);
  const nextHref = courseCompleted
    ? `/${locale}/mcp/${lessons[0]?.slug ?? "why-mcp"}/`
    : next
    ? `/${locale}/mcp/${next.slug}/`
    : !quiz
      ? `/${locale}/mcp/#assessment`
      : `/${locale}/mcp/#capstone`;
  const nextLabel = courseCompleted
    ? t("cat.review")
    : next
    ? (completed ? ui.progressContinue : ui.progressStart)
    : !quiz
      ? ui.progressTakeAssessment
      : ui.progressOpenCapstone;
  const number = (value: number) => formatMcpInteger(value, locale);

  function performReset() {
    const persisted = resetMcpProgress();
    setConfirmReset(false);
    setResetFailed(!persisted);
    setResetMessage(persisted ? ui.progressResetStatus : ui.progressResetFailedStatus);
    window.requestAnimationFrame(() => resetStatus.current?.focus());
  }

  function openResetConfirmation() {
    setConfirmReset(true);
    window.requestAnimationFrame(() => cancelAction.current?.focus());
  }

  function cancelReset() {
    setConfirmReset(false);
    window.requestAnimationFrame(() => resetTrigger.current?.focus());
  }

  return (
    <section className={styles.progressPanel} aria-labelledby="mcp-progress-title">
      <div className={styles.progressCopy}>
        <p className={styles.eyebrow}>{ui.progressEyebrow}</p>
        <h2 id="mcp-progress-title">{formatMcpCopy(ui.progressPercentTemplate, { percent: number(percent) })}</h2>
        <p>{formatMcpCopy(ui.progressSummaryTemplate, {
          completed: number(completed),
          total: number(lessons.length),
          assessment: quiz ? ui.progressAssessmentPassed : ui.progressAssessmentNotPassed,
          capstone: capstone ? ui.progressCapstoneComplete : ui.progressCapstoneOpen,
        })}</p>
        {!storageAvailable ? (
          <p className={styles.storageWarning} role="status">
            {ui.completionStorageUnavailable}
          </p>
        ) : null}
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={ui.progressAria}
        >
          <span style={{ inlineSize: `${percent}%` }} />
        </div>
      </div>
      <div className={styles.progressActions}>
        <Link
          className={styles.primaryButton}
          href={nextHref}
          data-course-journey-action
          onClick={(event) => {
            const destination = new URL(nextHref, window.location.href);
            if (
              !destination.hash
              || destination.pathname !== window.location.pathname
              || destination.search !== window.location.search
            ) return;
            const target = document.getElementById(decodeURIComponent(destination.hash.slice(1)));
            if (!target) return;
            event.preventDefault();
            window.history.pushState(null, "", `${destination.pathname}${destination.search}${destination.hash}`);
            if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: true });
            target.scrollIntoView({ block: "start", behavior: "instant" as ScrollBehavior });
          }}
        >
          {nextLabel} <span aria-hidden="true">{direction === "rtl" ? "←" : "→"}</span>
        </Link>
        {hasMcpProgress ? (
          confirmReset ? (
            <div
              id="mcp-reset-confirmation"
              className={styles.resetConfirm}
              role="group"
              aria-label={ui.progressResetGroupAria}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelReset();
                }
              }}
            >
              <span>{ui.progressResetQuestion}</span>
              <button type="button" className={styles.dangerButton} onClick={performReset}>{ui.progressResetYes}</button>
              <button ref={cancelAction} type="button" className={styles.textButton} onClick={cancelReset}>{ui.progressResetCancel}</button>
            </div>
          ) : (
            <button
              ref={resetTrigger}
              type="button"
              className={styles.textButton}
              aria-controls="mcp-reset-confirmation"
              aria-expanded="false"
              onClick={openResetConfirmation}
            >
              {ui.progressResetAction}
            </button>
          )
        ) : null}
        <p
          ref={resetStatus}
          className={styles.srStatus}
          data-tone={resetFailed ? "error" : "success"}
          role="status"
          tabIndex={-1}
        >
          {resetMessage}
        </p>
      </div>
    </section>
  );
}
