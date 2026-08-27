import Image from "next/image";
import type { MaterializedCodexLesson } from "@/lib/codex";
import TechnicalText from "./TechnicalText";
import styles from "./CodexCourse.module.css";

type Figure = MaterializedCodexLesson["figures"][number];

export default function CourseFigure({
  figure,
}: {
  figure: Figure;
  pendingLabel: string;
}) {
  const { manifest, copy } = figure;
  const captionId = `${manifest.id}-caption`;
  const isOriginalDiagram = manifest.kind === "course-original-diagram";
  const mobileSource = "mobile" in manifest.srcSet ? manifest.srcSet.mobile : undefined;
  const imageAlt = isOriginalDiagram
    ? `${manifest.provenanceLabel}. ${copy.alt}`
    : copy.alt;

  const callouts = (manifest.callouts ?? []).flatMap((callout, index) => {
    const label = copy.callouts?.[callout.labelKey];
    return label ? [{ ...callout, label, number: index + 1 }] : [];
  });

  return (
    <figure
      className={styles.courseFigure}
      data-testid={`codex-figure-${manifest.id}`}
      data-figure-status={manifest.status}
      data-figure-kind={manifest.kind}
      data-capture-sha256={isOriginalDiagram ? undefined : manifest.sha256}
      data-diagram-sha256={isOriginalDiagram ? manifest.assetSha256.png2240 : undefined}
    >
      <a
        className={styles.figureImage}
        href={manifest.src}
        aria-describedby={captionId}
        dir="ltr"
      >
        <picture>
          {mobileSource ? (
            <source media="(max-width: 640px)" srcSet={mobileSource} type="image/webp" />
          ) : null}
          <source
            type="image/webp"
            srcSet={`${manifest.srcSet.webp1120} 1120w, ${manifest.srcSet.webp2240} 2240w`}
            sizes="(max-width: 760px) calc(100vw - 40px), 760px"
          />
          <Image
            src={manifest.src}
            alt={imageAlt}
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
          <TechnicalText text={copy.caption} />
          {callouts.length ? (
            <ol className={styles.figureCalloutList}>
              {callouts.map((callout) => <li key={callout.id}><TechnicalText text={callout.label} /></li>)}
            </ol>
          ) : null}
        </div>
        <small dir="ltr">
          {isOriginalDiagram ? (
            <span className={styles.figureOriginalProvenance} lang="en">
              {manifest.provenanceLabel} / {manifest.rendererVersion}
            </span>
          ) : (
            <>
              Codex {manifest.codexVersion} / <time dateTime={manifest.capturedOn}>{manifest.capturedOn}</time>
              {manifest.thirdPartySourceUrl && manifest.thirdPartyLicense ? (
                <> / <a href={manifest.thirdPartySourceUrl} target="_blank" rel="noopener noreferrer">{manifest.thirdPartyLicense}</a></>
              ) : null}
            </>
          )}
        </small>
      </figcaption>
    </figure>
  );
}
