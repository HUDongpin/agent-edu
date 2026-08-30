"use client";

import {
  getGithubQuizBest,
  isGithubQuizPassed,
  type GithubLessonSlug,
  type GithubUiCopy,
} from "@/lib/github";
import {
  GITHUB_CAPSTONE_STORAGE_KEY,
  githubLessonProgressKey,
} from "./progress-store";
import useGithubProgress from "./useGithubProgress";
import base from "@/components/codex/CodexCourse.module.css";

export default function CompletionSummary({
  courseTitle,
  courseVersion,
  lessonSlugs,
  labels,
}: {
  courseTitle: string;
  courseVersion: string;
  lessonSlugs: readonly GithubLessonSlug[];
  labels: GithubUiCopy;
}) {
  const progress = useGithubProgress();
  const lessonCount = lessonSlugs.filter(
    (slug) => progress[githubLessonProgressKey(slug)] === true,
  ).length;
  const quizPassed = isGithubQuizPassed(progress);
  const capstonePassed = progress[GITHUB_CAPSTONE_STORAGE_KEY] === true;
  const milestones = lessonCount + Number(quizPassed) + Number(capstonePassed);
  const quizBest = getGithubQuizBest(progress);

  if (milestones !== lessonSlugs.length + 2) return null;

  return (
    <section
      className={base.completionSummary}
      aria-labelledby="github-completion-summary-title"
      data-testid="github-completion-summary"
    >
      <div>
        <p className={base.kicker}>{labels.completed}</p>
        <h2 id="github-completion-summary-title">{labels.completionSummary}</h2>
        <p>{courseTitle}</p>
      </div>
      <strong aria-label={labels.courseProgress}>100%</strong>
      <button
        className={base.secondaryAction}
        type="button"
        onClick={() => {
          const summary = {
            schema: "aicourse.github.completion-summary.v1",
            course: "how-to-use-github",
            courseVersion,
            generatedAt: new Date().toISOString(),
            milestones: {
              completed: lessonSlugs.length + 2,
              total: lessonSlugs.length + 2,
            },
            quizBest,
            capstoneSelfAuditComplete: true,
            credential: false,
          };
          const blob = new Blob([`${JSON.stringify(summary, null, 2)}\n`], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = "aicourse-github-completion-summary.json";
          anchor.click();
          URL.revokeObjectURL(url);
        }}
      >
        {labels.exportSummary}
      </button>
    </section>
  );
}
