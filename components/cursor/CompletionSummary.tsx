"use client";

import {
  CURSOR_CAPSTONE_PROGRESS_META,
  CURSOR_PROGRESS_MILESTONES,
  cursorProgressCompletedMilestones,
  getCursorQuizBest,
  getCursorCapstoneProgressAssessment,
  cursorProgressPercent,
  type CursorCourseCopy,
} from "@/lib/cursor";
import useCourseProgress from "./useCourseProgress";
import styles from "./CursorCourse.module.css";

export default function CompletionSummary({
  courseTitle,
  courseVersion,
  labels,
}: {
  courseTitle: string;
  courseVersion: string;
  labels: CursorCourseCopy["ui"];
}) {
  const progress = useCourseProgress();
  const milestones = cursorProgressCompletedMilestones(progress);
  const totalMilestones = CURSOR_PROGRESS_MILESTONES;
  const quizBest = getCursorQuizBest(progress);
  const capstoneSelfAssessment = getCursorCapstoneProgressAssessment(progress);

  if (milestones !== totalMilestones || cursorProgressPercent(progress) !== 100) return null;

  return (
    <section
      className={styles.completionSummary}
      aria-labelledby="cursor-completion-summary-title"
      data-testid="cursor-completion-summary"
    >
      <div>
        <p className={styles.kicker}>{labels.completed}</p>
        <h2 id="cursor-completion-summary-title">{labels.completionSummary}</h2>
        <p>{courseTitle}</p>
      </div>
      <strong aria-label={labels.courseProgress}>100%</strong>
      <button
        className={styles.secondaryAction}
        type="button"
        onClick={() => {
          const summary = {
            schema: "aicourse.cursor.completion-summary.v1",
            course: "how-to-use-cursor",
            courseVersion,
            generatedAt: new Date().toISOString(),
            milestones: { completed: totalMilestones, total: totalMilestones },
            quizBest,
            capstoneReceiptFormatChecked: true,
            capstoneReceiptContractMatched: CURSOR_CAPSTONE_PROGRESS_META,
            capstoneSelfAssessment,
            evidenceReviewedBySite: false,
            selfReported: true,
            attestation: false,
            credential: false,
          };
          const blob = new Blob([`${JSON.stringify(summary, null, 2)}\n`], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = "aicourse-cursor-completion-summary.json";
          anchor.click();
          URL.revokeObjectURL(url);
        }}
      >
        {labels.exportSummary}
      </button>
    </section>
  );
}
