"use client";

import { useState } from "react";
import KeyBar from "./KeyBar";
import { useI18n } from "../I18nProvider";
import { asJSON, call, pool, spend, usd, type Model } from "@/lib/deepseek";
import { MENU, menuText, priceOf, type Order } from "@/lib/cafe/menu";
import { CASES } from "@/lib/cafe/evalset";

const PROG = "ae.progress";
function mark(k: string, v: unknown = true) {
  try {
    const p = JSON.parse(localStorage.getItem(PROG) || "{}");
    p[k] = v;
    localStorage.setItem(PROG, JSON.stringify(p));
  } catch { /* private browsing */ }
}

const SEED = `You are the till at a small café. Turn what the customer said into an order.

Reply as JSON: {"items":[{"name":..., "size":"S" or "L", "price":number}], "total":number, "needs_confirmation":boolean}

Sizes are S or L; if nobody says a size, use S.
If the order is vague or you had to guess, set needs_confirmation to true.`;

const TESTS = ["tea", "large tea", "large flat white", "two teas", "americano, small",
  "LARGE FLAT WHITE!!!", "could I grab a large flat white when you get a sec",
  "flat white, make it large", "something warm for my kid, no coffee", "the usual"];

type Rule = { c: string; n: string; s: "S" | "L" };
type Row = { id: string; said: string; kind: string; ok: boolean; why: string };

export default function Lab() {
  const { t } = useI18n();
  const [stage, setStage] = useState(0);
  const [model, setModel] = useState<Model>("deepseek-v4-flash");
  const [tick, setTick] = useState(0);
  const bump = () => setTick((n) => n + 1);

  // stage 0
  const [q, setQ] = useState("Explain what an API is, to someone who has never written code. Two sentences.");
  const [a0, setA0] = useState("");
  const [busy0, setBusy0] = useState(false);

  // stage 1
  const [rules, setRules] = useState<Rule[]>([{ c: "large tea", n: "tea", s: "L" }, { c: "tea", n: "tea", s: "S" }]);
  const [rp, setRp] = useState(""); const [ri, setRi] = useState("flat white"); const [rs, setRs] = useState<"S" | "L">("L");
  const kiosk = (said: string) => {
    const x = said.toLowerCase().trim();
    for (const r of rules) if (x.includes(r.c.toLowerCase())) return { ...r, price: priceOf(r.n, r.s) };
    return null;
  };
  const passing = TESTS.filter((x) => kiosk(x)).length;
  if (passing >= 8) mark("play1");

  // stage 2/3
  const [sys, setSys] = useState("");
  const [samples, setSamples] = useState<string[]>([]);
  const [busy2, setBusy2] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [prev, setPrev] = useState<number | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [prog, setProg] = useState("");
  const [busy3, setBusy3] = useState(false);
  const [menuAdded, setMenuAdded] = useState(false);

  async function takeOrder(said: string, system: string): Promise<Order> {
    const txt = await call(
      [{ role: "system", content: system },
       { role: "user", content: `Customer said: ${JSON.stringify(said)}. Reply with JSON only.` }],
      { json: true, max: 700, model });
    return asJSON<Order>(txt);
  }

  async function runEval(system: string) {
    setBusy3(true); setRows([]); let done = 0;
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
      setProg(`${++done} / ${CASES.length}`);
      return { id: c.id, said: c.said, kind: c.kind, ok, why };
    });
    setRows(res);
    const n = res.filter((r) => r.ok).length;
    setPrev(score); setScore(n);
    mark("evalBest", Math.max(n, (() => { try { return JSON.parse(localStorage.getItem(PROG) || "{}").evalBest || 0; } catch { return 0; } })()));
    if (n >= 16) mark("play3");
    setBusy3(false); bump();
  }

  const steps = [t("home.learn1"), t("track.1.title"), t("home.learn2"), t("home.learn2")];

  return (
    <div className="shellwrap en-content" dir="ltr">
      <section className="hero" style={{ padding: "34px 0 18px", textAlign: "start" }}>
        <span className="eyebrow">{t("track.2.tag")}</span>
        <h1 style={{ fontSize: 34, margin: "8px 0 0" }}>🛠️ {t("track.2.title")}</h1>
        <p className="lede" style={{ margin: "12px 0 0" }}>{t("track.2.desc")}</p>
      </section>

      <KeyBar model={model} onModel={setModel} tick={tick} />

      <nav className="steps" role="tablist">
        {["0", "1", "2", "3"].map((n, i) => (
          <button key={n} className="step" role="tab" type="button"
            aria-selected={stage === i} onClick={() => setStage(i)}>
            <span className="n">Stage {n}</span>
            <span className="t">{["Your first call", "The wall", "Write the prompt", "Measure it"][i]}</span>
          </button>
        ))}
      </nav>

      {stage === 0 && (
        <section>
          <h2>☎️ Your first call</h2>
          <p>Before anything clever: prove the wire works. Look at what it <em>cost</em> — almost every tutorial hides that.</p>
          <div className="card"><div className="card-b">
            <textarea rows={3} value={q} onChange={(e) => setQ(e.target.value)} />
            <div className="row" style={{ marginTop: 9 }}>
              <button className="btn primary" type="button" disabled={busy0} onClick={async () => {
                setBusy0(true); setA0("…");
                try { setA0(await call([{ role: "user", content: q }], { model })); mark("play0"); }
                catch (e) { setA0("✗ " + (e as Error).message); }
                finally { setBusy0(false); bump(); }
              }}>{busy0 ? t("ui.loading") : t("ui.run")} →</button>
            </div>
            <div className="out" style={{ marginTop: 11 }}>{a0 || "(nothing yet)"}</div>
          </div></div>
        </section>
      )}

      {stage === 1 && (
        <section>
          <h2>🧱 The kiosk that can&apos;t</h2>
          <p>A till built the ordinary way. <strong>Add rules until it handles all ten phrasings.</strong> Real customers wrote them.</p>
          <div className="card"><div className="card-b">
            <div className="row" style={{ gap: 6 }}>
              <input type="text" placeholder="if the text contains…" value={rp}
                onChange={(e) => setRp(e.target.value)} style={{ flex: "2 1 180px" }} />
              <select value={ri} onChange={(e) => setRi(e.target.value)} style={{ flex: "1 1 130px" }}>
                {Object.keys(MENU).map((m) => <option key={m}>{m}</option>)}
              </select>
              <select value={rs} onChange={(e) => setRs(e.target.value as "S" | "L")}>
                <option value="S">small</option><option value="L">large</option>
              </select>
              <button className="btn primary" type="button" onClick={() => {
                if (rp.trim()) { setRules([{ c: rp.trim(), n: ri, s: rs }, ...rules]); setRp(""); }
              }}>Add rule</button>
            </div>
            <div className="scroll"><table style={{ marginTop: 11 }}>
              <thead><tr><th>they said</th><th>your kiosk</th><th /></tr></thead>
              <tbody>{TESTS.map((x) => {
                const g = kiosk(x);
                return <tr key={x}><td className="mono">{x}</td>
                  <td className="mono">{g ? `${g.n} · ${g.s} · $${(g.price ?? 0).toFixed(2)}` : "—"}</td>
                  <td><span className={"pill " + (g ? "ok" : "bad")}>{g ? "ok" : "no idea"}</span></td></tr>;
              })}</tbody>
            </table></div>
            <div className="progbar" style={{ marginTop: 11 }}><span style={{ width: `${passing * 10}%` }} /></div>
            <p className="small">{passing} / 10 · {rules.length} rules</p>
          </div></div>
          {passing >= 8 && (
            <div className="langnote">
              <strong>Look at what you had to write.</strong> {rules.length} rules for ten sentences — and you had to
              think of each phrasing <em>before the customer did</em>. That is the wall. It is not a bug in your code;
              it is the shape of the problem.
            </div>
          )}
        </section>
      )}

      {stage >= 2 && (
        <section>
          <h2>{stage === 2 ? "💬 Write the prompt" : "📊 Score it against twenty orders"}</h2>
          <div className="card"><div className="card-b">
            <textarea rows={7} value={sys} placeholder="You are the till at a small café…"
              onChange={(e) => setSys(e.target.value)} />
            <div className="row" style={{ marginTop: 9 }}>
              <button className="btn" type="button" onClick={() => setSys(SEED)}>Start me off</button>
              <span className="spacer" />
              {stage === 2 ? (
                <button className="btn primary" type="button" disabled={busy2 || !sys.trim()} onClick={async () => {
                  setBusy2(true);
                  const out = await Promise.all(
                    ["could I grab a large flat white when you get a sec", "two teas", "something warm for my kid, no coffee"]
                      .map((s) => takeOrder(s, sys).then((o) => `${s}\n  → ${JSON.stringify(o)}`).catch((e) => `${s}\n  ✗ ${e.message}`)));
                  setSamples(out); mark("play2"); setBusy2(false); bump();
                }}>{busy2 ? t("ui.loading") : "Run on 3 orders →"}</button>
              ) : (
                <>
                  <button className="btn primary" type="button" disabled={busy3 || !sys.trim()}
                    onClick={() => runEval(sys)}>Run 20 cases →</button>
                  <button className="btn" type="button" disabled={busy3 || !sys.trim()} onClick={() => {
                    const withMenu = (sys.trim() || SEED) + "\n\n" + menuText() +
                      "\n\nOnly ever order items on this menu, at exactly these prices. If they ask for something not on it, order nothing and set needs_confirmation to true.";
                    if (!menuAdded) { setSys(withMenu); setMenuAdded(true); }
                    runEval(menuAdded ? sys : withMenu);
                  }}>{menuAdded ? "✓ menu added — re-run" : "＋ Add the menu, then re-run"}</button>
                  <span className="mono-note">{prog}</span>
                </>
              )}
            </div>
          </div></div>

          {stage === 2 && samples.length > 0 && (
            <div className="card"><div className="card-b">
              {samples.map((s) => <div className="out" key={s} style={{ marginBottom: 9 }}>{s}</div>)}
            </div></div>
          )}

          {stage === 3 && score !== null && (
            <>
              <div className="meter" style={{ marginTop: 13 }}>
                <div><span className="big">{score}</span><span className="mono-note"> / 20</span></div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div className="progbar"><span style={{
                    width: `${(score / 20) * 100}%`,
                    background: score >= 16 ? "var(--green)" : score >= 10 ? "var(--gold-mark)" : "var(--red)",
                  }} /></div>
                </div>
                <span className="mono-note">{spend.calls} calls · ~${usd().toFixed(4)}</span>
              </div>
              {prev !== null && score > prev && (
                <div className="langnote" style={{ borderInlineStartColor: "var(--green)", background: "var(--green-soft)" }}>
                  <strong>{prev} → {score}.</strong> Same model, same twenty questions. The only thing that changed is
                  that you told it what it was selling. <strong>Most &ldquo;the model is bad&rdquo; is really &ldquo;the
                  model was never told&rdquo;</strong> — and you only know that because you had a number before and after.
                </div>
              )}
              <div className="scroll"><table style={{ marginTop: 13 }}>
                <thead><tr><th>case</th><th>said</th><th>how</th><th>why it failed</th></tr></thead>
                <tbody>{rows.map((r) => (
                  <tr key={r.id}><td className="mono">{r.id}</td><td className="mono">{r.said}</td>
                    <td><span className={"pill " + (r.ok ? "ok" : "bad")}>{r.kind}</span></td>
                    <td className="small">{r.ok ? "" : r.why.slice(0, 110)}</td></tr>
                ))}</tbody>
              </table></div>
            </>
          )}
        </section>
      )}

      <div className="row" style={{ marginTop: 22 }}>
        <button className="btn" type="button" disabled={stage === 0}
          onClick={() => setStage((s) => s - 1)}>← {t("ui.back")}</button>
        <button className="btn primary" type="button" disabled={stage === 3}
          onClick={() => setStage((s) => s + 1)}>{t("ui.next")} →</button>
      </div>
      <span hidden>{steps.length}</span>
    </div>
  );
}
