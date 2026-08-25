import Handbook from "@/components/handbook/Handbook";
import JsonLd from "@/components/JsonLd";
import { loadWidgetCopy } from "@/lib/handbook/copy";
import { localiseHandbook } from "@/lib/handbook/localise";
import { getMessages, translator } from "@/lib/i18n";
import { courseLocaleParams } from "@/lib/release-surface";
import { SITE, seoFor, urlFor } from "@/lib/seo";
import type { Metadata } from "next";

export function generateStaticParams() {
  return courseLocaleParams("agentic");
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const t = translator(await getMessages(locale));
  return seoFor({
    locale, page: "handbook/",
    title: `${t("track.1.title")} · aicourse.top`,
    description: t("track.1.desc"),
    siteName: t("brand.name"),
  });
}

/* The markup is localised here rather than in the browser, so the exported
   file for each locale is already in that language — the point of giving the
   handbook nine URLs in the first place. */
export default async function HandbookPage(
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const [{ html, localised }, copy, messages] = await Promise.all([
    localiseHandbook(locale),
    loadWidgetCopy(locale),
    getMessages(locale),
  ]);
  const t = translator(messages);
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Course",
        courseCode: "1",
        name: t("c.agentic.title"),
        description: t("c.agentic.blurb"),
        url: urlFor(locale, "handbook/"),
        provider: { "@id": `${SITE}/#org` },
        inLanguage: locale,
        isAccessibleForFree: true,
        hasPart: [
          { "@type": "LearningResource", name: t("track.1.title"), url: urlFor(locale, "handbook/"), inLanguage: locale },
          { "@type": "LearningResource", name: t("track.2.title"), url: urlFor(locale, "lab/"), inLanguage: locale },
          { "@type": "LearningResource", name: t("track.3.title"), url: urlFor(locale, "build/"), inLanguage: locale },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: t("nav.courses"), item: urlFor(locale, "courses/") },
          { "@type": "ListItem", position: 2, name: t("c.agentic.title"), item: urlFor(locale, "handbook/") },
        ],
      },
    ],
  };
  return (
    <>
      <JsonLd data={data} />
      <Handbook html={html} localised={localised} copy={copy} />
    </>
  );
}
