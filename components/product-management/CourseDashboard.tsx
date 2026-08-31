import Link from "next/link";
import {
  PRODUCT_MANAGEMENT_CONCEPT_DOMAIN_IDS,
  type MaterializedProductManagementCourse,
  type ProductManagementSourceKind,
} from "@/lib/product-management";
import {
  CapstoneChecklist,
  CourseHeroActions,
  CourseProgress,
  FinalAssessment,
  type ProductManagementAssessmentQuestion,
} from "./Interactions";
import styles from "./ProductManagementCourse.module.css";
import CourseShell from "../course-shell/CourseShell";

type Labels = MaterializedProductManagementCourse["copy"]["ui"];

function label(labels: Labels, key: string, fallback: string): string {
  const value = labels[key];
  return value && value.trim() ? value : fallback;
}

function sourceKindLabel(kind: ProductManagementSourceKind): string {
  if (kind === "primary-course") return "Primary orientation";
  if (kind === "official-guidance") return "Official guidance";
  if (kind === "open-source") return "Open-source practice";
  if (kind === "research") return "Research";
  if (kind === "law") return "Law";
  return "Industry practice";
}

export default function CourseDashboard({
  course,
  catalogLabel,
}: {
  course: MaterializedProductManagementCourse;
  catalogLabel: string;
}) {
  const hrefFor = (slug: string) => `/${course.locale}/product-management/${slug}/`;
  const courseHref = `/${course.locale}/product-management/`;
  const journeyModules = course.modules.map((module) => ({
    slug: module.slug,
    href: hrefFor(module.slug),
    title: module.copy.title,
  }));
  const uniqueSources = Array.from(
    new Map(
      course.modules.flatMap((module) => module.sources).map((source) => [source.id, source]),
    ).values(),
  );
  const assessmentQuestions: readonly ProductManagementAssessmentQuestion[] =
    course.copy.finalAssessment.questions;
  const kindCounts = new Map<ProductManagementSourceKind, number>();
  for (const source of uniqueSources) {
    kindCounts.set(source.kind, (kindCounts.get(source.kind) ?? 0) + 1);
  }

  return (
    <div
      className={`shellwrap ${styles.root} ${styles.coursePage}`}
      lang={course.contentLocale}
      dir={course.contentDirection}
      data-testid="product-management-course-dashboard"
    >
      {course.locale !== course.contentLocale ? (
        <p className={styles.languageNotice}>{course.copy.meta.englishOnly}</p>
      ) : null}

      <nav className={styles.topBreadcrumb} aria-label={catalogLabel}>
        <Link href={`/${course.locale}/courses/`}>
          <span aria-hidden="true">←</span>
          {catalogLabel}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{label(course.copy.ui, "course", "Course")} 14</span>
      </nav>
      <header className={styles.courseHero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>{course.copy.meta.kicker}</p>
          <h1>{course.copy.meta.title}</h1>
          <p className={styles.heroSummary}>{course.copy.meta.summary}</p>

          <CourseHeroActions
            modules={journeyModules}
            labels={course.copy.ui}
            startLabel={course.copy.meta.startCta}
            resumeLabel={course.copy.meta.resumeCta}
            reviewLabel={course.copy.meta.reviewCta}
            mapLabel={label(course.copy.ui, "tableOfContents", "Explore the course map")}
          />

          <p className={styles.heroAudience}>{course.copy.meta.audience}</p>

          <ul className={styles.principleList} aria-label="Course operating principles">
            {course.copy.principles.map((principle) => (
              <li key={principle}>{principle}</li>
            ))}
          </ul>
        </div>

        <section className={styles.loopPanel} aria-labelledby="product-loop-title">
          <div className={styles.loopHeader}>
            <p className={styles.sectionLabel}>The product loop</p>
            <h2 id="product-loop-title">Four stages, one inspectable decision system</h2>
            <p>Evidence moves forward. Outcomes and failures feed the next cycle.</p>
          </div>
          <ol className={styles.loopList}>
            {course.phases.map((phase) => (
              <li key={phase.id}>
                <Link href={hrefFor(phase.modules[0].slug)}>
                  <span className={styles.loopNumber}>
                    {String(phase.order).padStart(2, "0")}
                  </span>
                  <span className={styles.loopCopy}>
                    <small>{phase.copy.verb}</small>
                    <strong>{phase.copy.title}</strong>
                    <span>{phase.modules.length} modules</span>
                  </span>
                  <span aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ol>
          <p className={styles.loopFootnote}>
            <span aria-hidden="true">↺</span>
            Launch evidence returns to discovery and strategy.
          </p>
        </section>
      </header>

      <CourseShell courseId="product-management" locale={course.locale} showBreadcrumb={false} />

      <section className={styles.courseFacts} aria-label="Course facts">
        <dl>
          <div>
            <dt>{label(course.copy.ui, "modules", "Modules")}</dt>
            <dd>{course.modules.length}</dd>
          </div>
          <div>
            <dt>{label(course.copy.ui, "phase", "Stages")}</dt>
            <dd>{course.phases.length}</dd>
          </div>
          <div>
            <dt>{label(course.copy.ui, "conceptMap", "Domains")}</dt>
            <dd>{PRODUCT_MANAGEMENT_CONCEPT_DOMAIN_IDS.length}</dd>
          </div>
          <div>
            <dt>{label(course.copy.ui, "milestones", "Milestones")}</dt>
            <dd>{course.modules.length + 2}</dd>
          </div>
        </dl>
      </section>

      <CourseProgress
        modules={journeyModules}
        labels={course.copy.ui}
        startLabel={course.copy.meta.startCta}
        resumeLabel={course.copy.meta.resumeCta}
        reviewLabel={course.copy.meta.reviewCta}
      />

      <section className={styles.outcomes} aria-labelledby="product-management-outcomes-title">
        <header className={styles.sectionIntro}>
          <p className={styles.kicker}>End-to-end capability</p>
          <h2 id="product-management-outcomes-title">What you will be able to decide and deliver</h2>
          <p>
            The course is organized around decisions you can defend, not vocabulary you can repeat.
          </p>
        </header>
        <ol>
          {course.copy.outcomes.map((outcome, index) => (
            <li key={outcome}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{outcome}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.domainCoverage} aria-labelledby="domain-coverage-title">
        <header className={styles.sectionIntro}>
          <p className={styles.kicker}>Coverage ledger</p>
          <h2 id="domain-coverage-title">Fourteen product-management domains</h2>
          <p>
            Open a domain to inspect its core concepts and where it appears in the curriculum.
          </p>
        </header>
        <div className={styles.domainGrid}>
          {PRODUCT_MANAGEMENT_CONCEPT_DOMAIN_IDS.map((domainId, index) => {
            const domain = course.copy.conceptDomains[domainId];
            const matchedModules = course.modules.filter((module) =>
              module.conceptDomainIds.includes(domainId)
            );
            return (
              <details key={domainId}>
                <summary>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{domain.title}</strong>
                  <small>{matchedModules.length} modules</small>
                </summary>
                <div>
                  <p>{domain.summary}</p>
                  <ul className={styles.tagList} aria-label={`${domain.title} concepts`}>
                    {domain.concepts.map((concept) => <li key={concept}>{concept}</li>)}
                  </ul>
                  <p className={styles.domainModules}>
                    <strong>Course links:</strong>{" "}
                    {matchedModules.map((module, moduleIndex) => (
                      <span key={module.slug}>
                        {moduleIndex ? ", " : ""}
                        <Link
                          href={hrefFor(module.slug)}
                          aria-label={`${module.copy.title}, module ${module.order}`}
                        >
                          {String(module.order).padStart(2, "0")}
                        </Link>
                      </span>
                    ))}
                  </p>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <section
        className={styles.curriculum}
        id="product-management-curriculum"
        aria-labelledby="product-management-curriculum-title"
      >
        <header className={styles.sectionIntro}>
          <p className={styles.kicker}>Curriculum</p>
          <h2 id="product-management-curriculum-title">A decision notebook in fourteen modules</h2>
          <p>
            Each module links evidence to a decision, a practical artifact, a review gate, and a checkpoint.
          </p>
        </header>

        <div className={styles.phaseList}>
          {course.phases.map((phase) => (
            <section key={phase.id} aria-labelledby={`phase-${phase.id}-title`}>
              <header className={styles.phaseHeading}>
                <span>{String(phase.order).padStart(2, "0")}</span>
                <div>
                  <p>{phase.copy.verb}</p>
                  <h3 id={`phase-${phase.id}-title`}>{phase.copy.title}</h3>
                  <p>{phase.copy.summary}</p>
                </div>
              </header>
              <ol className={styles.moduleList}>
                {phase.modules.map((module) => (
                  <li key={module.slug}>
                    <Link href={hrefFor(module.slug)}>
                      <span className={styles.moduleOrder}>
                        {String(module.order).padStart(2, "0")}
                      </span>
                      <span className={styles.moduleCopy}>
                        <strong>{module.copy.title}</strong>
                        <span>{module.copy.summary}</span>
                        <small>
                          {label(course.copy.ui, "artifact", "Artifact")}: {module.copy.artifact}
                        </small>
                      </span>
                      <span className={styles.moduleMeta}>
                        {module.minutes} {label(course.copy.ui, "minute", "min")}
                        <span aria-hidden="true">→</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </section>

      <FinalAssessment
        questions={assessmentQuestions}
        bankVersion={course.manifest.version}
        passPercent={course.copy.finalAssessment.passPercent}
        title={course.copy.finalAssessment.title}
        summary={course.copy.finalAssessment.summary}
        labels={course.copy.ui}
      />

      <section className={styles.capstoneIntro} aria-labelledby="product-management-capstone-title">
        <div>
          <p className={styles.kicker}>{label(course.copy.ui, "capstone", "Capstone")}</p>
          <h2 id="product-management-capstone-title">{course.copy.capstone.title}</h2>
          <p>{course.copy.capstone.summary}</p>
        </div>
        <blockquote>{course.copy.capstone.scenario}</blockquote>
      </section>

      <CapstoneChecklist
        artifacts={course.copy.capstone.artifacts}
        statement={course.copy.capstone.completionStatement}
        labels={course.copy.ui}
      />

      <section className={styles.reviewQuestions} aria-labelledby="capstone-review-title">
        <p className={styles.sectionLabel}>Cross-functional defense</p>
        <h3 id="capstone-review-title">Questions your review panel should ask</h3>
        <ol>
          {course.copy.capstone.reviewQuestions.map((question, index) => (
            <li key={question}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{question}</p>
            </li>
          ))}
        </ol>
      </section>

      <aside className={styles.integrity} aria-labelledby="course-integrity-title">
        <div className={styles.integrityCopy}>
          <p className={styles.kicker}>{label(course.copy.ui, "rightsBoundary", "Source and rights boundary")}</p>
          <h2 id="course-integrity-title">Evidence is linked. Authority is bounded.</h2>
          <p>{course.copy.meta.evidenceNote}</p>
          <p>{course.copy.meta.prerequisite}</p>
          <ul>
            <li>Every lesson section links directly to the sources that support it.</li>
            <li>Source records distinguish support from limitations and include an access date.</li>
            <li>License information is shown only when the source states it; a link is not a reuse license.</li>
          </ul>
        </div>
        <div className={styles.sourceLedger} aria-label="Course source mix">
          <p className={styles.sectionLabel}>Source register</p>
          <strong>{uniqueSources.length}</strong>
          <span>unique linked records</span>
          <dl>
            {Array.from(kindCounts.entries()).map(([kind, count]) => (
              <div key={kind}>
                <dt>{sourceKindLabel(kind)}</dt>
                <dd>{count}</dd>
              </div>
            ))}
          </dl>
        </div>
      </aside>

      <p className={styles.backLink}>
        <Link href={`/${course.locale}/courses/`}>
          <span aria-hidden="true">←</span>
          {catalogLabel}
        </Link>
        <Link href={courseHref}>Course 14</Link>
      </p>
    </div>
  );
}
