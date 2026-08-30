"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type {
  CursorCourseCopy,
  CursorLessonSlug,
  CursorQuizId,
  CursorQuizOptionId,
  CursorSourceId,
} from "@/lib/cursor";
import styles from "./CursorCourse.module.css";

const subscribeToHydrationState = () => () => {};
const getHydratedClientSnapshot = () => true;
const getHydratedServerSnapshot = () => false;

export type LessonQuizQuestion = {
  readonly id: CursorQuizId;
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

export default function LessonKnowledgeCheck({
  slug,
  questions,
  labels,
}: {
  slug: CursorLessonSlug;
  questions: readonly LessonQuizQuestion[];
  labels: CursorCourseCopy["ui"];
}) {
  const hydrated = useSyncExternalStore(
    subscribeToHydrationState,
    getHydratedClientSnapshot,
    getHydratedServerSnapshot,
  );
  const [selected, setSelected] = useState<Partial<Record<CursorQuizId, CursorQuizOptionId>>>({});
  const [reviewed, setReviewed] = useState(false);
  const result = useRef<HTMLDivElement>(null);
  const allAnswered = questions.every((question) => selected[question.id] !== undefined);
  const score = reviewed
    ? questions.filter((question) => selected[question.id] === question.correctOptionId).length
    : 0;
  const passed = score === questions.length;
  const headingId = `cursor-${slug}-knowledge-check-title`;

  useEffect(() => {
    if (reviewed) result.current?.focus();
  }, [reviewed]);

  return (
    <section
      className={styles.quizPanel}
      aria-labelledby={headingId}
      data-hydrated={hydrated ? "true" : "false"}
      data-testid="cursor-lesson-quiz"
    >
      <header className={styles.sectionHeading}>
        <div>
          <p className={styles.kicker}>{labels.quiz}</p>
          <h2 id={headingId}>{labels.quiz}</h2>
        </div>
        {reviewed ? (
          <span className={styles.successBadge}>{labels.score}: {score}/{questions.length}</span>
        ) : null}
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!allAnswered) return;
          setReviewed(true);
        }}
      >
        <div className={styles.questionList}>
          {questions.map((question, questionIndex) => {
            const answer = selected[question.id];
            const correct = answer === question.correctOptionId;

            return (
              <fieldset
                className={styles.question}
                data-question-id={question.id}
                key={question.id}
              >
                <legend>
                  <span>{labels.question} {questionIndex + 1} {labels.of} {questions.length}</span>
                  {question.prompt}
                </legend>
                <div className={styles.optionList}>
                  {question.options.map((option) => (
                    <label
                      className={
                        reviewed && option.id === question.correctOptionId
                          ? styles.correctOption
                          : reviewed && answer === option.id
                            ? styles.incorrectOption
                            : styles.option
                      }
                      data-option-id={option.id}
                      key={`${question.id}-${option.id}`}
                    >
                      <input
                        type="radio"
                        name={`cursor-${slug}-${question.id}`}
                        value={option.id}
                        checked={answer === option.id}
                        disabled={!hydrated || reviewed}
                        required
                        onChange={() => setSelected((current) => ({
                          ...current,
                          [question.id]: option.id,
                        }))}
                      />
                      <span className={styles.optionCopy}>
                        <span>{option.label}</span>
                        {reviewed && option.id === question.correctOptionId ? (
                          <strong className={styles.answerMarker} data-answer-state="correct">
                            {labels.correct}
                          </strong>
                        ) : reviewed && answer === option.id ? (
                          <strong className={styles.answerMarker} data-answer-state="incorrect">
                            {labels.incorrect}
                          </strong>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
                {reviewed ? (
                  <div
                    className={correct ? styles.correctFeedback : styles.incorrectFeedback}
                    role="status"
                  >
                    <p><strong>{correct ? labels.correct : labels.incorrect}</strong> {question.explanation}</p>
                    <ul className={styles.quizSources} aria-label={labels.source}>
                      {question.sources.map((source) => (
                        <li key={source.id}>
                          <a href={source.url} target="_blank" rel="noopener noreferrer">
                            {source.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </fieldset>
            );
          })}
        </div>

        <div className={styles.quizActions}>
          {!reviewed ? (
            <button className={styles.primaryAction} type="submit" disabled={!hydrated || !allAnswered}>
              {labels.checkAnswers}
            </button>
          ) : (
            <>
              <button
                className={styles.secondaryAction}
                type="button"
                onClick={() => {
                  setSelected({});
                  setReviewed(false);
                }}
              >
                {labels.tryAgain}
              </button>
              <div
                className={passed ? styles.quizPassed : styles.quizRetry}
                ref={result}
                role="status"
                tabIndex={-1}
              >
                <strong>{passed ? labels.quizPassed : labels.quizNeedsReview}</strong>
                <span>{labels.score}: {score}/{questions.length}</span>
              </div>
            </>
          )}
        </div>
      </form>
    </section>
  );
}
