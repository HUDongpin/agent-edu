"use client";

import { useMemo, useState } from "react";
import {
  courseKitQuizBestKey,
  courseKitQuizDraftKey,
  courseKitQuizVersionKey,
} from "@/lib/course-kit/progress";
import {
  drawCourseKitQuizQuestions,
  gradeCourseKitQuiz,
  type CourseKitQuizGrade,
} from "@/lib/course-kit/quiz";
import type {
  CourseKitMaterialisedCourse,
  CourseKitOptionIndex,
  CourseKitProgressClientConfig,
  CourseKitUiCopy,
} from "@/lib/course-kit/types";
import { formatCourseKitCopy } from "@/lib/course-kit/ui-copy";
import {
  clearCourseKitQuizDraft,
  recordCourseKitQuizAttempt,
  setCourseKitQuizDraft,
  useCourseKitProgress,
} from "./progress-store";
import styles from "./CourseKit.module.css";

type MaterialisedQuiz = CourseKitMaterialisedCourse["quiz"];

function restoredQuizAnswers(
  value: unknown,
  allowedIds: ReadonlySet<string>,
): Record<string, CourseKitOptionIndex> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const answers: Record<string, CourseKitOptionIndex> = {};
  for (const [questionId, answer] of Object.entries(value)) {
    if (!allowedIds.has(questionId)) continue;
    if (answer === 0 || answer === 1 || answer === 2 || answer === 3) {
      answers[questionId] = answer;
    }
  }
  return answers;
}

export function CourseQuiz({
  quiz,
  config,
  labels,
}: {
  readonly quiz: MaterialisedQuiz;
  readonly config: CourseKitProgressClientConfig;
  readonly labels: CourseKitUiCopy;
}) {
  const selectedQuestions = useMemo(
    () =>
      drawCourseKitQuizQuestions(
        quiz.questions,
        quiz.drawCount,
        `${config.courseId}:${quiz.version}`,
      ),
    [config.courseId, quiz.drawCount, quiz.questions, quiz.version],
  );
  const { record } = useCourseKitProgress(config);
  const allowedQuestionIds = useMemo(
    () => new Set(selectedQuestions.map((question) => question.id)),
    [selectedQuestions],
  );
  const storedAnswers = restoredQuizAnswers(
    record[courseKitQuizDraftKey(config.courseId)],
    allowedQuestionIds,
  );
  const storedAnswersSignature = JSON.stringify(storedAnswers);
  const [answerDraft, setAnswerDraft] = useState<{
    readonly base: string;
    readonly answers: Record<string, CourseKitOptionIndex>;
  } | null>(null);
  const activeAnswerDraft = answerDraft?.base === storedAnswersSignature
    ? answerDraft
    : null;
  const answers = activeAnswerDraft?.answers ?? storedAnswers;
  const [grade, setGrade] = useState<CourseKitQuizGrade | null>(null);
  const [incomplete, setIncomplete] = useState(false);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const currentQuiz =
    record[courseKitQuizVersionKey(config.courseId)] === quiz.version;
  const best = currentQuiz
    ? record[courseKitQuizBestKey(config.courseId)]
    : undefined;

  return (
    <section
      className={styles.quiz}
      id="final-assessment"
      aria-labelledby={`${config.courseId}-assessment-title`}
    >
      <header className={styles.sectionIntro}>
        <p className={styles.eyebrow}>{labels.finalAssessment}</p>
        <h2 id={`${config.courseId}-assessment-title`}>{quiz.title}</h2>
        <p>{quiz.intro}</p>
        <p>
          {formatCourseKitCopy(labels.scorePosition, {
            score: quiz.passCount,
            total: quiz.drawCount,
            required: quiz.passCount,
          })}
        </p>
        {typeof best === "number" ? (
          <p>
            {formatCourseKitCopy(labels.bestScorePosition, {
              score: best,
              total: quiz.drawCount,
            })}
          </p>
        ) : null}
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          const allAnswered = selectedQuestions.every(
            (question) => answers[question.id] !== undefined,
          );
          if (!allAnswered) {
            setIncomplete(true);
            setGrade(null);
            return;
          }
          const nextGrade = gradeCourseKitQuiz(
            selectedQuestions,
            answers,
            quiz.passCount,
          );
          setIncomplete(false);
          setGrade(nextGrade);
          setPersisted(
            recordCourseKitQuizAttempt(
              config,
              nextGrade.score,
              nextGrade.passed,
            ),
          );
        }}
      >
        <ol className={styles.quizQuestions}>
          {selectedQuestions.map((question, questionIndex) => {
            const selected = answers[question.id];
            return (
              <li key={question.id}>
                <fieldset>
                  <legend>
                    <span>
                      {formatCourseKitCopy(labels.questionPosition, {
                        current: questionIndex + 1,
                        total: selectedQuestions.length,
                      })}
                    </span>
                    {question.critical ? (
                      <em>{labels.criticalQuestion}</em>
                    ) : null}
                    <strong>{question.prompt}</strong>
                  </legend>
                  {question.options.map((option, optionIndex) => {
                    const index = optionIndex as CourseKitOptionIndex;
                    const optionCorrect = index === question.correctIndex;
                    return (
                      <label
                        key={`${question.id}-${optionIndex}`}
                        data-selected={selected === index || undefined}
                        data-correct={grade && optionCorrect ? true : undefined}
                      >
                        <input
                          type="radio"
                          name={`${config.courseId}-${question.id}`}
                          value={optionIndex}
                          checked={selected === index}
                          onChange={() => {
                            const nextAnswers = {
                              ...answers,
                              [question.id]: index,
                            };
                            setAnswerDraft({
                              base: storedAnswersSignature,
                              answers: nextAnswers,
                            });
                            setGrade(null);
                            setIncomplete(false);
                            setPersisted(
                              setCourseKitQuizDraft(config, nextAnswers),
                            );
                          }}
                        />
                        <span aria-hidden="true">
                          {String.fromCharCode(65 + optionIndex)}
                        </span>
                        <span>{option}</span>
                      </label>
                    );
                  })}
                  {grade ? (
                    <p
                      className={
                        selected === question.correctIndex
                          ? styles.feedbackPass
                          : styles.feedbackRetry
                      }
                    >
                      {question.explanation}
                    </p>
                  ) : null}
                </fieldset>
              </li>
            );
          })}
        </ol>
        <div className={styles.quizActions}>
          <button type="submit">{labels.submitQuiz}</button>
          {grade ? (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                setAnswerDraft({ base: storedAnswersSignature, answers: {} });
                setGrade(null);
                setIncomplete(false);
                setPersisted(clearCourseKitQuizDraft(config));
              }}
            >
              {labels.retryQuiz}
            </button>
          ) : null}
          {!grade && Object.keys(answers).length ? (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                setAnswerDraft({ base: storedAnswersSignature, answers: {} });
                setIncomplete(false);
                setPersisted(clearCourseKitQuizDraft(config));
              }}
            >
              {labels.clearQuizDraft}
            </button>
          ) : null}
        </div>
      </form>

      <div className={styles.quizStatus} role="status" aria-live="polite">
        {!grade && Object.keys(storedAnswers).length ? (
          <p>{labels.quizDraftRestored}</p>
        ) : null}
        {incomplete ? <p>{labels.answerAllQuestions}</p> : null}
        {grade ? (
          <div data-passed={grade.passed || undefined}>
            <strong>
              {grade.passed ? labels.quizPassed : labels.quizNotPassed}
            </strong>
            <p>
              {formatCourseKitCopy(labels.scorePosition, {
                score: grade.score,
                total: grade.total,
                required: grade.passCount,
              })}
            </p>
            {!grade.allCriticalCorrect ? (
              <p>{labels.criticalGateFailed}</p>
            ) : null}
            {persisted !== null ? (
              <small>
                {persisted ? labels.savedInBrowser : labels.savedInMemory}
              </small>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
