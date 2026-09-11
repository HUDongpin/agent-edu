import assert from "node:assert/strict";
import test from "node:test";
import type { DraftStorage } from "../lib/lab/draft";
import {
  LAB_RUN_KEY,
  LAB_RUN_MAX_ORDER_LENGTH,
  LAB_RUN_MAX_WHY_LENGTH,
  clearLabRun,
  decodeLabRun,
  readLabRun,
  runSavedThisDocument,
  writeLabRun,
} from "../lib/lab/run";

class MemoryStorage implements DraftStorage {
  values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

const ids = ["large-flat-white", "two-teas", "the-usual"];
const order = JSON.stringify({
  items: [{ name: "flat white", size: "L", price: 5.1 }],
  total: 5.1,
  needs_confirmation: false,
});
/* Rows as the Lab holds them, with `said` and `kind`, which must never be stored. */
const rows = [
  { id: "large-flat-white", said: "large flat white please", kind: "rule", order, ok: true, why: "" },
  { id: "two-teas", said: "two teas", kind: "rule", order, ok: false, why: "items were [[\"flat white\",\"L\"]]" },
  { id: "the-usual", said: "I'll have the usual", kind: "judge", order: null, ok: false, why: "The provider answer was not valid JSON." },
];
const at = () => new Date("2026-09-11T08:00:00.000Z");
const stored = (row: (typeof rows)[number]) => ({ id: row.id, order: row.order, ok: row.ok, why: row.ok ? "" : row.why });
const flash = "deepseek-v4-flash" as const;
const pro = "deepseek-v4-pro" as const;
const firstRun = { model: flash, score: 1, rows, prevModel: null, prev: null, prevRows: [] };
const storedFirstRun = {
  version: 1,
  model: flash,
  score: 1,
  rows: rows.map(stored),
  prevModel: null,
  prev: null,
  prevRows: [],
  savedAt: at().toISOString(),
};
const storedTwoRuns = { ...storedFirstRun, prevModel: pro, prev: 1, prevRows: rows.map(stored) };

test("only a run saved in this page load counts as saved in it", () => {
  /* The billing ledger lives as long as the page. A run saved in it is already
     in the tab's billing total, so the Lab must not call it restored. This test
     is first in the file on purpose: nothing has been saved before it. */
  assert.equal(runSavedThisDocument(), false);
  const throwing: DraftStorage = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); },
  };
  assert.equal(writeLabRun(firstRun, ids, throwing, at), null);
  assert.equal(runSavedThisDocument(), false, "a failed save is not a save");
  assert.ok(writeLabRun(firstRun, ids, new MemoryStorage(), at));
  assert.equal(runSavedThisDocument(), true);
});

test("a complete run round-trips holding only what its rows show, and its model", () => {
  const storage = new MemoryStorage();
  const saved = writeLabRun(firstRun, ids, storage, at);
  assert.deepEqual(saved, storedFirstRun);
  assert.deepEqual(readLabRun(ids, storage), saved);

  const raw = storage.getItem(LAB_RUN_KEY)!;
  const parsed = JSON.parse(raw);
  assert.deepEqual(Object.keys(parsed).sort(),
    ["model", "prev", "prevModel", "prevRows", "rows", "savedAt", "score", "version"]);
  assert.deepEqual(Object.keys(parsed.rows[0]).sort(), ["id", "ok", "order", "why"]);
  assert.equal(raw.includes("large flat white please"), false, "said comes from the live eval set");
  assert.equal(raw.includes('"kind"'), false, "kind comes from the live eval set");
});

test("the previous run is kept beside it with its own score and model, all or nothing", () => {
  const storage = new MemoryStorage();
  const saved = writeLabRun({ model: flash, score: 1, rows, prevModel: pro, prev: 1, prevRows: rows }, ids, storage, at);
  assert.equal(saved?.prev, 1);
  assert.equal(saved?.prevModel, pro);
  assert.deepEqual(readLabRun(ids, storage)?.prevRows, rows.map(stored));

  assert.ok(decodeLabRun(storedTwoRuns, ids));
  assert.equal(decodeLabRun({ ...storedTwoRuns, score: 2 }, ids), null);
  assert.equal(decodeLabRun({ ...storedTwoRuns, prev: 3 }, ids), null);
  assert.equal(decodeLabRun({ ...storedTwoRuns, prev: null }, ids), null, "previous rows without a previous score");
  assert.equal(decodeLabRun({ ...storedTwoRuns, prev: undefined }, ids), null);
  assert.equal(decodeLabRun({ ...storedTwoRuns, prevModel: null }, ids), null, "a previous run without its model");
  assert.equal(decodeLabRun({ ...storedTwoRuns, prevRows: [] }, ids), null, "a previous score, but no rows");
  assert.equal(decodeLabRun({ ...storedFirstRun, prevModel: pro }, ids), null, "a previous model with no previous run");
});

test("a run's model must be one the Lab offers", () => {
  assert.equal(decodeLabRun({ ...storedFirstRun, model: "gpt-5" }, ids), null);
  assert.equal(decodeLabRun({ ...storedFirstRun, model: undefined }, ids), null);
  assert.equal(decodeLabRun({ ...storedTwoRuns, prevModel: "deepseek-v3" }, ids), null);
});

test("a stored run must match the live eval set exactly, or it is not restored at all", () => {
  assert.ok(decodeLabRun(storedFirstRun, ids));
  assert.equal(decodeLabRun(storedFirstRun, [...ids].reverse()), null, "same cases, different order");
  assert.equal(decodeLabRun(storedFirstRun, [...ids, "a-treat"]), null, "the set has grown since");
  assert.equal(decodeLabRun(storedFirstRun, ids.slice(0, 2)), null, "the set has shrunk since");
  assert.equal(decodeLabRun(storedFirstRun, []), null);
  assert.equal(decodeLabRun({ ...storedFirstRun, rows: [] }, ids), null, "a run always has rows");
});

test("a stored run rejects corrupt, wrong-version and out-of-range data", () => {
  const good = storedFirstRun;
  const withFirstRow = (patch: Record<string, unknown>) => ({ ...good, rows: [{ ...good.rows[0], ...patch }, ...good.rows.slice(1)] });
  assert.equal(decodeLabRun({ ...good, version: 2 }, ids), null);
  assert.equal(decodeLabRun({ ...good, savedAt: "not-a-date" }, ids), null);
  assert.equal(decodeLabRun(withFirstRow({ ok: "yes" }), ids), null);
  assert.equal(decodeLabRun(withFirstRow({ order: 42 }), ids), null);
  assert.equal(decodeLabRun(withFirstRow({ why: "x".repeat(LAB_RUN_MAX_WHY_LENGTH + 1) }), ids), null);
  assert.equal(decodeLabRun(withFirstRow({ order: "x".repeat(LAB_RUN_MAX_ORDER_LENGTH + 1) }), ids), null);

  const storage = new MemoryStorage();
  storage.setItem(LAB_RUN_KEY, "{broken");
  assert.equal(readLabRun(ids, storage), null);
});

test("the writer stores no more than a row shows, and never clips an order into broken JSON", () => {
  const long = [
    { ...rows[0], why: "The reply asks the customer to confirm, which meets the standard." },
    { ...rows[1], why: "w".repeat(300) },
    { ...rows[2], order: "o".repeat(LAB_RUN_MAX_ORDER_LENGTH + 1) },
  ];
  const saved = writeLabRun({ ...firstRun, rows: long }, ids, new MemoryStorage(), at);
  assert.equal(saved?.rows[0].why, "", "a passing row's reason is never shown, so never kept");
  assert.equal(saved?.rows[1].why.length, LAB_RUN_MAX_WHY_LENGTH);
  assert.equal(saved?.rows[2].order, null);
});

test("a reason that is not a string cannot break the save", () => {
  /* asJSON only checks that a judge answered with an object, so "why" can be any
     JSON value. It used to throw inside the Lab's completion path. */
  const odd = [rows[0], { ...rows[1], why: 1 }, { ...rows[2], why: ["x"] }] as unknown as typeof rows;
  const saved = writeLabRun({ ...firstRun, rows: odd }, ids, new MemoryStorage(), at);
  assert.equal(saved?.rows[1].why, "");
  assert.equal(saved?.rows[2].why, "");
});

test("a stored run never carries a key, a prompt or billing, even when handed them", () => {
  const storage = new MemoryStorage();
  writeLabRun({
    ...firstRun,
    rows: rows.map((row) => ({ ...row, apiKey: "not-a-real-key", prompt: "private prompt" })),
    billing: "usage-confirmed",
  } as Parameters<typeof writeLabRun>[0], ids, storage, at);
  const raw = storage.getItem(LAB_RUN_KEY)!;
  assert.equal(raw.includes("not-a-real-key"), false);
  assert.equal(raw.includes("private prompt"), false);
  assert.equal(raw.includes("billing"), false);
});

test("a stored run fails safe when storage does, and clear is explicit", () => {
  const throwing: DraftStorage = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); },
  };
  assert.equal(readLabRun(ids, throwing), null);
  assert.equal(writeLabRun(firstRun, ids, throwing), null);
  assert.equal(clearLabRun(throwing), false);

  const storage = new MemoryStorage();
  assert.ok(writeLabRun(firstRun, ids, storage), "there must be something to clear");
  assert.equal(clearLabRun(storage), true);
  assert.equal(readLabRun(ids, storage), null);
});
