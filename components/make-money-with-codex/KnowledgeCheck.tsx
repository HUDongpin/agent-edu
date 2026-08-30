"use client";

import { useMemo, useRef, useState } from "react";
import {
  CODEX_INCOME_SOURCE_BY_ID,
  type CodexIncomeQuizQuestion,
} from "@/lib/make-money-with-codex";
import { setIncomeQuiz } from "./progress-store";
import useIncomeProgress, { useIncomeStorageAvailable } from "./useIncomeProgress";
import styles from "./IncomeCourse.module.css";

export default function KnowledgeCheck({
  questions,
  passingScore,
  locale,
}: {
  questions: readonly CodexIncomeQuizQuestion[];
  passingScore: number;
  locale: string;
}) {
  const progress = useIncomeProgress();
  const storageAvailable = useIncomeStorageAvailable();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const resultHeading = useRef<HTMLHeadingElement>(null);
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

      {!storageAvailable ? (
        <p className={styles.storageWarning} role="status">Persistent browser storage is unavailable. This attempt still works in memory for the current page session.</p>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!complete) return;
          setSubmitted(true);
          setIncomeQuiz(score, passed);
          window.requestAnimationFrame(() => resultHeading.current?.focus());
        }}
      >
        <ol className={styles.quizList}>
          {questions.map((question, questionIndex) => {
            const selected = answers[question.id];
            return (
              <li key={question.id} data-question-id={question.id}>
                <fieldset>
                  <legend>
                    <span>{String(questionIndex + 1).padStart(2, "0")}</span>
                    {question.question}
                  </legend>
                  <div className={styles.quizOptions}>
                    {question.options.map((option, optionIndex) => {
                      const isCorrect = submitted && optionIndex === question.correctIndex;
                      const isIncorrect = submitted && selected === optionIndex && !isCorrect;
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
                            onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                {submitted ? (
                  <div className={styles.quizFeedback} data-correct={selected === question.correctIndex || undefined}>
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
            <p>You answered {number.format(score)} of {number.format(questions.length)} correctly. {passed ? "Your pass is saved locally." : `You need ${number.format(passingScore)} correct answers.`}</p>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
              }}
            >
              Start a fresh attempt
            </button>
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
