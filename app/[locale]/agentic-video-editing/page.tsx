import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import CourseDashboard from "@/components/agentic-video-editing/CourseDashboard";
import {
  AGENTIC_VIDEO_EDITING_LOCALES,
  AGENTIC_VIDEO_EDITING_TRANSLATED_LOCALES,
  isAgenticVideoEditingLocale,
  loadAgenticVideoEditingCourse,
  validateAgenticVideoEditingCourse,
} from "@/lib/agentic-video-editing";
import { getMessages, translator } from "@/lib/i18n";
import {
  agenticVideoEditingModulePage,
  seoFor,
  SITE,
  urlFor,
} from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return AGENTIC_VIDEO_EDITING_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isAgenticVideoEditingLocale(locale)) notFound();
  const [course, messages] = await Promise.all([
    loadAgenticVideoEditingCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  return seoFor({
    locale,
    availableLocales: AGENTIC_VIDEO_EDITING_TRANSLATED_LOCALES,
    canonicalLocale: course.contentLocale,
    page: "agentic-video-editing/",
    title: `${course.copy.meta.title} · aicourse.top`,
    description: course.copy.meta.summary,
    siteName: t("brand.name"),
  });
}

export default async function AgenticVideoEditingCoursePage({ params }: Props) {
  const { locale } = await params;
  if (!isAgenticVideoEditingLocale(locale)) notFound();
  const validationErrors = validateAgenticVideoEditingCourse();
  if (validationErrors.length) {
    throw new Error(`Invalid Course 20 contract:\n${validationErrors.join("\n")}`);
  }

  const [course, messages] = await Promise.all([
    loadAgenticVideoEditingCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const totalMinutes = course.modules.reduce((sum, module) => sum + module.minutes, 0);
  const courseUrl = urlFor(course.contentLocale, "agentic-video-editing/");
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        name: course.copy.meta.title,
        description: course.copy.meta.summary,
        courseCode: "20",
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
          url: urlFor(course.contentLocale, agenticVideoEditingModulePage(module.slug)),
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
