"use client";

import { useEffect, useRef, useState } from "react";
import {
  SOFTWARE_ENGINEERING_CAPSTONE,
  SOFTWARE_ENGINEERING_CAPSTONE_DRAFT_KEY,
  SOFTWARE_ENGINEERING_OVERVIEW,
  hasSoftwareEngineeringCapstoneDraftActivity,
  isSoftwareEngineeringCapstoneSubmission,
  parseSoftwareEngineeringCapstoneDraft,
  type SoftwareEngineeringCapstoneDraft,
  type SoftwareEngineeringCapstoneSubmission,
  type SoftwareEngineeringLocale,
  type SoftwareEngineeringLocaleCopy,
  type SoftwareEngineeringReleaseDecision,
} from "@/lib/software-engineering";
import {
  SOFTWARE_ENGINEERING_PROGRESS_RESET_EVENT,
  updateSoftwareEngineeringProgress,
} from "./progress-store";
import useSoftwareEngineeringProgress, {
  useSoftwareEngineeringStorageAvailable,
} from "./useSoftwareEngineeringProgress";
import styles from "./SoftwareEngineeringCourse.module.css";

type CapstoneConfig = typeof SOFTWARE_ENGINEERING_CAPSTONE;

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
  const storageAvailable = useSoftwareEngineeringStorageAvailable();
  const storedSubmission = progress[config.progressKey];
  const submission = isSoftwareEngineeringCapstoneSubmission(storedSubmission)
    ? storedSubmission
    : null;
  const draft = submission
    ? null
    : parseSoftwareEngineeringCapstoneDraft(
      progress[SOFTWARE_ENGINEERING_CAPSTONE_DRAFT_KEY],
      config,
    );

  return (
    <CapstoneForm
      config={config}
      draft={draft}
      labels={labels}
      locale={locale}
      storageAvailable={storageAvailable}
      submission={submission}
    />
  );
}

function CapstoneForm({
  config,
  draft,
  labels,
  locale,
  storageAvailable,
  submission,
}: {
  config: CapstoneConfig;
  draft: SoftwareEngineeringCapstoneDraft | null;
  labels: SoftwareEngineeringLocaleCopy["ui"];
  locale: SoftwareEngineeringLocale;
  storageAvailable: boolean;
  submission: SoftwareEngineeringCapstoneSubmission | null;
}) {
  const complete = submission !== null;
  const artifactIds = submission?.artifactIds ?? draft?.artifactIds ?? [];
  const reviewedGateIds = submission?.reviewedGateIds ?? draft?.reviewedGateIds ?? [];
  const score = submission?.score ?? draft?.score ?? null;
  const decision = submission?.decision ?? draft?.decision ?? "";
  const attested = submission?.safetyBoundaryAttested
    ?? draft?.safetyBoundaryAttested
    ?? false;
  const selectedArtifacts = new Set(artifactIds);
  const selectedGates = new Set(reviewedGateIds);
  const [attempted, setAttempted] = useState(false);
  const validationFeedback = useRef<HTMLDivElement>(null);
  const completionRequested = useRef(false);
  const completionStatus = useRef<HTMLParagraphElement>(null);

  const artifactReady = config.artifacts.every((artifact) => selectedArtifacts.has(artifact.id));
  const gatesReviewed = config.releaseGates.every((gate) => selectedGates.has(gate.id));
  const scoreReady = typeof score === "number"
    && Number.isInteger(score)
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

  useEffect(() => {
    if (!completionRequested.current || !complete) return;
    completionRequested.current = false;
    completionStatus.current?.focus();
  }, [complete]);

  useEffect(() => {
    const resetDraft = () => {
      completionRequested.current = false;
      setAttempted(false);
    };
    window.addEventListener(SOFTWARE_ENGINEERING_PROGRESS_RESET_EVENT, resetDraft);
    return () => {
      window.removeEventListener(SOFTWARE_ENGINEERING_PROGRESS_RESET_EVENT, resetDraft);
    };
  }, []);

  function saveDraft(
    update: Partial<Omit<SoftwareEngineeringCapstoneDraft, "version" | "capstoneSchemaVersion">>,
  ) {
    const nextDraft: SoftwareEngineeringCapstoneDraft = {
      version: 1,
      capstoneSchemaVersion: config.schemaVersion,
      artifactIds,
      reviewedGateIds,
      score,
      decision,
      safetyBoundaryAttested: attested,
      ...update,
    };
    updateSoftwareEngineeringProgress((record) => {
      if (hasSoftwareEngineeringCapstoneDraftActivity(nextDraft)) {
        record[SOFTWARE_ENGINEERING_CAPSTONE_DRAFT_KEY] = nextDraft;
      } else {
        delete record[SOFTWARE_ENGINEERING_CAPSTONE_DRAFT_KEY];
      }
    });
  }

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

      {!storageAvailable ? (
        <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p>
      ) : null}

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          setAttempted(true);
          if (!ready || complete || typeof score !== "number") return;
          completionRequested.current = true;
          updateSoftwareEngineeringProgress((record) => {
            record[config.progressKey] = {
              schemaVersion: config.schemaVersion,
              completed: true,
              artifactIds: config.artifacts
                .filter((artifact) => selectedArtifacts.has(artifact.id))
                .map((artifact) => artifact.id),
              reviewedGateIds: config.releaseGates
                .filter((gate) => selectedGates.has(gate.id))
                .map((gate) => gate.id),
              score,
              decision,
              safetyBoundaryAttested: true,
            };
            delete record[SOFTWARE_ENGINEERING_CAPSTONE_DRAFT_KEY];
          });
        }}
      >
        <fieldset
          className={styles.capstoneChecklist}
          disabled={complete}
          aria-invalid={(attempted && !artifactReady) || undefined}
          aria-describedby={attempted && !artifactReady ? validationFeedbackId : undefined}
        >
          <legend lang={locale} dir="auto">{labels.capstoneArtifacts}</legend>
          <p lang="en" dir="ltr">{SOFTWARE_ENGINEERING_OVERVIEW.capstone.artifactsIntro}</p>
          <div className={styles.capstoneArtifactGrid} lang="en" dir="ltr">
            {config.artifacts.map((artifact, index) => (
              <label className={styles.capstoneItem} key={artifact.id}>
                <input
                  type="checkbox"
                  checked={selectedArtifacts.has(artifact.id)}
                  onChange={(event) => {
                    const next = new Set(artifactIds);
                    if (event.target.checked) next.add(artifact.id);
                    else next.delete(artifact.id);
                    saveDraft({
                      artifactIds: config.artifacts
                        .filter((candidate) => next.has(candidate.id))
                        .map((candidate) => candidate.id),
                    });
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
              value={score ?? ""}
              disabled={complete}
              aria-invalid={(attempted && !scoreReady) || undefined}
              aria-describedby={attempted && !scoreReady ? validationFeedbackId : undefined}
              onChange={(event) => {
                saveDraft({ score: event.target.value === "" ? null : Number(event.target.value) });
              }}
            />
          </label>
        </section>

        <fieldset
          className={styles.capstoneGates}
          lang="en"
          dir="ltr"
          disabled={complete}
          aria-invalid={(attempted && !gatesReviewed) || undefined}
          aria-describedby={attempted && !gatesReviewed ? validationFeedbackId : undefined}
        >
          <legend>{SOFTWARE_ENGINEERING_OVERVIEW.capstone.gatesTitle}</legend>
          <p>{SOFTWARE_ENGINEERING_OVERVIEW.capstone.gatesIntro}</p>
          {config.releaseGates.map((gate) => (
            <label key={gate.id}>
              <input
                type="checkbox"
                checked={selectedGates.has(gate.id)}
                onChange={(event) => {
                  const next = new Set(reviewedGateIds);
                  if (event.target.checked) next.add(gate.id);
                  else next.delete(gate.id);
                  saveDraft({
                    reviewedGateIds: config.releaseGates
                      .filter((candidate) => next.has(candidate.id))
                      .map((candidate) => candidate.id),
                  });
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
              aria-invalid={(attempted && !attested) || undefined}
              aria-describedby={attempted && !attested ? validationFeedbackId : undefined}
              onChange={(event) => saveDraft({ safetyBoundaryAttested: event.target.checked })}
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
            aria-invalid={(attempted && !decisionReady) || undefined}
            aria-describedby={attempted && !decisionReady ? validationFeedbackId : undefined}
            onChange={(event) => {
              saveDraft({
                decision: event.target.value as SoftwareEngineeringReleaseDecision | "",
              });
            }}
          >
            <option value="" lang="en" dir="ltr">{SOFTWARE_ENGINEERING_OVERVIEW.capstone.selectDecision}</option>
            {config.releaseDecisions.map((option) => (
              <option key={option} value={option} lang={locale} dir="auto">{decisionLabels[option]}</option>
            ))}
          </select>
        </label>

        {complete ? (
          <p
            className={styles.correctFeedback}
            data-testid="software-engineering-capstone-complete"
            ref={completionStatus}
            role="status"
            tabIndex={-1}
          >
            {labels.capstoneComplete}
          </p>
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
