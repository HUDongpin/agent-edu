import Image from "next/image";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Progress from "@/components/Progress";
import Cover from "@/components/courses/Cover";
import LearningIcon, { type LearningIconName } from "@/components/home/LearningIcon";
import { LOCALE_CODES, getMessages, translator } from "@/lib/i18n";
import { SITE, urlFor } from "@/lib/seo";
import { PUBLISHED_CATALOG_COURSES } from "@/lib/public-courses";
import {
  contentLocaleForCourse,
  courseHrefFor,
  type CourseId,
} from "@/lib/release-surface";

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
    { key: "2", icon: "code" as const, href: p("/courses/?topic=coding-assistants") },
    { key: "3", icon: "research" as const, href: p("/courses/?topic=research") },
  ];

  const featuredCourses = PUBLISHED_CATALOG_COURSES.slice(0, 5).map(({ course }) => {
    const contentLocale = contentLocaleForCourse(course.id as CourseId, locale);
    const rawHref = courseHrefFor(course.id as CourseId, locale)!;
    return {
      course,
      href: contentLocale && contentLocale !== locale
        ? `${rawHref}?fromLocale=${encodeURIComponent(locale)}`
        : rawHref,
      crossLanguage: contentLocale !== null && contentLocale !== locale,
    };
  });

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
            {featuredCourses.map(({ course, href, crossLanguage }) => {
              const pointPrefix = course.id === "agentic"
                || course.id === "github"
                || course.id === "prompts"
                ? course.id
                : null;
              return (
                <article className={`featured-course-card ${course.id}`} key={course.id}>
                  <div className="featured-cover"><Cover id={course.id} hue={course.hue} /></div>
                  <div className="featured-copy">
                    <div className="course-card-meta">
                      <span className="pill available">{t("cat.availableBadge")}</span>
                      <span>{course.metaKey ? t(course.metaKey) : `${course.minutes} ${t("cat.minutes")}`}</span>
                    </div>
                    <h3>{t(course.titleKey)}</h3>
                    <p>{t(course.blurbKey)}</p>
                    {pointPrefix ? (
                      <ul>
                        {["1", "2", "3"].map((key) => (
                          <li key={key}>{t(`home.${pointPrefix}Point${key}`)}</li>
                        ))}
                      </ul>
                    ) : null}
                    {crossLanguage ? <p className="course-language-note">{t("cat.contentLanguageEnglish")}</p> : null}
                    <Link className="text-link" href={href}>
                      {t("cat.start")}<span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              );
            })}
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
          <Progress
            locale={locale}
            feedbackCopy={{ storageUnavailable: t("progress.storageUnavailable") }}
          />
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
