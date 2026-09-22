import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("components/lab/Lab.tsx", "utf8");
const keyBarSource = readFileSync("components/lab/KeyBar.tsx", "utf8");
const stagesSource = readFileSync("components/lab/Stages.tsx", "utf8");

test("the Lab writes task evidence directly through Progress v2", () => {
  assert.match(source, /recordLabStep\("first-call"\)/);
  assert.match(source, /recordLabStep\("rules", \{ score: passing \}\)/);
  assert.match(source, /recordLabStep\("prompt-trial"\)/);
  assert.match(source, /recordLabStep\("full-eval", \{ score: n \}\)/);
  assert.doesNotMatch(source, /\bmark\(/);
  assert.doesNotMatch(source, /TODO\(progress-v2\)/);

  const evalFlow = source.slice(
    source.indexOf("async function runEval"),
    source.indexOf("function clearDraft"),
  );
  /* Cancellation and fatal failure now share one exit, so that both can keep the
     cases already billed on their way out. The shape changed; the invariant did
     not — neither reaches recordLabStep, so no stopped run can be written as a
     score. Assert the invariant rather than the old branch order. */
  assert.match(
    evalFlow,
    /status !== "completed"[\s\S]*?lab\.err\.cancelled[\s\S]*?return;[\s\S]*?recordLabStep\("full-eval"/,
  );
  assert.match(evalFlow, /status !== "completed"[\s\S]*?return;[\s\S]*?recordLabStep\("full-eval"/);
});

test("the mounted Lab wires the safe draft helper and explicit clear path", () => {
  assert.match(source, /const input: LabDraftInput = \{/);
  assert.match(source, /rules: encodeLabRules\(rules\)/);
  assert.match(source, /writeLabDraft\(input\)/);
  assert.match(source, /clearLabDraft\(\)/);
  assert.doesNotMatch(source, /resetLearningState/);
});

test("scaffolding fades without a lock and pre-Eval reflection stays out of requests", () => {
  assert.match(source, /const PARTIAL_SEED/);
  assert.match(source, /lab\.scaffold\.full/);
  assert.match(source, /lab\.scaffold\.partial/);
  assert.match(source, /lab\.scaffold\.independent/);
  assert.match(source, /lab\.reflection\.optional/);

  const orderRequest = source.match(/function orderMessages[\s\S]*?\n\}/)?.[0] ?? "";
  assert.doesNotMatch(orderRequest, /prediction|reason/i);
});

test("preview completion uses stable safe ids instead of private replies", () => {
  assert.match(source, /id: "preview-flat-white"/);
  assert.match(source, /id: "preview-two-teas"/);
  assert.match(source, /id: "preview-vague-kid"/);
  assert.match(source, /setCompletedPreviewIds\(tasks\.map\(\(\{ id \}\) => id\)\)/);
  assert.doesNotMatch(source, /setCompletedPreviewIds\([^)]*samples/);
});

test("paid runs freeze every input that determines or labels the request", () => {
  assert.match(source, /<KeyBar[\s\S]*?disabled=\{busy0 \|\| anyBatchBusy\}/);
  assert.match(source, /id="q0"[\s\S]*?disabled=\{busy0\}/);
  assert.match(source, /id="sys"[\s\S]*?disabled=\{anyBatchBusy\}/);
  assert.match(stagesSource, /if \(disabled\) return/);
  assert.match(stagesSource, /disabled=\{disabled\}/);
  assert.match(keyBarSource, /disabled=\{disabled \|\| verifying\}/);
});

test("Stage 1 shares the Provider client character limit while the client guards every path", () => {
  assert.match(source, /import \{ MAX_PROVIDER_MESSAGE_CHARACTERS \} from "@\/lib\/byok\/client"/);
  assert.match(source, /id="q0"[\s\S]*?maxLength=\{MAX_PROVIDER_MESSAGE_CHARACTERS\}/);
});

test("a first visit with no key opens on the free step, and does not persist a draft for arriving", () => {
  /* Step 1 cannot run without a paid credential, so opening there made the
     Lab's first screen a signup wall while the one free exercise sat unread in
     the next tab. The no-draft branch now consults the key. */
  const restore = source.slice(
    source.indexOf("const draft = readLabDraft()"),
    source.indexOf("setDraftReady(true)"),
  );
  assert.match(restore, /const opening = getKey\(\) \? 0 : 1;/);
  assert.match(restore, /if \(opening !== 0\) setStage\(opening\);/);

  /* The baseline fingerprint has to move with the opening stage. Left at 0,
     merely arriving reads as an edit and writes a draft for a reader who has
     typed nothing. */
  assert.match(restore, /draftFingerprint\(\s*opening,/);
  assert.doesNotMatch(restore, /draftFingerprint\(\s*0,\s*freshLabRules\(\)/);

  /* A restored draft still decides its own stage. */
  assert.match(restore, /setStage\(draft\.stage\)/);
});

test("a stored draft the Lab cannot read is reported, and Clear opens where a first visit does", () => {
  /* Pilot task C5 plants a malformed draft and asks the learner to notice it
     was ignored and press Clear draft. The Lab used to greet that reader with
     "No local draft saved yet", and unreadable rules fell back to the defaults
     under a "saved at" status. Both now say the draft was ignored. */
  const restore = source.slice(
    source.indexOf("const draft = readLabDraft()"),
    source.indexOf("setDraftReady(true)"),
  );
  assert.doesNotMatch(restore, /decodeLabRules\(draft\.rules\) \?\? freshLabRules\(\)/);
  assert.match(restore, /if \(draft && restoredRules\)/);
  assert.match(restore, /if \(draft \|\| labDraftDamaged\(\)\) setDraftProblem\("damaged"\);/);

  /* Clear used to reset to step 1, the paid step, even without a key. Stage,
     fingerprint and stored input must move together, or the cleared state
     reads as an edit and a draft is written straight back. */
  const clear = source.slice(source.indexOf("function clearDraft"), source.indexOf("function stopBatch"));
  assert.match(clear, /const opening = getKey\(\) \? 0 : 1;/);
  assert.match(clear, /draftFingerprint\(opening,/);
  assert.match(clear, /stage: opening,/);
  assert.match(clear, /setStage\(opening\);/);
  assert.doesNotMatch(clear, /setStage\(0\)|stage: 0,|draftFingerprint\(0,/);

  /* Unreadable rules now discard the whole draft, so the Lab must never write
     one: an option without a value stores its visible text, which a page
     translator can rewrite into a name the rules decoder rejects. */
  assert.match(source, /<option key=\{m\} value=\{m\}>\{m\}<\/option>/);
  assert.match(source, /rules\.length < MAX_LAB_RULES && Object\.prototype\.hasOwnProperty\.call\(MENU, ri\)/);

  for (const locale of LOCALES) {
    const messages = siteMessages(locale);
    const damaged = messages["lab.draft.damaged"];
    assert.ok(damaged?.trim(), `${locale}: lab.draft.damaged missing`);
    assert.ok(damaged.includes(messages["lab.draft.clear"]),
      `${locale}: lab.draft.damaged must name the button as it is labelled`);
  }
});

test("the menu button is offered only once a baseline score exists", () => {
  /* Enabled from the moment a prompt was, it sat beside Run reading like the
     helpful one; pressing it first bought a good number with no baseline, so
     the before/after banner never rendered. */
  const evalButtons = source.slice(
    source.indexOf('t("lab.s4.run")'),
    source.indexOf('t("lab.stop")', source.indexOf('t("lab.s4.run")')),
  );
  assert.match(evalButtons, /\{score !== null && \(/);
  const guard = evalButtons.indexOf("{score !== null && (");
  const button = evalButtons.indexOf("lab.s4.addMenu");
  assert.ok(guard !== -1 && button !== -1 && guard < button,
    "the add-the-menu button must sit inside the score guard, not beside it");
});

const LOCALES = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"] as const;
const siteMessages = (locale: string): Record<string, string> =>
  JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));
const widgetMessages = (locale: string): Record<string, string> =>
  JSON.parse(readFileSync(`messages/widgets/${locale}.json`, "utf8"));

test("the key panel names a price before the reader is asked to fund an account", () => {
  /* Four risk paragraphs with no currency amount in any of them, at the moment
     someone decides whether to open a billing account, read as "this could cost
     anything". The disclosures are unchanged; the number arrives before them. */
  for (const locale of LOCALES) {
    const plan = siteMessages(locale)["lab.callPlan"];
    assert.ok(plan?.includes("{cost}"), `${locale}: lab.callPlan must carry {cost}`);
    assert.ok(plan.includes("{calls}") && plan.includes("{tokens}"),
      `${locale}: lab.callPlan must keep its existing placeholders`);
  }

  /* Computed from the same conservativePrice path as the per-step disclosures,
     so the figure shown before funding cannot disagree with the ones met later. */
  assert.match(source, /const journeyEstimate = stage1Estimate \+ stage3Estimate \+ evalEstimate \* 2;/);
  assert.match(source, /journeyEstimate=\{journeyEstimate\}/);
  assert.match(keyBarSource, /journeyEstimate: number;/);
  assert.match(keyBarSource, /\.replace\("\{cost\}", formatEstimate\(journeyEstimate, locale\)\)/);

  /* Cents get cents; anything under one keeps the five-decimal form, so a small
     estimate can never round away into a free-looking "$0.00". */
  assert.match(keyBarSource, /formatCost\(usd, locale, usd >= 0\.01 \? 2 : 5\)/);
});

test("costs are written in the reader's language, never assembled in English order", async () => {
  /* The billing line glued counts to noun phrases with `+` in English order,
     twice, and every amount was "$" plus toFixed. In Arabic the bidi algorithm,
     not a translator, decided where the pieces landed. */
  const { billingText, formatCost, formatCount } = await import("../lib/lab/cost");
  /* The café menu's own prices stay as they are: the menu is exercise data and
     stays English (lab.enData). Everything the reader pays goes through here. */
  assert.doesNotMatch(keyBarSource, /toFixed\(|toLocaleString\(/, "money and counts go through lib/lab/cost");
  assert.doesNotMatch(source, /Estimate\.toFixed|Usd\.toFixed|\.toFixed\(5\)/, "money goes through lib/lab/cost");
  for (const file of [source, keyBarSource]) {
    assert.doesNotMatch(file, /lab\.knownSubtotal|lab\.billingRejected|lab\.billingUnknown/);
    assert.match(file, /billingText\(billing, t, locale\)/);
  }

  const shapes = {
    "lab.billing.known": [],
    "lab.billing.knownRejected": ["rejected"],
    "lab.billing.knownUnknown": ["unknown"],
    "lab.billing.knownRejectedUnknown": ["rejected", "unknown"],
  } as const;
  for (const locale of LOCALES) {
    const messages = siteMessages(locale);
    for (const [key, counts] of Object.entries(shapes)) {
      const names = [...(messages[key] ?? "").matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      assert.deepEqual(names, ["cost", ...counts].sort(), `${locale}: ${key} must carry exactly its own figures`);
    }
    assert.equal(messages["lab.knownSubtotal"], undefined, `${locale}: the old fragment keys are gone`);
  }

  /* Each ledger shape picks its own whole message, and every figure lands. */
  const en = siteMessages("en");
  const t = (key: string) => en[key] ?? key;
  const snapshot = {
    dispatchedCalls: 4, usageConfirmedCalls: 1, providerRejectedCalls: 2, unknownAfterSendCalls: 1,
    notSentAttempts: 0, knownUsd: 0.001234, hasUnknown: true,
    usage: { promptTokens: 0, promptCacheHitTokens: 0, promptCacheMissTokens: 0, completionTokens: 0 },
  };
  assert.equal(billingText(snapshot, t, "en"),
    "known subtotal $0.00123 + 2 provider-rejected request(s) with no usage + 1 request(s) with unknown billing");
  assert.equal(billingText({ ...snapshot, providerRejectedCalls: 0 }, t, "en"),
    "known subtotal $0.00123 + 1 request(s) with unknown billing");
  assert.equal(billingText({ ...snapshot, unknownAfterSendCalls: 0, hasUnknown: false }, t, "en"),
    "known subtotal $0.00123 + 2 provider-rejected request(s) with no usage");
  assert.equal(billingText({ ...snapshot, providerRejectedCalls: 0, unknownAfterSendCalls: 0, hasUnknown: false }, t, "en"),
    "known subtotal $0.00123");

  /* The page's locale and the snapshot's currency, five decimals, and the Latin
     digits the Arabic copy already writes its own figures in. */
  assert.equal(formatCost(0.001234, "en"), "$0.00123");
  assert.match(formatCost(0.001234, "de"), /^0,00123\s\$$/);
  assert.match(formatCost(0.001234, "ar"), /0\.00123/);
  assert.equal(formatCost(0.05, "en", 2), "$0.05");
  assert.equal(formatCount(7600, "en"), "7,600");
  assert.equal(formatCount(7600, "de"), "7.600");
  assert.match(formatCount(7600, "ar"), /^7.600$/);
});

test("a timeout names the Lab's own cap instead of blaming the reader's connection", () => {
  /* lab.err.network says to check the internet connection. A timeout is the
     Lab's cap firing on a slow provider, and sent a beginner to debug their wifi. */
  const deepseek = readFileSync("lib/deepseek.ts", "utf8");
  assert.match(deepseek, /case "timeout": return "lab\.err\.timeout";/);
  assert.match(deepseek, /case "network": return "lab\.err\.network";/);

  /* The number shown is the constant the request actually ran under. */
  const failSource = readFileSync("components/lab/Fail.tsx", "utf8");
  assert.match(failSource, /t\(msgKey\)\.replace\("\{seconds\}", formatSeconds\(timeoutMs, locale\)\)/);
  assert.equal(source.match(/<Fail [^>]*timeoutMs=\{REQUEST_TIMEOUT_MS\}/g)?.length, 3,
    "every Lab failure is told the cap its request ran under");
  assert.match(keyBarSource, /timeoutMs: KEY_CHECK_TIMEOUT_MS/);
  assert.match(keyBarSource, /t\(failure\.key\)\.replace\("\{seconds\}", formatSeconds\(KEY_CHECK_TIMEOUT_MS, locale\)\)/);

  for (const locale of LOCALES) {
    const message = siteMessages(locale)["lab.err.timeout"];
    assert.equal(message?.match(/\{seconds\}/g)?.length, 1, `${locale}: lab.err.timeout must name the cap once`);
    assert.notEqual(message, siteMessages(locale)["lab.err.network"]);
  }
});

test("the no-key failure also offers the scripted run, and focus follows the jump", () => {
  /* A reader with no card or on a managed laptop hit "needs your key" on step 1
     with one button, to a key box they may never be able to fill. The free
     twenty-case run was only reachable from step 4. */
  const failSource = readFileSync("components/lab/Fail.tsx", "utf8");
  assert.match(failSource, /noKey && onScriptedRun && \([\s\S]*?t\("lab\.s4\.recordedCta"\)/);
  assert.equal(source.match(/onScriptedRun=\{showScriptedRun\}/g)?.length, 3);

  const jump = source.slice(source.indexOf("function showScriptedRun"));
  assert.match(jump, /flushSync\(\(\) => \{\s*setStage\(3\);\s*setShowRecorded\(true\);\s*\}\);/);
  /* The pressed button unmounts with its step; focus goes to the note that
     introduces the run rather than falling to the body. */
  assert.match(jump, /\(recordedNote\.current \?\? document\.getElementById\(PANEL\)\)\?\.focus\(\)/);
  assert.match(source, /className="langnote"[^>]*ref=\{recordedNote\} tabIndex=\{-1\}/);
});

test("the no-credit failure has somewhere to go, in every language", () => {
  /* Verification is a models call and says so — it proves the credential and
     the model, never the balance — so the panel can read "verified" for an
     account that fails on its first paid request. That failure is the one whose
     fix lives on another website, and it was the only one with nothing to click. */
  const failSource = readFileSync("components/lab/Fail.tsx", "utf8");
  assert.match(failSource, /const noCredit = msgKey === "lab\.err\.noCredit";/);
  assert.match(failSource, /t\("lab\.err\.noCreditCta"\)/);
  assert.match(failSource, /target="_blank"[\s\S]{0,80}rel="noopener noreferrer"/);

  for (const locale of LOCALES) {
    const cta = siteMessages(locale)["lab.err.noCreditCta"];
    assert.ok(cta && cta.trim().length > 0, `${locale}: lab.err.noCreditCta is missing`);
  }
});

test("a stopped eval shows what it already bought, unscored and apart from the last result", () => {
  /* Kept out of `rows` on purpose: lab.err.cancelled promises the previous score
     was kept, and writing partial rows into the scored table would leave that
     score's meter standing above a different run's cases. */
  assert.match(source, /const \[partialRows, setPartialRows\] = useState<Row\[\]>\(\[\]\);/);
  assert.match(source, /setPartialRows\(outcome\.partialResults \?\? \[\]\);/);
  assert.match(source, /setPartialRows\(\[\]\);/);

  /* The partial block renders on its own, with no meter and no jump banner. */
  const partialBlock = source.slice(source.indexOf("stage === 3 && partialRows.length > 0"));
  assert.match(partialBlock, /t\("lab\.s4\.partial"\)/);
  assert.doesNotMatch(partialBlock.slice(0, partialBlock.indexOf("</section>")), /lab\.s4\.jump|className="meter"/);

  /* A stopped run must never be recorded as a result. */
  const evalFlow = source.slice(source.indexOf("async function runEval"), source.indexOf("function clearDraft"));
  const record = evalFlow.indexOf('recordLabStep("full-eval"');
  const earlyReturn = evalFlow.indexOf("setPartialRows(outcome.partialResults");
  assert.ok(earlyReturn !== -1 && record > earlyReturn,
    "the partial path must return before the eval is recorded");

  for (const locale of LOCALES) {
    const partial = siteMessages(locale)["lab.s4.partial"];
    assert.ok(partial?.includes("{done}") && partial.includes("{total}"),
      `${locale}: lab.s4.partial must carry {done} and {total}`);
  }
});

test("the scripted run is offered only without a key, and never dressed as a model", async () => {
  /* Only the rules wall runs without a key, so a learner with no card, on a
     managed laptop, or where the provider's billing does not reach felt the wall
     and never saw the answer behind it. What is shown is the course's own
     deterministic stand-in, and the copy has to keep saying so: the mechanism it
     demonstrates is true, the score is not a model's. */
  const { RECORDED_RUN, RECORDED_BEFORE, RECORDED_AFTER } =
    await import("../lib/lab/recorded");
  const { CASES } = await import("../lib/cafe/evalset");

  assert.equal(RECORDED_RUN.length, CASES.length, "the recording covers every case");
  assert.deepEqual(
    RECORDED_RUN.map((c) => c.id),
    CASES.map((c) => c.id),
    "and in the same order, so a reader can follow it against the real set",
  );
  // The jump is the lesson, and it has to be in the data rather than the prose.
  assert.ok(RECORDED_AFTER > RECORDED_BEFORE, "the menu must move the number");
  assert.ok(
    RECORDED_RUN.some((c) => !c.before && c.after),
    "some case must visibly flip",
  );
  // A failing case explains itself; a passing one has nothing to explain.
  for (const c of RECORDED_RUN) {
    if (!c.before) assert.ok(c.why.trim(), `${c.id} failed without a reason`);
  }

  assert.match(source, /stage === 3 && !getKey\(\) && \(/);
  assert.match(source, /t\("lab\.s4\.recordedCta"\)/);
  // No meter and no jump banner: a scripted score must not borrow the shape of
  // an earned one.
  const block = source.slice(source.indexOf("stage === 3 && !getKey()"));
  const untilNext = block.slice(0, block.indexOf("partialRows.length > 0"));
  assert.doesNotMatch(untilNext, /className="meter"|lab\.s4\.jump/);

  for (const locale of LOCALES) {
    const note = siteMessages(locale)["lab.s4.recordedNote"];
    assert.ok(note?.includes("{before}") && note.includes("{after}"),
      `${locale}: the note must carry both scores`);
    assert.ok(siteMessages(locale)["lab.s4.recordedCta"], `${locale}: cta missing`);
  }
});

test("the journey has an ending, and says what is not translated", () => {
  /* After roughly four hours the last thing that happened was a box the reader
     ticked themselves, under a line saying nothing here checks your work. True,
     and the right thing for a site that cannot observe the course to say — but
     not a finish. And the English-only boundary was discovered rather than
     stated, unlike the café's menu, whose reasoning the site already gives. */
  const declare = readFileSync("components/build/Declare.tsx", "utf8");
  assert.match(declare, /done && \(/);
  for (const key of ["build.doneTitle", "build.doneBuilt", "build.doneNext"]) {
    assert.ok(declare.includes(key), `Declare must render ${key}`);
    for (const locale of LOCALES) {
      assert.ok(siteMessages(locale)[key]?.trim(), `${locale}: ${key} missing`);
    }
  }
  const build = readFileSync("app/[locale]/build/page.tsx", "utf8");
  assert.match(build, /t\("build\.boundary"\)/);
  const teach = readFileSync("app/[locale]/teach/page.tsx", "utf8");
  assert.match(teach, /t\("teach\.packLang"\)/);
  for (const locale of LOCALES) {
    assert.ok(siteMessages(locale)["build.boundary"]?.trim(), `${locale}: boundary missing`);
    assert.ok(siteMessages(locale)["teach.packLang"]?.trim(), `${locale}: packLang missing`);
  }
});

test("the previous run survives so the two can be read against each other", () => {
  /* setRows replaced the table outright, so after the second run the first
     run's twenty rows were gone and the payoff survived as two integers in one
     sentence. The lesson is not "11 became 18" — it is which cases stopped
     inventing a price, and that was the part the reader had to take on faith. */
  assert.match(source, /const \[prevRows, setPrevRows\] = useState<Row\[\]>\(\[\]\);/);
  /* Captured before the overwrite, or it captures the run that just finished. */
  const flow = source.slice(source.indexOf("async function runEval"), source.indexOf("function clearDraft"));
  const captured = flow.indexOf("setPrevRows(rows)");
  const replaced = flow.indexOf("setRows(res)");
  assert.ok(captured !== -1 && replaced !== -1 && captured < replaced,
    "the previous rows must be captured before setRows replaces them");

  /* Rendered only once there is a previous run to show, and behind its own
     score so the two tables cannot be confused. */
  assert.match(source, /prev !== null && prevRows\.length > 0 && \(/);
  assert.match(source, /t\("lab\.s4\.comparePrev"\)|k="lab\.s4\.comparePrev"/);

  for (const locale of LOCALES) {
    const label = siteMessages(locale)["lab.s4.comparePrev"];
    assert.ok(label?.includes("{prev}"), `${locale}: comparePrev must carry {prev}`);
  }
});

test("every eval row keeps the order the model produced, and shows it left-to-right", () => {
  /* The eval computed the order, handed it to the judge, then dropped it from the
     row: a 13/20 was a verdict with no evidence, and every passing row was a
     blank cell. Step 3 already shows the same value; step 4 now keeps it. */
  assert.match(source, /type Row = \{[^}]*order: string \| null;/);

  const start = source.indexOf("const tasks: EvalTask[]");
  const handle = source.indexOf("const handle = runner.start(tasks", start);
  const tasks = source.slice(start, handle);
  assert.equal(tasks.match(/order: JSON\.stringify\(order\),/g)?.length, 2,
    "the rule row and the judge row both keep the order");

  /* A content failure never produced one: the cell is empty, never "null". */
  const failure = source.slice(
    source.indexOf("onContentFailure:", handle),
    source.indexOf("setActiveBatch(", handle),
  );
  assert.match(failure, /order: null,/);

  /* JSON is code: left-to-right inside Arabic, as step 3's outbox renders it. */
  const cells = source.match(/<td className="mono" dir="ltr"[^>]*>\{r\.order \?\? ""\}<\/td>/g) ?? [];
  assert.equal(cells.length, 3, "the scored, previous and stopped-run tables each show the order");
  /* Wrapping anywhere let a 390px screen crush the column to a ribbon one
     character wide, and the twenty rows to nearly ten thousand pixels tall. A
     floor keeps the JSON readable and lets the table scroll inside .scroll. */
  for (const cell of cells) assert.match(cell, /minWidth: "24ch"/);
  assert.equal(source.match(/t\("lab\.s4\.thOrder"\)/g)?.length, 3);

  for (const locale of LOCALES) {
    const label = siteMessages(locale)["lab.s4.thOrder"];
    assert.ok(label?.trim() && label !== "lab.s4.thOrder", `${locale}: lab.s4.thOrder missing`);
  }
});

test("a complete run survives a reload, and a restored run is never counted again", () => {
  /* The menu button waits for a baseline score, and the draft restore never
     restored one: a reload between run 1 and run 2 cost another 28-request run
     to reach the before/after that step 4 exists to teach. */
  assert.match(source, /import \{ clearLabRun, readLabRun, runSavedThisDocument, writeLabRun, type StoredRow \} from "@\/lib\/lab\/run"/);

  /* The whole timer callback, not only up to setDraftReady, so bookkeeping added
     after it is still covered. */
  const restoreStart = source.indexOf("const draft = readLabDraft()");
  const restoreEnd = source.indexOf("return () => window.clearTimeout(timer)", restoreStart);
  assert.ok(restoreStart !== -1 && restoreEnd > restoreStart, "the restore callback must be found");
  const restore = source.slice(restoreStart, restoreEnd);
  assert.match(restore, /const run = readLabRun\(CASE_IDS\);/);
  for (const setter of [
    "setRows(fromStored(run.rows))",
    "setScore(run.score)",
    "setPrevRows(fromStored(run.prevRows))",
    "setPrev(run.prev)",
    "setRunModel(run.model)",
    "setPrevRunModel(run.prevModel)",
    /* The ledger lives as long as the page and the Lab remounts on a client-side
       return, so only a run from an earlier visit is introduced as restored. */
    "setRunRestored(!runSavedThisDocument())",
  ]) {
    assert.ok(restore.includes(setter), `the run must come back into the real state: ${setter}`);
  }
  /* Counted once, when it finished; announced once, when it finished. */
  assert.doesNotMatch(restore, /recordLabStep|setEvalAnnouncement/);

  /* Written on the completed path only, and after the record, so a storage
     failure can never cost it. A failed write never leaves an older run behind
     to be restored as the latest. */
  const evalFlow = source.slice(source.indexOf("async function runEval"), source.indexOf("function clearDraft"));
  const completedAt = evalFlow.indexOf("const res = outcome.results;");
  const recorded = evalFlow.indexOf('recordLabStep("full-eval"', completedAt);
  const written = evalFlow.indexOf("writeLabRun(");
  assert.ok(completedAt !== -1 && recorded > completedAt && written > recorded,
    "only a complete run is written, and only after it is recorded");
  assert.match(evalFlow, /writeLabRun\(\{ model: selectedModel, score: n, rows: res, prevModel: runModel, prev: score, prevRows: rows \}, CASE_IDS\)/);
  const afterWrite = evalFlow.slice(written);
  assert.ok(afterWrite.includes("clearLabRun()") && afterWrite.includes('setDraftProblem("unavailable")'),
    "a failed write must clear the older run and say storage is unavailable");
  assert.ok(evalFlow.indexOf("setRunRestored(false)", completedAt) !== -1,
    "a run that has just completed is never introduced as restored");

  /* asJSON only checks for an object; a reason that was not a string once
     crashed the save before the run was recorded. */
  assert.match(source, /why: typeof verdict\.why === "string" \? verdict\.why : ""/);

  /* Clear removes it from the device and the screen. */
  const clear = source.slice(source.indexOf("function clearDraft"), source.indexOf("function stopBatch"));
  assert.match(clear, /!clearLabDraft\(\) \|\| !clearLabRun\(\)/);
  assert.match(clear, /setScore\(null\)/);
  assert.match(clear, /setRows\(\[\]\)/);
  assert.match(clear, /setRunModel\(null\)/);

  /* A restored score sits above this tab's billing line, which cannot include it. */
  assert.match(source, /runRestored && \([\s\S]*?t\("lab\.s4\.restored"\)/);

  /* The banner says "same model". The select resets on reload, so a restored
     run compared with a new one must not claim a sameness nobody chose. */
  assert.match(source, /prev !== null && score > prev && prevRunModel === runModel && \(/);
  const completed = evalFlow.slice(evalFlow.indexOf("setRows(res)"));
  const capturedModel = completed.indexOf("setPrevRunModel(runModel)");
  const replacedModel = completed.indexOf("setRunModel(selectedModel)");
  assert.ok(capturedModel !== -1 && replacedModel !== -1 && capturedModel < replacedModel,
    "the previous run's model must be captured before the new one replaces it");

  /* The privacy note sits beside the Clear button and must say what is kept, in
     every language. These are the phrases each locale used for "model replies"
     when the note promised replies were not saved; none may come back. */
  const replies: Record<(typeof LOCALES)[number], string> = {
    en: "model replies", es: "respuestas del modelo", fr: "réponses du modèle", de: "Modellantworten",
    "zh-Hans": "模型回复", "zh-Hant": "模型回覆", ja: "モデルの応答", ko: "모델 답변", ar: "ردود النموذج",
  };
  /* And the reset confirmation must name the saved runs it erases. */
  const savedRuns: Record<(typeof LOCALES)[number], string> = {
    en: "eval runs", es: "ejecución de evaluación", fr: "exécution de l'évaluation", de: "Evaluationsläufen",
    "zh-Hans": "Eval 运行", "zh-Hant": "Eval 執行", ja: "Eval実行", ko: "Eval 실행", ar: "تشغيلات Eval",
  };
  /* The key does live on this device, in the tab's session storage; the note
     once denied it outright. */
  assert.match(siteMessages("en")["lab.draft.note"], /API key, which stays only in this tab's session storage/);
  assert.doesNotMatch(siteMessages("en")["lab.draft.note"], /scores or billing|does not store the API/);
  for (const locale of LOCALES) {
    const messages = siteMessages(locale);
    assert.ok(messages["lab.s4.restored"]?.trim(), `${locale}: lab.s4.restored missing`);
    for (const key of ["lab.draft.note", "lab.draft.preview"]) {
      assert.ok(!messages[key].includes(replies[locale]), `${locale}: ${key} still says model replies are not saved`);
    }
    assert.ok(messages["home.progResetConfirm"].includes(savedRuns[locale]),
      `${locale}: the reset confirmation must name the saved runs`);
    const preview = messages["lab.draft.preview"];
    assert.ok(preview.includes("{done}") && preview.includes("{total}"),
      `${locale}: lab.draft.preview must carry {done} and {total}`);
  }
});

test("the handbook's time claim matches what the page asks for, in every locale", () => {
  /* Forty-five minutes was the reading. The page's method is pressing things,
     and a reader who budgeted by it ran out around §05. Split rather than
     inflated, so a session length can be chosen instead of abandoned. */
  const courses = readFileSync("lib/courses.ts", "utf8");
  assert.match(courses, /topic: "foundations", minutes: 60/);
  for (const locale of LOCALES) {
    const meta = siteMessages(locale)["track.1.meta"];
    assert.doesNotMatch(meta, /\b45\b|٤٥/, `${locale}: track.1.meta still claims 45`);
  }
  /* The teacher pack really does offer 45-, 90- and 180-minute plans; that
     claim is about lesson lengths and is left alone. */
  assert.match(siteMessages("en")["teach.lede"], /45, 90 or 180 minutes/);
});
