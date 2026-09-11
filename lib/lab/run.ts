import type { Model } from "../byok/types";
import type { DraftStorage } from "./draft";

/*
 * The last complete eval run, and the one before it, kept on this device.
 *
 * The menu button waits for a baseline score and the before/after needs both
 * runs, so a reload used to cost another 28 requests to see step 4 again. This
 * is a separate record from ae.lab.draft.v1 on purpose: the draft holds what
 * the reader typed, and its tests pin exactly that; this holds what the model
 * produced. Only what a row shows is stored — the case id, the order, the
 * verdict and its reason as displayed — never `said` or `kind`, which come back
 * from the live eval set. Ids must match that set exactly and in order, so a
 * run recorded against a set that has since changed is dropped rather than
 * half-restored. A stopped run is never written: the record only ever holds
 * scores that were results.
 *
 * Each run also records the model that produced it. The banner under the meter
 * says "same model", and the model select resets on reload, so without this a
 * restored run and a new one could claim a sameness nobody chose.
 */
export const LAB_RUN_KEY = "ae.lab.run.v1";

// The tables render no more of a reason than this.
export const LAB_RUN_MAX_WHY_LENGTH = 110;
// A longer order is stored as null, never clipped into JSON that reads as broken.
export const LAB_RUN_MAX_ORDER_LENGTH = 1_200;

// Keyed by the Model union, so a model added there does not compile until it is listed here.
const MODELS: Record<Model, true> = { "deepseek-v4-flash": true, "deepseek-v4-pro": true };

/* Whether this page load has saved a run. The billing ledger in lib/deepseek.ts
   lives exactly as long, and the Lab remounts on a client-side return, so a run
   saved in this document is already in the tab's billing total: it must not be
   introduced as restored from an earlier visit. */
let savedInThisDocument = false;

export function runSavedThisDocument(): boolean {
  return savedInThisDocument;
}

function isModel(value: unknown): value is Model {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(MODELS, value);
}

export interface StoredRow {
  id: string;
  order: string | null;
  ok: boolean;
  why: string;
}

export interface LabRunV1 {
  version: 1;
  model: Model;
  score: number;
  rows: StoredRow[];
  prevModel: Model | null;
  prev: number | null;
  prevRows: StoredRow[];
  savedAt: string;
}

export interface LabRunInput {
  model: Model;
  score: number;
  rows: readonly StoredRow[];
  prevModel: Model | null;
  prev: number | null;
  prevRows: readonly StoredRow[];
}

function browserStorage(): DraftStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function decodeRow(value: unknown, id: string): StoredRow | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (
    row.id !== id ||
    typeof row.ok !== "boolean" ||
    typeof row.why !== "string" ||
    row.why.length > LAB_RUN_MAX_WHY_LENGTH ||
    (row.order !== null &&
      (typeof row.order !== "string" || row.order.length > LAB_RUN_MAX_ORDER_LENGTH))
  ) {
    return null;
  }
  return { id, order: row.order as string | null, ok: row.ok, why: row.why };
}

function decodeRows(value: unknown, caseIds: readonly string[], allowEmpty: boolean): StoredRow[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length === 0) return allowEmpty ? [] : null;
  if (value.length !== caseIds.length) return null;
  const out: StoredRow[] = [];
  for (let index = 0; index < caseIds.length; index++) {
    const row = decodeRow(value[index], caseIds[index]);
    if (!row) return null;
    out.push(row);
  }
  return out;
}

const passing = (rows: readonly StoredRow[]) => rows.filter((row) => row.ok).length;

export function decodeLabRun(value: unknown, caseIds: readonly string[]): LabRunV1 | null {
  if (!value || typeof value !== "object" || Array.isArray(value) || caseIds.length === 0) return null;
  const run = value as Record<string, unknown>;
  const { model, prevModel } = run;
  const rows = decodeRows(run.rows, caseIds, false);
  const prevRows = decodeRows(run.prevRows, caseIds, true);
  if (
    run.version !== 1 ||
    !isModel(model) ||
    rows === null ||
    prevRows === null ||
    run.score !== passing(rows) ||
    !validDate(run.savedAt)
  ) {
    return null;
  }

  // A previous run is all or nothing: its rows, its score and its model.
  let previousModel: Model | null = null;
  if (prevRows.length === 0) {
    if (run.prev !== null || prevModel !== null) return null;
  } else {
    if (run.prev !== passing(prevRows) || !isModel(prevModel)) return null;
    previousModel = prevModel;
  }

  return {
    version: 1,
    model,
    score: passing(rows),
    rows,
    prevModel: previousModel,
    prev: prevRows.length === 0 ? null : passing(prevRows),
    prevRows,
    savedAt: run.savedAt,
  };
}

/**
 * Keeps only the four fields a stored row has, and only what a row shows. The
 * tables print a reason for a failure alone, so a passing row's reason — the
 * judge's own prose — is never kept. A row's text comes from model JSON, so its
 * types are checked, not trusted.
 */
export function toStoredRow(row: StoredRow): StoredRow {
  const ok = row.ok === true;
  return {
    id: row.id,
    order: typeof row.order === "string" && row.order.length <= LAB_RUN_MAX_ORDER_LENGTH ? row.order : null,
    ok,
    why: !ok && typeof row.why === "string" ? row.why.slice(0, LAB_RUN_MAX_WHY_LENGTH) : "",
  };
}

export function readLabRun(
  caseIds: readonly string[],
  storage: DraftStorage | null = browserStorage(),
): LabRunV1 | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(LAB_RUN_KEY);
    if (raw === null) return null;
    return decodeLabRun(JSON.parse(raw), caseIds);
  } catch {
    return null;
  }
}

export function writeLabRun(
  input: LabRunInput,
  caseIds: readonly string[],
  storage: DraftStorage | null = browserStorage(),
  now: () => Date = () => new Date(),
): LabRunV1 | null {
  if (!storage) return null;
  const candidate = decodeLabRun({
    version: 1,
    model: input.model,
    score: input.score,
    rows: input.rows.map(toStoredRow),
    prevModel: input.prevModel,
    prev: input.prev,
    prevRows: input.prevRows.map(toStoredRow),
    savedAt: now().toISOString(),
  }, caseIds);
  if (!candidate) return null;

  try {
    storage.setItem(LAB_RUN_KEY, JSON.stringify(candidate));
    savedInThisDocument = true;
    return candidate;
  } catch {
    return null;
  }
}

export function clearLabRun(storage: DraftStorage | null = browserStorage()): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(LAB_RUN_KEY);
    return true;
  } catch {
    return false;
  }
}
