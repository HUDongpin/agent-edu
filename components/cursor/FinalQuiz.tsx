"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CursorCourseCopy,
  CursorQuizId,
  CursorQuizOptionId,
  CursorSourceId,
  CursorUnitId,
} from "@/lib/cursor";
import { applyCursorProgressPatch } from "./progress-store";
import useCourseProgress, { useCourseStorageAvailable } from "./useCourseProgress";
import styles from "./CursorCourse.module.css";

export type FinalQuizQuestion = {
  readonly id: CursorQuizId;
  readonly unitId: CursorUnitId;
  readonly unitTitle: string;
  readonly prompt: string;
  readonly options: readonly {
    readonly id: CursorQuizOptionId;
    readonly label: string;
  }[];
  readonly correctOptionId: CursorQuizOptionId;
  readonly explanation: string;
  readonly sources: readonly {
    readonly id: CursorSourceId;
    readonly title: string;
    readonly url: string;
  }[];
};

type FinalQuizConfig = {
  readonly bankVersion: string;
  readonly questionCount: number;
  readonly questionsPerUnit: number;
  readonly passingCorrectAnswers: number;
  readonly bestScoreStorageKey: string;
  readonly passedStorageKey: string;
  readonly versionStorageKey: string;
};

type Answer = {
  readonly selectedOptionId: CursorQuizOptionId;
  readonly correct: boolean;
};

function formatTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{([^}]+)\}/g, (match, key: string) => (
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  ));
}

function randomIndex(max: number): number {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = randomIndex(index + 1);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function sameAttempt(left: readonly FinalQuizQuestion[], right: readonly FinalQuizQuestion[]): boolean {
  return left.length === right.length && left.every((question, index) => question.id === right[index]?.id);
}

function validStoredScore(value: unknown, maximum: number): number {
  return typeof value === "number"
    && Number.isInteger(value)
    && value >= 0
    && value <= maximum
    ? value
    : 0;
}

function selectAttempt(
  bank: readonly FinalQuizQuestion[],
  questionsPerUnit: number,
  previous: readonly FinalQuizQuestion[],
): FinalQuizQuestion[] {
  const unitIds = [...new Set(bank.map((question) => question.unitId))];

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const selected = unitIds.flatMap((unitId) => (
      shuffle(bank.filter((question) => question.unitId === unitId)).slice(0, questionsPerUnit)
    ));
    const ordered = shuffle(selected);
    if (!sameAttempt(ordered, previous)) return ordered;
  }

  return [...previous.slice(1), previous[0]];
}

export default function FinalQuiz({
  bank,
  config,
  labels,
}: {
  bank: readonly FinalQuizQuestion[];
  config: FinalQuizConfig;
  labels: CursorCourseCopy["ui"];
}) {
  const progress = useCourseProgress();
  const storageAvailable = useCourseStorageAvailable();
  const [attempt, setAttempt] = useState<FinalQuizQuestion[]>([]);
  const [previousAttempt, setPreviousAttempt] = useState<FinalQuizQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<CursorQuizOptionId | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [completedScore, setCompletedScore] = useState<number | null>(null);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const feedback = useRef<HTMLDivElement>(null);

  const current = attempt[questionIndex];
  const currentAnswer = current ? answers[current.id] : undefined;
  const versionMatches = progress[config.versionStorageKey] === config.bankVersion;
  const savedBest = versionMatches
    ? validStoredScore(progress[config.bestScoreStorageKey], config.questionCount)
    : 0;
  const bestScore = Math.max(savedBest, completedScore ?? 0);

  const bankByUnit = useMemo(() => {
    const counts = new Map<CursorUnitId, number>();
    for (const question of bank) counts.set(question.unitId, (counts.get(question.unitId) ?? 0) + 1);
    return counts;
  }, [bank]);

  const bankReady = bank.length >= config.questionCount
    && bankByUnit.size * config.questionsPerUnit === config.questionCount
    && [...bankByUnit.values()].every((count) => count >= config.questionsPerUnit);

  useEffect(() => {
    if (currentAnswer) feedback.current?.focus();
  }, [currentAnswer]);

  useEffect(() => {
    if (completedScore !== null) feedback.current?.focus();
  }, [completedScore]);

  function beginAttempt() {
    const next = selectAttempt(bank, config.questionsPerUnit, previousAttempt);
    setAttempt(next);
    setPreviousAttempt(next);
    setQuestionIndex(0);
    setSelectedOptionId(null);
    setAnswers({});
    setCompletedScore(null);
    window.requestAnimationFrame(() => questionHeading.current?.focus());
  }

  function finishAttempt(nextAnswers: Record<string, Answer>) {
    const score = Object.values(nextAnswers).filter((answer) => answer.correct).length;
    setCompletedScore(score);
    void applyCursorProgressPatch({
      quizScore: {
        versionKey: config.versionStorageKey,
        version: config.bankVersion,
        bestScoreKey: config.bestScoreStorageKey,
        passedKey: config.passedStorageKey,
        score,
        passingScore: config.passingCorrectAnswers,
        maximumScore: config.questionCount,
      },
    });
  }

  return (
    <section
      className={styles.finalQuiz}
      aria-labelledby="cursor-final-quiz-title"
      data-testid="cursor-final-quiz"
    >
      <header className={styles.finalQuizHeader}>
        <div>
          <p className={styles.kicker}>{labels.quiz}</p>
          <h2 id="cursor-final-quiz-title" tabIndex={-1}>{labels.finalQuizTitle}</h2>
          <p>{labels.finalQuizIntro}</p>
        </div>
        <div className={styles.quizRequirement}>
          <strong>{labels.passRequirement}</strong>
          <span>{formatTemplate(labels.bestScoreTemplate, { score: bestScore, total: config.questionCount })}</span>
        </div>
      </header>

      {!storageAvailable ? (
        <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p>
      ) : null}

      {!attempt.length ? (
        <button
          className={styles.primaryAction}
          type="button"
          disabled={!bankReady}
          onClick={beginAttempt}
        >
          {labels.beginQuiz}
        </button>
      ) : completedScore !== null ? (
        <div className={styles.finalQuizResult} role="status" tabIndex={-1} ref={feedback}>
          <strong>{formatTemplate(labels.scoreSummaryTemplate, {
            score: completedScore,
            total: config.questionCount,
          })}</strong>
          <p>{completedScore >= config.passingCorrectAnswers ? labels.quizPassed : labels.quizNeedsReview}</p>
          <button className={styles.secondaryAction} type="button" onClick={beginAttempt}>
            {labels.retryQuiz}
          </button>
        </div>
      ) : current ? (
        <form
          className={styles.finalQuizQuestion}
          data-question-id={current.id}
          data-unit-id={current.unitId}
          onSubmit={(event) => {
            event.preventDefault();
            if (selectedOptionId === null || currentAnswer) return;
            const answer = {
              selectedOptionId,
              correct: selectedOptionId === current.correctOptionId,
            };
            setAnswers((currentAnswers) => ({ ...currentAnswers, [current.id]: answer }));
          }}
        >
          <div className={styles.quizQuestionMeta}>
            <span>{formatTemplate(labels.questionProgressTemplate, {
              current: questionIndex + 1,
              total: config.questionCount,
            })}</span>
            <span>{current.unitTitle}</span>
          </div>
          <h3 ref={questionHeading} tabIndex={-1}>{current.prompt}</h3>

          <fieldset className={styles.finalQuizOptions}>
            <legend className={styles.srOnly}>{current.prompt}</legend>
            {current.options.map((option) => (
              <label
                className={
                  currentAnswer && option.id === current.correctOptionId
                    ? styles.correctOption
                    : currentAnswer && currentAnswer.selectedOptionId === option.id
                      ? styles.incorrectOption
                      : styles.option
                }
                data-option-id={option.id}
                key={`${current.id}-${option.id}`}
              >
                <input
                  type="radio"
                  name={current.id}
                  value={option.id}
                  checked={selectedOptionId === option.id}
                  disabled={Boolean(currentAnswer)}
                  required
                  onChange={() => setSelectedOptionId(option.id)}
                />
                <span className={styles.optionCopy}>
                  <span>{option.label}</span>
                  {currentAnswer && option.id === current.correctOptionId ? (
                    <strong className={styles.answerMarker} data-answer-state="correct">{labels.correct}</strong>
                  ) : currentAnswer && currentAnswer.selectedOptionId === option.id ? (
                    <strong className={styles.answerMarker} data-answer-state="incorrect">{labels.incorrect}</strong>
                  ) : null}
                </span>
              </label>
            ))}
          </fieldset>

          {currentAnswer ? (
            <div
              className={currentAnswer.correct ? styles.correctFeedback : styles.incorrectFeedback}
              ref={feedback}
              role="status"
              tabIndex={-1}
            >
              <p>
                <strong>{currentAnswer.correct ? labels.correct : labels.incorrect}</strong>
                {" "}{current.explanation}
              </p>
              <ul className={styles.quizSources} aria-label={labels.source}>
                {current.sources.map((source) => (
                  <li key={source.id}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" lang="en" dir="ltr">{source.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <button
            className={styles.primaryAction}
            type={currentAnswer ? "button" : "submit"}
            onClick={currentAnswer ? () => {
              if (questionIndex === attempt.length - 1) {
                finishAttempt(answers);
                return;
              }
              setQuestionIndex((index) => index + 1);
              setSelectedOptionId(null);
              window.requestAnimationFrame(() => questionHeading.current?.focus());
            } : undefined}
          >
            {currentAnswer
              ? questionIndex === attempt.length - 1 ? labels.finishQuiz : labels.nextQuestion
              : labels.checkAnswer}
          </button>
        </form>
      ) : null}
    </section>
  );
}
