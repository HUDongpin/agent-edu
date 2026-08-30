"use client";

import { useEffect, useRef } from "react";
import type {
  CourseKitSourceRecord,
  CourseKitUiCopy,
} from "@/lib/course-kit/types";
import styles from "./CourseKit.module.css";

function sourceIdFromHash(hash: string): string | null {
  if (!hash.startsWith("#source-")) return null;
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return null;
  }
}

function accessedDate(value: string, locale: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

function SourceArticle({
  source,
  labels,
  locale,
}: {
  readonly source: CourseKitSourceRecord<string>;
  readonly labels: CourseKitUiCopy;
  readonly locale: string;
}) {
  return (
    <article>
      <header>
        <h3>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            lang="en"
          >
            {source.title}
            <span aria-hidden="true"> ↗</span>
            <span className={styles.srOnly}> ({labels.opensInNewTab})</span>
          </a>
        </h3>
        <p className={styles.sourceMeta}>
          <span lang="en">{source.publisher}</span>
          <span>{labels.sourceKindLabels[source.kind]}</span>
          <span>{labels.sourceStabilityLabels[source.stability]}</span>
          <span>
            {labels.accessedOn}:{" "}
            <time dateTime={source.accessedOn}>
              {accessedDate(source.accessedOn, locale)}
            </time>
          </span>
          {source.jurisdiction ? <span>{source.jurisdiction}</span> : null}
          {source.revision ? <span>{source.revision}</span> : null}
        </p>
      </header>
      <dl>
        <div>
          <dt>{labels.sourceSupports}</dt>
          <dd>{source.supports}</dd>
        </div>
        <div>
          <dt>{labels.sourceBoundary}</dt>
          <dd>{source.boundary}</dd>
        </div>
      </dl>
      {source.evidenceUrls.length > 1 ? (
        <nav aria-label={`${source.title}: ${labels.sources}`}>
          {source.evidenceUrls.slice(1).map((url, evidenceIndex) => (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              key={url}
            >
              {labels.source} {evidenceIndex + 2}
              <span className={styles.srOnly}> ({labels.opensInNewTab})</span>
            </a>
          ))}
        </nav>
      ) : null}
    </article>
  );
}

export function SourceRegister({
  sources,
  labels,
  titleId,
  compact = false,
  locale = "en",
  showIntro = true,
  heading,
  showEyebrow = true,
}: {
  readonly sources: readonly CourseKitSourceRecord<string>[];
  readonly labels: CourseKitUiCopy;
  readonly titleId: string;
  readonly compact?: boolean;
  readonly locale?: string;
  readonly showIntro?: boolean;
  readonly heading?: string;
  readonly showEyebrow?: boolean;
}) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!compact) return;

    const revealHashTarget = () => {
      const sourceId = sourceIdFromHash(window.location.hash);
      if (!sourceId) return;

      const target = document.getElementById(sourceId);
      if (!target || !rootRef.current?.contains(target)) return;

      const disclosure = target.querySelector(":scope > details");
      const summary = disclosure?.querySelector(":scope > summary");
      if (!(disclosure instanceof HTMLDetailsElement) || !(summary instanceof HTMLElement)) {
        return;
      }

      disclosure.open = true;
      window.requestAnimationFrame(() => summary.focus({ preventScroll: true }));
    };

    revealHashTarget();
    window.addEventListener("hashchange", revealHashTarget);
    return () => window.removeEventListener("hashchange", revealHashTarget);
  }, [compact]);

  return (
    <section
      ref={rootRef}
      className={`${styles.sources} ${compact ? styles.sourcesCompact : ""}`}
      aria-labelledby={titleId}
    >
      <header className={styles.sectionIntro}>
        {showEyebrow ? <p className={styles.eyebrow}>{labels.sources}</p> : null}
        <h2 id={titleId}>{heading ?? labels.evidenceRegister}</h2>
        {showIntro ? <p>{labels.evidenceNote}</p> : null}
      </header>
      <ol>
        {sources.map((source, index) => {
          const number = String(index + 1).padStart(2, "0");
          return compact ? (
            <li
              className={styles.compactSource}
              id={`source-${source.id}`}
              key={source.id}
            >
              <details>
                <summary>
                  <span className={styles.sourceNumber} aria-hidden="true">{number}</span>
                  <span>
                    <strong lang="en">{source.title}</strong>
                    <small lang="en">{source.publisher}</small>
                  </span>
                  <span aria-hidden="true">＋</span>
                </summary>
                <SourceArticle source={source} labels={labels} locale={locale} />
              </details>
            </li>
          ) : (
            <li id={`source-${source.id}`} key={source.id}>
              <span className={styles.sourceNumber} aria-hidden="true">{number}</span>
              <SourceArticle source={source} labels={labels} locale={locale} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
