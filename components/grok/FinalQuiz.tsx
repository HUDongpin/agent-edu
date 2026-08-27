"use client";

import { useMemo, useRef, useState } from "react";
import type { GrokCourseCopy, GrokQuizCopy } from "@/lib/grok/types";
import { updateGrokProgress } from "./progress-store";
import useGrokProgress, {
  useGrokHydrated,
  useGrokStorageAvailable,
} from "./useGrokProgress";
import styles from "./GrokCourse.module.css";

export type GrokQuizQuestion = {
  readonly id: string;
  readonly lessonTitle: string;
  readonly copy: GrokQuizCopy;
  readonly sources: readonly { readonly id: string; readonly title: string; readonly url: string }[];
};

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
  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<readonly boolean[]>([]);
  const [checked, setChecked] = useState(false);
  const [finishedScore, setFinishedScore] = useState<number | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const question = questions[questionIndex];
  const score = answers.filter(Boolean).length;
  const best = Math.max(progress.quizBest, finishedScore ?? 0);

  function begin() {
    setStarted(true);
    setQuestionIndex(0);
    setSelected(null);
    setAnswers([]);
    setChecked(false);
    setFinishedScore(null);
    window.requestAnimationFrame(() => headingRef.current?.focus());
  }

  function advance() {
    if (!question || selected === null) return;
    if (!checked) {
      setChecked(true);
      setAnswers((current) => [...current, selected === question.copy.correctIndex]);
      return;
    }

    if (questionIndex === questions.length - 1) {
      const finalScore = score;
      setFinishedScore(finalScore);
      updateGrokProgress((current) => ({
        ...current,
        quizBest: Math.max(current.quizBest, finalScore),
        quizPassed: current.quizPassed || finalScore >= passingScore,
      }));
      return;
    }

    setQuestionIndex((current) => current + 1);
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

      {!started ? (
        <button className={styles.primaryAction} type="button" disabled={!hydrated} onClick={begin}>
          {labels.beginQuiz}
        </button>
      ) : finishedScore !== null ? (
        <div className={finishedScore >= passingScore ? styles.quizPassed : styles.quizReview} role="status">
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
                  key={option}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={optionIndex}
                    autoComplete="off"
                    checked={selected === optionIndex}
                    disabled={checked}
                    onChange={() => setSelected(optionIndex)}
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
            <div className={selected === question.copy.correctIndex ? styles.correctFeedback : styles.incorrectFeedback} role="status">
              <strong>{selected === question.copy.correctIndex ? labels.correct : labels.incorrect}</strong>
              <p>{question.copy.explanation}</p>
              <ul>
                {question.sources.slice(0, 2).map((source) => (
                  <li key={source.id}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" lang="en" dir="ltr">{source.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <button className={styles.primaryAction} type="submit" disabled={selected === null}>
            {!checked
              ? labels.checkAnswer
              : questionIndex === questions.length - 1 ? labels.finishQuiz : labels.nextQuestion}
          </button>
        </form>
      ) : null}
    </section>
  );
}
