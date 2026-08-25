import Link from "next/link";
import {
  CODEX_INCOME_SOURCE_BY_ID,
  MAKE_MONEY_WITH_CODEX_COURSE,
  MAKE_MONEY_WITH_CODEX_FIGURE_BY_ID,
  type CodexIncomeLocaleCopy,
  type CodexIncomeLesson,
} from "@/lib/make-money-with-codex";
import CapstoneChecklist from "./CapstoneChecklist";
import CopyPrompt from "./CopyPrompt";
import CourseFigure from "./CourseFigure";
import EvidenceBadge from "./EvidenceBadge";
import LessonCompletion from "./LessonCompletion";
import MarginCalculator from "./MarginCalculator";
import OfferBuilder from "./OfferBuilder";
import OpportunityScorecard from "./OpportunityScorecard";
import styles from "./IncomeCourse.module.css";

function LessonTool({ lesson }: { lesson: CodexIncomeLesson }) {
  if (lesson.slug === "choose-market-wedge") return <OpportunityScorecard />;
  if (lesson.slug === "write-commercial-spec") return <OfferBuilder />;
  if (lesson.slug === "price-for-margin") return <MarginCalculator locale="en" />;
  if (lesson.slug === "launch-capstone") return <CapstoneChecklist />;
  return null;
}

export default function LessonView({
  lesson,
  locale,
  copy,
}: {
  lesson: CodexIncomeLesson;
  locale: string;
  copy: CodexIncomeLocaleCopy;
}) {
  const course = MAKE_MONEY_WITH_CODEX_COURSE;
  const lessonIndex = course.lessons.findIndex((candidate) => candidate.slug === lesson.slug);
  const previous = lessonIndex > 0 ? course.lessons[lessonIndex - 1] : undefined;
  const next = lessonIndex < course.lessons.length - 1 ? course.lessons[lessonIndex + 1] : undefined;
  const courseHref = `/${locale}/make-money-with-codex/`;
  const hrefFor = (slug: string) => `${courseHref}${slug}/`;
  const localizedDirection: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";
  const localizedText = { lang: locale, dir: localizedDirection };
  const localizedUnitTitle = copy.units[lesson.unitId].title;

  return (
    <div className={`${styles.lessonPage} en-content`} dir="ltr" data-testid={`income-lesson-${lesson.slug}`}>
      <div className={`shellwrap ${styles.lessonShell}`}>
        <nav className={styles.lessonRail} aria-label={copy.ui.courseOutline} {...localizedText}>
          <Link className={styles.railCourseLink} href={courseHref}>{copy.ui.course} 11</Link>
          <p>{localizedUnitTitle}</p>
          <ol>
            {course.lessons.map((item) => (
              <li key={item.slug} data-current={item.slug === lesson.slug || undefined}>
                <Link href={hrefFor(item.slug)} aria-current={item.slug === lesson.slug ? "page" : undefined}>
                  <span>{String(item.order).padStart(2, "0")}</span>
                  <span>{copy.lessons[item.slug].title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <article className={styles.lessonArticle}>
          <nav className={styles.breadcrumbs} aria-label={copy.ui.courseOutline} {...localizedText}>
            <Link href={`/${locale}/courses/`}>{copy.ui.courses}</Link><span aria-hidden="true">/</span>
            <Link href={courseHref}>{copy.meta.shortTitle}</Link><span aria-hidden="true">/</span>
            <span aria-current="page">{copy.ui.lesson} {lesson.order}</span>
          </nav>

          <aside className={styles.compactLanguageNotice} role="note" {...localizedText}>
            {copy.meta.languageNotice} {copy.ui.evidenceVerified}: <time dateTime={course.verifiedOn}>{course.verifiedOn}</time>
          </aside>

          <header className={styles.lessonHero}>
            <p className={styles.kicker} {...localizedText}>{localizedUnitTitle} · {copy.ui.lesson} {String(lesson.order).padStart(2, "0")}</p>
            <h1 {...localizedText}>{copy.lessons[lesson.slug].title}</h1>
            <p className={styles.lessonSummary} lang="en">{lesson.summary}</p>
            <dl className={styles.lessonMeta}>
              <div><dt {...localizedText}>{copy.ui.time}</dt><dd {...localizedText}>{lesson.minutes} {copy.ui.minutes}</dd></div>
              <div><dt {...localizedText}>{copy.ui.output}</dt><dd lang="en">{lesson.outcome}</dd></div>
              <div><dt {...localizedText}>{copy.ui.evidence}</dt><dd {...localizedText}>{lesson.sourceIds.length} {copy.ui.boundedSources}</dd></div>
            </dl>
          </header>

          <section className={styles.objectives} aria-labelledby="income-objectives-title" lang="en">
            <div><p className={styles.kicker}>After this lesson</p><h2 id="income-objectives-title">You can</h2></div>
            <ul>{lesson.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
          </section>

          <div className={styles.lessonEvidenceBadges} role="group" aria-label="Evidence classes used in this lesson" lang="en">
            {lesson.evidenceClasses.map((evidenceClass) => <EvidenceBadge key={evidenceClass} value={evidenceClass} />)}
          </div>

          {lesson.sections.map((section, sectionIndex) => (
            <section className={styles.proseSection} key={`${lesson.slug}-${section.heading}`} aria-labelledby={`${lesson.slug}-section-${sectionIndex}`} lang="en">
              <header>
                <p>{section.eyebrow}</p>
                <h2 id={`${lesson.slug}-section-${sectionIndex}`}>{section.heading}</h2>
              </header>
              <div className={styles.proseBody}>
                {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
                {section.example ? (
                  <aside className={styles.exampleCard}>
                    <span>{section.example.label}</span>
                    <h3>{section.example.title}</h3>
                    <p>{section.example.text}</p>
                  </aside>
                ) : null}
                {section.warning ? <p className={styles.warningCard}><strong>Guardrail</strong>{section.warning}</p> : null}
              </div>
              {section.figureId ? <CourseFigure figure={MAKE_MONEY_WITH_CODEX_FIGURE_BY_ID[section.figureId]} /> : null}
            </section>
          ))}

          <section className={styles.practice} aria-labelledby="income-practice-title" lang="en">
            <header>
              <p className={styles.kicker}>Applied work</p>
              <h2 id="income-practice-title">{lesson.practice.title}</h2>
              <p>{lesson.practice.brief}</p>
            </header>
            <div className={styles.practiceGrid}>
              <div>
                <h3>Run the exercise</h3>
                <ol>{lesson.practice.steps.map((step) => <li key={step}>{step}</li>)}</ol>
              </div>
              <div>
                <h3>Leave these receipts</h3>
                <ul>{lesson.practice.deliverables.map((deliverable) => <li key={deliverable}>{deliverable}</li>)}</ul>
              </div>
            </div>
            <h3>Codex task contract</h3>
            <CopyPrompt prompt={lesson.practice.prompt} />
            <p className={styles.practiceGuardrail}><strong>Non-negotiable:</strong> {lesson.practice.guardrail}</p>
          </section>

          <div lang="en"><LessonTool lesson={lesson} /></div>

          <section className={styles.checkpoint} aria-labelledby="income-checkpoint-title" lang="en">
            <p className={styles.kicker}>Decision checkpoint</p>
            <h2 id="income-checkpoint-title">Before you move on</h2>
            <details>
              <summary>{lesson.checkpoint.question}</summary>
              <p>{lesson.checkpoint.answer}</p>
            </details>
          </section>

          <blockquote className={styles.takeaway} lang="en"><p>{lesson.takeaway}</p></blockquote>

          <section className={styles.sources} aria-labelledby="income-sources-title" lang="en">
            <header>
              <p className={styles.kicker}>Source ledger</p>
              <h2 id="income-sources-title">What each source supports, and where it stops</h2>
            </header>
            <ol>
              {lesson.sourceIds.map((sourceId) => {
                const source = CODEX_INCOME_SOURCE_BY_ID[sourceId];
                return (
                  <li key={sourceId}>
                    <div className={styles.sourceHead}>
                      <EvidenceBadge value={source.evidenceClass} />
                      <span>{source.publisher}</span>
                    </div>
                    <h3><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></h3>
                    <dl>
                      <div><dt>Supports</dt><dd>{source.supports}</dd></div>
                      <div><dt>Does not prove</dt><dd>{source.boundary}</dd></div>
                    </dl>
                    <p>
                      Accessed <time dateTime={source.accessedOn}>{source.accessedOn}</time>
                      {source.publishedOn ? <> · published <time dateTime={source.publishedOn}>{source.publishedOn}</time></> : null}
                      {source.updatedOn ? <> · updated <time dateTime={source.updatedOn}>{source.updatedOn}</time></> : null}
                      {source.eventOn ? <> · event date <time dateTime={source.eventOn}>{source.eventOn}</time></> : null}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>

          <div lang="en"><LessonCompletion slug={lesson.slug} /></div>

          <nav className={styles.lessonPager} aria-label={copy.ui.courseOutline} {...localizedText}>
            {previous ? (
              <Link href={hrefFor(previous.slug)} rel="prev"><span>{copy.ui.previous}</span><strong>{copy.lessons[previous.slug].title}</strong></Link>
            ) : <span />}
            {next ? (
              <Link href={hrefFor(next.slug)} rel="next"><span>{copy.ui.next}</span><strong>{copy.lessons[next.slug].title}</strong></Link>
            ) : (
              <Link href={courseHref}><span>{copy.ui.courseDashboard}</span><strong>{copy.ui.reviewEvidencePath}</strong></Link>
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}
