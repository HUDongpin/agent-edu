import rawPublicSurface from "@/config/course-public-surface.json";
import { assertUniqueCourseIds } from "./course-collection-contract";
import type { CourseId as RegistryCourseId } from "./release-surface";

/**
 * Client-safe, generated projection of the authoritative release registry.
 * It deliberately excludes routes, gates, evidence reasons and storage keys.
 * `release-surface:check` fails if this projection drifts from the registry.
 */

export type PublicCourseId = RegistryCourseId;
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
  readonly primaryLocale: PublicContentLocale | null;
  readonly contentLocales: readonly PublicContentLocale[];
  readonly progressEvent: string | null;
}

type RawPublicSurface = {
  readonly schemaVersion: 1;
  readonly courses: readonly PublicCourseSurface[];
};

const PUBLIC_SURFACE = rawPublicSurface as RawPublicSurface;
if (PUBLIC_SURFACE.schemaVersion !== 1) throw new Error("public course surface schema must be 1");

export const PUBLIC_COURSE_SURFACES = PUBLIC_SURFACE.courses;
export const PUBLIC_COURSE_IDS: readonly PublicCourseId[] = PUBLIC_COURSE_SURFACES.map(
  (course) => course.id,
);
assertUniqueCourseIds(PUBLIC_COURSE_IDS, "public course projection");
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
  return surface.contentLocales.includes(requestedLocale as PublicContentLocale)
    ? requestedLocale as PublicContentLocale
    : surface.primaryLocale;
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
