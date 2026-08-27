import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import CourseDashboard from "@/components/math-animation/CourseDashboard";
import {
  MATH_ANIMATION_LOCALES,
  MATH_ANIMATION_TOTAL_MINUTES,
  MATH_ANIMATION_TRANSLATED_LOCALES,
  assertValidMathAnimationCourse,
  isMathAnimationLocale,
  loadMathAnimationCourse,
} from "@/lib/math-animation";
import { getMessages, translator } from "@/lib/i18n";
import {
  mathAnimationModulePage,
  seoFor,
  SITE,
  urlFor,
} from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return MATH_ANIMATION_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isMathAnimationLocale(locale)) notFound();
  const [course, messages] = await Promise.all([
    loadMathAnimationCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  return seoFor({
    locale,
    availableLocales: MATH_ANIMATION_TRANSLATED_LOCALES,
    canonicalLocale: course.contentLocale,
    page: "math-animation/",
    title: `${course.copy.meta.title} · aicourse.top`,
    description: course.copy.meta.summary,
    siteName: t("brand.name"),
  });
}

export default async function MathAnimationCoursePage({ params }: Props) {
  const { locale } = await params;
  if (!isMathAnimationLocale(locale)) notFound();
  assertValidMathAnimationCourse();

  const [course, messages] = await Promise.all([
    loadMathAnimationCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const courseUrl = urlFor(course.contentLocale, "math-animation/");
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        name: course.copy.meta.title,
        description: course.copy.meta.summary,
        courseCode: "19",
        url: courseUrl,
        provider: { "@id": `${SITE}/#org` },
        inLanguage: course.contentLocale,
        isAccessibleForFree: true,
        educationalLevel: course.copy.meta.level,
        audience: { "@type": "Audience", audienceType: course.copy.meta.audience },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: `PT${MATH_ANIMATION_TOTAL_MINUTES}M`,
        },
        hasPart: [
          ...course.modules.map((module) => ({
            "@type": "LearningResource",
            position: module.order,
            name: module.copy.title,
            description: module.copy.summary,
            url: urlFor(course.contentLocale, mathAnimationModulePage(module.slug)),
            timeRequired: `PT${module.minutes}M`,
            inLanguage: course.contentLocale,
          })),
          {
            "@type": "LearningResource",
            position: 13,
            name: course.copy.ui.finalAssessment,
            url: `${courseUrl}#math-animation-assessment`,
            learningResourceType: "assessment",
            inLanguage: course.contentLocale,
          },
          {
            "@type": "LearningResource",
            position: 14,
            name: course.copy.capstone.title,
            description: course.copy.capstone.summary,
            url: `${courseUrl}#math-animation-capstone`,
            learningResourceType: "capstone",
            inLanguage: course.contentLocale,
          },
        ],
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
