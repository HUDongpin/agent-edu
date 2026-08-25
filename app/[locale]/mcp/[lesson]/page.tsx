import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LessonView from "@/components/mcp/LessonView";
import JsonLd from "@/components/JsonLd";
import {
  MCP_LESSONS,
  MCP_LOCALES,
  isMcpLessonSlug,
  isMcpLocale,
} from "@/lib/mcp";
import { loadMcpCourse } from "@/lib/mcp/load";
import { getMessages, translator } from "@/lib/i18n";
import { courseChildParams } from "@/lib/release-surface";
import { SITE, mcpLessonPage, seoFor, urlFor } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; lesson: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return courseChildParams(
    "mcp",
    "lesson",
    MCP_LESSONS.map((lesson) => lesson.slug),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, lesson } = await params;
  if (!isMcpLocale(locale) || !isMcpLessonSlug(lesson)) notFound();
  const [course, messages] = await Promise.all([loadMcpCourse(locale), getMessages(locale)]);
  const currentLesson = course.lessons.find((candidate) => candidate.slug === lesson);
  if (!currentLesson) notFound();
  const t = translator(messages);
  return seoFor({
    locale,
    availableLocales: MCP_LOCALES,
    canonicalLocale: locale,
    page: mcpLessonPage(lesson),
    title: `${currentLesson.title} · ${course.shortTitle}`,
    description: currentLesson.summary,
    siteName: t("brand.name"),
  });
}

export default async function McpLessonPage({ params }: Props) {
  const { locale, lesson } = await params;
  if (!isMcpLocale(locale) || !isMcpLessonSlug(lesson)) notFound();
  const [course, messages] = await Promise.all([loadMcpCourse(locale), getMessages(locale)]);
  const currentLesson = course.lessons.find((candidate) => candidate.slug === lesson);
  if (!currentLesson) notFound();
  const t = translator(messages);
  const page = mcpLessonPage(lesson);

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        name: currentLesson.title,
        description: currentLesson.summary,
        url: urlFor(course.contentLocale, page),
        inLanguage: course.contentLocale,
        learningResourceType: "lesson",
        timeRequired: `PT${currentLesson.minutes}M`,
        position: currentLesson.order,
        educationalUse: "instruction and deliberate practice",
        isPartOf: {
          "@type": "Course",
          name: course.title,
          courseCode: `Course ${course.sequence}`,
          url: urlFor(course.contentLocale, "mcp/"),
          provider: { "@id": `${SITE}/#org` },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("nav.courses"), item: urlFor(course.contentLocale, "courses/") },
          { "@type": "ListItem", position: 2, name: course.title, item: urlFor(course.contentLocale, "mcp/") },
          { "@type": "ListItem", position: 3, name: currentLesson.title, item: urlFor(course.contentLocale, page) },
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
