import Link from "next/link";
import { GITHUB_FINAL_QUIZ, type MaterializedGithubCourse } from "@/lib/github";
import CourseProgress from "./CourseProgress";
import CompletionSummary from "./CompletionSummary";
import FinalQuiz, { type GithubFinalQuizQuestion } from "./FinalQuiz";
import base from "@/components/codex/CodexCourse.module.css";
import styles from "./GithubCourse.module.css";
import SharedCourseShell from "../SharedCourseShell";

export default function CourseDashboard({
  course,
  catalogLabel,
}: {
  course: MaterializedGithubCourse;
  catalogLabel: string;
}) {
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const hrefFor = (slug: string) => `/${course.locale}/github/${slug}/`;
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
      <SharedCourseShell courseId="github" locale={course.locale} />
      <header className={base.courseHero}>
        <div className={base.heroCopy}>
          <p className={base.kicker}>{course.copy.meta.kicker}</p>
          <h1>{course.copy.meta.title}</h1>
          <p className={base.heroSummary}>{course.copy.meta.summary}</p>
          <p className={base.heroAudience}>{course.copy.meta.audience}</p>
          <p className={styles.disclaimer}>{course.copy.meta.disclaimer}</p>
        </div>

        <aside className={base.courseFacts} aria-label={course.copy.meta.title}>
          <p>{course.copy.meta.duration}</p>
          <dl>
            <div>
              <dt>{course.copy.ui.lessons}</dt>
              <dd>{lessons.length}</dd>
            </div>
            <div>
              <dt>{course.copy.ui.authenticFigure}</dt>
              <dd>{lessons.flatMap((lesson) => lesson.figures).length}</dd>
            </div>
            <div>
              <dt>{course.copy.ui.quiz}</dt>
              <dd>{GITHUB_FINAL_QUIZ.questionCount}</dd>
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

      <aside
        className={base.capstonePath}
        aria-labelledby="github-capstone-path-title"
      >
        <div>
          <p className={base.kicker}>{course.copy.ui.capstonePath}</p>
          <h2 id="github-capstone-path-title">{course.copy.capstone.title}</h2>
          <p>{course.copy.capstone.summary}</p>
        </div>
        <Link className={base.primaryAction} href={hrefFor(capstone.slug)}>
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
              <span>{String(lesson.order).padStart(2, "0")}</span>
              <strong>{lesson.copy.title}</strong>
              <small>{lesson.copy.summary}</small>
            </Link>
          ))}
        </div>
      </section>

      <section
        className={base.curriculum}
        aria-labelledby="github-curriculum-title"
      >
        <header>
          <h2 id="github-curriculum-title">{course.copy.ui.allLessons}</h2>
        </header>

        <div className={base.unitList}>
          {course.units.map((unit) => (
            <section
              className={base.unit}
              key={unit.id}
              aria-labelledby={`${unit.id}-github-title`}
            >
              <div className={base.unitHeading}>
                <span aria-hidden="true">{unit.order}</span>
                <div>
                  <h3 id={`${unit.id}-github-title`}>{unit.copy.title}</h3>
                  <p>{unit.copy.summary}</p>
                </div>
              </div>
              <ol className={base.lessonList}>
                {unit.lessons.map((lesson) => (
                  <li key={lesson.slug}>
                    <Link href={hrefFor(lesson.slug)}>
                      <span className={base.lessonOrder}>{lesson.order}</span>
                      <span className={base.lessonCopy}>
                        <strong>{lesson.copy.title}</strong>
                        <span>{lesson.copy.summary}</span>
                      </span>
                      <span className={base.lessonTime}>
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

      <FinalQuiz
        bank={quizBank}
        config={GITHUB_FINAL_QUIZ}
        labels={course.copy.ui}
      />

      <CompletionSummary
        courseTitle={course.copy.meta.title}
        courseVersion={course.manifest.version}
        lessonSlugs={lessons.map((lesson) => lesson.slug)}
        labels={course.copy.ui}
      />

      <aside
        className={base.courseIntegrity}
        aria-labelledby="github-course-sources-title"
      >
        <h2 id="github-course-sources-title">{course.copy.ui.sources}</h2>
        <p>{course.copy.meta.sourceNote}</p>
        <p>{course.copy.meta.figureNote}</p>
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
