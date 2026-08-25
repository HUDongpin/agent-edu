import Image from "next/image";
import type { MaterializedGithubFigure } from "@/lib/github";
import base from "@/components/codex/CodexCourse.module.css";
import styles from "./GithubCourse.module.css";

export default function CourseFigure({
  figure,
  sourceLabel,
}: {
  figure: MaterializedGithubFigure;
  sourceLabel: string;
}) {
  const { manifest, copy } = figure;
  const captionId = `github-${manifest.id}-caption`;

  return (
    <figure
      className={base.courseFigure}
      data-testid={`github-figure-${manifest.id}`}
      data-figure-status="available"
      data-figure-sha256={manifest.sha256}
    >
      <a
        className={base.figureImage}
        href={manifest.src}
        aria-describedby={captionId}
        dir="ltr"
      >
        <picture>
          <source srcSet={manifest.webpSrc} type="image/webp" />
          <Image
            src={manifest.src}
            alt={copy.alt}
            width={manifest.width}
            height={manifest.height}
            loading={manifest.id === "fig-15" ? "eager" : "lazy"}
            sizes="(max-width: 760px) calc(100vw - 40px), 760px"
            unoptimized
          />
        </picture>
      </a>
      <figcaption id={captionId}>
        <div>
          <span>{copy.caption}</span>
          <span className={styles.figureAttribution}>
            <span dir="ltr">
              GitHub Docs © GitHub, Inc. · CC BY 4.0 · {manifest.observedOn}
            </span>
            <a
              href={manifest.sourcePage}
              target="_blank"
              rel="noopener noreferrer"
            >
              {sourceLabel}
            </a>
          </span>
        </div>
        <small dir="ltr">{manifest.id}</small>
      </figcaption>
    </figure>
  );
}
