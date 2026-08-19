import Catalog from "@/components/courses/Catalog";
import { LOCALE_CODES, getMessages, translator } from "@/lib/i18n";
import { SITE, seoFor, urlFor } from "@/lib/seo";
import { COURSES } from "@/lib/courses";
import JsonLd from "@/components/JsonLd";
import type { Metadata } from "next";

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const t = translator(await getMessages(locale));
  return seoFor({
    locale, page: "courses/",
    title: `${t("cat.title")} · aicourse.top`,
    description: t("cat.lede"),
    siteName: t("brand.name"),
  });
}

export default async function CoursesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = translator(await getMessages(locale));

  /* Only the courses that exist. The three `soon` entries are greyed out on
     the page for a reason; a crawler should be told the same thing the
     reader is. */
  const list = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: COURSES.filter((c) => c.status === "available").map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Course",
        name: t(`c.${c.id}.title`),
        description: t(`c.${c.id}.blurb`),
        url: c.external ? c.href : `${urlFor(locale)}${c.href.replace(/^\//, "")}`,
        provider: { "@id": `${SITE}/#org` },
        inLanguage: locale,
        educationalLevel: c.level,
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer", price: 0, priceCurrency: "USD",
          category: "Free", availability: "https://schema.org/InStock",
        },
        hasCourseInstance: {
          "@type": "CourseInstance",
          courseMode: "online",
          courseWorkload: `PT${c.minutes}M`,
        },
      },
    })),
  };

  return (
    <>
      <JsonLd data={list} />
      <Catalog locale={locale} />
    </>
  );
}
