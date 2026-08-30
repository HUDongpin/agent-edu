"use client";

import { useMemo } from "react";
import {
  calculateCodexIncomeMargin,
  type CodexIncomeMarginInputs,
} from "@/lib/make-money-with-codex/economics";
import useSessionDraft from "./useSessionDraft";
import styles from "./IncomeCourse.module.css";

const defaults: CodexIncomeMarginInputs = {
  currency: "USD",
  observedOn: "2026-08-23",
  takeHome: 60000,
  annualHours: 1840,
  utilisation: 55,
  overhead: 20,
  reserve: 20,
  projectHours: 40,
  directCosts: 250,
  riskBuffer: 20,
  quote: 6500,
};

const numericFields = [
  ["takeHome", "Desired annual take-home", "Compensation target before applying this planning model"],
  ["annualHours", "Annual working hours", "Total realistic working capacity"],
  ["utilisation", "Billable utilisation (%)", "Share of working hours that can be billed"],
  ["overhead", "Overhead allocation (%)", "General business costs represented as a percentage of revenue"],
  ["reserve", "Tax and contingency reserve (%)", "Planning reserve only; use qualified local advice"],
  ["projectHours", "Expected project hours", "Discovery, delivery, review, revisions, handoff, and support"],
  ["directCosts", "Fixed direct project costs", "Tools, hosting, payment fees, contractors, or licences"],
  ["riskBuffer", "Project risk buffer (%)", "Applied after labour allocation and fixed direct costs"],
  ["quote", "Proposed collected price", "Use expected cash collected, not headline contract value"],
] as const;

const percentageKeys = new Set<string>(["utilisation", "overhead", "reserve", "riskBuffer"]);

function parseMarginDraft(value: unknown): CodexIncomeMarginInputs | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const restored = { ...defaults };
  if (typeof record.currency === "string") restored.currency = record.currency;
  if (typeof record.observedOn === "string") restored.observedOn = record.observedOn;
  for (const [key] of numericFields) {
    const candidate = record[key];
    if (typeof candidate === "number" && Number.isFinite(candidate)) restored[key] = candidate;
  }
  return restored;
}

export default function MarginCalculator({ locale = "en" }: { locale?: string }) {
  const { value: inputs, setValue: setInputs, clear, status } = useSessionDraft({
    storageKey: "aicourse.course11.margin.v1",
    initialValue: defaults,
    parse: parseMarginDraft,
  });
  const analysis = useMemo(() => calculateCodexIncomeMargin(inputs), [inputs]);
  const changed = numericFields.some(([key]) => inputs[key] !== defaults[key])
    || inputs.currency !== defaults.currency
    || inputs.observedOn !== defaults.observedOn;

  const formatter = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency: inputs.currency || "USD", maximumFractionDigits: 0 });
    } catch {
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    }
  }, [inputs.currency, locale]);

  return (
    <section className={styles.workbench} aria-labelledby="income-margin-title" data-testid="income-margin-calculator">
      <header>
        <p className={styles.toolKicker}>Economics tool</p>
        <h2 id="income-margin-title">Price-floor and downside calculator</h2>
        <p>The pre-filled values are a fictional worked example. Replace them with dated local inputs. This educational model is not financial, tax, accounting, or legal advice.</p>
      </header>
      <p className={styles.draftNote} role={status === "unavailable" ? "status" : undefined}>
        {status === "unavailable"
          ? "Scenario autosave is unavailable. Print or record the result before leaving."
          : "Scenario inputs autosave in this tab session. They are never uploaded; reset them before sharing the device."}
      </p>
      <div className={styles.calculatorGrid}>
        <label htmlFor="income-currency">
          <span>ISO currency code</span>
          <input
            id="income-currency"
            name="make-money-with-codex-margin-currency"
            autoComplete="off"
            value={inputs.currency}
            maxLength={3}
            inputMode="text"
            onChange={(event) => setInputs((current) => ({ ...current, currency: event.target.value.toUpperCase() }))}
          />
          <small>For display only, for example USD, TWD, EUR, or GBP</small>
        </label>
        <label htmlFor="income-cost-date">
          <span>Costs observed on</span>
          <input
            id="income-cost-date"
            name="make-money-with-codex-margin-observed-on"
            autoComplete="off"
            type="date"
            value={inputs.observedOn}
            onChange={(event) => setInputs((current) => ({ ...current, observedOn: event.target.value }))}
          />
          <small>Recheck tool, hosting, payment, and labour costs before each quote</small>
        </label>
        {numericFields.map(([key, label, help]) => (
          <label htmlFor={`income-margin-${key}`} key={key}>
            <span>{label}</span>
            <input
              id={`income-margin-${key}`}
              name={`make-money-with-codex-margin-${key}`}
              autoComplete="off"
              type="number"
              min="0"
              max={percentageKeys.has(key) ? "100" : key === "annualHours" ? "8784" : undefined}
              step={percentageKeys.has(key) ? "1" : "50"}
              value={inputs[key]}
              onChange={(event) => setInputs((current) => ({ ...current, [key]: Number(event.target.value) }))}
            />
            <small>{help}</small>
          </label>
        ))}
      </div>
      {analysis.result ? (
        <div className={styles.marginResults}>
          <p className={styles.resultDate}>Scenario uses costs recorded <time dateTime={inputs.observedOn}>{inputs.observedOn}</time>.</p>
          <div><span>Annual revenue requirement</span><strong>{formatter.format(analysis.result.annualRevenueRequirement)}</strong></div>
          <div><span>Sustainable hourly floor</span><strong>{formatter.format(analysis.result.hourlyFloor)}</strong></div>
          <div><span>Base project floor</span><strong>{formatter.format(analysis.result.projectFloor)}</strong></div>
          <div><span>Downside project floor</span><strong>{formatter.format(analysis.result.downsideFloor)}</strong></div>
          <div data-negative={analysis.result.cushion < 0 || undefined}>
            <span>Quote cushion above base floor</span>
            <strong>{formatter.format(analysis.result.cushion)}</strong>
          </div>
        </div>
      ) : (
        <div className={styles.toolError} role="alert">
          <strong>Correct these inputs:</strong>
          <ul>{analysis.errors.map((error) => <li key={error}>{error}</li>)}</ul>
        </div>
      )}
      {analysis.result ? (
        <p className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">
          Scenario recalculated. Base project floor {formatter.format(analysis.result.projectFloor)}.
          Quote cushion {formatter.format(analysis.result.cushion)}.
        </p>
      ) : null}
      <details className={styles.formulaNote}>
        <summary>Formula and assumptions</summary>
        <p><code>annual revenue requirement = take-home / (1 - overhead rate - reserve rate)</code></p>
        <p><code>hourly floor = annual revenue requirement / (annual hours × billable utilisation)</code></p>
        <p><code>grossed-up direct costs = fixed direct costs / (1 - overhead rate - reserve rate)</code></p>
        <p><code>project floor = (hourly floor × project hours + grossed-up direct costs) × (1 + risk buffer)</code></p>
        <p>Overhead and reserve are portions of collected revenue, so fixed direct costs are grossed up before the risk buffer. The downside model increases project hours by 50%, fixed direct costs by 25%, and uses at least a 25% risk buffer. It is scenario maths, not a prediction.</p>
      </details>
      <button
        className={styles.secondaryButton}
        type="button"
        disabled={!changed}
        onClick={() => {
          if (!window.confirm("Reset every scenario input to the fictional example?")) return;
          clear();
        }}
      >
        Reset example
      </button>
    </section>
  );
}
