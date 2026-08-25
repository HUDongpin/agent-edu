"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { useI18n } from "../I18nProvider";
import { hasKey, hasKeyOnServer, setKey, spend, subscribeKey, usd, type Model } from "@/lib/deepseek";
import LabIcon from "./LabIcon";

const PROVIDER = "https://platform.deepseek.com/api_keys";

/**
 * Connecting a model — shown immediately after the step chooser whenever the
 * selected exercise talks to a model.
 *
 * The old version was a password box with the placeholder "sk-…" and a note
 * about where the key is *stored*. For someone who has never written code
 * that answers a question they have not asked yet: they do not know what a
 * key is, that they have to make one, that it is free to make, or that this
 * whole page costs about a penny. So the panel explains before it asks, while
 * the detailed account-and-key walkthrough stays one disclosure away.
 *
 * Once a key is saved the explanation collapses to a single line — it has
 * done its job and should stop taking up the top of the page.
 */
export default function KeyBar({
  model, onModel,
}: {
  model: Model;
  onModel: (m: Model) => void;
}) {
  const { t } = useI18n();
  const has = useSyncExternalStore(subscribeKey, hasKey, hasKeyOnServer);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [what, setWhat] = useState(false);
  const inputId = useId();
  const whatId = useId();
  const changeRef = useRef<HTMLButtonElement>(null);
  const focusChangeOnSave = useRef(false);

  const open = !has || editing;

  useEffect(() => {
    if (!focusChangeOnSave.current || !has || editing) return;
    focusChangeOnSave.current = false;
    changeRef.current?.focus();
  }, [editing, has]);

  function save() {
    const v = draft.trim();
    if (!v) return;
    focusChangeOnSave.current = true;
    setKey(v);
    setDraft("");
    setEditing(false);
  }

  return (
    <section className={"keypanel" + (has ? " ready" : "")} id="labkey" aria-labelledby={`${inputId}-h`}>
      <div className="keyhead">
        <span className="keydot" aria-hidden="true">
          <LabIcon name={has ? "check" : "key"} />
        </span>
        <h2 aria-live="polite" id={`${inputId}-h`}>
          {has ? t("lab.keySaved") : t("lab.setup.title")}
        </h2>
        <span className="spacer" />
        {spend.calls > 0 && (
          <span className="mono-note keyspend">
            {spend.calls} {t("lab.spendCalls")} · ~${usd().toFixed(4)}
          </span>
        )}
        {has && !editing && (
          <button ref={changeRef} className="iconbtn" type="button"
            onClick={() => { setEditing(true); setDraft(""); }}>
            {t("lab.keyChange")}
          </button>
        )}
      </div>

      {open && (
        <div className="keybody">
          <p className="keylede">{t("lab.setup.lede")}</p>

          <button
            className="whatis" type="button" aria-expanded={what} aria-controls={whatId}
            onClick={() => setWhat((w) => !w)}
          >
            <LabIcon name={what ? "minus" : "plus"} />
            <span>{t("lab.setup.whatIs")}</span>
          </button>
          <p id={whatId} className="whatbody" hidden={!what}>{t("lab.setup.whatIsBody")}</p>

          <details className="keyguide">
            <summary>
              <LabIcon name="key" />
              <span>{t("lab.setup.getKey")}</span>
              <span className="spacer" />
              <LabIcon className="keyguide-plus" name="plus" />
              <LabIcon className="keyguide-minus" name="minus" />
            </summary>
            <ol className="keysteps">
              {(["1", "2", "3"] as const).map((n) => (
                <li key={n}>
                  <b>{t(`lab.setup.s${n}`)}</b>
                  <span>{t(`lab.setup.s${n}d`)}</span>
                  {n === "1" && (
                    <a className="btn" href={PROVIDER} target="_blank" rel="noopener noreferrer">
                      {t("lab.setup.getKey")}
                      <LabIcon name="external" />
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </details>

          <label className="keylabel" htmlFor={inputId}>{t("lab.keyTitle")}</label>
          <div className="row" style={{ gap: 8 }}>
            <input
              id={inputId} type="password" className="keyin" spellCheck={false}
              autoComplete="off" placeholder={t("lab.keyPlaceholder")}
              value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") save(); }}
              style={{ flex: "1 1 240px" }}
            />
            <button className="btn primary" type="button" disabled={!draft.trim()} onClick={save}>
              {t("lab.keySave")}
            </button>
            {has && (
              <button className="btn" type="button" onClick={() => { setEditing(false); setDraft(""); }}>
                {t("ui.close")}
              </button>
            )}
          </div>
          <p className="keysafe">
            <LabIcon name="lock" />
            <span>{t("lab.keyNote")}</span>
          </p>
        </div>
      )}

      <div className="keyfoot">
        <label htmlFor={`${inputId}-m`}>{t("lab.model")}</label>
        <select
          id={`${inputId}-m`} value={model}
          onChange={(e) => onModel(e.target.value as Model)}
        >
          <option value="deepseek-v4-flash">{t("lab.modelFast")}</option>
          <option value="deepseek-v4-pro">{t("lab.modelSmart")}</option>
        </select>
        {has && !editing && (
          <button className="linky" type="button" onClick={() => { setKey(""); setDraft(""); }}>
            {t("lab.keyForget")}
          </button>
        )}
      </div>
    </section>
  );
}
