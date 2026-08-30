import JsonLd from "@/components/JsonLd";
import MyLearning from "@/components/learning/MyLearning";
import { LOCALE_CODES, getMessages, translator } from "@/lib/i18n";
import { SITE, seoFor, urlFor } from "@/lib/seo";
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
    locale,
    page: "learning/",
    title: `${t("learning.title")} · aicourse.top`,
    description: t("learning.lede"),
    siteName: t("brand.name"),
  });
}

export default async function LearningPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = translator(await getMessages(locale));
  const pageUrl = urlFor(locale, "learning/");
  const page = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("learning.title"),
    description: t("learning.lede"),
    url: pageUrl,
    isPartOf: { "@id": `${SITE}/#website` },
    inLanguage: locale,
    dateModified: "2026-08-26",
  };

  return (
    <div className="shellwrap learning-page">
      <JsonLd data={page} />
      <section className="hero learning-hero">
        <span className="eyebrow">{t("learning.kicker")}</span>
        <h1>{t("learning.title")}</h1>
        <p className="lede">{t("learning.lede")}</p>
      </section>
      <MyLearning locale={locale} />
    </div>
  );
}
