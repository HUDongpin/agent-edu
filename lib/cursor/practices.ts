import type { CursorLessonSlug, CursorPracticeManifest } from "./types";

const practice = (
  lessonSlug: CursorLessonSlug,
  estimatedMinutes: number,
  workspace: CursorPracticeManifest["workspace"],
  requiresWriteAccess: boolean,
): CursorPracticeManifest => ({
  id: `practice-${lessonSlug}` as CursorPracticeManifest["id"],
  lessonSlug,
  estimatedMinutes,
  workspace,
  requiresWriteAccess,
  evidenceItems: 2,
  promptKey: `lessons.${lessonSlug}.practice.brief`,
  observableActionCount: 3,
  selfCheckCriteriaCount: 2,
  completionKey: `cursor.lesson.${lessonSlug}`,
});

export const CURSOR_PRACTICES = [
  practice("orient-privacy", 10, "disposable", false),
  practice("tab-inline-edit", 12, "disposable", true),
  practice("agent-interface", 12, "disposable", false),
  practice("task-contracts", 15, "either", false),
  practice("plan-execute-steer", 18, "disposable", true),
  practice("test-review-recover", 20, "disposable", true),
  practice("rules-skills-mcp", 18, "disposable", true),
  practice("cloud-parallel", 18, "either", true),
  practice("software-studio", 25, "disposable", true),
  practice("research-studio", 20, "either", true),
  practice("writing-studio", 18, "either", true),
  practice("office-studio", 18, "either", false),
  practice("teaching-studio", 18, "either", false),
  practice("workflow-capstone", 60, "disposable", true),
] as const satisfies readonly CursorPracticeManifest[];

export const CURSOR_PRACTICE_BY_LESSON = Object.fromEntries(
  CURSOR_PRACTICES.map((item) => [item.lessonSlug, item]),
) as Readonly<Record<CursorLessonSlug, CursorPracticeManifest>>;
