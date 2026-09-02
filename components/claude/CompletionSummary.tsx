"use client";

import {
  getClaudeCapstoneRubricScore,
  getClaudeQuizBest,
  isClaudeCapstoneSelfAuditPassed,
  isClaudeQuizPassed,
  type ClaudeCourseCopy,
  type ClaudeLessonSlug,
} from "@/lib/claude";
import { lessonProgressKey } from "./progress-store";
import useCourseProgress from "./useCourseProgress";
import styles from "./ClaudeCourse.module.css";

export default function CompletionSummary({
  courseTitle,
  courseVersion,
  lessonSlugs,
  labels,
}: {
  courseTitle: string;
  courseVersion: string;
  lessonSlugs: readonly ClaudeLessonSlug[];
  labels: ClaudeCourseCopy["ui"];
}) {
  const progress = useCourseProgress();
  const lessonCount = lessonSlugs.filter((slug) => progress[lessonProgressKey(slug)] === true).length;
  const quizPassed = isClaudeQuizPassed(progress);
  const capstonePassed = isClaudeCapstoneSelfAuditPassed(progress);
  const milestones = lessonCount + Number(quizPassed) + Number(capstonePassed);
  const totalMilestones = lessonSlugs.length + 2;
  const quizBest = getClaudeQuizBest(progress);

  if (milestones !== totalMilestones) return null;

  return (
    <section
      className={styles.completionSummary}
      aria-labelledby="claude-completion-summary-title"
      data-testid="claude-completion-summary"
    >
      <div>
        <p className={styles.kicker}>{labels.completed}</p>
        <h2 id="claude-completion-summary-title">{labels.completionSummary}</h2>
        <p>{courseTitle}</p>
      </div>
      <strong aria-label={labels.courseProgress}>100%</strong>
      <button
        className={styles.secondaryAction}
        type="button"
        onClick={() => {
          const summary = {
            schema: "aicourse.claude.completion-summary.v1",
            course: "how-to-use-claude",
            courseVersion,
            generatedAt: new Date().toISOString(),
            milestones: { completed: totalMilestones, total: totalMilestones },
            quizBest,
            capstoneSelfAuditComplete: true,
            capstoneSelfScore: getClaudeCapstoneRubricScore(progress),
            credential: false,
          };
          const blob = new Blob([`${JSON.stringify(summary, null, 2)}\n`], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = "aicourse-claude-completion-summary.json";
          anchor.click();
          URL.revokeObjectURL(url);
        }}
      >
        {labels.exportSummary}
      </button>
    </section>
  );
}
