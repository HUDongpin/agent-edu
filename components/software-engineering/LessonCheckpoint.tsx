"use client";

import { useEffect, useRef, useState } from "react";
import type {
  SoftwareEngineeringCheckpoint,
  SoftwareEngineeringLocaleCopy,
} from "@/lib/software-engineering";
import styles from "./SoftwareEngineeringCourse.module.css";

export default function LessonCheckpoint({
  checkpoint,
  labels,
  id,
}: {
  checkpoint: SoftwareEngineeringCheckpoint;
  labels: SoftwareEngineeringLocaleCopy["ui"];
  id: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const feedback = useRef<HTMLDivElement>(null);
  const firstOption = useRef<HTMLInputElement>(null);
  const correct = selected === checkpoint.correctIndex;

  useEffect(() => {
    if (checked) feedback.current?.focus();
  }, [checked]);

  return (
    <section className={styles.checkpoint} aria-labelledby={`${id}-title`}>
      <p className={styles.kicker}>{labels.checkpoint}</p>
      <h2 id={`${id}-title`} lang="en" dir="ltr">{checkpoint.question}</h2>
      <form onSubmit={(event) => { event.preventDefault(); if (selected !== null) setChecked(true); }}>
        <fieldset lang="en" dir="ltr">
          <legend className={styles.srOnly}>{checkpoint.question}</legend>
          {checkpoint.options.map((option, index) => (
            <label
              className={checked && index === checkpoint.correctIndex
                ? styles.correctOption
                : checked && index === selected
                  ? styles.incorrectOption
                  : styles.option}
              key={option}
            >
              <input
                ref={index === 0 ? firstOption : undefined}
                type="radio"
                name={`${id}-answer`}
                value={index}
                checked={selected === index}
                disabled={checked}
                required
                onChange={() => setSelected(index)}
              />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
        {!checked ? (
          <button className={styles.primaryButton} type="submit" disabled={selected === null}>
            {labels.checkAnswer}
          </button>
        ) : (
          <div
            className={correct ? styles.correctFeedback : styles.incorrectFeedback}
            role="status"
            tabIndex={-1}
            ref={feedback}
          >
            <strong>{correct ? labels.correct : labels.incorrect}</strong>
            <p lang="en" dir="ltr">{checkpoint.explanation}</p>
            {!correct ? (
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => {
                  setSelected(null);
                  setChecked(false);
                  window.requestAnimationFrame(() => firstOption.current?.focus());
                }}
              >
                {labels.retryAssessment}
              </button>
            ) : null}
          </div>
        )}
      </form>
    </section>
  );
}
