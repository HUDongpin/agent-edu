import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import CourseDashboard from "@/components/ai-teaching/CourseDashboard";
import {
  AGENTIC_TEACHING_LOCALES,
  AGENTIC_TEACHING_TRANSLATED_LOCALES,
  assertValidAgenticTeachingCourse,
  isAgenticTeachingLocale,
  loadAgenticTeachingCourse,
} from "@/lib/ai-teaching";
import { getMessages, translator } from "@/lib/i18n";
import { agenticTeachingModulePage, seoFor, SITE, urlFor } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

const COURSE_PAGE = "ai-teaching/";

export const dynamicParams = false;

export function generateStaticParams() {
  return AGENTIC_TEACHING_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isAgenticTeachingLocale(locale)) notFound();

  const [course, messages] = await Promise.all([
    loadAgenticTeachingCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);

  return seoFor({
    locale,
    availableLocales: AGENTIC_TEACHING_TRANSLATED_LOCALES,
    canonicalLocale: course.contentLocale,
    page: COURSE_PAGE,
    title: `${course.copy.meta.title} · aicourse.top`,
    description: course.copy.meta.summary,
    siteName: t("brand.name"),
  });
}

export default async function AgenticTeachingCoursePage({ params }: Props) {
  const { locale } = await params;
  if (!isAgenticTeachingLocale(locale)) notFound();
  await assertValidAgenticTeachingCourse();

  const [course, messages] = await Promise.all([
    loadAgenticTeachingCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const totalMinutes = course.modules.reduce(
    (total, module) => total + module.minutes,
    0,
  );
  const courseUrl = urlFor(course.contentLocale, COURSE_PAGE);
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        name: course.copy.meta.title,
        description: course.copy.meta.summary,
        courseCode: "18",
        url: courseUrl,
        provider: { "@id": `${SITE}/#org` },
        inLanguage: course.contentLocale,
        isAccessibleForFree: true,
        educationalLevel: course.copy.meta.level,
        audience: {
          "@type": "Audience",
          audienceType: course.copy.meta.audience,
        },
        datePublished: course.publishedOn,
        version: course.version,
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
          url: urlFor(
            course.contentLocale,
            agenticTeachingModulePage(module.slug),
          ),
          timeRequired: `PT${module.minutes}M`,
          inLanguage: course.contentLocale,
          learningResourceType: "course module",
          educationalUse: "instruction",
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
