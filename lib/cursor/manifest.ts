import {
  CURSOR_COURSE_ID,
  type CursorCourseManifest,
  type CursorLessonManifest,
  type CursorUnitManifest,
} from "./types";

export const CURSOR_UNITS = [
  { id: "unit-1", order: 1, lessonSlugs: ["orient-privacy", "tab-inline-edit", "agent-interface", "task-contracts"] },
  { id: "unit-2", order: 2, lessonSlugs: ["plan-execute-steer", "test-review-recover", "rules-skills-mcp", "cloud-parallel"] },
  { id: "unit-3", order: 3, lessonSlugs: ["software-studio", "research-studio", "writing-studio", "office-studio"] },
  { id: "unit-4", order: 4, lessonSlugs: ["teaching-studio", "workflow-capstone"] },
] as const satisfies readonly CursorUnitManifest[];

const lesson = (
  value: Omit<CursorLessonManifest, "durationMinutes" | "objectiveKeys" | "blocks">,
): CursorLessonManifest => ({
  ...value,
  durationMinutes: value.minutes,
  objectiveKeys: [`lessons.${value.slug}.objective`],
  blocks: [
    { type: "prose", sectionIndex: 0 },
    { type: "figure", figureId: value.figureIds[0] },
    { type: "prose", sectionIndex: 1 },
    { type: "prose", sectionIndex: 2 },
    { type: "exercise", practiceId: value.practiceId },
    { type: "source-note", sourceIds: value.sourceIds },
  ],
});

export const CURSOR_LESSONS = [
  lesson({
    slug: "orient-privacy", order: 1, unitId: "unit-1", minutes: 40,
    prerequisites: [], practiceId: "practice-orient-privacy", quizIds: ["q01", "q02"],
    quizTags: ["orientation", "privacy", "run-modes"], figureIds: ["fig-01"],
    sourceIds: ["cursor-quickstart", "cursor-download", "cursor-cli", "cursor-data-use", "cursor-run-modes", "cursor-security-hardening", "cursor-agent-security", "cursor-agents-window", "cursor-product"],
  }),
  lesson({
    slug: "tab-inline-edit", order: 2, unitId: "unit-1", minutes: 45,
    prerequisites: ["orient-privacy"], practiceId: "practice-tab-inline-edit", quizIds: ["q03", "q04"],
    quizTags: ["tab", "inline-edit", "micro-edits"], figureIds: ["fig-02"],
    sourceIds: ["cursor-tab", "cursor-inline-edit", "cursor-product"],
  }),
  lesson({
    slug: "agent-interface", order: 3, unitId: "unit-1", minutes: 50,
    prerequisites: ["tab-inline-edit"], practiceId: "practice-agent-interface", quizIds: ["q05", "q06"],
    quizTags: ["agent", "tools", "context-window"], figureIds: ["fig-03"],
    sourceIds: ["cursor-agent-overview", "cursor-agents-window", "cursor-side-chat", "cursor-prompting", "cursor-learn-understand"],
  }),
  lesson({
    slug: "task-contracts", order: 4, unitId: "unit-1", minutes: 55,
    prerequisites: ["agent-interface"], practiceId: "practice-task-contracts", quizIds: ["q07", "q08"],
    quizTags: ["prompting", "context", "acceptance"], figureIds: ["fig-04"],
    sourceIds: ["cursor-prompting", "cursor-planning", "cursor-learn-features"],
  }),
  lesson({
    slug: "plan-execute-steer", order: 5, unitId: "unit-2", minutes: 60,
    prerequisites: ["task-contracts"], practiceId: "practice-plan-execute-steer", quizIds: ["q09", "q10"],
    quizTags: ["plan-mode", "steering", "verification"], figureIds: ["fig-05"],
    sourceIds: ["cursor-planning", "cursor-plan-mode-blog", "cursor-shell", "cursor-learn-features", "github-spec-kit"],
  }),
  lesson({
    slug: "test-review-recover", order: 6, unitId: "unit-2", minutes: 60,
    prerequisites: ["plan-execute-steer"], practiceId: "practice-test-review-recover", quizIds: ["q11", "q12"],
    quizTags: ["debugging", "testing", "review", "recovery"], figureIds: ["fig-06"],
    sourceIds: ["cursor-agent-review", "cursor-debugging", "cursor-learn-debug", "cursor-learn-review", "cursor-run-modes", "github-superpowers"],
  }),
  lesson({
    slug: "rules-skills-mcp", order: 7, unitId: "unit-2", minutes: 55,
    prerequisites: ["test-review-recover"], practiceId: "practice-rules-skills-mcp", quizIds: ["q13", "q14"],
    quizTags: ["rules", "agents-md", "skills", "mcp"], figureIds: ["fig-07"],
    sourceIds: ["cursor-rules", "cursor-skills", "cursor-plugins", "cursor-hooks", "cursor-mcp", "github-agents-md", "github-tutor"],
  }),
  lesson({
    slug: "cloud-parallel", order: 8, unitId: "unit-2", minutes: 55,
    prerequisites: ["rules-skills-mcp"], practiceId: "practice-cloud-parallel", quizIds: ["q15", "q16"],
    quizTags: ["cloud-agents", "subagents", "automation", "isolation"], figureIds: ["fig-08"],
    sourceIds: ["cursor-subagents", "cursor-worktrees", "cursor-run-modes", "cursor-hooks", "cursor-cloud-agents", "cursor-cloud-builds", "cursor-cloud-best-practices", "cursor-automations", "cursor-changelog-2026-08"],
  }),
  lesson({
    slug: "software-studio", order: 9, unitId: "unit-3", minutes: 65,
    prerequisites: ["cloud-parallel"], practiceId: "practice-software-studio", quizIds: ["q17", "q18"],
    quizTags: ["software-engineering", "browser", "evidence"], figureIds: ["fig-09"],
    sourceIds: ["cursor-browser", "cursor-learn-features", "cursor-learn-review", "cursor-rules", "cursor-skills", "github-metamask-design", "github-alibaba-hooks"],
  }),
  lesson({
    slug: "research-studio", order: 10, unitId: "unit-3", minutes: 60,
    prerequisites: ["software-studio"], practiceId: "practice-research-studio", quizIds: ["q19", "q20"],
    quizTags: ["research", "data", "provenance", "reproducibility"], figureIds: ["fig-10"],
    sourceIds: ["cursor-prompting", "cursor-browser", "cursor-rules", "github-domain-agent"],
  }),
  lesson({
    slug: "writing-studio", order: 11, unitId: "unit-3", minutes: 55,
    prerequisites: ["research-studio"], practiceId: "practice-writing-studio", quizIds: ["q21", "q22"],
    quizTags: ["writing", "revision", "voice", "fact-checking"], figureIds: ["fig-11"],
    sourceIds: ["cursor-prompting", "cursor-rules", "github-strapi-docs"],
  }),
  lesson({
    slug: "office-studio", order: 12, unitId: "unit-3", minutes: 55,
    prerequisites: ["writing-studio"], practiceId: "practice-office-studio", quizIds: ["q23", "q24"],
    quizTags: ["office", "workspace", "plugins", "approval"], figureIds: ["fig-12"],
    sourceIds: ["cursor-google-workspace", "cursor-data-use", "cursor-run-modes", "cursor-skills", "cursor-mcp", "github-product-managers", "github-plaintext-crm"],
  }),
  lesson({
    slug: "teaching-studio", order: 13, unitId: "unit-4", minutes: 55,
    prerequisites: ["office-studio"], practiceId: "practice-teaching-studio", quizIds: ["q25", "q26"],
    quizTags: ["teaching", "learning", "assessment", "integrity"], figureIds: ["fig-13"],
    sourceIds: ["cursor-students", "cursor-data-use", "cursor-learn-understand", "cursor-rules", "github-tutor", "github-cursor-workshop"],
  }),
  lesson({
    slug: "workflow-capstone", order: 14, unitId: "unit-4", minutes: 90,
    prerequisites: ["teaching-studio"], practiceId: "practice-workflow-capstone", quizIds: ["q27", "q28"],
    quizTags: ["capstone", "scope", "verification", "handoff"], figureIds: ["fig-14"],
    sourceIds: ["cursor-quickstart", "cursor-planning", "cursor-agent-review", "cursor-run-modes", "cursor-cloud-builds", "cursor-cloud-best-practices", "course-capstone-fixture", "github-superpowers", "github-alibaba-hooks"],
  }),
] as const satisfies readonly CursorLessonManifest[];

export const CURSOR_COURSE_MANIFEST = {
  id: CURSOR_COURSE_ID,
  version: "1.0.0",
  preparedOn: "2026-08-23",
  publicationStatus: "rights-gated",
  publishedOn: null,
  sourceSnapshotOn: "2026-08-23",
  units: CURSOR_UNITS,
  lessons: CURSOR_LESSONS,
} as const satisfies CursorCourseManifest;

export const CURSOR_LESSON_BY_SLUG = Object.fromEntries(
  CURSOR_LESSONS.map((item) => [item.slug, item]),
) as unknown as Readonly<Record<(typeof CURSOR_LESSONS)[number]["slug"], CursorLessonManifest>>;
