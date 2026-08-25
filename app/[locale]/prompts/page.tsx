import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseDashboard from "@/components/prompts/CourseDashboard";
import JsonLd from "@/components/JsonLd";
import {
  PROMPT_LOCALES,
  isPromptLocale,
  loadPromptCourse,
} from "@/lib/prompts";
import { getMessages, translator } from "@/lib/i18n";
import { SITE, promptLessonPage, seoFor, urlFor } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return PROMPT_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isPromptLocale(locale)) notFound();
  const [course, messages] = await Promise.all([loadPromptCourse(locale), getMessages(locale)]);
  const t = translator(messages);
  return seoFor({
    locale,
    availableLocales: ["en"],
    canonicalLocale: "en",
    page: "prompts/",
    title: `${course.copy.meta.title} · aicourse.top`,
    description: course.copy.meta.summary,
    siteName: t("brand.name"),
  });
}

export default async function PromptCoursePage({ params }: Props) {
  const { locale } = await params;
  if (!isPromptLocale(locale)) notFound();
  const [course, messages] = await Promise.all([loadPromptCourse(locale), getMessages(locale)]);
  const t = translator(messages);
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const minutes = lessons.reduce((total, lesson) => total + lesson.minutes, 0)
    + course.manifest.finalQuizMinutes;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        name: course.copy.meta.title,
        description: course.copy.meta.summary,
        url: urlFor(course.contentLocale, "prompts/"),
        provider: { "@id": `${SITE}/#org` },
        inLanguage: "en",
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
          url: urlFor(course.contentLocale, promptLessonPage(lesson.slug)),
          position: lesson.order,
          timeRequired: `PT${lesson.minutes}M`,
          inLanguage: "en",
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("nav.courses"), item: urlFor(course.contentLocale, "courses/") },
          { "@type": "ListItem", position: 2, name: course.copy.meta.title, item: urlFor(course.contentLocale, "prompts/") },
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
