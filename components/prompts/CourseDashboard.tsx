import Link from "next/link";
import { PROMPT_SOURCE_BY_ID, type MaterializedPromptCourse } from "@/lib/prompts";
import { CourseProgress, FinalQuiz, type PromptQuizQuestion } from "./PromptInteractions";
import { PromptCurriculum, type PromptNavigationUnit } from "./PromptNavigation";
import styles from "./PromptCourse.module.css";
import CourseShell from "../course-shell/CourseShell";

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
  const capstoneLesson = lessons.find((lesson) => lesson.slug === "capstone-prompt-packet");
  const navigationUnits: PromptNavigationUnit[] = course.units.map((unit) => ({
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
    })),
  }));

  if (!workbench) throw new Error("Course 7 workbench figure is unavailable.");
  if (!capstoneLesson) throw new Error("Course 7 capstone lesson is unavailable.");

  return (
    <div
      className={`shellwrap ${styles.promptRoot} ${styles.coursePage}`}
      lang="en"
      dir="ltr"
      data-testid="prompts-course-dashboard"
    >
      <CourseShell courseId="prompts" locale={course.locale} />
      {course.locale !== "en" ? <p className={styles.languageNotice}>{course.copy.ui.englishOnly}</p> : null}
      <header className={styles.courseHero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>{course.copy.meta.kicker}</p>
          <h1>{course.copy.meta.title}</h1>
          <p className={styles.heroSummary}>{course.copy.meta.summary}</p>
          <p className={styles.heroAudience}>{course.copy.meta.audience}</p>
          <div className={styles.heroPrinciples} role="list" aria-label={course.copy.ui.successCriteria}>
            <span role="listitem">{course.copy.ui.heroPrinciple1}</span>
            <span role="listitem">{course.copy.ui.heroPrinciple2}</span>
            <span role="listitem">{course.copy.ui.heroPrinciple3}</span>
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
        <PromptCurriculum units={navigationUnits} locale={course.locale} labels={course.copy.ui} />
      </section>

      <section className={styles.capstoneOverview} aria-labelledby="prompts-capstone-overview-title">
        <div>
          <p className={styles.kicker}>{course.copy.ui.capstone}</p>
          <h2 id="prompts-capstone-overview-title">{course.copy.capstone.title}</h2>
          <p>{course.copy.capstone.summary}</p>
          <p className={styles.capstoneRule}>{course.copy.ui.capstonePassRule}</p>
        </div>
        <Link className={styles.primaryButton} href={hrefFor(capstoneLesson.slug)}>
          {course.copy.ui.openCapstone}<span aria-hidden="true">→</span>
        </Link>
      </section>
      <FinalQuiz
        questions={quizQuestions}
        passScore={course.copy.finalQuiz.passScore}
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
