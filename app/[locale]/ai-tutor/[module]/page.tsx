import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import ModuleView from "@/components/ai-tutor/ModuleView";
import {
  AI_TUTOR_MODULE_SLUGS,
  AI_TUTOR_TRANSLATED_LOCALES,
  assertValidAiTutorCourse,
  getAiTutorModule,
  isAiTutorLocale,
  isAiTutorModuleSlug,
  loadAiTutorCourse,
} from "@/lib/ai-tutor";
import { getMessages, translator } from "@/lib/i18n";
import { courseChildParams } from "@/lib/release-surface";
import { aiTutorModulePage, seoFor, SITE, urlFor } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; module: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return courseChildParams("ai-tutor", "module", AI_TUTOR_MODULE_SLUGS);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, module } = await params;
  if (!isAiTutorLocale(locale) || !isAiTutorModuleSlug(module)) notFound();
  const [course, current, messages] = await Promise.all([
    loadAiTutorCourse(locale),
    getAiTutorModule(locale, module),
    getMessages(locale),
  ]);
  const t = translator(messages);
  return seoFor({
    locale,
    availableLocales: AI_TUTOR_TRANSLATED_LOCALES,
    canonicalLocale: course.contentLocale,
    page: aiTutorModulePage(module),
    title: `${current.copy.title} · AI Tutor & Learning Systems Engineering`,
    description: current.copy.summary,
    siteName: t("brand.name"),
  });
}

export default async function AiTutorModulePage({ params }: Props) {
  const { locale, module } = await params;
  if (!isAiTutorLocale(locale) || !isAiTutorModuleSlug(module)) notFound();
  assertValidAiTutorCourse();

  const [course, current, messages] = await Promise.all([
    loadAiTutorCourse(locale),
    getAiTutorModule(locale, module),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const moduleUrl = urlFor(course.contentLocale, aiTutorModulePage(module));
  const courseUrl = urlFor(course.contentLocale, "ai-tutor/");
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
          courseCode: "13",
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
