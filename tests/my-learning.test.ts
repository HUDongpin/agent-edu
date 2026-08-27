import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("components/learning/MyLearning.tsx", "utf8");
const styles = readFileSync("app/globals.css", "utf8");

test("My Learning exposes four published-only, recency-aware groups", () => {
  assert.match(source, /createPublishedProgressAdapters\(locale\)/u);
  assert.doesNotMatch(source, /createAllProgressAdapters/u);
  assert.equal(source.match(/<LearningSection/g)?.length, 4);
  for (const key of [
    "learning.continue",
    "learning.inProgress",
    "learning.completed",
    "learning.suggested",
  ]) assert.match(source, new RegExp(key.replace(".", "\\.")), key);
  assert.match(source, /const allInProgress = sorted\.filter/u);
  assert.match(source, /allInProgress\.length[\s\S]*?allCompleted\.slice\(0, 1\)/u);
  assert.match(source, /state === "not-started"\)\.slice\(0, 3\)/u);
  assert.match(source, /description=\{t\("learning\.suggestedBody"\)\}/u);
  assert.match(source, /empty=\{t\("learning\.emptySuggested"\)\}/u);
});

test("restore and reset require confirmation and use visibly dangerous actions", () => {
  assert.match(source, /window\.confirm\(t\("learning\.importConfirm"\)\)/u);
  assert.match(source, /window\.confirm\(t\("progress\.resetConfirm"\)\)/u);
  assert.ok((source.match(/className="btn danger"/g)?.length ?? 0) >= 2);
  assert.match(styles, /\.btn\.danger\{/u);
  assert.match(source, /type="file"[\s\S]*?hidden/u);
  assert.doesNotMatch(source, /tabIndex=\{-1\}/u);
});

test("storage recovery and rollback failure have explicit, non-equivalent states", () => {
  assert.match(source, /inspectProgressPersistence\(\)/u);
  assert.match(source, /learning\.retryStorage/u);
  assert.match(source, /learning\.storageRecovered/u);
  assert.match(source, /learning\.storageStillUnavailable/u);
  assert.match(source, /restored\.reason === "write-failed"/u);
  assert.match(source, /learning\.importWriteFailed/u);
  assert.match(source, /learning\.importRollbackFailed/u);
});
