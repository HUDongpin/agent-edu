import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import AgenticTrackNav from "@/components/AgenticTrackNav";
import Declare from "@/components/build/Declare";
import CourseCommandBlock from "@/components/courses/CourseCommandBlock";
import Course3PrintDisclosures from "@/components/courses/Course3PrintDisclosures";
import styles from "@/components/courses/Course3Launchpad.module.css";
import { COURSE3_SOURCE_FACTS } from "@/lib/course3-sources";
import { getMessages, translator } from "@/lib/i18n";
import { courseLocaleParams } from "@/lib/release-surface";
import { SITE, seoFor, urlFor } from "@/lib/seo";
import type { Metadata } from "next";

export const dynamicParams = false;

const COURSE_ROOT = "https://github.com/HUDongpin/agent-edu/tree/main/course";
const COURSE_STAGES = [
  "stage0-hello",
  "stage1-kiosk",
  "stage2-prompt",
  "stage3-evals",
  "stage4-context",
  "stage5-loop",
  "stage6-harness",
  "stage7-graph",
  "stage8-security",
  "stage9-project",
] as const;

const COURSE_TECHNICAL_TOKENS = [
  "Anthropic TypeScript SDK",
  "@anthropic-ai/sdk",
  "DeepSeek Anthropic API",
  "course/stage0-hello/run.ts",
  "course/progress.json",
  "ANTHROPIC_API_KEY",
  "Windows PowerShell",
  "Node.js 20.9",
  "DEEPSEEK_API_KEY",
  "CAFE_PROVIDER",
  "course/report.ts",
  "Tokenkosten",
  "TypeScript",
  "JSON Schema",
  "CAFE_MODEL",
  "QUESTION",
  "DeepSeek",
  "Claude",
  "Provider",
  "macOS",
  "Linux",
  "POSIX",
  "tokens",
  "Token",
  "token",
  "await",
  "Eval",
  "IDE",
  "--offline",
  "(0–8)",
  "(0-8)",
] as const;
const COURSE_TECHNICAL_TOKEN_SET = new Set<string>(COURSE_TECHNICAL_TOKENS);
const COURSE_TECHNICAL_TOKENS_BY_LENGTH = [...COURSE_TECHNICAL_TOKENS]
  .sort((left, right) => right.length - left.length);
const COURSE_TECHNICAL_TOKEN_PATTERN = new RegExp(
  `(${COURSE_TECHNICAL_TOKENS_BY_LENGTH.map((token) =>
    token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  ).join("|")})`,
  "g",
);

function CourseText({ children }: { children: string }) {
  return children.split(COURSE_TECHNICAL_TOKEN_PATTERN).map((part, index) =>
    COURSE_TECHNICAL_TOKEN_SET.has(part) ? (
      <bdi key={`${part}-${index}`} dir="ltr" translate="no" data-course-technical-token>
        {part}
      </bdi>
    ) : part,
  );
}

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
  const stageOneUrl = `${COURSE_ROOT}/stage1-kiosk`;
  const copy = {
    copyLabel: t("build.copyCommand"),
    copiedLabel: t("build.copySuccess"),
    copyErrorLabel: t("build.copyFailure"),
  };
  const formatSourceDate = (value: string) => new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
  const sourceLinks = [
    ["build.sourcesDeepSeekPricing", COURSE3_SOURCE_FACTS.links.deepSeekPricing],
    ["build.sourcesDeepSeekCompatibility", COURSE3_SOURCE_FACTS.links.deepSeekCompatibility],
    ["build.sourcesDeepSeekThinking", COURSE3_SOURCE_FACTS.links.deepSeekThinking],
    ["build.sourcesClaudeStructured", COURSE3_SOURCE_FACTS.links.claudeStructuredOutputs],
    ["build.sourcesClaudeEffort", COURSE3_SOURCE_FACTS.links.claudeEffort],
    ["build.sourcesClaudeTokenCounting", COURSE3_SOURCE_FACTS.links.claudeTokenCounting],
    ["build.sourcesClaudeToolRunner", COURSE3_SOURCE_FACTS.links.claudeToolRunner],
    ["build.sourcesClaudePricing", COURSE3_SOURCE_FACTS.links.claudePricing],
    ["build.sourcesSdk", COURSE3_SOURCE_FACTS.links.sdk],
  ] as const;

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
    <div className={`shellwrap build-page ${styles.buildPage}`}>
      <noscript>
        <style>{".build-page [data-command-copy] { display: none !important; }"}</style>
      </noscript>
      <JsonLd data={course} />
      <AgenticTrackNav locale={locale} current="build" />
      <section className="hero">
        <span className="eyebrow">{t("track.3.tag")}</span>
        <h1>{t("build.title")}</h1>
        <p className="lede"><CourseText>{t("build.lede")}</CourseText></p>
        <aside className={styles.heroBoundary} data-repository-language-boundary>
          <h2>{t("build.repoLanguageTitle")}</h2>
          <p><CourseText>{t("build.repoLanguageBody")}</CourseText></p>
        </aside>
        <div className="acts">
          <a className="btn primary" href="#local-setup">{t("build.startSetup")}</a>
          <a
            className="btn"
            href={COURSE_ROOT}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t("build.openRepo")} (${t("build.opensNewTab")})`}
          >
            <CourseText>{t("build.openRepo")}</CourseText><span className="arrow" aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <section className="sect">
        <div className="langnote">
          <h2><CourseText>{t("build.boundaryTitle")}</CourseText></h2>
          <p><CourseText>{t("build.boundaryBody")}</CourseText></p>
        </div>
      </section>

      <section className="sect">
        <h2>{t("build.beforeTitle")}</h2>
        <ul>
          <li><CourseText>{t("build.beforeTs")}</CourseText></li>
          <li><CourseText>{t("build.beforeTools")}</CourseText></li>
          <li><CourseText>{t("build.beforeTime")}</CourseText></li>
        </ul>
      </section>

      <section className={`sect ${styles.sectionAnchor}`} id="local-setup">
        <h2>{t("build.startTitle")}</h2>
        <ol className="build-steps">
          <li>
            <h3>{t("build.cloneTitle")}</h3>
            <p>{t("build.cloneBody")}</p>
            <div className={styles.shellChoices} role="group" aria-label={t("build.shellChoiceLabel")}>
              <details className={styles.shellChoice} open>
                <summary><CourseText>{t("build.posixLabel")}</CourseText></summary>
                <div>
                  <CourseCommandBlock
                    code={`git clone https://github.com/HUDongpin/agent-edu.git\ncd agent-edu\nnpm ci`}
                    label={`${t("build.cloneTitle")}: ${t("build.posixLabel")}`}
                    {...copy}
                  />
                </div>
              </details>
              <details className={styles.shellChoice}>
                <summary><CourseText>{t("build.powerShellLabel")}</CourseText></summary>
                <div>
                  <CourseCommandBlock
                    code={`git clone https://github.com/HUDongpin/agent-edu.git\nSet-Location agent-edu\nnpm ci`}
                    label={`${t("build.cloneTitle")}: ${t("build.powerShellLabel")}`}
                    {...copy}
                  />
                </div>
              </details>
            </div>
          </li>
          <li>
            <h3>{t("build.editTitle")}</h3>
            <p><CourseText>{t("build.editBody")}</CourseText></p>
            <CourseCommandBlock
              code={`export const QUESTION = "What should I notice about an API?";`}
              label={t("build.editTitle")}
              {...copy}
            />
          </li>
          <li>
            <h3>{t("build.offlineTitle")}</h3>
            <p><CourseText>{t("build.offlineBody")}</CourseText></p>
            <CourseCommandBlock
              code={`npm run course:offline\nnpx tsx course/stage0-hello/run.ts --offline\nnpx tsx course/check.ts 0 --offline`}
              label={t("build.offlineTitle")}
              {...copy}
            />
          </li>
        </ol>
        <div className="card">
          <div className="card-b">
            <h3>{t("build.successTitle")}</h3>
            <CourseCommandBlock
              code={`PASS  you wrote a question\nPASS  the local stand-in returned an answer\n\n  stage 0 complete.`}
              label={t("build.successTitle")}
              {...copy}
            />
            <div className={styles.successActions}>
              <a
                className="btn primary"
                href={stageOneUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t("build.continueStage1")} (${t("build.opensNewTab")})`}
              >
                {t("build.continueStage1")}<span className="arrow" aria-hidden="true">↗</span>
              </a>
              <a className="btn" href="#course-stages">{t("build.viewAllStages")}</a>
            </div>
          </div>
        </div>
      </section>

      <section className={`sect ${styles.sectionAnchor}`} id="course-stages">
        <h2>{t("build.stageMapTitle")}</h2>
        <nav
          className={styles.stageMap}
          aria-label={t("build.stageMapLabel")}
          data-course-stage-map
        >
          <p>{t("build.stageMapBody")}</p>
          <ol className={styles.stageList}>
            {COURSE_STAGES.map((stage, index) => (
              <li key={stage}>
                <a
                  className={styles.stageLink}
                  href={`${COURSE_ROOT}/${stage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${t("build.stageLabel")} ${index}: ${t(`build.stage${index}Title`)} (${t("build.opensNewTab")})`}
                >
                  <span className={styles.stageCopy}>
                    <span className={styles.stageNumber}>{t("build.stageLabel")} {index}</span>
                    <span className={styles.stageTitle}>{t(`build.stage${index}Title`)}</span>
                  </span>
                  <span className={styles.stageSlug} aria-hidden="true" translate="no">{stage} ↗</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </section>

      <section className={`sect ${styles.referenceSection}`} data-course3-reference>
        <Course3PrintDisclosures />
        <div className={styles.referenceIntro}>
          <h2>{t("build.referenceTitle")}</h2>
          <p>{t("build.referenceBody")}</p>
        </div>

        <div className={styles.disclosureList}>
          <details
            id="provider-options"
            data-course3-disclosure
            className={`${styles.disclosure} ${styles.sectionAnchor}`}
          >
            <summary className={styles.disclosureSummary}>
              <span className={styles.summaryText}>
                <CourseText>{t("build.providerDisclosure")}</CourseText>
              </span>
              <span className={styles.disclosureMarker} aria-hidden="true" />
            </summary>
            <div className={styles.disclosureBody} data-course3-disclosure-body>
              <h3><CourseText>{t("build.providerTitle")}</CourseText></h3>
              <div className={`grid2 ${styles.providerGrid}`}>
                <article className="card provider-card"><div className="card-b">
                  <h4>{t("build.providerOffline")}</h4>
                  <p>{t("build.providerOfflineBody")}</p>
                  <CourseCommandBlock code="--offline" label={t("build.providerOffline")} {...copy} />
                </div></article>
                <article className="card provider-card"><div className="card-b">
                  <h4><CourseText>DeepSeek</CourseText></h4>
                  <p><CourseText>{t("build.providerDeepSeekBody")}</CourseText></p>
                  <div className={styles.providerShells}>
                    <CourseCommandBlock
                      code={`export DEEPSEEK_API_KEY=your_key_here\nexport CAFE_PROVIDER=deepseek\nunset CAFE_MODEL`}
                      label={`DeepSeek: ${t("build.posixLabel")}`}
                      {...copy}
                    />
                    <CourseCommandBlock
                      code={`$env:DEEPSEEK_API_KEY = "your_key_here"\n$env:CAFE_PROVIDER = "deepseek"\n$env:CAFE_MODEL = $null`}
                      label={`DeepSeek: ${t("build.powerShellLabel")}`}
                      {...copy}
                    />
                  </div>
                </div></article>
                <article className="card provider-card"><div className="card-b">
                  <h4><CourseText>Claude</CourseText></h4>
                  <p><CourseText>{t("build.providerClaudeBody")}</CourseText></p>
                  <div className={styles.providerShells}>
                    <CourseCommandBlock
                      code={`export ANTHROPIC_API_KEY=your_key_here\nexport CAFE_PROVIDER=anthropic\nunset CAFE_MODEL`}
                      label={`Claude: ${t("build.posixLabel")}`}
                      {...copy}
                    />
                    <CourseCommandBlock
                      code={`$env:ANTHROPIC_API_KEY = "your_key_here"\n$env:CAFE_PROVIDER = "anthropic"\n$env:CAFE_MODEL = $null`}
                      label={`Claude: ${t("build.powerShellLabel")}`}
                      {...copy}
                    />
                  </div>
                </div></article>
                <article className="card provider-card"><div className="card-b">
                  <h4><CourseText>{t("build.costTitle")}</CourseText></h4>
                  <p><CourseText>{t("build.costBody")}</CourseText></p>
                </div></article>
              </div>

              <aside
                id="source-notes"
                className={styles.sourceNotes}
                data-course3-source-notes
              >
                <h4>{t("build.sourcesTitle")}</h4>
                <p>{t("build.sourcesBody")}</p>
                <dl className={styles.sourceFacts}>
                  <div>
                    <dt>{t("build.sourcesDeepSeekSnapshotLabel")}</dt>
                    <dd>
                      <time dateTime={COURSE3_SOURCE_FACTS.deepSeekPricingCheckedAt}>
                        {formatSourceDate(COURSE3_SOURCE_FACTS.deepSeekPricingCheckedAt)}
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt>{t("build.sourcesClaudeSnapshotLabel")}</dt>
                    <dd>
                      <time dateTime={COURSE3_SOURCE_FACTS.claudePricingCheckedAt}>
                        {formatSourceDate(COURSE3_SOURCE_FACTS.claudePricingCheckedAt)}
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt>{t("build.sourcesOfficialReviewLabel")}</dt>
                    <dd>
                      <time dateTime={COURSE3_SOURCE_FACTS.officialSourcesReviewedAt}>
                        {formatSourceDate(COURSE3_SOURCE_FACTS.officialSourcesReviewedAt)}
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt>{t("build.sourcesSdkLabel")}</dt>
                    <dd><code dir="ltr" translate="no">@anthropic-ai/sdk {COURSE3_SOURCE_FACTS.sdkVersion}</code></dd>
                  </div>
                </dl>
                <p>{t("build.sourcesClaudeBoundary")}</p>
                <p>{t("build.sourcesObservationBoundary")}</p>
                <ul className={styles.sourceLinks}>
                  {sourceLinks.map(([label, href]) => (
                    <li key={href}>
                      <a
                        className={styles.sourceLink}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${t(label)} (${t("build.opensNewTab")})`}
                      >
                        <span className={styles.sourceLinkText}>
                          <CourseText>{t(label)}</CourseText>
                        </span>
                        <span className="arrow" aria-hidden="true">↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </details>

          <details
            id="local-progress"
            data-course3-disclosure
            className={`${styles.disclosure} ${styles.sectionAnchor}`}
          >
            <summary className={styles.disclosureSummary}>
              <span className={styles.summaryText}>{t("build.progressDisclosure")}</span>
              <span className={styles.disclosureMarker} aria-hidden="true" />
            </summary>
            <div className={styles.disclosureBody} data-course3-disclosure-body>
              <h3>{t("build.progressTitle")}</h3>
              <p><CourseText>{t("build.progressBody")}</CourseText></p>
              <CourseCommandBlock
                code={`npx tsx course/report.ts\n# reads course/progress.json in this clone`}
                label={t("build.progressTitle")}
                {...copy}
              />
              <Declare />
            </div>
          </details>

          <details
            id="stage9-artifact"
            data-course3-disclosure
            className={`${styles.disclosure} ${styles.sectionAnchor}`}
          >
            <summary className={styles.disclosureSummary}>
              <span className={styles.summaryText}>{t("build.artifactDisclosure")}</span>
              <span className={styles.disclosureMarker} aria-hidden="true" />
            </summary>
            <div className={styles.disclosureBody} data-course3-disclosure-body>
              <h3>{t("build.artifactTitle")}</h3>
              <p>{t("build.artifactBody")}</p>
              <ul>
                <li>{t("build.artifactBoundary")}</li>
                <li>{t("build.artifactFailure")}</li>
                <li><CourseText>{t("build.artifactEval")}</CourseText></li>
                <li>{t("build.artifactGate")}</li>
                <li>{t("build.artifactTrust")}</li>
                <li>{t("build.artifactReview")}</li>
              </ul>
            </div>
          </details>

          <details
            id="setup-help"
            data-course3-disclosure
            className={`${styles.disclosure} ${styles.sectionAnchor}`}
          >
            <summary className={styles.disclosureSummary}>
              <span className={styles.summaryText}>{t("build.helpDisclosure")}</span>
              <span className={styles.disclosureMarker} aria-hidden="true" />
            </summary>
            <div className={styles.disclosureBody} data-course3-disclosure-body>
              <h3>{t("build.stuckTitle")}</h3>
              <p><CourseText>{t("build.stuckBody")}</CourseText></p>
              <div className="acts">
                <Link className="btn" href={p("/lab/")}>{t("build.backLab")}</Link>
                <a
                  className="btn primary"
                  href={COURSE_ROOT}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${t("build.openRepo")} (${t("build.opensNewTab")})`}
                >
                  <CourseText>{t("build.openRepo")}</CourseText><span className="arrow" aria-hidden="true">↗</span>
                </a>
              </div>
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}
