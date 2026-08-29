import Image from "next/image";
import {
  formatCodexTemplate,
  formatCodexUtcMediumDate,
  formatCodexVisibleInteger,
  type CodexCourseCopy,
  type CodexLocale,
  type MaterializedCodexLesson,
} from "@/lib/codex";
import TechnicalText from "./TechnicalText";
import styles from "./CodexCourse.module.css";

type Figure = MaterializedCodexLesson["figures"][number];

export default function CourseFigure({
  figure,
  labels,
  locale,
}: {
  figure: Figure;
  labels: Pick<CodexCourseCopy["ui"], "capturePending" | "pendingFigureAltTemplate">;
  locale: CodexLocale;
}) {
  const { manifest, copy } = figure;
  const captionId = `${manifest.id}-caption`;

  if (manifest.status === "capture-required") {
    return (
      <figure
        className={styles.courseFigure}
        data-testid={`codex-figure-${manifest.id}`}
        data-figure-status={manifest.status}
      >
        <div
          className={styles.figurePending}
          role="img"
          aria-label={formatCodexTemplate(labels.pendingFigureAltTemplate, {
            status: labels.capturePending,
            alt: copy.alt,
          })}
          aria-describedby={captionId}
        >
          <span className={styles.figureNumber} aria-hidden="true">
            {formatCodexVisibleInteger(Number(manifest.id.replace("fig-", "")), locale)}
          </span>
          <strong><TechnicalText text={labels.capturePending} /></strong>
        </div>
        <figcaption id={captionId}><TechnicalText text={copy.caption} /></figcaption>
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
      data-testid={`codex-figure-${manifest.id}`}
      data-figure-status={manifest.status}
      data-capture-sha256={manifest.sha256}
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
            srcSet={`${manifest.srcSet.webp1120} 1120w, ${manifest.srcSet.webp2240} 2240w`}
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
                {formatCodexVisibleInteger(callout.number, locale)}
              </span>
            ))}
          </span>
        ) : null}
      </a>
      <figcaption id={captionId}>
        <div>
          <TechnicalText text={copy.caption} />
          {callouts.length ? (
            <ol className={styles.figureCalloutList} role="list">
              {callouts.map((callout) => (
                <li key={callout.id}>
                  <span aria-hidden="true">{formatCodexVisibleInteger(callout.number, locale)}</span>
                  <TechnicalText text={callout.label} />
                </li>
              ))}
            </ol>
          ) : null}
        </div>
        <small>
          <span dir="ltr" translate="no">Codex {manifest.codexVersion}</span>
          <time dateTime={manifest.capturedOn}>
            {formatCodexUtcMediumDate(manifest.capturedOn, locale)}
          </time>
          {manifest.thirdPartySourceUrl && manifest.thirdPartyLicense ? (
            <a
              dir="ltr"
              href={manifest.thirdPartySourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              translate="no"
            >
              {manifest.thirdPartyLicense}
            </a>
          ) : null}
        </small>
      </figcaption>
    </figure>
  );
}
