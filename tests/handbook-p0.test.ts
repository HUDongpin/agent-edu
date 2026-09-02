import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import handbookMarkupSource from "../lib/handbook/markup";
import {
  HANDBOOK_WIDE_BREAKPOINT,
  HANDBOOK_WIDE_QUERY,
  handbookOrientation,
  tabTargetIndex,
} from "../lib/tab-navigation";
import { assertCspConfiguration } from "../scripts/check-csp.mjs";

const behaviour = readFileSync("lib/handbook/behaviour.ts", "utf8");
const css = readFileSync("app/globals.css", "utf8");
const handbookMarkup = handbookMarkupSource as string;

function openingTag(id: string): string {
  return handbookMarkup.match(new RegExp(`<[^>]+id="${id}"[^>]*>`))?.[0] ?? "";
}

test("the Handbook breakpoint is exact at 979/980", () => {
  assert.equal(HANDBOOK_WIDE_BREAKPOINT, 980);
  assert.equal(HANDBOOK_WIDE_QUERY, "(min-width: 980px)");
  assert.equal(handbookOrientation(979), "horizontal");
  assert.equal(handbookOrientation(980), "vertical");
  assert.match(css, /@media \(max-width:979px\)\{[\s\S]*?\n  \.hb \.shell/);
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

test("interactive diagrams and dynamic decisions expose equivalent non-visual structure", () => {
  assert.match(openingTag("dialSvg"), /role="group"/);
  assert.doesNotMatch(openingTag("dialSvg"), /role="img"/);
  assert.match(openingTag("depMap"), /role="group"/);
  assert.doesNotMatch(openingTag("depMap"), /role="img"/);

  const dialAt = handbookMarkup.indexOf('id="dialSvg"');
  const figureStart = handbookMarkup.lastIndexOf("<figure>", dialAt);
  const figureEnd = handbookMarkup.indexOf("</figure>", dialAt);
  const dialFigure = handbookMarkup.slice(figureStart, figureEnd);
  assert.equal((dialFigure.match(/<figcaption/g) ?? []).length, 1);

  assert.match(openingTag("recBox"), /role="status"/);
  assert.match(openingTag("recBox"), /aria-live="polite"/);
  assert.match(openingTag("recBox"), /aria-atomic="true"/);
  assert.match(openingTag("lStepAnnounce"), /role="status"/);

  assert.match(behaviour, /createElement\('fieldset'\)/);
  assert.match(behaviour, /createElement\('legend'\)/);
  assert.match(behaviour, /setAttribute\('aria-pressed','false'\)/);
  assert.match(behaviour, /b\.setAttribute\('aria-pressed','true'\)/);
  assert.doesNotMatch(behaviour, /'#recTitle'\]/);
  assert.match(behaviour, /graphLog\.setAttribute\('aria-atomic','false'\)/);
  assert.match(behaviour, /graphLog\.setAttribute\('aria-relevant','additions'\)/);
  assert.match(behaviour, /if \(ans\.q1==='yes'\)/);
  assert.match(behaviour, /else if \(!ans\.q2\|\|!ans\.q3\)/);
  assert.match(behaviour, /announce\.textContent=/);
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
  assert.match(
    behaviour,
    /t\.focus\(\);[\s\S]*?show\(t\.dataset\.p,\{focus:false,preserveTabViewport:true\}\)/,
  );
  assert.match(behaviour, /n\.focus\(\); show\(n\.dataset\.p,\{focus:false,preserveTabViewport:true\}\)/);
  assert.match(behaviour, /!opts\.silent && !opts\.preserveTabViewport && window\.scrollY>120/);
  assert.match(behaviour, /scrollIntoView\(\{block:'nearest',inline:'nearest',behavior:'instant'\}\)/);
});

test("the Handbook finishes in the Control Room and keeps Part 3 as a separate local course", () => {
  assert.match(handbookMarkup, /One last step/);
  assert.match(handbookMarkup, /Finish the Control Room next/);
  assert.match(handbookMarkup, /recommended Lab handoff appears with the result/);
  assert.match(handbookMarkup, /data-goto="play"/);
  assert.match(handbookMarkup, /Part 3 is the local TypeScript course/);
  assert.match(handbookMarkup, /DeepSeek, Claude, or fully offline mode/);
  assert.match(handbookMarkup, /course\/progress\.json/);
  assert.match(handbookMarkup, /href="\.\.\/build\/"/);
  const compareStart = handbookMarkup.indexOf('<section class="panel" id="p-compare"');
  const compareEnd = handbookMarkup.indexOf("</section>", compareStart);
  assert.doesNotMatch(handbookMarkup.slice(compareStart, compareEnd), /href="\.\.\/lab\/"/);
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

test("Phase 2 disclosures preserve the primary route and expose optional reference content natively", () => {
  const expected = [
    "start-practices", "start-guide", "code-method", "prompt-method",
    "context-method", "loop-method", "graph-method", "harness-method",
    "evals-method", "security-method", "compare-reference",
  ];
  const tags = handbookMarkup.match(/<details\b[^>]*data-disclosure="[^"]+"[^>]*>/g) ?? [];
  const actual = tags.map((tag) => tag.match(/data-disclosure="([^"]+)"/)?.[1]);
  assert.deepEqual(actual, expected);
  for (const tag of tags) {
    assert.doesNotMatch(tag, /\bopen(?:=|\s|>)/);
    assert.doesNotMatch(tag, /\bid=/, "disclosures must not change translation container IDs");
  }
  assert.match(handbookMarkup, /<summary[^>]*>[\s\S]*track\.1\.explorePractices/);
  assert.match(handbookMarkup, /<summary[^>]*>[\s\S]*track\.1\.courseGuide/);
  assert.match(handbookMarkup, /<summary[^>]*>[\s\S]*track\.1\.systemReference/);

  const start = handbookMarkup.slice(
    handbookMarkup.indexOf('<section class="panel on" id="p-start"'),
    handbookMarkup.indexOf("</section>", handbookMarkup.indexOf('<section class="panel on" id="p-start"')),
  );
  assert.ok(start.indexOf('id="dialSvg"') < start.indexOf('data-disclosure="start-practices"'));
  assert.ok(start.indexOf('data-disclosure="start-practices"') < start.indexOf('data-goto="play"'));
  assert.ok(start.indexOf('data-goto="play"') < start.indexOf('data-disclosure="start-guide"'));
  assert.ok(start.indexOf('data-disclosure="start-guide"') < start.lastIndexOf('data-goto="code"'));

  assert.match(behaviour, /closest\('details'\)/);
  assert.match(css, /\.hb \.course-disclosure/);
  assert.match(css, /@media print[\s\S]*\.course-disclosure > summary/);
});

test("Phase 2 makes overflow affordances named, focusable, and progress-aware", () => {
  assert.match(behaviour, /w\.setAttribute\('tabindex','0'\)/);
  assert.match(behaviour, /w\.setAttribute\('role','region'\)/);
  assert.match(behaviour, /w\.setAttribute\('aria-label'/);
  assert.match(behaviour, /w\.setAttribute\('aria-describedby'/);
  assert.match(behaviour, /scrollmeter/);
  assert.match(css, /\.hb \.scrollmeter/);
  assert.match(css, /\.hb \.fcwrap:focus-visible/);
});

test("primary section navigation follows the approved linear 00 through 10 route", () => {
  const order = [
    "start", "code", "prompt", "context", "loop", "graph",
    "harness", "evals", "security", "compare", "play",
  ] as const;
  for (let index = 0; index < order.length; index += 1) {
    const id = order[index];
    const start = handbookMarkup.indexOf(`<section class="panel${id === "start" ? " on" : ""}" id="p-${id}"`);
    const end = handbookMarkup.indexOf("</section>", start);
    assert.notEqual(start, -1, `${id} panel exists`);
    const panel = handbookMarkup.slice(start, end);
    const nav = panel.slice(panel.lastIndexOf('<div class="section-nav">'));
    if (index > 0) {
      assert.match(nav, new RegExp(`data-goto="${order[index - 1]}"`), `${id} goes back to ${order[index - 1]}`);
    }
    if (index < order.length - 1) {
      assert.match(nav, new RegExp(`data-goto="${order[index + 1]}"`), `${id} advances to ${order[index + 1]}`);
    }
  }
});

test("the assessment result owns the submitted status and recommended Lab handoff", () => {
  const compareStart = handbookMarkup.indexOf('<section class="panel" id="p-compare"');
  const compareEnd = handbookMarkup.indexOf("</section>", compareStart);
  const compare = handbookMarkup.slice(compareStart, compareEnd);
  assert.doesNotMatch(compare, /href="\.\.\/lab\/"/);
  assert.match(compare, /data-goto="play"/);

  const finishStart = behaviour.indexOf("function finish()");
  const finishEnd = behaviour.indexOf("start();", finishStart);
  const finish = behaviour.slice(finishStart, finishEnd);
  assert.match(finish, /w\.quiz\.assessmentSubmitted/);
  assert.match(finish, /w\.progress\.sectionsExplored/);
  assert.match(finish, /w\.progress\.continueLab/);
  assert.match(finish, /w\.progress\.continueLab\.link/);
  assert.match(finish, /w\.progress\.continueLab\.cost/);
  assert.match(finish, /href="\.\.\/lab\/"/);
  assert.match(finish, /role="status" aria-live="polite"/);
});

test("Control Room completion copy reports submission and this run without a mastery claim", () => {
  const widgets = JSON.parse(readFileSync("messages/widgets/en.json", "utf8")) as Record<string, string>;
  assert.equal(widgets["w.quiz.assessmentSubmitted"], "Assessment submitted");
  assert.match(widgets["w.quiz.allRight"], /this run/i);
  for (const key of [
    "w.quiz.grade.flawless",
    "w.quiz.grade.strong",
    "w.quiz.grade.solid",
    "w.quiz.grade.getting",
    "w.quiz.grade.early",
    "w.quiz.allRight",
  ]) {
    assert.doesNotMatch(
      widgets[key],
      /master|judgement|ability|whole skill|ship good systems/i,
      `${key} must describe only the submitted run`,
    );
  }
  for (const file of readdirSync("messages/widgets").filter((name) => name.endsWith(".json"))) {
    const localeWidgets = JSON.parse(
      readFileSync(`messages/widgets/${file}`, "utf8"),
    ) as Record<string, string>;
    assert.doesNotMatch(
      localeWidgets["w.progress.continueLab"],
      /[.。]$/u,
      `${file} must not wrap a trailing punctuation mark away from the result action`,
    );
  }
});

test("deep links, history, and saved-section restoration share the same show path", () => {
  assert.match(behaviour, /listen\(window,'popstate',restoreLocation\)/);
  assert.match(behaviour, /listen\(window,'hashchange',restoreLocation\)/);
  assert.match(behaviour, /const initial = NAMES\.has\(fromHash\) \? fromHash : readLearningState\(\)\.handbook\.lastSection/);
  assert.match(behaviour, /show\(initial,\{replace:true,focus:false,silent:true,record:false\}\)/);
  assert.match(behaviour, /show\(NAMES\.has\(h\)\?h:'start',\{replace:true,focus:false,silent:true,record:false\}\)/);
});

test("Handbook visits and Control Room finishes write only through progress v2", () => {
  assert.match(behaviour, /opts\.record===false\?readLearningState\(\):recordHandbookVisit\(name\)/);
  assert.match(behaviour, /recordHandbookVisit\(name\)/);
  assert.match(behaviour, /recordHandbookControlRoomFinish\(score\)/);
  assert.match(behaviour, /selectHandbookProgress\(learning\)/);
  assert.doesNotMatch(behaviour, /selectLabProgress\(learning\)/);
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

test("Vercel static headers carry the staged baseline CSP and deny framing", () => {
  const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8")) as {
    headers: Array<{ headers: Array<{ key: string; value: string }> }>;
  };
  const stageConfig = JSON.parse(readFileSync("config/csp-stage.json", "utf8"));
  assert.doesNotThrow(() => assertCspConfiguration(stageConfig, vercelConfig));
  const headers = Object.fromEntries(vercelConfig.headers[0].headers.map(({ key, value }) => [key, value]));
  assert.equal(headers["X-Frame-Options"], "DENY");
});
