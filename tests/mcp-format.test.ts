import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { formatDeterministicInteger } from "../lib/deterministic-format";
import { formatMcpInteger } from "../lib/mcp/format";
import { MCP_LOCALES } from "../lib/mcp/types";

test("MCP integer formatting is byte-stable across server and browser ICU data", () => {
  for (const locale of MCP_LOCALES) {
    const expected = locale === "ar" ? "١٢٣٤٥٦٧٨٩٠" : "1234567890";
    assert.equal(formatMcpInteger(1_234_567_890, locale), expected, locale);
    assert.equal(formatMcpInteger(0, locale), locale === "ar" ? "٠" : "0", locale);
    assert.equal(formatMcpInteger(-42, locale), locale === "ar" ? "-٤٢" : "-42", locale);
  }

  assert.equal(formatDeterministicInteger(1_075, "ar-EG"), "١٠٧٥");
  assert.equal(formatDeterministicInteger(1_075, "en-US"), "1075");
  assert.equal(formatMcpInteger(1_075, "ar"), formatDeterministicInteger(1_075, "ar"));

  for (const path of ["lib/deterministic-format.ts", "lib/mcp/format.ts"]) {
    assert.doesNotMatch(
      readFileSync(path, "utf8"),
      /new\s+Intl\.NumberFormat|toLocaleString/,
      path,
    );
  }
});

test("MCP integer formatting rejects values outside its hydration-safe contract", () => {
  for (const value of [Number.NaN, Number.POSITIVE_INFINITY, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => formatDeterministicInteger(value, "en"), /safe integer/);
  }
});

test("MCP hydration-facing components do not format integers with Intl", () => {
  for (const path of [
    "components/mcp/CourseProgress.tsx",
    "components/mcp/FinalAssessment.tsx",
    "components/mcp/CapstoneChecklist.tsx",
    "components/SharedCourseShell.tsx",
  ]) {
    assert.doesNotMatch(readFileSync(path, "utf8"), /new\s+Intl\.NumberFormat|toLocaleString/, path);
  }
});
