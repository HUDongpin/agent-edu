"use client";

import { useState } from "react";
import { presentMcpOptions, type McpKnowledgeCheck } from "@/lib/mcp";
import type { McpUiCopy } from "@/lib/mcp/copy";
import styles from "./McpCourse.module.css";

export default function KnowledgeCheck({
  check,
  displayedCorrectIndex,
  ui,
}: {
  check: McpKnowledgeCheck;
  displayedCorrectIndex: 0 | 1 | 2 | 3;
  ui: McpUiCopy;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = selected === check.correctIndex;
  const presentedOptions = presentMcpOptions(check, displayedCorrectIndex);

  return (
    <section className={styles.knowledgeCheck} aria-labelledby="mcp-knowledge-check-title">
      <p className={styles.eyebrow}>{ui.checkEyebrow}</p>
      <h2 id="mcp-knowledge-check-title">{check.question}</h2>
      <fieldset>
        <legend className={styles.visuallyHidden}>{ui.checkChooseOne}</legend>
        {presentedOptions.map(({ text, originalIndex }, displayedIndex) => (
          <label
            key={originalIndex}
            className={`${styles.answerOption} ${checked && originalIndex === check.correctIndex ? styles.correctAnswer : ""} ${checked && selected === originalIndex && !correct ? styles.wrongAnswer : ""}`}
          >
            <input
              type="radio"
              name="mcp-lesson-check"
              value={originalIndex}
              checked={selected === originalIndex}
              onChange={() => { setSelected(originalIndex); setChecked(false); }}
            />
            <span>{String.fromCharCode(65 + displayedIndex)}</span>
            {text}
          </label>
        ))}
      </fieldset>
      <button
        className={styles.secondaryButton}
        type="button"
        disabled={selected == null}
        onClick={() => setChecked(true)}
      >
        {ui.checkAnswer}
      </button>
      {checked ? (
        <div className={correct ? styles.feedbackCorrect : styles.feedbackWrong} role="status">
          <strong>{correct ? ui.checkCorrect : ui.checkReview}</strong> {check.explanation}
        </div>
      ) : null}
    </section>
  );
}
