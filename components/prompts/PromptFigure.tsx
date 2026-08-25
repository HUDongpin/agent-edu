import type { PromptCourseCopy, PromptFigureCopy, PromptFigureManifest } from "@/lib/prompts";
import styles from "./PromptCourse.module.css";

function PipelineFigure({ labels }: { labels: readonly string[] }) {
  const nodeIds = ["task", "prompt", "model-and-tools", "output", "test"] as const;
  const edgeIds = ["task-to-prompt", "prompt-to-model-and-tools", "model-and-tools-to-output", "output-to-test"] as const;

  return (
    <div className={styles.pipelineFigure}>
      <ol className={styles.flowFigure}>
        {labels.slice(0, 5).map((label, index) => (
          <li key={label} data-node={nodeIds[index]}>
            {index > 0 ? (
              <span className={styles.nodeConnector} data-edge={edgeIds[index - 1]} aria-hidden="true">→</span>
            ) : null}
            <small>{String(index + 1).padStart(2, "0")}</small>
            <strong>{label}</strong>
          </li>
        ))}
      </ol>
      <div className={styles.pipelineSupport} data-node="evidence">
        <strong>{labels[5]}</strong>
        <span data-edge="evidence-to-model-and-tools" aria-hidden="true">↑</span>
      </div>
    </div>
  );
}

function ChainFigure({ labels }: { labels: readonly string[] }) {
  const nodeIds = ["source", "extract", "compare", "draft", "verify"] as const;
  const edgeIds = ["source-to-extract", "extract-to-compare", "compare-to-draft", "draft-to-verify"] as const;

  return (
    <div className={styles.chainFigure}>
      <ol className={styles.flowFigure}>
        {labels.slice(0, 5).map((label, index) => (
          <li key={label} data-node={nodeIds[index]}>
            {index > 0 ? (
              <span className={styles.nodeConnector} data-edge={edgeIds[index - 1]} aria-hidden="true">→</span>
            ) : null}
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{label}</strong>
          </li>
        ))}
      </ol>
      <div className={styles.stopGate} data-node="stop-if-evidence-is-missing">
        <span aria-hidden="true">■</span>
        <strong>{labels[5]}</strong>
        <i data-edge="verification-failure-to-stop" aria-hidden="true">↵</i>
      </div>
    </div>
  );
}

function AuthorityFigure({ labels }: { labels: readonly string[] }) {
  return (
    <div className={styles.authorityFigure}>
      <div className={styles.authorityLane} data-node="authoritative-task">
        <small>01</small>
        <strong>{labels[0]}</strong>
      </div>
      <span className={styles.authorityArrow} data-edge="authoritative-task-to-structured-output" aria-hidden="true">→</span>
      <div className={styles.authorityOutput} data-node="structured-output">
        <small>03</small>
        <strong>{labels[4]}</strong>
      </div>
      <div className={`${styles.authorityLane} ${styles.untrustedLane}`} data-node="untrusted-source-data">
        <small>02</small>
        <strong>{labels[1]}</strong>
        <span className={styles.factChip} data-node="fact-with-paragraph-id">{labels[2]}</span>
        <span className={styles.blockedChip} data-node="embedded-instruction-stays-data">
          {labels[3]} <b aria-hidden="true">⊘</b>
        </span>
      </div>
      <span className={styles.authorityArrow} data-edge="fact-with-paragraph-id-to-structured-output" aria-hidden="true">→</span>
    </div>
  );
}

function FewShotFigure({ labels }: { labels: readonly string[] }) {
  return (
    <div className={styles.fewShotFigure}>
      <div className={styles.experimentInputs}>
        <div data-node="same-task"><small>CONTROL A</small><strong>{labels[0]}</strong></div>
        <div data-node="same-held-out-case"><small>CONTROL B</small><strong>{labels[3]}</strong></div>
      </div>
      <div className={styles.experimentEdges} aria-hidden="true">
        <span data-edge="same-task-to-zero-shot">↓</span>
        <span data-edge="same-task-to-few-shot">↓</span>
        <span data-edge="held-out-case-to-zero-shot">↓</span>
        <span data-edge="held-out-case-to-few-shot">↓</span>
      </div>
      <div className={styles.experimentBranches}>
        <div data-node="zero-shot"><small>01</small><strong>{labels[1]}</strong></div>
        <div data-node="few-shot-examples"><small>02</small><strong>{labels[2]}</strong></div>
      </div>
      <div className={styles.experimentMerge} aria-hidden="true">
        <span data-edge="zero-shot-to-compare">↘</span>
        <span data-edge="few-shot-to-compare">↙</span>
      </div>
      <div className={styles.compareNode} data-node="compare-results"><strong>{labels[4]}</strong></div>
    </div>
  );
}

function FourJobsFigure({ labels }: { labels: readonly string[] }) {
  return (
    <div className={styles.jobFigure}>
      <strong data-node="source">{labels[0]}</strong>
      <div>
        {labels.slice(1).map((label, index) => (
          <span key={label} data-node={`job-${index + 1}`} data-edge={`source-to-job-${index + 1}`}>
            <small>0{index + 1}</small>{label}
          </span>
        ))}
      </div>
    </div>
  );
}

function EvidenceFigure({ labels }: { labels: readonly string[] }) {
  const statuses = labels.slice(2, 5);
  return (
    <div className={styles.evidenceFigure} role="table">
      <div role="row" className={styles.matrixHeader}>
        <strong role="columnheader">{labels[0]}</strong>
        <strong role="columnheader">{labels[1]}</strong>
        <strong role="columnheader">Status</strong>
      </div>
      {statuses.map((status, index) => (
        <div role="row" key={status} data-evidence-row={index + 1}>
          <span role="cell" data-node={`claim-${index + 1}`}>{labels[0]} {String(index + 1).padStart(2, "0")}</span>
          <span
            role="cell"
            data-node={index === 2 ? "no-matching-paragraph" : `paragraph-evidence-${index + 1}`}
            data-edge={`claim-${index + 1}-to-evidence-${index + 1}`}
          >
            {index === 2 ? "None" : `${labels[1]} ${String(index + 1).padStart(2, "0")}`}
          </span>
          <strong role="cell" data-status={status.toLowerCase().replaceAll(" ", "-")}>{status}</strong>
        </div>
      ))}
    </div>
  );
}

function CardFigure({ labels }: { labels: readonly string[] }) {
  return (
    <div className={styles.cardFigure}>
      {labels.map((label, index) => (
        <div key={label} data-node={`prompt-card-section-${index + 1}`}>
          <small>{String(index + 1).padStart(2, "0")}</small>
          <strong>{label}</strong>
          <span aria-hidden="true">{index === labels.length - 1 ? "✓" : "· · ·"}</span>
        </div>
      ))}
    </div>
  );
}

export default function PromptFigure({
  figure,
  copy,
  labels,
  eager = false,
}: {
  figure: PromptFigureManifest;
  copy: PromptFigureCopy;
  labels: PromptCourseCopy["ui"];
  eager?: boolean;
}) {
  return (
    <figure className={styles.courseFigure} data-figure-kind={figure.kind}>
      <div className={styles.figureHeading}>
        <span>{labels.courseFigure}</span>
        <small>{labels.originalFigure}</small>
      </div>
      {figure.raster ? (
        <a className={styles.rasterFrame} href={figure.raster.pngPath} target="_blank" rel="noopener noreferrer">
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
        </a>
      ) : (
        <div className={styles.semanticFigure} role="img" aria-label={copy.alt}>
          {figure.kind === "pipeline" ? <PipelineFigure labels={copy.labels} /> : null}
          {figure.kind === "authority" ? <AuthorityFigure labels={copy.labels} /> : null}
          {figure.kind === "few-shot" ? <FewShotFigure labels={copy.labels} /> : null}
          {figure.kind === "four-jobs" ? <FourJobsFigure labels={copy.labels} /> : null}
          {figure.kind === "chain" ? <ChainFigure labels={copy.labels} /> : null}
          {figure.kind === "evidence" ? <EvidenceFigure labels={copy.labels} /> : null}
          {figure.kind === "capstone" ? <CardFigure labels={copy.labels} /> : null}
        </div>
      )}
      <figcaption>
        <strong>{copy.title}</strong>
        <span>{copy.caption}</span>
      </figcaption>
      {figure.raster ? (
        <details className={styles.figureTranscript}>
          <summary>{labels.imageTranscript}</summary>
          <p dir="ltr">{copy.labels.join(" · ")}</p>
        </details>
      ) : null}
    </figure>
  );
}
