"use client";

import { useState } from "react";
import { courseKitCheckpointKey } from "@/lib/course-kit/progress";
import type {
  CourseKitCheckpointCopy,
  CourseKitOptionIndex,
  CourseKitProgressClientConfig,
  CourseKitUiCopy,
} from "@/lib/course-kit/types";
import {
  setCourseKitCheckpoint,
  useCourseKitProgress,
} from "./progress-store";
import styles from "./CourseKit.module.css";

function storedChoice(value: unknown): CourseKitOptionIndex | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const choice = (value as { choice?: unknown }).choice;
  return choice === 0 || choice === 1 || choice === 2 || choice === 3
    ? choice
    : null;
}

export function ModuleCheckpoint({
  moduleSlug,
  checkpoint,
  config,
  labels,
}: {
  readonly moduleSlug: string;
  readonly checkpoint: CourseKitCheckpointCopy;
  readonly config: CourseKitProgressClientConfig;
  readonly labels: CourseKitUiCopy;
}) {
  const { record, storageAvailable } = useCourseKitProgress(config);
  const saved = record[courseKitCheckpointKey(config.courseId, moduleSlug)];
  const savedSignature = JSON.stringify(saved ?? null);
  const savedOption = storedChoice(saved);
  const [draft, setDraft] = useState<{
    readonly base: string;
    readonly choice: CourseKitOptionIndex;
    readonly checked: boolean;
  } | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const activeDraft = draft?.base === savedSignature ? draft : null;
  const choice = activeDraft?.choice ?? savedOption;
  const checked = activeDraft?.checked ?? savedOption !== null;
  const correct = choice === checkpoint.correctIndex;

  return (
    <section
      className={styles.checkpoint}
      aria-labelledby={`${moduleSlug}-checkpoint-title`}
    >
      <p className={styles.eyebrow}>{labels.checkpoint}</p>
      <h2 id={`${moduleSlug}-checkpoint-title`}>{checkpoint.question}</h2>
      <fieldset>
        <legend className={styles.srOnly}>{checkpoint.question}</legend>
        {checkpoint.options.map((option, index) => {
          const optionIndex = index as CourseKitOptionIndex;
          return (
            <label key={`${moduleSlug}-${index}`} data-selected={choice === index || undefined}>
              <input
                type="radio"
                name={`${config.courseId}-${moduleSlug}-checkpoint`}
                value={index}
                checked={choice === index}
                onChange={() => {
                  setDraft({
                    base: savedSignature,
                    choice: optionIndex,
                    checked: false,
                  });
                  setPersisted(null);
                }}
              />
              <span aria-hidden="true">{String.fromCharCode(65 + index)}</span>
              <span>{option}</span>
            </label>
          );
        })}
      </fieldset>
      <button
        type="button"
        disabled={choice === null}
        onClick={() => {
          if (choice === null) return;
          setDraft({ base: savedSignature, choice, checked: true });
          setPersisted(
            setCourseKitCheckpoint(
              config,
              moduleSlug,
              choice,
              choice === checkpoint.correctIndex,
            ),
          );
        }}
      >
        {labels.checkAnswer}
      </button>
      {checked ? (
        <div
          className={correct ? styles.feedbackPass : styles.feedbackRetry}
          role="status"
          aria-live="polite"
        >
          <strong>{correct ? labels.correct : labels.incorrect}</strong>
          <p>{checkpoint.explanation}</p>
          {persisted !== null ? (
            <small>
              {persisted ? labels.savedInBrowser : labels.savedInMemory}
            </small>
          ) : storageAvailable === false ? (
            <small>{labels.storageUnavailable}</small>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
