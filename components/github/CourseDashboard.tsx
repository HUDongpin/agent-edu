import Link from "next/link";
import {
  GITHUB_FINAL_QUIZ,
  formatGithubDate,
  formatGithubNumber,
  formatGithubVisibleNumbers,
  type MaterializedGithubCourse,
} from "@/lib/github";
import CourseCurriculum from "./CourseCurriculum";
import CourseProgress, { CourseJourneyAction } from "./CourseProgress";
import CompletionSummary from "./CompletionSummary";
import FinalQuiz, { type GithubFinalQuizQuestion } from "./FinalQuiz";
import base from "./GithubCourseFoundation.module.css";
import styles from "./GithubCourse.module.css";
import CourseShell from "../course-shell/CourseShell";

function SourceSnapshotNote({
  date,
  locale,
  text,
}: {
  date: string;
  locale: string;
  text: string;
}) {
  const [before, after] = text.split("{sourceDate}");
  if (after === undefined) return text;
  return (
    <>
      {before}
      <time dateTime={date}>{formatGithubDate(locale, date)}</time>
      {after}
    </>
  );
}

export default function CourseDashboard({
  course,
  catalogLabel,
}: {
  course: MaterializedGithubCourse;
  catalogLabel: string;
}) {
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const hrefFor = (slug: string) => `/${course.locale}/github/${slug}/`;
  const journeyLessons = lessons.map((lesson) => ({
    slug: lesson.slug,
    href: hrefFor(lesson.slug),
  }));
  const figureCount = lessons.flatMap((lesson) => lesson.figures).length;
  const quizBank: readonly GithubFinalQuizQuestion[] = lessons.flatMap(
    (lesson) =>
      lesson.quiz.map((question) => ({
        id: question.id,
        unitId: question.unitId,
        unitTitle: course.copy.units[question.unitId].title,
        prompt: question.copy.question,
        options: question.copy.options,
        correctIndex: question.correctIndex,
        explanation: question.copy.explanation,
        sources: question.sourceIds.map((sourceId) => {
          const source = lesson.sources.find(
            (candidate) => candidate.id === sourceId,
          );
          if (!source)
            throw new Error(
              `Question ${question.id} references unavailable source ${sourceId}`,
            );
          return { id: source.id, title: source.title, url: source.url };
        }),
      })),
  );
  const capstone = lessons.find(
    (lesson) => lesson.slug === "teaching-capstone",
  )!;
  const contextLessons = [
    lessons.find((lesson) => lesson.slug === "projects-office-work")!,
    lessons.find((lesson) => lesson.slug === "software-automation")!,
    lessons.find((lesson) => lesson.slug === "research-reproducibility")!,
    lessons.find((lesson) => lesson.slug === "writing-publishing")!,
    lessons.find((lesson) => lesson.slug === "teaching-capstone")!,
  ];

  return (
    <div
      className={`shellwrap ${base.coursePage} ${styles.githubCourse}`}
      data-testid="github-course-dashboard"
    >
      <header className={base.courseHero}>
        <div className={base.heroCopy}>
          <div data-testid="github-hero-promise">
            <p className={base.kicker}>
              {formatGithubVisibleNumbers(
                course.locale,
                course.copy.meta.kicker,
              )}
            </p>
            <h1>{course.copy.meta.title}</h1>
            <p className={base.heroSummary}>{course.copy.meta.summary}</p>
            <p className={base.heroAudience}>{course.copy.meta.audience}</p>
          </div>
          <section
            className={styles.heroJourneyRegion}
            aria-label={course.copy.ui.courseProgress}
          >
            <CourseJourneyAction
              lessons={journeyLessons}
              locale={course.locale}
              startLabel={course.copy.meta.startCta}
              resumeLabel={course.copy.meta.resumeCta}
            />
          </section>
          <p className={styles.disclaimer}>{course.copy.meta.disclaimer}</p>
        </div>

        <aside className={base.courseFacts} aria-label={course.copy.meta.title}>
          <p>
            {formatGithubVisibleNumbers(
              course.locale,
              course.copy.meta.duration,
            )}
          </p>
          <dl>
            <div>
              <dt>{course.copy.ui.lessons}</dt>
              <dd>{formatGithubNumber(course.locale, lessons.length)}</dd>
            </div>
            <div>
              <dt>{course.copy.ui.authenticFigure}</dt>
              <dd>{formatGithubNumber(course.locale, figureCount)}</dd>
            </div>
            <div>
              <dt>{course.copy.ui.quiz}</dt>
              <dd>
                {formatGithubNumber(
                  course.locale,
                  GITHUB_FINAL_QUIZ.questionCount,
                )}
              </dd>
            </div>
          </dl>
        </aside>
      </header>

      <CourseShell courseId="github" locale={course.locale} />

      <CourseProgress
        lessons={journeyLessons}
        labels={course.copy.ui}
        locale={course.locale}
      />

      <aside
        className={base.capstonePath}
        aria-labelledby="github-capstone-path-title"
      >
        <div>
          <p className={base.kicker}>{course.copy.ui.capstonePath}</p>
          <h2 id="github-capstone-path-title">{course.copy.capstone.title}</h2>
          <p>{course.copy.capstone.summary}</p>
        </div>
        <Link
          className={`${base.secondaryAction} ${styles.courseAction}`}
          data-action-variant="secondary"
          data-testid="github-capstone-shortcut"
          href={hrefFor(capstone.slug)}
        >
          {course.copy.ui.capstonePath}
          <span className={base.arrow} aria-hidden="true">
            →
          </span>
        </Link>
      </aside>

      <section
        className={styles.contextOverview}
        aria-labelledby="github-contexts-title"
      >
        <header>
          <p className={base.kicker}>{course.units[2].copy.title}</p>
          <h2 id="github-contexts-title">{course.units[2].copy.summary}</h2>
        </header>
        <div className={styles.contextCardGrid}>
          {contextLessons.map((lesson) => (
            <Link href={hrefFor(lesson.slug)} key={lesson.slug}>
              <span>
                {formatGithubNumber(course.locale, lesson.order, {
                  minimumIntegerDigits: 2,
                })}
              </span>
              <strong>{lesson.copy.title}</strong>
              <small>{lesson.copy.summary}</small>
            </Link>
          ))}
        </div>
      </section>

      <CourseCurriculum
        locale={course.locale}
        labels={{
          allLessons: course.copy.ui.allLessons,
          completed: course.copy.ui.completed,
          minutes: course.copy.ui.minutes,
        }}
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
        config={GITHUB_FINAL_QUIZ}
        labels={course.copy.ui}
        locale={course.locale}
      />

      <CompletionSummary
        courseTitle={course.copy.meta.title}
        courseVersion={course.manifest.version}
        lessonSlugs={lessons.map((lesson) => lesson.slug)}
        labels={course.copy.ui}
        locale={course.locale}
      />

      <aside
        className={base.courseIntegrity}
        aria-labelledby="github-course-sources-title"
      >
        <h2 id="github-course-sources-title">{course.copy.ui.sources}</h2>
        <p>
          <SourceSnapshotNote
            date={course.manifest.sourceSnapshotOn}
            locale={course.locale}
            text={course.copy.meta.sourceNote}
          />
        </p>
        <p>
          {course.copy.meta.figureNote.replace(
            String(figureCount),
            formatGithubNumber(course.locale, figureCount),
          )}
        </p>
        <p>{course.copy.meta.disclaimer}</p>
      </aside>

      <p className={base.backLink}>
        <Link href={`/${course.locale}/courses/`}>
          <span className={base.backArrow} aria-hidden="true">
            ←
          </span>
          {catalogLabel}
        </Link>
      </p>
    </div>
  );
}
