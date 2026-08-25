export const LAB_DRAFT_KEY = "ae.lab.draft.v1";

export interface LabDraftV1 {
  version: 1;
  stage: number;
  rules: string;
  prompt: string;
  completedPreviewIds: string[];
  savedAt: string;
}

export interface LabDraftInput {
  stage: number;
  rules: string;
  prompt: string;
  completedPreviewIds: string[];
}

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// 32 UI rules × 160 characters can expand when JSON escapes quotes or
// backslashes. Keep this above the proven encoded worst case while retaining
// a small, explicit localStorage bound.
export const LAB_DRAFT_MAX_RULES_LENGTH = 16_000;
export const LAB_DRAFT_MAX_PROMPT_LENGTH = 20_000;
const MAX_PREVIEW_IDS = 32;
const PREVIEW_ID = /^[a-z0-9][a-z0-9._:-]{0,63}$/i;

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

function previewIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > MAX_PREVIEW_IDS) return null;
  const out: string[] = [];
  for (const candidate of value) {
    if (typeof candidate !== "string" || !PREVIEW_ID.test(candidate)) return null;
    if (!out.includes(candidate)) out.push(candidate);
  }
  return out;
}

export function decodeLabDraft(value: unknown): LabDraftV1 | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const draft = value as Record<string, unknown>;
  const ids = previewIds(draft.completedPreviewIds);
  if (
    draft.version !== 1 ||
    !Number.isInteger(draft.stage) ||
    Number(draft.stage) < 0 ||
    Number(draft.stage) > 3 ||
    typeof draft.rules !== "string" ||
    draft.rules.length > LAB_DRAFT_MAX_RULES_LENGTH ||
    typeof draft.prompt !== "string" ||
    draft.prompt.length > LAB_DRAFT_MAX_PROMPT_LENGTH ||
    ids === null ||
    !validDate(draft.savedAt)
  ) {
    return null;
  }

  return {
    version: 1,
    stage: Number(draft.stage),
    rules: draft.rules,
    prompt: draft.prompt,
    completedPreviewIds: ids,
    savedAt: draft.savedAt,
  };
}

export function readLabDraft(storage: DraftStorage | null = browserStorage()): LabDraftV1 | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(LAB_DRAFT_KEY);
    if (raw === null) return null;
    return decodeLabDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeLabDraft(
  input: LabDraftInput,
  storage: DraftStorage | null = browserStorage(),
  now: () => Date = () => new Date(),
): LabDraftV1 | null {
  if (!storage) return null;
  const candidate = decodeLabDraft({
    version: 1,
    stage: input.stage,
    rules: input.rules,
    prompt: input.prompt,
    completedPreviewIds: input.completedPreviewIds,
    savedAt: now().toISOString(),
  });
  if (!candidate) return null;

  try {
    storage.setItem(LAB_DRAFT_KEY, JSON.stringify(candidate));
    return candidate;
  } catch {
    return null;
  }
}

export function clearLabDraft(storage: DraftStorage | null = browserStorage()): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(LAB_DRAFT_KEY);
    return true;
  } catch {
    return false;
  }
}
