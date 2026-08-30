import Link from "next/link";
import type {
  AiTutorCourseCopy,
  AiTutorCourseManifest,
  AiTutorModuleSlug,
} from "@/lib/ai-tutor";
import styles from "./AiTutorCourse.module.css";

export default function ConceptMap({
  manifest,
  copy,
  activeSlug,
  compact = false,
  hrefFor,
}: {
  manifest: AiTutorCourseManifest;
  copy: AiTutorCourseCopy;
  activeSlug?: AiTutorModuleSlug;
  compact?: boolean;
  hrefFor?: (slug: AiTutorModuleSlug) => string;
}) {
  const visibleEdges = compact && activeSlug
    ? manifest.conceptEdges.filter((edge) => edge.from === activeSlug || edge.to === activeSlug)
    : manifest.conceptEdges;

  return (
    <figure
      className={`${styles.conceptMap} ${compact ? styles.conceptMapCompact : ""}`}
      aria-labelledby={compact ? "module-concept-map-title" : "course-concept-map-title"}
    >
      <figcaption>
        <span>{copy.ui.conceptMap}</span>
        <strong id={compact ? "module-concept-map-title" : "course-concept-map-title"}>
          {copy.conceptMap.title}
        </strong>
        {!compact ? <p>{copy.conceptMap.summary}</p> : null}
      </figcaption>
      <div className={styles.conceptCanvas}>
        <div className={styles.conceptCenter}>
          <span aria-hidden="true">∞</span>
          <strong>{copy.conceptMap.center}</strong>
        </div>
        <ol className={styles.conceptNodes}>
          {manifest.modules.map((module) => {
            const node = copy.conceptMap.nodes[module.slug];
            const content = (
              <>
                <span>{String(module.order).padStart(2, "0")}</span>
                <strong>{node.shortTitle}</strong>
                {!compact ? <small>{node.role}</small> : null}
              </>
            );
            return (
              <li
                className={module.slug === activeSlug ? styles.activeConceptNode : undefined}
                data-module-order={module.order}
                key={module.slug}
              >
                {hrefFor ? (
                  <Link
                    className={styles.conceptNode}
                    href={hrefFor(module.slug)}
                    aria-current={module.slug === activeSlug ? "page" : undefined}
                  >
                    {content}
                  </Link>
                ) : <div className={styles.conceptNode}>{content}</div>}
              </li>
            );
          })}
        </ol>
      </div>
      <details className={styles.relationshipLedger}>
          <summary className={styles.relationshipLabel}>{copy.ui.relation}</summary>
          <ol>
            {visibleEdges.map((edge) => (
              <li key={`${edge.from}-${edge.to}`}>
                <strong>{copy.conceptMap.nodes[edge.from].shortTitle}</strong>
                <span className={styles.edgeRelation}>
                  <span className={styles.edgeArrow} aria-hidden="true">→</span>
                  {copy.conceptMap.relations[edge.relationId]}
                </span>
                <strong>{copy.conceptMap.nodes[edge.to].shortTitle}</strong>
              </li>
            ))}
          </ol>
      </details>
      <p className={styles.teacherBoundary}>{copy.conceptMap.teacherBoundary}</p>
    </figure>
  );
}
