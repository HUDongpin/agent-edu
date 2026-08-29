"use client";

import { useEffect, useRef, useState } from "react";
import {
  CODEX_CAPSTONE_DRAFT_STORAGE_KEY,
  CODEX_CAPSTONE_DRAFT_MAX_LENGTH,
  createCodexCapstoneDraft,
  parseCodexCapstoneDraft,
} from "@/lib/codex/capstone-draft";
import {
  formatCodexTemplate,
  formatCodexVisibleInteger,
  formatCodexVisiblePercent,
} from "@/lib/codex/format";
import {
  validateCodexCapstoneReceipt,
  type CodexCapstoneReceiptValidationCode,
} from "@/lib/codex/capstone";
import type { CodexCourseCopy, CodexLocale } from "@/lib/codex/types";
import {
  CODEX_PROGRESS_RESET_EVENT,
  updateCourseProgress,
} from "./progress-store";
import LocalizedTemplate from "./LocalizedTemplate";
import TechnicalText from "./TechnicalText";
import useCourseProgress, { useCourseStorageAvailable } from "./useCourseProgress";
import styles from "./CodexCourse.module.css";

const CAPSTONE_PROGRESS_KEY = "codex.capstone.v1";
const STARTER_DOWNLOAD = "/courses/codex/aicourse-codex-demo-v1.zip";

type Config = {
  readonly artifactIds: readonly string[];
  readonly rubric: readonly { readonly id: string; readonly weight: number }[];
  readonly passingScore: number;
  readonly receiptSchema: string;
  readonly fixtureVersion: string;
  readonly fixtureSha256: string;
  readonly requiredChecks: readonly string[];
};

function validationMessage(
  code: CodexCapstoneReceiptValidationCode,
  labels: CodexCourseCopy["ui"],
): string {
  switch (code) {
    case "valid":
      return labels.receiptValid;
    case "invalid-json":
      return labels.receiptInvalidJson;
    case "wrong-schema":
      return labels.receiptWrongSchema;
    case "wrong-version":
      return labels.receiptWrongVersion;
    case "wrong-hash":
      return labels.receiptWrongHash;
    case "incomplete":
      return labels.receiptIncomplete;
  }
}

export default function CapstoneReceipt({
  config,
  copy,
  labels,
  locale,
}: {
  config: Config;
  copy: CodexCourseCopy["capstone"];
  labels: CodexCourseCopy["ui"];
  locale: CodexLocale;
}) {
  const progress = useCourseProgress();
  const storageAvailable = useCourseStorageAvailable();
  const [input, setInput] = useState("");
  const [validationCode, setValidationCode] = useState<CodexCapstoneReceiptValidationCode | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [draftPersisted, setDraftPersisted] = useState(true);
  const verifiedHeading = useRef<HTMLHeadingElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const completed = progress[CAPSTONE_PROGRESS_KEY] === true;

  useEffect(() => {
    if (validationCode === "valid") verifiedHeading.current?.focus();
    else if (validationCode) errorMessage.current?.focus();
  }, [validationCode]);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY);
      if (!stored) return;
      const restored = parseCodexCapstoneDraft(stored, {
        receiptSchema: config.receiptSchema,
        fixtureVersion: config.fixtureVersion,
        fixtureSha256: config.fixtureSha256,
      });
      if (!restored) {
        window.sessionStorage.removeItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY);
        return;
      }
      const frame = window.requestAnimationFrame(() => {
        setInput(restored);
        setDraftMessage(labels.receiptDraftRestored);
        setDraftPersisted(true);
      });
      return () => window.cancelAnimationFrame(frame);
    } catch {
      // Session storage is optional; component memory still preserves input.
    }
  }, [config.fixtureSha256, config.fixtureVersion, config.receiptSchema, labels.receiptDraftRestored]);

  useEffect(() => {
    const clearDraft = () => {
      setInput("");
      setValidationCode(null);
      setDraftMessage("");
      setDraftPersisted(true);
      try {
        window.sessionStorage.removeItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY);
      } catch {
        // Reset still clears mounted state when session storage is denied.
      }
    };
    window.addEventListener(CODEX_PROGRESS_RESET_EVENT, clearDraft);
    return () => window.removeEventListener(CODEX_PROGRESS_RESET_EVENT, clearDraft);
  }, []);

  useEffect(() => {
    if (!completed || !storageAvailable) return;
    try {
      window.sessionStorage.removeItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY);
      const frame = window.requestAnimationFrame(() => {
        setInput("");
        setDraftMessage("");
        setDraftPersisted(true);
      });
      return () => window.cancelAnimationFrame(frame);
    } catch {
      // Persisted completion stays authoritative if optional cleanup fails.
    }
  }, [completed, storageAvailable]);

  useEffect(() => {
    if (!input || draftPersisted) return;
    const warnBeforeDiscard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeDiscard);
    return () => window.removeEventListener("beforeunload", warnBeforeDiscard);
  }, [draftPersisted, input]);

  function persistDraft(value: string) {
    try {
      if (!value) {
        window.sessionStorage.removeItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY);
        setDraftPersisted(true);
        return;
      }
      const draft = createCodexCapstoneDraft(value, {
        receiptSchema: config.receiptSchema,
        fixtureVersion: config.fixtureVersion,
        fixtureSha256: config.fixtureSha256,
      });
      window.sessionStorage.setItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setDraftPersisted(true);
    } catch {
      setDraftPersisted(false);
      // Never leave an older draft looking authoritative after a failed write.
      try {
        window.sessionStorage.removeItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY);
      } catch {
        // Preserve typed input in memory; beforeunload guards it.
      }
    }
  }

  return (
    <section
      className={styles.capstoneSection}
      aria-labelledby="codex-capstone-title"
      data-testid="codex-capstone"
    >
      <header className={styles.capstoneHeader}>
        <div>
          <p className={styles.kicker}>{labels.capstonePath}</p>
          <h2 id="codex-capstone-title"><TechnicalText text={copy.title} /></h2>
          <p><TechnicalText text={copy.summary} /></p>
        </div>
      </header>

      <p className={styles.capstoneScenario}><TechnicalText text={copy.scenario} /></p>

      <ol className={styles.capstoneSteps} role="list">
        {copy.instructions.map((instruction, index) => (
          <li key={instruction}>
            <span className={styles.stepNumber} aria-hidden="true">
              {formatCodexVisibleInteger(index + 1, locale)}
            </span>
            <span><TechnicalText text={instruction} /></span>
          </li>
        ))}
      </ol>

      <div className={styles.capstoneAssessment}>
        <section aria-labelledby="codex-capstone-artifacts-title">
          <h3 id="codex-capstone-artifacts-title">{labels.capstoneArtifacts}</h3>
          <ol role="list">
            {config.artifactIds.map((id, index) => (
              <li key={id}>
                <span className={styles.capstoneItemNumber} aria-hidden="true">
                  {formatCodexVisibleInteger(index + 1, locale)}
                </span>
                <span>
                  <strong><TechnicalText text={copy.artifacts[id].title} /></strong>
                  <span><TechnicalText text={copy.artifacts[id].description} /></span>
                </span>
              </li>
            ))}
          </ol>
        </section>
        <section aria-labelledby="codex-capstone-rubric-title">
          <div className={styles.rubricHeading}>
            <h3 id="codex-capstone-rubric-title">{labels.rubric}</h3>
            <span>
              {formatCodexTemplate(labels.passingScoreTemplate, {
                score: formatCodexVisibleInteger(config.passingScore, locale),
              })}
            </span>
          </div>
          <ol role="list">
            {config.rubric.map((item, index) => (
              <li key={item.id}>
                <span className={styles.capstoneItemNumber} aria-hidden="true">
                  {formatCodexVisibleInteger(index + 1, locale)}
                </span>
                <span>
                  <strong><TechnicalText text={copy.rubric[item.id].title} /></strong>
                  <span><TechnicalText text={copy.rubric[item.id].description} /></span>
                  <small>
                    <LocalizedTemplate
                      template={labels.rubricWeightTemplate}
                      values={{ weight: formatCodexVisiblePercent(item.weight, locale) }}
                    />
                  </small>
                </span>
              </li>
            ))}
          </ol>
          <p className={styles.capstonePass}><TechnicalText text={copy.pass} /></p>
          <p className={styles.capstoneRetry}><TechnicalText text={copy.retry} /></p>
        </section>
      </div>

      <div className={styles.fixtureDownload}>
        <div>
          <strong>{labels.downloadStarter}</strong>
          <p id="codex-capstone-receipt-instructions">
            <TechnicalText text={labels.receiptInstructions} />
          </p>
        </div>
        <a className={styles.primaryAction} href={STARTER_DOWNLOAD} download>
          {labels.downloadStarter}
        </a>
      </div>

      <dl className={styles.receiptRequirements} id="codex-capstone-receipt-requirements">
        <div>
          <dt>{labels.receiptSchemaLabel}</dt>
          <dd dir="ltr">{config.receiptSchema}</dd>
        </div>
        <div>
          <dt>{labels.fixtureVersionLabel}</dt>
          <dd dir="ltr">{config.fixtureVersion}</dd>
        </div>
        <div>
          <dt>{labels.fixtureHashLabel}</dt>
          <dd className={styles.fixtureHash} dir="ltr">{config.fixtureSha256}</dd>
        </div>
      </dl>

      <div className={styles.requiredChecks} id="codex-capstone-required-checks">
        <strong>{labels.requiredChecksLabel}</strong>
        <ul>
          {config.requiredChecks.map((check) => <li key={check}><code dir="ltr">{check}</code></li>)}
        </ul>
      </div>

      {!storageAvailable ? (
        <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p>
      ) : null}

      <p className={draftMessage ? styles.resetStatus : styles.srOnly} role="status">
        {draftMessage}
      </p>

      {!completed ? (
        <form
          className={styles.receiptVerifier}
          onSubmit={(event) => {
            event.preventDefault();
            const validation = validateCodexCapstoneReceipt(input);
            setValidationCode(validation.code);
            if (!validation.valid) return;

            const result = updateCourseProgress((record) => {
              // Store only the completion Boolean. Receipt text, paths, and logs never enter browser storage.
              record[CAPSTONE_PROGRESS_KEY] = true;
            });
            // Preserve the pasted receipt in component memory when persistence is denied so
            // an ephemeral completion never destroys the learner's only copy.
            if (result.persisted) {
              setInput("");
              setDraftMessage("");
              setDraftPersisted(true);
              try {
                window.sessionStorage.removeItem(CODEX_CAPSTONE_DRAFT_STORAGE_KEY);
              } catch {
                // Persisted completion makes any stale draft non-authoritative.
              }
            }
          }}
        >
          <label htmlFor="codex-capstone-receipt-input">{labels.pasteReceipt}</label>
          <textarea
            id="codex-capstone-receipt-input"
            data-testid="codex-capstone-receipt-input"
            name="codex-capstone-receipt"
            dir="ltr"
            rows={12}
            maxLength={CODEX_CAPSTONE_DRAFT_MAX_LENGTH}
            value={input}
            required
            spellCheck={false}
            autoComplete="off"
            aria-describedby={[
              "codex-capstone-receipt-instructions",
              "codex-capstone-receipt-requirements",
              "codex-capstone-required-checks",
              validationCode && validationCode !== "valid" ? "codex-capstone-receipt-error" : "",
            ].filter(Boolean).join(" ")}
            onChange={(event) => {
              const value = event.target.value;
              setInput(value);
              persistDraft(value);
              setDraftMessage("");
              if (validationCode) setValidationCode(null);
            }}
          />
          {validationCode && validationCode !== "valid" ? (
            <p
              className={styles.receiptError}
              id="codex-capstone-receipt-error"
              ref={errorMessage}
              role="alert"
              tabIndex={-1}
            >
              {validationMessage(validationCode, labels)}
            </p>
          ) : null}
          <button className={styles.primaryAction} type="submit">
            {labels.verifyReceipt}
          </button>
        </form>
      ) : null}

      {completed ? (
        <article
          className={styles.receipt}
          aria-labelledby="codex-receipt-title"
          data-testid="codex-capstone-receipt"
          data-schema={config.receiptSchema}
          data-fixture-version={config.fixtureVersion}
          data-fixture-sha256={config.fixtureSha256}
        >
          <div className={styles.receiptHeading}>
            <div>
              <p>{labels.capstoneReceipt}</p>
              <h3 id="codex-receipt-title" ref={verifiedHeading} tabIndex={-1}>
                {labels.receiptValid}
              </h3>
            </div>
            <strong>{labels.completed}</strong>
          </div>
          <dl>
            <div><dt>{labels.receiptSchemaLabel}</dt><dd dir="ltr">{config.receiptSchema}</dd></div>
            <div><dt>{labels.fixtureVersionLabel}</dt><dd dir="ltr">{config.fixtureVersion}</dd></div>
            <div><dt>{labels.status}</dt><dd>{labels.completed}</dd></div>
            <div>
              <dt>{labels.fixtureHashLabel}</dt>
              <dd className={styles.fixtureHash} dir="ltr">{config.fixtureSha256}</dd>
            </div>
          </dl>
          <p><TechnicalText text={copy.completion} /></p>
          <small>{storageAvailable ? labels.browserStorageNote : labels.storageUnavailable}</small>
          <button className={styles.secondaryAction} type="button" onClick={() => window.print()}>
            {labels.printReceipt}
          </button>
        </article>
      ) : null}
    </section>
  );
}
