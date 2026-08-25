import Image from "next/image";
import type { ClaudeIncomeFigure } from "@/lib/claude-income";
import styles from "./ClaudeIncomeCourse.module.css";

function uniqueDecodedWidths(figure: ClaudeIncomeFigure) {
  const byWidth = new Map<number, ClaudeIncomeFigure["variants"][number]>();
  for (const variant of figure.variants) {
    if (!byWidth.has(variant.width)) byWidth.set(variant.width, variant);
  }
  return [...byWidth.values()].sort((left, right) => left.width - right.width);
}

export default function CourseFigure({
  figure,
  priority = false,
}: {
  figure: ClaudeIncomeFigure;
  priority?: boolean;
}) {
  const variants = uniqueDecodedWidths(figure);
  const captionId = `${figure.id}-caption`;
  const srcSet = variants.map((variant) => `${variant.src} ${variant.width}w`).join(", ");
  const displayWidth = Math.min(figure.width, 860);

  return (
    <figure
      className={styles.courseFigure}
      data-testid={`claude-income-figure-${figure.id}`}
      data-master-width={figure.width}
      data-master-height={figure.height}
      data-capture-sha256={figure.sha256}
      data-rights-status={figure.rightsStatus}
      data-privacy-review={figure.privacyReview}
    >
      <div className={styles.figureHeading}>
        <span>Real Claude UI</span>
        <h3>{figure.title}</h3>
      </div>
      <a
        className={styles.figureImage}
        href={figure.src}
        aria-describedby={captionId}
        title="Open the full resolution image"
      >
        <picture>
          {srcSet ? (
            <source
              type="image/webp"
              srcSet={srcSet}
              sizes={`(max-width: 640px) calc(100vw - 40px), ${displayWidth}px`}
            />
          ) : null}
          <Image
            src={figure.src}
            alt={figure.alt}
            width={figure.width}
            height={figure.height}
            sizes={`(max-width: 640px) calc(100vw - 40px), ${displayWidth}px`}
            priority={priority}
            unoptimized
          />
        </picture>
      </a>
      <figcaption id={captionId}>
        <p>{figure.caption}</p>
        <dl className={styles.figureMeta}>
          <div>
            <dt>Observed</dt>
            <dd><time dateTime={figure.observedOn}>{figure.observedOn}</time></dd>
          </div>
          <div>
            <dt>Surface</dt>
            <dd>{figure.surface}</dd>
          </div>
          <div>
            <dt>Privacy</dt>
            <dd>Review passed</dd>
          </div>
          <div>
            <dt>Rights</dt>
            <dd>Course-authored capture</dd>
          </div>
        </dl>
        <ul className={styles.figureTeachingPoints}>
          {figure.teachingPoints.map((point) => <li key={point}>{point}</li>)}
        </ul>
        <a className={styles.sourceLink} href={figure.sourceUrl} target="_blank" rel="noopener noreferrer">
          Open the related official guidance
          <span aria-hidden="true">↗</span>
        </a>
      </figcaption>
    </figure>
  );
}
