import Link from "next/link";
import type {
  AgenticVideoEditingSourceRecord,
  AgenticVideoEditingUiKey,
  MaterializedAgenticVideoEditingCourse,
} from "@/staging/course-src/agentic-video-editing";
import {
  AGENTIC_VIDEO_EDITING_SOURCES,
  AGENTIC_VIDEO_EDITING_SOURCE_USAGE,
} from "@/staging/course-src/agentic-video-editing";
import {
  CapstoneChecklist,
  CourseEntryAction,
  CourseModuleStateBadge,
  CourseProgress,
  FinalAssessment,
} from "./Interactions";
import PipelineMap from "./PipelineMap";
import { sourceRoleLabel, xVerificationLabel } from "./source-labels";
import styles from "./AgenticVideoEditingCourse.module.css";

type Labels = MaterializedAgenticVideoEditingCourse["copy"]["ui"];

function NewTabHint({ locale }: { locale: "en" | "zh-Hans" }) {
  return <span className={styles.srOnly}>{locale === "zh-Hans" ? "（在新标签页打开）" : " (opens in a new tab)"}</span>;
}

function label(labels: Labels, key: AgenticVideoEditingUiKey, fallback: string): string {
  const value = labels[key];
  return value && value.trim() ? value : fallback;
}

function sourceType(source: AgenticVideoEditingSourceRecord, labels: Labels): string {
  if (source.kind === "x-post") return label(labels, "xPost", "Dated X field signal");
  if (source.kind === "github-repository") return label(labels, "githubRepository", "GitHub repository");
  if (source.kind === "dated-repository-issue") return label(labels, "datedRepositoryIssue", "Unconfirmed dated user report");
  if (source.kind === "official-standard") return label(labels, "officialStandard", "Official standard");
  if (source.kind === "official-documentation") return label(labels, "officialDocumentation", "Official documentation");
  if (source.kind === "regulatory-guidance") return label(labels, "regulatoryGuidance", "Jurisdiction-specific regulatory guidance");
  if (source.kind === "law-regulation") return label(labels, "lawRegulation", "Jurisdiction-specific law or regulation");
  if (source.kind === "primary-research") return label(labels, "primaryResearch", "Primary research");
  return label(labels, "datedOfficialWeb", "Dated official guidance");
}

function sourceUsageLabel(usage: string, locale: "en" | "zh-Hans"): string {
  if (usage === "claim-evidence") return locale === "zh-Hans" ? "主张证据" : "Claim evidence";
  if (usage === "version-watch") return locale === "zh-Hans" ? "版本观察" : "Version watch";
  if (usage === "field-signal-context") return locale === "zh-Hans" ? "带日期的领域信号背景" : "Dated field-signal context";
  return locale === "zh-Hans" ? "仅列于来源图谱" : "Source-atlas reference only";
}

function officialXOEmbedUrl(source: AgenticVideoEditingSourceRecord): string | null {
  if (source.kind !== "x-post") return null;
  return source.claimEvidenceUrls.find(
    (url) => url.startsWith("https://publish.x.com/oembed?"),
  ) ?? null;
}

function SourceEvidenceDisclosure({
  source,
  labels,
  locale,
}: {
  source: AgenticVideoEditingSourceRecord;
  labels: Labels;
  locale: "en" | "zh-Hans";
}) {
  const evidenceUrls = [...new Set(source.claimEvidenceUrls)]
    .filter((url) => url !== source.url);
  const oEmbedUrl = officialXOEmbedUrl(source);
  return (
    <section className={styles.sourceEvidenceDisclosure} aria-label={locale === "zh-Hans" ? "精确证据与版本锚点" : "Exact evidence and version anchors"}>
      <h4>{locale === "zh-Hans" ? "精确证据与版本锚点" : "Exact evidence and version anchors"}</h4>
      <dl>
        <div><dt>{locale === "zh-Hans" ? "课程用途" : "Course usage"}</dt><dd>{sourceUsageLabel(AGENTIC_VIDEO_EDITING_SOURCE_USAGE[source.id], locale)}</dd></div>
        <div>
          <dt>{locale === "zh-Hans" ? "主要证据" : "Primary evidence"}</dt>
          <dd><a href={source.url} target="_blank" rel="noopener noreferrer">{source.url}<span aria-hidden="true">↗</span><NewTabHint locale={locale} /></a></dd>
        </div>
        {evidenceUrls.length > 0 ? (
          <div>
            <dt>{locale === "zh-Hans" ? "补充证据" : "Additional evidence"}</dt>
            <dd><ol>{evidenceUrls.map((url) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{url}<span aria-hidden="true">↗</span><NewTabHint locale={locale} /></a></li>)}</ol></dd>
          </div>
        ) : null}
        {source.resolvedCommit ? <div><dt>{locale === "zh-Hans" ? "固定提交" : "Resolved commit"}</dt><dd><code>{source.resolvedCommit}</code></dd></div> : null}
        {source.versionAnchorUrl ? <div><dt>{locale === "zh-Hans" ? "发布／标签" : "Release / tag"}</dt><dd><a href={source.versionAnchorUrl} target="_blank" rel="noopener noreferrer">{source.revision ?? source.versionAnchorUrl}<span aria-hidden="true">↗</span><NewTabHint locale={locale} /></a></dd></div> : null}
        {source.license ? <div><dt>{label(labels, "license", "License")}</dt><dd>{source.license}</dd></div> : null}
        {source.kind === "x-post" && oEmbedUrl ? <div><dt>{locale === "zh-Hans" ? "官方 oEmbed 核验" : "Official oEmbed verification"}</dt><dd><a href={oEmbedUrl} target="_blank" rel="noopener noreferrer">{source.verificationMethod} · {source.verifiedOn}<span aria-hidden="true">↗</span><NewTabHint locale={locale} /></a></dd></div> : null}
      </dl>
    </section>
  );
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
  const sources = [...AGENTIC_VIDEO_EDITING_SOURCES];
  const githubCount = sources.filter((source) => source.kind === "github-repository").length;
  const xCount = sources.filter((source) => source.kind === "x-post").length;
  const officialCount = sources.length - githubCount - xCount;
  const isZhHans = course.contentLocale === "zh-Hans";
  const preflightTerms = course.copy.preflight.terms;
  const practicumLabSlugs = course.modules
    .filter((module) => module.productionLabAvailable)
    .map((module) => module.slug);
  const dashboardModules = course.modules.map((module) => ({
    slug: module.slug,
    href: hrefFor(module.slug),
    title: module.copy.title,
  }));
  const starterFiles = course.contentLocale === "zh-Hans"
    ? [
      ["creative-brief.fixture.json", "v2 创作简报、责任边界与停止条件"],
      ["media-manifest.fixture.yaml", "绑定冻结原创媒体的 v2 素材、权利、时钟与隔离清单"],
      ["artifact-submission.schema.json", "artifact envelope、内容 hash、依赖 hash 与验证回执合同"],
      ["edit-plan.schema.json", "仅用于浏览器选择练习、始终阻断执行的 teaching v2 schema"],
      ["edit-plan-v3.schema.json", "工具中立的 production Edit Plan v3 通用 schema"],
      ["delivery-contract.schema.json", "字幕、音频、画幅、safe zone、无障碍与色彩交付合同"],
      ["lab/project-spec.v2.json", "原创、离线、无人物的媒体实验规格"],
      ["lab/edit-plan-v3-fixture.schema.json", "叠加在通用 v3 之上的 Course 20 fixture 限制"],
      ["lab/failure-ledger.v1.json", "同步、响度、字幕、对比、闪烁、色彩、裁切与 freeze 故障账本"],
      ["lab/frozen-media-receipt.v1.json", "冻结媒体 hash、环境与可复现性边界"],
      ["qc-checklist.md", "双语技术、含义、权利与发布审校表"],
      ["NOTICE.md", "原创、许可证、媒体与发布边界"],
      ["fixtures.provenance.json", "学习文件的 SHA-256 完整性清单"],
    ]
    : [
      ["creative-brief.fixture.json", "v2 creative brief, responsibility boundary, and stop conditions"],
      ["media-manifest.fixture.yaml", "v2 asset, rights, clock, and quarantine ledger bound to the frozen original"],
      ["artifact-submission.schema.json", "Artifact envelope, content hash, dependency hash, and validation-receipt contract"],
      ["edit-plan.schema.json", "Selection-only teaching v2 schema that always blocks execution"],
      ["edit-plan-v3.schema.json", "Tool-neutral generic production Edit Plan v3 schema"],
      ["delivery-contract.schema.json", "Caption, audio, aspect, safe-zone, accessibility, and color delivery contract"],
      ["lab/project-spec.v2.json", "Original, offline, no-person media-lab specification"],
      ["lab/edit-plan-v3-fixture.schema.json", "Course 20 fixture constraints layered over generic v3"],
      ["lab/failure-ledger.v1.json", "Sync, loudness, caption, contrast, flash, color, crop, and freeze fault ledger"],
      ["lab/frozen-media-receipt.v1.json", "Frozen media hashes, environment, and reproducibility boundary"],
      ["qc-checklist.md", "Bilingual technical, meaning, rights, and release review"],
      ["NOTICE.md", "Originality, license, media, and release boundary"],
      ["fixtures.provenance.json", "SHA-256 integrity ledger for the learning files"],
    ];

  return (
    <div
      className={`shellwrap ${styles.root} ${styles.coursePage}`}
      lang={course.contentLocale}
      dir={course.contentDirection}
      data-testid="agentic-video-editing-course-dashboard"
    >
      {course.locale !== course.contentLocale ? (
        <p className={styles.languageNotice}>{course.copy.meta.translationNote}</p>
      ) : null}

      <nav className={styles.breadcrumb} aria-label={catalogLabel}>
        <Link href={`/${course.locale}/courses/`}><span aria-hidden="true">←</span>{catalogLabel}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{label(course.copy.ui, "course", "Course")} 20</span>
      </nav>

      <header className={styles.hero} id="course20-overview">
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>{course.copy.meta.kicker}</p>
          <h1>{course.copy.meta.title}</h1>
          <p className={styles.heroSummary}>{course.copy.meta.summary}</p>
          <div className={styles.buttonRow}>
            <CourseEntryAction
              modules={dashboardModules}
              startLabel={course.copy.meta.startCta}
              resumeLabel={course.copy.meta.resumeCta}
            />
            <a className={styles.secondaryButton} href="#agentic-video-curriculum">
              {label(course.copy.ui, "tableOfContents", "Course map")}
            </a>
          </div>
          <p className={styles.heroAudience}>{course.copy.meta.audience}</p>
        </div>
        <PipelineMap labels={course.copy.ui} locale={course.contentLocale} />
      </header>

      <section className={styles.courseFacts} aria-label={isZhHans ? "课程概况" : "Course facts"}>
        <dl>
          <div><dt>{label(course.copy.ui, "modules", "Modules")}</dt><dd>{course.modules.length}</dd></div>
          <div><dt>{isZhHans ? "核心引导" : "Core guided"}</dt><dd>{totalMinutes} {isZhHans ? "分钟" : "min"}</dd></div>
          <div><dt>{isZhHans ? "fixture-safe 本地实验" : "Fixture-safe local lab"}</dt><dd>180 {isZhHans ? "分钟" : "min"}</dd></div>
          <div><dt>{isZhHans ? "独立 Capstone" : "Independent capstone"}</dt><dd>≈240 {isZhHans ? "分钟" : "min"}</dd></div>
        </dl>
        <p><strong>{course.copy.meta.level}</strong><span>{course.copy.meta.duration}</span></p>
      </section>

      <nav className={styles.courseNavigator} aria-label={isZhHans ? "Course 20 快速导航" : "Course 20 quick navigation"}>
        <a href="#course20-overview">{isZhHans ? "概览" : "Overview"}</a>
        <a href="#agentic-video-progress">{isZhHans ? "进度" : "Progress"}</a>
        <a href="#agentic-video-curriculum">{isZhHans ? "模块" : "Modules"}</a>
        <a href="#agentic-video-editing-assessment">{isZhHans ? "测评" : "Assessment"}</a>
        <a href="#agentic-video-editing-capstone-verified-cut">Capstone</a>
        <a href="#agentic-video-course-reference">{isZhHans ? "工具与证据" : "Toolkit & evidence"}</a>
      </nav>

      <CourseProgress
        {...{
          modules: dashboardModules,
          labels: course.copy.ui,
          startLabel: course.copy.meta.startCta,
          resumeLabel: course.copy.meta.resumeCta,
          coreMilestones: 12,
          practicumLabSlugs,
          disclaimer: isZhHans
            ? "完成状态不是正式证书、媒体权利证明或发布授权。"
            : "Completion is not a formal certificate, proof of media rights, or publication authorization.",
        }}
      />

      <section className={styles.curriculum} id="agentic-video-curriculum" aria-labelledby="agentic-video-curriculum-title">
        <header className={styles.sectionHeader}>
          <p className={styles.kicker}>{label(course.copy.ui, "tableOfContents", "Course map")}</p>
          <h2 id="agentic-video-curriculum-title">
            {course.contentLocale === "zh-Hans" ? "四个阶段，十个可交付模块" : "Four phases, ten deliverable modules"}
          </h2>
          <p>{course.contentLocale === "zh-Hans" ? "来源主张绑定精确证据；课程自定义规范标注为工程综合。阅读始终开放，只有“记为完成”受软依赖门约束。" : "Source-grounded claims bind exact evidence; course-authored rules are marked as engineering synthesis. Reading stays open, while completion follows soft dependency gates."}</p>
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
                        <CourseModuleStateBadge slug={module.slug} labels={course.copy.ui} />
                      </span>
                      <span className={styles.moduleTime}>{isZhHans
                        ? `${module.minutes} 分钟核心 · +${module.extensionMinutes} 分钟本地实验`
                        : `${module.minutes} min core · +${module.extensionMinutes} min local lab`}<i aria-hidden="true">→</i></span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </section>

      <details className={styles.courseReference} id="agentic-video-course-reference">
        <summary>
          <span>
            <strong>{isZhHans ? "课程工具与证据库" : "Course toolkit & evidence library"}</strong>
            <small>{isZhHans ? "准备路径、起始文件、离线媒体、系统区分、成果与来源" : "Readiness lanes, starter files, offline media, system distinctions, outcomes, and sources"}</small>
          </span>
          <span aria-hidden="true">＋</span>
        </summary>
        <div className={styles.courseReferenceBody}>

      <section className={styles.preflight} aria-labelledby="agentic-video-preflight-title">
        <div className={styles.preflightHeader}>
          <p className={styles.eyebrow}>{isZhHans ? "开始前 · 包含在模块 1 时间内" : "Before you start · included in Module 1"}</p>
          <h2 id="agentic-video-preflight-title">{course.copy.preflight.title}</h2>
          <p>{course.copy.preflight.summary}</p>
          <p><strong>{isZhHans ? "先备知识：" : "Prerequisite: "}</strong>{course.copy.meta.prerequisite}</p>
        </div>
        <details>
          <summary>{isZhHans ? "查看最低制作词汇" : "Review the minimum production vocabulary"}<span aria-hidden="true">＋</span></summary>
          <dl>{preflightTerms.map(([term, definition]) => <div key={term}><dt>{term}</dt><dd>{definition}</dd></div>)}</dl>
        </details>
        <nav className={styles.pathChoice} aria-label={isZhHans ? "选择课程路径" : "Choose a course path"}>
          <a href="#core-track-path">
            <span>{isZhHans ? "fixture-safe 浏览器合同 · 750 分钟引导学习" : "Fixture-safe browser contracts · 750 guided minutes"}</span>
            <strong>{course.copy.preflight.auditCore.title}</strong>
            <small>{course.copy.preflight.auditCore.summary}</small>
          </a>
          <a href="#production-sandbox-path">
            <span>{isZhHans ? "production-sandbox · 不计分迁移" : "Production-sandbox · unscored transfer"}</span>
            <strong>{course.copy.preflight.productionPracticum.title}</strong>
            <small>{course.copy.preflight.productionPracticum.summary}</small>
            <ul>{course.copy.preflight.productionPracticum.localChecks.map((check) => <li key={check}>{check}</li>)}</ul>
          </a>
        </nav>
        <p className={styles.preflightBoundary}>{course.copy.preflight.learnerOwnedExtension}</p>
      </section>

      <section className={styles.pathProgressIntro} aria-labelledby="agentic-video-path-progress-title">
        <header className={styles.sectionHeader}>
          <p className={styles.kicker}>{isZhHans ? "两条明确路径，同一发布边界" : "Two explicit lanes, one release boundary"}</p>
          <h2 id="agentic-video-path-progress-title">{isZhHans ? "真实制作能力由产物与回执证明" : "Production competence is proven by artifacts and receipts"}</h2>
        </header>
        <div>
          <article id="core-track-path">
            <span>12</span><div><h3>{isZhHans ? "fixture-safe 路径" : "Fixture-safe lane"}</h3><p>{isZhHans ? "浏览器合同、10 个依赖有序模块、正式测验与十二项 Verified Cut 形成课程自我追踪；只有另行运行 122→47 秒第一方本地闭环并导入 current receipts，才能增加 synthetic portfolio locally attested 声明。" : "Browser contracts, ten dependency-ordered modules, the formal assessment, and twelve Verified Cut artifacts form course self-tracking. Only a separate 122-to-47-second first-party local run with current imported receipts adds the synthetic-portfolio-locally-attested claim."}</p></div>
          </article>
          <article id="production-sandbox-path">
            <span>{isZhHans ? "迁移" : "Transfer"}</span><div><h3>{isZhHans ? "production-sandbox 路径" : "Production-sandbox lane"}</h3><p>{isZhHans ? "这是不计分、不可由合成 receipts 代替的迁移：只使用学习者合法控制的媒体、本地或明确获批工具与具名人审；真实目的地必须重做权利、隐私、安全、交付与恢复 preflight。" : "This is an unscored transfer that synthetic receipts cannot satisfy: use only learner-controlled media, local or explicitly approved tools, and named human review; repeat rights, privacy, security, delivery, and recovery preflight for the real destination."}</p></div>
          </article>
        </div>
        <p>{isZhHans ? "浏览器进度与本地实验进度都不是正式证书、媒体权利证明、production-sandbox 验证或发布授权。" : "Browser and local-lab progress are not a formal certificate, proof of media rights, production-sandbox validation, or publication authorization."}</p>
      </section>

      <ul className={styles.principles} aria-label={isZhHans ? "课程制作原则" : "Course production principles"}>
        {course.copy.principles.map((principle) => <li key={principle}>{principle}</li>)}
      </ul>

      <section className={styles.starterKit} aria-labelledby="agentic-video-starter-kit-title">
        <header className={styles.sectionHeader}>
          <p className={styles.kicker}>{course.contentLocale === "zh-Hans" ? "离线起始包" : "Offline starter pack"}</p>
          <h2 id="agentic-video-starter-kit-title">{course.contentLocale === "zh-Hans" ? "先练合同，不上传媒体" : "Practice the contract before uploading media"}</h2>
          <p>{course.contentLocale === "zh-Hans" ? "机器可读 starter、schema、本地实验规格、审校表和 SHA-256 完整性清单只包含原创文本、结构与第一方合成实验定义，并默认阻断发布。它们不含真实人物媒体、凭据或第三方素材。" : "Machine-readable starters, schemas, local-lab specifications, review guidance, and a SHA-256 integrity ledger contain only original text, structures, and first-party synthetic-lab definitions. They default to blocked release and include no real-person media, credentials, or third-party assets."}</p>
        </header>
        <ul className={styles.starterFiles}>
          {starterFiles.map(([name, purpose], index) => (
            <li key={name}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><strong>{name}</strong><small>{purpose}</small></div>
              <a href={`/courses/agentic-video-editing/${name}`} download>{course.contentLocale === "zh-Hans" ? "下载" : "Download"}<span className={styles.srOnly}> {name}</span><span aria-hidden="true">↓</span></a>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.offlineMediaLab} aria-labelledby="agentic-video-offline-lab-title">
        <header className={styles.sectionHeader}>
          <p className={styles.kicker}>{isZhHans ? "可播放的原创反证面" : "Playable first-party falsification surface"}</p>
          <h2 id="agentic-video-offline-lab-title">
            {isZhHans ? "检查 122 秒黄金主源与六秒故障对照" : "Inspect the 122-second golden source and six-second fault control"}
          </h2>
          <p>
            {isZhHans
              ? "两段 MP4 均由项目用几何图形、像素文字、时间码、测试音与静音生成；不含人物、个人数据、第三方媒体、模型输出或发布权限。它们用于 probe、字幕、裁切、同步、色彩与回滚练习，不替代 45–60 秒学习者 capstone。"
              : "Both MP4 files are project-generated from geometry, pixel text, timecode, test tone, and silence. They contain no people, personal data, third-party media, model output, or publication authority. Use them for probe, caption, crop, sync, color, and rollback practice—not as the learner’s 45–60 second capstone."}
          </p>
        </header>
        <div className={styles.offlineMediaGrid}>
          <article>
            <div className={styles.mediaStatus} data-status="control">
              <span>{isZhHans ? "原创控制样本" : "First-party control"}</span>
              <code>SHA-256 a845ab…dbeab1</code>
            </div>
            <video
              controls
              preload="metadata"
              playsInline
              aria-label={isZhHans ? "Course 20 原创离线控制媒体" : "Course 20 original offline control media"}
              aria-describedby="course20-original-control-description"
            >
              <source src="/courses/agentic-video-editing/lab/frozen/course20-original-fixture.mp4" type="video/mp4" />
              {isZhHans ? "你的浏览器不支持 MP4 视频。" : "Your browser does not support MP4 video."}
            </video>
            <h3>{isZhHans ? "可探测基准" : "Inspectable baseline"}</h3>
            <p id="course20-original-control-description">{isZhHans ? "122 秒、320×180、30/1 CFR、H.264/AAC、48 kHz 单声道连续 440 Hz 测试音；这是四段黄金计划的 canonical 源。视频无语音，因此不附加 47 秒候选片的字幕时间线。精确字节由冻结回执约束；不同 FFmpeg 环境只承诺结构性观察，不承诺逐字节重建。" : "This 122-second, 320×180, 30/1 CFR H.264/AAC source contains a continuous 440 Hz mono test tone at 48 kHz and no speech, so the separate 47-second candidate-caption timeline is not attached here. It is the canonical source for the four-segment golden plan. The frozen receipt binds exact bytes; other FFmpeg environments promise structural observations, not byte-identical rebuilds."}</p>
          </article>
          <article>
            <div className={styles.mediaStatus} data-status="fault">
              <span>{isZhHans ? "故意失败的对照" : "Intentionally failing control"}</span>
              <code>SHA-256 4199e2…f8b7c</code>
            </div>
            <video
              controls
              preload="metadata"
              playsInline
              aria-label={isZhHans ? "Course 20 故障媒体对照" : "Course 20 known-fault media control"}
              aria-describedby="course20-fault-control-description"
            >
              <source src="/courses/agentic-video-editing/lab/frozen/course20-fault-reel.mp4" type="video/mp4" />
              {isZhHans ? "你的浏览器不支持 MP4 视频。" : "Your browser does not support MP4 video."}
            </video>
            <h3>{isZhHans ? "不得自动修复或发布" : "Never auto-repair or publish"}</h3>
            <p id="course20-fault-control-description">{isZhHans ? "这是一段无语音的六秒故障对照。为避免把故意重叠、越界且超出媒体时长的英文 WebVTT 误当作播放字幕，页面不默认加载该侧车文件。故障账本要求检测同步漂移、响度／true peak、字幕与非语音提示、对比／闪烁、视觉描述适用性、色彩标签、裁切／安全区、freeze 与误导性 B-roll。" : "This is a six-second, no-speech fault control. Its English WebVTT sidecar intentionally contains overlapping, unsafe, and out-of-range cues, so the page does not load it as default playback captions. The failure ledger requires detection of sync drift, loudness/true peak, captions and non-speech cues, contrast/flash, visual-description applicability, color tags, crop/safe zones, freeze, and misleading B-roll."}</p>
          </article>
        </div>
        <nav className={styles.offlineMediaLinks} aria-label={isZhHans ? "离线实验审计文件" : "Offline lab audit files"}>
          <a href="/courses/agentic-video-editing/lab/project-spec.v2.json">{isZhHans ? "项目规格" : "Project spec"}<span aria-hidden="true">›</span></a>
          <a href="/courses/agentic-video-editing/lab/failure-ledger.v1.json">{isZhHans ? "故障账本" : "Failure ledger"}<span aria-hidden="true">›</span></a>
          <a href="/courses/agentic-video-editing/lab/frozen-media-receipt.v1.json">{isZhHans ? "冻结回执" : "Frozen receipt"}<span aria-hidden="true">›</span></a>
          <a href="/courses/agentic-video-editing/lab/fixture-manifest.v1.json">{isZhHans ? "实验清单" : "Fixture manifest"}<span aria-hidden="true">›</span></a>
          <a href="/courses/agentic-video-editing/lab/course20-review-candidate.en.vtt" hrefLang="en" download>{isZhHans ? "47 秒候选片英文字幕" : "47-second candidate captions"}<span aria-hidden="true">↓</span></a>
          <a href="/courses/agentic-video-editing/lab/course20-fault-reel.en.vtt" hrefLang="en" download>{isZhHans ? "英文故障字幕对照" : "Fault caption control"}<span aria-hidden="true">↓</span></a>
        </nav>
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

      <section className={styles.sourceAtlas} aria-labelledby="agentic-video-source-atlas-title">
        <header className={styles.sectionHeader}>
          <p className={styles.kicker}>{label(course.copy.ui, "sourceAtlas", "Source atlas")}</p>
          <h2 id="agentic-video-source-atlas-title">
            {course.contentLocale === "zh-Hans" ? `${officialCount} 个官方／标准／法域来源，${githubCount} 个 GitHub 实现来源，${xCount} 个 X 实践信号` : `${officialCount} official, standards, and jurisdiction sources; ${githubCount} GitHub implementation sources; ${xCount} X field signals`}
          </h2>
          <p>{course.copy.meta.evidenceNote}</p>
        </header>
        <div className={styles.sourceColumns}>
          {(["official", "github-repository", "x-post"] as const).map((kind) => (
            <section key={kind} aria-labelledby={`source-kind-${kind}`}>
              <h3 id={`source-kind-${kind}`}>{kind === "official" ? (isZhHans ? "官方标准、文档与法域来源" : "Official standards, documentation, and jurisdiction sources") : kind === "github-repository" ? label(course.copy.ui, "githubRepository", "GitHub repositories") : label(course.copy.ui, "xPost", "X field signals")}</h3>
              <div className={styles.sourceDetails}>
                {sources.filter((source) => kind === "official" ? source.kind !== "github-repository" && source.kind !== "x-post" : source.kind === kind).map((source) => (
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
                      <SourceEvidenceDisclosure source={source} labels={course.copy.ui} locale={course.contentLocale} />
                      <a href={source.url} target="_blank" rel="noopener noreferrer">{sourceType(source, course.copy.ui)}<span aria-hidden="true">↗</span><NewTabHint locale={course.contentLocale} /></a>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

        </div>
      </details>

      <FinalAssessment
        questions={course.copy.finalAssessment.questions}
        passPercent={course.copy.finalAssessment.passPercent}
        title={course.copy.finalAssessment.title}
        summary={course.copy.finalAssessment.summary}
        labels={course.copy.ui}
        moduleLinks={Object.fromEntries(course.modules.map((module) => [
          module.slug,
          { href: hrefFor(module.slug), order: module.order, title: module.copy.title },
        ]))}
      />

      {(() => {
        const capstone = course.copy.capstone.production;
        return (
          <div className={styles.capstonePath} data-path="verified-cut">
            <section className={styles.capstoneIntro} aria-labelledby="agentic-video-verified-cut-capstone-title">
              <div>
                <p className={styles.kicker}>The Verified Cut · Capstone</p>
                <h2 id="agentic-video-verified-cut-capstone-title">{capstone.title}</h2>
                <p>{capstone.summary}</p>
              </div>
              <blockquote>{capstone.scenario}</blockquote>
            </section>
            <CapstoneChecklist
              {...{
                artifacts: capstone.criteria.map((criterion) => criterion.label) as [string, ...string[]],
                criteria: capstone.criteria,
                statement: capstone.completionStatement,
                labels: course.copy.ui,
              }}
            />
            <section className={styles.postmortem} aria-labelledby="agentic-video-verified-cut-postmortem-title">
              <p className={styles.eyebrow}>Postmortem</p>
              <h2 id="agentic-video-verified-cut-postmortem-title">{course.contentLocale === "zh-Hans" ? "复盘制作系统，不只改提示词" : "Improve the production system, not only the prompt"}</h2>
              <ol>{capstone.reviewQuestions.map((question) => <li key={question}>{question}</li>)}</ol>
            </section>
          </div>
        );
      })()}
    </div>
  );
}
