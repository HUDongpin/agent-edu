"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import {
  MCP_FINAL_DISPLAY_CORRECT_INDEXES,
  presentMcpOptions,
  type McpAssessmentQuestion,
} from "@/lib/mcp";
import type { McpUiCopy } from "@/lib/mcp/copy";
import { formatMcpCopy, formatMcpInteger } from "@/lib/mcp/format";
import type { McpDirection } from "@/lib/mcp/types";
import { MCP_PROGRESS_QUIZ } from "@/lib/progress-topology";
import {
  readMcpQuizDraftForQuestions,
  readMcpQuizProgress,
  updateMcpProgress,
} from "./progress-store";
import { useMcpProgress } from "./useMcpProgress";
import styles from "./McpCourse.module.css";

export default function FinalAssessment({
  questions,
  locale,
  direction,
  ui,
}: {
  questions: readonly McpAssessmentQuestion[];
  locale: string;
  direction: McpDirection;
  ui: McpUiCopy;
}) {
  const progress = useMcpProgress();
  const questionIds = useMemo(() => questions.map((question) => question.id), [questions]);
  const draft = useMemo(
    () => readMcpQuizDraftForQuestions(progress, questionIds),
    [progress, questionIds],
  );
  const open = draft !== null;
  const answers = useMemo(() => draft?.answers ?? {}, [draft?.answers]);
  const submitted = draft?.submitted === true;
  const resultRef = useRef<HTMLDivElement>(null);
  const firstQuestionRef = useRef<HTMLInputElement>(null);
  const resultFocusPending = useRef(false);
  const firstQuestionFocusPending = useRef(false);
  const restoredReviewFocus = useRef(false);
  const threshold = MCP_PROGRESS_QUIZ.passingCorrectAnswers;
  const answeredCount = useMemo(
    () => questions.filter((question) => Object.prototype.hasOwnProperty.call(answers, question.id)).length,
    [answers, questions],
  );
  const score = useMemo(() => questions.filter((question) => answers[question.id] === question.correctIndex).length, [answers, questions]);
  const passed = submitted && answeredCount === questions.length && score >= threshold;
  const assessmentProgress = readMcpQuizProgress(progress);
  const best = assessmentProgress.best;
  const previouslyPassed = assessmentProgress.passed;
  const number = (value: number) => formatMcpInteger(value, locale);

  useEffect(() => {
    if (!submitted || !resultFocusPending.current) return;
    resultFocusPending.current = false;
    resultRef.current?.focus();
  }, [submitted]);

  useEffect(() => {
    if (!open || submitted || !firstQuestionFocusPending.current) return;
    firstQuestionFocusPending.current = false;
    firstQuestionRef.current?.focus();
  }, [open, submitted]);

  useEffect(() => {
    if (!submitted || !draft?.reviewQuestionId || restoredReviewFocus.current) return;
    restoredReviewFocus.current = true;
    let focusFrame = 0;
    const commitFrame = window.requestAnimationFrame(() => {
      focusFrame = window.requestAnimationFrame(() => {
        const target = document.getElementById(`mcp-assessment-feedback-${draft.reviewQuestionId}`);
        target?.focus({ preventScroll: true });
        target?.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
      });
    });
    return () => {
      window.cancelAnimationFrame(commitFrame);
      window.cancelAnimationFrame(focusFrame);
    };
  }, [draft?.reviewQuestionId, submitted]);

  function begin() {
    firstQuestionFocusPending.current = true;
    updateMcpProgress((next) => {
      next[MCP_PROGRESS_QUIZ.draftKey] = {
        version: MCP_PROGRESS_QUIZ.bankVersion,
        answers: {},
        submitted: false,
      };
    });
  }

  function selectAnswer(questionId: string, answer: number) {
    updateMcpProgress((next) => {
      next[MCP_PROGRESS_QUIZ.draftKey] = {
        version: MCP_PROGRESS_QUIZ.bankVersion,
        answers: { ...answers, [questionId]: answer },
        submitted: false,
      };
    });
  }

  function submit() {
    if (answeredCount !== questions.length) return;
    resultFocusPending.current = true;
    updateMcpProgress((next) => {
      next[MCP_PROGRESS_QUIZ.bestScoreKey] = Math.max(best, score);
      next[MCP_PROGRESS_QUIZ.versionKey] = MCP_PROGRESS_QUIZ.bankVersion;
      next[MCP_PROGRESS_QUIZ.passedKey] = previouslyPassed || score >= threshold;
      next[MCP_PROGRESS_QUIZ.draftKey] = {
        version: MCP_PROGRESS_QUIZ.bankVersion,
        answers,
        submitted: true,
      };
    });
  }

  function retry() {
    firstQuestionFocusPending.current = true;
    restoredReviewFocus.current = false;
    updateMcpProgress((next) => {
      next[MCP_PROGRESS_QUIZ.draftKey] = {
        version: MCP_PROGRESS_QUIZ.bankVersion,
        answers: {},
        submitted: false,
      };
    });
  }

  return (
    <section id="assessment" className={styles.finalAssessment} aria-labelledby="mcp-final-title">
      <div className={styles.assessmentIntro}>
        <p className={styles.eyebrow}>{ui.assessmentEyebrow}</p>
        <h2 id="mcp-final-title">{ui.assessmentTitle}</h2>
        <p>{formatMcpCopy(ui.assessmentIntroTemplate, { count: number(questions.length), threshold: number(threshold) })}</p>
        <p>{ui.assessmentBody}</p>
        {best ? <p className={styles.bestScore}>{formatMcpCopy(ui.assessmentBestTemplate, { best: number(best), count: number(questions.length) })}</p> : null}
        {!open ? (
          <button className={styles.primaryButton} type="button" onClick={begin}>{ui.assessmentBegin}</button>
        ) : null}
      </div>

      {open ? (
        <form onSubmit={(event) => { event.preventDefault(); submit(); }}>
          <ol className={styles.quizList}>
            {questions.map((question, index) => {
              const selected = answers[question.id];
              const correct = selected === question.correctIndex;
              const presentedOptions = presentMcpOptions(question, MCP_FINAL_DISPLAY_CORRECT_INDEXES[index]);
              return (
                <li key={question.id}>
                  <fieldset>
                    <legend><span>{number(index + 1)}</span>{question.question}</legend>
                    <p className={styles.quizOutcome}>{formatMcpCopy(ui.assessmentOutcomeTemplate, { outcome: question.outcome })}</p>
                    {presentedOptions.map(({ text, originalIndex }, displayedIndex) => (
                      <label
                        key={`${question.id}-${originalIndex}`}
                        className={`${styles.answerOption} ${submitted && originalIndex === question.correctIndex ? styles.correctAnswer : ""} ${submitted && selected === originalIndex && !correct ? styles.wrongAnswer : ""}`}
                      >
                        <input
                          ref={index === 0 && displayedIndex === 0 ? firstQuestionRef : undefined}
                          type="radio"
                          name={`final-${question.id}`}
                          checked={selected === originalIndex}
                          disabled={submitted}
                          onChange={() => selectAnswer(question.id, originalIndex)}
                        />
                        <span>{String.fromCharCode(65 + displayedIndex)}</span>
                        {text}
                      </label>
                    ))}
                  </fieldset>
                  {submitted ? (
                    <p
                      id={`mcp-assessment-feedback-${question.id}`}
                      className={correct ? styles.feedbackCorrect : styles.feedbackWrong}
                      tabIndex={-1}
                    >
                      <strong>{correct ? ui.assessmentCorrect : ui.assessmentNotYet}</strong> {question.explanation}{" "}
                      {!correct ? (
                        <Link
                          href={`./${question.reviewSlug}/`}
                          onClick={() => updateMcpProgress((next) => {
                            next[MCP_PROGRESS_QUIZ.draftKey] = {
                              version: MCP_PROGRESS_QUIZ.bankVersion,
                              answers,
                              submitted: true,
                              reviewQuestionId: question.id,
                            };
                            window.history.replaceState(
                              window.history.state,
                              "",
                              `#mcp-assessment-feedback-${question.id}`,
                            );
                          })}
                        >
                          {ui.assessmentReviewLesson} <span aria-hidden="true">{direction === "rtl" ? "←" : "→"}</span>
                        </Link>
                      ) : null}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
          {!submitted ? (
            <div className={styles.quizSubmit}>
              <span>{formatMcpCopy(ui.assessmentAnsweredTemplate, { answered: number(answeredCount), count: number(questions.length) })}</span>
              <button className={styles.primaryButton} type="submit" disabled={answeredCount !== questions.length}>
                {ui.assessmentScore}
              </button>
            </div>
          ) : (
            <div ref={resultRef} className={passed ? styles.passPanel : styles.retryPanel} role="status" tabIndex={-1}>
              <p className={styles.eyebrow}>{passed ? ui.assessmentPassed : ui.assessmentReviewRequired}</p>
              <h3>{number(score)}/{number(questions.length)}</h3>
              <p>{passed ? ui.assessmentPassBody : formatMcpCopy(ui.assessmentFailBodyTemplate, { threshold: number(threshold) })}</p>
              {!passed ? <button className={styles.secondaryButton} type="button" onClick={retry}>{ui.assessmentRetry}</button> : null}
            </div>
          )}
        </form>
      ) : null}
    </section>
  );
}
