import Link from "next/link";
import type { MaterializedRagCourse } from "@/lib/rag";
import { formatDeterministicInteger } from "@/lib/deterministic-format";
import { CapstoneChecklist, CourseProgressTools, FinalQuiz, type RagQuizQuestion } from "./RagInteractions";
import { RagCurriculumMap, type RagCourseMapUnit } from "./CourseMap";
import base from "../prompts/PromptCourse.module.css";
import styles from "./RagCourse.module.css";
import CourseShell from "../course-shell/CourseShell";

export default function CourseDashboard({
  course,
  catalogLabel,
}: {
  course: MaterializedRagCourse;
  catalogLabel: string;
}) {
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const hrefFor = (slug: string) => `/${course.locale}/rag/${slug}/`;
  const quizQuestions: readonly RagQuizQuestion[] = lessons.map((lesson) => {
    const checkpointSource = lesson.sources.find(
      (source) => source.id === lesson.copy.checkpoint.sourceId,
    );
    if (!checkpointSource) {
      throw new Error(`Checkpoint source ${lesson.copy.checkpoint.sourceId} is not assigned to ${lesson.slug}`);
    }
    return {
      id: lesson.slug,
      unitTitle: course.copy.units[lesson.unitId].title,
      ...lesson.copy.checkpoint,
      sourceTitle: checkpointSource.title,
      sourceUrl: checkpointSource.exactAnchor,
    };
  });
  const sourceCount = new Set(lessons.flatMap((lesson) => lesson.sourceIds)).size;
  const authenticFigureCount = lessons.filter((lesson) => lesson.figure.authenticUi).length;
  const heroLesson = lessons.find((lesson) => lesson.slug === "ground-and-cite");
  const heroRaster = heroLesson?.figure.raster;
  if (!heroLesson || !heroRaster) throw new Error("Course 9 hero figure is unavailable");
  const number = (value: number) => formatDeterministicInteger(value, course.contentLocale);
  const twoDigit = (value: number) => number(value).padStart(
    2,
    course.contentLocale === "ar" ? "٠" : "0",
  );
  const curriculumUnits: readonly RagCourseMapUnit[] = course.units.map((unit) => ({
    id: unit.id,
    orderLabel: twoDigit(unit.order),
    title: unit.copy.title,
    summary: unit.copy.summary,
    lessons: unit.lessons.map((lesson) => ({
      slug: lesson.slug,
      href: hrefFor(lesson.slug),
      orderLabel: twoDigit(lesson.order),
      title: lesson.copy.title,
      summary: lesson.copy.summary,
      minutesLabel: `${number(lesson.minutes)} ${course.copy.ui.minutes}`,
    })),
  }));

  return (
    <div
      className={`shellwrap ${base.promptRoot} ${styles.ragRoot} ${base.coursePage}`}
      lang={course.contentLocale}
      dir={course.contentLocale === "ar" ? "rtl" : "ltr"}
      data-testid="rag-course-dashboard"
    >
      <CourseShell courseId="rag" locale={course.locale} showHeading={false} />
      <noscript>
        <p className={styles.noScriptNotice}>{course.copy.ui.interactiveRequiresJavaScript}</p>
      </noscript>
      <header className={`${base.courseHero} ${styles.courseHero}`}>
        <div className={base.heroCopy}>
          <p className={base.kicker}>{course.copy.meta.kicker}</p>
          <h1>{course.copy.meta.title}</h1>
          <p className={base.heroSummary}>{course.copy.meta.summary}</p>
          <p className={base.heroAudience}>{course.copy.meta.audience}</p>
        </div>
        <figure className={base.heroImage}>
          <picture>
            <source srcSet={heroRaster.webpPath} type="image/webp" />
            <img
              src={heroRaster.pngPath}
              width={heroRaster.width}
              height={heroRaster.height}
              alt={heroLesson.copy.figure.alt}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
          <figcaption>{heroLesson.copy.figure.caption}</figcaption>
          <div className={styles.figureProvenance}>
            <a href={heroRaster.upstreamUrl} target="_blank" rel="noopener noreferrer">{course.copy.ui.source}</a>
            <a href="/courses/rag/NOTICE.md" target="_blank" rel="noopener noreferrer">{course.copy.ui.rightsNotice}</a>
            <code translate="no">{heroRaster.upstreamCommit.slice(0, 12)}</code>
          </div>
        </figure>
      </header>

      <nav className={styles.dashboardNav} aria-label={course.copy.ui.courseNavigation}>
        <a href="#rag-curriculum-title">{course.copy.ui.allLessons}</a>
        <a href="#rag-final-quiz">{course.copy.ui.finalQuiz}</a>
        <a href="#rag-capstone">{course.copy.ui.capstone}</a>
      </nav>

      <section className={`${base.courseFacts} ${styles.courseFacts}`} aria-label={course.copy.meta.title}>
        <div><small>{course.copy.ui.lessons}</small><strong>{number(lessons.length)}</strong></div>
        <div><small>{course.copy.ui.sources}</small><strong>{number(sourceCount)}</strong></div>
        <div><small>{course.copy.ui.uiFigures}</small><strong>{number(authenticFigureCount)}</strong></div>
        <p>{course.copy.ui.dashboardEvidence.replace("{sources}", number(sourceCount))}</p>
      </section>

      <section className={base.curriculum} aria-labelledby="rag-curriculum-title">
        <header>
          <p className={base.kicker}>{course.copy.ui.allLessons}</p>
          <h2 id="rag-curriculum-title">{course.copy.ui.curriculumTitle}</h2>
          <p>{course.copy.ui.curriculumIntro}</p>
        </header>
        <RagCurriculumMap
          units={curriculumUnits}
          labels={{
            complete: course.copy.ui.completeStatus,
            next: course.copy.ui.nextStatus,
          }}
        />
      </section>

      <FinalQuiz questions={quizQuestions} labels={course.copy.ui} />
      <section className={styles.capstoneIntro}>
        <p className={base.kicker}>{course.copy.ui.capstone}</p>
        <h2>{course.copy.capstone.title}</h2>
        <p>{course.copy.capstone.summary}</p>
      </section>
      <CapstoneChecklist required={course.copy.capstone.required} rubric={course.copy.capstone.rubric} labels={course.copy.ui} />

      <aside className={base.integrity} aria-labelledby="rag-integrity-title">
        <p className={base.kicker}>{course.copy.ui.courseIntegrity}</p>
        <h2 id="rag-integrity-title">{course.copy.ui.integrityTitle}</h2>
        <p>{course.copy.meta.sourceNote}</p>
        <p>{course.copy.meta.uiNote}</p>
      </aside>

      <CourseProgressTools labels={course.copy.ui} />

      <p className={base.backLink}>
        <Link href={`/${course.locale}/courses/`}>
          <span aria-hidden="true">{course.contentLocale === "ar" ? "→" : "←"}</span>
          <span
            data-testid="rag-catalog-label"
            lang={course.locale}
            dir={course.locale === "ar" ? "rtl" : "ltr"}
          >
            {catalogLabel}
          </span>
        </Link>
      </p>
    </div>
  );
}
