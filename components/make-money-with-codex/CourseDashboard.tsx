import Link from "next/link";
import {
  CODEX_INCOME_SOURCES,
  MAKE_MONEY_WITH_CODEX_COURSE,
  MAKE_MONEY_WITH_CODEX_EVIDENCE_CLASSES,
  MAKE_MONEY_WITH_CODEX_FIGURE_BY_ID,
  MAKE_MONEY_WITH_CODEX_FIGURES,
  MAKE_MONEY_WITH_CODEX_TOTAL_MINUTES,
  type CodexIncomeLocaleCopy,
} from "@/lib/make-money-with-codex";
import CourseFigure from "./CourseFigure";
import CourseJourneyAction from "./CourseJourneyAction";
import CourseProgress from "./CourseProgress";
import EvidenceBadge from "./EvidenceBadge";
import KnowledgeCheck from "./KnowledgeCheck";
import styles from "./IncomeCourse.module.css";
import CourseShell from "../course-shell/CourseShell";

function durationLabel(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default function CourseDashboard({
  locale,
  copy,
}: {
  locale: string;
  copy: CodexIncomeLocaleCopy;
}) {
  const course = MAKE_MONEY_WITH_CODEX_COURSE;
  const courseHref = `/${locale}/make-money-with-codex/`;
  const hrefFor = (slug: string) => `/${locale}/make-money-with-codex/${slug}/`;
  const heroFigure = MAKE_MONEY_WITH_CODEX_FIGURE_BY_ID["fig-1"];
  const authenticFigures = MAKE_MONEY_WITH_CODEX_FIGURES.filter(
    (figure) => figure.surface === "codex-app" || figure.surface === "codex-cli",
  );
  const atlasFigures = authenticFigures.filter((figure) => figure.id !== heroFigure.id);
  const artifactFigures = MAKE_MONEY_WITH_CODEX_FIGURES.filter(
    (figure) => figure.surface === "product-output" || figure.surface === "repository-handoff",
  );
  const evidenceCounts = Object.fromEntries(
    MAKE_MONEY_WITH_CODEX_EVIDENCE_CLASSES.map((evidenceClass) => [
      evidenceClass,
      CODEX_INCOME_SOURCES.filter((source) => source.evidenceClass === evidenceClass).length,
    ]),
  );
  const localizedDirection: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";
  const localizedText = { lang: locale, dir: localizedDirection };

  return (
    <div className={`${styles.coursePage} en-content`} dir="ltr" data-testid="income-course-dashboard">
      <CourseShell courseId="make-money-with-codex" locale={locale} standalone />
      <section className={`shellwrap ${styles.courseHero}`} aria-labelledby="income-course-title">
        <div className={styles.heroCopy}>
          <p className={styles.kicker} lang="en">{course.kicker}</p>
          <h1 id="income-course-title" {...localizedText}>{copy.meta.title}</h1>
          <p className={styles.heroSummary} lang="en">{course.summary}</p>
          <div className={styles.heroActions}>
            <CourseJourneyAction
              courseHref={courseHref}
              startLabel={copy.ui.startCourse}
              locale={locale}
              lessons={course.lessons.map((lesson) => ({
                slug: lesson.slug,
                href: hrefFor(lesson.slug),
              }))}
            />
            <a className={styles.secondaryButton} href="#income-curriculum" {...localizedText}>{copy.ui.inspectLessons}</a>
          </div>
          <p className={styles.heroNonPromise} lang="en">{course.nonPromise}</p>
        </div>
        <div className={styles.heroVisual} lang="en">
          <div className={styles.heroFigureLabel}><span>01</span> Authentic Codex interface</div>
          <CourseFigure figure={heroFigure} eager instanceId="hero" />
        </div>
      </section>

      <aside className={`shellwrap ${styles.languageNotice}`} role="note" {...localizedText}>
        <strong>{copy.meta.shortTitle}</strong>
        <span>{copy.meta.languageNotice}</span>
      </aside>

      <section
        className={`shellwrap ${styles.factRail}`}
        aria-label={`${copy.ui.course} 11 · ${copy.ui.guidedWork}`}
        {...localizedText}
      >
        <div><strong>{course.lessons.length}</strong><span>{copy.ui.lessons}</span></div>
        <div><strong lang="en" dir="ltr">{durationLabel(MAKE_MONEY_WITH_CODEX_TOTAL_MINUTES)}</strong><span>{copy.ui.guidedWork}</span></div>
        <div><strong>{authenticFigures.length}</strong><span>{copy.ui.authenticUi}</span></div>
        <div><strong><time dateTime={course.verifiedOn}>{course.verifiedOn}</time></strong><span>{copy.ui.evidenceVerified}</span></div>
      </section>

      <section className={`shellwrap ${styles.valueChain}`} aria-labelledby="income-chain-title" lang="en">
        <header>
          <p className={styles.kicker}>The governing model</p>
          <h2 id="income-chain-title">Revenue is a chain, not a prompt.</h2>
          <p>Codex can strengthen production. A business still needs every link below, and the weakest link sets the outcome.</p>
        </header>
        <ol>
          {[
            ["01", "Payer", "Someone with authority and a costly job"],
            ["02", "Outcome", "A narrow change they can value"],
            ["03", "Delivery", "Authorised work with controlled risk"],
            ["04", "Proof", "Fresh, inspectable acceptance evidence"],
            ["05", "Margin", "Collected price above the full obligation"],
          ].map(([number, title, copy]) => (
            <li key={title}><span>{number}</span><strong>{title}</strong><p>{copy}</p></li>
          ))}
        </ol>
      </section>

      <div className="shellwrap">
        <CourseProgress
          locale={locale}
          resetConfirm={copy.ui.resetConfirm}
          startLabel={copy.ui.startCourse}
          lessons={course.lessons.map((lesson) => ({
            slug: lesson.slug,
            title: copy.lessons[lesson.slug].title,
            href: hrefFor(lesson.slug),
          }))}
        />
      </div>

      <section
        className={`shellwrap ${styles.curriculum}`}
        id="income-curriculum"
        aria-labelledby="income-curriculum-title"
        tabIndex={-1}
      >
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker} {...localizedText}>{copy.ui.curriculum}</p>
            <h2 id="income-curriculum-title" lang="en">From paid problem to audited handoff</h2>
          </div>
          <p lang="en">{course.promise}</p>
        </header>
        <div className={styles.unitGrid}>
          {course.units.map((unit) => (
            <section key={unit.id} className={styles.unitCard} aria-labelledby={`income-unit-${unit.id}`}>
              <header>
                <span>{String(unit.order).padStart(2, "0")}</span>
                <div><h3 id={`income-unit-${unit.id}`} {...localizedText}>{copy.units[unit.id].title}</h3><p lang="en">{unit.summary}</p></div>
              </header>
              <ol>
                {unit.lessonSlugs.map((slug) => {
                  const lesson = course.lessons.find((candidate) => candidate.slug === slug)!;
                  return (
                    <li key={slug}>
                      <Link href={hrefFor(slug)}>
                        <span>{String(lesson.order).padStart(2, "0")}</span>
                        <span><strong {...localizedText}>{copy.lessons[slug].title}</strong><small lang="en">{lesson.outcome}</small></span>
                        <time dateTime={`PT${lesson.minutes}M`} {...localizedText}>{lesson.minutes} {copy.ui.minutes}</time>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </section>

      <section className={`shellwrap ${styles.evidenceSystem}`} aria-labelledby="income-evidence-system-title" lang="en">
        <div className={styles.evidenceIntro}>
          <p className={styles.kicker}>Claim control</p>
          <h2 id="income-evidence-system-title">Every source carries a ceiling.</h2>
          <p>A feature page can support a workflow claim. A public artefact can support existence. A paid offer can support commercialisation intent. Only a realised financial event supports a financial outcome, and none of these sources proves typical earnings.</p>
        </div>
        <div className={styles.evidenceMatrix}>
          {MAKE_MONEY_WITH_CODEX_EVIDENCE_CLASSES.map((evidenceClass) => (
            <div key={evidenceClass}>
              <EvidenceBadge value={evidenceClass} />
              <strong>{evidenceCounts[evidenceClass]} sources</strong>
            </div>
          ))}
        </div>
        <blockquote>
          <strong>The best commercial case is still bounded.</strong>
          <p>OpenAI Academy reports that a prospect requested a $10,000-per-month contract after a Codex-assisted feature demo. It does not report that the contract was signed, paid, renewed, profitable, or typical.</p>
          <a href="https://academy.openai.com/public/blogs/goliath-data-from-three-people-to-20-in-chattanooga" target="_blank" rel="noopener noreferrer">Read the Academy case</a>
        </blockquote>
      </section>

      <section className={`shellwrap ${styles.figureAtlas}`} aria-labelledby="income-ui-atlas-title" lang="en">
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.kicker}>Visual evidence atlas</p>
            <h2 id="income-ui-atlas-title">Know what the image actually shows.</h2>
          </div>
          <p>Across the course, two figures show current Codex app UI, one is an official historical CLI illustration, and one renders an actual CLI transcript. The hero already shows the first app capture, so this atlas does not repeat it. Five additional figures are synthetic product-output or repository-handoff fixtures and are never labelled as Codex UI.</p>
        </header>
        <div className={styles.figureGrid}>
          {atlasFigures.map((figure) => <CourseFigure key={figure.id} figure={figure} />)}
        </div>
        <details className={styles.artifactDrawer}>
          <summary>Inspect {artifactFigures.length} downstream output and handoff figures</summary>
          <div className={styles.figureGrid}>
            {artifactFigures.map((figure) => <CourseFigure key={figure.id} figure={figure} />)}
          </div>
        </details>
      </section>

      <div className="shellwrap" lang="en">
        <KnowledgeCheck
          questions={course.quiz}
          passingScore={course.passingScore}
          locale="en"
          capstoneHref={hrefFor("launch-capstone")}
        />
      </div>

      <section className={`shellwrap ${styles.integrityPanel}`} aria-labelledby="income-integrity-title" lang="en">
        <div>
          <p className={styles.kicker}>Publication standard</p>
          <h2 id="income-integrity-title">No screenshots of success theatre.</h2>
        </div>
        <div>
          <p>Course completion means you built a reviewable commercial experiment. It does not certify income, compliance, production readiness, or product-market fit.</p>
          <p>Eight figures use first-party pixels and invented data. The official historical CLI figure retains its commit-pinned Apache-2.0 notice. Practitioner posts supply context, not redistributed pixels. See each figure ledger and the <a href="/courses/make-money-with-codex/NOTICE.md" target="_blank" rel="noopener noreferrer">publication notice</a>.</p>
          <Link href={hrefFor("launch-capstone")}>Open the capstone evidence pack <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <p className={`shellwrap ${styles.backLink}`}><Link href={`/${locale}/courses/`} {...localizedText}>← {copy.ui.backToCatalog}</Link></p>
    </div>
  );
}
