import Image from "next/image";
import type {
  GrokCourseCopy,
  GrokLocale,
  MaterializedGrokLesson,
} from "@/lib/grok/types";
import styles from "./GrokCourse.module.css";

type Figure = MaterializedGrokLesson["figures"][number];

export default function CourseFigure({
  figure,
  eager = false,
  labels,
  locale,
}: {
  figure: Figure;
  eager?: boolean;
  labels: GrokCourseCopy["ui"];
  locale: GrokLocale;
}) {
  const { manifest, copy } = figure;
  const captionId = `${manifest.id}-caption`;
  const dateFormat = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const formatDate = (value: string) => dateFormat.format(new Date(`${value}T00:00:00Z`));
  const callouts = manifest.callouts.map((callout, index) => ({
    ...callout,
    number: index + 1,
    label: copy.callouts[callout.id],
  }));

  return (
    <figure
      className={styles.courseFigure}
      data-testid={`grok-figure-${manifest.id}`}
      data-figure-status={manifest.status}
      data-capture-sha256={manifest.sha256}
    >
      <div className={styles.figureImage} aria-describedby={captionId} dir="ltr">
        <picture>
          <source
            media="(max-width: 640px)"
            srcSet={manifest.srcSet.mobile}
            width={manifest.derivatives.mobile.width}
            height={manifest.derivatives.mobile.height}
            type="image/webp"
          />
          <source
            type="image/webp"
            srcSet={`${manifest.srcSet.webp1120} 1120w, ${manifest.srcSet.webp2240} 2240w`}
            sizes="(max-width: 900px) calc(100vw - 40px), 820px"
            width={manifest.derivatives.webp1120.width}
            height={manifest.derivatives.webp1120.height}
          />
          <Image
            src={manifest.srcSet.webp1120}
            alt={copy.alt}
            width={manifest.derivatives.webp1120.width}
            height={manifest.derivatives.webp1120.height}
            sizes="(max-width: 900px) calc(100vw - 40px), 820px"
            loading={eager ? "eager" : "lazy"}
            unoptimized
          />
        </picture>
        <span className={styles.figureMarkers} aria-hidden="true">
          {callouts.map((callout) => (
            <span
              className={styles.figureMarker}
              key={callout.id}
              style={{
                insetInlineStart: `${callout.xPercent}%`,
                insetBlockStart: `${callout.yPercent}%`,
              }}
            >
              {callout.number}
            </span>
          ))}
        </span>
      </div>
      <figcaption id={captionId}>
        <p>{copy.caption}</p>
        <ol className={styles.figureCallouts} aria-label={labels.calloutLegend}>
          {callouts.map((callout) => (
            <li key={callout.id}>
              <span>{callout.number}</span>
              {callout.label}
            </li>
          ))}
        </ol>
        <details className={styles.figureProvenance}>
          <summary>{labels.figureProvenance}</summary>
          <dl>
            <div>
              <dt>{labels.figureCaptured}</dt>
              <dd><time dateTime={manifest.capturedOn}>{formatDate(manifest.capturedOn)}</time></dd>
            </div>
            <div>
              <dt>{labels.figureVerified}</dt>
              <dd><time dateTime={manifest.verifiedOn}>{formatDate(manifest.verifiedOn)}</time></dd>
            </div>
            <div>
              <dt>{labels.privacyReviewed}</dt>
              <dd lang={locale === "en" ? undefined : "en"}>{manifest.privacyReview.note}</dd>
            </div>
            <div>
              <dt>{labels.sha256}</dt>
              <dd dir="ltr"><code>{manifest.sha256}</code></dd>
            </div>
          </dl>
          <p>{labels.figureFreshness}</p>
          <a
            href={manifest.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${labels.figureSource}: ${copy.alt}`}
          >
            {labels.figureSource}
          </a>
        </details>
      </figcaption>
    </figure>
  );
}
