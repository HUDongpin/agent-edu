"use client";

import { useEffect, useRef, useState } from "react";
import type { RagCheckpointCopy, RagCourseCopy, RagLessonSlug } from "@/lib/rag";
import { formatDeterministicInteger } from "@/lib/deterministic-format";
import {
  RAG_CAPSTONE_DRAFT_KEY,
  RAG_CAPSTONE_KEY,
  RAG_RESET_EVENT,
  RAG_QUIZ_BEST_KEY,
  RAG_QUIZ_DRAFT_KEY,
  RAG_QUIZ_PASSED_KEY,
  ragPracticeKey,
  resetRagProgress,
  updateRagProgress,
} from "./progress-store";
import useRagHydrated from "./useRagHydrated";
import useRagProgress from "./useRagProgress";
import styles from "../prompts/PromptCourse.module.css";
import courseStyles from "./RagCourse.module.css";
import { useI18n } from "../I18nProvider";

type Labels = RagCourseCopy["ui"];

function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{([^}]+)\}/g, (match, key: string) => (
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  ));
}

function validQuizBest(value: unknown, questionCount: number): number {
  return typeof value === "number"
    && Number.isSafeInteger(value)
    && value >= 0
    && value <= questionCount
    ? value
    : 0;
}

export function PracticeCompletion({ slug, labels }: { slug: RagLessonSlug; labels: Labels }) {
  const { progress, storageAvailable } = useRagProgress();
  const hydrated = useRagHydrated();
  const key = ragPracticeKey(slug);
  const complete = progress[key] === true;

  return (
    <section className={styles.completion} aria-label={labels.courseProgress} aria-busy={!hydrated}>
      <div>
        <strong aria-live="polite">
          {complete ? labels.practiceComplete : labels.markPracticeComplete}
        </strong>
        <p>{labels.browserStorageNote}</p>
        {!storageAvailable ? <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p> : null}
      </div>
      <button
        className={complete ? styles.completeButton : styles.primaryButton}
        type="button"
        disabled={!hydrated}
        onClick={() => {
          updateRagProgress((record) => {
            if (complete) delete record[key];
            else record[key] = true;
          });
        }}
      >
        {complete ? labels.undoPracticeComplete : labels.markPracticeComplete}
      </button>
    </section>
  );
}

export function CourseProgressTools({ labels }: { labels: Labels }) {
  const { progress, storageAvailable } = useRagProgress();
  const hydrated = useRagHydrated();
  const [resetStatus, setResetStatus] = useState("");
  const [resetCount, setResetCount] = useState(0);
  const resetStatusRef = useRef<HTMLParagraphElement>(null);
  const hasProgress = Object.keys(progress).some((key) => key.startsWith("rag."));

  useEffect(() => {
    if (resetCount > 0) resetStatusRef.current?.focus();
  }, [resetCount]);

  return (
    <details
      className={courseStyles.progressTools}
      data-testid="rag-progress-tools"
      data-rag-hydrated={hydrated ? "true" : "false"}
    >
      <summary>{labels.manageProgress}</summary>
      <div className={courseStyles.progressToolsBody}>
        <p>{labels.browserStorageNote}</p>
        {!storageAvailable ? <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p> : null}
        <button
          className={styles.secondaryButton}
          type="button"
          disabled={!hydrated || !hasProgress}
          onClick={() => {
            if (!window.confirm(labels.resetConfirm)) return;
            resetRagProgress();
            setResetStatus(labels.resetDone);
            setResetCount((value) => value + 1);
          }}
        >
          {labels.resetProgress}
        </button>
        <p
          className={`${resetStatus ? styles.resetStatus : styles.srOnly} ${styles.focusTarget}`}
          key={resetCount}
          ref={resetStatusRef}
          role="status"
          tabIndex={-1}
        >
          {resetStatus}
        </p>
      </div>
    </details>
  );
}

export function LessonCheckpoint({
  checkpoint,
  labels,
  id,
}: {
  checkpoint: RagCheckpointCopy;
  labels: Labels;
  id: string;
}) {
  const hydrated = useRagHydrated();
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [selectionError, setSelectionError] = useState(false);
  const firstOptionRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const focusOptionsAfterRetry = useRef(false);
  const correct = selected === checkpoint.correctIndex;

  useEffect(() => {
    if (checked) {
      feedbackRef.current?.focus();
    } else if (focusOptionsAfterRetry.current) {
      focusOptionsAfterRetry.current = false;
      firstOptionRef.current?.focus();
    }
  }, [checked]);

  return (
    <section className={styles.checkpoint} aria-labelledby={`${id}-title`} aria-busy={!hydrated}>
      <p className={styles.kicker}>{labels.checkpoint}</p>
      <h2 id={`${id}-title`}>{checkpoint.question}</h2>
      <form onSubmit={(event) => {
        event.preventDefault();
        if (selected === null) {
          setSelectionError(true);
          firstOptionRef.current?.focus();
          return;
        }
        setSelectionError(false);
        setChecked(true);
      }}>
        <fieldset aria-describedby={selectionError ? `${id}-selection-error` : undefined}>
          <legend className={styles.srOnly}>{checkpoint.question}</legend>
          {checkpoint.options.map((option, index) => (
            <label
              className={checked && index === checkpoint.correctIndex
                ? styles.correctOption
                : checked && index === selected
                  ? styles.incorrectOption
                  : styles.option}
              key={option}
            >
              <input
                ref={index === 0 ? firstOptionRef : undefined}
                type="radio"
                name={`${id}-answer`}
                value={index}
                checked={selected === index}
                disabled={!hydrated || checked}
                onChange={() => {
                  setSelected(index);
                  setSelectionError(false);
                }}
              />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
        {selectionError ? (
          <p className={courseStyles.selectionError} id={`${id}-selection-error`} role="alert">
            {labels.selectAnswer}
          </p>
        ) : null}
        {!checked ? (
          <button className={styles.primaryButton} type="submit" disabled={!hydrated}>
            {labels.checkAnswer}
          </button>
        ) : (
          <div
            className={`${correct ? styles.correctFeedback : styles.incorrectFeedback} ${styles.focusTarget}`}
            ref={feedbackRef}
            role="status"
            tabIndex={-1}
          >
            <strong>{correct ? labels.correct : labels.incorrect}</strong>
            <p>{checkpoint.explanation}</p>
            {!correct ? (
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => {
                  focusOptionsAfterRetry.current = true;
                  setSelected(null);
                  setSelectionError(false);
                  setChecked(false);
                }}
              >
                {labels.retryQuiz}
              </button>
            ) : null}
          </div>
        )}
      </form>
    </section>
  );
}

export type RagQuizQuestion = RagCheckpointCopy & {
  readonly id: RagLessonSlug;
  readonly unitTitle: string;
  readonly sourceTitle: string;
  readonly sourceUrl: string;
};

type RagQuizDraft = {
  readonly version: 1;
  readonly index: number;
  readonly selected: number | null;
  readonly answers: Readonly<Record<string, boolean>>;
};

function parseQuizDraft(value: unknown, questions: readonly RagQuizQuestion[]): RagQuizDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<RagQuizDraft>;
  if (candidate.version !== 1 || !Number.isInteger(candidate.index)) return null;
  const index = candidate.index as number;
  if (index < 0 || index >= questions.length) return null;
  if (candidate.selected !== null && (
    !Number.isInteger(candidate.selected)
    || (candidate.selected as number) < 0
    || (candidate.selected as number) > 3
  )) return null;
  if (!candidate.answers || typeof candidate.answers !== "object" || Array.isArray(candidate.answers)) return null;
  const validIds = new Set(questions.map((question) => question.id));
  const answers: Record<string, boolean> = {};
  for (const [id, answer] of Object.entries(candidate.answers)) {
    if (!validIds.has(id as RagLessonSlug) || typeof answer !== "boolean") return null;
    answers[id] = answer;
  }
  return { version: 1, index, selected: candidate.selected as number | null, answers };
}

export function FinalQuiz({ questions, labels }: { questions: readonly RagQuizQuestion[]; labels: Labels }) {
  const { locale } = useI18n();
  const { progress, storageAvailable } = useRagProgress();
  const hydrated = useRagHydrated();
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState<number | null>(null);
  const [selectionError, setSelectionError] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const questionFeedbackRef = useRef<HTMLDivElement>(null);
  const quizResultRef = useRef<HTMLDivElement>(null);
  const reviewHeadingRef = useRef<HTMLHeadingElement>(null);
  const current = questions[index];
  const answered = current ? answers[current.id] !== undefined : false;
  const savedBest = validQuizBest(progress[RAG_QUIZ_BEST_KEY], questions.length);
  const best = Math.max(savedBest, score ?? 0);
  const number = (value: number) => formatDeterministicInteger(value, locale);
  const missedQuestions = questions.filter((question) => answers[question.id] === false);
  const reviewQuestion = missedQuestions[reviewIndex];

  useEffect(() => {
    function resetAttempt() {
      setActive(false);
      setIndex(0);
      setSelected(null);
      setAnswers({});
      setScore(null);
      setSelectionError(false);
      setReviewing(false);
      setReviewIndex(0);
    }
    window.addEventListener(RAG_RESET_EVENT, resetAttempt);
    return () => window.removeEventListener(RAG_RESET_EVENT, resetAttempt);
  }, []);

  useEffect(() => {
    if (!active) return;
    if (score !== null && reviewing) {
      reviewHeadingRef.current?.focus();
    } else if (score !== null) {
      quizResultRef.current?.focus();
    } else if (answered) {
      questionFeedbackRef.current?.focus();
    } else {
      questionHeadingRef.current?.focus();
    }
  }, [active, answered, index, reviewing, reviewIndex, score]);

  useEffect(() => {
    if (!hydrated || !active) return;
    updateRagProgress((record) => {
      if (score !== null) {
        delete record[RAG_QUIZ_DRAFT_KEY];
        return;
      }
      record[RAG_QUIZ_DRAFT_KEY] = {
        version: 1,
        index,
        selected,
        answers,
      } satisfies RagQuizDraft;
    });
  }, [active, answers, hydrated, index, score, selected]);

  function begin() {
    const draft = score === null
      ? parseQuizDraft(progress[RAG_QUIZ_DRAFT_KEY], questions)
      : null;
    setActive(true);
    setIndex(draft?.index ?? 0);
    setSelected(draft?.selected ?? null);
    setAnswers(draft ? { ...draft.answers } : {});
    setScore(null);
    setSelectionError(false);
    setReviewing(false);
    setReviewIndex(0);
    if (!draft) {
      updateRagProgress((record) => { delete record[RAG_QUIZ_DRAFT_KEY]; });
    }
  }

  function advance() {
    if (!current || !answered) return;
    if (index < questions.length - 1) {
      setIndex((value) => value + 1);
      setSelected(null);
      setSelectionError(false);
      return;
    }
    const finalScore = Object.values(answers).filter(Boolean).length;
    setScore(finalScore);
    updateRagProgress((record) => {
      const previousBest = validQuizBest(record[RAG_QUIZ_BEST_KEY], questions.length);
      const nextBest = Math.max(previousBest, finalScore);
      record[RAG_QUIZ_BEST_KEY] = nextBest;
      if (finalScore >= 9 || previousBest >= 9) record[RAG_QUIZ_PASSED_KEY] = true;
      else delete record[RAG_QUIZ_PASSED_KEY];
      delete record[RAG_QUIZ_DRAFT_KEY];
    });
  }

  return (
    <section
      className={`${styles.finalQuiz} ${styles.focusTarget}`}
      id="rag-final-quiz"
      aria-labelledby="rag-final-quiz-title"
      aria-busy={!hydrated}
      tabIndex={-1}
    >
      <header className={styles.quizHeader}>
        <div>
          <p className={styles.kicker}>{labels.finalQuiz}</p>
          <h2 id="rag-final-quiz-title">{labels.finalQuiz}</h2>
          <p>{labels.quizIntro}</p>
        </div>
        <div className={styles.quizRequirement}>
          <strong>{labels.passRequirement}</strong>
          <span>{format(labels.bestScore, { score: number(best), total: number(questions.length) })}</span>
        </div>
      </header>
      {!storageAvailable ? <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p> : null}
      {!active ? (
        <button
          className={styles.primaryButton}
          type="button"
          tabIndex={0}
          disabled={!hydrated}
          onClick={begin}
        >
          {labels.beginQuiz}
        </button>
      ) : score !== null && reviewing && reviewQuestion ? (
        <div className={`${courseStyles.quizReview} ${styles.focusTarget}`}>
          <div className={styles.quizMeta}>
            <span>{format(labels.questionProgress, {
              current: number(reviewIndex + 1),
              total: number(missedQuestions.length),
            })}</span>
            <span>{reviewQuestion.unitTitle}</span>
          </div>
          <h3 className={styles.focusTarget} ref={reviewHeadingRef} tabIndex={-1}>
            {reviewQuestion.question}
          </h3>
          <div className={styles.correctFeedback}>
            <strong>{labels.correctAnswer}</strong>
            <p>{reviewQuestion.options[reviewQuestion.correctIndex]}</p>
            <p>{reviewQuestion.explanation}</p>
            <a href={reviewQuestion.sourceUrl} target="_blank" rel="noopener noreferrer">
              {labels.source}: {reviewQuestion.sourceTitle}
            </a>
          </div>
          <div className={courseStyles.quizReviewActions}>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={reviewIndex === 0}
              onClick={() => setReviewIndex((value) => Math.max(0, value - 1))}
            >
              {labels.previousMissedQuestion}
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={reviewIndex === missedQuestions.length - 1}
              onClick={() => setReviewIndex((value) => Math.min(missedQuestions.length - 1, value + 1))}
            >
              {labels.nextMissedQuestion}
            </button>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={() => setReviewing(false)}
            >
              {labels.backToResults}
            </button>
          </div>
        </div>
      ) : score !== null ? (
        <div
          className={`${score >= 9 ? styles.correctFeedback : styles.incorrectFeedback} ${styles.focusTarget}`}
          ref={quizResultRef}
          role="status"
          tabIndex={-1}
        >
          <strong>{format(labels.scoreSummary, { score: number(score), total: number(questions.length) })}</strong>
          <p>{score >= 9 ? labels.quizPassed : labels.quizNeedsReview}</p>
          <div className={courseStyles.quizResultActions}>
            {missedQuestions.length > 0 ? (
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => {
                  setReviewIndex(0);
                  setReviewing(true);
                }}
              >
                {labels.reviewMissedAnswers}
              </button>
            ) : null}
            <button className={styles.secondaryButton} type="button" onClick={begin}>{labels.retryQuiz}</button>
          </div>
        </div>
      ) : current ? (
        <form
          className={styles.quizQuestion}
          onSubmit={(event) => {
            event.preventDefault();
            if (answered) return;
            if (selected === null) {
              setSelectionError(true);
              event.currentTarget.querySelector<HTMLInputElement>('input[type="radio"]')?.focus();
              return;
            }
            setSelectionError(false);
            setAnswers((existing) => ({ ...existing, [current.id]: selected === current.correctIndex }));
          }}
        >
          <div className={styles.quizMeta}>
            <span>{format(labels.questionProgress, {
              current: number(index + 1),
              total: number(questions.length),
            })}</span>
            <span>{current.unitTitle}</span>
          </div>
          <h3 className={styles.focusTarget} ref={questionHeadingRef} tabIndex={-1}>{current.question}</h3>
          <fieldset aria-describedby={selectionError ? `${current.id}-selection-error` : undefined}>
            <legend className={styles.srOnly}>{current.question}</legend>
            {current.options.map((option, optionIndex) => (
              <label
                className={answered && optionIndex === current.correctIndex
                  ? styles.correctOption
                  : answered && optionIndex === selected
                    ? styles.incorrectOption
                    : styles.option}
                key={option}
              >
                <input
                  type="radio"
                  name={current.id}
                  value={optionIndex}
                  checked={selected === optionIndex}
                  disabled={answered}
                  onChange={() => {
                    setSelected(optionIndex);
                    setSelectionError(false);
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
          {selectionError ? (
            <p className={courseStyles.selectionError} id={`${current.id}-selection-error`} role="alert">
              {labels.selectAnswer}
            </p>
          ) : null}
          {!answered ? (
            <button className={styles.primaryButton} type="submit">
              {labels.checkAnswer}
            </button>
          ) : (
            <div
              className={`${answers[current.id] ? styles.correctFeedback : styles.incorrectFeedback} ${styles.focusTarget}`}
              ref={questionFeedbackRef}
              role="status"
              tabIndex={-1}
            >
              <strong>{answers[current.id] ? labels.correct : labels.incorrect}</strong>
              <p>{current.explanation}</p>
              <a href={current.sourceUrl} target="_blank" rel="noopener noreferrer">
                {labels.source}: {current.sourceTitle}
              </a>
              <button className={styles.primaryButton} type="button" onClick={advance}>
                {index === questions.length - 1 ? labels.finishQuiz : labels.nextQuestion}
              </button>
            </div>
          )}
        </form>
      ) : null}
    </section>
  );
}

export function CapstoneChecklist({
  required,
  rubric,
  labels,
}: {
  required: readonly string[];
  rubric: readonly string[];
  labels: Labels;
}) {
  const { progress, storageAvailable } = useRagProgress();
  const hydrated = useRagHydrated();
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [draftReady, setDraftReady] = useState(false);
  const recorded = progress[RAG_CAPSTONE_KEY] === true;
  const previousRecorded = useRef(recorded);
  const recordRequested = useRef(false);
  const reopenRequested = useRef(false);
  const recordedStatusRef = useRef<HTMLParagraphElement>(null);
  const firstArtifactRef = useRef<HTMLInputElement>(null);
  const [statusText, setStatusText] = useState("");
  const allChecked = required.every((_item, index) => checked[index]);

  useEffect(() => {
    if (!hydrated || draftReady) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const value = progress[RAG_CAPSTONE_DRAFT_KEY];
      if (!recorded && value && typeof value === "object" && !Array.isArray(value)) {
        const candidate = value as { version?: unknown; checked?: unknown };
        if (candidate.version === 1 && Array.isArray(candidate.checked)) {
          const restored: Record<number, boolean> = {};
          candidate.checked.slice(0, required.length).forEach((item, index) => {
            if (item === true) restored[index] = true;
          });
          setChecked(restored);
        }
      }
      setDraftReady(true);
    });
    return () => { cancelled = true; };
  }, [draftReady, hydrated, progress, recorded, required.length]);

  useEffect(() => {
    if (!hydrated || !draftReady || recorded) return;
    updateRagProgress((record) => {
      if (!Object.values(checked).some(Boolean)) {
        delete record[RAG_CAPSTONE_DRAFT_KEY];
        return;
      }
      record[RAG_CAPSTONE_DRAFT_KEY] = {
        version: 1,
        checked: required.map((_item, index) => Boolean(checked[index])),
      };
    });
  }, [checked, draftReady, hydrated, recorded, required]);

  useEffect(() => {
    if (previousRecorded.current && !recorded) {
      if (reopenRequested.current) {
        reopenRequested.current = false;
        setChecked(Object.fromEntries(required.map((_item, index) => [index, true])));
        window.requestAnimationFrame(() => firstArtifactRef.current?.focus());
      } else {
        setChecked({});
      }
    }
    if (recordRequested.current && recorded) {
      recordRequested.current = false;
      setStatusText(labels.capstoneComplete);
    }
    previousRecorded.current = recorded;
  }, [labels.capstoneComplete, recorded, required]);

  useEffect(() => {
    if (recorded && statusText === labels.capstoneComplete) {
      recordedStatusRef.current?.focus();
    }
  }, [labels.capstoneComplete, recorded, statusText]);

  useEffect(() => {
    function resetChecklist() {
      setChecked({});
      setDraftReady(true);
      setStatusText("");
      reopenRequested.current = false;
      recordRequested.current = false;
    }
    window.addEventListener(RAG_RESET_EVENT, resetChecklist);
    return () => window.removeEventListener(RAG_RESET_EVENT, resetChecklist);
  }, []);

  return (
    <section
      className={`${styles.capstone} ${styles.focusTarget}`}
      id="rag-capstone"
      aria-labelledby="rag-capstone-title"
      aria-busy={!hydrated}
      tabIndex={-1}
    >
      <p className={styles.kicker}>{labels.capstone}</p>
      <h2 id="rag-capstone-title">{labels.capstoneStatus}</h2>
      <div className={styles.capstoneGrid}>
        <div>
          <h3>{labels.evidence}</h3>
          {required.map((item, index) => (
            <label className={styles.capstoneItem} key={item}>
              <input
                ref={index === 0 ? firstArtifactRef : undefined}
                type="checkbox"
                tabIndex={0}
                name={`rag-capstone-artifact-${index + 1}`}
                autoComplete="off"
                checked={Boolean(checked[index]) || recorded}
                disabled={!hydrated || recorded}
                onChange={(event) => setChecked((current) => ({ ...current, [index]: event.target.checked }))}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
        <div>
          <h3>{labels.successCriteria}</h3>
          <ol>{rubric.map((item) => <li key={item}>{item}</li>)}</ol>
        </div>
      </div>
      {!storageAvailable ? <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p> : null}
      {recorded ? (
        <button
          className={styles.secondaryButton}
          type="button"
          disabled={!hydrated}
          onClick={() => {
            reopenRequested.current = true;
            setStatusText(labels.capstoneReopened);
            updateRagProgress((record) => {
              delete record[RAG_CAPSTONE_KEY];
              record[RAG_CAPSTONE_DRAFT_KEY] = {
                version: 1,
                checked: required.map(() => true),
              };
            });
          }}
        >
          {labels.reopenCapstone}
        </button>
      ) : (
        <button
          className={styles.primaryButton}
          type="button"
          disabled={!hydrated || !allChecked}
          onClick={() => {
            recordRequested.current = true;
            updateRagProgress((record) => {
              record[RAG_CAPSTONE_KEY] = true;
              delete record[RAG_CAPSTONE_DRAFT_KEY];
            });
          }}
        >
          {labels.recordCapstone}
        </button>
      )}
      {statusText ? (
        <p className={`${styles.resetStatus} ${styles.focusTarget}`} ref={recordedStatusRef} role="status" tabIndex={-1}>
          {statusText}
        </p>
      ) : null}
    </section>
  );
}
