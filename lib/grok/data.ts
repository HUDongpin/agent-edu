import manifestJson from "./course.manifest.json";
import figuresJson from "./figures.json";
import sourcesJson from "./sources.json";
import type {
  GrokCourseManifest,
  GrokFigureId,
  GrokFigureManifest,
  GrokLessonSlug,
  GrokSourceId,
  GrokSourceRecord,
} from "./types";

export const GROK_COURSE_MANIFEST = manifestJson as unknown as GrokCourseManifest;
export const GROK_FIGURES = figuresJson as unknown as readonly GrokFigureManifest[];
export const GROK_SOURCES = sourcesJson as unknown as readonly GrokSourceRecord[];

export const GROK_LESSON_BY_SLUG = Object.fromEntries(
  GROK_COURSE_MANIFEST.lessons.map((lesson) => [lesson.slug, lesson]),
) as Record<GrokLessonSlug, GrokCourseManifest["lessons"][number]>;

export const GROK_FIGURE_BY_ID = Object.fromEntries(
  GROK_FIGURES.map((figure) => [figure.id, figure]),
) as Record<GrokFigureId, GrokFigureManifest>;

export const GROK_SOURCE_BY_ID = Object.fromEntries(
  GROK_SOURCES.map((source) => [source.id, source]),
) as Record<GrokSourceId, GrokSourceRecord>;

export const GROK_TOTAL_MINUTES = GROK_COURSE_MANIFEST.lessons.reduce(
  (total, lesson) => total + lesson.minutes,
  0,
);
