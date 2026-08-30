import Image from "next/image";
import Link from "next/link";
import type { McpCourse } from "@/lib/mcp";
import type { McpUiCopy } from "@/lib/mcp/copy";
import { formatMcpCopy, formatMcpInteger } from "@/lib/mcp/format";
import CapstoneChecklist from "./CapstoneChecklist";
import CourseProgress from "./CourseProgress";
import FinalAssessment from "./FinalAssessment";
import styles from "./McpCourse.module.css";
import SharedCourseShell from "../SharedCourseShell";

export default function CourseDashboard({
  course,
  catalogLabel,
}: {
  course: McpCourse;
  catalogLabel: string;
}) {
  const minutes = course.lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
  const ui = course.ui as McpUiCopy;
  const number = (value: number) => formatMcpInteger(value, course.contentLocale);
  const arrowForward = course.contentDirection === "rtl" ? "←" : "→";
  const arrowBack = course.contentDirection === "rtl" ? "→" : "←";
  const statusLabel = {
    core: ui.dashboardStatusCore,
    optional: ui.dashboardStatusOptional,
    practice: ui.dashboardStatusPractice,
    extension: ui.dashboardStatusExtension,
    deprecated: ui.dashboardStatusDeprecated,
    removed: ui.dashboardStatusRemoved,
  } as const;
  const evidenceLabel = {
    "direct-mcp-ui": ui.figureEvidenceDirect,
    "host-inventory": ui.figureEvidenceInventory,
    "host-context": ui.figureEvidenceContext,
    "design-example": ui.figureEvidenceDesign,
  } as const;
  const publisherCounts = course.sources.reduce<Record<string, number>>((counts, source) => {
    counts[source.publisher] = (counts[source.publisher] ?? 0) + 1;
    return counts;
  }, {});
  const featuredFigures = ["inspector-tools", "inspector-resources", "gemini-cli-mcp-inventory", "codex-cli-mcp-configuration"].map((id) => (
    course.figures.find((figure) => figure.id === id)!
  ));
  const lessonForFigure: Record<string, string> = {
    "inspector-tools": "tools",
    "inspector-resources": "resources",
    "inspector-apps": "apps-tasks-capstone",
    "gemini-cli-mcp-inventory": "host-integrations",
    "codex-cli-mcp-configuration": "host-integrations",
  };

  return (
    <div className={`shellwrap ${styles.coursePage}`} data-testid="mcp-course-dashboard" lang={course.contentLocale} dir={course.contentDirection}>
      <SharedCourseShell courseId="mcp" locale={course.locale} />
      <header className={styles.courseHero}>
        <div className={styles.heroCopy}>
          <div className={styles.heroBadges}>
            <span>{formatMcpCopy(ui.dashboardCourseTemplate, { sequence: number(course.sequence) })}</span>
            <span dir="ltr">{formatMcpCopy(ui.dashboardProtocolTemplate, { version: course.protocolVersion })}</span>
            <span>{formatMcpCopy(ui.dashboardEvidenceSnapshotTemplate, { date: course.publishedOn })}</span>
          </div>
          <p className={styles.eyebrow}>{course.kicker}</p>
          <h1>{course.title}</h1>
          <p className={styles.heroSummary}>{course.summary}</p>
          <p className={styles.heroAudience}>{course.audience}</p>
          <p className={styles.localeNote}>{course.localeNote}</p>
        </div>
        <aside className={styles.courseFacts} aria-label={ui.dashboardCourseFactsAria}>
          <p className={styles.factLead}>{ui.dashboardFactLead}</p>
          <dl>
            <div><dt>{ui.dashboardLessons}</dt><dd>{number(course.lessons.length)}</dd></div>
            <div><dt>{ui.dashboardStudyTime}</dt><dd>{formatMcpCopy(ui.dashboardStudyTimeTemplate, { hours: number(Math.floor(minutes / 60)), minutes: number(minutes % 60) })}</dd></div>
            <div><dt>{ui.dashboardEvidenceFigures}</dt><dd>{number(course.figures.length)}</dd></div>
            <div><dt>{ui.dashboardConceptLedger}</dt><dd>{number(course.concepts.length)}</dd></div>
          </dl>
          <a href="#curriculum" className={styles.inlineLink}>{ui.dashboardInspectCurriculum} ↓</a>
        </aside>
      </header>

      <CourseProgress
        locale={course.locale}
        lessons={course.lessons.map((lesson) => ({ slug: lesson.slug, title: lesson.title }))}
        direction={course.contentDirection}
        ui={ui}
      />

      <section className={styles.currentSpec} aria-labelledby="mcp-current-title">
        <div className={styles.specStamp} aria-hidden="true"><span>SPEC</span><strong>2026<br />07·28</strong></div>
        <div>
          <p className={styles.eyebrow}>{ui.dashboardCorrectionEyebrow}</p>
          <h2 id="mcp-current-title">{ui.dashboardCorrectionTitle}</h2>
          <p>{ui.dashboardCorrectionBody}</p>
        </div>
        <Link className={styles.secondaryButton} href={`/${course.locale}/mcp/discovery-versioning/`}>{ui.dashboardLearnMigration}</Link>
      </section>

      <section className={styles.figurePreview} aria-labelledby="mcp-real-ui-title">
        <header>
          <p className={styles.eyebrow}>{ui.dashboardVisualEyebrow}</p>
          <h2 id="mcp-real-ui-title">{ui.dashboardVisualTitle}</h2>
          <p>{ui.dashboardVisualBody}</p>
        </header>
        <div className={styles.figurePreviewGrid}>
          {featuredFigures.map((figure) => (
            <Link key={figure.id} href={`/${course.locale}/mcp/${lessonForFigure[figure.id]}/`}>
              <span className={styles.previewImage}>
                <Image src={figure.webpSrc} alt="" width={figure.width} height={figure.height} sizes="(max-width: 760px) 92vw, 30vw" unoptimized />
              </span>
              <span className={styles.previewMeta}>{figure.publisher} · {evidenceLabel[figure.evidenceClass]}</span>
              <strong>{figure.caption}</strong>
              <small>{figure.legacyNote ? ui.dashboardLegacyFlagged : formatMcpCopy(ui.dashboardObservedTemplate, { date: figure.observedOn })}</small>
            </Link>
          ))}
        </div>
      </section>

      <section id="curriculum" className={styles.curriculum} aria-labelledby="mcp-curriculum-title">
        <header className={styles.sectionHeader}>
          <div>
            <p className={styles.eyebrow}>{ui.dashboardCurriculumEyebrow}</p>
            <h2 id="mcp-curriculum-title">{ui.dashboardCurriculumTitle}</h2>
          </div>
          <p>{ui.dashboardCurriculumBody}</p>
        </header>
        <div className={styles.unitList}>
          {course.units.map((unit) => (
            <section className={styles.unit} key={unit.id} aria-labelledby={`${unit.id}-title`}>
              <div className={styles.unitHeading}>
                <span>{number(unit.order)}</span>
                <div><h3 id={`${unit.id}-title`}>{unit.title}</h3><p>{unit.summary}</p></div>
              </div>
              <ol>
                {unit.lessonSlugs.map((slug) => {
                  const lesson = course.lessons.find((item) => item.slug === slug)!;
                  return (
                    <li key={slug}>
                      <Link href={`/${course.locale}/mcp/${slug}/`}>
                        <span className={styles.lessonOrder}>{number(lesson.order)}</span>
                        <span className={styles.lessonCardCopy}><strong>{lesson.title}</strong><small>{lesson.summary}</small></span>
                        <span className={styles.lessonMinutes}>{formatMcpCopy(ui.dashboardMinutesTemplate, { minutes: number(lesson.minutes) })} <b aria-hidden="true">{arrowForward}</b></span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </section>

      <section className={styles.conceptLedger} aria-labelledby="mcp-concepts-title">
        <header className={styles.sectionHeader}>
          <div><p className={styles.eyebrow}>{ui.dashboardConceptEyebrow}</p><h2 id="mcp-concepts-title">{ui.dashboardConceptTitle}</h2></div>
          <p>{ui.dashboardConceptBody}</p>
        </header>
        <div className={styles.conceptGrid}>
          {course.concepts.map((concept) => (
            <div key={concept.id} data-status={concept.status}>
              <span>{statusLabel[concept.status]}</span>
              <strong>{concept.label}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.evidenceMethod} aria-labelledby="mcp-evidence-title">
        <div>
          <p className={styles.eyebrow}>{ui.dashboardSourceEyebrow}</p>
          <h2 id="mcp-evidence-title">{ui.dashboardSourceTitle}</h2>
          <p>{course.sourceNote}</p>
        </div>
        <dl>
          {Object.entries(publisherCounts).map(([publisher, count]) => (
            <div key={publisher}><dt><bdi>{publisher}</bdi></dt><dd>{formatMcpCopy(ui.dashboardSourcesTemplate, { count: number(count) })}</dd></div>
          ))}
        </dl>
      </section>

      <section className={styles.claimAudit} aria-labelledby="mcp-claim-audit-title">
        <header className={styles.sectionHeader}>
          <div><p className={styles.eyebrow}>{ui.dashboardClaimEyebrow}</p><h2 id="mcp-claim-audit-title">{ui.dashboardClaimTitle}</h2></div>
          <p>{ui.dashboardClaimBody}</p>
        </header>
        <ol>
          {course.claims.map((entry) => (
            <li key={entry.id}>
              <div><Link href={`/${course.locale}/mcp/${entry.lessonSlug}/`}>{formatMcpCopy(ui.dashboardLessonTemplate, { order: number(entry.lessonOrder) })}</Link><strong>{entry.claim}</strong></div>
              <span>
                {entry.sourceIds.map((sourceId) => {
                  const source = course.sources.find((candidate) => candidate.id === sourceId)!;
                  return (
                    <a key={sourceId} href={source.url} target="_blank" rel="noopener noreferrer">
                      {sourceId} <span aria-hidden="true">↗</span>
                      <span className={styles.visuallyHidden}> ({ui.externalNewTab})</span>
                    </a>
                  );
                })}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <FinalAssessment questions={course.assessment} locale={course.contentLocale} direction={course.contentDirection} ui={ui} />
      <CapstoneChecklist locale={course.contentLocale} ui={ui} capstone={course.capstone} />

      <aside className={styles.integrityNote} aria-labelledby="mcp-integrity-title">
        <h2 id="mcp-integrity-title">{ui.dashboardIntegrityTitle}</h2>
        <p>{ui.dashboardIntegrityBody}</p>
        <p dir="ltr">
          <a className={styles.inlineLink} href="/courses/mcp/figure-manifest.json">figure-manifest.json</a>
          {" · "}
          <a className={styles.inlineLink} href="/courses/mcp/NOTICE.md">NOTICE.md</a>
          {" · "}
          <a className={styles.inlineLink} href="/courses/mcp/licenses/APACHE-2.0.txt">APACHE-2.0.txt</a>
          {" · "}
          <a className={styles.inlineLink} href="/courses/mcp/licenses/CODEX-NOTICE.txt">CODEX-NOTICE.txt</a>
        </p>
        <p>{formatMcpCopy(ui.dashboardIntegrityDateTemplate, { date: course.publishedOn })}</p>
      </aside>

      <p className={styles.backLink}><Link href={`/${course.locale}/courses/`}><span aria-hidden="true">{arrowBack}</span> {catalogLabel}</Link></p>
    </div>
  );
}
