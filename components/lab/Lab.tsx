"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import KeyBar from "./KeyBar";
import Fail from "./Fail";
import Stages, { type Stage } from "./Stages";
import Rich from "../Rich";
import { useI18n } from "../I18nProvider";
import {
  asJSON,
  billingSnapshot,
  billingSnapshotOnServer,
  call,
  conservativePrice,
  conservativePromptTokenUpperBound,
  errorKey,
  getKey,
  keyStatusSnapshot,
  subscribeBilling,
  type Model,
} from "@/lib/deepseek";
import {
  LAB_STEPS,
  isProgressPersistenceAvailable,
  readLearningState,
  readLearningStateOnServer,
  recordLabStep,
  selectLabProgress,
  subscribeLearningState,
} from "@/lib/progress";
import { MENU, menuText, priceOf, type Order } from "@/lib/cafe/menu";
import { CASES } from "@/lib/cafe/evalset";
import {
  LAB_DRAFT_MAX_PROMPT_LENGTH,
  clearLabDraft,
  readLabDraft,
  writeLabDraft,
  type LabDraftInput,
} from "@/lib/lab/draft";
import {
  EVAL_PLAN,
  LAB_CONCURRENCY,
  STAGE_1_PLAN,
  STAGE_3_PLAN,
  assertEvalShape,
} from "@/lib/lab/plans";
import { LabRunner, type LabRunTask } from "@/lib/lab/runner";
import {
  MAX_LAB_RULES,
  MAX_LAB_RULE_CONDITION_LENGTH,
  decodeLabRules,
  encodeLabRules,
  freshLabRules,
  type LabRule as Rule,
} from "@/lib/lab/rules";
import { MAX_PROVIDER_MESSAGE_CHARACTERS } from "@/lib/byok/client";

const SEED = `You are the till at a small café. Turn what the customer said into an order.

Reply as JSON: {"items":[{"name":..., "size":"S" or "L", "price":number}], "total":number, "needs_confirmation":boolean}

Sizes are S or L; if nobody says a size, use S.
If the order is vague or you had to guess, set needs_confirmation to true.`;

const PARTIAL_SEED = `You are the till at a small café. Turn what the customer said into an order.

Reply as JSON: {"items":[{"name":..., "size":"S" or "L", "price":number}], "total":number, "needs_confirmation":boolean}

Sizes are S or L; if nobody says a size, use S.
If the order is vague or you had to guess, [finish this condition].`;

const TESTS = ["tea", "large tea", "large flat white", "two teas", "americano, small",
  "LARGE FLAT WHITE!!!", "could I grab a large flat white when you get a sec",
  "flat white, make it large", "something warm for my kid, no coffee", "the usual"];

const PREVIEW_CASES = [
  { id: "preview-flat-white", said: "could I grab a large flat white when you get a sec" },
  { id: "preview-two-teas", said: "two teas" },
  { id: "preview-vague-kid", said: "something warm for my kid, no coffee" },
] as const;

const JUDGE_SYSTEM = "You grade one output against one written standard. Not style — only whether the standard is met. Reply as JSON.";
const MENU_GUARD = "Only ever order items on this menu, at exactly these prices. If they ask for something not on it, order nothing and set needs_confirmation to true.";

const PANEL = "labpanel";

type Row = { id: string; said: string; kind: string; ok: boolean; why: string };
type Err = { key: string; detail?: string } | null;
type ActiveBatch = { runId: string; kind: "preview" | "eval" } | null;
type ReflectionNote = { round: number; complete: boolean } | null;
type DraftProblem = "unavailable" | "clear-failed" | null;
type PendingDraft = { fingerprint: string; input: LabDraftInput };

const PREVIEW_IDS: ReadonlySet<string> = new Set(PREVIEW_CASES.map(({ id }) => id));

const REQUEST_TIMEOUT_MS = 45_000;

assertEvalShape(CASES.length, CASES.filter((item) => item.kind === "judge").length);

function orderMessages(said: string, system: string) {
  return [
    { role: "system" as const, content: system },
    {
      role: "user" as const,
      content: `Customer said: ${JSON.stringify(said)}. Reply with JSON only.`,
    },
  ];
}

function addMenu(system: string): string {
  return (system.trim() || SEED) + "\n\n" + menuText() + "\n\n" + MENU_GUARD;
}

function draftFingerprint(
  stage: number,
  rules: readonly Rule[],
  prompt: string,
  completedPreviewIds: readonly string[],
): string {
  return JSON.stringify([stage, rules, prompt, completedPreviewIds]);
}

function promptIncludesMenu(prompt: string): boolean {
  return prompt.includes(MENU_GUARD);
}

export default function Lab() {
  const { t, locale } = useI18n();
  const [stage, setStage] = useState(0);
  const [model, setModel] = useState<Model>("deepseek-v4-flash");
  const billing = useSyncExternalStore(
    subscribeBilling,
    billingSnapshot,
    billingSnapshotOnServer,
  );
  const [runner] = useState(() => new LabRunner());
  const [activeBatch, setActiveBatch] = useState<ActiveBatch>(null);
  useEffect(() => () => { runner.stop(); }, [runner]);

  /* Which steps are already finished, from the same store the home page and
     the catalogue read. Subscribed rather than loaded in an effect, so the
     ticks are right on the first paint. */
  const learning = useSyncExternalStore(
    subscribeLearningState,
    readLearningState,
    readLearningStateOnServer,
  );
  /* Whether those ticks will still be here tomorrow. Every course store says so
     when the answer is no, and the Lab is the one place that used to tick
     anyway. Server-rendered as true: the notice is a correction, not a flash. */
  const stored = useSyncExternalStore(
    subscribeLearningState,
    isProgressPersistenceAvailable,
    () => true,
  );
  const done = useMemo(() => {
    const completed = selectLabProgress(learning).completedSteps;
    return LAB_STEPS.map((step) => completed.includes(step));
  }, [learning]);

  // step 1 — the first call
  const [q, setQ] = useState(() => t("lab.s1.q"));
  const [a0, setA0] = useState("");
  const [err0, setErr0] = useState<Err>(null);
  const [busy0, setBusy0] = useState(false);

  // step 2 — the rule-based till (no model, no key)
  const [rules, setRules] = useState<Rule[]>(freshLabRules);
  const [rp, setRp] = useState(""); const [ri, setRi] = useState("flat white"); const [rs, setRs] = useState<"S" | "L">("L");
  const kiosk = (said: string) => {
    const x = said.toLowerCase().trim();
    for (const r of rules) if (x.includes(r.c.toLowerCase())) return { ...r, price: priceOf(r.n, r.s) };
    return null;
  };
  const passing = TESTS.filter((x) => kiosk(x)).length;
  /* Recorded in an effect, not while rendering: writing to storage during a
     render is a side effect React is free to run twice. */
  useEffect(() => {
    if (passing >= 8) recordLabStep("rules", { score: passing });
  }, [passing]);

  // steps 3 and 4 — the prompt, then the score
  const [sys, setSys] = useState("");
  const [samples, setSamples] = useState<string[]>([]);
  const [err2, setErr2] = useState<Err>(null);
  const [score, setScore] = useState<number | null>(null);
  const [prev, setPrev] = useState<number | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [prog, setProg] = useState("");
  const [err3, setErr3] = useState<Err>(null);
  const [evalAnnouncement, setEvalAnnouncement] = useState("");
  const [menuAdded, setMenuAdded] = useState(false);
  const [completedPreviewIds, setCompletedPreviewIds] = useState<string[]>([]);
  const [draftReady, setDraftReady] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftProblem, setDraftProblem] = useState<DraftProblem>(null);
  const lastPersistedDraftFingerprint = useRef<string | null>(null);
  const draftWritesSuppressed = useRef(false);
  const latestDraft = useRef<PendingDraft | null>(null);

  // Two pre-Eval reflections are deliberately ephemeral. They are not part
  // of ae.lab.draft.v1 and are never interpolated into a Provider message.
  const [evalAttempts, setEvalAttempts] = useState(0);
  const evalAttemptsRef = useRef(0);
  const [prediction, setPrediction] = useState("");
  const [predictionReason, setPredictionReason] = useState("");
  const [reflectionNote, setReflectionNote] = useState<ReflectionNote>(null);

  useEffect(() => {
    // Restore after hydration so a browser-local draft cannot make the first
    // client render disagree with the static HTML. The callback also keeps
    // the effect focused on synchronization with external storage.
    const timer = window.setTimeout(() => {
      const draft = readLabDraft();
      if (draft) {
        const restoredRules = decodeLabRules(draft.rules) ?? freshLabRules();
        const restoredPreviewIds = draft.completedPreviewIds
          .filter((id) => PREVIEW_IDS.has(id));
        lastPersistedDraftFingerprint.current = draftFingerprint(
          draft.stage,
          restoredRules,
          draft.prompt,
          restoredPreviewIds,
        );
        setStage(draft.stage);
        setRules(restoredRules);
        setSys(draft.prompt);
        setMenuAdded(promptIncludesMenu(draft.prompt));
        setCompletedPreviewIds(restoredPreviewIds);
        setDraftSavedAt(draft.savedAt);
      } else {
        lastPersistedDraftFingerprint.current = draftFingerprint(
          0,
          freshLabRules(),
          "",
          [],
        );
      }
      setDraftReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    const fingerprint = draftFingerprint(stage, rules, sys, completedPreviewIds);
    const input: LabDraftInput = {
      stage,
      rules: encodeLabRules(rules),
      prompt: sys,
      completedPreviewIds,
    };
    latestDraft.current = { fingerprint, input };
    if (lastPersistedDraftFingerprint.current === fingerprint) {
      draftWritesSuppressed.current = false;
      return;
    }
    draftWritesSuppressed.current = false;

    const persist = (updateStatus: boolean) => {
      if (draftWritesSuppressed.current) return;
      if (lastPersistedDraftFingerprint.current === fingerprint) return;
      const saved = writeLabDraft(input);
      if (!saved) {
        if (updateStatus) setDraftProblem("unavailable");
        return;
      }
      lastPersistedDraftFingerprint.current = fingerprint;
      if (updateStatus) {
        setDraftProblem(null);
        setDraftSavedAt(saved.savedAt);
      }
    };
    const timer = window.setTimeout(() => persist(true), 400);
    const onPageHide = () => persist(false);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [completedPreviewIds, draftReady, rules, stage, sys]);

  useEffect(() => () => {
    // Next's client-side navigation can unmount the Lab without pagehide.
    // Flush only a genuinely dirty snapshot; clear/default/restored baselines
    // remain untouched and therefore cannot be resurrected here.
    const pending = latestDraft.current;
    if (
      !pending
      || draftWritesSuppressed.current
      || lastPersistedDraftFingerprint.current === pending.fingerprint
    ) {
      return;
    }
    const saved = writeLabDraft(pending.input);
    if (saved) lastPersistedDraftFingerprint.current = pending.fingerprint;
  }, []);

  const draftTime = useMemo(() => {
    if (!draftSavedAt) return null;
    try {
      return new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(draftSavedAt));
    } catch {
      return null;
    }
  }, [draftSavedAt, locale]);

  const busy2 = activeBatch?.kind === "preview";
  const busy3 = activeBatch?.kind === "eval";
  const anyBatchBusy = activeBatch !== null;
  const formatBillingCost = (snapshot: ReturnType<typeof billingSnapshot>) => (
    `${t("lab.knownSubtotal")} $${snapshot.knownUsd.toFixed(5)}`
    + (snapshot.providerRejectedCalls > 0
      ? ` + ${snapshot.providerRejectedCalls} ${t("lab.billingRejected")}`
      : "")
    + (snapshot.hasUnknown
      ? ` + ${snapshot.unknownAfterSendCalls} ${t("lab.billingUnknown")}`
      : "")
  );
  const billingCost = formatBillingCost(billing);
  const stage1Estimate = conservativePrice(
    model,
    conservativePromptTokenUpperBound([{ content: q }]),
    STAGE_1_PLAN.maxOutputTokens,
  ).usd;
  const previewPromptTokens = PREVIEW_CASES.reduce((total, preview) => (
    total + conservativePromptTokenUpperBound(orderMessages(preview.said, sys))
  ), 0);
  const stage3Estimate = conservativePrice(
    model,
    previewPromptTokens,
    STAGE_3_PLAN.maxOutputTokens,
  ).usd;
  // Use the longer menu-augmented prompt so the same disclosure also covers
  // the "Add the menu, then re-run" paid action.
  const evalEstimateSystem = addMenu(sys);
  const generatorPromptTokens = CASES.reduce((total, testCase) => (
    total + conservativePromptTokenUpperBound(orderMessages(testCase.said, evalEstimateSystem))
  ), 0);
  const judgePromptTokens = CASES.reduce((total, testCase) => {
    if (testCase.kind !== "judge") return total;
    const fixedPrompt = conservativePromptTokenUpperBound([
      { content: JUDGE_SYSTEM },
      {
        content: `A café customer said: ${JSON.stringify(testCase.said)}\nThe system produced: \n\nStandard: ${testCase.standard}\n\nDoes it meet the standard? Be strict. Reply as JSON {"passes":boolean,"why":string}.`,
      },
    ]);
    // The generated order becomes judge input. Six prompt-token units per
    // capped output token leaves room for JSON escaping and message framing.
    return total + fixedPrompt + EVAL_PLAN.generatorMaxOutputTokens * 6;
  }, 0);
  const evalEstimate = conservativePrice(
    model,
    generatorPromptTokens + judgePromptTokens,
    EVAL_PLAN.maxOutputTokens,
  ).usd;

  async function takeOrder(
    said: string,
    system: string,
    maxTokens: number,
    selectedModel: Model,
    signal?: AbortSignal,
  ): Promise<Order> {
    const result = await call(orderMessages(said, system), {
        json: true,
        maxTokens,
        model: selectedModel,
        signal,
        timeoutMs: REQUEST_TIMEOUT_MS,
      });
    return asJSON<Order>(result.text);
  }

  function errorDetail(error: unknown): string {
    return error instanceof Error ? error.message : t("lab.err.content");
  }

  function paidKeyProblem(): string | null {
    if (!getKey()) return "lab.err.noKey";
    return keyStatusSnapshot() === "verified" ? null : "lab.err.unverified";
  }

  async function runPreview() {
    setErr2(null);
    if (busy0) return;
    const keyProblem = paidKeyProblem();
    if (keyProblem) { setErr2({ key: keyProblem }); return; }

    const selectedModel = model;
    type PreviewTask = LabRunTask<string> & { said: string };
    const tasks: PreviewTask[] = PREVIEW_CASES.map((preview) => ({
      id: preview.id,
      said: preview.said,
      async run(context) {
        context.checkpoint();
        const order = await takeOrder(
          preview.said,
          sys,
          STAGE_3_PLAN.maxOutputTokensPerCall,
          selectedModel,
          context.signal,
        );
        return `${preview.said}\n  → ${JSON.stringify(order)}`;
      },
    }));
    const handle = runner.start(tasks, {
      concurrency: STAGE_3_PLAN.calls,
      onProgress: (completed, total) => setProg(`${completed} / ${total}`),
      onContentFailure: (error, task) => (
        `${task.said}\n  → ${t("lab.contentFailure")}: ${errorDetail(error)}`
      ),
    });
    setActiveBatch({ runId: handle.runId, kind: "preview" });
    setProg(`0 / ${PREVIEW_CASES.length}`);

    const outcome = await handle.promise;
    if (!runner.isCurrent(outcome.runId)) return;
    setActiveBatch(null);
    if (outcome.status === "completed") {
      setSamples(outcome.results ?? []);
      setCompletedPreviewIds(tasks.map(({ id }) => id));
      recordLabStep("prompt-trial");
    } else if (outcome.status === "cancelled") {
      setErr2({ key: "lab.err.cancelled" });
    } else if (outcome.error) {
      setErr2({ key: errorKey(outcome.error), detail: outcome.error.message });
    }
  }

  async function runEval(system: string) {
    setErr3(null);
    if (busy0) return;
    const keyProblem = paidKeyProblem();
    if (keyProblem) { setErr3({ key: keyProblem }); return; }
    // Clear the previous completed-run announcement before this run starts.
    // A cancelled or fatal run therefore cannot replay an old score while
    // the global billing ledger continues to update.
    setEvalAnnouncement("");

    if (evalAttemptsRef.current < 2) {
      const round = evalAttemptsRef.current + 1;
      const numericPrediction = Number(prediction);
      const complete = prediction.trim() !== ""
        && Number.isInteger(numericPrediction)
        && numericPrediction >= 0
        && numericPrediction <= 20
        && predictionReason.trim() !== "";
      evalAttemptsRef.current = round;
      setEvalAttempts(round);
      setReflectionNote({ round, complete });
      setPrediction("");
      setPredictionReason("");
    }

    const selectedModel = model;
    type EvalTask = LabRunTask<Row> & { testCase: (typeof CASES)[number] };
    const tasks: EvalTask[] = CASES.map((testCase) => ({
      id: testCase.id,
      testCase,
      async run(context) {
        context.checkpoint();
        const order = await takeOrder(
          testCase.said,
          system,
          EVAL_PLAN.generatorMaxOutputTokens,
          selectedModel,
          context.signal,
        );
        if (testCase.kind === "rule") {
          const [ok, why] = testCase.rule!(order);
          return {
            id: testCase.id,
            said: testCase.said,
            kind: testCase.kind,
            ok,
            why,
          };
        }

        // A stopped or failed run must never start its case's judge request.
        context.checkpoint();
        const judge = await call([
            { role: "system", content: JUDGE_SYSTEM },
            { role: "user", content: `A café customer said: ${JSON.stringify(testCase.said)}\nThe system produced: ${JSON.stringify(order)}\n\nStandard: ${testCase.standard}\n\nDoes it meet the standard? Be strict. Reply as JSON {"passes":boolean,"why":string}.` },
          ], {
            json: true,
            maxTokens: EVAL_PLAN.judgeMaxOutputTokens,
            model: selectedModel,
            signal: context.signal,
            timeoutMs: REQUEST_TIMEOUT_MS,
          });
        const verdict = asJSON<{ passes: boolean; why?: string }>(judge.text);
        return {
          id: testCase.id,
          said: testCase.said,
          kind: testCase.kind,
          ok: verdict.passes === true,
          why: verdict.why ?? "",
        };
      },
    }));

    const handle = runner.start(tasks, {
      concurrency: LAB_CONCURRENCY,
      onProgress: (completed, total) => setProg(`${completed} / ${total}`),
      onContentFailure: (error, task) => ({
        id: task.testCase.id,
        said: task.testCase.said,
        kind: task.testCase.kind,
        ok: false,
        why: errorDetail(error),
      }),
    });
    setActiveBatch({ runId: handle.runId, kind: "eval" });
    setProg(`0 / ${CASES.length}`);

    const outcome = await handle.promise;
    if (!runner.isCurrent(outcome.runId)) return;
    setActiveBatch(null);
    if (outcome.status === "cancelled") {
      setErr3({ key: "lab.err.cancelled" });
      return;
    }
    if (outcome.status !== "completed" || !outcome.results) {
      if (outcome.error) {
        setErr3({ key: errorKey(outcome.error), detail: outcome.error.message });
      }
      return;
    }

    const res = outcome.results;
    const n = res.filter((r) => r.ok).length;
    const completedBillingCost = formatBillingCost(billingSnapshot());
    setRows(res);
    setPrev(score); setScore(n);
    setEvalAnnouncement(
      (n >= 16 ? t("lab.s4.resultMet") : t("lab.s4.resultBelow"))
        .replace("{score}", String(n))
        .replace("{billing}", completedBillingCost),
    );
    // A complete low score is still completion. Cancellation and fatal
    // Provider failures return above and therefore never write a false 0/20.
    recordLabStep("full-eval", { score: n });
  }

  function clearDraft() {
    draftWritesSuppressed.current = true;
    if (!clearLabDraft()) {
      draftWritesSuppressed.current = false;
      setDraftProblem("clear-failed");
      return;
    }
    const defaultRules = freshLabRules();
    const fingerprint = draftFingerprint(0, defaultRules, "", []);
    lastPersistedDraftFingerprint.current = fingerprint;
    latestDraft.current = {
      fingerprint,
      input: {
        stage: 0,
        rules: encodeLabRules(defaultRules),
        prompt: "",
        completedPreviewIds: [],
      },
    };
    setStage(0);
    setRules(defaultRules);
    setSys("");
    setMenuAdded(false);
    setCompletedPreviewIds([]);
    setSamples([]);
    setDraftSavedAt(null);
    setDraftProblem(null);
  }

  function stopBatch() {
    if (!activeBatch) return;
    runner.stop(activeBatch.runId);
    setProg(t("lab.stopping"));
  }

  const stages: Stage[] = [
    { name: "lab.s1.name", needsKey: true,  done: done[0] },
    { name: "lab.s2.name", needsKey: false, done: done[1] },
    { name: "lab.s3.name", needsKey: true,  done: done[2] },
    { name: "lab.s4.name", needsKey: true,  done: done[3] },
  ];

  return (
    <div className="shellwrap lab">
      <section className="labhero">
        <span className="eyebrow">{t("track.2.tag")}</span>
        <h1>{t("track.2.title")}</h1>
        <p className="lede">{t("track.2.desc")}</p>
        <p className="labmeta">{t("track.2.meta")}</p>
        {!stored && <p className="langnote" role="status">{t("lab.storageUnavailable")}</p>}
      </section>

      {/* The prose here is translated; the café itself is not, and saying so
          is cheaper than letting a reader wonder whether it is a bug. */}
      {locale !== "en" && <p className="langnote">{t("lab.enData")}</p>}

      <KeyBar model={model} onModel={setModel} disabled={busy0 || anyBatchBusy} />

      <Stages
        stages={stages}
        current={stage}
        onPick={setStage}
        panelId={PANEL}
        disabled={busy0 || anyBatchBusy}
      />

      <aside className="labdraftbar" aria-label={t("lab.draft.title")}>
        <div className="labdraftcopy">
          <div className="labdrafthead">
            <strong>{t("lab.draft.title")}</strong>
            <span className={"mono-note" + (draftProblem ? " draftproblem" : "")}
              role="status" aria-live="polite">
              {draftProblem
                ? t(`lab.draft.${draftProblem}`)
                : draftTime
                ? t("lab.draft.saved").replace("{time}", draftTime)
                : t("lab.draft.waiting")}
            </span>
          </div>
          <p>{t("lab.draft.note")}</p>
        </div>
        <button
          className="btn"
          type="button"
          disabled={busy0 || anyBatchBusy}
          onClick={clearDraft}
        >
          {t("lab.draft.clear")}
        </button>
      </aside>

      <div
        id={PANEL} role="tabpanel" tabIndex={-1}
        aria-labelledby={`${PANEL}-tab-${stage}`}
        className="labpanel"
      >
        {stage === 0 && (
          <section>
            <h2><span aria-hidden="true">☎️</span> {t("lab.s1.h")}</h2>
            <p className="steplede"><Rich k="lab.s1.lede" /></p>
            <div className="card"><div className="card-b">
              <label className="fieldlabel" htmlFor="q0">{t("lab.s1.ask")}</label>
              <textarea id="q0" rows={3} dir="auto" value={q} disabled={busy0}
                maxLength={MAX_PROVIDER_MESSAGE_CHARACTERS}
                onChange={(e) => setQ(e.target.value)} />
              <p className="keysafe">
                {t("lab.s1.callDisclosure")
                  .replace("{model}", model)
                  .replace("{cost}", `$${stage1Estimate.toFixed(5)}`)}
              </p>
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn primary" type="button" disabled={busy0 || anyBatchBusy} onClick={async () => {
                  setErr0(null);
                  const keyProblem = paidKeyProblem();
                  if (keyProblem) { setErr0({ key: keyProblem }); return; }
                  setBusy0(true); setA0("");
                  try {
                    const result = await call([{ role: "user", content: q }], {
                      model,
                      maxTokens: STAGE_1_PLAN.maxOutputTokensPerCall,
                      timeoutMs: REQUEST_TIMEOUT_MS,
                    });
                    setA0(result.text);
                    recordLabStep("first-call");
                  }
                  catch (e) { setErr0({ key: errorKey(e), detail: (e as Error).message }); }
                  finally { setBusy0(false); }
                }}>{busy0 ? t("ui.loading") : t("ui.run")} <span className="arrow">→</span></button>
                {billing.dispatchedCalls > 0 && (
                  <span className="mono-note">
                    {billing.dispatchedCalls} {t("lab.spendCalls")} · {billingCost}
                  </span>
                )}
              </div>
              {err0 && <Fail msgKey={err0.key} detail={err0.detail} />}
              {/* dir="auto" — the model answers in whatever language it was asked. */}
              <div className={"outbox" + (a0 ? "" : " empty")} dir="auto"
                aria-live="polite" style={{ marginTop: 11 }}>
                {busy0 ? t("ui.loading") : a0 || t("lab.nothingYet")}
              </div>
            </div></div>
          </section>
        )}

        {stage === 1 && (
          <section>
            <h2><span aria-hidden="true">🧱</span> {t("lab.s2.h")}</h2>
            <p className="steplede"><Rich k="lab.s2.lede" /></p>
            <div className="card"><div className="card-b">
              <div className="row" style={{ gap: 7 }}>
                <input type="text" dir="auto" aria-label={t("lab.s2.find")}
                  placeholder={t("lab.s2.findHint")} value={rp}
                  maxLength={MAX_LAB_RULE_CONDITION_LENGTH}
                  onChange={(e) => setRp(e.target.value)} style={{ flex: "2 1 180px" }} />
                {/* The menu names are the exercise data, and stay English. */}
                <select aria-label={t("lab.s2.item")} value={ri}
                  onChange={(e) => setRi(e.target.value)} style={{ flex: "1 1 130px" }}>
                  {Object.keys(MENU).map((m) => <option key={m}>{m}</option>)}
                </select>
                <select aria-label={t("lab.s2.size")} value={rs}
                  onChange={(e) => setRs(e.target.value as "S" | "L")}>
                  <option value="S">{t("lab.s2.small")}</option>
                  <option value="L">{t("lab.s2.large")}</option>
                </select>
                <button className="btn primary" type="button"
                  disabled={!rp.trim() || rules.length >= MAX_LAB_RULES} onClick={() => {
                  if (rp.trim() && rules.length < MAX_LAB_RULES) {
                    setRules([{ c: rp.trim(), n: ri, s: rs }, ...rules]);
                    setRp("");
                  }
                }}>{t("lab.s2.add")}</button>
              </div>
              {rules.length >= MAX_LAB_RULES && (
                <p className="small" role="status">
                  {t("lab.s2.ruleLimit").replace("{limit}", String(MAX_LAB_RULES))}
                </p>
              )}
              <div className="scroll"><table style={{ marginTop: 12 }}>
                <thead><tr><th>{t("lab.s2.thSaid")}</th><th>{t("lab.s2.thGot")}</th><th /></tr></thead>
                <tbody>{TESTS.map((x) => {
                  const g = kiosk(x);
                  return <tr key={x}><td className="mono"><bdi>{x}</bdi></td>
                    <td className="mono"><bdi>{g ? `${g.n} · ${g.s} · $${(g.price ?? 0).toFixed(2)}` : "—"}</bdi></td>
                    <td><span className={"pill " + (g ? "ok" : "bad")}>
                      {g ? t("lab.s2.ok") : t("lab.s2.miss")}</span></td></tr>;
                })}</tbody>
              </table></div>
              <div className="progbar" style={{ marginTop: 12 }}><span style={{ width: `${passing * 10}%` }} /></div>
              <p className="small" aria-live="polite">
                <Rich k="lab.s2.tally" vars={{ done: passing, rules: rules.length }} />
              </p>
            </div></div>
            {passing >= 8 && (
              <div className="langnote">
                <Rich k="lab.s2.wall" vars={{ rules: rules.length }} />
              </div>
            )}
          </section>
        )}

        {stage >= 2 && (
          <section>
            <h2>
              <span aria-hidden="true">{stage === 2 ? "💬" : "📊"}</span>{" "}
              {stage === 2 ? t("lab.s3.h") : t("lab.s4.h")}
            </h2>
            <p className="steplede">
              <Rich k={stage === 2 ? "lab.s3.lede" : "lab.s4.lede"} />
            </p>
            <div className="card"><div className="card-b">
              <div className="labscaffold">
                <div>
                  <strong>{t("lab.scaffold.title")}</strong>
                  <p>{t("lab.scaffold.lede")}</p>
                </div>
                <div className="labscaffoldactions" role="group" aria-label={t("lab.scaffold.title")}>
                  <button className="btn" type="button" disabled={anyBatchBusy}
                    onClick={() => { setSys(SEED); setMenuAdded(false); }}>
                    {t("lab.scaffold.full")}
                  </button>
                  <button className="btn" type="button" disabled={anyBatchBusy}
                    onClick={() => { setSys(PARTIAL_SEED); setMenuAdded(false); }}>
                    {t("lab.scaffold.partial")}
                  </button>
                  <button className="btn" type="button" disabled={anyBatchBusy}
                    onClick={() => { setSys(""); setMenuAdded(false); }}>
                    {t("lab.scaffold.independent")}
                  </button>
                </div>
              </div>
              <label className="fieldlabel" htmlFor="sys">{t("lab.s3.yours")}</label>
              <textarea id="sys" rows={7} dir="auto" value={sys} placeholder={t("lab.s3.hint")}
                disabled={anyBatchBusy}
                maxLength={LAB_DRAFT_MAX_PROMPT_LENGTH}
                onChange={(e) => {
                  setSys(e.target.value);
                  setMenuAdded(promptIncludesMenu(e.target.value));
                }} />
              {stage === 3 && (
                <fieldset className="labreflection">
                  <legend>{t("lab.reflection.title")}</legend>
                  {evalAttempts < 2 ? (
                    <>
                      <p className="labreflectionlede">
                        {t("lab.reflection.lede").replace("{round}", String(evalAttempts + 1))}
                      </p>
                      <div className="labreflectionfields">
                        <label>
                          <span>{t("lab.reflection.prediction")}</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={20}
                            step={1}
                            value={prediction}
                            disabled={anyBatchBusy}
                            onChange={(event) => setPrediction(event.target.value)}
                          />
                        </label>
                        <label>
                          <span>{t("lab.reflection.reason")}</span>
                          <textarea
                            rows={2}
                            dir="auto"
                            maxLength={400}
                            value={predictionReason}
                            disabled={anyBatchBusy}
                            onChange={(event) => setPredictionReason(event.target.value)}
                          />
                        </label>
                      </div>
                    </>
                  ) : (
                    <p className="labreflectionlede">{t("lab.reflection.twoDone")}</p>
                  )}
                  <p className="keysafe">{t("lab.reflection.private")}</p>
                  {reflectionNote && (
                    <p className="mono-note" role="status" aria-live="polite">
                      {(reflectionNote.complete
                        ? t("lab.reflection.captured")
                        : t("lab.reflection.optional"))
                        .replace("{round}", String(reflectionNote.round))}
                    </p>
                  )}
                </fieldset>
              )}
              <p className="keysafe">
                {(stage === 2 ? t("lab.s3.callDisclosure") : t("lab.s4.callDisclosure"))
                  .replace("{model}", model)
                  .replace("{cost}", `$${(stage === 2 ? stage3Estimate : evalEstimate).toFixed(5)}`)}
              </p>
              <div className="row" style={{ marginTop: 10 }}>
                <span className="spacer" />
                {stage === 2 ? (
                  <>
                    <button className="btn primary" type="button" disabled={busy0 || anyBatchBusy || !sys.trim()}
                      onClick={() => void runPreview()}>
                      {busy2 ? t("ui.loading") : t("lab.s3.run")} <span className="arrow">→</span>
                    </button>
                    {activeBatch && (
                      <button className="btn" type="button" onClick={stopBatch}>{t("lab.stop")}</button>
                    )}
                    <span className="mono-note" aria-live="polite">{busy2 ? prog : ""}</span>
                  </>
                ) : (
                  <>
                    <button className="btn primary" type="button" disabled={busy0 || anyBatchBusy || !sys.trim()}
                      onClick={() => void runEval(sys)}>
                      {busy3 ? t("ui.loading") : t("lab.s4.run")} <span className="arrow">→</span>
                    </button>
                    <button className="btn" type="button" disabled={busy0 || anyBatchBusy || !sys.trim()} onClick={() => {
                      const withMenu = addMenu(sys);
                      if (!menuAdded) { setSys(withMenu); setMenuAdded(true); }
                      void runEval(menuAdded ? sys : withMenu);
                    }}>
                      <span aria-hidden="true">{menuAdded ? "✓" : "＋"}</span>{" "}
                      {menuAdded ? t("lab.s4.menuIn") : t("lab.s4.addMenu")}
                    </button>
                    {activeBatch && (
                      <button className="btn" type="button" onClick={stopBatch}>{t("lab.stop")}</button>
                    )}
                    <span className="mono-note" aria-live="polite">{busy3 ? prog : ""}</span>
                  </>
                )}
              </div>
              {stage === 2 && err2 && <Fail msgKey={err2.key} detail={err2.detail} />}
              {stage === 3 && err3 && <Fail msgKey={err3.key} detail={err3.detail} />}
              {stage === 2 && completedPreviewIds.length > 0 && (
                <p className="mono-note labpreviewdraft" role="status">
                  {t("lab.draft.preview")
                    .replace("{done}", String(completedPreviewIds.length))
                    .replace("{total}", String(PREVIEW_CASES.length))}
                </p>
              )}
            </div></div>

            {stage === 2 && samples.length > 0 && (
              <div className="card" style={{ marginTop: 13 }}><div className="card-b">
                {samples.map((s) => (
                  <div className="outbox" dir="ltr" key={s} style={{ marginBottom: 9 }}>{s}</div>
                ))}
              </div></div>
            )}

            {stage === 3 && (
              <p
                id="lab-eval-result"
                className="labresultannounce"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {evalAnnouncement}
              </p>
            )}

            {stage === 3 && score !== null && (
              <>
                <div
                  className="meter"
                  style={{ marginTop: 14 }}
                  aria-describedby="lab-eval-result"
                >
                  <div><span className="big">{score}</span><span className="mono-note"> / 20</span></div>
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <div className="progbar"><span style={{
                      width: `${(score / 20) * 100}%`,
                      background: score >= 16 ? "var(--green)" : score >= 10 ? "var(--gold-mark)" : "var(--red)",
                    }} /></div>
                  </div>
                  <span className="mono-note">
                    {billing.dispatchedCalls} {t("lab.spendCalls")} · {billingCost}
                  </span>
                </div>
                {prev !== null && score > prev && (
                  <div className="langnote" style={{ borderInlineStartColor: "var(--green)", background: "var(--green-soft)" }}>
                    <Rich k="lab.s4.jump" vars={{ prev, score }} />
                  </div>
                )}
                <div className="scroll"><table style={{ marginTop: 13 }}>
                  <thead><tr>
                    <th>{t("lab.s4.thCase")}</th><th>{t("lab.s4.thSaid")}</th>
                    <th>{t("lab.s4.thHow")}</th><th>{t("lab.s4.thWhy")}</th>
                  </tr></thead>
                  <tbody>{rows.map((r) => (
                    <tr key={r.id}>
                      <td className="mono"><bdi>{r.id}</bdi></td>
                      <td className="mono"><bdi>{r.said}</bdi></td>
                      <td><span className={"pill " + (r.ok ? "ok" : "bad")}>{t(`lab.kind.${r.kind}`)}</span></td>
                      <td className="small"><bdi>{r.ok ? "" : r.why.slice(0, 110)}</bdi></td>
                    </tr>
                  ))}</tbody>
                </table></div>
              </>
            )}
          </section>
        )}
      </div>

      <nav className="labnav" aria-label={t("lab.stepsLabel")}>
        <button className="btn" type="button"
          disabled={busy0 || anyBatchBusy || stage === 0}
          onClick={() => setStage((s) => s - 1)}>
          <span className="arrow">←</span> {t("ui.back")}
        </button>
        <span className="labcount">{stage + 1} {t("ui.of")} {stages.length}</span>
        {stage === stages.length - 1 && !busy0 && !anyBatchBusy ? (
          <Link
            className="btn primary"
            href={`/${locale}/build/`}
            data-lab-handoff="part-3"
          >
            {t("track.3.cta")} <span className="arrow">→</span>
          </Link>
        ) : (
          <button className="btn primary" type="button"
            disabled={busy0 || anyBatchBusy || stage === stages.length - 1}
            onClick={() => setStage((s) => s + 1)}>
            {t("ui.next")} <span className="arrow">→</span>
          </button>
        )}
      </nav>
    </div>
  );
}
