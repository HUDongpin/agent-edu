import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LessonView from "@/components/rag/LessonView";
import JsonLd from "@/components/JsonLd";
import {
  RAG_LESSON_SLUGS,
  RAG_LOCALES,
  getRagLesson,
  isRagLessonSlug,
  isRagLocale,
  loadRagCourse,
} from "@/lib/rag";
import { getMessages, translator } from "@/lib/i18n";
import { courseChildParams } from "@/lib/release-surface";
import { SITE, ragLessonPage, seoFor, urlFor } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; lesson: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return courseChildParams("rag", "lesson", RAG_LESSON_SLUGS);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, lesson } = await params;
  if (!isRagLocale(locale) || !isRagLessonSlug(lesson)) notFound();
  const [course, currentLesson, messages] = await Promise.all([
    loadRagCourse(locale),
    getRagLesson(locale, lesson),
    getMessages(locale),
  ]);
  const t = translator(messages);
  return seoFor({
    locale,
    availableLocales: RAG_LOCALES,
    canonicalLocale: locale,
    page: ragLessonPage(lesson),
    title: `${currentLesson.copy.title} · ${course.copy.meta.title}`,
    description: currentLesson.copy.summary,
    siteName: t("brand.name"),
  });
}

export default async function RagLessonPage({ params }: Props) {
  const { locale, lesson } = await params;
  if (!isRagLocale(locale) || !isRagLessonSlug(lesson)) notFound();
  const course = await loadRagCourse(locale);
  const currentLesson = course.units.flatMap((unit) => unit.lessons).find((item) => item.slug === lesson);
  if (!currentLesson) notFound();
  const page = ragLessonPage(lesson);

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        name: currentLesson.copy.title,
        description: currentLesson.copy.summary,
        url: urlFor(course.contentLocale, page),
        inLanguage: course.contentLocale,
        learningResourceType: "lesson",
        timeRequired: `PT${currentLesson.minutes}M`,
        isPartOf: {
          "@type": "Course",
          name: course.copy.meta.title,
          url: urlFor(course.contentLocale, "rag/"),
          provider: { "@id": `${SITE}/#org` },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: course.copy.ui.catalogName, item: urlFor(course.contentLocale, "courses/") },
          { "@type": "ListItem", position: 2, name: course.copy.meta.title, item: urlFor(course.contentLocale, "rag/") },
          { "@type": "ListItem", position: 3, name: currentLesson.copy.title, item: urlFor(course.contentLocale, page) },
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
