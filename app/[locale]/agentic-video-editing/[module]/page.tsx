import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import ModuleView from "@/components/agentic-video-editing/ModuleView";
import {
  AGENTIC_VIDEO_EDITING_MODULE_SLUGS,
  AGENTIC_VIDEO_EDITING_TRANSLATED_LOCALES,
  getAgenticVideoEditingModule,
  isAgenticVideoEditingLocale,
  isAgenticVideoEditingModuleSlug,
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

type Props = { params: Promise<{ locale: string; module: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return AGENTIC_VIDEO_EDITING_MODULE_SLUGS.map((module) => ({ module }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, module } = await params;
  if (!isAgenticVideoEditingLocale(locale) || !isAgenticVideoEditingModuleSlug(module)) {
    notFound();
  }
  const [course, current, messages] = await Promise.all([
    loadAgenticVideoEditingCourse(locale),
    getAgenticVideoEditingModule(locale, module),
    getMessages(locale),
  ]);
  const t = translator(messages);
  return seoFor({
    locale,
    availableLocales: AGENTIC_VIDEO_EDITING_TRANSLATED_LOCALES,
    canonicalLocale: course.contentLocale,
    page: agenticVideoEditingModulePage(module),
    title: `${current.copy.title} · ${course.copy.meta.title}`,
    description: current.copy.summary,
    siteName: t("brand.name"),
  });
}

export default async function AgenticVideoEditingModulePage({ params }: Props) {
  const { locale, module } = await params;
  if (!isAgenticVideoEditingLocale(locale) || !isAgenticVideoEditingModuleSlug(module)) {
    notFound();
  }
  const validationErrors = validateAgenticVideoEditingCourse();
  if (validationErrors.length) {
    throw new Error(`Invalid Course 20 contract:\n${validationErrors.join("\n")}`);
  }

  const [course, current, messages] = await Promise.all([
    loadAgenticVideoEditingCourse(locale),
    getAgenticVideoEditingModule(locale, module),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const moduleUrl = urlFor(course.contentLocale, agenticVideoEditingModulePage(module));
  const courseUrl = urlFor(course.contentLocale, "agentic-video-editing/");
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
          courseCode: "20",
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
