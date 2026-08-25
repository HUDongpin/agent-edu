"use client";

import { setIncomeCapstone } from "./progress-store";
import useIncomeProgress, { useIncomeHydrated, useIncomeStorageAvailable } from "./useIncomeProgress";
import styles from "./IncomeCourse.module.css";

const items = [
  "Problem-evidence ledger with contradictory evidence",
  "Named payer and reachable customer path",
  "Offer, scope, acceptance, and stop conditions",
  "Commercial task contract",
  "Working core flow or decision artefact",
  "Fresh test, review, and failure-path receipt",
  "Privacy, security, accessibility, and rights checklist",
  "Acceptance or stakeholder review record",
  "Base, downside, and severe-review economics",
  "Honest proposal and portfolio evidence card",
  "Handoff, deployment, or rollback runbook",
  "Seven-day acquisition or adoption experiment",
  "Go, revise, or stop decision plus retrospective",
] as const;

export default function CapstoneChecklist() {
  const progress = useIncomeProgress();
  const hydrated = useIncomeHydrated();
  const storageAvailable = useIncomeStorageAvailable();
  const count = progress.capstoneChecks.filter(Boolean).length;

  return (
    <section className={styles.workbench} aria-labelledby="income-capstone-checklist-title" data-testid="income-capstone-checklist">
      <header>
        <p className={styles.toolKicker}>Capstone receipt</p>
        <h2 id="income-capstone-checklist-title">Codex Revenue Evidence Pack</h2>
        <p>All thirteen artefacts are required. A sale is optional; fabricated commercial evidence is a failure.</p>
      </header>
      <output className={styles.checklistProgress} aria-live="polite">
        <strong>{count}</strong><span> / {items.length} evidence items</span>
      </output>
      <ul className={styles.capstoneChecks}>
        {items.map((item, index) => (
          <li key={item}>
            <label>
              <input
                type="checkbox"
                aria-label={`Evidence item ${index + 1}: ${item}`}
                disabled={!hydrated}
                checked={progress.capstoneChecks[index] === true}
                onChange={(event) => {
                  const next = [...progress.capstoneChecks];
                  next[index] = event.target.checked;
                  setIncomeCapstone(next);
                }}
              />
              <span><strong>{String(index + 1).padStart(2, "0")}</strong>{item}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className={progress.capstoneReady ? styles.capstoneReady : styles.capstonePending} role="status">
        {progress.capstoneReady ? "Evidence pack complete. Run the final claim audit before publication." : "Complete every evidence item before calling the capstone ready."}
      </p>
      {!storageAvailable ? <p className={styles.storageWarning} role="status">Browser storage is unavailable. Use the list as a manual checklist.</p> : null}
    </section>
  );
}
