import {
  PUBLIC_COURSE_SURFACES,
  type PublicCourseSurface,
} from "./public-release-surface";

/**
 * Every course for which a browser-local adapter has been implemented.
 *
 * This is deliberately broader than the current public release set: blocked
 * courses keep dormant adapters so a registry state flip cannot publish a
 * course with no My Learning/reset contract. Public consumers must use
 * `PUBLISHED_PROGRESS_COURSE_IDS`, which is derived from the generated public
 * registry projection below.
 */
export const PROGRESS_ADAPTER_COURSE_IDS = [
  "agentic",
  "codex",
  "claude",
  "cursor",
  "grok",
  "github",
  "prompts",
  "software-engineering",
  "rag",
  "mcp",
  "make-money-with-codex",
  "claude-income",
  "ai-tutor",
  "product-management",
  "agent-orchestration",
  "responsible-ai",
  "agentic-quant-trading",
  "ai-teaching",
  "math-animation",
] as const;

export type ProgressAdapterCourseId = (typeof PROGRESS_ADAPTER_COURSE_IDS)[number];

/**
 * Generated JSON cannot preserve a compile-time literal subset. Keep the
 * public-facing alias source-compatible while runtime factories narrow it to
 * the generated `published` projection.
 */
export type PublishedProgressCourseId = ProgressAdapterCourseId;
export type ProgressSummaryState =
  | "not-started"
  | "in-progress"
  | "completed"
  | "unavailable";

export interface ProgressStoreSummary {
  readonly state: ProgressSummaryState;
  readonly percent: number;
  readonly nextHref: string | null;
}

export interface PersistenceResult {
  readonly persisted: boolean;
  readonly reason?: "unavailable" | "quota" | "corrupt";
  /** An unreadable active record was preserved under an inactive recovery key. */
  readonly quarantined?: boolean;
}

const progressAdapterIdSet = new Set<string>(PROGRESS_ADAPTER_COURSE_IDS);

export function publishedProgressCourseIdsForProjection(
  surfaces: readonly PublicCourseSurface[],
): readonly ProgressAdapterCourseId[] {
  const ids: ProgressAdapterCourseId[] = [];
  const seen = new Set<string>();
  for (const surface of surfaces) {
    if (surface.state !== "published") continue;
    if (seen.has(surface.id)) {
      throw new Error(`Duplicate published progress course id: ${surface.id}`);
    }
    seen.add(surface.id);
    if (!progressAdapterIdSet.has(surface.id)) {
      throw new Error(`Published course has no progress adapter: ${surface.id}`);
    }
    ids.push(surface.id as ProgressAdapterCourseId);
  }
  return ids;
}

/** Current runtime public subset, derived solely from the generated registry. */
export const PUBLISHED_PROGRESS_COURSE_IDS =
  publishedProgressCourseIdsForProjection(PUBLIC_COURSE_SURFACES);
