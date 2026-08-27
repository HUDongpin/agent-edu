import Link from "next/link";
import type {
  AgenticTeachingSource,
  AgenticTeachingSourceKind,
  AgenticTeachingSourceRole,
  AgenticTeachingSourceStability,
  MaterializedAgenticTeachingCourse,
} from "@/lib/ai-teaching/types";
import {
  CapstoneChecklist,
  CourseProgress,
  FinalAssessment,
  PilotCanvas,
} from "./Interactions";
import styles from "./AgenticTeachingCourse.module.css";

type ContentLocale = MaterializedAgenticTeachingCourse["contentLocale"];

function sourceKindLabel(
  kind: AgenticTeachingSourceKind,
  locale: ContentLocale,
): string {
  const zh = locale === "zh-Hans";
  switch (kind) {
    case "github-repository":
      return zh ? "GitHub 仓库" : "GitHub repository";
    case "x-post":
      return zh ? "X 帖文" : "X post";
    case "official-guidance":
      return zh ? "官方指南" : "Official guidance";
    case "research":
      return zh ? "研究证据" : "Research evidence";
  }
  const exhaustive: never = kind;
  return exhaustive;
}

function sourceRoleLabel(
  role: AgenticTeachingSourceRole,
  locale: ContentLocale,
): string {
  const zh = locale === "zh-Hans";
  switch (role) {
    case "inspectable-implementation":
      return zh ? "可检查实现" : "Inspectable implementation";
    case "field-signal":
      return zh ? "有日期的领域信号" : "Dated field signal";
    case "governance-boundary":
      return zh ? "治理边界" : "Governance boundary";
    case "learning-evidence":
      return zh ? "学习证据" : "Learning evidence";
  }
  const exhaustive: never = role;
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

function SourceRegister({
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
                <span>
                  {source.kind === "x-post"
                    ? ui.fieldSignal
                    : sourceRoleLabel(source.role, contentLocale)}
                </span>
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

export default function CourseDashboard({
  course,
  catalogLabel,
}: {
  readonly course: MaterializedAgenticTeachingCourse;
  readonly catalogLabel: string;
}) {
  const { copy } = course;
  const firstModule = course.modules[0];
  const courseLabel = copy.ui.course.includes(String(course.displayNumber))
    ? copy.ui.course
    : `${copy.ui.course} ${course.displayNumber}`;
  const hrefFor = (slug: string) => `/${course.locale}/ai-teaching/${slug}/`;
  const totalMinutes = course.modules.reduce(
    (total, module) => total + module.minutes,
    0,
  );
  const trustTitles =
    course.contentLocale === "zh-Hans"
      ? ["责任", "证据", "迁移", "数据"]
      : ["Purpose", "Authority", "Least privilege", "Evidence"];
  const trustHeading =
    course.contentLocale === "zh-Hans"
      ? "教师保有判断权的信任闭环"
      : "A trust loop that keeps educators in control";

  return (
    <div
      className={`shellwrap ${styles.root}`}
      lang={course.contentLocale}
      dir={course.contentDirection}
      data-testid="ai-teaching-course"
    >
      {course.isFallback ? (
        <p className={styles.languageNotice}>
          <strong>{copy.ui.fallbackLabel}:</strong> {copy.meta.fallbackNotice}
        </p>
      ) : null}

      <header className={styles.hero}>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.courseNumber}>
              {courseLabel} · v{course.version}
            </p>
            <p className={styles.eyebrow}>{copy.meta.kicker}</p>
            <h1>{copy.meta.title}</h1>
            <p className={styles.heroSummary}>{copy.meta.summary}</p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryAction} href={hrefFor(firstModule.slug)}>
                {copy.ui.start}
                <span aria-hidden="true">↗</span>
              </Link>
              <a className={styles.secondaryAction} href="#course-map">
                {copy.ui.courseMap}
                <span aria-hidden="true">↓</span>
              </a>
            </div>
            <dl className={styles.heroFacts}>
              <div>
                <dt>{copy.ui.duration}</dt>
                <dd>{copy.meta.duration}</dd>
              </div>
              <div>
                <dt>{copy.ui.modules}</dt>
                <dd>{course.modules.length}</dd>
              </div>
              <div>
                <dt>{copy.ui.audience}</dt>
                <dd>{copy.meta.audience}</dd>
              </div>
              <div>
                <dt>{copy.ui.sources}</dt>
                <dd>{course.sources.length}</dd>
              </div>
            </dl>
          </div>

          <aside className={styles.trustPanel} aria-label={trustHeading}>
            <header>
              <span>{copy.ui.principles}</span>
              <h2>{trustHeading}</h2>
            </header>
            <div className={styles.trustLoop}>
              {copy.principles.slice(0, 4).map((principle, index) => (
                <div className={styles.trustStep} key={principle}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{trustTitles[index] ?? copy.ui.principles}</strong>
                    <p>{principle}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className={styles.trustBoundary}>{copy.meta.credentialBoundary}</p>
            <CourseProgress labels={copy.ui} compact />
          </aside>
        </div>
      </header>

      <section className={styles.tracksSection} aria-labelledby="learning-tracks-title">
        <header className={styles.sectionIntro}>
          <div>
            <p className={styles.sectionLabel}>{copy.ui.audience}</p>
            <h2 id="learning-tracks-title">{copy.ui.tracks}</h2>
          </div>
          <p>{copy.meta.audience}</p>
        </header>
        <div className={styles.trackGrid}>
          {copy.tracks.map((track) => (
            <article className={styles.trackCard} key={track.id}>
              <h3>{track.title}</h3>
              <p>{track.summary}</p>
              <ul>
                {track.focus.map((focus) => <li key={focus}>{focus}</li>)}
              </ul>
              <Link href={hrefFor(track.startingModule)}>
                {copy.ui.start}
                <span aria-hidden="true">↗</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.principlesSection} aria-labelledby="course-principles-title">
        <header className={styles.sectionIntro}>
          <div>
            <p className={styles.sectionLabel}>{copy.ui.prerequisite}</p>
            <h2 id="course-principles-title">{copy.ui.principles}</h2>
          </div>
          <p>{copy.meta.prerequisite}</p>
        </header>
        <ol className={styles.principleGrid}>
          {copy.principles.map((principle, index) => (
            <li key={principle}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{principle}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        className={styles.courseMapSection}
        id="course-map"
        aria-labelledby="course-map-title"
      >
        <header className={styles.sectionIntro}>
          <div>
            <p className={styles.sectionLabel}>{copy.ui.phase}</p>
            <h2 id="course-map-title">{copy.ui.courseMap}</h2>
          </div>
          <p>
            {course.modules.length} {copy.ui.modules} · {totalMinutes} {copy.ui.minutes}
          </p>
        </header>
        {course.phases.map((phase) => (
          <section className={styles.phaseGroup} key={phase.id} aria-labelledby={`phase-${phase.id}`}>
            <header className={styles.phaseHeader}>
              <span>{String(phase.order).padStart(2, "0")}</span>
              <div>
                <h3 id={`phase-${phase.id}`}>{phase.copy.title}</h3>
                <p>{phase.copy.summary}</p>
              </div>
            </header>
            <div className={styles.moduleGrid}>
              {phase.modules.map((module) => (
                <Link className={styles.moduleCard} href={hrefFor(module.slug)} key={module.slug}>
                  <span className={styles.moduleNumber}>
                    {String(module.order).padStart(2, "0")}
                  </span>
                  <div>
                    <h4>{module.copy.title}</h4>
                    <p>{module.copy.summary}</p>
                    <small>
                      {module.minutes} {copy.ui.minutes} · {module.sources.length} {copy.ui.sources}
                    </small>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </section>

      <PilotCanvas locale={course.contentLocale} />

      <section className={styles.outcomesSection} aria-labelledby="course-outcomes-title">
        <header className={styles.sectionIntro}>
          <div>
            <p className={styles.sectionLabel}>{copy.meta.level}</p>
            <h2 id="course-outcomes-title">{copy.ui.outcomes}</h2>
          </div>
          <p>{copy.meta.evidenceNote}</p>
        </header>
        <ol className={styles.outcomeGrid}>
          {copy.outcomes.map((outcome, index) => (
            <li key={outcome}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{outcome}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.sourceLedger} aria-labelledby="course-sources-title">
        <header className={styles.sectionIntro}>
          <div>
            <p className={styles.sectionLabel}>{copy.ui.sourceRegister}</p>
            <h2 id="course-sources-title">{copy.ui.sources}</h2>
          </div>
          <p>{copy.meta.evidenceNote}</p>
        </header>
        <SourceRegister sources={course.sources} course={course} />
      </section>

      <FinalAssessment
        questions={copy.quiz.questions}
        title={copy.quiz.title}
        intro={copy.quiz.intro}
        passNote={copy.quiz.passNote}
        labels={copy.ui}
      />

      <CapstoneChecklist
        title={copy.capstone.title}
        intro={copy.capstone.intro}
        instructions={copy.capstone.instructions}
        artifacts={copy.capstone.artifacts}
        attestation={copy.capstone.attestation}
        labels={copy.ui}
      />

      <nav className={styles.bottomNav} aria-label={copy.ui.catalog}>
        <Link
          href={`/${course.locale}/courses/`}
          lang={course.isFallback ? course.locale : undefined}
          dir={course.locale === "ar" ? "rtl" : undefined}
        >
          <span aria-hidden="true">←</span>
          {catalogLabel}
        </Link>
      </nav>
    </div>
  );
}
