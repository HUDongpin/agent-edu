import Portrait from "@/components/about/Portrait";
import { CREATOR, TEAM, type Person } from "@/lib/team";
import { LOCALE_CODES, getMessages, translator } from "@/lib/i18n";
import type { Metadata } from "next";

export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const t = translator(await getMessages(locale));
  return { title: `${t("ab.title")} · aicourse.top`, description: t("ab.lede") };
}

function Card({ p, t, lead = false }: { p: Person; t: (k: string) => string; lead?: boolean }) {
  return (
    <article className={"person" + (lead ? " lead" : "")}>
      <Portrait initials={p.initials} hue={p.hue} photo={p.photo} focus={p.focus}
        size={lead ? 96 : 76} />
      <div className="pbody">
        <span className="prole" style={{ color: p.hue }}>{t(`ab.p.${p.id}.role`)}</span>
        <h3>{p.name}</h3>
        <p className="paff">{t(`ab.p.${p.id}.aff`)}</p>
        <p className="pbio">{t(`ab.p.${p.id}.bio`)}</p>
        <ul className="pareas" aria-label={t("ab.areas")}>
          {p.areas.map((a) => (
            <li key={a} style={{ borderColor: p.hue, color: p.hue }}>{t(`area.${a}`)}</li>
          ))}
        </ul>
        {p.links.length > 0 && (
          <p className="plinks">
            <span className="mono-note">{t("ab.links")}</span>{" "}
            {p.links.map((l, i) => (
              <span key={l.href}>
                {i > 0 && <span aria-hidden="true"> · </span>}
                <a href={l.href} rel="noopener noreferrer" target="_blank">{l.label}</a>
              </span>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = translator(await getMessages(locale));

  return (
    <div className="shellwrap">
      <section className="sect" style={{ paddingBottom: 10 }}>
        <h1 style={{ fontSize: "clamp(26px,4vw,38px)" }}>{t("ab.title")}</h1>
        <p className="lede" style={{ margin: "10px 0 0", maxWidth: "64ch" }}>{t("ab.lede")}</p>
      </section>

      <section className="sect" style={{ paddingTop: 22 }}>
        <span className="eyebrow">{t("ab.creatorLabel")}</span>
        <div style={{ marginTop: 12 }}><Card p={CREATOR} t={t} lead /></div>
      </section>

      <section className="sect">
        <span className="eyebrow">{t("ab.teamLabel")}</span>
        <p className="sub" style={{ textAlign: "start", margin: "8px 0 0" }}>{t("ab.teamLede")}</p>
        <div className="people">
          {TEAM.map((p) => <Card key={p.id} p={p} t={t} />)}
        </div>
      </section>

      <section className="sect">
        <div className="grid2">
          <div className="out" style={{ alignItems: "flex-start" }}>
            <span className="ico" aria-hidden="true">❓</span>
            <div>
              <h4>{t("ab.whyTitle")}</h4>
              <p>{t("ab.why1")}</p>
              <p style={{ marginBottom: 0 }}>{t("ab.why2")}</p>
            </div>
          </div>
          <div className="out" style={{ alignItems: "flex-start" }}>
            <span className="ico" aria-hidden="true">🔧</span>
            <div>
              <h4>{t("ab.howTitle")}</h4>
              <p>{t("ab.how1")}</p>
              <p style={{ marginBottom: 0 }}>{t("ab.how2")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
