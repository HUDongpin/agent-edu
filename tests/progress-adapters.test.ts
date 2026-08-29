import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  PUBLIC_COURSE_SURFACES,
  type PublicCourseSurface,
} from "../lib/public-release-surface";
import {
  PUBLISHED_PROGRESS_COURSE_IDS,
} from "../lib/public-progress-contract";
import { progressRegistryIntegrationErrors } from "../scripts/lib/progress-registry-contract.mjs";
import { projectPublicCourseSurface } from "../scripts/sync-course-public-surface.mjs";
import { GROK_LESSON_SLUGS } from "../lib/grok";
import { GITHUB_LESSON_SLUGS } from "../lib/github";
import {
  PRODUCT_MANAGEMENT_PROGRESS_VERSION,
  PRODUCT_MANAGEMENT_PROGRESS_VERSION_KEY,
  productManagementModuleProgressKey,
} from "../lib/product-management/progress";
import { PRODUCT_MANAGEMENT_COURSE_MANIFEST } from "../lib/product-management/manifest";
import { EMPTY_LEARNING_STATE, LEARNING_KEY } from "../lib/progress";
import {
  CURSOR_PROGRESS_STORAGE_KEY,
  MCP_PROGRESS_LESSON_SLUGS,
  MCP_PROGRESS_QUIZ,
  PROMPT_PROGRESS_LESSON_SLUGS,
  RAG_PROGRESS_LESSON_SLUGS,
} from "../lib/progress-topology";
import {
  PROMPT_CAPSTONE_REQUIRED_COUNT,
  PROMPT_CAPSTONE_RUBRIC_COUNT,
} from "../lib/prompts/capstone";
import {
  PROMPT_CAPSTONE_KEY,
  PROMPT_CAPSTONE_REQUIRED_KEY,
  PROMPT_CAPSTONE_SCORES_KEY,
  PROMPT_QUIZ_BANK_VERSION,
  PROMPT_QUIZ_BEST_KEY,
  PROMPT_QUIZ_PASSED_KEY,
  PROMPT_QUIZ_VERSION_KEY,
} from "../lib/prompts/progress-keys";
import { DEEPSEEK_KEY_STORAGE } from "../lib/byok/key-store";
import { LAB_DRAFT_KEY } from "../lib/lab/draft";
import {
  CODEX_CAPSTONE_DRAFT_STORAGE_KEY,
  CURSOR_PROGRESS_RESET_QUARANTINE_KEY,
  GROK_PROGRESS_RESET_QUARANTINE_KEY,
  RECENCY_RESET_QUARANTINE_KEY,
  SHARED_PROGRESS_RESET_QUARANTINE_KEY,
} from "../lib/progress-storage-contract";
import {
  createAllProgressAdapters,
  createProgressAdaptersForProjection,
  createPublishedProgressAdapters,
  readPublishedProgressSummaries,
  validatePublishedProgressAdapterRegistry,
} from "../components/progress-adapters";
import {
  PROGRESS_RESET_REGISTRY,
  resetEveryCourseProgress,
} from "../components/progress-reset";
import {
  GROK_PROGRESS_KEY,
  updateGrokProgress,
} from "../components/grok/progress-store";
import { updateCourseProgress as updateGithubProgress } from "../components/github/progress-store";
import {
  readPromptProgress,
  updatePromptProgress,
  writePromptProgress,
} from "../components/prompts/progress-store";
import { updateSoftwareEngineeringProgress } from "../components/software-engineering/progress-store";
import {
  RAG_QUIZ_BEST_KEY,
  RAG_QUIZ_PASSED_KEY,
  updateRagProgress,
} from "../components/rag/progress-store";
import {
  resetMcpProgressAfterGlobalReset,
  updateMcpProgress,
} from "../components/mcp/progress-store";
import { updateIncomeRecord } from "../components/make-money-with-codex/progress-store";
import { updateProgress as updateClaudeIncomeProgress } from "../components/claude-income/progress-store";
import { updateAiTutorProgress } from "../components/ai-tutor/progress-store";
import { updateProductManagementProgress } from "../components/product-management/progress-store";
import { updateAgentOrchestrationProgress } from "../components/agent-orchestration/progress-store";
import { updateCourseProgress as updateCodexProgress } from "../components/codex/progress-store";
import { updateCourseProgress as updateClaudeProgress } from "../components/claude/progress-store";
import { applyCursorProgressPatch } from "../components/cursor/progress-store";
import {
  PROGRESS_RECENCY_STORAGE_KEY,
  readProgressRecency,
  recordProgressActivity,
  resetProgressRecencyAfterGlobalReset,
  sortCourseIdsByRecentActivity,
} from "../components/progress-recency";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number { return this.values.size; }
  clear(): void { this.values.clear(); }
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  key(index: number): string | null { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string): void { this.values.delete(key); }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

type StorageOperation = "getItem" | "setItem" | "removeItem";

class FaultingStorage extends MemoryStorage {
  private readonly faults = new Map<string, string>();

  fail(operation: StorageOperation, key: string, name = "Error"): void {
    this.faults.set(`${operation}:${key}`, name);
  }

  allow(operation: StorageOperation, key: string): void {
    this.faults.delete(`${operation}:${key}`);
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
    return super.getItem(key);
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

class BrowserEvents extends EventTarget {
  constructor(
    readonly localStorage: Storage,
    readonly sessionStorage: Storage,
  ) {
    super();
  }
}

const EXPECTED_FIRST_HREFS = {
  agentic: "/en/handbook/#start",
  codex: "/en/codex/meet-codex/",
  claude: "/en/claude/choose-your-surface/",
  cursor: "/en/cursor/orient-privacy/",
  grok: "/en/grok/map-grok/",
  github: "/en/github/start-secure/",
  prompts: "/en/prompts/prompts-are-specifications/",
  "software-engineering": "/en/software-engineering/agentic-engineering-system/",
  rag: "/en/rag/choose-rag/",
  mcp: "/en/mcp/why-mcp/",
  "make-money-with-codex": "/en/make-money-with-codex/money-not-magic/",
  "claude-income": "/en/claude-income/choose-a-money-path/",
  "ai-tutor": "/en/ai-tutor/objectives-concept-map/",
  "product-management": "/en/product-management/product-judgment-operating-model/",
  "agent-orchestration": "/en/agent-orchestration/workflow-agent-boundary/",
} as const;

function readReleaseContract() {
  return JSON.parse(readFileSync("config/course-release-surface.json", "utf8"));
}

test("published progress adapters exactly match the twelve public courses", () => {
  const adapters = createPublishedProgressAdapters("en");
  const releaseContract = readReleaseContract();
  assert.deepEqual(validatePublishedProgressAdapterRegistry(adapters), []);
  assert.deepEqual(
    adapters.map((adapter) => adapter.courseId).sort(),
    releaseContract.courses
      .filter((course: { state: string }) => course.state === "published")
      .map((course: { id: string }) => course.id)
      .sort(),
  );
  assert.equal(new Set(adapters.map((adapter) => adapter.progressEvent)).size, 12);
  assert.ok(adapters.every((adapter) => adapter.storageKeys.length > 0));
  assert.ok(adapters.every((adapter) => typeof adapter.resetAfterGlobalReset === "function"));
  const noStorage = readPublishedProgressSummaries("en");
  assert.deepEqual(
    noStorage.map((summary) => summary.courseId),
    adapters.map((adapter) => adapter.courseId),
  );
  assert.ok(noStorage.every(
    (summary) => summary.state === "unavailable" && summary.nextHref === null,
  ));
});

test("registry-owned adapter state, events, and primary storage keys fail closed", () => {
  const releaseContract = readReleaseContract();
  const allAdapters = createAllProgressAdapters("en");
  const publishedAdapters = createPublishedProgressAdapters("en");
  assert.deepEqual(
    progressRegistryIntegrationErrors(releaseContract, allAdapters, publishedAdapters),
    [],
  );

  const eventDrift = structuredClone(releaseContract);
  eventDrift.courses.find((course: { id: string }) => course.id === "grok")
    .progress.event = "grok:unregistered-progress";
  assert.match(
    progressRegistryIntegrationErrors(eventDrift, allAdapters, publishedAdapters).join("\n"),
    /grok: adapter event aicourse:grok-progress differs from registry event grok:unregistered-progress/,
  );

  const storageDrift = structuredClone(releaseContract);
  storageDrift.courses.find((course: { id: string }) => course.id === "grok")
    .progress.storageKey = "grok.unregistered.progress";
  assert.match(
    progressRegistryIntegrationErrors(storageDrift, allAdapters, publishedAdapters).join("\n"),
    /grok: adapter storageKeys do not include registry primary key grok\.unregistered\.progress/,
  );

  const stateDrift = structuredClone(releaseContract);
  stateDrift.courses.find((course: { id: string }) => course.id === "codex").state = "published";
  assert.match(
    progressRegistryIntegrationErrors(stateDrift, allAdapters, publishedAdapters).join("\n"),
    /published progress adapter ids differ from the release registry; missing: codex/,
  );
});

test("blocked progress adapters stay dormant until the generated registry publishes them", async () => {
  const releaseContract = readReleaseContract();
  const currentAdapters = createPublishedProgressAdapters("en");
  const allAdapters = createAllProgressAdapters("en");
  const expectedAdapterIds = releaseContract.courses
    .filter((course: { progress: unknown }) => course.progress !== null)
    .map((course: { id: string }) => course.id);
  const currentIds = new Set(currentAdapters.map((adapter) => adapter.courseId));
  const dormantIds = allAdapters
    .map((adapter) => adapter.courseId)
    .filter((courseId) => !currentIds.has(courseId));

  assert.equal(currentAdapters.length, 12, "the accepted product scope remains twelve courses");
  assert.deepEqual(PUBLISHED_PROGRESS_COURSE_IDS, currentAdapters.map((adapter) => adapter.courseId));
  assert.deepEqual(
    allAdapters.map((adapter) => adapter.courseId),
    expectedAdapterIds,
  );
  assert.deepEqual(dormantIds, ["codex", "claude", "cursor"]);
  assert.ok(PUBLIC_COURSE_SURFACES
    .filter((surface) => dormantIds.includes(surface.id as never))
    .every((surface) => surface.state === "blocked" && surface.progressEvent === null));

  for (const course of releaseContract.courses) {
    if (dormantIds.includes(course.id)) course.state = "published";
  }
  const futureProjection = projectPublicCourseSurface(releaseContract)
    .courses as readonly PublicCourseSurface[];
  const futureAdapters = createProgressAdaptersForProjection("en", futureProjection);
  assert.deepEqual(validatePublishedProgressAdapterRegistry(
    futureAdapters,
    futureProjection,
  ), []);
  assert.deepEqual(
    futureAdapters.map((adapter) => adapter.courseId),
    expectedAdapterIds,
    "a registry state flip activates all three adapters without adapter code changes",
  );

  const storage = new MemoryStorage();
  const session = new MemoryStorage();
  const browser = new BrowserEvents(storage, session);
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  const hadLocalStorage = "localStorage" in globalThis;
  const previousLocalStorage = globalThis.localStorage;
  const hadSessionStorage = "sessionStorage" in globalThis;
  const previousSessionStorage = globalThis.sessionStorage;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser as unknown as Window & typeof globalThis,
  });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: session });

  try {
    assert.equal((await resetEveryCourseProgress()).persistent, true);
    const activated = createProgressAdaptersForProjection("en", futureProjection)
      .filter((adapter) => dormantIds.includes(adapter.courseId));
    assert.deepEqual(
      activated.map((adapter) => [
        adapter.courseId,
        adapter.progressEvent,
        adapter.storageKeys,
        adapter.readSummary().nextHref,
      ]),
      [
        [
          "codex",
          "codex:progress-change",
          ["ae.progress", CODEX_CAPSTONE_DRAFT_STORAGE_KEY],
          EXPECTED_FIRST_HREFS.codex,
        ],
        ["claude", "claude:progress-change", ["ae.progress"], EXPECTED_FIRST_HREFS.claude],
        ["cursor", "cursor:progress-change", ["aicourse.cursor.progress.v1"], EXPECTED_FIRST_HREFS.cursor],
      ],
    );

    storage.setItem("ae.progress", JSON.stringify({
      "codex.lesson.meet-codex": true,
      "claude.lesson.choose-your-surface": true,
    }));
    storage.setItem("aicourse.cursor.progress.v1", JSON.stringify({
      "cursor.lesson.orient-privacy": true,
    }));
    assert.deepEqual(
      activated.map((adapter) => [adapter.courseId, adapter.readSummary().nextHref]),
      [
        ["codex", "/en/codex/task-contracts/"],
        ["claude", "/en/claude/describe-the-outcome/"],
        ["cursor", "/en/cursor/tab-inline-edit/"],
      ],
      "future adapters resume the exact first incomplete lesson",
    );

    const repaintEvents = new Set<string>();
    for (const adapter of activated) {
      browser.addEventListener(adapter.progressEvent, () => repaintEvents.add(adapter.progressEvent));
    }
    storage.setItem("ae.progress", "{unknown-shared-progress");
    storage.setItem("aicourse.cursor.progress.v1", "[]");
    for (const adapter of activated) {
      assert.deepEqual(adapter.readSummary(), {
        state: "unavailable",
        percent: 0,
        nextHref: null,
      }, adapter.courseId);
    }
    assert.equal(updateCodexProgress((record) => {
      record["codex.lesson.meet-codex"] = true;
    }).persisted, false);
    assert.equal(updateClaudeProgress((record) => {
      record["claude.lesson.choose-your-surface"] = true;
    }).persisted, false);
    assert.equal((await applyCursorProgressPatch({
      set: { "cursor.lesson.orient-privacy": true },
    })).persisted, false);
    assert.equal(storage.getItem("ae.progress"), "{unknown-shared-progress");
    assert.equal(storage.getItem("aicourse.cursor.progress.v1"), "[]");

    const corruptReset = await resetEveryCourseProgress();
    assert.equal(corruptReset.persistent, true);
    assert.deepEqual(corruptReset.failureReasons, {});
    assert.deepEqual(corruptReset.quarantinedStores, ["codex/shared-record", "cursor"]);
    assert.equal(storage.getItem("ae.progress"), null);
    assert.equal(storage.getItem(CURSOR_PROGRESS_STORAGE_KEY), null);
    assert.equal(
      storage.getItem(SHARED_PROGRESS_RESET_QUARANTINE_KEY),
      "{unknown-shared-progress",
    );
    assert.equal(storage.getItem(CURSOR_PROGRESS_RESET_QUARANTINE_KEY), "[]");
    assert.deepEqual(
      [...repaintEvents].sort(),
      ["claude:progress-change", "codex:progress-change", "cursor:progress-change"],
    );

    // A second reset is idempotent and does not consume inactive recovery data.
    assert.equal((await resetEveryCourseProgress()).persistent, true);
  } finally {
    if (hadWindow) Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
    else Reflect.deleteProperty(globalThis, "window");
    if (hadLocalStorage) {
      Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previousLocalStorage });
    } else Reflect.deleteProperty(globalThis, "localStorage");
    if (hadSessionStorage) {
      Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: previousSessionStorage });
    } else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});

test("global reset covers blocked stores without exposing them as public summaries", () => {
  const publicIds = new Set<string>(
    createPublishedProgressAdapters("en").map((adapter) => adapter.courseId),
  );
  const resetIds = PROGRESS_RESET_REGISTRY.map((entry) => entry.id);

  assert.deepEqual(resetIds.slice(0, 2), ["codex/shared-record", "agentic"]);
  assert.equal(new Set(resetIds).size, resetIds.length);
  assert.ok(resetIds.includes("claude"));
  assert.ok(resetIds.includes("cursor"));
  assert.equal(resetIds.at(-1), "recency");
  assert.equal(publicIds.has("codex"), false);
  assert.equal(publicIds.has("claude"), false);
  assert.equal(publicIds.has("cursor"), false);
});

test("central reset reports quota and unavailable without clearing unrelated device state", async () => {
  const storage = new FaultingStorage();
  const session = new MemoryStorage();
  const browser = new BrowserEvents(storage, session);
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  const hadLocalStorage = "localStorage" in globalThis;
  const previousLocalStorage = globalThis.localStorage;
  const hadSessionStorage = "sessionStorage" in globalThis;
  const previousSessionStorage = globalThis.sessionStorage;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser as unknown as Window & typeof globalThis,
  });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: session });

  try {
    assert.equal((await resetEveryCourseProgress()).persistent, true);
    storage.setItem("ae.progress", JSON.stringify({ "github.lesson.start-secure": true }));
    storage.setItem(CURSOR_PROGRESS_STORAGE_KEY, JSON.stringify({
      "cursor.lesson.orient-privacy": true,
    }));
    storage.setItem(LEARNING_KEY, JSON.stringify(EMPTY_LEARNING_STATE));
    storage.setItem("ae.theme", "dark");
    storage.setItem("ae.lang", "ar");
    storage.setItem(LAB_DRAFT_KEY, JSON.stringify({ prompt: "keep the learner draft" }));
    session.setItem(DEEPSEEK_KEY_STORAGE, "keep-provider-key-in-current-tab");

    storage.fail("removeItem", "ae.progress", "QuotaExceededError");
    storage.fail("removeItem", CURSOR_PROGRESS_STORAGE_KEY);

    const result = await resetEveryCourseProgress();
    assert.equal(result.persistent, false);
    assert.equal(result.failureReasons["codex/shared-record"], "quota");
    assert.equal(result.failureReasons.github, "quota");
    assert.equal(result.failureReasons["make-money-with-codex"], "quota");
    assert.equal(result.failureReasons.cursor, "unavailable");
    assert.equal(storage.getItem("ae.progress"), JSON.stringify({
      "github.lesson.start-secure": true,
    }));
    assert.equal(storage.getItem(CURSOR_PROGRESS_STORAGE_KEY), JSON.stringify({
      "cursor.lesson.orient-privacy": true,
    }));

    assert.equal(storage.getItem("ae.theme"), "dark");
    assert.equal(storage.getItem("ae.lang"), "ar");
    assert.equal(
      storage.getItem(LAB_DRAFT_KEY),
      JSON.stringify({ prompt: "keep the learner draft" }),
    );
    assert.equal(session.getItem(DEEPSEEK_KEY_STORAGE), "keep-provider-key-in-current-tab");

    storage.allow("removeItem", "ae.progress");
    storage.allow("removeItem", CURSOR_PROGRESS_STORAGE_KEY);
    storage.removeItem("ae.progress");
    storage.removeItem(CURSOR_PROGRESS_STORAGE_KEY);
    assert.equal((await resetEveryCourseProgress()).persistent, true);
    assert.equal(storage.getItem("ae.theme"), "dark");
    assert.equal(storage.getItem("ae.lang"), "ar");
    assert.notEqual(storage.getItem(LAB_DRAFT_KEY), null);
    assert.equal(session.getItem(DEEPSEEK_KEY_STORAGE), "keep-provider-key-in-current-tab");
  } finally {
    if (hadWindow) Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
    else Reflect.deleteProperty(globalThis, "window");
    if (hadLocalStorage) {
      Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previousLocalStorage });
    } else Reflect.deleteProperty(globalThis, "localStorage");
    if (hadSessionStorage) {
      Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: previousSessionStorage });
    } else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});

test("a fresh learner gets the exact first lesson for every published course", () => {
  const storage = new MemoryStorage();
  const session = new MemoryStorage();
  const browser = new BrowserEvents(storage, session);
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  const hadLocalStorage = "localStorage" in globalThis;
  const previousLocalStorage = globalThis.localStorage;
  const hadSessionStorage = "sessionStorage" in globalThis;
  const previousSessionStorage = globalThis.sessionStorage;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser as unknown as Window & typeof globalThis,
  });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: session });

  try {
    const adapters = createPublishedProgressAdapters("en");
    for (const adapter of adapters) {
      const current = adapter.readSummary();
      assert.equal(current.state, "not-started", adapter.courseId);
      assert.equal(current.percent, 0, adapter.courseId);
      assert.equal(current.nextHref, EXPECTED_FIRST_HREFS[adapter.courseId], adapter.courseId);
    }
  } finally {
    if (hadWindow) Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
    else Reflect.deleteProperty(globalThis, "window");
    if (hadLocalStorage) {
      Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previousLocalStorage });
    } else Reflect.deleteProperty(globalThis, "localStorage");
    if (hadSessionStorage) {
      Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: previousSessionStorage });
    } else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});

test("Course 7 adapter keeps the capstone before the versioned final knowledge check", () => {
  const storage = new MemoryStorage();
  const session = new MemoryStorage();
  const browser = new BrowserEvents(storage, session);
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  const hadLocalStorage = "localStorage" in globalThis;
  const previousLocalStorage = globalThis.localStorage;
  const hadSessionStorage = "sessionStorage" in globalThis;
  const previousSessionStorage = globalThis.sessionStorage;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser as unknown as Window & typeof globalThis,
  });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: session });

  try {
    const record: Record<string, unknown> = Object.fromEntries(
      PROMPT_PROGRESS_LESSON_SLUGS.map((slug) => [`prompts.lesson.${slug}.practice`, true]),
    );
    storage.setItem("ae.progress", JSON.stringify(record));
    const prompts = createPublishedProgressAdapters("en").find(
      (adapter) => adapter.courseId === "prompts",
    );
    assert.ok(prompts);
    assert.deepEqual(prompts.readSummary(), {
      state: "in-progress",
      percent: 82,
      nextHref: "/en/prompts/capstone-prompt-packet/",
    });

    record[PROMPT_CAPSTONE_REQUIRED_KEY] = Object.fromEntries(
      Array.from({ length: PROMPT_CAPSTONE_REQUIRED_COUNT }, (_, index) => [index, true]),
    );
    record[PROMPT_CAPSTONE_SCORES_KEY] = Object.fromEntries(
      Array.from({ length: PROMPT_CAPSTONE_RUBRIC_COUNT }, (_, index) => [index, 2]),
    );
    record[PROMPT_CAPSTONE_KEY] = true;
    storage.setItem("ae.progress", JSON.stringify(record));
    assert.deepEqual(prompts.readSummary(), {
      state: "in-progress",
      percent: 91,
      nextHref: "/en/prompts/#prompts-final-quiz",
    });

    record[PROMPT_QUIZ_VERSION_KEY] = PROMPT_QUIZ_BANK_VERSION;
    record[PROMPT_QUIZ_BEST_KEY] = 7;
    record[PROMPT_QUIZ_PASSED_KEY] = true;
    storage.setItem("ae.progress", JSON.stringify(record));
    assert.deepEqual(prompts.readSummary(), {
      state: "completed",
      percent: 100,
      nextHref: "/en/prompts/",
    });

    const stalePromptSnapshot = readPromptProgress();
    storage.setItem("ae.progress", JSON.stringify({
      ...record,
      "github.concurrent-write": true,
      unrelated: "newer shared value",
    }));
    stalePromptSnapshot[`prompts.lesson.${PROMPT_PROGRESS_LESSON_SLUGS[0]}.practice`] = false;
    assert.equal(writePromptProgress(stalePromptSnapshot), true);
    const merged = JSON.parse(storage.getItem("ae.progress") || "{}") as Record<string, unknown>;
    assert.equal(merged["github.concurrent-write"], true);
    assert.equal(merged.unrelated, "newer shared value");
    assert.equal(
      merged[`prompts.lesson.${PROMPT_PROGRESS_LESSON_SLUGS[0]}.practice`],
      false,
    );
  } finally {
    if (hadWindow) Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
    else Reflect.deleteProperty(globalThis, "window");
    if (hadLocalStorage) {
      Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previousLocalStorage });
    } else Reflect.deleteProperty(globalThis, "localStorage");
    if (hadSessionStorage) {
      Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: previousSessionStorage });
    } else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});

test("Course 14 public progress ignores version-only and stale records", () => {
  const storage = new MemoryStorage();
  const session = new MemoryStorage();
  const browser = new BrowserEvents(storage, session);
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  const hadLocalStorage = "localStorage" in globalThis;
  const previousLocalStorage = globalThis.localStorage;
  const hadSessionStorage = "sessionStorage" in globalThis;
  const previousSessionStorage = globalThis.sessionStorage;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser as unknown as Window & typeof globalThis,
  });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: session });

  try {
    const adapter = createPublishedProgressAdapters("en").find(
      (candidate) => candidate.courseId === "product-management",
    );
    assert.ok(adapter);

    storage.setItem("ae.progress", JSON.stringify({
      [PRODUCT_MANAGEMENT_PROGRESS_VERSION_KEY]: PRODUCT_MANAGEMENT_PROGRESS_VERSION,
    }));
    assert.deepEqual(adapter.readSummary(), {
      state: "not-started",
      percent: 0,
      nextHref: EXPECTED_FIRST_HREFS["product-management"],
    });

    const firstSlug = PRODUCT_MANAGEMENT_COURSE_MANIFEST.modules[0].slug;
    const staleRecord = JSON.stringify({
      [PRODUCT_MANAGEMENT_PROGRESS_VERSION_KEY]: "stale-course-version",
      [productManagementModuleProgressKey(firstSlug)]: true,
      "product-management.quiz.passed": true,
      "product-management.capstone.v1": true,
      "github.lesson.start-secure": true,
    });
    storage.setItem("ae.progress", staleRecord);
    assert.deepEqual(adapter.readSummary(), {
      state: "not-started",
      percent: 0,
      nextHref: EXPECTED_FIRST_HREFS["product-management"],
    });
    assert.equal(storage.getItem("ae.progress"), staleRecord, "read remains non-mutating");

    storage.setItem("ae.progress", JSON.stringify({
      [PRODUCT_MANAGEMENT_PROGRESS_VERSION_KEY]: PRODUCT_MANAGEMENT_PROGRESS_VERSION,
      [productManagementModuleProgressKey(firstSlug)]: true,
    }));
    assert.deepEqual(adapter.readSummary(), {
      state: "in-progress",
      percent: 6,
      nextHref: "/en/product-management/vision-strategy-business-model/",
    });
  } finally {
    if (hadWindow) Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
    else Reflect.deleteProperty(globalThis, "window");
    if (hadLocalStorage) {
      Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previousLocalStorage });
    } else Reflect.deleteProperty(globalThis, "localStorage");
    if (hadSessionStorage) {
      Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: previousSessionStorage });
    } else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});

test("a published adapter resumes the first incomplete lesson, not the dashboard", () => {
  const storage = new MemoryStorage();
  const session = new MemoryStorage();
  const browser = new BrowserEvents(storage, session);
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  const hadLocalStorage = "localStorage" in globalThis;
  const previousLocalStorage = globalThis.localStorage;
  const hadSessionStorage = "sessionStorage" in globalThis;
  const previousSessionStorage = globalThis.sessionStorage;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser as unknown as Window & typeof globalThis,
  });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: session });

  try {
    storage.setItem("ae.progress", JSON.stringify({
      [`github.lesson.${GITHUB_LESSON_SLUGS[0]}`]: true,
    }));
    const github = createPublishedProgressAdapters("en").find(
      (adapter) => adapter.courseId === "github",
    );
    assert.ok(github);
    assert.deepEqual(github.readSummary(), {
      state: "in-progress",
      percent: 7,
      nextHref: "/en/github/repository-readme/",
    });

    storage.setItem("ae.progress", JSON.stringify(Object.fromEntries(
      GITHUB_LESSON_SLUGS.map((slug) => [`github.lesson.${slug}`, true]),
    )));
    assert.equal(github.readSummary().nextHref, "/en/github/#github-final-quiz-title");

    const rag = createPublishedProgressAdapters("en").find(
      (adapter) => adapter.courseId === "rag",
    );
    assert.ok(rag);
    storage.setItem("ae.progress", JSON.stringify({
      ...Object.fromEntries(RAG_PROGRESS_LESSON_SLUGS.map(
        (slug) => [`rag.lesson.${slug}.practice`, true],
      )),
      [RAG_QUIZ_BEST_KEY]: 1.5,
      [RAG_QUIZ_PASSED_KEY]: true,
    }));
    assert.equal(rag.readSummary().nextHref, "/en/rag/#rag-final-quiz");

    storage.setItem("ae.progress", JSON.stringify({
      ...Object.fromEntries(RAG_PROGRESS_LESSON_SLUGS.map(
        (slug) => [`rag.lesson.${slug}.practice`, true],
      )),
      [RAG_QUIZ_BEST_KEY]: 9,
      [RAG_QUIZ_PASSED_KEY]: true,
    }));
    assert.equal(rag.readSummary().nextHref, "/en/rag/#rag-capstone");
  } finally {
    if (hadWindow) Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
    else Reflect.deleteProperty(globalThis, "window");
    if (hadLocalStorage) {
      Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previousLocalStorage });
    } else Reflect.deleteProperty(globalThis, "localStorage");
    if (hadSessionStorage) {
      Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: previousSessionStorage });
    } else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});

test("the MCP adapter rejects pass booleans without a valid current best score", () => {
  const storage = new MemoryStorage();
  const session = new MemoryStorage();
  const browser = new BrowserEvents(storage, session);
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  const hadLocalStorage = "localStorage" in globalThis;
  const previousLocalStorage = globalThis.localStorage;
  const hadSessionStorage = "sessionStorage" in globalThis;
  const previousSessionStorage = globalThis.sessionStorage;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser as unknown as Window & typeof globalThis,
  });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: session });

  try {
    assert.deepEqual(resetMcpProgressAfterGlobalReset(), { persisted: true });
    const mcp = createPublishedProgressAdapters("en").find((adapter) => adapter.courseId === "mcp");
    assert.ok(mcp);
    const lessons = Object.fromEntries(
      MCP_PROGRESS_LESSON_SLUGS.map((slug) => [`mcp.lesson.${slug}`, true]),
    );
    storage.setItem("ae.progress", JSON.stringify({
      ...lessons,
      [MCP_PROGRESS_QUIZ.versionKey]: MCP_PROGRESS_QUIZ.bankVersion,
      [MCP_PROGRESS_QUIZ.passedKey]: true,
    }));
    assert.deepEqual(mcp.readSummary(), {
      state: "in-progress",
      percent: 90,
      nextHref: "/en/mcp/#assessment",
    });

    storage.setItem("ae.progress", JSON.stringify({
      ...lessons,
      [MCP_PROGRESS_QUIZ.versionKey]: MCP_PROGRESS_QUIZ.bankVersion,
      [MCP_PROGRESS_QUIZ.bestScoreKey]: 15,
      [MCP_PROGRESS_QUIZ.passedKey]: true,
    }));
    assert.deepEqual(mcp.readSummary(), {
      state: "in-progress",
      percent: 95,
      nextHref: "/en/mcp/#capstone",
    });
  } finally {
    if (hadWindow) Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
    else Reflect.deleteProperty(globalThis, "window");
    if (hadLocalStorage) Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previousLocalStorage });
    else Reflect.deleteProperty(globalThis, "localStorage");
    if (hadSessionStorage) Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: previousSessionStorage });
    else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});

test("corrupt public progress stays unavailable and ordinary updates never replace raw evidence", async () => {
  const storage = new MemoryStorage();
  const session = new MemoryStorage();
  const browser = new BrowserEvents(storage, session);
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  const hadLocalStorage = "localStorage" in globalThis;
  const previousLocalStorage = globalThis.localStorage;
  const hadSessionStorage = "sessionStorage" in globalThis;
  const previousSessionStorage = globalThis.sessionStorage;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser as unknown as Window & typeof globalThis,
  });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: session });

  const malformed = "{shared-progress-is-not-json";
  const sharedCourseIds = [
    "github",
    "prompts",
    "software-engineering",
    "rag",
    "mcp",
    "make-money-with-codex",
    "claude-income",
    "ai-tutor",
    "product-management",
    "agent-orchestration",
  ] as const;
  const sharedUpdates: readonly (() => boolean)[] = [
    () => updateGithubProgress((record) => { record["github.lesson.start-secure"] = true; }).persisted,
    () => updatePromptProgress((record) => { record["prompts.lesson.test.practice"] = true; }),
    () => updateSoftwareEngineeringProgress((record) => {
      record["softwareEngineering.lesson.test"] = true;
    }),
    () => updateRagProgress((record) => { record["rag.lesson.test.practice"] = true; }),
    () => updateMcpProgress((record) => { record["mcp.lesson.test"] = true; }),
    () => updateIncomeRecord((record) => ({
      ...record,
      "make-money-with-codex.lesson.test": true,
    })),
    () => updateClaudeIncomeProgress((record) => { record["claude-income.lesson.test"] = true; }),
    () => updateAiTutorProgress((record) => { record["ai-tutor.module.test"] = true; }),
    () => updateProductManagementProgress((record) => {
      record["product-management.module.test"] = true;
    }),
    () => updateAgentOrchestrationProgress((record) => {
      record["agent-orchestration.module.test"] = true;
    }),
  ];

  try {
    storage.setItem("ae.progress", malformed);
    storage.setItem("ae.theme", "dark");
    storage.setItem("ae.lang", "zh-Hans");
    storage.setItem(LAB_DRAFT_KEY, JSON.stringify({ prompt: "keep corrupt-reset draft" }));
    session.setItem(DEEPSEEK_KEY_STORAGE, "keep-corrupt-reset-provider-key");
    const adapters = createPublishedProgressAdapters("en");
    for (const courseId of sharedCourseIds) {
      const adapter = adapters.find((candidate) => candidate.courseId === courseId);
      assert.ok(adapter, courseId);
      assert.equal(adapter.isPersistent(), false, courseId);
      assert.deepEqual(adapter.readSummary(), {
        state: "unavailable",
        percent: 0,
        nextHref: null,
      }, courseId);
      assert.equal(storage.getItem("ae.progress"), malformed, courseId);
    }

    const failedReset = await adapters.find(
      (candidate) => candidate.courseId === "github",
    )?.resetAfterGlobalReset();
    assert.deepEqual(failedReset, {
      persisted: false,
      reason: "corrupt",
    });
    assert.equal(storage.getItem("ae.progress"), malformed);

    for (let index = 0; index < sharedUpdates.length; index += 1) {
      assert.equal(sharedUpdates[index](), false, sharedCourseIds[index]);
      assert.equal(storage.getItem("ae.progress"), malformed, sharedCourseIds[index]);
    }

    const invalidObject = "[]";
    storage.setItem(GROK_PROGRESS_KEY, invalidObject);
    const grok = adapters.find((candidate) => candidate.courseId === "grok");
    assert.ok(grok);
    assert.equal(grok.isPersistent(), false);
    assert.deepEqual(grok.readSummary(), {
      state: "unavailable",
      percent: 0,
      nextHref: null,
    });
    assert.equal(updateGrokProgress((current) => ({
      ...current,
      lessons: { ...current.lessons, [GROK_LESSON_SLUGS[0]]: true },
    })), false);
    assert.equal(storage.getItem(GROK_PROGRESS_KEY), invalidObject);

    const reset = await resetEveryCourseProgress();
    assert.equal(reset.persistent, true);
    assert.deepEqual(reset.failureReasons, {});
    assert.deepEqual(reset.quarantinedStores, ["codex/shared-record", "grok"]);
    assert.equal(storage.getItem("ae.progress"), null);
    assert.equal(storage.getItem(GROK_PROGRESS_KEY), null);
    assert.equal(storage.getItem(SHARED_PROGRESS_RESET_QUARANTINE_KEY), malformed);
    assert.equal(storage.getItem(GROK_PROGRESS_RESET_QUARANTINE_KEY), invalidObject);
    assert.equal(storage.getItem("ae.theme"), "dark");
    assert.equal(storage.getItem("ae.lang"), "zh-Hans");
    assert.equal(
      storage.getItem(LAB_DRAFT_KEY),
      JSON.stringify({ prompt: "keep corrupt-reset draft" }),
    );
    assert.equal(session.getItem(DEEPSEEK_KEY_STORAGE), "keep-corrupt-reset-provider-key");

    assert.equal((await resetEveryCourseProgress()).persistent, true);
    for (const adapter of createPublishedProgressAdapters("en")) {
      assert.equal(adapter.isPersistent(), true, adapter.courseId);
      assert.equal(adapter.readSummary().percent, 0, adapter.courseId);
      assert.deepEqual(await adapter.resetAfterGlobalReset(), { persisted: true }, adapter.courseId);
    }

    storage.setItem("ae.progress", invalidObject);
    for (const courseId of sharedCourseIds) {
      const adapter = createPublishedProgressAdapters("en").find(
        (candidate) => candidate.courseId === courseId,
      );
      assert.ok(adapter, courseId);
      assert.equal(adapter.isPersistent(), false, `${courseId}: non-object JSON`);
      assert.equal(adapter.readSummary().state, "unavailable", courseId);
      assert.equal(adapter.readSummary().nextHref, null, courseId);
      assert.equal(storage.getItem("ae.progress"), invalidObject, courseId);
    }
    const invalidReset = await resetEveryCourseProgress();
    assert.equal(invalidReset.persistent, false);
    assert.equal(invalidReset.failureReasons["codex/shared-record"], "unavailable");
    assert.equal(storage.getItem("ae.progress"), invalidObject);
    assert.equal(storage.getItem(SHARED_PROGRESS_RESET_QUARANTINE_KEY), malformed);
    storage.removeItem(SHARED_PROGRESS_RESET_QUARANTINE_KEY);
    storage.removeItem("ae.progress");
    assert.equal((await resetEveryCourseProgress()).persistent, true);
  } finally {
    if (hadWindow) Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
    else Reflect.deleteProperty(globalThis, "window");
    if (hadLocalStorage) {
      Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previousLocalStorage });
    } else Reflect.deleteProperty(globalThis, "localStorage");
    if (hadSessionStorage) {
      Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: previousSessionStorage });
    } else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});

test("the minimal recency ledger survives refresh ordering and fails closed when corrupt", () => {
  const storage = new MemoryStorage();
  const session = new MemoryStorage();
  const browser = new BrowserEvents(storage, session);
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  const hadLocalStorage = "localStorage" in globalThis;
  const previousLocalStorage = globalThis.localStorage;
  const hadSessionStorage = "sessionStorage" in globalThis;
  const previousSessionStorage = globalThis.sessionStorage;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser as unknown as Window & typeof globalThis,
  });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: session });

  try {
    assert.deepEqual(resetProgressRecencyAfterGlobalReset(), { persisted: true });
    assert.deepEqual(recordProgressActivity("github", 100), { persisted: true });
    assert.deepEqual(recordProgressActivity("prompts", 200), { persisted: true });
    assert.deepEqual(recordProgressActivity("github", 300), { persisted: true });
    assert.deepEqual(
      sortCourseIdsByRecentActivity(
        ["rag", "github", "prompts"],
        readProgressRecency().activity,
      ),
      ["github", "prompts", "rag"],
    );

    const persisted = JSON.parse(storage.getItem(PROGRESS_RECENCY_STORAGE_KEY) || "null");
    assert.deepEqual(Object.keys(persisted).sort(), ["activity", "version"]);
    assert.deepEqual(Object.keys(persisted.activity).sort(), ["github", "prompts"]);

    storage.setItem(PROGRESS_RECENCY_STORAGE_KEY, JSON.stringify({
      version: 1,
      activity: { github: 700, prompts: 800, rag: 900 },
    }));
    const refreshed = readProgressRecency();
    assert.equal(refreshed.persistence, "persistent");
    assert.deepEqual(
      sortCourseIdsByRecentActivity(["github", "prompts", "rag"], refreshed.activity),
      ["rag", "prompts", "github"],
      "a refresh or another tab uses the persisted multi-course ordering",
    );

    const malformed = "{recency-is-not-json";
    storage.setItem(PROGRESS_RECENCY_STORAGE_KEY, malformed);
    assert.deepEqual(readProgressRecency(), {
      activity: {},
      persistence: "session-only",
      reason: "corrupt",
    });
    assert.deepEqual(recordProgressActivity("mcp", 1_000), {
      persisted: false,
      reason: "corrupt",
    });
    assert.equal(storage.getItem(PROGRESS_RECENCY_STORAGE_KEY), malformed);
    assert.deepEqual(readProgressRecency().activity, { mcp: 1_000 });
    assert.deepEqual(resetProgressRecencyAfterGlobalReset(), {
      persisted: true,
      quarantined: true,
    });
    assert.equal(storage.getItem(PROGRESS_RECENCY_STORAGE_KEY), null);
    assert.equal(storage.getItem(RECENCY_RESET_QUARANTINE_KEY), malformed);
    assert.deepEqual(resetProgressRecencyAfterGlobalReset(), { persisted: true });
  } finally {
    if (hadWindow) Object.defineProperty(globalThis, "window", { configurable: true, value: previousWindow });
    else Reflect.deleteProperty(globalThis, "window");
    if (hadLocalStorage) {
      Object.defineProperty(globalThis, "localStorage", { configurable: true, value: previousLocalStorage });
    } else Reflect.deleteProperty(globalThis, "localStorage");
    if (hadSessionStorage) {
      Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: previousSessionStorage });
    } else Reflect.deleteProperty(globalThis, "sessionStorage");
  }
});
