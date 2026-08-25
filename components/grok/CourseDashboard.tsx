import Image from "next/image";
import Link from "next/link";
import {
  GROK_FIGURE_BY_ID,
  GROK_SOURCE_BY_ID,
  type MaterializedGrokCourse,
} from "@/lib/grok";
import CourseProgress from "./CourseProgress";
import FinalQuiz, { type GrokQuizQuestion } from "./FinalQuiz";
import styles from "./GrokCourse.module.css";
import SharedCourseShell from "../SharedCourseShell";

export default function CourseDashboard({
  course,
  catalogLabel,
  reviewLabel,
}: {
  course: MaterializedGrokCourse;
  catalogLabel: string;
  reviewLabel: string;
}) {
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const numberFormat = new Intl.NumberFormat(course.locale);
  const twoDigitFormat = new Intl.NumberFormat(course.locale, {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
  const verifiedDate = new Intl.DateTimeFormat(course.locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${course.manifest.verifiedOn}T00:00:00Z`));
  const hours = Math.floor(course.manifest.minutes / 60);
  const remainingMinutes = course.manifest.minutes % 60;
  const duration = course.copy.ui.durationCompact
    .replace("{hours}", numberFormat.format(hours))
    .replace("{minutes}", numberFormat.format(remainingMinutes));
  const hrefFor = (slug: string) => `/${course.locale}/grok/${slug}/`;
  const heroFigure = GROK_FIGURE_BY_ID["fig-01"];
  const previewFigureIds = ["fig-06", "fig-07", "fig-08"] as const;
  const previewFigures = previewFigureIds.map((id) => GROK_FIGURE_BY_ID[id]);
  const quizQuestions: GrokQuizQuestion[] = lessons.map((lesson) => ({
    id: lesson.quizId,
    lessonTitle: lesson.copy.title,
    copy: course.copy.quiz[lesson.quizId],
    sources: lesson.sourceIds.map((sourceId) => {
      const source = GROK_SOURCE_BY_ID[sourceId];
      return { id: source.id, title: source.title, url: source.url };
    }),
  }));

  return (
    <div className={styles.coursePage} data-testid="grok-course-dashboard">
      <SharedCourseShell courseId="grok" locale={course.locale} standalone />
      <section className={`shellwrap ${styles.courseHero}`} aria-labelledby="grok-course-title">
        <div className={styles.heroCopy}>
          <p className={styles.heroKicker}>{course.copy.meta.kicker}</p>
          <h1 id="grok-course-title">{course.copy.meta.title}</h1>
          <p className={styles.heroSummary}>{course.copy.meta.summary}</p>
        </div>
        <figure className={styles.heroFigure}>
          <Image
            src={heroFigure.srcSet.webp1120}
            alt={course.copy.figures["fig-01"].alt}
            width={1120}
            height={611}
            preload
            unoptimized
          />
          <figcaption>{course.copy.figures["fig-01"].caption}</figcaption>
        </figure>
      </section>

      <section className={`shellwrap ${styles.factStrip}`}>
        <div><strong>{numberFormat.format(lessons.length)}</strong><span>{course.copy.ui.lessons}</span></div>
        <div><strong>{duration}</strong><span>{course.copy.ui.level}</span></div>
        <div><strong><time dateTime={course.manifest.verifiedOn}>{verifiedDate}</time></strong><span>{course.copy.ui.verified}</span></div>
        <div><strong>{numberFormat.format(lessons.length + 2)}</strong><span>{course.copy.ui.progress}</span></div>
      </section>

      <section className={`shellwrap ${styles.outcomeSection}`} aria-labelledby="grok-outcome-title">
        <div>
          <p>{course.copy.ui.learnOutcome}</p>
          <h2 id="grok-outcome-title">{course.copy.ui.workflowTitle}</h2>
        </div>
        <blockquote>{course.copy.meta.outcome}</blockquote>
      </section>

      <div className="shellwrap">
        <CourseProgress
          locale={course.locale}
          lessons={lessons.map((lesson) => ({
            slug: lesson.slug,
            title: lesson.copy.title,
            href: hrefFor(lesson.slug),
          }))}
          labels={course.copy.ui}
          startLabel={course.copy.meta.startCta}
          resumeLabel={course.copy.meta.resumeCta}
          reviewLabel={reviewLabel}
        />
      </div>

      <section className={`shellwrap ${styles.curriculum}`} aria-labelledby="grok-curriculum-title">
        <header>
          <h2 id="grok-curriculum-title">{course.copy.ui.allLessons}</h2>
          <p>{course.copy.meta.duration}</p>
        </header>
        <div className={styles.unitGrid}>
          {course.units.map((unit) => (
            <section className={styles.unitBlock} key={unit.id} aria-labelledby={`grok-unit-${unit.id}`}>
              <header>
                <span aria-hidden="true">{twoDigitFormat.format(unit.order)}</span>
                <div>
                  <h3 id={`grok-unit-${unit.id}`}>{unit.copy.title}</h3>
                  <p>{unit.copy.summary}</p>
                </div>
              </header>
              <ol>
                {unit.lessons.map((lesson) => (
                  <li key={lesson.slug}>
                    <Link href={hrefFor(lesson.slug)}>
                      <span>{twoDigitFormat.format(lesson.order)}</span>
                      <span>
                        <strong>{lesson.copy.title}</strong>
                        <small>{lesson.copy.summary}</small>
                      </span>
                      <time dateTime={`PT${lesson.minutes}M`}>{numberFormat.format(lesson.minutes)} {course.copy.ui.minutes}</time>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </section>

      <section className={`shellwrap ${styles.practiceGallery}`} aria-labelledby="grok-practice-gallery-title">
        <header>
          <h2 id="grok-practice-gallery-title">{course.copy.ui.galleryTitle}</h2>
          <p>{course.copy.ui.galleryIntro}</p>
        </header>
        <div className={styles.galleryGrid}>
          {previewFigures.map((figure, index) => (
            <figure key={figure.id}>
              <Image
                src={figure.srcSet.webp1120}
                alt={course.copy.figures[figure.id].alt}
                width={1120}
                height={Math.round(1120 * figure.height / figure.width)}
                sizes={index === 0 ? "(max-width: 760px) 100vw, 56vw" : "(max-width: 760px) 100vw, 28vw"}
                loading="lazy"
                unoptimized
              />
              <figcaption>{course.copy.figures[figure.id].caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <div className="shellwrap">
        <FinalQuiz
          locale={course.locale}
          questions={quizQuestions}
          passingScore={course.manifest.passingScore}
          labels={course.copy.ui}
        />
      </div>

      <section className={`shellwrap ${styles.integritySection}`} aria-labelledby="grok-integrity-title">
        <div>
          <h2 id="grok-integrity-title">{course.copy.ui.independent}</h2>
          <p>{course.copy.meta.independent}</p>
        </div>
        <div>
          <h3>{course.copy.ui.sources}</h3>
          <p>{course.copy.meta.sourceNote}</p>
          <p>{course.copy.meta.verified}</p>
        </div>
      </section>

      <p className={`shellwrap ${styles.backLink}`}>
        <Link href={`/${course.locale}/courses/`}>← {catalogLabel}</Link>
      </p>
    </div>
  );
}
