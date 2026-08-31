import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import ModuleView from "@/components/ai-teaching/ModuleView";
import {
  AGENTIC_TEACHING_TRANSLATED_LOCALES,
  assertValidAgenticTeachingCourse,
  getAgenticTeachingModule,
  isAgenticTeachingLocale,
  isAgenticTeachingModuleSlug,
  loadAgenticTeachingCourse,
} from "@/lib/ai-teaching";
import { AGENTIC_TEACHING_MODULE_SLUGS } from "@/lib/ai-teaching/types";
import { getMessages, translator } from "@/lib/i18n";
import { agenticTeachingModulePage, seoFor, SITE, urlFor } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; module: string }> };

const COURSE_PAGE = "ai-teaching/";

export const dynamicParams = false;

export function generateStaticParams() {
  return AGENTIC_TEACHING_MODULE_SLUGS.map((module) => ({ module }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, module } = await params;
  if (!isAgenticTeachingLocale(locale) || !isAgenticTeachingModuleSlug(module)) {
    notFound();
  }

  const [course, current, messages] = await Promise.all([
    loadAgenticTeachingCourse(locale),
    getAgenticTeachingModule(locale, module),
    getMessages(locale),
  ]);
  const t = translator(messages);

  return seoFor({
    locale,
    availableLocales: AGENTIC_TEACHING_TRANSLATED_LOCALES,
    canonicalLocale: course.contentLocale,
    page: agenticTeachingModulePage(module),
    title: `${current.copy.title} · ${course.copy.meta.title}`,
    description: current.copy.summary,
    siteName: t("brand.name"),
  });
}

export default async function AgenticTeachingModulePage({ params }: Props) {
  const { locale, module } = await params;
  if (!isAgenticTeachingLocale(locale) || !isAgenticTeachingModuleSlug(module)) {
    notFound();
  }
  await assertValidAgenticTeachingCourse();

  const [course, current, messages] = await Promise.all([
    loadAgenticTeachingCourse(locale),
    getAgenticTeachingModule(locale, module),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const courseUrl = urlFor(course.contentLocale, COURSE_PAGE);
  const moduleUrl = urlFor(
    course.contentLocale,
    agenticTeachingModulePage(module),
  );
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        name: current.copy.title,
        description: current.copy.summary,
        url: moduleUrl,
        inLanguage: course.contentLocale,
        learningResourceType: "course module",
        educationalUse: "instruction",
        position: current.order,
        timeRequired: `PT${current.minutes}M`,
        isAccessibleForFree: true,
        audience: current.audiences.map((audience) => ({
          "@type": "Audience",
          audienceType: audience,
        })),
        isPartOf: {
          "@type": "Course",
          name: course.copy.meta.title,
          courseCode: "18",
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
      <ModuleView
        course={course}
        module={current}
        catalogLabel={t("nav.courses")}
      />
    </>
  );
}
