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
 */
export default function Fail({ msgKey, detail }: { msgKey: string; detail?: string }) {
  const { t } = useI18n();
  const noKey = msgKey === "lab.err.noKey";

  return (
    <div className="fail" role="alert">
      <span className="failico" aria-hidden="true">{noKey ? "🔑" : "⚠️"}</span>
      <div>
        <p>{t(msgKey)}</p>
        {noKey && (
          <a className="btn primary" href="#labkey">
            {t("lab.err.noKeyCta")}<span className="arrow" aria-hidden="true">↑</span>
          </a>
        )}
        {!noKey && detail && <p className="faildetail mono-note">{detail}</p>}
      </div>
    </div>
  );
}
