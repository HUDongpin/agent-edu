import Link from "next/link";
import { MCP_LESSON_DISPLAY_CORRECT_INDEXES, type McpCourse, type McpLesson } from "@/lib/mcp";
import type { McpUiCopy } from "@/lib/mcp/copy";
import { formatMcpCopy } from "@/lib/mcp/format";
import InteractiveLab from "./InteractiveLab";
import KnowledgeCheck from "./KnowledgeCheck";
import LessonCompletion from "./LessonCompletion";
import McpFigure from "./McpFigure";
import styles from "./McpCourse.module.css";

export default function LessonView({ course, lesson }: { course: McpCourse; lesson: McpLesson }) {
  const ui = course.ui as McpUiCopy;
  const number = new Intl.NumberFormat(course.contentLocale);
  const arrowForward = course.contentDirection === "rtl" ? "←" : "→";
  const arrowBack = course.contentDirection === "rtl" ? "→" : "←";
  const statusLabel = {
    core: ui.lessonStatusCore,
    optional: ui.lessonStatusOptional,
    practice: ui.lessonStatusPractice,
    extension: ui.lessonStatusExtension,
    deprecated: ui.lessonStatusDeprecated,
    removed: ui.lessonStatusRemoved,
  } as const;
  const maturityLabel = {
    stable: ui.lessonMaturityStable,
    draft: ui.lessonMaturityDraft,
    "dated-specification": ui.lessonMaturityDated,
  } as const;
  const tierLabel = {
    normative: ui.lessonSourceTierNormative,
    "official-guide": ui.lessonSourceTierOfficial,
    academy: ui.lessonSourceTierAcademy,
    practitioner: ui.lessonSourceTierPractitioner,
  } as const;
  const index = course.lessons.findIndex((item) => item.slug === lesson.slug);
  const previous = index > 0 ? course.lessons[index - 1] : null;
  const next = index < course.lessons.length - 1 ? course.lessons[index + 1] : null;
  const unit = course.units.find((item) => item.id === lesson.unitId)!;
  const concepts = lesson.conceptIds.map((id) => {
    const concept = course.concepts.find((item) => item.id === id);
    if (!concept) throw new Error(`Missing MCP concept ${id}`);
    return concept;
  });
  const figures = lesson.figureIds.map((id) => {
    const figure = course.figures.find((item) => item.id === id);
    if (!figure) throw new Error(`Missing MCP figure ${id}`);
    return figure;
  });
  const sources = lesson.sourceIds.map((id) => {
    const source = course.sources.find((item) => item.id === id);
    if (!source) throw new Error(`Missing MCP source ${id}`);
    return source;
  });
  const hrefFor = (slug: string) => `/${course.locale}/mcp/${slug}/`;
  const hasRunnableReference = lesson.slug === "build-server" || lesson.slug === "build-client";

  return (
    <div className={`shellwrap ${styles.lessonPage}`} data-testid={`mcp-lesson-${lesson.slug}`} lang={course.contentLocale} dir={course.contentDirection}>
      <nav className={styles.breadcrumbs} aria-label={ui.lessonBreadcrumbAria}>
        <Link href={`/${course.locale}/mcp/`}><span aria-hidden="true">{arrowBack}</span> {ui.lessonCourseBack}</Link>
        <span aria-hidden="true">/</span>
        <span>{unit.title}</span>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{formatMcpCopy(ui.lessonTemplate, { order: number.format(lesson.order) })}</span>
      </nav>

      <div className={styles.lessonLayout}>
        <aside className={styles.lessonRail}>
          <nav aria-label={ui.lessonCourseNavAria}>
            <div className={styles.railCurrent}><span>{number.format(index + 1)}/{number.format(course.lessons.length)}</span><strong dir="ltr">{course.protocolVersion}</strong></div>
            {course.units.map((courseUnit) => (
              <div className={styles.railUnit} key={courseUnit.id}>
                <p>{number.format(courseUnit.order)}. {courseUnit.title}</p>
                <ol>
                  {courseUnit.lessonSlugs.map((slug) => {
                    const item = course.lessons.find((candidate) => candidate.slug === slug)!;
                    return (
                      <li key={slug}>
                        <Link href={hrefFor(slug)} aria-current={slug === lesson.slug ? "page" : undefined}>
                          <span>{number.format(item.order)}</span>{item.title}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </nav>
        </aside>

        <div className={styles.lessonMain}>
          <article>
            <header className={styles.lessonHero}>
              <div className={styles.heroBadges}><span>{formatMcpCopy(ui.lessonTemplate, { order: number.format(lesson.order) })}</span><span>{unit.title}</span><span>{formatMcpCopy(ui.lessonMinutesTemplate, { minutes: number.format(lesson.minutes) })}</span><span>{formatMcpCopy(ui.dashboardEvidenceSnapshotTemplate, { date: course.publishedOn })}</span></div>
              <p className={styles.eyebrow} dir="ltr">MCP {course.protocolVersion}</p>
              <h1>{lesson.title}</h1>
              <p className={styles.lessonSummary}>{lesson.summary}</p>
              <div className={styles.lessonConcepts} aria-label={ui.lessonConceptsAria}>
                {concepts.map((concept) => <span key={concept.id} data-status={concept.status}>{statusLabel[concept.status]} · {concept.label}</span>)}
              </div>
              <p className={styles.localeNote}>{course.localeNote}</p>
            </header>

            <section className={styles.objective} aria-labelledby="mcp-objective-title">
              <p className={styles.eyebrow}>{ui.lessonObjectiveEyebrow}</p>
              <h2 id="mcp-objective-title">{ui.lessonObjectiveTitle}</h2>
              <p>{lesson.objective}</p>
            </section>

            <div className={styles.lessonSections}>
              {lesson.sections.map((section, sectionIndex) => (
                <section key={`${lesson.slug}-section-${sectionIndex}`} aria-labelledby={`mcp-section-${sectionIndex}`}>
                  <h2 id={`mcp-section-${sectionIndex}`}>{section.heading}</h2>
                  {section.body.map((paragraph, paragraphIndex) => <p key={`${lesson.slug}-${sectionIndex}-p-${paragraphIndex}`}>{paragraph}</p>)}
                  {section.bullets?.length ? <ul>{section.bullets.map((item, bulletIndex) => <li key={`${lesson.slug}-${sectionIndex}-b-${bulletIndex}`}>{item}</li>)}</ul> : null}
                  {section.code ? (
                    <figure className={styles.codePanel}>
                      <figcaption><span>{section.code.label}</span><span>{section.code.language}</span></figcaption>
                      <pre dir="ltr"><code lang="en" dir="ltr">{section.code.value}</code></pre>
                    </figure>
                  ) : null}
                  {section.callout ? (
                    <aside className={styles.callout} data-tone={section.callout.tone}>
                      <strong>{section.callout.title}</strong><p>{section.callout.body}</p>
                    </aside>
                  ) : null}
                </section>
              ))}
            </div>

            {lesson.slug === "apps-tasks-capstone" ? (
              <section className={styles.extensionManifest} aria-labelledby="mcp-extension-manifest-title">
                <header>
                  <p className={styles.eyebrow}>{ui.lessonExtensionEyebrow}</p>
                  <h2 id="mcp-extension-manifest-title">{ui.lessonExtensionTitle}</h2>
                  <p>{ui.lessonExtensionBody}</p>
                </header>
                <div className={styles.tableScroll} tabIndex={0} role="region" aria-label={ui.lessonExtensionTableAria}>
                  <table>
                    <thead><tr><th scope="col">{ui.lessonExtensionColumn}</th><th scope="col">{ui.lessonMaturityColumn}</th><th scope="col">{ui.lessonRevisionColumn}</th><th scope="col">{ui.lessonFallbackColumn}</th></tr></thead>
                    <tbody>
                      {course.extensions.map((extension) => (
                        <tr key={extension.id}>
                          <th scope="row"><a href={extension.specificationUrl} target="_blank" rel="noopener noreferrer"><bdi>{extension.name}</bdi><span className={styles.visuallyHidden}> ({ui.externalNewTab})</span></a><small dir="ltr">{extension.id}</small></th>
                          <td><span data-maturity={extension.maturity}>{maturityLabel[extension.maturity]}</span></td>
                          <td><code lang="en" dir="ltr">{extension.specificationVersion}</code><small>{formatMcpCopy(ui.lessonObservedTemplate, { date: extension.observedOn })}</small></td>
                          <td>{extension.fallback}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {figures.length ? (
              <section className={styles.figureSection} aria-labelledby="mcp-figures-title">
                <header><p className={styles.eyebrow}>{ui.lessonFiguresEyebrow}</p><h2 id="mcp-figures-title">{ui.lessonFiguresTitle}</h2></header>
                {figures.map((figure) => <McpFigure key={figure.id} figure={figure} ui={ui} />)}
              </section>
            ) : null}

            {lesson.interactive ? <InteractiveLab kind={lesson.interactive} interactive={course.interactive} ui={ui} /> : null}

            <section className={styles.practice} aria-labelledby="mcp-practice-title">
              <header><div><p className={styles.eyebrow}>{ui.lessonPracticeEyebrow}</p><h2 id="mcp-practice-title">{lesson.practice.title}</h2></div><span>{ui.lessonKeepEvidence}</span></header>
              <p>{lesson.practice.brief}</p>
              <ol>{lesson.practice.steps.map((step, stepIndex) => <li key={`${lesson.slug}-practice-${stepIndex}`}>{step}</li>)}</ol>
              <div className={styles.evidenceBox}><h3>{ui.lessonEvidenceTitle}</h3><ul>{lesson.practice.evidence.map((item, evidenceIndex) => <li key={`${lesson.slug}-evidence-${evidenceIndex}`}>{item}</li>)}</ul></div>
              <p className={styles.safetyNote}><strong>{ui.lessonSafetyLabel}</strong> {lesson.practice.safety}</p>
            </section>

            {hasRunnableReference ? (
              <aside className={styles.referenceDownload} aria-labelledby="mcp-reference-download-title">
                <div>
                  <p className={styles.eyebrow}>{ui.lessonReferenceEyebrow}</p>
                  <h2 id="mcp-reference-download-title">{ui.lessonReferenceTitle}</h2>
                  <p>{ui.lessonReferenceBody}</p>
                </div>
                <a className={styles.secondaryButton} href="/courses/mcp/courseops-reference.zip" download>{ui.lessonReferenceDownload}</a>
              </aside>
            ) : null}

            <KnowledgeCheck check={lesson.check} displayedCorrectIndex={MCP_LESSON_DISPLAY_CORRECT_INDEXES[index]} ui={ui} />
            <blockquote className={styles.takeaway}><p><span className={styles.takeawayLabel}>{ui.lessonTakeawayLabel}</span> {lesson.takeaway}</p></blockquote>

            <section className={styles.sources} aria-labelledby="mcp-sources-title">
              <header><p className={styles.eyebrow}>{ui.lessonSourcesEyebrow}</p><h2 id="mcp-sources-title">{ui.lessonSourcesTitle}</h2></header>
              <ol>
                {sources.map((source) => (
                  <li key={source.id}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer">
                      <span className={styles.sourceTier} data-tier={source.tier}>{tierLabel[source.tier]}</span>
                      <span><strong><bdi lang="en" dir="ltr">{source.title}</bdi></strong><small>{formatMcpCopy(ui.lessonSourceAccessedTemplate, { publisher: source.publisher, date: source.accessedOn })}</small><em>{source.note}</em></span>
                      <b aria-hidden="true">↗</b>
                      <span className={styles.visuallyHidden}> ({ui.externalNewTab})</span>
                    </a>
                  </li>
                ))}
              </ol>
            </section>

            <LessonCompletion slug={lesson.slug} ui={ui} />

            <nav className={styles.lessonPager} aria-label={ui.lessonNavigationAria}>
              {previous ? <Link href={hrefFor(previous.slug)}><span><span aria-hidden="true">{arrowBack}</span> {ui.lessonPrevious}</span><strong>{previous.title}</strong></Link> : <span />}
              {next ? <Link href={hrefFor(next.slug)}><span>{ui.lessonNext} <span aria-hidden="true">{arrowForward}</span></span><strong>{next.title}</strong></Link> : <Link href={`/${course.locale}/mcp/#assessment`}><span>{ui.lessonFinish} <span aria-hidden="true">{arrowForward}</span></span><strong>{ui.lessonFinalAssessment}</strong></Link>}
            </nav>
          </article>
        </div>
      </div>
    </div>
  );
}
