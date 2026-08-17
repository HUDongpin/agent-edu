"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "./I18nProvider";

const PROG = "ae.progress";

type Item = { label: string; done: boolean; note: string };

/**
 * Progress lives in localStorage and nowhere else — no account, nothing sent
 * anywhere. Rendered client-side because a static export has no per-reader
 * server state, which is exactly the property we wanted to keep.
 */
export default function Progress({ locale }: { locale: string }) {
  const { t } = useI18n();
  const [items, setItems] = useState<Item[] | null>(null);

  const read = useCallback((): Item[] => {
    let p: Record<string, unknown> = {};
    let seen = 0;
    try {
      p = JSON.parse(localStorage.getItem(PROG) || "{}");
      seen = (localStorage.getItem("tch.seen") || "").split(",").filter(Boolean).length;
    } catch {
      /* private browsing: show the empty state */
    }
    return [
      { label: t("track.1.title"), done: seen >= 6, note: seen ? `${seen}/11` : "" },
      { label: t("home.learn1"),   done: !!p.play0, note: "" },
      { label: t("home.learn2"),   done: !!p.evalBest, note: p.evalBest ? `${p.evalBest}/20` : "" },
      { label: t("track.3.title"), done: !!p.part2, note: "" },
    ];
  }, [t]);

  useEffect(() => {
    const paint = () => setItems(read());
    paint();
    window.addEventListener("focus", paint);
    return () => window.removeEventListener("focus", paint);
  }, [read, locale]);

  if (!items) return <div className="progwrap"><div className="muted">{t("home.progNone")}</div></div>;

  const done = items.filter((i) => i.done).length;
  if (!done) return <div className="progwrap"><div className="muted">{t("home.progNone")}</div></div>;

  return (
    <div className="progwrap">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <strong>{done} {t("ui.of")} {items.length}</strong>
        <button
          className="iconbtn"
          type="button"
          onClick={() => {
            try {
              localStorage.removeItem(PROG);
              localStorage.removeItem("tch.seen");
            } catch { /* private browsing */ }
            setItems(read());
          }}
        >
          {t("home.progReset")}
        </button>
      </div>
      <div className="progbar"><span style={{ width: `${(done / items.length) * 100}%` }} /></div>
      <ul className="proglist">
        {items.map((i) => (
          <li key={i.label} className={i.done ? "done" : ""}>
            <span className="tick">{i.done ? "✓" : "○"}</span>
            <span>{i.label}{i.note ? `  ${i.note}` : ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
