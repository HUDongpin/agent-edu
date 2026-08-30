"use client";

import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type SessionDraftStatus = "checking" | "available" | "unavailable";

export default function useSessionDraft<T>({
  storageKey,
  initialValue,
  parse,
}: {
  storageKey: string;
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

  useEffect(() => {
    initialRef.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    let restored: T | null = null;
    let nextStatus: SessionDraftStatus = "available";
    try {
      const probeKey = `${storageKey}.probe`;
      window.sessionStorage.setItem(probeKey, "1");
      window.sessionStorage.removeItem(probeKey);
      const raw = window.sessionStorage.getItem(storageKey);
      if (raw !== null) {
        restored = parse(JSON.parse(raw) as unknown);
      }
    } catch {
      nextStatus = "unavailable";
    }
    const frame = window.requestAnimationFrame(() => {
      if (restored !== null) setValue(restored);
      setStatus(nextStatus);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [parse, storageKey]);

  useEffect(() => {
    if (status !== "available") return;
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      const frame = window.requestAnimationFrame(() => setStatus("unavailable"));
      return () => window.cancelAnimationFrame(frame);
    }
    return undefined;
  }, [status, storageKey, value]);

  const clear = useCallback(() => {
    setValue(initialRef.current);
    try {
      window.sessionStorage.removeItem(storageKey);
    } catch {
      setStatus("unavailable");
    }
  }, [storageKey]);

  return { value, setValue, clear, status };
}
