"use client";

import { useState } from "react";
import {
  agentOrchestrationModuleRequirements,
  agentOrchestrationModuleProgressKey,
  isAgentOrchestrationModuleComplete,
  readAgentOrchestrationCheckpointReceipt,
  saveAgentOrchestrationCheckpointReceipt,
} from "@/lib/agent-orchestration/progress";
import type {
  AgentOrchestrationCheckpointCopy,
  AgentOrchestrationModuleSlug,
} from "@/lib/agent-orchestration/types";
import { updateAgentOrchestrationProgress } from "./progress-store";
import {
  isChinese,
  label,
  persistenceText,
  serializedRecord,
  storageStatusText,
  type Labels,
} from "./interaction-helpers";
import { useAgentOrchestrationProgress } from "./useAgentOrchestrationProgress";
import styles from "./AgentOrchestrationCourse.module.css";

export function ModuleCheckpoint({
  slug,
  checkpoint,
  labels,
}: {
  slug: AgentOrchestrationModuleSlug;
  checkpoint: AgentOrchestrationCheckpointCopy;
  labels: Labels;
}) {
  const snapshot = useAgentOrchestrationProgress();
  const progress = snapshot.record;
  const storedReceipt = readAgentOrchestrationCheckpointReceipt(
    progress,
    slug,
    checkpoint,
  );
  const storedReceiptSignature = serializedRecord(storedReceipt);
  if (snapshot.status !== "available") {
    return (
      <section
        className={styles.checkpoint}
        aria-busy={snapshot.status === "checking"}
        aria-labelledby={`${slug}-checkpoint-title`}
        data-testid="agent-orchestration-checkpoint"
      >
        <p className={styles.sectionLabel}>{label(labels, "checkpoint", "Checkpoint")}</p>
        <h2 id={`${slug}-checkpoint-title`}>{checkpoint.question}</h2>
        <fieldset disabled>
          <legend className="sr-only">{checkpoint.question}</legend>
          {checkpoint.options.map((option, index) => (
            <label key={option.id}>
              <input
                type="radio"
                name={`${slug}-checkpoint`}
                value={option.id}
                disabled
              />
              <span>{String.fromCharCode(65 + index)}</span>
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>
        <button type="button" disabled>
          {label(labels, "checkAnswer", "Check answer")}
        </button>
        <p role={snapshot.status === "checking" ? "status" : "alert"}>
          {storageStatusText(labels, snapshot.status)}
        </p>
      </section>
    );
  }
  return (
    <RestoredModuleCheckpoint
      key={`${checkpoint.checkpointId}:${storedReceiptSignature}`}
      slug={slug}
      checkpoint={checkpoint}
      labels={labels}
      initialChoice={storedReceipt?.selectedOptionId ?? null}
      initiallyChecked={Boolean(storedReceipt)}
    />
  );
}

function RestoredModuleCheckpoint({
  slug,
  checkpoint,
  labels,
  initialChoice,
  initiallyChecked,
}: {
  slug: AgentOrchestrationModuleSlug;
  checkpoint: AgentOrchestrationCheckpointCopy;
  labels: Labels;
  initialChoice: string | null;
  initiallyChecked: boolean;
}) {
  const [choice, setChoice] = useState<string | null>(initialChoice);
  const [checked, setChecked] = useState(initiallyChecked);
  const [saveResult, setSaveResult] = useState<boolean | null>(null);
  const correct = choice === checkpoint.correctOptionId;

  return (
    <section
      className={styles.checkpoint}
      aria-busy="false"
      aria-labelledby={`${slug}-checkpoint-title`}
      data-testid="agent-orchestration-checkpoint"
    >
      <p className={styles.sectionLabel}>{label(labels, "checkpoint", "Checkpoint")}</p>
      <h2 id={`${slug}-checkpoint-title`}>{checkpoint.question}</h2>
      <fieldset>
        <legend className="sr-only">{checkpoint.question}</legend>
        {checkpoint.options.map((option, index) => (
          <label key={option.id} data-selected={choice === option.id || undefined}>
            <input
              type="radio"
              name={`${slug}-checkpoint`}
              value={option.id}
              checked={choice === option.id}
              onChange={() => {
                setChoice(option.id);
                setChecked(false);
                setSaveResult(null);
              }}
            />
            <span>{String.fromCharCode(65 + index)}</span>
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        disabled={choice === null}
        onClick={() => {
          if (choice === null) return;
          setChecked(true);
          const persisted = updateAgentOrchestrationProgress((record) => {
            saveAgentOrchestrationCheckpointReceipt(
              record,
              slug,
              checkpoint,
              choice,
            );
          });
          setSaveResult(persisted);
        }}
      >
        {label(labels, "checkAnswer", "Check answer")}
      </button>
      {checked ? (
        <div className={correct ? styles.feedbackPass : styles.feedbackRetry} role="status">
          <strong>
            {correct
              ? label(labels, "correct", "Correct")
              : label(labels, "tryAgain", "Reconsider the boundary")}
          </strong>
          <p>{checkpoint.explanation}</p>
          <small className={styles.persistenceStatus}>
            {persistenceText(labels, saveResult)}
          </small>
        </div>
      ) : null}
    </section>
  );
}

export function ModuleCompletion({
  slug,
  checkpoint,
  labels,
}: {
  slug: AgentOrchestrationModuleSlug;
  checkpoint: AgentOrchestrationCheckpointCopy;
  labels: Labels;
}) {
  const snapshot = useAgentOrchestrationProgress();
  const record = snapshot.record;
  const key = agentOrchestrationModuleProgressKey(slug);
  const requirements = agentOrchestrationModuleRequirements(record, slug, checkpoint);
  const complete = isAgentOrchestrationModuleComplete(record, slug, checkpoint);
  const [saveResult, setSaveResult] = useState<boolean | null>(null);
  const missing = [
    !requirements.artifact
      ? label(labels, "savedArtifactRequired", isChinese(labels) ? "保存经过实质编辑的产物" : "save a meaningfully edited artifact")
      : null,
    !requirements.lab
      ? label(labels, "savedLabRequired", isChinese(labels) ? "保存本模块实验状态" : "save this module's lab state")
      : null,
    !requirements.checkpoint
      ? label(labels, "correctCheckpointRequired", isChinese(labels) ? "正确回答检查点" : "answer the checkpoint correctly")
      : null,
  ].filter((item): item is string => Boolean(item));
  return (
    <section
      className={styles.completion}
      aria-busy={snapshot.status === "checking"}
      aria-labelledby={`${slug}-completion-title`}
      data-testid="agent-orchestration-module-completion"
    >
      <div>
        <span id={`${slug}-completion-title`}>{label(labels, "completion", "Module status")}</span>
        <strong>{complete ? label(labels, "complete", "Complete") : label(labels, "inProgress", "In progress")}</strong>
        <small role="status" aria-live="polite">
          {snapshot.status !== "available"
            ? storageStatusText(labels, snapshot.status)
            : missing.length
            ? `${label(labels, "completionNeeds", isChinese(labels) ? "完成前还需：" : "Before completion: ")} ${missing.join(isChinese(labels) ? "、" : ", ")}`
            : persistenceText(labels, saveResult)}
        </small>
      </div>
      <button
        type="button"
        aria-pressed={complete}
        disabled={snapshot.status !== "available" || !requirements.ready}
        onClick={() => {
          const persisted = updateAgentOrchestrationProgress((progress) => {
            progress[key] = !complete;
          });
          setSaveResult(persisted);
        }}
      >
        {complete
          ? label(labels, "markIncomplete", "Mark incomplete")
          : label(labels, "markComplete", "Mark module complete")}
      </button>
    </section>
  );
}
