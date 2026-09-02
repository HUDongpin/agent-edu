"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  MATH_ANIMATION_CAPSTONE_CHECKS_KEY,
  MATH_ANIMATION_CAPSTONE_EVIDENCE_KEY,
  MATH_ANIMATION_CAPSTONE_KEY,
  MATH_ANIMATION_MAX_ARTIFACT_EVIDENCE_LENGTH,
  MATH_ANIMATION_MAX_CAPSTONE_EVIDENCE_LENGTH,
  MATH_ANIMATION_MAX_VERIFICATION_EVIDENCE_LENGTH,
  MATH_ANIMATION_MIN_ARTIFACT_EVIDENCE_LENGTH,
  MATH_ANIMATION_MIN_CAPSTONE_EVIDENCE_LENGTH,
  MATH_ANIMATION_MIN_VERIFICATION_EVIDENCE_LENGTH,
  MATH_ANIMATION_MODULE_SLUGS,
  MATH_ANIMATION_PROGRESS_EVENT,
  MATH_ANIMATION_PROGRESS_MILESTONES,
  MATH_ANIMATION_PROGRESS_PREFIX,
  MATH_ANIMATION_PROGRESS_RESET_EVENT,
  MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY,
  MATH_ANIMATION_PROGRESS_VERSION_KEY,
  MATH_ANIMATION_QUIZ_BEST_KEY,
  MATH_ANIMATION_QUIZ_PASSED_KEY,
  MATH_ANIMATION_QUIZ_PASS_PERCENT,
  mathAnimationModuleArtifactEvidenceKey,
  mathAnimationModuleCheckpointKey,
  mathAnimationModuleProgressKey,
  mathAnimationModuleVerificationEvidenceKey,
  reconcileMathAnimationCapstone,
  reconcileMathAnimationModuleCompletion,
  type MathAnimationAssessmentQuestion,
  type MathAnimationCheckpointCopy,
  type MathAnimationCourseCopy,
  type MathAnimationModuleSlug,
} from "@/lib/math-animation";
import {
  isMathAnimationProgressStorageEvent,
  isMathAnimationStorageAvailable,
  readMathAnimationProgress,
  resetMathAnimationProgress,
  updateMathAnimationProgress,
  type MathAnimationProgressRecord,
} from "./progress-store";
import styles from "./MathAnimationCourse.module.css";

type Labels = MathAnimationCourseCopy["ui"];
type JourneyModule = { slug: MathAnimationModuleSlug; href: string };

const EVIDENCE_AUTOSAVE_DELAY_MS = 500;

function subscribe(notify: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (isMathAnimationProgressStorageEvent(event)) notify();
  };
  window.addEventListener(MATH_ANIMATION_PROGRESS_EVENT, notify);
  window.addEventListener(MATH_ANIMATION_PROGRESS_RESET_EVENT, notify);
  window.addEventListener("storage", onStorage);
  window.addEventListener("focus", notify);
  return () => {
    window.removeEventListener(MATH_ANIMATION_PROGRESS_EVENT, notify);
    window.removeEventListener(MATH_ANIMATION_PROGRESS_RESET_EVENT, notify);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("focus", notify);
  };
}

function progressSnapshot(): string {
  return JSON.stringify(readMathAnimationProgress());
}

function resetGenerationFromStorageValue(raw: string | null): number {
  if (!raw) return 0;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return 0;
    const generation = (parsed as MathAnimationProgressRecord)[
      MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY
    ];
    return typeof generation === "number"
      && Number.isSafeInteger(generation)
      && generation >= 0
      ? generation
      : 0;
  } catch {
    return 0;
  }
}

function isMathAnimationResetStorageEvent(event: StorageEvent): boolean {
  if (!isMathAnimationProgressStorageEvent(event)) return false;
  if (event.key === null) return true;
  return resetGenerationFromStorageValue(event.oldValue)
    !== resetGenerationFromStorageValue(event.newValue);
}

function useMathAnimationProgress(): {
  progress: MathAnimationProgressRecord;
  storageAvailable: boolean;
} {
  const serialized = useSyncExternalStore(subscribe, progressSnapshot, () => "{}");
  const storageAvailable = useSyncExternalStore(
    subscribe,
    isMathAnimationStorageAvailable,
    () => true,
  );
  let progress: MathAnimationProgressRecord = {};
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      progress = parsed as MathAnimationProgressRecord;
    }
  } catch {
    progress = {};
  }
  return { progress, storageAvailable };
}

function StorageStatus({ available, labels }: { available: boolean; labels: Labels }) {
  return available ? (
    <p className={styles.storageNote}>{labels.storageNote}</p>
  ) : (
    <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p>
  );
}

export function CopyPrompt({ prompt, labels }: { prompt: string; labels: Labels }) {
  const [status, setStatus] = useState("");
  const promptRef = useRef<HTMLPreElement>(null);
  return (
    <div className={styles.promptBox}>
      <pre ref={promptRef} tabIndex={0}><code>{prompt}</code></pre>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(prompt);
            setStatus(labels.copied);
          } catch {
            setStatus(labels.copyFailed);
            promptRef.current?.focus();
          }
        }}
      >
        {status || labels.copyPrompt}
      </button>
      <span className={styles.srOnly} role="status">{status}</span>
    </div>
  );
}

export function ModuleCheckpoint({
  slug,
  checkpoint,
  labels,
}: {
  slug: MathAnimationModuleSlug;
  checkpoint: MathAnimationCheckpointCopy;
  labels: Labels;
}) {
  const { progress } = useMathAnimationProgress();
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLInputElement | null>>([]);
  const passed = progress[mathAnimationModuleCheckpointKey(slug)] === true;
  const moduleComplete = progress[mathAnimationModuleProgressKey(slug)] === true;
  const correct = selected === checkpoint.correctIndex;
  const displayedSelected = passed ? checkpoint.correctIndex : selected;
  const displayedChecked = passed || checked;

  useEffect(() => {
    const reset = () => {
      setSelected(null);
      setChecked(false);
    };
    const onStorage = (event: StorageEvent) => {
      if (isMathAnimationResetStorageEvent(event)) reset();
    };
    window.addEventListener(MATH_ANIMATION_PROGRESS_RESET_EVENT, reset);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(MATH_ANIMATION_PROGRESS_RESET_EVENT, reset);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (checked) feedbackRef.current?.focus();
  }, [checked]);

  return (
    <section
      className={styles.checkpoint}
      id={`${slug}-checkpoint`}
      aria-labelledby={`${slug}-checkpoint-title`}
    >
      <p className={styles.sectionLabel}>{labels.checkpoint}</p>
      <h2 id={`${slug}-checkpoint-title`}>{checkpoint.question}</h2>
      <fieldset>
        <legend className={styles.srOnly}>{checkpoint.question}</legend>
        {checkpoint.options.map((option, index) => (
          <label key={option} data-result={displayedChecked ? (index === checkpoint.correctIndex ? "correct" : index === displayedSelected ? "incorrect" : undefined) : undefined}>
            <input
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              type="radio"
              name={`${slug}-checkpoint`}
              value={index}
              checked={displayedSelected === index}
              disabled={passed}
              onChange={() => {
                setSelected(index);
                setChecked(false);
              }}
            />
            <span>{String.fromCharCode(65 + index)}</span>
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
      {!passed ? (
        <button
          className={styles.primaryButton}
          type="button"
          disabled={selected === null}
          onClick={() => {
            if (selected === null) return;
            setChecked(true);
            updateMathAnimationProgress((record) => {
              if (correct) record[mathAnimationModuleCheckpointKey(slug)] = true;
              else delete record[mathAnimationModuleCheckpointKey(slug)];
              reconcileMathAnimationModuleCompletion(record, slug);
            });
          }}
        >
          {labels.checkAnswer}
        </button>
      ) : null}
      {displayedChecked ? (
        <div
          ref={feedbackRef}
          className={correct || passed ? styles.feedbackPass : styles.feedbackRetry}
          role="status"
          tabIndex={-1}
        >
          <strong>
            {moduleComplete
              ? labels.completed
              : correct || passed
                ? labels.correct
                : labels.incorrect}
          </strong>
          <p>{checkpoint.explanation}</p>
          {!correct && !passed ? (
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => {
                const retryIndex = selected ?? 0;
                setSelected(null);
                setChecked(false);
                window.requestAnimationFrame(() => optionRefs.current[retryIndex]?.focus());
              }}
            >
              {labels.retryAssessment}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function ModuleEvidenceGate({
  slug,
  artifact,
  verificationGate,
  labels,
}: {
  slug: MathAnimationModuleSlug;
  artifact: string;
  verificationGate: readonly string[];
  labels: Labels;
}) {
  const { progress, storageAvailable } = useMathAnimationProgress();
  const artifactKey = mathAnimationModuleArtifactEvidenceKey(slug);
  const verificationKey = mathAnimationModuleVerificationEvidenceKey(slug);
  const complete = progress[mathAnimationModuleProgressKey(slug)] === true;
  const savedArtifactEvidence = typeof progress[artifactKey] === "string"
    ? progress[artifactKey] as string
    : "";
  const savedVerificationEvidence = typeof progress[verificationKey] === "string"
    ? progress[verificationKey] as string
    : "";
  const [artifactDraft, setArtifactDraft] = useState<string | null>(null);
  const [verificationDraft, setVerificationDraft] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const artifactEvidence = artifactDraft ?? savedArtifactEvidence;
  const verificationEvidence = verificationDraft ?? savedVerificationEvidence;

  useEffect(() => {
    const reset = () => {
      setArtifactDraft(null);
      setVerificationDraft(null);
      setStatus("");
    };
    const onStorage = (event: StorageEvent) => {
      if (isMathAnimationResetStorageEvent(event)) reset();
    };
    window.addEventListener(MATH_ANIMATION_PROGRESS_RESET_EVENT, reset);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(MATH_ANIMATION_PROGRESS_RESET_EVENT, reset);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const artifactChanged = artifactDraft !== null
      && artifactDraft !== savedArtifactEvidence;
    const verificationChanged = verificationDraft !== null
      && verificationDraft !== savedVerificationEvidence;
    if (!artifactChanged && !verificationChanged) return;

    const timer = window.setTimeout(() => {
      const persisted = updateMathAnimationProgress((record) => {
        if (artifactChanged && artifactDraft !== null) {
          if (artifactDraft.length > 0) record[artifactKey] = artifactDraft;
          else delete record[artifactKey];
        }
        if (verificationChanged && verificationDraft !== null) {
          if (verificationDraft.length > 0) record[verificationKey] = verificationDraft;
          else delete record[verificationKey];
        }
      });
      setStatus(persisted ? labels.saved : labels.storageUnavailable);
    }, EVIDENCE_AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [
    artifactDraft,
    artifactKey,
    labels.saved,
    labels.storageUnavailable,
    savedArtifactEvidence,
    savedVerificationEvidence,
    verificationDraft,
    verificationKey,
  ]);

  const valid = artifactEvidence.trim().length >= MATH_ANIMATION_MIN_ARTIFACT_EVIDENCE_LENGTH
    && artifactEvidence.length <= MATH_ANIMATION_MAX_ARTIFACT_EVIDENCE_LENGTH
    && verificationEvidence.trim().length >= MATH_ANIMATION_MIN_VERIFICATION_EVIDENCE_LENGTH
    && verificationEvidence.length <= MATH_ANIMATION_MAX_VERIFICATION_EVIDENCE_LENGTH;
  const checkpointPassed = progress[mathAnimationModuleCheckpointKey(slug)] === true;
  const canComplete = checkpointPassed && valid;
  const hasDraftChanges = (artifactDraft !== null && artifactDraft !== savedArtifactEvidence)
    || (verificationDraft !== null && verificationDraft !== savedVerificationEvidence);

  return (
    <section
      className={styles.evidenceGate}
      id={`${slug}-evidence`}
      aria-labelledby={`${slug}-evidence-title`}
    >
      <div className={styles.evidenceIntro}>
        <p className={styles.sectionLabel}>{labels.practiceArtifact}</p>
        <h2 id={`${slug}-evidence-title`}>{artifact}</h2>
        <p>{labels.evidenceRequired}</p>
      </div>
      <div className={styles.gateChecklist}>
        <h3>{labels.verificationGate}</h3>
        <ul>{verificationGate.map((gate) => <li key={gate}>{gate}</li>)}</ul>
      </div>
      <div className={styles.evidenceFields}>
        <label>
          <span>{labels.artifactEvidence}</span>
          <small id={`${slug}-artifact-evidence-help`}>{labels.artifactEvidenceHelp}</small>
          <textarea
            name={`math-animation-${slug}-artifact-evidence`}
            autoComplete="off"
            aria-describedby={`${slug}-artifact-evidence-help ${slug}-artifact-evidence-count`}
            value={artifactEvidence}
            onChange={(event) => {
              setArtifactDraft(event.target.value);
              setStatus(labels.saving);
            }}
            rows={3}
            disabled={complete}
            minLength={MATH_ANIMATION_MIN_ARTIFACT_EVIDENCE_LENGTH}
            maxLength={MATH_ANIMATION_MAX_ARTIFACT_EVIDENCE_LENGTH}
          />
          <small id={`${slug}-artifact-evidence-count`}>
            {artifactEvidence.length} / {MATH_ANIMATION_MAX_ARTIFACT_EVIDENCE_LENGTH} {labels.characters}
            {" · "}{labels.minimum} {MATH_ANIMATION_MIN_ARTIFACT_EVIDENCE_LENGTH}
          </small>
        </label>
        <label>
          <span>{labels.verificationEvidence}</span>
          <small id={`${slug}-verification-evidence-help`}>{labels.verificationEvidenceHelp}</small>
          <textarea
            name={`math-animation-${slug}-verification-evidence`}
            autoComplete="off"
            aria-describedby={`${slug}-verification-evidence-help ${slug}-verification-evidence-count`}
            value={verificationEvidence}
            onChange={(event) => {
              setVerificationDraft(event.target.value);
              setStatus(labels.saving);
            }}
            rows={4}
            disabled={complete}
            minLength={MATH_ANIMATION_MIN_VERIFICATION_EVIDENCE_LENGTH}
            maxLength={MATH_ANIMATION_MAX_VERIFICATION_EVIDENCE_LENGTH}
          />
          <small id={`${slug}-verification-evidence-count`}>
            {verificationEvidence.length} / {MATH_ANIMATION_MAX_VERIFICATION_EVIDENCE_LENGTH} {labels.characters}
            {" · "}{labels.minimum} {MATH_ANIMATION_MIN_VERIFICATION_EVIDENCE_LENGTH}
          </small>
        </label>
      </div>
      <div className={styles.gateActions}>
        <button
          className={complete ? styles.completeButton : styles.primaryButton}
          type="button"
          disabled={complete || (!canComplete && !hasDraftChanges)}
          onClick={() => {
            const persisted = updateMathAnimationProgress((record) => {
              if (artifactEvidence.length > 0) record[artifactKey] = artifactEvidence;
              else delete record[artifactKey];
              if (verificationEvidence.length > 0) {
                record[verificationKey] = verificationEvidence;
              } else {
                delete record[verificationKey];
              }
              if (canComplete) reconcileMathAnimationModuleCompletion(record, slug);
            });
            setStatus(persisted ? labels.saved : labels.storageUnavailable);
          }}
        >
          {complete
            ? labels.completed
            : canComplete
              ? labels.completeModule
              : labels.markComplete}
        </button>
        <StorageStatus available={storageAvailable} labels={labels} />
      </div>
      <p className={styles.statusLine} role="status">{status}</p>
    </section>
  );
}

function hasMeaningfulMathAnimationProgress(progress: MathAnimationProgressRecord): boolean {
  return Object.keys(progress).some(
    (key) => key.startsWith(MATH_ANIMATION_PROGRESS_PREFIX)
      && key !== MATH_ANIMATION_PROGRESS_VERSION_KEY
      && key !== MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY,
  );
}

function getCourseJourneyState(
  progress: MathAnimationProgressRecord,
  modules: readonly JourneyModule[],
  overviewHref: string,
) {
  const moduleCount = modules.filter(
    (module) => progress[mathAnimationModuleProgressKey(module.slug)] === true,
  ).length;
  const quiz = progress[MATH_ANIMATION_QUIZ_PASSED_KEY] === true ? 1 : 0;
  const capstone = progress[MATH_ANIMATION_CAPSTONE_KEY] === true ? 1 : 0;
  const completedMilestones = moduleCount + quiz + capstone;
  const nextModule = modules.find(
    (module) => progress[mathAnimationModuleProgressKey(module.slug)] !== true,
  );
  const courseComplete = completedMilestones === MATH_ANIMATION_PROGRESS_MILESTONES;

  return {
    moduleCount,
    quiz,
    capstone,
    completedMilestones,
    courseComplete,
    hasProgress: hasMeaningfulMathAnimationProgress(progress),
    nextSlug: nextModule?.slug ?? null,
    nextHref: nextModule?.href
      ?? (quiz === 0
        ? `${overviewHref}#math-animation-assessment`
        : capstone === 0
          ? `${overviewHref}#math-animation-capstone`
          : `${overviewHref}#course-map`),
    percent: Math.round(
      (completedMilestones / MATH_ANIMATION_PROGRESS_MILESTONES) * 100,
    ),
  };
}

function journeyActionLabel(
  state: ReturnType<typeof getCourseJourneyState>,
  labels: Labels,
): string {
  if (state.courseComplete) return labels.completed;
  return state.hasProgress ? labels.resume : labels.start;
}

export function CourseJourneyAction({
  modules,
  labels,
  overviewHref,
  className,
}: {
  modules: readonly JourneyModule[];
  labels: Labels;
  overviewHref: string;
  className?: string;
}) {
  const { progress } = useMathAnimationProgress();
  const state = useMemo(
    () => getCourseJourneyState(progress, modules, overviewHref),
    [modules, overviewHref, progress],
  );

  return (
    <Link
      className={className}
      href={state.nextHref}
      data-course-journey-action
    >
      {journeyActionLabel(state, labels)}
    </Link>
  );
}

export function ModuleCompletionStatus({
  slug,
  labels,
}: {
  slug: MathAnimationModuleSlug;
  labels: Labels;
}) {
  const { progress } = useMathAnimationProgress();
  const complete = progress[mathAnimationModuleProgressKey(slug)] === true;
  if (!complete) return null;

  return (
    <span
      className={styles.moduleCompletionStatus}
      data-module-completion-status="complete"
    >
      <span aria-hidden="true">✓</span>
      <span className={styles.srOnly}>{labels.completed}</span>
    </span>
  );
}

export function CourseProgress({
  modules,
  labels,
  overviewHref,
  showJourneyAction = true,
  currentSlug,
  compact = false,
}: {
  modules: readonly JourneyModule[];
  labels: Labels;
  overviewHref: string;
  showJourneyAction?: boolean;
  currentSlug?: MathAnimationModuleSlug;
  compact?: boolean;
}) {
  const { progress, storageAvailable } = useMathAnimationProgress();
  const [resetStatus, setResetStatus] = useState("");
  const state = useMemo(
    () => getCourseJourneyState(progress, modules, overviewHref),
    [modules, overviewHref, progress],
  );
  const actionWouldNavigate = state.nextSlug === null || state.nextSlug !== currentSlug;

  return (
    <section
      className={styles.progressPanel}
      aria-labelledby="math-animation-progress-title"
      data-compact={compact ? "true" : undefined}
    >
      <div>
        <p className={styles.sectionLabel}>{labels.progress}</p>
        {compact ? (
          <p id="math-animation-progress-title" className={styles.compactProgressValue}>
            <span className={styles.srOnly}>{labels.progress}: </span>
            {state.percent}%
          </p>
        ) : (
          <h2 id="math-animation-progress-title">
            <span className={styles.srOnly}>{labels.progress}: </span>
            {state.percent}%
          </h2>
        )}
        <p>{state.moduleCount} / {modules.length} {labels.modules}</p>
      </div>
      <progress
        max={MATH_ANIMATION_PROGRESS_MILESTONES}
        value={state.completedMilestones}
        aria-labelledby="math-animation-progress-title"
        aria-describedby="math-animation-progress-breakdown"
      >
        {state.percent}%
      </progress>
      <p id="math-animation-progress-breakdown">
        {labels.modules}: {state.moduleCount} / {modules.length}
        {" · "}{labels.finalAssessment}: {state.quiz} / 1
        {" · "}{labels.capstone}: {state.capstone} / 1
      </p>
      <StorageStatus available={storageAvailable} labels={labels} />
      {(showJourneyAction && actionWouldNavigate) || state.hasProgress ? (
        <div className={styles.progressActions}>
          {showJourneyAction && actionWouldNavigate ? (
            <Link
              className={styles.primaryButton}
              href={state.nextHref}
              data-course-journey-action
            >
              {journeyActionLabel(state, labels)}
            </Link>
          ) : null}
          {state.hasProgress ? (
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => {
                if (!window.confirm(labels.resetConfirm)) return;
                const persisted = resetMathAnimationProgress();
                setResetStatus(persisted ? labels.resetDone : labels.resetMemory);
              }}
            >
              {labels.reset}
            </button>
          ) : null}
        </div>
      ) : null}
      {resetStatus ? <p className={styles.statusLine} role="status">{resetStatus}</p> : null}
    </section>
  );
}

export function FinalAssessment({
  questions,
  labels,
}: {
  questions: readonly MathAnimationAssessmentQuestion[];
  labels: Labels;
}) {
  const { progress, storageAvailable } = useMathAnimationProgress();
  const [active, setActive] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const firstAnswerRef = useRef<HTMLInputElement>(null);
  const answeredCount = Object.keys(answers).length;
  const savedBest = typeof progress[MATH_ANIMATION_QUIZ_BEST_KEY] === "number"
    ? progress[MATH_ANIMATION_QUIZ_BEST_KEY] as number
    : 0;
  useEffect(() => {
    const reset = () => {
      setActive(false);
      setAnswers({});
      setResult(null);
    };
    const onStorage = (event: StorageEvent) => {
      if (isMathAnimationResetStorageEvent(event)) reset();
    };
    window.addEventListener(MATH_ANIMATION_PROGRESS_RESET_EVENT, reset);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(MATH_ANIMATION_PROGRESS_RESET_EVENT, reset);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  return (
    <section className={styles.assessment} id="math-animation-assessment" aria-labelledby="math-animation-assessment-title" tabIndex={-1}>
      <header>
        <div>
          <p className={styles.sectionLabel}>{labels.finalAssessment}</p>
          <h2 id="math-animation-assessment-title">{labels.finalAssessment}</h2>
          <strong className={styles.assessmentThreshold}>{MATH_ANIMATION_QUIZ_PASS_PERCENT}%</strong>
          <p>{labels.bestScore}: {Math.max(savedBest, result?.score ?? 0)}%</p>
        </div>
        <StorageStatus available={storageAvailable} labels={labels} />
      </header>
      {!active ? (
        <button className={styles.primaryButton} type="button" onClick={() => setActive(true)}>
          {labels.startAssessment}
        </button>
      ) : result ? (
        <div
          ref={resultRef}
          className={result.passed ? styles.feedbackPass : styles.feedbackRetry}
          tabIndex={-1}
        >
          <div role="status">
            <strong>{result.passed ? labels.assessmentPassed : labels.assessmentRetry}</strong>
            <p>{labels.scoreResult}: {result.score}%</p>
          </div>
          <ol className={styles.assessmentReview}>
            {questions.map((question, index) => {
              const answerIsCorrect = answers[question.id] === question.correctIndex;
              return (
                <li key={question.id} data-result={answerIsCorrect ? "correct" : "incorrect"}>
                  <p><span>{String(index + 1).padStart(2, "0")}</span>{question.question}</p>
                  <strong>{answerIsCorrect ? labels.answerCorrect : labels.answerIncorrect}</strong>
                  <p>{labels.correctAnswer}: {question.options[question.correctIndex]}</p>
                  <p>{question.explanation}</p>
                </li>
              );
            })}
          </ol>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => {
              setAnswers({});
              setResult(null);
              window.requestAnimationFrame(() => firstAnswerRef.current?.focus());
            }}
          >
            {labels.retryAssessment}
          </button>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (Object.keys(answers).length !== questions.length) return;
            const correct = questions.filter(
              (question) => answers[question.id] === question.correctIndex,
            ).length;
            const score = Math.round((correct / questions.length) * 100);
            const passed = score >= MATH_ANIMATION_QUIZ_PASS_PERCENT;
            setResult({ score, passed });
            updateMathAnimationProgress((record) => {
              const prior = typeof record[MATH_ANIMATION_QUIZ_BEST_KEY] === "number"
                ? record[MATH_ANIMATION_QUIZ_BEST_KEY] as number
                : 0;
              record[MATH_ANIMATION_QUIZ_BEST_KEY] = Math.max(prior, score);
              if (passed) record[MATH_ANIMATION_QUIZ_PASSED_KEY] = true;
            });
          }}
        >
          <p role="status">
            {answeredCount} / {questions.length} {labels.answered}
          </p>
          {questions.map((question, index) => (
            <fieldset key={question.id}>
              <legend><span>{String(index + 1).padStart(2, "0")}</span>{question.question}</legend>
              {question.options.map((option, optionIndex) => (
                <label key={option}>
                  <input
                    ref={index === 0 && optionIndex === 0 ? firstAnswerRef : undefined}
                    type="radio"
                    name={`assessment-${question.id}`}
                    value={optionIndex}
                    checked={answers[question.id] === optionIndex}
                    onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </fieldset>
          ))}
          <button
            className={styles.primaryButton}
            type="submit"
            disabled={answeredCount !== questions.length}
          >
            {labels.submitAssessment}
          </button>
        </form>
      )}
    </section>
  );
}

export function CapstoneChecklist({
  artifacts,
  labels,
}: {
  artifacts: readonly string[];
  labels: Labels;
}) {
  const { progress, storageAvailable } = useMathAnimationProgress();
  const storedChecks = Array.isArray(progress[MATH_ANIMATION_CAPSTONE_CHECKS_KEY])
    ? progress[MATH_ANIMATION_CAPSTONE_CHECKS_KEY] as boolean[]
    : [];
  const savedChecks = artifacts.map((_, index) => storedChecks[index] === true);
  const savedEvidence = typeof progress[MATH_ANIMATION_CAPSTONE_EVIDENCE_KEY] === "string"
    ? progress[MATH_ANIMATION_CAPSTONE_EVIDENCE_KEY] as string
    : "";
  const [checksDraft, setChecksDraft] = useState<boolean[] | null>(null);
  const [evidenceDraft, setEvidenceDraft] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const checks = checksDraft ?? savedChecks;
  const evidence = evidenceDraft ?? savedEvidence;
  const complete = progress[MATH_ANIMATION_CAPSTONE_KEY] === true;
  const completedModuleCount = MATH_ANIMATION_MODULE_SLUGS.filter(
    (slug) => progress[mathAnimationModuleProgressKey(slug)] === true,
  ).length;
  const quizPassed = progress[MATH_ANIMATION_QUIZ_PASSED_KEY] === true;
  const prerequisitesComplete = completedModuleCount === MATH_ANIMATION_MODULE_SLUGS.length
    && quizPassed;
  const valid = prerequisitesComplete
    && checks.every(Boolean)
    && evidence.trim().length >= MATH_ANIMATION_MIN_CAPSTONE_EVIDENCE_LENGTH
    && evidence.length <= MATH_ANIMATION_MAX_CAPSTONE_EVIDENCE_LENGTH;

  useEffect(() => {
    const reset = () => {
      setChecksDraft(null);
      setEvidenceDraft(null);
      setStatus("");
    };
    const onStorage = (event: StorageEvent) => {
      if (isMathAnimationResetStorageEvent(event)) reset();
    };
    window.addEventListener(MATH_ANIMATION_PROGRESS_RESET_EVENT, reset);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(MATH_ANIMATION_PROGRESS_RESET_EVENT, reset);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (evidenceDraft === null || evidenceDraft === savedEvidence) return;
    const timer = window.setTimeout(() => {
      const persisted = updateMathAnimationProgress((record) => {
        if (evidenceDraft.length > 0) {
          record[MATH_ANIMATION_CAPSTONE_EVIDENCE_KEY] = evidenceDraft;
        } else {
          delete record[MATH_ANIMATION_CAPSTONE_EVIDENCE_KEY];
        }
      });
      setStatus(persisted ? labels.saved : labels.storageUnavailable);
    }, EVIDENCE_AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [evidenceDraft, labels.saved, labels.storageUnavailable, savedEvidence]);

  return (
    <section className={styles.capstoneChecklist} id="math-animation-capstone" aria-labelledby="math-animation-capstone-checklist-title" tabIndex={-1}>
      <p className={styles.sectionLabel}>{labels.capstone}</p>
      <h2 id="math-animation-capstone-checklist-title">{labels.allChecksRequired}</h2>
      <p className={styles.capstonePrerequisites} role="status">
        {labels.completed}: {completedModuleCount} / {MATH_ANIMATION_MODULE_SLUGS.length} {labels.modules}
        {" · "}{labels.finalAssessment}: {quizPassed ? labels.assessmentPassed : labels.assessmentRetry}
      </p>
      <p className={styles.capstoneBoundary}>{labels.capstoneAttestationBoundary}</p>
      <fieldset>
        <legend className={styles.srOnly}>{labels.allChecksRequired}</legend>
        {artifacts.map((artifact, index) => (
          <label key={artifact}>
            <input
              type="checkbox"
              name={`math-animation-capstone-artifact-${index + 1}`}
              checked={checks[index] ?? false}
              disabled={complete}
              onChange={(event) => {
                const nextChecks = checks.map((value, candidate) => (
                  candidate === index ? event.target.checked : value
                ));
                setChecksDraft(nextChecks);
                const persisted = updateMathAnimationProgress((record) => {
                  record[MATH_ANIMATION_CAPSTONE_CHECKS_KEY] = [...nextChecks];
                });
                setStatus(persisted ? labels.saved : labels.storageUnavailable);
              }}
            />
            <span>{artifact}</span>
          </label>
        ))}
      </fieldset>
      <label className={styles.capstoneEvidence}>
        <span>{labels.capstoneEvidence}</span>
        <small id="math-animation-capstone-evidence-help">{labels.capstoneEvidenceHelp}</small>
        <textarea
          name="math-animation-capstone-evidence"
          autoComplete="off"
          aria-describedby="math-animation-capstone-evidence-help math-animation-capstone-evidence-count"
          rows={6}
          value={evidence}
          disabled={complete}
          minLength={MATH_ANIMATION_MIN_CAPSTONE_EVIDENCE_LENGTH}
          maxLength={MATH_ANIMATION_MAX_CAPSTONE_EVIDENCE_LENGTH}
          onChange={(event) => {
            setEvidenceDraft(event.target.value);
            setStatus(labels.saving);
          }}
        />
        <small id="math-animation-capstone-evidence-count">
          {evidence.length} / {MATH_ANIMATION_MAX_CAPSTONE_EVIDENCE_LENGTH} {labels.characters}
          {" · "}{labels.minimum} {MATH_ANIMATION_MIN_CAPSTONE_EVIDENCE_LENGTH}
        </small>
      </label>
      <button
        className={complete ? styles.completeButton : styles.primaryButton}
        type="button"
        disabled={!valid || complete}
        onClick={() => {
          const persisted = updateMathAnimationProgress((record) => {
            record[MATH_ANIMATION_CAPSTONE_CHECKS_KEY] = [...checks];
            record[MATH_ANIMATION_CAPSTONE_EVIDENCE_KEY] = evidence;
            reconcileMathAnimationCapstone(record);
          });
          setStatus(persisted ? labels.saved : labels.storageUnavailable);
        }}
      >
        {complete ? labels.capstoneComplete : labels.markCapstone}
      </button>
      <StorageStatus available={storageAvailable} labels={labels} />
      <p className={styles.statusLine} role="status">{status}</p>
    </section>
  );
}
