import Image from "next/image";
import type { CodexIncomeFigure } from "@/lib/make-money-with-codex";
import styles from "./IncomeCourse.module.css";

export default function CourseFigure({
  figure,
  eager = false,
  instanceId,
}: {
  figure: CodexIncomeFigure;
  eager?: boolean;
  instanceId?: string;
}) {
  const captionId = `${figure.id}${instanceId ? `-${instanceId}` : ""}-caption`;
  const testId = `income-figure-${figure.id}${instanceId ? `-${instanceId}` : ""}`;
  const officialRepositoryImage = figure.captureMethod === "official-repository-image";
  const surfaceLabel = figure.surface === "codex-cli"
    ? officialRepositoryImage
      ? "Official historical Codex CLI illustration"
      : "Actual Codex CLI transcript rendering"
    : {
        "codex-app": "Real Codex app UI",
        "product-output": "Synthetic product evidence fixture",
        "repository-handoff": "Synthetic repository handoff",
      }[figure.surface];
  return (
    <figure
      className={styles.courseFigure}
      dir="ltr"
      data-testid={testId}
      data-capture-sha256={figure.sha256}
      data-figure-surface={figure.surface}
    >
      <picture>
        <source srcSet={figure.webp} type="image/webp" />
        <Image
          src={figure.src}
          alt={figure.alt}
          width={figure.width}
          height={figure.height}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          sizes="(max-width: 900px) calc(100vw - 40px), 760px"
          unoptimized
          aria-describedby={captionId}
        />
      </picture>
      <figcaption id={captionId}>
        <p className={styles.figureType}>{surfaceLabel}</p>
        <p>{figure.caption}</p>
        <p className={styles.figureBoundary}><strong>Evidence boundary:</strong> {figure.boundary}</p>
        <details>
          <summary>Figure provenance</summary>
          <dl>
            <div><dt>Surface</dt><dd>{figure.surface}</dd></div>
            <div><dt>Capture path</dt><dd>{officialRepositoryImage
              ? "Official image in a pinned OpenAI repository commit"
              : "First-party capture with a repository evidence record"}</dd></div>
            <div><dt>Source attribution</dt><dd>{figure.sourceAuthor}{figure.sourceDate ? <>, <time dateTime={figure.sourceDate}>{figure.sourceDate}</time></> : null}</dd></div>
            <div><dt>Verified</dt><dd><time dateTime={figure.verifiedOn}>{figure.verifiedOn}</time></dd></div>
            <div><dt>Visible public identifiers</dt><dd>{figure.visiblePublicIdentifiers.length ? figure.visiblePublicIdentifiers.join(", ") : "None observed"}</dd></div>
            <div><dt>Privacy review</dt><dd>{figure.privacyReview}</dd></div>
            <div><dt>Master SHA-256</dt><dd><code>{figure.sha256}</code></dd></div>
            <div><dt>WebP SHA-256</dt><dd><code>{figure.webpSha256}</code></dd></div>
          </dl>
          <p>{figure.rightsBasis === "apache-2.0-pinned-source"
            ? "Reused from an Apache-2.0 source with notice. Apache-2.0 does not grant trademark rights or imply OpenAI endorsement."
            : "First-party capture documented in the repository evidence record. The workspace and teaching data are synthetic; product and trademark rights remain with their respective owners."}</p>
          <div className={styles.figureLinks}>
            <a href={figure.sourceUrl} target="_blank" rel="noopener noreferrer">{officialRepositoryImage
              ? "Pinned source image"
              : "Practitioner context"}</a>
            <a href={figure.sourcePage} target="_blank" rel="noopener noreferrer">{officialRepositoryImage
              ? "Pinned repository snapshot"
              : "OpenAI community index"}</a>
          </div>
        </details>
      </figcaption>
    </figure>
  );
}
