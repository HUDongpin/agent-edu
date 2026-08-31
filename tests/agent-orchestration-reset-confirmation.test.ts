import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  AGENT_ORCHESTRATION_RESET_CONFIRMATION_MS,
  createAgentOrchestrationResetConfirmation,
  type AgentOrchestrationResetConfirmationState,
} from "../components/agent-orchestration/useExpiringResetConfirmation";

class ManualTimers {
  private nextId = 1;
  private readonly callbacks = new Map<number, () => void>();
  readonly delays: number[] = [];

  schedule = (callback: () => void, delayMs: number): number => {
    const id = this.nextId;
    this.nextId += 1;
    this.callbacks.set(id, callback);
    this.delays.push(delayMs);
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

test("reset confirmation expires after the named interval without authorizing reset", () => {
  const timers = new ManualTimers();
  const states: AgentOrchestrationResetConfirmationState[] = [];
  const confirmation = createAgentOrchestrationResetConfirmation({
    schedule: timers.schedule,
    cancel: timers.cancel,
    onStateChange: (state) => states.push(state),
  });

  confirmation.arm();
  assert.equal(AGENT_ORCHESTRATION_RESET_CONFIRMATION_MS, 10_000);
  assert.equal(confirmation.state, "confirming");
  assert.equal(timers.size, 1);
  assert.deepEqual(timers.delays, [AGENT_ORCHESTRATION_RESET_CONFIRMATION_MS]);

  timers.runAll();

  assert.equal(confirmation.state, "expired");
  assert.equal(confirmation.consumeConfirmation(), false);
  assert.deepEqual(states, ["confirming", "expired"]);
});

test("cancel clears expiry and never authorizes reset", () => {
  const timers = new ManualTimers();
  const confirmation = createAgentOrchestrationResetConfirmation({
    schedule: timers.schedule,
    cancel: timers.cancel,
  });

  confirmation.arm();
  assert.equal(confirmation.cancel(), true);
  assert.equal(confirmation.state, "cancelled");
  assert.equal(timers.size, 0);
  timers.runAll();
  assert.equal(confirmation.state, "cancelled");
  assert.equal(confirmation.consumeConfirmation(), false);
  assert.equal(confirmation.cancel(), false);
});

test("only a live confirmation can be consumed, once", () => {
  const timers = new ManualTimers();
  const confirmation = createAgentOrchestrationResetConfirmation({
    schedule: timers.schedule,
    cancel: timers.cancel,
  });

  assert.equal(confirmation.consumeConfirmation(), false);
  confirmation.arm();
  assert.equal(confirmation.consumeConfirmation(), true);
  assert.equal(confirmation.state, "idle");
  assert.equal(timers.size, 0);
  assert.equal(confirmation.consumeConfirmation(), false);
  timers.runAll();
  assert.equal(confirmation.state, "idle");
});

test("rearming replaces the previous timer and disposal clears pending expiry", () => {
  const timers = new ManualTimers();
  const confirmation = createAgentOrchestrationResetConfirmation({
    schedule: timers.schedule,
    cancel: timers.cancel,
  });

  confirmation.arm();
  confirmation.arm();
  assert.equal(timers.size, 1);
  confirmation.dispose();
  assert.equal(timers.size, 0);
  timers.runAll();
  assert.equal(confirmation.state, "confirming");
});

test("a stale cancelled timer cannot expire a newer confirmation", () => {
  const callbacks: Array<() => void> = [];
  const confirmation = createAgentOrchestrationResetConfirmation({
    schedule: (callback) => {
      callbacks.push(callback);
      return callbacks.length;
    },
    cancel: () => {
      // Model a timer already queued by the browser when cancellation occurs.
    },
  });

  confirmation.arm();
  confirmation.arm();
  callbacks[0]?.();
  assert.equal(confirmation.state, "confirming");
  callbacks[1]?.();
  assert.equal(confirmation.state, "expired");
});

test("CourseProgress exposes cancellable keyboard confirmation and gates the reset call", () => {
  const source = readFileSync(
    new URL("../components/agent-orchestration/CourseProgress.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /cancelReset/u);
  assert.match(source, /resetConfirmationOpen/u);
  assert.match(source, /resetCancelled/u);
  assert.match(source, /resetExpired/u);
  assert.match(source, /event\.key === "Escape"/u);
  assert.match(source, /aria-live="polite"/u);
  assert.match(source, /aria-expanded=/u);
  assert.equal(
    source.match(/resetAgentOrchestrationProgressResult\(\)/gu)?.length,
    1,
  );
  assert.match(
    source,
    /if \(resetConfirmation\.consumeConfirmation\(\)\) \{[\s\S]*?resetAgentOrchestrationProgressResult\(\)/u,
  );
});
