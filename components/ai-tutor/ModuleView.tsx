import Link from "next/link";
import {
  formatAiTutorMessage,
  type AiTutorSourceRecord,
  type MaterializedAiTutorCourse,
  type MaterializedAiTutorModule,
} from "@/lib/ai-tutor";
import ConceptMap from "./ConceptMap";
import { ModuleCheckpoint, ModuleCompletion } from "./Interactions";
import base from "../prompts/PromptCourse.module.css";
import styles from "./AiTutorCourse.module.css";

function evidenceTypeLabel(
  type: AiTutorSourceRecord["evidenceType"],
  labels: MaterializedAiTutorCourse["copy"]["ui"],
): string {
  if (type === "research") return labels.research;
  if (type === "standard") return labels.standard;
  if (type === "teaching-guidance") return labels.teachingGuidance;
  return labels.officialGuidance;
}

function ModuleMap({
  course,
  activeSlug,
}: {
  course: MaterializedAiTutorCourse;
  activeSlug: string;
}) {
  return (
    <ol>
      {course.phases.map((phase) => (
        <li className={styles.moduleMapPhase} key={phase.id}>
          <span>{String(phase.order).padStart(2, "0")} {phase.copy.title}</span>
          <ol>
            {phase.modules.map((module) => (
              <li key={module.slug}>
                <Link
                  href={`/${course.locale}/ai-tutor/${module.slug}/`}
                  aria-current={module.slug === activeSlug ? "page" : undefined}
                >
                  <span>{String(module.order).padStart(2, "0")}</span>{module.copy.title}
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
  course: MaterializedAiTutorCourse;
  module: MaterializedAiTutorModule;
}) {
  const index = course.modules.findIndex((item) => item.slug === module.slug);
  const previous = index > 0 ? course.modules[index - 1] : null;
  const next = index < course.modules.length - 1 ? course.modules[index + 1] : null;
  const phase = course.phases.find((item) => item.id === module.phaseId)!;
  const hrefFor = (slug: string) => `/${course.locale}/ai-tutor/${slug}/`;
  const contractEntries = [
    [course.copy.ui.signal, module.copy.systemContract.signal],
    [course.copy.ui.inference, module.copy.systemContract.inference],
    [course.copy.ui.action, module.copy.systemContract.action],
    [course.copy.ui.outcomeEvidence, module.copy.systemContract.outcomeEvidence],
    [course.copy.ui.stopRule, module.copy.systemContract.stopRule],
  ] as const;

  return (
    <div
      className={`shellwrap ${base.promptRoot} ${styles.aiTutorRoot} ${base.lessonPage}`}
      lang={course.contentLocale}
      dir={course.contentDirection}
      data-testid={`ai-tutor-module-${module.slug}`}
    >
      {course.locale !== course.contentLocale ? (
        <p className={base.languageNotice}>{course.copy.meta.englishOnly}</p>
      ) : null}
      <nav className={base.breadcrumbs} aria-label={course.copy.ui.backToCourse}>
        <Link href={`/${course.locale}/ai-tutor/`}>
          <span aria-hidden="true">←</span>{course.copy.ui.backToCourse}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">
          {formatAiTutorMessage(course.copy.ui.modulePosition, { current: module.order })}
        </span>
      </nav>

      <details className={base.mobileCourseMap}>
        <summary>{formatAiTutorMessage(course.copy.ui.moduleMapPosition, {
          current: module.order,
          total: course.modules.length,
          mapLabel: course.copy.ui.openCourseMap,
        })}</summary>
        <nav aria-label={course.copy.ui.allModules}>
          <ModuleMap course={course} activeSlug={module.slug} />
        </nav>
      </details>

      <div className={base.lessonLayout}>
        <aside className={base.lessonRail}>
          <nav aria-label={course.copy.ui.allModules}>
            <strong>{course.copy.ui.allModules}</strong>
            <ModuleMap course={course} activeSlug={module.slug} />
          </nav>
        </aside>

        <div className={base.lessonMain}>
          <article>
            <header className={base.lessonHero}>
              <p className={base.kicker}>{module.copy.kicker}</p>
              <h1>{module.copy.title}</h1>
              <p className={base.lessonSummary}>{module.copy.summary}</p>
              <dl className={styles.moduleFacts}>
                <div><dt>{course.copy.ui.minutes}</dt><dd>{module.minutes}</dd></div>
                <div>
                  <dt>{course.copy.ui.phase}</dt>
                  <dd>
                    {phase.copy.title} · {formatAiTutorMessage(course.copy.ui.phasePosition, {
                      current: phase.order,
                      total: course.phases.length,
                    })}
                  </dd>
                </div>
                <div><dt>{course.copy.ui.sources}</dt><dd>{module.sources.length}</dd></div>
              </dl>
              <p className={styles.moduleArtifact}>
                <strong>{formatAiTutorMessage(course.copy.ui.artifactWithValue, {
                  artifact: module.copy.artifact,
                })}</strong>
              </p>
            </header>

            <section
              className={base.objective}
              id="ai-tutor-module-objective"
              aria-labelledby="ai-tutor-module-objective-title"
            >
              <p className={base.kicker}>{course.copy.ui.objective}</p>
              <h2 id="ai-tutor-module-objective-title">{course.copy.ui.objectiveTitle}</h2>
              <p>{module.copy.objective}</p>
            </section>

            <ConceptMap
              manifest={course.manifest}
              copy={course.copy}
              activeSlug={module.slug}
              compact
              hrefFor={hrefFor}
            />

            <nav className={styles.onPageNav} aria-label={course.copy.ui.onThisPage}>
              <strong>{course.copy.ui.onThisPage}</strong>
              <ol>
                {module.copy.sections.map((section, sectionIndex) => (
                  <li key={section.heading}>
                    <a href={`#ai-tutor-section-${sectionIndex + 1}`}>
                      {String(sectionIndex + 1).padStart(2, "0")} {section.heading}
                    </a>
                  </li>
                ))}
                <li><a href="#ai-tutor-system-contract">04 {course.copy.ui.systemContract}</a></li>
                <li><a href="#ai-tutor-workshop">05 {course.copy.ui.workshop}</a></li>
                <li><a href={`#ai-tutor-checkpoint-${module.slug}`}>06 {course.copy.ui.checkpoint}</a></li>
                <li><a href="#ai-tutor-sources">07 {course.copy.ui.sources}</a></li>
                <li>
                  <a href={`#ai-tutor-completion-${module.slug}`}>
                    08 {course.copy.ui.markedModuleComplete}
                  </a>
                </li>
              </ol>
            </nav>

            {module.copy.sections.map((section, sectionIndex) => (
              <section
                className={base.proseSection}
                id={`ai-tutor-section-${sectionIndex + 1}`}
                aria-labelledby={`ai-tutor-section-${sectionIndex + 1}-title`}
                key={section.heading}
              >
                <p className={styles.sectionNumber}>{String(sectionIndex + 1).padStart(2, "0")}</p>
                <h2 id={`ai-tutor-section-${sectionIndex + 1}-title`}>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets?.length ? (
                  <ul className={styles.proseList}>
                    {section.bullets.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : null}
                <p className={styles.inlineEvidence}>
                  <strong>{course.copy.ui.source}:</strong>{" "}
                  {section.sourceIds.map((sourceId, sourceIndex) => {
                    const source = module.sources.find((item) => item.id === sourceId)!;
                    return (
                      <span key={source.id}>
                        {sourceIndex ? ", " : ""}
                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                          {source.title}
                          <span className={styles.srOnly}> ({course.copy.ui.opensInNewTab})</span>
                        </a>
                      </span>
                    );
                  })}
                </p>
              </section>
            ))}

            <section
              className={styles.systemContract}
              id="ai-tutor-system-contract"
              aria-labelledby="ai-tutor-system-contract-title"
            >
              <header>
                <p className={base.kicker}>{course.copy.ui.systemContract}</p>
                <h2 id="ai-tutor-system-contract-title">{course.copy.ui.systemContractTitle}</h2>
              </header>
              <ol>
                {contractEntries.map(([label, value], contractIndex) => (
                  <li key={label}>
                    <span>{String(contractIndex + 1).padStart(2, "0")}</span>
                    <div><strong>{label}</strong><p>{value}</p></div>
                  </li>
                ))}
              </ol>
            </section>

            <section
              className={`${base.practice} ${styles.workshop}`}
              id="ai-tutor-workshop"
              aria-labelledby="ai-tutor-workshop-title"
            >
              <header>
                <div>
                  <p className={base.kicker}>{course.copy.ui.workshop}</p>
                  <h2 id="ai-tutor-workshop-title">{module.copy.workshop.title}</h2>
                </div>
                <span>{formatAiTutorMessage(course.copy.ui.estimatedModuleTime, {
                  minutes: module.minutes,
                })}</span>
              </header>
              <p>{module.copy.workshop.brief}</p>
              <div className={styles.workshopGrid}>
                <div>
                  <h3>{course.copy.ui.steps}</h3>
                  <ol>{module.copy.workshop.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                </div>
                <div>
                  <h3>{course.copy.ui.deliverables}</h3>
                  <ul>{module.copy.workshop.deliverables.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              </div>
              <p className={styles.reviewGate}><strong>{course.copy.ui.reviewGate}:</strong> {module.copy.workshop.reviewGate}</p>
              <p className={styles.safetyBoundary}><strong>{course.copy.ui.safetyBoundary}:</strong> {module.copy.workshop.safetyBoundary}</p>
            </section>

            <ModuleCheckpoint
              checkpoint={module.copy.checkpoint}
              labels={course.copy.ui}
              id={`ai-tutor-checkpoint-${module.slug}`}
              slug={module.slug}
            />

            <aside className={styles.takeaway}>
              <span>{course.copy.ui.takeaway}</span>
              <p>{module.copy.takeaway}</p>
            </aside>

            <section
              className={`${base.sources} ${styles.sources}`}
              id="ai-tutor-sources"
              aria-labelledby="ai-tutor-sources-title"
            >
              <p className={base.kicker}>{course.copy.ui.evidenceBoundary}</p>
              <h2 id="ai-tutor-sources-title">{course.copy.ui.sources}</h2>
              <ol>
                {module.sources.map((source) => (
                  <li key={source.id}>
                    <div>
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        <strong>{source.title}</strong>
                        <span aria-hidden="true">↗</span>
                        <span className={styles.srOnly}> ({course.copy.ui.opensInNewTab})</span>
                      </a>
                      <span>{source.publisher}</span>
                      <time dateTime={source.accessedOn}>{formatAiTutorMessage(course.copy.ui.accessedOn, {
                        date: source.accessedOn,
                      })}</time>
                      <em>{evidenceTypeLabel(source.evidenceType, course.copy.ui)}</em>
                    </div>
                    <p><strong>{course.copy.ui.supports}:</strong> {course.copy.sourceAnnotations[source.id].supports}</p>
                    <p><strong>{course.copy.ui.limitation}:</strong> {course.copy.sourceAnnotations[source.id].limitation}</p>
                  </li>
                ))}
              </ol>
            </section>

            <div id={`ai-tutor-completion-${module.slug}`} className={styles.completionAnchor}>
              <ModuleCompletion slug={module.slug} labels={course.copy.ui} />
            </div>

            <nav className={base.lessonPager} aria-label={course.copy.ui.allModules} data-course-lesson-nav>
              {previous ? (
                <Link href={hrefFor(previous.slug)} rel="prev">
                  <span>{course.copy.ui.previous}</span><strong>{previous.copy.title}</strong>
                </Link>
              ) : <span />}
              {next ? (
                <Link href={hrefFor(next.slug)} rel="next">
                  <span>{course.copy.ui.next}</span><strong>{next.copy.title}</strong>
                </Link>
              ) : (
                <Link href={`/${course.locale}/ai-tutor/#ai-tutor-final-assessment`}>
                  <span>{course.copy.ui.finalAssessment}</span>
                  <strong>{course.copy.ui.finalAssessmentTitle}</strong>
                </Link>
              )}
            </nav>
          </article>
        </div>
      </div>
    </div>
  );
}
