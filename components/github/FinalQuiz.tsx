"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  GithubQuizId,
  GithubSourceId,
  GithubUiCopy,
  GithubUnitId,
} from "@/lib/github";
import {
  GITHUB_QUIZ_DRAFT_KEY,
  clearInvalidGithubQuizDraft,
  clearGithubQuizDraft,
  decodeGithubQuizDraft,
  formatGithubVisibleNumbers,
  setGithubQuizDraft,
  type GithubQuizDraftContext,
} from "@/lib/github";
import { GITHUB_RESET_EVENT, updateCourseProgress } from "./progress-store";
import useGithubProgress, {
  useGithubStorageAvailable,
} from "./useGithubProgress";
import GithubText from "./GithubText";
import base from "@/components/codex/CodexCourse.module.css";
import styles from "./GithubCourse.module.css";

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
  locale,
}: {
  bank: readonly GithubFinalQuizQuestion[];
  config: FinalQuizConfig;
  labels: GithubUiCopy;
  locale: string;
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
  const [draftStatus, setDraftStatus] = useState("");
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);

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

  const draftContext = useMemo<GithubQuizDraftContext>(
    () => ({
      bankVersion: config.bankVersion,
      questionCount: config.questionCount,
      questionsPerUnit: config.questionsPerUnit,
      questions: bank.map((question) => ({
        id: question.id,
        unitId: question.unitId,
        optionCount: question.options.length,
      })),
    }),
    [bank, config.bankVersion, config.questionCount, config.questionsPerUnit],
  );
  const storedDraftValue = progress[GITHUB_QUIZ_DRAFT_KEY];
  const hasStoredDraft = Object.hasOwn(progress, GITHUB_QUIZ_DRAFT_KEY);
  const resumableDraft = useMemo(
    () => decodeGithubQuizDraft(storedDraftValue, draftContext),
    [draftContext, storedDraftValue],
  );

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
    if (attempt.length || !hasStoredDraft || resumableDraft) return;
    updateCourseProgress((record) => {
      clearInvalidGithubQuizDraft(record, draftContext);
    });
  }, [attempt.length, draftContext, hasStoredDraft, resumableDraft]);

  useEffect(() => {
    const resetAttempt = () => {
      setAttempt([]);
      setPreviousAttempt([]);
      setQuestionIndex(0);
      setSelectedIndex(null);
      setAnswers({});
      setCompletedScore(null);
      setDraftStatus("");
    };
    window.addEventListener(GITHUB_RESET_EVENT, resetAttempt);
    return () => window.removeEventListener(GITHUB_RESET_EVENT, resetAttempt);
  }, []);

  function persistDraft(
    nextAttempt: readonly GithubFinalQuizQuestion[],
    nextQuestionIndex: number,
    nextSelectedIndex: number | null,
    nextAnswers: Readonly<Record<string, Answer>>,
  ) {
    updateCourseProgress((record) => {
      setGithubQuizDraft(
        record,
        {
          orderedQuestionIds: nextAttempt.map((question) => question.id),
          questionIndex: nextQuestionIndex,
          selectedIndex: nextSelectedIndex,
          submittedAnswers: Object.fromEntries(
            Object.entries(nextAnswers).map(([id, answer]) => [
              id,
              answer.selectedIndex,
            ]),
          ),
        },
        draftContext,
      );
    });
  }

  function beginAttempt() {
    const next = selectAttempt(bank, config.questionsPerUnit, previousAttempt);
    setAttempt(next);
    setPreviousAttempt(next);
    setQuestionIndex(0);
    setSelectedIndex(null);
    setAnswers({});
    setCompletedScore(null);
    setDraftStatus("");
    persistDraft(next, 0, null, {});
    window.requestAnimationFrame(() => questionHeading.current?.focus());
  }

  function resumeAttempt() {
    if (!resumableDraft) return;
    const bankById = new Map(bank.map((question) => [question.id, question]));
    const restoredAttempt = resumableDraft.orderedQuestionIds.map(
      (id) => bankById.get(id)!,
    );
    const restoredAnswers = Object.fromEntries(
      Object.entries(resumableDraft.submittedAnswers).map(
        ([id, restoredSelectedIndex]) => {
          const question = bankById.get(id as GithubQuizId)!;
          return [
            id,
            {
              selectedIndex: restoredSelectedIndex,
              correct: restoredSelectedIndex === question.correctIndex,
            },
          ];
        },
      ),
    );
    setAttempt(restoredAttempt);
    setPreviousAttempt(restoredAttempt);
    setQuestionIndex(resumableDraft.questionIndex);
    setSelectedIndex(resumableDraft.selectedIndex);
    setAnswers(restoredAnswers);
    setCompletedScore(null);
    setDraftStatus(labels.quizDraftRestored);
    window.requestAnimationFrame(() => {
      if (Object.hasOwn(restoredAnswers, restoredAttempt[resumableDraft.questionIndex].id)) {
        feedback.current?.focus();
      } else {
        questionHeading.current?.focus();
      }
    });
  }

  function discardAttempt() {
    updateCourseProgress((record) => {
      clearGithubQuizDraft(record);
    });
    setAttempt([]);
    setPreviousAttempt([]);
    setQuestionIndex(0);
    setSelectedIndex(null);
    setAnswers({});
    setCompletedScore(null);
    setDraftStatus(labels.quizDraftDiscarded);
  }

  function finishAttempt(nextAnswers: Record<string, Answer>) {
    const score = Object.values(nextAnswers).filter(
      (answer) => answer.correct,
    ).length;
    setCompletedScore(score);
    updateCourseProgress((record) => {
      clearGithubQuizDraft(record);
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
          <h2
            className={styles.focusTarget}
            id="github-final-quiz-title"
            tabIndex={-1}
          >
            {labels.finalQuizTitle}
          </h2>
          <p>{labels.finalQuizIntro}</p>
        </div>
        <div className={base.quizRequirement}>
          <strong>{labels.passRequirement}</strong>
          <span>{formatGithubVisibleNumbers(locale, labels.passingScore)}</span>
          <span data-testid="github-quiz-best-score">
            {formatTemplate(labels.bestScoreTemplate, {
              score: numberFormat.format(bestScore),
              total: numberFormat.format(config.questionCount),
            })}
          </span>
        </div>
      </header>

      {!storageAvailable ? (
        <p className={base.storageWarning} role="status">
          {labels.storageUnavailable}{" "}
          {attempt.length && completedScore === null
            ? labels.draftStorageWarning
            : null}
        </p>
      ) : null}

      {draftStatus || (hasStoredDraft && !resumableDraft) ? (
        <p className={styles.draftStatus} role="status">
          {draftStatus || labels.draftInvalid}
        </p>
      ) : null}

      {!attempt.length && resumableDraft ? (
        <div className={styles.draftPrompt}>
          <p>{labels.quizDraftAvailable}</p>
          <div className={styles.draftActions}>
            <button
              className={`${base.primaryAction} ${styles.courseAction}`}
              type="button"
              onClick={resumeAttempt}
            >
              {labels.resumeQuizDraft}
            </button>
            <button
              className={`${base.secondaryAction} ${styles.courseAction}`}
              type="button"
              onClick={discardAttempt}
            >
              {labels.discardQuizDraft}
            </button>
          </div>
        </div>
      ) : !attempt.length ? (
        <button
          className={`${base.primaryAction} ${styles.courseAction}`}
          type="button"
          disabled={!bankReady}
          onClick={beginAttempt}
        >
          {formatGithubVisibleNumbers(locale, labels.beginQuiz)}
        </button>
      ) : completedScore !== null ? (
        <div
          className={`${base.finalQuizResult} ${styles.focusTarget} ${
            completedScore >= config.passingCorrectAnswers
              ? styles.quizResultPassed
              : styles.quizResultRetry
          }`}
          data-result-state={
            completedScore >= config.passingCorrectAnswers ? "passed" : "retry"
          }
          role="status"
          tabIndex={-1}
          ref={feedback}
        >
          <strong>
            {formatTemplate(labels.scoreSummaryTemplate, {
              score: numberFormat.format(completedScore),
              total: numberFormat.format(config.questionCount),
            })}
          </strong>
          <p>
            {completedScore >= config.passingCorrectAnswers
              ? labels.quizPassed
              : labels.quizNeedsReview}
          </p>
          <button
            className={`${base.secondaryAction} ${styles.courseAction}`}
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
            const nextAnswers = {
              ...answers,
              [current.id]: answer,
            };
            setAnswers(nextAnswers);
            persistDraft(attempt, questionIndex, selectedIndex, nextAnswers);
          }}
        >
          <div className={base.quizQuestionMeta}>
            <span>
              {formatTemplate(labels.questionProgressTemplate, {
                current: numberFormat.format(questionIndex + 1),
                total: numberFormat.format(config.questionCount),
              })}
            </span>
            <span>{current.unitTitle}</span>
          </div>
          <h3 className={styles.focusTarget} ref={questionHeading} tabIndex={-1}>
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
                  onChange={() => {
                    setSelectedIndex(optionIndex);
                    persistDraft(attempt, questionIndex, optionIndex, answers);
                  }}
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
              className={`${
                currentAnswer.correct
                  ? base.correctFeedback
                  : base.incorrectFeedback
              } ${styles.focusTarget}`}
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
                    >
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <button
            className={`${base.primaryAction} ${styles.courseAction}`}
            type={currentAnswer ? "button" : "submit"}
            onClick={
              currentAnswer
                ? () => {
                    if (questionIndex === attempt.length - 1) {
                      finishAttempt(answers);
                      return;
                    }
                    const nextQuestionIndex = questionIndex + 1;
                    setQuestionIndex(nextQuestionIndex);
                    setSelectedIndex(null);
                    persistDraft(
                      attempt,
                      nextQuestionIndex,
                      null,
                      answers,
                    );
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
