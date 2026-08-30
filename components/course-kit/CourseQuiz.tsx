"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  courseKitQuizBestKey,
  courseKitQuizDraftKey,
  courseKitQuizVersionKey,
  isCourseKitModuleComplete,
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
  sourcesHref,
  sourceTitles,
  requirePrerequisites = false,
  showIntro = true,
}: {
  readonly quiz: MaterialisedQuiz;
  readonly config: CourseKitProgressClientConfig;
  readonly labels: CourseKitUiCopy;
  readonly sourcesHref?: string;
  readonly sourceTitles?: Readonly<Record<string, string>>;
  readonly requirePrerequisites?: boolean;
  readonly showIntro?: boolean;
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
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const currentQuiz =
    record[courseKitQuizVersionKey(config.courseId)] === quiz.version;
  const best = currentQuiz
    ? record[courseKitQuizBestKey(config.courseId)]
    : undefined;
  const prerequisitesComplete = !requirePrerequisites || config.moduleSlugs.every(
    (moduleSlug) => isCourseKitModuleComplete(record, config, moduleSlug),
  );

  return (
    <section
      className={styles.quiz}
      id="final-assessment"
      aria-labelledby={`${config.courseId}-assessment-title`}
    >
      <header className={styles.sectionIntro}>
        <p className={styles.eyebrow}>{labels.finalAssessment}</p>
        <h2 id={`${config.courseId}-assessment-title`}>{quiz.title}</h2>
        {showIntro ? <p>{quiz.intro}</p> : null}
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

      {!prerequisitesComplete ? (
        <p className={styles.prerequisiteNotice} role="status">
          {labels.completeModulesBeforeAssessment}
        </p>
      ) : null}

      <nav className={styles.quizNavigator} aria-label={labels.finalAssessment}>
        {selectedQuestions.map((question, index) => {
          const answered = answers[question.id] !== undefined;
          const correct = grade
            ? answers[question.id] === question.correctIndex
            : undefined;
          const statusLabel = grade
            ? correct
              ? labels.correct
              : labels.incorrect
            : answered
              ? labels.answeredQuestion
              : labels.unansweredQuestion;
          return (
            <button
              type="button"
              key={question.id}
              aria-current={index === activeQuestionIndex ? "step" : undefined}
              aria-label={`${formatCourseKitCopy(labels.questionPosition, {
                current: index + 1,
                total: selectedQuestions.length,
              })}: ${statusLabel}`}
              data-answered={answered || undefined}
              data-correct={correct === true || undefined}
              data-incorrect={correct === false || undefined}
              onClick={() => setActiveQuestionIndex(index)}
            >
              {index + 1}
              {grade ? (
                <span aria-hidden="true"> {correct ? "✓" : "×"}</span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!prerequisitesComplete) return;
          const allAnswered = selectedQuestions.every(
            (question) => answers[question.id] !== undefined,
          );
          if (!allAnswered) {
            const firstUnanswered = selectedQuestions.findIndex(
              (question) => answers[question.id] === undefined,
            );
            setIncomplete(true);
            setGrade(null);
            setActiveQuestionIndex(firstUnanswered);
            const firstUnansweredId = selectedQuestions[firstUnanswered]?.id;
            requestAnimationFrame(() => {
              document
                .getElementById(`${config.courseId}-${firstUnansweredId}-fieldset`)
                ?.focus();
            });
            return;
          }
          const nextGrade = gradeCourseKitQuiz(
            selectedQuestions,
            answers,
            quiz.passCount,
          );
          setIncomplete(false);
          setGrade(nextGrade);
          const firstIncorrect = selectedQuestions.findIndex(
            (question) => answers[question.id] !== question.correctIndex,
          );
          const resultQuestionIndex = firstIncorrect >= 0 ? firstIncorrect : 0;
          setActiveQuestionIndex(resultQuestionIndex);
          const resultQuestionId = selectedQuestions[resultQuestionIndex]?.id;
          requestAnimationFrame(() => {
            const resultQuestion = document.getElementById(
              `${config.courseId}-${resultQuestionId}-fieldset`,
            );
            resultQuestion?.scrollIntoView({ block: "start" });
            resultQuestion?.focus({ preventScroll: true });
          });
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
          {selectedQuestions
            .slice(activeQuestionIndex, activeQuestionIndex + 1)
            .map((question) => {
            const questionIndex = activeQuestionIndex;
            const selected = answers[question.id];
            const questionErrorId = `${config.courseId}-${question.id}-error`;
            return (
              <li key={question.id} value={questionIndex + 1}>
                <fieldset
                  id={`${config.courseId}-${question.id}-fieldset`}
                  tabIndex={-1}
                  aria-describedby={
                    incomplete && selected === undefined ? questionErrorId : undefined
                  }
                >
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
                    {question.evidenceMode !== "source-grounded" ? (
                      <em>{labels.evidenceModeLabels[question.evidenceMode]}</em>
                    ) : null}
                    <strong>{question.prompt}</strong>
                  </legend>
                  {incomplete && selected === undefined ? (
                    <p className={styles.questionError} id={questionErrorId} role="alert">
                      {labels.answerAllQuestions}
                    </p>
                  ) : null}
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
                          disabled={!prerequisitesComplete}
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
                  {sourcesHref && question.sourceIds.length ? (
                    <nav className={styles.sourceLinks} aria-label={labels.sources}>
                      {question.sourceIds.map((sourceId) => (
                        <Link href={`${sourcesHref}#source-${sourceId}`} key={sourceId}>
                          {sourceTitles?.[sourceId] ?? `${labels.source}: ${sourceId}`}
                        </Link>
                      ))}
                    </nav>
                  ) : null}
                </fieldset>
              </li>
            );
          })}
        </ol>
        <div className={styles.quizStepActions}>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={activeQuestionIndex === 0}
            onClick={() => setActiveQuestionIndex((index) => Math.max(0, index - 1))}
          >
            <span aria-hidden="true">← </span>
            {labels.previousQuestion}
          </button>
          <span>
            {formatCourseKitCopy(labels.questionPosition, {
              current: activeQuestionIndex + 1,
              total: selectedQuestions.length,
            })}
          </span>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={activeQuestionIndex === selectedQuestions.length - 1}
            onClick={() => setActiveQuestionIndex((index) =>
              Math.min(selectedQuestions.length - 1, index + 1)
            )}
          >
            {labels.nextQuestion}
            <span aria-hidden="true"> →</span>
          </button>
        </div>
        <div className={styles.quizActions}>
          <button type="submit" disabled={!prerequisitesComplete}>
            {labels.submitQuiz}
          </button>
          {grade ? (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                setAnswerDraft({ base: storedAnswersSignature, answers: {} });
                setGrade(null);
                setIncomplete(false);
                setPersisted(clearCourseKitQuizDraft(config));
                setActiveQuestionIndex(0);
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
                setActiveQuestionIndex(0);
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
