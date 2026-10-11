import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("handbook accent corners use logical radii so Arabic mirrors them", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const rules = [
    /\.hb \.emailcard \.inj\{[^}]+\}/,
    /\.hb \.skip\{[^}]+\}/,
    /\.hb \.sitefoot \.note\{[^}]+\}/,
  ];
  for (const rule of rules) {
    const block = css.match(rule)?.[0];
    assert.ok(block, `missing rule ${rule}`);
    assert.match(block, /border-start-end-radius:/);
    assert.match(block, /border-end-end-radius:/);
    assert.doesNotMatch(block, /border-radius:/);
  }
});
