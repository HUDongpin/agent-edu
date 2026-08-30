import Link from "next/link";
import {
  SOFTWARE_ENGINEERING_CAPSTONE,
  type MaterializedSoftwareEngineeringCourse,
  type MaterializedSoftwareEngineeringLesson,
} from "@/lib/software-engineering";
import {
  SOFTWARE_ENGINEERING_ASSESSMENT_ID,
  SOFTWARE_ENGINEERING_CAPSTONE_ID,
  SOFTWARE_ENGINEERING_CAPSTONE_LESSON_SLUG,
  SOFTWARE_ENGINEERING_CORE_LESSON_SLUGS,
  softwareEngineeringCourseHref,
} from "@/lib/software-engineering/journey";
import CapstoneEvidence from "./CapstoneEvidence";
import CourseJourneyMap from "./CourseJourneyMap";
import CourseFigure from "./CourseFigure";
import LessonCheckpoint from "./LessonCheckpoint";
import LessonCompletion from "./LessonCompletion";
import styles from "./SoftwareEngineeringCourse.module.css";

export default function LessonView({
  course,
  lesson,
}: {
  course: MaterializedSoftwareEngineeringCourse;
  lesson: MaterializedSoftwareEngineeringLesson;
}) {
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const lessonIndex = lessons.findIndex((entry) => entry.slug === lesson.slug);
  const previous = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const next = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;
  const hrefFor = (slug: string) => `/${course.locale}/software-engineering/${slug}/`;
  const assessmentHref = `${softwareEngineeringCourseHref(course.locale)}#${SOFTWARE_ENGINEERING_ASSESSMENT_ID}`;
  const nextIsAssessment = lesson.slug
    === SOFTWARE_ENGINEERING_CORE_LESSON_SLUGS[SOFTWARE_ENGINEERING_CORE_LESSON_SLUGS.length - 1];
  const previousIsAssessment = lesson.slug === SOFTWARE_ENGINEERING_CAPSTONE_LESSON_SLUG;
  const localizedText = { lang: course.locale, dir: "auto" as const };

  return (
    <div
      className={`shellwrap ${styles.seRoot} ${styles.lessonPage}`}
      data-testid={`software-engineering-lesson-${lesson.slug}`}
    >
      {course.locale !== "en" ? (
        <p className={styles.languageNotice} lang={course.locale}>{course.copy.meta.languageNotice}</p>
      ) : null}
      <noscript><p className={styles.languageNotice}>{course.copy.ui.javascriptRequired}</p></noscript>

      <nav className={styles.breadcrumbs} aria-label={course.copy.ui.courseMap}>
        <Link href={`/${course.locale}/software-engineering/`}><span aria-hidden="true">←</span>{course.copy.ui.course}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" {...localizedText}>{lesson.localizedTitle}</span>
      </nav>

      <div className={styles.lessonLayout}>
        <CourseJourneyMap
          units={course.units.map((unit) => ({
            id: unit.id,
            order: unit.order,
            title: unit.localizedTitle,
            lessons: unit.lessons.map((entry) => ({
              slug: entry.slug,
              order: entry.order,
              title: entry.localizedTitle,
              href: hrefFor(entry.slug),
            })),
          }))}
          currentSlug={lesson.slug}
          currentOrder={lesson.order}
          locale={course.locale}
          labels={{
            allLessons: course.copy.ui.allLessons,
            completed: course.copy.ui.completed,
            finalAssessment: course.copy.ui.finalAssessment,
            lessons: course.copy.ui.lessons,
            openCourseMap: course.copy.ui.openCourseMap,
          }}
        />

        <div className={styles.lessonMain}>
          <article>
            <header className={styles.lessonHero}>
              <p className={styles.kicker} lang="en" dir="ltr">{lesson.kicker}</p>
              <h1 {...localizedText}>{lesson.localizedTitle}</h1>
              <p className={styles.lessonSummary} lang="en" dir="ltr">{lesson.summary}</p>
              <dl>
                <div><dt>{course.copy.ui.minutes}</dt><dd>{lesson.minutes}</dd></div>
                <div><dt>{course.copy.ui.sources}</dt><dd>{lesson.sources.length}</dd></div>
              </dl>
            </header>

            <section className={styles.objective} aria-labelledby="lesson-objective-title">
              <h2 id="lesson-objective-title">{course.copy.ui.objective}</h2>
              <p lang="en" dir="ltr">{lesson.objective}</p>
            </section>

            <section className={styles.conceptStrip} aria-labelledby="lesson-concepts-title">
              <h2 id="lesson-concepts-title">{course.copy.ui.concepts}</h2>
              <ul lang="en" dir="ltr">{lesson.concepts.map((concept) => <li key={concept}>{concept}</li>)}</ul>
            </section>

            {lesson.sections.map((section, index) => (
              <section className={styles.proseSection} aria-labelledby={`lesson-section-${index}`} key={section.heading} lang="en" dir="ltr">
                <h2 id={`lesson-section-${index}`}>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
                {section.code ? (
                  <figure className={styles.codeBlock}>
                    <figcaption>{section.code.label}</figcaption>
                    <pre dir="ltr"><code data-language={section.code.language}>{section.code.value}</code></pre>
                  </figure>
                ) : null}
                {lesson.media[index] ? (
                  <CourseFigure figure={lesson.media[index]} labels={course.copy.ui} locale={course.locale} />
                ) : null}
              </section>
            ))}

            {lesson.media.slice(lesson.sections.length).map((figure) => (
              <CourseFigure key={figure.id} figure={figure} labels={course.copy.ui} locale={course.locale} />
            ))}

            <section className={styles.practice} aria-labelledby="software-engineering-practice-title">
              <header>
                <div>
                  <p className={styles.kicker}>{course.copy.ui.practice}</p>
                  <h2 id="software-engineering-practice-title" lang="en" dir="ltr">{lesson.practice.title}</h2>
                </div>
              </header>
              <p lang="en" dir="ltr">{lesson.practice.brief}</p>
              <ol lang="en" dir="ltr">{lesson.practice.steps.map((step) => <li key={step}>{step}</li>)}</ol>
              <div className={styles.evidenceList}>
                <h3>{course.copy.ui.evidence}</h3>
                <ul lang="en" dir="ltr">{lesson.practice.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <p className={styles.safetyNote} lang="en" dir="ltr">{lesson.practice.safety}</p>
            </section>

            <LessonCheckpoint
              checkpoint={lesson.checkpoint}
              labels={course.copy.ui}
              id={`checkpoint-${lesson.slug}`}
            />

            <aside className={styles.takeaway}>
              <span>{course.copy.ui.takeaway}</span>
              <p lang="en" dir="ltr">{lesson.takeaway}</p>
            </aside>

            {lesson.slug === "capstone-safe-change" ? (
              <div id={SOFTWARE_ENGINEERING_CAPSTONE_ID} className={styles.capstoneAnchor}>
                <CapstoneEvidence
                  config={SOFTWARE_ENGINEERING_CAPSTONE}
                  labels={course.copy.ui}
                  locale={course.locale}
                />
              </div>
            ) : null}

            <LessonCompletion slug={lesson.slug} labels={course.copy.ui} />

            <nav className={styles.lessonPager} aria-label={course.copy.ui.lessons} data-course-lesson-nav>
              {previousIsAssessment ? (
                <Link href={assessmentHref} rel="prev">
                  <span>{course.copy.ui.previous}</span><strong>{course.copy.ui.finalAssessment}</strong>
                </Link>
              ) : previous ? (
                <Link href={hrefFor(previous.slug)} rel="prev">
                  <span>{course.copy.ui.previous}</span><strong {...localizedText}>{previous.localizedTitle}</strong>
                </Link>
              ) : <span />}
              {nextIsAssessment ? (
                <Link href={assessmentHref} rel="next">
                  <span>{course.copy.ui.next}</span><strong>{course.copy.ui.finalAssessment}</strong>
                </Link>
              ) : next ? (
                <Link href={hrefFor(next.slug)} rel="next">
                  <span>{course.copy.ui.next}</span><strong {...localizedText}>{next.localizedTitle}</strong>
                </Link>
              ) : (
                <Link href={`/${course.locale}/software-engineering/`}>
                  <span>{course.copy.ui.course}</span><strong {...localizedText}>{course.copy.meta.title}</strong>
                </Link>
              )}
            </nav>

            <details className={styles.sourcesDisclosure}>
              <summary>
                <span>{course.copy.ui.sources}</span>
                <span>{lesson.sources.length}</span>
              </summary>
              <section className={styles.sources} aria-labelledby="software-engineering-sources-title">
                <h2 id="software-engineering-sources-title">{course.copy.ui.sources}</h2>
                <ol>
                  {lesson.sources.map((source) => (
                    <li key={source.id} lang="en" dir="ltr">
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        <strong>{source.title}</strong>
                        <span>{source.publisher} · {source.kind} · {source.accessedOn} · {source.licence}</span>
                        <span>{source.evidenceUse}</span>
                        <span>{source.caveat}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </section>
            </details>
          </article>
        </div>
      </div>
    </div>
  );
}
