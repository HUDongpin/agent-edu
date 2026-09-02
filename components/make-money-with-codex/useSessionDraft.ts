"use client";

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { MakeMoneyWithCodexSessionDraftKey } from "@/lib/make-money-session-draft-contract";
import {
  clearIncomeSessionDraft,
  isIncomeSessionDraftStorageAvailable,
  readIncomeSessionDraft,
  subscribeToIncomeSessionDraftReset,
  writeIncomeSessionDraft,
} from "./session-draft-store";

export type SessionDraftStatus = "checking" | "available" | "unavailable";

export default function useSessionDraft<T>({
  storageKey,
  initialValue,
  parse,
}: {
  storageKey: MakeMoneyWithCodexSessionDraftKey;
  initialValue: T;
  parse: (value: unknown) => T | null;
}): {
  value: T;
  setValue: Dispatch<SetStateAction<T>>;
  clear: () => void;
  status: SessionDraftStatus;
} {
  const [value, setValue] = useState<T>(initialValue);
  const [status, setStatus] = useState<SessionDraftStatus>("checking");
  const initialRef = useRef(initialValue);
  const initializedRef = useRef(false);
  const dirtyRef = useRef(false);
  const schemaWritableRef = useRef(true);

  useEffect(() => {
    initialRef.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    let frame = 0;
    const applyStoredDraft = () => {
      const storageAvailable = isIncomeSessionDraftStorageAvailable();
      const snapshot = readIncomeSessionDraft(storageKey);
      let restored: T | null = null;
      let schemaValid = true;
      if (snapshot.raw !== null) {
        try {
          restored = parse(JSON.parse(snapshot.raw) as unknown);
          schemaValid = restored !== null;
        } catch {
          schemaValid = false;
        }
      }
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (!dirtyRef.current) {
          setValue(restored ?? initialRef.current);
        }
        schemaWritableRef.current = schemaValid;
        initializedRef.current = true;
        setStatus(
          storageAvailable && snapshot.persisted && schemaValid
            ? "available"
            : "unavailable",
        );
      });
    };

    applyStoredDraft();
    const unsubscribe = subscribeToIncomeSessionDraftReset(() => {
      // A confirmed progress reset owns these drafts and must win over any
      // pending write from the pre-reset render.
      dirtyRef.current = false;
      schemaWritableRef.current = true;
      applyStoredDraft();
    });
    return () => {
      unsubscribe();
      window.cancelAnimationFrame(frame);
    };
  }, [parse, storageKey]);

  useEffect(() => {
    if (!initializedRef.current || !dirtyRef.current || !schemaWritableRef.current) return;
    dirtyRef.current = false;
    let nextStatus: SessionDraftStatus = "unavailable";
    try {
      const normalized = parse(value as unknown);
      if (normalized !== null) {
        const result = writeIncomeSessionDraft(storageKey, JSON.stringify(normalized));
        nextStatus = result.persisted ? "available" : "unavailable";
      }
    } catch {}
    const frame = window.requestAnimationFrame(() => setStatus(nextStatus));
    return () => window.cancelAnimationFrame(frame);
  }, [parse, status, storageKey, value]);

  const setDraftValue = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    dirtyRef.current = true;
    setValue(next);
  }, []);

  const clear = useCallback(() => {
    const result = clearIncomeSessionDraft(storageKey);
    if (!result.persisted) {
      setStatus("unavailable");
      return;
    }
    dirtyRef.current = false;
    schemaWritableRef.current = true;
    setValue(initialRef.current);
    setStatus(isIncomeSessionDraftStorageAvailable() ? "available" : "unavailable");
  }, [storageKey]);

  return { value, setValue: setDraftValue, clear, status };
}
