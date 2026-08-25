import type {
  CourseKitSourceRecord,
  CourseKitUiCopy,
} from "@/lib/course-kit/types";
import styles from "./CourseKit.module.css";

export function SourceRegister({
  sources,
  labels,
  titleId,
}: {
  readonly sources: readonly CourseKitSourceRecord<string>[];
  readonly labels: CourseKitUiCopy;
  readonly titleId: string;
}) {
  return (
    <section className={styles.sources} aria-labelledby={titleId}>
      <header className={styles.sectionIntro}>
        <p className={styles.eyebrow}>{labels.sources}</p>
        <h2 id={titleId}>{labels.evidenceRegister}</h2>
        <p>{labels.evidenceNote}</p>
      </header>
      <ol>
        {sources.map((source, index) => (
          <li id={`source-${source.id}`} key={source.id}>
            <span className={styles.sourceNumber} aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <article>
              <header>
                <h3>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    lang="en"
                  >
                    {source.title}
                    <span aria-hidden="true"> ↗</span>
                  </a>
                </h3>
                <p className={styles.sourceMeta}>
                  <span lang="en">{source.publisher}</span>
                  <span>{labels.sourceKindLabels[source.kind]}</span>
                  <span>{labels.sourceStabilityLabels[source.stability]}</span>
                  <span>
                    {labels.accessedOn}: {source.accessedOn}
                  </span>
                  {source.jurisdiction ? <span>{source.jurisdiction}</span> : null}
                  {source.revision ? <span>{source.revision}</span> : null}
                </p>
              </header>
              <dl>
                <div>
                  <dt>{labels.sourceSupports}</dt>
                  <dd>{source.supports}</dd>
                </div>
                <div>
                  <dt>{labels.sourceBoundary}</dt>
                  <dd>{source.boundary}</dd>
                </div>
              </dl>
              {source.evidenceUrls.length > 1 ? (
                <nav aria-label={`${source.title}: ${labels.sources}`}>
                  {source.evidenceUrls.slice(1).map((url, evidenceIndex) => (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      key={url}
                    >
                      {labels.source} {evidenceIndex + 2}
                    </a>
                  ))}
                </nav>
              ) : null}
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}
