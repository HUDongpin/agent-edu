import Image from "next/image";
import type { CursorCourseCopy, MaterializedCursorLesson } from "@/lib/cursor";
import styles from "./CursorCourse.module.css";

type Figure = MaterializedCursorLesson["figures"][number];

export default function CourseFigure({
  figure,
  pendingLabel,
  labels,
}: {
  figure: Figure;
  pendingLabel: string;
  labels: Pick<
    CursorCourseCopy["ui"],
    | "openFullSize"
    | "source"
    | "figureCurrent"
    | "figureDated"
    | "figureHistorical"
    | "figureOriginal"
    | "figureAttribution"
  >;
}) {
  const { manifest, copy } = figure;
  const captionId = `${manifest.id}-caption`;

  if (manifest.status === "capture-required") {
    return (
      <figure
        className={styles.courseFigure}
        data-testid={`cursor-figure-${manifest.id}`}
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
      data-testid={`cursor-figure-${manifest.id}`}
      data-figure-status={manifest.status}
      data-figure-kind={manifest.kind}
      data-asset-sha256={manifest.sha256}
    >
      <a
        className={styles.figureImage}
        href={manifest.src}
        aria-describedby={captionId}
        aria-label={`${labels.openFullSize}: ${copy.alt}`}
        dir="ltr"
      >
        <Image
          src={manifest.src}
          alt={copy.alt}
          width={manifest.width}
          height={manifest.height}
          loading={manifest.id === "fig-01" ? "eager" : "lazy"}
          sizes="(max-width: 760px) calc(100vw - 40px), 760px"
          unoptimized
        />
        {manifest.kind === "course-original-diagram" ? (
          <span className={styles.figureOriginBadge}>{labels.figureOriginal}</span>
        ) : null}
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
          <p className={styles.figureRights}>
            {labels.figureAttribution}{" "}
            {manifest.kind === "course-original-diagram" ? (
              <a href={manifest.provenancePath}>{labels.source}</a>
            ) : (
              <a href={manifest.sourcePageUrl} target="_blank" rel="noopener noreferrer">
                {labels.source}
              </a>
            )}
          </p>
        </div>
        <small data-testid={`cursor-freshness-${manifest.id}`}>
          {manifest.kind === "course-original-diagram" ? (
            <>
              {labels.figureOriginal}{" · "}
              <bdi dir="ltr">v{manifest.diagramVersion}</bdi>{" · "}
              <bdi dir="ltr">{manifest.createdOn}</bdi>
            </>
          ) : (
            <>
              {manifest.uiFreshness === "current"
                ? labels.figureCurrent
                : manifest.uiFreshness === "dated-current"
                  ? labels.figureDated
                  : labels.figureHistorical}
              {" · "}<bdi dir="ltr">{manifest.cursorVersion}</bdi>{" · "}
              <bdi dir="ltr">{manifest.capturedOn}</bdi>
            </>
          )}
        </small>
      </figcaption>
    </figure>
  );
}
