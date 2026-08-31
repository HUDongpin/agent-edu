import type { AgentOrchestrationStorageStatus } from "./progress-store";
import { readAgentOrchestrationRecoveryExport } from "./progress-store";

export type Labels = Readonly<Record<string, string>>;

export function label(labels: Labels, key: string, fallback: string): string {
  const value = labels[key];
  return value && value.trim() ? value : fallback;
}

export function isChinese(labels: Labels): boolean {
  return labels.module === "模块";
}

export function persistenceText(
  labels: Labels,
  persisted: boolean | null,
): string {
  if (persisted === null) return "";
  if (persisted) {
    return label(
      labels,
      "savedLocally",
      isChinese(labels) ? "已保存在此浏览器" : "Saved in this browser",
    );
  }
  return label(
    labels,
    "memoryOnly",
    isChinese(labels) ? "仅保存在当前标签页" : "Saved for this tab only",
  );
}

export function serializedRecord(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

export function storageStatusText(
  labels: Labels,
  status: AgentOrchestrationStorageStatus,
): string {
  if (status === "checking") {
    return label(
      labels,
      "restoringProgress",
      isChinese(labels) ? "正在恢复此浏览器中的学习进度…" : "Restoring local progress…",
    );
  }
  if (status === "corrupt") {
    return label(
      labels,
      "storageCorrupt",
      isChinese(labels)
        ? "浏览器中的共享学习记录无法读取。原始数据已保持不变；请先下载恢复副本，再前往“我的学习”使用全站恢复工具。"
        : "The shared learning record in this browser is unreadable. Its original bytes remain untouched; download a recovery copy before using the site-wide recovery tools in My Learning.",
    );
  }
  if (status === "quota-exceeded") {
    return label(
      labels,
      "storageQuotaExceeded",
      isChinese(labels)
        ? "浏览器存储空间不足，无法安全保存新的学习内容。当前未保存内容可先下载恢复副本。"
        : "Browser storage is full, so new learning work cannot be saved safely. Download the recovery copy before leaving this page.",
    );
  }
  return label(
    labels,
    "storageUnavailable",
    isChinese(labels)
      ? "此浏览器目前拒绝本地存储。为避免显示虚假进度或丢失内容，课程操作暂时停用。"
      : "Local storage is unavailable in this browser. Course controls are paused to avoid false progress or lost work.",
  );
}

export function downloadAgentOrchestrationRecovery(): boolean {
  const recovery = readAgentOrchestrationRecoveryExport();
  if (!recovery.exportText) return false;
  const blob = new Blob([recovery.exportText], {
    type: "text/plain;charset=utf-8",
  });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = "agent-orchestration-recovery.txt";
  anchor.click();
  URL.revokeObjectURL(href);
  return true;
}
