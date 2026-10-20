import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import markup from "../lib/handbook/markup";

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

test("the context-window ceiling is positioned from the inline start", () => {
  const behaviour = readFileSync("lib/handbook/behaviour.ts", "utf8");
  assert.match(
    behaviour,
    /style="inset-inline-start:'\+\(LIMIT\/used\*100\)/,
  );
  assert.doesNotMatch(behaviour, /style="left:/);
});

test("handbook callout accents use the inline-start edge", () => {
  assert.equal(markup.includes("border-left-width"), false);
  assert.equal(markup.split("border-inline-start-width:5px").length - 1, 2);
});
