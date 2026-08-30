"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { GrokCourseCopy } from "@/lib/grok/types";
import { GROK_TASK_CONTRACT_DRAFT_KEY } from "@/lib/progress-storage-contract";
import CopyPrompt from "./CopyPrompt";
import {
  clearGrokTaskContract,
  grokTaskContractPersistenceAvailable,
  readGrokTaskContractSnapshot,
  subscribeToGrokTaskContract,
  writeGrokTaskContract,
} from "./task-contract-draft-store";
import { useGrokHydrated } from "./useGrokProgress";
import styles from "./GrokCourse.module.css";

export { GROK_TASK_CONTRACT_DRAFT_KEY };
const TASK_CONTRACT_SCHEMA_VERSION = 1;

const FIELD_KEYS = [
  "fieldGoal",
  "fieldContext",
  "fieldEvidence",
  "fieldConstraints",
  "fieldOutput",
  "fieldAcceptance",
] as const;

const EMPTY_VALUES = FIELD_KEYS.map(() => "");
const TASK_CONTRACT_SIGNATURE = [
  `grok-task-contract:${TASK_CONTRACT_SCHEMA_VERSION}`,
  ...FIELD_KEYS,
].join("|");

type TaskContractDraft = {
  readonly schemaVersion: 1;
  readonly signature: string;
  readonly values: readonly string[];
};

function parseTaskContractDraft(raw: string): readonly string[] | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const draft = value as Partial<TaskContractDraft>;
    if (draft.schemaVersion !== TASK_CONTRACT_SCHEMA_VERSION
      || draft.signature !== TASK_CONTRACT_SIGNATURE
      || !Array.isArray(draft.values)
      || draft.values.length !== FIELD_KEYS.length
      || !draft.values.every((item) => typeof item === "string")) {
      return null;
    }
    return draft.values;
  } catch {
    return null;
  }
}

export default function TaskContractBuilder({
  labels,
}: {
  labels: GrokCourseCopy["ui"];
}) {
  const [localValues, setLocalValues] = useState<readonly string[] | null>(null);
  const [draftWriteFailed, setDraftWriteFailed] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const [undoValues, setUndoValues] = useState<readonly string[] | null>(null);
  const hydrated = useGrokHydrated();
  const storedDraftRaw = useSyncExternalStore(
    subscribeToGrokTaskContract,
    readGrokTaskContractSnapshot,
    () => null,
  );
  const draftStorageAvailable = useSyncExternalStore(
    subscribeToGrokTaskContract,
    grokTaskContractPersistenceAvailable,
    () => true,
  );
  const draftPersistenceFailed = draftWriteFailed || !draftStorageAvailable;
  const restoredValues = useMemo(() => (
    storedDraftRaw ? parseTaskContractDraft(storedDraftRaw) : null
  ), [storedDraftRaw]);
  const values = localValues ?? restoredValues ?? EMPTY_VALUES;
  const hasDraft = values.some((value) => value.trim().length > 0);
  const prompt = useMemo(() => FIELD_KEYS.map((labelKey, index) => (
    `${labels[labelKey].toUpperCase()}: ${values[index] || `[${labels[labelKey]}]`}`
  )).join("\n"), [labels, values]);

  const visibleDraftStatus = draftPersistenceFailed
    ? labels.taskDraftSaveFailed
    : draftStatus || (localValues === null && restoredValues ? labels.taskDraftRestored : "");

  function persistDraft(nextValues: readonly string[]): boolean {
    if (!nextValues.some((value) => value.trim().length > 0)) {
      const result = clearGrokTaskContract();
      setDraftWriteFailed(!result.persisted);
      setDraftStatus(result.persisted ? "" : labels.taskDraftSaveFailed);
      return result.persisted;
    }
    const draft: TaskContractDraft = {
      schemaVersion: 1,
      signature: TASK_CONTRACT_SIGNATURE,
      values: nextValues,
    };
    const result = writeGrokTaskContract(JSON.stringify(draft));
    setDraftWriteFailed(!result.persisted);
    if (result.persisted) {
      setDraftStatus(labels.taskDraftSaved);
      return true;
    }
    setDraftStatus(labels.taskDraftSaveFailed);
    return false;
  }

  function removeDraft(): boolean {
    const result = clearGrokTaskContract();
    setDraftWriteFailed(!result.persisted);
    if (!result.persisted) setDraftStatus(labels.taskDraftSaveFailed);
    return result.persisted;
  }

  return (
    <section
      className={styles.contractBuilder}
      aria-labelledby="grok-contract-builder-title"
      data-testid="grok-task-contract-builder"
    >
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
                onChange={(event) => {
                  setUndoValues(null);
                  const nextValues = values.map((value, valueIndex) => (
                    valueIndex === index ? event.target.value : value
                  ));
                  setLocalValues(nextValues);
                  persistDraft(nextValues);
                }}
              />
            </label>
          ))}
          <div className={styles.progressActions}>
            <button
              type="button"
              disabled={!hydrated || !hasDraft}
              className={styles.secondaryAction}
              data-testid="grok-task-contract-discard"
              onClick={() => {
                if (!window.confirm(labels.discardTaskContractConfirm)) return;
                if (!removeDraft()) return;
                setUndoValues(values);
                setLocalValues(EMPTY_VALUES);
                setDraftStatus(labels.taskDraftDiscarded);
              }}
            >
              {labels.discardTaskContract}
            </button>
            {undoValues ? (
              <button
                type="button"
                className={styles.secondaryAction}
                data-testid="grok-task-contract-undo"
                onClick={() => {
                  const persisted = persistDraft(undoValues);
                  setLocalValues(undoValues);
                  if (persisted) {
                    setUndoValues(null);
                    setDraftStatus(labels.taskDraftRestored);
                  }
                }}
              >
                {labels.undo}
              </button>
            ) : null}
          </div>
          <p
            className={draftPersistenceFailed ? styles.storageWarning : styles.srOnly}
            data-testid="grok-task-contract-draft-status"
            role="status"
          >
            {visibleDraftStatus}
          </p>
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
