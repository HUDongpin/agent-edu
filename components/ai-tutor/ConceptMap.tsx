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
}: {
  manifest: AiTutorCourseManifest;
  copy: AiTutorCourseCopy;
  activeSlug?: AiTutorModuleSlug;
  compact?: boolean;
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
          <span>∞</span>
          <strong>{copy.conceptMap.center}</strong>
        </div>
        <ol className={styles.conceptNodes}>
          {manifest.modules.map((module) => {
            const node = copy.conceptMap.nodes[module.slug];
            return (
              <li
                className={module.slug === activeSlug ? styles.activeConceptNode : undefined}
                data-module-order={module.order}
                key={module.slug}
              >
                <span>{String(module.order).padStart(2, "0")}</span>
                <strong>{node.shortTitle}</strong>
                {!compact ? <small>{node.role}</small> : null}
              </li>
            );
          })}
        </ol>
      </div>
      <div className={styles.relationshipLedger} aria-label={copy.ui.relation}>
          <p className={styles.relationshipLabel}>{copy.ui.relation}</p>
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
      </div>
      <p className={styles.teacherBoundary}>{copy.conceptMap.teacherBoundary}</p>
    </figure>
  );
}
