import { PROG } from "@/lib/progress";
import {
  MATH_ANIMATION_PROGRESS_EVENT,
  MATH_ANIMATION_PROGRESS_PREFIX,
  MATH_ANIMATION_PROGRESS_RESET_EVENT,
  MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY,
  MATH_ANIMATION_PROGRESS_VERSION,
  MATH_ANIMATION_PROGRESS_VERSION_KEY,
  normalizeMathAnimationProgress,
} from "@/lib/math-animation";

export const MATH_ANIMATION_PROGRESS_STORAGE_KEY = PROG;
export type MathAnimationProgressRecord = Record<string, unknown>;

const STORAGE_PROBE_KEY = "__aicourse_math_animation_storage_probe__";
const CORRUPT_BACKUP_KEY = "ae.progress.math-animation-corrupt-backup";
let memoryProgress: MathAnimationProgressRecord = {};
let storageAvailable: boolean | null = null;

export function isMathAnimationProgressStorageEvent(
  event: Pick<StorageEvent, "key" | "storageArea">,
): boolean {
  return typeof window !== "undefined"
    && event.storageArea === window.localStorage
    && (event.key === MATH_ANIMATION_PROGRESS_STORAGE_KEY || event.key === null);
}

function repairCorruptProgress(raw: string | null): MathAnimationProgressRecord {
  memoryProgress = normalizeMathAnimationProgress({});
  if (raw) {
    try {
      sessionStorage.setItem(CORRUPT_BACKUP_KEY, raw);
    } catch {
      // The in-memory record remains usable when both browser stores are blocked.
    }
  }
  try {
    localStorage.setItem(MATH_ANIMATION_PROGRESS_STORAGE_KEY, JSON.stringify(memoryProgress));
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return memoryProgress;
}

export function isMathAnimationStorageAvailable(): boolean {
  if (typeof window === "undefined") return true;
  if (storageAvailable !== null) return storageAvailable;
  try {
    localStorage.setItem(STORAGE_PROBE_KEY, "1");
    localStorage.removeItem(STORAGE_PROBE_KEY);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

export function readMathAnimationProgress(): MathAnimationProgressRecord {
  if (typeof window === "undefined" || !isMathAnimationStorageAvailable()) {
    return { ...memoryProgress };
  }
  try {
    const raw = localStorage.getItem(MATH_ANIMATION_PROGRESS_STORAGE_KEY);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw || "{}");
    } catch {
      parsed = repairCorruptProgress(raw);
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      parsed = repairCorruptProgress(raw);
    }
    const candidate = parsed as MathAnimationProgressRecord;
    memoryProgress = normalizeMathAnimationProgress(candidate);
    if (candidate[MATH_ANIMATION_PROGRESS_VERSION_KEY] !== MATH_ANIMATION_PROGRESS_VERSION) {
      localStorage.setItem(MATH_ANIMATION_PROGRESS_STORAGE_KEY, JSON.stringify(memoryProgress));
    }
  } catch {
    storageAvailable = false;
  }
  return { ...memoryProgress };
}

export function writeMathAnimationProgress(record: MathAnimationProgressRecord): boolean {
  memoryProgress = normalizeMathAnimationProgress({
    ...record,
    [MATH_ANIMATION_PROGRESS_VERSION_KEY]: MATH_ANIMATION_PROGRESS_VERSION,
  });
  let persisted = false;
  try {
    if (isMathAnimationStorageAvailable()) {
      localStorage.setItem(MATH_ANIMATION_PROGRESS_STORAGE_KEY, JSON.stringify(memoryProgress));
      persisted = true;
    }
  } catch {
    storageAvailable = false;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MATH_ANIMATION_PROGRESS_EVENT, {
      detail: { persisted },
    }));
  }
  return persisted;
}

export function updateMathAnimationProgress(
  mutator: (record: MathAnimationProgressRecord) => void,
): boolean {
  const record = readMathAnimationProgress();
  mutator(record);
  return writeMathAnimationProgress(record);
}

export function resetMathAnimationProgress(): boolean {
  const record = readMathAnimationProgress();
  const previousGeneration = typeof record[MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY] === "number"
    && Number.isSafeInteger(record[MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY])
    ? record[MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY] as number
    : 0;
  for (const key of Object.keys(record)) {
    if (key.startsWith(MATH_ANIMATION_PROGRESS_PREFIX)) delete record[key];
  }
  record[MATH_ANIMATION_PROGRESS_RESET_GENERATION_KEY] = previousGeneration < Number.MAX_SAFE_INTEGER
    ? previousGeneration + 1
    : 1;
  const persisted = writeMathAnimationProgress(record);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MATH_ANIMATION_PROGRESS_RESET_EVENT, {
      detail: { persisted },
    }));
  }
  return persisted;
}
