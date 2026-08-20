import assert from "node:assert/strict";
import test from "node:test";
import { ProviderError } from "../lib/byok/types";
import { LabRunner, type LabRunTask } from "../lib/lab/runner";

function ids() {
  let value = 0;
  return () => `run-${++value}`;
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((yes) => { resolve = yes; });
  return { promise, resolve };
}

test("runner preserves order and never exceeds concurrency four", async () => {
  const runner = new LabRunner(ids());
  let active = 0;
  let maximum = 0;
  const tasks: LabRunTask<number>[] = Array.from({ length: 12 }, (_, index) => ({
    id: String(index),
    async run() {
      active++;
      maximum = Math.max(maximum, active);
      await new Promise((resolve) => setTimeout(resolve, 3));
      active--;
      return index;
    },
  }));

  const handle = runner.start(tasks, {
    concurrency: 99,
    onContentFailure: () => -1,
  });
  const outcome = await handle.promise;
  assert.equal(outcome.status, "completed");
  assert.equal(maximum, 4);
  assert.deepEqual(outcome.results, Array.from({ length: 12 }, (_, index) => index));
});

test("Stop aborts at most four in flight and schedules nothing new", async () => {
  const runner = new LabRunner(ids());
  let started = 0;
  const tasks: LabRunTask<number>[] = Array.from({ length: 20 }, (_, index) => ({
    id: String(index),
    async run({ signal }) {
      started++;
      return new Promise<number>((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(new ProviderError("aborted", "stopped", {
          billing: "unknown-after-send",
        })), { once: true });
      });
    },
  }));

  const handle = runner.start(tasks, {
    concurrency: 4,
    onContentFailure: () => -1,
  });
  assert.equal(started, 4);
  assert.equal(runner.stop(handle.runId), true);
  const outcome = await handle.promise;
  assert.equal(outcome.status, "cancelled");
  assert.equal(outcome.results, undefined);
  assert.equal(outcome.inFlightAtStop, 4);
  assert.equal(started, 4);
});

test("the first fatal ProviderError fails fast and starts no later work", async () => {
  const runner = new LabRunner(ids());
  let started = 0;
  const tasks: LabRunTask<number>[] = Array.from({ length: 20 }, (_, index) => ({
    id: String(index),
    async run({ signal }) {
      started++;
      if (index === 0) {
        throw new ProviderError("auth", "bad key", {
          billing: "provider-rejected-no-usage",
          httpStatus: 401,
        });
      }
      return new Promise<number>((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(new ProviderError("aborted", "stopped", {
          billing: "unknown-after-send",
        })), { once: true });
      });
    },
  }));

  const outcome = await runner.start(tasks, {
    concurrency: 4,
    onContentFailure: () => -1,
  }).promise;
  assert.equal(outcome.status, "failed");
  assert.equal(outcome.error?.code, "auth");
  assert.equal(outcome.results, undefined);
  assert.ok(started <= 4);
});

test("invalid, empty and ordinary content failures continue to a complete result", async () => {
  const runner = new LabRunner(ids());
  const tasks: LabRunTask<number>[] = [
    { id: "ok", async run() { return 1; } },
    { id: "invalid", async run() {
      throw new ProviderError("invalid-response", "bad JSON", { billing: "usage-confirmed" });
    } },
    { id: "empty", async run() {
      throw new ProviderError("empty-response", "empty", { billing: "usage-confirmed" });
    } },
    { id: "parse", async run() { throw new SyntaxError("bad object"); } },
  ];

  const outcome = await runner.start(tasks, {
    concurrency: 4,
    onContentFailure: () => 0,
  }).promise;
  assert.equal(outcome.status, "completed");
  assert.deepEqual(outcome.results, [1, 0, 0, 0]);
  assert.equal(outcome.completedTasks, 4);
});

test("worker checkpoint prevents a judge after Stop", async () => {
  const runner = new LabRunner(ids());
  const generatorFinished = deferred();
  let generators = 0;
  let judges = 0;
  const task: LabRunTask<number> = {
    id: "generator-then-judge",
    async run(context) {
      context.checkpoint();
      generators++;
      await generatorFinished.promise;
      context.checkpoint();
      judges++;
      return 1;
    },
  };

  const handle = runner.start([task], {
    onContentFailure: () => 0,
  });
  assert.equal(generators, 1);
  runner.stop(handle.runId);
  generatorFinished.resolve();
  const outcome = await handle.promise;
  assert.equal(outcome.status, "cancelled");
  assert.equal(judges, 0);
});

test("a newer run supersedes the old run and blocks all late progress", async () => {
  const runner = new LabRunner(ids());
  const late = deferred();
  let oldProgress = 0;
  const old = runner.start([{
    id: "old",
    async run() { await late.promise; return "old"; },
  }], {
    onContentFailure: () => "old failure",
    onProgress: () => { oldProgress++; },
  });

  const current = runner.start([{
    id: "new",
    async run() { return "new"; },
  }], {
    onContentFailure: () => "new failure",
  });
  const currentOutcome = await current.promise;
  assert.equal(currentOutcome.status, "completed");
  assert.deepEqual(currentOutcome.results, ["new"]);
  assert.equal(runner.isCurrent(current.runId), true);
  assert.equal(runner.isCurrent(old.runId), false);

  late.resolve();
  const oldOutcome = await old.promise;
  assert.equal(oldOutcome.status, "superseded");
  assert.equal(oldOutcome.results, undefined);
  assert.equal(oldProgress, 0);
});
