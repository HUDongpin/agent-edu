"use client";

import { useEffect, useRef } from "react";

import type { MathAnimationSourceRecord } from "@/lib/math-animation";
import styles from "./MathAnimationCourse.module.css";

function displayUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}${url.hash}`;
  } catch {
    return value;
  }
}

function primaryPageLabel(source: MathAnimationSourceRecord, chinese: boolean): string {
  if (source.kind === "github-repository") return chinese ? "仓库主页" : "Repository home";
  if (source.kind === "x-post") return chinese ? "原始 X 帖子" : "Original X post";
  if (source.kind === "web-standard") return chinese ? "标准页面" : "Standards page";
  return chinese ? "官方文档页面" : "Official documentation";
}

function ExternalLink({
  href,
  label,
  chinese,
}: {
  href: string;
  label: string;
  chinese: boolean;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <span>{label}</span>
      <code dir="ltr">{displayUrl(href)}</code>
      <span aria-hidden="true">↗</span>
      <span className={styles.srOnly}>
        {chinese ? "，在新标签页打开" : ", opens in a new tab"}
      </span>
    </a>
  );
}

export function SourceCitationLink({
  source,
  chinese,
}: {
  source: MathAnimationSourceRecord;
  chinese: boolean;
}) {
  const href = source.versionAnchorUrl ?? source.url;
  const role = source.versionAnchorUrl
    ? (chinese ? "固定版本" : "Pinned version")
    : primaryPageLabel(source, chinese);

  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      <span>{source.title}</span>
      <small>{role}</small>
      <span aria-hidden="true">↗</span>
      <span className={styles.srOnly}>
        {chinese ? "，在新标签页打开" : ", opens in a new tab"}
      </span>
    </a>
  );
}

export default function SourceTraceLinks({
  source,
  chinese,
}: {
  source: MathAnimationSourceRecord;
  chinese: boolean;
}) {
  return (
    <dl className={styles.sourceTrace}>
      <div>
        <dt>{chinese ? "实时页面" : "Live page"}</dt>
        <dd>
          <ExternalLink
            href={source.url}
            label={primaryPageLabel(source, chinese)}
            chinese={chinese}
          />
        </dd>
      </div>
      <div>
        <dt>{chinese ? "固定版本" : "Pinned version"}</dt>
        <dd>
          {source.versionAnchorUrl ? (
            <ExternalLink
              href={source.versionAnchorUrl}
              label={source.versionOrRevision}
              chinese={chinese}
            />
          ) : (
            <span className={styles.sourceTraceUnavailable}>
              {chinese
                ? "未记录独立版本锚点，请按访问日期复核实时页面。"
                : "No separate version anchor is recorded. Recheck the live page against the access date."}
            </span>
          )}
        </dd>
      </div>
      <div>
        <dt>{chinese ? "许可证" : "License"}</dt>
        <dd>
          {source.licenseUrl ? (
            <ExternalLink
              href={source.licenseUrl}
              label={chinese ? "许可证记录" : "License record"}
              chinese={chinese}
            />
          ) : (
            <span className={styles.sourceTraceUnavailable}>
              {chinese
                ? "未记录独立许可证链接，请阅读本条来源的权利边界。"
                : "No separate license URL is recorded. Read this source's rights boundary."}
            </span>
          )}
        </dd>
      </div>
      <div className={styles.sourceTraceEvidence}>
        <dt>{chinese ? "声明证据" : "Claim evidence"}</dt>
        <dd>
          <ol>
            {source.claimEvidenceUrls.map((url, index) => (
              <li key={url}>
                <ExternalLink
                  href={url}
                  label={`${chinese ? "声明证据" : "Claim evidence"} ${index + 1}`}
                  chinese={chinese}
                />
              </li>
            ))}
          </ol>
        </dd>
      </div>
      <div>
        <dt>{chinese ? "访问日期" : "Accessed"}</dt>
        <dd><time dateTime={source.accessedOn}>{source.accessedOn}</time></dd>
      </div>
    </dl>
  );
}

export function SourceTraceDisclosure({
  source,
  chinese,
}: {
  source: MathAnimationSourceRecord;
  chinese: boolean;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    let openBeforePrint: boolean | null = null;
    const openForPrint = () => {
      const details = detailsRef.current;
      if (!details) return;
      openBeforePrint = details.open;
      details.open = true;
    };
    const restoreAfterPrint = () => {
      const details = detailsRef.current;
      if (!details || openBeforePrint === null) return;
      details.open = openBeforePrint;
      openBeforePrint = null;
    };
    window.addEventListener("beforeprint", openForPrint);
    window.addEventListener("afterprint", restoreAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", openForPrint);
      window.removeEventListener("afterprint", restoreAfterPrint);
    };
  }, []);

  return (
    <details ref={detailsRef} className={styles.sourceTraceDisclosure}>
      <summary>
        <span>{chinese ? "展开固定版本、许可与声明证据" : "Open pins, rights, and claim evidence"}</span>
        <small>{source.versionOrRevision}</small>
      </summary>
      <SourceTraceLinks source={source} chinese={chinese} />
    </details>
  );
}
