import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LessonView from "@/components/grok/LessonView";
import JsonLd from "@/components/JsonLd";
import {
  GROK_LESSON_SLUGS,
  getGrokLesson,
  grokSeoFor,
  grokUrlFor,
  isGrokLessonSlug,
  isGrokLocale,
  loadGrokCourse,
} from "@/lib/grok";
import { getMessages, translator } from "@/lib/i18n";
import { courseChildParams } from "@/lib/release-surface";
import { SITE } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; lesson: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return courseChildParams("grok", "lesson", GROK_LESSON_SLUGS);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, lesson } = await params;
  if (!isGrokLocale(locale) || !isGrokLessonSlug(lesson)) notFound();
  const [course, currentLesson, messages] = await Promise.all([
    loadGrokCourse(locale),
    getGrokLesson(locale, lesson),
    getMessages(locale),
  ]);
  const t = translator(messages);
  return grokSeoFor({
    locale,
    slug: lesson,
    title: `${currentLesson.copy.title} · ${course.copy.meta.title}`,
    description: currentLesson.copy.summary,
    siteName: t("brand.name"),
  });
}

export default async function GrokLessonPage({ params }: Props) {
  const { locale, lesson } = await params;
  if (!isGrokLocale(locale) || !isGrokLessonSlug(lesson)) notFound();
  const [course, messages] = await Promise.all([
    loadGrokCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const currentLesson = course.units
    .flatMap((unit) => unit.lessons)
    .find((candidate) => candidate.slug === lesson);
  if (!currentLesson) notFound();

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        name: currentLesson.copy.title,
        description: currentLesson.copy.summary,
        url: grokUrlFor(locale, currentLesson.slug),
        inLanguage: locale,
        learningResourceType: "lesson",
        position: currentLesson.order,
        timeRequired: `PT${currentLesson.minutes}M`,
        isPartOf: {
          "@type": "Course",
          name: course.copy.meta.title,
          url: grokUrlFor(locale),
          provider: { "@id": `${SITE}/#org` },
        },
      },
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
            item: grokUrlFor(locale),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: currentLesson.copy.title,
            item: grokUrlFor(locale, currentLesson.slug),
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
