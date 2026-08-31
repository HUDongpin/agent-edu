"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  AGENT_ORCHESTRATION_PROGRESS_PREFIX,
  AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY,
  AGENT_ORCHESTRATION_PROGRESS_MILESTONES,
  agentOrchestrationModuleRequirements,
  agentOrchestrationModuleProgressKey,
  agentOrchestrationProgressPercent,
  isAgentOrchestrationCapstoneComplete,
  isAgentOrchestrationCourseModuleComplete,
  isAgentOrchestrationModuleComplete,
  isAgentOrchestrationQuizPassed,
  readAgentOrchestrationCheckpointReceipt,
  saveAgentOrchestrationCheckpointReceipt,
} from "@/lib/agent-orchestration/progress";
import type {
  AgentOrchestrationCheckpointCopy,
  AgentOrchestrationModuleSlug,
} from "@/lib/agent-orchestration/types";
import { AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS } from "@/lib/progress-topology";
import {
  resetAgentOrchestrationProgressResult,
  updateAgentOrchestrationProgress,
} from "./progress-store";
import {
  downloadAgentOrchestrationRecovery,
  isChinese,
  label,
  persistenceText,
  serializedRecord,
  storageStatusText,
  type Labels,
} from "./interaction-helpers";
import { useAgentOrchestrationProgress } from "./useAgentOrchestrationProgress";
import {
  AGENT_ORCHESTRATION_RESET_CONFIRMATION_MS,
  useExpiringResetConfirmation,
} from "./useExpiringResetConfirmation";
import styles from "./AgentOrchestrationCourse.module.css";

export function CourseProgress({
  labels,
  compact = false,
  locale,
  showJourneyAction = false,
  startLabel,
  resumeLabel,
  moduleCheckpoints,
}: {
  labels: Labels;
  compact?: boolean;
  locale?: string;
  showJourneyAction?: boolean;
  startLabel?: string;
  resumeLabel?: string;
  moduleCheckpoints?: readonly {
    readonly slug: AgentOrchestrationModuleSlug;
    readonly checkpoint: AgentOrchestrationCheckpointCopy;
  }[];
}) {
  const snapshot = useAgentOrchestrationProgress();
  const record = snapshot.record;
  const localizedCompletion = (slug: AgentOrchestrationModuleSlug) => {
    const checkpoint = moduleCheckpoints?.find((item) => item.slug === slug)
      ?.checkpoint;
    return checkpoint
      ? isAgentOrchestrationModuleComplete(record, slug, checkpoint)
      : isAgentOrchestrationCourseModuleComplete(record, slug);
  };
  const percent = moduleCheckpoints
    ? Math.round((
      AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS.filter(localizedCompletion).length
      + (isAgentOrchestrationQuizPassed(record) ? 1 : 0)
      + (isAgentOrchestrationCapstoneComplete(record) ? 1 : 0)
    ) / AGENT_ORCHESTRATION_PROGRESS_MILESTONES * 100)
    : agentOrchestrationProgressPercent(record);
  const firstIncomplete = AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS.find(
    (slug) => !localizedCompletion(slug),
  );
  const hasProgress = Object.keys(record).some(
    (key) => key.startsWith(AGENT_ORCHESTRATION_PROGRESS_PREFIX)
      && key !== AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY,
  );
  const journeyHref = locale
    ? percent === 100
      ? `/${locale}/agent-orchestration/${AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS[0]}/`
      : firstIncomplete
        ? `/${locale}/agent-orchestration/${firstIncomplete}/`
        : !isAgentOrchestrationQuizPassed(record)
          ? `/${locale}/agent-orchestration/assessment/`
          : `/${locale}/agent-orchestration/capstone/`
    : null;
  const resetConfirmation = useExpiringResetConfirmation();
  const resetButtonRef = useRef<HTMLButtonElement>(null);
  const [resetResult, setResetResult] = useState<
    ReturnType<typeof resetAgentOrchestrationProgressResult> | null
  >(null);
  const [recoveryDownloaded, setRecoveryDownloaded] = useState<boolean | null>(null);
  const ready = snapshot.status === "available";
  const unavailableText = storageStatusText(labels, snapshot.status);

  if (!ready) {
    return (
      <section
        className={compact ? styles.progressCompact : styles.progressPanel}
        aria-busy={snapshot.status === "checking"}
        data-storage-status={snapshot.status}
        data-testid="agent-orchestration-progress"
      >
        <p
          className={snapshot.status === "checking" ? undefined : styles.storageWarning}
          data-testid="agent-orchestration-storage-state"
          role={snapshot.status === "checking" ? "status" : "alert"}
        >
          {unavailableText}
        </p>
        {snapshot.status !== "checking" ? (
          <div className={styles.progressActions}>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => setRecoveryDownloaded(downloadAgentOrchestrationRecovery())}
            >
              {label(
                labels,
                "downloadRecovery",
                isChinese(labels) ? "下载恢复副本" : "Download recovery copy",
              )}
            </button>
            {locale ? (
              <Link className={styles.secondaryAction} href={`/${locale}/learning/`}>
                {label(
                  labels,
                  "openRecoveryTools",
                  isChinese(labels) ? "打开“我的学习”恢复工具" : "Open My Learning recovery tools",
                )}
              </Link>
            ) : null}
          </div>
        ) : null}
        {recoveryDownloaded !== null ? (
          <small role="status" aria-live="polite">
            {recoveryDownloaded
              ? label(
                labels,
                "recoveryDownloaded",
                isChinese(labels) ? "恢复副本已下载；原始浏览器记录仍未更改。" : "Recovery copy downloaded; the original browser record is still unchanged.",
              )
              : label(
                labels,
                "recoveryUnavailable",
                isChinese(labels) ? "没有可下载的恢复数据。" : "No recovery data is available to download.",
              )}
          </small>
        ) : null}
      </section>
    );
  }

  return (
    <section
      className={compact ? styles.progressCompact : styles.progressPanel}
      aria-busy="false"
      data-storage-status={snapshot.status}
      data-testid="agent-orchestration-progress"
    >
      <div className={styles.progressReadout}>
        <span>{label(labels, "progress", "Course progress")}</span>
        <strong>{percent}%</strong>
      </div>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={label(labels, "progress", "Course progress")}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      {showJourneyAction && journeyHref ? (
        <Link
          className={styles.primaryAction}
          href={journeyHref}
          data-course-journey-action
          data-testid="agent-orchestration-journey-action"
        >
          {percent === 100
            ? label(labels, "reviewCourse", "Review course")
            : hasProgress
              ? resumeLabel ?? "Resume course"
              : startLabel ?? "Start course"}
          <span aria-hidden="true">→</span>
        </Link>
      ) : null}
      {snapshot.migrationNotice ? (
        <p
          className={styles.storageNotice}
          data-testid="agent-orchestration-migration-notice"
          role="status"
        >
          {label(
            labels,
            "migrationPreserved",
            isChinese(labels)
              ? `课程更新已保留 ${snapshot.migrationNotice.preservedKeys.length} 项学习内容；${snapshot.migrationNotice.invalidatedKeys.length} 项旧收据需要重新核验。`
              : `Course update preserved ${snapshot.migrationNotice.preservedKeys.length} learner-authored items; ${snapshot.migrationNotice.invalidatedKeys.length} stale receipts require review.`,
          )
            .replace("{preserved}", String(snapshot.migrationNotice.preservedKeys.length))
            .replace("{invalidated}", String(snapshot.migrationNotice.invalidatedKeys.length))}
        </p>
      ) : null}
      {!compact ? (
        <div
          className={styles.progressActions}
          role="group"
          aria-label={label(labels, "reset", "Reset")}
          data-reset-confirmation-state={resetConfirmation.state}
          onKeyDown={(event) => {
            if (
              event.key === "Escape"
              && resetConfirmation.state === "confirming"
            ) {
              event.preventDefault();
              resetConfirmation.cancel();
              resetButtonRef.current?.focus();
            }
          }}
        >
          <small
            id="agent-orchestration-reset-status"
            role="status"
            aria-live="polite"
            data-testid="agent-orchestration-reset-status"
          >
            {resetResult !== null
              ? (resetResult.persisted
                ? label(labels, "resetComplete", isChinese(labels) ? "课程 15 进度已在此浏览器重置" : "Course 15 progress reset in this browser")
                : label(
                  labels,
                  "resetFailed",
                  isChinese(labels)
                    ? "无法验证重置；原有浏览器记录保持不变。"
                    : "Reset could not be verified; the existing browser record remains unchanged.",
                ))
              : resetConfirmation.state === "confirming"
                ? label(
                  labels,
                  "resetConfirmationOpen",
                  isChinese(labels)
                    ? "重置确认将在 {seconds} 秒内有效。请立即确认或取消。"
                    : "Reset confirmation is open for {seconds} seconds. Confirm now or cancel.",
                ).replace(
                  "{seconds}",
                  String(Math.ceil(
                    AGENT_ORCHESTRATION_RESET_CONFIRMATION_MS / 1_000,
                  )),
                )
                : resetConfirmation.state === "cancelled"
                  ? label(
                    labels,
                    "resetCancelled",
                    isChinese(labels)
                      ? "已取消重置。学习进度未发生更改。"
                      : "Reset cancelled. No progress was changed.",
                  )
                  : resetConfirmation.state === "expired"
                    ? label(
                      labels,
                      "resetExpired",
                      isChinese(labels)
                        ? "重置确认已过期。学习进度未发生更改。"
                        : "Reset confirmation expired. No progress was changed.",
                    )
              : label(labels, "savedLocally", "Saved in this browser")}
          </small>
          <button
            ref={resetButtonRef}
            type="button"
            aria-expanded={resetConfirmation.state === "confirming"}
            aria-controls="agent-orchestration-reset-status"
            aria-describedby="agent-orchestration-reset-status"
            data-testid="agent-orchestration-reset"
            onClick={() => {
              if (resetConfirmation.state !== "confirming") {
                setResetResult(null);
                resetConfirmation.arm();
                resetButtonRef.current?.focus();
                return;
              }
              if (resetConfirmation.consumeConfirmation()) {
                setResetResult(resetAgentOrchestrationProgressResult());
              }
            }}
          >
            {resetConfirmation.state === "confirming"
              ? label(labels, "confirmReset", "Confirm reset")
              : label(labels, "reset", "Reset")}
          </button>
          {resetConfirmation.state === "confirming" ? (
            <button
              type="button"
              data-testid="agent-orchestration-reset-cancel"
              onClick={() => {
                resetConfirmation.cancel();
                resetButtonRef.current?.focus();
              }}
            >
              {label(
                labels,
                "cancelReset",
                isChinese(labels) ? "取消" : "Cancel",
              )}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}


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
