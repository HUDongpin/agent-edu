"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CLAUDE_INCOME_COURSE,
  CLAUDE_INCOME_FINAL_QUIZ,
  CLAUDE_INCOME_QUIZ_BANK,
  getClaudeIncomeSource,
  getClaudeIncomeSourceHref,
  type ClaudeIncomeQuizQuestion,
  type ClaudeIncomeUnitId,
} from "@/lib/claude-income";
import { updateProgress } from "./progress-store";
import {
  useCourseHydrated,
  useCourseProgress,
  useCourseStorageAvailable,
} from "./useCourseProgress";
import styles from "./ClaudeIncomeCourse.module.css";

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

export default function FinalQuiz() {
  const progress = useCourseProgress();
  const hydrated = useCourseHydrated();
  const storageAvailable = useCourseStorageAvailable();
  const [attempt, setAttempt] = useState<ClaudeIncomeQuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<{ score: number; criticalClear: boolean; passed: boolean } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const current = attempt[index];
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

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  function begin() {
    if (!hydrated || !bankReady) return;
    setAttempt(selectBalancedAttempt());
    setIndex(0);
    setSelectedIndex(null);
    setAnswers({});
    setResult(null);
    window.requestAnimationFrame(() => headingRef.current?.focus());
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
  }

  const unitTitle = (unitId: ClaudeIncomeUnitId) => (
    CLAUDE_INCOME_COURSE.units.find((unit) => unit.id === unitId)?.title ?? unitId
  );

  return (
    <section
      className={styles.finalQuiz}
      aria-labelledby="claude-income-final-quiz-title"
      aria-busy={!hydrated}
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
          <div><dt>Best score</dt><dd>{best}/16</dd></div>
          <div><dt>Course record</dt><dd>{priorPass ? "Passed" : "Not passed"}</dd></div>
        </dl>
      </header>

      {!storageAvailable ? (
        <p className={styles.storageWarning} role="status">
          Quiz results will last only for this open browser session.
        </p>
      ) : null}

      {!attempt.length || result ? (
        <div className={styles.quizStart}>
          {result ? (
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
          ) : (
            <p>The bank contains 24 scenario questions. A new balanced set is selected for each attempt.</p>
          )}
          <button
            aria-describedby="claude-income-final-quiz-readiness"
            className={styles.primaryAction}
            type="button"
            disabled={!hydrated || !bankReady}
            onClick={begin}
          >
            {result ? "Try another balanced attempt" : "Begin final quiz"}
          </button>
          <p
            className={styles.srOnly}
            id="claude-income-final-quiz-readiness"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {hydrated ? "Final quiz ready." : "Preparing final quiz."}
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
            setAnswers((record) => ({
              ...record,
              [current.id]: {
                selectedIndex,
                correct: selectedIndex === current.correctIndex,
              },
            }));
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
              const isCorrect = currentAnswer && optionIndex === current.correctIndex;
              const isIncorrectSelection = currentAnswer
                && currentAnswer.selectedIndex === optionIndex
                && !currentAnswer.correct;
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
                    onChange={() => setSelectedIndex(optionIndex)}
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </fieldset>

          {currentAnswer ? (
            <div className={styles.quizFeedback} role="status">
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
                    setIndex((value) => value + 1);
                    setSelectedIndex(null);
                    window.requestAnimationFrame(() => headingRef.current?.focus());
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
