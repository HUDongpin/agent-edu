import Link from "next/link";
import {
  CODEX_FINAL_QUIZ,
  CODEX_QUIZ_BY_ID,
  CODEX_SOURCE_BY_ID,
  type MaterializedCodexCourse,
} from "@/lib/codex";
import CompletionSummary from "./CompletionSummary";
import CourseProgress from "./CourseProgress";
import FinalQuiz, { type FinalQuizQuestion } from "./FinalQuiz";
import TechnicalText from "./TechnicalText";
import styles from "./CodexCourse.module.css";

export default function CourseDashboard({
  course,
  catalogLabel,
}: {
  course: MaterializedCodexCourse;
  catalogLabel: string;
}) {
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const hrefFor = (slug: string) => `/${course.locale}/codex/${slug}/`;
  const quizBank: readonly FinalQuizQuestion[] = CODEX_FINAL_QUIZ.bankQuestionIds.map((questionId) => {
    const question = CODEX_QUIZ_BY_ID[questionId];
    const copy = course.copy.quiz[question.id];
    return {
      id: question.id,
      unitId: question.unitId,
      unitTitle: course.copy.units[question.unitId].title,
      prompt: copy.question,
      options: copy.options,
      correctIndex: question.correctIndex,
      explanation: copy.explanation,
      sources: question.sourceIds.map((sourceId) => {
        const source = CODEX_SOURCE_BY_ID[sourceId];
        return { id: source.id, title: source.title, url: source.exactAnchor };
      }),
    };
  });
  const capstone = lessons.find((lesson) => lesson.slug === "automation-capstone")!;

  return (
    <div className={`shellwrap ${styles.coursePage}`} data-testid="codex-course-dashboard">
      <header className={styles.courseHero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}><TechnicalText text={course.copy.meta.kicker} /></p>
          <h1><TechnicalText text={course.copy.meta.title} /></h1>
          <p className={styles.heroSummary}><TechnicalText text={course.copy.meta.summary} /></p>
          <p className={styles.heroAudience}><TechnicalText text={course.copy.meta.audience} /></p>
        </div>

        <aside className={styles.courseFacts} aria-label={course.copy.meta.title}>
          <p><TechnicalText text={course.copy.meta.duration} /></p>
          <dl>
            <div>
              <dt>{course.copy.ui.lessons}</dt>
              <dd>{lessons.length}</dd>
            </div>
            <div>
              <dt>{course.copy.ui.practice}</dt>
              <dd>{lessons.length}</dd>
            </div>
            <div>
              <dt>{course.copy.ui.quiz}</dt>
              <dd>{CODEX_FINAL_QUIZ.questionCount}</dd>
            </div>
          </dl>
        </aside>
      </header>

      <CourseProgress
        lessons={lessons.map((lesson) => ({
          slug: lesson.slug,
          href: hrefFor(lesson.slug),
        }))}
        labels={course.copy.ui}
        startLabel={course.copy.meta.startCta}
        resumeLabel={course.copy.meta.resumeCta}
      />

      <aside className={styles.capstonePath} aria-labelledby="codex-capstone-path-title">
        <div>
          <p className={styles.kicker}>{course.copy.ui.capstonePath}</p>
          <h2 id="codex-capstone-path-title"><TechnicalText text={course.copy.capstone.title} /></h2>
          <p><TechnicalText text={course.copy.capstone.summary} /></p>
        </div>
        <Link className={styles.primaryAction} href={hrefFor(capstone.slug)}>
          {course.copy.ui.capstonePath}
          <span className={styles.arrow} aria-hidden="true">→</span>
        </Link>
      </aside>

      <section className={styles.curriculum} aria-labelledby="codex-curriculum-title">
        <header>
          <h2 id="codex-curriculum-title">{course.copy.ui.allLessons}</h2>
        </header>

        <div className={styles.unitList}>
          {course.units.map((unit) => (
            <section className={styles.unit} key={unit.id} aria-labelledby={`${unit.id}-title`}>
              <div className={styles.unitHeading}>
                <span aria-hidden="true">{unit.order}</span>
                <div>
                  <h3 id={`${unit.id}-title`}><TechnicalText text={unit.copy.title} /></h3>
                  <p><TechnicalText text={unit.copy.summary} /></p>
                </div>
              </div>
              <ol className={styles.lessonList}>
                {unit.lessons.map((lesson) => (
                  <li key={lesson.slug}>
                    <Link href={hrefFor(lesson.slug)}>
                      <span className={styles.lessonOrder}>{lesson.order}</span>
                      <span className={styles.lessonCopy}>
                        <strong><TechnicalText text={lesson.copy.title} /></strong>
                        <span><TechnicalText text={lesson.copy.summary} /></span>
                      </span>
                      <span className={styles.lessonTime}>
                        {lesson.minutes} {course.copy.ui.minutes}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </section>

      <FinalQuiz bank={quizBank} config={CODEX_FINAL_QUIZ} labels={course.copy.ui} />

      <CompletionSummary
        courseTitle={course.copy.meta.title}
        courseVersion={course.manifest.version}
        lessonSlugs={lessons.map((lesson) => lesson.slug)}
        labels={course.copy.ui}
      />

      <aside className={styles.courseIntegrity} aria-labelledby="codex-course-sources-title">
        <h2 id="codex-course-sources-title">{course.copy.ui.sources}</h2>
        <p><TechnicalText text={course.copy.meta.sourceNote} /></p>
        <p>
          <strong>{course.copy.ui.sourceVerifiedOn}:{" "}</strong>
          <time dateTime={course.manifest.sourceSnapshotOn} dir="ltr">
            {course.manifest.sourceSnapshotOn}
          </time>
        </p>
        <p><TechnicalText text={course.copy.meta.figureNote} /></p>
      </aside>

      <p className={styles.backLink}>
        <Link href={`/${course.locale}/courses/`}>
          <span className={styles.backArrow} aria-hidden="true">←</span>
          {catalogLabel}
        </Link>
      </p>
    </div>
  );
}
