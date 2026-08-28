import Link from "next/link";
import type { MaterializedAgenticVideoEditingCourse } from "@/lib/agentic-video-editing";
import {
  CapstoneChecklist,
  CourseProgress,
  FinalAssessment,
  PreflightGate,
} from "./Interactions";
import PipelineMap from "./PipelineMap";
import { sourceKindLabel, sourceRoleLabel, xVerificationLabel } from "./source-labels";
import styles from "./AgenticVideoEditingCourse.module.css";

type Labels = MaterializedAgenticVideoEditingCourse["copy"]["ui"];

function label(labels: Labels, key: string, fallback: string): string {
  const value = labels[key];
  return value && value.trim() ? value : fallback;
}

export default function CourseDashboard({
  course,
  catalogLabel,
}: {
  course: MaterializedAgenticVideoEditingCourse;
  catalogLabel: string;
}) {
  const hrefFor = (slug: string) => `/${course.locale}/agentic-video-editing/${slug}/`;
  const totalMinutes = course.modules.reduce((sum, module) => sum + module.minutes, 0);
  const sources = Array.from(new Map(
    course.modules.flatMap((module) => module.sources).map((source) => [source.id, source]),
  ).values());
  const githubCount = sources.filter((source) => source.kind === "github-repository").length;
  const xCount = sources.filter((source) => source.kind === "x-post").length;
  const standardCount = sources.filter((source) => source.kind === "open-standard").length;
  const boundedContextCount = sources.length - githubCount - xCount - standardCount;
  const starterFiles = course.contentLocale === "zh-Hans"
    ? [
      ["creative-brief.fixture.json", "虚构创作简报、权限与停止条件"],
      ["media-manifest.fixture.json", "默认阻断的素材接收清单"],
      ["edit-plan.schema.json", "非破坏性剪辑计划 JSON Schema"],
      ["qc-checklist.md", "双语技术、含义、权利与发布审校表"],
      ["NOTICE.md", "原创、许可证、媒体与发布边界"],
      ["fixtures.provenance.json", "五个学习文件的 SHA-256 完整性清单"],
      ["lab/course22-guided-v2.zip", "完整可播放的离线 Guided Project：合成媒体、FFmpeg 输出、WebVTT、ffprobe 与 lineage"],
      ["lab/README.md", "Guided working copy 与 learner-final validator 命令"],
      ["lab/learner-final.template.json", "M10 新项目、真实媒体与 12 项证据要求"],
    ]
    : [
      ["creative-brief.fixture.json", "Fictional brief, authority, and stop conditions"],
      ["media-manifest.fixture.json", "Fail-closed media intake ledger"],
      ["edit-plan.schema.json", "Non-destructive edit-plan JSON Schema"],
      ["qc-checklist.md", "Bilingual technical, meaning, rights, and release review"],
      ["NOTICE.md", "Originality, license, media, and release boundary"],
      ["fixtures.provenance.json", "SHA-256 integrity ledger for the five learning files"],
      ["lab/course22-guided-v2.zip", "Complete playable offline Guided Project: synthetic media, FFmpeg outputs, WebVTT, ffprobe, and lineage"],
      ["lab/README.md", "Guided-working-copy and learner-final validator commands"],
      ["lab/learner-final.template.json", "M10 fresh-project, real-media, and twelve-evidence requirements"],
    ];

  return (
    <div
      className={`shellwrap ${styles.root} ${styles.coursePage}`}
      lang={course.contentLocale}
      dir={course.contentDirection}
      data-testid="agentic-video-editing-course-dashboard"
    >
      <p
        className={styles.languageNotice}
        data-testid="agentic-video-editing-release-hold"
        role="status"
      >{course.copy.meta.translationNote}</p>

      <nav className={styles.breadcrumb} aria-label={catalogLabel}>
        <Link href={`/${course.locale}/courses/`}><span aria-hidden="true">←</span>{catalogLabel}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{label(course.copy.ui, "course", "Course")} 22</span>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>{course.copy.meta.kicker}</p>
          <h1>{course.copy.meta.title}</h1>
          <p className={styles.heroSummary}>{course.copy.meta.summary}</p>
          <p className={styles.heroAudience}>{course.copy.meta.audience}</p>
          <div className={styles.buttonRow}>
            <Link className={styles.primaryButton} href={hrefFor(course.modules[0].slug)}>
              {course.copy.meta.startCta}<span aria-hidden="true">→</span>
            </Link>
            <a className={styles.secondaryButton} href="#agentic-video-curriculum">
              {label(course.copy.ui, "tableOfContents", "Course map")}
            </a>
          </div>
          <ul className={styles.principles} aria-label={label(course.copy.ui, "principlesLabel", "Course production principles")}>
            {course.copy.principles.map((principle) => <li key={principle}>{principle}</li>)}
          </ul>
        </div>
        <PipelineMap labels={course.copy.ui} locale={course.contentLocale} />
      </header>

      <section className={styles.courseFacts} aria-label={label(course.copy.ui, "courseFacts", "Course facts")}>
        <dl>
          <div><dt>{label(course.copy.ui, "modules", "Modules")}</dt><dd>{course.modules.length}</dd></div>
          <div><dt>{label(course.copy.ui, "minutes", "Minutes")}</dt><dd>{totalMinutes}</dd></div>
          <div><dt>{label(course.copy.ui, "phases", "Phases")}</dt><dd>{course.phases.length}</dd></div>
          <div><dt>{label(course.copy.ui, "sources", "Sources")}</dt><dd>{sources.length}</dd></div>
        </dl>
        <p><strong>{course.copy.meta.level}</strong><span>{course.copy.meta.duration}</span></p>
      </section>

      <CourseProgress
        modules={course.modules.map((module) => ({
          slug: module.slug,
          href: hrefFor(module.slug),
          title: module.copy.title,
        }))}
        labels={course.copy.ui}
        startLabel={course.copy.meta.startCta}
        resumeLabel={course.copy.meta.resumeCta}
      />
      <PreflightGate labels={course.copy.ui} />

      <section className={styles.starterKit} aria-labelledby="agentic-video-starter-kit-title">
        <header className={styles.sectionHeader}>
          <p className={styles.kicker}>{course.contentLocale === "zh-Hans" ? "离线起始包" : "Offline starter pack"}</p>
          <h2 id="agentic-video-starter-kit-title">{course.contentLocale === "zh-Hans" ? "先练合同，不上传媒体" : "Practice the contract before uploading media"}</h2>
          <p>{course.contentLocale === "zh-Hans" ? "五个原创学习文件和一份 SHA-256 完整性清单只包含文本与 schema，使用虚构情境并默认阻断发布。它们不含人物视频、音频、模型输出、凭据或第三方素材。" : "Five original learning files and one SHA-256 integrity ledger contain only text and schemas. They use a fictional scenario and default to blocked release; no video, audio, model output, credentials, or third-party assets are included."}</p>
        </header>
        <ul className={styles.starterFiles}>
          {starterFiles.map(([name, purpose], index) => (
            <li key={name}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{name}</strong><small>{purpose}</small></div>
              <a href={`/courses/agentic-video-editing/${name}`} download>{course.contentLocale === "zh-Hans" ? "下载" : "Download"}<span aria-hidden="true">↓</span></a>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.distinctions} aria-labelledby="agentic-video-distinction-title">
        <header className={styles.sectionHeader}>
          <p className={styles.kicker}>{label(course.copy.ui, "distinctions", "System distinctions")}</p>
          <h2 id="agentic-video-distinction-title">
            {course.contentLocale === "zh-Hans" ? "不是所有自动视频工具都是智能体" : "Not every automated video tool is an agent"}
          </h2>
          <p>{course.contentLocale === "zh-Hans" ? "正确分类决定正确的权限、测试和失败处理。" : "Correct classification determines the right authority, tests, and failure handling."}</p>
        </header>
        <dl>
          {course.copy.distinctions.map(([name, description], index) => (
            <div key={name}>
              <dt><span>{String(index + 1).padStart(2, "0")}</span>{name}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.outcomes} aria-labelledby="agentic-video-outcomes-title">
        <header className={styles.sectionHeader}>
          <p className={styles.kicker}>{label(course.copy.ui, "outcomes", "Outcomes")}</p>
          <h2 id="agentic-video-outcomes-title">
            {course.contentLocale === "zh-Hans" ? "从一份意图，交付一条经过验证的剪辑" : "From intent to a verified, reviewable cut"}
          </h2>
          <p>{course.contentLocale === "zh-Hans" ? "每项能力都对应一个可编辑、可检查的项目产物。" : "Every capability resolves into an editable, inspectable project artifact."}</p>
        </header>
        <ol>
          {course.copy.outcomes.map((outcome, index) => (
            <li key={outcome}><span>{String(index + 1).padStart(2, "0")}</span><p>{outcome}</p></li>
          ))}
        </ol>
      </section>

      <section className={styles.curriculum} id="agentic-video-curriculum" aria-labelledby="agentic-video-curriculum-title">
        <header className={styles.sectionHeader}>
          <p className={styles.kicker}>{label(course.copy.ui, "tableOfContents", "Course map")}</p>
          <h2 id="agentic-video-curriculum-title">
            {course.contentLocale === "zh-Hans" ? "四个阶段，十个可交付模块" : "Four phases, ten deliverable modules"}
          </h2>
          <p>{course.contentLocale === "zh-Hans" ? "每个模块都有三种证据模式、一个人工关口、可编辑产物与检查点。" : "Every module includes three evidence modes, a human gate, an editable artifact, and a checkpoint."}</p>
        </header>
        <div className={styles.phaseList}>
          {course.phases.map((phase) => (
            <section key={phase.id} aria-labelledby={`course-phase-${phase.id}`}>
              <header className={styles.phaseHeader}>
                <span>{String(phase.order).padStart(2, "0")}</span>
                <div><p>{phase.copy.verb}</p><h3 id={`course-phase-${phase.id}`}>{phase.copy.title}</h3><p>{phase.copy.summary}</p></div>
              </header>
              <ol className={styles.moduleCards}>
                {phase.modules.map((module) => (
                  <li key={module.slug}>
                    <Link href={hrefFor(module.slug)}>
                      <span className={styles.moduleNumber}>{String(module.order).padStart(2, "0")}</span>
                      <span className={styles.moduleCardCopy}>
                        <strong>{module.copy.title}</strong>
                        <span>{module.copy.summary}</span>
                        <small>{label(course.copy.ui, "artifact", "Artifact")}: {module.copy.artifact}</small>
                      </span>
                      <span className={styles.moduleTime}>{module.minutes} {label(course.copy.ui, "minute", "min")}<i aria-hidden="true">→</i></span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </section>

      <section className={styles.sourceAtlas} aria-labelledby="agentic-video-source-atlas-title">
        <header className={styles.sectionHeader}>
          <p className={styles.kicker}>{label(course.copy.ui, "sourceAtlas", "Source atlas")}</p>
          <h2 id="agentic-video-source-atlas-title">
            {course.contentLocale === "zh-Hans"
              ? `${githubCount} 个 GitHub 实现、${standardCount} 个开放标准、${xCount} 个 X 信号、${boundedContextCount} 个其他有界来源`
              : `${githubCount} GitHub implementations, ${standardCount} open standards, ${xCount} X signals, and ${boundedContextCount} other bounded sources`}
          </h2>
          <p>{course.copy.meta.evidenceNote}</p>
        </header>
        <div className={styles.sourceColumns}>
          {(["github-repository", "open-standard", "official-documentation", "legal-policy", "community-issue", "x-post"] as const).map((kind) => (
            <section key={kind} aria-labelledby={`source-kind-${kind}`}>
              <h3 id={`source-kind-${kind}`}>
                {(() => {
                  const example = sources.find((source) => source.kind === kind);
                  return example ? sourceKindLabel(example, course.copy.ui) : kind;
                })()}
              </h3>
              <div className={styles.sourceDetails}>
                {sources.filter((source) => source.kind === kind).map((source) => (
                  <details key={source.id}>
                    <summary><span>{sourceRoleLabel(source.role, course.copy.ui)}</span><strong>{source.title}</strong></summary>
                    <div>
                      <p><strong>{label(course.copy.ui, "supports", "Supports")}</strong>{course.contentLocale === "zh-Hans" ? source.supportsZhHans : source.supports}</p>
                      <p><strong>{label(course.copy.ui, "boundary", "Boundary")}</strong>{course.contentLocale === "zh-Hans" ? source.boundaryZhHans : source.boundary}</p>
                      {source.kind === "x-post" ? (
                        <>
                          <p><strong>{label(course.copy.ui, "verification", "Verification")}</strong>{source.publishedOn} · {xVerificationLabel(source, course.copy.ui)}</p>
                          <p><strong>{label(course.copy.ui, "corroboration", "Corroboration scope")}</strong>{course.contentLocale === "zh-Hans" ? source.corroborationScopeZhHans : source.corroborationScope}</p>
                        </>
                      ) : null}
                      <a href={source.url} target="_blank" rel="noopener noreferrer">{sourceKindLabel(source, course.copy.ui)}<span aria-hidden="true">↗</span></a>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <FinalAssessment
        questions={course.copy.finalAssessment.questions}
        passPercent={course.copy.finalAssessment.passPercent}
        title={course.copy.finalAssessment.title}
        summary={course.copy.finalAssessment.summary}
        labels={course.copy.ui}
      />

      <section className={styles.capstoneIntro} aria-labelledby="agentic-video-capstone-intro-title">
        <div>
          <p className={styles.kicker}>{label(course.copy.ui, "capstone", "Capstone")}</p>
          <h2 id="agentic-video-capstone-intro-title">{course.copy.capstone.title}</h2>
          <p>{course.copy.capstone.summary}</p>
        </div>
        <blockquote>{course.copy.capstone.scenario}</blockquote>
      </section>
      <CapstoneChecklist artifacts={course.copy.capstone.artifacts} statement={course.copy.capstone.completionStatement} labels={course.copy.ui} />
      <section className={styles.postmortem} aria-labelledby="agentic-video-postmortem-title">
        <p className={styles.eyebrow}>{label(course.copy.ui, "postmortem", "Postmortem")}</p>
        <h2 id="agentic-video-postmortem-title">{course.contentLocale === "zh-Hans" ? "复盘系统，不只改提示词" : "Improve the system, not only the prompt"}</h2>
        <ol>{course.copy.capstone.reviewQuestions.map((question) => <li key={question}>{question}</li>)}</ol>
      </section>
    </div>
  );
}
