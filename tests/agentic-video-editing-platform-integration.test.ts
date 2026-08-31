import assert from "node:assert/strict";
import test from "node:test";
import {
  AGENTIC_VIDEO_EDITING_CORRUPT_BACKUP_KEY,
  AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY,
} from "../lib/progress-agentic-video-editing";
import {
  readAgenticVideoEditingProgress,
  resetAgenticVideoEditingProgressAfterGlobalReset,
  writeAgenticVideoEditingProgress,
} from "../components/agentic-video-editing/progress-store";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

class BrowserEvents extends EventTarget {
  constructor(
    readonly localStorage: Storage,
    readonly sessionStorage: Storage,
  ) {
    super();
  }
}

async function withBrowser(
  run: (local: MemoryStorage, session: MemoryStorage) => void | Promise<void>,
): Promise<void> {
  const local = new MemoryStorage();
  const session = new MemoryStorage();
  const browser = new BrowserEvents(local, session);
  const descriptors = {
    window: Object.getOwnPropertyDescriptor(globalThis, "window"),
    localStorage: Object.getOwnPropertyDescriptor(globalThis, "localStorage"),
    sessionStorage: Object.getOwnPropertyDescriptor(globalThis, "sessionStorage"),
  };
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: local });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: session });
  try {
    await run(local, session);
  } finally {
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
}

test("Course 20 shared-store writes and reset stay inside the closed ownership boundary", async () => {
  await withBrowser((local, session) => {
    local.setItem(AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY, JSON.stringify({
      "github.lesson.start-secure": true,
      "agentic-video-editing.unregistered": "drop",
    }));
    session.setItem("agentic-video-editing:1.2.0:scratch:test", "private draft");
    session.setItem("unrelated.session", "keep");

    const normalized = readAgenticVideoEditingProgress();
    assert.equal(normalized["github.lesson.start-secure"], true);
    assert.equal("agentic-video-editing.unregistered" in normalized, false);
    normalized["agentic-video-editing.v2.assessment.best"] = 8;
    assert.equal(writeAgenticVideoEditingProgress(normalized), true);

    const concurrent = JSON.parse(
      local.getItem(AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY) ?? "{}",
    ) as Record<string, unknown>;
    concurrent["claude.concurrent-write"] = true;
    local.setItem(AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY, JSON.stringify(concurrent));
    assert.equal(writeAgenticVideoEditingProgress(normalized), true);
    const merged = JSON.parse(
      local.getItem(AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY) ?? "{}",
    ) as Record<string, unknown>;
    assert.equal(merged["github.lesson.start-secure"], true);
    assert.equal(merged["claude.concurrent-write"], true);

    assert.deepEqual(resetAgenticVideoEditingProgressAfterGlobalReset(), {
      persisted: true,
    });
    const afterReset = JSON.parse(
      local.getItem(AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY) ?? "{}",
    ) as Record<string, unknown>;
    assert.equal(Object.keys(afterReset).some((key) => key.startsWith("agentic-video-editing.")), false);
    assert.equal(afterReset["github.lesson.start-secure"], true);
    assert.equal(afterReset["claude.concurrent-write"], true);
    assert.equal(session.getItem("agentic-video-editing:1.2.0:scratch:test"), null);
    assert.equal(session.getItem("unrelated.session"), "keep");
  });
});

test("Course 20 refuses to overwrite or reset an unreadable shared record", async () => {
  await withBrowser((local, session) => {
    local.setItem(AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY, "{corrupt-shared-record");
    assert.equal(writeAgenticVideoEditingProgress({}), false);
    assert.equal(
      local.getItem(AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY),
      "{corrupt-shared-record",
    );
    assert.equal(
      session.getItem(AGENTIC_VIDEO_EDITING_CORRUPT_BACKUP_KEY),
      "{corrupt-shared-record",
    );
    assert.deepEqual(resetAgenticVideoEditingProgressAfterGlobalReset(), {
      persisted: false,
      reason: "corrupt",
    });
    assert.equal(
      local.getItem(AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY),
      "{corrupt-shared-record",
    );
  });
});
