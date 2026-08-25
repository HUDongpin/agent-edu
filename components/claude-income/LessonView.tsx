import Link from "next/link";
import {
  CLAUDE_INCOME_COURSE,
  CLAUDE_INCOME_ENGLISH_BODY_NOTICE,
  getClaudeIncomeFigure,
  getClaudeIncomeSource,
  getClaudeIncomeSourceHref,
  type ClaudeIncomeLesson,
} from "@/lib/claude-income";
import CapstoneAudit from "./CapstoneAudit";
import CopyPrompt from "./CopyPrompt";
import CourseFigure from "./CourseFigure";
import LessonCompletion from "./LessonCompletion";
import styles from "./ClaudeIncomeCourse.module.css";

const claimLabels = {
  "verified-capability": "Verified capability",
  "current-plan-or-policy": "Current plan or policy",
  "practitioner-report": "Practitioner report",
  "course-synthesis": "Course synthesis",
  "hypothetical-example": "Hypothetical example",
} as const;

function CourseOutline({ locale, activeSlug }: { locale: string; activeSlug: string }) {
  const courseHref = `/${locale}/claude-income/`;
  return (
    <nav aria-label="Course 12 lessons">
      {CLAUDE_INCOME_COURSE.units.map((unit) => (
        <div className={styles.railUnit} key={unit.id}>
          <p>{String(unit.order).padStart(2, "0")} · {unit.title}</p>
          <ol>
            {unit.lessonSlugs.map((slug) => {
              const item = CLAUDE_INCOME_COURSE.lessons.find((lesson) => lesson.slug === slug)!;
              return (
                <li key={item.slug}>
                  <Link
                    href={`${courseHref}${item.slug}/`}
                    aria-current={item.slug === activeSlug ? "page" : undefined}
                  >
                    <span>{String(item.order).padStart(2, "0")}</span>
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </nav>
  );
}

export default function LessonView({
  locale,
  lesson,
  courseLabel,
}: {
  locale: string;
  lesson: ClaudeIncomeLesson;
  courseLabel: string;
}) {
  const course = CLAUDE_INCOME_COURSE;
  const courseHref = `/${locale}/claude-income/`;
  const lessonIndex = course.lessons.findIndex((item) => item.slug === lesson.slug);
  const previous = lessonIndex > 0 ? course.lessons[lessonIndex - 1] : null;
  const next = lessonIndex < course.lessons.length - 1 ? course.lessons[lessonIndex + 1] : null;
  const unit = course.units.find((item) => item.id === lesson.unitId)!;
  const figures = lesson.figureIds.map(getClaudeIncomeFigure);
  const sources = lesson.sourceIds.map(getClaudeIncomeSource);

  return (
    <div
      className={`shellwrap ${styles.courseRoot} ${styles.lessonPage}`}
      lang="en"
      dir="ltr"
      data-testid={`claude-income-lesson-${lesson.slug}`}
    >
      {locale !== "en" ? (
        <p className={styles.languageNotice} role="note">
          {CLAUDE_INCOME_ENGLISH_BODY_NOTICE}
        </p>
      ) : null}

      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href={courseHref}>
          <span aria-hidden="true">←</span>
          {courseLabel}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Lesson {lesson.order}</span>
      </nav>

      <details className={styles.mobileOutline}>
        <summary>Course outline · Lesson {lesson.order} of {course.lessons.length}</summary>
        <CourseOutline locale={locale} activeSlug={lesson.slug} />
      </details>

      <div className={styles.lessonLayout}>
        <aside className={styles.lessonRail}>
          <Link className={styles.railCourseLink} href={courseHref}>Course {course.displayNumber}</Link>
          <CourseOutline locale={locale} activeSlug={lesson.slug} />
        </aside>

        <article className={styles.lessonMain}>
          <header className={styles.lessonHero}>
            <p className={styles.courseNumber}>Unit {unit.order} · Lesson {lesson.order}</p>
            <p className={styles.eyebrow}>{lesson.kicker}</p>
            <h1>{lesson.title}</h1>
            <p className={styles.lessonSummary}>{lesson.summary}</p>
            <dl className={styles.lessonMeta}>
              <div><dt>Study time</dt><dd>{lesson.minutes} min</dd></div>
              <div><dt>Sources</dt><dd>{sources.length}</dd></div>
              <div><dt>Figures</dt><dd>{figures.length}</dd></div>
              <div><dt>Unit</dt><dd>{unit.order} of {course.units.length}</dd></div>
            </dl>
          </header>

          <section className={styles.objective} aria-labelledby="lesson-objective-title">
            <p className={styles.eyebrow}>Learning objective</p>
            <h2 id="lesson-objective-title">What you will be able to do</h2>
            <p>{lesson.objective}</p>
          </section>

          <div className={styles.lessonSections}>
            {lesson.sections.map((section, index) => (
              <section key={section.heading} aria-labelledby={`lesson-section-${index}`}>
                <header className={styles.contentHeading}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h2 id={`lesson-section-${index}`}>{section.heading}</h2>
                    <p className={styles.claimClass}>{claimLabels[section.claimClass]}</p>
                  </div>
                </header>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets?.length ? (
                  <ul className={styles.editorialList}>
                    {section.bullets.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                ) : null}
                <p className={styles.inlineSources}>
                  <span>Evidence:</span>{" "}
                  {section.sourceIds.map((sourceId, sourceIndex) => {
                    const source = getClaudeIncomeSource(sourceId);
                    return (
                      <span key={source.id}>
                        {sourceIndex ? ", " : ""}
                        <a href={getClaudeIncomeSourceHref(source)} target="_blank" rel="noopener noreferrer">{source.title}</a>
                      </span>
                    );
                  })}
                </p>
                {figures[index] ? <CourseFigure figure={figures[index]} priority={index === 0} /> : null}
              </section>
            ))}
          </div>

          <section className={styles.workflow} aria-labelledby="workflow-title">
            <header className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Reusable workflow</p>
                <h2 id="workflow-title">Run the work in this order</h2>
              </div>
            </header>
            <ol>
              {lesson.workflow.map((step, index) => (
                <li key={step}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.promptTemplate} aria-labelledby="prompt-template-title">
            <header>
              <div>
                <p className={styles.eyebrow}>Prompt template</p>
                <h2 id="prompt-template-title">Adapt this to your approved inputs</h2>
              </div>
              <CopyPrompt prompt={lesson.promptTemplate} />
            </header>
            <pre><code>{lesson.promptTemplate}</code></pre>
            <p>Replace bracketed placeholders. Remove client data before saving a reusable template.</p>
          </section>

          <section className={styles.economics} aria-labelledby="economics-title">
            <p className={styles.eyebrow}>Economics check</p>
            <h2 id="economics-title">Count accepted delivery, not generation</h2>
            <p>{lesson.economics}</p>
          </section>

          <div className={styles.gateGrid}>
            <section className={styles.qualityGate} aria-labelledby="quality-gate-title">
              <p className={styles.eyebrow}>Quality gate</p>
              <h2 id="quality-gate-title">Proceed only when</h2>
              <ul>
                {lesson.qualityGate.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
            <section className={styles.redFlags} aria-labelledby="red-flags-title">
              <p className={styles.eyebrow}>Red flags</p>
              <h2 id="red-flags-title">Stop and inspect</h2>
              <ul>
                {lesson.redFlags.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          </div>

          <section className={styles.practice} aria-labelledby="practice-title">
            <header>
              <div>
                <p className={styles.eyebrow}>Field exercise · {lesson.practice.estimatedMinutes} min</p>
                <h2 id="practice-title">{lesson.practice.title}</h2>
              </div>
            </header>
            <p className={styles.practiceBrief}>{lesson.practice.brief}</p>
            <div className={styles.practiceGrid}>
              <div>
                <h3>Steps</h3>
                <ol>
                  {lesson.practice.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </div>
              <div>
                <h3>Deliverables</h3>
                <ul>
                  {lesson.practice.deliverables.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <h3>Done when</h3>
                <ul>
                  {lesson.practice.doneWhen.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
            <p className={styles.safetyNote}><strong>Safety boundary:</strong> {lesson.practice.safety}</p>
          </section>

          <section className={styles.checkpoint} aria-labelledby="checkpoint-title">
            <p className={styles.eyebrow}>Checkpoint</p>
            <h2 id="checkpoint-title">Explain the decision</h2>
            <details>
              <summary>{lesson.checkpoint.prompt}</summary>
              <p>{lesson.checkpoint.answer}</p>
            </details>
          </section>

          <blockquote className={styles.takeaway}>
            <p>{lesson.takeaway}</p>
          </blockquote>

          {lesson.slug === "capstone-seven-day-demand-test" ? (
            <CapstoneAudit practice={lesson.practice} />
          ) : null}

          <aside className={styles.independentNotice} aria-labelledby="independent-project-title">
            <p className={styles.eyebrow}>Independent project notice</p>
            <h2 id="independent-project-title">About this course and its interface figures</h2>
            <p>{course.independentProjectNotice}</p>
          </aside>

          <section className={styles.lessonSources} aria-labelledby="lesson-sources-title">
            <header className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Source ledger</p>
                <h2 id="lesson-sources-title">Evidence used in this lesson</h2>
              </div>
              <p>Open the source and inspect its limitation before repeating a claim.</p>
            </header>
            <ol>
              {sources.map((source) => (
                <li key={source.id}>
                  <a href={getClaudeIncomeSourceHref(source)} target="_blank" rel="noopener noreferrer">
                    <strong>{source.title}</strong>
                    <span>
                      {source.publisher} · Grade {source.evidenceGrade} · Accessed {source.accessedOn}
                      {source.pinnedRevision ? ` · Pinned commit ${source.pinnedRevision.slice(0, 12)}` : ""}
                    </span>
                  </a>
                  <p>{source.supports}</p>
                  <p><strong>Limit:</strong> {source.limitations}</p>
                </li>
              ))}
            </ol>
          </section>

          <LessonCompletion slug={lesson.slug} />

          <nav className={styles.lessonPager} aria-label="Lesson navigation">
            {previous ? (
              <Link href={`${courseHref}${previous.slug}/`} rel="prev">
                <span>Previous lesson</span>
                <strong>{previous.title}</strong>
              </Link>
            ) : <span />}
            {next ? (
              <Link href={`${courseHref}${next.slug}/`} rel="next">
                <span>Next lesson</span>
                <strong>{next.title}</strong>
              </Link>
            ) : (
              <Link href={courseHref}>
                <span>Return to course</span>
                <strong>{course.title}</strong>
              </Link>
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}
