import { AI_TUTOR_COURSE_MANIFEST } from "./manifest";
import type { AiTutorModuleSlug } from "./types";

export const AI_TUTOR_PROGRESS_PREFIX = "ai-tutor.";
export const AI_TUTOR_PROGRESS_VERSION = AI_TUTOR_COURSE_MANIFEST.version;
export const AI_TUTOR_PROGRESS_VERSION_KEY = "ai-tutor.progress.version";
export const AI_TUTOR_PROGRESS_EVENT = "ai-tutor:progress-change";
export const AI_TUTOR_PROGRESS_RESET_EVENT = "ai-tutor:progress-reset";
export const AI_TUTOR_QUIZ_BEST_KEY = "ai-tutor.quiz.best";
export const AI_TUTOR_QUIZ_PASSED_KEY = "ai-tutor.quiz.passed";
export const AI_TUTOR_CAPSTONE_KEY = "ai-tutor.capstone.v1";
export const AI_TUTOR_PROGRESS_MILESTONES = AI_TUTOR_COURSE_MANIFEST.modules.length + 2;

export function aiTutorModuleProgressKey(slug: AiTutorModuleSlug): string {
  return `ai-tutor.module.${slug}.complete`;
}

export function isCurrentAiTutorProgress(progress: Record<string, unknown>): boolean {
  return progress[AI_TUTOR_PROGRESS_VERSION_KEY] === AI_TUTOR_PROGRESS_VERSION;
}

export function aiTutorProgressPercent(progress: Record<string, unknown>): number {
  if (!isCurrentAiTutorProgress(progress)) return 0;
  const modules = AI_TUTOR_COURSE_MANIFEST.modules.filter(
    (module) => progress[aiTutorModuleProgressKey(module.slug)] === true,
  ).length;
  const quiz = progress[AI_TUTOR_QUIZ_PASSED_KEY] === true ? 1 : 0;
  const capstone = progress[AI_TUTOR_CAPSTONE_KEY] === true ? 1 : 0;
  return Math.round(((modules + quiz + capstone) / AI_TUTOR_PROGRESS_MILESTONES) * 100);
}
