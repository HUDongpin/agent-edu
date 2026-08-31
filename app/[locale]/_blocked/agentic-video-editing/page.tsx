import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import CourseDashboard from "@/staging/course-src/agentic-video-editing/components/CourseDashboard";
import {
  AGENTIC_VIDEO_EDITING_TRANSLATED_LOCALES,
  isAgenticVideoEditingLocale,
  loadAgenticVideoEditingCourse,
  validateAgenticVideoEditingCourse,
} from "@/staging/course-src/agentic-video-editing";
import { getMessages, translator } from "@/lib/i18n";
import { courseLocaleParams } from "@/lib/release-surface";
import {
  agenticVideoEditingModulePage,
  seoFor,
  SITE,
  urlFor,
} from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return courseLocaleParams("agentic-video-editing");
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
          additionalProperty: [
            {
              "@type": "PropertyValue",
              name: "Optional fixture-safe local media lab",
              value: "PT180M",
            },
            {
              "@type": "PropertyValue",
              name: "Independent capstone estimate",
              value: "PT240M",
            },
            {
              "@type": "PropertyValue",
              name: "Final assessment",
              value: "PT30M",
            },
          ],
        },
        hasPart: course.modules.map((module) => ({
          "@type": "LearningResource",
          position: module.order,
          name: module.copy.title,
          description: module.copy.summary,
          url: urlFor(course.contentLocale, agenticVideoEditingModulePage(module.slug)),
          timeRequired: `PT${module.minutes}M`,
          additionalProperty: {
            "@type": "PropertyValue",
            name: "Optional builder extension",
            value: `PT${module.extensionMinutes}M`,
          },
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
