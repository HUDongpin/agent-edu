import rawContract from "@/config/course-release-surface.json";

/**
 * The public course registry has one authoritative lifecycle state:
 * `published`, `blocked`, or `roadmap`. `lib/courses.ts` joins this machine
 * contract to presentation metadata and executable progress adapters.
 *
 * The content locale list remains independent from shell-message coverage so
 * an English fallback never masquerades as a translated route.
 */

export const COURSE_IDS = [
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
  "ai-research",
  "responsible-ai",
] as const;

export type CourseId = (typeof COURSE_IDS)[number];
export type PublicationStatus = "published" | "blocked" | "roadmap";
export type ContentLocale =
  | "en"
  | "es"
  | "fr"
  | "de"
  | "zh-Hans"
  | "zh-Hant"
  | "ja"
  | "ko"
  | "ar";

export interface CourseProgressSurface {
  readonly strategy: string;
  readonly storageKey: string;
  readonly event: string | null;
}

export interface CourseReleaseSurface {
  readonly id: CourseId;
  readonly state: PublicationStatus;
  readonly href: string | null;
  readonly titleKey: string;
  readonly primaryLocale: ContentLocale | null;
  readonly contentLocales: readonly ContentLocale[];
  readonly routes: readonly string[];
  readonly releaseGate: string | null;
  readonly progress: CourseProgressSurface | null;
  readonly blockers?: readonly string[];
}

export interface CourseReleaseSurfaceContract {
  readonly schemaVersion: 2;
  readonly siteLocales: readonly ContentLocale[];
  readonly core: {
    readonly contentLocales: readonly ContentLocale[];
    readonly routes: readonly string[];
  };
  readonly courses: readonly CourseReleaseSurface[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireStringArray(value: unknown, label: string): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${label} must be an array of strings`);
  }
}

function parseContract(value: unknown): CourseReleaseSurfaceContract {
  if (!isRecord(value) || value.schemaVersion !== 2) {
    throw new Error("course release surface schemaVersion must be 2");
  }
  requireStringArray(value.siteLocales, "siteLocales");
  if (!isRecord(value.core)) throw new Error("course release surface core is missing");
  requireStringArray(value.core.contentLocales, "core.contentLocales");
  requireStringArray(value.core.routes, "core.routes");
  if (!Array.isArray(value.courses)) throw new Error("course release surface courses must be an array");

  for (const [index, course] of value.courses.entries()) {
    if (!isRecord(course)) throw new Error(`courses[${index}] must be an object`);
    if (!(COURSE_IDS as readonly string[]).includes(String(course.id))) {
      throw new Error(`courses[${index}] has unknown id ${String(course.id)}`);
    }
    if (
      course.state !== "published"
      && course.state !== "blocked"
      && course.state !== "roadmap"
    ) {
      throw new Error(`courses[${index}] has invalid publication status`);
    }
    if (course.href !== null && typeof course.href !== "string") {
      throw new Error(`courses[${index}].href must be a string or null`);
    }
    if (typeof course.titleKey !== "string") {
      throw new Error(`courses[${index}].titleKey must be a string`);
    }
    if (course.primaryLocale !== null && typeof course.primaryLocale !== "string") {
      throw new Error(`courses[${index}].primaryLocale must be a string or null`);
    }
    requireStringArray(course.contentLocales, `courses[${index}].contentLocales`);
    requireStringArray(course.routes, `courses[${index}].routes`);
    if (course.releaseGate !== null && typeof course.releaseGate !== "string") {
      throw new Error(`courses[${index}].releaseGate must be a string or null`);
    }
    if (course.progress !== null) {
      if (!isRecord(course.progress)) {
        throw new Error(`courses[${index}].progress must be an object or null`);
      }
      if (
        typeof course.progress.strategy !== "string"
        || typeof course.progress.storageKey !== "string"
        || (course.progress.event !== null && typeof course.progress.event !== "string")
      ) {
        throw new Error(`courses[${index}].progress is invalid`);
      }
    }
    if (course.blockers !== undefined) {
      requireStringArray(course.blockers, `courses[${index}].blockers`);
    }
  }

  return value as unknown as CourseReleaseSurfaceContract;
}

export const COURSE_RELEASE_SURFACE = parseContract(rawContract);
export const SITE_CONTENT_LOCALES = COURSE_RELEASE_SURFACE.siteLocales;
export const COURSE_RELEASE_SURFACES = COURSE_RELEASE_SURFACE.courses;

const COURSE_BY_ID = new Map(
  COURSE_RELEASE_SURFACES.map((course) => [course.id, course] as const),
);
const COURSE_BY_PAGE = new Map(
  COURSE_RELEASE_SURFACES.flatMap((course) =>
    course.routes.map((page) => [page, course] as const),
  ),
);
const CORE_PAGE_SET = new Set(COURSE_RELEASE_SURFACE.core.routes);

export function releaseSurfaceFor(courseId: CourseId): CourseReleaseSurface {
  const surface = COURSE_BY_ID.get(courseId);
  if (!surface) throw new Error(`Unknown course release surface: ${courseId}`);
  return surface;
}

export function isPublishedCourse(courseId: CourseId): boolean {
  return releaseSurfaceFor(courseId).state === "published";
}

/** Resolve the locale of the long-form body without presenting fallback copy as translated. */
export function contentLocaleForCourse(
  courseId: CourseId,
  requestedLocale: string,
): ContentLocale | null {
  const surface = releaseSurfaceFor(courseId);
  if (surface.state === "roadmap") return null;
  if (surface.contentLocales.includes(requestedLocale as ContentLocale)) {
    return requestedLocale as ContentLocale;
  }
  return surface.primaryLocale;
}

/** A learner-facing href exists only for published content and uses a real content locale. */
export function courseHrefFor(courseId: CourseId, requestedLocale: string): string | null {
  const surface = releaseSurfaceFor(courseId);
  if (surface.state !== "published" || !surface.href) return null;
  const contentLocale = contentLocaleForCourse(courseId, requestedLocale);
  return contentLocale ? `/${contentLocale}${surface.href}` : null;
}

export const PUBLISHED_COURSE_SURFACES = COURSE_RELEASE_SURFACES.filter(
  (course) => course.state === "published",
);
export const BLOCKED_COURSE_SURFACES = COURSE_RELEASE_SURFACES.filter(
  (course) => course.state === "blocked",
);
export const ROADMAP_COURSE_SURFACES = COURSE_RELEASE_SURFACES.filter(
  (course) => course.state === "roadmap",
);

export const KNOWN_LOCALIZED_PAGES = [
  ...COURSE_RELEASE_SURFACE.core.routes,
  ...COURSE_RELEASE_SURFACES.flatMap((course) => course.routes),
] as readonly string[];

export const PUBLISHED_LOCALIZED_PAGES = [
  ...COURSE_RELEASE_SURFACE.core.routes,
  ...PUBLISHED_COURSE_SURFACES.flatMap((course) => course.routes),
] as readonly string[];

export function releaseSurfaceForPage(page: string): CourseReleaseSurface | null {
  return COURSE_BY_PAGE.get(page) ?? null;
}

export function isPublishedPage(page: string): boolean {
  if (CORE_PAGE_SET.has(page)) return true;
  return releaseSurfaceForPage(page)?.state === "published";
}

export function contentLocalesForPage(page: string): readonly ContentLocale[] {
  if (CORE_PAGE_SET.has(page)) return COURSE_RELEASE_SURFACE.core.contentLocales;
  const surface = releaseSurfaceForPage(page);
  if (!surface) throw new Error(`Unknown localized release page: ${page}`);
  return surface.contentLocales;
}

/** Root dashboard params. A blocked course deliberately returns no routes. */
export function courseLocaleParams(courseId: CourseId): Array<{ locale: ContentLocale }> {
  const surface = releaseSurfaceFor(courseId);
  if (surface.state !== "published") return [];
  return surface.contentLocales.map((locale) => ({ locale }));
}

/**
 * Child slugs declared by the registry for a one-segment course route.
 *
 * Stable public route wrappers use this instead of importing a curriculum.
 * A future blocked -> published state change therefore activates the exact
 * registry routes without moving files or maintaining a second slug list.
 */
export function courseChildRouteValues(courseId: CourseId): string[] {
  const surface = releaseSurfaceFor(courseId);
  const [dashboard, ...children] = surface.routes;
  if (!dashboard) return [];
  const dashboardSegments = dashboard.replace(/^\/+|\/+$/g, "").split("/");
  if (dashboardSegments.length !== 1) {
    throw new Error(`${courseId} dashboard route must contain one segment`);
  }
  const root = dashboardSegments[0];
  return children.map((route) => {
    const segments = route.replace(/^\/+|\/+$/g, "").split("/");
    if (segments.length !== 2 || segments[0] !== root || !segments[1]) {
      throw new Error(`${courseId} child route must be ${root}/<slug>/`);
    }
    return segments[1];
  });
}

/**
 * Bottom-up params for a route below `[locale]`.
 *
 * Next 16 static export rejects an empty child array when called top-down for
 * an unsupported parent locale. Returning both dynamic segments from the leaf
 * generates only real content locales while keeping the shared nine-language
 * shell layout.
 */
export function courseChildParams<Key extends string>(
  courseId: CourseId,
  key: Key,
  values: readonly string[],
): Array<Record<Key, string> & { locale: ContentLocale }> {
  const surface = releaseSurfaceFor(courseId);
  if (surface.state !== "published") return [];
  return surface.contentLocales.flatMap((locale) =>
    values.map((value) => ({
      locale,
      [key]: value,
    }) as Record<Key, string> & { locale: ContentLocale }),
  );
}

export function publishedLocalizedRoutes(): string[] {
  return PUBLISHED_LOCALIZED_PAGES.flatMap((page) =>
    contentLocalesForPage(page).map((locale) =>
      `/${locale}${page ? `/${page.replace(/\/$/, "")}` : ""}`,
    ),
  );
}

export interface PublishedGateLedger {
  readonly schemaVersion: 2;
  readonly publishedCount: number;
  readonly blockedCount: number;
  readonly gates: readonly {
    readonly courseId: CourseId;
    readonly primaryLocale: ContentLocale;
    readonly contentLocales: readonly ContentLocale[];
    readonly routeCount: number;
    readonly releaseGate: string;
  }[];
}

export function publishedGateLedger(): PublishedGateLedger {
  return {
    schemaVersion: 2,
    publishedCount: PUBLISHED_COURSE_SURFACES.length,
    blockedCount: BLOCKED_COURSE_SURFACES.length,
    gates: PUBLISHED_COURSE_SURFACES.map((course) => ({
      courseId: course.id,
      primaryLocale: course.primaryLocale!,
      contentLocales: course.contentLocales,
      routeCount: course.routes.length,
      releaseGate: course.releaseGate!,
    })),
  };
}
