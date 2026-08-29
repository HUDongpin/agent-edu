import type { KeyStatus } from "./types";

export const DEEPSEEK_KEY_STORAGE = "ae.ds.key";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface VerificationAttempt {
  revision: number;
}

export interface KeyStore {
  getKey(): string;
  hasKey(): boolean;
  getStatus(): KeyStatus;
  subscribe(listener: () => void): () => void;
  save(value: string): boolean;
  forget(): void;
  reject(options?: { deleteSavedKey?: boolean }): void;
  markUnverified(): void;
  beginVerification(): VerificationAttempt | null;
  finishVerification(
    attempt: VerificationAttempt,
    status: Extract<KeyStatus, "verified" | "rejected" | "unreachable">,
    options?: { deleteSavedKey?: boolean },
  ): boolean;
}

function browserSessionStorage(): StorageLike | undefined {
  try {
    return typeof sessionStorage === "undefined" ? undefined : sessionStorage;
  } catch {
    return undefined;
  }
}

export function createKeyStore(
  storageProvider: () => StorageLike | undefined = browserSessionStorage,
): KeyStore {
  const listeners = new Set<() => void>();
  let explicitStatus: KeyStatus | null = null;
  let revision = 0;

  function notify(): void {
    for (const listener of listeners) listener();
  }

  function read(): string {
    try {
      return storageProvider()?.getItem(DEEPSEEK_KEY_STORAGE) ?? "";
    } catch {
      return "";
    }
  }

  function removeStored(): void {
    try {
      storageProvider()?.removeItem(DEEPSEEK_KEY_STORAGE);
    } catch {
      // A storage failure is represented by the observable empty state.
    }
  }

  return {
    getKey: read,
    hasKey: () => read() !== "",
    getStatus: () => explicitStatus ?? (read() ? "saved-unverified" : "empty"),
    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    save(value) {
      const key = value.trim();
      revision++;
      if (!key) {
        removeStored();
        explicitStatus = "empty";
        notify();
        return false;
      }
      try {
        const storage = storageProvider();
        if (!storage) throw new Error("session storage is unavailable");
        storage.setItem(DEEPSEEK_KEY_STORAGE, key);
        if (storage.getItem(DEEPSEEK_KEY_STORAGE) !== key) {
          throw new Error("session storage did not retain the key");
        }
      } catch {
        removeStored();
        explicitStatus = "empty";
        notify();
        return false;
      }
      explicitStatus = "saved-unverified";
      notify();
      return true;
    },
    forget() {
      revision++;
      removeStored();
      explicitStatus = "empty";
      notify();
    },
    reject(options = {}) {
      revision++;
      if (options.deleteSavedKey) removeStored();
      explicitStatus = "rejected";
      notify();
    },
    markUnverified() {
      revision++;
      explicitStatus = read() ? "saved-unverified" : "empty";
      notify();
    },
    beginVerification() {
      if (!read()) {
        explicitStatus = "empty";
        notify();
        return null;
      }
      explicitStatus = "verifying";
      const attempt = { revision };
      notify();
      return attempt;
    },
    finishVerification(attempt, status, options = {}) {
      if (attempt.revision !== revision) return false;
      if (options.deleteSavedKey) removeStored();
      explicitStatus = status;
      notify();
      return true;
    },
  };
}

export const keyStore = createKeyStore();

export function getKey(): string { return keyStore.getKey(); }
export function hasKey(): boolean { return keyStore.hasKey(); }
export function hasKeyOnServer(): boolean { return false; }
export function keyStatusSnapshot(): KeyStatus { return keyStore.getStatus(); }
export function keyStatusOnServer(): KeyStatus { return "empty"; }
export function subscribeKey(listener: () => void): () => void { return keyStore.subscribe(listener); }
export function markKeyUnverified(): void { keyStore.markUnverified(); }
export function forgetKey(): void { keyStore.forget(); }
