import Link from "next/link";
import type {
  AgenticVideoEditingClaimCopy,
  AgenticVideoEditingEvidenceMode,
  AgenticVideoEditingPracticeCopy,
  AgenticVideoEditingSourceRecord,
  AgenticVideoEditingUiKey,
  MaterializedAgenticVideoEditingCourse,
  MaterializedAgenticVideoEditingModule,
} from "@/staging/course-src/agentic-video-editing";
import { getAgenticVideoEditingClaim } from "@/staging/course-src/agentic-video-editing";
import {
  ArtifactWorkbench,
  CourseModuleProgressMap,
  CutPlanLab,
  ModuleCheckpoint,
  ModuleCompletion,
} from "./Interactions";
import { sourceRoleLabel, xVerificationLabel } from "./source-labels";
import styles from "./AgenticVideoEditingCourse.module.css";

type Labels = MaterializedAgenticVideoEditingCourse["copy"]["ui"];

function NewTabHint({ locale }: { locale: "en" | "zh-Hans" }) {
  return <span className={styles.srOnly}>{locale === "zh-Hans" ? "（在新标签页打开）" : " (opens in a new tab)"}</span>;
}

type PracticeUiCopy = AgenticVideoEditingPracticeCopy & {
  readonly artifactFilename?: string;
  readonly artifactContractId?: string;
  readonly requiredDependencySlugs?: readonly string[];
  readonly acceptanceChecks?: readonly string[];
  readonly estimatedMinutes?: number;
};

type PracticeCompatibility = {
  readonly practice?: AgenticVideoEditingPracticeCopy;
  readonly corePractice?: AgenticVideoEditingPracticeCopy;
  readonly productionPractice?: AgenticVideoEditingPracticeCopy;
};

function label(labels: Labels, key: AgenticVideoEditingUiKey, fallback: string): string {
  const value = labels[key];
  return value && value.trim() ? value : fallback;
}

function evidenceModeLabel(mode: AgenticVideoEditingEvidenceMode, labels: Labels): string {
  if (mode === "source-grounded") return label(labels, "sourceGrounded", "Source-grounded");
  if (mode === "engineering-synthesis") return label(labels, "engineeringSynthesis", "Engineering synthesis");
  if (mode === "course-policy") return label(labels, "coursePolicy", "Course fail-closed policy");
  if (mode === "jurisdiction-dependent") return label(labels, "jurisdictionGuidance", "Jurisdiction-dependent guidance");
  if (mode === "official-standard") return label(labels, "officialStandard", "Official standard");
  if (mode === "dated-observation") return label(labels, "datedObservation", "Dated observation");
  return label(labels, "versionWatch", "Version watch");
}

function claimKindLabel(kind: string, locale: "en" | "zh-Hans"): string {
  if (kind === "implementation-fact") return locale === "zh-Hans" ? "实现事实" : "Implementation fact";
  if (kind === "engineering-synthesis") return locale === "zh-Hans" ? "工程综合" : "Engineering synthesis";
  if (kind === "course-fail-closed-policy") return locale === "zh-Hans" ? "课程故障关闭政策" : "Course fail-closed policy";
  return locale === "zh-Hans" ? "依司法辖区而定的指引" : "Jurisdiction-dependent guidance";
}

function claimSupportLabel(support: string, locale: "en" | "zh-Hans"): string {
  if (support === "direct") return locale === "zh-Hans" ? "直接支持" : "Direct support";
  if (support === "derived") return locale === "zh-Hans" ? "推导支持" : "Derived support";
  return locale === "zh-Hans" ? "课程政策" : "Course policy";
}

function ClaimRegistryReferences({
  claimIds,
  locale,
}: {
  claimIds: readonly string[];
  locale: "en" | "zh-Hans";
}) {
  return (
    <aside className={styles.claimRegistry}>
      <strong>{locale === "zh-Hans" ? "主张登记" : "Claim registry"}</strong>
      <ul>
        {claimIds.map((claimId) => {
          const claim = getAgenticVideoEditingClaim(claimId);
          return (
            <li key={claimId}>
              <code>{claim.id}</code>
              <span>{claimKindLabel(claim.kind, locale)} · {claimSupportLabel(claim.support, locale)}</span>
              <p>{locale === "zh-Hans" ? claim.textZhHans : claim.text}</p>
              <small>{locale === "zh-Hans" ? claim.boundaryZhHans : claim.boundary}</small>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function sourceKindLabel(source: AgenticVideoEditingSourceRecord, labels: Labels): string {
  if (source.kind === "x-post") return label(labels, "xPost", "Dated X field signal");
  if (source.kind === "github-repository") return label(labels, "githubRepository", "GitHub repository");
  if (source.kind === "dated-repository-issue") return label(labels, "datedRepositoryIssue", "Unconfirmed dated user report");
  if (source.kind === "official-standard") return label(labels, "officialStandard", "Official standard");
  if (source.kind === "official-documentation") return label(labels, "officialDocumentation", "Official documentation");
  if (source.kind === "law-regulation") return label(labels, "lawRegulation", "Jurisdiction-specific law or regulation");
  if (source.kind === "regulatory-guidance") return label(labels, "regulatoryGuidance", "Jurisdiction-specific regulatory guidance");
  if (source.kind === "primary-research") return label(labels, "primaryResearch", "Primary research");
  return label(labels, "datedOfficialWeb", "Dated official guidance");
}

function officialXOEmbedUrl(source: AgenticVideoEditingSourceRecord): string | null {
  if (source.kind !== "x-post") return null;
  return source.claimEvidenceUrls.find(
    (url) => url.startsWith("https://publish.x.com/oembed?"),
  ) ?? null;
}

function sourceEvidenceUrls(source: AgenticVideoEditingSourceRecord): readonly string[] {
  return [...new Set([source.url, ...source.claimEvidenceUrls])];
}

function practiceCopies(module: MaterializedAgenticVideoEditingModule): {
  core: PracticeUiCopy;
  production: PracticeUiCopy | null;
} {
  const copy = module.copy as unknown as PracticeCompatibility;
  const core = copy.corePractice ?? copy.practice;
  if (!core) throw new Error(`Course 20 module ${module.slug} is missing core practice copy.`);
  return {
    core: core as PracticeUiCopy,
    production: (copy.productionPractice as PracticeUiCopy | undefined) ?? null,
  };
}

function PracticeDetails({
  practice,
  labels,
  locale,
}: {
  practice: PracticeUiCopy;
  labels: Labels;
  locale: "en" | "zh-Hans";
}) {
  return (
    <>
      <p className={styles.practiceBrief}>{practice.brief}</p>
      <div className={styles.practiceGrid}>
        <div>
          <h3>{label(labels, "workSequence", "Work sequence")}</h3>
          <ol>{practice.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          {practice.acceptanceChecks?.length ? (
            <div className={styles.acceptanceChecks}>
              <h3>{locale === "zh-Hans" ? "验收检查" : "Acceptance checks"}</h3>
              <ul>{practice.acceptanceChecks.map((check) => <li key={check}>{check}</li>)}</ul>
            </div>
          ) : null}
        </div>
        <aside>
          <p className={styles.eyebrow}>{label(labels, "humanGate", "Human gate")}</p><p>{practice.reviewGate}</p>
          <hr />
          <p className={styles.eyebrow}>{label(labels, "aiBoundary", "Agent boundary")}</p><p>{practice.aiBoundary}</p>
          {practice.artifactFilename || practice.artifactContractId ? (
            <dl className={styles.practiceContract}>
              {practice.artifactFilename ? <div><dt>{locale === "zh-Hans" ? "文件" : "File"}</dt><dd><code>{practice.artifactFilename}</code></dd></div> : null}
              {practice.artifactContractId ? <div><dt>{locale === "zh-Hans" ? "合同" : "Contract"}</dt><dd><code>{practice.artifactContractId}</code></dd></div> : null}
            </dl>
          ) : null}
        </aside>
      </div>
    </>
  );
}

function ClaimEvidence({
  claim,
  sources,
  labels,
  locale,
}: {
  claim: AgenticVideoEditingClaimCopy;
  sources: readonly AgenticVideoEditingSourceRecord[];
  labels: Labels;
  locale: "en" | "zh-Hans";
}) {
  const claimSources = claim.sourceIds
    .map((sourceId) => sources.find((source) => source.id === sourceId))
    .filter(Boolean) as AgenticVideoEditingSourceRecord[];
  return (
    <div className={styles.claimBlock} data-mode={claim.evidenceMode}>
      <p className={styles.evidenceBadge} data-mode={claim.evidenceMode}>{evidenceModeLabel(claim.evidenceMode, labels)}</p>
      <p>{claim.text}</p>
      {claimSources.length ? (
        <details className={styles.claimEvidence}>
          <summary>{label(labels, "evidence", "Evidence")} · {claimSources.length}</summary>
          <ul>{claimSources.flatMap((source) => sourceEvidenceUrls(source).map((url) => <li key={`${source.id}:${url}`}><a href={url} target="_blank" rel="noopener noreferrer">{source.title}: {url}<span aria-hidden="true">↗</span><NewTabHint locale={locale} /></a></li>))}</ul>
        </details>
      ) : null}
    </div>
  );
}


function ModuleMap({
  course,
  activeSlug,
}: {
  course: MaterializedAgenticVideoEditingCourse;
  activeSlug: MaterializedAgenticVideoEditingModule["slug"];
}) {
  return (
    <CourseModuleProgressMap
      activeSlug={activeSlug}
      labels={course.copy.ui}
      phases={course.phases.map((phase) => ({
        id: phase.id,
        title: phase.copy.title,
        modules: phase.modules.map((module) => ({
          slug: module.slug,
          order: module.order,
          title: module.copy.title,
          href: `/${course.locale}/agentic-video-editing/${module.slug}/`,
        })),
      }))}
    />
  );
}

export default function ModuleView({
  course,
  module,
}: {
  course: MaterializedAgenticVideoEditingCourse;
  module: MaterializedAgenticVideoEditingModule;
}) {
  const index = course.modules.findIndex((candidate) => candidate.slug === module.slug);
  const previous = index > 0 ? course.modules[index - 1] : null;
  const next = index < course.modules.length - 1 ? course.modules[index + 1] : null;
  const phase = course.phases.find((candidate) => candidate.id === module.phaseId)!;
  const courseHref = `/${course.locale}/agentic-video-editing/`;
  const hrefFor = (slug: string) => `/${course.locale}/agentic-video-editing/${slug}/`;
  const practices = practiceCopies(module);
  const prerequisiteModules = module.prerequisiteSlugs
    .map((slug) => course.modules.find((candidate) => candidate.slug === slug))
    .filter(Boolean) as MaterializedAgenticVideoEditingModule[];
  const isZhHans = course.contentLocale === "zh-Hans";

  return (
    <div
      className={`shellwrap ${styles.root} ${styles.modulePage}`}
      lang={course.contentLocale}
      dir={course.contentDirection}
      data-testid={`agentic-video-editing-module-${module.slug}`}
    >
      {course.locale !== course.contentLocale ? <p className={styles.languageNotice}>{course.copy.meta.translationNote}</p> : null}
      <nav className={styles.breadcrumb} aria-label={isZhHans ? "课程导航路径" : "Course breadcrumb"}>
        <Link href={courseHref}><span aria-hidden="true">←</span>{label(course.copy.ui, "tableOfContents", "Course map")}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{label(course.copy.ui, "module", "Module")} {module.order}</span>
      </nav>

      <details className={styles.mobileMap}>
        <summary><span>{label(course.copy.ui, "tableOfContents", "Course map")}</span><span>{module.order} / {course.modules.length}</span></summary>
        <nav aria-label={isZhHans ? "全部课程模块" : "All course modules"}><ModuleMap course={course} activeSlug={module.slug} /></nav>
      </details>

      <div className={styles.moduleLayout}>
        <aside className={styles.moduleRail}>
          <nav aria-label={isZhHans ? "全部课程模块" : "All course modules"}>
            <header><span>Course 20</span><strong>{label(course.copy.ui, "tableOfContents", "Course map")}</strong></header>
            <ModuleMap course={course} activeSlug={module.slug} />
          </nav>
        </aside>

        <div className={styles.moduleMain}>
          <article>
            <header className={styles.moduleHero}>
              <p className={styles.kicker}>{module.copy.kicker}</p>
              <h1>{module.copy.title}</h1>
              <p className={styles.moduleSummary}>{module.copy.summary}</p>
              <dl>
                <div><dt>{isZhHans ? "核心引导" : "Core guided"}</dt><dd>{module.minutes} {label(course.copy.ui, "minute", "min")} · {module.instructionMinutes}/{module.practiceMinutes}/{module.checkpointMinutes}</dd></div>
                <div><dt>{isZhHans ? "fixture-safe 本地实验" : "Fixture-safe local lab"}</dt><dd>+{module.extensionMinutes} {label(course.copy.ui, "minute", "min")}</dd></div>
                <div><dt>{label(course.copy.ui, "phase", "Phase")}</dt><dd>{phase.copy.title} · {phase.order}/{course.phases.length}</dd></div>
                <div><dt>{label(course.copy.ui, "sources", "Sources")}</dt><dd>{module.sources.length}</dd></div>
              </dl>
              <p className={styles.artifactPromise}><span>{label(course.copy.ui, "artifact", "Artifact")}</span><strong>{module.copy.artifact}</strong></p>
            </header>

            <section className={styles.objective} aria-labelledby="module-objective-title">
              <p className={styles.eyebrow}>{course.contentLocale === "zh-Hans" ? "模块目标" : "Module objective"}</p>
              <h2 id="module-objective-title">{course.contentLocale === "zh-Hans" ? "完成后有什么改变" : "What changes by the end"}</h2>
              <p>{module.copy.objective}</p>
              <dl className={styles.conceptDefinitions}>
                {module.copy.concepts.map((concept) => (
                  <div key={concept.id}>
                    <dt>{concept.term}<span>{concept.track === "core" ? "Fixture-safe" : "Production-sandbox"}</span></dt>
                    <dd>{concept.definition}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <aside className={styles.softGateNotice} aria-labelledby="module-soft-gate-title">
              <div>
                <p className={styles.eyebrow}>{isZhHans ? "软依赖门" : "Soft prerequisite gate"}</p>
                <h2 id="module-soft-gate-title">{isZhHans ? "阅读和草拟始终开放" : "Reading and drafting always stay open"}</h2>
                <p>{isZhHans ? "你可以打开任何模块并保存草稿；只有“记为完成”要求上游 artifact current、dependency hash 一致、validator 与 checkpoint 通过。上游内容变化不会删除草稿，只会把依赖它的证据标记为 stale。" : "You may open any module and save a draft. Only “mark complete” requires current upstream artifacts, matching dependency hashes, a passing validator, and a passed checkpoint. An upstream change preserves downstream drafts and marks dependent evidence stale."}</p>
              </div>
              <div>
                <strong>{isZhHans ? "本模块依赖" : "This module depends on"}</strong>
                {prerequisiteModules.length ? (
                  <ul>{prerequisiteModules.map((prerequisite) => <li key={prerequisite.slug}><Link href={hrefFor(prerequisite.slug)}>M{prerequisite.order} · {prerequisite.copy.title}</Link></li>)}</ul>
                ) : <p>{isZhHans ? "无上游模块；从创作意图开始。" : "No upstream module; begin with creative intent."}</p>}
              </div>
            </aside>

            <section
              className={styles.moduleContractPanel}
              aria-labelledby="module-contract-title"
              data-testid="course20-module-contract"
            >
              <p className={styles.eyebrow}>{isZhHans ? "Artifact DAG 合同" : "Artifact DAG contract"}</p>
              <h2 id="module-contract-title">{isZhHans ? "本模块如何进入证据链" : "How this module enters the evidence chain"}</h2>
              <dl>
                <div>
                  <dt>{isZhHans ? "Consumes／消费" : "Consumes"}</dt>
                  <dd>{module.inputArtifactIds.length
                    ? <ul>{module.inputArtifactIds.map((artifactId) => <li key={artifactId}><code>{artifactId}</code></li>)}</ul>
                    : (isZhHans ? "无上游 artifact；从批准的 project spec 开始。" : "No upstream artifact; begin from the approved project specification.")}</dd>
                </div>
                <div>
                  <dt>{isZhHans ? "Produces／产出" : "Produces"}</dt>
                  <dd><ul>{module.outputArtifactIds.map((artifactId) => <li key={artifactId}><code>{artifactId}</code></li>)}</ul></dd>
                </div>
                <div>
                  <dt>{isZhHans ? "Entry gate／进入门" : "Entry gate"}</dt>
                  <dd>{module.prerequisiteSlugs.length
                    ? (isZhHans
                      ? `创建完成 receipt 前，${module.prerequisiteSlugs.join("、")} 必须 current；阅读与草拟不锁定。`
                      : `${module.prerequisiteSlugs.join(", ")} must be current before a completion receipt can be created; reading and drafting remain open.`)
                    : (isZhHans ? "无需上游模块 receipt；仍须通过本模块 artifact validator 与 checkpoint。" : "No upstream module receipt; this module's artifact validator and checkpoint still apply.")}</dd>
                </div>
                <div>
                  <dt>{isZhHans ? "Invalidates when／何时失效" : "Invalidates when"}</dt>
                  <dd>{module.invalidatesOn.length
                    ? (isZhHans
                      ? `任一所列输入的 semantic hash 改变：${module.invalidatesOn.join("、")}。草稿保留，但本模块及真正后继 receipt 变为 stale。`
                      : `Any listed input semantic hash changes: ${module.invalidatesOn.join(", ")}. Drafts remain, while this module and true descendant receipts become stale.`)
                    : (isZhHans ? "本模块自己的生产语义或 rubric／checkpoint 合同改变。" : "This module's own production semantics or rubric/checkpoint contract changes.")}</dd>
                </div>
              </dl>
            </section>

            <nav className={styles.onPageNav} aria-label={label(course.copy.ui, "onThisPage", "On this page")}>
              <strong>{label(course.copy.ui, "onThisPage", "On this page")}</strong>
              <ol>
                {module.copy.sections.map((section, sectionIndex) => <li key={section.heading}><a href={`#module-section-${sectionIndex + 1}`}>{String(sectionIndex + 1).padStart(2, "0")} {section.heading}</a></li>)}
                {module.slug === "declarative-edit-plan" ? <li><a href="#cut-plan-lab">{String(module.copy.sections.length + 1).padStart(2, "0")} Cut Plan Lab</a></li> : null}
                <li><a href="#module-practice">{String(module.copy.sections.length + (module.slug === "declarative-edit-plan" ? 2 : 1)).padStart(2, "0")} {label(course.copy.ui, "practice", "Practice")}</a></li>
                <li><a href="#module-checkpoint">{String(module.copy.sections.length + (module.slug === "declarative-edit-plan" ? 3 : 2)).padStart(2, "0")} {label(course.copy.ui, "checkpoint", "Checkpoint")}</a></li>
                <li><a href="#module-sources">{String(module.copy.sections.length + (module.slug === "declarative-edit-plan" ? 4 : 3)).padStart(2, "0")} {label(course.copy.ui, "sourceRegister", "Sources")}</a></li>
                <li><a href="#module-completion">{String(module.copy.sections.length + (module.slug === "declarative-edit-plan" ? 5 : 4)).padStart(2, "0")} {label(course.copy.ui, "moduleComplete", "Completion")}</a></li>
              </ol>
            </nav>

            {module.copy.sections.map((section, sectionIndex) => (
              <section className={styles.proseSection} id={`module-section-${sectionIndex + 1}`} key={section.heading} aria-labelledby={`module-section-${sectionIndex + 1}-title`}>
                <div className={styles.proseNumber}>{String(sectionIndex + 1).padStart(2, "0")}</div>
                <div className={styles.proseCopy}>
                  <h2 id={`module-section-${sectionIndex + 1}-title`}>{section.heading}</h2>
                  <div className={styles.claimList}>
                    {section.paragraphs.map((claim, claimIndex) => <ClaimEvidence key={`${claimIndex}:${claim.text}`} claim={claim} sources={module.sources} labels={course.copy.ui} locale={course.contentLocale} />)}
                  </div>
                  {section.bullets ? (
                    <ul className={styles.claimBullets}>{section.bullets.map((claim, claimIndex) => <li key={`${claimIndex}:${claim.text}`}><ClaimEvidence claim={claim} sources={module.sources} labels={course.copy.ui} locale={course.contentLocale} /></li>)}</ul>
                  ) : null}
                  {section.claimIds?.length ? (
                    <ClaimRegistryReferences
                      claimIds={section.claimIds}
                      locale={course.contentLocale}
                    />
                  ) : null}
                </div>
              </section>
            ))}

            {module.slug === "declarative-edit-plan" ? <CutPlanLab locale={course.contentLocale} /> : null}

            <section className={styles.practice} id="module-practice" aria-labelledby="module-practice-title">
              <header><div><p className={styles.eyebrow}>{isZhHans ? "fixture-safe 路径" : "Fixture-safe lane"}</p><h2 id="module-practice-title">{practices.core.title}</h2></div><span>{practices.core.estimatedMinutes ?? module.practiceMinutes} {label(course.copy.ui, "minute", "min")}</span></header>
              <PracticeDetails practice={practices.core} labels={course.copy.ui} locale={course.contentLocale} />
              <ArtifactWorkbench slug={module.slug} practice={practices.core} labels={course.copy.ui} />
              {practices.production ? (
                <details className={styles.productionPractice} aria-labelledby="module-production-practice-title">
                  <summary>
                    <span>
                      <small>{isZhHans ? "可选的 fixture-safe 本地实验" : "Optional fixture-safe local lab"}</small>
                      <strong id="module-production-practice-title">{practices.production.title}</strong>
                    </span>
                    <span>+{practices.production.estimatedMinutes ?? module.extensionMinutes} {label(course.copy.ui, "minute", "min")}</span>
                  </summary>
                  <div className={styles.productionPracticeBody}>
                    <p className={styles.productionBoundary}>{isZhHans ? "仅在本地 synthetic project 上证明时间、路径、权限、渲染、probe 与 QC 机制；不证明真实人物语义或真实客户素材权利。" : "This local synthetic project proves timing, path, authority, render, probe, and QC mechanisms, not real-person meaning or client-media rights."}</p>
                    <PracticeDetails practice={practices.production} labels={course.copy.ui} locale={course.contentLocale} />
                    <div className={styles.productionWorkbenchSlot} role="note">
                      <strong>{isZhHans ? "本地凭据槽" : "Local receipt slot"}</strong>
                      <p>{isZhHans ? "运行固定 argv 的本地实验后，在客户端工作台导入实际 hash、probe 和验证 receipt；无 FFmpeg 时仍可使用 --plan 检查预期 artifact graph。" : "After the fixed-argv local lab runs, import its actual hash, probe, and verification receipts in the client workbench. Without FFmpeg, use --plan to inspect the expected artifact graph."}</p>
                    </div>
                    <p className={styles.productionBoundary}>{isZhHans ? "production-sandbox 是另一个不计分的迁移步骤：只使用学习者合法控制的媒体，并为真实目的地重新执行权利、隐私、安全、交付、processor／subprocessor、保留／删除、恢复与具名人审。合成实验 receipt 不可迁移为真实媒体证明。" : "Production-sandbox is a separate, unscored transfer: use only learner-controlled media and repeat rights, privacy, security, delivery, processor/subprocessor, retention/deletion, recovery, and named-human review for the real destination. Synthetic-lab receipts cannot be promoted into real-media evidence."}</p>
                    <ArtifactWorkbench slug={module.slug} practice={practices.production} labels={course.copy.ui} path="builder-extension" />
                  </div>
                </details>
              ) : null}
            </section>

            <ModuleCheckpoint slug={module.slug} checkpoint={module.copy.checkpoint} labels={course.copy.ui} />
            <aside className={styles.takeaway}><span>{course.contentLocale === "zh-Hans" ? "保留这一判断" : "Keep this decision"}</span><p>{module.copy.takeaway}</p></aside>

            <section className={styles.moduleSources} id="module-sources" aria-labelledby="module-sources-title">
              <header className={styles.sectionHeader}>
                <p className={styles.kicker}>{label(course.copy.ui, "sourceRegister", "Source register")}</p>
                <h2 id="module-sources-title">{course.contentLocale === "zh-Hans" ? "每项来源的能力与边界" : "What each source can—and cannot—support"}</h2>
                <p>{course.copy.meta.evidenceNote}</p>
              </header>
              <ol>
                {module.sources.map((source, sourceIndex) => (
                  <li key={source.id}>
                    <span className={styles.sourceNumber}>{String(sourceIndex + 1).padStart(2, "0")}</span>
                    <details className={styles.moduleSourceDisclosure}>
                      <summary>
                        <span><strong>{source.title}</strong><small>{sourceKindLabel(source, course.copy.ui)} · {sourceRoleLabel(source.role, course.copy.ui)}</small></span>
                        <span>{isZhHans ? "证据与边界" : "Evidence & boundary"}</span>
                      </summary>
                      <div>
                        <p className={styles.sourcePrimaryLink}><a href={source.url} target="_blank" rel="noopener noreferrer">{isZhHans ? "打开主要证据" : "Open primary evidence"}<span aria-hidden="true">↗</span><NewTabHint locale={course.contentLocale} /></a></p>
                        <dl>
                          <div><dt>{label(course.copy.ui, "supports", "Supports")}</dt><dd>{course.contentLocale === "zh-Hans" ? source.supportsZhHans : source.supports}</dd></div>
                          <div><dt>{label(course.copy.ui, "boundary", "Boundary")}</dt><dd>{course.contentLocale === "zh-Hans" ? source.boundaryZhHans : source.boundary}</dd></div>
                          <div><dt>{label(course.copy.ui, "rights", "Rights")}</dt><dd>{course.contentLocale === "zh-Hans" ? source.rightsDecisionZhHans : source.rightsDecision}</dd></div>
                          {source.kind === "x-post" ? <div><dt>{label(course.copy.ui, "corroboration", "Corroboration")}</dt><dd>{course.contentLocale === "zh-Hans" ? source.corroborationScopeZhHans : source.corroborationScope}</dd></div> : null}
                          <div><dt>{isZhHans ? "精确证据" : "Exact evidence"}</dt><dd><ol className={styles.exactEvidenceLinks}>{sourceEvidenceUrls(source).map((url) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer">{url}<span aria-hidden="true">↗</span><NewTabHint locale={course.contentLocale} /></a></li>)}</ol></dd></div>
                          {source.resolvedCommit ? <div><dt>{isZhHans ? "固定提交" : "Resolved commit"}</dt><dd><code>{source.resolvedCommit}</code></dd></div> : null}
                          {source.versionAnchorUrl ? <div><dt>{isZhHans ? "发布／标签" : "Release / tag"}</dt><dd><a href={source.versionAnchorUrl} target="_blank" rel="noopener noreferrer">{source.revision ?? source.versionAnchorUrl}<span aria-hidden="true">↗</span><NewTabHint locale={course.contentLocale} /></a></dd></div> : null}
                          {source.license ? <div><dt>{label(course.copy.ui, "license", "License")}</dt><dd>{source.license}</dd></div> : null}
                          {officialXOEmbedUrl(source) ? <div><dt>{isZhHans ? "官方 oEmbed" : "Official oEmbed"}</dt><dd><a href={officialXOEmbedUrl(source)!} target="_blank" rel="noopener noreferrer">{source.kind === "x-post" ? `${source.verificationMethod} · ${source.verifiedOn}` : ""}<span aria-hidden="true">↗</span><NewTabHint locale={course.contentLocale} /></a></dd></div> : null}
                        </dl>
                        <p className={styles.sourceFootnote}>
                          {source.kind === "x-post"
                            ? `${label(course.copy.ui, "published", "Published")}: ${source.publishedOn} · ${label(course.copy.ui, "verification", "Verification")}: ${xVerificationLabel(source, course.copy.ui)}`
                            : `${label(course.copy.ui, "accessed", "Accessed")}: ${source.accessedOn}`}
                        </p>
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
            </section>

            <aside className={styles.completionBoundary} role="note">
              <strong>{isZhHans ? "完成门不锁阅读" : "Completion does not lock reading"}</strong>
              <p>{isZhHans ? "只有 current artifact、匹配的 dependency hashes、所需人工决定和 checkpoint 同时成立时，才能把本模块记为完成；字符数仅是草稿提示。" : "Mark this module complete only when the artifact is current, dependency hashes match, required human decisions are bound to the current hash, and the checkpoint passes. Character count is only a draft hint."}</p>
            </aside>
            <ModuleCompletion slug={module.slug} path="core" labels={course.copy.ui} />
            {practices.production ? <ModuleCompletion slug={module.slug} path="builder-extension" labels={course.copy.ui} /> : null}
            <nav className={styles.modulePager} aria-label={isZhHans ? "相邻模块" : "Adjacent modules"}>
              {previous ? <Link href={hrefFor(previous.slug)}><span>{label(course.copy.ui, "previous", "Previous")}</span><strong><span aria-hidden="true">← </span>{previous.copy.title}</strong></Link> : <span />}
              {next ? <Link href={hrefFor(next.slug)}><span>{label(course.copy.ui, "next", "Next")}</span><strong>{next.copy.title}<span aria-hidden="true"> →</span></strong></Link> : <Link href={`${courseHref}#agentic-video-editing-assessment`}><span>{label(course.copy.ui, "next", "Next")}</span><strong>{label(course.copy.ui, "finalAssessment", "Final assessment")}<span aria-hidden="true"> →</span></strong></Link>}
            </nav>
          </article>
        </div>
      </div>
    </div>
  );
}
