import Link from "next/link";
import type {
  MaterializedCreatorOpsCourse,
  MaterializedCreatorOpsModule,
} from "@/staging/course-src/creator-ops/lib";
import {
  ModuleCheckpoint,
  ModuleCompletion,
  ModuleNavigator,
  PracticeWorkbench,
} from "./Interactions";
import styles from "./CreatorOpsCourse.module.css";

const CREATOR_OPS_LAB_ROOT = "/courses/creator-ops/lab";
const CREATOR_OPS_LAB_RESOURCES: Readonly<Record<string, readonly string[]>> = {
  "audience-signal-radar": ["source-fixtures/README.md"],
  "evidence-research-packet": [
    "source-fixtures/README.md",
    "source-fixtures/creator-suite-method-note.md",
  ],
  "writing-brand-fact-gates": ["fault-injections.json"],
  "human-approved-distribution": ["mock-publish-scenarios.json"],
  "community-analytics-loop": ["synthetic-events.csv", "synthetic-feedback.jsonl"],
  "evaluation-governance-capstone": [
    "README.md",
    "fault-injections.json",
    "manifest.sha256",
  ],
};

const LAB_RESOURCE_LABELS: Readonly<Record<string, Readonly<Record<"en" | "zh-Hans", string>>>> = {
  "README.md": { en: "Lab instructions", "zh-Hans": "实验说明" },
  "fault-injections.json": { en: "Failure rehearsal scenarios", "zh-Hans": "故障演练情境" },
  "manifest.sha256": { en: "Fixture integrity checksums", "zh-Hans": "样例完整性校验值" },
  "mock-publish-scenarios.json": { en: "Mock publishing scenarios", "zh-Hans": "模拟发布情境" },
  "source-fixtures/README.md": { en: "Source fixture guide", "zh-Hans": "来源样例指南" },
  "source-fixtures/creator-suite-method-note.md": { en: "Research method note", "zh-Hans": "研究方法说明" },
  "synthetic-events.csv": { en: "Synthetic analytics events", "zh-Hans": "合成分析事件" },
  "synthetic-feedback.jsonl": { en: "Synthetic audience feedback", "zh-Hans": "合成受众反馈" },
};

export default function ModuleView({
  course,
  module,
  catalogLabel,
}: {
  course: MaterializedCreatorOpsCourse;
  module: MaterializedCreatorOpsModule;
  catalogLabel: string;
}) {
  const ui = course.copy.ui;
  const index = course.modules.findIndex((candidate) => candidate.slug === module.slug);
  const previous = index > 0 ? course.modules[index - 1] : null;
  const next = index < course.modules.length - 1 ? course.modules[index + 1] : null;
  const hrefFor = (slug: string) => `/${course.locale}/creator-ops/${slug}/`;
  const labResources = CREATOR_OPS_LAB_RESOURCES[module.slug] ?? [];
  const navigationItems = course.modules.map((candidate) => ({
    slug: candidate.slug,
    order: candidate.order,
    title: candidate.copy.title,
  }));

  return (
    <div
      className={styles.root}
      lang={course.contentLocale}
      dir={course.contentDirection}
      data-testid={`creator-ops-module-${module.slug}`}
    >
      <div className={`${styles.shell} ${styles.moduleShell}`}>
        <nav className={styles.breadcrumb} aria-label={ui.breadcrumb}>
          <Link
            href={`/${course.locale}/courses/`}
            lang={course.locale}
            dir={course.locale === "ar" ? "rtl" : "ltr"}
          >
            {catalogLabel}
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/${course.locale}/creator-ops/`}>{course.copy.meta.shortTitle}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{ui.module} {module.order}</span>
        </nav>

        <aside className={styles.languageNotice} aria-label={ui.language}>
          <span>{course.contentLocale === "zh-Hans" ? ui.reviewedChinese : ui.translationFallback}</span>
          <p>{course.copy.meta.languageNotice}</p>
        </aside>

        <header className={styles.moduleHero}>
          <div>
            <p className={styles.kicker}>{module.copy.kicker}</p>
            <h1>{module.copy.title}</h1>
            <p>{module.copy.summary}</p>
          </div>
          <dl className={styles.moduleFacts}>
            <div><dt>{ui.objective}</dt><dd>{module.copy.objective}</dd></div>
            <div><dt>{ui.artifact}</dt><dd>{module.copy.artifact}</dd></div>
            <div><dt>{ui.duration}</dt><dd>{module.minutes} {ui.minutes}</dd></div>
            <div><dt>{ui.sources}</dt><dd>{module.sources.length}</dd></div>
          </dl>
          <aside className={styles.riskGate} aria-label={ui.riskGate}>
            <span>{ui.riskGate}</span>
            <p>{module.copy.riskGate}</p>
          </aside>
        </header>

        <ModuleNavigator
          locale={course.locale}
          currentSlug={module.slug}
          modules={navigationItems}
          labels={ui}
        />

        <nav className={styles.moduleContents} aria-label={ui.onThisPage}>
          <strong>{ui.onThisPage}</strong>
          {module.copy.sections.map((section, sectionIndex) => (
            <a key={section.heading} href={`#section-${sectionIndex + 1}`}>
              {String(sectionIndex + 1).padStart(2, "0")} {section.heading}
            </a>
          ))}
          <a href={`#${module.slug}-practice-title`}>{ui.practice}</a>
          <a href={`#${module.slug}-checkpoint`}>{ui.checkpoint}</a>
          <a href={`#${module.slug}-completion`}>{ui.markComplete}</a>
        </nav>

        <article className={styles.lessonBody}>
          <p className={styles.sourceRoleNotice}>{ui.sourceRoleNotice}</p>
          {module.copy.sections.map((section, sectionIndex) => (
            <section key={section.heading} id={`section-${sectionIndex + 1}`} className={styles.teachingSection}>
              <div className={styles.sectionNumber}>{String(sectionIndex + 1).padStart(2, "0")}</div>
              <div>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets ? (
                  <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
                ) : null}
                <div className={styles.sourceChips} role="group" aria-label={ui.sources}>
                  {section.sourceIds.map((sourceId) => {
                    const source = module.sources.find((candidate) => candidate.id === sourceId);
                    return source ? (
                      <a key={sourceId} href={`${source.url}/tree/${source.revision}`} rel="noopener noreferrer">
                        {sourceId}<span aria-hidden="true">↗</span>
                      </a>
                    ) : null;
                  })}
                </div>
              </div>
            </section>
          ))}
        </article>

        <section id={`${module.slug}-practice`} className={styles.practiceSection} aria-labelledby={`${module.slug}-practice-title`}>
          <header>
            <p className={styles.sectionLabel}>{ui.practice}</p>
            <h2 id={`${module.slug}-practice-title`}>{module.copy.practice.title}</h2>
            <p>{module.copy.practice.brief}</p>
          </header>
          <div className={styles.practiceSteps}>
            <h3>{ui.steps}</h3>
            <ol>{module.copy.practice.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          </div>
          {labResources.length > 0 ? (
            <aside className={styles.labResources} aria-label={ui.offlineLabPackage}>
              <strong>{ui.offlineLabPackage}</strong>
              <p>{ui.offlineLabHelp}</p>
              <ul>
                {labResources.map((resource) => (
                  <li key={resource}>
                    <a href={`${CREATOR_OPS_LAB_ROOT}/${resource}`}>
                      <strong>{LAB_RESOURCE_LABELS[resource]?.[course.contentLocale] ?? resource}</strong>
                      <code translate="no">{resource}</code>
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}
          <PracticeWorkbench slug={module.slug} practice={module.copy.practice} labels={ui} />
        </section>

        <ModuleCheckpoint slug={module.slug} checkpoint={module.copy.checkpoint} labels={ui} />
        <ModuleCompletion slug={module.slug} labels={ui} />

        <aside className={styles.takeaway} aria-label={ui.takeaway}>
          <span>{ui.takeaway}</span>
          <p>{module.copy.takeaway}</p>
        </aside>

        <nav className={styles.lessonPager} aria-label={`${ui.previous} / ${ui.next}`}>
          {previous ? (
            <Link href={hrefFor(previous.slug)}>
              <span>← {ui.previous}</span><strong>{previous.copy.title}</strong>
            </Link>
          ) : <span />}
          {next ? (
            <Link href={hrefFor(next.slug)}>
              <span>{ui.next} →</span><strong>{next.copy.title}</strong>
            </Link>
          ) : (
            <Link href={`/${course.locale}/creator-ops/#final-assessment`}>
              <span>{ui.next} →</span><strong>{course.copy.finalAssessment.title}</strong>
            </Link>
          )}
        </nav>

        <h2
          id={`${module.slug}-sources-title`}
          className={styles.srOnly}
          data-testid="creator-ops-module-sources-title"
        >
          {ui.sourceRegister}: {ui.sources}
        </h2>
        <details className={styles.moduleSources} aria-labelledby={`${module.slug}-sources-title`}>
          <summary id={`${module.slug}-sources`}>
            <span>
              <small>{ui.sourceRegister}</small>
              <strong>{ui.sources}</strong>
            </span>
            <b>{module.sources.length}</b>
          </summary>
          <div className={styles.moduleSourceGrid}>
            {module.sources.map((source) => (
              <article key={source.id} data-decision={source.decision}>
                <div className={styles.sourceTopline}>
                  <span>{course.copy.sourceDecisions[source.decision]}</span>
                  <code translate="no">{source.id}</code>
                </div>
                <h3>
                  <a href={source.url} rel="noopener noreferrer" translate="no">
                    {source.repository} <span aria-hidden="true">↗</span>
                  </a>
                </h3>
                <dl>
                  <div>
                    <dt>{ui.license}</dt>
                    <dd>
                      {[source.licenseUrl, ...(source.additionalLicenseUrls ?? [])].map((url, index, urls) => (
                        <span key={url}>
                          {index > 0 ? " · " : null}
                          <a href={url} rel="noopener noreferrer">
                            {urls.length === 1 ? source.license : `${source.license} (${index + 1}/${urls.length})`}
                          </a>
                        </span>
                      ))}
                    </dd>
                  </div>
                  <div>
                    <dt>{ui.revision}</dt>
                    <dd>
                      <a href={`${source.url}/commit/${source.revision}`} rel="noopener noreferrer">
                        <code translate="no">{source.revision.slice(0, 12)}</code>
                      </a>
                      {" · "}<time dateTime={source.committedAt}>{source.committedAt.slice(0, 10)}</time>
                    </dd>
                  </div>
                  <div><dt>{ui.supports}</dt><dd>{source.supports[course.contentLocale]}</dd></div>
                  <div><dt>{ui.boundary}</dt><dd>{source.boundary[course.contentLocale]}</dd></div>
                  <div>
                    <dt>{ui.snapshot}</dt>
                    <dd>{source.snapshot} · <time dateTime={source.accessedOn}>{source.accessedOn}</time></dd>
                  </div>
                </dl>
                <p>{course.copy.sourceDecisions[source.decision]}</p>
              </article>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
