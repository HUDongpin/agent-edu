"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  gradeAgentOrchestrationAssessment,
  isAgentOrchestrationQuizPassed,
  readAgentOrchestrationQuizBest,
  recordAgentOrchestrationQuizAttempt,
  type AgentOrchestrationAssessmentAnswers,
  type AgentOrchestrationAssessmentResult,
} from "@/lib/agent-orchestration/assessment-progress";
import {
  AGENT_ORCHESTRATION_MAX_EVIDENCE_REFERENCE_LENGTH,
  readAgentOrchestrationCapstoneWorkspace,
  saveAgentOrchestrationCapstoneEvidence,
  type AgentOrchestrationCapstoneEvidenceReason,
} from "@/lib/agent-orchestration/capstone-progress";
import type {
  AgentOrchestrationAssessmentQuestionCopy,
} from "@/lib/agent-orchestration/types";
import {
  label,
  persistenceText,
  storageStatusText,
  type Labels,
} from "./interaction-helpers";
import { updateAgentOrchestrationProgress } from "./progress-store";
import { useAgentOrchestrationProgress } from "./useAgentOrchestrationProgress";
import styles from "./AssessmentInteractions.module.css";

export interface FinalAssessmentProps {
  readonly locale: string;
  readonly questions: readonly AgentOrchestrationAssessmentQuestionCopy[];
  readonly passPercent: number;
  readonly title: string;
  readonly summary: string;
  readonly labels: Labels;
  readonly showIntro?: boolean;
}

export function FinalAssessment({
  locale,
  questions,
  passPercent,
  title,
  summary,
  labels,
  showIntro = true,
}: FinalAssessmentProps) {
  const snapshot = useAgentOrchestrationProgress();
  const progress = snapshot.record;
  const [answers, setAnswers] = useState<AgentOrchestrationAssessmentAnswers>({});
  const [result, setResult] = useState<AgentOrchestrationAssessmentResult | null>(
    null,
  );
  const [saveResult, setSaveResult] = useState<boolean | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const firstOptionRef = useRef<HTMLInputElement>(null);
  const current = useMemo(
    () => gradeAgentOrchestrationAssessment(
      questions,
      answers,
      passPercent,
    ),
    [answers, passPercent, questions],
  );
  const resultByCheckpoint = useMemo(() => new Map(
    result?.questionResults.map((questionResult) => [
      questionResult.checkpointId,
      questionResult,
    ]) ?? [],
  ), [result]);
  const best = readAgentOrchestrationQuizBest(progress);
  const coursePassed = isAgentOrchestrationQuizPassed(progress);
  const submitted = result !== null;

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  const retry = () => {
    setAnswers({});
    setResult(null);
    setSaveResult(null);
    window.requestAnimationFrame(() => firstOptionRef.current?.focus());
  };

  return (
    <section
      className={styles.assessment}
      id="agent-orchestration-assessment"
      aria-busy={snapshot.status === "checking"}
      aria-labelledby="assessment-title"
      data-testid="agent-orchestration-assessment"
    >
      <header className={styles.assessmentHeader}>
        <div>
          <p className={styles.eyebrow}>
            {label(labels, "assessment", "Final assessment")}
          </p>
          <h2 id="assessment-title">
            {showIntro
              ? title
              : label(
                labels,
                "assessmentWorkspaceTitle",
                "Check your architecture decisions",
              )}
          </h2>
          {showIntro ? <p>{summary}</p> : null}
        </div>
        <dl className={styles.assessmentFacts}>
          <div>
            <dt>{label(labels, "assessmentThreshold", "Pass")}</dt>
            <dd>≥ {passPercent}%</dd>
          </div>
          <div>
            <dt>{label(labels, "bestScore", "Best")}</dt>
            <dd>{Math.max(best, result?.score ?? 0)}%</dd>
          </div>
        </dl>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (current.answeredCount !== questions.length) return;
          const nextResult = gradeAgentOrchestrationAssessment(
            questions,
            answers,
            passPercent,
          );
          setResult(nextResult);
          const persisted = updateAgentOrchestrationProgress((record) => {
            recordAgentOrchestrationQuizAttempt(
              record,
              nextResult.score,
              passPercent,
            );
          });
          setSaveResult(persisted);
        }}
      >
        <div className={styles.answeredStatus} aria-live="polite">
          <span>{label(labels, "assessmentAnswered", "Answered")}</span>
          <strong data-testid="agent-orchestration-assessment-answered">
            {current.answeredCount} {label(labels, "assessmentOf", "of")} {questions.length}
          </strong>
          {current.answeredCount === questions.length && !submitted ? (
            <span>{label(
              labels,
              "assessmentReadyToGrade",
              "All questions are answered. Ready to grade.",
            )}</span>
          ) : null}
        </div>

        <ol className={styles.questionList}>
          {questions.map(({ moduleSlug, moduleTitle, checkpoint }, questionIndex) => {
            const selectedOptionId = answers[checkpoint.checkpointId] ?? null;
            const questionResult = resultByCheckpoint.get(checkpoint.checkpointId);
            const missed = Boolean(questionResult && !questionResult.correct);
            const feedbackId = `${checkpoint.checkpointId}-feedback`;
            const correctOption = checkpoint.options.find(
              (option) => option.id === checkpoint.correctOptionId,
            );
            return (
              <li
                key={checkpoint.checkpointId}
                className={styles.questionCard}
                data-answered={selectedOptionId !== null || undefined}
                data-result={questionResult
                  ? questionResult.correct ? "correct" : "missed"
                  : undefined}
              >
                <fieldset aria-describedby={missed ? feedbackId : undefined}>
                  <legend>
                    <span>{String(questionIndex + 1).padStart(2, "0")}</span>
                    {checkpoint.question}
                  </legend>
                  <div className={styles.optionList}>
                    {checkpoint.options.map((option, optionIndex) => {
                      const selected = selectedOptionId === option.id;
                      const optionState = submitted
                        ? option.id === checkpoint.correctOptionId
                          ? "correct"
                          : selected ? "missed" : undefined
                        : undefined;
                      const optionMarker = optionState === "correct"
                        ? selected
                          ? label(
                            labels,
                            "assessmentOptionSelectedCorrect",
                            "Selected · correct",
                          )
                          : label(
                            labels,
                            "assessmentOptionCorrect",
                            "Correct answer",
                          )
                        : optionState === "missed"
                          ? label(
                            labels,
                            "assessmentOptionSelectedMissed",
                            "Your answer · review",
                          )
                          : selected
                            ? label(
                              labels,
                              "assessmentOptionSelected",
                              "Selected",
                            )
                            : null;
                      return (
                        <label
                          key={option.id}
                          className={styles.option}
                          data-selected={selected || undefined}
                          data-result={optionState}
                        >
                          <input
                            ref={questionIndex === 0 && optionIndex === 0
                              ? firstOptionRef
                              : undefined}
                            type="radio"
                            name={`agent-orchestration-final-${checkpoint.checkpointId}`}
                            value={option.id}
                            checked={selected}
                            disabled={snapshot.status !== "available" || submitted}
                            onChange={() => {
                              setAnswers((currentAnswers) => ({
                                ...currentAnswers,
                                [checkpoint.checkpointId]: option.id,
                              }));
                              setResult(null);
                              setSaveResult(null);
                            }}
                          />
                          <span className={styles.optionLetter} aria-hidden="true">
                            {String.fromCharCode(65 + optionIndex)}
                          </span>
                          <span>
                            {option.label}
                            {optionMarker ? (
                              <span
                                className={styles.optionState}
                                data-testid="agent-orchestration-assessment-option-marker"
                              >
                                {optionMarker}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                {missed ? (
                  <div
                    className={styles.missedFeedback}
                    id={feedbackId}
                    data-testid="agent-orchestration-assessment-missed"
                  >
                    <strong>{label(
                      labels,
                      "assessmentQuestionsToReview",
                      "Question to review",
                    )}</strong>
                    <p>{checkpoint.explanation}</p>
                    {correctOption ? (
                      <p>
                        <span>{label(
                          labels,
                          "assessmentCorrectAnswer",
                          "Correct answer",
                        )}:</span>{" "}
                        {correctOption.label}
                      </p>
                    ) : null}
                    <Link
                      href={`/${locale}/agent-orchestration/${moduleSlug}/#module-checkpoint`}
                      prefetch={false}
                    >
                      {label(labels, "assessmentReviewModule", "Review module")}: {moduleTitle}
                      <span aria-hidden="true"> →</span>
                    </Link>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>

        {snapshot.status !== "available" ? (
          <p
            className={styles.storageState}
            role={snapshot.status === "checking" ? "status" : "alert"}
          >
            {storageStatusText(labels, snapshot.status)}
          </p>
        ) : null}

        {!submitted ? (
          <div className={styles.submitRow}>
            <span>
              {current.answeredCount}/{questions.length}
            </span>
            <button
              type="submit"
              disabled={snapshot.status !== "available"
                || current.answeredCount !== questions.length}
            >
              {label(labels, "submitAssessment", "Grade assessment")}
            </button>
          </div>
        ) : (
          <div
            ref={resultRef}
            className={result.passed || coursePassed
              ? styles.resultPass
              : styles.resultRetry}
            role="status"
            tabIndex={-1}
            data-testid="agent-orchestration-assessment-result"
          >
            <p className={styles.eyebrow}>
              {label(labels, "assessmentResultTitle", "Assessment result")}
            </p>
            <h3>
              {result.score}% · {result.passed
                ? label(labels, "passed", "Passed")
                : coursePassed
                  ? label(labels, "passPreserved", "Prior pass preserved")
                  : label(labels, "notYet", "Not yet")}
            </h3>
            <p>
              {result.passed
                ? label(labels, "assessmentPass", "You cleared the architecture gate.")
                : coursePassed
                  ? label(labels, "bestPreserved", "Your best score and pass remain preserved.")
                  : label(labels, "assessmentRetry", "Review the missed boundaries, then retry.")}
            </p>
            <p>
              {label(labels, "assessmentQuestionsToReview", "Questions to review")}:{" "}
              <strong>{result.missedCheckpointIds.length}</strong>
            </p>
            <small>{persistenceText(labels, saveResult)}</small>
            <button type="button" onClick={retry}>
              {label(labels, "assessmentRetryAction", "Try the assessment again")}
            </button>
          </div>
        )}
      </form>
    </section>
  );
}

function capstoneReasonText(
  labels: Labels,
  reason: AgentOrchestrationCapstoneEvidenceReason,
): string {
  const messages: Record<AgentOrchestrationCapstoneEvidenceReason, string> = {
    required: label(
      labels,
      "evidenceRequired",
      "Add an evidence reference for this artifact.",
    ),
    "too-long": label(
      labels,
      "evidenceTooLong",
      "Shorten this reference to 2,048 characters or fewer.",
    ),
    "unsupported-scheme": label(
      labels,
      "evidenceUnsupportedScheme",
      "Use HTTPS or an approved evidence identifier.",
    ),
    "too-short": label(
      labels,
      "evidenceTooShort",
      "Add a specific reference with at least eight meaningful characters.",
    ),
    placeholder: label(
      labels,
      "evidencePlaceholderReason",
      "Replace sample or temporary text with the real evidence reference.",
    ),
    "missing-identifier": label(
      labels,
      "evidenceMissingIdentifier",
      "Add a stable URL, file extension, or trace, ticket, or review identifier.",
    ),
    duplicate: label(
      labels,
      "evidenceDuplicate",
      "Use a distinct reference; this evidence is already assigned elsewhere.",
    ),
  };
  return messages[reason];
}

export interface CapstoneChecklistProps {
  readonly artifacts: readonly string[];
  readonly statement: string;
  readonly labels: Labels;
}

export function CapstoneChecklist({
  artifacts,
  statement,
  labels,
}: CapstoneChecklistProps) {
  const snapshot = useAgentOrchestrationProgress();
  const workspace = readAgentOrchestrationCapstoneWorkspace(
    snapshot.record,
    artifacts.length,
  );
  const { evidence, recoveryPending, validation, complete } = workspace;
  const [saveResult, setSaveResult] = useState<boolean | null>(null);
  const [touched, setTouched] = useState<Readonly<Record<number, boolean>>>({});
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const updateEvidence = (index: number, value: string) => {
    if (snapshot.status !== "available") return;
    const next = evidence.map((current, itemIndex) => (
      itemIndex === index ? value : current
    ));
    const persisted = updateAgentOrchestrationProgress((record) => {
      saveAgentOrchestrationCapstoneEvidence(
        record,
        next,
        artifacts.length,
      );
    });
    setSaveResult(persisted);
  };

  const reviewFirstUnresolved = () => {
    const index = validation.firstInvalidIndex;
    if (index === null) return;
    setTouched((current) => ({ ...current, [index]: true }));
    window.requestAnimationFrame(() => inputRefs.current[index]?.focus());
  };

  return (
    <section
      className={styles.capstone}
      aria-busy={snapshot.status === "checking"}
      aria-labelledby="capstone-checklist-title"
      data-testid="agent-orchestration-capstone"
    >
      <header className={styles.capstoneHeader}>
        <div>
          <p className={styles.eyebrow}>
            {label(labels, "releaseContract", "Release contract")}
          </p>
          <h3 id="capstone-checklist-title">
            {label(labels, "auditableArtifacts", "15 auditable artifacts")}
          </h3>
        </div>
        <strong>{validation.valid.filter(Boolean).length}/{artifacts.length}</strong>
      </header>

      <p className={styles.guidance} id="capstone-evidence-guidance">
        {label(
          labels,
          "evidenceGuidance",
          "Use a distinct, stable evidence reference for every artifact; final human verification remains required.",
        )}
      </p>

      {recoveryPending ? (
        <p className={styles.recoveryNotice} role="status">
          {label(
            labels,
            "capstoneRecoveryPending",
            "Recovered references require explicit review and resave.",
          )}
        </p>
      ) : null}

      <ol className={styles.artifactList}>
        {artifacts.map((artifact, index) => {
          const reason = validation.reasons[index];
          const showFeedback = touched[index] === true;
          const feedbackId = `capstone-evidence-feedback-${index}`;
          return (
            <li
              key={artifact}
              className={styles.artifactCard}
              data-reason={reason ?? undefined}
              data-valid={validation.valid[index] || undefined}
            >
              <label htmlFor={`capstone-evidence-${index}`}>
                <span className={styles.artifactNumber}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <strong>{artifact}</strong>
              </label>
              <input
                id={`capstone-evidence-${index}`}
                ref={(node) => {
                  inputRefs.current[index] = node;
                }}
                type="text"
                value={evidence[index]}
                disabled={snapshot.status !== "available"}
                maxLength={AGENT_ORCHESTRATION_MAX_EVIDENCE_REFERENCE_LENGTH}
                onChange={(event) => updateEvidence(index, event.target.value)}
                onBlur={() => setTouched((current) => ({
                  ...current,
                  [index]: true,
                }))}
                aria-label={`${artifact} — ${label(
                  labels,
                  "evidenceReference",
                  "evidence or reference",
                )}`}
                aria-invalid={(showFeedback && reason !== null) || undefined}
                aria-describedby={[
                  "capstone-evidence-guidance",
                  showFeedback ? feedbackId : null,
                ].filter(Boolean).join(" ")}
                placeholder={label(
                  labels,
                  "evidencePlaceholder",
                  "File, URL, trace ID, or review record",
                )}
              />
              {showFeedback ? (
                <small
                  className={reason ? styles.fieldError : styles.fieldAccepted}
                  id={feedbackId}
                  data-testid="agent-orchestration-capstone-field-feedback"
                >
                  {reason
                    ? capstoneReasonText(labels, reason)
                    : label(
                      labels,
                      "evidenceAccepted",
                      "Reference passes the local format and uniqueness gate.",
                    )}
                </small>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className={styles.capstoneActions}>
        {validation.firstInvalidIndex !== null ? (
          <button
            type="button"
            disabled={snapshot.status !== "available"}
            onClick={reviewFirstUnresolved}
            data-testid="agent-orchestration-capstone-review-first"
          >
            {label(
              labels,
              "capstoneReviewFirst",
              "Review first unresolved artifact",
            )}
          </button>
        ) : (
          <p>{label(
            labels,
            "capstoneAllResolved",
            "Every evidence field passes the local gate.",
          )}</p>
        )}
        <p className={complete ? styles.completionReady : styles.completionOpen}>
          {complete
            ? statement
            : label(
              labels,
              "capstoneOpen",
              "Completion remains open until every artifact is evidenced.",
            )}
        </p>
      </div>

      <small className={styles.persistenceStatus} role="status" aria-live="polite">
        {snapshot.status === "available"
          ? persistenceText(labels, saveResult)
          : storageStatusText(labels, snapshot.status)}
      </small>
    </section>
  );
}
