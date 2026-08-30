import Image from "next/image";
import Link from "next/link";
import {
  MATH_ANIMATION_TOTAL_MINUTES,
  getMathAnimationSource,
  type MaterializedMathAnimationCourse,
  type RepositoryScoreBreakdown,
  type RepositoryVerdict,
} from "@/lib/math-animation";
import AnimationPreview, { type AnimationPreviewLabels } from "./AnimationPreview";
import PipelineMap, { type PipelineMapLabels } from "./PipelineMap";
import {
  CapstoneChecklist,
  CourseJourneyAction,
  CourseProgress,
  FinalAssessment,
  ModuleCompletionStatus,
} from "./Interactions";
import { SourceTraceDisclosure } from "./SourceTraceLinks";
import styles from "./MathAnimationCourse.module.css";

function verdictLabel(verdict: RepositoryVerdict, course: MaterializedMathAnimationCourse): string {
  return course.copy.ui[verdict];
}

function sourceKindLabel(kind: string, chinese: boolean): string {
  if (kind === "github-repository") return chinese ? "GitHub 仓库" : "GitHub repository";
  if (kind === "x-post") return chinese ? "X 实践信号" : "X practice signal";
  if (kind === "web-standard") return chinese ? "Web 标准" : "Web standard";
  return chinese ? "官方文档" : "Official documentation";
}

function animationLabels(chinese: boolean): Partial<AnimationPreviewLabels> {
  if (!chinese) return {};
  return {
    eyebrow: "交互式动画实验",
    title: "一个角度，两种同步表示",
    description: "拖动一整圈。单位圆点的纵向投影会成为同一角度下正弦曲线的高度。",
    equation: "P(θ) = (cos θ, sin θ)  →  y = sin θ",
    unitCircle: "单位圆",
    sinePlot: "一整圈的正弦曲线",
    play: "播放",
    pause: "暂停",
    replay: "重新播放",
    reset: "复位",
    timeline: "动画时间轴",
    frame: "帧",
    angle: "角度",
    sine: "sin θ",
    cosine: "cos θ",
    projection: "纵向投影",
    reducedMotion: "系统偏好减少运动，连续播放已关闭。请使用时间轴检查任意静态帧。",
    paused: "动画已暂停",
    playing: "动画正在播放",
    finished: "动画已到最后一帧",
  };
}

function pipelineLabels(chinese: boolean): Partial<PipelineMapLabels> {
  if (!chinese) return {};
  return {
    eyebrow: "经过验证的动画管线",
    title: "每次交接都携带可检查产物",
    description: "两个代理承担不同工作，但场景契约与数学不变量始终是共享真值来源。",
    output: "交接产物",
    checks: "退出检查",
    handoff: "已验证交接",
    caption: "审核或渲染失败时可以返回上一环节。不变量失败必须回到实现，不能用后期包装掩盖。",
    stages: [
      { id: "contract", number: "01", title: "场景契约", role: "人的意图 · 数学真值", output: "SCENE_CONTRACT.md", checks: ["主张与受众明确", "节拍、对象与不变量均已命名"] },
      { id: "codex", number: "02", title: "Codex 实现", role: "仓库改动 · 可执行场景", output: "场景代码 + 测试 + 预览", checks: ["固定引擎 API 可编译", "本地低清渲染完成"] },
      { id: "claude", number: "03", title: "Claude 审核", role: "叙事导演 · 可读性", output: "带时间的审核意见", checks: ["每个节拍只表达一个变化", "标签、节奏与连续性通过"] },
      { id: "render", number: "04", title: "渲染与不变量", role: "导出检查 · 发布证据", output: "视频 + 关键帧 + 收据", checks: ["采样值符合数学关系", "编码、尺寸、权利与字幕通过"] },
    ],
  };
}

const SCORE_MAXIMUMS: Readonly<Record<keyof RepositoryScoreBreakdown, number>> = {
  mathSemantics: 20,
  deterministicTimeline: 15,
  agentReadable: 15,
  iterationPreview: 10,
  renderOutput: 10,
  maintenance: 10,
  licenseClarity: 10,
  accessibility: 5,
  ecosystem: 5,
};

function scoreBreakdownLabels(chinese: boolean): Readonly<Record<keyof RepositoryScoreBreakdown, string>> {
  return chinese
    ? {
        mathSemantics: "数学语义",
        deterministicTimeline: "确定时间轴",
        agentReadable: "代理可读性",
        iterationPreview: "迭代预览",
        renderOutput: "渲染输出",
        maintenance: "维护状态",
        licenseClarity: "许可清晰度",
        accessibility: "无障碍",
        ecosystem: "生态",
      }
    : {
        mathSemantics: "Math semantics",
        deterministicTimeline: "Deterministic timeline",
        agentReadable: "Agent readability",
        iterationPreview: "Iteration preview",
        renderOutput: "Render output",
        maintenance: "Maintenance",
        licenseClarity: "License clarity",
        accessibility: "Accessibility",
        ecosystem: "Ecosystem",
      };
}

export default function CourseDashboard({
  course,
  catalogLabel,
}: {
  course: MaterializedMathAnimationCourse;
  catalogLabel: string;
}) {
  const chinese = course.contentLocale === "zh-Hans";
  const courseHref = `/${course.locale}/math-animation/`;
  const hrefFor = (slug: string) => `/${course.locale}/math-animation/${slug}/`;
  const moduleJourneys = course.modules.map((module) => ({
    slug: module.slug,
    href: hrefFor(module.slug),
  }));
  const uniqueSources = Array.from(new Map(
    course.modules.flatMap((module) => module.sources).map((source) => [source.id, source]),
  ).values());
  const sourceKinds = Array.from(new Set(uniqueSources.map((source) => source.kind)));
  const verdicts: readonly RepositoryVerdict[] = ["core", "advanced", "extension", "companion"];
  const scoreLabels = scoreBreakdownLabels(chinese);
  const numberFormatter = new Intl.NumberFormat(course.contentLocale);
  const dateFormatter = new Intl.DateTimeFormat(course.contentLocale, {
    dateStyle: "medium",
    timeZone: "UTC",
  });
  const catalogArrow = course.locale === "ar" ? "→" : "←";

  return (
    <div
      className={`shellwrap ${styles.root}`}
      lang={course.contentLocale}
      dir={course.contentDirection}
      data-testid="math-animation-course"
    >
      {course.locale !== course.contentLocale ? (
        <p className={styles.languageNotice}>{course.copy.ui.languageFallback}</p>
      ) : null}

      <nav className={styles.breadcrumb} aria-label={chinese ? "面包屑" : "Breadcrumb"}>
        <Link
          href={`/${course.locale}/courses/`}
          lang={course.locale !== course.contentLocale ? course.locale : undefined}
          dir={course.locale === "ar" ? "rtl" : undefined}
        >
          <span aria-hidden="true">{catalogArrow}</span>{catalogLabel}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{course.copy.ui.courseNumber}</span>
      </nav>

      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>{course.copy.meta.kicker}</p>
          <h1 data-course19-heading tabIndex={-1}>{course.copy.meta.title}</h1>
          <p className={styles.heroSummary}>{course.copy.meta.summary}</p>
          <div className={styles.heroActions}>
            <CourseJourneyAction
              modules={moduleJourneys}
              labels={course.copy.ui}
              overviewHref={courseHref}
              className={styles.primaryButton}
            />
            <a className={styles.secondaryButton} href="#course-map">{course.copy.ui.curriculum}</a>
          </div>
        </div>
        <figure className={styles.heroPoster}>
          <Image
            src="/courses/math-animation/posters/unit-circle-sine-keyframes.svg"
            alt={chinese
              ? "单位圆上的点通过纵向投影与正弦曲线关键帧同步"
              : "A point on the unit circle synchronized with sine-wave keyframes through a vertical projection"}
            width={1536}
            height={1024}
            priority
            sizes="(max-width: 800px) 100vw, 48vw"
          />
          <figcaption>{chinese ? "同一变量必须驱动圆、投影、曲线与时间轴。" : "One variable must drive the circle, projection, curve, and timeline."}</figcaption>
        </figure>
      </header>

      <section className={styles.factStrip} aria-label={chinese ? "课程信息" : "Course facts"}>
        <div><strong>{course.modules.length}</strong><span>{course.copy.ui.modules}</span></div>
        <div><strong>{course.manifest.phases.length}</strong><span>{course.copy.ui.phases}</span></div>
        <div><strong>{numberFormatter.format(MATH_ANIMATION_TOTAL_MINUTES)}</strong><span>{course.copy.ui.minutes}</span></div>
        <div><strong>{uniqueSources.length}</strong><span>{course.copy.ui.sources}</span></div>
      </section>

      <nav className={styles.journeyNav} aria-label={chinese ? "本页导航" : "On this page"}>
        <a href="#course-map">{course.copy.ui.curriculum}</a>
        <a href="#motion-lab">{course.copy.ui.motionLab}</a>
        <a href="#math-animation-assessment">{course.copy.ui.finalAssessment}</a>
        <a href="#math-animation-capstone">{course.copy.ui.capstone}</a>
        <a href="#repository-lab">{course.copy.ui.repositoryLab}</a>
      </nav>

      <CourseProgress
        modules={moduleJourneys}
        labels={course.copy.ui}
        overviewHref={courseHref}
        showJourneyAction={false}
      />

      <section className={styles.promise} aria-labelledby="course-outcomes-title">
        <div className={styles.promiseLead}>
          <p className={styles.sectionLabel}>{course.copy.ui.learningOutcomes}</p>
          <h2 id="course-outcomes-title">{chinese ? "不只是生成视频，而是发布可检验的数学解释" : "Do not just generate a video. Release a checkable mathematical explanation."}</h2>
          <p>{course.copy.meta.audience}</p>
          <p>{course.copy.meta.prerequisite}</p>
        </div>
        <ol className={styles.outcomeGrid}>
          {course.copy.outcomes.map((outcome, index) => (
            <li key={outcome}><span>{String(index + 1).padStart(2, "0")}</span><p>{outcome}</p></li>
          ))}
        </ol>
      </section>

      <section className={styles.goalChooser} aria-labelledby="course-goal-title">
        <header className={styles.sectionIntro}>
          <p className={styles.sectionLabel}>{course.copy.ui.chooseGoal}</p>
          <h2 id="course-goal-title">
            {chinese ? "先按你要交付的作品选择路线" : "Choose the route that matches what you need to ship"}
          </h2>
          <p>
            {chinese
              ? "三条路线共享数学真值、场景契约与验收证据；工具链从目标出发。"
              : "All three routes share the same mathematical truth, scene contract, and verification evidence. The toolchain follows the outcome."}
          </p>
        </header>
        <div className={styles.goalGrid}>
          <Link href={hrefFor("manim-environment-first-scene")}>
            <span>{course.copy.ui.goalVideo}</span>
            <strong>Manim Community</strong>
            <small>{course.copy.ui.recommendation}</small>
          </Link>
          <Link href={hrefFor("motion-canvas-web-track")}>
            <span>{course.copy.ui.goalWeb}</span>
            <strong>Motion Canvas</strong>
            <small>{course.copy.ui.recommendation}</small>
          </Link>
          <Link href={hrefFor("voice-slides-remotion")}>
            <span>{course.copy.ui.goalTalk}</span>
            <strong>Manim Slides + Voiceover</strong>
            <small>{course.copy.ui.recommendation}</small>
          </Link>
        </div>
      </section>

      <section
        className={styles.courseMap}
        id="course-map"
        aria-labelledby="course-map-title"
        tabIndex={-1}
      >
        <header className={styles.sectionIntro}>
          <p className={styles.sectionLabel}>{course.copy.ui.curriculum}</p>
          <h2 id="course-map-title">{chinese ? "从数学目标到可审计发布" : "From mathematical goal to auditable release"}</h2>
          <p>{course.copy.meta.evidenceNote}</p>
        </header>
        <div className={styles.phaseStack}>
          {course.phases.map((phase) => (
            <section className={styles.phase} key={phase.id}>
              <header><span>{String(phase.order).padStart(2, "0")}</span><div><h3>{phase.copy.title}</h3><p>{phase.copy.summary}</p></div></header>
              <ol>
                {phase.modules.map((module) => (
                  <li key={module.slug}>
                    <Link href={hrefFor(module.slug)}>
                      <span>{String(module.order).padStart(2, "0")}</span>
                      <div><strong>{module.copy.title}</strong><small>{module.minutes} {course.copy.ui.minutes}</small></div>
                      <ModuleCompletionStatus slug={module.slug} labels={course.copy.ui} />
                      <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </section>

      <PipelineMap className={styles.visualSection} labels={pipelineLabels(chinese)} />
      <AnimationPreview
        id="motion-lab"
        tabIndex={-1}
        className={styles.visualSection}
        locale={course.contentLocale}
        labels={animationLabels(chinese)}
      />

      <section
        className={styles.repositoryLab}
        id="repository-lab"
        aria-labelledby="repository-lab-title"
        tabIndex={-1}
      >
        <header className={styles.sectionIntro}>
          <p className={styles.sectionLabel}>{course.copy.ui.repositoryLab}</p>
          <h2 id="repository-lab-title">{chinese ? "九个仓库，四种课程角色，一套公开量表" : "Nine repositories, four course roles, one public rubric"}</h2>
          <p>{course.copy.ui.repositoryLabIntro}</p>
          <div className={styles.downloadLinks}>
            <a href="/courses/math-animation/repository-lock.json">{chinese ? "下载固定版本清单" : "Download repository lock"}</a>
            <a href="/courses/math-animation/starter-kit.zip" download>{chinese ? "下载完整 starter kit" : "Download complete starter kit"}</a>
            <a href="/courses/math-animation/starter-kit/README.md">{chinese ? "阅读安装说明" : "Read setup guide"}</a>
          </div>
        </header>

        <details className={styles.repositoryDisclosure}>
          <summary>
            <span>{chinese ? "查看全部仓库评分与证据" : "Review every repository scorecard and its evidence"}</span>
            <strong>{numberFormatter.format(course.repositories.length)}</strong>
          </summary>
          <div className={styles.repositoryDisclosureBody}>

        {verdicts.map((verdict) => {
          const records = course.repositories.filter((repository) => repository.verdict === verdict);
          if (!records.length) return null;
          return (
            <section className={styles.repositoryGroup} key={verdict} aria-labelledby={`repository-${verdict}`}>
              <h3 id={`repository-${verdict}`}>{verdictLabel(verdict, course)}</h3>
              <div className={styles.repositoryGrid}>
                {records.map((repository) => {
                  const source = getMathAnimationSource(repository.sourceId);
                  return (
                    <article className={styles.repositoryCard} key={repository.sourceId}>
                      <header>
                        <div>
                          <p>{repository.smokeStatus === "rendered"
                            ? (chinese ? "已实测渲染" : "Rendered locally")
                            : (chinese ? "已验证，未宣称渲染" : "Validated, no render claim")}</p>
                          <h4>{source.title}</h4>
                        </div>
                        <strong aria-label={`${course.copy.ui.score} ${repository.score}`}>{repository.score}<small>/100</small></strong>
                      </header>
                      <dl>
                        <div><dt>{course.copy.ui.bestFor}</dt><dd>{chinese ? repository.bestForZhHans : repository.bestFor}</dd></div>
                        <div><dt>{course.copy.ui.limit}</dt><dd>{chinese ? repository.primaryLimitZhHans : repository.primaryLimit}</dd></div>
                        <div><dt>{chinese ? "实测证据" : "Smoke evidence"}</dt><dd>{chinese ? repository.smokeEvidenceZhHans : repository.smokeEvidence}</dd></div>
                        <div className={styles.adoptionRow}>
                          <dt>{chinese ? "采用快照" : "Adoption snapshot"}</dt>
                          <dd>
                            <dl
                              className={styles.adoptionSnapshot}
                              aria-label={chinese ? `${source.title} 采用快照` : `${source.title} adoption snapshot`}
                            >
                              <div>
                                <dt>GitHub stars</dt>
                                <dd>
                                  <data value={repository.adoptionSnapshot.stars}>
                                    {numberFormatter.format(repository.adoptionSnapshot.stars)}
                                  </data>
                                  <small>{chinese ? "仅作采用背景，不代表质量或成效" : "Adoption context only, not quality or effectiveness"}</small>
                                </dd>
                              </div>
                              <div>
                                <dt>{chinese ? "默认分支最新提交" : "Default branch head"}</dt>
                                <dd>
                                  <time dateTime={repository.adoptionSnapshot.defaultBranchHeadDate}>
                                    {dateFormatter.format(new Date(`${repository.adoptionSnapshot.defaultBranchHeadDate}T00:00:00Z`))}
                                  </time>
                                </dd>
                              </div>
                              <div>
                                <dt>{chinese ? "最新 release" : "Latest release"}</dt>
                                <dd>
                                  {repository.adoptionSnapshot.latestRelease
                                    && repository.adoptionSnapshot.latestReleasePublishedOn ? (
                                      <>
                                        <code>{repository.adoptionSnapshot.latestRelease}</code>
                                        <time dateTime={repository.adoptionSnapshot.latestReleasePublishedOn}>
                                          {dateFormatter.format(new Date(`${repository.adoptionSnapshot.latestReleasePublishedOn}T00:00:00Z`))}
                                        </time>
                                      </>
                                    ) : (
                                      <span>{chinese ? "采集时未记录 release" : "No release recorded at capture"}</span>
                                    )}
                                </dd>
                              </div>
                              <div>
                                <dt>{chinese ? "采集日期" : "Captured"}</dt>
                                <dd>
                                  <time dateTime={repository.adoptionSnapshot.capturedOn}>
                                    {dateFormatter.format(new Date(`${repository.adoptionSnapshot.capturedOn}T00:00:00Z`))}
                                  </time>
                                </dd>
                              </div>
                            </dl>
                          </dd>
                        </div>
                        <div className={styles.repositoryTrace}>
                          <dt>{chinese ? "来源追踪" : "Source trace"}</dt>
                          <dd><SourceTraceDisclosure source={source} chinese={chinese} /></dd>
                        </div>
                        <div className={styles.scoreDetails}>
                          <dt>{chinese ? "评分明细" : "Score detail"}</dt>
                          <dd>
                            <details>
                              <summary>{chinese ? "展开 9 项评分" : "Open all 9 criteria"}</summary>
                              <ul>
                                {(Object.keys(SCORE_MAXIMUMS) as (keyof RepositoryScoreBreakdown)[]).map((key) => (
                                  <li key={key}>
                                    <span>{scoreLabels[key]}</span>
                                    <strong>{repository.breakdown[key]} / {SCORE_MAXIMUMS[key]}</strong>
                                  </li>
                                ))}
                              </ul>
                            </details>
                          </dd>
                        </div>
                      </dl>
                      <footer>
                        <span><strong>{chinese ? "证据修订" : "Evidence revision"}</strong><code>{repository.testedRevision.slice(0, 12)}</code></span>
                        <span>{chinese ? source.licenseOrRightsZhHans : source.licenseOrRights}</span>
                      </footer>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
        <p className={styles.rubricNote}>{chinese
          ? "量表权重：数学语义 20、确定时间轴 15、代理可读性 15、预览 10、导出 10、维护 10、许可 10、无障碍 5、生态 5。"
          : "Rubric weights: math semantics 20, deterministic timeline 15, agent readability 15, preview 10, export 10, maintenance 10, license 10, accessibility 5, ecosystem 5."}</p>
          </div>
        </details>
      </section>

      <FinalAssessment questions={course.copy.assessment} labels={course.copy.ui} />

      <section className={styles.capstoneIntro} aria-labelledby="capstone-title">
        <div>
          <p className={styles.sectionLabel}>{course.copy.ui.capstone}</p>
          <h2 id="capstone-title">{course.copy.capstone.title}</h2>
          <p>{course.copy.capstone.summary}</p>
        </div>
        <blockquote>{course.copy.capstone.scenario}</blockquote>
        <p className={styles.releaseRule}>{course.copy.capstone.releaseRule}</p>
      </section>
      <CapstoneChecklist artifacts={course.copy.capstone.artifacts} labels={course.copy.ui} />

      <aside className={styles.integrity} aria-labelledby="course-integrity-title">
        <div>
          <p className={styles.sectionLabel}>{course.copy.ui.evidenceBoundary}</p>
          <h2 id="course-integrity-title">{chinese ? "X 负责发现，GitHub 负责事实，课程产物负责证明" : "X discovers. GitHub establishes facts. Course artifacts carry the proof."}</h2>
          <p>{course.copy.meta.evidenceNote}</p>
          <div className={styles.downloadLinks}>
            <a href="/courses/math-animation/NOTICE.md">{chinese ? "来源与资产声明" : "Source and asset notice"}</a>
            <a href="/courses/math-animation/repository-lock.json">{chinese ? "仓库固定清单" : "Repository lock"}</a>
          </div>
        </div>
        <dl>
          {sourceKinds.map((kind) => (
            <div key={kind}><dt>{sourceKindLabel(kind, chinese)}</dt><dd>{uniqueSources.filter((source) => source.kind === kind).length}</dd></div>
          ))}
        </dl>
      </aside>

      <p className={styles.backLink}>
        <Link
          href={`/${course.locale}/courses/`}
          lang={course.locale !== course.contentLocale ? course.locale : undefined}
          dir={course.locale === "ar" ? "rtl" : undefined}
        ><span aria-hidden="true">{catalogArrow}</span>{catalogLabel}</Link>
      </p>
    </div>
  );
}
