"use client";

import { useEffect, useRef } from "react";

export interface ErrorSurfaceProps {
  eyebrow: string;
  title: string;
  body: string;
  homeLabel: string;
  homeHref: string;
  coursesLabel: string;
  coursesHref: string;
  retryLabel?: string;
  onRetry?: () => void;
  referenceLabel?: string;
  reference?: string;
  alert?: boolean;
  focusKey?: string;
}

export default function ErrorSurface({
  eyebrow,
  title,
  body,
  homeLabel,
  homeHref,
  coursesLabel,
  coursesHref,
  retryLabel,
  onRetry,
  referenceLabel,
  reference,
  alert = false,
  focusKey,
}: ErrorSurfaceProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const headingId = "error-surface-title";
  const descriptionId = "error-surface-description";

  useEffect(() => {
    headingRef.current?.focus();
  }, [focusKey]);

  return (
    <section
      className="errorSurface"
      role={alert ? "alert" : undefined}
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
    >
      <div className="errorSurface-card">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id={headingId} ref={headingRef} tabIndex={-1}>{title}</h1>
        <p id={descriptionId} className="errorSurface-body">{body}</p>

        {reference && referenceLabel ? (
          <p className="errorSurface-reference">
            {referenceLabel}: <code>{reference}</code>
          </p>
        ) : null}

        <div className="errorSurface-actions">
          {onRetry && retryLabel ? (
            <button className="btn primary" type="button" onClick={onRetry}>
              {retryLabel}
            </button>
          ) : (
            <a className="btn primary" href={homeHref}>{homeLabel}</a>
          )}
          {onRetry ? <a className="btn" href={homeHref}>{homeLabel}</a> : null}
          <a className="btn" href={coursesHref}>{coursesLabel}</a>
        </div>
      </div>
    </section>
  );
}
