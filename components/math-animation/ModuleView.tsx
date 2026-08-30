import Link from "next/link";
import type {
  MaterializedMathAnimationCourse,
  MaterializedMathAnimationModule,
  MathAnimationSourceKind,
} from "@/lib/math-animation";
import {
  CopyPrompt,
  CourseProgress,
  ModuleCompletionStatus,
  ModuleCheckpoint,
  ModuleEvidenceGate,
} from "./Interactions";
import { SourceCitationLink, SourceTraceDisclosure } from "./SourceTraceLinks";
import styles from "./MathAnimationCourse.module.css";

function sourceKindLabel(kind: MathAnimationSourceKind, chinese: boolean): string {
  if (kind === "github-repository") return chinese ? "GitHub 仓库" : "GitHub repository";
  if (kind === "x-post") return chinese ? "X 实践信号" : "X practice signal";
  if (kind === "web-standard") return chinese ? "Web 标准" : "Web standard";
  return chinese ? "官方文档" : "Official documentation";
}

function evidenceLabel(mode: string, chinese: boolean): string {
  if (mode === "source-grounded") return chinese ? "来源支持" : "Source-grounded";
  if (mode === "engineering-synthesis") return chinese ? "工程综合" : "Engineering synthesis";
  return chinese ? "版本观察" : "Version watch";
}

function ModuleMap({
  course,
  activeSlug,
}: {
  course: MaterializedMathAnimationCourse;
  activeSlug: string;
}) {
  return (
    <ol className={styles.moduleMap}>
      {course.phases.map((phase) => (
        <li key={phase.id}>
          <span>{phase.copy.title}</span>
          <ol>
            {phase.modules.map((module) => (
              <li key={module.slug}>
                <Link
                  href={`/${course.locale}/math-animation/${module.slug}/`}
                  aria-current={module.slug === activeSlug ? "page" : undefined}
                >
                  <span>{String(module.order).padStart(2, "0")}</span>
                  <span>{module.copy.title}</span>
                  <ModuleCompletionStatus slug={module.slug} labels={course.copy.ui} />
                </Link>
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
  course: MaterializedMathAnimationCourse;
  module: MaterializedMathAnimationModule;
}) {
  const chinese = course.contentLocale === "zh-Hans";
  const index = course.modules.findIndex((candidate) => candidate.slug === module.slug);
  const previous = index > 0 ? course.modules[index - 1] : null;
  const next = index < course.modules.length - 1 ? course.modules[index + 1] : null;
  const phase = course.phases.find((candidate) => candidate.id === module.phaseId)!;
  const courseHref = `/${course.locale}/math-animation/`;
  const hrefFor = (slug: string) => `/${course.locale}/math-animation/${slug}/`;

  return (
    <div
      className={`shellwrap ${styles.root} ${styles.modulePage}`}
      lang={course.contentLocale}
      dir={course.contentDirection}
      data-testid={`math-animation-module-${module.slug}`}
    >
      {course.locale !== course.contentLocale ? (
        <p className={styles.languageNotice}>{course.copy.ui.languageFallback}</p>
      ) : null}

      <nav className={styles.breadcrumb} aria-label={chinese ? "面包屑" : "Breadcrumb"}>
        <Link href={courseHref}><span aria-hidden="true">←</span>{course.copy.ui.backToCourse}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{module.order} / {course.modules.length}</span>
      </nav>

      <details className={styles.mobileMap}>
        <summary>
          <span className={styles.mobileMapTitle}>
            <small>{course.copy.ui.allModules}</small>
            <strong>{module.copy.title}</strong>
          </span>
          <span className={styles.mobileMapStatus}>
            <span>{module.order} / {course.modules.length}</span>
            <span className={styles.mobileMapChevron} aria-hidden="true" />
          </span>
        </summary>
        <nav aria-label={course.copy.ui.allModules}><ModuleMap course={course} activeSlug={module.slug} /></nav>
      </details>

      <div className={styles.moduleLayout}>
        <aside className={styles.moduleRail}>
          <nav aria-label={course.copy.ui.allModules}>
            <header><strong>{course.copy.ui.courseNumber}</strong><span>{course.copy.ui.curriculum}</span></header>
            <ModuleMap course={course} activeSlug={module.slug} />
          </nav>
          <CourseProgress
            modules={course.modules.map((candidate) => ({ slug: candidate.slug, href: hrefFor(candidate.slug) }))}
            labels={course.copy.ui}
            overviewHref={courseHref}
            currentSlug={module.slug}
            compact
            showJourneyAction={false}
          />
        </aside>

        <article className={styles.moduleMain}>
          <header className={styles.moduleHero}>
            <p className={styles.modulePhase}>{phase.copy.title} / {String(module.order).padStart(2, "0")}</p>
            <p className={styles.kicker}>{module.copy.kicker}</p>
            <h1 data-course19-heading tabIndex={-1}>{module.copy.title}</h1>
            <p>{module.copy.summary}</p>
            <dl>
              <div><dt>{course.copy.ui.minutes}</dt><dd>{module.minutes}</dd></div>
              <div><dt>{course.copy.ui.sources}</dt><dd>{module.sources.length}</dd></div>
              <div><dt>{course.copy.ui.practiceArtifact}</dt><dd>{module.copy.artifact}</dd></div>
            </dl>
          </header>

          <nav className={styles.moduleOutline} aria-label={chinese ? "本模块导航" : "In this module"}>
            <a href="#module-objective-title">{course.copy.ui.objective}</a>
            {module.copy.sections.map((section, sectionIndex) => (
              <a href={`#teaching-section-${sectionIndex}`} key={section.heading}>{section.heading}</a>
            ))}
            {module.codeExample ? <a href="#module-code-title">{module.codeExample.filename}</a> : null}
            <a href="#agent-task-title">{course.copy.ui.agentPrompt}</a>
            <a href={`#${module.slug}-checkpoint`}>{course.copy.ui.checkpoint}</a>
            <a href={`#${module.slug}-evidence`}>{course.copy.ui.practiceArtifact}</a>
            <a href="#module-sources-title">{course.copy.ui.sourceLedger}</a>
          </nav>

          <section className={styles.objective} aria-labelledby="module-objective-title">
            <p className={styles.sectionLabel}>{course.copy.ui.objective}</p>
            <h2 id="module-objective-title">{module.copy.objective}</h2>
          </section>

          {module.copy.sections.map((section, sectionIndex) => (
            <section className={styles.proseSection} key={section.heading} aria-labelledby={`teaching-section-${sectionIndex}`}>
              <div className={styles.proseIndex} aria-hidden="true">{String(sectionIndex + 1).padStart(2, "0")}</div>
              <div>
                <p className={styles.evidenceMode}>{evidenceLabel(section.evidenceMode, chinese)}</p>
                <h2 id={`teaching-section-${sectionIndex}`}>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
                <aside className={styles.inlineSources} aria-label={chinese ? "本节来源" : "Section sources"}>
                  {section.sourceIds.map((sourceId) => {
                    const source = module.sources.find((candidate) => candidate.id === sourceId);
                    return source
                      ? <SourceCitationLink key={sourceId} source={source} chinese={chinese} />
                      : null;
                  })}
                </aside>
              </div>
            </section>
          ))}

          {module.codeExample ? (
            <section className={styles.codeExample} aria-labelledby="module-code-title">
              <header><div><p className={styles.sectionLabel}>{module.codeExample.language}</p><h2 id="module-code-title">{module.codeExample.filename}</h2></div></header>
              <pre dir="ltr" tabIndex={0} aria-labelledby="module-code-title"><code>{module.codeExample.code}</code></pre>
              {module.codeExample.id === "manim-graph" || module.codeExample.id === "qa-script" ? (
                <p className={styles.codeDependency}>{course.copy.ui.codeDependency}</p>
              ) : null}
            </section>
          ) : null}

          <section className={styles.agentTask} aria-labelledby="agent-task-title">
            <p className={styles.sectionLabel}>{course.copy.ui.agentPrompt}</p>
            <h2 id="agent-task-title">{chinese ? "把这个任务交给 Codex 或 Claude" : "Give this bounded task to Codex or Claude"}</h2>
            <CopyPrompt prompt={module.copy.agentPrompt} labels={course.copy.ui} />
          </section>

          <ModuleCheckpoint slug={module.slug} checkpoint={module.copy.checkpoint} labels={course.copy.ui} />
          <ModuleEvidenceGate
            slug={module.slug}
            artifact={module.copy.artifact}
            verificationGate={module.copy.verificationGate}
            labels={course.copy.ui}
          />

          <section className={styles.sources} aria-labelledby="module-sources-title">
            <header className={styles.sectionIntro}>
              <p className={styles.sectionLabel}>{course.copy.ui.sourceLedger}</p>
              <h2 id="module-sources-title">{chinese ? "每个技术结论都带边界" : "Every technical claim carries a boundary"}</h2>
            </header>
            <details className={styles.sourceLedgerDisclosure}>
              <summary>
                <span>{chinese ? `查看 ${module.sources.length} 条来源记录` : `Review ${module.sources.length} source records`}</span>
                <strong>{module.sources.length}</strong>
              </summary>
              <ol>
              {module.sources.map((source, sourceIndex) => (
                <li key={source.id}>
                  <span>{String(sourceIndex + 1).padStart(2, "0")}</span>
                  <div>
                    <header>
                      <h3>{source.title}</h3>
                      <p>{sourceKindLabel(source.kind, chinese)} / {source.versionOrRevision}</p>
                    </header>
                    <dl>
                      <div><dt>{chinese ? "支持" : "Supports"}</dt><dd>{chinese ? source.supportsZhHans : source.supports}</dd></div>
                      <div><dt>{course.copy.ui.sourceBoundary}</dt><dd>{chinese ? source.boundaryZhHans : source.boundary}</dd></div>
                      <div><dt>{chinese ? "权利" : "Rights"}</dt><dd>{chinese ? source.licenseOrRightsZhHans : source.licenseOrRights}</dd></div>
                    </dl>
                    <SourceTraceDisclosure source={source} chinese={chinese} />
                  </div>
                </li>
              ))}
              </ol>
            </details>
          </section>

          <nav
            className={styles.modulePager}
            aria-label={chinese ? "模块导航" : "Module navigation"}
            data-course-lesson-nav
          >
            {previous ? (
              <Link href={hrefFor(previous.slug)} rel="prev"><span>{course.copy.ui.previous}</span><strong>{previous.copy.title}</strong></Link>
            ) : <span />}
            {next ? (
              <Link href={hrefFor(next.slug)} rel="next"><span>{course.copy.ui.next}</span><strong>{next.copy.title}</strong></Link>
            ) : (
              <Link href={courseHref}><span>{course.copy.ui.backToCourse}</span><strong>{course.copy.ui.curriculum}</strong></Link>
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}
