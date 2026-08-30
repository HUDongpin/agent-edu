import type { SoftwareEngineeringLocaleCopy, SoftwareEngineeringMediaRecord } from "@/lib/software-engineering";
import styles from "./SoftwareEngineeringCourse.module.css";

export default function CourseFigure({
  figure,
  labels,
  locale,
  eager = false,
}: {
  figure: SoftwareEngineeringMediaRecord;
  labels: SoftwareEngineeringLocaleCopy["ui"];
  locale: string;
  eager?: boolean;
}) {
  const verifiedDate = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${figure.observedOn}T00:00:00Z`));
  const strongestSource = figure.immutableSourceUrl ?? figure.sourceUrl;
  const sourceLabelId = `course-figure-${figure.id}-source-label`;
  const sourceTitleId = `course-figure-${figure.id}-source-title`;

  return (
    <figure className={styles.courseFigure} data-media-id={figure.id} lang={locale} dir="auto">
      <div className={styles.figureHeading}>
        <span>{labels.authenticUi} · <bdi lang="en" dir="ltr">{figure.product}</bdi></span>
        <time dateTime={figure.observedOn}>{labels.verifiedOn} {verifiedDate}</time>
      </div>
      <a
        className={styles.rasterFrame}
        href={strongestSource}
        target="_blank"
        rel="noopener noreferrer"
        aria-labelledby={`${sourceLabelId} ${sourceTitleId}`}
      >
        <span className={styles.srOnly} id={sourceLabelId}>{labels.figureSource}:</span>
        <span className={styles.srOnly} id={sourceTitleId} lang="en" dir="ltr">{figure.title}</span>
        <picture>
          <source srcSet={figure.webpSrc} type="image/webp" />
          <img
            src={figure.src}
            width={figure.width}
            height={figure.height}
            alt={figure.alt}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={eager ? "high" : "auto"}
            lang="en"
            dir="ltr"
          />
        </picture>
      </a>
      <figcaption>
        <strong lang="en" dir="ltr">{figure.title}</strong>
        <span lang="en" dir="ltr">{figure.caption}</span>
        <span>
          <a href={strongestSource} target="_blank" rel="noopener noreferrer">{labels.figureSource}</a>
          {" · "}
          <a href={figure.licenceUrl} target="_blank" rel="noopener noreferrer">
            {labels.licence}: <span lang="en" dir="ltr">{figure.licence}</span>
          </a>
          <span lang="en" dir="ltr">{" · "}{figure.rightsNote}</span>
        </span>
      </figcaption>
      <details className={styles.figureTranscript}>
        <summary>{labels.transcript}</summary>
        {figure.transcript.map((line) => <p key={line} lang="en" dir="ltr">{line}</p>)}
      </details>
    </figure>
  );
}
