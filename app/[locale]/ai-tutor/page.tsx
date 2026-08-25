import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseDashboard from "@/components/ai-tutor/CourseDashboard";
import JsonLd from "@/components/JsonLd";
import {
  AI_TUTOR_LOCALES,
  AI_TUTOR_TRANSLATED_LOCALES,
  assertValidAiTutorCourse,
  isAiTutorLocale,
  loadAiTutorCourse,
} from "@/lib/ai-tutor";
import { getMessages, translator } from "@/lib/i18n";
import { aiTutorModulePage, seoFor, SITE, urlFor } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return AI_TUTOR_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isAiTutorLocale(locale)) notFound();
  const [course, messages] = await Promise.all([
    loadAiTutorCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  return seoFor({
    locale,
    availableLocales: AI_TUTOR_TRANSLATED_LOCALES,
    canonicalLocale: course.contentLocale,
    page: "ai-tutor/",
    title: `${course.copy.meta.title} · aicourse.top`,
    description: course.copy.meta.summary,
    siteName: t("brand.name"),
  });
}

export default async function AiTutorCoursePage({ params }: Props) {
  const { locale } = await params;
  if (!isAiTutorLocale(locale)) notFound();
  assertValidAiTutorCourse();

  const [course, messages] = await Promise.all([
    loadAiTutorCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const totalMinutes = course.modules.reduce((sum, module) => sum + module.minutes, 0);
  const courseUrl = urlFor(course.contentLocale, "ai-tutor/");
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        name: course.copy.meta.title,
        description: course.copy.meta.summary,
        courseCode: "13",
        url: courseUrl,
        provider: { "@id": `${SITE}/#org` },
        inLanguage: course.contentLocale,
        isAccessibleForFree: true,
        educationalLevel: course.copy.meta.level,
        audience: { "@type": "Audience", audienceType: course.copy.meta.audience },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: `PT${totalMinutes}M`,
        },
        hasPart: course.modules.map((module) => ({
          "@type": "LearningResource",
          position: module.order,
          name: module.copy.title,
          description: module.copy.summary,
          url: urlFor(course.contentLocale, aiTutorModulePage(module.slug)),
          timeRequired: `PT${module.minutes}M`,
          inLanguage: course.contentLocale,
        })),
        offers: {
          "@type": "Offer",
          price: 0,
          priceCurrency: "USD",
          category: "Free",
          availability: "https://schema.org/InStock",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: t("nav.courses"),
            item: urlFor(course.contentLocale, "courses/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: course.copy.meta.title,
            item: courseUrl,
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
