"use client";

import { useMemo, useState } from "react";
import {
  courseKitQuizBestKey,
  courseKitQuizCurrentScoreKey,
  courseKitQuizDraftKey,
  courseKitQuizFormKey,
  courseKitQuizPassedKey,
  courseKitQuizVersionKey,
} from "@/lib/course-kit/progress";
import {
  drawCourseKitQuizQuestions,
  gradeCourseKitQuiz,
  selectCourseKitQuizForm,
  selectCourseKitQuizFormQuestions,
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
  setCourseKitQuizForm,
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
  const { record } = useCourseKitProgress(config);
  const storedFormId = typeof record[courseKitQuizFormKey(config.courseId)] === "string"
    ? String(record[courseKitQuizFormKey(config.courseId)])
    : undefined;
  const [activeFormId, setActiveFormId] = useState<string | null>(null);
  const selectedForm = useMemo(
    () => quiz.forms
      ? selectCourseKitQuizForm(
          quiz.forms,
          `${config.courseId}:${quiz.version}`,
          activeFormId ?? storedFormId,
        )
      : null,
    [activeFormId, config.courseId, quiz.forms, quiz.version, storedFormId],
  );
  const selectedQuestions = useMemo(
    () =>
      quiz.forms
        ? selectCourseKitQuizFormQuestions(
            quiz.questions,
            quiz.forms,
            `${config.courseId}:${quiz.version}`,
            selectedForm?.id,
          )
        : drawCourseKitQuizQuestions(
            quiz.questions,
            quiz.drawCount,
            `${config.courseId}:${quiz.version}`,
          ),
    [config.courseId, quiz.drawCount, quiz.forms, quiz.questions, quiz.version, selectedForm?.id],
  );
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
  const currentScore = currentQuiz
    ? record[courseKitQuizCurrentScoreKey(config.courseId)]
    : undefined;
  const currentPassed = currentQuiz
    ? record[courseKitQuizPassedKey(config.courseId)] === true
    : false;

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
              selectedForm?.id,
            ),
          );
        }}
        data-quiz-form={selectedForm?.id}
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
                          disabled={grade !== null}
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
                              setCourseKitQuizDraft(
                                config,
                                nextAnswers,
                                selectedForm?.id,
                              ),
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
                let saved: boolean;
                if (quiz.forms && selectedForm) {
                  const currentIndex = quiz.forms.findIndex((form) => form.id === selectedForm.id);
                  const nextForm = quiz.forms[(currentIndex + 1) % quiz.forms.length];
                  setActiveFormId(nextForm.id);
                  saved = setCourseKitQuizForm(config, nextForm.id);
                } else {
                  saved = clearCourseKitQuizDraft(config);
                }
                setAnswerDraft(null);
                setGrade(null);
                setIncomplete(false);
                setPersisted(saved);
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
        ) : typeof currentScore === "number" ? (
          <div data-passed={currentPassed || undefined}>
            <strong>{labels.currentAttempt}: {currentPassed ? labels.quizPassed : labels.quizNotPassed}</strong>
            <p>
              {formatCourseKitCopy(labels.scorePosition, {
                score: currentScore,
                total: quiz.drawCount,
                required: quiz.passCount,
              })}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
