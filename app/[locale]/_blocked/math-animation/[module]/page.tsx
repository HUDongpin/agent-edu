import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import ModuleView from "@/components/math-animation/ModuleView";
import {
  MATH_ANIMATION_MODULE_SLUGS,
  MATH_ANIMATION_TRANSLATED_LOCALES,
  assertValidMathAnimationCourse,
  getMathAnimationModule,
  isMathAnimationLocale,
  isMathAnimationModuleSlug,
  loadMathAnimationCourse,
} from "@/lib/math-animation";
import { getMessages, translator } from "@/lib/i18n";
import {
  mathAnimationModulePage,
  seoFor,
  SITE,
  urlFor,
} from "@/lib/seo";

type Props = { params: Promise<{ locale: string; module: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return MATH_ANIMATION_MODULE_SLUGS.map((module) => ({ module }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, module } = await params;
  if (!isMathAnimationLocale(locale) || !isMathAnimationModuleSlug(module)) notFound();
  const [course, current, messages] = await Promise.all([
    loadMathAnimationCourse(locale),
    getMathAnimationModule(locale, module),
    getMessages(locale),
  ]);
  const t = translator(messages);
  return seoFor({
    locale,
    availableLocales: MATH_ANIMATION_TRANSLATED_LOCALES,
    canonicalLocale: course.contentLocale,
    page: mathAnimationModulePage(module),
    title: `${current.copy.title} · ${course.copy.meta.title}`,
    description: current.copy.summary,
    siteName: t("brand.name"),
  });
}

export default async function MathAnimationModulePage({ params }: Props) {
  const { locale, module } = await params;
  if (!isMathAnimationLocale(locale) || !isMathAnimationModuleSlug(module)) notFound();
  assertValidMathAnimationCourse();

  const [course, current, messages] = await Promise.all([
    loadMathAnimationCourse(locale),
    getMathAnimationModule(locale, module),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const moduleUrl = urlFor(course.contentLocale, mathAnimationModulePage(module));
  const courseUrl = urlFor(course.contentLocale, "math-animation/");
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        name: current.copy.title,
        description: current.copy.summary,
        url: moduleUrl,
        inLanguage: course.contentLocale,
        learningResourceType: "module",
        educationalUse: "instruction",
        position: current.order,
        timeRequired: `PT${current.minutes}M`,
        isAccessibleForFree: true,
        isPartOf: {
          "@type": "Course",
          name: course.copy.meta.title,
          courseCode: "19",
          url: courseUrl,
          provider: { "@id": `${SITE}/#org` },
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
          {
            "@type": "ListItem",
            position: 3,
            name: current.copy.title,
            item: moduleUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={data} />
      <ModuleView course={course} module={current} />
    </>
  );
}
