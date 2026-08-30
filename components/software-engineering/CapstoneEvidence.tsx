"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SOFTWARE_ENGINEERING_CAPSTONE,
  SOFTWARE_ENGINEERING_OVERVIEW,
  isSoftwareEngineeringCapstoneSubmission,
  type SoftwareEngineeringCapstoneSubmission,
  type SoftwareEngineeringLocale,
  type SoftwareEngineeringLocaleCopy,
  type SoftwareEngineeringReleaseDecision,
} from "@/lib/software-engineering";
import {
  SOFTWARE_ENGINEERING_PROGRESS_RESET_EVENT,
  updateSoftwareEngineeringProgress,
} from "./progress-store";
import useSoftwareEngineeringProgress from "./useSoftwareEngineeringProgress";
import styles from "./SoftwareEngineeringCourse.module.css";

type CapstoneConfig = typeof SOFTWARE_ENGINEERING_CAPSTONE;

function checklistState(
  items: readonly { readonly id: string }[],
  selectedIds: readonly string[] = [],
): Record<string, boolean> {
  const selected = new Set(selectedIds);
  return Object.fromEntries(items.map((item) => [item.id, selected.has(item.id)]));
}

function submissionSignature(submission: SoftwareEngineeringCapstoneSubmission | null): string {
  if (!submission) return "";
  return JSON.stringify({
    schemaVersion: submission.schemaVersion,
    completed: submission.completed,
    artifactIds: [...submission.artifactIds].sort(),
    reviewedGateIds: [...submission.reviewedGateIds].sort(),
    score: submission.score,
    decision: submission.decision,
    safetyBoundaryAttested: submission.safetyBoundaryAttested,
  });
}

function submissionFromSignature(signature: string): SoftwareEngineeringCapstoneSubmission | null {
  if (!signature) return null;
  try {
    const value: unknown = JSON.parse(signature);
    return isSoftwareEngineeringCapstoneSubmission(value) ? value : null;
  } catch {
    return null;
  }
}

export default function CapstoneEvidence({
  config,
  labels,
  locale,
}: {
  config: CapstoneConfig;
  labels: SoftwareEngineeringLocaleCopy["ui"];
  locale: SoftwareEngineeringLocale;
}) {
  const progress = useSoftwareEngineeringProgress();
  const storedSubmission = progress[config.progressKey];
  const submission = isSoftwareEngineeringCapstoneSubmission(storedSubmission)
    ? storedSubmission
    : null;
  const storedSubmissionSignature = submissionSignature(submission);
  const [resetVersion, setResetVersion] = useState(0);

  useEffect(() => {
    const resetDraft = () => setResetVersion((version) => version + 1);
    window.addEventListener(SOFTWARE_ENGINEERING_PROGRESS_RESET_EVENT, resetDraft);
    return () => {
      window.removeEventListener(SOFTWARE_ENGINEERING_PROGRESS_RESET_EVENT, resetDraft);
    };
  }, []);

  return (
    <CapstoneForm
      key={`${storedSubmissionSignature}:${resetVersion}`}
      config={config}
      labels={labels}
      locale={locale}
      storedSubmissionSignature={storedSubmissionSignature}
    />
  );
}

function CapstoneForm({
  config,
  labels,
  locale,
  storedSubmissionSignature,
}: {
  config: CapstoneConfig;
  labels: SoftwareEngineeringLocaleCopy["ui"];
  locale: SoftwareEngineeringLocale;
  storedSubmissionSignature: string;
}) {
  const submission = submissionFromSignature(storedSubmissionSignature);
  const complete = submission !== null;
  const [artifacts, setArtifacts] = useState<Record<string, boolean>>(() => (
    checklistState(config.artifacts, submission?.artifactIds)
  ));
  const [gates, setGates] = useState<Record<string, boolean>>(() => (
    checklistState(config.releaseGates, submission?.reviewedGateIds)
  ));
  const [score, setScore] = useState(submission?.score ?? 0);
  const [decision, setDecision] = useState<SoftwareEngineeringReleaseDecision | "">(
    submission?.decision ?? "",
  );
  const [attested, setAttested] = useState(submission?.safetyBoundaryAttested ?? false);
  const [attempted, setAttempted] = useState(false);
  const validationFeedback = useRef<HTMLDivElement>(null);

  const artifactReady = useMemo(
    () => config.artifacts.every((artifact) => artifacts[artifact.id]),
    [artifacts, config.artifacts],
  );
  const gatesReviewed = useMemo(
    () => config.releaseGates.every((gate) => gates[gate.id]),
    [gates, config.releaseGates],
  );
  const scoreReady = Number.isInteger(score)
    && score >= config.passingScore
    && score <= config.totalPoints;
  const decisionReady = decision !== "" && config.releaseDecisions.includes(decision);
  const ready = artifactReady
    && gatesReviewed
    && scoreReady
    && decisionReady
    && attested;
  const validationFeedbackId = "capstone-validation-feedback";
  const decisionLabels: Readonly<Record<SoftwareEngineeringReleaseDecision, string>> = {
    release: labels.releaseDecisionRelease,
    "release-with-conditions": labels.releaseDecisionConditional,
    "do-not-release": labels.releaseDecisionDoNotRelease,
  };

  useEffect(() => {
    if (attempted && !ready) validationFeedback.current?.focus();
  }, [attempted, ready]);

  return (
    <section
      className={styles.capstone}
      aria-labelledby="software-engineering-capstone-title"
      data-testid="software-engineering-capstone"
      lang={locale}
      dir="auto"
    >
      <header>
        <p className={styles.kicker}>{labels.capstone}</p>
        <h2 id="software-engineering-capstone-title" lang="en" dir="ltr">{config.title}</h2>
        <p lang="en" dir="ltr">{SOFTWARE_ENGINEERING_OVERVIEW.capstone.summary}</p>
        <a className={styles.secondaryButton} href={config.briefHref} download>{labels.downloadBrief}</a>
      </header>

      <aside
        className={styles.validationBoundary}
        aria-label="Validation boundary"
        lang="en"
        dir="ltr"
      >
        <p>{config.validationBoundary}</p>
      </aside>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setAttempted(true);
          if (!ready || complete) return;
          updateSoftwareEngineeringProgress((record) => {
            record[config.progressKey] = {
              schemaVersion: config.schemaVersion,
              completed: true,
              artifactIds: config.artifacts
                .filter((artifact) => artifacts[artifact.id])
                .map((artifact) => artifact.id),
              reviewedGateIds: config.releaseGates
                .filter((gate) => gates[gate.id])
                .map((gate) => gate.id),
              score,
              decision,
              safetyBoundaryAttested: true,
            };
          });
        }}
      >
        <fieldset
          className={styles.capstoneChecklist}
          disabled={complete}
          aria-invalid={attempted && !artifactReady || undefined}
          aria-describedby={attempted && !artifactReady ? validationFeedbackId : undefined}
        >
          <legend lang={locale} dir="auto">{labels.capstoneArtifacts}</legend>
          <p lang="en" dir="ltr">{SOFTWARE_ENGINEERING_OVERVIEW.capstone.artifactsIntro}</p>
          <div className={styles.capstoneArtifactGrid} lang="en" dir="ltr">
            {config.artifacts.map((artifact, index) => (
              <label className={styles.capstoneItem} key={artifact.id}>
                <input
                  type="checkbox"
                  checked={Boolean(artifacts[artifact.id])}
                  onChange={(event) => {
                    setArtifacts((existing) => ({ ...existing, [artifact.id]: event.target.checked }));
                    setAttempted(false);
                  }}
                />
                <span>
                  <strong>{index + 1}. {artifact.title}</strong>
                  <small>{artifact.purpose}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <section className={styles.capstoneRubric} aria-labelledby="capstone-rubric-title">
          <h3 id="capstone-rubric-title" lang={locale} dir="auto">{labels.rubric} · {config.totalPoints}</h3>
          <ol lang="en" dir="ltr">
            {config.rubric.map((row) => (
              <li key={row.id}>
                <strong>{row.title} · {row.weight}</strong>
                <span>{row.highPerformanceEvidence}</span>
              </li>
            ))}
          </ol>
          <label lang="en" dir="ltr">
            <span>{SOFTWARE_ENGINEERING_OVERVIEW.capstone.scoreLabel} · {config.passingScore}/{config.totalPoints}</span>
            <input
              type="number"
              min="0"
              max={config.totalPoints}
              step="1"
              value={score}
              disabled={complete}
              aria-invalid={attempted && !scoreReady || undefined}
              aria-describedby={attempted && !scoreReady ? validationFeedbackId : undefined}
              onChange={(event) => { setScore(Number(event.target.value)); setAttempted(false); }}
            />
          </label>
        </section>

        <fieldset
          className={styles.capstoneGates}
          lang="en"
          dir="ltr"
          disabled={complete}
          aria-invalid={attempted && !gatesReviewed || undefined}
          aria-describedby={attempted && !gatesReviewed ? validationFeedbackId : undefined}
        >
          <legend>{SOFTWARE_ENGINEERING_OVERVIEW.capstone.gatesTitle}</legend>
          <p>{SOFTWARE_ENGINEERING_OVERVIEW.capstone.gatesIntro}</p>
          {config.releaseGates.map((gate) => (
            <label key={gate.id}>
              <input
                type="checkbox"
                checked={Boolean(gates[gate.id])}
                onChange={(event) => {
                  setGates((existing) => ({ ...existing, [gate.id]: event.target.checked }));
                  setAttempted(false);
                }}
              />
              <span>{gate.question}</span>
            </label>
          ))}
        </fieldset>

        <section className={styles.safetyBoundary} aria-labelledby="capstone-safety-title" lang="en" dir="ltr">
          <h3 id="capstone-safety-title">{SOFTWARE_ENGINEERING_OVERVIEW.capstone.safetyTitle}</h3>
          <p>{config.safetyBoundary.protectedAuthority}</p>
          <p>{config.safetyBoundary.nonDelegableHumanJudgment}</p>
          <ul>{config.safetyBoundary.mandatoryStop.map((condition) => <li key={condition}>{condition}</li>)}</ul>
          <label>
            <input
              type="checkbox"
              checked={attested}
              disabled={complete}
              aria-invalid={attempted && !attested || undefined}
              aria-describedby={attempted && !attested ? validationFeedbackId : undefined}
              onChange={(event) => { setAttested(event.target.checked); setAttempted(false); }}
            />
            <span>{config.safetyBoundary.nonAuthorizationRule}</span>
          </label>
        </section>

        <label className={styles.decisionField}>
          <span lang="en" dir="ltr">{SOFTWARE_ENGINEERING_OVERVIEW.capstone.decisionLabel}</span>
          <select
            value={decision}
            disabled={complete}
            required
            aria-invalid={attempted && !decisionReady || undefined}
            aria-describedby={attempted && !decisionReady ? validationFeedbackId : undefined}
            onChange={(event) => {
              setDecision(event.target.value as SoftwareEngineeringReleaseDecision | "");
              setAttempted(false);
            }}
          >
            <option value="" lang="en" dir="ltr">{SOFTWARE_ENGINEERING_OVERVIEW.capstone.selectDecision}</option>
            {config.releaseDecisions.map((option) => (
              <option key={option} value={option} lang={locale} dir="auto">{decisionLabels[option]}</option>
            ))}
          </select>
        </label>

        {complete ? (
          <p className={styles.correctFeedback} role="status">{labels.capstoneComplete}</p>
        ) : attempted && !ready ? (
          <div
            className={styles.incorrectFeedback}
            id={validationFeedbackId}
            role="alert"
            tabIndex={-1}
            ref={validationFeedback}
          >
            <strong>{labels.capstoneIncomplete}</strong>
            <ul>
              {!artifactReady ? <li lang={locale} dir="auto">{labels.capstoneArtifacts}</li> : null}
              {!gatesReviewed ? <li lang="en" dir="ltr">{SOFTWARE_ENGINEERING_OVERVIEW.capstone.gatesTitle}</li> : null}
              {!scoreReady ? <li lang="en" dir="ltr">{SOFTWARE_ENGINEERING_OVERVIEW.capstone.scoreLabel}</li> : null}
              {!decisionReady ? <li lang="en" dir="ltr">{SOFTWARE_ENGINEERING_OVERVIEW.capstone.decisionLabel}</li> : null}
              {!attested ? <li lang="en" dir="ltr">{SOFTWARE_ENGINEERING_OVERVIEW.capstone.safetyTitle}</li> : null}
            </ul>
          </div>
        ) : null}

        {!complete ? <button className={styles.primaryButton} type="submit">{labels.completeCapstone}</button> : null}
      </form>
    </section>
  );
}
