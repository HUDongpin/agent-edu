import Link from "next/link";
import {
  CURSOR_FINAL_QUIZ,
  CURSOR_QUIZ_BY_ID,
  CURSOR_QUIZ_OPTION_IDS,
  CURSOR_SOURCE_BY_ID,
  type MaterializedCursorCourse,
} from "@/lib/cursor";
import CompletionSummary from "./CompletionSummary";
import CourseCurriculum from "./CourseCurriculum";
import CourseProgress from "./CourseProgress";
import FinalQuiz, { type FinalQuizQuestion } from "./FinalQuiz";
import styles from "./CursorCourse.module.css";

export default function CourseDashboard({
  course,
  catalogLabel,
}: {
  course: MaterializedCursorCourse;
  catalogLabel: string;
}) {
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const hrefFor = (slug: string) => `/${course.locale}/cursor/${slug}/`;
  const quizBank: readonly FinalQuizQuestion[] = CURSOR_FINAL_QUIZ.bankQuestionIds.map((questionId) => {
    const question = CURSOR_QUIZ_BY_ID[questionId];
    const copy = course.copy.quiz[question.id];
    const unit = course.units.find((item) => item.id === question.unitId)!;
    const lesson = unit.lessons.find((item) => item.slug === question.lessonSlug)!;
    return {
      id: question.id,
      unitId: question.unitId,
      unitOrder: unit.order,
      unitTitle: unit.copy.title,
      lessonOrder: lesson.order,
      lessonTitle: lesson.copy.title,
      reviewHref: `${hrefFor(question.lessonSlug)}#cursor-lesson-knowledge-check`,
      prompt: copy.question,
      options: CURSOR_QUIZ_OPTION_IDS.map((id) => ({ id, label: copy.options[id] })),
      correctOptionId: question.correctOptionId,
      explanation: copy.explanation,
      sources: question.sourceIds.map((sourceId) => {
        const source = CURSOR_SOURCE_BY_ID[sourceId];
        return { id: source.id, title: source.title, url: source.exactAnchor };
      }),
    };
  });
  const capstone = lessons.find((lesson) => lesson.slug === "workflow-capstone")!;

  return (
    <div className={`shellwrap ${styles.coursePage}`} data-testid="cursor-course-dashboard">
      <header className={styles.courseHero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>{course.copy.meta.kicker}</p>
          <h1>{course.copy.meta.title}</h1>
          <p className={styles.heroSummary}>{course.copy.meta.summary}</p>
          <p className={styles.heroAudience}>{course.copy.meta.audience}</p>
        </div>

        <aside
          className={styles.courseFacts}
          aria-label={course.copy.meta.title}
          data-testid="cursor-course-facts"
        >
          <p>{course.copy.meta.duration}</p>
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
              <dt>{course.copy.ui.finalQuizQuestions}</dt>
              <dd>{CURSOR_FINAL_QUIZ.questionCount}</dd>
            </div>
          </dl>
        </aside>
      </header>

      <CourseProgress
        lessons={lessons.map((lesson) => ({
          slug: lesson.slug,
          href: hrefFor(lesson.slug),
          title: lesson.copy.title,
        }))}
        labels={course.copy.ui}
        startLabel={course.copy.meta.startCta}
        resumeLabel={course.copy.meta.resumeCta}
        capstoneTitle={course.copy.capstone.title}
      />

      <CourseCurriculum
        units={course.units.map((unit) => ({
          id: unit.id,
          order: unit.order,
          title: unit.copy.title,
          summary: unit.copy.summary,
          lessons: unit.lessons.map((lesson) => ({
            slug: lesson.slug,
            order: lesson.order,
            title: lesson.copy.title,
            summary: lesson.copy.summary,
            minutes: lesson.minutes,
            href: hrefFor(lesson.slug),
          })),
        }))}
        labels={course.copy.ui}
      />

      <aside className={styles.capstonePath} aria-labelledby="cursor-capstone-path-title">
        <div>
          <p className={styles.kicker}>{course.copy.ui.capstonePath}</p>
          <h2 id="cursor-capstone-path-title">{course.copy.capstone.title}</h2>
          <p>{course.copy.capstone.summary}</p>
        </div>
        <Link
          className={styles.secondaryAction}
          href={`${hrefFor(capstone.slug)}#cursor-capstone-title`}
          data-course-action
        >
          {course.copy.ui.capstonePath}
          <span className={styles.arrow} aria-hidden="true">→</span>
        </Link>
      </aside>

      <FinalQuiz bank={quizBank} config={CURSOR_FINAL_QUIZ} labels={course.copy.ui} />

      <CompletionSummary
        courseTitle={course.copy.meta.title}
        courseVersion={course.manifest.version}
        labels={course.copy.ui}
      />

      <aside className={styles.courseIntegrity} aria-labelledby="cursor-course-sources-title">
        <h2 id="cursor-course-sources-title">{course.copy.ui.sources}</h2>
        <p>{course.copy.meta.sourceNote}</p>
        <p>{course.copy.meta.figureNote}</p>
      </aside>

      <p className={styles.backLink}>
        <Link href={`/${course.locale}/courses/`} data-course-action>
          <span className={styles.backArrow} aria-hidden="true">←</span>
          {catalogLabel}
        </Link>
      </p>
    </div>
  );
}
