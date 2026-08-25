"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { MCP_ASSESSMENT_VERSION } from "@/lib/mcp";
import type { McpUiCopy } from "@/lib/mcp/copy";
import { formatMcpCopy } from "@/lib/mcp/format";
import type { McpDirection } from "@/lib/mcp/types";
import { resetMcpProgress } from "./progress-store";
import { useMcpProgress } from "./useMcpProgress";
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
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const resetStatus = useRef<HTMLParagraphElement>(null);
  const resetTrigger = useRef<HTMLButtonElement>(null);
  const confirmAction = useRef<HTMLButtonElement>(null);
  const completed = lessons.filter((lesson) => progress[`mcp.lesson.${lesson.slug}`] === true).length;
  const quiz = progress["mcp.quiz.version"] === MCP_ASSESSMENT_VERSION && progress["mcp.quiz.passed"] === true ? 1 : 0;
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
  const number = new Intl.NumberFormat(locale);

  function performReset() {
    resetMcpProgress();
    setConfirmReset(false);
    setResetMessage(ui.progressResetStatus);
    window.requestAnimationFrame(() => resetStatus.current?.focus());
  }

  function openResetConfirmation() {
    setConfirmReset(true);
    window.requestAnimationFrame(() => confirmAction.current?.focus());
  }

  function cancelReset() {
    setConfirmReset(false);
    window.requestAnimationFrame(() => resetTrigger.current?.focus());
  }

  return (
    <section className={styles.progressPanel} aria-labelledby="mcp-progress-title">
      <div className={styles.progressCopy}>
        <p className={styles.eyebrow}>{ui.progressEyebrow}</p>
        <h2 id="mcp-progress-title">{formatMcpCopy(ui.progressPercentTemplate, { percent: number.format(percent) })}</h2>
        <p>{formatMcpCopy(ui.progressSummaryTemplate, {
          completed: number.format(completed),
          total: number.format(lessons.length),
          assessment: quiz ? ui.progressAssessmentPassed : ui.progressAssessmentNotPassed,
          capstone: capstone ? ui.progressCapstoneComplete : ui.progressCapstoneOpen,
        })}</p>
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
        <Link className={styles.primaryButton} href={nextHref} data-course-journey-action>
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
              <button ref={confirmAction} type="button" className={styles.dangerButton} onClick={performReset}>{ui.progressResetYes}</button>
              <button type="button" className={styles.textButton} onClick={cancelReset}>{ui.progressResetCancel}</button>
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
        <p ref={resetStatus} className={styles.srStatus} role="status" tabIndex={-1}>{resetMessage}</p>
      </div>
    </section>
  );
}
