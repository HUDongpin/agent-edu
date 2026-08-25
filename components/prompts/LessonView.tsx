import Link from "next/link";
import type { MaterializedPromptCourse, MaterializedPromptLesson } from "@/lib/prompts";
import PromptExample from "./PromptExample";
import PromptFigure from "./PromptFigure";
import { CapstoneChecklist, LessonCheckpoint, PracticeCompletion } from "./PromptInteractions";
import styles from "./PromptCourse.module.css";

export default function LessonView({
  course,
  lesson,
}: {
  course: MaterializedPromptCourse;
  lesson: MaterializedPromptLesson;
}) {
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const lessonIndex = lessons.findIndex((item) => item.slug === lesson.slug);
  const previous = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const next = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;
  const hrefFor = (slug: string) => `/${course.locale}/prompts/${slug}/`;

  const courseMap = (
    <ol>
      {lessons.map((item) => (
        <li key={item.slug}>
          <Link href={hrefFor(item.slug)} aria-current={item.slug === lesson.slug ? "page" : undefined}>
            <span>{String(item.order).padStart(2, "0")}</span>{item.copy.title}
          </Link>
        </li>
      ))}
    </ol>
  );

  return (
    <div
      className={`shellwrap ${styles.promptRoot} ${styles.lessonPage}`}
      lang="en"
      dir="ltr"
      data-testid={`prompts-lesson-${lesson.slug}`}
    >
      {course.locale !== "en" ? <p className={styles.languageNotice}>{course.copy.ui.englishOnly}</p> : null}
      <nav className={styles.breadcrumbs} aria-label={course.copy.ui.backToCourse}>
        <Link href={`/${course.locale}/prompts/`}><span aria-hidden="true">←</span>{course.copy.ui.backToCourse}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{lesson.copy.title}</span>
      </nav>

      <details className={styles.mobileCourseMap}>
        <summary>{course.copy.ui.lesson} {lesson.order} / {lessons.length} · {course.copy.ui.openCourseMap}</summary>
        <nav aria-label={course.copy.ui.allLessons}>{courseMap}</nav>
      </details>

      <div className={styles.lessonLayout}>
        <aside className={styles.lessonRail}>
          <nav aria-label={course.copy.ui.allLessons}>
            <strong>{course.copy.ui.allLessons}</strong>
            {courseMap}
          </nav>
        </aside>

        <div className={styles.lessonMain}>
          <article>
            <header className={styles.lessonHero}>
              <p className={styles.kicker}>{lesson.copy.kicker}</p>
              <h1>{lesson.copy.title}</h1>
              <p className={styles.lessonSummary}>{lesson.copy.summary}</p>
              <dl>
                <div><dt>{course.copy.ui.minutes}</dt><dd>{lesson.minutes}</dd></div>
                <div><dt>{course.copy.ui.sources}</dt><dd>{lesson.sources.length}</dd></div>
              </dl>
            </header>

            <section className={styles.objective} aria-labelledby="lesson-objective-title">
              <h2 id="lesson-objective-title">{course.copy.ui.objective}</h2>
              <p>{lesson.copy.objective}</p>
            </section>

            <section className={styles.proseSection} aria-labelledby="section-0">
              <h2 id="section-0">{lesson.copy.sections[0].heading}</h2>
              {lesson.copy.sections[0].paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>

            <PromptExample prompt={lesson.copy.prompt} labels={course.copy.ui} />

            <section className={styles.proseSection} aria-labelledby="section-1">
              <h2 id="section-1">{lesson.copy.sections[1].heading}</h2>
              {lesson.copy.sections[1].paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>

            <PromptFigure figure={lesson.figure} copy={lesson.copy.figure} labels={course.copy.ui} />

            <section className={styles.proseSection} aria-labelledby="section-2">
              <h2 id="section-2">{lesson.copy.sections[2].heading}</h2>
              {lesson.copy.sections[2].paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>

            <section className={styles.practice} aria-labelledby="prompt-practice-title">
              <header>
                <div>
                  <p className={styles.kicker}>{course.copy.ui.practice}</p>
                  <h2 id="prompt-practice-title">{lesson.copy.practice.title}</h2>
                </div>
                <span>{course.copy.ui.estimatedLessonTime}: {lesson.minutes} {course.copy.ui.minutes}</span>
              </header>
              <p>{lesson.copy.practice.brief}</p>
              <ol>{lesson.copy.practice.steps.map((step) => <li key={step}>{step}</li>)}</ol>
              <div className={styles.evidenceList}>
                <h3>{course.copy.ui.evidence}</h3>
                <ul>{lesson.copy.practice.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <p className={styles.safetyNote}>{lesson.copy.practice.safety}</p>
            </section>

            <LessonCheckpoint
              checkpoint={lesson.copy.checkpoint}
              labels={course.copy.ui}
              id={`checkpoint-${lesson.slug}`}
            />

            <aside className={styles.takeaway}>
              <span>{course.copy.ui.takeaway}</span>
              <p>{lesson.copy.takeaway}</p>
            </aside>

            {lesson.slug === "capstone-prompt-packet" ? (
              <CapstoneChecklist
                required={course.copy.capstone.required}
                rubric={course.copy.capstone.rubric}
                passScore={course.copy.capstone.passScore}
                maxScore={course.copy.capstone.maxScore}
                labels={course.copy.ui}
              />
            ) : null}

            <section className={styles.sources} aria-labelledby="prompt-sources-title">
              <h2 id="prompt-sources-title">{course.copy.ui.sources}</h2>
              <ol>
                {lesson.sources.map((source) => (
                  <li key={source.id}>
                    <a href={source.exactAnchor} target="_blank" rel="noopener noreferrer">
                      <strong>{source.title}</strong>
                      <span>{source.publisher} · {source.accessedOn}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </section>

            <PracticeCompletion slug={lesson.slug} labels={course.copy.ui} />

            <nav className={styles.lessonPager} aria-label={course.copy.ui.lessons}>
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
                <Link href={`/${course.locale}/prompts/`}>
                  <span>{course.copy.ui.backToCourse}</span><strong>{course.copy.meta.title}</strong>
                </Link>
              )}
            </nav>
          </article>
        </div>
      </div>
    </div>
  );
}
