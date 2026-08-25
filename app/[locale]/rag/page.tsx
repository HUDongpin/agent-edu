import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseDashboard from "@/components/rag/CourseDashboard";
import JsonLd from "@/components/JsonLd";
import { RAG_LOCALES, isRagLocale, loadRagCourse } from "@/lib/rag";
import { getMessages, translator } from "@/lib/i18n";
import { courseLocaleParams } from "@/lib/release-surface";
import { SITE, ragLessonPage, seoFor, urlFor } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return courseLocaleParams("rag");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isRagLocale(locale)) notFound();
  const [course, messages] = await Promise.all([loadRagCourse(locale), getMessages(locale)]);
  const t = translator(messages);
  return seoFor({
    locale,
    availableLocales: RAG_LOCALES,
    canonicalLocale: locale,
    page: "rag/",
    title: `${course.copy.meta.title} · aicourse.top`,
    description: course.copy.meta.summary,
    siteName: t("brand.name"),
  });
}

export default async function RagCoursePage({ params }: Props) {
  const { locale } = await params;
  if (!isRagLocale(locale)) notFound();
  const [course, messages] = await Promise.all([loadRagCourse(locale), getMessages(locale)]);
  const t = translator(messages);
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const minutes = lessons.reduce((total, lesson) => total + lesson.minutes, 0);

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        name: course.copy.meta.title,
        description: course.copy.meta.summary,
        url: urlFor(course.contentLocale, "rag/"),
        provider: { "@id": `${SITE}/#org` },
        inLanguage: course.contentLocale,
        audience: { "@type": "Audience", audienceType: course.copy.meta.audience },
        isAccessibleForFree: true,
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: `PT${minutes}M`,
        },
        hasPart: lessons.map((lesson) => ({
          "@type": "LearningResource",
          name: lesson.copy.title,
          url: urlFor(course.contentLocale, ragLessonPage(lesson.slug)),
          position: lesson.order,
          timeRequired: `PT${lesson.minutes}M`,
          inLanguage: course.contentLocale,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: course.copy.ui.catalogName, item: urlFor(course.contentLocale, "courses/") },
          { "@type": "ListItem", position: 2, name: course.copy.meta.title, item: urlFor(course.contentLocale, "rag/") },
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
