import {
  CODEX_COURSE_ID,
  type CodexCourseManifest,
  type CodexLessonManifest,
  type CodexUnitManifest,
} from "./types";

export const CODEX_UNITS = [
  { id: "unit-1", order: 1, lessonSlugs: ["meet-codex", "task-contracts", "environments-permissions", "ground-plan"] },
  { id: "unit-2", order: 2, lessonSlugs: ["implement-steer", "debug-test", "review-diff", "agents-skills"] },
  { id: "unit-3", order: 3, lessonSlugs: ["cli", "ide", "cloud-parallel"] },
  { id: "unit-4", order: 4, lessonSlugs: ["automation-capstone"] },
] as const satisfies readonly CodexUnitManifest[];

export const CODEX_LESSONS = [
  {
    slug: "meet-codex", order: 1, unitId: "unit-1", minutes: 35, durationMinutes: 35,
    prerequisites: [], objectiveKeys: ["lessons.meet-codex.objective"], quizTags: ["surfaces", "authentication"],
    practiceId: "practice-meet-codex", sourceIds: ["openai-app", "openai-auth", "openai-quickstart", "github-openai-codex"], quizIds: ["q01", "q02"], figureIds: ["fig-01", "fig-02"],
    blocks: [
      { type: "prose", sectionIndex: 0 }, { type: "figure", figureId: "fig-01" },
      { type: "prose", sectionIndex: 1 }, { type: "figure", figureId: "fig-02" },
      { type: "prose", sectionIndex: 2 }, { type: "exercise", practiceId: "practice-meet-codex" },
      { type: "source-note", sourceIds: ["openai-app", "openai-auth", "openai-quickstart", "github-openai-codex"] },
    ],
  },
  {
    slug: "task-contracts", order: 2, unitId: "unit-1", minutes: 40, durationMinutes: 40,
    prerequisites: ["meet-codex"], objectiveKeys: ["lessons.task-contracts.objective"], quizTags: ["task-contract", "acceptance"],
    practiceId: "practice-task-contracts", sourceIds: ["openai-prompting", "github-openai-cookbook"], quizIds: ["q03", "q04"], figureIds: ["fig-03"],
    blocks: [
      { type: "prose", sectionIndex: 0 }, { type: "figure", figureId: "fig-03" },
      { type: "prose", sectionIndex: 1 }, { type: "prose", sectionIndex: 2 },
      { type: "exercise", practiceId: "practice-task-contracts" },
      { type: "source-note", sourceIds: ["openai-prompting", "github-openai-cookbook"] },
    ],
  },
  {
    slug: "environments-permissions", order: 3, unitId: "unit-1", minutes: 45, durationMinutes: 45,
    prerequisites: ["task-contracts"], objectiveKeys: ["lessons.environments-permissions.objective"], quizTags: ["permissions", "environments", "secrets"],
    practiceId: "practice-environments-permissions", sourceIds: ["openai-permissions", "openai-environment-modes", "openai-local-environment", "openai-cloud-environment", "openai-worktrees"], quizIds: ["q05", "q06"], figureIds: ["fig-04", "fig-06"],
    blocks: [
      { type: "prose", sectionIndex: 0 }, { type: "figure", figureId: "fig-04" },
      { type: "prose", sectionIndex: 1 }, { type: "figure", figureId: "fig-06" },
      { type: "prose", sectionIndex: 2 }, { type: "exercise", practiceId: "practice-environments-permissions" },
      { type: "source-note", sourceIds: ["openai-permissions", "openai-environment-modes", "openai-local-environment", "openai-cloud-environment", "openai-worktrees"] },
    ],
  },
  {
    slug: "ground-plan", order: 4, unitId: "unit-1", minutes: 50, durationMinutes: 50,
    prerequisites: ["environments-permissions"], objectiveKeys: ["lessons.ground-plan.objective"], quizTags: ["orientation", "planning"],
    practiceId: "practice-ground-plan", sourceIds: ["openai-projects", "openai-prompting", "openai-agents-md", "github-openai-cookbook", "github-spec-kit"], quizIds: ["q07", "q08"], figureIds: ["fig-05"],
    blocks: [
      { type: "prose", sectionIndex: 0 }, { type: "figure", figureId: "fig-05" },
      { type: "prose", sectionIndex: 1 }, { type: "prose", sectionIndex: 2 },
      { type: "exercise", practiceId: "practice-ground-plan" },
      { type: "source-note", sourceIds: ["openai-projects", "openai-prompting", "openai-agents-md", "github-openai-cookbook", "github-spec-kit"] },
    ],
  },
  {
    slug: "implement-steer", order: 5, unitId: "unit-2", minutes: 45, durationMinutes: 45,
    prerequisites: ["ground-plan"], objectiveKeys: ["lessons.implement-steer.objective"], quizTags: ["steering", "goals"],
    practiceId: "practice-implement-steer", sourceIds: ["openai-long-running-work", "openai-app", "github-openai-cookbook"], quizIds: ["q09", "q10"], figureIds: ["fig-08"],
    blocks: [
      { type: "prose", sectionIndex: 0 }, { type: "figure", figureId: "fig-08" },
      { type: "prose", sectionIndex: 1 }, { type: "prose", sectionIndex: 2 },
      { type: "exercise", practiceId: "practice-implement-steer" },
      { type: "source-note", sourceIds: ["openai-long-running-work", "openai-app", "github-openai-cookbook"] },
    ],
  },
  {
    slug: "debug-test", order: 6, unitId: "unit-2", minutes: 55, durationMinutes: 55,
    prerequisites: ["implement-steer"], objectiveKeys: ["lessons.debug-test.objective"], quizTags: ["debugging", "testing", "tdd"],
    practiceId: "practice-debug-test", sourceIds: ["openai-prompting", "openai-code-review", "github-superpowers"], quizIds: ["q11", "q12"], figureIds: ["fig-07", "fig-09"],
    blocks: [
      { type: "prose", sectionIndex: 0 }, { type: "figure", figureId: "fig-07" },
      { type: "prose", sectionIndex: 1 }, { type: "figure", figureId: "fig-09" },
      { type: "prose", sectionIndex: 2 }, { type: "exercise", practiceId: "practice-debug-test" },
      { type: "source-note", sourceIds: ["openai-prompting", "openai-code-review", "github-superpowers"] },
    ],
  },
  {
    slug: "review-diff", order: 7, unitId: "unit-2", minutes: 45, durationMinutes: 45,
    prerequisites: ["debug-test"], objectiveKeys: ["lessons.review-diff.objective"], quizTags: ["diff", "review"],
    practiceId: "practice-review-diff", sourceIds: ["openai-code-review", "openai-app", "github-superpowers"], quizIds: ["q13", "q14"], figureIds: ["fig-10", "fig-11", "fig-12"],
    blocks: [
      { type: "prose", sectionIndex: 0 }, { type: "figure", figureId: "fig-10" },
      { type: "prose", sectionIndex: 1 }, { type: "figure", figureId: "fig-11" },
      { type: "prose", sectionIndex: 2 }, { type: "figure", figureId: "fig-12" },
      { type: "exercise", practiceId: "practice-review-diff" },
      { type: "source-note", sourceIds: ["openai-code-review", "openai-app", "github-superpowers"] },
    ],
  },
  {
    slug: "agents-skills", order: 8, unitId: "unit-2", minutes: 50, durationMinutes: 50,
    prerequisites: ["review-diff"], objectiveKeys: ["lessons.agents-skills.objective"], quizTags: ["agents-md", "skills", "subagents"],
    practiceId: "practice-agents-skills", sourceIds: ["openai-agents-md", "openai-subagents", "openai-build-skills", "openai-hooks", "openai-permissions", "github-openai-codex", "github-agents-md"], quizIds: ["q15", "q16"], figureIds: ["fig-22"],
    blocks: [
      { type: "prose", sectionIndex: 0 }, { type: "figure", figureId: "fig-22" },
      { type: "prose", sectionIndex: 1 }, { type: "prose", sectionIndex: 2 },
      { type: "exercise", practiceId: "practice-agents-skills" },
      { type: "source-note", sourceIds: ["openai-agents-md", "openai-subagents", "openai-build-skills", "openai-hooks", "openai-permissions", "github-openai-codex", "github-agents-md"] },
    ],
  },
  {
    slug: "cli", order: 9, unitId: "unit-3", minutes: 55, durationMinutes: 55,
    prerequisites: ["agents-skills"], objectiveKeys: ["lessons.cli.objective"], quizTags: ["cli", "codex-exec"],
    practiceId: "practice-cli", sourceIds: ["openai-cli", "openai-auth", "openai-developer-commands", "openai-noninteractive", "github-openai-codex"], quizIds: ["q17", "q18"], figureIds: ["fig-13", "fig-14", "fig-15"],
    blocks: [
      { type: "prose", sectionIndex: 0 }, { type: "figure", figureId: "fig-13" },
      { type: "prose", sectionIndex: 1 }, { type: "figure", figureId: "fig-14" },
      { type: "prose", sectionIndex: 2 }, { type: "figure", figureId: "fig-15" },
      { type: "exercise", practiceId: "practice-cli" },
      { type: "source-note", sourceIds: ["openai-cli", "openai-auth", "openai-developer-commands", "openai-noninteractive", "github-openai-codex"] },
    ],
  },
  {
    slug: "ide", order: 10, unitId: "unit-3", minutes: 50, durationMinutes: 50,
    prerequisites: ["cli"], objectiveKeys: ["lessons.ide.objective"], quizTags: ["ide", "selected-context"],
    practiceId: "practice-ide", sourceIds: ["openai-ide", "openai-cli", "openai-developer-commands", "openai-app"], quizIds: ["q19", "q20"], figureIds: ["fig-16", "fig-17", "fig-18"],
    blocks: [
      { type: "prose", sectionIndex: 0 }, { type: "figure", figureId: "fig-16" },
      { type: "prose", sectionIndex: 1 }, { type: "figure", figureId: "fig-17" },
      { type: "prose", sectionIndex: 2 }, { type: "figure", figureId: "fig-18" },
      { type: "exercise", practiceId: "practice-ide" },
      { type: "source-note", sourceIds: ["openai-ide", "openai-cli", "openai-developer-commands", "openai-app"] },
    ],
  },
  {
    slug: "cloud-parallel", order: 11, unitId: "unit-3", minutes: 60, durationMinutes: 60,
    prerequisites: ["ide"], objectiveKeys: ["lessons.cloud-parallel.objective"], quizTags: ["cloud", "worktrees", "parallelism", "automations"],
    practiceId: "practice-cloud-parallel", sourceIds: ["openai-app", "openai-integrated-terminal", "openai-cloud", "openai-cloud-environment", "openai-worktrees", "openai-subagents", "openai-long-running-work", "openai-automations"], quizIds: ["q21"], figureIds: ["fig-19", "fig-20", "fig-21", "fig-23"],
    blocks: [
      { type: "prose", sectionIndex: 0 }, { type: "figure", figureId: "fig-19" },
      { type: "prose", sectionIndex: 1 }, { type: "figure", figureId: "fig-20" },
      { type: "prose", sectionIndex: 2 }, { type: "figure", figureId: "fig-21" }, { type: "figure", figureId: "fig-23" },
      { type: "exercise", practiceId: "practice-cloud-parallel" },
      { type: "source-note", sourceIds: ["openai-app", "openai-integrated-terminal", "openai-cloud", "openai-cloud-environment", "openai-worktrees", "openai-subagents", "openai-long-running-work", "openai-automations"] },
    ],
  },
  {
    slug: "automation-capstone", order: 12, unitId: "unit-4", minutes: 130, durationMinutes: 130,
    prerequisites: ["cloud-parallel"], objectiveKeys: ["lessons.automation-capstone.objective"], quizTags: ["automation", "github-action", "capstone"],
    practiceId: "practice-automation-capstone", sourceIds: ["openai-automations", "openai-github-action", "openai-noninteractive", "github-openai-codex-action", "github-openspec"], quizIds: ["q22", "q23", "q24"], figureIds: ["fig-24"],
    blocks: [
      { type: "prose", sectionIndex: 0 }, { type: "figure", figureId: "fig-24" },
      { type: "prose", sectionIndex: 1 }, { type: "prose", sectionIndex: 2 },
      { type: "exercise", practiceId: "practice-automation-capstone" },
      { type: "source-note", sourceIds: ["openai-automations", "openai-github-action", "openai-noninteractive", "github-openai-codex-action", "github-openspec"] },
    ],
  },
] as const satisfies readonly CodexLessonManifest[];

export const CODEX_COURSE_MANIFEST = {
  id: CODEX_COURSE_ID,
  version: "1.0.12",
  publishedOn: "2026-08-21",
  sourceSnapshotOn: "2026-08-24",
  units: CODEX_UNITS,
  lessons: CODEX_LESSONS,
} as const satisfies CodexCourseManifest;
