import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LessonView from "@/components/cursor/LessonView";
import JsonLd from "@/components/JsonLd";
import {
  CURSOR_LESSON_SLUGS,
  getCursorLesson,
  isCursorLessonSlug,
  isCursorLocale,
  loadCursorCourse,
} from "@/lib/cursor";
import { getMessages, translator } from "@/lib/i18n";
import { SITE } from "@/lib/seo";
import { cursorLessonPage, cursorSeoFor, cursorUrlFor } from "@/lib/cursor/seo";

type Props = { params: Promise<{ locale: string; lesson: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return CURSOR_LESSON_SLUGS.map((lesson) => ({ lesson }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, lesson } = await params;
  if (!isCursorLocale(locale) || !isCursorLessonSlug(lesson)) notFound();

  const [course, currentLesson, messages] = await Promise.all([
    loadCursorCourse(locale),
    getCursorLesson(locale, lesson),
    getMessages(locale),
  ]);
  const t = translator(messages);

  return cursorSeoFor({
    locale,
    page: cursorLessonPage(lesson),
    title: `${currentLesson.copy.title} · ${course.copy.meta.title}`,
    description: currentLesson.copy.summary,
    siteName: t("brand.name"),
  });
}

export default async function CursorLessonPage({ params }: Props) {
  const { locale, lesson } = await params;
  if (!isCursorLocale(locale) || !isCursorLessonSlug(lesson)) notFound();

  const [course, messages] = await Promise.all([
    loadCursorCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const currentLesson = course.units
    .flatMap((unit) => unit.lessons)
    .find((item) => item.slug === lesson);
  if (!currentLesson) notFound();

  const page = cursorLessonPage(lesson);
  const lessonData = {
    "@type": "LearningResource",
    name: currentLesson.copy.title,
    description: currentLesson.copy.summary,
    url: cursorUrlFor(locale, page),
    inLanguage: locale,
    learningResourceType: "lesson",
    timeRequired: `PT${currentLesson.minutes}M`,
    isPartOf: {
      "@type": "Course",
      name: course.copy.meta.title,
      url: cursorUrlFor(locale, "cursor/"),
      provider: { "@id": `${SITE}/#org` },
    },
  };
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      lessonData,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: t("nav.courses"),
            item: `${SITE}/${locale}/courses/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: course.copy.meta.title,
            item: cursorUrlFor(locale, "cursor/"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: currentLesson.copy.title,
            item: cursorUrlFor(locale, page),
          },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={data} />
      <LessonView course={course} lesson={currentLesson} />
    </>
  );
}
