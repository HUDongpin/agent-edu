import { isClaudeCapstoneSelfAuditPassed } from "./capstone";
import { isClaudeQuizPassed } from "./quiz";
import { CLAUDE_LESSON_SLUGS } from "./types";

export const CLAUDE_PROGRESS_MILESTONES = CLAUDE_LESSON_SLUGS.length + 2;

/**
 * Catalogue adapter for the shared `ae.progress` record.
 *
 * Claude progress is fifteen lesson flags plus the versioned quiz pass and the
 * strict capstone self-audit. Unknown, malformed, or legacy partial records are
 * deliberately worth zero for the milestones they cannot prove.
 */
export function claudeProgressPercent(value: unknown): number {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 0;
  const progress = value as Record<string, unknown>;
  const lessons = CLAUDE_LESSON_SLUGS.filter(
    (slug) => progress[`claude.lesson.${slug}`] === true,
  ).length;
  const completed = lessons
    + Number(isClaudeQuizPassed(progress))
    + Number(isClaudeCapstoneSelfAuditPassed(progress));
  return Math.round((completed / CLAUDE_PROGRESS_MILESTONES) * 100);
}
