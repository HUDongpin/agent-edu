"use client";

import { useMemo, useState } from "react";
import {
  EMPTY_OFFER_SESSION_DRAFT,
  OFFER_SESSION_DRAFT_FIELD_MAX_LENGTH,
  parseOfferSessionDraft,
} from "@/lib/make-money-with-codex/session-draft-schemas";
import { MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY } from "@/lib/make-money-session-draft-contract";
import CopyPrompt from "./CopyPrompt";
import useSessionDraft from "./useSessionDraft";
import styles from "./IncomeCourse.module.css";

const fields = [
  ["buyer", "Named buyer", "Who can approve and pay?"],
  ["problem", "Costly job", "What repeated event or bottleneck is observed?"],
  ["outcome", "Accepted outcome", "What will be observably different?"],
  ["inputs", "Authorised inputs", "Which files, systems, and people are approved?"],
  ["scope", "Included deliverables", "What exact artefacts and core flow are included?"],
  ["nonGoals", "Non-goals", "What is explicitly excluded?"],
  ["acceptance", "Acceptance and verification", "How can a reviewer decide pass or fail?"],
  ["handoff", "Evidence and handoff", "What proof, runbook, and support boundary are delivered?"],
  ["stop", "Stop conditions", "When must Codex stop and ask for authority or data?"],
] as const;

export default function OfferBuilder() {
  const { value: values, setValue: setValues, clear, status } = useSessionDraft({
    storageKey: MAKE_MONEY_WITH_CODEX_OFFER_DRAFT_KEY,
    initialValue: EMPTY_OFFER_SESSION_DRAFT,
    parse: parseOfferSessionDraft,
  });
  const [copyResetKey, setCopyResetKey] = useState(0);
  const taskContract = useMemo(() => [
    `BUYER: ${values.buyer || "[Named buyer]"}`,
    `COSTLY JOB: ${values.problem || "[Observed problem]"}`,
    `OUTCOME: ${values.outcome || "[Observable customer outcome]"}`,
    `AUTHORISED INPUTS: ${values.inputs || "[Approved files, systems, and people]"}`,
    `INCLUDED SCOPE: ${values.scope || "[Deliverables and core flow]"}`,
    `NON-GOALS: ${values.nonGoals || "[Explicit exclusions]"}`,
    `ACCEPTANCE + VERIFICATION: ${values.acceptance || "[Binary criteria and commands]"}`,
    `EVIDENCE + HANDOFF: ${values.handoff || "[Proof, runbook, and support boundary]"}`,
    `STOP CONDITIONS: ${values.stop || "[Missing authority, data, or safety condition]"}`,
  ].join("\n"), [values]);

  return (
    <section className={styles.workbench} aria-labelledby="income-offer-builder-title" data-testid="income-offer-builder">
      <header>
        <p className={styles.toolKicker}>Scope tool</p>
        <h2 id="income-offer-builder-title">Commercial task-contract builder</h2>
        <p>Draft the buyer-facing outcome and the execution boundary in one place. This is an educational scope aid, not a legal contract.</p>
      </header>
      <p className={styles.toolWarning}><strong>Use synthetic or authorised content only.</strong> Do not paste credentials, personal data, private client records, proprietary source code, or contract terms you are not authorised to process.</p>
      <p className={styles.draftNote} role={status === "unavailable" ? "status" : undefined}>
        {status === "unavailable"
          ? "Draft autosave is unavailable. Copy the contract before leaving this lesson."
          : "Draft autosaves in this tab session. It is never uploaded; clear it before sharing the device."}
      </p>
      <div className={styles.offerFields}>
        {fields.map(([key, label, help]) => (
          <label htmlFor={`income-offer-${key}`} key={key}>
            <span>{label}</span>
            <textarea
              id={`income-offer-${key}`}
              name={`make-money-with-codex-offer-${key}`}
              autoComplete="off"
              rows={3}
              maxLength={OFFER_SESSION_DRAFT_FIELD_MAX_LENGTH}
              value={values[key]}
              placeholder={help}
              onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
            />
          </label>
        ))}
      </div>
      <h3>Codex-ready contract</h3>
      <CopyPrompt key={copyResetKey} prompt={taskContract} />
      <button
        className={styles.secondaryButton}
        type="button"
        disabled={Object.values(values).every((value) => !value.trim())}
        onClick={() => {
          if (!window.confirm("Clear every field in this builder? This cannot be undone.")) return;
          clear();
          setCopyResetKey((current) => current + 1);
        }}
      >
        Clear builder
      </button>
    </section>
  );
}
