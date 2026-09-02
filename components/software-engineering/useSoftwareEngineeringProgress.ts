"use client";

import { useSyncExternalStore } from "react";
import {
  isSoftwareEngineeringStorageAvailable,
  readSoftwareEngineeringProgressSnapshot,
  subscribeSoftwareEngineeringProgress,
  type SoftwareEngineeringProgressRecord,
} from "./progress-store";

function serverSnapshot(): string {
  return "{}";
}

function storageServerSnapshot(): boolean {
  return true;
}

export default function useSoftwareEngineeringProgress(): SoftwareEngineeringProgressRecord {
  const serialized = useSyncExternalStore(
    subscribeSoftwareEngineeringProgress,
    readSoftwareEngineeringProgressSnapshot,
    serverSnapshot,
  );
  try {
    const value: unknown = JSON.parse(serialized);
    return value && typeof value === "object" && !Array.isArray(value)
      ? value as SoftwareEngineeringProgressRecord
      : {};
  } catch {
    return {};
  }
}

export function useSoftwareEngineeringStorageAvailable(): boolean {
  return useSyncExternalStore(
    subscribeSoftwareEngineeringProgress,
    isSoftwareEngineeringStorageAvailable,
    storageServerSnapshot,
  );
}
