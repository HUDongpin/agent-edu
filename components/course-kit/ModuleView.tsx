import Link from "next/link";
import type { ReactNode } from "react";
import type {
  CourseKitMaterialisedCourse,
  CourseKitMaterialisedModule,
} from "@/lib/course-kit/types";
import { CourseLanguageNotice } from "./CourseLanguageNotice";
import { CourseModuleMap } from "./CourseJourney";
import { CourseProgress } from "./CourseProgress";
import { ModuleCheckpoint } from "./ModuleCheckpoint";
import { ModuleCompletion } from "./ModuleCompletion";
import { SourceRegister } from "./SourceRegister";
import styles from "./CourseKit.module.css";

export interface CourseModuleViewProps {
  readonly course: CourseKitMaterialisedCourse;
  readonly module: CourseKitMaterialisedModule;
  readonly coursePath?: string;
  /** Optional course-specific lab placed between instruction and practice. */
  readonly supplement?: ReactNode;
  /** Require a reviewable hash-and-validator receipt before completion. */
  readonly requireStructuredReceipt?: boolean;
  /** Dedicated destination after the final module, such as an assessment route. */
  readonly afterModulesHref?: string;
  readonly afterModulesTitle?: string;
  readonly capstoneHref?: string;
}

export function ModuleView({
  course,
  module,
  coursePath = course.id,
  supplement,
  requireStructuredReceipt = false,
  afterModulesHref,
  afterModulesTitle,
  capstoneHref,
}: CourseModuleViewProps) {
  const courseHref = `/${course.locale.requestedLocale}/${coursePath}/`;
  const previous = module.previousSlug
    ? course.modules.find((candidate) => candidate.slug === module.previousSlug)
    : undefined;
  const next = module.nextSlug
    ? course.modules.find((candidate) => candidate.slug === module.nextSlug)
    : undefined;
  const renderedSourceIds = new Set([
    ...module.sourceIds,
    ...module.copy.sections.flatMap((section) => section.sourceIds),
  ]);
  const moduleSources = [...renderedSourceIds]
    .map((sourceId) => course.sources.find((source) => source.id === sourceId))
    .filter((source): source is NonNullable<typeof source> => Boolean(source));
  const journeyPhases = course.phases.map((phase) => ({
    id: phase.id,
    title: phase.title,
    modules: phase.moduleSlugs.flatMap((slug) => {
      const candidate = course.modules.find((courseModule) => courseModule.slug === slug);
      return candidate
        ? [{ slug: candidate.slug, order: candidate.order, title: candidate.copy.title }]
        : [];
    }),
  }));

  return (
    <div
      className={`shellwrap ${styles.root} ${styles.modulePage}`}
      lang={course.locale.contentLocale}
      dir={course.locale.contentDirection}
      data-course-kit={course.id}
      data-course-module={module.slug}
    >
      <CourseLanguageNotice course={course} />

      <nav
        className={styles.breadcrumb}
        aria-label={`${course.copy.ui.course}: ${course.copy.ui.backToCourse}`}
      >
        <Link href={courseHref}>
          <span aria-hidden="true">←</span>
          {course.copy.ui.backToCourse}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">
          {course.copy.ui.module} {module.order}
        </span>
      </nav>

      <details className={styles.mobileCourseMap}>
        <summary>
          <span>{course.copy.ui.openCourseMap}</span>
          <span>
            {module.order}/{course.modules.length}
          </span>
        </summary>
        <nav aria-label={`${course.copy.ui.courseMap}: ${course.copy.ui.modules}`}>
          <CourseModuleMap
            phases={journeyPhases}
            activeSlug={module.slug}
            courseHref={courseHref}
            config={course.progress}
            labels={course.copy.ui}
            assessmentHref={afterModulesHref}
            capstoneHref={capstoneHref}
          />
        </nav>
      </details>

      <div className={styles.moduleLayout}>
        <aside className={styles.moduleSidebar}>
          <nav aria-label={`${course.copy.ui.courseMap}: ${course.copy.ui.modules}`}>
            <CourseModuleMap
              phases={journeyPhases}
              activeSlug={module.slug}
              courseHref={courseHref}
              config={course.progress}
              labels={course.copy.ui}
              assessmentHref={afterModulesHref}
              capstoneHref={capstoneHref}
            />
          </nav>
          <CourseProgress config={course.progress} labels={course.copy.ui} compact />
        </aside>

        <article className={styles.moduleArticle}>
          <header className={styles.moduleHero}>
            <div className={styles.moduleMeta}>
              <span>
                {course.copy.ui.module} {String(module.order).padStart(2, "0")}
              </span>
              <span>{module.phaseTitle}</span>
              <span>
                {module.minutes} {course.copy.ui.minutes}
              </span>
            </div>
            <p className={styles.eyebrow}>{module.copy.kicker}</p>
            <h1>{module.copy.title}</h1>
            <p className={styles.heroSummary}>{module.copy.summary}</p>
            <dl className={styles.moduleContract}>
              <div>
                <dt>{course.copy.ui.objective}</dt>
                <dd>{module.copy.objective}</dd>
              </div>
              <div>
                <dt>{course.copy.ui.artifact}</dt>
                <dd>{module.copy.artifact}</dd>
              </div>
            </dl>
          </header>

          <div className={styles.lessonSections}>
            {module.copy.sections.map((section, index) => (
              <section
                key={`${module.slug}-section-${index}`}
                aria-labelledby={`${module.slug}-section-${index}-title`}
              >
                <header>
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <p className={styles.evidenceMode}>
                      {course.copy.ui.evidenceModeLabels[section.evidenceMode]}
                    </p>
                    <h2 id={`${module.slug}-section-${index}-title`}>
                      {section.heading}
                    </h2>
                  </div>
                </header>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets ? (
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
                <p className={styles.sourceLinks}>
                  {section.sourceIds.map((sourceId) => (
                    <a href={`#source-${sourceId}`} key={sourceId}>
                      {course.copy.ui.source}: {
                        course.sources.find((source) => source.id === sourceId)?.title ?? sourceId
                      }
                    </a>
                  ))}
                </p>
              </section>
            ))}
          </div>

          {supplement}

          <section
            className={styles.practice}
            aria-labelledby={`${module.slug}-practice-title`}
          >
            <header>
              <p className={styles.eyebrow}>{course.copy.ui.practice}</p>
              <h2 id={`${module.slug}-practice-title`}>{module.copy.practice.title}</h2>
              <p>{module.copy.practice.brief}</p>
            </header>
            <div className={styles.practiceGrid}>
              <div>
                <h3>{course.copy.ui.steps}</h3>
                <ol>
                  {module.copy.practice.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
              <dl>
                <div>
                  <dt>{course.copy.ui.deliverable}</dt>
                  <dd>{module.copy.practice.deliverable}</dd>
                </div>
                <div>
                  <dt>{course.copy.ui.reviewGate}</dt>
                  <dd>{module.copy.practice.reviewGate}</dd>
                </div>
              </dl>
            </div>
          </section>

          <ModuleCheckpoint
            moduleSlug={module.slug}
            checkpoint={module.copy.checkpoint}
            config={course.progress}
            labels={course.copy.ui}
          />

          <aside className={styles.takeaway} aria-label={course.copy.ui.takeaway}>
            <span>{course.copy.ui.takeaway}</span>
            <p>{module.copy.takeaway}</p>
          </aside>

          <SourceRegister
            sources={moduleSources}
            labels={course.copy.ui}
            titleId={`${module.slug}-sources-title`}
            locale={course.locale.contentLocale}
          />

          <ModuleCompletion
            moduleSlug={module.slug}
            config={course.progress}
            labels={course.copy.ui}
            requireStructuredReceipt={requireStructuredReceipt}
          />

          <nav
            className={styles.modulePager}
            aria-label={`${course.copy.ui.previous} / ${course.copy.ui.next}`}
          >
            {previous ? (
              <Link href={`${courseHref}${previous.slug}/`} rel="prev">
                <span>{course.copy.ui.previous}</span>
                <strong>{previous.copy.title}</strong>
              </Link>
            ) : (
              <Link href={courseHref} rel="prev">
                <span>{course.copy.ui.backToCourse}</span>
                <strong>{course.copy.meta.title}</strong>
              </Link>
            )}
            {next ? (
              <Link href={`${courseHref}${next.slug}/`} rel="next">
                <span>{course.copy.ui.next}</span>
                <strong>{next.copy.title}</strong>
              </Link>
            ) : afterModulesHref ? (
              <Link href={afterModulesHref} rel="next">
                <span>{course.copy.ui.next}</span>
                <strong>{afterModulesTitle ?? course.copy.ui.finalAssessment}</strong>
              </Link>
            ) : (
              <Link href={courseHref}>
                <span>{course.copy.ui.backToCourse}</span>
                <strong>{course.copy.meta.title}</strong>
              </Link>
            )}
          </nav>
        </article>
      </div>
    </div>
  );
}

export default ModuleView;
