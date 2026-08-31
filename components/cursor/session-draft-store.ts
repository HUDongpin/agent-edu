type SessionDraftValidator<T> = (value: unknown) => value is T;

export const CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY = "ae.cursor.final-quiz-attempt.v1";
export const CURSOR_CAPSTONE_DRAFT_STORAGE_KEY = "ae.cursor.capstone-assessment.v1";
export const CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY = "ae.cursor.capstone-receipt-memory.v1";
export const CURSOR_ASSESSMENT_DRAFT_RESET_EVENT = "ae:cursor-assessment-drafts-reset";
export const CURSOR_ASSESSMENT_DRAFT_CHANGE_EVENT = "ae:cursor-assessment-drafts-change";

const memoryDrafts = new Map<string, unknown>();
const assessmentDraftKeys = [
  CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY,
  CURSOR_CAPSTONE_DRAFT_STORAGE_KEY,
  CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY,
] as const;

export function hasCursorAssessmentDrafts(): boolean {
  if (typeof window === "undefined") return false;
  if (assessmentDraftKeys.some((key) => memoryDrafts.has(key))) return true;
  try {
    return assessmentDraftKeys.some((key) => window.sessionStorage.getItem(key) !== null);
  } catch {
    return false;
  }
}

function notifyDraftPresenceChange(previous: boolean): void {
  if (typeof window !== "undefined" && previous !== hasCursorAssessmentDrafts()) {
    window.dispatchEvent(new Event(CURSOR_ASSESSMENT_DRAFT_CHANGE_EVENT));
  }
}

export function subscribeToCursorAssessmentDrafts(listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(CURSOR_ASSESSMENT_DRAFT_CHANGE_EVENT, listener);
  return () => window.removeEventListener(CURSOR_ASSESSMENT_DRAFT_CHANGE_EVENT, listener);
}

function removeSessionDraft(storageKey: string): void {
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // The assessment remains usable in memory when session storage is denied.
  }
}

export function readSessionDraft<T>(
  storageKey: string,
  validate: SessionDraftValidator<T>,
): T | null {
  if (typeof window === "undefined") return null;
  const previouslyPresent = hasCursorAssessmentDrafts();

  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw);
      if (validate(parsed)) {
        memoryDrafts.set(storageKey, parsed);
        return parsed;
      }
    }
  } catch {
    // Malformed or unavailable storage must never hydrate assessment state.
  }

  removeSessionDraft(storageKey);
  const memoryDraft = memoryDrafts.get(storageKey);
  if (validate(memoryDraft)) return memoryDraft;
  memoryDrafts.delete(storageKey);
  notifyDraftPresenceChange(previouslyPresent);
  return null;
}

export function writeSessionDraft(storageKey: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  const previouslyPresent = hasCursorAssessmentDrafts();

  // Keep a same-document fallback so App Router navigation cannot erase a
  // live draft when sessionStorage is denied. Full document exits are guarded
  // by the assessment components when this function reports false.
  memoryDrafts.set(storageKey, value);

  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(value));
    notifyDraftPresenceChange(previouslyPresent);
    return true;
  } catch {
    // The current React state remains the session-only fallback.
    notifyDraftPresenceChange(previouslyPresent);
    return false;
  }
}

export function clearSessionDraft(storageKey: string): void {
  const previouslyPresent = hasCursorAssessmentDrafts();
  memoryDrafts.delete(storageKey);
  if (typeof window === "undefined") return;
  removeSessionDraft(storageKey);
  notifyDraftPresenceChange(previouslyPresent);
}

export function readMemoryDraft<T>(storageKey: string): T | null {
  return (memoryDrafts.get(storageKey) as T | undefined) ?? null;
}

export function writeMemoryDraft(storageKey: string, value: unknown): void {
  const previouslyPresent = hasCursorAssessmentDrafts();
  memoryDrafts.set(storageKey, value);
  notifyDraftPresenceChange(previouslyPresent);
}

export function clearCursorAssessmentDrafts(): void {
  clearSessionDraft(CURSOR_FINAL_QUIZ_DRAFT_STORAGE_KEY);
  clearSessionDraft(CURSOR_CAPSTONE_DRAFT_STORAGE_KEY);
  clearSessionDraft(CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CURSOR_ASSESSMENT_DRAFT_RESET_EVENT));
  }
}
