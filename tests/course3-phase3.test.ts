import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Course 3 print uses a scoped light palette even when the screen theme is dark", () => {
  const css = readFileSync("components/courses/Course3Launchpad.module.css", "utf8");
  const printAt = css.indexOf("@media print");
  assert.ok(printAt >= 0);
  const print = css.slice(printAt);

  assert.match(print, /\.buildPage\s*\{/);
  assert.match(print, /color-scheme:\s*light/);
  for (const token of [
    "--bg", "--bg-2", "--card", "--ink", "--ink-2", "--ink-3",
    "--line", "--line-2", "--brand", "--gold", "--gold-soft",
  ]) {
    assert.match(print, new RegExp(`${token.replace(/-/g, "\\-")}:`), `${token} needs a print value`);
  }
  assert.doesNotMatch(css.slice(0, printAt), /\.buildPage[\s\S]*color-scheme:\s*light/);
});

test("printed primary sources retain wrapped LTR-isolated destinations", () => {
  const css = readFileSync("components/courses/Course3Launchpad.module.css", "utf8");
  const print = css.slice(css.indexOf("@media print"));

  assert.match(print, /\.sourceLink::after\s*\{[\s\S]*content:\s*attr\(href\)/);
  assert.match(print, /\.sourceLink::after\s*\{[\s\S]*direction:\s*ltr/);
  assert.match(print, /\.sourceLink::after\s*\{[\s\S]*unicode-bidi:\s*isolate/);
  assert.match(print, /\.sourceLink::after\s*\{[\s\S]*overflow-wrap:\s*anywhere/);
  assert.match(print, /\.sourceLink\s+:global\(\.arrow\)\s*\{[\s\S]*display:\s*none/);
});

test("Copy keeps an idle live region and exposes success/error without new state", () => {
  const component = readFileSync("components/courses/CourseCommandBlock.tsx", "utf8");
  const css = readFileSync("components/courses/Course3Launchpad.module.css", "utf8");

  assert.match(component, /data-copy-state=\{status\s*\?\s*copied\s*\?\s*["']success["']\s*:\s*["']error["']\s*:\s*["']idle["']\}/);
  assert.equal((component.match(/useState\(/g) ?? []).length, 2);
  assert.doesNotMatch(component, /useEffect|setTimeout|localStorage|sessionStorage/);
  assert.doesNotMatch(css, /\.commandStatus:empty\s*\{[^}]*display:\s*none/);
  assert.match(css, /\.commandStatus:empty\s*\{[\s\S]*position:\s*absolute/);
  assert.match(css, /\.commandStatus:empty\s*\{[\s\S]*clip(?:-path)?:/);
  assert.match(css, /\.commandStatus\[data-copy-state=["']success["']\][\s\S]*var\(--green\)/);
  assert.match(css, /\.commandStatus\[data-copy-state=["']error["']\][\s\S]*var\(--red\)/);
});
