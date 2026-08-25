"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import KeyBar from "./KeyBar";
import Fail from "./Fail";
import Stages, { type Stage } from "./Stages";
import LabIcon, { type LabIconName } from "./LabIcon";
import Rich from "../Rich";
import { useI18n } from "../I18nProvider";
import { asJSON, call, errorKey, getKey, pool, spend, usd, type Model } from "@/lib/deepseek";
import { mark, progressOnServer, progressSnapshot, readProgress, subscribeProgress } from "@/lib/progress";
import { MENU, menuText, priceOf, type Order } from "@/lib/cafe/menu";
import { CASES } from "@/lib/cafe/evalset";

const SEED = `You are the till at a small café. Turn what the customer said into an order.

Reply as JSON: {"items":[{"name":..., "size":"S" or "L", "price":number}], "total":number, "needs_confirmation":boolean}

Sizes are S or L; if nobody says a size, use S.
If the order is vague or you had to guess, set needs_confirmation to true.`;

const TESTS = ["tea", "large tea", "large flat white", "two teas", "americano, small",
  "LARGE FLAT WHITE!!!", "could I grab a large flat white when you get a sec",
  "flat white, make it large", "something warm for my kid, no coffee", "the usual"];

const PANEL = "labpanel";

type Rule = { c: string; n: string; s: "S" | "L" };
type Row = { id: string; said: string; kind: string; ok: boolean; why: string };
type Err = { key: string; detail?: string } | null;

export default function Lab() {
  const { t, locale } = useI18n();
  const [stage, setStage] = useState(0);
  const [model, setModel] = useState<Model>("deepseek-v4-flash");
  /* The running token spend lives in a module-level object, not in React
     state, so that every caller shares one tally. Nothing tells React when it
     moves; bump() is how a finished call asks for a repaint. */
  const [, repaint] = useState(0);
  const bump = () => repaint((n) => n + 1);

  /* Which steps are already finished, from the same store the home page and
     the catalogue read. Subscribed rather than loaded in an effect, so the
     ticks are right on the first paint. */
  const raw = useSyncExternalStore(subscribeProgress, progressSnapshot, progressOnServer);
  const done = useMemo(() => {
    const p = readProgress(raw);
    return [!!p.play0, !!p.play1, !!p.play2, Number(p.evalBest ?? 0) >= 16];
  }, [raw]);

  // step 1 — the first call
  const [q, setQ] = useState(() => t("lab.s1.q"));
  const [a0, setA0] = useState("");
  const [err0, setErr0] = useState<Err>(null);
  const [busy0, setBusy0] = useState(false);

  // step 2 — the rule-based till (no model, no key)
  const [rules, setRules] = useState<Rule[]>([{ c: "large tea", n: "tea", s: "L" }, { c: "tea", n: "tea", s: "S" }]);
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
    if (passing >= 8) mark("play1");
  }, [passing]);

  // steps 3 and 4 — the prompt, then the score
  const [sys, setSys] = useState("");
  const [samples, setSamples] = useState<string[]>([]);
  const [busy2, setBusy2] = useState(false);
  const [err2, setErr2] = useState<Err>(null);
  const [score, setScore] = useState<number | null>(null);
  const [prev, setPrev] = useState<number | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [prog, setProg] = useState("");
  const [busy3, setBusy3] = useState(false);
  const [err3, setErr3] = useState<Err>(null);
  const [menuAdded, setMenuAdded] = useState(false);

  async function takeOrder(said: string, system: string): Promise<Order> {
    const txt = await call(
      [{ role: "system", content: system },
       { role: "user", content: `Customer said: ${JSON.stringify(said)}. Reply with JSON only.` }],
      { json: true, max: 700, model });
    return asJSON<Order>(txt);
  }

  async function runEval(system: string) {
    setErr3(null);
    /* The commonest failure is the cheapest to catch: no key at all. Firing
       twenty requests to learn that is a miserable way to find out. */
    if (!getKey()) { setErr3({ key: "lab.err.noKey" }); return; }

    setBusy3(true); setRows([]); let n0 = 0;
    const res = await pool(CASES, 4, async (c) => {
      let ok = false, why = "";
      try {
        const o = await takeOrder(c.said, system);
        if (c.kind === "rule") { [ok, why] = c.rule!(o); }
        else {
          const v = asJSON<{ passes: boolean; why: string }>(await call([
            { role: "system", content: "You grade one output against one written standard. Not style — only whether the standard is met. Reply as JSON." },
            { role: "user", content: `A café customer said: ${JSON.stringify(c.said)}\nThe system produced: ${JSON.stringify(o)}\n\nStandard: ${c.standard}\n\nDoes it meet the standard? Be strict. Reply as JSON {"passes":boolean,"why":string}.` },
          ], { json: true, max: 400, model }));
          ok = !!v.passes; why = v.why ?? "";
        }
      } catch (e) { ok = false; why = (e as Error).message; }
      setProg(`${++n0} / ${CASES.length}`);
      return { id: c.id, said: c.said, kind: c.kind, ok, why };
    });
    /* Every case failing the same way is not a score of 0/20, it is a broken
       connection — a rejected key, an empty account. Say so, rather than
       handing back a table of twenty identical error strings. */
    const n = res.filter((r) => r.ok).length;
    if (n === 0) {
      const keys = new Set(res.map((r) => errorKey(new Error(r.why))));
      const only = keys.size === 1 ? [...keys][0] : null;
      if (only && only !== "lab.err.generic") {
        setErr3({ key: only, detail: res[0].why });
        setBusy3(false); bump();
        return;
      }
    }

    setRows(res);
    setPrev(score); setScore(n);
    mark("evalBest", Math.max(n, Number(readProgress(progressSnapshot()).evalBest ?? 0)));
    if (n >= 16) mark("play3");
    setBusy3(false); bump();
  }

  const stages: Stage[] = [
    { name: "lab.s1.name", needsKey: true,  done: done[0] },
    { name: "lab.s2.name", needsKey: false, done: done[1] },
    { name: "lab.s3.name", needsKey: true,  done: done[2] },
    { name: "lab.s4.name", needsKey: true,  done: done[3] },
  ];

  function moveStage(next: number) {
    setStage(next);
    requestAnimationFrame(() => {
      const panel = document.getElementById(PANEL);
      panel?.focus({ preventScroll: true });
      panel?.scrollIntoView({ block: "start" });
    });
  }

  const stageIcon: LabIconName = stage === 2 ? "message" : "chart";

  return (
    <div className="shellwrap lab">
      <section className="labhero">
        <span className="eyebrow">{t("track.2.tag")}</span>
        <h1>{t("track.2.title")}</h1>
        <p className="lede">{t("track.2.desc")}</p>
        <p className="labmeta">{t("track.2.meta")}</p>
      </section>

      {/* The prose here is translated; the café itself is not, and saying so
          is cheaper than letting a reader wonder whether it is a bug. */}
      {locale !== "en" && <p className="langnote">{t("lab.enData")}</p>}

      <Stages stages={stages} current={stage} onPick={setStage} panelId={PANEL} />

      {stages[stage].needsKey && <KeyBar model={model} onModel={setModel} />}

      <div
        id={PANEL} role="tabpanel" tabIndex={-1}
        aria-labelledby={`${PANEL}-tab-${stage}`}
        className="labpanel"
      >
        {stage === 0 && (
          <section>
            <h2><LabIcon name="phone" /> <span>{t("lab.s1.h")}</span></h2>
            <p className="steplede"><Rich k="lab.s1.lede" /></p>
            <div className="card"><div className="card-b">
              <label className="fieldlabel" htmlFor="q0">{t("lab.s1.ask")}</label>
              <textarea id="q0" rows={3} dir="auto" value={q} onChange={(e) => setQ(e.target.value)} />
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn primary" type="button" disabled={busy0} onClick={async () => {
                  setBusy0(true); setErr0(null); setA0("");
                  try { setA0(await call([{ role: "user", content: q }], { model })); mark("play0"); }
                  catch (e) { setErr0({ key: errorKey(e), detail: (e as Error).message }); }
                  finally { setBusy0(false); bump(); }
                }}>{busy0 ? t("ui.loading") : t("ui.run")} <span className="arrow">→</span></button>
                {spend.calls > 0 && (
                  <span className="mono-note">{spend.calls} · ~${usd().toFixed(5)}</span>
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
            <h2><LabIcon name="blocks" /> <span>{t("lab.s2.h")}</span></h2>
            <p className="steplede"><Rich k="lab.s2.lede" /></p>
            <div className="card"><div className="card-b">
              <div className="row">
                <input type="text" dir="auto" aria-label={t("lab.s2.find")}
                  placeholder={t("lab.s2.findHint")} value={rp}
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
                <button className="btn primary" type="button" disabled={!rp.trim()} onClick={() => {
                  if (rp.trim()) { setRules([{ c: rp.trim(), n: ri, s: rs }, ...rules]); setRp(""); }
                }}>{t("lab.s2.add")}</button>
              </div>
              <div
                className="scroll"
                role="region"
                tabIndex={0}
                aria-label={`${t("lab.s2.thSaid")} · ${t("lab.s2.thGot")}`}
              ><table className="labtable rules-table" style={{ marginTop: 12 }}>
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
              <LabIcon name={stageIcon} />
              <span>{stage === 2 ? t("lab.s3.h") : t("lab.s4.h")}</span>
            </h2>
            <p className="steplede">
              <Rich k={stage === 2 ? "lab.s3.lede" : "lab.s4.lede"} />
            </p>
            <div className="card"><div className="card-b">
              <label className="fieldlabel" htmlFor="sys">{t("lab.s3.yours")}</label>
              <textarea id="sys" rows={7} dir="auto" value={sys} placeholder={t("lab.s3.hint")}
                onChange={(e) => setSys(e.target.value)} />
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn" type="button" onClick={() => setSys(SEED)}>{t("lab.s3.seed")}</button>
                <span className="spacer" />
                {stage === 2 ? (
                  <button className="btn primary" type="button" disabled={busy2 || !sys.trim()} onClick={async () => {
                    setBusy2(true); setErr2(null); setSamples([]);
                    const said = ["could I grab a large flat white when you get a sec", "two teas", "something warm for my kid, no coffee"];
                    try {
                      const out: string[] = [];
                      for (const s of said) out.push(`${s}\n  → ${JSON.stringify(await takeOrder(s, sys))}`);
                      setSamples(out); mark("play2");
                    } catch (e) {
                      setErr2({ key: errorKey(e), detail: (e as Error).message });
                    } finally { setBusy2(false); bump(); }
                  }}>{busy2 ? t("ui.loading") : t("lab.s3.run")} <span className="arrow">→</span></button>
                ) : (
                  <>
                    <button className="btn primary" type="button" disabled={busy3 || !sys.trim()}
                      onClick={() => runEval(sys)}>
                      {busy3 ? t("ui.loading") : t("lab.s4.run")} <span className="arrow">→</span>
                    </button>
                    <button className="btn" type="button" disabled={busy3 || !sys.trim()} onClick={() => {
                      const withMenu = (sys.trim() || SEED) + "\n\n" + menuText() +
                        "\n\nOnly ever order items on this menu, at exactly these prices. If they ask for something not on it, order nothing and set needs_confirmation to true.";
                      if (!menuAdded) { setSys(withMenu); setMenuAdded(true); }
                      runEval(menuAdded ? sys : withMenu);
                    }}>
                      <LabIcon name={menuAdded ? "check" : "plus"} />
                      {menuAdded ? t("lab.s4.menuIn") : t("lab.s4.addMenu")}
                    </button>
                    <span className="mono-note" aria-live="polite">{prog}</span>
                  </>
                )}
              </div>
              {stage === 2 && err2 && <Fail msgKey={err2.key} detail={err2.detail} />}
              {stage === 3 && err3 && <Fail msgKey={err3.key} detail={err3.detail} />}
            </div></div>

            {stage === 2 && samples.length > 0 && (
              <div className="card" style={{ marginTop: 13 }}><div className="card-b">
                {samples.map((s) => (
                  <div className="outbox" dir="ltr" key={s} style={{ marginBottom: 9 }}>{s}</div>
                ))}
              </div></div>
            )}

            {stage === 3 && score !== null && (
              <>
                <div className="meter" style={{ marginTop: 14 }}>
                  <div><span className="big">{score}</span><span className="mono-note"> / 20</span></div>
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <div className="progbar"><span style={{
                      width: `${(score / 20) * 100}%`,
                      background: score >= 16 ? "var(--green)" : score >= 10 ? "var(--gold-mark)" : "var(--red)",
                    }} /></div>
                  </div>
                  <span className="mono-note">{spend.calls} {t("lab.spendCalls")} · ~${usd().toFixed(4)}</span>
                </div>
                {prev !== null && score > prev && (
                  <div className="langnote" style={{ borderInlineStartColor: "var(--green)", background: "var(--green-soft)" }}>
                    <Rich k="lab.s4.jump" vars={{ prev, score }} />
                  </div>
                )}
                <div
                  className="scroll"
                  role="region"
                  tabIndex={0}
                  aria-label={`${t("lab.s4.thCase")} · ${t("lab.s4.thSaid")} · ${t("lab.s4.thHow")} · ${t("lab.s4.thWhy")}`}
                ><table className="labtable eval-table" style={{ marginTop: 13 }}>
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
        <button className="btn" type="button" disabled={stage === 0}
          onClick={() => moveStage(stage - 1)}>
          <span className="arrow">←</span> {t("ui.back")}
        </button>
        <span className="labcount">{stage + 1} {t("ui.of")} {stages.length}</span>
        <button className="btn primary" type="button" disabled={stage === stages.length - 1}
          onClick={() => moveStage(stage + 1)}>
          {t("ui.next")} <span className="arrow">→</span>
        </button>
      </nav>
    </div>
  );
}
