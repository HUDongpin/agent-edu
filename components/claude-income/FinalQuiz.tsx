"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CLAUDE_INCOME_COURSE } from "@/lib/claude-income/curriculum";
import {
  CLAUDE_INCOME_FINAL_QUIZ,
  CLAUDE_INCOME_QUIZ_BANK,
} from "@/lib/claude-income/quiz";
import {
  getClaudeIncomeSource,
  getClaudeIncomeSourceHref,
} from "@/lib/claude-income/sources";
import type {
  ClaudeIncomeQuizQuestion,
  ClaudeIncomeUnitId,
} from "@/lib/claude-income/types";
import ExternalLinkCue from "./ExternalLinkCue";
import {
  CLAUDE_INCOME_PROGRESS_RESET_EVENT,
  updateProgress,
} from "./progress-store";
import {
  clearClaudeIncomeQuizAttempt,
  writeClaudeIncomeQuizAttempt,
  type ClaudeIncomeQuizAttemptDraft,
} from "./quiz-attempt-store";
import {
  useCourseHydrated,
  useCourseProgress,
  useCourseStorageAvailable,
} from "./useCourseProgress";
import { useClaudeIncomeQuizAttempt } from "./useQuizAttempt";
import styles from "./ClaudeIncomeCourse.module.css";

type Answer = {
  readonly selectedIndex: number;
  readonly correct: boolean;
};

const QUESTION_BY_ID = new Map<string, ClaudeIncomeQuizQuestion>(
  CLAUDE_INCOME_QUIZ_BANK.map((question) => [question.id, question]),
);

function checkedAnswerIndexes(
  attempt: readonly ClaudeIncomeQuizQuestion[],
  answers: Readonly<Record<string, Answer>>,
): number[] {
  const indexes: number[] = [];
  for (const question of attempt) {
    const answer = answers[question.id];
    if (!answer) break;
    indexes.push(answer.selectedIndex);
  }
  return indexes;
}

function attemptDraft(
  attempt: readonly ClaudeIncomeQuizQuestion[],
  index: number,
  selectedIndex: number | null,
  answers: Readonly<Record<string, Answer>>,
): ClaudeIncomeQuizAttemptDraft {
  return {
    schemaVersion: 1,
    bankVersion: CLAUDE_INCOME_FINAL_QUIZ.bankVersion,
    questionIds: attempt.map((question) => question.id),
    index,
    selectedIndex,
    answers: checkedAnswerIndexes(attempt, answers),
  };
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
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = randomIndex(index + 1);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function selectBalancedAttempt(): ClaudeIncomeQuizQuestion[] {
  const selected = CLAUDE_INCOME_COURSE.units.flatMap((unit) => {
    const unitQuestions: readonly ClaudeIncomeQuizQuestion[] = CLAUDE_INCOME_QUIZ_BANK.filter(
      (item) => item.unitId === unit.id,
    );
    const critical = shuffle(unitQuestions.filter(
      (item) => "critical" in item && item.critical === true,
    ))[0];
    if (!critical) return [];
    const remaining = shuffle(unitQuestions.filter((item) => !item.critical)).slice(
      0,
      CLAUDE_INCOME_FINAL_QUIZ.questionsPerUnit - 1,
    );
    return shuffle([critical, ...remaining]);
  });
  return shuffle(selected);
}

function storedScore(value: unknown): number {
  return typeof value === "number"
    && Number.isInteger(value)
    && value >= 0
    && value <= CLAUDE_INCOME_FINAL_QUIZ.questionCount
    ? value
    : 0;
}

export default function FinalQuiz({ courseHref }: { courseHref: string }) {
  const progress = useCourseProgress();
  const hydrated = useCourseHydrated();
  const storageAvailable = useCourseStorageAvailable();
  const {
    draft: savedAttempt,
    persistenceAvailable: attemptPersistenceAvailable,
  } = useClaudeIncomeQuizAttempt();
  const [attempt, setAttempt] = useState<ClaudeIncomeQuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<{ score: number; criticalClear: boolean; passed: boolean } | null>(null);
  const [attemptStatus, setAttemptStatus] = useState("");
  const [attemptClearFailed, setAttemptClearFailed] = useState(false);
  const startButtonRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const current = attempt[index];
  const currentId = current?.id;
  const currentAnswer = current ? answers[current.id] : undefined;
  const versionMatches = progress[CLAUDE_INCOME_FINAL_QUIZ.versionStorageKey]
    === CLAUDE_INCOME_FINAL_QUIZ.bankVersion;
  const best = versionMatches
    ? storedScore(progress[CLAUDE_INCOME_FINAL_QUIZ.bestScoreStorageKey])
    : 0;
  const priorPass = versionMatches
    && progress[CLAUDE_INCOME_FINAL_QUIZ.passedStorageKey] === true;
  const bankReady = useMemo(() => CLAUDE_INCOME_COURSE.units.every((unit) => {
    const questions = CLAUDE_INCOME_QUIZ_BANK.filter((item) => item.unitId === unit.id);
    return questions.length >= CLAUDE_INCOME_FINAL_QUIZ.questionsPerUnit
      && questions.some((item) => "critical" in item && item.critical === true);
  }), []);
  const missedQuestions = useMemo(
    () => result
      ? attempt.filter((question) => answers[question.id]?.correct === false)
      : [],
    [answers, attempt, result],
  );

  useEffect(() => {
    if (result) resultRef.current?.focus();
    else if (currentAnswer) feedbackRef.current?.focus();
    else if (currentId) headingRef.current?.focus();
  }, [currentAnswer, currentId, result]);

  useEffect(() => {
    const reset = () => {
      setAttempt([]);
      setIndex(0);
      setSelectedIndex(null);
      setAnswers({});
      setResult(null);
      setAttemptStatus("");
      setAttemptClearFailed(false);
    };
    window.addEventListener(CLAUDE_INCOME_PROGRESS_RESET_EVENT, reset);
    return () => window.removeEventListener(CLAUDE_INCOME_PROGRESS_RESET_EVENT, reset);
  }, []);

  function begin() {
    if (!hydrated || !bankReady) return;
    const nextAttempt = selectBalancedAttempt();
    if (nextAttempt.length !== CLAUDE_INCOME_FINAL_QUIZ.questionCount) return;
    writeClaudeIncomeQuizAttempt(attemptDraft(nextAttempt, 0, null, {}));
    setAttempt(nextAttempt);
    setIndex(0);
    setSelectedIndex(null);
    setAnswers({});
    setResult(null);
    setAttemptStatus("");
    setAttemptClearFailed(false);
  }

  function resume() {
    if (!savedAttempt) return;
    const restoredAttempt = savedAttempt.questionIds.map((id) => QUESTION_BY_ID.get(id));
    if (restoredAttempt.some((question) => !question)) {
      clearClaudeIncomeQuizAttempt();
      return;
    }
    const restoredAnswers: Record<string, Answer> = {};
    for (let answerIndex = 0; answerIndex < savedAttempt.answers.length; answerIndex += 1) {
      const question = restoredAttempt[answerIndex]!;
      const selected = savedAttempt.answers[answerIndex]!;
      restoredAnswers[question.id] = {
        selectedIndex: selected,
        correct: selected === question.correctIndex,
      };
    }
    setAttempt(restoredAttempt as ClaudeIncomeQuizQuestion[]);
    setIndex(savedAttempt.index);
    setSelectedIndex(savedAttempt.selectedIndex);
    setAnswers(restoredAnswers);
    setResult(null);
    setAttemptStatus("");
    setAttemptClearFailed(false);
  }

  function discard() {
    if (!window.confirm("Discard this unfinished quiz attempt? Your saved course results will stay intact.")) {
      return;
    }
    const cleared = clearClaudeIncomeQuizAttempt();
    if (!cleared.persisted) {
      setAttemptClearFailed(true);
      setAttemptStatus("The saved attempt could not be discarded. Retry before leaving this page.");
      return;
    }
    setAttempt([]);
    setIndex(0);
    setSelectedIndex(null);
    setAnswers({});
    setResult(null);
    setAttemptStatus("Saved attempt discarded.");
    setAttemptClearFailed(false);
    window.requestAnimationFrame(() => startButtonRef.current?.focus());
  }

  function retryAttemptCleanup() {
    const cleared = clearClaudeIncomeQuizAttempt();
    setAttemptClearFailed(!cleared.persisted);
    if (cleared.persisted) setAttemptStatus("Saved attempt cleared.");
  }

  function finish() {
    const score = Object.values(answers).filter((answer) => answer.correct).length;
    const selectedCritical = attempt.filter((question) => question.critical);
    const criticalClear = selectedCritical.length === CLAUDE_INCOME_COURSE.units.length
      && selectedCritical.every((question) => answers[question.id]?.correct === true);
    const passed = score >= CLAUDE_INCOME_FINAL_QUIZ.passingCorrectAnswers && criticalClear;
    setResult({ score, criticalClear, passed });
    updateProgress((record) => {
      const sameVersion = record[CLAUDE_INCOME_FINAL_QUIZ.versionStorageKey]
        === CLAUDE_INCOME_FINAL_QUIZ.bankVersion;
      const earlierBest = sameVersion
        ? storedScore(record[CLAUDE_INCOME_FINAL_QUIZ.bestScoreStorageKey])
        : 0;
      record[CLAUDE_INCOME_FINAL_QUIZ.bestScoreStorageKey] = Math.max(earlierBest, score);
      record[CLAUDE_INCOME_FINAL_QUIZ.passedStorageKey] = passed
        || (sameVersion && record[CLAUDE_INCOME_FINAL_QUIZ.passedStorageKey] === true);
      record[CLAUDE_INCOME_FINAL_QUIZ.versionStorageKey] = CLAUDE_INCOME_FINAL_QUIZ.bankVersion;
    });
    const cleared = clearClaudeIncomeQuizAttempt();
    setAttemptClearFailed(!cleared.persisted);
  }

  const unitTitle = (unitId: ClaudeIncomeUnitId) => (
    CLAUDE_INCOME_COURSE.units.find((unit) => unit.id === unitId)?.title ?? unitId
  );

  return (
    <section
      id="final-quiz"
      className={styles.finalQuiz}
      aria-labelledby="claude-income-final-quiz-title"
      aria-busy={!hydrated}
      tabIndex={-1}
      data-client-ready={hydrated ? "true" : "false"}
      data-testid="claude-income-final-quiz"
    >
      <header className={styles.assessmentHeader}>
        <div>
          <p className={styles.eyebrow}>Final assessment</p>
          <h2 id="claude-income-final-quiz-title">16 questions, four business boundaries</h2>
          <p>
            Each attempt draws four questions from every unit and includes one critical item per unit.
            Pass with 13 of 16 correct and every selected critical item correct.
          </p>
        </div>
        <dl className={styles.assessmentFacts}>
          <div><dt>Best score</dt><dd>{hydrated ? `${best}/16` : "—"}</dd></div>
          <div>
            <dt>Course record</dt>
            <dd>{hydrated ? (priorPass ? "Passed" : "Not passed") : "Loading…"}</dd>
          </div>
        </dl>
      </header>

      {hydrated && !storageAvailable ? (
        <p className={styles.storageWarning} role="status">
          Quiz results will last only for this open browser session.
        </p>
      ) : null}

      {hydrated && !result && (attempt.length > 0 || savedAttempt)
        && !attemptPersistenceAvailable ? (
          <p className={styles.storageWarning} role="status">
            This unfinished attempt cannot be restored after leaving this page, closing the tab, or refreshing.
          </p>
        ) : null}

      {hydrated && result && attemptClearFailed ? (
        <div className={styles.attemptCleanupWarning} role="status">
          <p>
            Your result is ready, but the saved attempt could not be cleared. Retry cleanup before leaving this page.
          </p>
          <button className={styles.secondaryAction} type="button" onClick={retryAttemptCleanup}>
            Retry saved-attempt cleanup
          </button>
        </div>
      ) : null}

      {!hydrated ? (
        <div className={styles.quizStart}>
          <p className={styles.loadingMessage} id="claude-income-final-quiz-readiness">
            Loading assessment record…
          </p>
          <noscript>
            <p className={styles.noScriptNotice}>
              The final quiz requires JavaScript. The curriculum, figures, sources, and capstone instructions remain available.
            </p>
          </noscript>
        </div>
      ) : !attempt.length || result ? (
        <div className={styles.quizStart}>
          {result ? (
            <>
              <div className={styles.quizResult} role="status" tabIndex={-1} ref={resultRef}>
                <p className={styles.eyebrow}>{result.passed ? "Assessment passed" : "Review required"}</p>
                <h3>{result.score}/16 correct</h3>
                <p>
                  Critical boundary: {result.criticalClear ? "clear" : "not clear"}.
                  {result.passed
                    ? " Your course record now includes a passing quiz result."
                    : " Review the explanations and try a new balanced attempt."}
                </p>
              </div>
              {missedQuestions.length > 0 ? (
                <section
                  className={styles.quizReview}
                  aria-labelledby="claude-income-quiz-review-title"
                  data-testid="claude-income-quiz-review"
                >
                  <h3 id="claude-income-quiz-review-title">
                    Review {missedQuestions.length} missed {missedQuestions.length === 1 ? "answer" : "answers"}
                  </h3>
                  <ol>
                    {missedQuestions.map((question) => {
                      const answer = answers[question.id]!;
                      const lesson = CLAUDE_INCOME_COURSE.lessons.find(
                        (item) => item.slug === question.lessonSlug,
                      )!;
                      return (
                        <li key={question.id}>
                          <p className={styles.quizReviewMeta}>
                            {unitTitle(question.unitId)}
                            {question.critical ? " · Critical boundary" : ""}
                          </p>
                          <h4>{question.prompt}</h4>
                          <dl className={styles.quizReviewAnswers}>
                            <div>
                              <dt>Your answer</dt>
                              <dd>{question.options[answer.selectedIndex]}</dd>
                            </div>
                            <div>
                              <dt>Correct answer</dt>
                              <dd>{question.options[question.correctIndex]}</dd>
                            </div>
                          </dl>
                          <p>{question.explanation}</p>
                          <ul aria-label="Sources">
                            {question.sourceIds.map((sourceId) => {
                              const source = getClaudeIncomeSource(sourceId);
                              return (
                                <li key={source.id}>
                                  <a
                                    href={getClaudeIncomeSourceHref(source)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {source.title}
                                    <ExternalLinkCue />
                                  </a>
                                </li>
                              );
                            })}
                          </ul>
                          <Link href={`${courseHref}${question.lessonSlug}/`}>
                            Review lesson {lesson.order}: {lesson.title}
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              ) : null}
            </>
          ) : savedAttempt ? (
            <div
              className={styles.savedAttempt}
              data-testid="claude-income-quiz-saved-attempt"
            >
              <p className={styles.eyebrow}>Saved attempt available</p>
              <h3>Question {savedAttempt.index + 1} of {savedAttempt.questionIds.length}</h3>
              <p>Resume the exact question order and checked feedback saved in this tab.</p>
              <div className={styles.savedAttemptActions}>
                <button className={styles.primaryAction} type="button" onClick={resume}>
                  Resume saved attempt
                </button>
                <button className={styles.secondaryAction} type="button" onClick={discard}>
                  Discard saved attempt
                </button>
              </div>
            </div>
          ) : (
            <p>The bank contains 24 scenario questions. A new balanced set is selected for each attempt.</p>
          )}
          {result || !savedAttempt ? (
            <button
              ref={startButtonRef}
              aria-describedby="claude-income-final-quiz-readiness"
              className={styles.primaryAction}
              type="button"
              disabled={!bankReady}
              onClick={begin}
            >
              {result ? "Try another balanced attempt" : "Begin final quiz"}
            </button>
          ) : null}
          <p
            className={styles.srOnly}
            id="claude-income-final-quiz-readiness"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            Final quiz ready.
          </p>
          <p className={attemptStatus ? styles.resetStatus : styles.srOnly} role="status">
            {attemptStatus}
          </p>
        </div>
      ) : current ? (
        <form
          className={styles.quizQuestion}
          data-question-id={current.id}
          data-unit-id={current.unitId}
          data-critical={current.critical ? "true" : "false"}
          onSubmit={(event) => {
            event.preventDefault();
            if (selectedIndex === null || currentAnswer) return;
            const nextAnswers = {
              ...answers,
              [current.id]: {
                selectedIndex,
                correct: selectedIndex === current.correctIndex,
              },
            };
            writeClaudeIncomeQuizAttempt(
              attemptDraft(attempt, index, selectedIndex, nextAnswers),
            );
            setAnswers(nextAnswers);
          }}
        >
          <div className={styles.quizMeta}>
            <span>Question {index + 1} of {attempt.length}</span>
            <span>{unitTitle(current.unitId)}</span>
            {current.critical ? <strong>Critical boundary</strong> : null}
          </div>
          <h3 ref={headingRef} tabIndex={-1}>{current.prompt}</h3>
          <fieldset className={styles.quizOptions}>
            <legend className={styles.srOnly}>{current.prompt}</legend>
            {current.options.map((option, optionIndex) => {
              const isCorrect = Boolean(currentAnswer) && optionIndex === current.correctIndex;
              const isIncorrectSelection = currentAnswer?.selectedIndex === optionIndex
                && currentAnswer.correct === false;
              return (
                <label
                  className={isCorrect
                    ? styles.correctOption
                    : isIncorrectSelection
                      ? styles.incorrectOption
                      : styles.quizOption}
                  key={`${current.id}-${optionIndex}`}
                >
                  <input
                    type="radio"
                    name={current.id}
                    value={optionIndex}
                    checked={selectedIndex === optionIndex}
                    disabled={Boolean(currentAnswer)}
                    required
                    autoComplete="off"
                    onChange={() => {
                      writeClaudeIncomeQuizAttempt(
                        attemptDraft(attempt, index, optionIndex, answers),
                      );
                      setSelectedIndex(optionIndex);
                    }}
                  />
                  <span className={styles.optionCopy}>
                    <span>{option}</span>
                    {currentAnswer ? (
                      <span className={styles.answerMarkers}>
                        {optionIndex === current.correctIndex ? (
                          <strong data-answer-marker="correct">Correct answer</strong>
                        ) : null}
                        {optionIndex === currentAnswer.selectedIndex ? (
                          <strong data-answer-marker="selected">Your answer</strong>
                        ) : null}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </fieldset>

          {currentAnswer ? (
            <div
              className={styles.quizFeedback}
              role="status"
              tabIndex={-1}
              ref={feedbackRef}
            >
              <strong>{currentAnswer.correct ? "Correct" : "Not correct"}</strong>
              <p>{current.explanation}</p>
              <ul>
                {current.sourceIds.map((sourceId) => {
                  const source = getClaudeIncomeSource(sourceId);
                  return (
                    <li key={source.id}>
                      <a href={getClaudeIncomeSourceHref(source)} target="_blank" rel="noopener noreferrer">
                        {source.title}
                        {source.pinnedRevision ? ` (commit ${source.pinnedRevision.slice(0, 12)})` : ""}
                        <ExternalLinkCue />
                      </a>
                    </li>
                  );
                })}
              </ul>
              <button
                className={styles.primaryAction}
                type="button"
                onClick={() => {
                  if (index === attempt.length - 1) finish();
                  else {
                    const nextIndex = index + 1;
                    writeClaudeIncomeQuizAttempt(
                      attemptDraft(attempt, nextIndex, null, answers),
                    );
                    setIndex(nextIndex);
                    setSelectedIndex(null);
                  }
                }}
              >
                {index === attempt.length - 1 ? "Finish and score" : "Next question"}
              </button>
            </div>
          ) : (
            <button className={styles.primaryAction} type="submit" disabled={selectedIndex === null}>
              Check answer
            </button>
          )}
        </form>
      ) : null}
    </section>
  );
}
