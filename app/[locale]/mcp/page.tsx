import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseDashboard from "@/components/mcp/CourseDashboard";
import JsonLd from "@/components/JsonLd";
import { MCP_LOCALES, isMcpLocale } from "@/lib/mcp";
import { loadMcpCourse } from "@/lib/mcp/load";
import { getMessages, translator } from "@/lib/i18n";
import { SITE, mcpLessonPage, seoFor, urlFor } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return MCP_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isMcpLocale(locale)) notFound();
  const [course, messages] = await Promise.all([loadMcpCourse(locale), getMessages(locale)]);
  const t = translator(messages);
  return seoFor({
    locale,
    availableLocales: MCP_LOCALES,
    canonicalLocale: locale,
    page: "mcp/",
    title: `${course.title} · aicourse.top`,
    description: course.summary,
    siteName: t("brand.name"),
  });
}

export default async function McpCoursePage({ params }: Props) {
  const { locale } = await params;
  if (!isMcpLocale(locale)) notFound();
  const [course, messages] = await Promise.all([loadMcpCourse(locale), getMessages(locale)]);
  const t = translator(messages);
  const minutes = course.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        name: course.title,
        alternateName: course.shortTitle,
        description: course.summary,
        url: urlFor(course.contentLocale, "mcp/"),
        provider: { "@id": `${SITE}/#org` },
        inLanguage: course.contentLocale,
        availableLanguage: [...MCP_LOCALES],
        courseCode: `Course ${course.sequence}`,
        audience: { "@type": "Audience", audienceType: course.audience },
        isAccessibleForFree: true,
        datePublished: course.publishedOn,
        version: course.version,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: `PT${minutes}M`,
        },
        hasPart: course.lessons.map((lesson) => ({
          "@type": "LearningResource",
          name: lesson.title,
          description: lesson.summary,
          url: urlFor(course.contentLocale, mcpLessonPage(lesson.slug)),
          position: lesson.order,
          timeRequired: `PT${lesson.minutes}M`,
          inLanguage: course.contentLocale,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("nav.courses"), item: urlFor(course.contentLocale, "courses/") },
          { "@type": "ListItem", position: 2, name: course.title, item: urlFor(course.contentLocale, "mcp/") },
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
