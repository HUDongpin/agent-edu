import {
  PRODUCT_MANAGEMENT_PROGRESS_EVENT,
  PRODUCT_MANAGEMENT_PROGRESS_PREFIX,
  PRODUCT_MANAGEMENT_PROGRESS_RESET_EVENT,
  PRODUCT_MANAGEMENT_PROGRESS_VERSION,
  PRODUCT_MANAGEMENT_PROGRESS_VERSION_KEY,
  isCurrentProductManagementProgress,
} from "@/lib/product-management";

export const PRODUCT_MANAGEMENT_PROGRESS_STORAGE_KEY = "ae.progress";
export type ProductManagementProgressRecord = Record<string, unknown>;

const STORAGE_PROBE_KEY = "__aicourse_product_management_storage_probe__";
const CORRUPT_BACKUP_KEY = "ae.progress.product-management-corrupt-backup";
let memoryProgress: ProductManagementProgressRecord = {};
let storageAvailable: boolean | null = null;

function holdCorruptProgress(raw: string | null): void {
  memoryProgress = {};
  if (raw) {
    try {
      sessionStorage.setItem(CORRUPT_BACKUP_KEY, raw);
    } catch {
      // Preserve the unreadable shared record when session storage is unavailable.
    }
  }
  storageAvailable = false;
}

export function isProductManagementStorageAvailable(): boolean {
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

export function readProductManagementProgress(): ProductManagementProgressRecord {
  if (typeof window === "undefined" || !isProductManagementStorageAvailable()) {
    return { ...memoryProgress };
  }
  try {
    const raw = localStorage.getItem(PRODUCT_MANAGEMENT_PROGRESS_STORAGE_KEY);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw || "{}");
    } catch {
      holdCorruptProgress(raw);
      return { ...memoryProgress };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      holdCorruptProgress(raw);
      return { ...memoryProgress };
    }
    memoryProgress = { ...(parsed as ProductManagementProgressRecord) };
  } catch {
    storageAvailable = false;
  }
  return { ...memoryProgress };
}

export function writeProductManagementProgress(
  record: ProductManagementProgressRecord,
): boolean {
  memoryProgress = {
    ...record,
    [PRODUCT_MANAGEMENT_PROGRESS_VERSION_KEY]: PRODUCT_MANAGEMENT_PROGRESS_VERSION,
  };
  let persisted = false;
  try {
    if (isProductManagementStorageAvailable()) {
      localStorage.setItem(
        PRODUCT_MANAGEMENT_PROGRESS_STORAGE_KEY,
        JSON.stringify(memoryProgress),
      );
      persisted = true;
    }
  } catch {
    storageAvailable = false;
  }
  window.dispatchEvent(new CustomEvent(PRODUCT_MANAGEMENT_PROGRESS_EVENT));
  return persisted;
}

export function updateProductManagementProgress(
  mutator: (record: ProductManagementProgressRecord) => void,
): boolean {
  const record = readProductManagementProgress();
  if (!isCurrentProductManagementProgress(record)) {
    for (const key of Object.keys(record)) {
      if (key.startsWith(PRODUCT_MANAGEMENT_PROGRESS_PREFIX)) delete record[key];
    }
  }
  mutator(record);
  return writeProductManagementProgress(record);
}

export function resetProductManagementProgress(): boolean {
  const record = readProductManagementProgress();
  for (const key of Object.keys(record)) {
    if (key.startsWith(PRODUCT_MANAGEMENT_PROGRESS_PREFIX)) delete record[key];
  }
  const persisted = writeProductManagementProgress(record);
  window.dispatchEvent(new CustomEvent(PRODUCT_MANAGEMENT_PROGRESS_RESET_EVENT));
  return persisted;
}
