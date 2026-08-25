"use client";

import {
  getCodexQuizBest,
  isCodexQuizPassed,
  type CodexCourseCopy,
  type CodexLessonSlug,
} from "@/lib/codex";
import { lessonProgressKey } from "./progress-store";
import useCourseProgress from "./useCourseProgress";
import styles from "./CodexCourse.module.css";

export default function CompletionSummary({
  courseTitle,
  courseVersion,
  lessonSlugs,
  labels,
}: {
  courseTitle: string;
  courseVersion: string;
  lessonSlugs: readonly CodexLessonSlug[];
  labels: CodexCourseCopy["ui"];
}) {
  const progress = useCourseProgress();
  const lessonCount = lessonSlugs.filter((slug) => progress[lessonProgressKey(slug)] === true).length;
  const quizPassed = isCodexQuizPassed(progress);
  const capstonePassed = progress["codex.capstone.v1"] === true;
  const milestones = lessonCount + Number(quizPassed) + Number(capstonePassed);
  const quizBest = getCodexQuizBest(progress);

  if (milestones !== 14) return null;

  return (
    <section
      className={styles.completionSummary}
      aria-labelledby="codex-completion-summary-title"
      data-testid="codex-completion-summary"
    >
      <div>
        <p className={styles.kicker}>{labels.completed}</p>
        <h2 id="codex-completion-summary-title">{labels.completionSummary}</h2>
        <p>{courseTitle}</p>
      </div>
      <strong aria-label={`${labels.courseProgress}: 100%`}>100%</strong>
      <button
        className={styles.secondaryAction}
        type="button"
        onClick={() => {
          const summary = {
            schema: "aicourse.codex.completion-summary.v1",
            course: "how-to-use-codex",
            courseVersion,
            generatedAt: new Date().toISOString(),
            milestones: { completed: 14, total: 14 },
            quizBest,
            capstoneReceiptVerified: true,
            credential: false,
          };
          const blob = new Blob([`${JSON.stringify(summary, null, 2)}\n`], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = "aicourse-codex-completion-summary.json";
          anchor.click();
          URL.revokeObjectURL(url);
        }}
      >
        {labels.exportSummary}
      </button>
    </section>
  );
}
