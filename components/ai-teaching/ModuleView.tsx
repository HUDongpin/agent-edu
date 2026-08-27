import Link from "next/link";
import type {
  AgenticTeachingEvidenceMode,
  AgenticTeachingSource,
  AgenticTeachingSourceKind,
  AgenticTeachingSourceStability,
  MaterializedAgenticTeachingCourse,
  MaterializedAgenticTeachingModule,
} from "@/lib/ai-teaching/types";
import {
  ArtifactNotebook,
  CourseProgress,
  ModuleCheckpoint,
  ModuleCompletion,
} from "./Interactions";
import styles from "./AgenticTeachingCourse.module.css";

type ContentLocale = MaterializedAgenticTeachingCourse["contentLocale"];

function evidenceLabel(
  mode: AgenticTeachingEvidenceMode,
  locale: ContentLocale,
): string {
  const zh = locale === "zh-Hans";
  switch (mode) {
    case "source-grounded":
      return zh ? "来源支持" : "SOURCE-GROUNDED";
    case "instructional-synthesis":
      return zh ? "教学设计综合" : "INSTRUCTIONAL SYNTHESIS";
    case "field-signal":
      return zh ? "有日期的领域信号" : "DATED FIELD SIGNAL";
    case "version-watch":
      return zh ? "版本观察" : "VERSION WATCH";
  }
  const exhaustive: never = mode;
  return exhaustive;
}

function sourceKindLabel(
  kind: AgenticTeachingSourceKind,
  locale: ContentLocale,
): string {
  const zh = locale === "zh-Hans";
  switch (kind) {
    case "github-repository":
      return zh ? "GitHub 仓库" : "GitHub repository";
    case "x-post":
      return zh ? "X 帖文 / 领域信号" : "X post / field signal";
    case "official-guidance":
      return zh ? "官方指南" : "Official guidance";
    case "research":
      return zh ? "研究证据" : "Research evidence";
  }
  const exhaustive: never = kind;
  return exhaustive;
}

function sourceStabilityLabel(
  stability: AgenticTeachingSourceStability,
  locale: ContentLocale,
): string {
  if (locale !== "zh-Hans") return stability.replaceAll("-", " ");
  switch (stability) {
    case "stable-concept":
      return "稳定概念";
    case "version-pinned":
      return "已固定版本";
    case "current-documentation":
      return "当前文档";
    case "dated-post":
      return "有日期的帖文";
    case "jurisdiction-and-date-bound":
      return "受法域与日期约束";
  }
  const exhaustive: never = stability;
  return exhaustive;
}

function ModuleMap({
  course,
  activeSlug,
}: {
  readonly course: MaterializedAgenticTeachingCourse;
  readonly activeSlug: string;
}) {
  return (
    <ol className={styles.moduleMap}>
      {course.phases.map((phase) => (
        <li key={phase.id}>
          <strong>{phase.copy.title}</strong>
          <ol>
            {phase.modules.map((candidate) => (
              <li key={candidate.slug}>
                <Link
                  href={`/${course.locale}/ai-teaching/${candidate.slug}/`}
                  aria-current={candidate.slug === activeSlug ? "page" : undefined}
                >
                  <span>{String(candidate.order).padStart(2, "0")}</span>
                  <span>{candidate.copy.title}</span>
                </Link>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}

function ModuleSourceRegister({
  sources,
  course,
}: {
  readonly sources: readonly AgenticTeachingSource[];
  readonly course: MaterializedAgenticTeachingCourse;
}) {
  const { contentLocale } = course;
  const { ui } = course.copy;

  return (
    <ol className={styles.sourceList}>
      {sources.map((source, index) => (
        <li key={source.id} id={`source-${source.id}`}>
          <span className={styles.sourceIndex} aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <header className={styles.sourceHeader}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.title}
                <span aria-hidden="true"> ↗</span>
              </a>
              <span className={styles.sourceBadges}>
                <span>{sourceKindLabel(source.kind, contentLocale)}</span>
                <span>{sourceStabilityLabel(source.stability, contentLocale)}</span>
              </span>
            </header>
            <p className={styles.sourceMeta}>
              <span>{source.publisher}</span>
              {source.authorIdentity ? <span> · {source.authorIdentity}</span> : null}
              {source.statusId ? <span> · X status {source.statusId}</span> : null}
              {source.publishedOn ? <span> · {source.publishedOn}</span> : null}
              <span> · {ui.accessed} {source.accessedOn}</span>
              {source.revision ? <span> · {source.revision}</span> : null}
              {source.license ? <span> · {source.license}</span> : null}
            </p>
            {source.claimEvidenceUrls.length > 0 ? (
              <p className={styles.sourceMeta}>
                {source.claimEvidenceUrls.map((url, evidenceIndex) => (
                  <span key={url}>
                    {evidenceIndex ? " · " : ""}
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {ui.evidence} {evidenceIndex + 1}
                    </a>
                  </span>
                ))}
              </p>
            ) : null}
            <dl className={styles.sourceNotes}>
              <div>
                <dt>{ui.supports}</dt>
                <dd>{source.supports[contentLocale]}</dd>
              </div>
              <div>
                <dt>{ui.boundary}</dt>
                <dd>{source.boundary[contentLocale]}</dd>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <dt>{contentLocale === "zh-Hans" ? "复用边界" : "Reuse boundary"}</dt>
                <dd>{source.rightsDecision[contentLocale]}</dd>
              </div>
            </dl>
          </div>
        </li>
      ))}
    </ol>
  );
}

function interfaceCopy(locale: ContentLocale) {
  if (locale === "zh-Hans") {
    return {
      approval: "教师批准点",
      noGo: "智能体不得执行",
      k12Scenario: "K–12 情境",
      higherEdScenario: "大学情境",
      requiredEvidence: "所需证据",
      requiredLabels: "模板标签",
      onThisPage: "本页路径",
      takeaway: "保留这条边界",
      breadcrumb: "模块位置",
      mobileCourseMap: "移动课程地图",
      desktopCourseMap: "完整课程地图",
      moduleNavigation: "前后模块导航",
    } as const;
  }
  return {
    approval: "Educator approval points",
    noGo: "Agent no-go actions",
    k12Scenario: "K–12 scenario",
    higherEdScenario: "Higher-education scenario",
    requiredEvidence: "Required evidence",
    requiredLabels: "Template labels",
    onThisPage: "On this page",
    takeaway: "Keep this boundary",
    breadcrumb: "Module breadcrumb",
    mobileCourseMap: "Mobile course map",
    desktopCourseMap: "Full course map",
    moduleNavigation: "Module navigation",
  } as const;
}

export default function ModuleView({
  course,
  module,
}: {
  readonly course: MaterializedAgenticTeachingCourse;
  readonly module: MaterializedAgenticTeachingModule;
}) {
  const index = course.modules.findIndex((candidate) => candidate.slug === module.slug);
  const previous = index > 0 ? course.modules[index - 1] : null;
  const next = index < course.modules.length - 1 ? course.modules[index + 1] : null;
  const phase = course.phases.find((candidate) => candidate.id === module.phaseId);
  const courseHref = `/${course.locale}/ai-teaching/`;
  const hrefFor = (slug: string) => `/${course.locale}/ai-teaching/${slug}/`;
  const chrome = interfaceCopy(course.contentLocale);
  const courseLabel = course.copy.ui.course.includes(String(course.displayNumber))
    ? course.copy.ui.course
    : `${course.copy.ui.course} ${course.displayNumber}`;

  if (!phase) return null;

  return (
    <div
      className={`shellwrap ${styles.root} ${styles.modulePage}`}
      lang={course.contentLocale}
      dir={course.contentDirection}
      data-testid={`ai-teaching-module-${module.slug}`}
    >
      {course.isFallback ? (
        <p className={styles.languageNotice}>
          <strong>{course.copy.ui.fallbackLabel}:</strong>{" "}
          {course.copy.meta.fallbackNotice}
        </p>
      ) : null}

      <nav className={styles.breadcrumb} aria-label={chrome.breadcrumb}>
        <Link href={courseHref}>
          <span aria-hidden="true">←</span>
          {course.copy.ui.backToCourse}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">
          {course.copy.ui.module} {module.order}
        </span>
      </nav>

      <details className={styles.mobileMap}>
        <summary>
          {course.copy.ui.courseMap} · {module.order}/{course.modules.length}
        </summary>
        <nav aria-label={chrome.mobileCourseMap}>
          <ModuleMap course={course} activeSlug={module.slug} />
        </nav>
      </details>

      <div className={styles.moduleLayout}>
        <aside className={styles.moduleRail}>
          <p>
            {courseLabel} · {course.copy.ui.courseMap}
          </p>
          <nav aria-label={chrome.desktopCourseMap}>
            <ModuleMap course={course} activeSlug={module.slug} />
          </nav>
          <CourseProgress labels={course.copy.ui} compact />
        </aside>

        <div className={styles.moduleMain}>
          <article>
            <header className={styles.moduleHero}>
              <div className={styles.moduleMeta}>
                <span>{course.copy.ui.module} {module.order}</span>
                <span>{course.copy.ui.phase} {phase.order} · {phase.copy.title}</span>
                <span>{module.minutes} {course.copy.ui.minutes}</span>
                <span>
                  {module.audiences
                    .map((audience) =>
                      audience === "k12"
                        ? "K–12"
                        : course.contentLocale === "zh-Hans"
                          ? "大学"
                          : "Higher education",
                    )
                    .join(" + ")}
                </span>
              </div>
              <p className={styles.eyebrow}>{module.copy.kicker}</p>
              <h1>{module.copy.title}</h1>
              <p className={styles.moduleSummary}>{module.copy.summary}</p>
              <dl className={styles.moduleContract}>
                <div>
                  <dt>{course.copy.ui.objective}</dt>
                  <dd>{module.copy.objective}</dd>
                </div>
                <div>
                  <dt>{course.copy.ui.artifact}</dt>
                  <dd>{module.copy.artifact}</dd>
                </div>
                <div>
                  <dt>{chrome.k12Scenario}</dt>
                  <dd>{module.copy.audienceScenarios.k12}</dd>
                </div>
                <div>
                  <dt>{chrome.higherEdScenario}</dt>
                  <dd>{module.copy.audienceScenarios["higher-ed"]}</dd>
                </div>
                <div>
                  <dt>{chrome.approval}</dt>
                  <dd>{module.copy.humanApprovalPoints.join(" · ")}</dd>
                </div>
                <div>
                  <dt>{chrome.noGo}</dt>
                  <dd>{module.copy.noGoActions.join(" · ")}</dd>
                </div>
              </dl>
            </header>

            <nav className={styles.onPage} aria-label={chrome.onThisPage}>
              <strong>{chrome.onThisPage}</strong>
              <ol>
                {module.copy.sections.map((section, sectionIndex) => (
                  <li key={section.heading}>
                    <a href={`#lesson-${sectionIndex + 1}`}>
                      {String(sectionIndex + 1).padStart(2, "0")} {section.heading}
                    </a>
                  </li>
                ))}
                <li><a href="#module-practice">04 {course.copy.ui.practice}</a></li>
                <li><a href="#module-checkpoint">05 {course.copy.ui.checkpoint}</a></li>
                <li><a href="#module-sources">06 {course.copy.ui.sourceRegister}</a></li>
              </ol>
            </nav>

            {module.copy.sections.map((section, sectionIndex) => {
              const sources = section.sourceIds.flatMap((sourceId) => {
                const source = module.sources.find((candidate) => candidate.id === sourceId);
                return source ? [source] : [];
              });
              return (
                <section
                  className={styles.lessonSection}
                  id={`lesson-${sectionIndex + 1}`}
                  aria-labelledby={`lesson-${sectionIndex + 1}-title`}
                  data-evidence={section.evidenceMode}
                  key={section.heading}
                >
                  <header>
                    <span aria-hidden="true">
                      {String(sectionIndex + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className={styles.evidenceMode}>
                        {evidenceLabel(section.evidenceMode, course.contentLocale)}
                      </p>
                      <h2 id={`lesson-${sectionIndex + 1}-title`}>{section.heading}</h2>
                    </div>
                  </header>
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <p key={`${paragraphIndex}-${paragraph}`}>{paragraph}</p>
                  ))}
                  {section.bullets?.length ? (
                    <ul>
                      {section.bullets.map((item, itemIndex) => (
                        <li key={`${itemIndex}-${item}`}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                  <aside
                    className={styles.inlineSources}
                    aria-label={`${course.copy.ui.evidence}: ${section.heading}`}
                  >
                    <strong>{course.copy.ui.evidence}: </strong>
                    {sources.map((source, sourceIndex) => (
                      <span key={source.id}>
                        {sourceIndex ? " · " : ""}
                        <a
                          href={source.claimEvidenceUrls[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {source.title}
                        </a>
                      </span>
                    ))}
                  </aside>
                </section>
              );
            })}

            <section
              className={styles.practice}
              id="module-practice"
              aria-labelledby="module-practice-title"
            >
              <p className={styles.sectionLabel}>{course.copy.ui.practice}</p>
              <h2 id="module-practice-title">{module.copy.practice.title}</h2>
              <p>{module.copy.practice.brief}</p>
              <div className={styles.practiceGrid}>
                <div>
                  <h3>{course.copy.ui.steps}</h3>
                  <ol>
                    {module.copy.practice.steps.map((step) => <li key={step}>{step}</li>)}
                  </ol>
                </div>
                <dl>
                  <dt>{course.copy.ui.artifact}</dt>
                  <dd>{module.copy.practice.artifact}</dd>
                  <dt>{course.copy.ui.reviewGate}</dt>
                  <dd>{module.copy.practice.reviewGate}</dd>
                  <dt>{chrome.requiredEvidence}</dt>
                  <dd>{module.copy.practice.rubric.evidenceRequirements.join(" · ")}</dd>
                  <dt>{chrome.requiredLabels}</dt>
                  <dd>{module.copy.practice.rubric.requiredLabels.join(" · ")}</dd>
                </dl>
              </div>
              <ArtifactNotebook
                slug={module.slug}
                practice={module.copy.practice}
                labels={course.copy.ui}
                contentLocale={course.contentLocale}
              />
            </section>

            <div id="module-checkpoint">
              <ModuleCheckpoint
                slug={module.slug}
                checkpoint={module.copy.checkpoint}
                labels={course.copy.ui}
                contentLocale={course.contentLocale}
              />
            </div>

            <aside className={styles.takeaway} aria-label={chrome.takeaway}>
              <span>{chrome.takeaway}</span>
              <p>{module.copy.takeaway}</p>
            </aside>

            <section
              className={styles.sourceLedger}
              id="module-sources"
              aria-labelledby="module-sources-title"
            >
              <header className={styles.sectionIntro}>
                <div>
                  <p className={styles.sectionLabel}>{course.copy.ui.sourceRegister}</p>
                  <h2 id="module-sources-title">{course.copy.ui.sources}</h2>
                </div>
                <p>{course.copy.meta.evidenceNote}</p>
              </header>
              <ModuleSourceRegister sources={module.sources} course={course} />
            </section>

            <ModuleCompletion
              slug={module.slug}
              rubric={module.copy.practice.rubric}
              labels={course.copy.ui}
            />

            <nav className={styles.modulePager} aria-label={chrome.moduleNavigation}>
              {previous ? (
                <Link href={hrefFor(previous.slug)} rel="prev">
                  <span>{course.copy.ui.previous}</span>
                  <strong>{String(previous.order).padStart(2, "0")} · {previous.copy.title}</strong>
                </Link>
              ) : <span />}
              {next ? (
                <Link href={hrefFor(next.slug)} rel="next">
                  <span>{course.copy.ui.next}</span>
                  <strong>{String(next.order).padStart(2, "0")} · {next.copy.title}</strong>
                </Link>
              ) : (
                <Link href={courseHref}>
                  <span>{course.copy.ui.backToCourse}</span>
                  <strong>{course.copy.ui.courseMap}</strong>
                </Link>
              )}
            </nav>
          </article>
        </div>
      </div>
    </div>
  );
}
