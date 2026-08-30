import Link from "next/link";
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

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale } = await params;
  const t = translator(await getMessages(locale));
  return seoFor({
    locale,
    page: "build/",
    title: `${t("build.title")} · aicourse.top`,
    description: t("build.lede"),
    siteName: t("brand.name"),
  });
}

export default async function BuildPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = translator(await getMessages(locale));
  const p = (path: string) => `/${locale}${path}`;
  const courseUrl = "https://github.com/HUDongpin/agent-edu/tree/main/course";

  const course = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LearningResource",
        name: t("track.3.title"),
        description: t("track.3.desc"),
        url: urlFor(locale, "build/"),
        inLanguage: locale,
        educationalLevel: "Intermediate",
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
          { "@type": "ListItem", position: 3, name: t("track.3.title"), item: urlFor(locale, "build/") },
        ],
      },
    ],
  };

  return (
    <div className="shellwrap build-page">
      <JsonLd data={course} />
      <AgenticTrackNav locale={locale} current="build" />
      <section className="hero">
        <span className="eyebrow">{t("track.3.tag")}</span>
        <h1>{t("build.title")}</h1>
        <p className="lede">{t("build.lede")}</p>
        <div className="acts">
          <a className="btn primary" href={courseUrl} rel="noopener noreferrer">
            {t("build.openRepo")}<span className="arrow">↗</span>
          </a>
          <Link className="btn" href={p("/lab/")}>{t("build.backLab")}</Link>
        </div>
      </section>

      <section className="sect">
        <div className="langnote">
          <h2>{t("build.boundaryTitle")}</h2>
          <p>{t("build.boundaryBody")}</p>
        </div>
      </section>

      <section className="sect">
        <h2>{t("build.beforeTitle")}</h2>
        <ul>
          <li>{t("build.beforeTs")}</li>
          <li>{t("build.beforeTools")}</li>
          <li>{t("build.beforeTime")}</li>
        </ul>
      </section>

      <section className="sect">
        <h2>{t("build.startTitle")}</h2>
        <ol className="build-steps">
          <li>
            <h3>{t("build.cloneTitle")}</h3>
            <p>{t("build.cloneBody")}</p>
            <pre dir="ltr"><code>{`git clone https://github.com/HUDongpin/agent-edu.git\ncd agent-edu\nnpm ci`}</code></pre>
          </li>
          <li>
            <h3>{t("build.editTitle")}</h3>
            <p>{t("build.editBody")}</p>
            <pre dir="ltr"><code>{`export const QUESTION = "What should I notice about an API?";`}</code></pre>
          </li>
          <li>
            <h3>{t("build.offlineTitle")}</h3>
            <p>{t("build.offlineBody")}</p>
            <pre dir="ltr"><code>{`npm run course:offline\nnpx tsx course/stage0-hello/run.ts --offline\nnpx tsx course/check.ts 0 --offline`}</code></pre>
          </li>
        </ol>
        <div className="card">
          <div className="card-b">
            <h3>{t("build.successTitle")}</h3>
            <pre dir="ltr"><code>{`PASS  you asked the model something\nPASS  an answer came back\n\n  stage 0 complete.`}</code></pre>
          </div>
        </div>
      </section>

      <section className="sect">
        <h2>{t("build.providerTitle")}</h2>
        <div className="grid2">
          <article className="card"><div className="card-b">
            <h3>{t("build.providerOffline")}</h3>
            <p>{t("build.providerOfflineBody")}</p>
            <pre dir="ltr"><code>--offline</code></pre>
          </div></article>
          <article className="card"><div className="card-b">
            <h3>DeepSeek</h3>
            <p>{t("build.providerDeepSeekBody")}</p>
            <pre dir="ltr"><code>export DEEPSEEK_API_KEY=your_key_here</code></pre>
          </div></article>
          <article className="card"><div className="card-b">
            <h3>Claude</h3>
            <p>{t("build.providerClaudeBody")}</p>
            <pre dir="ltr"><code>{`export ANTHROPIC_API_KEY=your_key_here\nexport CAFE_PROVIDER=anthropic`}</code></pre>
          </div></article>
          <article className="card"><div className="card-b">
            <h3>{t("build.costTitle")}</h3>
            <p>{t("build.costBody")}</p>
          </div></article>
        </div>
      </section>

      <section className="sect">
        <h2>{t("build.progressTitle")}</h2>
        <p>{t("build.progressBody")}</p>
        <pre dir="ltr"><code>{`npx tsx course/report.ts\n# reads course/progress.json in this clone`}</code></pre>
      </section>

      <section className="sect">
        <h2>{t("build.artifactTitle")}</h2>
        <p>{t("build.artifactBody")}</p>
        <ul>
          <li>{t("build.artifactBoundary")}</li>
          <li>{t("build.artifactFailure")}</li>
          <li>{t("build.artifactEval")}</li>
          <li>{t("build.artifactGate")}</li>
          <li>{t("build.artifactTrust")}</li>
          <li>{t("build.artifactReview")}</li>
        </ul>
      </section>

      <section className="sect">
        <h2>{t("build.stuckTitle")}</h2>
        <p>{t("build.stuckBody")}</p>
        <div className="acts">
          <Link className="btn" href={p("/lab/")}>{t("build.backLab")}</Link>
          <a className="btn primary" href={courseUrl} rel="noopener noreferrer">
            {t("build.openRepo")}<span className="arrow">↗</span>
          </a>
        </div>
      </section>
    </div>
  );
}
