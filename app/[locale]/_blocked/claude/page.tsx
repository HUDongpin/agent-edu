import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseDashboard from "@/components/claude/CourseDashboard";
import JsonLd from "@/components/JsonLd";
import {
  isClaudeLocale,
  loadClaudeCourse,
} from "@/lib/claude";
import { CLAUDE_SITE, claudeSeoFor, claudeUrlFor } from "@/lib/claude/seo";
import { getMessages, translator } from "@/lib/i18n";
import { courseLocaleParams } from "@/lib/release-surface";

type Props = { params: Promise<{ locale: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return courseLocaleParams("claude");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isClaudeLocale(locale)) notFound();

  const [course, messages] = await Promise.all([
    loadClaudeCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);

  return claudeSeoFor({
    locale,
    title: `${course.copy.meta.title} · aicourse.top`,
    description: course.copy.meta.summary,
    siteName: t("brand.name"),
  });
}

export default async function ClaudeCoursePage({ params }: Props) {
  const { locale } = await params;
  if (!isClaudeLocale(locale)) notFound();

  const [course, messages] = await Promise.all([
    loadClaudeCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const minutes = course.manifest.lessons.reduce((total, lesson) => total + lesson.minutes, 0);
  const courseData = {
    "@type": "Course",
    name: course.copy.meta.title,
    description: course.copy.meta.summary,
    url: claudeUrlFor(locale),
    provider: { "@id": `${CLAUDE_SITE}/#org` },
    inLanguage: locale,
    audience: {
      "@type": "Audience",
      audienceType: course.copy.meta.audience,
    },
    isAccessibleForFree: true,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `PT${minutes}M`,
    },
    hasPart: course.units.flatMap((unit) => unit.lessons).map((lesson) => ({
      "@type": "LearningResource",
      name: lesson.copy.title,
      url: claudeUrlFor(locale, lesson.slug),
      position: lesson.order,
      timeRequired: `PT${lesson.minutes}M`,
    })),
  };
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      courseData,
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
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={data} />
      <CourseDashboard course={course} catalogLabel={t("nav.courses")} />
    </>
  );
}
