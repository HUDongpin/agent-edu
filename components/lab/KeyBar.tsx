"use client";

import { useEffect, useState } from "react";
import { useI18n } from "../I18nProvider";
import { getKey, setKey, spend, usd, type Model } from "@/lib/deepseek";

export default function KeyBar({
  model, onModel, tick,
}: { model: Model; onModel: (m: Model) => void; tick: number }) {
  const { t } = useI18n();
  const [has, setHas] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => { setHas(!!getKey()); }, []);

  return (
    <div className="keybar">
      <div className="row" style={{ gap: 8 }}>
        <strong style={{ fontSize: 14 }}>🔑 {t("lab.keyTitle")}</strong>
        <span className={"pill " + (has ? "ok" : "neutral")}>
          {has ? t("lab.keySet") : t("lab.keyNone")}
        </span>
        <span className="spacer" />
        <span className="mono-note">
          {spend.calls
            ? `${spend.calls} · ${spend.in} in / ${spend.out} out · ~$${usd().toFixed(5)}`
            : t("lab.noCalls")}
        </span>
      </div>
      <div className="row" style={{ gap: 7, marginTop: 9 }}>
        <input
          type="password" className="keyin" spellCheck={false} autoComplete="off"
          aria-label={t("lab.keyTitle")} placeholder="sk-…"
          value={has && !draft ? "••••••••••••••••" : draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{ flex: "1 1 220px" }}
        />
        <button className="btn primary" type="button" onClick={() => {
          const v = draft.trim();
          if (v && !v.startsWith("••")) { setKey(v); setHas(true); setDraft(""); }
        }}>{has ? t("lab.keyReplace") : t("lab.keySave")}</button>
        <button className="btn" type="button" disabled={!has}
          onClick={() => { setKey(""); setHas(false); setDraft(""); }}>
          {t("lab.keyForget")}
        </button>
        <select className="keyin" aria-label="Model" value={model}
          onChange={(e) => onModel(e.target.value as Model)} style={{ flex: "0 1 200px" }}>
          <option value="deepseek-v4-flash">deepseek-v4-flash</option>
          <option value="deepseek-v4-pro">deepseek-v4-pro</option>
        </select>
      </div>
      <p className="small" style={{ margin: "9px 0 0" }}>{t("lab.keyNote")}</p>
      <span hidden>{tick}</span>
    </div>
  );
}
