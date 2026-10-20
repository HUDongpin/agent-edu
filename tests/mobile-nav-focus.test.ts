import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("components/MobileNav.tsx", "utf8");

test("MobileNav restores focus to the toggle on click-away and Escape", () => {
  // The open menu stays in the DOM as `.mainnav` without `.open`, which is
  // `display:none`. Leaving focus on a link inside it strands the keyboard.
  // Escape already focused the toggle; click-away must do the same unless the
  // press landed on another control (LanguageMenu's rule).
  const away = source.slice(source.indexOf("const away"), source.indexOf("const esc"));
  assert.match(away, /setOpen\(false\)/);
  assert.match(away, /takesFocus/);
  assert.match(away, /toggle\.current\?\.focus\(\)/);
  assert.match(away, /e\.preventDefault\(\)/);

  const esc = source.slice(source.indexOf("const esc"), source.indexOf("document.addEventListener(\"mousedown\""));
  assert.match(esc, /toggle\.current\?\.focus\(\)/);
});

test("the language menu stays inside the viewport on a narrow screen", () => {
  // Round 4 found the nine-language list could open past the edge under ~380px
  // (and past the fold in short landscape). Cap width and height; scroll inside.
  const css = readFileSync("app/globals.css", "utf8");
  const block = css.match(/\.langmenu\{[^}]+\}/)?.[0] ?? "";
  assert.match(block, /max-width:calc\(100vw - 16px\)/);
  assert.match(block, /max-height:min\(70vh/);
  assert.match(block, /overflow-y:auto/);
});
