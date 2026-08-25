"use client";

import { useSyncExternalStore } from "react";
import {
  EMPTY_INCOME_PROGRESS,
  incomeStorageAvailable,
  readIncomeProgress,
  subscribeToIncomeProgress,
} from "./progress-store";

export default function useIncomeProgress() {
  return useSyncExternalStore(
    subscribeToIncomeProgress,
    readIncomeProgress,
    () => EMPTY_INCOME_PROGRESS,
  );
}

export function useIncomeHydrated(): boolean {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

export function useIncomeStorageAvailable(): boolean {
  return useSyncExternalStore(
    () => () => undefined,
    incomeStorageAvailable,
    () => true,
  );
}
