import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseDashboard from "@/components/cursor/CourseDashboard";
import JsonLd from "@/components/JsonLd";
import {
  CURSOR_LOCALES,
  isCursorLocale,
  loadCursorCourse,
} from "@/lib/cursor";
import { getMessages, translator } from "@/lib/i18n";
import { SITE } from "@/lib/seo";
import { cursorLessonPage, cursorSeoFor, cursorUrlFor } from "@/lib/cursor/seo";

type Props = { params: Promise<{ locale: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return CURSOR_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isCursorLocale(locale)) notFound();

  const [course, messages] = await Promise.all([
    loadCursorCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);

  return cursorSeoFor({
    locale,
    page: "cursor/",
    title: `${course.copy.meta.title} · aicourse.top`,
    description: course.copy.meta.summary,
    siteName: t("brand.name"),
  });
}

export default async function CursorCoursePage({ params }: Props) {
  const { locale } = await params;
  if (!isCursorLocale(locale)) notFound();

  const [course, messages] = await Promise.all([
    loadCursorCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const minutes = course.manifest.lessons.reduce((total, lesson) => total + lesson.minutes, 0);
  const courseData = {
    "@type": "Course",
    name: course.copy.meta.title,
    description: course.copy.meta.summary,
    url: cursorUrlFor(locale, "cursor/"),
    provider: { "@id": `${SITE}/#org` },
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
      url: cursorUrlFor(locale, cursorLessonPage(lesson.slug)),
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
            item: `${SITE}/${locale}/courses/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: course.copy.meta.title,
            item: cursorUrlFor(locale, "cursor/"),
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
