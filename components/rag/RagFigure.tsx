import type { RagCourseCopy, RagFigureCopy, RagFigureManifest } from "@/lib/rag";
import base from "../prompts/PromptCourse.module.css";
import styles from "./RagCourse.module.css";

function SemanticFigure({ figure, copy }: { figure: RagFigureManifest; copy: RagFigureCopy }) {
  if (figure.id === "evaluation-stack" || figure.id === "threat-boundary") {
    return (
      <ol className={styles.stackFigure}>
        {copy.transcript.map((label, index) => (
          <li key={label}><span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong></li>
        ))}
      </ol>
    );
  }

  if (figure.id === "context-budget") {
    const widths = [15, 12, 9, 34, 20, 10];
    return (
      <div className={styles.budgetFigure}>
        {copy.transcript.slice(4, 10).map((label, index) => (
          <span key={label} style={{ flexGrow: widths[index] }}><strong>{label}</strong></span>
        ))}
      </div>
    );
  }

  if (figure.id === "retrieval-scoreboard") {
    return (
      <div className={styles.scoreboardFigure}>
        <table>
          <caption className={base.srOnly}>{copy.title}</caption>
          <thead>
            <tr><th scope="col">{copy.transcript[0]}</th><th scope="col">{copy.transcript[4]}</th><th scope="col">{copy.transcript[5]}</th></tr>
          </thead>
          <tbody>
            {copy.transcript.slice(1, 4).map((label, index) => (
              <tr key={label}><th scope="row">{label}</th><td>{index === 0 ? "0.94" : index === 1 ? "0.31" : "0.72"}</td><td>{index === 0 ? "0.48" : index === 1 ? "0.91" : "0.86"}</td></tr>
            ))}
          </tbody>
        </table>
        <p>{copy.transcript.slice(6).join(" → ")}</p>
      </div>
    );
  }

  return (
    <ol className={styles.nodeFigure}>
      {copy.transcript.map((label, index) => (
        <li key={label}><span>{String(index + 1).padStart(2, "0")}</span><strong>{label}</strong></li>
      ))}
    </ol>
  );
}

export default function RagFigure({
  figure,
  copy,
  labels,
  eager = false,
}: {
  figure: RagFigureManifest;
  copy: RagFigureCopy;
  labels: RagCourseCopy["ui"];
  eager?: boolean;
}) {
  const asset = figure.raster ?? figure.vector ?? null;
  const figureKind = figure.authenticUi
    ? labels.authenticFigure
    : figure.format === "official-teaching-diagram"
      ? labels.officialFigure
      : labels.originalFigure;
  return (
    <figure className={`${base.courseFigure} ${styles.courseFigure}`} data-figure-id={figure.id}>
      <div className={base.figureHeading}>
        <span>{labels.courseFigure}</span>
        <small>{figureKind}</small>
      </div>
      {figure.raster ? (
        <a className={base.rasterFrame} href={figure.raster.pngPath} target="_blank" rel="noopener noreferrer">
          <picture>
            <source srcSet={figure.raster.webpPath} type="image/webp" />
            <img
              src={figure.raster.pngPath}
              width={figure.raster.width}
              height={figure.raster.height}
              alt={copy.alt}
              loading={eager ? "eager" : "lazy"}
              decoding="async"
            />
          </picture>
          <span className={base.srOnly}>{labels.openOriginal}</span>
        </a>
      ) : figure.vector ? (
        <a className={base.rasterFrame} href={figure.vector.svgPath} target="_blank" rel="noopener noreferrer">
          {/* Preserve the audited SVG byte-for-byte instead of routing it through an image transformer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={figure.vector.svgPath}
            width={figure.vector.width}
            height={figure.vector.height}
            alt={copy.alt}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
          />
          <span className={base.srOnly}>{labels.openOriginal}</span>
        </a>
      ) : (
        <div className={`${base.semanticFigure} ${styles.semanticFigure}`} role="group" aria-label={copy.alt}>
          <SemanticFigure figure={figure} copy={copy} />
        </div>
      )}
      <figcaption>
        <strong>{copy.title}</strong>
        <span>{copy.caption}</span>
      </figcaption>
      <details className={base.figureTranscript}>
        <summary>{labels.imageTranscript}</summary>
        <ol>{copy.transcript.map((item) => <li key={item}>{item}</li>)}</ol>
      </details>
      {asset ? (
        <div className={styles.figureProvenance}>
          <a href={asset.upstreamUrl} target="_blank" rel="noopener noreferrer">{labels.source}</a>
          <a href="/courses/rag/NOTICE.md" target="_blank" rel="noopener noreferrer">{labels.rightsNotice}</a>
          <code translate="no">{asset.upstreamCommit.slice(0, 12)}</code>
        </div>
      ) : null}
    </figure>
  );
}
