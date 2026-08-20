"use client";

import { useId, useState, useSyncExternalStore } from "react";
import { useI18n } from "../I18nProvider";
import {
  billingSnapshot,
  billingSnapshotOnServer,
  DEEPSEEK_PRICING,
  errorKey,
  forgetKey,
  hasKey,
  hasKeyOnServer,
  isProviderError,
  keyStatusOnServer,
  keyStatusSnapshot,
  markKeyUnverified,
  saveAndTestKey,
  subscribeBilling,
  subscribeKey,
  testSavedKey,
  type KeyStatus,
  type Model,
} from "@/lib/deepseek";
import { RECOMMENDED_LAB_JOURNEY } from "@/lib/lab/plans";

const PROVIDER = "https://platform.deepseek.com/api_keys";

/**
 * Connecting a model — the first thing a reader meets in the Lab, and the
 * point at which most of them used to leave.
 *
 * The old version was a password box with the placeholder "sk-…" and a note
 * about where the key is *stored*. For someone who has never written code
 * that answers a question they have not asked yet: they do not know what a
 * key is, that they have to make one, or that real requests are billed by the
 * provider. So the panel explains before it asks, and the three steps are
 * numbered because that is what a person follows.
 *
 * Once the credential and selected model are verified, the explanation
 * collapses — it has done its job and should stop taking up the page.
 */
export default function KeyBar({
  model, onModel,
}: {
  model: Model;
  onModel: (m: Model) => void;
}) {
  const { t } = useI18n();
  const has = useSyncExternalStore(subscribeKey, hasKey, hasKeyOnServer);
  const status = useSyncExternalStore(subscribeKey, keyStatusSnapshot, keyStatusOnServer);
  const billing = useSyncExternalStore(
    subscribeBilling,
    billingSnapshot,
    billingSnapshotOnServer,
  );
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [what, setWhat] = useState(false);
  const [failure, setFailure] = useState<{ key: string; detail?: string } | null>(null);
  const inputId = useId();
  const whatId = useId();

  const verified = status === "verified";
  const verifying = status === "verifying";
  const open = !verified || editing;

  async function save() {
    const v = draft.trim();
    if (!v) return;
    setFailure(null);
    try {
      await saveAndTestKey(v, model, { timeoutMs: 15_000 });
      setDraft("");
      setEditing(false);
    } catch (error) {
      if (isProviderError(error) && error.code === "auth" && error.httpStatus === 401) {
        setDraft("");
      }
      setFailure({
        key: errorKey(error),
        detail: error instanceof Error ? error.message : undefined,
      });
    }
  }

  async function testAgain() {
    setFailure(null);
    try {
      await testSavedKey(model, { timeoutMs: 15_000 });
      setEditing(false);
    } catch (error) {
      setFailure({
        key: errorKey(error),
        detail: error instanceof Error ? error.message : undefined,
      });
    }
  }

  const statusKey: Record<KeyStatus, string> = {
    empty: "lab.setup.title",
    "saved-unverified": "lab.keyUnverified",
    verifying: "lab.keyVerifying",
    verified: "lab.keyVerified",
    rejected: "lab.keyRejected",
    unreachable: "lab.keyUnreachable",
  };
  const billingCost = `${t("lab.knownSubtotal")} $${billing.knownUsd.toFixed(5)}`
    + (billing.providerRejectedCalls > 0
      ? ` + ${billing.providerRejectedCalls} ${t("lab.billingRejected")}`
      : "")
    + (billing.hasUnknown
      ? ` + ${billing.unknownAfterSendCalls} ${t("lab.billingUnknown")}`
      : "");

  return (
    <section className={"keypanel" + (verified ? " ready" : "")} id="labkey" aria-labelledby={`${inputId}-h`}>
      <div className="keyhead">
        <span className="keydot" aria-hidden="true">
          {verified ? "✓" : verifying ? "…" : status === "unreachable" ? "↯" : "🔑"}
        </span>
        <h2 id={`${inputId}-h`}>{t(statusKey[status])}</h2>
        <span className="spacer" />
        {billing.dispatchedCalls > 0 && (
          <span className="mono-note keyspend">
            {billing.dispatchedCalls} {t("lab.spendCalls")} · {billingCost}
          </span>
        )}
        {verified && !editing && (
          <button className="iconbtn" type="button" onClick={() => { setEditing(true); setDraft(""); }}>
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
            <span aria-hidden="true">{what ? "−" : "＋"}</span> {t("lab.setup.whatIs")}
          </button>
          <p id={whatId} className="whatbody" hidden={!what}>{t("lab.setup.whatIsBody")}</p>

          <ol className="keysteps">
            {(["1", "2", "3"] as const).map((n) => (
              <li key={n}>
                <b>{t(`lab.setup.s${n}`)}</b>
                <span>{t(`lab.setup.s${n}d`)}</span>
                {n === "1" && (
                  <a className="btn" href={PROVIDER} target="_blank" rel="noopener noreferrer">
                    {t("lab.setup.getKey")}
                    <span className="arrow" aria-hidden="true">↗</span>
                  </a>
                )}
              </li>
            ))}
          </ol>

          <label className="keylabel" htmlFor={inputId}>{t("lab.keyTitle")}</label>
          <div className="row" style={{ gap: 8 }}>
            <input
              id={inputId} type="password" className="keyin" spellCheck={false}
              autoComplete="off" placeholder={t("lab.keyPlaceholder")}
              value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void save(); }}
              disabled={verifying}
              style={{ flex: "1 1 240px" }}
            />
            <button className="btn primary" type="button" disabled={verifying || !draft.trim()} onClick={() => void save()}>
              {verifying ? t("lab.keyVerifying") : t("lab.keySaveTest")}
            </button>
            {has && !draft.trim() && !editing && !verifying && (
              <button className="btn" type="button" onClick={() => void testAgain()}>
                {t("lab.keyTestAgain")}
              </button>
            )}
            {verified && editing && (
              <button className="btn" type="button" onClick={() => { setEditing(false); setDraft(""); }}>
                {t("ui.close")}
              </button>
            )}
          </div>
          {failure && (
            <div className="fail" role="alert">
              <span className="failico" aria-hidden="true">⚠️</span>
              <div>
                <p>{t(failure.key)}</p>
                {failure.detail && <p className="faildetail mono-note">{failure.detail}</p>}
              </div>
            </div>
          )}
          {status === "unreachable" && <p className="keysafe">↯ {t("lab.keyRetained")}</p>}
          <p className="keysafe">🔒 {t("lab.keyNote")}</p>
        </div>
      )}

      <div className="keyfoot">
        <label htmlFor={`${inputId}-m`}>{t("lab.model")}</label>
        <select
          id={`${inputId}-m`} value={model}
          onChange={(e) => {
            const nextModel = e.target.value as Model;
            if (nextModel === model) return;
            // Verification covers the selected model's visibility, so a
            // model change must return the saved credential to unverified.
            markKeyUnverified();
            onModel(nextModel);
          }}
          disabled={verifying}
        >
          <option value="deepseek-v4-flash">{t("lab.modelFast")}</option>
          <option value="deepseek-v4-pro">{t("lab.modelSmart")}</option>
        </select>
        {has && (
          <button className="linky" type="button" onClick={() => {
            forgetKey();
            setDraft("");
            setEditing(false);
            setFailure(null);
          }}>
            {t("lab.keyForget")}
          </button>
        )}
      </div>
      {verified && <p className="keysafe">✓ {t("lab.keyModelVisible")}</p>}
      <p className="keysafe">
        {t("lab.callPlan")
          .replace("{calls}", String(RECOMMENDED_LAB_JOURNEY.calls))
          .replace("{tokens}", RECOMMENDED_LAB_JOURNEY.maxOutputTokens.toLocaleString("en-US"))}
      </p>
      <p className="keysafe">
        {t("lab.pricingDisclosure").replace("{date}", DEEPSEEK_PRICING.checkedAt)}{" "}
        <a
          href={DEEPSEEK_PRICING.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("lab.pricingSource")} <span aria-hidden="true">↗</span>
        </a>
      </p>
      <p className="keysafe">{t("lab.stopDisclosure")}</p>
      {has && <p className="keysafe">{t("lab.forgetDisclosure")}</p>}
    </section>
  );
}
