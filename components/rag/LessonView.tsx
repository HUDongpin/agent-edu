import Link from "next/link";
import type { MaterializedRagCourse, MaterializedRagLesson } from "@/lib/rag";
import RagFigure from "./RagFigure";
import RetrievalLab from "./RetrievalLab";
import { CapstoneChecklist, LessonCheckpoint, PracticeCompletion } from "./RagInteractions";
import base from "../prompts/PromptCourse.module.css";
import styles from "./RagCourse.module.css";

function evidenceLabel(
  value: MaterializedRagLesson["sources"][number]["evidenceLabel"],
  labels: MaterializedRagCourse["copy"]["ui"],
): string {
  const keys = {
    "official-course": "officialCourse",
    "official-event": "officialEvent",
    "official-video": "officialVideo",
    "official-doc": "officialDoc",
    "official-repository": "officialRepository",
    "research-paper": "researchPaper",
    "maintainer-repository": "maintainerRepository",
    "security-guidance": "securityGuidance",
    "individual-user-report": "individualReport",
  } as const;
  return labels[keys[value]];
}

export default function LessonView({
  course,
  lesson,
}: {
  course: MaterializedRagCourse;
  lesson: MaterializedRagLesson;
}) {
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const lessonIndex = lessons.findIndex((item) => item.slug === lesson.slug);
  const previous = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const next = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;
  const hrefFor = (slug: string) => `/${course.locale}/rag/${slug}/`;
  const direction = course.contentLocale === "ar" ? "rtl" : "ltr";
  const backArrow = direction === "rtl" ? "→" : "←";
  const sourceDate = new Intl.DateTimeFormat(course.contentLocale, {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  const courseMap = (
    <ol>
      {lessons.map((item) => (
        <li key={item.slug}>
          <Link href={hrefFor(item.slug)} aria-current={item.slug === lesson.slug ? "page" : undefined}>
            <span>{String(item.order).padStart(2, "0")}</span>{item.copy.title}
          </Link>
        </li>
      ))}
    </ol>
  );

  return (
    <div
      className={`shellwrap ${base.promptRoot} ${styles.ragRoot} ${base.lessonPage}`}
      lang={course.contentLocale}
      dir={direction}
      data-testid={`rag-lesson-${lesson.slug}`}
    >
      <nav className={base.breadcrumbs} aria-label={course.copy.ui.breadcrumb}>
        <Link className={styles.breadcrumbCourseLink} href={`/${course.locale}/rag/`}><span aria-hidden="true">{backArrow}</span>{course.copy.ui.backToCourse}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{lesson.copy.title}</span>
      </nav>

      <details className={base.mobileCourseMap}>
        <summary>{course.copy.ui.lesson} {lesson.order} / {lessons.length} · {course.copy.ui.openCourseMap}</summary>
        <nav aria-label={course.copy.ui.allLessons}>{courseMap}</nav>
      </details>

      <div className={base.lessonLayout}>
        <div className={base.lessonRail}>
          <nav aria-label={course.copy.ui.allLessons}>
            <strong>{course.copy.ui.allLessons}</strong>
            {courseMap}
          </nav>
        </div>

        <div className={base.lessonMain}>
          <article>
            <header className={base.lessonHero}>
              <p className={base.kicker}>{lesson.copy.kicker}</p>
              <h1>{lesson.copy.title}</h1>
              <p className={base.lessonSummary}>{lesson.copy.summary}</p>
              <dl>
                <div><dt>{course.copy.ui.minutes}</dt><dd>{lesson.minutes}</dd></div>
                <div><dt>{course.copy.ui.sources}</dt><dd>{lesson.sources.length}</dd></div>
                <div><dt>{course.copy.ui.concepts}</dt><dd>{lesson.conceptIds.length}</dd></div>
              </dl>
            </header>

            <section className={base.objective} aria-labelledby="rag-objective-title">
              <h2 id="rag-objective-title">{course.copy.ui.objective}</h2>
              <p>{lesson.copy.objective}</p>
            </section>

            <section className={base.proseSection} aria-labelledby="rag-section-0">
              <h2 id="rag-section-0">{lesson.copy.sections[0].heading}</h2>
              {lesson.copy.sections[0].paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>

            <section className={base.proseSection} aria-labelledby="rag-section-1">
              <h2 id="rag-section-1">{lesson.copy.sections[1].heading}</h2>
              {lesson.copy.sections[1].paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>

            <RagFigure figure={lesson.figure} copy={lesson.copy.figure} labels={course.copy.ui} />

            <section className={base.proseSection} aria-labelledby="rag-section-2">
              <h2 id="rag-section-2">{lesson.copy.sections[2].heading}</h2>
              {lesson.copy.sections[2].paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </section>

            {lesson.slug === "retrieval-engineering" ? <RetrievalLab copy={course.copy.lab} locale={course.contentLocale} /> : null}

            <section className={base.practice} aria-labelledby="rag-practice-title">
              <header>
                <div>
                  <p className={base.kicker}>{course.copy.ui.practice}</p>
                  <h2 id="rag-practice-title">{lesson.copy.practice.title}</h2>
                </div>
                <span>{course.copy.ui.estimatedLessonTime}: {lesson.minutes} {course.copy.ui.minutes}</span>
              </header>
              <p>{lesson.copy.practice.brief}</p>
              <ol>{lesson.copy.practice.steps.map((step) => <li key={step}>{step}</li>)}</ol>
              <div className={base.evidenceList}>
                <h3>{course.copy.ui.evidence}</h3>
                <ul>{lesson.copy.practice.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <p className={base.safetyNote}>{lesson.copy.practice.boundary}</p>
            </section>

            <LessonCheckpoint checkpoint={lesson.copy.checkpoint} labels={course.copy.ui} id={`checkpoint-${lesson.slug}`} />

            <aside className={base.takeaway} aria-label={course.copy.ui.takeaway}>
              <span>{course.copy.ui.takeaway}</span>
              <p>{lesson.copy.takeaway}</p>
            </aside>

            {lesson.slug === "production-capstone" ? (
              <CapstoneChecklist required={course.copy.capstone.required} rubric={course.copy.capstone.rubric} labels={course.copy.ui} />
            ) : null}

            <section className={`${base.sources} ${styles.sources}`} aria-labelledby="rag-sources-title">
              <h2 id="rag-sources-title">{course.copy.ui.sources}</h2>
              <ol>
                {lesson.sources.map((source) => (
                  <li key={source.id}>
                    <a href={source.exactAnchor} target="_blank" rel="noopener noreferrer">
                      <strong>{source.title}</strong>
                      <span>{source.publisher} · <time dateTime={source.accessedOn}>{sourceDate.format(new Date(`${source.accessedOn}T00:00:00Z`))}</time></span>
                      <em data-evidence-label={source.evidenceLabel}>{evidenceLabel(source.evidenceLabel, course.copy.ui)}</em>
                    </a>
                  </li>
                ))}
              </ol>
            </section>

            <PracticeCompletion slug={lesson.slug} labels={course.copy.ui} />

            <nav className={base.lessonPager} aria-label={course.copy.ui.lessons} data-course-lesson-nav>
              {previous ? (
                <Link href={hrefFor(previous.slug)} rel="prev">
                  <span>{course.copy.ui.previous}</span><strong>{previous.copy.title}</strong>
                </Link>
              ) : <span />}
              {next ? (
                <Link href={hrefFor(next.slug)} rel="next">
                  <span>{course.copy.ui.next}</span><strong>{next.copy.title}</strong>
                </Link>
              ) : (
                <Link href={`/${course.locale}/rag/`}>
                  <span>{course.copy.ui.backToCourse}</span><strong>{course.copy.meta.title}</strong>
                </Link>
              )}
            </nav>
          </article>
        </div>
      </div>
    </div>
  );
}
