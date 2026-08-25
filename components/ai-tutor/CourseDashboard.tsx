import Link from "next/link";
import { formatAiTutorMessage, type MaterializedAiTutorCourse } from "@/lib/ai-tutor";
import ConceptMap from "./ConceptMap";
import {
  CapstoneChecklist,
  CourseProgress,
  FinalAssessment,
  type AiTutorAssessmentQuestion,
} from "./Interactions";
import base from "../prompts/PromptCourse.module.css";
import styles from "./AiTutorCourse.module.css";

export default function CourseDashboard({
  course,
  catalogLabel,
}: {
  course: MaterializedAiTutorCourse;
  catalogLabel: string;
}) {
  const hrefFor = (slug: string) => `/${course.locale}/ai-tutor/${slug}/`;
  const totalMinutes = course.modules.reduce((sum, module) => sum + module.minutes, 0);
  const assessmentQuestions: readonly AiTutorAssessmentQuestion[] = course.modules.map((module) => ({
    id: module.slug,
    moduleTitle: module.copy.title,
    ...module.copy.checkpoint,
  }));

  return (
    <div
      className={`shellwrap ${base.promptRoot} ${styles.aiTutorRoot} ${base.coursePage}`}
      lang={course.contentLocale}
      dir={course.contentDirection}
      data-testid="ai-tutor-course-dashboard"
    >
      {course.locale !== course.contentLocale ? (
        <p className={base.languageNotice}>{course.copy.meta.englishOnly}</p>
      ) : null}

      <header className={`${base.courseHero} ${styles.courseHero}`}>
        <div className={base.heroCopy}>
          <p className={base.kicker}>{course.copy.meta.kicker}</p>
          <h1>{course.copy.meta.title}</h1>
          <p className={base.heroSummary}>{course.copy.meta.summary}</p>
          <p className={base.heroAudience}>{course.copy.meta.audience}</p>
          <div className={base.heroPrinciples} role="list" aria-label={course.copy.ui.learningOutcomes}>
            {course.copy.principles.map((principle) => (
              <span role="listitem" key={principle}>{principle}</span>
            ))}
          </div>
        </div>
        <ConceptMap manifest={course.manifest} copy={course.copy} />
      </header>

      <section className={base.courseFacts} aria-label={course.copy.meta.title}>
        <div><small>{course.copy.ui.modules}</small><strong>{course.modules.length}</strong></div>
        <div><small>{course.copy.ui.minutes}</small><strong>{totalMinutes}</strong></div>
        <div><small>{course.copy.ui.phases}</small><strong>{course.phases.length}</strong></div>
        <p><strong>{course.copy.ui.evidenceBoundary}:</strong> {course.copy.meta.evidenceNote}</p>
      </section>

      <CourseProgress
        modules={course.modules.map((module) => ({
          slug: module.slug,
          href: hrefFor(module.slug),
        }))}
        labels={course.copy.ui}
        startLabel={course.copy.meta.startCta}
        resumeLabel={course.copy.meta.resumeCta}
      />

      <section className={styles.outcomes} aria-labelledby="ai-tutor-outcomes-title">
        <header>
          <p className={base.kicker}>{course.copy.ui.learningOutcomes}</p>
          <h2 id="ai-tutor-outcomes-title">{course.copy.ui.learningOutcomesTitle}</h2>
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

      <section className={base.curriculum} aria-labelledby="ai-tutor-curriculum-title">
        <header>
          <p className={base.kicker}>{course.copy.ui.allModules}</p>
          <h2 id="ai-tutor-curriculum-title">{course.copy.ui.curriculumTitle}</h2>
          <p>{course.copy.ui.curriculumIntro}</p>
        </header>
        <div className={base.unitList}>
          {course.phases.map((phase) => (
            <section className={base.unit} key={phase.id} aria-labelledby={`${phase.id}-phase-title`}>
              <div className={base.unitHeading}>
                <span>{String(phase.order).padStart(2, "0")}</span>
                <div>
                  <h3 id={`${phase.id}-phase-title`}>{phase.copy.title}</h3>
                  <p>{phase.copy.summary}</p>
                </div>
              </div>
              <ol className={base.lessonList}>
                {phase.modules.map((module) => (
                  <li key={module.slug}>
                    <Link href={hrefFor(module.slug)}>
                      <span className={base.lessonOrder}>{String(module.order).padStart(2, "0")}</span>
                      <span className={base.lessonCopy}>
                        <strong>{module.copy.title}</strong>
                        <span>{module.copy.summary}</span>
                        <em>{formatAiTutorMessage(course.copy.ui.artifactWithValue, {
                          artifact: module.copy.artifact,
                        })}</em>
                      </span>
                      <span className={base.lessonTime}>
                        {formatAiTutorMessage(course.copy.ui.minutesWithValue, {
                          minutes: module.minutes,
                        })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </section>

      <FinalAssessment questions={assessmentQuestions} labels={course.copy.ui} />

      <section className={styles.capstoneIntro} aria-labelledby="ai-tutor-capstone-title">
        <p className={base.kicker}>{course.copy.ui.capstone}</p>
        <h2 id="ai-tutor-capstone-title">{course.copy.capstone.title}</h2>
        <p>{course.copy.capstone.summary}</p>
        <p className={styles.capstoneScenario}>{course.copy.capstone.scenario}</p>
      </section>
      <CapstoneChecklist
        artifacts={course.copy.capstone.artifacts}
        statement={course.copy.capstone.completionStatement}
        labels={course.copy.ui}
      />
      <section className={styles.reviewQuestions} aria-labelledby="ai-tutor-review-questions-title">
        <h3 id="ai-tutor-review-questions-title">{course.copy.ui.capstoneReview}</h3>
        <ol>
          {course.copy.capstone.reviewQuestions.map((question) => <li key={question}>{question}</li>)}
        </ol>
      </section>

      <aside className={base.integrity} aria-labelledby="ai-tutor-integrity-title">
        <p className={base.kicker}>{course.copy.ui.courseIntegrity}</p>
        <h2 id="ai-tutor-integrity-title">{course.copy.ui.courseIntegrityTitle}</h2>
        <p>{course.copy.meta.evidenceNote}</p>
        <p>{course.copy.meta.prerequisite}</p>
      </aside>

      <p className={base.backLink}>
        <Link href={`/${course.locale}/courses/`}>
          <span aria-hidden="true">←</span>{catalogLabel}
        </Link>
      </p>
    </div>
  );
}
