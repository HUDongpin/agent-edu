import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LessonView from "@/components/prompts/LessonView";
import JsonLd from "@/components/JsonLd";
import {
  PROMPT_LESSON_SLUGS,
  getPromptLesson,
  isPromptLessonSlug,
  isPromptLocale,
  loadPromptCourse,
} from "@/lib/prompts";
import { getMessages, translator } from "@/lib/i18n";
import { courseChildParams } from "@/lib/release-surface";
import { SITE, promptLessonPage, seoFor, urlFor } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; lesson: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return courseChildParams("prompts", "lesson", PROMPT_LESSON_SLUGS);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, lesson } = await params;
  if (!isPromptLocale(locale) || !isPromptLessonSlug(lesson)) notFound();
  const [course, currentLesson, messages] = await Promise.all([
    loadPromptCourse(locale),
    getPromptLesson(locale, lesson),
    getMessages(locale),
  ]);
  const t = translator(messages);
  return seoFor({
    locale,
    availableLocales: ["en"],
    canonicalLocale: "en",
    page: promptLessonPage(lesson),
    title: `${currentLesson.copy.title} · ${course.copy.meta.title}`,
    description: currentLesson.copy.summary,
    siteName: t("brand.name"),
  });
}

export default async function PromptLessonPage({ params }: Props) {
  const { locale, lesson } = await params;
  if (!isPromptLocale(locale) || !isPromptLessonSlug(lesson)) notFound();
  const [course, messages] = await Promise.all([loadPromptCourse(locale), getMessages(locale)]);
  const t = translator(messages);
  const currentLesson = course.units.flatMap((unit) => unit.lessons).find((item) => item.slug === lesson);
  if (!currentLesson) notFound();
  const page = promptLessonPage(lesson);

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        name: currentLesson.copy.title,
        description: currentLesson.copy.summary,
        url: urlFor(course.contentLocale, page),
        inLanguage: "en",
        learningResourceType: "lesson",
        timeRequired: `PT${currentLesson.minutes}M`,
        isPartOf: {
          "@type": "Course",
          name: course.copy.meta.title,
          url: urlFor(course.contentLocale, "prompts/"),
          provider: { "@id": `${SITE}/#org` },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("nav.courses"), item: urlFor(course.contentLocale, "courses/") },
          { "@type": "ListItem", position: 2, name: course.copy.meta.title, item: urlFor(course.contentLocale, "prompts/") },
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
