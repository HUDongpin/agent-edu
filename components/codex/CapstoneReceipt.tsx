"use client";

import { useEffect, useRef, useState } from "react";
import {
  validateCodexCapstoneReceipt,
  type CodexCapstoneReceiptValidationCode,
  type CodexCourseCopy,
} from "@/lib/codex";
import { updateCourseProgress } from "./progress-store";
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
}: {
  config: Config;
  copy: CodexCourseCopy["capstone"];
  labels: CodexCourseCopy["ui"];
}) {
  const progress = useCourseProgress();
  const storageAvailable = useCourseStorageAvailable();
  const [input, setInput] = useState("");
  const [validationCode, setValidationCode] = useState<CodexCapstoneReceiptValidationCode | null>(null);
  const verifiedHeading = useRef<HTMLHeadingElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const completed = progress[CAPSTONE_PROGRESS_KEY] === true;

  useEffect(() => {
    if (validationCode === "valid") verifiedHeading.current?.focus();
    else if (validationCode) errorMessage.current?.focus();
  }, [validationCode]);

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

      <ol className={styles.capstoneSteps}>
        {copy.instructions.map((instruction) => <li key={instruction}><TechnicalText text={instruction} /></li>)}
      </ol>

      <div className={styles.capstoneAssessment}>
        <section aria-labelledby="codex-capstone-artifacts-title">
          <h3 id="codex-capstone-artifacts-title">{labels.capstoneArtifacts}</h3>
          <ol>
            {config.artifactIds.map((id) => (
              <li key={id}>
                <strong><TechnicalText text={copy.artifacts[id].title} /></strong>
                <span><TechnicalText text={copy.artifacts[id].description} /></span>
              </li>
            ))}
          </ol>
        </section>
        <section aria-labelledby="codex-capstone-rubric-title">
          <div className={styles.rubricHeading}>
            <h3 id="codex-capstone-rubric-title">{labels.rubric}</h3>
            <span>{labels.passingScore}: {config.passingScore}</span>
          </div>
          <ol>
            {config.rubric.map((item) => (
              <li key={item.id}>
                <strong><TechnicalText text={copy.rubric[item.id].title} /></strong>
                <span><TechnicalText text={copy.rubric[item.id].description} /></span>
                <small>{item.weight}% {labels.weight}</small>
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
          <p><TechnicalText text={labels.receiptInstructions} /></p>
        </div>
        <a className={styles.primaryAction} href={STARTER_DOWNLOAD} download>
          {labels.downloadStarter}
        </a>
      </div>

      <dl className={styles.receiptRequirements}>
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

      <div className={styles.requiredChecks}>
        <strong>{labels.requiredChecksLabel}</strong>
        <ul>
          {config.requiredChecks.map((check) => <li key={check}><code dir="ltr">{check}</code></li>)}
        </ul>
      </div>

      {!storageAvailable ? (
        <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p>
      ) : null}

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
            if (result.persisted) setInput("");
          }}
        >
          <label htmlFor="codex-capstone-receipt-input">{labels.pasteReceipt}</label>
          <textarea
            id="codex-capstone-receipt-input"
            data-testid="codex-capstone-receipt-input"
            dir="ltr"
            rows={12}
            value={input}
            required
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => {
              setInput(event.target.value);
              if (validationCode) setValidationCode(null);
            }}
          />
          {validationCode && validationCode !== "valid" ? (
            <p
              className={styles.receiptError}
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
