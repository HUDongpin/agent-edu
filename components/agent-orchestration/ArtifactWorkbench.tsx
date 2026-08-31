"use client";

import { useState } from "react";
import {
  AGENT_ORCHESTRATION_MAX_ARTIFACT_DRAFT_LENGTH,
  AGENT_ORCHESTRATION_MIN_ARTIFACT_SEMANTIC_DELTA,
  agentOrchestrationArtifactEvidenceKey,
  agentOrchestrationArtifactKey,
  agentOrchestrationArtifactPendingDraftKey,
  isMeaningfulAgentOrchestrationArtifact,
  saveAgentOrchestrationArtifactDraft,
  saveAgentOrchestrationPendingArtifactDraft,
} from "@/lib/agent-orchestration/progress";
import type {
  AgentOrchestrationModuleSlug,
  AgentOrchestrationPracticeCopy,
} from "@/lib/agent-orchestration/types";
import { draftStatusText } from "./draft-status";
import {
  isChinese,
  label,
  storageStatusText,
  type Labels,
} from "./interaction-helpers";
import { updateAgentOrchestrationProgress } from "./progress-store";
import { useAgentOrchestrationProgress } from "./useAgentOrchestrationProgress";
import { useDebouncedDraftPersistence } from "./useDebouncedDraftPersistence";
import styles from "./AgentOrchestrationCourse.module.css";

export function ArtifactWorkbench({
  slug,
  practice,
  labels,
}: {
  slug: AgentOrchestrationModuleSlug;
  practice: AgentOrchestrationPracticeCopy;
  labels: Labels;
}) {
  const key = agentOrchestrationArtifactKey(slug);
  const pendingKey = agentOrchestrationArtifactPendingDraftKey(slug);
  const snapshot = useAgentOrchestrationProgress();
  const progress = snapshot.record;
  const storedArtifact = progress[key];
  const pendingDraft = progress[pendingKey];
  const storedEvidence = progress[agentOrchestrationArtifactEvidenceKey(slug)];
  if (snapshot.status !== "available") {
    const guidanceId = `${slug}-artifact-guidance`;
    return (
      <div
        className={styles.workbench}
        aria-busy={snapshot.status === "checking"}
        data-testid="agent-orchestration-artifact-workbench"
      >
        <div className={styles.workbenchHeader}>
          <div>
            <span>{label(labels, "artifactWorkbench", "Artifact workbench")}</span>
            <strong>{practice.artifact}</strong>
          </div>
          <button type="button" disabled aria-describedby={guidanceId}>
            {label(labels, "saveDraft", "Save draft")}
          </button>
        </div>
        <textarea
          value=""
          disabled
          readOnly
          aria-describedby={guidanceId}
          aria-label={`${practice.artifact} ${label(labels, "draft", "draft")}`}
          data-testid="agent-orchestration-artifact-draft"
        />
        <p id={guidanceId}>{storageStatusText(labels, snapshot.status)}</p>
      </div>
    );
  }
  const initialValue = typeof pendingDraft === "string"
    ? pendingDraft
    : typeof storedArtifact === "string"
      ? storedArtifact
      : practice.template;
  return (
    <RestoredArtifactWorkbench
      key={slug}
      slug={slug}
      practice={practice}
      labels={labels}
      initialValue={initialValue}
      restoredPendingDraft={typeof pendingDraft === "string"}
      initiallyAccepted={
        typeof pendingDraft !== "string"
        && typeof storedArtifact === "string"
        && Boolean(
          storedEvidence
          && typeof storedEvidence === "object"
          && !Array.isArray(storedEvidence)
          && (storedEvidence as Record<string, unknown>).saved === true
          && (storedEvidence as Record<string, unknown>).moduleSlug === slug
          && (storedEvidence as Record<string, unknown>).starterTemplate
            === practice.template
          && isMeaningfulAgentOrchestrationArtifact(
            storedArtifact,
            practice.template,
          )
        )
      }
    />
  );
}

function RestoredArtifactWorkbench({
  slug,
  practice,
  labels,
  initialValue,
  restoredPendingDraft,
  initiallyAccepted,
}: {
  slug: AgentOrchestrationModuleSlug;
  practice: AgentOrchestrationPracticeCopy;
  labels: Labels;
  initialValue: string;
  restoredPendingDraft: boolean;
  initiallyAccepted: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const draftPersistence = useDebouncedDraftPersistence(
    initiallyAccepted
      ? "evidence-accepted"
      : restoredPendingDraft
        ? "draft-saved"
        : null,
  );
  const guidanceId = `${slug}-artifact-guidance`;
  const meaningfulEdit = isMeaningfulAgentOrchestrationArtifact(
    value,
    practice.template,
  );

  return (
    <div
      className={styles.workbench}
      aria-busy={draftPersistence.status === "saving"}
      data-draft-status={draftPersistence.status ?? undefined}
      data-testid="agent-orchestration-artifact-workbench"
    >
      <div className={styles.workbenchHeader}>
        <div>
          <span>{label(labels, "artifactWorkbench", "Artifact workbench")}</span>
          <strong>{practice.artifact}</strong>
        </div>
        <button
          type="button"
          disabled={!meaningfulEdit}
          aria-describedby={guidanceId}
          onClick={() => {
            if (!meaningfulEdit) return;
            draftPersistence.cancelPending();
            let receiptSaved = false;
            const persisted = updateAgentOrchestrationProgress((record) => {
              receiptSaved = saveAgentOrchestrationArtifactDraft(
                record,
                slug,
                value,
                practice.template,
              );
            });
            if (receiptSaved && persisted) {
              draftPersistence.markEvidenceAccepted();
            }
          }}
        >
          {draftPersistence.status === "evidence-accepted"
            ? label(labels, "saved", "Saved")
            : label(labels, "saveDraft", "Save draft")}
        </button>
      </div>
      <textarea
        value={value}
        maxLength={AGENT_ORCHESTRATION_MAX_ARTIFACT_DRAFT_LENGTH}
        aria-describedby={guidanceId}
        onChange={(event) => {
          const nextValue = event.target.value;
          setValue(nextValue);
          draftPersistence.queue(() => {
            return updateAgentOrchestrationProgress((record) => {
              saveAgentOrchestrationPendingArtifactDraft(record, slug, nextValue);
            });
          });
        }}
        onBlur={() => draftPersistence.flush()}
        aria-label={`${practice.artifact} ${label(labels, "draft", "draft")}`}
        data-testid="agent-orchestration-artifact-draft"
        spellCheck
      />
      <p id={guidanceId}>
        {meaningfulEdit
          ? practice.reviewGate
          : label(
            labels,
            "artifactEditRequired",
            isChinese(labels)
              ? `请保留模板结构，跨多个章节填写至少三行与编排有关的内容，并至少改变 ${AGENT_ORCHESTRATION_MIN_ARTIFACT_SEMANTIC_DELTA} 个字母或数字字符；浏览器只验证最低证据，质量须人工评审。`
              : `Retain the template structure, complete at least three orchestration-relevant lines across multiple sections, and change at least ${AGENT_ORCHESTRATION_MIN_ARTIFACT_SEMANTIC_DELTA} letter or number characters; this browser gate is only a minimum and quality requires human review.`,
          )}
      </p>
      <small className={styles.persistenceStatus} role="status" aria-live="polite">
        {draftStatusText(labels, draftPersistence.status)}
      </small>
    </div>
  );
}

