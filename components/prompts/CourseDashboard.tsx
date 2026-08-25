import Link from "next/link";
import { PROMPT_SOURCE_BY_ID, type MaterializedPromptCourse } from "@/lib/prompts";
import { CapstoneChecklist, CourseProgress, FinalQuiz, type PromptQuizQuestion } from "./PromptInteractions";
import styles from "./PromptCourse.module.css";

export default function CourseDashboard({
  course,
  catalogLabel,
}: {
  course: MaterializedPromptCourse;
  catalogLabel: string;
}) {
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const hrefFor = (slug: string) => `/${course.locale}/prompts/${slug}/`;
  const quizQuestions: readonly PromptQuizQuestion[] = course.copy.finalQuiz.questions.map((question) => {
    const source = PROMPT_SOURCE_BY_ID[question.sourceId];
    return {
      ...question,
      unitTitle: course.copy.units[question.unitId].title,
      sourceTitle: source.title,
      sourceUrl: source.exactAnchor,
    };
  });
  const totalMinutes = lessons.reduce((sum, lesson) => sum + lesson.minutes, 0)
    + course.manifest.finalQuizMinutes;
  const workbench = lessons.find((lesson) => lesson.figureKind === "workbench")?.figure.raster;

  if (!workbench) throw new Error("Course 7 workbench figure is unavailable.");

  return (
    <div
      className={`shellwrap ${styles.promptRoot} ${styles.coursePage}`}
      lang="en"
      dir="ltr"
      data-testid="prompts-course-dashboard"
    >
      {course.locale !== "en" ? <p className={styles.languageNotice}>{course.copy.ui.englishOnly}</p> : null}
      <header className={styles.courseHero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>{course.copy.meta.kicker}</p>
          <h1>{course.copy.meta.title}</h1>
          <p className={styles.heroSummary}>{course.copy.meta.summary}</p>
          <p className={styles.heroAudience}>{course.copy.meta.audience}</p>
          <div className={styles.heroPrinciples} aria-label={course.copy.ui.successCriteria}>
            <span>{course.copy.ui.heroPrinciple1}</span>
            <span>{course.copy.ui.heroPrinciple2}</span>
            <span>{course.copy.ui.heroPrinciple3}</span>
          </div>
        </div>
        <figure className={styles.heroImage}>
          <picture>
            <source srcSet={workbench.webpPath} type="image/webp" />
            <img
              src={workbench.pngPath}
              width={workbench.width}
              height={workbench.height}
              alt={course.copy.lessons["six-part-prompt"].figure.alt}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
          <figcaption>{course.copy.lessons["six-part-prompt"].figure.caption}</figcaption>
        </figure>
      </header>

      <section className={styles.courseFacts} aria-label={course.copy.meta.title}>
        <div><small>{course.copy.ui.lessons}</small><strong>{lessons.length}</strong></div>
        <div><small>{course.copy.ui.minutes}</small><strong>{totalMinutes}</strong></div>
        <div><small>{course.copy.ui.practice}</small><strong>{lessons.length}</strong></div>
        <p>{course.copy.meta.duration}</p>
      </section>

      <CourseProgress
        lessons={lessons.map((lesson) => ({ slug: lesson.slug, href: hrefFor(lesson.slug) }))}
        labels={course.copy.ui}
        startLabel={course.copy.meta.startCta}
        resumeLabel={course.copy.meta.resumeCta}
      />

      <section className={styles.curriculum} aria-labelledby="prompts-curriculum-title">
        <header>
          <p className={styles.kicker}>{course.copy.ui.allLessons}</p>
          <h2 id="prompts-curriculum-title">{course.copy.ui.curriculumTitle}</h2>
          <p>{course.copy.ui.curriculumIntro}</p>
        </header>
        <div className={styles.unitList}>
          {course.units.map((unit) => (
            <section className={styles.unit} key={unit.id} aria-labelledby={`${unit.id}-title`}>
              <div className={styles.unitHeading}>
                <span>{String(unit.order).padStart(2, "0")}</span>
                <div>
                  <h3 id={`${unit.id}-title`}>{unit.copy.title}</h3>
                  <p>{unit.copy.summary}</p>
                </div>
              </div>
              <ol className={styles.lessonList}>
                {unit.lessons.map((lesson) => (
                  <li key={lesson.slug}>
                    <Link href={hrefFor(lesson.slug)}>
                      <span className={styles.lessonOrder}>{String(lesson.order).padStart(2, "0")}</span>
                      <span className={styles.lessonCopy}>
                        <strong>{lesson.copy.title}</strong>
                        <span>{lesson.copy.summary}</span>
                      </span>
                      <span className={styles.lessonTime}>{lesson.minutes} {course.copy.ui.minutes}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </section>

      <FinalQuiz
        questions={quizQuestions}
        passScore={course.copy.finalQuiz.passScore}
        labels={course.copy.ui}
      />
      <CapstoneChecklist
        required={course.copy.capstone.required}
        rubric={course.copy.capstone.rubric}
        passScore={course.copy.capstone.passScore}
        maxScore={course.copy.capstone.maxScore}
        labels={course.copy.ui}
      />

      <aside className={styles.integrity} aria-labelledby="prompt-integrity-title">
        <p className={styles.kicker}>{course.copy.ui.courseIntegrity}</p>
        <h2 id="prompt-integrity-title">{course.copy.ui.integrityTitle}</h2>
        <p>{course.copy.meta.sourceNote}</p>
        <p>{course.copy.meta.modelNote}</p>
        <p>
          <a
            className={styles.fixtureLink}
            href="/courses/prompts/course-7-fixture-pack-v1.json"
            download
          >
            {course.copy.ui.fixturePack}
          </a>
        </p>
        <p>{course.copy.ui.fixturePackNote}</p>
        <p>{course.copy.ui.livePracticeNote}</p>
      </aside>

      <p className={styles.backLink}>
        <Link href={`/${course.locale}/courses/`}><span aria-hidden="true">←</span>{catalogLabel}</Link>
      </p>
    </div>
  );
}
