import Link from "next/link";
import {
  CREATOR_OPS_SOURCES,
  type CreatorOpsSourceDecision,
  type MaterializedCreatorOpsCourse,
} from "@/staging/course-src/creator-ops/lib";
import {
  CapstoneChecklist,
  CourseFragmentFocusManager,
  CoursePrimaryAction,
  CourseProgress,
  FinalAssessment,
} from "./Interactions";
import styles from "./CreatorOpsCourse.module.css";

function sourceDecisionCounts() {
  return (["pass", "conditional", "excluded"] as const).map((decision) => ({
    decision,
    count: CREATOR_OPS_SOURCES.filter((source) => source.decision === decision).length,
  }));
}

function splitCourseTitle(title: string): readonly [string, string | null] {
  const separator = title.search(/[:：]/u);
  if (separator < 0) return [title, null];
  return [title.slice(0, separator).trim(), title.slice(separator + 1).trim()];
}

export default function CourseDashboard({
  course,
  catalogLabel,
}: {
  course: MaterializedCreatorOpsCourse;
  catalogLabel: string;
}) {
  const ui = course.copy.ui;
  const navigationItems = course.modules.map((module) => ({
    slug: module.slug,
    order: module.order,
    title: module.copy.title,
  }));
  const [courseName, coursePromise] = splitCourseTitle(course.copy.meta.title);
  const contentLocale = course.contentLocale;
  const sourceText = (source: (typeof CREATOR_OPS_SOURCES)[number], field: "supports" | "boundary") =>
    source[field][contentLocale];

  return (
    <div
      className={styles.root}
      lang={course.contentLocale}
      dir={course.contentDirection}
      data-testid="creator-ops-course"
    >
      <CourseFragmentFocusManager />
      <div className={styles.shell}>
        <nav className={styles.breadcrumb} aria-label={ui.breadcrumb}>
          <Link
            href={`/${course.locale}/courses/`}
            lang={course.locale}
            dir={course.locale === "ar" ? "rtl" : "ltr"}
          >
            {catalogLabel}
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{course.copy.meta.shortTitle}</span>
        </nav>

        <aside className={styles.languageNotice} aria-label={ui.language}>
          <span>{course.contentLocale === "zh-Hans" ? ui.reviewedChinese : ui.translationFallback}</span>
          <p>{course.copy.meta.languageNotice}</p>
        </aside>

        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>{course.copy.meta.kicker}</p>
            <h1 aria-label={course.copy.meta.title}>
              <span>{courseName}</span>
              {coursePromise ? <span className={styles.heroPromise}>{coursePromise}</span> : null}
            </h1>
            <p className={styles.heroSummary}>{course.copy.meta.summary}</p>
            <div className={styles.heroActions}>
              <CoursePrimaryAction
                locale={course.locale}
                modules={navigationItems}
                labels={ui}
                startLabel={course.copy.meta.startCta}
                resumeLabel={course.copy.meta.resumeCta}
              />
              <a className={styles.secondaryAction} href="#curriculum">
                {ui.curriculum}<span aria-hidden="true">↓</span>
              </a>
            </div>
            <dl className={styles.heroFacts}>
              <div><dt>{ui.duration}</dt><dd>{course.copy.meta.duration}</dd></div>
              <div><dt>{ui.level}</dt><dd>{course.copy.meta.level}</dd></div>
              <div><dt>{ui.sources}</dt><dd>{CREATOR_OPS_SOURCES.length} {ui.githubRecords}</dd></div>
            </dl>
          </div>

          <figure className={styles.heroSystem} aria-labelledby="creator-ops-loop-title">
            <figcaption id="creator-ops-loop-title">{ui.curriculumSummary}</figcaption>
            <div className={styles.systemTrack}>
              {course.phases.map((phase, index) => (
                <div key={phase.id} className={styles.systemPhase} data-phase={phase.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{phase.copy.verb}</strong>
                  <small>{phase.modules.length} {ui.modules}</small>
                </div>
              ))}
            </div>
            <div className={styles.authorityBand}>
              <span>{ui.humanAuthority}</span>
              <i aria-hidden="true" />
              <span>{ui.evidenceReceipts}</span>
            </div>
          </figure>
        </header>

        <CourseProgress locale={course.locale} modules={navigationItems} labels={ui} />

        <nav className={styles.courseJumpNav} aria-label={ui.courseNavigation}>
          <a href="#curriculum">{ui.curriculum}</a>
          <a href="#final-assessment">{ui.finalAssessment}</a>
          <a href="#capstone">{ui.capstone}</a>
          <a href="#source-atlas">{ui.sourceRegister}</a>
        </nav>

        <section className={styles.promiseSection} aria-labelledby="creator-ops-principles">
          <header>
            <p className={styles.sectionLabel}>{ui.principles}</p>
            <h2 id="creator-ops-principles">{course.copy.meta.audience}</h2>
            <p>{course.copy.meta.prerequisite}</p>
          </header>
          <ol className={styles.principleGrid}>
            {course.copy.principles.map((principle, index) => (
              <li key={principle}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{principle}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.outcomes} aria-labelledby="creator-ops-outcomes">
          <header>
            <p className={styles.sectionLabel}>{ui.outcomes}</p>
            <h2 id="creator-ops-outcomes">{course.copy.meta.shortTitle}</h2>
          </header>
          <div className={styles.outcomeGrid}>
            {course.copy.outcomes.map((outcome, index) => (
              <article key={outcome}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{outcome}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="curriculum" tabIndex={-1} className={styles.curriculum} aria-labelledby="creator-ops-curriculum">
          <header className={styles.sectionIntro}>
            <p className={styles.sectionLabel}>{ui.curriculum}</p>
            <h2 id="creator-ops-curriculum">{ui.curriculumTitle}</h2>
            <p>{ui.curriculumSummary}</p>
          </header>
          <div className={styles.phaseList}>
            {course.phases.map((phase) => (
              <section key={phase.id} className={styles.phaseSection} data-phase={phase.id}>
                <header>
                  <span>{ui.phase} {phase.order}</span>
                  <h3>{phase.copy.title}</h3>
                  <p>{phase.copy.summary}</p>
                </header>
                <ol>
                  {phase.modules.map((module) => (
                    <li key={module.slug}>
                      <Link href={`/${course.locale}/creator-ops/${module.slug}/`}>
                        <span className={styles.moduleNumber}>{String(module.order).padStart(2, "0")}</span>
                        <span className={styles.moduleCardCopy}>
                          <small>{module.copy.kicker}</small>
                          <strong>{module.copy.title}</strong>
                          <span>{module.copy.summary}</span>
                        </span>
                        <span className={styles.moduleMeta}>
                          {module.minutes} {ui.minutes}
                          <b aria-hidden="true">↗</b>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </section>

        <FinalAssessment
          assessment={course.copy.finalAssessment}
          labels={ui}
          moduleLinks={navigationItems}
          locale={course.locale}
        />

        <section id="capstone" tabIndex={-1} className={styles.capstoneIntro} aria-labelledby="creator-ops-capstone">
          <p className={styles.sectionLabel}>{ui.capstone}</p>
          <h2 id="creator-ops-capstone">{course.copy.capstone.title}</h2>
          <p>{course.copy.capstone.scenario}</p>
          <p className={styles.noticeLink}>
            <a href="/courses/creator-ops/lab/README.md">
              {ui.offlineLabPackage} <span aria-hidden="true">↗</span>
            </a>
          </p>
          <div className={styles.reviewQuestions}>
            {course.copy.capstone.reviewQuestions.map((question) => <p key={question}>{question}</p>)}
          </div>
        </section>
        <CapstoneChecklist capstone={course.copy.capstone} labels={ui} />

        <section id="source-atlas" tabIndex={-1} className={styles.sourceAtlas} aria-labelledby="creator-ops-sources">
          <header className={styles.sectionIntro}>
            <p className={styles.sectionLabel}>{ui.githubAtlas}</p>
            <h2 id="creator-ops-sources">{ui.sourceAtlasTitle}</h2>
            <p>{course.copy.meta.evidenceNote}</p>
            <p>{ui.githubAtlasSummary}</p>
          </header>
          <p className={styles.versionNote}>
            <span>v{course.manifest.version}</span> · <time dateTime={course.manifest.authoredOn}>{course.manifest.authoredOn}</time>
          </p>
          <div className={styles.decisionSummary}>
            {sourceDecisionCounts().map(({ decision, count }) => (
              <div key={decision} data-decision={decision}>
                <strong>{count}</strong>
                <span>{course.copy.sourceDecisions[decision]}</span>
              </div>
            ))}
          </div>
          {(["pass", "conditional", "excluded"] as readonly CreatorOpsSourceDecision[]).map((decision) => (
            <details key={decision} className={styles.sourceGroup}>
              <summary>
                <span data-decision={decision}>{ui[decision] || course.copy.sourceDecisions[decision]}</span>
                <strong>{CREATOR_OPS_SOURCES.filter((source) => source.decision === decision).length}</strong>
              </summary>
              <div className={styles.sourceGrid}>
                {CREATOR_OPS_SOURCES.filter((source) => source.decision === decision).map((source) => (
                  <article key={source.id} data-decision={source.decision}>
                    <div className={styles.sourceTopline}>
                      <span>{ui[source.role] ?? source.role}</span>
                      <code translate="no">{source.id}</code>
                    </div>
                    <h3 translate="no">{source.repository}</h3>
                    <dl>
                      <div>
                        <dt>{ui.license}</dt>
                        <dd>
                          {[
                            source.licenseUrl,
                            ...("additionalLicenseUrls" in source ? source.additionalLicenseUrls : []),
                          ].map((url, index, urls) => (
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
                      <div><dt>{ui.snapshot}</dt><dd>{source.snapshot}</dd></div>
                      <div><dt>{ui.supports}</dt><dd>{sourceText(source, "supports")}</dd></div>
                      <div><dt>{ui.boundary}</dt><dd>{sourceText(source, "boundary")}</dd></div>
                    </dl>
                    <a className={styles.sourceLink} href={source.url} rel="noopener noreferrer">
                      GitHub <span aria-hidden="true">↗</span>
                    </a>
                  </article>
                ))}
              </div>
            </details>
          ))}
          <p className={styles.noticeLink}>
            <a href="/courses/creator-ops/NOTICE.md">
              {ui.rightsNotice} <span aria-hidden="true">↗</span>
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
