import Link from "next/link";
import type { MaterializedRagCourse } from "@/lib/rag";
import { CapstoneChecklist, CourseProgress, FinalQuiz, type RagQuizQuestion } from "./RagInteractions";
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
  const totalMinutes = lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
  const sourceCount = new Set(lessons.flatMap((lesson) => lesson.sourceIds)).size;
  const authenticFigureCount = lessons.filter((lesson) => lesson.figure.authenticUi).length;
  const heroLesson = lessons.find((lesson) => lesson.slug === "ground-and-cite");
  const heroRaster = heroLesson?.figure.raster;
  if (!heroLesson || !heroRaster) throw new Error("Course 9 hero figure is unavailable");

  return (
    <div
      className={`shellwrap ${base.promptRoot} ${styles.ragRoot} ${base.coursePage}`}
      lang={course.contentLocale}
      dir={course.contentLocale === "ar" ? "rtl" : "ltr"}
      data-testid="rag-course-dashboard"
    >
      <CourseShell courseId="rag" locale={course.locale} />
      <header className={`${base.courseHero} ${styles.courseHero}`}>
        <div className={base.heroCopy}>
          <p className={base.kicker}>{course.copy.meta.kicker}</p>
          <h1>{course.copy.meta.title}</h1>
          <p className={base.heroSummary}>{course.copy.meta.summary}</p>
          <p className={base.heroAudience}>{course.copy.meta.audience}</p>
          <div className={base.heroPrinciples} role="group" aria-label={course.copy.ui.successCriteria}>
            <span>{course.copy.ui.heroPrinciple1}</span>
            <span>{course.copy.ui.heroPrinciple2}</span>
            <span>{course.copy.ui.heroPrinciple3}</span>
          </div>
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
            <code>{heroRaster.upstreamCommit.slice(0, 12)}</code>
          </div>
        </figure>
      </header>

      <section className={`${base.courseFacts} ${styles.courseFacts}`} aria-label={course.copy.meta.title}>
        <div><small>{course.copy.ui.lessons}</small><strong>{lessons.length}</strong></div>
        <div><small>{course.copy.ui.minutes}</small><strong>{totalMinutes}</strong></div>
        <div><small>{course.copy.ui.uiFigures}</small><strong>{authenticFigureCount}</strong></div>
        <p>{course.copy.ui.dashboardEvidence.replace("{sources}", String(sourceCount))}</p>
      </section>

      <CourseProgress
        lessons={lessons.map((lesson) => ({ slug: lesson.slug, href: hrefFor(lesson.slug) }))}
        labels={course.copy.ui}
        startLabel={course.copy.meta.startCta}
        resumeLabel={course.copy.meta.resumeCta}
      />

      <section className={base.curriculum} aria-labelledby="rag-curriculum-title">
        <header>
          <p className={base.kicker}>{course.copy.ui.allLessons}</p>
          <h2 id="rag-curriculum-title">{course.copy.ui.curriculumTitle}</h2>
          <p>{course.copy.ui.curriculumIntro}</p>
        </header>
        <div className={base.unitList}>
          {course.units.map((unit) => (
            <section className={base.unit} key={unit.id} aria-labelledby={`${unit.id}-title`}>
              <div className={base.unitHeading}>
                <span>{String(unit.order).padStart(2, "0")}</span>
                <div>
                  <h3 id={`${unit.id}-title`}>{unit.copy.title}</h3>
                  <p>{unit.copy.summary}</p>
                </div>
              </div>
              <ol className={base.lessonList}>
                {unit.lessons.map((lesson) => (
                  <li key={lesson.slug}>
                    <Link href={hrefFor(lesson.slug)}>
                      <span className={base.lessonOrder}>{String(lesson.order).padStart(2, "0")}</span>
                      <span className={base.lessonCopy}>
                        <strong>{lesson.copy.title}</strong>
                        <span>{lesson.copy.summary}</span>
                      </span>
                      <span className={base.lessonTime}>{lesson.minutes} {course.copy.ui.minutes}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
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
