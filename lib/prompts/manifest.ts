import {
  PROMPT_COURSE_ID,
  PROMPT_SOURCE_SNAPSHOT_ON,
  type PromptCourseManifest,
  type PromptLessonManifest,
  type PromptUnitManifest,
} from "./types";

export const PROMPT_UNITS = [
  {
    id: "specify",
    order: 1,
    lessonSlugs: [
      "prompts-are-specifications",
      "six-part-prompt",
      "instructions-and-data",
    ],
  },
  {
    id: "test",
    order: 2,
    lessonSlugs: [
      "examples-and-contracts",
      "four-prompt-jobs",
      "evaluation-flywheel",
    ],
  },
  {
    id: "system",
    order: 3,
    lessonSlugs: [
      "decompose-and-chain",
      "grounding-and-safety",
      "capstone-prompt-packet",
    ],
  },
] as const satisfies readonly PromptUnitManifest[];

export const PROMPT_LESSONS = [
  {
    slug: "prompts-are-specifications",
    order: 1,
    unitId: "specify",
    minutes: 25,
    figureKind: "pipeline",
    sourceIds: [
      "dlai-ai-prompting-for-everyone",
      "dlai-prompt-engineering-course",
      "dlai-batch-course-announcement",
      "openai-chatgpt-prompt-guide",
      "anthropic-prompt-engineering-overview",
      "microsoft-prompt-engineering-fundamentals",
    ],
  },
  {
    slug: "six-part-prompt",
    order: 2,
    unitId: "specify",
    minutes: 35,
    figureKind: "workbench",
    sourceIds: [
      "openai-chatgpt-prompt-guide",
      "openai-latest-model-guidance",
      "openai-structured-outputs-guide",
      "google-prompt-design-strategies",
      "microsoft-advanced-prompts",
    ],
  },
  {
    slug: "instructions-and-data",
    order: 3,
    unitId: "specify",
    minutes: 30,
    figureKind: "authority",
    sourceIds: [
      "openai-model-spec-untrusted-data",
      "openai-chatgpt-prompt-guide",
      "anthropic-prompting-best-practices",
      "anthropic-interactive-prompt-tutorial",
    ],
  },
  {
    slug: "examples-and-contracts",
    order: 4,
    unitId: "test",
    minutes: 35,
    figureKind: "few-shot",
    sourceIds: [
      "google-prompt-design-strategies",
      "openai-structured-outputs-guide",
      "anthropic-prompting-best-practices",
      "microsoft-prompt-engineering-fundamentals",
      "microsoft-advanced-prompts",
      "dair-prompt-engineering-guide",
      "anthropic-interactive-prompt-tutorial",
    ],
  },
  {
    slug: "four-prompt-jobs",
    order: 5,
    unitId: "test",
    minutes: 40,
    figureKind: "four-jobs",
    sourceIds: [
      "dlai-prompt-engineering-course",
      "dlai-batch-course-announcement",
      "openai-chatgpt-prompt-guide",
    ],
  },
  {
    slug: "evaluation-flywheel",
    order: 6,
    unitId: "test",
    minutes: 45,
    figureKind: "evaluation-loop",
    sourceIds: [
      "openai-prompt-evaluation-flywheel",
      "openai-chatgpt-prompt-guide",
      "anthropic-prompt-engineering-overview",
      "microsoft-prompt-engineering-fundamentals",
    ],
  },
  {
    slug: "decompose-and-chain",
    order: 7,
    unitId: "system",
    minutes: 40,
    figureKind: "chain",
    sourceIds: [
      "google-prompt-design-strategies",
      "anthropic-prompting-best-practices",
      "anthropic-prompt-engineering-overview",
      "microsoft-advanced-prompts",
      "anthropic-interactive-prompt-tutorial",
    ],
  },
  {
    slug: "grounding-and-safety",
    order: 8,
    unitId: "system",
    minutes: 45,
    figureKind: "evidence",
    sourceIds: [
      "openai-chatgpt-prompt-guide",
      "dlai-ai-prompting-for-everyone",
      "openai-model-spec-untrusted-data",
      "openai-agent-builder-safety",
      "anthropic-jailbreak-prompt-injection-mitigation",
      "openai-latest-model-guidance",
    ],
  },
  {
    slug: "capstone-prompt-packet",
    order: 9,
    unitId: "system",
    minutes: 70,
    figureKind: "capstone",
    sourceIds: [
      "openai-prompt-evaluation-flywheel",
      "dlai-prompt-engineering-course",
      "openai-chatgpt-prompt-guide",
      "dlai-course-materials-policy",
    ],
  },
] as const satisfies readonly PromptLessonManifest[];

export const PROMPT_COURSE_MANIFEST = {
  id: PROMPT_COURSE_ID,
  version: "1.1.0",
  displayNumber: 7,
  publishedOn: "2026-08-23",
  sourceSnapshotOn: PROMPT_SOURCE_SNAPSHOT_ON,
  finalQuizMinutes: 15,
  units: PROMPT_UNITS,
  lessons: PROMPT_LESSONS,
} as const satisfies PromptCourseManifest;
