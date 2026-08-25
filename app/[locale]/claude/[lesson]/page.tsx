import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LessonView from "@/components/claude/LessonView";
import JsonLd from "@/components/JsonLd";
import {
  CLAUDE_LESSON_SLUGS,
  getClaudeLesson,
  isClaudeLessonSlug,
  isClaudeLocale,
  loadClaudeCourse,
} from "@/lib/claude";
import { CLAUDE_SITE, claudeSeoFor, claudeUrlFor } from "@/lib/claude/seo";
import { getMessages, translator } from "@/lib/i18n";

type Props = { params: Promise<{ locale: string; lesson: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return CLAUDE_LESSON_SLUGS.map((lesson) => ({ lesson }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, lesson } = await params;
  if (!isClaudeLocale(locale) || !isClaudeLessonSlug(lesson)) notFound();

  const [course, currentLesson, messages] = await Promise.all([
    loadClaudeCourse(locale),
    getClaudeLesson(locale, lesson),
    getMessages(locale),
  ]);
  const t = translator(messages);

  return claudeSeoFor({
    locale,
    slug: lesson,
    title: `${currentLesson.copy.title} · ${course.copy.meta.title}`,
    description: currentLesson.copy.summary,
    siteName: t("brand.name"),
  });
}

export default async function ClaudeLessonPage({ params }: Props) {
  const { locale, lesson } = await params;
  if (!isClaudeLocale(locale) || !isClaudeLessonSlug(lesson)) notFound();

  const [course, messages] = await Promise.all([
    loadClaudeCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const currentLesson = course.units
    .flatMap((unit) => unit.lessons)
    .find((item) => item.slug === lesson);
  if (!currentLesson) notFound();

  const url = claudeUrlFor(locale, lesson);
  const lessonData = {
    "@type": "LearningResource",
    name: currentLesson.copy.title,
    description: currentLesson.copy.summary,
    url,
    inLanguage: locale,
    learningResourceType: "lesson",
    timeRequired: `PT${currentLesson.minutes}M`,
    isPartOf: {
      "@type": "Course",
      name: course.copy.meta.title,
      url: claudeUrlFor(locale),
      provider: { "@id": `${CLAUDE_SITE}/#org` },
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
            item: `${CLAUDE_SITE}/${locale}/courses/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: course.copy.meta.title,
            item: claudeUrlFor(locale),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: currentLesson.copy.title,
            item: url,
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
