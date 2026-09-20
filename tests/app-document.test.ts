import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/*
 * Two properties of the documents this site serves that no other gate sees: one
 * lives in an attribute, the other in a script that must run before paint.
 */

test("the locale layout asks Next to suspend smooth scrolling while it navigates", () => {
  // Next 16 stopped overriding scroll-behavior during a route transition. With
  // html{scroll-behavior:smooth} in globals.css and no attribute, every <Link>
  // animates its way back to the top of a long page instead of arriving there.
  const layout = readFileSync("app/[locale]/layout.tsx", "utf8");
  assert.match(layout, /<html[^>]*data-scroll-behavior="smooth"/);

  const css = readFileSync("app/globals.css", "utf8");
  assert.match(css, /html\{scroll-behavior:smooth/, "the attribute is only needed while the CSS asks for smooth");
});

test("the global 404 applies the reader's saved theme before paint", () => {
  // global-not-found bypasses the layout, so nothing else applies ae.theme: a
  // reader who chose dark by hand would get a white page on a wrong URL.
  const page = readFileSync("app/global-not-found.tsx", "utf8");
  assert.match(page, /localStorage\.getItem\("ae\.theme"\)/);
  assert.match(page, /setAttribute\("data-theme", *t\)|setAttribute\("data-theme",t\)/);
  assert.match(page, /<html[^>]*suppressHydrationWarning/, "the script runs before React hydrates");
  assert.ok(page.indexOf("ae.theme") < page.indexOf("<body>"), "it has to run before the body paints");
});
