import type { Metadata } from "next";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import CourseDashboard from "@/staging/course-src/creator-ops/components/CourseDashboard";
import {
  CREATOR_OPS_LOCALES,
  CREATOR_OPS_TRANSLATED_LOCALES,
  assertValidCreatorOpsCourse,
  creatorOpsModulePage,
  isCreatorOpsLocale,
  loadCreatorOpsCourse,
} from "@/staging/course-src/creator-ops/lib";
import { getMessages, translator } from "@/lib/i18n";
import { seoFor, SITE, urlFor } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return CREATOR_OPS_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isCreatorOpsLocale(locale)) notFound();
  const [course, messages] = await Promise.all([
    loadCreatorOpsCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  return seoFor({
    locale,
    availableLocales: CREATOR_OPS_TRANSLATED_LOCALES,
    canonicalLocale: course.contentLocale,
    page: "creator-ops/",
    title: `${course.copy.meta.title} · aicourse.top`,
    description: course.copy.meta.summary,
    siteName: t("brand.name"),
  });
}

export default async function CreatorOpsCoursePage({ params }: Props) {
  const { locale } = await params;
  if (!isCreatorOpsLocale(locale)) notFound();
  assertValidCreatorOpsCourse();
  const [course, messages] = await Promise.all([
    loadCreatorOpsCourse(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const totalMinutes = course.modules.reduce((sum, module) => sum + module.minutes, 0);
  const courseUrl = urlFor(course.contentLocale, "creator-ops/");
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        name: course.copy.meta.title,
        description: course.copy.meta.summary,
        courseCode: "16",
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
          url: urlFor(course.contentLocale, creatorOpsModulePage(module.slug)),
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
          { "@type": "ListItem", position: 1, name: t("nav.courses"), item: urlFor(course.contentLocale, "courses/") },
          { "@type": "ListItem", position: 2, name: course.copy.meta.title, item: courseUrl },
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
