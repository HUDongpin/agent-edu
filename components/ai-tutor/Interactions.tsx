"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  AI_TUTOR_CAPSTONE_KEY,
  AI_TUTOR_PROGRESS_EVENT,
  AI_TUTOR_PROGRESS_MILESTONES,
  AI_TUTOR_PROGRESS_RESET_EVENT,
  AI_TUTOR_PROGRESS_VERSION_KEY,
  AI_TUTOR_QUIZ_BEST_KEY,
  AI_TUTOR_QUIZ_PASSED_KEY,
  aiTutorModuleProgressKey,
  formatAiTutorMessage,
  isCurrentAiTutorProgress,
  type AiTutorCheckpointCopy,
  type AiTutorCourseCopy,
  type AiTutorModuleSlug,
} from "@/lib/ai-tutor";
import {
  isAiTutorProgressStorageAvailable,
  readAiTutorProgress,
  resetAiTutorProgress,
  updateAiTutorProgress,
  type AiTutorProgressRecord,
} from "./progress-store";
import base from "../prompts/PromptCourse.module.css";
import styles from "./AiTutorCourse.module.css";

type Labels = AiTutorCourseCopy["ui"];

function subscribe(notify: () => void): () => void {
  window.addEventListener(AI_TUTOR_PROGRESS_EVENT, notify);
  window.addEventListener("storage", notify);
  window.addEventListener("focus", notify);
  return () => {
    window.removeEventListener(AI_TUTOR_PROGRESS_EVENT, notify);
    window.removeEventListener("storage", notify);
    window.removeEventListener("focus", notify);
  };
}

function progressSnapshot(): string {
  return JSON.stringify(readAiTutorProgress());
}

function useAiTutorProgress(): {
  progress: AiTutorProgressRecord;
  storageAvailable: boolean;
} {
  const serialized = useSyncExternalStore(subscribe, progressSnapshot, () => "{}");
  const storageAvailable = useSyncExternalStore(
    subscribe,
    isAiTutorProgressStorageAvailable,
    () => true,
  );
  let progress: AiTutorProgressRecord = {};
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const candidate = parsed as AiTutorProgressRecord;
      progress = isCurrentAiTutorProgress(candidate)
        ? candidate
        : Object.fromEntries(
            Object.entries(candidate).filter(([key]) => !key.startsWith("ai-tutor.")),
          );
    }
  } catch {
    progress = {};
  }
  return { progress, storageAvailable };
}

export function ModuleCompletion({
  slug,
  labels,
}: {
  slug: AiTutorModuleSlug;
  labels: Labels;
}) {
  const { progress, storageAvailable } = useAiTutorProgress();
  const key = aiTutorModuleProgressKey(slug);
  const complete = progress[key] === true;
  const statusRef = useRef<HTMLParagraphElement>(null);
  const [announcement, setAnnouncement] = useState(0);

  useEffect(() => {
    if (announcement > 0) statusRef.current?.focus();
  }, [announcement]);

  return (
    <section className={base.completion} aria-labelledby={`completion-${slug}`}>
      <div>
        <strong id={`completion-${slug}`}>
          {complete ? labels.moduleComplete : labels.moduleIncomplete}
        </strong>
        <p>{labels.browserStorageNote}</p>
        {!storageAvailable ? (
          <p className={base.storageWarning} role="status">{labels.storageUnavailable}</p>
        ) : null}
      </div>
      <button
        className={complete ? base.completeButton : base.primaryButton}
        type="button"
        aria-disabled={complete || undefined}
        onClick={() => {
          if (complete) return;
          updateAiTutorProgress((record) => {
            record[key] = true;
          });
          setAnnouncement((value) => value + 1);
        }}
      >
        {complete ? labels.markedModuleComplete : labels.markModuleComplete}
      </button>
      <p
        className={styles.srOnly}
        key={announcement}
        ref={statusRef}
        role="status"
        tabIndex={-1}
      >
        {announcement ? labels.moduleComplete : ""}
      </p>
    </section>
  );
}

export function CourseProgress({
  modules,
  labels,
  startLabel,
  resumeLabel,
}: {
  modules: readonly { slug: AiTutorModuleSlug; href: string }[];
  labels: Labels;
  startLabel: string;
  resumeLabel: string;
}) {
  const { progress, storageAvailable } = useAiTutorProgress();
  const [resetStatus, setResetStatus] = useState("");
  const [resetCount, setResetCount] = useState(0);
  const resetStatusRef = useRef<HTMLParagraphElement>(null);
  const state = useMemo(() => {
    const moduleCount = modules.filter(
      (module) => progress[aiTutorModuleProgressKey(module.slug)] === true,
    ).length;
    const quiz = progress[AI_TUTOR_QUIZ_PASSED_KEY] === true ? 1 : 0;
    const capstone = progress[AI_TUTOR_CAPSTONE_KEY] === true ? 1 : 0;
    const complete = moduleCount + quiz + capstone;
    const nextModule = modules.find(
      (module) => progress[aiTutorModuleProgressKey(module.slug)] !== true,
    );
    const nextHref = nextModule?.href
      ?? (quiz ? (capstone ? null : "#ai-tutor-capstone") : "#ai-tutor-final-assessment");
    return {
      complete,
      percent: Math.round((complete / AI_TUTOR_PROGRESS_MILESTONES) * 100),
      nextHref,
    };
  }, [modules, progress]);
  const hasProgress = Object.keys(progress).some(
    (key) => key.startsWith("ai-tutor.") && key !== AI_TUTOR_PROGRESS_VERSION_KEY,
  );

  useEffect(() => {
    if (resetCount > 0) resetStatusRef.current?.focus();
  }, [resetCount]);

  return (
    <section className={base.progressPanel} aria-labelledby="ai-tutor-progress-title">
      <div className={base.progressHeading}>
        <div>
          <h2 id="ai-tutor-progress-title">{labels.courseProgress}</h2>
          <p>{labels.browserStorageNote}</p>
        </div>
        <output className={base.progressValue} aria-live="polite">
          <strong>{state.percent}%</strong>
          <span>{formatAiTutorMessage(labels.progressPosition, {
            complete: state.complete,
            total: AI_TUTOR_PROGRESS_MILESTONES,
          })}</span>
        </output>
      </div>
      {!storageAvailable ? (
        <p className={base.storageWarning} role="status">{labels.storageUnavailable}</p>
      ) : null}
      <progress
        aria-labelledby="ai-tutor-progress-title"
        className={base.progressBar}
        max={AI_TUTOR_PROGRESS_MILESTONES}
        value={state.complete}
      >
        {state.percent}%
      </progress>
      <div className={base.actionRow}>
        {state.nextHref ? (
          <Link className={base.primaryButton} href={state.nextHref}>
            {hasProgress ? resumeLabel : startLabel}<span aria-hidden="true">→</span>
          </Link>
        ) : null}
        <button
          className={base.secondaryButton}
          type="button"
          disabled={!hasProgress}
          onClick={() => {
            if (!window.confirm(labels.resetConfirm)) return;
            const persisted = resetAiTutorProgress();
            setResetStatus(persisted ? labels.resetDone : labels.resetDoneMemory);
            setResetCount((value) => value + 1);
          }}
        >
          {labels.resetProgress}
        </button>
      </div>
      <p
        className={`${resetStatus ? base.resetStatus : styles.srOnly} ${base.focusTarget}`}
        key={resetCount}
        ref={resetStatusRef}
        role="status"
        tabIndex={-1}
      >
        {resetStatus}
      </p>
    </section>
  );
}

export function ModuleCheckpoint({
  checkpoint,
  labels,
  id,
}: {
  checkpoint: AiTutorCheckpointCopy;
  labels: Labels;
  id: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const firstOptionRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const retrying = useRef(false);
  const correct = selected === checkpoint.correctIndex;

  useEffect(() => {
    if (checked) feedbackRef.current?.focus();
    else if (retrying.current) {
      retrying.current = false;
      firstOptionRef.current?.focus();
    }
  }, [checked]);

  return (
    <section className={base.checkpoint} aria-labelledby={`${id}-title`}>
      <p className={base.kicker}>{labels.checkpoint}</p>
      <h2 id={`${id}-title`}>{checkpoint.question}</h2>
      <form onSubmit={(event) => {
        event.preventDefault();
        if (selected !== null) setChecked(true);
      }}>
        <fieldset>
          <legend className={styles.srOnly}>{checkpoint.question}</legend>
          {checkpoint.options.map((option, index) => (
            <label
              className={checked && index === checkpoint.correctIndex
                ? base.correctOption
                : checked && index === selected
                  ? base.incorrectOption
                  : base.option}
              key={option}
            >
              <input
                ref={index === 0 ? firstOptionRef : undefined}
                type="radio"
                name={`${id}-answer`}
                value={index}
                checked={selected === index}
                disabled={checked}
                onChange={() => setSelected(index)}
              />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
        {!checked ? (
          <button className={base.primaryButton} type="submit" disabled={selected === null}>
            {labels.checkAnswer}
          </button>
        ) : (
          <div
            className={`${correct ? base.correctFeedback : base.incorrectFeedback} ${base.focusTarget}`}
            ref={feedbackRef}
            role="status"
            tabIndex={-1}
          >
            <strong>{correct ? labels.correct : labels.incorrect}</strong>
            <p>{checkpoint.explanation}</p>
            {!correct ? (
              <button
                className={base.secondaryButton}
                type="button"
                onClick={() => {
                  retrying.current = true;
                  setSelected(null);
                  setChecked(false);
                }}
              >
                {labels.retryAssessment}
              </button>
            ) : null}
          </div>
        )}
      </form>
    </section>
  );
}

export type AiTutorAssessmentQuestion = AiTutorCheckpointCopy & {
  readonly id: AiTutorModuleSlug;
  readonly moduleTitle: string;
};

export function FinalAssessment({
  questions,
  labels,
}: {
  questions: readonly AiTutorAssessmentQuestion[];
  labels: Labels;
}) {
  const { progress, storageAvailable } = useAiTutorProgress();
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const current = questions[index];
  const correct = current ? selected === current.correctIndex : false;
  const savedBest = typeof progress[AI_TUTOR_QUIZ_BEST_KEY] === "number"
    ? progress[AI_TUTOR_QUIZ_BEST_KEY] as number
    : 0;
  const best = Math.max(savedBest, result?.score ?? 0);

  useEffect(() => {
    function resetAttempt() {
      setActive(false);
      setIndex(0);
      setSelected(null);
      setChecked(false);
      setAnswers({});
      setResult(null);
    }
    window.addEventListener(AI_TUTOR_PROGRESS_RESET_EVENT, resetAttempt);
    return () => window.removeEventListener(AI_TUTOR_PROGRESS_RESET_EVENT, resetAttempt);
  }, []);

  useEffect(() => {
    if (!active) return;
    if (result) resultRef.current?.focus();
    else if (checked) feedbackRef.current?.focus();
    else headingRef.current?.focus();
  }, [active, checked, index, result]);

  function begin(): void {
    setActive(true);
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setAnswers({});
    setResult(null);
  }

  function advance(): void {
    if (!current || selected === null) return;
    const nextAnswers = { ...answers, [current.id]: correct };
    if (index < questions.length - 1) {
      setAnswers(nextAnswers);
      setIndex((value) => value + 1);
      setSelected(null);
      setChecked(false);
      return;
    }
    const score = Object.values(nextAnswers).filter(Boolean).length;
    const criticalQuestions = questions.filter((question) => question.critical);
    const criticalPassed = criticalQuestions.every((question) => nextAnswers[question.id] === true);
    const passed = score >= 6 && criticalPassed;
    setAnswers(nextAnswers);
    setResult({ score, passed });
    updateAiTutorProgress((record) => {
      const priorBest = typeof record[AI_TUTOR_QUIZ_BEST_KEY] === "number"
        ? record[AI_TUTOR_QUIZ_BEST_KEY] as number
        : 0;
      record[AI_TUTOR_QUIZ_BEST_KEY] = Math.max(priorBest, score);
      if (passed) record[AI_TUTOR_QUIZ_PASSED_KEY] = true;
    });
  }

  return (
    <section
      className={base.finalQuiz}
      id="ai-tutor-final-assessment"
      aria-labelledby="ai-tutor-final-assessment-title"
      tabIndex={-1}
    >
      <header className={base.quizHeader}>
        <div>
          <p className={base.kicker}>{labels.finalAssessment}</p>
          <h2 id="ai-tutor-final-assessment-title">{labels.finalAssessmentTitle}</h2>
          <p>{labels.finalAssessmentIntro}</p>
        </div>
        <p className={base.quizRequirement}>
          <strong>6 / 8</strong><span>{labels.criticalBoundary}</span>
        </p>
      </header>
      {!storageAvailable ? (
        <p className={base.storageWarning} role="status">{labels.storageUnavailable}</p>
      ) : null}
      {!active ? (
        <div className={base.actionRow}>
          <button className={base.primaryButton} type="button" onClick={begin}>
            {labels.startAssessment}
          </button>
          <span className={base.quizMeta}>{formatAiTutorMessage(labels.bestScorePosition, {
            best,
            total: questions.length,
          })}</span>
        </div>
      ) : result ? (
        <div
          className={`${result.passed ? base.correctFeedback : base.incorrectFeedback} ${base.focusTarget}`}
          ref={resultRef}
          role="status"
          tabIndex={-1}
        >
          <strong>{result.passed ? labels.assessmentPassed : labels.assessmentNotPassed}</strong>
          <p>{formatAiTutorMessage(labels.scorePosition, {
            score: result.score,
            total: questions.length,
            best,
          })}</p>
          <button className={base.secondaryButton} type="button" onClick={begin}>
            {labels.retryAssessment}
          </button>
        </div>
      ) : current ? (
        <div className={base.quizQuestion}>
          <p className={base.quizMeta}>{formatAiTutorMessage(labels.questionPosition, {
            current: index + 1,
            total: questions.length,
            moduleTitle: current.moduleTitle,
          })}</p>
          <h3 ref={headingRef} tabIndex={-1}>{current.question}</h3>
          <fieldset>
            <legend className={styles.srOnly}>{current.question}</legend>
            {current.options.map((option, optionIndex) => (
              <label
                className={checked && optionIndex === current.correctIndex
                  ? base.correctOption
                  : checked && optionIndex === selected
                    ? base.incorrectOption
                    : base.option}
                key={option}
              >
                <input
                  type="radio"
                  name={`assessment-${current.id}`}
                  value={optionIndex}
                  checked={selected === optionIndex}
                  disabled={checked}
                  onChange={() => setSelected(optionIndex)}
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
          {!checked ? (
            <button
              className={base.primaryButton}
              type="button"
              disabled={selected === null}
              onClick={() => setChecked(true)}
            >
              {labels.checkAnswer}
            </button>
          ) : (
            <div
              className={`${correct ? base.correctFeedback : base.incorrectFeedback} ${base.focusTarget}`}
              ref={feedbackRef}
              role="status"
              tabIndex={-1}
            >
              <strong>{correct ? labels.correct : labels.incorrect}</strong>
              <p>{current.explanation}</p>
              <button className={base.primaryButton} type="button" onClick={advance}>
                {index === questions.length - 1 ? labels.finishAssessment : labels.nextQuestion}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

export function CapstoneChecklist({
  artifacts,
  statement,
  labels,
}: {
  artifacts: readonly string[];
  statement: string;
  labels: Labels;
}) {
  const { progress, storageAvailable } = useAiTutorProgress();
  const alreadyComplete = progress[AI_TUTOR_CAPSTONE_KEY] === true;
  const [checked, setChecked] = useState<boolean[]>(() => artifacts.map(() => alreadyComplete));
  const [attested, setAttested] = useState(alreadyComplete);
  const statusRef = useRef<HTMLDivElement>(null);
  const allReady = checked.every(Boolean) && attested;

  useEffect(() => {
    function resetChecklist() {
      setChecked(artifacts.map(() => false));
      setAttested(false);
    }
    window.addEventListener(AI_TUTOR_PROGRESS_RESET_EVENT, resetChecklist);
    return () => window.removeEventListener(AI_TUTOR_PROGRESS_RESET_EVENT, resetChecklist);
  }, [artifacts]);

  useEffect(() => {
    if (alreadyComplete) statusRef.current?.focus();
  }, [alreadyComplete]);

  return (
    <section
      className={base.capstone}
      id="ai-tutor-capstone"
      aria-labelledby="ai-tutor-capstone-checklist-title"
      tabIndex={-1}
    >
      <h3 id="ai-tutor-capstone-checklist-title">{labels.capstoneArtifacts}</h3>
      <p>{labels.capstoneInstructions}</p>
      {!storageAvailable ? (
        <p className={base.storageWarning} role="status">{labels.storageUnavailable}</p>
      ) : null}
      <div className={styles.artifactChecklist}>
        {artifacts.map((artifact, index) => (
          <label className={base.capstoneItem} key={artifact}>
            <input
              type="checkbox"
              checked={checked[index]}
              disabled={alreadyComplete}
              onChange={(event) => {
                const next = [...checked];
                next[index] = event.target.checked;
                setChecked(next);
              }}
            />
            <span><strong>{String(index + 1).padStart(2, "0")}</strong>{artifact}</span>
          </label>
        ))}
      </div>
      <label className={`${base.capstoneItem} ${styles.attestation}`}>
        <input
          type="checkbox"
          checked={attested}
          disabled={alreadyComplete}
          onChange={(event) => setAttested(event.target.checked)}
        />
        <span>{statement}</span>
      </label>
      <div className={base.actionRow}>
        <button
          className={alreadyComplete ? base.completeButton : base.primaryButton}
          type="button"
          disabled={!allReady || alreadyComplete}
          onClick={() => {
            updateAiTutorProgress((record) => {
              record[AI_TUTOR_CAPSTONE_KEY] = true;
            });
          }}
        >
          {alreadyComplete ? labels.capstoneComplete : labels.markCapstoneComplete}
        </button>
      </div>
      <div
        className={alreadyComplete ? base.correctFeedback : styles.srOnly}
        ref={statusRef}
        role="status"
        tabIndex={-1}
      >
        {alreadyComplete ? <strong>{labels.capstoneComplete}</strong> : null}
      </div>
    </section>
  );
}
