import Link from "next/link";
import type {
  AgentOrchestrationSourceKind,
  MaterializedAgentOrchestrationCourse,
} from "@/lib/agent-orchestration";
import CourseNavigator from "./CourseNavigator";
import { CourseWorkspacePortability } from "./CourseWorkspacePortability";
import { CourseProgress } from "./CourseProgress";
import { CourseTopology } from "./OrchestrationMap";
import styles from "./AgentOrchestrationCourse.module.css";
import CourseShell from "../course-shell/CourseShell";
import navigationStyles from "./CourseNavigation.module.css";

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
  const moduleCheckpoints = course.modules.map(({ slug, copy }) => ({
    slug,
    checkpoint: copy.checkpoint,
  }));
  const totalMinutes = course.modules.reduce((sum, module) => sum + module.minutes, 0);
  const uniqueSources = Array.from(new Map(
    course.modules.flatMap((module) => module.sources).map((source) => [source.id, source]),
  ).values());
  const kindCounts = new Map<AgentOrchestrationSourceKind, number>();
  for (const source of uniqueSources) {
    kindCounts.set(source.kind, (kindCounts.get(source.kind) ?? 0) + 1);
  }

  return (
    <div
      className={`shellwrap ${styles.root} ${navigationStyles.overviewPage}`}
      lang={course.contentLocale}
      dir={course.contentDirection}
      data-testid="agent-orchestration-course"
    >
      {course.locale !== course.contentLocale ? (
        <p className={styles.languageNotice}>{course.copy.meta.translationNote}</p>
      ) : null}

      <nav
        className={styles.topBreadcrumb}
        aria-label={label(
          course.copy.ui,
          "breadcrumb",
          course.contentLocale === "zh-Hans" ? "面包屑导航" : "Breadcrumb",
        )}
      >
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
            <CourseProgress
              labels={course.copy.ui}
              compact
              locale={course.locale}
              moduleCheckpoints={moduleCheckpoints}
              showJourneyAction
              startLabel={course.copy.meta.startCta}
              resumeLabel={course.copy.meta.resumeCta}
            />
            <a className={styles.secondaryAction} href="#agent-orchestration-curriculum">
              {label(course.copy.ui, "explore", "Explore the system")}
            </a>
          </div>
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
            moduleCheckpoints={moduleCheckpoints}
          />
        </aside>
      </header>

      <CourseNavigator
        contentLocale={course.contentLocale}
        current="overview"
        locale={course.locale}
      />

      <section
        className={`${styles.coursePromise} ${navigationStyles.compactSection}`}
        aria-labelledby="course-promise-title"
      >
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

      <div className={navigationStyles.compactSection}>
        <CourseProgress labels={course.copy.ui} moduleCheckpoints={moduleCheckpoints} />
      </div>

      <CourseWorkspacePortability labels={course.copy.ui} />

      <div className={navigationStyles.compactSection}>
        <CourseTopology course={course} />
      </div>

      <section
        className={`${styles.curriculum} ${navigationStyles.compactSection}`}
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
                    <Link href={hrefFor(module.slug)} prefetch={false}>
                      <span className={styles.moduleOrder}>{String(module.order).padStart(2, "0")}</span>
                      <span className={`${styles.moduleCopy} ${navigationStyles.compactModuleCopy}`}>
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

      <aside
        className={`${styles.integrity} ${navigationStyles.compactSection}`}
        id="agent-orchestration-sources"
        aria-labelledby="course-integrity-title"
      >
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
        <section className={styles.sourceLedger} aria-labelledby="course-source-register-title">
          <p className={styles.sectionLabel} id="course-source-register-title">{label(course.copy.ui, "sourceRegister", "Evidence register")}</p>
          <strong>{uniqueSources.length}</strong>
          <span>{label(course.copy.ui, "sourceRegisterCount", "unique linked records")}</span>
          <dl>
            {Array.from(kindCounts.entries()).map(([kind, count]) => (
              <div key={kind}><dt>{sourceKindLabel(kind, course.contentLocale)}</dt><dd>{count}</dd></div>
            ))}
          </dl>
        </section>
      </aside>

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
