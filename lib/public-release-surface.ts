import rawPublicSurface from "@/config/course-public-surface.json";
import { assertExactCourseIdSet, assertUniqueCourseIds } from "./course-collection-contract";
import type { CourseId as RegistryCourseId } from "./release-surface";

/**
 * Client-safe, generated projection of the authoritative release registry.
 * It deliberately excludes routes, gates, evidence reasons and storage keys.
 * `release-surface:check` fails if this projection drifts from the registry.
 */

/**
 * Stable public identifier contract. The runtime collection still comes from
 * the generated JSON projection; this tuple only narrows its checked ids for
 * TypeScript and never encodes a lifecycle exclusion.
 */
export const PUBLIC_COURSE_ID_CONTRACT = [
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
  "agentic-quant-trading",
  "ai-teaching",
  "math-animation",
] as const satisfies readonly RegistryCourseId[];

export type PublicCourseId = (typeof PUBLIC_COURSE_ID_CONTRACT)[number];
const PUBLIC_COURSE_ID_SET = new Set<string>(PUBLIC_COURSE_ID_CONTRACT);

export function isPublicCourseId(courseId: string): courseId is PublicCourseId {
  return PUBLIC_COURSE_ID_SET.has(courseId);
}

export type PublicPublicationState = "published" | "blocked" | "roadmap";
export type PublicContentLocale =
  | "en" | "es" | "fr" | "de" | "zh-Hans" | "zh-Hant" | "ja" | "ko" | "ar";

export const PUBLIC_SITE_LOCALES: readonly PublicContentLocale[] = [
  "en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar",
];

export interface PublicCourseSurface {
  readonly id: PublicCourseId;
  readonly state: PublicPublicationState;
  readonly href: string | null;
  readonly titleKey: string;
  readonly interfaceLocales: readonly PublicContentLocale[];
  readonly reviewedContentLocales: readonly PublicContentLocale[];
  readonly fallbackLocale: PublicContentLocale | null;
  /** @deprecated Use fallbackLocale. */
  readonly primaryLocale: PublicContentLocale | null;
  /** @deprecated Use reviewedContentLocales. */
  readonly contentLocales: readonly PublicContentLocale[];
  readonly progressEvent: string | null;
}

type RawPublicSurface = {
  readonly schemaVersion: 3;
  readonly manifestKind: "course-public-surface-projection";
  readonly source: {
    readonly path: "config/course-release-manifest.json";
    readonly sha256: string;
  };
  readonly siteLocales: readonly PublicContentLocale[];
  readonly courses: readonly PublicCourseSurface[];
};

const PUBLIC_SURFACE = rawPublicSurface as unknown as RawPublicSurface;
if (PUBLIC_SURFACE.schemaVersion !== 3) throw new Error("public course surface schema must be 3");
if (PUBLIC_SURFACE.manifestKind !== "course-public-surface-projection") {
  throw new Error("public course surface manifestKind is invalid");
}
if (
  PUBLIC_SURFACE.source.path !== "config/course-release-manifest.json"
  || !/^[a-f0-9]{64}$/.test(PUBLIC_SURFACE.source.sha256)
) {
  throw new Error("public course surface source digest is invalid");
}
if (JSON.stringify(PUBLIC_SURFACE.siteLocales) !== JSON.stringify(PUBLIC_SITE_LOCALES)) {
  throw new Error("public course surface siteLocales drifted from the public locale contract");
}

export const PUBLIC_COURSE_SURFACES = PUBLIC_SURFACE.courses;
export const PUBLIC_COURSE_IDS: readonly PublicCourseId[] = PUBLIC_COURSE_SURFACES.map(
  (course) => course.id,
);
assertUniqueCourseIds(PUBLIC_COURSE_IDS, "public course projection");
assertExactCourseIdSet(
  PUBLIC_COURSE_ID_CONTRACT,
  PUBLIC_COURSE_IDS,
  "public course projection",
);
const PUBLIC_COURSE_BY_ID = new Map(
  PUBLIC_COURSE_SURFACES.map((course) => [course.id, course] as const),
);

export function publicSurfaceFor(courseId: PublicCourseId): PublicCourseSurface {
  const surface = PUBLIC_COURSE_BY_ID.get(courseId);
  if (!surface) throw new Error(`Unknown public course surface: ${courseId}`);
  return surface;
}

export function publicContentLocaleForCourse(
  courseId: PublicCourseId,
  requestedLocale: string,
): PublicContentLocale | null {
  const surface = publicSurfaceFor(courseId);
  if (surface.state === "roadmap") return null;
  return surface.reviewedContentLocales.includes(requestedLocale as PublicContentLocale)
    ? requestedLocale as PublicContentLocale
    : surface.fallbackLocale;
}

export function publicCourseHrefFor(
  courseId: PublicCourseId,
  requestedLocale: string,
): string | null {
  const surface = publicSurfaceFor(courseId);
  if (surface.state !== "published" || !surface.href) return null;
  const contentLocale = publicContentLocaleForCourse(courseId, requestedLocale);
  return contentLocale ? `/${contentLocale}${surface.href}` : null;
}

/** Preserve the shell locale when a real course route changes language. */
export function withPublicCourseReturnLocale(
  href: string,
  requestedLocale: string,
): string {
  if (!PUBLIC_SITE_LOCALES.includes(requestedLocale as PublicContentLocale)) return href;
  const targetLocale = href.split("/", 3)[1];
  if (
    !PUBLIC_SITE_LOCALES.includes(targetLocale as PublicContentLocale)
    || targetLocale === requestedLocale
  ) return href;
  const [pathAndQuery, hash = ""] = href.split("#", 2);
  const separator = pathAndQuery.includes("?") ? "&" : "?";
  return `${pathAndQuery}${separator}fromLocale=${encodeURIComponent(requestedLocale)}`
    + (hash ? `#${hash}` : "");
}

export const PUBLIC_PUBLISHED_COURSE_SURFACES = PUBLIC_COURSE_SURFACES.filter(
  (course) => course.state === "published",
);

/**
 * Build the destination for an explicit shell-language change.
 *
 * Core pages and courses published in the requested locale retain their path.
 * If a course has no reviewed content in that locale, retain the exact real
 * content route and carry the requested shell locale in an allowlisted query.
 */
export function publicLocaleSwitchHref(
  pathname: string,
  requestedLocale: string,
  hash = "",
): string {
  if (!PUBLIC_SITE_LOCALES.includes(requestedLocale as PublicContentLocale)) {
    return `${pathname}${hash}`;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (PUBLIC_SITE_LOCALES.includes(segments[0] as PublicContentLocale)) {
    segments.shift();
  }

  const pathWithoutLocale = `/${segments.join("/")}${segments.length ? "/" : ""}`;
  const course = PUBLIC_PUBLISHED_COURSE_SURFACES.find(({ href }) => (
    href && (pathWithoutLocale === href || pathWithoutLocale.startsWith(href))
  ));
  if (course?.href) {
    const courseHref = publicCourseHrefFor(course.id, requestedLocale);
    if (!courseHref) return `/${requestedLocale}/courses/`;
    const childSuffix = pathWithoutLocale.slice(course.href.length);
    return withPublicCourseReturnLocale(`${courseHref}${childSuffix}${hash}`, requestedLocale);
  }

  return `/${requestedLocale}${pathWithoutLocale}${hash}`;
}
