import Link from "next/link";
import type {
  AgentOrchestrationEvidenceMode,
  AgentOrchestrationSourceKind,
  MaterializedAgentOrchestrationCourse,
  MaterializedAgentOrchestrationModule,
} from "@/lib/agent-orchestration";
import {
  CourseProgress,
  ModuleCheckpoint,
  ModuleCompletion,
} from "./Interactions";
import { ArtifactWorkbench } from "./ArtifactWorkbench";
import ActiveModuleMapReveal from "./ActiveModuleMapReveal";
import { OrchestrationLab } from "./OrchestrationLab";
import { ModuleContractMap } from "./OrchestrationMap";
import styles from "./AgentOrchestrationCourse.module.css";

type Labels = MaterializedAgentOrchestrationCourse["copy"]["ui"];

function label(labels: Labels, key: string, fallback: string): string {
  const value = labels[key];
  return value && value.trim() ? value : fallback;
}

function sourceKindLabel(kind: AgentOrchestrationSourceKind, locale: string): string {
  const chinese = locale === "zh-Hans";
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

function sourceStabilityLabel(stability: string, locale: string): string {
  if (locale !== "zh-Hans") return stability;
  if (stability === "stable-concept") return "稳定概念";
  if (stability === "current-documentation") return "当前文档";
  if (stability === "version-pinned") return "已固定版本";
  if (stability === "beta") return "Beta / 需复核";
  if (stability === "historical") return "历史资料";
  return stability;
}

function evidenceLabel(mode: AgentOrchestrationEvidenceMode, locale: string): string {
  const chinese = locale === "zh-Hans";
  if (mode === "source-grounded") return chinese ? "来源支持" : "SOURCE-GROUNDED";
  if (mode === "engineering-synthesis") return chinese ? "工程综合" : "ENGINEERING SYNTHESIS";
  return chinese ? "版本观察" : "VERSION WATCH";
}

export default function ModuleView({
  course,
  module,
}: {
  course: MaterializedAgentOrchestrationCourse;
  module: MaterializedAgentOrchestrationModule;
}) {
  const index = course.modules.findIndex((candidate) => candidate.slug === module.slug);
  const previous = index > 0 ? course.modules[index - 1] : null;
  const next = index < course.modules.length - 1 ? course.modules[index + 1] : null;
  const phase = course.phases.find((candidate) => candidate.id === module.phaseId);
  const courseHref = `/${course.locale}/agent-orchestration/`;
  const hrefFor = (slug: string) => `/${course.locale}/agent-orchestration/${slug}/`;
  if (!phase) return null;
  const chinese = course.contentLocale === "zh-Hans";
  const notebookItems = [
    { target: "module-learning", text: chinese ? "学习" : "Learn" },
    { target: "module-contract", text: label(course.copy.ui, "contract", chinese ? "执行契约" : "Contract") },
    { target: "module-artifact", text: label(course.copy.ui, "artifact", chinese ? "产物" : "Artifact") },
    { target: "module-lab", text: label(course.copy.ui, "lab", chinese ? "实验" : "Lab") },
    { target: "module-checkpoint", text: label(course.copy.ui, "checkpoint", chinese ? "检查点" : "Checkpoint") },
    { target: "module-completion", text: label(course.copy.ui, "completion", chinese ? "完成" : "Completion") },
    { target: "module-sources", text: label(course.copy.ui, "sources", chinese ? "来源" : "Sources") },
  ] as const;
  const moreModulesLabel = chinese ? "更多模块" : "More modules";
  const mapPhases = course.phases.map((mapPhase) => ({
    id: mapPhase.id,
    title: mapPhase.copy.title,
    modules: mapPhase.modules.map((mapModule) => ({
      checkpoint: mapModule.copy.checkpoint,
      order: mapModule.order,
      slug: mapModule.slug,
      title: mapModule.copy.title,
    })),
  }));
  const mapStateLabels = {
    complete: chinese ? "已完成" : "Done",
    current: chinese ? "当前" : "Current",
    nextIncomplete: chinese ? "下一未完成项" : "Next incomplete",
  } as const;
  const moduleCheckpoints = course.modules.map(({ slug, copy }) => ({
    slug,
    checkpoint: copy.checkpoint,
  }));
  const opensInNewTab = label(
    course.copy.ui,
    "opensInNewTab",
    chinese ? "在新标签页打开" : "opens in a new tab",
  );

  return (
    <div
      className={`shellwrap ${styles.root} ${styles.modulePage}`}
      lang={course.contentLocale}
      dir={course.contentDirection}
      data-testid={`agent-orchestration-module-${module.slug}`}
    >
      {course.locale !== course.contentLocale ? (
        <p className={styles.languageNotice}>{course.copy.meta.translationNote}</p>
      ) : null}

      <nav
        className={styles.topBreadcrumb}
        aria-label={label(
          course.copy.ui,
          "breadcrumb",
          chinese ? "面包屑导航" : "Breadcrumb",
        )}
      >
        <Link href={courseHref}><span aria-hidden="true">←</span>{label(course.copy.ui, "courseMap", "Course map")}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{label(course.copy.ui, "module", "Module")} {module.order}</span>
      </nav>

      <details className={styles.mobileCourseMap}>
        <summary><span>{label(course.copy.ui, "courseMap", "Course map")}</span><span>{module.order} / {course.modules.length}</span></summary>
        <nav
          aria-label={label(course.copy.ui, "allCourseModules", "All course modules")}
          data-module-map-scroll
        >
          <ActiveModuleMapReveal
            activeSlug={module.slug}
            continuationLabel={moreModulesLabel}
            courseLocale={course.locale}
            phases={mapPhases}
            stateLabels={mapStateLabels}
          />
        </nav>
      </details>

      <a className={styles.lessonSkipLink} href="#module-lesson-content">
        {chinese ? "跳至本课内容" : "Skip to lesson"}
      </a>

      <div className={styles.moduleLayout}>
        <aside className={styles.moduleRail} data-module-map-scroll>
          <nav aria-label={label(course.copy.ui, "allCourseModules", "All course modules")}>
            <header><span>{label(course.copy.ui, "course", "Course 15")}</span><strong>{label(course.copy.ui, "courseMap", "Course map")}</strong></header>
            <ActiveModuleMapReveal
              activeSlug={module.slug}
              continuationLabel={moreModulesLabel}
              courseLocale={course.locale}
              phases={mapPhases}
              stateLabels={mapStateLabels}
            />
            <CourseProgress
              labels={course.copy.ui}
              compact
              moduleCheckpoints={moduleCheckpoints}
            />
          </nav>
        </aside>

        <div className={styles.moduleMain}>
          <article id="module-lesson-content" tabIndex={-1}>
            <header className={styles.moduleHero}>
              <div className={styles.moduleSignal}>
                <span>{label(course.copy.ui, "phase", "Phase")} {phase.order}</span><i /><span>{phase.copy.verb}</span>
              </div>
              <p className={styles.kicker}>{module.copy.kicker}</p>
              <h1>{module.copy.title}</h1>
              <p className={styles.moduleSummary}>{module.copy.summary}</p>
              <dl className={styles.moduleFacts}>
                <div><dt>{label(course.copy.ui, "minutes", "Time")}</dt><dd>{module.minutes} {label(course.copy.ui, "minute", "min")}</dd></div>
                <div><dt>{label(course.copy.ui, "phase", "Phase")}</dt><dd>{phase.copy.title}</dd></div>
                <div><dt>{label(course.copy.ui, "sources", "Sources")}</dt><dd>{module.sources.length}</dd></div>
                <div><dt>{label(course.copy.ui, "lab", "Lab")}</dt><dd>{module.labId}</dd></div>
              </dl>
              <p className={styles.artifactPromise}><span>{label(course.copy.ui, "artifact", "Artifact")}</span><strong>{module.copy.artifact}</strong></p>
            </header>

            <section className={styles.objective} aria-labelledby="module-objective-title">
              <p className={styles.sectionLabel}>{label(course.copy.ui, "objective", "Module objective")}</p>
              <h2 id="module-objective-title">{label(course.copy.ui, "whatChanges", "What changes by the end")}</h2>
              <p>{module.copy.objective}</p>
              <ul className={styles.tagList} aria-label={label(course.copy.ui, "conceptsInModule", "Concepts in this module")}>
                {module.copy.concepts.map((concept) => <li key={concept}>{concept}</li>)}
              </ul>
            </section>

            <nav className={styles.onPageNav} aria-label={label(course.copy.ui, "onThisPage", "On this page")}>
              <span>{label(course.copy.ui, "onThisPage", "Execution notebook")}</span>
              <ol>
                {notebookItems.map((item, itemIndex) => (
                  <li key={item.target}>
                    <a href={`#${item.target}`}>
                      {String(itemIndex + 1).padStart(2, "0")} {item.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className={styles.notebookTarget} id="module-learning" />
            {module.copy.sections.map((section, sectionIndex) => {
              const sectionSources = section.sourceIds.flatMap((sourceId) => {
                const source = module.sources.find((candidate) => candidate.id === sourceId);
                return source ? [source] : [];
              });
              return (
                <section
                  className={styles.proseSection}
                  id={`module-section-${sectionIndex + 1}`}
                  aria-labelledby={`module-section-${sectionIndex + 1}-title`}
                  key={section.heading}
                  data-evidence={section.evidenceMode}
                >
                  <div className={styles.proseNumber} aria-hidden="true">{String(sectionIndex + 1).padStart(2, "0")}</div>
                  <div className={styles.proseCopy}>
                    <p className={styles.evidenceMode}>{evidenceLabel(section.evidenceMode, course.contentLocale)}</p>
                    <h2 id={`module-section-${sectionIndex + 1}-title`}>{section.heading}</h2>
                    {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    {section.bullets?.length ? <ul>{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul> : null}
                    <aside className={styles.inlineEvidence} aria-label={label(course.copy.ui, "evidenceLinks", "Evidence links")}>
                      <span>{label(course.copy.ui, "evidence", "Evidence")}</span>
                      <p>
                        {sectionSources.map((source, sourceIndex) => (
                          <span key={source.id}>
                            {sourceIndex ? " · " : ""}
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${source.title} (${opensInNewTab})`}
                            >
                              {source.title}<span aria-hidden="true">↗</span>
                            </a>
                          </span>
                        ))}
                      </p>
                    </aside>
                  </div>
                </section>
              );
            })}

            <ModuleContractMap module={module} labels={course.copy.ui} />

            <section className={styles.practice} id="module-practice" aria-labelledby="module-practice-title">
              <header className={styles.practiceHeader}>
                <div><p className={styles.sectionLabel}>{label(course.copy.ui, "practice", "Applied practice")}</p><h2 id="module-practice-title">{module.copy.practice.title}</h2></div>
                <span>
                  {course.contentLocale === "zh-Hans"
                    ? `${module.minutes} 分钟 · 本模块`
                    : `${module.minutes} MIN MODULE`}
                </span>
              </header>
              <p className={styles.practiceBrief}>{module.copy.practice.brief}</p>
              <div className={styles.practiceGrid}>
                <div><h3>{label(course.copy.ui, "workSequence", "Work sequence")}</h3><ol>{module.copy.practice.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
                <div className={styles.reviewGate}><p className={styles.sectionLabel}>{label(course.copy.ui, "reviewGate", "Review gate")}</p><p>{module.copy.practice.reviewGate}</p></div>
              </div>
              <div className={styles.notebookTarget} id="module-artifact">
                <ArtifactWorkbench slug={module.slug} practice={module.copy.practice} labels={course.copy.ui} />
              </div>
            </section>

            <div className={styles.notebookTarget} id="module-lab">
              <OrchestrationLab slug={module.slug} labId={module.labId} lab={module.copy.lab} labels={course.copy.ui} />
            </div>
            <div className={styles.notebookTarget} id="module-checkpoint">
              <ModuleCheckpoint slug={module.slug} checkpoint={module.copy.checkpoint} labels={course.copy.ui} />
            </div>
            <div className={styles.notebookTarget} id="module-completion">
              <ModuleCompletion
                slug={module.slug}
                checkpoint={module.copy.checkpoint}
                labels={course.copy.ui}
              />
            </div>

            <aside className={styles.takeaway} aria-label={label(course.copy.ui, "moduleTakeaway", "Module takeaway")}><span>{label(course.copy.ui, "takeaway", "Keep this boundary")}</span><p>{module.copy.takeaway}</p></aside>

            <section className={styles.sources} id="module-sources" aria-labelledby="module-sources-title">
              <header className={styles.sectionIntro}>
                <p className={styles.kicker}>{label(course.copy.ui, "rightsBoundary", "Source and rights boundary")}</p>
                <h2 id="module-sources-title">{label(course.copy.ui, "sourceRegister", "Evidence register")}</h2>
                <p>{label(course.copy.ui, "sourceRegisterNote", "Each record supports a bounded claim. Its boundary is part of the lesson, not fine print.")}</p>
              </header>
              <ol>
                {module.sources.map((source, sourceIndex) => (
                  <li key={source.id}>
                    <span className={styles.sourceNumber}>{String(sourceIndex + 1).padStart(2, "0")}</span>
                    <div>
                      <header>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          lang="en"
                          aria-label={`${source.title} (${opensInNewTab})`}
                        >
                          {source.title}<span aria-hidden="true">↗</span>
                        </a>
                        <div className={styles.sourceMeta}>
                          <span lang="en">{source.publisher}</span><span>{sourceKindLabel(source.kind, course.contentLocale)}</span><span>{sourceStabilityLabel(source.stability, course.contentLocale)}</span><span>{label(course.copy.ui, "accessed", "Accessed")} {source.accessedOn}</span>
                          {source.revision ? <span>{label(course.copy.ui, "revision", "Revision")}: {source.revision}</span> : null}
                          {source.license ? (
                            <span>
                              {label(course.copy.ui, "license", "License")}:{" "}
                              <bdi lang="en" dir="ltr">{source.license}</bdi>
                            </span>
                          ) : null}
                        </div>
                        {source.claimEvidenceUrls.length > 1 || source.versionAnchorUrl ? (
                          <div className={styles.sourceRoleLinks}>
                            {source.claimEvidenceUrls.slice(1).map((evidenceUrl, evidenceIndex) => (
                              <a
                                href={evidenceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                key={evidenceUrl}
                                aria-label={`${label(
                                  course.copy.ui,
                                  "supportingClaimEvidence",
                                  "Supporting claim evidence",
                                )} ${evidenceIndex + 2}${source.versionAnchorUrl === evidenceUrl
                                  ? ` · ${label(course.copy.ui, "versionAnchor", "Version anchor")}`
                                  : ""} (${opensInNewTab})`}
                              >
                                {label(course.copy.ui, "supportingClaimEvidence", "Supporting claim evidence")} {evidenceIndex + 2}
                                {source.versionAnchorUrl === evidenceUrl
                                  ? ` · ${label(course.copy.ui, "versionAnchor", "Version anchor")}`
                                  : ""}
                                <span aria-hidden="true">↗</span>
                              </a>
                            ))}
                            {source.versionAnchorUrl && !source.claimEvidenceUrls.includes(source.versionAnchorUrl) ? (
                              <a
                                href={source.versionAnchorUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`${label(
                                  course.copy.ui,
                                  "versionAnchor",
                                  "Version anchor",
                                )} (${opensInNewTab})`}
                              >
                                {label(course.copy.ui, "versionAnchor", "Version anchor")}
                                <span aria-hidden="true">↗</span>
                              </a>
                            ) : null}
                          </div>
                        ) : null}
                      </header>
                      <dl className={styles.sourceNotes}>
                        <div><dt>{label(course.copy.ui, "sourceSupports", "Supports")}</dt><dd>{course.contentLocale === "zh-Hans" ? source.supportsZhHans : source.supports}</dd></div>
                        <div><dt>{label(course.copy.ui, "sourceBoundary", "Boundary")}</dt><dd>{course.contentLocale === "zh-Hans" ? source.boundaryZhHans : source.boundary}</dd></div>
                      </dl>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <nav className={styles.modulePager} aria-label={label(course.copy.ui, "moduleNavigation", "Module navigation")} data-course-lesson-nav>
              {previous ? <Link href={hrefFor(previous.slug)} rel="prev"><span>{label(course.copy.ui, "previous", "Previous")}</span><strong>{String(previous.order).padStart(2, "0")} · {previous.copy.title}</strong></Link> : <span />}
              {next ? <Link href={hrefFor(next.slug)} rel="next"><span>{label(course.copy.ui, "next", "Next")}</span><strong>{String(next.order).padStart(2, "0")} · {next.copy.title}</strong></Link> : <Link href={courseHref}><span>{label(course.copy.ui, "returnToCourse", chinese ? "返回课程概览" : "Return to course overview")}</span><strong>{course.copy.meta.title}</strong></Link>}
            </nav>
          </article>
        </div>
      </div>
    </div>
  );
}
