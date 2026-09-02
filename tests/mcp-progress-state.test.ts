import assert from "node:assert/strict";
import test from "node:test";
import {
  MCP_PROGRESS_QUIZ,
  readVersionedQuizProgress,
} from "../lib/progress-topology";
import {
  isMcpQuizPassed,
  readMcpQuizProgress,
  resetMcpProgressAfterGlobalReset,
} from "../components/mcp/progress-store";

const validRecord = (best: unknown, passed: unknown = true) => ({
  [MCP_PROGRESS_QUIZ.versionKey]: MCP_PROGRESS_QUIZ.bankVersion,
  [MCP_PROGRESS_QUIZ.bestScoreKey]: best,
  [MCP_PROGRESS_QUIZ.passedKey]: passed,
});

test("MCP assessment pass state requires a current, integer, in-range best score", () => {
  for (const best of [undefined, "15", 14, 15.5, 19]) {
    const record = validRecord(best);
    assert.deepEqual(readMcpQuizProgress(record), {
      best: Number.isInteger(best) && typeof best === "number" && best >= 0 && best <= 18
        ? best
        : 0,
      passed: false,
    });
    assert.equal(isMcpQuizPassed(record), false);
  }

  assert.equal(isMcpQuizPassed(validRecord(18, false)), false);
  assert.equal(isMcpQuizPassed({ ...validRecord(18), [MCP_PROGRESS_QUIZ.versionKey]: "stale" }), false);
  for (const best of [15, 16, 17, 18]) {
    assert.deepEqual(readMcpQuizProgress(validRecord(best)), { best, passed: true });
    assert.equal(isMcpQuizPassed(validRecord(best)), true);
  }
});

test("the generic versioned quiz reader and MCP wrapper have one interpretation", () => {
  for (const record of [
    {},
    validRecord(14),
    validRecord(15),
    validRecord(18, false),
  ]) {
    assert.deepEqual(
      readMcpQuizProgress(record),
      readVersionedQuizProgress(record, MCP_PROGRESS_QUIZ),
    );
  }
});

test("MCP global-reset fallback is safe without a browser window", () => {
  const hadWindow = "window" in globalThis;
  const previousWindow = globalThis.window;
  Reflect.deleteProperty(globalThis, "window");
  try {
    assert.deepEqual(resetMcpProgressAfterGlobalReset(), {
      persisted: false,
      reason: "unavailable",
    });
  } finally {
    if (hadWindow) {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: previousWindow,
      });
    }
  }
});
