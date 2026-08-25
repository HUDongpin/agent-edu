import Link from "next/link";
import type {
  MaterializedGithubCourse,
  MaterializedGithubLesson,
} from "@/lib/github";
import CapstoneChecklist from "./CapstoneChecklist";
import CourseFigure from "./CourseFigure";
import GithubText from "./GithubText";
import LessonCompletion from "./LessonCompletion";
import base from "@/components/codex/CodexCourse.module.css";
import styles from "./GithubCourse.module.css";

export default function LessonView({
  course,
  lesson,
}: {
  course: MaterializedGithubCourse;
  lesson: MaterializedGithubLesson;
}) {
  const lessons = course.units.flatMap((unit) => unit.lessons);
  const lessonIndex = lessons.findIndex((item) => item.slug === lesson.slug);
  const previous = lessonIndex > 0 ? lessons[lessonIndex - 1] : null;
  const next =
    lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;
  const hrefFor = (slug: string) => `/${course.locale}/github/${slug}/`;

  return (
    <div
      className={`shellwrap ${base.lessonPage} ${styles.githubCourse}`}
      data-testid={`github-lesson-${lesson.slug}`}
    >
      <nav
        className={base.breadcrumbs}
        aria-label={course.copy.ui.backToCourse}
      >
        <Link href={`/${course.locale}/github/`}>
          <span className={base.backArrow} aria-hidden="true">
            ←
          </span>
          {course.copy.ui.backToCourse}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{lesson.copy.title}</span>
      </nav>

      <div className={base.lessonLayout}>
        <aside className={base.lessonRail}>
          <nav aria-label={course.copy.ui.allLessons}>
            <strong>{course.copy.ui.allLessons}</strong>
            {course.units.map((unit) => (
              <div className={base.railUnit} key={unit.id}>
                <p className={base.railGroup}>{unit.copy.title}</p>
                <ol>
                  {unit.lessons.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={hrefFor(item.slug)}
                        aria-current={
                          item.slug === lesson.slug ? "page" : undefined
                        }
                      >
                        <span>{item.order}</span>
                        {item.copy.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </nav>
        </aside>

        <div className={base.lessonMain}>
          <article>
            <header className={base.lessonHero}>
              <p className={base.kicker}>
                <GithubText text={lesson.copy.kicker} />
              </p>
              <h1>
                <GithubText text={lesson.copy.title} />
              </h1>
              <p className={base.lessonSummary}>
                <GithubText text={lesson.copy.summary} />
              </p>
              <dl className={base.lessonMeta}>
                <div>
                  <dt>{course.copy.ui.minutes}</dt>
                  <dd>{lesson.minutes}</dd>
                </div>
                <div>
                  <dt>{course.copy.ui.sources}</dt>
                  <dd>{lesson.sources.length}</dd>
                </div>
              </dl>
              <p className={styles.disclaimer}>{course.copy.meta.disclaimer}</p>
            </header>

            {lesson.slug === "teaching-capstone" ? (
              <aside
                className={styles.classroomAlert}
                aria-labelledby="github-classroom-notice-title"
              >
                <strong id="github-classroom-notice-title">
                  {course.copy.ui.classroomNotice}
                </strong>
                <p>
                  <GithubText text={lesson.copy.sections[1].body[0]} />
                </p>
              </aside>
            ) : null}

            <section
              className={base.objective}
              aria-labelledby="github-objective-title"
            >
              <h2 id="github-objective-title">{course.copy.ui.objectives}</h2>
              <p>
                <GithubText text={lesson.copy.objective} />
              </p>
            </section>

            <div className={base.lessonSections}>
              {lesson.sections.map((sectionManifest) => {
                const section = lesson.copy.sections[sectionManifest.copyIndex];
                return (
                  <section
                    key={section.heading}
                    aria-labelledby={`github-lesson-section-${sectionManifest.copyIndex}`}
                  >
                    <h2
                      id={`github-lesson-section-${sectionManifest.copyIndex}`}
                    >
                      <GithubText text={section.heading} />
                    </h2>
                    <div className={styles.sectionBody}>
                      {section.body.map((paragraph) => (
                        <p key={paragraph}>
                          <GithubText text={paragraph} />
                        </p>
                      ))}
                    </div>
                    {section.bullets?.length ? (
                      <ul className={styles.sectionBullets}>
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>
                            <GithubText text={bullet} />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {section.code ? (
                      <figure className={styles.codePanel}>
                        <figcaption>
                          <GithubText text={section.code.label} />
                        </figcaption>
                        <pre dir="ltr">
                          <code>{section.code.value}</code>
                        </pre>
                      </figure>
                    ) : null}
                    {sectionManifest.figureIds.map((figureId) => {
                      const figure = lesson.figures.find(
                        (candidate) => candidate.manifest.id === figureId,
                      );
                      if (!figure)
                        throw new Error(
                          `Missing materialized GitHub figure ${figureId}`,
                        );
                      return (
                        <CourseFigure
                          figure={figure}
                          sourceLabel={course.copy.ui.figureSource}
                          key={figureId}
                        />
                      );
                    })}
                  </section>
                );
              })}
            </div>

            <section
              className={base.practice}
              aria-labelledby="github-practice-title"
            >
              <header>
                <div>
                  <p className={base.kicker}>{course.copy.ui.practice}</p>
                  <h2 id="github-practice-title">
                    {lesson.copy.practice.title}
                  </h2>
                </div>
                <span>
                  {Math.max(20, Math.round(lesson.minutes * 0.45))}{" "}
                  {course.copy.ui.minutes}
                </span>
              </header>
              <p>
                <GithubText text={lesson.copy.practice.brief} />
              </p>
              <ol>
                {lesson.copy.practice.steps.map((step) => (
                  <li key={step}>
                    <GithubText text={step} />
                  </li>
                ))}
              </ol>
              <div className={base.evidenceList}>
                <h3>{course.copy.ui.evidence}</h3>
                <ul>
                  {lesson.copy.practice.evidence.map((item) => (
                    <li key={item}>
                      <GithubText text={item} />
                    </li>
                  ))}
                </ul>
              </div>
              <p className={base.safetyNote}>
                <GithubText text={lesson.copy.practice.safety} />
              </p>
            </section>

            <section
              className={base.checkpoint}
              aria-labelledby="github-checkpoint-title"
            >
              <h2 id="github-checkpoint-title">{course.copy.ui.checkpoint}</h2>
              <details>
                <summary>
                  <GithubText text={lesson.copy.checkpoint.prompt} />
                </summary>
                <p>
                  <GithubText text={lesson.copy.checkpoint.answer} />
                </p>
              </details>
            </section>

            <div className={base.takeaway}>
              <p>
                <GithubText text={lesson.copy.takeaway} />
              </p>
            </div>

            {lesson.slug === "teaching-capstone" ? (
              <CapstoneChecklist
                copy={course.copy.capstone}
                labels={course.copy.ui}
              />
            ) : null}

            <section
              className={base.sources}
              aria-labelledby="github-sources-title"
            >
              <h2 id="github-sources-title">{course.copy.ui.sources}</h2>
              <ol>
                {lesson.sources.map((source) => (
                  <li key={source.id}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className={styles.sourceDetails}>
                        <strong dir="auto">{source.title}</strong>
                        <span dir="auto">{source.publisher}</span>
                        <span className={styles.sourceMeta}>
                          <span dir="ltr">{source.accessedOn}</span>
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
            </section>

            <LessonCompletion slug={lesson.slug} labels={course.copy.ui} />

            <nav
              className={base.lessonPager}
              aria-label={course.copy.ui.lessons}
              data-course-lesson-nav
            >
              {previous ? (
                <Link href={hrefFor(previous.slug)} rel="prev">
                  <span>{course.copy.ui.previous}</span>
                  <strong>{previous.copy.title}</strong>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link href={hrefFor(next.slug)} rel="next">
                  <span>{course.copy.ui.next}</span>
                  <strong>{next.copy.title}</strong>
                </Link>
              ) : (
                <Link href={`/${course.locale}/github/`}>
                  <span>{course.copy.ui.backToCourse}</span>
                  <strong>{course.copy.meta.title}</strong>
                </Link>
              )}
            </nav>
          </article>
        </div>
      </div>
    </div>
  );
}
