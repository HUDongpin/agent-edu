"use client";

import { useEffect, useRef, useState } from "react";
import {
  CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY,
  CURSOR_CAPSTONE_META_PROGRESS_KEY,
  CURSOR_CAPSTONE_PROGRESS_META,
  CURSOR_CAPSTONE_PROGRESS_KEY,
  createCursorCapstoneProgressAssessment,
  getCursorCapstoneProgressAssessment,
  isCursorCapstoneProgressPassed,
  validateCursorCapstoneReceipt,
  type CursorCapstoneReceiptValidationCode,
  type CursorCourseCopy,
} from "@/lib/cursor";
import { applyCursorProgressPatch } from "./progress-store";
import useCourseProgress, { useCourseStorageAvailable } from "./useCourseProgress";
import styles from "./CursorCourse.module.css";

const STARTER_DOWNLOAD = "/courses/cursor/aicourse-cursor-demo-v1.zip";
const STARTER_CHECKSUM = "/courses/cursor/aicourse-cursor-demo-v1.sha256";

type Config = {
  readonly receiptSchema: string;
  readonly receiptVersion: string;
  readonly fixtureVersion: string;
  readonly fixtureSha256: string;
  readonly archiveSha256: string;
  readonly requiredChecks: readonly string[];
  readonly artifactIds: readonly string[];
  readonly rubric: readonly { readonly id: string; readonly weight: number }[];
  readonly passingScore: number;
};

function validationMessage(
  code: CursorCapstoneReceiptValidationCode,
  labels: CursorCourseCopy["ui"],
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
  copy: CursorCourseCopy["capstone"];
  labels: CursorCourseCopy["ui"];
}) {
  const progress = useCourseProgress();
  const storageAvailable = useCourseStorageAvailable();
  const [input, setInput] = useState("");
  const [validationCode, setValidationCode] = useState<CursorCapstoneReceiptValidationCode | null>(null);
  const [artifactChecks, setArtifactChecks] = useState<Record<string, boolean>>({});
  const [rubricChecks, setRubricChecks] = useState<Record<string, boolean>>({});
  const verifiedHeading = useRef<HTMLHeadingElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const completedAssessment = getCursorCapstoneProgressAssessment(progress);
  const completed = isCursorCapstoneProgressPassed(progress);
  const staleCompletion = progress[CURSOR_CAPSTONE_PROGRESS_KEY] === true && !completed;
  const artifactPacketReady = config.artifactIds.every((id) => (
    completed
      ? completedAssessment?.artifactIds.includes(id) === true
      : artifactChecks[id] === true
  ));
  const rubricScore = completedAssessment
    ? completedAssessment.score
    : config.rubric.reduce((score, item) => score + (rubricChecks[item.id] ? item.weight : 0), 0);
  const criticalRubricReady = completed
    ? completedAssessment?.rubricIds.includes("safety") === true
      && completedAssessment.rubricIds.includes("verification")
    : rubricChecks.safety === true && rubricChecks.verification === true;
  const selfAuditPassed = artifactPacketReady
    && rubricScore >= config.passingScore
    && criticalRubricReady;

  useEffect(() => {
    if (validationCode === "valid" && completed) verifiedHeading.current?.focus();
    else if (validationCode) errorMessage.current?.focus();
  }, [completed, validationCode]);

  return (
    <section
      className={styles.capstoneSection}
      aria-labelledby="cursor-capstone-title"
      data-testid="cursor-capstone"
    >
      <header className={styles.capstoneHeader}>
        <div>
          <p className={styles.kicker}>{labels.capstonePath}</p>
          <h2 id="cursor-capstone-title">{copy.title}</h2>
          <p>{copy.summary}</p>
        </div>
        <div className={styles.capstoneScore} aria-label={labels.score} data-testid="cursor-capstone-score">
          <strong>{rubricScore}</strong>
          <span>{labels.score} / 100</span>
        </div>
      </header>

      <p className={styles.capstoneScenario}>{copy.scenario}</p>

      <ol className={styles.capstoneSteps}>
        {copy.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}
      </ol>

      <div className={styles.capstoneForm} data-testid="cursor-capstone-assessment">
        <p className={styles.capstoneRetry}>{labels.learnerSelfAssessment}</p>
        <fieldset className={styles.capstoneChecklist} data-testid="cursor-capstone-artifacts">
          <legend>{labels.capstoneArtifacts}</legend>
          {config.artifactIds.map((id) => {
            const artifact = copy.artifacts[id];
            return (
              <label key={id}>
                <input
                  type="checkbox"
                  checked={completed
                    ? completedAssessment?.artifactIds.includes(id) === true
                    : artifactChecks[id] === true}
                  disabled={completed}
                  onChange={(event) => setArtifactChecks((current) => ({
                    ...current,
                    [id]: event.target.checked,
                  }))}
                />
                <span>
                  <strong>{artifact.title}</strong>
                  <small>{artifact.description}</small>
                </span>
              </label>
            );
          })}
        </fieldset>

        <fieldset className={styles.capstoneChecklist} data-testid="cursor-capstone-rubric">
          <legend>{labels.rubric}</legend>
          {config.rubric.map((item) => {
            const criterion = copy.rubric[item.id];
            return (
              <label key={item.id}>
                <input
                  type="checkbox"
                  checked={completed
                    ? completedAssessment?.rubricIds.includes(item.id) === true
                    : rubricChecks[item.id] === true}
                  disabled={completed}
                  onChange={(event) => setRubricChecks((current) => ({
                    ...current,
                    [item.id]: event.target.checked,
                  }))}
                />
                <span>
                  <strong>{criterion.title}</strong>
                  <small>{criterion.description}</small>
                </span>
              </label>
            );
          })}
        </fieldset>

        <p className={selfAuditPassed ? styles.capstonePass : styles.capstoneRetry} role="status">
          {selfAuditPassed ? copy.pass : copy.retry}
        </p>
      </div>

      <div className={styles.fixtureDownload}>
        <div>
          <strong>{labels.downloadStarter}</strong>
          <p>{labels.receiptInstructions}</p>
        </div>
        <div className={styles.fixtureActions}>
          <a className={styles.primaryAction} href={STARTER_DOWNLOAD} download>
            {labels.downloadStarter}
          </a>
          <a className={styles.secondaryAction} href={STARTER_CHECKSUM} download>
            {labels.downloadChecksum}
          </a>
        </div>
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
        <div className={styles.hashRequirement}>
          <dt>{labels.archiveHashLabel}</dt>
          <dd className={styles.fixtureHash} dir="ltr">{config.archiveSha256}</dd>
        </div>
        <div className={styles.hashRequirement}>
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

      {staleCompletion ? (
        <p className={styles.storageWarning} role="status">
          {labels.savedCompletionMismatch}
        </p>
      ) : null}

      {!completed ? (
        <form
          className={styles.receiptVerifier}
          onSubmit={async (event) => {
            event.preventDefault();
            if (!selfAuditPassed) return;
            const validation = validateCursorCapstoneReceipt(input);
            if (!validation.valid) {
              setValidationCode(validation.code);
              return;
            }

            const result = await applyCursorProgressPatch({
              set: {
                // Store the completion Boolean plus public contract constants.
                // Receipt text, paths, command output, and logs never enter browser storage.
                [CURSOR_CAPSTONE_PROGRESS_KEY]: true,
                // The companion prevents an old completion from being relabelled
                // as a newer fixture check.
                [CURSOR_CAPSTONE_META_PROGRESS_KEY]: { ...CURSOR_CAPSTONE_PROGRESS_META },
                // Public self-assessment IDs preserve the learner's actual
                // 80-or-higher rubric result instead of reconstructing 100/100.
                [CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY]: createCursorCapstoneProgressAssessment(
                  artifactChecks,
                  rubricChecks,
                ),
              },
            });
            setValidationCode("valid");
            // Preserve the pasted receipt in component memory when persistence is denied so
            // an ephemeral completion never destroys the learner's only copy.
            if (result.persisted) setInput("");
          }}
        >
          <label htmlFor="cursor-capstone-receipt-input">{labels.pasteReceipt}</label>
          <textarea
            id="cursor-capstone-receipt-input"
            data-testid="cursor-capstone-receipt-input"
            dir="ltr"
            rows={12}
            value={input}
            disabled={!selfAuditPassed}
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
          <button className={styles.primaryAction} type="submit" disabled={!selfAuditPassed || !input.trim()}>
            {labels.verifyReceipt}
          </button>
        </form>
      ) : null}

      {completed ? (
        <article
          className={styles.receipt}
          aria-labelledby="cursor-receipt-title"
          data-testid="cursor-capstone-receipt"
          data-schema={config.receiptSchema}
          data-fixture-version={config.fixtureVersion}
          data-fixture-sha256={config.fixtureSha256}
          data-self-assessment-score={completedAssessment?.score}
        >
          <div className={styles.receiptHeading}>
            <div>
              <p>{labels.capstoneReceipt}</p>
              <h3 id="cursor-receipt-title" ref={verifiedHeading} tabIndex={-1}>
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
          <p>{copy.completion}</p>
          <small>{storageAvailable ? labels.browserStorageNote : labels.storageUnavailable}</small>
          <button className={styles.secondaryAction} type="button" onClick={() => window.print()}>
            {labels.printReceipt}
          </button>
        </article>
      ) : null}
    </section>
  );
}
