"use client";

import { useMemo } from "react";
import useSessionDraft from "./useSessionDraft";
import styles from "./IncomeCourse.module.css";

const positiveFields = [
  ["pain", "Problem pain"],
  ["frequency", "Frequency"],
  ["buyerAccess", "Access to a buyer"],
  ["budget", "Budget evidence"],
  ["evidence", "Evidence strength"],
  ["speed", "Speed to reviewable proof"],
  ["repeatability", "Repeatability"],
] as const;

const riskFields = [
  ["dataRisk", "Data or regulatory risk"],
  ["support", "Support burden"],
  ["dependency", "External dependency risk"],
] as const;

type ScoreKey = (typeof positiveFields)[number][0] | (typeof riskFields)[number][0];
type Scores = Record<ScoreKey, number>;
type ScoreEvidence = Record<ScoreKey, string>;

const emptyScores = Object.fromEntries(
  [...positiveFields, ...riskFields].map(([key]) => [key, 0]),
) as Scores;
const emptyEvidence = Object.fromEntries(
  [...positiveFields, ...riskFields].map(([key]) => [key, ""]),
) as ScoreEvidence;

type ScoreDraft = { readonly scores: Scores; readonly candidate: string; readonly evidence: ScoreEvidence };
const emptyDraft: ScoreDraft = { scores: emptyScores, candidate: "", evidence: emptyEvidence };

function parseScoreDraft(value: unknown): ScoreDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const rawScores = record.scores;
  const rawEvidence = record.evidence;
  if (!rawScores || typeof rawScores !== "object" || Array.isArray(rawScores)) return null;
  if (!rawEvidence || typeof rawEvidence !== "object" || Array.isArray(rawEvidence)) return null;
  const scores = { ...emptyScores };
  const evidence = { ...emptyEvidence };
  for (const [key] of [...positiveFields, ...riskFields]) {
    const score = (rawScores as Record<string, unknown>)[key];
    const note = (rawEvidence as Record<string, unknown>)[key];
    if (typeof score === "number" && Number.isInteger(score) && score >= 0 && score <= 5) {
      scores[key] = score;
    }
    if (typeof note === "string") evidence[key] = note;
  }
  return {
    scores,
    candidate: typeof record.candidate === "string" ? record.candidate : "",
    evidence,
  };
}

export default function OpportunityScorecard() {
  const { value: draft, setValue: setDraft, clear, status } = useSessionDraft({
    storageKey: "aicourse.course11.scorecard.v1",
    initialValue: emptyDraft,
    parse: parseScoreDraft,
  });
  const { scores, candidate, evidence } = draft;
  const score = useMemo(() => {
    const positive = positiveFields.reduce((sum, [key]) => sum + scores[key], 0);
    const risk = riskFields.reduce((sum, [key]) => sum + scores[key], 0);
    return Math.max(0, Math.min(100, Math.round((positive / 35) * 100 - (risk / 15) * 30)));
  }, [scores]);
  const interpretation = score >= 70
    ? "Promising enough for a small falsifiable experiment"
    : score >= 45
      ? "Needs stronger evidence or a narrower scope"
      : "Do not build yet; investigate, narrow, or stop";

  function field([key, label]: readonly [ScoreKey, string], kind: "signal" | "risk") {
    const id = `income-score-${key}`;
    const evidenceId = `${id}-evidence`;
    return (
      <div className={styles.scoreField} key={key}>
        <label htmlFor={id}>
          <span>{label}</span>
          <span className={styles.scoreInput}>
            <input
              id={id}
              name={`make-money-with-codex-score-${key}`}
              autoComplete="off"
              type="range"
              min="0"
              max="5"
              step="1"
              value={scores[key]}
              onChange={(event) => setDraft((current) => ({
                ...current,
                scores: { ...current.scores, [key]: Number(event.target.value) },
              }))}
              aria-describedby={`${id}-help`}
            />
            <output htmlFor={id}>{scores[key]} / 5</output>
          </span>
          <small id={`${id}-help`}>
            {kind === "signal" ? "0 = no evidence; 5 = repeated direct evidence" : "0 = low; 5 = severe"}
          </small>
        </label>
        <label htmlFor={evidenceId}>
          <span>Evidence for {label}</span>
          <textarea
            id={evidenceId}
            name={`make-money-with-codex-score-${key}-evidence`}
            autoComplete="off"
            rows={2}
            value={evidence[key]}
            onChange={(event) => setDraft((current) => ({
              ...current,
              evidence: { ...current.evidence, [key]: event.target.value },
            }))}
            placeholder={kind === "signal"
              ? "Observation, source, date, and what it does not prove"
              : "Failure mode, evidence, owner, and mitigation"}
          />
        </label>
      </div>
    );
  }

  return (
    <section className={styles.workbench} aria-labelledby="income-scorecard-title" data-testid="income-opportunity-scorecard">
      <header>
        <p className={styles.toolKicker}>Decision tool</p>
        <h2 id="income-scorecard-title">Opportunity scorecard</h2>
        <p>Evaluate one candidate at a time, then save or print the result before scoring the next. Scores organise assumptions; they do not prove demand.</p>
      </header>
      <p className={styles.draftNote} role={status === "unavailable" ? "status" : undefined}>
        {status === "unavailable"
          ? "Draft autosave is unavailable. Print or save this lesson before leaving."
          : "Draft autosaves in this tab session. It is never uploaded; clear it before sharing the device."}
      </p>
      <label className={styles.toolWideField} htmlFor="income-score-candidate">
        <span>Candidate name</span>
        <input
          id="income-score-candidate"
          name="make-money-with-codex-score-candidate"
          autoComplete="off"
          value={candidate}
          onChange={(event) => setDraft((current) => ({ ...current, candidate: event.target.value }))}
          placeholder="For example: fixed-scope accessibility audit"
        />
      </label>
      <div className={styles.scoreLayout}>
        <fieldset>
          <legend>Positive signals</legend>
          {positiveFields.map((item) => field(item, "signal"))}
        </fieldset>
        <fieldset>
          <legend>Risk deductions</legend>
          {riskFields.map((item) => field(item, "risk"))}
        </fieldset>
      </div>
      <div className={styles.toolResult}>
        <span>{candidate.trim() || "Unnamed candidate"} · priority score</span>
        <strong>{score} / 100</strong>
        <p>{interpretation}</p>
      </div>
      <p className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">
        Priority score {score} of 100. {interpretation}
      </p>
      <details className={styles.formulaNote}>
        <summary>Formula and evidence rule</summary>
        <p><code>score = clamp(0, 100, round((positive total / 35) × 100 - (risk total / 15) × 30))</code></p>
        <p>This is an author-created, non-validated prioritisation heuristic. A number without a dated observation is an assumption, and the formula must not be used as a forecast of sales, revenue, or profit.</p>
      </details>
      <div className={styles.toolActions}>
        <button className={styles.secondaryButton} type="button" onClick={() => window.print()}>Print or save this lesson and candidate</button>
        <button
          className={styles.secondaryButton}
          type="button"
          disabled={!candidate.trim() && Object.values(scores).every((value) => value === 0) && Object.values(evidence).every((value) => !value.trim())}
          onClick={() => {
            if (!window.confirm("Clear this candidate and its evidence? This cannot be undone.")) return;
            clear();
          }}
        >
          Clear for next candidate
        </button>
      </div>
    </section>
  );
}
