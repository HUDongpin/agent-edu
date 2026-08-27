import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function cssBraceDepth(source: string, end: number): number {
  let depth = 0;
  let quote = "";
  let comment = false;

  for (let index = 0; index < end; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (comment) {
      if (character === "*" && next === "/") {
        comment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (character === "\\") index += 1;
      else if (character === quote) quote = "";
      continue;
    }
    if (character === "/" && next === "*") {
      comment = true;
      index += 1;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      assert.ok(depth >= 0, "globals.css closes a block that was not opened");
    }
  }
  return depth;
}

test("the homepage style section begins at CSS top level", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const marker = css.indexOf("AI learning platform home");
  assert.ok(marker >= 0, "homepage CSS marker must exist");
  assert.equal(
    cssBraceDepth(css, marker),
    0,
    "homepage rules must not be nested under a preceding Lab selector",
  );
});
