"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  CODEX_INCOME_SOURCE_BY_ID,
  type CodexIncomeQuizQuestion,
} from "@/lib/make-money-with-codex";
import { parseQuizAnswersSessionDraft } from "@/lib/make-money-with-codex/session-draft-schemas";
import { MAKE_MONEY_WITH_CODEX_QUIZ_ANSWERS_DRAFT_KEY } from "@/lib/make-money-session-draft-contract";
import { setIncomeQuiz } from "./progress-store";
import useSessionDraft from "./useSessionDraft";
import useIncomeProgress, { useIncomeStorageAvailable } from "./useIncomeProgress";
import styles from "./IncomeCourse.module.css";

const EMPTY_ANSWERS: Record<string, number> = {};

export default function KnowledgeCheck({
  questions,
  passingScore,
  locale,
  capstoneHref,
}: {
  questions: readonly CodexIncomeQuizQuestion[];
  passingScore: number;
  locale: string;
  capstoneHref: string;
}) {
  const progress = useIncomeProgress();
  const storageAvailable = useIncomeStorageAvailable();
  const parseAnswers = useCallback(
    (value: unknown) => parseQuizAnswersSessionDraft(value, questions),
    [questions],
  );
  const {
    value: answers,
    setValue: setAnswers,
    clear: clearAnswers,
    status: draftStatus,
  } = useSessionDraft({
    storageKey: MAKE_MONEY_WITH_CODEX_QUIZ_ANSWERS_DRAFT_KEY,
    initialValue: EMPTY_ANSWERS,
    parse: parseAnswers,
  });
  const [submitted, setSubmitted] = useState(false);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const firstOption = useRef<HTMLInputElement>(null);
  const number = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const score = questions.reduce(
    (total, question) => total + Number(answers[question.id] === question.correctIndex),
    0,
  );
  const complete = questions.every((question) => Number.isInteger(answers[question.id]));
  const passed = score >= passingScore;

  return (
    <section
      className={styles.knowledgeCheck}
      id="income-knowledge-check"
      aria-labelledby="income-knowledge-check-title"
      data-testid="income-knowledge-check"
      tabIndex={-1}
    >
      <header className={styles.quizHeader}>
        <div>
          <p className={styles.toolKicker}>Evidence check</p>
          <h2 id="income-knowledge-check-title">Can you keep the claim inside the evidence?</h2>
          <p>Answer all {number.format(questions.length)} questions. Pass with {number.format(passingScore)} correct answers. Explanations reveal after submission.</p>
        </div>
        <div className={styles.quizBest}>
          <span>Best in this browser</span>
          <strong>{number.format(progress.quizBest)} / {number.format(questions.length)}</strong>
        </div>
      </header>

      <p className={styles.draftNote} role={draftStatus === "unavailable" ? "status" : undefined}>
        {draftStatus === "unavailable"
          ? "Answer autosave is unavailable. Finish this attempt before leaving the page."
          : "Unsubmitted answers autosave in this tab session and are never uploaded."}
      </p>

      {!storageAvailable ? (
        <p className={styles.storageWarning} role="status">Persistent browser storage is unavailable. This attempt still works in memory for the current page session.</p>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!complete) return;
          setSubmitted(true);
          setPersisted(setIncomeQuiz(score, passed));
          window.requestAnimationFrame(() => resultHeading.current?.focus());
        }}
      >
        <ol className={styles.quizList}>
          {questions.map((question, questionIndex) => {
            const selected = answers[question.id];
            return (
              <li key={question.id} data-question-id={question.id}>
                <fieldset aria-describedby={submitted ? `${question.id}-feedback` : undefined}>
                  <legend>
                    <span>{String(questionIndex + 1).padStart(2, "0")}</span>
                    {question.question}
                  </legend>
                  <div className={styles.quizOptions}>
                    {question.options.map((option, optionIndex) => {
                      const isCorrect = submitted && optionIndex === question.correctIndex;
                      const isIncorrect = submitted && selected === optionIndex && !isCorrect;
                      const answerStatus = isCorrect
                        ? selected === optionIndex ? "Correct answer. Your answer." : "Correct answer."
                        : isIncorrect ? "Your answer. Incorrect." : null;
                      return (
                        <label
                          key={option}
                          data-correct={isCorrect || undefined}
                          data-incorrect={isIncorrect || undefined}
                        >
                          <input
                            type="radio"
                            name={question.id}
                            value={optionIndex}
                            checked={selected === optionIndex}
                            disabled={submitted}
                            required
                            ref={questionIndex === 0 && optionIndex === 0 ? firstOption : undefined}
                            onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                          />
                          <span>
                            {option}
                            {answerStatus ? <strong className={styles.quizOptionStatus}>{answerStatus}</strong> : null}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                {submitted ? (
                  <div
                    className={styles.quizFeedback}
                    id={`${question.id}-feedback`}
                    data-correct={selected === question.correctIndex || undefined}
                  >
                    <strong>{selected === question.correctIndex ? "Correct." : "Review this boundary."}</strong>
                    <p>{question.explanation}</p>
                    <p className={styles.quizCitations}>
                      {question.sourceIds.map((sourceId) => {
                        const source = CODEX_INCOME_SOURCE_BY_ID[sourceId];
                        return <a key={sourceId} href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a>;
                      })}
                    </p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>

        {submitted ? (
          <section className={passed ? styles.quizPassed : styles.quizReview} role="status">
            <h3 ref={resultHeading} tabIndex={-1}>{passed ? "Evidence check passed" : "Review the missed boundaries"}</h3>
            <p>
              You answered {number.format(score)} of {number.format(questions.length)} correctly. {passed
                ? persisted
                  ? "Your pass is saved in this browser."
                  : "Your pass is available for this page session, but browser storage could not be updated."
                : `You need ${number.format(passingScore)} correct answers.`}
            </p>
            <div className={styles.toolActions}>
              {passed ? (
                <Link className={styles.primaryButton} href={`${capstoneHref}#income-capstone-checklist-title`}>
                  Review the capstone evidence pack <span aria-hidden="true">→</span>
                </Link>
              ) : null}
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => {
                  clearAnswers();
                  setSubmitted(false);
                  setPersisted(null);
                  window.requestAnimationFrame(() => {
                    window.requestAnimationFrame(() => firstOption.current?.focus());
                  });
                }}
              >
                Start a fresh attempt
              </button>
            </div>
          </section>
        ) : (
          <div className={styles.quizSubmit}>
            <span>{number.format(Object.keys(answers).length)} / {number.format(questions.length)} answered</span>
            <button className={styles.primaryButton} type="submit" disabled={!complete}>Check every answer</button>
          </div>
        )}
      </form>
    </section>
  );
}
