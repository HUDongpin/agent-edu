import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import ModuleView from "@/staging/course-src/creator-ops/components/ModuleView";
import {
  CREATOR_OPS_MODULE_SLUGS,
  CREATOR_OPS_TRANSLATED_LOCALES,
  assertValidCreatorOpsCourse,
  creatorOpsModulePage,
  getCreatorOpsModule,
  isCreatorOpsLocale,
  isCreatorOpsModuleSlug,
  loadCreatorOpsCourse,
} from "@/staging/course-src/creator-ops/lib";
import { getMessages, translator } from "@/lib/i18n";
import { seoFor, SITE, urlFor } from "@/lib/seo";

type Props = { params: Promise<{ locale: string; module: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return CREATOR_OPS_MODULE_SLUGS.map((module) => ({ module }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, module } = await params;
  if (!isCreatorOpsLocale(locale) || !isCreatorOpsModuleSlug(module)) notFound();
  const [course, current, messages] = await Promise.all([
    loadCreatorOpsCourse(locale),
    getCreatorOpsModule(locale, module),
    getMessages(locale),
  ]);
  const t = translator(messages);
  return seoFor({
    locale,
    availableLocales: CREATOR_OPS_TRANSLATED_LOCALES,
    canonicalLocale: course.contentLocale,
    page: creatorOpsModulePage(module),
    title: `${current.copy.title} · ${course.copy.meta.title}`,
    description: current.copy.summary,
    siteName: t("brand.name"),
  });
}

export default async function CreatorOpsModulePage({ params }: Props) {
  const { locale, module } = await params;
  if (!isCreatorOpsLocale(locale) || !isCreatorOpsModuleSlug(module)) notFound();
  assertValidCreatorOpsCourse();
  const [course, current, messages] = await Promise.all([
    loadCreatorOpsCourse(locale),
    getCreatorOpsModule(locale, module),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const moduleUrl = urlFor(course.contentLocale, creatorOpsModulePage(module));
  const courseUrl = urlFor(course.contentLocale, "creator-ops/");
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
          courseCode: "16",
          url: courseUrl,
          provider: { "@id": `${SITE}/#org` },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("nav.courses"), item: urlFor(course.contentLocale, "courses/") },
          { "@type": "ListItem", position: 2, name: course.copy.meta.title, item: courseUrl },
          { "@type": "ListItem", position: 3, name: current.copy.title, item: moduleUrl },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={data} />
      <ModuleView course={course} module={current} catalogLabel={t("nav.courses")} />
    </>
  );
}
