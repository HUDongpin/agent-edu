import Link from "next/link";
import Progress from "@/components/Progress";
import { LOCALE_CODES, getMessages, translator } from "@/lib/i18n";

/* Every route under [locale] declares its own params. The layout's are not
   inherited for export purposes, and without this the exporter cannot tell
   which locales `/` expands to. */
export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }));
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = translator(await getMessages(locale));
  const p = (path: string) => `/${locale}${path}`;

  const tracks = [
    { n: 1, colour: "var(--brand)",  k: "1", href: p("/handbook/"), primary: false },
    { n: 2, colour: "var(--green)",  k: "2", href: p("/lab/"),      primary: true  },
    { n: 3, colour: "var(--violet)", k: "3", href: "https://github.com/HUDongpin/agent-edu/tree/main/course", primary: false },
  ];

  const outcomes = ["1", "2", "3", "4"].map((i) => ({
    icon: { "1": "🎛️", "2": "📊", "3": "🔁", "4": "🔒" }[i]!,
    title: t(`home.learn${i}`),
    desc: t(`home.learn${i}d`),
  }));

  return (
    <div className="shellwrap">
      <section className="hero">
        <span className="eyebrow">{t("home.kicker")}</span>
        <h1>
          {t("home.h1")} <span className="soft">{t("home.h1b")}</span>
        </h1>
        <p className="lede">{t("home.lede")}</p>
        <div className="acts">
          <Link className="btn primary" href={p("/lab/")}>
            {t("home.cta")}<span className="arrow">→</span>
          </Link>
          <Link className="btn" href={p("/courses/")}>{t("home.cta2")}</Link>
        </div>
        <p className="free">{t("home.free")}</p>
      </section>

      <section className="sect" id="curriculum">
        <h2>{t("home.pathTitle")}</h2>
        <p className="sub">{t("home.pathLede")}</p>
        <div className="tracks">
          {tracks.map((tr) => (
            <article className="track" key={tr.k} style={{ ["--tc" as string]: tr.colour }}>
              <span className="num" aria-hidden="true">{tr.n}</span>
              <span className="tag">{t(`track.${tr.k}.tag`)}</span>
              <h3>{t(`track.${tr.k}.title`)}</h3>
              <p>{t(`track.${tr.k}.desc`)}</p>
              <div className="meta">{t(`track.${tr.k}.meta`)}</div>
              {tr.href.startsWith("http") ? (
                <a className="btn" href={tr.href} rel="noopener">
                  {t(`track.${tr.k}.cta`)}<span className="arrow">→</span>
                </a>
              ) : (
                <Link className={"btn" + (tr.primary ? " primary" : "")} href={tr.href}>
                  {t(`track.${tr.k}.cta`)}<span className="arrow">→</span>
                </Link>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="sect">
        <h2>{t("home.learnTitle")}</h2>
        <div className="grid2">
          {outcomes.map((o) => (
            <div className="out" key={o.title}>
              <span className="ico" aria-hidden="true">{o.icon}</span>
              <div><h4>{o.title}</h4><p>{o.desc}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="sect">
        <h2>{t("home.forTitle")}</h2>
        <div className="who">
          {["1", "2", "3"].map((i) => (
            <div key={i}><h4>{t(`home.for${i}`)}</h4><p>{t(`home.for${i}d`)}</p></div>
          ))}
        </div>
      </section>

      <section className="sect">
        <h2>{t("home.progTitle")}</h2>
        <Progress locale={locale} />
      </section>

      <section className="sect">
        <h2>{t("home.faqTitle")}</h2>
        <div className="faq">
          {["1", "2", "3", "4"].map((i) => (
            <details key={i}>
              <summary>{t(`home.q${i}`)}</summary>
              <p>{t(`home.a${i}`)}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
