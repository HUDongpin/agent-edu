import JsonLd from "@/components/JsonLd";
import PrintButton from "@/components/teachers/PrintButton";
import { LOCALE_CODES, getMessages, translator } from "@/lib/i18n";
import { SITE, seoFor, urlFor } from "@/lib/seo";
import Link from "next/link";
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
    page: "teach/",
    title: `${t("teach.title")} · aicourse.top`,
    description: t("teach.lede"),
    siteName: t("brand.name"),
  });
}

export default async function TeachPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = translator(await getMessages(locale));
  const formatNumber = new Intl.NumberFormat(locale).format;
  const handbook = `/${locale}/handbook/`;
  const lab = `/${locale}/lab/`;
  const build = `/${locale}/build/`;

  const resource = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: t("teach.title"),
    description: t("teach.lede"),
    url: urlFor(locale, "teach/"),
    creator: { "@id": `${SITE}/#org` },
    inLanguage: locale,
    isAccessibleForFree: true,
    educationalUse: "lesson plan",
  };

  return (
    <div className="shellwrap teacher-pack">
      <JsonLd data={resource} />
      <section className="hero">
        <span className="eyebrow">{t("nav.teach")}</span>
        <h1>{t("teach.title")}</h1>
        <p className="lede">{t("teach.lede")}</p>
        <div className="acts">
          <PrintButton label={t("teach.print")} />
          <a className="btn" href="/teacher-pack.txt" hrefLang="en" lang="en" download>
            {t("teach.download")}
          </a>
        </div>
      </section>

      <section className="sect">
        <h2>{t("teach.chooseTitle")}</h2>
        <div className="grid2">
          <article className="card"><div className="card-b"><h3>{formatNumber(45)} {t("ui.minutes")}</h3><p>{t("teach.plan45")}</p></div></article>
          <article className="card"><div className="card-b"><h3>{formatNumber(90)} {t("ui.minutes")}</h3><p>{t("teach.plan90")}</p></div></article>
          <article className="card"><div className="card-b"><h3>{formatNumber(180)} {t("ui.minutes")}</h3><p>{t("teach.plan180")}</p></div></article>
        </div>
      </section>

      <section className="sect">
        <h2>{t("teach.beforeTitle")}</h2>
        <ol>
          <li>{t("teach.before1")}</li>
          <li>{t("teach.before2")}</li>
          <li>{t("teach.before3")}</li>
          <li>{t("teach.before4")}</li>
        </ol>
      </section>

      <section className="sect">
        <h2>{t("teach.noKeyTitle")}</h2>
        <p>{t("teach.noKeyBody")}</p>
        <div className="acts">
          <Link className="btn" href={handbook}>{t("track.1.cta")}</Link>
          <Link className="btn" href={lab}>{t("track.2.cta")}</Link>
          <Link className="btn" href={build} data-teach-offline="part-3">
            {t("build.openRepo")}
          </Link>
        </div>
      </section>

      <section className="sect">
        <h2>{t("teach.callsTitle")}</h2>
        <p>{t("teach.callsBody")}</p>
        <div className="scroll"><table>
          <thead><tr><th>{t("teach.action")}</th><th>{t("teach.calls")}</th><th>{t("teach.output")}</th></tr></thead>
          <tbody>
            <tr><td>{t("lab.s1.name")}</td><td>{formatNumber(1)}</td><td>{formatNumber(250)} {t("teach.tokenUnit")}</td></tr>
            <tr><td>{t("lab.s3.name")}</td><td>{formatNumber(3)}</td><td>{formatNumber(3)} × {formatNumber(300)} {t("teach.tokenUnit")}</td></tr>
            <tr><td>{t("lab.s4.name")}</td><td>{formatNumber(20)} + {formatNumber(8)} = {formatNumber(28)}</td><td>{formatNumber(7600)} {t("teach.tokenUnit")}</td></tr>
            <tr><td>{t("teach.journey")}</td><td>{formatNumber(60)}</td><td>{formatNumber(16350)} {t("teach.tokenUnit")}</td></tr>
          </tbody>
        </table></div>
        <p className="small">{t("teach.stopBody")}</p>
      </section>

      <section className="sect" id="worksheet">
        <h2>{t("teach.worksheetTitle")}</h2>
        <ol>
          <li>{t("teach.work1")}</li>
          <li>{t("teach.work2")}</li>
          <li>{t("teach.work3")}</li>
          <li>{t("teach.work4")}</li>
          <li>{t("teach.work5")}</li>
          <li>{t("teach.work6")}</li>
        </ol>
      </section>

      <section className="sect">
        <h2>{t("teach.rubricTitle")}</h2>
        <p>{t("teach.rubricBody")}</p>
        <ul>
          <li>{t("teach.rubricBoundary")}</li>
          <li>{t("teach.rubricFailure")}</li>
          <li>{t("teach.rubricEval")}</li>
          <li>{t("teach.rubricGate")}</li>
          <li>{t("teach.rubricTrust")}</li>
          <li>{t("teach.rubricReview")}</li>
        </ul>
      </section>

      <section className="sect">
        <h2>{t("teach.evidenceTitle")}</h2>
        <p>{t("teach.evidenceBody")}</p>
        <p className="small">{t("teach.privacyBody")}</p>
      </section>
    </div>
  );
}
