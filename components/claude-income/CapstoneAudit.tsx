"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CLAUDE_INCOME_CAPSTONE,
  type ClaudeIncomePractice,
} from "@/lib/claude-income";
import {
  capstoneCriticalClearKey,
  capstoneDeliverableKey,
  capstoneRubricKey,
  updateProgress,
} from "./progress-store";
import { useCourseProgress, useCourseStorageAvailable } from "./useCourseProgress";
import styles from "./ClaudeIncomeCourse.module.css";

function boundedScore(value: unknown, maximum: number): number {
  return typeof value === "number"
    && Number.isInteger(value)
    && value >= 0
    && value <= maximum
    ? value
    : 0;
}

export default function CapstoneAudit({ practice }: { practice: ClaudeIncomePractice }) {
  const progress = useCourseProgress();
  const storageAvailable = useCourseStorageAvailable();
  const [justRecorded, setJustRecorded] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const completedDeliverables = practice.deliverables.filter(
    (_, index) => progress[capstoneDeliverableKey(index)] === true,
  ).length;
  const allCriticalClear = CLAUDE_INCOME_CAPSTONE.criticalFailures.every(
    (_, index) => progress[capstoneCriticalClearKey(index)] === true,
  );
  const rubricScore = useMemo(() => CLAUDE_INCOME_CAPSTONE.criteria.reduce(
    (total, criterion) => total + boundedScore(progress[capstoneRubricKey(criterion.id)], criterion.points),
    0,
  ), [progress]);
  const ready = completedDeliverables === practice.deliverables.length
    && rubricScore >= CLAUDE_INCOME_CAPSTONE.minimumScore
    && allCriticalClear;
  const recorded = progress[CLAUDE_INCOME_CAPSTONE.passedStorageKey] === true;

  useEffect(() => {
    if (justRecorded) resultRef.current?.focus();
  }, [justRecorded]);

  return (
    <section
      className={styles.capstoneAudit}
      aria-labelledby="claude-income-capstone-audit-title"
      data-testid="claude-income-capstone-audit"
    >
      <header className={styles.assessmentHeader}>
        <div>
          <p className={styles.eyebrow}>Capstone self-audit</p>
          <h2 id="claude-income-capstone-audit-title" tabIndex={-1}>A 100-point evidence record</h2>
          <p>
            Score only what your portfolio proves. A critical failure cannot be offset by rubric points.
            This is a learning record, not an independent audit or income certificate.
          </p>
        </div>
        <dl className={styles.assessmentFacts}>
          <div><dt>Current score</dt><dd>{rubricScore}/100</dd></div>
          <div><dt>Minimum</dt><dd>{CLAUDE_INCOME_CAPSTONE.minimumScore}/100</dd></div>
        </dl>
      </header>

      <section className={styles.capstoneBlock} aria-labelledby="capstone-deliverables-title">
        <h3 id="capstone-deliverables-title">Portfolio deliverables</h3>
        <p>{completedDeliverables} of {practice.deliverables.length} documented</p>
        <ul className={styles.auditChecklist}>
          {practice.deliverables.map((deliverable, index) => (
            <li key={deliverable}>
              <label>
                <input
                  type="checkbox"
                  checked={progress[capstoneDeliverableKey(index)] === true}
                  onChange={(event) => {
                    updateProgress((record) => {
                      if (event.target.checked) record[capstoneDeliverableKey(index)] = true;
                      else delete record[capstoneDeliverableKey(index)];
                      delete record[CLAUDE_INCOME_CAPSTONE.passedStorageKey];
                    });
                  }}
                />
                <span>{deliverable}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.capstoneBlock} aria-labelledby="capstone-rubric-title">
        <h3 id="capstone-rubric-title">Rubric</h3>
        <p>Enter whole points up to the maximum shown. Keep evidence beside each score.</p>
        <ol className={styles.rubricList}>
          {CLAUDE_INCOME_CAPSTONE.criteria.map((criterion) => {
            const key = capstoneRubricKey(criterion.id);
            const value = boundedScore(progress[key], criterion.points);
            return (
              <li key={criterion.id}>
                <div className={styles.rubricCopy}>
                  <strong>{criterion.label}</strong>
                  <p>{criterion.fullCredit}</p>
                </div>
                <label className={styles.rubricInput}>
                  <span className={styles.srOnly}>Points for {criterion.label}</span>
                  <input
                    type="number"
                    min={0}
                    max={criterion.points}
                    step={1}
                    inputMode="numeric"
                    value={value}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      const bounded = Number.isFinite(next)
                        ? Math.max(0, Math.min(criterion.points, Math.trunc(next)))
                        : 0;
                      updateProgress((record) => {
                        record[key] = bounded;
                        delete record[CLAUDE_INCOME_CAPSTONE.passedStorageKey];
                      });
                    }}
                  />
                  <span>/ {criterion.points}</span>
                </label>
              </li>
            );
          })}
        </ol>
      </section>

      <section className={styles.criticalGate} aria-labelledby="capstone-critical-title">
        <p className={styles.eyebrow}>Non-compensable gate</p>
        <h3 id="capstone-critical-title">Confirm every critical failure is clear</h3>
        <p>If any statement is not clear, stop and remediate it before recording a result.</p>
        <ul className={styles.auditChecklist}>
          {CLAUDE_INCOME_CAPSTONE.criticalFailures.map((failure, index) => (
            <li key={failure}>
              <label>
                <input
                  type="checkbox"
                  checked={progress[capstoneCriticalClearKey(index)] === true}
                  onChange={(event) => {
                    updateProgress((record) => {
                      if (event.target.checked) record[capstoneCriticalClearKey(index)] = true;
                      else delete record[capstoneCriticalClearKey(index)];
                      delete record[CLAUDE_INCOME_CAPSTONE.passedStorageKey];
                    });
                  }}
                />
                <span><strong>Confirmed clear:</strong> {failure}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      {!storageAvailable ? (
        <p className={styles.storageWarning} role="status">
          Capstone entries will last only for this open browser session.
        </p>
      ) : null}

      <div className={styles.capstoneDecision}>
        <button
          className={styles.primaryAction}
          type="button"
          disabled={!ready}
          onClick={() => {
            updateProgress((record) => {
              record[CLAUDE_INCOME_CAPSTONE.passedStorageKey] = true;
            });
            setJustRecorded(true);
          }}
        >
          {recorded ? "Record remains complete" : "Record capstone completion"}
        </button>
        {!ready ? (
          <p>
            Required: every deliverable, at least {CLAUDE_INCOME_CAPSTONE.minimumScore} points,
            and all critical failures confirmed clear.
          </p>
        ) : null}
      </div>

      {recorded ? (
        <div className={styles.capstoneResult} tabIndex={-1} ref={resultRef} role="status">
          <p className={styles.eyebrow}>Course record complete</p>
          <h3>Evidence-bounded capstone recorded</h3>
          <p>{CLAUDE_INCOME_CAPSTONE.completionStatement}</p>
          <button className={styles.textButton} type="button" onClick={() => window.print()}>
            Print this learning record
          </button>
        </div>
      ) : null}
    </section>
  );
}
