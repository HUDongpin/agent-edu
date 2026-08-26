import {
  PUBLIC_COURSE_IDS,
  publicSurfaceFor,
  type PublicCourseId as CourseId,
  type PublicCourseSurface as CourseReleaseSurface,
} from "./public-release-surface";
import { assertExactCourseIdSet } from "./course-collection-contract";

/**
 * Lightweight presentation data safe to import into shared client bundles.
 * Curriculum, quiz, evidence, progress-store, and locale-copy modules do not
 * belong here. Publication state, href, title key, language, routes and gates
 * always come from the release registry.
 */

export type Level = "beginner" | "intermediate" | "advanced";
export type Status = "available" | "soon";
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

export interface PublicCourseModule {
  readonly id: "handbook" | "lab" | "build";
  readonly href: string;
  readonly external?: boolean;
}

export interface CatalogCourse {
  readonly id: CourseId;
  /** Stable visual order, independent from the released-course sequence. */
  readonly catalogOrder: number;
  readonly displayNumber?: number;
  readonly href: string;
  readonly external?: boolean;
  readonly titleKey: string;
  readonly blurbKey: string;
  readonly metaKey?: string;
  readonly topic: CatalogTopic;
  readonly topicKey: string;
  readonly level: CatalogLevel;
  readonly levelKey: string;
  readonly format: CatalogFormat;
  readonly formatKey: string;
  readonly minutes: number | null;
  readonly status: Status;
  readonly hue: string;
}

type CatalogPresentation = Omit<CatalogCourse, "href" | "titleKey" | "status">;
type CatalogPresentationMetadata = Omit<CatalogPresentation, "id">;

const CATALOG_PRESENTATION_BY_ID = {
  agentic: { catalogOrder: 1, displayNumber: 1, blurbKey: "c.agentic.blurb", topic: "ai-systems", topicKey: "topic.aiSystems", level: "beginner-to-intermediate", levelKey: "c.agentic.level", format: "mixed", formatKey: "cat.formatMixed", minutes: 235, hue: "var(--brand)" },
  codex: { catalogOrder: 2, displayNumber: 2, blurbKey: "c.codex.blurb", topic: "coding-assistants", topicKey: "topic.codingAssistants", level: "beginner-to-advanced", levelKey: "c.codex.level", format: "guided", formatKey: "cat.formatGuided", minutes: 660, hue: "var(--green)" },
  claude: { catalogOrder: 3, displayNumber: 3, blurbKey: "c.claude.blurb", metaKey: "c.claude.meta", topic: "ai-systems", topicKey: "topic.aiSystems", level: "beginner-to-advanced", levelKey: "c.claude.level", format: "guided", formatKey: "cat.formatGuided", minutes: 870, hue: "var(--claude, #d97757)" },
  cursor: { catalogOrder: 4, displayNumber: 4, blurbKey: "c.cursor.blurb", metaKey: "c.cursor.meta", topic: "coding-assistants", topicKey: "topic.codingAssistants", level: "beginner-to-advanced", levelKey: "c.cursor.level", format: "guided", formatKey: "cat.formatGuided", minutes: 800, hue: "var(--violet)" },
  grok: { catalogOrder: 5, displayNumber: 5, blurbKey: "c.grok.blurb", metaKey: "c.grok.meta", topic: "ai-systems", topicKey: "topic.aiSystems", level: "beginner-to-advanced", levelKey: "c.grok.level", format: "guided", formatKey: "cat.formatGuided", minutes: 695, hue: "var(--blue)" },
  "ai-research": { catalogOrder: 6, blurbKey: "c.aiResearch.blurb", topic: "research", topicKey: "topic.research", level: "beginner-to-intermediate", levelKey: "c.aiResearch.level", format: "project-based", formatKey: "cat.formatProject", minutes: null, hue: "var(--gold-mark)" },
  github: { catalogOrder: 7, displayNumber: 6, blurbKey: "c.github.blurb", metaKey: "c.github.meta", topic: "collaboration", topicKey: "topic.collaboration", level: "beginner-to-advanced", levelKey: "c.github.level", format: "guided", formatKey: "cat.formatGuided", minutes: 660, hue: "var(--brand-2)" },
  prompts: { catalogOrder: 8, displayNumber: 7, blurbKey: "c.prompts.blurb", metaKey: "c.prompts.meta", topic: "prompting", topicKey: "topic.prompting", level: "beginner-to-intermediate", levelKey: "c.prompts.level", format: "guided", formatKey: "cat.formatGuided", minutes: 380, hue: "var(--coral)" },
  "software-engineering": { catalogOrder: 9, displayNumber: 8, blurbKey: "c.softwareEngineering.blurb", metaKey: "c.softwareEngineering.meta", topic: "coding-assistants", topicKey: "topic.codingAssistants", level: "intermediate-to-advanced", levelKey: "c.softwareEngineering.level", format: "project-based", formatKey: "cat.formatProject", minutes: 908, hue: "var(--teal)" },
  rag: { catalogOrder: 10, displayNumber: 9, blurbKey: "c.rag.blurb", metaKey: "c.rag.meta", topic: "ai-systems", topicKey: "topic.aiSystems", level: "beginner-to-advanced", levelKey: "c.rag.level", format: "guided", formatKey: "cat.formatGuided", minutes: 780, hue: "var(--sky)" },
  mcp: { catalogOrder: 11, displayNumber: 10, blurbKey: "c.mcp.blurb", metaKey: "c.mcp.meta", topic: "ai-systems", topicKey: "topic.aiSystems", level: "beginner-to-advanced", levelKey: "c.mcp.level", format: "project-based", formatKey: "cat.formatProject", minutes: 1075, hue: "var(--sky)" },
  "make-money-with-codex": { catalogOrder: 12, displayNumber: 11, blurbKey: "c.make-money-with-codex.blurb", metaKey: "c.make-money-with-codex.meta", topic: "coding-assistants", topicKey: "topic.codingAssistants", level: "intermediate-to-advanced", levelKey: "c.make-money-with-codex.level", format: "project-based", formatKey: "cat.formatProject", minutes: 630, hue: "var(--gold)" },
  "claude-income": { catalogOrder: 13, displayNumber: 12, blurbKey: "c.claude-income.blurb", metaKey: "c.claude-income.meta", topic: "business", topicKey: "topic.business", level: "beginner-to-advanced", levelKey: "c.claude-income.level", format: "project-based", formatKey: "cat.formatProject", minutes: 895, hue: "var(--coral)" },
  "ai-tutor": { catalogOrder: 14, displayNumber: 13, blurbKey: "c.ai-tutor.blurb", metaKey: "c.ai-tutor.meta", topic: "teaching", topicKey: "topic.teaching", level: "intermediate-to-advanced", levelKey: "c.ai-tutor.level", format: "project-based", formatKey: "cat.formatProject", minutes: 450, hue: "var(--teal)" },
  "product-management": { catalogOrder: 15, displayNumber: 14, blurbKey: "c.product-management.blurb", metaKey: "c.product-management.meta", topic: "business", topicKey: "topic.business", level: "beginner-to-advanced", levelKey: "c.product-management.level", format: "project-based", formatKey: "cat.formatProject", minutes: 910, hue: "var(--violet)" },
  "agent-orchestration": { catalogOrder: 16, displayNumber: 15, blurbKey: "c.agent-orchestration.blurb", metaKey: "c.agent-orchestration.meta", topic: "ai-systems", topicKey: "topic.aiSystems", level: "intermediate-to-advanced", levelKey: "c.agent-orchestration.level", format: "project-based", formatKey: "cat.formatProject", minutes: 1060, hue: "var(--brand)" },
  "responsible-ai": { catalogOrder: 17, blurbKey: "c.responsibleAi.blurb", topic: "responsible-ai", topicKey: "topic.responsibleAi", level: "beginner-to-intermediate", levelKey: "c.responsibleAi.level", format: "guided", formatKey: "cat.formatGuided", minutes: null, hue: "var(--red)" },
} satisfies Record<CourseId, CatalogPresentationMetadata>;
assertExactCourseIdSet(
  PUBLIC_COURSE_IDS,
  Object.keys(CATALOG_PRESENTATION_BY_ID),
  "public catalogue presentation metadata",
);

const CATALOG_PRESENTATION: readonly CatalogPresentation[] = PUBLIC_COURSE_IDS
  .map((id) => ({ id, ...CATALOG_PRESENTATION_BY_ID[id] }))
  .sort((left, right) => left.catalogOrder - right.catalogOrder);

export const COURSE_MODULES: readonly PublicCourseModule[] = [
  { id: "handbook", href: "/handbook/" },
  { id: "lab", href: "/lab/" },
  { id: "build", href: "/build/" },
];

export const CATALOG_COURSE_RELEASES: readonly {
  readonly course: CatalogCourse;
  readonly surface: CourseReleaseSurface;
}[] = CATALOG_PRESENTATION.map((presentation) => {
  const surface = publicSurfaceFor(presentation.id);
  return {
    surface,
    course: {
      ...presentation,
      href: surface.state === "published" && surface.href ? surface.href : "#",
      titleKey: surface.titleKey,
      status: surface.state === "published" ? "available" : "soon",
    },
  };
});

export const CATALOG_COURSES = CATALOG_COURSE_RELEASES.map(({ course }) => course);
export const PUBLISHED_CATALOG_COURSES = CATALOG_COURSE_RELEASES.filter(
  ({ surface }) => surface.state === "published",
);
export const BLOCKED_CATALOG_COURSES = CATALOG_COURSE_RELEASES.filter(
  ({ surface }) => surface.state === "blocked",
);
export const ROADMAP_CATALOG_COURSES = CATALOG_COURSE_RELEASES.filter(
  ({ surface }) => surface.state === "roadmap",
);

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
export const LEVELS: readonly Level[] = ["beginner", "intermediate", "advanced"];
export const STATUSES: readonly Status[] = ["available", "soon"];

export function catalogCourseMatchesLevel(course: CatalogCourse, level: Level): boolean {
  if (course.level === level) return true;
  if (course.level === "beginner-to-intermediate") return level !== "advanced";
  if (course.level === "intermediate-to-advanced") return level !== "beginner";
  return course.level === "beginner-to-advanced";
}
