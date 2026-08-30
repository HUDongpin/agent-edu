import Image from "next/image";
import type { McpFigure } from "@/lib/mcp";
import type { McpUiCopy } from "@/lib/mcp/copy";
import { formatMcpCopy } from "@/lib/mcp/format";
import styles from "./McpCourse.module.css";

export default function McpFigure({ figure, ui }: { figure: McpFigure; ui: McpUiCopy }) {
  const captionId = `mcp-${figure.id}-caption`;
  const evidenceLabel = {
    "direct-mcp-ui": ui.figureEvidenceDirect,
    "host-inventory": ui.figureEvidenceInventory,
    "host-context": ui.figureEvidenceContext,
    "design-example": ui.figureEvidenceDesign,
  }[figure.evidenceClass];
  return (
    <figure
      className={styles.courseFigure}
      data-testid={`mcp-figure-${figure.id}`}
      data-figure-sha256={figure.sha256}
    >
      {figure.legacyNote ? <div className={styles.legacyBanner}>{ui.figureLegacyBanner}</div> : null}
      <a href={figure.src} className={styles.figureImage} aria-describedby={captionId} dir="ltr">
        <picture>
          <source media="(max-width: 760px)" srcSet={figure.mobileWebpSrc} type="image/webp" />
          <source srcSet={figure.webpSrc} type="image/webp" />
          <Image
            src={figure.src}
            alt={figure.alt}
            width={figure.width}
            height={figure.height}
            sizes="(max-width: 760px) calc(100vw - 32px), 820px"
            unoptimized
          />
        </picture>
      </a>
      <figcaption id={captionId}>
        <div>
          <p className={styles.figureEvidenceClass}>{evidenceLabel}</p>
          <p>{figure.caption}</p>
          <p className={styles.figureTeaching}><strong>{ui.figureLookFor}</strong> {figure.teachingPoint}</p>
          {figure.legacyNote ? <p className={styles.figureLegacy}>{figure.legacyNote}</p> : null}
          <p className={styles.figureAttribution}>
            <span>{formatMcpCopy(ui.figureAttributionTemplate, { publisher: figure.publisher, rights: figure.rights, date: figure.observedOn })}</span>
            <a href={figure.sourceUrl} target="_blank" rel="noopener noreferrer">
              {ui.figureOpenSource} <span aria-hidden="true">↗</span>
              <span className={styles.visuallyHidden}> ({ui.externalNewTab})</span>
            </a>
          </p>
        </div>
        <small dir="ltr">{figure.id}</small>
      </figcaption>
    </figure>
  );
}
