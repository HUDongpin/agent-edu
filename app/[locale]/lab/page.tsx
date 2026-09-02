import Lab from "@/components/lab/Lab";
import JsonLd from "@/components/JsonLd";
import AgenticTrackNav from "@/components/AgenticTrackNav";
import { getMessages, translator } from "@/lib/i18n";
import { courseLocaleParams } from "@/lib/release-surface";
import { SITE, seoFor, urlFor } from "@/lib/seo";
import type { Metadata } from "next";

export const dynamicParams = false;

export function generateStaticParams() {
  return courseLocaleParams("agentic");
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = translator(await getMessages(locale));
  return seoFor({
    locale, page: "lab/",
    title: `${t("track.2.title")} · aicourse.top`,
    description: t("track.2.desc"),
    siteName: t("brand.name"),
  });
}

export default async function LabPage(
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const t = translator(await getMessages(locale));
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        name: t("track.2.title"),
        description: t("track.2.desc"),
        url: urlFor(locale, "lab/"),
        inLanguage: locale,
        isAccessibleForFree: true,
        isPartOf: {
          "@type": "Course",
          name: t("c.agentic.title"),
          url: urlFor(locale, "handbook/"),
          provider: { "@id": `${SITE}/#org` },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("nav.courses"), item: urlFor(locale, "courses/") },
          { "@type": "ListItem", position: 2, name: t("c.agentic.title"), item: urlFor(locale, "handbook/") },
          { "@type": "ListItem", position: 3, name: t("track.2.title"), item: urlFor(locale, "lab/") },
        ],
      },
    ],
  };
  return (
    <>
      <JsonLd data={data} />
      <div className="shellwrap"><AgenticTrackNav locale={locale} current="lab" /></div>
      <Lab />
    </>
  );
}
