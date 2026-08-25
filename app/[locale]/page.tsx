import Image from "next/image";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Progress from "@/components/Progress";
import Cover from "@/components/courses/Cover";
import LearningIcon, { type LearningIconName } from "@/components/home/LearningIcon";
import { LOCALE_CODES, getMessages, translator } from "@/lib/i18n";
import { SITE, urlFor } from "@/lib/seo";

/* Every route under [locale] declares its own params. The layout's are not
   inherited for export purposes, and without this the exporter cannot tell
   which locales `/` expands to. */
export function generateStaticParams() {
  return LOCALE_CODES.map((locale) => ({ locale }));
}

type Topic = {
  key: string;
  icon: LearningIconName;
  topic: string;
};

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = translator(await getMessages(locale));
  const p = (path: string) => `/${locale}${path}`;

  const topics: Topic[] = [
    { key: "1", icon: "book", topic: "ai-systems" },
    { key: "2", icon: "message", topic: "prompting" },
    { key: "3", icon: "workflow", topic: "ai-systems" },
    { key: "4", icon: "code", topic: "coding-assistants" },
    { key: "5", icon: "research", topic: "research" },
    { key: "6", icon: "shield", topic: "responsible-ai" },
  ];

  const paths = [
    { key: "1", icon: "book" as const, href: p("/handbook/") },
    { key: "2", icon: "code" as const, href: p("/codex/") },
    { key: "3", icon: "research" as const, href: p("/courses/?topic=research") },
  ];

  const methods = [
    { key: "1", icon: "practice" as const },
    { key: "2", icon: "evidence" as const },
    { key: "3", icon: "privacy" as const },
  ];

  const org = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${SITE}/#org`,
    name: t("brand.name"),
    url: urlFor(locale),
    description: t("brand.sub"),
    inLanguage: locale,
    sameAs: ["https://github.com/HUDongpin/agent-edu"],
  };

  return (
    <div className="platform-home">
      <JsonLd data={org} />

      <div className="shellwrap">
        <section className="platform-hero" aria-labelledby="home-title">
          <div className="platform-hero-copy">
            <span className="eyebrow">{t("home.kicker")}</span>
            <h1 id="home-title">
              {t("home.h1")} <span>{t("home.h1b")}</span>
            </h1>
            <p className="lede">{t("home.lede")}</p>
            <div className="acts">
              <Link className="btn primary" href={p("/courses/")}>
                {t("home.cta")}<span className="arrow" aria-hidden="true">→</span>
              </Link>
              <Link className="btn" href={p("/handbook/")}>
                {t("home.cta2")}
              </Link>
            </div>
            <ul className="hero-promises" aria-label={t("home.promiseLabel")}>
              {["1", "2", "3"].map((key) => (
                <li key={key}>
                  <svg aria-hidden="true" viewBox="0 0 20 20">
                    <path d="m5 10 3 3 7-7" />
                  </svg>
                  {t(`home.promise${key}`)}
                </li>
              ))}
            </ul>
          </div>

          <figure className="platform-hero-art">
            <Image
              src="/images/ai-learning-journey.webp"
              alt={t("home.heroAlt")}
              width={1536}
              height={1024}
              sizes="(max-width: 760px) 100vw, (max-width: 1180px) 48vw, 540px"
              loading="eager"
              fetchPriority="high"
            />
          </figure>
        </section>

        <section className="platform-proof" aria-label={t("home.proofLabel")}>
          {["1", "2", "3", "4"].map((key) => (
            <div key={key}>
              <strong>{t(`home.proof${key}`)}</strong>
              <span>{t(`home.proof${key}d`)}</span>
            </div>
          ))}
        </section>

        <section className="platform-section topic-section" aria-labelledby="topics-title">
          <header className="section-heading split-heading">
            <div>
              <span className="eyebrow">{t("home.topicsKicker")}</span>
              <h2 id="topics-title">{t("home.topicsTitle")}</h2>
            </div>
            <p>{t("home.topicsLede")}</p>
          </header>
          <div className="topic-grid">
            {topics.map((topic) => (
              <Link
                className="topic-card"
                href={p(`/courses/?topic=${topic.topic}`)}
                key={topic.key}
              >
                <span className="topic-icon"><LearningIcon name={topic.icon} /></span>
                <span>
                  <strong>{t(`home.topic${topic.key}`)}</strong>
                  <small>{t(`home.topic${topic.key}d`)}</small>
                </span>
                <span className="topic-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="platform-section" aria-labelledby="featured-title">
          <header className="section-heading split-heading">
            <div>
              <span className="eyebrow">{t("home.coursesKicker")}</span>
              <h2 id="featured-title">{t("home.coursesTitle")}</h2>
            </div>
            <p>{t("home.coursesLede")}</p>
          </header>
          <div className="featured-course-grid">
            <article className="featured-course-card agentic">
              <div className="featured-cover"><Cover id="agentic" hue="var(--brand)" /></div>
              <div className="featured-copy">
                <div className="course-card-meta">
                  <span className="pill available">{t("cat.availableBadge")}</span>
                  <span>{t("c.agentic.meta")}</span>
                </div>
                <h3>{t("c.agentic.title")}</h3>
                <p>{t("c.agentic.blurb")}</p>
                <ul>
                  {["1", "2", "3"].map((key) => <li key={key}>{t(`home.agenticPoint${key}`)}</li>)}
                </ul>
                <Link className="text-link" href={p("/courses/#agentic-engineering")}>
                  {t("home.course1Cta")}<span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>

            <article className="featured-course-card codex">
              <div className="featured-cover"><Cover id="codex" hue="var(--green)" /></div>
              <div className="featured-copy">
                <div className="course-card-meta">
                  <span className="pill available">{t("cat.availableBadge")}</span>
                  <span>{t("c.codex.meta")}</span>
                </div>
                <h3>{t("c.codex.title")}</h3>
                <p>{t("c.codex.blurb")}</p>
                <ul>
                  {["1", "2", "3"].map((key) => <li key={key}>{t(`home.codexPoint${key}`)}</li>)}
                </ul>
                <Link className="text-link" href={p("/codex/")}>
                  {t("home.course2Cta")}<span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>

            <article className="featured-course-card claude">
              <div className="featured-cover"><Cover id="claude" hue="var(--claude, #d97757)" /></div>
              <div className="featured-copy">
                <div className="course-card-meta">
                  <span className="pill available">{t("cat.availableBadge")}</span>
                  <span>{t("c.claude.meta")}</span>
                </div>
                <h3>{t("c.claude.title")}</h3>
                <p>{t("c.claude.blurb")}</p>
                <ul>
                  {["1", "2", "3"].map((key) => <li key={key}>{t(`home.claudePoint${key}`)}</li>)}
                </ul>
                <Link className="text-link" href={p("/claude/")}>
                  {t("home.course3Cta")}<span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>

            <article className="featured-course-card github">
              <div className="featured-cover"><Cover id="github" hue="var(--brand-2)" /></div>
              <div className="featured-copy">
                <div className="course-card-meta">
                  <span className="pill available">{t("cat.availableBadge")}</span>
                  <span>{t("c.github.meta")}</span>
                </div>
                <h3>{t("c.github.title")}</h3>
                <p>{t("c.github.blurb")}</p>
                <ul>
                  {["1", "2", "3"].map((key) => <li key={key}>{t(`home.githubPoint${key}`)}</li>)}
                </ul>
                <Link className="text-link" href={p("/github/")}>
                  {t("home.course6Cta")}<span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>

            <article className="featured-course-card prompts">
              <div className="featured-cover"><Cover id="prompts" hue="var(--coral)" /></div>
              <div className="featured-copy">
                <div className="course-card-meta">
                  <span className="pill available">{t("cat.availableBadge")}</span>
                  <span>{t("c.prompts.meta")}</span>
                </div>
                <h3>{t("c.prompts.title")}</h3>
                <p>{t("c.prompts.blurb")}</p>
                <ul>
                  {["1", "2", "3"].map((key) => <li key={key}>{t(`home.promptsPoint${key}`)}</li>)}
                </ul>
                <Link className="text-link" href={p("/prompts/")}>
                  {t("home.course7Cta")}<span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          </div>
          <p className="section-action">
            <Link className="btn" href={p("/courses/")}>
              {t("home.allCourses")}<span className="arrow" aria-hidden="true">→</span>
            </Link>
          </p>
        </section>

        <section className="platform-section path-section" id="paths" aria-labelledby="paths-title">
          <header className="section-heading">
            <span className="eyebrow">{t("home.pathsKicker")}</span>
            <h2 id="paths-title">{t("home.pathsTitle")}</h2>
            <p>{t("home.pathsLede")}</p>
          </header>
          <div className="path-grid">
            {paths.map((path, index) => (
              <article className="path-card" key={path.key}>
                <div className="path-topline">
                  <span className="path-icon"><LearningIcon name={path.icon} /></span>
                  <span className="path-number" aria-hidden="true">0{index + 1}</span>
                </div>
                <p className="path-audience">{t(`home.path${path.key}For`)}</p>
                <h3>{t(`home.path${path.key}`)}</h3>
                <p>{t(`home.path${path.key}d`)}</p>
                <ol>
                  {["a", "b", "c"].map((step) => (
                    <li key={step}>{t(`home.path${path.key}${step}`)}</li>
                  ))}
                </ol>
                <Link className="text-link" href={path.href}>
                  {t(`home.path${path.key}Cta`)}<span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="platform-section method-section" aria-labelledby="method-title">
          <header className="section-heading split-heading">
            <div>
              <span className="eyebrow">{t("home.methodKicker")}</span>
              <h2 id="method-title">{t("home.methodTitle")}</h2>
            </div>
            <p>{t("home.methodLede")}</p>
          </header>
          <div className="method-grid">
            {methods.map((method) => (
              <article key={method.key}>
                <span><LearningIcon name={method.icon} /></span>
                <h3>{t(`home.method${method.key}`)}</h3>
                <p>{t(`home.method${method.key}d`)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="platform-section progress-section" aria-labelledby="progress-title">
          <header className="section-heading">
            <span className="eyebrow">{t("home.progressKicker")}</span>
            <h2 id="progress-title">{t("home.progTitle")}</h2>
            <p>{t("home.progressLede")}</p>
          </header>
          <Progress locale={locale} />
        </section>

        <section className="platform-section faq-section" aria-labelledby="faq-title">
          <header className="section-heading">
            <span className="eyebrow">{t("home.faqKicker")}</span>
            <h2 id="faq-title">{t("home.faqTitle")}</h2>
          </header>
          <div className="faq">
            {["1", "2", "3", "4", "5"].map((key) => (
              <details key={key}>
                <summary>{t(`home.q${key}`)}</summary>
                <p>{t(`home.a${key}`)}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
