import Link from "next/link";
import type { ReactNode } from "react";
import type {
  CourseKitCourseId,
  CourseKitMaterialisedCourse,
} from "@/lib/course-kit/types";
import { CourseCapstone } from "./CourseCapstone";
import { CourseLanguageNotice } from "./CourseLanguageNotice";
import CourseShell from "../course-shell/CourseShell";
import {
  CourseContinueLink,
  CourseMilestoneLinks,
  CourseModuleIndicator,
} from "./CourseJourney";
import { CourseProgress } from "./CourseProgress";
import { CourseQuiz } from "./CourseQuiz";
import { SourceRegister } from "./SourceRegister";
import styles from "./CourseKit.module.css";

export interface CourseDashboardProps {
  readonly course: CourseKitMaterialisedCourse;
  /** Locale-independent route segment; defaults to the course ID. */
  readonly coursePath?: string;
  readonly catalogHref?: string;
  /** Optional course-specific studio, assembled by the Server Component route. */
  readonly supplement?: ReactNode;
  /** Require reviewable hash-and-validator receipts before artifact completion. */
  readonly requireStructuredReceipts?: boolean;
  /** Optional dedicated destinations that keep a long course overview focused. */
  readonly sectionHrefs?: {
    readonly assessment: string;
    readonly capstone: string;
    readonly sources: string;
  };
}

export function CourseDashboard({
  course,
  coursePath = course.id,
  catalogHref = `/${course.locale.requestedLocale}/courses/`,
  supplement,
  requireStructuredReceipts = false,
  sectionHrefs,
}: CourseDashboardProps) {
  const courseHref = `/${course.locale.requestedLocale}/${coursePath}/`;
  const moduleHref = (slug: string) => `${courseHref}${slug}/`;
  const firstModule = course.modules[0];
  const totalMinutes = course.modules.reduce(
    (sum, module) => sum + module.minutes,
    0,
  );

  return (
    <div
      className={`shellwrap ${styles.root}`}
      lang={course.locale.contentLocale}
      dir={course.locale.contentDirection}
      data-course-kit={course.id}
      data-course-number={course.displayNumber}
    >
      <CourseLanguageNotice course={course} />
      <CourseShell
        courseId={course.id as CourseKitCourseId}
        locale={course.locale.requestedLocale}
        compact
        allowBlockedPreview
      />

      <nav className={styles.breadcrumb} aria-label={course.copy.ui.courseMap}>
        <Link href={catalogHref}>
          <span aria-hidden="true">←</span>
          {course.copy.ui.catalog}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">
          {course.copy.ui.course} {course.displayNumber}
        </span>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{course.copy.meta.kicker}</p>
          <h1>{course.copy.meta.title}</h1>
          <p className={styles.heroSummary}>{course.copy.meta.summary}</p>
          <div className={styles.heroActions}>
            {firstModule ? (
              <CourseContinueLink
                config={course.progress}
                courseHref={courseHref}
                modules={course.modules.map((module) => ({
                  slug: module.slug,
                  order: module.order,
                  title: module.copy.title,
                }))}
                labels={course.copy.ui}
                startLabel={course.copy.meta.startCta}
                resumeLabel={course.copy.meta.resumeCta}
                assessmentHref={sectionHrefs?.assessment ?? "#final-assessment"}
                capstoneHref={sectionHrefs?.capstone ?? "#capstone"}
              />
            ) : null}
            <a className={styles.secondaryButton} href="#curriculum">
              {course.copy.ui.courseMap}
            </a>
          </div>
        </div>
        <aside className={styles.heroPanel} aria-label={course.copy.ui.courseProgress}>
          <p>
            {course.copy.ui.course} {course.displayNumber}
          </p>
          <strong>v{course.version}</strong>
          <dl>
            <div>
              <dt>{course.copy.ui.modules}</dt>
              <dd>{course.modules.length}</dd>
            </div>
            <div>
              <dt>{course.copy.ui.phases}</dt>
              <dd>{course.phases.length}</dd>
            </div>
            <div>
              <dt>{course.copy.ui.duration}</dt>
              <dd>{totalMinutes} {course.copy.ui.minutes}</dd>
            </div>
          </dl>
          <CourseProgress
            config={course.progress}
            labels={course.copy.ui}
            compact
            idSuffix="hero"
          />
        </aside>
      </header>

      <section className={styles.scope} aria-labelledby={`${course.id}-scope-title`}>
        <header>
          <p className={styles.eyebrow}>{course.copy.ui.course}</p>
          <h2 id={`${course.id}-scope-title`}>{course.copy.ui.principles}</h2>
        </header>
        <dl className={styles.scopeFacts}>
          <div>
            <dt>{course.copy.ui.audience}</dt>
            <dd>{course.copy.meta.audience}</dd>
          </div>
          <div>
            <dt>{course.copy.ui.prerequisite}</dt>
            <dd>{course.copy.meta.prerequisite}</dd>
          </div>
          <div>
            <dt>{course.copy.ui.level}</dt>
            <dd>{course.copy.meta.level}</dd>
          </div>
        </dl>
        <ol className={styles.principles} data-count={course.copy.principles.length}>
          {course.copy.principles.map((principle, index) => (
            <li key={principle}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <p>{principle}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        className={styles.curriculum}
        id="curriculum"
        aria-labelledby={`${course.id}-curriculum-title`}
      >
        <header className={styles.sectionIntro}>
          <p className={styles.eyebrow}>{course.copy.ui.curriculum}</p>
          <h2 id={`${course.id}-curriculum-title`}>{course.copy.ui.courseMap}</h2>
          <p>{course.copy.ui.curriculumIntro}</p>
        </header>
        <div className={styles.phaseList}>
          {course.phases.map((phase) => (
            <section key={phase.id} aria-labelledby={`phase-${course.id}-${phase.id}`}>
              <header>
                <span aria-hidden="true">{String(phase.order).padStart(2, "0")}</span>
                <div>
                  <h3 id={`phase-${course.id}-${phase.id}`}>{phase.title}</h3>
                  <p>{phase.summary}</p>
                </div>
              </header>
              <ol className={styles.moduleList}>
                {phase.moduleSlugs.map((slug) => {
                  const courseModule = course.modules.find(
                    (candidate) => candidate.slug === slug,
                  );
                  if (!courseModule) return null;
                  return (
                    <li key={courseModule.slug}>
                      <Link href={moduleHref(courseModule.slug)}>
                        <span className={styles.moduleOrder} aria-hidden="true">
                          {String(courseModule.order).padStart(2, "0")}
                        </span>
                        <span>
                          <strong>{courseModule.copy.title}</strong>
                          <small>{courseModule.copy.summary}</small>
                          <em>
                            {course.copy.ui.artifact}: {courseModule.copy.artifact}
                          </em>
                        </span>
                        <span className={styles.moduleTail}>
                          <CourseModuleIndicator
                            config={course.progress}
                            moduleSlug={courseModule.slug}
                            labels={course.copy.ui}
                          />
                          <span className={styles.moduleMinutes}>
                            {courseModule.minutes} {course.copy.ui.minutes}
                            <span aria-hidden="true"> →</span>
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </section>

      {supplement}

      <section className={styles.outcomes} aria-labelledby={`${course.id}-outcomes-title`}>
        <header>
          <p className={styles.eyebrow}>{course.copy.ui.learningOutcomes}</p>
          <h2 id={`${course.id}-outcomes-title`}>{course.copy.ui.learningOutcomes}</h2>
        </header>
        <ol>
          {course.copy.outcomes.map((outcome, index) => (
            <li key={outcome}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <p>{outcome}</p>
            </li>
          ))}
        </ol>
      </section>

      <div id="course-progress">
        <CourseProgress
          config={course.progress}
          labels={course.copy.ui}
          idSuffix="overview"
        />
      </div>
      {sectionHrefs ? (
        <section
          className={styles.finishLine}
          aria-labelledby={`${course.id}-finish-line-title`}
        >
          <header className={styles.sectionIntro}>
            <p className={styles.eyebrow}>{course.copy.ui.courseProgress}</p>
            <h2 id={`${course.id}-finish-line-title`}>{course.copy.ui.finishCourse}</h2>
            <p>{course.copy.ui.curriculumIntro}</p>
          </header>
          <CourseMilestoneLinks
            config={course.progress}
            labels={course.copy.ui}
            assessmentHref={sectionHrefs.assessment}
            assessmentTitle={course.quiz.title}
            capstoneHref={sectionHrefs.capstone}
            capstoneTitle={course.capstone.title}
            sourcesHref={sectionHrefs.sources}
            sourceCount={course.sources.length}
          />
        </section>
      ) : (
        <>
          <CourseQuiz quiz={course.quiz} config={course.progress} labels={course.copy.ui} />
          <CourseCapstone
            capstone={course.capstone}
            config={course.progress}
            labels={course.copy.ui}
            requireStructuredReceipts={requireStructuredReceipts}
          />
          <SourceRegister
            sources={course.sources}
            labels={course.copy.ui}
            titleId={`${course.id}-sources-title`}
            locale={course.locale.contentLocale}
          />
        </>
      )}

      <nav className={styles.bottomNav} aria-label={course.copy.ui.catalog}>
        <Link href={catalogHref}>
          <span aria-hidden="true">←</span>
          {course.copy.ui.catalog}
        </Link>
      </nav>
    </div>
  );
}

export default CourseDashboard;
