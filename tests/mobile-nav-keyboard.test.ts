import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("the mobile menu toggle remains an explicit sequential tab stop", () => {
  const source = readFileSync("components/MobileNav.tsx", "utf8");
  const toggle = source.match(/<button[\s\S]*?>/u)?.[0] ?? "";

  assert.match(toggle, /className=["']iconbtn navtoggle["']/u);
  assert.match(toggle, /tabIndex=\{0\}/u);
});
