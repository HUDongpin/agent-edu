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
  assert.match(evalFlow, /status === "cancelled"[\s\S]*?return;[\s\S]*?status !== "completed"/);
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
