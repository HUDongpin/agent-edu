import Link from "next/link";
import {
  CODEX_FINAL_QUIZ,
  CODEX_QUIZ_BY_ID,
  CODEX_SOURCE_BY_ID,
  formatCodexUtcMediumDate,
  formatCodexVisibleInteger,
  type MaterializedCodexCourse,
} from "@/lib/codex";
import CompletionSummary from "./CompletionSummary";
import CourseCurriculum from "./CourseCurriculum";
import CourseProgress from "./CourseProgress";
import FinalQuiz, { type FinalQuizQuestion } from "./FinalQuiz";
import LocalizedTemplate from "./LocalizedTemplate";
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
              <dd>{formatCodexVisibleInteger(lessons.length, course.locale)}</dd>
            </div>
            <div>
              <dt>{course.copy.ui.practice}</dt>
              <dd>{formatCodexVisibleInteger(lessons.length, course.locale)}</dd>
            </div>
            <div>
              <dt>{course.copy.ui.quiz}</dt>
              <dd>{formatCodexVisibleInteger(CODEX_FINAL_QUIZ.questionCount, course.locale)}</dd>
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
        locale={course.locale}
        startLabel={course.copy.meta.startCta}
        resumeLabel={course.copy.meta.resumeCta}
      />

      <aside className={styles.capstonePath} aria-labelledby="codex-capstone-path-title">
        <div>
          <p className={styles.kicker}>{course.copy.ui.capstonePath}</p>
          <h2 id="codex-capstone-path-title"><TechnicalText text={course.copy.capstone.title} /></h2>
          <p><TechnicalText text={course.copy.capstone.summary} /></p>
        </div>
        <Link className={styles.secondaryAction} href={hrefFor(capstone.slug)}>
          {course.copy.ui.capstonePath}
          <span className={styles.arrow} aria-hidden="true">→</span>
        </Link>
      </aside>

      <CourseCurriculum
        locale={course.locale}
        labels={course.copy.ui}
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
      />

      <FinalQuiz
        bank={quizBank}
        config={CODEX_FINAL_QUIZ}
        labels={course.copy.ui}
        locale={course.locale}
      />

      <CompletionSummary
        courseTitle={course.copy.meta.title}
        courseVersion={course.manifest.version}
        locale={course.locale}
        lessonSlugs={lessons.map((lesson) => lesson.slug)}
        labels={course.copy.ui}
      />

      <aside className={styles.courseIntegrity} aria-labelledby="codex-course-sources-title">
        <h2 id="codex-course-sources-title">{course.copy.ui.sources}</h2>
        <p><TechnicalText text={course.copy.meta.sourceNote} /></p>
        <p>
          <LocalizedTemplate
            template={course.copy.ui.verifiedOnTemplate}
            values={{
              date: (
                <time dateTime={course.manifest.sourceSnapshotOn}>
                  {formatCodexUtcMediumDate(course.manifest.sourceSnapshotOn, course.locale)}
                </time>
              ),
            }}
          />
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
