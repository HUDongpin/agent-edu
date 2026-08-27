import Link from "next/link";
import {
  CODEX_CAPSTONE,
  type CodexCourseCopy,
  type MaterializedCodexCourse,
  type MaterializedCodexLesson,
} from "@/lib/codex";
import CapstoneReceipt from "./CapstoneReceipt";
import CourseFigure from "./CourseFigure";
import LessonCompletion from "./LessonCompletion";
import TechnicalText from "./TechnicalText";
import styles from "./CodexCourse.module.css";

function localizedValue(copy: CodexCourseCopy, copyKey: string): unknown {
  return copyKey.split(".").reduce<unknown>((value, segment) => {
    if (typeof value !== "object" || value === null || !(segment in value)) return undefined;
    return (value as Record<string, unknown>)[segment];
  }, copy);
}

function localizedString(copy: CodexCourseCopy, copyKey: string): string {
  const value = localizedValue(copy, copyKey);
  if (typeof value !== "string") throw new Error(`Codex block copy must resolve to a string: ${copyKey}`);
  return value;
}

function localizedStringList(copy: CodexCourseCopy, copyKey: string): readonly string[] {
  const value = localizedValue(copy, copyKey);
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`Codex steps copy must resolve to a string array: ${copyKey}`);
  }
  return value;
}

function localizedTable(copy: CodexCourseCopy, copyKey: string, columns: number): readonly (readonly string[])[] {
  const value = localizedValue(copy, copyKey);
  if (!Array.isArray(value) || !value.every((row) => (
    Array.isArray(row) && row.length === columns && row.every((cell) => typeof cell === "string")
  ))) {
    throw new Error(`Codex comparison copy must resolve to rows matching ${columns} columns: ${copyKey}`);
  }
  return value;
}

function assertNeverBlock(block: never): never {
  throw new Error(`Unsupported Codex block: ${JSON.stringify(block)}`);
}

export default function LessonView({
  course,
  lesson,
}: {
  course: MaterializedCodexCourse;
  lesson: MaterializedCodexLesson;
}) {
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const lessonIndex = lessons.findIndex((item) => item.slug === lesson.slug);
  const previous = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const next = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;
  const hrefFor = (slug: string) => `/${course.locale}/codex/${slug}/`;

  return (
    <div
      className={`shellwrap ${styles.lessonPage}`}
      data-testid={`codex-lesson-${lesson.slug}`}
    >
      <nav className={styles.breadcrumbs} aria-label={course.copy.ui.backToCourse}>
        <Link href={`/${course.locale}/codex/`}>
          <span className={styles.backArrow} aria-hidden="true">←</span>
          {course.copy.ui.backToCourse}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page"><TechnicalText text={lesson.copy.title} /></span>
      </nav>

      <div className={styles.lessonLayout}>
        <aside className={styles.lessonRail}>
          <nav aria-label={course.copy.ui.allLessons}>
            <strong>{course.copy.ui.allLessons}</strong>
            {course.units.map((unit) => (
              <div className={styles.railUnit} key={unit.id}>
                <p className={styles.railGroup}><TechnicalText text={unit.copy.title} /></p>
                <ol>
                  {unit.lessons.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={hrefFor(item.slug)}
                        aria-current={item.slug === lesson.slug ? "page" : undefined}
                      >
                        <span>{item.order}</span>
                        <TechnicalText text={item.copy.title} />
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </nav>
        </aside>

        <div className={styles.lessonMain}>
          <article>
            <header className={styles.lessonHero}>
              <p className={styles.kicker}><TechnicalText text={lesson.copy.kicker} /></p>
              <h1><TechnicalText text={lesson.copy.title} /></h1>
              <p className={styles.lessonSummary}><TechnicalText text={lesson.copy.summary} /></p>
              <dl className={styles.lessonMeta}>
                <div>
                  <dt>{course.copy.ui.minutes}</dt>
                  <dd>{lesson.minutes}</dd>
                </div>
                <div>
                  <dt>{course.copy.ui.sources}</dt>
                  <dd>{lesson.sources.length}</dd>
                </div>
              </dl>
            </header>

            <section className={styles.objective} aria-labelledby="codex-objective-title">
              <h2 id="codex-objective-title">{course.copy.ui.objectives}</h2>
              <p><TechnicalText text={lesson.copy.objective} /></p>
            </section>

            <div className={styles.lessonSections}>
              {lesson.blocks.map((block) => {
                switch (block.type) {
                  case "prose": {
                    const section = lesson.copy.sections[block.sectionIndex];
                    const headingId = `lesson-section-${block.sectionIndex}`;
                    return (
                      <section key={`prose-${block.sectionIndex}`} aria-labelledby={headingId}>
                        <h2 id={headingId}><TechnicalText text={section.heading} /></h2>
                        <p><TechnicalText text={section.body} /></p>
                      </section>
                    );
                  }
                  case "steps": {
                    const items = localizedStringList(course.copy, block.copyKey);
                    return (
                      <ol className={styles.lessonStepsBlock} key={`steps-${block.copyKey}`}>
                        {items.map((item, index) => (
                          <li key={`${block.copyKey}-${index}`}><TechnicalText text={item} /></li>
                        ))}
                      </ol>
                    );
                  }
                  case "code":
                    return (
                      <pre className={styles.lessonCodeBlock} dir="ltr" key={`code-${block.language}-${block.code}`}>
                        <code data-language={block.language}>{block.code}</code>
                      </pre>
                    );
                  case "callout":
                    return (
                      <aside className={styles.lessonCallout} data-tone={block.tone} key={`callout-${block.copyKey}`}>
                        <p><TechnicalText text={localizedString(course.copy, block.copyKey)} /></p>
                      </aside>
                    );
                  case "comparison": {
                    const headers = block.columns.map((key) => localizedString(course.copy, key));
                    const rows = localizedTable(course.copy, block.copyKey, headers.length);
                    return (
                      <div className={styles.lessonComparison} key={`comparison-${block.copyKey}`} tabIndex={0}>
                        <table>
                          <thead><tr>{headers.map((header) => <th key={header} scope="col"><TechnicalText text={header} /></th>)}</tr></thead>
                          <tbody>
                            {rows.map((row, rowIndex) => (
                              <tr key={`${block.copyKey}-${rowIndex}`}>
                                {row.map((cell, cellIndex) => (
                                  <td key={`${block.copyKey}-${rowIndex}-${cellIndex}`}><TechnicalText text={cell} /></td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }
                  case "figure": {
                    const figure = lesson.figures.find(
                      (item) => item.manifest.id === block.figureId,
                    );
                    return figure ? (
                      <CourseFigure
                        key={`figure-${block.figureId}`}
                        figure={figure}
                        pendingLabel={course.copy.ui.capturePending}
                      />
                    ) : null;
                  }
                  // These two blocks anchor the separately rendered accessible
                  // practice and source sections below.
                  case "exercise":
                  case "source-note":
                    return null;
                  default:
                    return assertNeverBlock(block satisfies never);
                }
              })}
            </div>

            <section className={styles.practice} aria-labelledby="codex-practice-title">
              <header>
                <div>
                  <p className={styles.kicker}>{course.copy.ui.practice}</p>
                  <h2 id="codex-practice-title">{lesson.copy.practice.title}</h2>
                </div>
                <span>{lesson.practice.estimatedMinutes} {course.copy.ui.minutes}</span>
              </header>
              <p><TechnicalText text={lesson.copy.practice.brief} /></p>
              <ol>
                {lesson.copy.practice.steps.map((step) => <li key={step}><TechnicalText text={step} /></li>)}
              </ol>
              <div className={styles.evidenceList}>
                <h3>{course.copy.ui.evidence}</h3>
                <ul>
                  {lesson.copy.practice.evidence.map((item) => <li key={item}><TechnicalText text={item} /></li>)}
                </ul>
              </div>
              <p className={styles.safetyNote}><TechnicalText text={lesson.copy.practice.safety} /></p>
            </section>

            <section className={styles.checkpoint} aria-labelledby="codex-checkpoint-title">
              <h2 id="codex-checkpoint-title">{course.copy.ui.checkpoint}</h2>
              <details>
                <summary><TechnicalText text={lesson.copy.checkpoint.prompt} /></summary>
                <p><TechnicalText text={lesson.copy.checkpoint.answer} /></p>
              </details>
            </section>

            <div className={styles.takeaway}>
              <p><TechnicalText text={lesson.copy.takeaway} /></p>
            </div>

            {lesson.slug === "automation-capstone" ? (
              <CapstoneReceipt
                config={CODEX_CAPSTONE}
                copy={course.copy.capstone}
                labels={course.copy.ui}
              />
            ) : null}

            <section className={styles.sources} aria-labelledby="codex-sources-title">
              <h2 id="codex-sources-title">{course.copy.ui.sources}</h2>
              <ol>
                {lesson.sources.map((source) => (
                  <li key={source.id}>
                    <a href={source.exactAnchor} target="_blank" rel="noopener noreferrer">
                      <strong lang="en" dir="ltr">{source.title}</strong>
                      <span dir="auto">{source.publisher}</span>
                    </a>
                    <p className={styles.sourceMeta}>
                      <span>
                        {course.copy.ui.sourceVerifiedOn}{" "}
                        <time dateTime={source.accessedOn} dir="ltr">{source.accessedOn}</time>
                      </span>
                      {source.kind !== "official-doc" ? (
                        <span>
                          {new Intl.NumberFormat(course.locale).format(source.stars)} {course.copy.ui.stars}
                          {" · "}{course.copy.ui.license}: {source.license}
                        </span>
                      ) : null}
                    </p>
                    {source.supportingAnchors?.length ? (
                      <div className={styles.supportingSources}>
                        <span>{course.copy.ui.source}</span>
                        {source.supportingAnchors.map((anchor, index) => (
                          <a key={anchor} href={anchor} target="_blank" rel="noopener noreferrer">
                            {index + 2}
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ol>
            </section>

            <LessonCompletion
              slug={lesson.slug}
              labels={course.copy.ui}
              showStorageWarning={lesson.slug !== "automation-capstone"}
            />

            <nav className={styles.lessonPager} aria-label={course.copy.ui.lessons}>
              {previous ? (
                <Link href={hrefFor(previous.slug)} rel="prev">
                  <span>{course.copy.ui.previous}</span>
                  <strong><TechnicalText text={previous.copy.title} /></strong>
                </Link>
              ) : <span />}
              {next ? (
                <Link href={hrefFor(next.slug)} rel="next">
                  <span>{course.copy.ui.next}</span>
                  <strong><TechnicalText text={next.copy.title} /></strong>
                </Link>
              ) : (
                <Link href={`/${course.locale}/codex/`}>
                  <span>{course.copy.ui.backToCourse}</span>
                  <strong><TechnicalText text={course.copy.meta.title} /></strong>
                </Link>
              )}
            </nav>
          </article>
        </div>
      </div>
    </div>
  );
}
