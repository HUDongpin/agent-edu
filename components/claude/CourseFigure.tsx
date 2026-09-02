import Image from "next/image";
import type { MaterializedClaudeLesson } from "@/lib/claude";
import styles from "./ClaudeCourse.module.css";

type Figure = MaterializedClaudeLesson["figures"][number];

export default function CourseFigure({
  figure,
  pendingLabel,
  sourceLabel,
  observedLabel,
}: {
  figure: Figure;
  pendingLabel: string;
  sourceLabel: string;
  observedLabel: string;
}) {
  const { manifest, copy } = figure;
  const captionId = `${manifest.id}-caption`;

  if (manifest.status === "capture-required") {
    return (
      <figure
        className={styles.courseFigure}
        data-testid={`claude-figure-${manifest.id}`}
        data-figure-status={manifest.status}
      >
        <div
          className={styles.figurePending}
          role="img"
          aria-label={`${pendingLabel}: ${copy.alt}`}
          aria-describedby={captionId}
        >
          <span className={styles.figureNumber} aria-hidden="true">
            {manifest.id.replace("fig-", "")}
          </span>
          <strong>{pendingLabel}</strong>
        </div>
        <figcaption id={captionId}>{copy.caption}</figcaption>
      </figure>
    );
  }

  const callouts = (manifest.callouts ?? []).flatMap((callout, index) => {
    const label = copy.callouts?.[callout.labelKey];
    return label ? [{ ...callout, label, number: index + 1 }] : [];
  });

  return (
    <figure
      className={styles.courseFigure}
      data-testid={`claude-figure-${manifest.id}`}
      data-figure-status={manifest.status}
      data-capture-sha256={manifest.sha256}
      data-rights-status={manifest.rightsStatus}
    >
      <a
        className={styles.figureImage}
        href={manifest.src}
        aria-describedby={captionId}
        dir="ltr"
      >
        <picture>
          {manifest.srcSet.mobile ? (
            <source media="(max-width: 640px)" srcSet={manifest.srcSet.mobile} type="image/webp" />
          ) : null}
          <source
            type="image/webp"
            srcSet={`${manifest.srcSet.webpSmall} ${manifest.srcSet.smallWidth}w, ${manifest.srcSet.webpLarge} ${manifest.srcSet.largeWidth}w`}
            sizes="(max-width: 760px) calc(100vw - 40px), 760px"
          />
          <Image
            src={manifest.src}
            alt={copy.alt}
            width={manifest.width}
            height={manifest.height}
            loading={manifest.id === "fig-01" ? "eager" : "lazy"}
            sizes="(max-width: 760px) calc(100vw - 40px), 760px"
            unoptimized
          />
        </picture>
        {callouts.length ? (
          <span className={styles.figureMarkers} aria-hidden="true">
            {callouts.map((callout) => (
              <span
                className={styles.figureMarker}
                key={callout.id}
                style={{ insetInlineStart: `${callout.xPercent}%`, insetBlockStart: `${callout.yPercent}%` }}
              >
                {callout.number}
              </span>
            ))}
          </span>
        ) : null}
      </a>
      <figcaption id={captionId}>
        <div>
          {copy.caption}
          {callouts.length ? (
            <ol className={styles.figureCalloutList}>
              {callouts.map((callout) => <li key={callout.id}>{callout.label}</li>)}
            </ol>
          ) : null}
        </div>
        <small>
          <span className={styles.figureMeta}>
            {observedLabel} <time dateTime={manifest.observedOn} dir="ltr">{manifest.observedOn}</time>
            {" · "}
            <a href={manifest.sourceUrl} target="_blank" rel="noopener noreferrer">{sourceLabel}</a>
          </span>
          <span className={styles.figureAttribution} dir="auto">{manifest.attribution}</span>
        </small>
      </figcaption>
    </figure>
  );
}
