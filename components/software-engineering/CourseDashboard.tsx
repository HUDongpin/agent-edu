import Link from "next/link";
import {
  SOFTWARE_ENGINEERING_CAPSTONE,
  SOFTWARE_ENGINEERING_COVERAGE,
  SOFTWARE_ENGINEERING_FINAL_ASSESSMENT,
  SOFTWARE_ENGINEERING_MEDIA_BY_ID,
  SOFTWARE_ENGINEERING_OVERVIEW,
  SOFTWARE_ENGINEERING_QUESTION_BANK,
  type MaterializedSoftwareEngineeringCourse,
  type SoftwareEngineeringUnitId,
} from "@/lib/software-engineering";
import CapstoneEvidence from "./CapstoneEvidence";
import CourseFigure from "./CourseFigure";
import CourseProgress from "./CourseProgress";
import FinalAssessment from "./FinalAssessment";
import styles from "./SoftwareEngineeringCourse.module.css";
import SharedCourseShell from "../SharedCourseShell";

export default function CourseDashboard({
  course,
}: {
  course: MaterializedSoftwareEngineeringCourse;
}) {
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const totalMinutes = lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
  const hrefFor = (slug: string) => `/${course.locale}/software-engineering/${slug}/`;
  const hero = SOFTWARE_ENGINEERING_MEDIA_BY_ID["codex-plan-ui"];
  const localizedText = { lang: course.locale, dir: "auto" as const };

  return (
    <div
      className={`shellwrap ${styles.seRoot} ${styles.coursePage}`}
      data-testid="software-engineering-course-dashboard"
    >
      <SharedCourseShell courseId="software-engineering" locale={course.locale} />
      {course.locale !== "en" ? (
        <p className={styles.languageNotice} lang={course.locale}>{course.copy.meta.languageNotice}</p>
      ) : null}

      <noscript><p className={styles.languageNotice}>{course.copy.ui.javascriptRequired}</p></noscript>

      <header className={styles.courseHero} lang="en" dir="ltr">
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>{SOFTWARE_ENGINEERING_OVERVIEW.kicker}</p>
          <h1 {...localizedText}>{course.copy.meta.title}</h1>
          <p className={styles.heroSummary}>{SOFTWARE_ENGINEERING_OVERVIEW.summary}</p>
          <p className={styles.heroAudience}>{SOFTWARE_ENGINEERING_OVERVIEW.audience}</p>
          <div
            className={styles.heroPrinciples}
            aria-label={course.copy.ui.courseIntegrity}
            lang={course.locale}
            dir="auto"
          >
            {SOFTWARE_ENGINEERING_OVERVIEW.principles.map((principle) => (
              <span key={principle} lang="en" dir="ltr">{principle}</span>
            ))}
          </div>
        </div>
        <div className={styles.heroImage}>
          <CourseFigure figure={hero} labels={course.copy.ui} locale={course.locale} eager />
        </div>
      </header>

      <section className={styles.courseFacts} aria-label={course.copy.meta.title}>
        <div><small>{course.copy.ui.lessons}</small><strong>{lessons.length}</strong></div>
        <div><small>{course.copy.ui.minutes}</small><strong>{totalMinutes}</strong></div>
        <div><small>{course.copy.ui.progress}</small><strong>{lessons.length + 2}</strong></div>
        <p lang="en" dir="ltr">{SOFTWARE_ENGINEERING_OVERVIEW.duration}</p>
      </section>

      <section className={styles.lifecycle} aria-labelledby="agentic-lifecycle-title">
        <p className={styles.kicker}>{course.copy.ui.course}</p>
        <h2 id="agentic-lifecycle-title" lang="en" dir="ltr">{SOFTWARE_ENGINEERING_OVERVIEW.lifecycleTitle}</h2>
        <ol lang="en" dir="ltr">
          {SOFTWARE_ENGINEERING_OVERVIEW.lifecycle.map((step, index) => (
            <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong></li>
          ))}
        </ol>
        <p lang="en" dir="ltr">{SOFTWARE_ENGINEERING_OVERVIEW.lifecycleNote}</p>
      </section>

      <CourseProgress
        lessons={lessons.map((lesson) => ({ slug: lesson.slug, href: hrefFor(lesson.slug) }))}
        labels={course.copy.ui}
      />

      <section className={styles.curriculum} aria-labelledby="software-engineering-curriculum-title">
        <header>
          <p className={styles.kicker}>{course.copy.ui.allLessons}</p>
          <h2 id="software-engineering-curriculum-title">{course.copy.ui.curriculum}</h2>
          <p lang="en" dir="ltr">{SOFTWARE_ENGINEERING_OVERVIEW.curriculumIntro}</p>
        </header>
        <div className={styles.unitList}>
          {course.units.map((unit) => (
            <section className={styles.unit} key={unit.id} aria-labelledby={`${unit.id}-title`}>
              <div className={styles.unitHeading}>
                <span>{String(unit.order).padStart(2, "0")}</span>
                <div>
                  <h3 id={`${unit.id}-title`} {...localizedText}>{unit.localizedTitle}</h3>
                  <p lang="en" dir="ltr">{unit.summary}</p>
                </div>
              </div>
              <ol className={styles.lessonList}>
                {unit.lessons.map((lesson) => (
                  <li key={lesson.slug}>
                    <Link href={hrefFor(lesson.slug)}>
                      <span className={styles.lessonOrder}>{String(lesson.order).padStart(2, "0")}</span>
                      <span className={styles.lessonCopy}>
                        <strong {...localizedText}>{lesson.localizedTitle}</strong>
                        <span lang="en" dir="ltr">{lesson.summary}</span>
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

      <section className={styles.coverageSection} aria-labelledby="software-engineering-coverage-title">
        <header>
          <p className={styles.kicker}>{course.copy.ui.coverage}</p>
          <h2 id="software-engineering-coverage-title" lang="en" dir="ltr">{SOFTWARE_ENGINEERING_OVERVIEW.coverageTitle}</h2>
          <p lang="en" dir="ltr">{SOFTWARE_ENGINEERING_OVERVIEW.coverageIntro}</p>
        </header>
        <div className={styles.coverageGrid}>
          {SOFTWARE_ENGINEERING_COVERAGE.map((entry) => (
            <article key={entry.area} lang="en" dir="ltr">
              <h3>{entry.area}</h3>
              <p>{entry.requiredConcepts.join(" · ")}</p>
              <span>{entry.lessonSlugs.map((slug) => lessons.find((lesson) => lesson.slug === slug)?.order).join(" / ")}</span>
            </article>
          ))}
        </div>
      </section>

      <FinalAssessment
        bank={SOFTWARE_ENGINEERING_QUESTION_BANK}
        config={SOFTWARE_ENGINEERING_FINAL_ASSESSMENT}
        unitTitles={course.units.reduce<Record<SoftwareEngineeringUnitId, string>>(
          (titles, unit) => ({ ...titles, [unit.id]: unit.localizedTitle }),
          {
            frame: "",
            shape: "",
            verify: "",
            deliver: "",
            govern: "",
          },
        )}
        labels={course.copy.ui}
      />

      <CapstoneEvidence
        config={SOFTWARE_ENGINEERING_CAPSTONE}
        labels={course.copy.ui}
        locale={course.locale}
      />

      <aside className={styles.integrity} aria-labelledby="software-engineering-integrity-title">
        <p className={styles.kicker}>{course.copy.ui.courseIntegrity}</p>
        <div lang="en" dir="ltr">
          <h2 id="software-engineering-integrity-title">{SOFTWARE_ENGINEERING_OVERVIEW.integrityTitle}</h2>
          <p>{SOFTWARE_ENGINEERING_OVERVIEW.integrity}</p>
          <p>{SOFTWARE_ENGINEERING_OVERVIEW.mediaIntegrity}</p>
          <p><a href="/courses/software-engineering/NOTICE.md">Media notice and provenance ledger</a></p>
        </div>
      </aside>

      <p className={styles.backLink}>
        <Link href={`/${course.locale}/courses/`}><span aria-hidden="true">←</span>{course.copy.ui.backToCatalog}</Link>
      </p>
    </div>
  );
}
