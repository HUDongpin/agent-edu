import Link from "next/link";
import {
  type MaterializedProductManagementCourse,
  type MaterializedProductManagementModule,
  type ProductManagementSourceKind,
} from "@/lib/product-management";
import {
  ArtifactWorkbench,
  ModuleCheckpoint,
  ModuleCompletion,
  RiceCalculator,
} from "./Interactions";
import styles from "./ProductManagementCourse.module.css";

type Labels = MaterializedProductManagementCourse["copy"]["ui"];

function label(labels: Labels, key: string, fallback: string): string {
  const value = labels[key];
  return value && value.trim() ? value : fallback;
}

function sourceKindLabel(kind: ProductManagementSourceKind): string {
  if (kind === "primary-course") return "Primary orientation";
  if (kind === "official-guidance") return "Official guidance";
  if (kind === "open-source") return "Open-source practice";
  if (kind === "research") return "Research";
  if (kind === "law") return "Law";
  return "Industry practice";
}

function ModuleMap({
  course,
  activeSlug,
}: {
  course: MaterializedProductManagementCourse;
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
                  href={`/${course.locale}/product-management/${module.slug}/`}
                  aria-current={module.slug === activeSlug ? "page" : undefined}
                >
                  <span>{String(module.order).padStart(2, "0")}</span>
                  <span>{module.copy.title}</span>
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
  course: MaterializedProductManagementCourse;
  module: MaterializedProductManagementModule;
}) {
  const index = course.modules.findIndex((item) => item.slug === module.slug);
  const previous = index > 0 ? course.modules[index - 1] : null;
  const next = index < course.modules.length - 1 ? course.modules[index + 1] : null;
  const phase = course.phases.find((item) => item.id === module.phaseId);
  const courseHref = `/${course.locale}/product-management/`;
  const hrefFor = (slug: string) => `/${course.locale}/product-management/${slug}/`;

  if (!phase) return null;

  return (
    <div
      className={`shellwrap ${styles.root} ${styles.modulePage}`}
      lang={course.contentLocale}
      dir={course.contentDirection}
      data-testid={`product-management-module-${module.slug}`}
    >
      {course.locale !== course.contentLocale ? (
        <p className={styles.languageNotice}>{course.copy.meta.englishOnly}</p>
      ) : null}

      <nav className={styles.topBreadcrumb} aria-label="Course breadcrumb">
        <Link href={courseHref}>
          <span aria-hidden="true">←</span>
          {label(course.copy.ui, "tableOfContents", "Course map")}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">
          {label(course.copy.ui, "module", "Module")} {module.order}
        </span>
      </nav>

      <details className={styles.mobileCourseMap}>
        <summary>
          <span>{label(course.copy.ui, "tableOfContents", "Course map")}</span>
          <span>{module.order} / {course.modules.length}</span>
        </summary>
        <nav aria-label="All course modules">
          <ModuleMap course={course} activeSlug={module.slug} />
        </nav>
      </details>

      <div className={styles.moduleLayout}>
        <aside className={styles.moduleRail}>
          <nav aria-label="All course modules">
            <header>
              <span>Course 14</span>
              <strong>{label(course.copy.ui, "tableOfContents", "Course map")}</strong>
            </header>
            <ModuleMap course={course} activeSlug={module.slug} />
          </nav>
        </aside>

        <div className={styles.moduleMain}>
          <article>
            <header className={styles.moduleHero}>
              <p className={styles.kicker}>{module.copy.kicker}</p>
              <h1>{module.copy.title}</h1>
              <p className={styles.moduleSummary}>{module.copy.summary}</p>
              <dl className={styles.moduleFacts}>
                <div>
                  <dt>{label(course.copy.ui, "minutes", "Time")}</dt>
                  <dd>{module.minutes} min</dd>
                </div>
                <div>
                  <dt>{label(course.copy.ui, "phase", "Stage")}</dt>
                  <dd>{phase.copy.title} · {phase.order}/{course.phases.length}</dd>
                </div>
                <div>
                  <dt>{label(course.copy.ui, "sources", "Sources")}</dt>
                  <dd>{module.sources.length}</dd>
                </div>
              </dl>
              <p className={styles.artifactPromise}>
                <span>{label(course.copy.ui, "artifact", "Artifact")}</span>
                <strong>{module.copy.artifact}</strong>
              </p>
            </header>

            <section className={styles.objective} aria-labelledby="module-objective-title">
              <p className={styles.sectionLabel}>Module objective</p>
              <h2 id="module-objective-title">What changes by the end</h2>
              <p>{module.copy.objective}</p>
              <ul className={styles.tagList} aria-label="Concepts in this module">
                {module.copy.concepts.map((concept) => <li key={concept}>{concept}</li>)}
              </ul>
            </section>

            <nav className={styles.onPageNav} aria-label="On this page">
              <span>Decision notebook</span>
              <ol>
                {module.copy.sections.map((section, sectionIndex) => (
                  <li key={section.heading}>
                    <a href={`#module-section-${sectionIndex + 1}`}>
                      {String(sectionIndex + 1).padStart(2, "0")} {section.heading}
                    </a>
                  </li>
                ))}
                <li><a href="#module-decision">04 Decision frame</a></li>
                <li><a href="#module-practice">05 Applied practice</a></li>
                <li><a href="#module-sources">06 Source register</a></li>
              </ol>
            </nav>

            {module.copy.sections.map((section, sectionIndex) => {
              const sectionSources = section.sourceIds.flatMap((sourceId) => {
                const source = module.sources.find((item) => item.id === sourceId);
                return source ? [source] : [];
              });
              return (
                <section
                  className={styles.proseSection}
                  id={`module-section-${sectionIndex + 1}`}
                  aria-labelledby={`module-section-${sectionIndex + 1}-title`}
                  key={section.heading}
                >
                  <div className={styles.proseNumber} aria-hidden="true">
                    {String(sectionIndex + 1).padStart(2, "0")}
                  </div>
                  <div className={styles.proseCopy}>
                    <h2 id={`module-section-${sectionIndex + 1}-title`}>
                      {section.heading}
                    </h2>
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    {section.bullets?.length ? (
                      <ul>
                        {section.bullets.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    ) : null}
                    {sectionSources.length ? (
                      <aside className={styles.inlineEvidence} aria-label="Evidence links">
                        <span>{label(course.copy.ui, "evidence", "Evidence")}</span>
                        <p>
                          {sectionSources.map((source, sourceIndex) => (
                            <span key={source.id}>
                              {sourceIndex ? " · " : ""}
                              <a href={source.url} target="_blank" rel="noopener noreferrer">
                                {source.title}
                              </a>
                            </span>
                          ))}
                        </p>
                      </aside>
                    ) : null}
                  </div>
                </section>
              );
            })}

            <section
              className={styles.decisionFrame}
              id="module-decision"
              aria-labelledby="module-decision-title"
            >
              <header>
                <p className={styles.sectionLabel}>
                  {label(course.copy.ui, "decision", "Decision frame")}
                </p>
                <h2 id="module-decision-title">{module.copy.decision.title}</h2>
                <p>{module.copy.decision.question}</p>
              </header>
              <ol className={styles.decisionOptions}>
                {module.copy.decision.options.map((option, optionIndex) => (
                  <li key={option}>
                    <span>{String(optionIndex + 1).padStart(2, "0")}</span>
                    <p>{option}</p>
                  </li>
                ))}
              </ol>
              <div className={styles.decisionReadout}>
                <p>
                  <span>Recommended posture</span>
                  {module.copy.decision.recommendation}
                </p>
                <p>
                  <span>Trade-off</span>
                  {module.copy.decision.tradeoff}
                </p>
              </div>
            </section>

            {module.slug === "prioritization-roadmaps-portfolio" ? (
              <RiceCalculator labels={course.copy.ui} />
            ) : null}

            <section
              className={styles.practice}
              id="module-practice"
              aria-labelledby="module-practice-title"
            >
              <header className={styles.practiceHeader}>
                <div>
                  <p className={styles.sectionLabel}>
                    {label(course.copy.ui, "practice", "Applied practice")}
                  </p>
                  <h2 id="module-practice-title">{module.copy.practice.title}</h2>
                </div>
                <span>{module.minutes} min module</span>
              </header>
              <p className={styles.practiceBrief}>{module.copy.practice.brief}</p>
              <div className={styles.practiceGrid}>
                <div>
                  <h3>Work sequence</h3>
                  <ol>
                    {module.copy.practice.steps.map((step) => <li key={step}>{step}</li>)}
                  </ol>
                </div>
                <div className={styles.reviewGate}>
                  <p className={styles.sectionLabel}>
                    {label(course.copy.ui, "gate", "Review gate")}
                  </p>
                  <p>{module.copy.practice.reviewGate}</p>
                  <hr />
                  <p className={styles.sectionLabel}>AI pairing boundary</p>
                  <p>{module.copy.practice.aiPairing}</p>
                </div>
              </div>
              <ArtifactWorkbench
                slug={module.slug}
                practice={module.copy.practice}
                labels={course.copy.ui}
              />
            </section>

            <ModuleCheckpoint
              slug={module.slug}
              checkpoint={module.copy.checkpoint}
              labels={course.copy.ui}
            />

            <aside className={styles.takeaway} aria-label="Module takeaway">
              <span>Keep this decision</span>
              <p>{module.copy.takeaway}</p>
            </aside>

            <section
              className={styles.sources}
              id="module-sources"
              aria-labelledby="module-sources-title"
            >
              <header className={styles.sectionIntro}>
                <p className={styles.kicker}>{label(course.copy.ui, "rightsBoundary", "Source and rights boundary")}</p>
                <h2 id="module-sources-title">Evidence register</h2>
                <p>
                  These records support specific teaching claims. Each boundary states what the source cannot establish by itself.
                </p>
              </header>
              <ol>
                {module.sources.map((source, sourceIndex) => (
                  <li key={source.id}>
                    <span className={styles.sourceNumber}>
                      {String(sourceIndex + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <header>
                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                          {source.title}
                          <span aria-hidden="true">↗</span>
                        </a>
                        <div className={styles.sourceMeta}>
                          <span>{source.publisher}</span>
                          <span>{sourceKindLabel(source.kind)}</span>
                          <span>Accessed {source.accessedOn}</span>
                          {source.license ? <span>License: {source.license}</span> : null}
                        </div>
                      </header>
                      <dl className={styles.sourceNotes}>
                        <div>
                          <dt>Supports</dt>
                          <dd>{source.supports}</dd>
                        </div>
                        <div>
                          <dt>Boundary</dt>
                          <dd>{source.boundary}</dd>
                        </div>
                      </dl>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <ModuleCompletion slug={module.slug} labels={course.copy.ui} />

            <nav className={styles.modulePager} aria-label="Module navigation" data-course-lesson-nav>
              {previous ? (
                <Link href={hrefFor(previous.slug)} rel="prev">
                  <span>{label(course.copy.ui, "previous", "Previous")}</span>
                  <strong>{String(previous.order).padStart(2, "0")} · {previous.copy.title}</strong>
                </Link>
              ) : <span />}
              {next ? (
                <Link href={hrefFor(next.slug)} rel="next">
                  <span>{label(course.copy.ui, "next", "Next")}</span>
                  <strong>{String(next.order).padStart(2, "0")} · {next.copy.title}</strong>
                </Link>
              ) : (
                <Link href={`${courseHref}#product-management-final-assessment`}>
                  <span>Return to course</span>
                  <strong>Final assessment and capstone</strong>
                </Link>
              )}
            </nav>
          </article>
        </div>
      </div>
    </div>
  );
}
