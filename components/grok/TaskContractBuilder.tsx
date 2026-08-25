"use client";

import { useMemo, useState } from "react";
import type { GrokCourseCopy } from "@/lib/grok/types";
import CopyPrompt from "./CopyPrompt";
import { useGrokHydrated } from "./useGrokProgress";
import styles from "./GrokCourse.module.css";

const FIELD_KEYS = [
  "fieldGoal",
  "fieldContext",
  "fieldEvidence",
  "fieldConstraints",
  "fieldOutput",
  "fieldAcceptance",
] as const;

export default function TaskContractBuilder({
  labels,
}: {
  labels: GrokCourseCopy["ui"];
}) {
  const [values, setValues] = useState(() => FIELD_KEYS.map(() => ""));
  const hydrated = useGrokHydrated();
  const prompt = useMemo(() => FIELD_KEYS.map((labelKey, index) => (
    `${labels[labelKey].toUpperCase()}: ${values[index] || `[${labels[labelKey]}]`}`
  )).join("\n"), [labels, values]);

  return (
    <section className={styles.contractBuilder} aria-labelledby="grok-contract-builder-title">
      <header>
        <h3 id="grok-contract-builder-title">{labels.contractBuilder}</h3>
        <p>{labels.contractBuilderIntro}</p>
      </header>
      <div className={styles.contractGrid}>
        <div className={styles.contractFields}>
          {FIELD_KEYS.map((labelKey, index) => (
            <label key={labelKey}>
              <span>{labels[labelKey]}</span>
              <textarea
                rows={3}
                disabled={!hydrated}
                name={`grok-contract-${labelKey}`}
                autoComplete="off"
                value={values[index]}
                onChange={(event) => setValues((current) => current.map((value, valueIndex) => (
                  valueIndex === index ? event.target.value : value
                )))}
              />
            </label>
          ))}
          <button
            type="button"
            disabled={!hydrated}
            className={styles.secondaryAction}
            onClick={() => setValues(FIELD_KEYS.map(() => ""))}
          >
            {labels.clear}
          </button>
        </div>
        <div className={styles.contractPreview}>
          <h4>{labels.contractPreview}</h4>
          <CopyPrompt
            prompt={prompt}
            label={labels.copyPrompt}
            copiedLabel={labels.copied}
            failedLabel={labels.copyFailed}
          />
        </div>
      </div>
    </section>
  );
}
