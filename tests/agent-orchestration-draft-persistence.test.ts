import assert from "node:assert/strict";
import test from "node:test";
import {
  AGENT_ORCHESTRATION_DRAFT_DEBOUNCE_MS,
  createAgentOrchestrationDraftWriter,
  type AgentOrchestrationDraftStatus,
} from "../lib/agent-orchestration/draft-persistence";

class ManualTimers {
  private nextId = 1;
  private readonly callbacks = new Map<number, () => void>();

  schedule = (callback: () => void): number => {
    const id = this.nextId;
    this.nextId += 1;
    this.callbacks.set(id, callback);
    return id;
  };

  cancel = (id: unknown): void => {
    this.callbacks.delete(id as number);
  };

  runAll(): void {
    const pending = [...this.callbacks.values()];
    this.callbacks.clear();
    for (const callback of pending) callback();
  }

  get size(): number {
    return this.callbacks.size;
  }
}

test("pending Course 15 drafts debounce write storms and persist only the latest value", () => {
  const timers = new ManualTimers();
  const statuses: AgentOrchestrationDraftStatus[] = [];
  const writes: string[] = [];
  const writer = createAgentOrchestrationDraftWriter({
    delayMs: AGENT_ORCHESTRATION_DRAFT_DEBOUNCE_MS,
    schedule: timers.schedule,
    cancel: timers.cancel,
    onStatus: (status) => statuses.push(status),
  });

  for (let index = 0; index < 40; index += 1) {
    const value = `artifact-${index}`;
    writer.queue(() => {
      writes.push(value);
      return true;
    });
  }

  assert.equal(timers.size, 1);
  assert.deepEqual(writes, []);
  assert.deepEqual(statuses, ["editing"]);
  timers.runAll();
  assert.deepEqual(writes, ["artifact-39"]);
  assert.deepEqual(statuses, ["editing", "saving", "draft-saved"]);
  assert.equal(writer.status, "draft-saved");
});

test("blur/navigation flush once and accepted evidence cancels stale pending writes", () => {
  const timers = new ManualTimers();
  const statuses: AgentOrchestrationDraftStatus[] = [];
  let writes = 0;
  const writer = createAgentOrchestrationDraftWriter({
    schedule: timers.schedule,
    cancel: timers.cancel,
    onStatus: (status) => statuses.push(status),
  });

  writer.queue(() => {
    writes += 1;
    return true;
  });
  assert.equal(writer.flush(), true);
  assert.equal(writer.flush(), null);
  assert.equal(writes, 1);
  assert.equal(timers.size, 0);

  writer.queue(() => {
    writes += 1;
    return true;
  });
  writer.markEvidenceAccepted();
  assert.equal(writer.status, "evidence-accepted");
  timers.runAll();
  assert.equal(writes, 1, "a stale timer must never recreate pending work after acceptance");
  assert.deepEqual(statuses, [
    "editing",
    "saving",
    "draft-saved",
    "editing",
    "evidence-accepted",
  ]);
});

test("failed persistence remains honestly editable and unmount disposal flushes dirty work", () => {
  const timers = new ManualTimers();
  const statuses: AgentOrchestrationDraftStatus[] = [];
  let writes = 0;
  const writer = createAgentOrchestrationDraftWriter({
    schedule: timers.schedule,
    cancel: timers.cancel,
    onStatus: (status) => statuses.push(status),
  });

  writer.queue(() => false);
  assert.equal(writer.flush(), false);
  assert.equal(writer.status, "editing");
  assert.deepEqual(statuses, ["editing", "saving", "editing"]);

  writer.queue(() => {
    writes += 1;
    return true;
  });
  writer.dispose(true);
  assert.equal(writes, 1);
  assert.equal(timers.size, 0);
  assert.equal(writer.status, "draft-saved");
});
