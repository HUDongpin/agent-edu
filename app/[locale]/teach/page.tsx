import JsonLd from "@/components/JsonLd";
import PrintButton from "@/components/teachers/PrintButton";
import TeacherGuide, { type TeacherPlan } from "@/components/teachers/TeacherGuide";
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
  const handbook = `/${locale}/handbook/`;
  const lab = `/${locale}/lab/`;
  const build = `/${locale}/build/`;
  const plans: readonly TeacherPlan[] = [
    {
      minutes: 45,
      description: t("teach.plan45"),
      stops: [
        { range: "0–10", label: t("track.1.title"), href: handbook },
        { range: "10–25", label: t("track.2.title"), href: lab },
        { range: "25–40", label: t("lab.s4.name"), href: `${lab}#s4` },
        { range: "40–45", label: t("teach.evidenceTitle") },
      ],
    },
    {
      minutes: 90,
      description: t("teach.plan90"),
      stops: [
        { range: "0–20", label: t("track.1.title"), href: handbook },
        { range: "20–40", label: t("track.2.title"), href: lab },
        { range: "40–65", label: t("lab.s4.name"), href: `${lab}#s4` },
        { range: "65–80", label: t("teach.worksheetTitle"), href: "#worksheet" },
        { range: "80–90", label: t("teach.evidenceTitle") },
      ],
    },
    {
      minutes: 180,
      description: t("teach.plan180"),
      stops: [
        { range: "0–30", label: t("track.1.title"), href: handbook },
        { range: "30–60", label: t("track.2.title"), href: lab },
        { range: "60–100", label: t("lab.s4.name"), href: `${lab}#s4` },
        { range: "100–125", label: t("teach.worksheetTitle"), href: "#worksheet" },
        { range: "125–155", label: t("track.3.title"), href: build },
        { range: "155–180", label: t("teach.rubricTitle") },
      ],
    },
  ];

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
        <TeacherGuide
          chooseTitle={t("teach.chooseTitle")}
          prepareTitle={t("teach.beforeTitle")}
          followTitle={t("teach.followTitle")}
          selectedLabel={t("teach.selectedPlan")}
          plans={plans}
          prepare={(
            <>
              <ol>
                <li>{t("teach.before1")}</li>
                <li>{t("teach.before2")}</li>
                <li>{t("teach.before3")}</li>
                <li>{t("teach.before4")}</li>
              </ol>
              <div>
                <h3>{t("teach.noKeyTitle")}</h3>
                <p>{t("teach.noKeyBody")}</p>
                <div className="acts">
                  <Link className="btn" href={handbook}>{t("track.1.cta")}</Link>
                  <Link className="btn" href={lab}>{t("track.2.cta")}</Link>
                  <Link className="btn" href={build} data-teach-offline="part-3">
                    {t("build.openRepo")}
                  </Link>
                </div>
              </div>
            </>
          )}
          supportLabel={t("teach.supportTitle")}
          support={(
            <>
              <section>
                <h2>{t("teach.callsTitle")}</h2>
                <p>{t("teach.callsBody")}</p>
                <div className="scroll"><table>
                  <thead><tr><th>{t("teach.action")}</th><th>{t("teach.calls")}</th><th>{t("teach.output")}</th></tr></thead>
                  <tbody>
                    <tr><td>{t("lab.s1.name")}</td><td>1</td><td>250 tokens</td></tr>
                    <tr><td>{t("lab.s3.name")}</td><td>3</td><td>3 × 300 tokens</td></tr>
                    <tr><td>{t("lab.s4.name")}</td><td>20 + 8 = 28</td><td>7,600 tokens</td></tr>
                    <tr><td>{t("teach.journey")}</td><td>60</td><td>16,350 tokens</td></tr>
                  </tbody>
                </table></div>
                <p className="small">{t("teach.stopBody")}</p>
              </section>

              <section id="worksheet">
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

              <section>
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

              <section>
                <h2>{t("teach.evidenceTitle")}</h2>
                <p>{t("teach.evidenceBody")}</p>
                <p className="small">{t("teach.privacyBody")}</p>
              </section>
            </>
          )}
        />
      </section>
    </div>
  );
}
