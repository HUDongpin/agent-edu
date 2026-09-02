import Link from "next/link";
import Image from "next/image";
import {
  CLAUDE_INCOME_CAPSTONE,
  CLAUDE_INCOME_COURSE,
  CLAUDE_INCOME_ENGLISH_BODY_NOTICE,
  CLAUDE_INCOME_FIGURES,
  CLAUDE_INCOME_FINAL_QUIZ,
  CLAUDE_INCOME_QUIZ_BANK,
  CLAUDE_INCOME_SOURCES,
  getClaudeIncomeFigure,
  getClaudeIncomeSourceHref,
} from "@/lib/claude-income";
import DashboardProgress from "./DashboardProgress";
import ExternalLinkCue from "./ExternalLinkCue";
import FinalQuiz from "./FinalQuiz";
import styles from "./ClaudeIncomeCourse.module.css";
import CourseShell from "../course-shell/CourseShell";

const claimLabels = {
  "verified-capability": "Verified capability",
  "current-plan-or-policy": "Current plan or policy",
  "practitioner-report": "Practitioner report",
  "course-synthesis": "Course synthesis",
  "hypothetical-example": "Hypothetical example",
} as const;

const sourceKindLabels = {
  academy: "Claude Academy",
  "official-help": "Official help",
  "official-docs": "Official docs",
  "official-legal": "Official legal",
  github: "GitHub",
  "x-post": "X post",
  "case-study": "Case study",
  "platform-policy": "Platform policy",
} as const;

export default function CourseDashboard({
  locale,
  catalogLabel,
}: {
  locale: string;
  catalogLabel: string;
}) {
  const course = CLAUDE_INCOME_COURSE;
  const totalMinutes = course.lessons.reduce((total, lesson) => total + lesson.minutes, 0);
  const courseHref = `/${locale}/claude-income/`;
  const lessonHref = (slug: string) => `${courseHref}${slug}/`;
  const dashboardFigure = getClaudeIncomeFigure("fig-06-artifact-workspace");
  const dashboardFigureSrcSet = dashboardFigure.variants
    .filter((variant, index, variants) => (
      variants.findIndex((candidate) => candidate.width === variant.width) === index
    ))
    .sort((left, right) => left.width - right.width)
    .map((variant) => `${variant.src} ${variant.width}w`)
    .join(", ");
  const officialCount = CLAUDE_INCOME_SOURCES.filter((source) => (
    source.kind === "academy"
    || source.kind === "official-help"
    || source.kind === "official-docs"
    || source.kind === "official-legal"
  )).length;
  const practitionerCount = CLAUDE_INCOME_SOURCES.filter((source) => (
    source.kind === "github" || source.kind === "x-post" || source.kind === "case-study"
  )).length;

  return (
    <div
      className={`shellwrap ${styles.courseRoot} ${styles.dashboard}`}
      lang="en"
      dir="ltr"
      data-testid="claude-income-dashboard"
    >
      <CourseShell courseId="claude-income" locale={locale} />
      {locale !== "en" ? (
        <p className={styles.languageNotice} role="note">
          {CLAUDE_INCOME_ENGLISH_BODY_NOTICE}
        </p>
      ) : null}

      <header className={styles.courseHero}>
        <div className={styles.heroCopy}>
          <p className={styles.courseNumber}>Course {course.displayNumber}</p>
          <h1>{course.title}</h1>
          <p className={styles.heroSummary}>{course.summary}</p>
          <p className={styles.heroAudience}>{course.audience}</p>
          <div className={styles.heroActions}>
            <a className={styles.secondaryAction} href="#curriculum">Inspect the curriculum</a>
          </div>
        </div>

        <figure
          className={styles.dashboardFigure}
          data-testid="claude-income-dashboard-figure"
          data-figure-id={dashboardFigure.id}
          data-capture-sha256={dashboardFigure.sha256}
          data-rights-status={dashboardFigure.rightsStatus}
          data-privacy-review={dashboardFigure.privacyReview}
        >
          <div className={styles.dashboardFigureHeading}>
            <span>Real Claude UI · privacy reviewed</span>
            <strong>{dashboardFigure.title}</strong>
          </div>
          <Link
            className={styles.dashboardFigureLink}
            href={lessonHref("capstone-seven-day-demand-test")}
          >
            <picture>
              <source
                type="image/webp"
                srcSet={dashboardFigureSrcSet}
                sizes="(max-width: 780px) calc(100vw - 40px), 560px"
              />
              <Image
                src={dashboardFigure.src}
                alt={dashboardFigure.alt}
                width={dashboardFigure.width}
                height={dashboardFigure.height}
                sizes="(max-width: 780px) calc(100vw - 40px), 560px"
                priority
                unoptimized
              />
            </picture>
            <span className={styles.dashboardFigureAction}>
              Open the capstone lesson
              <span aria-hidden="true">→</span>
            </span>
          </Link>
          <figcaption>{dashboardFigure.caption}</figcaption>
        </figure>
      </header>

      <aside className={styles.courseBrief} aria-label="Course facts">
        <div>
          <p className={styles.eyebrow}>Evidence before earnings</p>
          <p className={styles.prerequisite}><strong>Prerequisite:</strong> {course.prerequisite}</p>
        </div>
        <dl>
          <div><dt>Units</dt><dd>{course.units.length}</dd></div>
          <div><dt>Lessons</dt><dd>{course.lessons.length}</dd></div>
          <div><dt>Study time</dt><dd>{Math.round(totalMinutes / 60)} hours</dd></div>
          <div><dt>Real UI figures</dt><dd>{CLAUDE_INCOME_FIGURES.length}</dd></div>
        </dl>
      </aside>

      <DashboardProgress
        courseHref={courseHref}
        lessons={course.lessons.map((lesson) => ({
          slug: lesson.slug,
          title: lesson.title,
          href: lessonHref(lesson.slug),
        }))}
      />

      <section className={styles.honestyPanel} aria-labelledby="honesty-title">
        <div>
          <p className={styles.eyebrow}>Read before starting</p>
          <h2 id="honesty-title">No income promise, no borrowed certainty</h2>
        </div>
        <div className={styles.honestyCopy}>
          <p>{course.disclaimer}</p>
          <p>{course.practitionerDisclaimer}</p>
          <p>{course.independentProjectNotice}</p>
        </div>
      </section>

      <section className={styles.curriculum} id="curriculum" aria-labelledby="curriculum-title">
        <header className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Curriculum</p>
            <h2 id="curriculum-title">From a testable problem to accountable delivery</h2>
          </div>
          <p>Each lesson ends with a concrete deliverable, completion rule, and safety boundary.</p>
        </header>

        <div className={styles.unitList}>
          {course.units.map((unit) => (
            <section className={styles.unit} key={unit.id} aria-labelledby={`${unit.id}-title`}>
              <header className={styles.unitHeading}>
                <span className={styles.unitNumber}>{String(unit.order).padStart(2, "0")}</span>
                <div>
                  <h3 id={`${unit.id}-title`}>{unit.title}</h3>
                  <p>{unit.summary}</p>
                  <p className={styles.unitOutcome}><strong>Outcome:</strong> {unit.outcome}</p>
                </div>
              </header>
              <ol className={styles.lessonList}>
                {unit.lessonSlugs.map((slug) => {
                  const lesson = course.lessons.find((item) => item.slug === slug)!;
                  return (
                    <li key={lesson.slug}>
                      <Link href={lessonHref(lesson.slug)}>
                        <span className={styles.lessonOrder}>{String(lesson.order).padStart(2, "0")}</span>
                        <span className={styles.lessonCopy}>
                          <strong>{lesson.title}</strong>
                          <span>{lesson.summary}</span>
                        </span>
                        <span className={styles.lessonTime}>{lesson.minutes} min</span>
                        <span className={styles.linkArrow} aria-hidden="true">→</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </section>

      <section className={styles.assessmentPath} aria-labelledby="assessment-path-title">
        <header className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Assessment path</p>
            <h2 id="assessment-path-title">Knowledge is necessary. Evidence is the finish line.</h2>
          </div>
        </header>
        <div className={styles.assessmentCards}>
          <article>
            <span>01</span>
            <h3>Balanced final quiz</h3>
            <p>
              {CLAUDE_INCOME_FINAL_QUIZ.questionCount} questions from a {CLAUDE_INCOME_QUIZ_BANK.length}-item bank.
              Pass at 13 correct only when all selected critical boundaries are correct.
            </p>
            <a href="#final-quiz">Go to the final quiz</a>
          </article>
          <article>
            <span>02</span>
            <h3>Seven-day demand test</h3>
            <p>
              A {CLAUDE_INCOME_CAPSTONE.criteria.reduce((sum, item) => sum + item.points, 0)}-point evidence rubric
              with a non-compensable critical-failure gate.
            </p>
            <Link href={lessonHref("capstone-seven-day-demand-test")}>Open the capstone lesson</Link>
          </article>
        </div>
      </section>

      <FinalQuiz courseHref={courseHref} />

      <section className={styles.sourceIntegrity} aria-labelledby="source-integrity-title">
        <header className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Source integrity</p>
            <h2 id="source-integrity-title">Capabilities, policies, and anecdotes stay in separate lanes</h2>
          </div>
          <p>Course reviewed <time dateTime={course.reviewedOn}>{course.reviewedOn}</time>. High-volatility facts should be rechecked before a purchase or client decision.</p>
        </header>

        <dl className={styles.sourceStats}>
          <div><dt>Official sources</dt><dd>{officialCount}</dd></div>
          <div><dt>Practitioner sources</dt><dd>{practitionerCount}</dd></div>
          <div><dt>Total source records</dt><dd>{CLAUDE_INCOME_SOURCES.length}</dd></div>
          <div><dt>Figure privacy reviews</dt><dd>{CLAUDE_INCOME_FIGURES.length} passed</dd></div>
        </dl>

        <div className={styles.evidenceRules}>
          <article>
            <strong>Official evidence</strong>
            <p>Used for product capabilities, terms, and policy boundaries. Availability and interface facts carry an observation date.</p>
          </article>
          <article>
            <strong>GitHub evidence</strong>
            <p>Used for inspectible workflow patterns. Repository activity and code do not prove customer demand or income.</p>
          </article>
          <article>
            <strong>X evidence</strong>
            <p>Linked as attributed practitioner reports. Posts are not rehosted and are never treated as representative earnings evidence.</p>
          </article>
        </div>

        <details className={styles.sourceLedger}>
          <summary>Open the full source ledger ({CLAUDE_INCOME_SOURCES.length} records)</summary>
          <ol>
            {CLAUDE_INCOME_SOURCES.map((source) => (
              <li key={source.id}>
                <div className={styles.sourceTitle}>
                  <a href={getClaudeIncomeSourceHref(source)} target="_blank" rel="noopener noreferrer">
                    {source.title}
                    <ExternalLinkCue />
                  </a>
                  <span>Grade {source.evidenceGrade}</span>
                </div>
                <p className={styles.sourceByline}>
                  {source.publisher} · {sourceKindLabels[source.kind]} · {claimLabels[source.claimClass]} · Accessed {source.accessedOn}
                  {"pinnedRevision" in source ? ` · Pinned commit ${source.pinnedRevision.slice(0, 12)}` : ""}
                </p>
                <p>{source.supports}</p>
                <p className={styles.sourceLimit}><strong>Limit:</strong> {source.limitations}</p>
              </li>
            ))}
          </ol>
        </details>
      </section>

      <p className={styles.backLink}>
        <Link href={`/${locale}/courses/`}>
          <span aria-hidden="true">←</span>
          <span dir="auto">Back to {catalogLabel}</span>
        </Link>
      </p>
    </div>
  );
}
