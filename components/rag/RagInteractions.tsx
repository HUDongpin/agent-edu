"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { RagCheckpointCopy, RagCourseCopy, RagLessonSlug } from "@/lib/rag";
import {
  RAG_CAPSTONE_DRAFT_KEY,
  RAG_CAPSTONE_KEY,
  RAG_PROGRESS_EVENT,
  RAG_RESET_EVENT,
  RAG_QUIZ_BEST_KEY,
  RAG_QUIZ_DRAFT_KEY,
  RAG_QUIZ_PASSED_KEY,
  isRagProgressStorageAvailable,
  ragPracticeKey,
  readRagProgress,
  resetRagProgress,
  updateRagProgress,
  type RagProgressRecord,
} from "./progress-store";
import useRagHydrated from "./useRagHydrated";
import styles from "../prompts/PromptCourse.module.css";
import { useI18n } from "../I18nProvider";

type Labels = RagCourseCopy["ui"];

function format(template: string, values: Record<string, number>): string {
  return template.replace(/\{([^}]+)\}/g, (match, key: string) => (
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  ));
}

function subscribe(notify: () => void): () => void {
  window.addEventListener(RAG_PROGRESS_EVENT, notify);
  window.addEventListener("storage", notify);
  window.addEventListener("focus", notify);
  return () => {
    window.removeEventListener(RAG_PROGRESS_EVENT, notify);
    window.removeEventListener("storage", notify);
    window.removeEventListener("focus", notify);
  };
}

function progressSnapshot(): string {
  return JSON.stringify(readRagProgress());
}

function useRagProgress() {
  const serialised = useSyncExternalStore(subscribe, progressSnapshot, () => "{}");
  const storageAvailable = useSyncExternalStore(
    subscribe,
    isRagProgressStorageAvailable,
    () => true,
  );
  let progress: RagProgressRecord = {};
  try {
    const value: unknown = JSON.parse(serialised);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      progress = value as RagProgressRecord;
    }
  } catch {
    progress = {};
  }
  return { progress, storageAvailable };
}

export function PracticeCompletion({ slug, labels }: { slug: RagLessonSlug; labels: Labels }) {
  const { progress, storageAvailable } = useRagProgress();
  const hydrated = useRagHydrated();
  const key = ragPracticeKey(slug);
  const complete = progress[key] === true;

  return (
    <section className={styles.completion} aria-label={labels.courseProgress}>
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
        disabled={!hydrated || complete}
        onClick={() => {
          if (complete) return;
          updateRagProgress((record) => { record[key] = true; });
        }}
      >
        {complete ? labels.markedPracticeComplete : labels.markPracticeComplete}
      </button>
    </section>
  );
}

export function CourseProgress({
  lessons,
  labels,
  startLabel,
  resumeLabel,
}: {
  lessons: readonly { slug: RagLessonSlug; href: string }[];
  labels: Labels;
  startLabel: string;
  resumeLabel: string;
}) {
  const { t } = useI18n();
  const { progress, storageAvailable } = useRagProgress();
  const hydrated = useRagHydrated();
  const [resetStatus, setResetStatus] = useState("");
  const [resetCount, setResetCount] = useState(0);
  const resetStatusRef = useRef<HTMLParagraphElement>(null);
  const state = useMemo(() => {
    const practices = lessons.filter((lesson) => progress[ragPracticeKey(lesson.slug)] === true).length;
    const quiz = progress[RAG_QUIZ_PASSED_KEY] === true ? 1 : 0;
    const capstone = progress[RAG_CAPSTONE_KEY] === true ? 1 : 0;
    const complete = practices + quiz + capstone;
    const total = lessons.length + 2;
    const nextLesson = lessons.find((lesson) => progress[ragPracticeKey(lesson.slug)] !== true);
    const courseCompleted = complete === total;
    const nextHref = courseCompleted
      ? lessons[0]?.href ?? null
      : nextLesson?.href ?? (quiz ? "#rag-capstone" : "#rag-final-quiz");
    return { complete, total, courseCompleted, percent: Math.round((complete / total) * 100), nextHref };
  }, [lessons, progress]);
  const hasProgress = Object.keys(progress).some((key) => key.startsWith("rag."));

  useEffect(() => {
    if (resetCount > 0) resetStatusRef.current?.focus();
  }, [resetCount]);

  return (
    <section
      className={styles.progressPanel}
      aria-labelledby="rag-progress-title"
      data-rag-hydrated={hydrated ? "true" : "false"}
    >
      <div className={styles.progressHeading}>
        <div>
          <h2 id="rag-progress-title">{labels.courseProgress}</h2>
          <p>{labels.browserStorageNote}</p>
        </div>
        <output className={styles.progressValue} aria-live="polite">
          <strong>{state.percent}%</strong>
          <span>{state.complete} / {state.total}</span>
        </output>
      </div>
      {!storageAvailable ? <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p> : null}
      <progress
        aria-labelledby="rag-progress-title"
        className={styles.progressBar}
        max={state.total}
        value={state.complete}
      >
        {state.percent}%
      </progress>
      <div className={styles.actionRow}>
        {state.nextHref ? (
          <Link
            className={styles.primaryButton}
            href={state.nextHref}
            data-course-journey-action
            onClick={() => {
              if (!state.nextHref?.startsWith("#")) return;
              window.requestAnimationFrame(() => {
                document.querySelector<HTMLElement>(state.nextHref!)?.focus();
              });
            }}
          >
            {state.courseCompleted ? t("cat.review") : hasProgress ? resumeLabel : startLabel}<span aria-hidden="true">→</span>
          </Link>
        ) : null}
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
      </div>
      <p
        className={`${resetStatus ? styles.resetStatus : styles.srOnly} ${styles.focusTarget}`}
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
    <section className={styles.checkpoint} aria-labelledby={`${id}-title`}>
      <p className={styles.kicker}>{labels.checkpoint}</p>
      <h2 id={`${id}-title`}>{checkpoint.question}</h2>
      <form onSubmit={(event) => { event.preventDefault(); if (selected !== null) setChecked(true); }}>
        <fieldset>
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
                onChange={() => setSelected(index)}
              />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
        {!checked ? (
          <button className={styles.primaryButton} type="submit" disabled={!hydrated || selected === null}>
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
  const { progress, storageAvailable } = useRagProgress();
  const hydrated = useRagHydrated();
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState<number | null>(null);
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const questionFeedbackRef = useRef<HTMLDivElement>(null);
  const quizResultRef = useRef<HTMLDivElement>(null);
  const current = questions[index];
  const answered = current ? answers[current.id] !== undefined : false;
  const savedBest = typeof progress[RAG_QUIZ_BEST_KEY] === "number"
    ? progress[RAG_QUIZ_BEST_KEY] as number
    : 0;
  const best = Math.max(savedBest, score ?? 0);

  useEffect(() => {
    function resetAttempt() {
      setActive(false);
      setIndex(0);
      setSelected(null);
      setAnswers({});
      setScore(null);
    }
    window.addEventListener(RAG_RESET_EVENT, resetAttempt);
    return () => window.removeEventListener(RAG_RESET_EVENT, resetAttempt);
  }, []);

  useEffect(() => {
    if (!active) return;
    if (score !== null) {
      quizResultRef.current?.focus();
    } else if (answered) {
      questionFeedbackRef.current?.focus();
    } else {
      questionHeadingRef.current?.focus();
    }
  }, [active, answered, index, score]);

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
    if (!draft) {
      updateRagProgress((record) => { delete record[RAG_QUIZ_DRAFT_KEY]; });
    }
  }

  function advance() {
    if (!current || !answered) return;
    if (index < questions.length - 1) {
      setIndex((value) => value + 1);
      setSelected(null);
      return;
    }
    const finalScore = Object.values(answers).filter(Boolean).length;
    setScore(finalScore);
    updateRagProgress((record) => {
      const previousBest = typeof record[RAG_QUIZ_BEST_KEY] === "number"
        ? record[RAG_QUIZ_BEST_KEY] as number
        : 0;
      record[RAG_QUIZ_BEST_KEY] = Math.max(previousBest, finalScore);
      if (finalScore >= 9) record[RAG_QUIZ_PASSED_KEY] = true;
      delete record[RAG_QUIZ_DRAFT_KEY];
    });
  }

  return (
    <section
      className={`${styles.finalQuiz} ${styles.focusTarget}`}
      id="rag-final-quiz"
      aria-labelledby="rag-final-quiz-title"
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
          <span>{format(labels.bestScore, { score: best, total: questions.length })}</span>
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
      ) : score !== null ? (
        <div
          className={`${score >= 9 ? styles.correctFeedback : styles.incorrectFeedback} ${styles.focusTarget}`}
          ref={quizResultRef}
          role="status"
          tabIndex={-1}
        >
          <strong>{format(labels.scoreSummary, { score, total: questions.length })}</strong>
          <p>{score >= 9 ? labels.quizPassed : labels.quizNeedsReview}</p>
          <button className={styles.secondaryButton} type="button" onClick={begin}>{labels.retryQuiz}</button>
        </div>
      ) : current ? (
        <form
          className={styles.quizQuestion}
          onSubmit={(event) => {
            event.preventDefault();
            if (selected === null || answered) return;
            setAnswers((existing) => ({ ...existing, [current.id]: selected === current.correctIndex }));
          }}
        >
          <div className={styles.quizMeta}>
            <span>{format(labels.questionProgress, { current: index + 1, total: questions.length })}</span>
            <span>{current.unitTitle}</span>
          </div>
          <h3 className={styles.focusTarget} ref={questionHeadingRef} tabIndex={-1}>{current.question}</h3>
          <fieldset>
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
                  onChange={() => setSelected(optionIndex)}
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
          {!answered ? (
            <button className={styles.primaryButton} type="submit" disabled={selected === null}>
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
  const recordedStatusRef = useRef<HTMLParagraphElement>(null);
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
    if (previousRecorded.current && !recorded) setChecked({});
    if (recordRequested.current && recorded) {
      recordRequested.current = false;
      recordedStatusRef.current?.focus();
    }
    previousRecorded.current = recorded;
  }, [recorded]);

  useEffect(() => {
    function resetChecklist() {
      setChecked({});
      setDraftReady(true);
    }
    window.addEventListener(RAG_RESET_EVENT, resetChecklist);
    return () => window.removeEventListener(RAG_RESET_EVENT, resetChecklist);
  }, []);

  return (
    <section
      className={`${styles.capstone} ${styles.focusTarget}`}
      id="rag-capstone"
      aria-labelledby="rag-capstone-title"
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
      <button
        className={recorded ? styles.completeButton : styles.primaryButton}
        type="button"
        disabled={!hydrated || recorded || !allChecked}
        onClick={() => {
          recordRequested.current = true;
          updateRagProgress((record) => {
            record[RAG_CAPSTONE_KEY] = true;
            delete record[RAG_CAPSTONE_DRAFT_KEY];
          });
        }}
      >
        {recorded ? labels.capstoneComplete : labels.recordCapstone}
      </button>
      {recorded ? (
        <p className={`${styles.resetStatus} ${styles.focusTarget}`} ref={recordedStatusRef} role="status" tabIndex={-1}>
          {labels.capstoneComplete}
        </p>
      ) : null}
    </section>
  );
}
