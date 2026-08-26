"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MCP_ASSESSMENT_VERSION,
  MCP_FINAL_DISPLAY_CORRECT_INDEXES,
  presentMcpOptions,
  type McpAssessmentQuestion,
} from "@/lib/mcp";
import type { McpUiCopy } from "@/lib/mcp/copy";
import { formatMcpCopy, formatMcpInteger } from "@/lib/mcp/format";
import type { McpDirection } from "@/lib/mcp/types";
import { updateMcpProgress } from "./progress-store";
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
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const firstQuestionRef = useRef<HTMLInputElement>(null);
  const threshold = Math.ceil(questions.length * 0.8);
  const score = useMemo(() => questions.filter((question) => answers[question.id] === question.correctIndex).length, [answers, questions]);
  const passed = submitted && score >= threshold;
  const currentVersion = progress["mcp.quiz.version"] === MCP_ASSESSMENT_VERSION;
  const best = currentVersion && typeof progress["mcp.quiz.best"] === "number" ? progress["mcp.quiz.best"] as number : 0;
  const previouslyPassed = currentVersion && progress["mcp.quiz.passed"] === true;
  const number = (value: number) => formatMcpInteger(value, locale);

  useEffect(() => {
    if (submitted) resultRef.current?.focus();
  }, [submitted]);

  useEffect(() => {
    if (open && !submitted) firstQuestionRef.current?.focus();
  }, [open, submitted]);

  function submit() {
    setSubmitted(true);
    updateMcpProgress((next) => {
      next["mcp.quiz.best"] = Math.max(best, score);
      next["mcp.quiz.version"] = MCP_ASSESSMENT_VERSION;
      next["mcp.quiz.passed"] = previouslyPassed || score >= threshold;
    });
  }

  function retry() {
    setAnswers({});
    setSubmitted(false);
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
          <button className={styles.primaryButton} type="button" onClick={() => setOpen(true)}>{ui.assessmentBegin}</button>
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
                          onChange={() => setAnswers((current) => ({ ...current, [question.id]: originalIndex }))}
                        />
                        <span>{String.fromCharCode(65 + displayedIndex)}</span>
                        {text}
                      </label>
                    ))}
                  </fieldset>
                  {submitted ? (
                    <p className={correct ? styles.feedbackCorrect : styles.feedbackWrong}>
                      <strong>{correct ? ui.assessmentCorrect : ui.assessmentNotYet}</strong> {question.explanation}{" "}
                      {!correct ? <Link href={`./${question.reviewSlug}/`}>{ui.assessmentReviewLesson} <span aria-hidden="true">{direction === "rtl" ? "←" : "→"}</span></Link> : null}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
          {!submitted ? (
            <div className={styles.quizSubmit}>
              <span>{formatMcpCopy(ui.assessmentAnsweredTemplate, { answered: number(Object.keys(answers).length), count: number(questions.length) })}</span>
              <button className={styles.primaryButton} type="submit" disabled={Object.keys(answers).length !== questions.length}>
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
