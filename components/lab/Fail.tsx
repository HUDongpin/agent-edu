"use client";

import { useI18n } from "../I18nProvider";

/**
 * What a reader sees when a call fails.
 *
 * Previously the raw provider message was printed into the output box in
 * 12.5px monospace, prefixed with "✗" — so a beginner's first ever attempt
 * could end at "✗ no key saved" with nothing to click. Every failure now
 * says what happened in a sentence, and the one that is genuinely the
 * reader's next move — going and getting a key — is a button.
 *
 * Two failures now carry that button, because two of them are fixed somewhere
 * other than this page. An empty balance is the second: verification is a
 * models call, and it says so — it proves the credential and the model, never
 * the balance — so the panel can read "verified" for an account that fails on
 * its first paid request. When it does, the reader is told to add credit on the
 * provider's site and, until now, given no way to get there.
 */

/**
 * The provider's console, not a guessed billing path.
 *
 * The sign-up link elsewhere in the Lab points at the console's api-keys page;
 * this points at the console itself, because the exact route to a balance is
 * the provider's to change and a stale deep link is worse than one honest hop.
 */
const PROVIDER_CONSOLE = "https://platform.deepseek.com/";

export default function Fail({ msgKey, detail }: { msgKey: string; detail?: string }) {
  const { t } = useI18n();
  const noKey = msgKey === "lab.err.noKey";
  const noCredit = msgKey === "lab.err.noCredit";

  return (
    <div className="fail" role="alert">
      <span className="failico" aria-hidden="true">{noKey || noCredit ? "🔑" : "⚠️"}</span>
      <div>
        <p>{t(msgKey)}</p>
        {noKey && (
          <a className="btn primary" href="#labkey">
            {t("lab.err.noKeyCta")}<span className="arrow" aria-hidden="true">↑</span>
          </a>
        )}
        {noCredit && (
          <a
            className="btn primary"
            href={PROVIDER_CONSOLE}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("lab.err.noCreditCta")}<span className="arrow" aria-hidden="true">↗</span>
          </a>
        )}
        {!noKey && !noCredit && detail && <p className="faildetail mono-note">{detail}</p>}
      </div>
    </div>
  );
}
