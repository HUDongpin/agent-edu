"use client";

import { useMemo, useState } from "react";
import type { McpLesson } from "@/lib/mcp";
import type { McpUiCopy } from "@/lib/mcp/copy";
import { formatMcpCopy } from "@/lib/mcp/format";
import type { McpInteractiveCopy } from "@/lib/mcp/types";
import styles from "./McpCourse.module.css";

const architectureCardIds = ["host", "client", "server", "model"] as const;

const envelopeMethods = {
  "server/discover": {
    params: {},
  },
  "tools/list": {
    params: { cursor: "opaque-cursor" },
  },
  "tools/call": {
    params: { name: "issues.add_label", arguments: { issueNumber: 42, label: "reviewed" } },
  },
  "resources/read": {
    params: { uri: "course://mcp/lesson/3" },
  },
} as const;

const riskCases = [
  {
    id: "annotation",
    level: "block",
  },
  {
    id: "resource",
    level: "block",
  },
  {
    id: "read",
    level: "review",
  },
  {
    id: "write",
    level: "confirm",
  },
] as const;

function ArchitectureLab({ interactive, ui }: { interactive: McpInteractiveCopy; ui: McpUiCopy }) {
  const [active, setActive] = useState<(typeof architectureCardIds)[number]>(architectureCardIds[0]);
  const card = interactive.architectureCards[active];
  return (
    <div className={styles.interactiveGrid}>
      <div className={styles.participantMap} aria-label={ui.labParticipantMapAria}>
        <div className={styles.hostBox}>
          <strong>{ui.labHost}</strong>
          <span>{ui.labHostSummary}</span>
          <div className={styles.clientRow}>
            <span>{ui.labClientA}</span><span>{ui.labClientB}</span>
          </div>
        </div>
        <div className={styles.connectionRow} aria-hidden="true"><span>stdio</span><span>Streamable HTTP</span></div>
        <div className={styles.serverRow}><span>{ui.labLocalServer}</span><span>{ui.labRemoteServer}</span></div>
      </div>
      <div>
        <div className={styles.segmented} role="group" aria-label={ui.labChooseParticipant}>
          {architectureCardIds.map((id) => (
            <button type="button" key={id} aria-pressed={active === id} onClick={() => setActive(id)}>
              {interactive.architectureCards[id].label}
            </button>
          ))}
        </div>
        <div className={styles.labResult} role="status">
          <strong>{formatMcpCopy(ui.labOwnsTemplate, { participant: card.label })}</strong>
          <p>{card.owns}</p>
          <strong>{ui.labMustNot}</strong>
          <p>{card.mustNot}</p>
        </div>
      </div>
    </div>
  );
}

function EnvelopeLab({ interactive, ui }: { interactive: McpInteractiveCopy; ui: McpUiCopy }) {
  const methods = Object.keys(envelopeMethods) as (keyof typeof envelopeMethods)[];
  const [method, setMethod] = useState<(typeof methods)[number]>(methods[0]);
  const entry = envelopeMethods[method];
  const envelope = useMemo(() => JSON.stringify({
    jsonrpc: "2.0",
    id: 7,
    method,
    params: {
      ...entry.params,
      _meta: {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientInfo": { name: "course-workbench", version: "1.0.0" },
        "io.modelcontextprotocol/clientCapabilities": { elicitation: { form: {}, url: {} } },
      },
    },
  }, null, 2), [entry, method]);
  return (
    <div className={styles.envelopeLab}>
      <label>
        {ui.labCurrentMethod}
        <select value={method} onChange={(event) => setMethod(event.target.value as (typeof methods)[number])}>
          {methods.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <p>{interactive.envelopePurposes[method]}</p>
      <p id="mcp-envelope-description" className={styles.microcopy}>{ui.labEnvelopeDescription}</p>
      <pre dir="ltr" tabIndex={0} aria-describedby="mcp-envelope-description"><code>{envelope}</code></pre>
      <ul className={styles.invariantList}>
        <li><strong>{ui.labRequiredLabel}</strong> {ui.labRequiredBody}</li>
        <li><strong>{ui.labRecommendedLabel}</strong> {ui.labRecommendedBody}</li>
        <li><strong>{ui.labCurrentResultLabel}</strong> {ui.labCurrentResultBody}</li>
      </ul>
    </div>
  );
}

function ToolContractLab({ ui }: { ui: McpUiCopy }) {
  const [name, setName] = useState("issues.add_label");
  const [write, setWrite] = useState(true);
  const [unknown, setUnknown] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const contract = useMemo(() => JSON.stringify({
    name: name.trim() || "tool.name_required",
    description: `${write ? "Change" : "Read"} one explicit target.${dryRun ? " Supports dry run." : ""}`,
    inputSchema: {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      type: "object",
      properties: {
        target: { type: "string", minLength: 1 },
        ...(dryRun ? { dryRun: { type: "boolean", default: true } } : {}),
      },
      required: ["target"],
      additionalProperties: unknown,
    },
    annotations: {
      readOnlyHint: !write,
      destructiveHint: write,
      idempotentHint: false,
      openWorldHint: true,
    },
  }, null, 2), [dryRun, name, unknown, write]);
  const score = [name.includes("."), !unknown, !write || dryRun].filter(Boolean).length;
  return (
    <div className={styles.toolBuilder}>
      <div className={styles.builderControls}>
        <label>{ui.labToolName}<input name="mcp-tool-name" autoComplete="off" spellCheck={false} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className={styles.checkRow}><input type="checkbox" checked={write} onChange={(event) => setWrite(event.target.checked)} /> {ui.labHasSideEffect}</label>
        <label className={styles.checkRow}><input type="checkbox" checked={dryRun} onChange={(event) => setDryRun(event.target.checked)} /> {ui.labSupportsDryRun}</label>
        <label className={styles.checkRow}><input type="checkbox" checked={unknown} onChange={(event) => setUnknown(event.target.checked)} /> {ui.labAcceptUnknown}</label>
        <div className={styles.contractScore} data-score={score} role="status" aria-live="polite"><strong>{score}/3</strong><span>{ui.labGuardrails}</span></div>
      </div>
      <pre dir="ltr" tabIndex={0} aria-label={ui.labGeneratedJsonAria}><code>{contract}</code></pre>
      <p className={styles.microcopy}>{ui.labAnnotationsNote}</p>
    </div>
  );
}

function RiskReviewLab({ interactive, ui }: { interactive: McpInteractiveCopy; ui: McpUiCopy }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const levelLabels = {
    allow: ui.labRiskAllow,
    review: ui.labRiskReview,
    confirm: ui.labRiskConfirm,
    block: ui.labRiskBlock,
  } as const;
  return (
    <div className={styles.riskGrid}>
      {riskCases.map((item) => {
        const answer = answers[item.id];
        const localized = interactive.riskCases[item.id];
        return (
          <article key={item.id}>
            <p>{localized.title}</p>
            <div className={styles.riskActions} role="group" aria-label={formatMcpCopy(ui.labRiskChoiceAriaTemplate, { case: localized.title })}>
              {(["allow", "review", "confirm", "block"] as const).map((level) => (
                <button
                  type="button"
                  key={level}
                  aria-label={formatMcpCopy(ui.labRiskButtonAriaTemplate, { level: levelLabels[level], case: localized.title })}
                  aria-pressed={answer === level}
                  onClick={() => setAnswers((current) => ({ ...current, [item.id]: level }))}
                >
                  {levelLabels[level]}
                </button>
              ))}
            </div>
            {answer ? (
              <div className={answer === item.level ? styles.feedbackCorrect : styles.feedbackWrong} role="status">
                <strong>{answer === item.level ? ui.labDefensible : formatMcpCopy(ui.labBestAnswerTemplate, { level: levelLabels[item.level] })}</strong> {localized.answer}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

export default function InteractiveLab({
  kind,
  interactive,
  ui,
}: {
  kind: NonNullable<McpLesson["interactive"]>;
  interactive: McpInteractiveCopy;
  ui: McpUiCopy;
}) {
  const title = {
    architecture: ui.labArchitectureTitle,
    envelope: ui.labEnvelopeTitle,
    "tool-contract": ui.labToolTitle,
    "risk-review": ui.labRiskTitle,
  }[kind];
  return (
    <section className={styles.interactiveLab} aria-labelledby={`mcp-${kind}-lab-title`}>
      <header>
        <p className={styles.eyebrow}>{ui.labEyebrow}</p>
        <h2 id={`mcp-${kind}-lab-title`}>{title}</h2>
        <p>{ui.labBody}</p>
      </header>
      {kind === "architecture" ? <ArchitectureLab interactive={interactive} ui={ui} /> : null}
      {kind === "envelope" ? <EnvelopeLab interactive={interactive} ui={ui} /> : null}
      {kind === "tool-contract" ? <ToolContractLab ui={ui} /> : null}
      {kind === "risk-review" ? <RiskReviewLab interactive={interactive} ui={ui} /> : null}
    </section>
  );
}
