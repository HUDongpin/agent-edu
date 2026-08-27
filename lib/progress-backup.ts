import { HANDBOOK_SECTION_IDS, LEGACY_PROGRESS_KEY } from "./progress";
import { PUBLISHED_PROGRESS_COURSE_IDS } from "./public-progress-contract";
import { PROGRESS_LOCAL_DURABLE_KEYS } from "./progress-storage-contract";

export const PROGRESS_BACKUP_KIND = "aicourse-progress-backup";
export const PROGRESS_BACKUP_SCHEMA_VERSION = 1;
export const PROGRESS_BACKUP_MAX_BYTES = 1024 * 1024;

export type ProgressDurableKey = (typeof PROGRESS_LOCAL_DURABLE_KEYS)[number];

export interface ProgressBackupV1 {
  readonly kind: typeof PROGRESS_BACKUP_KIND;
  readonly schemaVersion: typeof PROGRESS_BACKUP_SCHEMA_VERSION;
  readonly createdAt: string;
  readonly records: Readonly<Partial<Record<ProgressDurableKey, string>>>;
}

export type ProgressBackupExportResult =
  | { readonly ok: true; readonly backup: ProgressBackupV1; readonly text: string }
  | {
      readonly ok: false;
      readonly reason: "storage-unavailable" | "invalid-record" | "too-large";
      readonly key?: ProgressDurableKey;
    };

export type ProgressBackupParseResult =
  | { readonly ok: true; readonly backup: ProgressBackupV1 }
  | { readonly ok: false; readonly reason: "invalid" | "too-large" | "read-failed" };

export type ProgressBackupRestoreResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason: "write-failed";
      /** The durable key set was verified byte-for-byte against the pre-restore snapshot. */
      readonly unchanged: true;
    }
  | {
      readonly ok: false;
      readonly reason: "rollback-failed";
      /** At least one original byte string could not be restored and verified. */
      readonly unchanged: false;
    };

export interface ProgressBackupFile {
  readonly size: number;
  text(): Promise<string>;
}

export interface ProgressBackupStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const DURABLE_KEY_SET = new Set<string>(PROGRESS_LOCAL_DURABLE_KEYS);
const HANDBOOK_SECTION_SET = new Set<string>(HANDBOOK_SECTION_IDS);
const PUBLISHED_COURSE_SET = new Set<string>(PUBLISHED_PROGRESS_COURSE_IDS);
const JSON_OBJECT_KEYS = new Set<ProgressDurableKey>([
  "ae.learning.v2",
  LEGACY_PROGRESS_KEY,
  "aicourse.grok.progress.v1",
  "aicourse.cursor.progress.v1",
  "ae.progress.recent.v1",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(raw);
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * Validate the storage envelope without normalising it. Backups preserve the
 * exact bytes accepted by the active progress readers; they never "repair"
 * or rewrite a learner record during export.
 */
export function isValidDurableProgressRecord(
  key: ProgressDurableKey,
  raw: string,
): boolean {
  if (key === "tch.section") return HANDBOOK_SECTION_SET.has(raw);
  if (key === "tch.seen") {
    if (!raw) return true;
    const sections = raw.split(",");
    return sections.every((section) => HANDBOOK_SECTION_SET.has(section))
      && new Set(sections).size === sections.length;
  }

  if (!JSON_OBJECT_KEYS.has(key)) return false;
  const value = parseJsonObject(raw);
  if (!value) return false;
  if (key === "ae.learning.v2") return value.version === 2;
  if (key === "aicourse.grok.progress.v1") return value.schemaVersion === 1;
  if (key === "ae.progress.recent.v1") {
    return value.version === 1
      && isRecord(value.activity)
      && Object.entries(value.activity).every(([courseId, observedAt]) => (
        PUBLISHED_COURSE_SET.has(courseId)
        && typeof observedAt === "number"
        && Number.isSafeInteger(observedAt)
        && observedAt >= 0
      ));
  }
  return true;
}

function validCreatedAt(value: unknown): value is string {
  return typeof value === "string"
    && value.length > 0
    && Number.isFinite(Date.parse(value));
}

function parseBackupValue(value: unknown): ProgressBackupV1 | null {
  if (
    !isRecord(value)
    || value.kind !== PROGRESS_BACKUP_KIND
    || value.schemaVersion !== PROGRESS_BACKUP_SCHEMA_VERSION
    || !validCreatedAt(value.createdAt)
    || !isRecord(value.records)
  ) return null;

  const rootKeys = Object.keys(value);
  if (
    rootKeys.length !== 4
    || rootKeys.some((key) => !["kind", "schemaVersion", "createdAt", "records"].includes(key))
  ) return null;

  const records: Partial<Record<ProgressDurableKey, string>> = {};
  for (const [key, raw] of Object.entries(value.records)) {
    if (!DURABLE_KEY_SET.has(key) || typeof raw !== "string") return null;
    const durableKey = key as ProgressDurableKey;
    if (!isValidDurableProgressRecord(durableKey, raw)) return null;
    records[durableKey] = raw;
  }

  return {
    kind: PROGRESS_BACKUP_KIND,
    schemaVersion: PROGRESS_BACKUP_SCHEMA_VERSION,
    createdAt: value.createdAt,
    records,
  };
}

export function parseProgressBackupText(text: string): ProgressBackupParseResult {
  if (utf8Bytes(text) > PROGRESS_BACKUP_MAX_BYTES) {
    return { ok: false, reason: "too-large" };
  }
  try {
    const parsed: unknown = JSON.parse(text);
    const backup = parseBackupValue(parsed);
    return backup ? { ok: true, backup } : { ok: false, reason: "invalid" };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

export async function readProgressBackupFile(
  file: ProgressBackupFile,
): Promise<ProgressBackupParseResult> {
  // Check the browser-provided byte size before allocating the file body.
  if (
    !Number.isSafeInteger(file.size)
    || file.size < 0
    || file.size > PROGRESS_BACKUP_MAX_BYTES
  ) return { ok: false, reason: "too-large" };

  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, reason: "read-failed" };
  }
  // A File-like test double (or future non-File source) cannot bypass the
  // actual UTF-8 limit by reporting a smaller `size`.
  return parseProgressBackupText(text);
}

export function exportProgressBackup(
  storage: ProgressBackupStorage,
  now: () => Date = () => new Date(),
): ProgressBackupExportResult {
  const records: Partial<Record<ProgressDurableKey, string>> = {};
  for (const key of PROGRESS_LOCAL_DURABLE_KEYS) {
    let raw: string | null;
    try {
      raw = storage.getItem(key);
    } catch {
      return { ok: false, reason: "storage-unavailable", key };
    }
    if (raw === null) continue;
    if (utf8Bytes(raw) > PROGRESS_BACKUP_MAX_BYTES) {
      return { ok: false, reason: "too-large", key };
    }
    if (!isValidDurableProgressRecord(key, raw)) {
      return { ok: false, reason: "invalid-record", key };
    }
    records[key] = raw;
  }

  const backup: ProgressBackupV1 = {
    kind: PROGRESS_BACKUP_KIND,
    schemaVersion: PROGRESS_BACKUP_SCHEMA_VERSION,
    createdAt: now().toISOString(),
    records,
  };
  const text = `${JSON.stringify(backup, null, 2)}\n`;
  if (utf8Bytes(text) > PROGRESS_BACKUP_MAX_BYTES) {
    return { ok: false, reason: "too-large" };
  }
  return { ok: true, backup, text };
}

type DurableSnapshot = Readonly<Record<ProgressDurableKey, string | null>>;

function readSnapshot(storage: ProgressBackupStorage): DurableSnapshot | null {
  const snapshot = {} as Record<ProgressDurableKey, string | null>;
  try {
    for (const key of PROGRESS_LOCAL_DURABLE_KEYS) snapshot[key] = storage.getItem(key);
  } catch {
    return null;
  }
  return snapshot;
}

function writeAndVerifySnapshot(
  storage: ProgressBackupStorage,
  snapshot: DurableSnapshot,
): boolean {
  try {
    for (const key of PROGRESS_LOCAL_DURABLE_KEYS) {
      const raw = snapshot[key];
      if (raw === null) storage.removeItem(key);
      else storage.setItem(key, raw);
    }
    return PROGRESS_LOCAL_DURABLE_KEYS.every((key) => storage.getItem(key) === snapshot[key]);
  } catch {
    return false;
  }
}

export function restoreProgressBackup(
  storage: ProgressBackupStorage,
  backup: ProgressBackupV1,
): ProgressBackupRestoreResult {
  // Callers can construct values in TypeScript, so validate again at the
  // mutation boundary instead of trusting only file parsing.
  const validated = parseBackupValue(backup);
  if (!validated) return { ok: false, reason: "write-failed", unchanged: true };

  const before = readSnapshot(storage);
  if (!before) return { ok: false, reason: "write-failed", unchanged: true };

  const replacement = {} as Record<ProgressDurableKey, string | null>;
  for (const key of PROGRESS_LOCAL_DURABLE_KEYS) {
    replacement[key] = validated.records[key] ?? null;
  }
  if (writeAndVerifySnapshot(storage, replacement)) return { ok: true };

  return writeAndVerifySnapshot(storage, before)
    ? { ok: false, reason: "write-failed", unchanged: true }
    : { ok: false, reason: "rollback-failed", unchanged: false };
}
