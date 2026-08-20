import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import handbookMarkup from "../lib/handbook/markup";
import {
  HANDBOOK_WIDE_BREAKPOINT,
  HANDBOOK_WIDE_QUERY,
  handbookOrientation,
  tabTargetIndex,
} from "../lib/tab-navigation";

const behaviour = readFileSync("lib/handbook/behaviour.ts", "utf8");
const css = readFileSync("app/globals.css", "utf8");

test("the Handbook breakpoint is exact at 979/980", () => {
  assert.equal(HANDBOOK_WIDE_BREAKPOINT, 980);
  assert.equal(HANDBOOK_WIDE_QUERY, "(min-width: 980px)");
  assert.equal(handbookOrientation(979), "horizontal");
  assert.equal(handbookOrientation(980), "vertical");
  assert.match(css, /@media \(max-width:979px\)\{\n  \.hb \.shell/);
  assert.doesNotMatch(css, /@media \(max-width:980px\)\{\n  \.hb \.shell/);
});

test("tab navigation roves, wraps, supports Home/End, and mirrors horizontal RTL", () => {
  assert.equal(tabTargetIndex("Home", 4, 11, "vertical"), 0);
  assert.equal(tabTargetIndex("End", 4, 11, "vertical"), 10);
  assert.equal(tabTargetIndex("ArrowDown", 10, 11, "vertical"), 0);
  assert.equal(tabTargetIndex("ArrowUp", 0, 11, "vertical"), 10);
  assert.equal(tabTargetIndex("ArrowLeft", 4, 11, "vertical"), null);

  assert.equal(tabTargetIndex("ArrowRight", 10, 11, "horizontal"), 0);
  assert.equal(tabTargetIndex("ArrowLeft", 0, 11, "horizontal"), 10);
  assert.equal(tabTargetIndex("ArrowRight", 0, 11, "horizontal", true), 10);
  assert.equal(tabTargetIndex("ArrowLeft", 0, 11, "horizontal", true), 1);
  assert.equal(tabTargetIndex("ArrowDown", 4, 11, "horizontal"), null);
});

test("static Handbook markup has one stable H1 and one roving tab stop", () => {
  const tabs = handbookMarkup.match(/<button class="rail-btn"[^>]+>/g) ?? [];
  assert.equal(tabs.length, 11);
  assert.equal(tabs.filter((tab) => tab.includes('aria-selected="true"')).length, 1);
  assert.equal(tabs.filter((tab) => tab.includes('tabindex="0"')).length, 1);
  assert.equal(tabs.filter((tab) => tab.includes('tabindex="-1"')).length, 10);
  assert.ok(tabs.find((tab) => tab.includes('aria-selected="true"'))?.includes('tabindex="0"'));
  assert.equal(handbookMarkup.match(/aria-orientation="horizontal"/g)?.length, 1);

  const firstPanel = handbookMarkup.indexOf('<section class="panel');
  const h1s = handbookMarkup.match(/<h1(?:\s|>)/g) ?? [];
  assert.equal(h1s.length, 1);
  assert.ok(handbookMarkup.indexOf("<h1") < firstPanel);
  assert.equal(handbookMarkup.slice(firstPanel).includes("<h1"), false);
  assert.equal((handbookMarkup.match(/<section class="panel/g) ?? []).length, 11);
  assert.equal((handbookMarkup.match(/<h2(?:\s|>)/g) ?? []).length, 11);
});

test("Handbook Part 1 is scripted-only and has no live-provider request path", () => {
  for (const forbidden of [
    "pLiveBtn",
    "pLiveBar",
    "pKeySave",
    "pKeyClear",
    "pModel",
    "pLiveCost",
    "sessionStorage",
    "api.deepseek.com",
  ]) {
    assert.equal(handbookMarkup.includes(forbidden), false, `${forbidden} survived in markup`);
  }
  assert.doesNotMatch(behaviour, /\bfetch\s*\(|sessionStorage|api\.deepseek\.com|Authorization|Bearer/);
  assert.match(behaviour, /t\.tabIndex=on\?0:-1/);
  assert.match(behaviour, /t\.focus\(\); show\(t\.dataset\.p,\{focus:false\}\)/);
  assert.match(behaviour, /scrollIntoView\(\{block:'nearest',inline:'nearest'\}\)/);
});

test("the Handbook hands Part 2 to Lab and Part 3 to the local TypeScript course", () => {
  assert.match(handbookMarkup, /Part 2 is four stages you can do right now, in this browser/);
  assert.match(handbookMarkup, /Part 3 is the local TypeScript course/);
  assert.match(handbookMarkup, /DeepSeek, Claude, or fully offline mode/);
  assert.match(handbookMarkup, /course\/progress\.json/);
  assert.match(handbookMarkup, /href="\.\.\/build\/"/);
  assert.doesNotMatch(handbookMarkup, /Part 1\.5|Part 2 \(Python\)|tree\/main\/course/);

  const files = readdirSync("messages/handbook").filter((name) => name.endsWith(".json"));
  const referenceKeys = Object.keys(
    JSON.parse(readFileSync("messages/handbook/en.json", "utf8")) as Record<string, string>,
  ).sort();
  for (const file of files) {
    const messages = JSON.parse(readFileSync(`messages/handbook/${file}`, "utf8")) as Record<string, string>;
    assert.deepEqual(Object.keys(messages).sort(), referenceKeys, `${file} diverged from the English key set`);
    assert.match(messages["hb.body.p-compare.84"], /DeepSeek/);
    assert.match(messages["hb.body.p-compare.84"], /Claude/);
    assert.match(messages["hb.body.p-compare.84"], /course\/progress\.json/);
  }
});

test("deep links, history, and saved-section restoration share the same show path", () => {
  assert.match(behaviour, /window\.addEventListener\('popstate',restoreLocation\)/);
  assert.match(behaviour, /window\.addEventListener\('hashchange',restoreLocation\)/);
  assert.match(behaviour, /const initial = NAMES\.has\(fromHash\) \? fromHash : readLearningState\(\)\.handbook\.lastSection/);
  assert.match(behaviour, /show\(initial,\{replace:true,focus:false,silent:true\}\)/);
});

test("Handbook visits and Control Room finishes write only through progress v2", () => {
  assert.match(behaviour, /recordHandbookVisit\(name\)/);
  assert.match(behaviour, /recordHandbookControlRoomFinish\(score\)/);
  assert.match(behaviour, /selectHandbookProgress\(learning\)/);
  assert.match(behaviour, /selectLabProgress\(learning\)/);
  assert.doesNotMatch(behaviour, /const PROG='ae\.progress'|localStorage\.getItem\('tch\.seen'\)/);
});

test("removed live-mode message keys stay removed in all nine locales", () => {
  for (const namespace of ["handbook", "widgets"]) {
    const files = readdirSync(`messages/${namespace}`).filter((file) => file.endsWith(".json"));
    assert.equal(files.length, 9);
    for (const file of files) {
      const messages = JSON.parse(readFileSync(`messages/${namespace}/${file}`, "utf8")) as Record<string, string>;
      const leftovers = Object.keys(messages).filter((key) =>
        namespace === "handbook"
          ? /hb\.body\.(?:pLiveBtn|pLiveBar|pKeySave|pKeyClear|pModel)/.test(key)
          : key.startsWith("w.ds.") || key.startsWith("w.prompt.live.") || key === "w.prompt.verdict.stable",
      );
      assert.deepEqual(leftovers, [], `${namespace}/${file} has live-mode keys`);
    }
  }
});

test("visible kiosk fixtures resolve through all nine widget tables", () => {
  const keys = [
    "w.code.rule.coffee",
    "w.code.rule.tea",
    "w.code.rule.juice",
    "w.code.label.coffee",
    "w.code.label.tea",
    "w.code.label.juice",
    "w.code.preset.coffeeCase",
    "w.code.preset.latte",
    "w.code.preset.warm",
    "w.code.preset.typo",
  ];
  for (const file of readdirSync("messages/widgets").filter((name) => name.endsWith(".json"))) {
    const messages = JSON.parse(readFileSync(`messages/widgets/${file}`, "utf8")) as Record<string, string>;
    for (const key of keys) assert.ok(messages[key], `${file} lacks ${key}`);
  }
  assert.doesNotMatch(behaviour, /label:'Coffee'|a latte please|something warm|Sorry, I don't understand/);
  assert.match(readFileSync("scripts/check-widgets.mjs", "utf8"), /REMAINING = \{ literals: 0, words: 0 \}/);
});

test("Vercel static headers carry the planned baseline CSP and deny framing", () => {
  const config = JSON.parse(readFileSync("vercel.json", "utf8")) as {
    headers: Array<{ headers: Array<{ key: string; value: string }> }>;
  };
  const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key, value]));
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(
    headers["Content-Security-Policy"],
    "default-src 'self'; script-src 'self' 'unsafe-inline'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.deepseek.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests;",
  );
});
