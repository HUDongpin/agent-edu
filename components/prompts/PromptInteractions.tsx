"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type {
  PromptCapstoneRubricCopy,
  PromptCheckpointCopy,
  PromptCourseCopy,
  PromptFinalQuizQuestionCopy,
  PromptLessonSlug,
} from "@/lib/prompts";
import { promptCapstoneScoresPass } from "@/lib/prompts";
import {
  PROMPT_CAPSTONE_KEY,
  PROMPT_CAPSTONE_REQUIRED_KEY,
  PROMPT_CAPSTONE_SCORES_KEY,
  PROMPT_PROGRESS_EVENT,
  PROMPT_QUIZ_BEST_KEY,
  PROMPT_QUIZ_PASSED_KEY,
  isPromptProgressStorageAvailable,
  promptPracticeKey,
  readPromptProgress,
  resetPromptProgress,
  updatePromptProgress,
  type PromptProgressRecord,
} from "./progress-store";
import styles from "./PromptCourse.module.css";

type Labels = PromptCourseCopy["ui"];

function format(template: string, values: Record<string, number>): string {
  return template.replace(/\{([^}]+)\}/g, (match, key: string) => (
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  ));
}

function indexedRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function subscribePromptProgress(notify: () => void): () => void {
  window.addEventListener(PROMPT_PROGRESS_EVENT, notify);
  window.addEventListener("storage", notify);
  window.addEventListener("focus", notify);
  return () => {
    window.removeEventListener(PROMPT_PROGRESS_EVENT, notify);
    window.removeEventListener("storage", notify);
    window.removeEventListener("focus", notify);
  };
}

function progressSnapshot(): string {
  return JSON.stringify(readPromptProgress());
}

function storageSnapshot(): boolean {
  return isPromptProgressStorageAvailable();
}

function usePromptProgress() {
  const serialized = useSyncExternalStore(subscribePromptProgress, progressSnapshot, () => "{}");
  const storageAvailable = useSyncExternalStore(subscribePromptProgress, storageSnapshot, () => true);
  let progress: PromptProgressRecord = {};
  try {
    const value: unknown = JSON.parse(serialized);
    if (value && typeof value === "object" && !Array.isArray(value)) progress = value as PromptProgressRecord;
  } catch {
    progress = {};
  }
  return { progress, storageAvailable };
}

export function CopyPrompt({
  text,
  labels,
}: {
  text: string;
  labels: Labels;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <button
      className={styles.copyButton}
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 1800);
        } catch {
          setCopied(false);
        }
      }}
    >
      <span aria-hidden="true">{copied ? "✓" : "□"}</span>
      <span aria-live="polite">{copied ? labels.copied : labels.copyPrompt}</span>
    </button>
  );
}

export function PracticeCompletion({
  slug,
  labels,
}: {
  slug: PromptLessonSlug;
  labels: Labels;
}) {
  const { progress, storageAvailable } = usePromptProgress();
  const key = promptPracticeKey(slug);
  const complete = progress[key] === true;

  return (
    <section className={styles.completion} aria-label={labels.courseProgress}>
      <div>
        <strong aria-live="polite">
          {complete ? labels.practiceComplete : labels.markPracticeComplete}
        </strong>
        <p>{labels.browserStorageNote}</p>
        {!storageAvailable ? <p className={styles.storageWarning}>{labels.storageUnavailable}</p> : null}
      </div>
      <button
        className={complete ? styles.completeButton : styles.primaryButton}
        type="button"
        aria-disabled={complete || undefined}
        onClick={() => {
          if (complete) return;
          updatePromptProgress((record) => {
            record[key] = true;
          });
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
  lessons: readonly { slug: PromptLessonSlug; href: string }[];
  labels: Labels;
  startLabel: string;
  resumeLabel: string;
}) {
  const { progress, storageAvailable } = usePromptProgress();
  const [resetStatus, setResetStatus] = useState("");

  const state = useMemo(() => {
    const completePractices = lessons.filter((lesson) => progress[promptPracticeKey(lesson.slug)] === true).length;
    const quiz = progress[PROMPT_QUIZ_PASSED_KEY] === true ? 1 : 0;
    const capstone = progress[PROMPT_CAPSTONE_KEY] === true ? 1 : 0;
    const complete = completePractices + quiz + capstone;
    const total = lessons.length + 2;
    const nextLesson = lessons.find((lesson) => progress[promptPracticeKey(lesson.slug)] !== true);
    const nextHref = nextLesson?.href
      ?? (quiz ? (capstone ? null : lessons.at(-1)?.href ?? null) : "#prompts-final-quiz");
    return { complete, total, percent: Math.round((complete / total) * 100), nextHref };
  }, [lessons, progress]);

  const hasProgress = Object.keys(progress).some((key) => key.startsWith("prompts."));

  return (
    <section className={styles.progressPanel} aria-labelledby="prompts-progress-title">
      <div className={styles.progressHeading}>
        <div>
          <h2 id="prompts-progress-title">{labels.courseProgress}</h2>
          <p>{labels.browserStorageNote}</p>
        </div>
        <output className={styles.progressValue} aria-live="polite">
          <strong>{state.percent}%</strong>
          <span>{state.complete} / {state.total}</span>
        </output>
      </div>
      {!storageAvailable ? <p className={styles.storageWarning}>{labels.storageUnavailable}</p> : null}
      <progress className={styles.progressBar} max={state.total} value={state.complete}>
        {state.percent}%
      </progress>
      <div className={styles.actionRow}>
        {state.nextHref ? (
          <Link className={styles.primaryButton} href={state.nextHref}>
            {hasProgress ? resumeLabel : startLabel}<span aria-hidden="true">→</span>
          </Link>
        ) : null}
        <button
          className={styles.secondaryButton}
          type="button"
          disabled={!hasProgress}
          onClick={() => {
            if (!window.confirm(labels.resetConfirm)) return;
            resetPromptProgress();
            setResetStatus(labels.resetDone);
          }}
        >
          {labels.resetProgress}
        </button>
      </div>
      <p className={resetStatus ? styles.resetStatus : styles.srOnly} role="status">
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
  checkpoint: PromptCheckpointCopy;
  labels: Labels;
  id: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = selected === checkpoint.correctIndex;

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
                type="radio"
                name={`${id}-answer`}
                value={index}
                checked={selected === index}
                disabled={checked}
                required
                onChange={() => setSelected(index)}
              />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
        {!checked ? (
          <button className={styles.primaryButton} type="submit">
            {labels.checkAnswer}
          </button>
        ) : (
          <div className={correct ? styles.correctFeedback : styles.incorrectFeedback} role="status" tabIndex={-1}>
            <strong>{correct ? labels.correct : labels.incorrect}</strong>
            <p>{checkpoint.explanation}</p>
            {!correct ? (
              <button className={styles.secondaryButton} type="button" onClick={() => { setSelected(null); setChecked(false); }}>
                {labels.retryQuiz}
              </button>
            ) : null}
          </div>
        )}
      </form>
    </section>
  );
}

export type PromptQuizQuestion = PromptFinalQuizQuestionCopy & {
  readonly unitTitle: string;
  readonly sourceTitle: string;
  readonly sourceUrl: string;
};

export function FinalQuiz({
  questions,
  passScore,
  labels,
}: {
  questions: readonly PromptQuizQuestion[];
  passScore: number;
  labels: Labels;
}) {
  const { progress, storageAvailable } = usePromptProgress();
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState<number | null>(null);
  const current = questions[index];
  const answered = current ? answers[current.id] !== undefined : false;
  const savedBest = typeof progress[PROMPT_QUIZ_BEST_KEY] === "number"
    ? progress[PROMPT_QUIZ_BEST_KEY] as number
    : 0;
  const best = Math.max(savedBest, score ?? 0);

  function begin() {
    setActive(true);
    setIndex(0);
    setSelected(null);
    setAnswers({});
    setScore(null);
  }

  return (
    <section className={styles.finalQuiz} id="prompts-final-quiz" aria-labelledby="prompts-final-quiz-title">
      <header className={styles.quizHeader}>
        <div>
          <p className={styles.kicker}>{labels.finalQuiz}</p>
          <h2 id="prompts-final-quiz-title">{labels.finalQuiz}</h2>
          <p>{labels.quizIntro}</p>
        </div>
        <div className={styles.quizRequirement}>
          <strong>{labels.passRequirement}</strong>
          <span>{format(labels.bestScore, { score: best, total: questions.length })}</span>
        </div>
      </header>
      {!storageAvailable ? <p className={styles.storageWarning}>{labels.storageUnavailable}</p> : null}
      {!active ? (
        <button className={styles.primaryButton} type="button" onClick={begin}>{labels.beginQuiz}</button>
      ) : score !== null ? (
        <div className={score >= passScore ? styles.correctFeedback : styles.incorrectFeedback} role="status">
          <strong>{format(labels.scoreSummary, { score, total: questions.length })}</strong>
          <p>{score >= passScore ? labels.quizPassed : labels.quizNeedsReview}</p>
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
          <h3>{current.question}</h3>
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
                  required
                  onChange={() => setSelected(optionIndex)}
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
          {!answered ? (
            <button className={styles.primaryButton} type="submit">{labels.checkAnswer}</button>
          ) : (
            <div className={answers[current.id] ? styles.correctFeedback : styles.incorrectFeedback} role="status">
              <strong>{answers[current.id] ? labels.correct : labels.incorrect}</strong>
              <p>{current.explanation}</p>
              <a href={current.sourceUrl} target="_blank" rel="noopener noreferrer">
                {labels.source}: {current.sourceTitle}
              </a>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => {
                  if (index < questions.length - 1) {
                    setIndex(index + 1);
                    setSelected(null);
                    return;
                  }
                  const finalScore = Object.values(answers).filter(Boolean).length;
                  setScore(finalScore);
                  updatePromptProgress((record) => {
                    const prior = typeof record[PROMPT_QUIZ_BEST_KEY] === "number"
                      ? record[PROMPT_QUIZ_BEST_KEY] as number
                      : 0;
                    record[PROMPT_QUIZ_BEST_KEY] = Math.max(prior, finalScore);
                    record[PROMPT_QUIZ_PASSED_KEY] = finalScore >= passScore || record[PROMPT_QUIZ_PASSED_KEY] === true;
                  });
                }}
              >
                {index < questions.length - 1 ? labels.nextQuestion : labels.finishQuiz}
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
  passScore,
  maxScore,
  labels,
}: {
  required: readonly string[];
  rubric: readonly PromptCapstoneRubricCopy[];
  passScore: number;
  maxScore: number;
  labels: Labels;
}) {
  const { progress, storageAvailable } = usePromptProgress();
  const checked = indexedRecord(progress[PROMPT_CAPSTONE_REQUIRED_KEY]);
  const scores = indexedRecord(progress[PROMPT_CAPSTONE_SCORES_KEY]);
  const complete = progress[PROMPT_CAPSTONE_KEY] === true;
  const allChecked = required.every((_, index) => checked[String(index)] === true);
  const numericScores = rubric.map((_, index) => scores[String(index)]);
  const allScored = numericScores.every((score) => Number.isInteger(score) && Number(score) >= 0 && Number(score) <= 2);
  const totalScore = numericScores.reduce((sum: number, score) => sum + (Number.isInteger(score) ? Number(score) : 0), 0);
  const thresholdMet = promptCapstoneScoresPass(numericScores, passScore);
  const canRecord = allChecked && thresholdMet;
  const guidance = !allChecked
    ? labels.capstoneNeedsEvidence
    : !allScored
      ? labels.capstoneNeedsScores
      : !thresholdMet
        ? labels.capstoneThresholdNotMet
        : labels.capstoneSelfAttestation;

  return (
    <section className={styles.capstone} aria-labelledby="prompt-capstone-title">
      <header>
        <p className={styles.kicker}>{labels.capstone}</p>
        <h2 id="prompt-capstone-title">{labels.capstoneStatus}</h2>
      </header>
      <div className={styles.capstoneGrid}>
        <div>
          <h3>{labels.evidence}</h3>
          {required.map((item, index) => (
            <label className={styles.capstoneItem} key={item}>
              <input
                type="checkbox"
                name={`capstone-evidence-${index + 1}`}
                checked={complete || checked[String(index)] === true}
                disabled={complete}
                onChange={(event) => {
                  const nextChecked = event.target.checked;
                  updatePromptProgress((record) => {
                    record[PROMPT_CAPSTONE_REQUIRED_KEY] = {
                      ...indexedRecord(record[PROMPT_CAPSTONE_REQUIRED_KEY]),
                      [index]: nextChecked,
                    };
                  });
                }}
              />
              <span>{item}</span>
            </label>
          ))}
        </div>
        <div>
          <h3>{labels.successCriteria}</h3>
          <div className={styles.rubricList}>
            {rubric.map((item, index) => (
              <fieldset className={styles.rubricCriterion} key={item.id}>
                <legend>
                  {item.criterion}
                  {item.critical ? <span className={styles.criticalBadge}>Critical</span> : null}
                </legend>
                <div className={styles.rubricOptions}>
                  {[0, 1, 2].map((score) => (
                    <label className={styles.rubricOption} key={score}>
                      <input
                        type="radio"
                        name={`capstone-rubric-${item.id}`}
                        value={score}
                        checked={scores[String(index)] === score}
                        disabled={complete}
                        onChange={() => {
                          updatePromptProgress((record) => {
                            record[PROMPT_CAPSTONE_SCORES_KEY] = {
                              ...indexedRecord(record[PROMPT_CAPSTONE_SCORES_KEY]),
                              [index]: score,
                            };
                          });
                        }}
                      />
                      <span>
                        <strong>{score}</strong>
                        {item[`score${score}` as "score0" | "score1" | "score2"]}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.capstoneScore} role="status">
        <strong>{labels.capstoneScore}: {totalScore} / {maxScore}</strong>
        <span>{labels.capstonePassRule}</span>
        <p>{complete ? labels.capstoneSelfAttestation : guidance}</p>
      </div>
      {!storageAvailable ? <p className={styles.storageWarning}>{labels.storageUnavailable}</p> : null}
      <button
        className={complete ? styles.completeButton : styles.primaryButton}
        type="button"
        disabled={!canRecord && !complete}
        aria-disabled={complete || undefined}
        onClick={() => {
          if (complete || !canRecord) return;
          updatePromptProgress((record) => {
            record[PROMPT_CAPSTONE_KEY] = true;
          });
        }}
      >
        {complete ? labels.capstoneComplete : labels.recordCapstone}
      </button>
    </section>
  );
}
