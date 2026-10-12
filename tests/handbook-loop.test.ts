import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const behaviour = readFileSync("lib/handbook/behaviour.ts", "utf8");

function sliceBetween(source: string, startMarker: string, endMarker: string): string {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + 1);
  assert.ok(start >= 0 && end > start, `missing ${startMarker} .. ${endMarker}`);
  return source.slice(start, end);
}

test("clearing the graph widget abandons an in-flight play sequence", () => {
  /* Clear wiped the SVG and the log, but left `playing` true and the 640 ms
     chain running, so nodes relit, the result card came back, and every
     message button stayed dead until the abandoned sequence finished. */
  const src = sliceBetween(behaviour, "function play(key)", "06 — HARNESS");
  assert.match(src, /const token=playToken/);
  assert.match(src, /if\(token!==playToken\)/);
  assert.match(
    behaviour,
    /\$\('#gReset'\)\.addEventListener\('click',\(\)=>\{ playToken\+\+; playing=false; clearGraph\(\); \}\)/,
  );
});

test("resetting the loop widget abandons an in-flight step animation", () => {
  /* Reset — and the step-limit slider, which calls reset — increment runToken
     so the Run-to-the-end chain stops. The 300 ms animation inside
     stepAnimated did not read that token, so a delayed pushStep still wrote a
     card onto the cleared log and relit the flowchart. */
  const fn = sliceBetween(behaviour, "function stepAnimated", "$('#lStep')");
  assert.match(fn, /const token=runToken/);
  const delayed = fn.slice(fn.indexOf("setTimeout"));
  const guard = delayed.search(/token!==runToken|token !== runToken/);
  const push = delayed.indexOf("pushStep()");
  assert.ok(guard !== -1, "the delayed callback must observe runToken");
  assert.ok(push !== -1, "stepAnimated must still call pushStep");
  assert.ok(guard < push, "runToken must be checked before pushStep after the delay");
});
