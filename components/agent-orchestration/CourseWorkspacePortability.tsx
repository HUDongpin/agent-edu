"use client";

import { useId, useState } from "react";
import {
  AGENT_ORCHESTRATION_WORKSPACE_MAX_BYTES,
  applyAgentOrchestrationWorkspacePreview,
  createAgentOrchestrationWorkspace,
  parseAgentOrchestrationWorkspace,
  previewAgentOrchestrationWorkspaceRestore,
  serializeAgentOrchestrationWorkspace,
  type AgentOrchestrationWorkspaceApplyResult,
  type AgentOrchestrationWorkspaceRestorePreview,
} from "@/lib/agent-orchestration/workspace";
import {
  isChinese,
  label,
  storageStatusText,
  type Labels,
} from "./interaction-helpers";
import {
  getAgentOrchestrationProgressSnapshot,
  updateAgentOrchestrationProgressResult,
} from "./progress-store";
import { flushAgentOrchestrationDrafts } from "./useDebouncedDraftPersistence";
import { useAgentOrchestrationProgress } from "./useAgentOrchestrationProgress";
import styles from "./CourseWorkspacePortability.module.css";

function formatWorkspaceLabel(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  let text = template;
  for (const [name, value] of Object.entries(values)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

function downloadWorkspace(text: string): void {
  const url = URL.createObjectURL(new Blob([text], {
    type: "application/json;charset=utf-8",
  }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `agent-orchestration-workspace-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function CourseWorkspacePortability({ labels }: { labels: Labels }) {
  const inputId = useId();
  const snapshot = useAgentOrchestrationProgress();
  const [preview, setPreview] =
    useState<AgentOrchestrationWorkspaceRestorePreview | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errors, setErrors] = useState<readonly string[]>([]);
  const [busy, setBusy] = useState(false);
  const [applyResult, setApplyResult] = useState<{
    readonly application: AgentOrchestrationWorkspaceApplyResult;
    readonly persisted: boolean;
  } | null>(null);
  const available = snapshot.status === "available";

  const exportWorkspace = () => {
    setErrors([]);
    try {
      flushAgentOrchestrationDrafts();
      const current = getAgentOrchestrationProgressSnapshot();
      if (current.status !== "available") throw new Error("storage unavailable");
      downloadWorkspace(serializeAgentOrchestrationWorkspace(
        createAgentOrchestrationWorkspace(current.record),
      ));
    } catch {
      setErrors([
        isChinese(labels)
          ? "无法验证当前工作区，因此未生成导出文件。"
          : "The current workspace could not be validated, so no export was created.",
      ]);
    }
  };

  return (
    <section
      className={styles.workspace}
      aria-labelledby={`${inputId}-title`}
      aria-busy={busy || snapshot.status === "checking"}
      data-testid="agent-orchestration-workspace"
    >
      <header className={styles.header}>
        <div>
          <p>{label(labels, "workspaceEyebrow", isChinese(labels) ? "跨设备工作区" : "Portable workspace")}</p>
          <h2 id={`${inputId}-title`}>
            {label(labels, "workspaceTitle", isChinese(labels) ? "导出或恢复课程 15 工作" : "Export or restore Course 15 work")}
          </h2>
        </div>
        <span>{label(labels, "workspaceLocal", isChinese(labels) ? "本地文件 · 不上传" : "Local file · never uploaded")}</span>
      </header>

      <p className={styles.intro}>
        {label(
          labels,
          "workspaceIntro",
          isChinese(labels)
            ? "导出只包含课程 15 拥有的字段。恢复会先预览，只添加本地尚不存在的字段；已有或更新的本地工作永不被静默覆盖。"
            : "The export contains only Course 15-owned fields. Restore always previews first and adds only fields that do not exist locally; existing or newer local work is never silently overwritten.",
        )}
      </p>

      {!available ? (
        <p className={styles.warning} role={snapshot.status === "checking" ? "status" : "alert"}>
          {storageStatusText(labels, snapshot.status)}
        </p>
      ) : null}

      <div className={styles.actions}>
        <button
          type="button"
          onClick={exportWorkspace}
          disabled={!available || busy}
          data-testid="agent-orchestration-workspace-export"
        >
          {label(labels, "exportWorkspace", isChinese(labels) ? "导出工作区" : "Export workspace")}
        </button>
        <label className={styles.fileAction} htmlFor={inputId}>
          {label(labels, "chooseWorkspace", isChinese(labels) ? "选择恢复文件" : "Choose restore file")}
        </label>
        <input
          id={inputId}
          className={styles.fileInput}
          type="file"
          accept="application/json,.json"
          disabled={!available || busy}
          data-testid="agent-orchestration-workspace-import"
          onChange={async (event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (!file) return;
            setBusy(true);
            setFileName(file.name);
            setPreview(null);
            setApplyResult(null);
            setErrors([]);
            try {
              if (file.size > AGENT_ORCHESTRATION_WORKSPACE_MAX_BYTES) {
                setErrors([
                  isChinese(labels)
                    ? "工作区文件超过 5 MB 上限。"
                    : "The workspace file exceeds the 5 MB limit.",
                ]);
                return;
              }
              const parsed = parseAgentOrchestrationWorkspace(await file.text());
              if (!parsed.ok) {
                setErrors([
                  isChinese(labels)
                    ? "文件格式、课程版本或学习证据未通过验证。"
                    : "The file format, course version, or learning evidence did not pass validation.",
                ]);
                return;
              }
              flushAgentOrchestrationDrafts();
              const current = getAgentOrchestrationProgressSnapshot();
              if (current.status !== "available") {
                setErrors([
                  isChinese(labels)
                    ? "浏览器存储当前不可用，无法创建安全恢复预览。"
                    : "Browser storage is unavailable, so a safe restore preview cannot be created.",
                ]);
                return;
              }
              setPreview(previewAgentOrchestrationWorkspaceRestore(
                current.record,
                parsed.workspace,
              ));
            } catch {
              setErrors([
                isChinese(labels)
                  ? "无法读取或验证所选工作区文件。"
                  : "The selected workspace file could not be read or validated.",
              ]);
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>

      {errors.length > 0 ? (
        <div className={styles.errors} role="alert" data-testid="agent-orchestration-workspace-errors">
          <strong>{label(labels, "workspaceRejected", isChinese(labels) ? "未接受此文件" : "File not accepted")}</strong>
          <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul>
        </div>
      ) : null}

      {preview ? (
        <div className={styles.preview} data-testid="agent-orchestration-workspace-preview">
          <div className={styles.previewHeading}>
            <div>
              <span>{label(labels, "restorePreview", isChinese(labels) ? "恢复预览" : "Restore preview")}</span>
              <strong>{fileName}</strong>
            </div>
            <time dateTime={preview.workspace.exportedAt}>
              {new Date(preview.workspace.exportedAt).toLocaleString()}
            </time>
          </div>
          <dl className={styles.counts}>
            <div><dt>{label(labels, "workspaceAdd", isChinese(labels) ? "将添加" : "Will add")}</dt><dd>{preview.addCount}</dd></div>
            <div><dt>{label(labels, "workspaceSame", isChinese(labels) ? "已相同" : "Already identical")}</dt><dd>{preview.unchangedCount}</dd></div>
            <div><dt>{label(labels, "workspaceKeep", isChinese(labels) ? "保留本地" : "Keep local")}</dt><dd>{preview.keepLocalCount}</dd></div>
          </dl>
          {preview.keepLocalCount > 0 ? (
            <details className={styles.conflicts}>
              <summary>{label(labels, "workspaceConflicts", isChinese(labels) ? "查看保留的本地字段" : "Review preserved local fields")}</summary>
              <ul>
                {preview.items
                  .filter(({ action }) => action === "keep-local")
                  .map(({ key }) => <li key={key}><code>{key}</code></li>)}
              </ul>
            </details>
          ) : null}
          <button
            type="button"
            className={styles.apply}
            disabled={!available || busy || preview.addCount === 0}
            data-testid="agent-orchestration-workspace-apply"
            onClick={() => {
              const applied: {
                current: AgentOrchestrationWorkspaceApplyResult | null;
              } = { current: null };
              const persistence = updateAgentOrchestrationProgressResult((record) => {
                const next = applyAgentOrchestrationWorkspacePreview(record, preview);
                applied.current = next;
                for (const item of preview.items) {
                  if (
                    item.action === "add"
                    && !Object.hasOwn(record, item.key)
                    && Object.hasOwn(next.record, item.key)
                  ) record[item.key] = next.record[item.key];
                }
              });
              const application = applied.current;
              if (!application) return;
              setApplyResult({ application, persisted: persistence.persisted });
              if (persistence.persisted) {
                setPreview(previewAgentOrchestrationWorkspaceRestore(
                  application.record,
                  preview.workspace,
                ));
              }
            }}
          >
            {formatWorkspaceLabel(
              label(
                labels,
                "applyWorkspace",
                isChinese(labels)
                  ? "恢复 {add} 项新内容"
                  : "Restore {add} new items",
              ),
              { add: preview.addCount },
            )}
          </button>
        </div>
      ) : null}

      {applyResult ? (
        <p className={styles.result} role="status" aria-live="polite" data-testid="agent-orchestration-workspace-result">
          {applyResult.persisted
            ? formatWorkspaceLabel(
              label(
                labels,
                "workspaceRestored",
                isChinese(labels)
                  ? "已恢复 {applied} 项；跳过 {skipped} 项本地内容。"
                  : "Restored {applied} items; preserved {skipped} local items.",
              ),
              {
                applied: applyResult.application.appliedCount,
                skipped: applyResult.application.skippedCount,
              },
            )
            : label(
              labels,
              "workspaceRestoreFailed",
              isChinese(labels)
                ? "无法验证恢复写入；现有浏览器记录保持不变。"
                : "The restore write could not be verified; the existing browser record remains unchanged.",
            )}
        </p>
      ) : null}
    </section>
  );
}
