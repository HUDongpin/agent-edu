"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  GithubQuizId,
  GithubSourceId,
  GithubUiCopy,
  GithubUnitId,
} from "@/lib/github";
import { GITHUB_RESET_EVENT, updateCourseProgress } from "./progress-store";
import useGithubProgress, {
  useGithubStorageAvailable,
} from "./useGithubProgress";
import GithubText from "./GithubText";
import base from "@/components/codex/CodexCourse.module.css";

export type GithubFinalQuizQuestion = {
  readonly id: GithubQuizId;
  readonly unitId: GithubUnitId;
  readonly unitTitle: string;
  readonly prompt: string;
  readonly options: readonly string[];
  readonly correctIndex: number;
  readonly explanation: string;
  readonly sources: readonly {
    readonly id: GithubSourceId;
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
  readonly selectedIndex: number;
  readonly correct: boolean;
};

function formatTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{([^}]+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(values, key)
      ? String(values[key])
      : match,
  );
}

function randomIndex(max: number): number {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
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
  left: readonly GithubFinalQuizQuestion[],
  right: readonly GithubFinalQuizQuestion[],
): boolean {
  return (
    left.length === right.length &&
    left.every((question, index) => question.id === right[index]?.id)
  );
}

function validStoredScore(value: unknown, maximum: number): number {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= maximum
    ? value
    : 0;
}

function selectAttempt(
  bank: readonly GithubFinalQuizQuestion[],
  questionsPerUnit: number,
  previous: readonly GithubFinalQuizQuestion[],
): GithubFinalQuizQuestion[] {
  const unitIds = [...new Set(bank.map((question) => question.unitId))];

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const selected = unitIds.flatMap((unitId) =>
      shuffle(bank.filter((question) => question.unitId === unitId)).slice(
        0,
        questionsPerUnit,
      ),
    );
    const ordered = shuffle(selected);
    if (!sameAttempt(ordered, previous)) return ordered;
  }

  return previous.length ? [...previous.slice(1), previous[0]] : [];
}

export default function FinalQuiz({
  bank,
  config,
  labels,
}: {
  bank: readonly GithubFinalQuizQuestion[];
  config: FinalQuizConfig;
  labels: GithubUiCopy;
}) {
  const progress = useGithubProgress();
  const storageAvailable = useGithubStorageAvailable();
  const [attempt, setAttempt] = useState<GithubFinalQuizQuestion[]>([]);
  const [previousAttempt, setPreviousAttempt] = useState<
    GithubFinalQuizQuestion[]
  >([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [completedScore, setCompletedScore] = useState<number | null>(null);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const feedback = useRef<HTMLDivElement>(null);

  const current = attempt[questionIndex];
  const currentAnswer = current ? answers[current.id] : undefined;
  const versionMatches =
    progress[config.versionStorageKey] === config.bankVersion;
  const savedBest = versionMatches
    ? validStoredScore(
        progress[config.bestScoreStorageKey],
        config.questionCount,
      )
    : 0;
  const bestScore = Math.max(savedBest, completedScore ?? 0);

  const bankByUnit = useMemo(() => {
    const counts = new Map<GithubUnitId, number>();
    for (const question of bank)
      counts.set(question.unitId, (counts.get(question.unitId) ?? 0) + 1);
    return counts;
  }, [bank]);

  const bankReady =
    bank.length >= config.questionCount &&
    bankByUnit.size * config.questionsPerUnit === config.questionCount &&
    [...bankByUnit.values()].every((count) => count >= config.questionsPerUnit);

  useEffect(() => {
    if (currentAnswer) feedback.current?.focus();
  }, [currentAnswer]);

  useEffect(() => {
    if (completedScore !== null) feedback.current?.focus();
  }, [completedScore]);

  useEffect(() => {
    const resetAttempt = () => {
      setAttempt([]);
      setPreviousAttempt([]);
      setQuestionIndex(0);
      setSelectedIndex(null);
      setAnswers({});
      setCompletedScore(null);
    };
    window.addEventListener(GITHUB_RESET_EVENT, resetAttempt);
    return () => window.removeEventListener(GITHUB_RESET_EVENT, resetAttempt);
  }, []);

  function beginAttempt() {
    const next = selectAttempt(bank, config.questionsPerUnit, previousAttempt);
    setAttempt(next);
    setPreviousAttempt(next);
    setQuestionIndex(0);
    setSelectedIndex(null);
    setAnswers({});
    setCompletedScore(null);
    window.requestAnimationFrame(() => questionHeading.current?.focus());
  }

  function finishAttempt(nextAnswers: Record<string, Answer>) {
    const score = Object.values(nextAnswers).filter(
      (answer) => answer.correct,
    ).length;
    setCompletedScore(score);
    updateCourseProgress((record) => {
      const sameVersion =
        record[config.versionStorageKey] === config.bankVersion;
      const prior = sameVersion
        ? validStoredScore(
            record[config.bestScoreStorageKey],
            config.questionCount,
          )
        : 0;
      record[config.bestScoreStorageKey] = Math.max(prior, score);
      record[config.passedStorageKey] =
        score >= config.passingCorrectAnswers ||
        (sameVersion && record[config.passedStorageKey] === true);
      record[config.versionStorageKey] = config.bankVersion;
    });
  }

  return (
    <section
      className={base.finalQuiz}
      aria-labelledby="github-final-quiz-title"
      data-testid="github-final-quiz"
    >
      <header className={base.finalQuizHeader}>
        <div>
          <p className={base.kicker}>{labels.quiz}</p>
          <h2 id="github-final-quiz-title" tabIndex={-1}>
            {labels.finalQuizTitle}
          </h2>
          <p>{labels.finalQuizIntro}</p>
        </div>
        <div className={base.quizRequirement}>
          <strong>{labels.passRequirement}</strong>
          <span>{labels.passingScore}</span>
          <span>
            {formatTemplate(labels.bestScoreTemplate, {
              score: bestScore,
              total: config.questionCount,
            })}
          </span>
        </div>
      </header>

      {!storageAvailable ? (
        <p className={base.storageWarning} role="status">
          {labels.storageUnavailable}
        </p>
      ) : null}

      {!attempt.length ? (
        <button
          className={base.primaryAction}
          type="button"
          disabled={!bankReady}
          onClick={beginAttempt}
        >
          {labels.beginQuiz}
        </button>
      ) : completedScore !== null ? (
        <div
          className={base.finalQuizResult}
          role="status"
          tabIndex={-1}
          ref={feedback}
        >
          <strong>
            {formatTemplate(labels.scoreSummaryTemplate, {
              score: completedScore,
              total: config.questionCount,
            })}
          </strong>
          <p>
            {completedScore >= config.passingCorrectAnswers
              ? labels.quizPassed
              : labels.quizNeedsReview}
          </p>
          <button
            className={base.secondaryAction}
            type="button"
            onClick={beginAttempt}
          >
            {labels.retryQuiz}
          </button>
        </div>
      ) : current ? (
        <form
          className={base.finalQuizQuestion}
          data-question-id={current.id}
          data-unit-id={current.unitId}
          onSubmit={(event) => {
            event.preventDefault();
            if (selectedIndex === null || currentAnswer) return;
            const answer = {
              selectedIndex,
              correct: selectedIndex === current.correctIndex,
            };
            setAnswers((currentAnswers) => ({
              ...currentAnswers,
              [current.id]: answer,
            }));
          }}
        >
          <div className={base.quizQuestionMeta}>
            <span>
              {formatTemplate(labels.questionProgressTemplate, {
                current: questionIndex + 1,
                total: config.questionCount,
              })}
            </span>
            <span>{current.unitTitle}</span>
          </div>
          <h3 ref={questionHeading} tabIndex={-1}>
            <GithubText text={current.prompt} />
          </h3>

          <fieldset className={base.finalQuizOptions}>
            <legend className={base.srOnly}>{current.prompt}</legend>
            {current.options.map((option, optionIndex) => (
              <label
                className={
                  currentAnswer && optionIndex === current.correctIndex
                    ? base.correctOption
                    : currentAnswer &&
                        currentAnswer.selectedIndex === optionIndex
                      ? base.incorrectOption
                      : base.option
                }
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
                <span className={base.optionCopy}>
                  <span>
                    <GithubText text={option} />
                  </span>
                  {currentAnswer && optionIndex === current.correctIndex ? (
                    <strong className={base.answerMarker}>
                      {labels.correct}
                    </strong>
                  ) : currentAnswer &&
                    currentAnswer.selectedIndex === optionIndex ? (
                    <strong className={base.answerMarker}>
                      {labels.incorrect}
                    </strong>
                  ) : null}
                </span>
              </label>
            ))}
          </fieldset>

          {currentAnswer ? (
            <div
              className={
                currentAnswer.correct
                  ? base.correctFeedback
                  : base.incorrectFeedback
              }
              ref={feedback}
              role="status"
              tabIndex={-1}
            >
              <p>
                <strong>
                  {currentAnswer.correct ? labels.correct : labels.incorrect}
                </strong>{" "}
                <GithubText text={current.explanation} />
              </p>
              <ul className={base.quizSources} aria-label={labels.source}>
                {current.sources.map((source) => (
                  <li key={source.id}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      lang="en"
                      dir="ltr"
                    >
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <button
            className={base.primaryAction}
            type={currentAnswer ? "button" : "submit"}
            onClick={
              currentAnswer
                ? () => {
                    if (questionIndex === attempt.length - 1) {
                      finishAttempt(answers);
                      return;
                    }
                    setQuestionIndex((index) => index + 1);
                    setSelectedIndex(null);
                    window.requestAnimationFrame(() =>
                      questionHeading.current?.focus(),
                    );
                  }
                : undefined
            }
          >
            {currentAnswer
              ? questionIndex === attempt.length - 1
                ? labels.finishQuiz
                : labels.nextQuestion
              : labels.checkAnswer}
          </button>
        </form>
      ) : null}
    </section>
  );
}
