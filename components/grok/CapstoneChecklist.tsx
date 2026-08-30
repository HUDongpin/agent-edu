"use client";

import type { GrokCourseCopy } from "@/lib/grok/types";
import { updateGrokProgress } from "./progress-store";
import useGrokProgress, {
  useGrokHydrated,
  useGrokStorageAvailable,
} from "./useGrokProgress";
import styles from "./GrokCourse.module.css";

export default function CapstoneChecklist({
  labels,
}: {
  labels: GrokCourseCopy["ui"];
}) {
  const progress = useGrokProgress();
  const hydrated = useGrokHydrated();
  const storageAvailable = useGrokStorageAvailable();
  const items = labels.capstoneItems.split("|");
  const checks = items.map((_, index) => progress.capstoneChecks[index] === true);
  const complete = checks.length === items.length && checks.every(Boolean);

  return (
    <section
      id="capstone-evidence"
      className={styles.capstoneChecklist}
      aria-labelledby="capstone-checklist-title"
      data-testid="grok-capstone-checklist"
    >
      <header>
        <h2 id="capstone-checklist-title">{labels.capstoneChecklist}</h2>
        <p>{labels.capstoneChecklistIntro}</p>
      </header>
      {!storageAvailable ? (
        <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p>
      ) : null}
      <div className={styles.checklistItems}>
        {items.map((item, index) => (
          <label key={item}>
            <input
              type="checkbox"
              disabled={!hydrated || !storageAvailable}
              name={`grok-capstone-evidence-${index + 1}`}
              checked={checks[index]}
              onChange={(event) => updateGrokProgress((current) => {
                const nextChecks = current.capstoneChecks.map((checked, itemIndex) => (
                  itemIndex === index ? event.target.checked : checked
                ));
                return {
                  ...current,
                  capstoneChecks: nextChecks,
                  capstoneReady: nextChecks.every(Boolean),
                };
              })}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
      <output className={complete ? styles.readyStatus : styles.pendingStatus} aria-live="polite">
        {complete ? labels.capstoneReady : labels.capstoneNotReady}
      </output>
    </section>
  );
}
