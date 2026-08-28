import type {
  CourseKitMaterialisedSourceRecord,
  CourseKitUiCopy,
} from "@/lib/course-kit/types";
import styles from "./CourseKit.module.css";

export function SourceRegister({
  sources,
  labels,
  titleId,
}: {
  readonly sources: readonly CourseKitMaterialisedSourceRecord[];
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
        {sources.map((source, index) => {
          const sourceTitleId = `${titleId}-${source.id}-title`;
          const sourceLinksLabelId = `${titleId}-${source.id}-links-label`;
          return (
            <li id={`source-${source.id}`} key={source.id}>
              <span className={styles.sourceNumber} aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <article>
                <header>
                  <h3 id={sourceTitleId}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      lang={source.presentationLocales.title}
                      dir="ltr"
                    >
                      {source.title}
                      <span aria-hidden="true"> ↗</span>
                    </a>
                  </h3>
                  <p className={styles.sourceMeta}>
                    <span lang={source.presentationLocales.publisher} dir="ltr">
                      {source.publisher}
                    </span>
                    <span>{labels.sourceKindLabels[source.kind]}</span>
                    <span>{labels.sourceStabilityLabels[source.stability]}</span>
                    <span>
                      {labels.accessedOn}: {source.accessedAt ?? source.accessedOn}
                    </span>
                    {source.jurisdiction ? (
                      <span
                        lang={source.presentationLocales.jurisdiction}
                        dir="ltr"
                      >
                        {source.jurisdiction}
                      </span>
                    ) : null}
                    {source.revision ? (
                      <span lang={source.presentationLocales.revision} dir="ltr">
                        {source.revision}
                      </span>
                    ) : null}
                  </p>
                </header>
                <dl>
                  <div>
                    <dt>{labels.sourceSupports}</dt>
                    <dd lang={source.presentationLocales.supports} dir="ltr">
                      {source.supports}
                    </dd>
                  </div>
                  <div>
                    <dt>{labels.sourceBoundary}</dt>
                    <dd lang={source.presentationLocales.boundary} dir="ltr">
                      {source.boundary}
                    </dd>
                  </div>
                  <div>
                    <dt>{labels.sourceConceptDomain}</dt>
                    <dd lang={source.presentationLocales.conceptDomain} dir="ltr">
                      <code>{source.conceptDomain}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>{labels.sourceTransformation}</dt>
                    <dd
                      lang={source.presentationLocales.transformation}
                      dir="ltr"
                    >
                      {source.transformation}
                    </dd>
                  </div>
                  <div>
                    <dt>{labels.sourceRightsBoundary}</dt>
                    <dd
                      lang={source.presentationLocales.rightsBoundary}
                      dir="ltr"
                    >
                      {source.rightsBoundary}
                    </dd>
                  </div>
                  {source.licence ? (
                    <div>
                      <dt>{labels.sourceLicence}</dt>
                      <dd lang={source.presentationLocales.licence} dir="ltr">
                        {source.licence}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                {source.evidenceUrls.length > 1 ? (
                  <nav aria-labelledby={`${sourceTitleId} ${sourceLinksLabelId}`}>
                    <span className={styles.visuallyHidden} id={sourceLinksLabelId}>
                      {labels.sources}
                    </span>
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
          );
        })}
      </ol>
    </section>
  );
}
