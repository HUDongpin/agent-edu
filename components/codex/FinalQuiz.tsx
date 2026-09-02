"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CodexCourseCopy,
  CodexLocale,
  CodexQuizId,
  CodexSourceId,
  CodexUnitId,
} from "@/lib/codex/types";
import {
  CODEX_QUIZ_DRAFT_STORAGE_KEY,
  CODEX_QUIZ_DRAFT_VERSION,
  deriveCodexQuizResultState,
  deriveCodexQuizViewState,
  didCodexQuizStorageSliceChange,
  parseCodexQuizDraft,
  recordCodexQuizAttemptResult,
  type CodexQuizDraft,
} from "@/lib/codex/quiz-draft";
import {
  formatCodexTemplate,
  formatCodexVisibleInteger,
} from "@/lib/codex/format";
import { getCodexQuizBest, isCodexQuizPassed } from "@/lib/codex/quiz";
import {
  COURSE_PROGRESS_STORAGE_KEY,
  CODEX_PROGRESS_RESET_EVENT,
  updateCourseProgress,
} from "./progress-store";
import TechnicalText from "./TechnicalText";
import useCourseProgress, { useCourseStorageAvailable } from "./useCourseProgress";
import styles from "./CodexCourse.module.css";

export type FinalQuizQuestion = {
  readonly id: CodexQuizId;
  readonly unitId: CodexUnitId;
  readonly unitTitle: string;
  readonly prompt: string;
  readonly options: readonly string[];
  readonly correctIndex: number;
  readonly explanation: string;
  readonly sources: readonly {
    readonly id: CodexSourceId;
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

function sameQuestionSet(left: readonly FinalQuizQuestion[], right: readonly FinalQuizQuestion[]): boolean {
  if (left.length !== right.length) return false;
  const leftIds = left.map((question) => question.id).sort();
  const rightIds = right.map((question) => question.id).sort();
  return leftIds.every((id, index) => id === rightIds[index]);
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
    if (!sameQuestionSet(ordered, previous)) return ordered;
  }

  // Random retries can theoretically draw the same subsets repeatedly. Make
  // the retry contract deterministic by replacing one prior question in the
  // first unit that has an unused alternative, while preserving three per unit.
  const previousIds = new Set(previous.map((question) => question.id));
  for (const unitId of unitIds) {
    const previousUnit = previous.filter((question) => question.unitId === unitId);
    const replacement = bank.find(
      (question) => question.unitId === unitId && !previousIds.has(question.id),
    );
    if (replacement && previousUnit.length === questionsPerUnit) {
      const selected = unitIds.flatMap((candidateUnit) => (
        candidateUnit === unitId
          ? [replacement, ...previousUnit.slice(1)]
          : previous.filter((question) => question.unitId === candidateUnit)
      ));
      return shuffle(selected);
    }
  }

  // A bank with exactly questionsPerUnit entries in every unit has no distinct
  // subset. Preserve stratification and at least vary presentation order.
  return previous.length ? [...previous.slice(1), previous[0]] : [];
}

export default function FinalQuiz({
  bank,
  config,
  labels,
  locale,
}: {
  bank: readonly FinalQuizQuestion[];
  config: FinalQuizConfig;
  labels: CodexCourseCopy["ui"];
  locale: CodexLocale;
}) {
  const progress = useCourseProgress();
  const storageAvailable = useCourseStorageAvailable();
  const [attempt, setAttempt] = useState<FinalQuizQuestion[]>([]);
  const [previousAttempt, setPreviousAttempt] = useState<FinalQuizQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [completedScore, setCompletedScore] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const feedback = useRef<HTMLDivElement>(null);

  const current = attempt[questionIndex];
  const currentAnswer = current ? answers[current.id] : undefined;
  const savedBest = getCodexQuizBest(progress);
  const coursePassed = isCodexQuizPassed(progress);
  const bestScore = Math.max(savedBest ?? 0, completedScore ?? 0);

  const draftConfig = useMemo(() => ({
    bankVersion: config.bankVersion,
    questionCount: config.questionCount,
    questionsPerUnit: config.questionsPerUnit,
    questions: bank.map((question) => ({
      id: question.id,
      unitId: question.unitId,
      optionCount: question.options.length,
    })),
  }), [bank, config.bankVersion, config.questionCount, config.questionsPerUnit]);
  const rawDraft = progress[CODEX_QUIZ_DRAFT_STORAGE_KEY];
  const savedDraft = useMemo(
    () => parseCodexQuizDraft(rawDraft, draftConfig),
    [draftConfig, rawDraft],
  );
  const viewState = deriveCodexQuizViewState({
    active: attempt.length > 0,
    completedScore,
    draft: savedDraft,
    bestScore: savedBest,
    passed: coursePassed,
  });

  const bankByUnit = useMemo(() => {
    const counts = new Map<CodexUnitId, number>();
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

  const clearAttemptState = useCallback(() => {
    setAttempt([]);
    setPreviousAttempt([]);
    setQuestionIndex(0);
    setSelectedIndex(null);
    setAnswers({});
    setCompletedScore(null);
    setAnnouncement("");
  }, []);

  useEffect(() => {
    window.addEventListener(CODEX_PROGRESS_RESET_EVENT, clearAttemptState);
    return () => window.removeEventListener(CODEX_PROGRESS_RESET_EVENT, clearAttemptState);
  }, [clearAttemptState]);

  useEffect(() => {
    const reconcileExternalQuizChange = (event: StorageEvent) => {
      if (event.key === null) {
        clearAttemptState();
        return;
      }
      if (event.key !== COURSE_PROGRESS_STORAGE_KEY) return;
      if (didCodexQuizStorageSliceChange(event.oldValue, event.newValue, config)) {
        clearAttemptState();
      }
    };
    window.addEventListener("storage", reconcileExternalQuizChange);
    return () => window.removeEventListener("storage", reconcileExternalQuizChange);
  }, [clearAttemptState, config]);

  useEffect(() => {
    if (rawDraft === undefined || savedDraft) return;
    updateCourseProgress((record) => {
      delete record[CODEX_QUIZ_DRAFT_STORAGE_KEY];
    });
  }, [rawDraft, savedDraft]);

  useEffect(() => {
    if (storageAvailable || (viewState !== "active" && viewState !== "resumable")) return;
    const warnBeforeDiscard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeDiscard);
    return () => window.removeEventListener("beforeunload", warnBeforeDiscard);
  }, [storageAvailable, viewState]);

  function persistAttemptDraft(
    nextAttempt: readonly FinalQuizQuestion[],
    nextQuestionIndex: number,
    nextSelectedIndex: number | null,
    nextAnswers: Readonly<Record<string, Answer>>,
  ): void {
    const draft = {
      version: CODEX_QUIZ_DRAFT_VERSION,
      bankVersion: config.bankVersion,
      questionIds: nextAttempt.map((question) => question.id),
      questionIndex: nextQuestionIndex,
      selectedIndex: nextSelectedIndex,
      answers: Object.fromEntries(
        Object.entries(nextAnswers).map(([id, answer]) => [id, answer.selectedIndex]),
      ),
    } satisfies CodexQuizDraft;
    updateCourseProgress((record) => {
      record[CODEX_QUIZ_DRAFT_STORAGE_KEY] = draft;
    });
  }

  function beginAttempt() {
    const next = selectAttempt(bank, config.questionsPerUnit, previousAttempt);
    if (!next.length) return;
    persistAttemptDraft(next, 0, null, {});
    setAttempt(next);
    setPreviousAttempt(next);
    setQuestionIndex(0);
    setSelectedIndex(null);
    setAnswers({});
    setCompletedScore(null);
    setAnnouncement("");
    window.requestAnimationFrame(() => questionHeading.current?.focus());
  }

  function resumeAttempt() {
    if (!savedDraft) return;
    const questionById = new Map(bank.map((question) => [question.id, question]));
    const restoredAttempt = savedDraft.questionIds.flatMap((id) => {
      const question = questionById.get(id);
      return question ? [question] : [];
    });
    if (restoredAttempt.length !== config.questionCount) return;

    const restoredAnswers = Object.fromEntries(
      Object.entries(savedDraft.answers).flatMap(([id, restoredSelectedIndex]) => {
        const question = questionById.get(id as CodexQuizId);
        return question && restoredSelectedIndex !== undefined
          ? [[id, {
            selectedIndex: restoredSelectedIndex,
            correct: restoredSelectedIndex === question.correctIndex,
          } satisfies Answer]]
          : [];
      }),
    );
    setAttempt(restoredAttempt);
    setPreviousAttempt(restoredAttempt);
    setQuestionIndex(savedDraft.questionIndex);
    setSelectedIndex(savedDraft.selectedIndex);
    setAnswers(restoredAnswers);
    setCompletedScore(null);
    setAnnouncement(labels.quizDraftRestored);
    window.requestAnimationFrame(() => questionHeading.current?.focus());
  }

  function finishAttempt(nextAnswers: Record<string, Answer>) {
    const score = Object.values(nextAnswers).filter((answer) => answer.correct).length;
    setCompletedScore(score);
    updateCourseProgress((record) => {
      recordCodexQuizAttemptResult(record, config, score);
    });
  }

  const resultScore = completedScore ?? savedBest ?? 0;
  const resultState = deriveCodexQuizResultState(
    resultScore,
    config.passingCorrectAnswers,
    coursePassed,
  );
  const resultCopy = resultState === "passed"
    ? labels.quizPassed
    : resultState === "prior-pass-preserved"
      ? labels.priorPassPreserved
      : labels.quizNeedsReview;
  const recordCopy = savedBest === null
    ? viewState === "active" || viewState === "resumable"
      ? labels.quizInProgress
      : labels.notStarted
    : formatCodexTemplate(labels.bestScoreTemplate, {
      score: formatCodexVisibleInteger(bestScore, locale),
      total: formatCodexVisibleInteger(config.questionCount, locale),
    });

  return (
    <section
      className={styles.finalQuiz}
      aria-labelledby="codex-final-quiz-title"
      data-testid="codex-final-quiz"
    >
      <header className={styles.finalQuizHeader}>
        <div>
          <p className={styles.kicker}>{labels.quiz}</p>
          <h2 id="codex-final-quiz-title" tabIndex={-1}><TechnicalText text={labels.finalQuizTitle} /></h2>
          <p><TechnicalText text={formatCodexTemplate(labels.finalQuizIntro, {
            passingCorrectAnswers: formatCodexVisibleInteger(config.passingCorrectAnswers, locale),
            questionCount: formatCodexVisibleInteger(config.questionCount, locale),
            questionsPerUnit: formatCodexVisibleInteger(config.questionsPerUnit, locale),
          })} /></p>
        </div>
        <div className={styles.quizRequirement}>
          <strong><TechnicalText text={formatCodexTemplate(labels.passRequirement, {
            passingCorrectAnswers: formatCodexVisibleInteger(config.passingCorrectAnswers, locale),
            questionCount: formatCodexVisibleInteger(config.questionCount, locale),
          })} /></strong>
          <span><TechnicalText text={recordCopy} /></span>
        </div>
      </header>

      {!storageAvailable ? (
        <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p>
      ) : null}

      <p className={styles.srOnly} role="status" aria-live="polite">{announcement}</p>

      {viewState === "not-started" ? (
        <button
          className={styles.primaryAction}
          type="button"
          disabled={!bankReady}
          onClick={beginAttempt}
        >
          {labels.beginQuiz}
        </button>
      ) : viewState === "resumable" ? (
        <div className={styles.quizActions}>
          <span>{labels.quizInProgress}</span>
          <button
            className={styles.primaryAction}
            type="button"
            disabled={!bankReady}
            onClick={resumeAttempt}
          >
            {labels.continueQuiz}
          </button>
        </div>
      ) : viewState === "passed-idle" ? (
        <div className={styles.finalQuizResult} data-outcome="passed">
          <strong><TechnicalText text={formatCodexTemplate(labels.scoreSummaryTemplate, {
            score: formatCodexVisibleInteger(savedBest ?? 0, locale),
            total: formatCodexVisibleInteger(config.questionCount, locale),
          })} /></strong>
          <p><TechnicalText text={labels.quizPassed} /></p>
          <button className={styles.secondaryAction} type="button" onClick={beginAttempt}>
            {labels.retakeQuiz}
          </button>
        </div>
      ) : viewState === "finished" ? (
        <div
          className={styles.finalQuizResult}
          data-outcome={resultState}
          role={completedScore !== null ? "status" : undefined}
          tabIndex={completedScore !== null ? -1 : undefined}
          ref={completedScore !== null ? feedback : undefined}
        >
          <strong><TechnicalText text={formatCodexTemplate(labels.scoreSummaryTemplate, {
            score: formatCodexVisibleInteger(resultScore, locale),
            total: formatCodexVisibleInteger(config.questionCount, locale),
          })} /></strong>
          <p><TechnicalText text={resultCopy} /></p>
          <button className={styles.secondaryAction} type="button" onClick={beginAttempt}>
            {coursePassed ? labels.retakeQuiz : labels.retryQuiz}
          </button>
        </div>
      ) : viewState === "active" && current ? (
        <form
          className={styles.finalQuizQuestion}
          data-question-id={current.id}
          data-unit-id={current.unitId}
          onSubmit={(event) => {
            event.preventDefault();
            if (selectedIndex === null || currentAnswer) return;
            const answer = {
              selectedIndex,
              correct: selectedIndex === current.correctIndex,
            };
            const nextAnswers = { ...answers, [current.id]: answer };
            setAnswers(nextAnswers);
            persistAttemptDraft(attempt, questionIndex, selectedIndex, nextAnswers);
          }}
        >
          <div className={styles.quizQuestionMeta} id="codex-final-quiz-question-meta">
            <span>{formatCodexTemplate(labels.questionProgressTemplate, {
              current: formatCodexVisibleInteger(questionIndex + 1, locale),
              total: formatCodexVisibleInteger(config.questionCount, locale),
            })}</span>
            <span><TechnicalText text={current.unitTitle} /></span>
          </div>
          <h3
            aria-describedby="codex-final-quiz-question-meta"
            ref={questionHeading}
            tabIndex={-1}
          >
            <TechnicalText text={current.prompt} />
          </h3>

          <fieldset className={styles.finalQuizOptions}>
            <legend className={styles.srOnly}>{current.prompt}</legend>
            {current.options.map((option, optionIndex) => (
              <label
                className={
                  currentAnswer && optionIndex === current.correctIndex
                    ? styles.correctOption
                    : currentAnswer && currentAnswer.selectedIndex === optionIndex
                      ? styles.incorrectOption
                      : styles.option
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
                    persistAttemptDraft(attempt, questionIndex, optionIndex, answers);
                  }}
                />
                <span className={styles.optionCopy}>
                  <span><TechnicalText text={option} /></span>
                  {currentAnswer && optionIndex === current.correctIndex ? (
                    <strong className={styles.answerMarker} data-answer-state="correct">{labels.correct}</strong>
                  ) : currentAnswer && currentAnswer.selectedIndex === optionIndex ? (
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
                {" "}<TechnicalText text={current.explanation} />
              </p>
              <ul className={styles.quizSources} aria-label={labels.sources}>
                {current.sources.map((source) => (
                  <li key={source.id}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer"><TechnicalText text={source.title} /></a>
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
              const nextQuestionIndex = questionIndex + 1;
              setQuestionIndex(nextQuestionIndex);
              setSelectedIndex(null);
              persistAttemptDraft(attempt, nextQuestionIndex, null, answers);
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
