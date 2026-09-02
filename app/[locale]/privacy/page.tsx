import JsonLd from "@/components/JsonLd";
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
    page: "privacy/",
    title: `${t("privacy.title")} · aicourse.top`,
    description: t("privacy.lede"),
    siteName: t("brand.name"),
  });
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = translator(await getMessages(locale));
  const pageUrl = urlFor(locale, "privacy/");

  const page = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("privacy.title"),
    description: t("privacy.lede"),
    url: pageUrl,
    isPartOf: { "@id": `${SITE}/#website` },
    inLanguage: locale,
    dateModified: "2026-08-26",
  };

  const sections = [
    ["privacy.accountTitle", "privacy.accountBody"],
    ["privacy.browserTitle", "privacy.browserBody"],
    ["privacy.recoveryTitle", "privacy.recoveryBody"],
    ["privacy.draftTitle", "privacy.draftBody"],
    ["privacy.keyTitle", "privacy.keyBody"],
    ["privacy.providerTitle", "privacy.providerBody"],
    ["privacy.analyticsTitle", "privacy.analyticsBody"],
    ["privacy.controlsTitle", "privacy.controlsBody"],
    ["privacy.boundaryTitle", "privacy.boundaryBody"],
  ] as const;

  return (
    <div className="shellwrap privacy-page">
      <JsonLd data={page} />
      <section className="hero">
        <span className="eyebrow">{t("privacy.kicker")}</span>
        <h1>{t("privacy.title")}</h1>
        <p className="lede">{t("privacy.lede")}</p>
        <p className="small">{t("privacy.updated")}</p>
      </section>

      <section className="sect" aria-label={t("privacy.title")}>
        <div className="grid2">
          {sections.map(([titleKey, bodyKey]) => (
            <article className="card" key={titleKey}>
              <div className="card-b">
                <h2>{t(titleKey)}</h2>
                <p>{t(bodyKey)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="sect">
        <h2>{t("privacy.contactTitle")}</h2>
        <p>{t("privacy.contactBody")}</p>
        <p>
          <a href="https://github.com/HUDongpin/agent-edu/issues" rel="noopener">
            {t("privacy.contactCta")}
          </a>
        </p>
      </section>
    </div>
  );
}
