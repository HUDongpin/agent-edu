"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { GrokCourseCopy, GrokQuizCopy } from "@/lib/grok/types";
import { GROK_QUIZ_ATTEMPT_KEY } from "@/lib/progress-storage-contract";
import {
  clearGrokQuizAttempt,
  createGrokQuizAttemptConfig,
  grokQuizAttemptPersistenceAvailable,
  parseGrokQuizAttempt,
  readGrokQuizAttemptSnapshot,
  subscribeToGrokQuizAttempt,
  writeGrokQuizAttempt,
  type GrokQuizAttemptDraft,
} from "./quiz-attempt-store";
import { updateGrokProgress } from "./progress-store";
import useGrokProgress, {
  useGrokHydrated,
  useGrokStorageAvailable,
} from "./useGrokProgress";
import styles from "./GrokCourse.module.css";

export { GROK_QUIZ_ATTEMPT_KEY };

export type GrokQuizQuestion = {
  readonly id: string;
  readonly lessonTitle: string;
  readonly copy: GrokQuizCopy;
  readonly sources: readonly { readonly id: string; readonly title: string; readonly url: string }[];
};

function formatTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{([^}]+)\}/g, (match, key: string) => (
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  ));
}

export default function FinalQuiz({
  locale,
  questions,
  passingScore,
  labels,
}: {
  locale: string;
  questions: readonly GrokQuizQuestion[];
  passingScore: number;
  labels: GrokCourseCopy["ui"];
}) {
  const progress = useGrokProgress();
  const hydrated = useGrokHydrated();
  const storageAvailable = useGrokStorageAvailable();
  const [attemptWriteFailed, setAttemptWriteFailed] = useState(false);
  const [attemptStatus, setAttemptStatus] = useState("");
  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<readonly boolean[]>([]);
  const [checked, setChecked] = useState(false);
  const [finishedScore, setFinishedScore] = useState<number | null>(null);
  const [scorePersistenceFailed, setScorePersistenceFailed] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const attemptConfig = useMemo(
    () => createGrokQuizAttemptConfig(questions, passingScore),
    [passingScore, questions],
  );
  const savedAttemptRaw = useSyncExternalStore(
    subscribeToGrokQuizAttempt,
    readGrokQuizAttemptSnapshot,
    () => null,
  );
  const attemptStorageAvailable = useSyncExternalStore(
    subscribeToGrokQuizAttempt,
    grokQuizAttemptPersistenceAvailable,
    () => true,
  );
  const attemptPersistenceFailed = attemptWriteFailed || !attemptStorageAvailable;
  const savedAttempt = useMemo(() => (
    savedAttemptRaw ? parseGrokQuizAttempt(savedAttemptRaw, attemptConfig) : null
  ), [attemptConfig, savedAttemptRaw]);
  const visibleAttemptStatus = attemptPersistenceFailed
    ? labels.quizAttemptSaveFailed
    : attemptStatus;

  const question = questions[questionIndex];
  const score = answers.filter(Boolean).length;
  const best = Math.max(progress.quizBest, finishedScore ?? 0);

  function persistDraft(draft: GrokQuizAttemptDraft): boolean {
    const result = writeGrokQuizAttempt(JSON.stringify(draft));
    setAttemptWriteFailed(!result.persisted);
    if (result.persisted) {
      setAttemptStatus(labels.quizAttemptSaved);
      return true;
    }
    setAttemptStatus(labels.quizAttemptSaveFailed);
    return false;
  }

  useEffect(() => {
    if (started && checked && finishedScore === null) feedbackRef.current?.focus();
  }, [checked, finishedScore, started]);

  useEffect(() => {
    if (finishedScore !== null) resultRef.current?.focus();
  }, [finishedScore]);

  function clearDraft(): boolean {
    const result = clearGrokQuizAttempt();
    setAttemptWriteFailed(!result.persisted);
    if (result.persisted) {
      return true;
    }
    setAttemptStatus(labels.quizAttemptSaveFailed);
    return false;
  }

  function begin() {
    if (scorePersistenceFailed && !window.confirm(labels.discardQuizConfirm)) return;
    setAttemptStatus("");
    persistDraft({
      schemaVersion: 1,
      signature: attemptConfig.signature,
      questionIndex: 0,
      selected: null,
      answers: [],
      checked: false,
    });
    setStarted(true);
    setQuestionIndex(0);
    setSelected(null);
    setAnswers([]);
    setChecked(false);
    setFinishedScore(null);
    setScorePersistenceFailed(false);
    window.requestAnimationFrame(() => headingRef.current?.focus());
  }

  function resumeAttempt() {
    if (!savedAttempt) return;
    persistDraft(savedAttempt);
    setQuestionIndex(savedAttempt.questionIndex);
    setSelected(savedAttempt.selected);
    setAnswers(savedAttempt.answers);
    setChecked(savedAttempt.checked);
    setFinishedScore(null);
    setScorePersistenceFailed(false);
    setStarted(true);
    window.requestAnimationFrame(() => headingRef.current?.focus());
  }

  function discardAttempt() {
    if (!window.confirm(labels.discardQuizConfirm)) return;
    if (!clearDraft()) return;
    setStarted(false);
    setQuestionIndex(0);
    setSelected(null);
    setAnswers([]);
    setChecked(false);
    setFinishedScore(null);
    setScorePersistenceFailed(false);
    setAttemptStatus(labels.quizAttemptDiscarded);
  }

  function advance() {
    if (!question || selected === null) return;
    if (!checked) {
      const nextAnswers = [...answers, selected === question.copy.correctIndex];
      persistDraft({
        schemaVersion: 1,
        signature: attemptConfig.signature,
        questionIndex,
        selected,
        answers: nextAnswers,
        checked: true,
      });
      setAnswers(nextAnswers);
      setChecked(true);
      return;
    }

    if (questionIndex === questions.length - 1) {
      const finalScore = score;
      const scorePersisted = updateGrokProgress((current) => ({
        ...current,
        quizBest: Math.max(current.quizBest, finalScore),
        quizPassed: current.quizPassed || finalScore >= passingScore,
      }));
      if (scorePersisted) clearDraft();
      setScorePersistenceFailed(!scorePersisted);
      setFinishedScore(finalScore);
      return;
    }

    const nextQuestionIndex = questionIndex + 1;
    persistDraft({
      schemaVersion: 1,
      signature: attemptConfig.signature,
      questionIndex: nextQuestionIndex,
      selected: null,
      answers,
      checked: false,
    });
    setQuestionIndex(nextQuestionIndex);
    setSelected(null);
    setChecked(false);
    window.requestAnimationFrame(() => headingRef.current?.focus());
  }

  return (
    <section
      id="grok-final-quiz"
      className={styles.finalQuiz}
      aria-labelledby="grok-final-quiz-title"
      data-testid="grok-final-quiz"
    >
      <header className={styles.quizHeader}>
        <div>
          <h2 id="grok-final-quiz-title">{labels.quizTitle}</h2>
          <p>{labels.quizIntro}</p>
        </div>
        <p className={styles.quizBest}>
          <strong>{numberFormat.format(best)}</strong>
          <span>/ {numberFormat.format(questions.length)} {labels.bestScore}</span>
        </p>
      </header>

      {!storageAvailable ? (
        <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p>
      ) : null}

      {!started && savedAttempt ? (
        <div data-testid="grok-quiz-saved-attempt">
          <p>
            {formatTemplate(labels.quizAttemptAvailable, {
              current: numberFormat.format(savedAttempt.questionIndex + 1),
              total: numberFormat.format(questions.length),
            })}
          </p>
          <div className={styles.progressActions}>
            <button
              className={styles.primaryAction}
              type="button"
              data-testid="grok-quiz-resume-attempt"
              onClick={resumeAttempt}
            >
              {labels.resumeQuizAttempt}
            </button>
            <button
              className={styles.secondaryAction}
              type="button"
              data-testid="grok-quiz-discard-attempt"
              onClick={discardAttempt}
            >
              {labels.discardQuizAttempt}
            </button>
          </div>
        </div>
      ) : !started ? (
        <button
          className={styles.primaryAction}
          type="button"
          disabled={!hydrated}
          onClick={begin}
        >
          {labels.beginQuiz}
        </button>
      ) : finishedScore !== null ? (
        <div
          className={finishedScore >= passingScore ? styles.quizPassed : styles.quizReview}
          data-testid="grok-quiz-result"
          ref={resultRef}
          role="status"
          tabIndex={-1}
        >
          <strong>{labels.score}: {numberFormat.format(finishedScore)} / {numberFormat.format(questions.length)}</strong>
          <p>{finishedScore >= passingScore ? labels.passed : labels.needsReview}</p>
          <button className={styles.secondaryAction} type="button" onClick={begin}>
            {labels.retryQuiz}
          </button>
        </div>
      ) : question ? (
        <form
          className={styles.quizQuestion}
          onSubmit={(event) => {
            event.preventDefault();
            advance();
          }}
        >
          <p className={styles.quizMeta}>
            {labels.question} {numberFormat.format(questionIndex + 1)} {labels.of} {numberFormat.format(questions.length)}
            <span>{question.lessonTitle}</span>
          </p>
          <h3 tabIndex={-1} ref={headingRef}>{question.copy.question}</h3>
          <fieldset>
            <legend className={styles.srOnly}>{question.copy.question}</legend>
            {question.copy.options.map((option, optionIndex) => {
              const isCorrect = checked && optionIndex === question.copy.correctIndex;
              const isWrong = checked && selected === optionIndex && !isCorrect;
              return (
                <label
                  className={isCorrect ? styles.correctOption : isWrong ? styles.incorrectOption : styles.quizOption}
                  data-testid={`grok-quiz-option-${optionIndex}`}
                  key={option}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={optionIndex}
                    autoComplete="off"
                    checked={selected === optionIndex}
                    disabled={checked}
                    required
                    onChange={() => {
                      persistDraft({
                        schemaVersion: 1,
                        signature: attemptConfig.signature,
                        questionIndex,
                        selected: optionIndex,
                        answers,
                        checked: false,
                      });
                      setSelected(optionIndex);
                    }}
                  />
                  <span>
                    {option}
                    {isCorrect ? (
                      <small className={styles.optionStatus}>{labels.correctAnswer}</small>
                    ) : isWrong ? (
                      <small className={styles.optionStatus}>{labels.yourAnswer}</small>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </fieldset>
          {checked ? (
            <div
              className={selected === question.copy.correctIndex ? styles.correctFeedback : styles.incorrectFeedback}
              ref={feedbackRef}
              role="status"
              tabIndex={-1}
            >
              <strong>{selected === question.copy.correctIndex ? labels.correct : labels.incorrect}</strong>
              <p>{question.copy.explanation}</p>
              <ul>
                {question.sources.slice(0, 2).map((source) => (
                  <li key={source.id}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className={styles.progressActions}>
            <button className={styles.primaryAction} type="submit" disabled={selected === null}>
              {!checked
                ? labels.checkAnswer
                : questionIndex === questions.length - 1 ? labels.finishQuiz : labels.nextQuestion}
            </button>
            <button
              className={styles.secondaryAction}
              type="button"
              data-testid="grok-quiz-discard-attempt"
              onClick={discardAttempt}
            >
              {labels.discardQuizAttempt}
            </button>
          </div>
        </form>
      ) : null}

      <p
        className={attemptPersistenceFailed ? styles.storageWarning : styles.srOnly}
        data-testid="grok-quiz-attempt-status"
        role="status"
      >
        {visibleAttemptStatus}
      </p>
    </section>
  );
}
