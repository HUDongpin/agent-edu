import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import ModuleView from "@/components/product-management/ModuleView";
import {
  PRODUCT_MANAGEMENT_MODULE_SLUGS,
  PRODUCT_MANAGEMENT_TRANSLATED_LOCALES,
  assertValidProductManagementCourse,
  getProductManagementModule,
  isProductManagementLocale,
  isProductManagementModuleSlug,
  loadProductManagementCourse,
} from "@/lib/product-management";
import { getMessages, translator } from "@/lib/i18n";
import { courseChildParams } from "@/lib/release-surface";
import {
  productManagementModulePage,
  seoFor,
  SITE,
  urlFor,
} from "@/lib/seo";

type Props = { params: Promise<{ locale: string; module: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return courseChildParams(
    "product-management",
    "module",
    PRODUCT_MANAGEMENT_MODULE_SLUGS,
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, module } = await params;
  if (!isProductManagementLocale(locale) || !isProductManagementModuleSlug(module)) {
    notFound();
  }
  const [course, current, messages] = await Promise.all([
    loadProductManagementCourse(locale),
    getProductManagementModule(locale, module),
    getMessages(locale),
  ]);
  const t = translator(messages);
  return seoFor({
    locale,
    availableLocales: PRODUCT_MANAGEMENT_TRANSLATED_LOCALES,
    canonicalLocale: course.contentLocale,
    page: productManagementModulePage(module),
    title: `${current.copy.title} · ${course.copy.meta.title}`,
    description: current.copy.summary,
    siteName: t("brand.name"),
  });
}

export default async function ProductManagementModulePage({ params }: Props) {
  const { locale, module } = await params;
  if (!isProductManagementLocale(locale) || !isProductManagementModuleSlug(module)) {
    notFound();
  }
  assertValidProductManagementCourse();

  const [course, current, messages] = await Promise.all([
    loadProductManagementCourse(locale),
    getProductManagementModule(locale, module),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const moduleUrl = urlFor(
    course.contentLocale,
    productManagementModulePage(module),
  );
  const courseUrl = urlFor(course.contentLocale, "product-management/");
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
          courseCode: "14",
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
