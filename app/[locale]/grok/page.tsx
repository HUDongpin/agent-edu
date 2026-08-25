import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseDashboard from "@/components/grok/CourseDashboard";
import JsonLd from "@/components/JsonLd";
import {
  GROK_LOCALES,
  grokSeoFor,
  grokUrlFor,
  isGrokLocale,
  loadGrokCourse,
} from "@/lib/grok";
import { getMessages, translator } from "@/lib/i18n";
import { SITE } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return GROK_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isGrokLocale(locale)) notFound();
  const [course, messages] = await Promise.all([
    loadGrokCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  return grokSeoFor({
    locale,
    title: `${course.copy.meta.title} · aicourse.top`,
    description: course.copy.meta.summary,
    siteName: t("brand.name"),
  });
}

export default async function GrokCoursePage({ params }: Props) {
  const { locale } = await params;
  if (!isGrokLocale(locale)) notFound();
  const [course, messages] = await Promise.all([
    loadGrokCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const lessons = course.units.flatMap((unit) => unit.lessons);

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        name: course.copy.meta.title,
        description: course.copy.meta.summary,
        url: grokUrlFor(locale),
        provider: { "@id": `${SITE}/#org` },
        inLanguage: locale,
        isAccessibleForFree: true,
        educationalLevel: course.copy.ui.level,
        audience: {
          "@type": "Audience",
          audienceType: course.copy.meta.audience,
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: `PT${course.manifest.minutes}M`,
        },
        hasPart: lessons.map((lesson) => ({
          "@type": "LearningResource",
          position: lesson.order,
          name: lesson.copy.title,
          url: grokUrlFor(locale, lesson.slug),
          timeRequired: `PT${lesson.minutes}M`,
        })),
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
