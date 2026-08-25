import {
  CLAUDE_COURSE_ID,
  type ClaudeCourseManifest,
  type ClaudeLessonManifest,
  type ClaudeUnitManifest,
} from "./types";

export const CLAUDE_UNITS = [
  {
    id: "unit-1",
    order: 1,
    lessonSlugs: [
      "choose-your-surface",
      "describe-the-outcome",
      "iterate-with-examples",
      "discern-verify-protect",
    ],
  },
  {
    id: "unit-2",
    order: 2,
    lessonSlugs: [
      "work-with-files",
      "build-projects",
      "create-artifacts",
      "research-with-citations",
    ],
  },
  {
    id: "unit-3",
    order: 3,
    lessonSlugs: [
      "extend-with-tools",
      "delegate-with-cowork",
      "software-engineering",
    ],
  },
  {
    id: "unit-4",
    order: 4,
    lessonSlugs: [
      "research-and-data",
      "writing-and-office",
      "teaching-and-learning",
      "portfolio-capstone",
    ],
  },
] as const satisfies readonly ClaudeUnitManifest[];

function blocks(
  figureId: ClaudeLessonManifest["figureIds"][number],
  practiceId: ClaudeLessonManifest["practiceId"],
  sourceIds: ClaudeLessonManifest["sourceIds"],
): ClaudeLessonManifest["blocks"] {
  return [
    { type: "prose", sectionIndex: 0 },
    { type: "figure", figureId },
    { type: "prose", sectionIndex: 1 },
    { type: "prose", sectionIndex: 2 },
    { type: "exercise", practiceId },
    { type: "source-note", sourceIds },
  ];
}

export const CLAUDE_LESSONS = [
  {
    slug: "choose-your-surface", order: 1, unitId: "unit-1", minutes: 35, durationMinutes: 35,
    prerequisites: [], objectiveKeys: ["lessons.choose-your-surface.objective"], quizTags: ["surfaces", "task-fit"],
    practiceId: "practice-choose-your-surface", sourceIds: ["academy-catalog", "academy-claude-101", "academy-desktop", "github-claude-code"], quizIds: ["q01", "q02"], figureIds: ["fig-01"],
    blocks: blocks("fig-01", "practice-choose-your-surface", ["academy-catalog", "academy-claude-101", "academy-desktop", "github-claude-code"]),
  },
  {
    slug: "describe-the-outcome", order: 2, unitId: "unit-1", minutes: 45, durationMinutes: 45,
    prerequisites: ["choose-your-surface"], objectiveKeys: ["lessons.describe-the-outcome.objective"], quizTags: ["description", "prompt-contract"],
    practiceId: "practice-describe-the-outcome", sourceIds: ["academy-claude-101", "academy-fluency"], quizIds: ["q03", "q04"], figureIds: ["fig-02"],
    blocks: blocks("fig-02", "practice-describe-the-outcome", ["academy-claude-101", "academy-fluency"]),
  },
  {
    slug: "iterate-with-examples", order: 3, unitId: "unit-1", minutes: 40, durationMinutes: 40,
    prerequisites: ["describe-the-outcome"], objectiveKeys: ["lessons.iterate-with-examples.objective"], quizTags: ["iteration", "examples", "feedback"],
    practiceId: "practice-iterate-with-examples", sourceIds: ["academy-claude-101", "academy-fluency", "academy-artifacts", "github-claudeblattman"], quizIds: ["q05", "q06"], figureIds: ["fig-03"],
    blocks: blocks("fig-03", "practice-iterate-with-examples", ["academy-claude-101", "academy-fluency", "academy-artifacts", "github-claudeblattman"]),
  },
  {
    slug: "discern-verify-protect", order: 4, unitId: "unit-1", minutes: 50, durationMinutes: 50,
    prerequisites: ["iterate-with-examples"], objectiveKeys: ["lessons.discern-verify-protect.objective"], quizTags: ["discernment", "verification", "privacy", "prompt-injection"],
    practiceId: "practice-discern-verify-protect", sourceIds: ["academy-fluency", "support-tool-access", "support-connectors", "support-skills"], quizIds: ["q07", "q08"], figureIds: ["fig-04"],
    blocks: blocks("fig-04", "practice-discern-verify-protect", ["academy-fluency", "support-tool-access", "support-connectors", "support-skills"]),
  },
  {
    slug: "work-with-files", order: 5, unitId: "unit-2", minutes: 45, durationMinutes: 45,
    prerequisites: ["discern-verify-protect"], objectiveKeys: ["lessons.work-with-files.objective"], quizTags: ["files", "multimodal", "document-creation"],
    practiceId: "practice-work-with-files", sourceIds: ["academy-files", "support-files"], quizIds: ["q09", "q10"], figureIds: ["fig-05"],
    blocks: blocks("fig-05", "practice-work-with-files", ["academy-files", "support-files"]),
  },
  {
    slug: "build-projects", order: 6, unitId: "unit-2", minutes: 50, durationMinutes: 50,
    prerequisites: ["work-with-files"], objectiveKeys: ["lessons.build-projects.objective"], quizTags: ["projects", "knowledge", "instructions", "memory"],
    practiceId: "practice-build-projects", sourceIds: ["academy-projects", "support-projects", "github-claudeblattman"], quizIds: ["q11", "q12"], figureIds: ["fig-06"],
    blocks: blocks("fig-06", "practice-build-projects", ["academy-projects", "support-projects", "github-claudeblattman"]),
  },
  {
    slug: "create-artifacts", order: 7, unitId: "unit-2", minutes: 45, durationMinutes: 45,
    prerequisites: ["build-projects"], objectiveKeys: ["lessons.create-artifacts.objective"], quizTags: ["artifacts", "prototyping", "sharing"],
    practiceId: "practice-create-artifacts", sourceIds: ["academy-artifacts", "academy-claude-101", "support-artifacts"], quizIds: ["q13", "q14"], figureIds: ["fig-07"],
    blocks: blocks("fig-07", "practice-create-artifacts", ["academy-artifacts", "academy-claude-101", "support-artifacts"]),
  },
  {
    slug: "research-with-citations", order: 8, unitId: "unit-2", minutes: 60, durationMinutes: 60,
    prerequisites: ["create-artifacts"], objectiveKeys: ["lessons.research-with-citations.objective"], quizTags: ["research", "citations", "source-audit"],
    practiceId: "practice-research-with-citations", sourceIds: ["academy-research", "support-research", "github-cookbooks"], quizIds: ["q15", "q16"], figureIds: ["fig-08"],
    blocks: blocks("fig-08", "practice-research-with-citations", ["academy-research", "support-research", "github-cookbooks"]),
  },
  {
    slug: "extend-with-tools", order: 9, unitId: "unit-3", minutes: 50, durationMinutes: 50,
    prerequisites: ["research-with-citations"], objectiveKeys: ["lessons.extend-with-tools.objective"], quizTags: ["skills", "connectors", "permissions"],
    practiceId: "practice-extend-with-tools", sourceIds: ["academy-skills", "academy-connectors", "support-skills", "support-connectors", "github-anthropic-skills"], quizIds: ["q17", "q18"], figureIds: ["fig-09"],
    blocks: blocks("fig-09", "practice-extend-with-tools", ["academy-skills", "academy-connectors", "support-skills", "support-connectors", "github-anthropic-skills"]),
  },
  {
    slug: "delegate-with-cowork", order: 10, unitId: "unit-3", minutes: 60, durationMinutes: 60,
    prerequisites: ["extend-with-tools"], objectiveKeys: ["lessons.delegate-with-cowork.objective"], quizTags: ["cowork", "delegation", "approval"],
    practiceId: "practice-delegate-with-cowork", sourceIds: ["academy-cowork", "support-cowork", "support-cowork-architecture", "support-tool-access", "github-knowledge-work"], quizIds: ["q19", "q20"], figureIds: ["fig-10"],
    blocks: blocks("fig-10", "practice-delegate-with-cowork", ["academy-cowork", "support-cowork", "support-cowork-architecture", "support-tool-access", "github-knowledge-work"]),
  },
  {
    slug: "software-engineering", order: 11, unitId: "unit-3", minutes: 70, durationMinutes: 70,
    prerequisites: ["delegate-with-cowork"], objectiveKeys: ["lessons.software-engineering.objective"], quizTags: ["code", "tests", "review", "github"],
    practiceId: "practice-software-engineering", sourceIds: ["claude-pricing", "github-claude-code", "github-claude-code-action", "github-cwc-workshops", "github-superpowers"], quizIds: ["q21", "q22"], figureIds: ["fig-11"],
    blocks: blocks("fig-11", "practice-software-engineering", ["claude-pricing", "github-claude-code", "github-claude-code-action", "github-cwc-workshops", "github-superpowers"]),
  },
  {
    slug: "research-and-data", order: 12, unitId: "unit-4", minutes: 70, durationMinutes: 70,
    prerequisites: ["software-engineering"], objectiveKeys: ["lessons.research-and-data.objective"], quizTags: ["research", "data", "reproducibility"],
    practiceId: "practice-research-and-data", sourceIds: ["github-cookbooks", "github-academic-workflow", "academy-research"], quizIds: ["q23", "q24"], figureIds: ["fig-12"],
    blocks: blocks("fig-12", "practice-research-and-data", ["github-cookbooks", "github-academic-workflow", "academy-research"]),
  },
  {
    slug: "writing-and-office", order: 13, unitId: "unit-4", minutes: 70, durationMinutes: 70,
    prerequisites: ["research-and-data"], objectiveKeys: ["lessons.writing-and-office.objective"], quizTags: ["writing", "documents", "spreadsheets", "presentations"],
    practiceId: "practice-writing-and-office", sourceIds: ["academy-files", "academy-powerpoint", "github-knowledge-work", "github-paper-writing", "github-claudeblattman"], quizIds: ["q25", "q26"], figureIds: ["fig-13"],
    blocks: blocks("fig-13", "practice-writing-and-office", ["academy-files", "academy-powerpoint", "github-knowledge-work", "github-paper-writing", "github-claudeblattman"]),
  },
  {
    slug: "teaching-and-learning", order: 14, unitId: "unit-4", minutes: 60, durationMinutes: 60,
    prerequisites: ["writing-and-office"], objectiveKeys: ["lessons.teaching-and-learning.objective"], quizTags: ["teaching", "grounding", "learning"],
    practiceId: "practice-teaching-and-learning", sourceIds: ["academy-teachers", "github-k12-teacher-skills", "github-learning-opportunities", "github-academic-workflow"], quizIds: ["q27", "q28"], figureIds: ["fig-14"],
    blocks: blocks("fig-14", "practice-teaching-and-learning", ["academy-teachers", "github-k12-teacher-skills", "github-learning-opportunities", "github-academic-workflow"]),
  },
  {
    slug: "portfolio-capstone", order: 15, unitId: "unit-4", minutes: 120, durationMinutes: 120,
    prerequisites: ["teaching-and-learning"], objectiveKeys: ["lessons.portfolio-capstone.objective"], quizTags: ["capstone", "discernment", "handoff"],
    practiceId: "practice-portfolio-capstone", sourceIds: ["academy-fluency", "github-academic-workflow", "github-claudeblattman", "github-k12-teacher-skills"], quizIds: ["q29", "q30"], figureIds: ["fig-15"],
    blocks: blocks("fig-15", "practice-portfolio-capstone", ["academy-fluency", "github-academic-workflow", "github-claudeblattman", "github-k12-teacher-skills"]),
  },
] as const satisfies readonly ClaudeLessonManifest[];

export const CLAUDE_COURSE_MANIFEST = {
  id: CLAUDE_COURSE_ID,
  version: "1.0.0",
  preparedOn: "2026-08-23",
  publicationStatus: "rights-gated",
  publishedOn: null,
  sourceSnapshotOn: "2026-08-24",
  units: CLAUDE_UNITS,
  lessons: CLAUDE_LESSONS,
} as const satisfies ClaudeCourseManifest;
