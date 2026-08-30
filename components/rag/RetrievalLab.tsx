"use client";

import { useEffect, useMemo, useState } from "react";
import type { RagCourseCopy } from "@/lib/rag";
import base from "../prompts/PromptCourse.module.css";
import styles from "./RagCourse.module.css";
import useRagHydrated from "./useRagHydrated";

type Strategy = "dense" | "keyword" | "hybrid";
type ScenarioId = RagCourseCopy["lab"]["scenarios"][number]["id"];
type CandidateId = "C1" | "C2" | "C3" | "C4";

const SCORE_MATRIX: Readonly<Record<ScenarioId, {
  readonly dense: readonly [number, number, number, number];
  readonly keyword: readonly [number, number, number, number];
  readonly hybrid: readonly [number, number, number, number];
  readonly rerank: readonly [number, number, number, number];
}>> = {
  paraphrase: {
    dense: [0.91, 0.63, 0.70, 0.58],
    keyword: [0.35, 0.40, 0.22, 0.18],
    hybrid: [0.84, 0.57, 0.52, 0.38],
    rerank: [0.05, -0.01, 0.01, -0.03],
  },
  identifier: {
    dense: [0.52, 0.76, 0.31, 0.44],
    keyword: [1.00, 0.62, 0.10, 0.24],
    hybrid: [0.92, 0.71, 0.28, 0.33],
    rerank: [0.06, -0.05, -0.02, 0.01],
  },
  conflict: {
    dense: [0.88, 0.85, 0.20, 0.58],
    keyword: [0.73, 0.72, 0.15, 0.33],
    hybrid: [0.87, 0.84, 0.18, 0.50],
    rerank: [0.09, -0.08, -0.02, -0.01],
  },
};

const URL_KEYS = {
  scenario: "ragScenario",
  strategy: "ragStrategy",
  topK: "ragTopK",
  threshold: "ragThreshold",
  rerank: "ragRerank",
} as const;

function parseRangeValue(value: string | null, minimum: number, maximum: number, step: number): number | null {
  if (value === null || !value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) return null;
  const steps = (parsed - minimum) / step;
  return Math.abs(steps - Math.round(steps)) < 1e-8 ? parsed : null;
}

export default function RetrievalLab({ copy, locale }: { copy: RagCourseCopy["lab"]; locale: string }) {
  const hydrated = useRagHydrated();
  const [scenarioId, setScenarioId] = useState<ScenarioId>("paraphrase");
  const [strategy, setStrategy] = useState<Strategy>("hybrid");
  const [topK, setTopK] = useState(3);
  const [threshold, setThreshold] = useState(0.35);
  const [rerank, setRerank] = useState(true);
  const [urlReady, setUrlReady] = useState(false);
  const scenario = copy.scenarios.find((item) => item.id === scenarioId) ?? copy.scenarios[0];
  const decimal = useMemo(() => new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }), [locale]);
  const integer = useMemo(() => new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }), [locale]);

  useEffect(() => {
    if (!hydrated || urlReady) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      const params = new URLSearchParams(window.location.search);
      const scenarioValue = params.get(URL_KEYS.scenario);
      const strategyValue = params.get(URL_KEYS.strategy);
      const topKValue = parseRangeValue(params.get(URL_KEYS.topK), 1, 4, 1);
      const thresholdValue = parseRangeValue(params.get(URL_KEYS.threshold), 0, 0.95, 0.05);
      const rerankValue = params.get(URL_KEYS.rerank);
      if (copy.scenarios.some((item) => item.id === scenarioValue)) setScenarioId(scenarioValue as ScenarioId);
      if (["dense", "keyword", "hybrid"].includes(strategyValue || "")) setStrategy(strategyValue as Strategy);
      if (topKValue !== null) setTopK(topKValue);
      if (thresholdValue !== null) setThreshold(thresholdValue);
      if (rerankValue === "0" || rerankValue === "1") setRerank(rerankValue === "1");
      setUrlReady(true);
    });
    return () => { cancelled = true; };
  }, [copy.scenarios, hydrated, urlReady]);

  useEffect(() => {
    if (!hydrated || !urlReady) return;
    const url = new URL(window.location.href);
    url.searchParams.set(URL_KEYS.scenario, scenarioId);
    url.searchParams.set(URL_KEYS.strategy, strategy);
    url.searchParams.set(URL_KEYS.topK, String(topK));
    url.searchParams.set(URL_KEYS.threshold, threshold.toFixed(2));
    url.searchParams.set(URL_KEYS.rerank, rerank ? "1" : "0");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, [hydrated, rerank, scenarioId, strategy, threshold, topK, urlReady]);

  const candidates = useMemo(() => {
    const scores = SCORE_MATRIX[scenarioId];
    return scenario.candidates
      .map((text, index) => {
        const raw = scores[strategy][index];
        const adjusted = Math.max(0, Math.min(1, raw + (rerank ? scores.rerank[index] : 0)));
        return { id: `C${index + 1}` as CandidateId, index, text, raw, score: adjusted };
      })
      .sort((left, right) => right.score - left.score)
      .map((candidate, rank) => ({
        ...candidate,
        rank: rank + 1,
        included: rank < topK && candidate.score >= threshold,
      }));
  }, [rerank, scenario.candidates, scenarioId, strategy, threshold, topK]);

  const selected = candidates.filter((candidate) => candidate.included);
  const targetIncluded = selected.some((candidate) => candidate.index === 0);
  const answerParts = targetIncluded
    ? [
        scenario.answer,
        ...selected
          .map((candidate) => scenario.supplements[candidate.id])
          .filter((part): part is string => Boolean(part)),
      ]
    : [];
  const citedCandidates = targetIncluded
    ? selected.filter((candidate) => candidate.index === 0 || Boolean(scenario.supplements[candidate.id]))
    : [];
  const answer = selected.length === 0
    ? copy.noContext
    : targetIncluded
      ? answerParts.join(" ")
      : copy.unsupportedContext;

  return (
    <section
      className={`${base.promptStudio} ${styles.retrievalLab}`}
      aria-labelledby="rag-lab-title"
      aria-busy={!hydrated}
      data-rag-hydrated={hydrated ? "true" : "false"}
      data-rag-url-ready={urlReady ? "true" : "false"}
    >
      <header>
        <div>
          <p className={base.kicker}>{copy.kicker}</p>
          <h2 id="rag-lab-title">{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
        <span className={styles.labBadge}>{copy.disclosure}</span>
      </header>

      <div className={styles.labControls}>
        <label>
          <span>{copy.scenarioLabel}</span>
          <select
            name="rag-scenario"
            autoComplete="off"
            value={scenarioId}
            disabled={!hydrated}
            onChange={(event) => setScenarioId(event.target.value as ScenarioId)}
          >
            {copy.scenarios.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </label>
        <fieldset>
          <legend>{copy.strategyLabel}</legend>
          {(["dense", "keyword", "hybrid"] as const).map((value) => (
            <label key={value}>
              <input
                type="radio"
                name="rag-strategy"
                value={value}
                checked={strategy === value}
                disabled={!hydrated}
                onChange={() => setStrategy(value)}
              />
              <span>{copy[value]}</span>
            </label>
          ))}
        </fieldset>
        <label>
          <span>{copy.topKLabel}: <strong aria-hidden="true">{topK}</strong></span>
          <input aria-label={copy.topKLabel} name="rag-top-k" autoComplete="off" type="range" min="1" max="4" step="1" value={topK} disabled={!hydrated} onChange={(event) => setTopK(Number(event.target.value))} />
        </label>
        <label>
          <span>{copy.thresholdLabel}: <strong aria-hidden="true">{decimal.format(threshold)}</strong></span>
          <input aria-label={copy.thresholdLabel} name="rag-score-threshold" autoComplete="off" type="range" min="0" max="0.95" step="0.05" value={threshold} disabled={!hydrated} onChange={(event) => setThreshold(Number(event.target.value))} />
        </label>
        <label className={styles.toggleLabel}>
          <span>{copy.rerankLabel}</span>
          <input name="rag-rerank" autoComplete="off" type="checkbox" checked={rerank} disabled={!hydrated} onChange={(event) => setRerank(event.target.checked)} />
          <strong>{rerank ? copy.rerankOn : copy.rerankOff}</strong>
        </label>
      </div>

      <div className={styles.queryStrip}>
        <span>Q</span>
        <strong>{scenario.query}</strong>
      </div>

      <ol className={styles.candidateList}>
        {candidates.map((candidate) => (
          <li className={candidate.included ? styles.candidateIncluded : styles.candidateExcluded} key={candidate.id}>
            <div className={styles.candidateMeta}>
              <span dir="ltr" translate="no">#{candidate.rank}</span>
              <strong dir="ltr" translate="no">{candidate.id}</strong>
              <small>{copy.sourceScore}: {decimal.format(candidate.score)}</small>
              <em>{candidate.included ? copy.included : copy.excluded}</em>
            </div>
            <p>{candidate.text}</p>
            <div className={styles.scoreTrack} aria-hidden="true"><span style={{ inlineSize: `${candidate.score * 100}%` }} /></div>
          </li>
        ))}
      </ol>

      <div className={styles.labOutput}>
        <div>
          <span>{copy.selectedContext}</span>
          <strong>{integer.format(selected.length)} / {integer.format(candidates.length)}</strong>
          <small dir="ltr" translate="no">{selected.map((candidate) => candidate.id).join(", ") || "∅"}</small>
        </div>
        <div>
          <span>{copy.answerPreview}</span>
          <p>{answer}</p>
          {citedCandidates.length > 0 ? (
            <small>{citedCandidates.map((candidate) => `[${candidate.id}]`).join(" ")}</small>
          ) : null}
        </div>
      </div>
      <p className={base.srOnly} role="status" aria-live="polite">
        {copy.selectedContext}: {integer.format(selected.length)} / {integer.format(candidates.length)}. {answer}
        {citedCandidates.length > 0
          ? ` ${citedCandidates.map((candidate) => `[${candidate.id}]`).join(" ")}`
          : ""}
      </p>
    </section>
  );
}
