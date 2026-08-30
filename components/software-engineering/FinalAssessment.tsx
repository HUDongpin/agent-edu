"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SOFTWARE_ENGINEERING_SOURCE_BY_ID,
  type SoftwareEngineeringLocaleCopy,
  type SoftwareEngineeringQuestion,
  type SoftwareEngineeringUnitId,
} from "@/lib/software-engineering";
import {
  SOFTWARE_ENGINEERING_PROGRESS_RESET_EVENT,
  updateSoftwareEngineeringProgress,
} from "./progress-store";
import useSoftwareEngineeringProgress, {
  useSoftwareEngineeringStorageAvailable,
} from "./useSoftwareEngineeringProgress";
import styles from "./SoftwareEngineeringCourse.module.css";

type AssessmentConfig = {
  readonly bankVersion: string;
  readonly questionCount: number;
  readonly questionsPerUnit: number;
  readonly passingCorrectAnswers: number;
  readonly bestScoreStorageKey: string;
  readonly passedStorageKey: string;
  readonly versionStorageKey: string;
};

type Answer = { readonly selectedIndex: number; readonly correct: boolean };

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

function sameAttempt(
  left: readonly SoftwareEngineeringQuestion[],
  right: readonly SoftwareEngineeringQuestion[],
): boolean {
  if (left.length !== right.length) return false;
  const leftIds = left.map((question) => question.id).sort();
  const rightIds = right.map((question) => question.id).sort();
  return leftIds.every((id, index) => id === rightIds[index]);
}

function selectAttempt(
  bank: readonly SoftwareEngineeringQuestion[],
  questionsPerUnit: number,
  previous: readonly SoftwareEngineeringQuestion[],
): SoftwareEngineeringQuestion[] {
  const unitIds = [...new Set(bank.map((question) => question.unitId))];
  for (let tryIndex = 0; tryIndex < 8; tryIndex += 1) {
    const selected = unitIds.flatMap((unitId) => (
      shuffle(bank.filter((question) => question.unitId === unitId)).slice(0, questionsPerUnit)
    ));
    const attempt = shuffle(selected);
    if (!sameAttempt(attempt, previous)) return attempt;
  }
  if (!previous.length) return [];

  const previousIds = new Set(previous.map((question) => question.id));
  for (const question of previous) {
    const replacement = bank.find((candidate) => (
      candidate.unitId === question.unitId && !previousIds.has(candidate.id)
    ));
    if (replacement) {
      return shuffle(previous.map((candidate) => (
        candidate.id === question.id ? replacement : candidate
      )));
    }
  }

  return shuffle(previous);
}

function validScore(value: unknown, maximum: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= maximum ? value : 0;
}

export default function FinalAssessment({
  bank,
  config,
  unitTitles,
  labels,
}: {
  bank: readonly SoftwareEngineeringQuestion[];
  config: AssessmentConfig;
  unitTitles: Readonly<Record<SoftwareEngineeringUnitId, string>>;
  labels: SoftwareEngineeringLocaleCopy["ui"];
}) {
  const progress = useSoftwareEngineeringProgress();
  const storageAvailable = useSoftwareEngineeringStorageAvailable();
  const [attempt, setAttempt] = useState<SoftwareEngineeringQuestion[]>([]);
  const [previousAttempt, setPreviousAttempt] = useState<SoftwareEngineeringQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [completedScore, setCompletedScore] = useState<number | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const current = attempt[questionIndex];
  const currentAnswer = current ? answers[current.id] : undefined;
  const versionMatches = progress[config.versionStorageKey] === config.bankVersion;
  const storedBest = versionMatches ? validScore(progress[config.bestScoreStorageKey], config.questionCount) : 0;
  const best = Math.max(storedBest, completedScore ?? 0);

  const bankReady = useMemo(() => {
    const counts = new Map<SoftwareEngineeringUnitId, number>();
    for (const question of bank) counts.set(question.unitId, (counts.get(question.unitId) ?? 0) + 1);
    return bank.length === 25
      && counts.size === 5
      && [...counts.values()].every((count) => count >= config.questionsPerUnit)
      && counts.size * config.questionsPerUnit === config.questionCount;
  }, [bank, config.questionCount, config.questionsPerUnit]);

  useEffect(() => {
    if (currentAnswer || completedScore !== null) feedback.current?.focus();
  }, [currentAnswer, completedScore]);

  useEffect(() => {
    const resetAssessment = () => {
      setAttempt([]);
      setPreviousAttempt([]);
      setQuestionIndex(0);
      setSelectedIndex(null);
      setAnswers({});
      setCompletedScore(null);
    };
    window.addEventListener(SOFTWARE_ENGINEERING_PROGRESS_RESET_EVENT, resetAssessment);
    return () => {
      window.removeEventListener(SOFTWARE_ENGINEERING_PROGRESS_RESET_EVENT, resetAssessment);
    };
  }, []);

  function beginAttempt() {
    const next = selectAttempt(bank, config.questionsPerUnit, previousAttempt);
    setAttempt(next);
    setPreviousAttempt(next);
    setQuestionIndex(0);
    setSelectedIndex(null);
    setAnswers({});
    setCompletedScore(null);
    window.requestAnimationFrame(() => heading.current?.focus());
  }

  function finish(nextAnswers: Record<string, Answer>) {
    const score = Object.values(nextAnswers).filter((answer) => answer.correct).length;
    setCompletedScore(score);
    updateSoftwareEngineeringProgress((record) => {
      const sameVersion = record[config.versionStorageKey] === config.bankVersion;
      const prior = sameVersion ? validScore(record[config.bestScoreStorageKey], config.questionCount) : 0;
      record[config.bestScoreStorageKey] = Math.max(prior, score);
      record[config.passedStorageKey] = score >= config.passingCorrectAnswers
        || (sameVersion && record[config.passedStorageKey] === true);
      record[config.versionStorageKey] = config.bankVersion;
    });
  }

  return (
    <section className={styles.finalQuiz} id="final-assessment" aria-labelledby="final-assessment-title" data-testid="software-engineering-final-assessment">
      <header className={styles.quizHeader}>
        <div>
          <p className={styles.kicker}>{labels.finalAssessment}</p>
          <h2 id="final-assessment-title">{labels.finalAssessment}</h2>
          <p>{labels.assessmentIntro}</p>
        </div>
        <div className={styles.quizRequirement}>
          <strong>{labels.passRequirement}</strong>
          <span>{labels.bestScore}: {best} / {config.questionCount}</span>
        </div>
      </header>

      {!storageAvailable ? <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p> : null}

      {!attempt.length ? (
        <button className={styles.primaryButton} type="button" disabled={!bankReady} onClick={beginAttempt}>
          {labels.beginAssessment}
        </button>
      ) : completedScore !== null ? (
        <div className={completedScore >= config.passingCorrectAnswers ? styles.correctFeedback : styles.incorrectFeedback} role="status" tabIndex={-1} ref={feedback}>
          <strong>{completedScore} / {config.questionCount}</strong>
          <p>{completedScore >= config.passingCorrectAnswers ? labels.quizPassed : labels.quizNeedsReview}</p>
          <button className={styles.secondaryButton} type="button" onClick={beginAttempt}>{labels.retryAssessment}</button>
        </div>
      ) : current ? (
        <form
          className={styles.quizQuestion}
          data-question-id={current.id}
          data-unit-id={current.unitId}
          onSubmit={(event) => {
            event.preventDefault();
            if (selectedIndex === null || currentAnswer) return;
            setAnswers((existing) => ({
              ...existing,
              [current.id]: { selectedIndex, correct: selectedIndex === current.correctIndex },
            }));
          }}
        >
          <div className={styles.quizMeta}>
            <span>{labels.questionProgress}: {questionIndex + 1} / {config.questionCount}</span>
            <span>{unitTitles[current.unitId]}</span>
          </div>
          <h3 tabIndex={-1} ref={heading} lang="en" dir="ltr">{current.question}</h3>
          <fieldset lang="en" dir="ltr">
            <legend className={styles.srOnly}>{current.question}</legend>
            {current.options.map((option, optionIndex) => (
              <label
                className={currentAnswer && optionIndex === current.correctIndex
                  ? styles.correctOption
                  : currentAnswer && optionIndex === currentAnswer.selectedIndex
                    ? styles.incorrectOption
                    : styles.option}
                key={`${current.id}-${optionIndex}`}
              >
                <input
                  type="radio"
                  name={current.id}
                  value={optionIndex}
                  checked={selectedIndex === optionIndex}
                  disabled={Boolean(currentAnswer)}
                  required
                  onChange={() => setSelectedIndex(optionIndex)}
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
          {!currentAnswer ? (
            <button className={styles.primaryButton} type="submit" disabled={selectedIndex === null}>{labels.checkAnswer}</button>
          ) : (
            <div className={currentAnswer.correct ? styles.correctFeedback : styles.incorrectFeedback} role="status" tabIndex={-1} ref={feedback}>
              <strong>{currentAnswer.correct ? labels.correct : labels.incorrect}</strong>
              <p lang="en" dir="ltr">{current.explanation}</p>
              {current.sourceIds.map((sourceId) => {
                const source = SOFTWARE_ENGINEERING_SOURCE_BY_ID[sourceId];
                return source ? (
                  <a key={sourceId} href={source.url} target="_blank" rel="noopener noreferrer" lang="en" dir="ltr">
                    {labels.source}: {source.title}
                  </a>
                ) : null;
              })}
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => {
                  const nextAnswers = { ...answers, [current.id]: currentAnswer };
                  if (questionIndex < attempt.length - 1) {
                    setQuestionIndex((index) => index + 1);
                    setSelectedIndex(null);
                    window.requestAnimationFrame(() => heading.current?.focus());
                  } else {
                    finish(nextAnswers);
                  }
                }}
              >
                {questionIndex < attempt.length - 1 ? labels.nextQuestion : labels.finishAssessment}
              </button>
            </div>
          )}
        </form>
      ) : null}
    </section>
  );
}
