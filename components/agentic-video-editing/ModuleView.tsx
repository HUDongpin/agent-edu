import Link from "next/link";
import type {
  AgenticVideoEditingEvidenceMode,
  AgenticVideoEditingSourceRecord,
  MaterializedAgenticVideoEditingCourse,
  MaterializedAgenticVideoEditingModule,
} from "@/lib/agentic-video-editing";
import {
  ArtifactWorkbench,
  CutPlanLab,
  ModuleCheckpoint,
  ModuleCompletion,
} from "./Interactions";
import { sourceRoleLabel, xVerificationLabel } from "./source-labels";
import styles from "./AgenticVideoEditingCourse.module.css";

type Labels = MaterializedAgenticVideoEditingCourse["copy"]["ui"];

function label(labels: Labels, key: string, fallback: string): string {
  const value = labels[key];
  return value && value.trim() ? value : fallback;
}

function evidenceModeLabel(mode: AgenticVideoEditingEvidenceMode, labels: Labels): string {
  if (mode === "source-grounded") return label(labels, "sourceGrounded", "Source-grounded");
  if (mode === "engineering-synthesis") return label(labels, "engineeringSynthesis", "Engineering synthesis");
  return label(labels, "versionWatch", "Version watch");
}

function sourceKindLabel(source: AgenticVideoEditingSourceRecord, labels: Labels): string {
  return source.kind === "x-post"
    ? label(labels, "xPost", "Dated X field signal")
    : label(labels, "githubRepository", "GitHub repository");
}

function ModuleMap({
  course,
  activeSlug,
}: {
  course: MaterializedAgenticVideoEditingCourse;
  activeSlug: string;
}) {
  return (
    <ol>
      {course.phases.map((phase) => (
        <li className={styles.mapPhase} key={phase.id}>
          <span>{phase.copy.title}</span>
          <ol>
            {phase.modules.map((module) => (
              <li key={module.slug}>
                <Link
                  href={`/${course.locale}/agentic-video-editing/${module.slug}/`}
                  aria-current={module.slug === activeSlug ? "page" : undefined}
                ><span>{String(module.order).padStart(2, "0")}</span><span>{module.copy.title}</span></Link>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}

export default function ModuleView({
  course,
  module,
}: {
  course: MaterializedAgenticVideoEditingCourse;
  module: MaterializedAgenticVideoEditingModule;
}) {
  const index = course.modules.findIndex((candidate) => candidate.slug === module.slug);
  const previous = index > 0 ? course.modules[index - 1] : null;
  const next = index < course.modules.length - 1 ? course.modules[index + 1] : null;
  const phase = course.phases.find((candidate) => candidate.id === module.phaseId)!;
  const courseHref = `/${course.locale}/agentic-video-editing/`;
  const hrefFor = (slug: string) => `/${course.locale}/agentic-video-editing/${slug}/`;

  return (
    <div
      className={`shellwrap ${styles.root} ${styles.modulePage}`}
      lang={course.contentLocale}
      dir={course.contentDirection}
      data-testid={`agentic-video-editing-module-${module.slug}`}
    >
      {course.locale !== course.contentLocale ? <p className={styles.languageNotice}>{course.copy.meta.translationNote}</p> : null}
      <nav className={styles.breadcrumb} aria-label="Course breadcrumb">
        <Link href={courseHref}><span aria-hidden="true">←</span>{label(course.copy.ui, "tableOfContents", "Course map")}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{label(course.copy.ui, "module", "Module")} {module.order}</span>
      </nav>

      <details className={styles.mobileMap}>
        <summary><span>{label(course.copy.ui, "tableOfContents", "Course map")}</span><span>{module.order} / {course.modules.length}</span></summary>
        <nav aria-label="All course modules"><ModuleMap course={course} activeSlug={module.slug} /></nav>
      </details>

      <div className={styles.moduleLayout}>
        <aside className={styles.moduleRail}>
          <nav aria-label="All course modules">
            <header><span>Course 20</span><strong>{label(course.copy.ui, "tableOfContents", "Course map")}</strong></header>
            <ModuleMap course={course} activeSlug={module.slug} />
          </nav>
        </aside>

        <div className={styles.moduleMain}>
          <article>
            <header className={styles.moduleHero}>
              <p className={styles.kicker}>{module.copy.kicker}</p>
              <h1>{module.copy.title}</h1>
              <p className={styles.moduleSummary}>{module.copy.summary}</p>
              <dl>
                <div><dt>{label(course.copy.ui, "minutes", "Time")}</dt><dd>{module.minutes} {label(course.copy.ui, "minute", "min")}</dd></div>
                <div><dt>{label(course.copy.ui, "phase", "Phase")}</dt><dd>{phase.copy.title} · {phase.order}/{course.phases.length}</dd></div>
                <div><dt>{label(course.copy.ui, "sources", "Sources")}</dt><dd>{module.sources.length}</dd></div>
              </dl>
              <p className={styles.artifactPromise}><span>{label(course.copy.ui, "artifact", "Artifact")}</span><strong>{module.copy.artifact}</strong></p>
            </header>

            <section className={styles.objective} aria-labelledby="module-objective-title">
              <p className={styles.eyebrow}>{course.contentLocale === "zh-Hans" ? "模块目标" : "Module objective"}</p>
              <h2 id="module-objective-title">{course.contentLocale === "zh-Hans" ? "完成后有什么改变" : "What changes by the end"}</h2>
              <p>{module.copy.objective}</p>
              <ul>{module.copy.concepts.map((concept) => <li key={concept}>{concept}</li>)}</ul>
            </section>

            <nav className={styles.onPageNav} aria-label={label(course.copy.ui, "onThisPage", "On this page")}>
              <strong>{label(course.copy.ui, "onThisPage", "On this page")}</strong>
              <ol>
                {module.copy.sections.map((section, sectionIndex) => <li key={section.heading}><a href={`#module-section-${sectionIndex + 1}`}>{String(sectionIndex + 1).padStart(2, "0")} {section.heading}</a></li>)}
                {module.slug === "declarative-edit-plan" ? <li><a href="#cut-plan-lab">04 Cut Plan Lab</a></li> : null}
                <li><a href="#module-practice">{module.slug === "declarative-edit-plan" ? "05" : "04"} {label(course.copy.ui, "practice", "Practice")}</a></li>
                <li><a href="#module-sources">{module.slug === "declarative-edit-plan" ? "06" : "05"} {label(course.copy.ui, "sourceRegister", "Sources")}</a></li>
              </ol>
            </nav>

            {module.copy.sections.map((section, sectionIndex) => {
              const sectionSources = section.sourceIds.map((sourceId) => module.sources.find((source) => source.id === sourceId)).filter(Boolean) as AgenticVideoEditingSourceRecord[];
              return (
                <section className={styles.proseSection} id={`module-section-${sectionIndex + 1}`} key={section.heading} aria-labelledby={`module-section-${sectionIndex + 1}-title`}>
                  <div className={styles.proseNumber}>{String(sectionIndex + 1).padStart(2, "0")}</div>
                  <div className={styles.proseCopy}>
                    <p className={styles.evidenceBadge} data-mode={section.evidenceMode}>{evidenceModeLabel(section.evidenceMode, course.copy.ui)}</p>
                    <h2 id={`module-section-${sectionIndex + 1}-title`}>{section.heading}</h2>
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    {section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
                    <aside className={styles.inlineEvidence} aria-label={label(course.copy.ui, "evidence", "Evidence")}>
                      <span>{label(course.copy.ui, "evidence", "Evidence")}</span>
                      <p>{sectionSources.map((source, sourceIndex) => <span key={source.id}>{sourceIndex ? " · " : ""}<a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></span>)}</p>
                    </aside>
                  </div>
                </section>
              );
            })}

            {module.slug === "declarative-edit-plan" ? <div id="cut-plan-lab"><CutPlanLab locale={course.contentLocale} /></div> : null}

            <section className={styles.practice} id="module-practice" aria-labelledby="module-practice-title">
              <header><div><p className={styles.eyebrow}>{label(course.copy.ui, "practice", "Applied practice")}</p><h2 id="module-practice-title">{module.copy.practice.title}</h2></div><span>{module.minutes} {label(course.copy.ui, "minute", "min")}</span></header>
              <p className={styles.practiceBrief}>{module.copy.practice.brief}</p>
              <div className={styles.practiceGrid}>
                <div><h3>{label(course.copy.ui, "workSequence", "Work sequence")}</h3><ol>{module.copy.practice.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
                <aside>
                  <p className={styles.eyebrow}>{label(course.copy.ui, "humanGate", "Human gate")}</p><p>{module.copy.practice.reviewGate}</p>
                  <hr />
                  <p className={styles.eyebrow}>{label(course.copy.ui, "aiBoundary", "Agent boundary")}</p><p>{module.copy.practice.aiBoundary}</p>
                </aside>
              </div>
              <ArtifactWorkbench slug={module.slug} practice={module.copy.practice} labels={course.copy.ui} />
            </section>

            <ModuleCheckpoint slug={module.slug} checkpoint={module.copy.checkpoint} labels={course.copy.ui} />
            <aside className={styles.takeaway}><span>{course.contentLocale === "zh-Hans" ? "保留这一判断" : "Keep this decision"}</span><p>{module.copy.takeaway}</p></aside>

            <section className={styles.moduleSources} id="module-sources" aria-labelledby="module-sources-title">
              <header className={styles.sectionHeader}>
                <p className={styles.kicker}>{label(course.copy.ui, "sourceRegister", "Source register")}</p>
                <h2 id="module-sources-title">{course.contentLocale === "zh-Hans" ? "每项来源的能力与边界" : "What each source can—and cannot—support"}</h2>
                <p>{course.copy.meta.evidenceNote}</p>
              </header>
              <ol>
                {module.sources.map((source, sourceIndex) => (
                  <li key={source.id}>
                    <span className={styles.sourceNumber}>{String(sourceIndex + 1).padStart(2, "0")}</span>
                    <div>
                      <header><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}<span aria-hidden="true">↗</span></a><div><span>{sourceKindLabel(source, course.copy.ui)}</span><span>{sourceRoleLabel(source.role, course.copy.ui)}</span><span>{label(course.copy.ui, "accessed", "Accessed")} {source.accessedOn}</span></div></header>
                      <dl>
                        <div><dt>{label(course.copy.ui, "supports", "Supports")}</dt><dd>{course.contentLocale === "zh-Hans" ? source.supportsZhHans : source.supports}</dd></div>
                        <div><dt>{label(course.copy.ui, "boundary", "Boundary")}</dt><dd>{course.contentLocale === "zh-Hans" ? source.boundaryZhHans : source.boundary}</dd></div>
                        <div><dt>{label(course.copy.ui, "rights", "Rights")}</dt><dd>{course.contentLocale === "zh-Hans" ? source.rightsDecisionZhHans : source.rightsDecision}</dd></div>
                        {source.kind === "x-post" ? <div><dt>{label(course.copy.ui, "corroboration", "Corroboration")}</dt><dd>{course.contentLocale === "zh-Hans" ? source.corroborationScopeZhHans : source.corroborationScope}</dd></div> : null}
                      </dl>
                      <p className={styles.sourceFootnote}>
                        {source.kind === "x-post"
                          ? `${label(course.copy.ui, "published", "Published")}: ${source.publishedOn} · ${label(course.copy.ui, "verification", "Verification")}: ${xVerificationLabel(source, course.copy.ui)}`
                          : `${source.revision ? `${label(course.copy.ui, "revision", "Revision")}: ${source.revision}` : ""}${source.license ? ` · ${label(course.copy.ui, "license", "License")}: ${source.license}` : ""}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <ModuleCompletion slug={module.slug} template={module.copy.practice.template} labels={course.copy.ui} />
            <nav className={styles.modulePager} aria-label="Adjacent modules">
              {previous ? <Link href={hrefFor(previous.slug)}><span>{label(course.copy.ui, "previous", "Previous")}</span><strong>← {previous.copy.title}</strong></Link> : <span />}
              {next ? <Link href={hrefFor(next.slug)}><span>{label(course.copy.ui, "next", "Next")}</span><strong>{next.copy.title} →</strong></Link> : <Link href={courseHref}><span>{label(course.copy.ui, "next", "Next")}</span><strong>{label(course.copy.ui, "tableOfContents", "Course map")} →</strong></Link>}
            </nav>
          </article>
        </div>
      </div>
    </div>
  );
}
