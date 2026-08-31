import assert from "node:assert/strict";
import test from "node:test";
import {
  AGENT_ORCHESTRATION_CAPSTONE_RECOVERY_KEY,
  AGENT_ORCHESTRATION_PROGRESS_MIGRATION_NOTICE_KEY,
  AGENT_ORCHESTRATION_PROGRESS_RECOVERY_ENVELOPE_KEY,
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA,
  migrateAgentOrchestrationProgressRecord,
} from "../lib/progress-topology";
import {
  AGENT_ORCHESTRATION_CORRUPT_PROGRESS_BACKUP_KEY,
  AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY,
} from "../lib/progress-storage-contract";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, String(value)); }
}

type StorageOperation = "getItem" | "setItem" | "removeItem";

class FaultingStorage extends MemoryStorage {
  private readonly faults = new Map<string, string>();
  private readonly replacementsAfterRead = new Map<string, string>();

  fail(operation: StorageOperation, key: string, name = "Error"): void {
    this.faults.set(`${operation}:${key}`, name);
  }

  allow(operation: StorageOperation, key: string): void {
    this.faults.delete(`${operation}:${key}`);
  }

  replaceAfterNextRead(key: string, replacement: string): void {
    this.replacementsAfterRead.set(key, replacement);
  }

  private throwIfFaulted(operation: StorageOperation, key: string): void {
    const name = this.faults.get(`${operation}:${key}`);
    if (!name) return;
    const error = new Error(`${operation} unavailable`);
    error.name = name;
    throw error;
  }

  override getItem(key: string): string | null {
    this.throwIfFaulted("getItem", key);
    const value = super.getItem(key);
    const replacement = this.replacementsAfterRead.get(key);
    if (replacement !== undefined) {
      this.replacementsAfterRead.delete(key);
      super.setItem(key, replacement);
    }
    return value;
  }

  override setItem(key: string, value: string): void {
    this.throwIfFaulted("setItem", key);
    super.setItem(key, value);
  }

  override removeItem(key: string): void {
    this.throwIfFaulted("removeItem", key);
    super.removeItem(key);
  }
}

class BrowserWindow extends EventTarget {
  constructor(
    readonly localStorage: Storage,
    readonly sessionStorage: Storage,
  ) {
    super();
  }
}

test("Course 15 migration preserves authored work and invalidates stale receipts", () => {
  const migratedAt = "2026-08-30T04:05:06.789Z";
  const slug = "workflow-agent-boundary";
  const acceptedLabKey = `agent-orchestration.module.${slug}.lab.workflow-agent-boundary-lab`;
  const recoveredLabKey = `${acceptedLabKey}.pending`;
  const pendingLabKey = "agent-orchestration.module.task-graphs-contracts.lab.task-graphs-contracts-lab.pending";
  const artifact = "# 工作流\r\nEvidence: café 🧭\nKeep  every byte.\t";
  const pendingArtifact = "draft\u0000with\r\nexact spacing  ";
  const acceptedState = { autonomy: 4, dependencies: 1, sharedWrites: false };
  const acceptedEvidence = "Because the route is bounded, the workflow remains inspectable.  ";
  const pendingLab = {
    schemaVersion: "old",
    scenarioVersion: "old",
    moduleSlug: "task-graphs-contracts",
    labId: "task-graphs-contracts-lab",
    state: { lateWorker: true, invalidReturn: false, partialJoin: true },
    learnerEvidence: "Preserve\r\nthis pending evidence byte-for-byte.  ",
  };
  const capstoneReferences = [
    "file:///tmp/审计 record.md#L1",
    "trace://run-0042?keep=two  spaces",
  ];
  const unrelated = { nested: ["must", "survive"] };
  const old = {
    "another-course.lesson.1": unrelated,
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]: "1.1.1:progress-v4",
    [`agent-orchestration.module.${slug}.artifact`]: artifact,
    [`agent-orchestration.module.${slug}.artifact.pending-draft`]: pendingArtifact,
    [`agent-orchestration.module.${slug}.artifact.evidence`]: {
      saved: true,
      moduleSlug: slug,
      starterTemplate: "stale",
    },
    [acceptedLabKey]: {
      saved: true,
      schemaVersion: "old",
      scenarioVersion: "old",
      moduleSlug: slug,
      labId: "workflow-agent-boundary-lab",
      state: acceptedState,
      learnerEvidence: acceptedEvidence,
      decision: { route: "stale-derived-result" },
    },
    [pendingLabKey]: pendingLab,
    [`agent-orchestration.module.${slug}.checkpoint`]: 1,
    [`agent-orchestration.module.${slug}.checkpoint.passed`]: true,
    [`agent-orchestration.module.${slug}.complete`]: true,
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.quizBestKey]: 100,
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.quizPassedKey]: true,
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.capstoneEvidenceKey]: capstoneReferences,
    "agent-orchestration.capstone.v2": true,
    "agent-orchestration.unknown-derived-receipt": true,
  };

  const migration = migrateAgentOrchestrationProgressRecord(old, migratedAt);
  const migrated = migration.record;

  assert.equal(migration.migrated, true);
  assert.equal(migrated["another-course.lesson.1"], unrelated);
  assert.equal(migrated[`agent-orchestration.module.${slug}.artifact`], artifact);
  assert.equal(
    migrated[`agent-orchestration.module.${slug}.artifact.pending-draft`],
    pendingArtifact,
  );
  assert.equal(migrated[pendingLabKey], pendingLab);
  assert.deepEqual(migrated[recoveredLabKey], {
    schemaVersion: "old",
    scenarioVersion: "old",
    moduleSlug: slug,
    labId: "workflow-agent-boundary-lab",
    state: acceptedState,
    learnerEvidence: acceptedEvidence,
  });
  assert.equal(
    (migrated[recoveredLabKey] as { state: unknown }).state,
    acceptedState,
    "accepted control state must not be normalized during recovery",
  );
  assert.equal(migrated[acceptedLabKey], undefined);
  assert.equal(migrated[`agent-orchestration.module.${slug}.artifact.evidence`], undefined);
  assert.equal(migrated[`agent-orchestration.module.${slug}.checkpoint`], undefined);
  assert.equal(migrated[`agent-orchestration.module.${slug}.checkpoint.passed`], undefined);
  assert.equal(migrated[`agent-orchestration.module.${slug}.complete`], undefined);
  assert.equal(migrated[AGENT_ORCHESTRATION_PROGRESS_SCHEMA.quizBestKey], undefined);
  assert.equal(migrated[AGENT_ORCHESTRATION_PROGRESS_SCHEMA.quizPassedKey], undefined);
  assert.equal(migrated[AGENT_ORCHESTRATION_PROGRESS_SCHEMA.capstoneEvidenceKey], undefined);
  assert.equal(migrated["agent-orchestration.capstone.v2"], undefined);
  assert.equal(migrated["agent-orchestration.unknown-derived-receipt"], undefined);
  assert.equal(migrated[AGENT_ORCHESTRATION_CAPSTONE_RECOVERY_KEY], capstoneReferences);
  assert.equal(
    migrated[AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey],
    AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
  );
  assert.equal(migrated[AGENT_ORCHESTRATION_PROGRESS_MIGRATION_NOTICE_KEY], migration.notice);
  assert.equal(migration.notice?.fromVersion, "1.1.1:progress-v4");
  assert.equal(migration.notice?.migratedAt, migratedAt);
  assert.ok(migration.notice?.invalidatedKeys.includes(
    `agent-orchestration.module.${slug}.checkpoint.passed`,
  ));
  assert.ok(migration.notice?.recoveryKeys.includes(recoveredLabKey));
  assert.ok(migration.notice?.recoveryKeys.includes(AGENT_ORCHESTRATION_CAPSTONE_RECOVERY_KEY));
  assert.ok(migration.notice?.recoveryKeys.includes(
    AGENT_ORCHESTRATION_PROGRESS_RECOVERY_ENVELOPE_KEY,
  ));
  assert.equal(migration.recoveryEnvelope?.migratedAt, migratedAt);
  assert.deepEqual(
    migration.recoveryEnvelope?.originalCourse15Fields,
    Object.fromEntries(
      Object.entries(old).filter(([key]) => key.startsWith("agent-orchestration.")),
    ),
  );
  assert.equal(
    migration.recoveryEnvelope?.originalCourse15Fields[
      `agent-orchestration.module.${slug}.artifact`
    ],
    artifact,
  );
  assert.equal(
    migration.recoveryEnvelope?.originalCourse15Fields[acceptedLabKey],
    old[acceptedLabKey],
  );
  assert.equal(
    migrated[AGENT_ORCHESTRATION_PROGRESS_RECOVERY_ENVELOPE_KEY],
    migration.recoveryEnvelope,
  );

  const current = migrateAgentOrchestrationProgressRecord(
    migrated,
    "2030-01-01T00:00:00.000Z",
  );
  assert.equal(current.migrated, false);
  assert.deepEqual(current.record, migrated);
  assert.equal(current.notice, migration.notice);
  assert.equal(current.recoveryEnvelope, migration.recoveryEnvelope);

  const versionOnly = migrateAgentOrchestrationProgressRecord({
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]: "1.1.1:progress-v4",
  }, migratedAt);
  assert.equal(versionOnly.notice, null);
  assert.equal(versionOnly.recoveryEnvelope, null);
});

test("Course 15 external store exposes stable, fail-closed storage states", async () => {
  const local = new FaultingStorage();
  const session = new FaultingStorage();
  const browserWindow = new BrowserWindow(local, session);
  Object.assign(globalThis, {
    window: browserWindow,
    localStorage: local,
    sessionStorage: session,
  });

  const store = await import("../components/agent-orchestration/progress-store");
  const storageKey = store.AGENT_ORCHESTRATION_PROGRESS_STORAGE_KEY;

  assert.equal(store.SERVER_AGENT_ORCHESTRATION_PROGRESS_SNAPSHOT.status, "checking");
  assert.strictEqual(
    store.getAgentOrchestrationProgressServerSnapshot(),
    store.SERVER_AGENT_ORCHESTRATION_PROGRESS_SNAPSHOT,
  );

  const first = store.getAgentOrchestrationProgressSnapshot();
  assert.equal(first.status, "available");
  assert.strictEqual(store.getAgentOrchestrationProgressSnapshot(), first);

  let notifications = 0;
  const unsubscribe = store.subscribeAgentOrchestrationProgress(() => {
    notifications += 1;
  });

  const updateResult = store.updateAgentOrchestrationProgressResult((record) => {
    record["agent-orchestration.module.test.artifact"] = "recoverable authored input";
    record["another-course.lesson.keep"] = true;
  });
  assert.deepEqual(updateResult, { persisted: true });
  const afterWrite = store.getAgentOrchestrationProgressSnapshot();
  assert.equal(afterWrite.status, "available");
  assert.notStrictEqual(afterWrite, first);
  assert.strictEqual(store.getAgentOrchestrationProgressSnapshot(), afterWrite);
  assert.equal(notifications, 1);

  assert.deepEqual(
    store.resetAgentOrchestrationProgressResult(),
    { persisted: true },
  );
  const resetRecord = JSON.parse(local.getItem(storageKey) ?? "{}");
  assert.equal(resetRecord["another-course.lesson.keep"], true);
  assert.equal(resetRecord["agent-orchestration.module.test.artifact"], undefined);

  const malformed = "{course-15-broken-json\nexact bytes";
  local.setItem(storageKey, malformed);
  const corruptResult = store.repairAgentOrchestrationProgress();
  assert.equal(corruptResult.persisted, false);
  assert.equal(corruptResult.reason, "corrupt");
  assert.equal(corruptResult.quarantined, true);
  assert.equal(store.getAgentOrchestrationProgressSnapshot().status, "corrupt");
  assert.equal(local.getItem(storageKey), malformed);
  assert.equal(session.getItem(AGENT_ORCHESTRATION_CORRUPT_PROGRESS_BACKUP_KEY), malformed);
  const corruptRecovery = store.readAgentOrchestrationRecoveryExport();
  assert.equal(corruptRecovery.activeRaw, malformed);
  assert.equal(corruptRecovery.sessionBackupRaw, malformed);
  assert.equal(corruptRecovery.exportText, malformed);

  local.setItem(storageKey, JSON.stringify({
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]:
      AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
  }));
  local.fail("getItem", storageKey, "SecurityError");
  const unavailableResult = store.repairAgentOrchestrationProgress();
  assert.deepEqual(unavailableResult, { persisted: false, reason: "unavailable" });
  assert.equal(store.getAgentOrchestrationProgressSnapshot().status, "unavailable");

  local.allow("getItem", storageKey);
  local.fail("setItem", AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY, "QuotaExceededError");
  const quotaProbeResult = store.repairAgentOrchestrationProgress();
  assert.deepEqual(quotaProbeResult, { persisted: false, reason: "quota" });
  assert.equal(store.getAgentOrchestrationProgressSnapshot().status, "quota-exceeded");

  local.allow("setItem", AGENT_ORCHESTRATION_PROGRESS_PROBE_KEY);
  assert.deepEqual(store.repairAgentOrchestrationProgress(), { persisted: true });
  local.fail("setItem", storageKey, "QuotaExceededError");
  const quotaWriteResult = store.updateAgentOrchestrationProgressResult((record) => {
    record["agent-orchestration.module.test.artifact"] = "latest unsaved attempt";
  });
  assert.deepEqual(quotaWriteResult, { persisted: false, reason: "quota" });
  assert.equal(store.getAgentOrchestrationProgressSnapshot().status, "quota-exceeded");
  const quotaRecovery = store.readAgentOrchestrationRecoveryExport();
  assert.equal(
    quotaRecovery.pendingRecord?.["agent-orchestration.module.test.artifact"],
    "latest unsaved attempt",
  );
  assert.match(quotaRecovery.exportText ?? "", /latest unsaved attempt/u);

  local.allow("setItem", storageKey);
  assert.deepEqual(store.repairAgentOrchestrationProgress(), { persisted: true });
  assert.equal(store.getAgentOrchestrationProgressSnapshot().status, "available");
  assert.equal(
    JSON.parse(local.getItem(storageKey) ?? "{}")["agent-orchestration.module.test.artifact"],
    "latest unsaved attempt",
  );

  const external = JSON.parse(local.getItem(storageKey) ?? "{}");
  external["agent-orchestration.module.external.artifact"] = "another tab";
  local.setItem(storageKey, JSON.stringify(external));
  const storageEvent = new Event("storage");
  Object.assign(storageEvent, { key: storageKey, storageArea: local });
  browserWindow.dispatchEvent(storageEvent);
  assert.equal(
    store.getAgentOrchestrationProgressSnapshot().record[
      "agent-orchestration.module.external.artifact"
    ],
    "another tab",
  );
  assert.ok(notifications >= 2);

  const staleBase = JSON.stringify({
    "another-course.lesson.1": "preserve",
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]: "1.1.1:progress-v4",
    "agent-orchestration.module.workflow-agent-boundary.artifact":
      "old learner artifact",
    "agent-orchestration.module.workflow-agent-boundary.checkpoint.passed": true,
  });
  const competingWrite = JSON.stringify({
    "another-course.lesson.1": "newer tab value",
    [AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey]:
      AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
  });
  local.setItem(storageKey, staleBase);
  local.replaceAfterNextRead(storageKey, competingWrite);
  const raceResult = store.repairAgentOrchestrationProgress();
  assert.deepEqual(raceResult, { persisted: false, reason: "unavailable" });
  assert.equal(local.getItem(storageKey), competingWrite);
  const raceRecovery = store.readAgentOrchestrationRecoveryExport();
  assert.equal(raceRecovery.activeRaw, competingWrite);
  assert.equal(
    raceRecovery.pendingRecord?.[
      "agent-orchestration.module.workflow-agent-boundary.artifact"
    ],
    "old learner artifact",
  );
  assert.equal(
    raceRecovery.recoveryEnvelope?.originalCourse15Fields[
      "agent-orchestration.module.workflow-agent-boundary.checkpoint.passed"
    ],
    true,
  );
  assert.ok(raceRecovery.migrationNotice?.migratedAt.endsWith("Z"));

  unsubscribe();
});
