"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SOFTWARE_ENGINEERING_ASSESSMENT_DRAFT_KEY,
  SOFTWARE_ENGINEERING_SOURCE_BY_ID,
  parseSoftwareEngineeringAssessmentDraft,
  type SoftwareEngineeringAssessmentDraft,
  type SoftwareEngineeringLocaleCopy,
  type SoftwareEngineeringQuestion,
  type SoftwareEngineeringUnitId,
} from "@/lib/software-engineering";
import {
  SOFTWARE_ENGINEERING_PROGRESS_RESET_EVENT,
  updateSoftwareEngineeringProgress,
} from "./progress-store";
import useSoftwareEngineeringProgress, {
  useSoftwareEngineeringStorageAvailable,
} from "./useSoftwareEngineeringProgress";
import styles from "./SoftwareEngineeringCourse.module.css";

type AssessmentConfig = {
  readonly bankVersion: string;
  readonly questionCount: number;
  readonly questionsPerUnit: number;
  readonly passingCorrectAnswers: number;
  readonly bestScoreStorageKey: string;
  readonly passedStorageKey: string;
  readonly versionStorageKey: string;
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
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = randomIndex(index + 1);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function sameAttempt(
  left: readonly SoftwareEngineeringQuestion[],
  right: readonly SoftwareEngineeringQuestion[],
): boolean {
  if (left.length !== right.length) return false;
  const leftIds = left.map((question) => question.id).sort();
  const rightIds = right.map((question) => question.id).sort();
  return leftIds.every((id, index) => id === rightIds[index]);
}

function selectAttempt(
  bank: readonly SoftwareEngineeringQuestion[],
  questionsPerUnit: number,
  previous: readonly SoftwareEngineeringQuestion[],
): SoftwareEngineeringQuestion[] {
  const unitIds = [...new Set(bank.map((question) => question.unitId))];
  for (let tryIndex = 0; tryIndex < 8; tryIndex += 1) {
    const selected = unitIds.flatMap((unitId) => (
      shuffle(bank.filter((question) => question.unitId === unitId)).slice(0, questionsPerUnit)
    ));
    const attempt = shuffle(selected);
    if (!sameAttempt(attempt, previous)) return attempt;
  }
  if (!previous.length) return [];

  const previousIds = new Set(previous.map((question) => question.id));
  for (const question of previous) {
    const replacement = bank.find((candidate) => (
      candidate.unitId === question.unitId && !previousIds.has(candidate.id)
    ));
    if (replacement) {
      return shuffle(previous.map((candidate) => (
        candidate.id === question.id ? replacement : candidate
      )));
    }
  }

  return shuffle(previous);
}

function validScore(value: unknown, maximum: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= maximum ? value : 0;
}

export default function FinalAssessment({
  bank,
  config,
  unitTitles,
  labels,
}: {
  bank: readonly SoftwareEngineeringQuestion[];
  config: AssessmentConfig;
  unitTitles: Readonly<Record<SoftwareEngineeringUnitId, string>>;
  labels: SoftwareEngineeringLocaleCopy["ui"];
}) {
  const progress = useSoftwareEngineeringProgress();
  const storageAvailable = useSoftwareEngineeringStorageAvailable();
  const [completedScore, setCompletedScore] = useState<number | null>(null);
  const previousAttempt = useRef<SoftwareEngineeringQuestion[]>([]);
  const assessmentHeading = useRef<HTMLHeadingElement>(null);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const draft = parseSoftwareEngineeringAssessmentDraft(
    progress[SOFTWARE_ENGINEERING_ASSESSMENT_DRAFT_KEY],
    bank,
    config,
  );
  const bankById = useMemo(
    () => new Map(bank.map((question) => [question.id, question])),
    [bank],
  );
  const attempt = draft?.questionIds.map((id) => bankById.get(id)!) ?? [];
  const questionIndex = draft?.questionIndex ?? 0;
  const selectedIndex = draft?.selectedIndex ?? null;
  const current = attempt[questionIndex];
  const currentAnswer = current ? draft?.answerSelections[current.id] : undefined;
  const currentAnswerCorrect = current !== undefined
    && currentAnswer !== undefined
    && currentAnswer === current.correctIndex;
  const versionMatches = progress[config.versionStorageKey] === config.bankVersion;
  const storedBest = versionMatches ? validScore(progress[config.bestScoreStorageKey], config.questionCount) : 0;
  const best = Math.max(storedBest, completedScore ?? 0);

  const bankReady = useMemo(() => {
    const counts = new Map<SoftwareEngineeringUnitId, number>();
    for (const question of bank) counts.set(question.unitId, (counts.get(question.unitId) ?? 0) + 1);
    return bank.length === 25
      && counts.size === 5
      && [...counts.values()].every((count) => count >= config.questionsPerUnit)
      && counts.size * config.questionsPerUnit === config.questionCount;
  }, [bank, config.questionCount, config.questionsPerUnit]);

  useEffect(() => {
    if (currentAnswer !== undefined || completedScore !== null) feedback.current?.focus();
  }, [completedScore, currentAnswer]);

  useEffect(() => {
    const focusAssessmentHeading = () => assessmentHeading.current?.focus();
    const focusFromHash = () => {
      if (window.location.hash === "#final-assessment") {
        focusAssessmentHeading();
      }
    };
    const focusFromAssessmentLink = (event: MouseEvent) => {
      if (event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin
        || destination.pathname !== window.location.pathname
        || destination.hash !== "#final-assessment") return;
      window.requestAnimationFrame(focusAssessmentHeading);
    };

    focusFromHash();
    window.addEventListener("hashchange", focusFromHash);
    // Capture the activation before CourseLocaleReturn rewrites a fallback
    // course URL and stops normal propagation. Query changes do not alter the
    // assessment target, so the heading should still receive focus.
    document.addEventListener("click", focusFromAssessmentLink, true);
    return () => {
      window.removeEventListener("hashchange", focusFromHash);
      document.removeEventListener("click", focusFromAssessmentLink, true);
    };
  }, []);

  useEffect(() => {
    const resetAssessment = () => {
      previousAttempt.current = [];
      setCompletedScore(null);
    };
    window.addEventListener(SOFTWARE_ENGINEERING_PROGRESS_RESET_EVENT, resetAssessment);
    return () => {
      window.removeEventListener(SOFTWARE_ENGINEERING_PROGRESS_RESET_EVENT, resetAssessment);
    };
  }, []);

  function beginAttempt() {
    const next = selectAttempt(bank, config.questionsPerUnit, previousAttempt.current);
    if (!next.length) return;
    previousAttempt.current = next;
    setCompletedScore(null);
    updateSoftwareEngineeringProgress((record) => {
      record[SOFTWARE_ENGINEERING_ASSESSMENT_DRAFT_KEY] = {
        version: 1,
        bankVersion: config.bankVersion,
        questionIds: next.map((question) => question.id),
        questionIndex: 0,
        selectedIndex: null,
        answerSelections: {},
      } satisfies SoftwareEngineeringAssessmentDraft;
    });
    window.requestAnimationFrame(() => questionHeading.current?.focus());
  }

  function saveDraft(nextDraft: SoftwareEngineeringAssessmentDraft) {
    updateSoftwareEngineeringProgress((record) => {
      record[SOFTWARE_ENGINEERING_ASSESSMENT_DRAFT_KEY] = nextDraft;
    });
  }

  function finish(answerSelections: Readonly<Record<string, number>>) {
    const score = attempt.filter(
      (question) => answerSelections[question.id] === question.correctIndex,
    ).length;
    previousAttempt.current = attempt;
    setCompletedScore(score);
    updateSoftwareEngineeringProgress((record) => {
      const sameVersion = record[config.versionStorageKey] === config.bankVersion;
      const prior = sameVersion ? validScore(record[config.bestScoreStorageKey], config.questionCount) : 0;
      record[config.bestScoreStorageKey] = Math.max(prior, score);
      record[config.passedStorageKey] = score >= config.passingCorrectAnswers
        || (sameVersion && record[config.passedStorageKey] === true);
      record[config.versionStorageKey] = config.bankVersion;
      delete record[SOFTWARE_ENGINEERING_ASSESSMENT_DRAFT_KEY];
    });
  }

  return (
    <section className={styles.finalQuiz} id="final-assessment" aria-labelledby="final-assessment-title" data-testid="software-engineering-final-assessment">
      <header className={styles.quizHeader}>
        <div>
          <p className={styles.kicker}>{labels.finalAssessment}</p>
          <h2 id="final-assessment-title" ref={assessmentHeading} tabIndex={-1}>
            {labels.finalAssessment}
          </h2>
          <p>{labels.assessmentIntro}</p>
        </div>
        <div className={styles.quizRequirement}>
          <strong>{labels.passRequirement}</strong>
          <span>{labels.bestScore}: {best} / {config.questionCount}</span>
        </div>
      </header>

      {!storageAvailable ? <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p> : null}

      {completedScore !== null ? (
        <div className={completedScore >= config.passingCorrectAnswers ? styles.correctFeedback : styles.incorrectFeedback} role="status" tabIndex={-1} ref={feedback}>
          <strong>{completedScore} / {config.questionCount}</strong>
          <p>{completedScore >= config.passingCorrectAnswers ? labels.quizPassed : labels.quizNeedsReview}</p>
          <button className={styles.secondaryButton} type="button" onClick={beginAttempt}>{labels.retryAssessment}</button>
        </div>
      ) : !attempt.length ? (
        <button className={styles.primaryButton} type="button" disabled={!bankReady} onClick={beginAttempt}>
          {labels.beginAssessment}
        </button>
      ) : current ? (
        <form
          className={styles.quizQuestion}
          data-question-id={current.id}
          data-unit-id={current.unitId}
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft || selectedIndex === null || currentAnswer !== undefined) return;
            saveDraft({
              ...draft,
              answerSelections: {
                ...draft.answerSelections,
                [current.id]: selectedIndex,
              },
            });
          }}
        >
          <div className={styles.quizMeta}>
            <span>{labels.questionProgress}: {questionIndex + 1} / {config.questionCount}</span>
            <span>{unitTitles[current.unitId]}</span>
          </div>
          <h3 tabIndex={-1} ref={questionHeading} lang="en" dir="ltr">{current.question}</h3>
          <fieldset lang="en" dir="ltr">
            <legend className={styles.srOnly}>{current.question}</legend>
            {current.options.map((option, optionIndex) => (
              <label
                className={currentAnswer !== undefined && optionIndex === current.correctIndex
                  ? styles.correctOption
                  : currentAnswer !== undefined && optionIndex === currentAnswer
                    ? styles.incorrectOption
                    : styles.option}
                key={`${current.id}-${optionIndex}`}
              >
                <input
                  type="radio"
                  name={current.id}
                  value={optionIndex}
                  checked={selectedIndex === optionIndex}
                  disabled={currentAnswer !== undefined}
                  required
                  onChange={() => {
                    if (!draft) return;
                    saveDraft({ ...draft, selectedIndex: optionIndex });
                  }}
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
          {currentAnswer === undefined ? (
            <button className={styles.primaryButton} type="submit" disabled={selectedIndex === null}>{labels.checkAnswer}</button>
          ) : (
            <div className={currentAnswerCorrect ? styles.correctFeedback : styles.incorrectFeedback} role="status" tabIndex={-1} ref={feedback}>
              <strong>{currentAnswerCorrect ? labels.correct : labels.incorrect}</strong>
              <p lang="en" dir="ltr">{current.explanation}</p>
              {current.sourceIds.map((sourceId) => {
                const source = SOFTWARE_ENGINEERING_SOURCE_BY_ID[sourceId];
                return source ? (
                  <a key={sourceId} href={source.url} target="_blank" rel="noopener noreferrer" lang="en" dir="ltr">
                    {labels.source}: {source.title}
                  </a>
                ) : null;
              })}
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => {
                  if (!draft) return;
                  if (questionIndex < attempt.length - 1) {
                    saveDraft({
                      ...draft,
                      questionIndex: questionIndex + 1,
                      selectedIndex: null,
                    });
                    window.requestAnimationFrame(() => questionHeading.current?.focus());
                  } else {
                    finish(draft.answerSelections);
                  }
                }}
              >
                {questionIndex < attempt.length - 1 ? labels.nextQuestion : labels.finishAssessment}
              </button>
            </div>
          )}
        </form>
      ) : null}
    </section>
  );
}
