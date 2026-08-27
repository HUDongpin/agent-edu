import Link from "next/link";
import type {
  AgentOrchestrationSourceKind,
  MaterializedAgentOrchestrationCourse,
} from "@/lib/agent-orchestration";
import {
  CapstoneChecklist,
  CourseProgress,
  FinalAssessment,
} from "./Interactions";
import { CourseTopology, RuntimeSemanticsLedger } from "./OrchestrationMap";
import styles from "./AgentOrchestrationCourse.module.css";
import CourseShell from "../course-shell/CourseShell";

function label(
  labels: Readonly<Record<string, string>>,
  key: string,
  fallback: string,
): string {
  const value = labels[key];
  return value && value.trim() ? value : fallback;
}

function sourceKindLabel(
  kind: AgentOrchestrationSourceKind,
  contentLocale: string,
): string {
  const chinese = contentLocale === "zh-Hans";
  switch (kind) {
    case "openai-official": return chinese ? "OpenAI 官方" : "OpenAI official";
    case "anthropic-official": return chinese ? "Anthropic 官方" : "Anthropic official";
    case "claude-academy": return "Claude Academy";
    case "open-standard": return chinese ? "开放标准" : "Open standard";
    case "official-sdk-docs": return chinese ? "官方 SDK 文档" : "Official SDK docs";
    case "engineering-official": return chinese ? "工程权威资料" : "Engineering authority";
    case "official-github": return chinese ? "官方 GitHub" : "Official GitHub";
    case "community-github-case": return chinese ? "有界 GitHub 案例" : "Bounded GitHub case";
  }
  const exhaustive: never = kind;
  return exhaustive;
}

export default function CourseDashboard({
  course,
  catalogLabel,
}: {
  course: MaterializedAgentOrchestrationCourse;
  catalogLabel: string;
}) {
  const courseHref = `/${course.locale}/agent-orchestration/`;
  const hrefFor = (slug: string) => `/${course.locale}/agent-orchestration/${slug}/`;
  const totalMinutes = course.modules.reduce((sum, module) => sum + module.minutes, 0);
  const assessmentQuestions = course.modules.map((module) => module.copy.checkpoint);
  const uniqueSources = Array.from(new Map(
    course.modules.flatMap((module) => module.sources).map((source) => [source.id, source]),
  ).values());
  const kindCounts = new Map<AgentOrchestrationSourceKind, number>();
  for (const source of uniqueSources) {
    kindCounts.set(source.kind, (kindCounts.get(source.kind) ?? 0) + 1);
  }

  return (
    <div
      className={`shellwrap ${styles.root}`}
      lang={course.contentLocale}
      dir={course.contentDirection}
      data-testid="agent-orchestration-course"
    >
      {course.locale !== course.contentLocale ? (
        <p className={styles.languageNotice}>{course.copy.meta.translationNote}</p>
      ) : null}

      <nav className={styles.topBreadcrumb} aria-label={label(course.copy.ui, "courseMap", "Course map")}>
        <Link
          href={`/${course.locale}/courses/`}
          lang={course.locale !== course.contentLocale ? course.locale : undefined}
          dir={course.locale === "ar" ? "rtl" : undefined}
        >
          <span aria-hidden="true">←</span>
          {catalogLabel}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{label(course.copy.ui, "course", "Course 15")}</span>
      </nav>
      <CourseShell courseId="agent-orchestration" locale={course.locale} showBreadcrumb={false} />

      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.heroEyebrow}>
            <span>{label(course.copy.ui, "course", "Course 15")}</span>
            <span>v{course.manifest.version}</span>
            <span>{label(course.copy.ui, "researchGrounded", "Research-grounded")}</span>
          </div>
          <p className={styles.kicker}>{course.copy.meta.kicker}</p>
          <h1>{course.copy.meta.title}</h1>
          <p className={styles.heroSummary}>{course.copy.meta.summary}</p>
          <div className={styles.heroActions}>
            <a className={styles.secondaryAction} href="#agent-orchestration-curriculum">
              {label(course.copy.ui, "explore", "Explore the system")}
            </a>
          </div>
          <dl className={styles.heroFacts}>
            <div><dt>{label(course.copy.ui, "duration", "Duration")}</dt><dd>{course.copy.meta.duration}</dd></div>
            <div><dt>{label(course.copy.ui, "modules", "Modules")}</dt><dd>{course.modules.length}</dd></div>
            <div><dt>{label(course.copy.ui, "level", "Level")}</dt><dd>{course.copy.meta.level}</dd></div>
            <div><dt>{label(course.copy.ui, "language", "Content")}</dt><dd>{course.contentLocale}</dd></div>
          </dl>
        </div>
        <aside className={styles.heroConsole} aria-label={label(course.copy.ui, "orchestrationControl", "Orchestration control")}>
          <div className={styles.consoleTop}>
            <span>{label(course.copy.ui, "orchestrationControl", "Orchestration control")}</span>
            <i />
            <span>{label(course.copy.ui, "ready", "Ready")}</span>
          </div>
          <div className={styles.consoleMetric}>
            <span>{label(course.copy.ui, "studyLoad", "Study load")}</span>
            <strong>
              {Math.floor(totalMinutes / 60)}
              <small>{course.contentLocale === "zh-Hans" ? "小时" : "h"}</small>{" "}
              {totalMinutes % 60}
              <small>{course.contentLocale === "zh-Hans" ? "分" : "m"}</small>
            </strong>
          </div>
          <div className={styles.consoleGrid}>
            <div><span>{label(course.copy.ui, "phases", "Phases")}</span><strong>04</strong></div>
            <div><span>{label(course.copy.ui, "modules", "Modules")}</span><strong>15</strong></div>
            <div><span>{label(course.copy.ui, "labModes", "Lab modes")}</span><strong>06</strong></div>
            <div><span>{label(course.copy.ui, "capstone", "Capstone")}</span><strong>15</strong></div>
          </div>
          <div className={styles.consoleTrace} aria-hidden="true">
            {[31, 56, 43, 74, 50, 88, 66, 93, 71, 100].map((height, index) => (
              <i key={`${height}-${index}`} style={{ height: `${height}%` }} />
            ))}
          </div>
          <CourseProgress
            labels={course.copy.ui}
            compact
            locale={course.locale}
            showJourneyAction
            startLabel={course.copy.meta.startCta}
            resumeLabel={course.copy.meta.resumeCta}
          />
        </aside>
      </header>

      <section className={styles.coursePromise} aria-labelledby="course-promise-title">
        <header>
          <p className={styles.sectionLabel}>{label(course.copy.ui, "scopeContract", "The scope contract")}</p>
          <h2 id="course-promise-title">{label(course.copy.ui, "scopeTitle", "Comprehensive production practice, with every boundary visible")}</h2>
        </header>
        <div className={styles.promiseGrid}>
          <p>{course.copy.meta.audience}</p>
          <p>{course.copy.meta.prerequisite}</p>
          <p>{course.copy.meta.evidenceNote}</p>
        </div>
        <ol className={styles.principleStrip}>
          {course.copy.principles.map((principle, index) => (
            <li key={principle}><span>0{index + 1}</span><p>{principle}</p></li>
          ))}
        </ol>
      </section>

      <CourseTopology course={course} />

      <section className={styles.boundaryMatrix} aria-labelledby="boundary-matrix-title">
        <header className={styles.sectionIntro}>
          <p className={styles.kicker}>{label(course.copy.ui, "distinctions", "Boundary vocabulary")}</p>
          <h2 id="boundary-matrix-title">{label(course.copy.ui, "boundaryTitle", "Six distinctions that prevent category errors")}</h2>
          <p>{label(course.copy.ui, "boundarySummary", "Each pair looks similar in a demo. In production, the difference changes ownership, persistence, authority, or evidence.")}</p>
        </header>
        <dl>
          {course.copy.distinctions.map(([term, distinction], index) => (
            <div key={term}>
              <dt><span>{String(index + 1).padStart(2, "0")}</span>{term}</dt>
              <dd>{distinction}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.runtimeSection} aria-labelledby="runtime-ledger-title">
        <header className={styles.sectionIntro}>
          <p className={styles.kicker}>{label(course.copy.ui, "runtimeSemantics", "Runtime-specific semantics")}</p>
          <h2 id="runtime-ledger-title">{label(course.copy.ui, "runtimeTitle", "Do not flatten five layers into ‘multi-agent’")}</h2>
          <p>{label(course.copy.ui, "runtimeSummary", "Protocol, provider API, SDK, application orchestration, deployment runtime, and model are separate claim layers.")}</p>
        </header>
        <RuntimeSemanticsLedger contentLocale={course.contentLocale} />
      </section>

      <section className={styles.patternAtlas} aria-labelledby="pattern-atlas-title">
        <header className={styles.sectionIntro}>
          <p className={styles.kicker}>{label(course.copy.ui, "patterns", "Pattern atlas")}</p>
          <h2 id="pattern-atlas-title">{label(course.copy.ui, "patternAtlasTitle", "Nine patterns, chosen by control need")}</h2>
          <p>{label(course.copy.ui, "patternAtlasSummary", "Patterns are not maturity levels. The best topology is the least autonomous one that meets an evaluated requirement.")}</p>
        </header>
        <div className={styles.patternGrid}>
          {Object.entries(course.copy.patterns).map(([id, pattern], index) => (
            <article key={id}>
              <div><span>{String(index + 1).padStart(2, "0")}</span><code>{id}</code></div>
              <h3>{pattern.title}</h3>
              <dl>
                <div><dt>{label(course.copy.ui, "control", "Control")}</dt><dd>{pattern.control}</dd></div>
                <div><dt>{label(course.copy.ui, "useWhen", "Use when")}</dt><dd>{pattern.bestWhen}</dd></div>
                <div><dt>{label(course.copy.ui, "stopWhen", "Stop when")}</dt><dd>{pattern.failureSignal}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section
        className={styles.curriculum}
        id="agent-orchestration-curriculum"
        aria-labelledby="agent-orchestration-curriculum-title"
      >
        <header className={styles.sectionIntro}>
          <p className={styles.kicker}>{label(course.copy.ui, "curriculum", "Curriculum")}</p>
          <h2 id="agent-orchestration-curriculum-title">{label(course.copy.ui, "curriculumTitle", "A production control system in fifteen modules")}</h2>
          <p>{label(course.copy.ui, "curriculumSummary", "Every module closes with an execution contract, an editable artifact, a deterministic lab, and one assessable boundary.")}</p>
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
                      <span className={styles.moduleOrder}>{String(module.order).padStart(2, "0")}</span>
                      <span className={styles.moduleCopy}>
                        <strong>{module.copy.title}</strong>
                        <span>{module.copy.summary}</span>
                        <small>{label(course.copy.ui, "artifact", "Artifact")}: {module.copy.artifact}</small>
                      </span>
                      <span className={styles.moduleMeta}>
                        {module.minutes} {course.contentLocale === "zh-Hans" ? "分钟" : "min"}
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

      <section className={styles.outcomes} aria-labelledby="outcomes-title">
        <header>
          <p className={styles.sectionLabel}>{label(course.copy.ui, "outcomes", "Observable outcomes")}</p>
          <h2 id="outcomes-title">{label(course.copy.ui, "outcomesTitle", "What you can defend after the course")}</h2>
        </header>
        <ol>
          {course.copy.outcomes.map((outcome, index) => (
            <li key={outcome}><span>{String(index + 1).padStart(2, "0")}</span><p>{outcome}</p></li>
          ))}
        </ol>
      </section>

      <FinalAssessment
        questions={assessmentQuestions}
        passPercent={course.copy.finalAssessment.passPercent}
        title={course.copy.finalAssessment.title}
        summary={course.copy.finalAssessment.summary}
        labels={course.copy.ui}
      />

      <section className={styles.capstoneIntro} aria-labelledby="agent-orchestration-capstone-title">
        <div>
          <p className={styles.kicker}>{label(course.copy.ui, "capstone", "Capstone")}</p>
          <h2 id="agent-orchestration-capstone-title">{course.copy.capstone.title}</h2>
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
        <p className={styles.sectionLabel}>{label(course.copy.ui, "accountableReview", "Accountable review")}</p>
        <h3 id="capstone-review-title">{label(course.copy.ui, "accountableReviewTitle", "Questions your release panel must answer")}</h3>
        <ol>
          {course.copy.capstone.reviewQuestions.map((question, index) => (
            <li key={question}><span>{String(index + 1).padStart(2, "0")}</span><p>{question}</p></li>
          ))}
        </ol>
      </section>

      <aside className={styles.integrity} aria-labelledby="course-integrity-title">
        <div className={styles.integrityCopy}>
          <p className={styles.kicker}>{label(course.copy.ui, "rightsBoundary", "Source and rights boundary")}</p>
          <h2 id="course-integrity-title">{label(course.copy.ui, "integrityTitle", "Evidence is linked. Product claims are dated. Assets are original.")}</h2>
          <p>{course.copy.meta.evidenceNote}</p>
          <ul>
            <li>{label(course.copy.ui, "integrityEvidenceModes", "Every teaching section identifies its evidence mode and links its supporting records.")}</li>
            <li>{label(course.copy.ui, "integrityBoundaries", "Every source states both the claim it supports and what it cannot establish.")}</li>
            <li>{label(course.copy.ui, "integrityUploads", "Private development inputs are excluded from the public evidence register and are not redistributed.")}</li>
          </ul>
          <a href="/courses/agent-orchestration/NOTICE.md">{label(course.copy.ui, "noticeCta", "Read the source and asset notice")} ↗</a>
        </div>
        <div className={styles.sourceLedger} aria-label={label(course.copy.ui, "sourceRegister", "Evidence register")}>
          <p className={styles.sectionLabel}>{label(course.copy.ui, "sourceRegister", "Evidence register")}</p>
          <strong>{uniqueSources.length}</strong>
          <span>{label(course.copy.ui, "sourceRegisterCount", "unique linked records")}</span>
          <dl>
            {Array.from(kindCounts.entries()).map(([kind, count]) => (
              <div key={kind}><dt>{sourceKindLabel(kind, course.contentLocale)}</dt><dd>{count}</dd></div>
            ))}
          </dl>
        </div>
      </aside>

      <CourseProgress labels={course.copy.ui} />

      <p className={styles.backLink}>
        <Link
          href={`/${course.locale}/courses/`}
          lang={course.locale !== course.contentLocale ? course.locale : undefined}
          dir={course.locale === "ar" ? "rtl" : undefined}
        ><span aria-hidden="true">←</span>{catalogLabel}</Link>
        <Link href={courseHref}>{label(course.copy.ui, "course", "Course 15")}</Link>
      </p>
    </div>
  );
}
