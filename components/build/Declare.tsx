"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "../I18nProvider";

type ProgressAdapters = typeof import("../progress-adapters");

/**
 * A reversible learner note for the external Build-an-Agent module.
 *
 * The static site cannot inspect `course/progress.json`. This control therefore
 * records only what the learner says in the existing `ae.learning.v2` owner; it
 * does not measure the local stages or certify their result. It shares the
 * already-lazy public progress graph instead of bundling a second store owner.
 */
export default function Declare() {
  const { t } = useI18n();
  const adaptersRef = useRef<ProgressAdapters | null>(null);
  const [done, setDone] = useState<boolean | null>(null);
  const [storageWarning, setStorageWarning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe = () => {};
    void import("../progress-adapters").then((adapters) => {
      if (cancelled) return;
      adaptersRef.current = adapters;
      const refresh = () => setDone(adapters.readBuildDeclaration());
      refresh();
      unsubscribe = adapters.subscribeBuildDeclaration(refresh);
    });
    return () => {
      cancelled = true;
      adaptersRef.current = null;
      unsubscribe();
    };
  }, []);

  const toggle = () => {
    const adapters = adaptersRef.current;
    if (!adapters || done === null) return;
    const result = adapters.writeBuildDeclaration(!done);
    setDone(result.declaredComplete);
    setStorageWarning(!result.persisted);
  };

  return (
    <div className="card">
      <div className="card-b">
        <p className="muted" id="build-declaration-explanation">
          {t("build.declareBody")}
        </p>
        <div className="acts">
          <button
            type="button"
            className={done ? "iconbtn" : "btn"}
            aria-describedby="build-declaration-explanation"
            aria-pressed={done === true}
            disabled={done === null}
            onClick={toggle}
          >
            {done ? t("build.declaredCta") : t("build.declareCta")}
          </button>
          {/* Keep this live region mounted before the learner mutates state. */}
          <span className="muted" role="status" aria-live="polite" aria-atomic="true">
            {done ? (
              <span>
                <span aria-hidden="true">✓ </span>
                {t("build.declaredNote")}
              </span>
            ) : null}
            {storageWarning ? (
              <span>{done ? " " : null}{t("progress.storageUnavailable")}</span>
            ) : null}
          </span>
        </div>
      </div>
    </div>
  );
}
