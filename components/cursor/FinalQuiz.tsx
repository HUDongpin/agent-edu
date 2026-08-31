"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CursorCourseCopy,
  CursorQuizId,
  CursorQuizOptionId,
  CursorSourceId,
  CursorUnitId,
} from "@/lib/cursor";
import { applyCursorProgressPatch } from "./progress-store";
import {
  CURSOR_ASSESSMENT_DRAFT_RESET_EVENT,
  CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY,
  clearSessionDraft,
  readSessionDraft,
  writeSessionDraft,
} from "./session-draft-store";
import useCourseProgress, { useCourseStorageAvailable } from "./useCourseProgress";
import styles from "./CursorCourse.module.css";

const FINAL_QUIZ_DRAFT_SCHEMA_VERSION = 2;

export type FinalQuizQuestion = {
  readonly id: CursorQuizId;
  readonly unitId: CursorUnitId;
  readonly unitOrder: number;
  readonly unitTitle: string;
  readonly lessonOrder: number;
  readonly lessonTitle: string;
  readonly reviewHref: string;
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

type FinalQuizAttemptDraft = {
  readonly schemaVersion: typeof FINAL_QUIZ_DRAFT_SCHEMA_VERSION;
  readonly phase: "answering";
  readonly bankVersion: string;
  readonly questionIds: readonly CursorQuizId[];
  readonly questionIndex: number;
  readonly selectedOptionId: CursorQuizOptionId | null;
  readonly checkedAnswers: Readonly<Record<string, CursorQuizOptionId>>;
};

type FinalQuizReviewDraft = {
  readonly schemaVersion: typeof FINAL_QUIZ_DRAFT_SCHEMA_VERSION;
  readonly phase: "failed-review";
  readonly bankVersion: string;
  readonly questionIds: readonly CursorQuizId[];
  readonly checkedAnswers: Readonly<Record<string, CursorQuizOptionId>>;
};

type FinalQuizDraft = FinalQuizAttemptDraft | FinalQuizReviewDraft;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

function isValidQuizDraft(
  value: unknown,
  bank: readonly FinalQuizQuestion[],
  config: FinalQuizConfig,
): value is FinalQuizDraft {
  if (!isRecord(value)) return false;
  const answering = value.phase === "answering";
  const failedReview = value.phase === "failed-review";
  if ((!answering && !failedReview) || !hasExactKeys(value, answering ? [
    "schemaVersion", "phase", "bankVersion", "questionIds", "questionIndex",
    "selectedOptionId", "checkedAnswers",
  ] : [
    "schemaVersion", "phase", "bankVersion", "questionIds", "checkedAnswers",
  ])) return false;
  if (value.schemaVersion !== FINAL_QUIZ_DRAFT_SCHEMA_VERSION
    || value.bankVersion !== config.bankVersion
    || !Array.isArray(value.questionIds)
    || value.questionIds.length !== config.questionCount
    || !isRecord(value.checkedAnswers)) {
    return false;
  }

  const bankById = new Map<string, FinalQuizQuestion>(
    bank.map((question) => [question.id, question]),
  );
  const questionIds = value.questionIds;
  const checkedAnswers = value.checkedAnswers;
  if (questionIds.some((id) => typeof id !== "string" || !bankById.has(id))
    || new Set(questionIds).size !== questionIds.length) {
    return false;
  }

  const selectedUnitCounts = new Map<CursorUnitId, number>();
  for (const id of questionIds) {
    const question = bankById.get(id as string)!;
    selectedUnitCounts.set(
      question.unitId,
      (selectedUnitCounts.get(question.unitId) ?? 0) + 1,
    );
  }
  const bankUnitIds = [...new Set(bank.map((question) => question.unitId))];
  if (bankUnitIds.length * config.questionsPerUnit !== config.questionCount
    || bankUnitIds.some((unitId) => selectedUnitCounts.get(unitId) !== config.questionsPerUnit)) {
    return false;
  }

  const attemptedIds = new Set(questionIds as string[]);
  for (const [questionId, optionId] of Object.entries(checkedAnswers)) {
    const question = bankById.get(questionId);
    if (!question
      || !attemptedIds.has(questionId)
      || typeof optionId !== "string"
      || !question.options.some((option) => option.id === optionId)) {
      return false;
    }
  }

  if (failedReview) {
    if (Object.keys(checkedAnswers).length !== config.questionCount
      || questionIds.some((id) => !Object.prototype.hasOwnProperty.call(checkedAnswers, id))) {
      return false;
    }
    const score = questionIds.filter((id) => (
      checkedAnswers[id] === bankById.get(id as string)!.correctOptionId
    )).length;
    return score < config.passingCorrectAnswers;
  }

  if (!Number.isInteger(value.questionIndex)
    || (value.questionIndex as number) < 0
    || (value.questionIndex as number) >= config.questionCount) {
    return false;
  }

  const questionIndex = value.questionIndex as number;
  for (let index = 0; index < questionIds.length; index += 1) {
    const hasAnswer = Object.prototype.hasOwnProperty.call(
      checkedAnswers,
      questionIds[index] as string,
    );
    if ((index < questionIndex && !hasAnswer) || (index > questionIndex && hasAnswer)) return false;
  }

  const current = bankById.get(questionIds[questionIndex] as string)!;
  if (value.selectedOptionId !== null
    && (typeof value.selectedOptionId !== "string"
      || !current.options.some((option) => option.id === value.selectedOptionId))) {
    return false;
  }
  const checkedCurrent = value.checkedAnswers[current.id];
  if (checkedCurrent !== undefined && checkedCurrent !== value.selectedOptionId) return false;

  return true;
}

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
  const [completionPersisted, setCompletionPersisted] = useState<boolean | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [progressCommitFailed, setProgressCommitFailed] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [draftStorageAvailable, setDraftStorageAvailable] = useState(true);
  const draftResetGeneration = useRef(0);
  const finishingAttempt = useRef(false);
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

  const missedGroups = useMemo(() => {
    const grouped = new Map<CursorUnitId, {
      unitId: CursorUnitId;
      unitOrder: number;
      unitTitle: string;
      questions: FinalQuizQuestion[];
    }>();
    const missed = attempt
      .filter((question) => answers[question.id]?.correct === false)
      .sort((left, right) => (
        left.unitOrder - right.unitOrder
        || left.lessonOrder - right.lessonOrder
        || left.id.localeCompare(right.id)
      ));

    for (const question of missed) {
      const group = grouped.get(question.unitId) ?? {
        unitId: question.unitId,
        unitOrder: question.unitOrder,
        unitTitle: question.unitTitle,
        questions: [],
      };
      group.questions.push(question);
      grouped.set(question.unitId, group);
    }

    return [...grouped.values()].sort((left, right) => left.unitOrder - right.unitOrder);
  }, [answers, attempt]);
  const firstMissedQuestion = missedGroups[0]?.questions[0];

  useEffect(() => {
    const hydrationGeneration = draftResetGeneration.current;
    const draft = readSessionDraft(
      CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY,
      (value): value is FinalQuizDraft => isValidQuizDraft(value, bank, config),
    );
    const hydrationTimer = window.setTimeout(() => {
      if (draft && hydrationGeneration === draftResetGeneration.current) {
        const bankById = new Map<string, FinalQuizQuestion>(
          bank.map((question) => [question.id, question]),
        );
        const restoredAttempt = draft.questionIds.map((id) => bankById.get(id)!);
        const restoredAnswers = Object.fromEntries(
          Object.entries(draft.checkedAnswers).map(([questionId, optionId]) => {
            const question = bankById.get(questionId)!;
            return [questionId, {
              selectedOptionId: optionId,
              correct: optionId === question.correctOptionId,
            }];
          }),
        );
        setAttempt(restoredAttempt);
        setPreviousAttempt(restoredAttempt);
        setAnswers(restoredAnswers);
        if (draft.phase === "failed-review") {
          setQuestionIndex(config.questionCount - 1);
          setSelectedOptionId(null);
          setCompletedScore(Object.values(restoredAnswers).filter((answer) => answer.correct).length);
          setCompletionPersisted(true);
        } else {
          setQuestionIndex(draft.questionIndex);
          setSelectedOptionId(draft.selectedOptionId);
        }
      }
      setDraftHydrated(true);
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, [bank, config]);

  useEffect(() => {
    const resetAttempt = () => {
      draftResetGeneration.current += 1;
      setAttempt([]);
      setPreviousAttempt([]);
      setQuestionIndex(0);
      setSelectedOptionId(null);
      setAnswers({});
      setCompletedScore(null);
      setCompletionPersisted(null);
      setIsFinishing(false);
      setProgressCommitFailed(false);
      setDraftHydrated(true);
      setDraftStorageAvailable(true);
      finishingAttempt.current = false;
    };
    window.addEventListener(CURSOR_ASSESSMENT_DRAFT_RESET_EVENT, resetAttempt);
    return () => window.removeEventListener(CURSOR_ASSESSMENT_DRAFT_RESET_EVENT, resetAttempt);
  }, []);

  useEffect(() => {
    if (!draftHydrated) return;
    let persisted = true;
    if (!attempt.length
      || (completedScore !== null
        && completionPersisted === true
        && completedScore >= config.passingCorrectAnswers)) {
      clearSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY);
    } else if (completedScore !== null && completionPersisted === true) {
      persisted = writeSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY, {
        schemaVersion: FINAL_QUIZ_DRAFT_SCHEMA_VERSION,
        phase: "failed-review",
        bankVersion: config.bankVersion,
        questionIds: attempt.map((question) => question.id),
        checkedAnswers: Object.fromEntries(
          Object.entries(answers).map(([questionId, answer]) => [
            questionId,
            answer.selectedOptionId,
          ]),
        ),
      } satisfies FinalQuizReviewDraft);
    } else {
      persisted = writeSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY, {
        schemaVersion: FINAL_QUIZ_DRAFT_SCHEMA_VERSION,
        phase: "answering",
        bankVersion: config.bankVersion,
        questionIds: attempt.map((question) => question.id),
        questionIndex,
        selectedOptionId,
        checkedAnswers: Object.fromEntries(
          Object.entries(answers).map(([questionId, answer]) => [
            questionId,
            answer.selectedOptionId,
          ]),
        ),
      } satisfies FinalQuizAttemptDraft);
    }
    const availabilityTimer = window.setTimeout(() => setDraftStorageAvailable(persisted), 0);
    return () => window.clearTimeout(availabilityTimer);
  }, [
    answers,
    attempt,
    completedScore,
    completionPersisted,
    config.bankVersion,
    config.passingCorrectAnswers,
    draftHydrated,
    questionIndex,
    selectedOptionId,
  ]);

  useEffect(() => {
    if (draftStorageAvailable
      || !attempt.length
      || (completedScore !== null && completionPersisted !== false)) return;
    const guardFullUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guardFullUnload);
    return () => window.removeEventListener("beforeunload", guardFullUnload);
  }, [attempt.length, completedScore, completionPersisted, draftStorageAvailable]);

  useEffect(() => {
    if (currentAnswer) feedback.current?.focus();
  }, [currentAnswer]);

  useEffect(() => {
    if (completedScore !== null) feedback.current?.focus();
  }, [completedScore]);

  function beginAttempt() {
    clearSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY);
    const next = selectAttempt(bank, config.questionsPerUnit, previousAttempt);
    setAttempt(next);
    setPreviousAttempt(next);
    setQuestionIndex(0);
    setSelectedOptionId(null);
    setAnswers({});
    setCompletedScore(null);
    setCompletionPersisted(null);
    setIsFinishing(false);
    setProgressCommitFailed(false);
    finishingAttempt.current = false;
    window.requestAnimationFrame(() => questionHeading.current?.focus());
  }

  async function finishAttempt(nextAnswers: Record<string, Answer>) {
    if (finishingAttempt.current) return;
    finishingAttempt.current = true;
    setIsFinishing(true);
    setProgressCommitFailed(false);
    const score = Object.values(nextAnswers).filter((answer) => answer.correct).length;
    try {
      const result = await applyCursorProgressPatch({
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
      setCompletionPersisted(result.persisted);
      setCompletedScore(score);
    } catch {
      // Keep the valid final-question draft and let the learner retry the
      // commit. A lock or storage failure must never erase an attempt.
      setProgressCommitFailed(true);
    } finally {
      finishingAttempt.current = false;
      setIsFinishing(false);
    }
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

      {!storageAvailable || !draftStorageAvailable || progressCommitFailed ? (
        <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p>
      ) : null}

      {!attempt.length ? (
        <button
          className={styles.primaryAction}
          type="button"
          disabled={!bankReady}
          onClick={beginAttempt}
          data-course-action
        >
          {labels.beginQuiz}
        </button>
      ) : completedScore !== null ? (
        <div
          className={styles.finalQuizResult}
          data-result-state={completedScore >= config.passingCorrectAnswers ? "passed" : "needs-review"}
        >
          <div className={styles.finalQuizResultStatus} role="status" tabIndex={-1} ref={feedback}>
            <strong>{formatTemplate(labels.scoreSummaryTemplate, {
              score: completedScore,
              total: config.questionCount,
            })}</strong>
            <p>{completedScore >= config.passingCorrectAnswers ? labels.quizPassed : labels.finalQuizNeedsReview}</p>
          </div>

          {completedScore < config.passingCorrectAnswers && firstMissedQuestion ? (
            <section
              className={styles.finalQuizReview}
              aria-labelledby="cursor-final-quiz-review-title"
              data-testid="cursor-final-quiz-review"
            >
              <h3 id="cursor-final-quiz-review-title">{labels.missedConcepts}</h3>
              <div className={styles.finalQuizReviewActions}>
                <Link
                  className={styles.primaryAction}
                  href={firstMissedQuestion.reviewHref}
                  data-course-action
                >
                  {labels.reviewMissedLessons}
                </Link>
                <button
                  className={styles.secondaryAction}
                  type="button"
                  onClick={beginAttempt}
                  data-course-action
                >
                  {labels.retryQuiz}
                </button>
              </div>
              <div className={styles.missedUnitList}>
                {missedGroups.map((group) => (
                  <section
                    aria-labelledby={`cursor-final-quiz-${group.unitId}-title`}
                    data-unit-id={group.unitId}
                    key={group.unitId}
                  >
                    <h4 id={`cursor-final-quiz-${group.unitId}-title`}>{group.unitTitle}</h4>
                    <ul>
                      {group.questions.map((question) => (
                        <li data-missed-question-id={question.id} key={question.id}>
                          <p><strong>{labels.incorrect}</strong> {question.prompt}</p>
                          <p>{question.explanation}</p>
                          <Link
                            className={styles.reviewLessonLink}
                            href={question.reviewHref}
                            data-course-action
                          >
                            {formatTemplate(labels.reviewLessonTemplate, {
                              lesson: question.lessonTitle,
                            })}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </section>
          ) : (
            <button
              className={styles.secondaryAction}
              type="button"
              onClick={beginAttempt}
              data-course-action
            >
              {labels.retryQuiz}
            </button>
          )}
        </div>
      ) : current ? (
        <form
          className={styles.finalQuizQuestion}
          data-question-id={current.id}
          data-unit-id={current.unitId}
          aria-busy={isFinishing}
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
                    <a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <button
            className={styles.primaryAction}
            type={currentAnswer ? "button" : "submit"}
            data-course-action
            disabled={isFinishing}
            onClick={currentAnswer ? () => {
              if (questionIndex === attempt.length - 1) {
                void finishAttempt(answers);
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
