import Link from "next/link";
import {
  CURSOR_CAPSTONE,
  CURSOR_QUIZ_OPTION_IDS,
  CURSOR_SOURCE_BY_ID,
  type MaterializedCursorCourse,
  type MaterializedCursorLesson,
} from "@/lib/cursor";
import CapstoneReceipt from "./CapstoneReceipt";
import CourseFigure from "./CourseFigure";
import LessonCompletion from "./LessonCompletion";
import LessonKnowledgeCheck from "./LessonKnowledgeCheck";
import styles from "./CursorCourse.module.css";

export default function LessonView({
  course,
  lesson,
}: {
  course: MaterializedCursorCourse;
  lesson: MaterializedCursorLesson;
}) {
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const lessonIndex = lessons.findIndex((item) => item.slug === lesson.slug);
  const previous = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const next = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;
  const hrefFor = (slug: string) => `/${course.locale}/cursor/${slug}/`;
  const lessonLinks = () => course.units.map((unit) => (
    <div className={styles.railUnit} key={unit.id}>
      <p className={styles.railGroup}>{unit.copy.title}</p>
      <ol>
        {unit.lessons.map((item) => (
          <li key={item.slug}>
            <Link
              href={hrefFor(item.slug)}
              aria-current={item.slug === lesson.slug ? "page" : undefined}
            >
              <span>{item.order}</span>
              {item.copy.title}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  ));

  return (
    <div
      className={`shellwrap ${styles.lessonPage}`}
      data-testid={`cursor-lesson-${lesson.slug}`}
    >
      <nav className={styles.breadcrumbs} aria-label={course.copy.ui.backToCourse}>
        <Link href={`/${course.locale}/cursor/`}>
          <span className={styles.backArrow} aria-hidden="true">←</span>
          {course.copy.ui.backToCourse}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{lesson.copy.title}</span>
      </nav>

      <div className={styles.lessonLayout}>
        <aside className={styles.lessonRail}>
          <nav aria-label={course.copy.ui.allLessons}>
            <strong>{course.copy.ui.allLessons}</strong>
            {lessonLinks()}
          </nav>
        </aside>

        <details className={styles.lessonRailMobile} data-testid="cursor-mobile-lesson-nav">
          <summary>
            <span>{course.copy.ui.allLessons}</span>
            <span>{lesson.order} / {lessons.length}</span>
          </summary>
          <nav aria-label={course.copy.ui.allLessons}>
            {lessonLinks()}
          </nav>
        </details>

        <div className={styles.lessonMain}>
          <article>
            <header className={styles.lessonHero}>
              <p className={styles.kicker}>{lesson.copy.kicker}</p>
              <h1>{lesson.copy.title}</h1>
              <p className={styles.lessonSummary}>{lesson.copy.summary}</p>
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

            <section className={styles.objective} aria-labelledby="cursor-objective-title">
              <h2 id="cursor-objective-title">{course.copy.ui.objectives}</h2>
              <p>{lesson.copy.objective}</p>
            </section>

            <div className={styles.lessonSections}>
              {lesson.copy.sections.map((section, index) => (
                <section key={section.heading} aria-labelledby={`lesson-section-${index}`}>
                  <h2 id={`lesson-section-${index}`}>{section.heading}</h2>
                  <p>{section.body}</p>
                  {lesson.figures[index] ? (
                    <CourseFigure
                      figure={lesson.figures[index]}
                      pendingLabel={course.copy.ui.capturePending}
                      labels={course.copy.ui}
                    />
                  ) : null}
                </section>
              ))}
            </div>

            <section className={styles.practice} aria-labelledby="cursor-practice-title">
              <header>
                <div>
                  <p className={styles.kicker}>{course.copy.ui.practice}</p>
                  <h2 id="cursor-practice-title">{lesson.copy.practice.title}</h2>
                </div>
                <span>{lesson.practice.estimatedMinutes} {course.copy.ui.minutes}</span>
              </header>
              <p>{lesson.copy.practice.brief}</p>
              <ol>
                {lesson.copy.practice.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
              <div className={styles.evidenceList}>
                <h3>{course.copy.ui.evidence}</h3>
                <ul>
                  {lesson.copy.practice.evidence.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <p className={styles.safetyNote}>{lesson.copy.practice.safety}</p>
            </section>

            <section className={styles.checkpoint} aria-labelledby="cursor-checkpoint-title">
              <h2 id="cursor-checkpoint-title">{course.copy.ui.checkpoint}</h2>
              <details>
                <summary>{lesson.copy.checkpoint.prompt}</summary>
                <p>{lesson.copy.checkpoint.answer}</p>
              </details>
            </section>

            <LessonKnowledgeCheck
              slug={lesson.slug}
              labels={course.copy.ui}
              questions={lesson.quiz.map(({ manifest, copy }) => ({
                id: manifest.id,
                prompt: copy.question,
                options: CURSOR_QUIZ_OPTION_IDS.map((id) => ({ id, label: copy.options[id] })),
                correctOptionId: manifest.correctOptionId,
                explanation: copy.explanation,
                sources: manifest.sourceIds.map((sourceId) => {
                  const source = CURSOR_SOURCE_BY_ID[sourceId];
                  return {
                    id: source.id,
                    title: source.title,
                    url: source.exactAnchor,
                  };
                }),
              }))}
            />

            <div className={styles.takeaway}>
              <p>{lesson.copy.takeaway}</p>
            </div>

            {lesson.slug === "workflow-capstone" ? (
              <CapstoneReceipt
                config={CURSOR_CAPSTONE}
                copy={course.copy.capstone}
                labels={course.copy.ui}
              />
            ) : null}

            <section className={styles.sources} aria-labelledby="cursor-sources-title">
              <h2 id="cursor-sources-title">{course.copy.ui.sources}</h2>
              <ol>
                {lesson.sources.map((source) => (
                  <li key={source.id}>
                    <a href={source.exactAnchor} target="_blank" rel="noopener noreferrer">
                      <strong dir="auto">{source.title}</strong>
                      <span dir="auto">{source.publisher}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </section>

            <LessonCompletion
              slug={lesson.slug}
              labels={course.copy.ui}
              showStorageWarning={lesson.slug !== "workflow-capstone"}
            />

            <nav className={styles.lessonPager} aria-label={course.copy.ui.lessons}>
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
                <Link href={`/${course.locale}/cursor/`}>
                  <span>{course.copy.ui.backToCourse}</span>
                  <strong>{course.copy.meta.title}</strong>
                </Link>
              )}
            </nav>
          </article>
        </div>
      </div>
    </div>
  );
}
