/**
 * The public learning catalogue.
 *
 * The catalogue has two layers. `TOP_LEVEL_COURSES` preserves released course
 * contracts used by structured data and the existing progress UI.
 * `CATALOG_COURSES` is the broader, presentation-ready
 * directory: released courses plus honest, non-linkable previews of planned
 * AI learning paths.
 */

import { isCodexQuizPassed } from "./codex/quiz";
import { AGENTIC_PROGRESS_EVENT } from "./progress";
import {
  AI_TUTOR_COURSE_MANIFEST,
  AI_TUTOR_PROGRESS_EVENT,
  aiTutorProgressPercent,
} from "./ai-tutor";
import {
  PRODUCT_MANAGEMENT_COURSE_MANIFEST,
  PRODUCT_MANAGEMENT_PROGRESS_EVENT,
  productManagementProgressPercent,
} from "./product-management";
import {
  AGENT_ORCHESTRATION_COURSE_MANIFEST,
  AGENT_ORCHESTRATION_PROGRESS_EVENT,
  agentOrchestrationProgressPercent,
} from "./agent-orchestration";
import {
  MATH_ANIMATION_COURSE_MANIFEST,
  MATH_ANIMATION_PROGRESS_EVENT,
  MATH_ANIMATION_TOTAL_MINUTES,
  mathAnimationProgressPercent,
} from "./math-animation";
import { CLAUDE_COURSE_MANIFEST } from "./claude/manifest";
import { claudeProgressPercent } from "./claude/progress";
import { CLAUDE_INCOME_COURSE } from "./claude-income/curriculum";
import { CLAUDE_INCOME_FINAL_QUIZ } from "./claude-income/quiz";
import { CURSOR_COURSE_MANIFEST } from "./cursor/manifest";
import {
  CURSOR_PROGRESS_EVENT,
  CURSOR_PROGRESS_STORAGE_KEY,
  cursorProgressPercent,
} from "./cursor/progress";
import { GITHUB_COURSE_MANIFEST } from "./github/manifest";
import { isGithubQuizPassed } from "./github/quiz";
import { GROK_COURSE_MANIFEST } from "./grok/data";
import { GROK_PROGRESS_STORAGE_KEY, grokProgressPercent } from "./grok/progress";
import {
  MAKE_MONEY_WITH_CODEX_CAPSTONE_ITEM_COUNT,
  MAKE_MONEY_WITH_CODEX_COURSE_VERSION,
  MAKE_MONEY_WITH_CODEX_LESSON_SLUGS,
  MAKE_MONEY_WITH_CODEX_LEVEL,
  MAKE_MONEY_WITH_CODEX_PROGRESS_VERSION_KEY,
  MAKE_MONEY_WITH_CODEX_QUIZ_VERSION,
} from "./make-money-with-codex/types";
import { MCP_ASSESSMENT_VERSION, MCP_LESSONS } from "./mcp";
import { PROMPT_COURSE_MANIFEST } from "./prompts/manifest";
import { PROMPT_CAPSTONE_KEY, PROMPT_QUIZ_PASSED_KEY } from "./prompts/progress-keys";
import { RAG_COURSE_MANIFEST } from "./rag/manifest";
import { SOFTWARE_ENGINEERING_COURSE_MANIFEST } from "./software-engineering/manifest";
import { isSoftwareEngineeringCapstoneSubmission } from "./software-engineering/capstone";
import { isSoftwareEngineeringQuizPassed } from "./software-engineering/quiz";

export type Level = "beginner" | "intermediate" | "advanced";
export type Format = "read" | "interactive" | "code";
export type Topic = "foundations" | "prompting" | "agents" | "evaluation" | "safety";
export type Status = "available" | "soon";
export type CourseId = "handbook" | "lab" | "build" | "tools" | "cost" | "hitl";

export interface CourseModule {
  id: string;
  /** Path relative to the locale root, or an absolute URL. */
  href: string;
  external?: boolean;
  level: Level;
  format: Format;
  topic: Topic;
  minutes: number;
  status: Status;
  /** CSS custom property carrying this module's hue. */
  hue: string;
  /** How to read this module's progress out of localStorage. */
  progress: (p: Record<string, unknown>, sectionsSeen: number) => number;
}

/** Backwards-compatible name for code that still treats modules as courses. */
export type Course = CourseModule;

export interface TopLevelCourse {
  id:
    | "agentic"
    | "codex"
    | "claude"
    | "cursor"
    | "grok"
    | "github"
    | "prompts"
    | "software-engineering"
    | "rag"
    | "mcp"
    | "make-money-with-codex"
    | "claude-income"
    | "ai-tutor"
    | "product-management"
    | "agent-orchestration"
    | "math-animation";
  displayNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 19;
  href: string;
  minutes: number;
  durationMinutes: number;
  status: "available";
  hue: string;
  level: "beginner-to-intermediate" | "intermediate-to-advanced" | "beginner-to-advanced";
  moduleIds: string[];
  outcomeKeys: string[];
  progressStrategy:
    | "module-average"
    | "fourteen-equal-milestones"
    | "sixteen-equal-milestones"
    | "seventeen-equal-milestones"
    | "eleven-equal-milestones"
    | "ten-equal-milestones"
    | "twenty-equal-milestones";
  /** Browser store supplied to the progress adapter; defaults to `ae.progress`. */
  progressStorageKey?: string;
  /** Same-tab invalidation event emitted by this course's progress store. */
  progressEvent?: string;
  progress: (p: Record<string, unknown>, sectionsSeen: number) => number;
}

export type CatalogCourseId =
  | TopLevelCourse["id"]
  | "ai-research"
  | "ai-teaching"
  | "responsible-ai";

export type CatalogTopic =
  | "ai-systems"
  | "coding-assistants"
  | "collaboration"
  | "prompting"
  | "research"
  | "business"
  | "teaching"
  | "responsible-ai";

export type CatalogLevel =
  | Level
  | "beginner-to-intermediate"
  | "intermediate-to-advanced"
  | "beginner-to-advanced";

export type CatalogFormat = "mixed" | "guided" | "project-based";

export type CatalogProgressAdapter = (
  progress: Record<string, unknown>,
  sectionsSeen: number,
) => number;

/** One top-level card in the searchable public course directory. */
export interface CatalogCourse {
  id: CatalogCourseId;
  /** Public sequence number, when the course has a released curriculum contract. */
  displayNumber?: TopLevelCourse["displayNumber"];
  /** Relative to the locale root. Upcoming records deliberately use `#`. */
  href: string;
  external?: boolean;
  titleKey: string;
  blurbKey: string;
  /** Optional translated curriculum summary, for example lesson count and study time. */
  metaKey?: string;
  topic: CatalogTopic;
  topicKey: string;
  level: CatalogLevel;
  levelKey: string;
  format: CatalogFormat;
  formatKey: string;
  /** Null means the curriculum is not released enough to promise a duration. */
  minutes: number | null;
  status: Status;
  hue: string;
  /** Only released courses expose a browser-progress adapter. */
  progress?: CatalogProgressAdapter;
  /** Browser store supplied to the progress adapter; defaults to `ae.progress`. */
  progressStorageKey?: string;
  /** Same-tab invalidation event emitted by this course's progress store. */
  progressEvent?: string;
}

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)));
const MAKE_MONEY_WITH_CODEX_DURATION_MINUTES = 630;
const PROMPT_COURSE_DURATION_MINUTES = PROMPT_COURSE_MANIFEST.lessons.reduce<number>(
  (sum, lesson) => sum + lesson.minutes,
  PROMPT_COURSE_MANIFEST.finalQuizMinutes,
);

export const COURSE_MODULES: CourseModule[] = [
  {
    id: "handbook", href: "/handbook/", level: "beginner", format: "read",
    topic: "foundations", minutes: 45, status: "available", hue: "var(--brand)",
    progress: (_p, seen) => clamp((seen / 11) * 100),
  },
  {
    id: "lab", href: "/lab/", level: "beginner", format: "interactive",
    topic: "prompting", minutes: 40, status: "available", hue: "var(--green)",
    progress: (p) => {
      const done = ["play0", "play1", "play2", "play3"].filter((key) => p[key]).length;
      return clamp((done / 4) * 100);
    },
  },
  {
    id: "build", href: "/build/",
    level: "intermediate", format: "code", topic: "agents",
    minutes: 150, status: "available", hue: "var(--violet)",
    progress: (p) => (p.part2 ? 100 : 0),
  },
];

export const UPCOMING_MODULES: CourseModule[] = [
  {
    id: "tools", href: "#", level: "advanced", format: "code", topic: "agents",
    minutes: 60, status: "soon", hue: "var(--gold-mark)", progress: () => 0,
  },
  {
    id: "cost", href: "#", level: "intermediate", format: "interactive",
    topic: "evaluation", minutes: 30, status: "soon", hue: "var(--red)",
    progress: () => 0,
  },
  {
    id: "hitl", href: "#", level: "intermediate", format: "read", topic: "safety",
    minutes: 35, status: "soon", hue: "var(--brand-2)", progress: () => 0,
  },
];

export const CODEX_LESSON_PROGRESS_KEYS = [
  "meet-codex",
  "task-contracts",
  "environments-permissions",
  "ground-plan",
  "implement-steer",
  "debug-test",
  "review-diff",
  "agents-skills",
  "cli",
  "ide",
  "cloud-parallel",
  "automation-capstone",
].map((slug) => `codex.lesson.${slug}`);

export function codexProgress(p: Record<string, unknown>): number {
  const lessonMilestones = CODEX_LESSON_PROGRESS_KEYS.filter((key) => p[key] === true).length;
  const quiz = isCodexQuizPassed(p) ? 1 : 0;
  const capstone = p["codex.capstone.v1"] === true ? 1 : 0;
  return clamp(((lessonMilestones + quiz + capstone) / 14) * 100);
}

export const GITHUB_LESSON_PROGRESS_KEYS = GITHUB_COURSE_MANIFEST.lessons.map(
  (lesson) => `github.lesson.${lesson.slug}`,
);

export function githubProgress(p: Record<string, unknown>): number {
  const lessons = GITHUB_LESSON_PROGRESS_KEYS.filter((key) => p[key] === true).length;
  const quiz = isGithubQuizPassed(p) ? 1 : 0;
  const capstone = p["github.capstone.v1"] === true ? 1 : 0;
  return clamp(((lessons + quiz + capstone) / (GITHUB_LESSON_PROGRESS_KEYS.length + 2)) * 100);
}

export const PROMPT_PRACTICE_PROGRESS_KEYS = PROMPT_COURSE_MANIFEST.lessons.map(
  (lesson) => `prompts.lesson.${lesson.slug}.practice`,
);

export function promptProgress(p: Record<string, unknown>): number {
  const practices = PROMPT_PRACTICE_PROGRESS_KEYS.filter((key) => p[key] === true).length;
  const quiz = p[PROMPT_QUIZ_PASSED_KEY] === true ? 1 : 0;
  const capstone = p[PROMPT_CAPSTONE_KEY] === true ? 1 : 0;
  return clamp(
    ((practices + quiz + capstone) / (PROMPT_PRACTICE_PROGRESS_KEYS.length + 2)) * 100,
  );
}

export const RAG_PRACTICE_PROGRESS_KEYS = RAG_COURSE_MANIFEST.lessons.map(
  (lesson) => `rag.lesson.${lesson.slug}.practice`,
);

export function ragProgress(p: Record<string, unknown>): number {
  const practices = RAG_PRACTICE_PROGRESS_KEYS.filter((key) => p[key] === true).length;
  const quiz = p["rag.quiz.passed"] === true ? 1 : 0;
  const capstone = p["rag.capstone.v1"] === true ? 1 : 0;
  return clamp(((practices + quiz + capstone) / (RAG_PRACTICE_PROGRESS_KEYS.length + 2)) * 100);
}

export const SOFTWARE_ENGINEERING_LESSON_PROGRESS_KEYS =
  SOFTWARE_ENGINEERING_COURSE_MANIFEST.lessons.map(
    (lesson) => `softwareEngineering.lesson.${lesson.slug}`,
  );

export function softwareEngineeringProgress(p: Record<string, unknown>): number {
  const lessons = SOFTWARE_ENGINEERING_LESSON_PROGRESS_KEYS.filter(
    (key) => p[key] === true,
  ).length;
  const quiz = isSoftwareEngineeringQuizPassed(p) ? 1 : 0;
  const capstone = isSoftwareEngineeringCapstoneSubmission(
    p["softwareEngineering.capstone.v1"],
  ) ? 1 : 0;
  return clamp(
    ((lessons + quiz + capstone) / (SOFTWARE_ENGINEERING_LESSON_PROGRESS_KEYS.length + 2)) * 100,
  );
}

export const MAKE_MONEY_WITH_CODEX_LESSON_PROGRESS_KEYS =
  MAKE_MONEY_WITH_CODEX_LESSON_SLUGS.map(
    (slug) => `make-money-with-codex.lesson.${slug}`,
  );

export function makeMoneyWithCodexProgress(p: Record<string, unknown>): number {
  if (p[MAKE_MONEY_WITH_CODEX_PROGRESS_VERSION_KEY] !== MAKE_MONEY_WITH_CODEX_COURSE_VERSION) return 0;
  const lessons = MAKE_MONEY_WITH_CODEX_LESSON_PROGRESS_KEYS.filter(
    (key) => p[key] === true,
  ).length;
  const quiz = p["make-money-with-codex.quiz.version"] === MAKE_MONEY_WITH_CODEX_QUIZ_VERSION
    && p["make-money-with-codex.quiz.passed"] === true ? 1 : 0;
  const capstoneChecks = p["make-money-with-codex.capstone.checks"];
  const capstone = p["make-money-with-codex.capstone.v1"] === true
    && Array.isArray(capstoneChecks)
    && capstoneChecks.length === MAKE_MONEY_WITH_CODEX_CAPSTONE_ITEM_COUNT
    && capstoneChecks.every((value) => value === true) ? 1 : 0;
  return clamp(
    ((lessons + quiz + capstone) / (MAKE_MONEY_WITH_CODEX_LESSON_PROGRESS_KEYS.length + 2)) * 100,
  );
}

export const CLAUDE_INCOME_LESSON_PROGRESS_KEYS = CLAUDE_INCOME_COURSE.lessons.map(
  (lesson) => `claude-income.lesson.${lesson.slug}.complete`,
);

export function claudeIncomeProgress(p: Record<string, unknown>): number {
  const lessons = CLAUDE_INCOME_LESSON_PROGRESS_KEYS.filter((key) => p[key] === true).length;
  const quiz = p[CLAUDE_INCOME_FINAL_QUIZ.versionStorageKey]
    === CLAUDE_INCOME_FINAL_QUIZ.bankVersion
    && p[CLAUDE_INCOME_FINAL_QUIZ.passedStorageKey] === true ? 1 : 0;
  const capstone = p["claude-income.capstone.v1"] === true ? 1 : 0;
  return clamp(((lessons + quiz + capstone) / (CLAUDE_INCOME_COURSE.lessons.length + 2)) * 100);
}

export const MCP_LESSON_PROGRESS_KEYS = MCP_LESSONS.map(
  (lesson) => `mcp.lesson.${lesson.slug}`,
);

export function mcpProgress(p: Record<string, unknown>): number {
  const lessons = MCP_LESSON_PROGRESS_KEYS.filter((key) => p[key] === true).length;
  const quiz = p["mcp.quiz.version"] === MCP_ASSESSMENT_VERSION
    && p["mcp.quiz.passed"] === true ? 1 : 0;
  const capstone = p["mcp.capstone.v1"] === true ? 1 : 0;
  return clamp(((lessons + quiz + capstone) / (MCP_LESSONS.length + 2)) * 100);
}

export const TOP_LEVEL_COURSES: TopLevelCourse[] = [
  {
    id: "agentic",
    displayNumber: 1,
    href: "/courses/#agentic-engineering",
    minutes: COURSE_MODULES.reduce((sum, module) => sum + module.minutes, 0),
    durationMinutes: COURSE_MODULES.reduce((sum, module) => sum + module.minutes, 0),
    status: "available",
    hue: "var(--brand)",
    level: "beginner-to-intermediate",
    moduleIds: COURSE_MODULES.map((module) => module.id),
    outcomeKeys: ["track.1.title", "home.learn1", "track.3.title"],
    progressStrategy: "module-average",
    progressEvent: AGENTIC_PROGRESS_EVENT,
    progress: (p, seen) => clamp(
      COURSE_MODULES.reduce((sum, module) => sum + module.progress(p, seen), 0) /
      COURSE_MODULES.length,
    ),
  },
  {
    id: "codex",
    displayNumber: 2,
    href: "/codex/",
    minutes: 660,
    durationMinutes: 660,
    status: "available",
    hue: "var(--green)",
    level: "beginner-to-advanced",
    moduleIds: [],
    outcomeKeys: ["c.codex.blurb", "c.codex.title"],
    progressStrategy: "fourteen-equal-milestones",
    progressEvent: "codex:progress-change",
    progress: (p) => codexProgress(p),
  },
  {
    id: "claude",
    displayNumber: 3,
    href: "/claude/",
    minutes: CLAUDE_COURSE_MANIFEST.lessons.reduce(
      (sum, lesson) => sum + lesson.minutes,
      0,
    ),
    durationMinutes: CLAUDE_COURSE_MANIFEST.lessons.reduce(
      (sum, lesson) => sum + lesson.durationMinutes,
      0,
    ),
    status: "available",
    hue: "var(--claude, #d97757)",
    level: "beginner-to-advanced",
    moduleIds: CLAUDE_COURSE_MANIFEST.lessons.map((lesson) => lesson.slug),
    outcomeKeys: ["c.claude.blurb", "c.claude.title", "c.claude.meta"],
    progressStrategy: "seventeen-equal-milestones",
    progressEvent: "claude:progress-change",
    progress: (p) => claudeProgressPercent(p),
  },
  {
    id: "cursor",
    displayNumber: 4,
    href: "/cursor/",
    minutes: CURSOR_COURSE_MANIFEST.lessons.reduce(
      (sum, lesson) => sum + lesson.minutes,
      0,
    ),
    durationMinutes: CURSOR_COURSE_MANIFEST.lessons.reduce(
      (sum, lesson) => sum + lesson.durationMinutes,
      0,
    ),
    status: "available",
    hue: "var(--violet)",
    level: "beginner-to-advanced",
    moduleIds: CURSOR_COURSE_MANIFEST.lessons.map((lesson) => lesson.slug),
    outcomeKeys: ["c.cursor.blurb", "c.cursor.title", "c.cursor.meta"],
    progressStrategy: "sixteen-equal-milestones",
    progressStorageKey: CURSOR_PROGRESS_STORAGE_KEY,
    progressEvent: CURSOR_PROGRESS_EVENT,
    progress: (p) => cursorProgressPercent(p),
  },
  {
    id: "grok",
    displayNumber: 5,
    href: "/grok/",
    minutes: GROK_COURSE_MANIFEST.lessons.reduce(
      (sum, lesson) => sum + lesson.minutes,
      0,
    ),
    durationMinutes: GROK_COURSE_MANIFEST.lessons.reduce(
      (sum, lesson) => sum + lesson.minutes,
      0,
    ),
    status: "available",
    hue: "var(--blue)",
    level: "beginner-to-advanced",
    moduleIds: GROK_COURSE_MANIFEST.lessons.map((lesson) => lesson.slug),
    outcomeKeys: ["c.grok.blurb", "c.grok.title", "c.grok.meta"],
    progressStrategy: "sixteen-equal-milestones",
    progressStorageKey: GROK_PROGRESS_STORAGE_KEY,
    progressEvent: "aicourse:grok-progress",
    progress: (p) => grokProgressPercent(p),
  },
  {
    id: "github",
    displayNumber: 6,
    href: "/github/",
    minutes: GITHUB_COURSE_MANIFEST.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0),
    durationMinutes: GITHUB_COURSE_MANIFEST.lessons.reduce(
      (sum, lesson) => sum + lesson.minutes,
      0,
    ),
    status: "available",
    hue: "var(--brand-2)",
    level: "beginner-to-advanced",
    moduleIds: GITHUB_COURSE_MANIFEST.lessons.map((lesson) => lesson.slug),
    outcomeKeys: ["c.github.blurb", "c.github.title"],
    progressStrategy: "fourteen-equal-milestones",
    progressEvent: "github:progress-change",
    progress: (p) => githubProgress(p),
  },
  {
    id: "prompts",
    displayNumber: 7,
    href: "/prompts/",
    minutes: PROMPT_COURSE_DURATION_MINUTES,
    durationMinutes: PROMPT_COURSE_DURATION_MINUTES,
    status: "available",
    hue: "var(--coral)",
    level: "beginner-to-intermediate",
    moduleIds: PROMPT_COURSE_MANIFEST.lessons.map((lesson) => lesson.slug),
    outcomeKeys: ["c.prompts.blurb", "cat.promptFigures", "cat.promptAssessment"],
    progressStrategy: "eleven-equal-milestones",
    progressEvent: "aicourse:prompts-progress",
    progress: (p) => promptProgress(p),
  },
  {
    id: "software-engineering",
    displayNumber: 8,
    href: "/software-engineering/",
    minutes: SOFTWARE_ENGINEERING_COURSE_MANIFEST.lessons.reduce(
      (sum, lesson) => sum + lesson.minutes,
      0,
    ),
    durationMinutes: SOFTWARE_ENGINEERING_COURSE_MANIFEST.lessons.reduce(
      (sum, lesson) => sum + lesson.minutes,
      0,
    ),
    status: "available",
    hue: "var(--teal)",
    level: MAKE_MONEY_WITH_CODEX_LEVEL,
    moduleIds: SOFTWARE_ENGINEERING_COURSE_MANIFEST.lessons.map((lesson) => lesson.slug),
    outcomeKeys: [
      "c.softwareEngineering.blurb",
      "c.softwareEngineering.title",
      "c.softwareEngineering.meta",
    ],
    progressStrategy: "twenty-equal-milestones",
    progressEvent: "software-engineering:progress-change",
    progress: (p) => softwareEngineeringProgress(p),
  },
  {
    id: "rag",
    displayNumber: 9,
    href: "/rag/",
    minutes: RAG_COURSE_MANIFEST.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0),
    durationMinutes: RAG_COURSE_MANIFEST.lessons.reduce(
      (sum, lesson) => sum + lesson.minutes,
      0,
    ),
    status: "available",
    hue: "var(--sky)",
    level: "beginner-to-advanced",
    moduleIds: RAG_COURSE_MANIFEST.lessons.map((lesson) => lesson.slug),
    outcomeKeys: ["c.rag.blurb", "c.rag.title", "c.rag.meta"],
    progressStrategy: "fourteen-equal-milestones",
    progressEvent: "aicourse:rag-progress",
    progress: (p) => ragProgress(p),
  },
  {
    id: "mcp",
    displayNumber: 10,
    href: "/mcp/",
    minutes: MCP_LESSONS.reduce((sum, lesson) => sum + lesson.minutes, 0),
    durationMinutes: MCP_LESSONS.reduce((sum, lesson) => sum + lesson.minutes, 0),
    status: "available",
    hue: "var(--sky)",
    level: "beginner-to-advanced",
    moduleIds: MCP_LESSONS.map((lesson) => lesson.slug),
    outcomeKeys: ["c.mcp.blurb", "c.mcp.title", "c.mcp.meta"],
    progressStrategy: "twenty-equal-milestones",
    progressEvent: "mcp:progress-change",
    progress: (p) => mcpProgress(p),
  },
  {
    id: "make-money-with-codex",
    displayNumber: 11,
    href: "/make-money-with-codex/",
    minutes: MAKE_MONEY_WITH_CODEX_DURATION_MINUTES,
    durationMinutes: MAKE_MONEY_WITH_CODEX_DURATION_MINUTES,
    status: "available",
    hue: "var(--gold)",
    level: "intermediate-to-advanced",
    moduleIds: [...MAKE_MONEY_WITH_CODEX_LESSON_SLUGS],
    outcomeKeys: [
      "c.make-money-with-codex.blurb",
      "c.make-money-with-codex.title",
      "c.make-money-with-codex.meta",
    ],
    progressStrategy: "fourteen-equal-milestones",
    progressEvent: "aicourse:make-money-with-codex-progress",
    progress: (p) => makeMoneyWithCodexProgress(p),
  },
  {
    id: "claude-income",
    displayNumber: 12,
    href: "/claude-income/",
    minutes: CLAUDE_INCOME_COURSE.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0),
    durationMinutes: CLAUDE_INCOME_COURSE.lessons.reduce(
      (sum, lesson) => sum + lesson.minutes,
      0,
    ),
    status: "available",
    hue: "var(--coral)",
    level: "beginner-to-advanced",
    moduleIds: CLAUDE_INCOME_COURSE.lessons.map((lesson) => lesson.slug),
    outcomeKeys: [
      "c.claude-income.blurb",
      "c.claude-income.title",
      "c.claude-income.meta",
    ],
    progressStrategy: "fourteen-equal-milestones",
    progressEvent: "claude-income:progress-change",
    progress: (p) => claudeIncomeProgress(p),
  },
  {
    id: "ai-tutor",
    displayNumber: 13,
    href: "/ai-tutor/",
    minutes: AI_TUTOR_COURSE_MANIFEST.modules.reduce(
      (sum, module) => sum + module.minutes,
      0,
    ),
    durationMinutes: AI_TUTOR_COURSE_MANIFEST.modules.reduce(
      (sum, module) => sum + module.minutes,
      0,
    ),
    status: "available",
    hue: "var(--teal)",
    level: "intermediate-to-advanced",
    moduleIds: AI_TUTOR_COURSE_MANIFEST.modules.map((module) => module.slug),
    outcomeKeys: ["c.ai-tutor.blurb", "c.ai-tutor.title", "c.ai-tutor.meta"],
    progressStrategy: "ten-equal-milestones",
    progressEvent: AI_TUTOR_PROGRESS_EVENT,
    progress: (p) => aiTutorProgressPercent(p),
  },
  {
    id: "product-management",
    displayNumber: 14,
    href: "/product-management/",
    minutes: PRODUCT_MANAGEMENT_COURSE_MANIFEST.modules.reduce(
      (sum, module) => sum + module.minutes,
      0,
    ),
    durationMinutes: PRODUCT_MANAGEMENT_COURSE_MANIFEST.modules.reduce(
      (sum, module) => sum + module.minutes,
      0,
    ),
    status: "available",
    hue: "var(--violet)",
    level: "beginner-to-advanced",
    moduleIds: PRODUCT_MANAGEMENT_COURSE_MANIFEST.modules.map((module) => module.slug),
    outcomeKeys: [
      "c.product-management.blurb",
      "c.product-management.title",
      "c.product-management.meta",
    ],
    progressStrategy: "sixteen-equal-milestones",
    progressEvent: PRODUCT_MANAGEMENT_PROGRESS_EVENT,
    progress: (p) => productManagementProgressPercent(p),
  },
  {
    id: "agent-orchestration",
    displayNumber: 15,
    href: "/agent-orchestration/",
    minutes: AGENT_ORCHESTRATION_COURSE_MANIFEST.modules.reduce(
      (sum, module) => sum + module.minutes,
      0,
    ),
    durationMinutes: AGENT_ORCHESTRATION_COURSE_MANIFEST.modules.reduce(
      (sum, module) => sum + module.minutes,
      0,
    ),
    status: "available",
    hue: "var(--brand)",
    level: "intermediate-to-advanced",
    moduleIds: AGENT_ORCHESTRATION_COURSE_MANIFEST.modules.map((module) => module.slug),
    outcomeKeys: [
      "c.agent-orchestration.blurb",
      "c.agent-orchestration.title",
      "c.agent-orchestration.meta",
    ],
    progressStrategy: "seventeen-equal-milestones",
    progressEvent: AGENT_ORCHESTRATION_PROGRESS_EVENT,
    progress: (p) => agentOrchestrationProgressPercent(p),
  },
  {
    id: "math-animation",
    displayNumber: 19,
    href: "/math-animation/",
    minutes: MATH_ANIMATION_TOTAL_MINUTES,
    durationMinutes: MATH_ANIMATION_TOTAL_MINUTES,
    status: "available",
    hue: "var(--coral)",
    level: "beginner-to-advanced",
    moduleIds: MATH_ANIMATION_COURSE_MANIFEST.modules.map((module) => module.slug),
    outcomeKeys: [
      "c.math-animation.blurb",
      "c.math-animation.title",
      "c.math-animation.meta",
    ],
    progressStrategy: "fourteen-equal-milestones",
    progressEvent: MATH_ANIMATION_PROGRESS_EVENT,
    progress: (p) => mathAnimationProgressPercent(p),
  },
];

const agenticCourse = TOP_LEVEL_COURSES.find((course) => course.id === "agentic")!;
const codexCourse = TOP_LEVEL_COURSES.find((course) => course.id === "codex")!;
const claudeCourse = TOP_LEVEL_COURSES.find((course) => course.id === "claude")!;
const cursorCourse = TOP_LEVEL_COURSES.find((course) => course.id === "cursor")!;
const grokCourse = TOP_LEVEL_COURSES.find((course) => course.id === "grok")!;
const githubCourse = TOP_LEVEL_COURSES.find((course) => course.id === "github")!;
const promptsCourse = TOP_LEVEL_COURSES.find((course) => course.id === "prompts")!;
const softwareEngineeringCourse = TOP_LEVEL_COURSES.find(
  (course) => course.id === "software-engineering",
)!;
const ragCourse = TOP_LEVEL_COURSES.find((course) => course.id === "rag")!;
const mcpCourse = TOP_LEVEL_COURSES.find((course) => course.id === "mcp")!;
const makeMoneyWithCodexCourse = TOP_LEVEL_COURSES.find(
  (course) => course.id === "make-money-with-codex",
)!;
const claudeIncomeCourse = TOP_LEVEL_COURSES.find(
  (course) => course.id === "claude-income",
)!;
const aiTutorCourse = TOP_LEVEL_COURSES.find((course) => course.id === "ai-tutor")!;
const productManagementCourse = TOP_LEVEL_COURSES.find(
  (course) => course.id === "product-management",
)!;
const agentOrchestrationCourse = TOP_LEVEL_COURSES.find(
  (course) => course.id === "agent-orchestration",
)!;
const mathAnimationCourse = TOP_LEVEL_COURSES.find(
  (course) => course.id === "math-animation",
)!;

/**
 * The broad AI-learning directory.
 *
 * Upcoming courses have no public destination, duration, or progress adapter.
 * Keeping those fields unavailable prevents an unfinished route from being
 * presented as a course a learner can start today.
 */
export const CATALOG_COURSES: readonly CatalogCourse[] = [
  {
    id: "agentic",
    displayNumber: agenticCourse.displayNumber,
    href: "/handbook/",
    titleKey: "c.agentic.title",
    blurbKey: "c.agentic.blurb",
    topic: "ai-systems",
    topicKey: "topic.aiSystems",
    level: agenticCourse.level,
    levelKey: "c.agentic.level",
    format: "mixed",
    formatKey: "cat.formatMixed",
    minutes: agenticCourse.minutes,
    status: agenticCourse.status,
    hue: agenticCourse.hue,
    progressEvent: agenticCourse.progressEvent,
    progress: agenticCourse.progress,
  },
  {
    id: "codex",
    displayNumber: codexCourse.displayNumber,
    href: codexCourse.href,
    titleKey: "c.codex.title",
    blurbKey: "c.codex.blurb",
    topic: "coding-assistants",
    topicKey: "topic.codingAssistants",
    level: codexCourse.level,
    levelKey: "c.codex.level",
    format: "guided",
    formatKey: "cat.formatGuided",
    minutes: codexCourse.minutes,
    status: codexCourse.status,
    hue: codexCourse.hue,
    progressEvent: codexCourse.progressEvent,
    progress: codexCourse.progress,
  },
  {
    id: "claude",
    displayNumber: claudeCourse.displayNumber,
    href: claudeCourse.href,
    titleKey: "c.claude.title",
    blurbKey: "c.claude.blurb",
    metaKey: "c.claude.meta",
    topic: "ai-systems",
    topicKey: "topic.aiSystems",
    level: claudeCourse.level,
    levelKey: "c.claude.level",
    format: "guided",
    formatKey: "cat.formatGuided",
    minutes: claudeCourse.minutes,
    status: claudeCourse.status,
    hue: claudeCourse.hue,
    progressStorageKey: claudeCourse.progressStorageKey,
    progressEvent: claudeCourse.progressEvent,
    progress: claudeCourse.progress,
  },
  {
    id: "cursor",
    displayNumber: cursorCourse.displayNumber,
    href: cursorCourse.href,
    titleKey: "c.cursor.title",
    blurbKey: "c.cursor.blurb",
    metaKey: "c.cursor.meta",
    topic: "coding-assistants",
    topicKey: "topic.codingAssistants",
    level: cursorCourse.level,
    levelKey: "c.cursor.level",
    format: "guided",
    formatKey: "cat.formatGuided",
    minutes: cursorCourse.minutes,
    status: cursorCourse.status,
    hue: cursorCourse.hue,
    progressStorageKey: cursorCourse.progressStorageKey,
    progressEvent: cursorCourse.progressEvent,
    progress: cursorCourse.progress,
  },
  {
    id: "grok",
    displayNumber: grokCourse.displayNumber,
    href: grokCourse.href,
    titleKey: "c.grok.title",
    blurbKey: "c.grok.blurb",
    metaKey: "c.grok.meta",
    topic: "ai-systems",
    topicKey: "topic.aiSystems",
    level: grokCourse.level,
    levelKey: "c.grok.level",
    format: "guided",
    formatKey: "cat.formatGuided",
    minutes: grokCourse.minutes,
    status: grokCourse.status,
    hue: grokCourse.hue,
    progressStorageKey: grokCourse.progressStorageKey,
    progressEvent: grokCourse.progressEvent,
    progress: grokCourse.progress,
  },
  {
    id: "ai-research",
    href: "#",
    titleKey: "c.aiResearch.title",
    blurbKey: "c.aiResearch.blurb",
    topic: "research",
    topicKey: "topic.research",
    level: "beginner-to-intermediate",
    levelKey: "c.aiResearch.level",
    format: "project-based",
    formatKey: "cat.formatProject",
    minutes: null,
    status: "soon",
    hue: "var(--gold-mark)",
  },
  {
    id: "github",
    displayNumber: githubCourse.displayNumber,
    href: githubCourse.href,
    titleKey: "c.github.title",
    blurbKey: "c.github.blurb",
    metaKey: "c.github.meta",
    topic: "collaboration",
    topicKey: "topic.collaboration",
    level: githubCourse.level,
    levelKey: "c.github.level",
    format: "guided",
    formatKey: "cat.formatGuided",
    minutes: githubCourse.minutes,
    status: githubCourse.status,
    hue: githubCourse.hue,
    progressEvent: githubCourse.progressEvent,
    progress: githubCourse.progress,
  },
  {
    id: "prompts",
    displayNumber: promptsCourse.displayNumber,
    href: promptsCourse.href,
    titleKey: "c.prompts.title",
    blurbKey: "c.prompts.blurb",
    metaKey: "c.prompts.meta",
    topic: "prompting",
    topicKey: "topic.prompting",
    level: promptsCourse.level,
    levelKey: "c.prompts.level",
    format: "guided",
    formatKey: "cat.formatGuided",
    minutes: promptsCourse.minutes,
    status: promptsCourse.status,
    hue: promptsCourse.hue,
    progressEvent: promptsCourse.progressEvent,
    progress: promptsCourse.progress,
  },
  {
    id: "software-engineering",
    displayNumber: softwareEngineeringCourse.displayNumber,
    href: softwareEngineeringCourse.href,
    titleKey: "c.softwareEngineering.title",
    blurbKey: "c.softwareEngineering.blurb",
    metaKey: "c.softwareEngineering.meta",
    topic: "coding-assistants",
    topicKey: "topic.codingAssistants",
    level: softwareEngineeringCourse.level,
    levelKey: "c.softwareEngineering.level",
    format: "project-based",
    formatKey: "cat.formatProject",
    minutes: softwareEngineeringCourse.minutes,
    status: softwareEngineeringCourse.status,
    hue: softwareEngineeringCourse.hue,
    progressEvent: softwareEngineeringCourse.progressEvent,
    progress: softwareEngineeringCourse.progress,
  },
  {
    id: "rag",
    displayNumber: ragCourse.displayNumber,
    href: ragCourse.href,
    titleKey: "c.rag.title",
    blurbKey: "c.rag.blurb",
    metaKey: "c.rag.meta",
    topic: "ai-systems",
    topicKey: "topic.aiSystems",
    level: ragCourse.level,
    levelKey: "c.rag.level",
    format: "guided",
    formatKey: "cat.formatGuided",
    minutes: ragCourse.minutes,
    status: ragCourse.status,
    hue: ragCourse.hue,
    progressEvent: ragCourse.progressEvent,
    progress: ragCourse.progress,
  },
  {
    id: "mcp",
    displayNumber: mcpCourse.displayNumber,
    href: mcpCourse.href,
    titleKey: "c.mcp.title",
    blurbKey: "c.mcp.blurb",
    metaKey: "c.mcp.meta",
    topic: "ai-systems",
    topicKey: "topic.aiSystems",
    level: mcpCourse.level,
    levelKey: "c.mcp.level",
    format: "project-based",
    formatKey: "cat.formatProject",
    minutes: mcpCourse.minutes,
    status: mcpCourse.status,
    hue: mcpCourse.hue,
    progressEvent: mcpCourse.progressEvent,
    progress: mcpCourse.progress,
  },
  {
    id: "make-money-with-codex",
    displayNumber: makeMoneyWithCodexCourse.displayNumber,
    href: makeMoneyWithCodexCourse.href,
    titleKey: "c.make-money-with-codex.title",
    blurbKey: "c.make-money-with-codex.blurb",
    metaKey: "c.make-money-with-codex.meta",
    topic: "coding-assistants",
    topicKey: "topic.codingAssistants",
    level: makeMoneyWithCodexCourse.level,
    levelKey: "c.make-money-with-codex.level",
    format: "project-based",
    formatKey: "cat.formatProject",
    minutes: makeMoneyWithCodexCourse.minutes,
    status: makeMoneyWithCodexCourse.status,
    hue: makeMoneyWithCodexCourse.hue,
    progressEvent: makeMoneyWithCodexCourse.progressEvent,
    progress: makeMoneyWithCodexCourse.progress,
  },
  {
    id: "claude-income",
    displayNumber: claudeIncomeCourse.displayNumber,
    href: claudeIncomeCourse.href,
    titleKey: "c.claude-income.title",
    blurbKey: "c.claude-income.blurb",
    metaKey: "c.claude-income.meta",
    topic: "business",
    topicKey: "topic.business",
    level: claudeIncomeCourse.level,
    levelKey: "c.claude-income.level",
    format: "project-based",
    formatKey: "cat.formatProject",
    minutes: claudeIncomeCourse.minutes,
    status: claudeIncomeCourse.status,
    hue: claudeIncomeCourse.hue,
    progressEvent: claudeIncomeCourse.progressEvent,
    progress: claudeIncomeCourse.progress,
  },
  {
    id: "ai-tutor",
    displayNumber: aiTutorCourse.displayNumber,
    href: aiTutorCourse.href,
    titleKey: "c.ai-tutor.title",
    blurbKey: "c.ai-tutor.blurb",
    metaKey: "c.ai-tutor.meta",
    topic: "teaching",
    topicKey: "topic.teaching",
    level: aiTutorCourse.level,
    levelKey: "c.ai-tutor.level",
    format: "project-based",
    formatKey: "cat.formatProject",
    minutes: aiTutorCourse.minutes,
    status: aiTutorCourse.status,
    hue: aiTutorCourse.hue,
    progressEvent: aiTutorCourse.progressEvent,
    progress: aiTutorCourse.progress,
  },
  {
    id: "product-management",
    displayNumber: productManagementCourse.displayNumber,
    href: productManagementCourse.href,
    titleKey: "c.product-management.title",
    blurbKey: "c.product-management.blurb",
    metaKey: "c.product-management.meta",
    topic: "business",
    topicKey: "topic.business",
    level: productManagementCourse.level,
    levelKey: "c.product-management.level",
    format: "project-based",
    formatKey: "cat.formatProject",
    minutes: productManagementCourse.minutes,
    status: productManagementCourse.status,
    hue: productManagementCourse.hue,
    progressEvent: productManagementCourse.progressEvent,
    progress: productManagementCourse.progress,
  },
  {
    id: "agent-orchestration",
    displayNumber: agentOrchestrationCourse.displayNumber,
    href: agentOrchestrationCourse.href,
    titleKey: "c.agent-orchestration.title",
    blurbKey: "c.agent-orchestration.blurb",
    metaKey: "c.agent-orchestration.meta",
    topic: "ai-systems",
    topicKey: "topic.aiSystems",
    level: agentOrchestrationCourse.level,
    levelKey: "c.agent-orchestration.level",
    format: "project-based",
    formatKey: "cat.formatProject",
    minutes: agentOrchestrationCourse.minutes,
    status: agentOrchestrationCourse.status,
    hue: agentOrchestrationCourse.hue,
    progressEvent: agentOrchestrationCourse.progressEvent,
    progress: agentOrchestrationCourse.progress,
  },
  {
    id: "math-animation",
    displayNumber: mathAnimationCourse.displayNumber,
    href: mathAnimationCourse.href,
    titleKey: "c.math-animation.title",
    blurbKey: "c.math-animation.blurb",
    metaKey: "c.math-animation.meta",
    topic: "coding-assistants",
    topicKey: "topic.codingAssistants",
    level: mathAnimationCourse.level,
    levelKey: "c.math-animation.level",
    format: "project-based",
    formatKey: "cat.formatProject",
    minutes: mathAnimationCourse.minutes,
    status: mathAnimationCourse.status,
    hue: mathAnimationCourse.hue,
    progressEvent: mathAnimationCourse.progressEvent,
    progress: mathAnimationCourse.progress,
  },
  {
    id: "responsible-ai",
    href: "#",
    titleKey: "c.responsibleAi.title",
    blurbKey: "c.responsibleAi.blurb",
    topic: "responsible-ai",
    topicKey: "topic.responsibleAi",
    level: "beginner-to-intermediate",
    levelKey: "c.responsibleAi.level",
    format: "guided",
    formatKey: "cat.formatGuided",
    minutes: null,
    status: "soon",
    hue: "var(--red)",
  },
];

export const CATALOG_TOPICS: readonly CatalogTopic[] = [
  "ai-systems",
  "coding-assistants",
  "collaboration",
  "prompting",
  "research",
  "business",
  "teaching",
  "responsible-ai",
];

/** A range-level course appears when any level inside that range is selected. */
export function catalogCourseMatchesLevel(course: CatalogCourse, level: Level): boolean {
  if (course.level === level) return true;
  if (course.level === "beginner-to-intermediate") {
    return level === "beginner" || level === "intermediate";
  }
  if (course.level === "intermediate-to-advanced") {
    return level === "intermediate" || level === "advanced";
  }
  return course.level === "beginner-to-advanced";
}

/** Kept for any downstream imports that consume the old flat module list. */
export const COURSES: CourseModule[] = [...COURSE_MODULES, ...UPCOMING_MODULES];

export const LEVELS: Level[] = ["beginner", "intermediate", "advanced"];
export const FORMATS: Format[] = ["read", "interactive", "code"];
export const TOPICS: Topic[] = ["foundations", "prompting", "agents", "evaluation", "safety"];
export const STATUSES: Status[] = ["available", "soon"];
