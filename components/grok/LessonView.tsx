import Link from "next/link";
import type { MaterializedGrokCourse, MaterializedGrokLesson } from "@/lib/grok";
import CapstoneChecklist from "./CapstoneChecklist";
import CopyPrompt from "./CopyPrompt";
import CourseFigure from "./CourseFigure";
import LessonCompletion from "./LessonCompletion";
import TaskContractBuilder from "./TaskContractBuilder";
import styles from "./GrokCourse.module.css";

export default function LessonView({
  course,
  lesson,
}: {
  course: MaterializedGrokCourse;
  lesson: MaterializedGrokLesson;
}) {
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const lessonIndex = lessons.findIndex((candidate) => candidate.slug === lesson.slug);
  const numberFormat = new Intl.NumberFormat(course.locale);
  const twoDigitFormat = new Intl.NumberFormat(course.locale, {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
  const dateFormat = new Intl.DateTimeFormat(course.locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const formatDate = (value: string) => dateFormat.format(new Date(`${value}T00:00:00Z`));
  const previous = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const next = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;
  const hrefFor = (slug: string) => `/${course.locale}/grok/${slug}/`;

  return (
    <div
      className={`shellwrap ${styles.lessonPage}`}
      data-testid={`grok-lesson-${lesson.slug}`}
    >
      <nav className={styles.breadcrumbs} aria-label={course.copy.ui.backCourse}>
        <Link href={`/${course.locale}/grok/`}>← {course.copy.ui.backCourse}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{lesson.copy.title}</span>
      </nav>

      <div className={styles.lessonLayout}>
        <aside className={styles.lessonRail}>
          <nav aria-label={course.copy.ui.allLessons}>
            <strong>{course.copy.ui.allLessons}</strong>
            {course.units.map((unit) => (
              <details key={unit.id} open={unit.id === lesson.unitId}>
                <summary>{unit.copy.title}</summary>
                <ol>
                  {unit.lessons.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={hrefFor(item.slug)}
                        aria-current={item.slug === lesson.slug ? "page" : undefined}
                      >
                        <span>{twoDigitFormat.format(item.order)}</span>
                        {item.copy.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              </details>
            ))}
          </nav>
        </aside>

        <article className={styles.lessonArticle}>
          <header className={styles.lessonHero}>
            <p>{lesson.copy.kicker}</p>
            <h1>{lesson.copy.title}</h1>
            <p className={styles.lessonSummary}>{lesson.copy.summary}</p>
            <dl>
              <div>
                <dt>{course.copy.ui.minutes}</dt>
                <dd>{numberFormat.format(lesson.minutes)}</dd>
              </div>
              <div>
                <dt>{course.copy.ui.sources}</dt>
                <dd>{numberFormat.format(lesson.sources.length)}</dd>
              </div>
              <div>
                <dt>{course.copy.ui.currentLesson}</dt>
                <dd>{numberFormat.format(lesson.order)} / {numberFormat.format(lessons.length)}</dd>
              </div>
            </dl>
          </header>

          <section className={styles.objective} aria-labelledby="grok-objective-title">
            <h2 id="grok-objective-title">{course.copy.ui.objectives}</h2>
            <p>{lesson.copy.objective}</p>
          </section>

          <div className={styles.lessonSections}>
            {lesson.copy.sections.map((section, sectionIndex) => (
              <section key={section.heading} aria-labelledby={`grok-section-${sectionIndex}`}>
                <p>{section.eyebrow}</p>
                <h2 id={`grok-section-${sectionIndex}`}>{section.heading}</h2>
                <p>{section.body}</p>
                {lesson.figures[sectionIndex] ? (
                  <CourseFigure
                    figure={lesson.figures[sectionIndex]}
                    eager={sectionIndex === 0}
                    labels={course.copy.ui}
                    locale={course.locale}
                  />
                ) : null}
              </section>
            ))}
          </div>

          <section className={styles.practice} aria-labelledby="grok-practice-title">
            <header>
              <div>
                <p>{course.copy.ui.tryIt}</p>
                <h2 id="grok-practice-title">{lesson.copy.practice.title}</h2>
              </div>
              <span>{numberFormat.format(lesson.minutes)} {course.copy.ui.minutes}</span>
            </header>
            <p className={styles.practiceBrief}>{lesson.copy.practice.brief}</p>
            <h3>{course.copy.ui.promptTemplate}</h3>
            <CopyPrompt
              prompt={lesson.copy.practice.prompt}
              label={course.copy.ui.copyPrompt}
              copiedLabel={course.copy.ui.copied}
              failedLabel={course.copy.ui.copyFailed}
            />
            <div className={styles.practiceColumns}>
              <section>
                <h3>{course.copy.ui.steps}</h3>
                <ol>
                  {lesson.copy.practice.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </section>
              <section>
                <h3>{course.copy.ui.evidence}</h3>
                <ul>
                  {lesson.copy.practice.proof.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>
            </div>
            <p className={styles.safetyNote}>
              <strong>{course.copy.ui.safety}:</strong> {lesson.copy.practice.safety}
            </p>
          </section>

          {lesson.slug === "task-contracts" ? (
            <TaskContractBuilder labels={course.copy.ui} />
          ) : null}

          <section className={styles.checkpoint} aria-labelledby="grok-checkpoint-title">
            <h2 id="grok-checkpoint-title">{course.copy.ui.checkpoint}</h2>
            <details>
              <summary>{lesson.copy.checkpoint.question}</summary>
              <p>{lesson.copy.checkpoint.answer}</p>
            </details>
          </section>

          <section className={styles.takeaway} aria-labelledby="grok-takeaway-title">
            <div>
              <h2 id="grok-takeaway-title">{course.copy.ui.takeaway}</h2>
              <p>{lesson.copy.takeaway}</p>
            </div>
            <aside>
              <h3>{course.copy.ui.knowLimit}</h3>
              <p>{lesson.copy.limit}</p>
            </aside>
          </section>

          {lesson.slug === "capstone" ? <CapstoneChecklist labels={course.copy.ui} /> : null}

          <section className={styles.sourceRegister} aria-labelledby="grok-sources-title">
            <header>
              <h2 id="grok-sources-title">{course.copy.ui.sources}</h2>
              <p>{course.copy.meta.sourceNote}</p>
            </header>
            <div className={styles.sourceGrid}>
              {lesson.sources.map((source) => (
                <article key={source.id}>
                  <p className={styles.sourceType}>
                    {source.kind.includes("github")
                      ? course.copy.ui.sourceTypeGitHub
                      : course.copy.ui.sourceTypeOfficial}
                  </p>
                  <h3 lang={course.locale === "en" ? undefined : "en"}>{source.title}</h3>
                  <p>{source.publisher}</p>
                  <dl>
                    <div>
                      <dt>{course.copy.ui.verifiedOn}</dt>
                      <dd><time dateTime={source.verifiedOn}>{formatDate(source.verifiedOn)}</time></dd>
                    </div>
                    {source.commit ? (
                      <div>
                        <dt>{course.copy.ui.versionSnapshot}</dt>
                        <dd dir="ltr"><code>{source.commit.slice(0, 12)}</code></dd>
                      </div>
                    ) : null}
                  </dl>
                  <details>
                    <summary>{course.copy.ui.sourceBoundary}</summary>
                    <p lang={course.locale === "en" ? undefined : "en"}>{source.boundary}</p>
                  </details>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${course.copy.ui.readSource}: ${source.title}`}
                  >
                    {course.copy.ui.readSource} ↗
                  </a>
                </article>
              ))}
            </div>
          </section>

          <LessonCompletion slug={lesson.slug} labels={course.copy.ui} />

          <nav className={styles.lessonPager} aria-label={course.copy.ui.lessons} data-course-lesson-nav>
            {previous ? (
              <Link href={hrefFor(previous.slug)} rel="prev">
                <span>{course.copy.ui.previous}</span>
                <strong>{previous.copy.title}</strong>
              </Link>
            ) : <span />}
            {next ? (
              <Link href={hrefFor(next.slug)} rel="next">
                <span>{course.copy.ui.next}</span>
                <strong>{next.copy.title}</strong>
              </Link>
            ) : (
              <Link href={`/${course.locale}/grok/`}>
                <span>{course.copy.ui.backCourse}</span>
                <strong>{course.copy.meta.title}</strong>
              </Link>
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}
