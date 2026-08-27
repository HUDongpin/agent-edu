import { AGENTIC_VIDEO_EDITING_COURSE_MANIFEST } from "./manifest";
import type { AgenticVideoEditingModuleSlug } from "./types";

export const AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX = "agentic-video-editing.";
export const AGENTIC_VIDEO_EDITING_PROGRESS_VERSION =
  `${AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.version}:progress-v1`;
export const AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY =
  "agentic-video-editing.progress.version";
export const AGENTIC_VIDEO_EDITING_PROGRESS_EVENT =
  "agentic-video-editing:progress-change";
export const AGENTIC_VIDEO_EDITING_PROGRESS_RESET_EVENT =
  "agentic-video-editing:progress-reset";
export const AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY =
  "agentic-video-editing.quiz.best";
export const AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY =
  "agentic-video-editing.quiz.passed";
export const AGENTIC_VIDEO_EDITING_CAPSTONE_KEY =
  "agentic-video-editing.capstone.v1";
export const AGENTIC_VIDEO_EDITING_CAPSTONE_CHECKS_KEY =
  "agentic-video-editing.capstone.checks";
export const AGENTIC_VIDEO_EDITING_QUIZ_PASS_PERCENT = 80;
export const AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_COUNT = 12;
export const AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONES =
  AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.length + 2;

export function agenticVideoEditingModuleProgressKey(
  slug: AgenticVideoEditingModuleSlug,
): string {
  return `agentic-video-editing.module.${slug}.complete`;
}

export function agenticVideoEditingCheckpointKey(
  slug: AgenticVideoEditingModuleSlug,
): string {
  return `agentic-video-editing.module.${slug}.checkpoint.passed`;
}

export function agenticVideoEditingArtifactKey(
  slug: AgenticVideoEditingModuleSlug,
): string {
  return `agentic-video-editing.module.${slug}.artifact`;
}

export function isCurrentAgenticVideoEditingProgress(
  progress: Record<string, unknown>,
): boolean {
  return progress[AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]
    === AGENTIC_VIDEO_EDITING_PROGRESS_VERSION;
}

/** Remove stale Course 20 data without touching any other course or preference. */
export function normalizeAgenticVideoEditingProgress(
  progress: Record<string, unknown>,
): Record<string, unknown> {
  if (isCurrentAgenticVideoEditingProgress(progress)) return { ...progress };
  return {
    ...Object.fromEntries(
      Object.entries(progress).filter(
        ([key]) => !key.startsWith(AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX),
      ),
    ),
    [AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY]:
      AGENTIC_VIDEO_EDITING_PROGRESS_VERSION,
  };
}

export function agenticVideoEditingProgressPercent(
  progress: Record<string, unknown>,
): number {
  if (!isCurrentAgenticVideoEditingProgress(progress)) return 0;
  const modules = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.filter(
    (module) => progress[agenticVideoEditingModuleProgressKey(module.slug)] === true,
  ).length;
  const quiz = progress[AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY] === true ? 1 : 0;
  const capstone = progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY] === true ? 1 : 0;
  return Math.round(
    ((modules + quiz + capstone) / AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONES) * 100,
  );
}
