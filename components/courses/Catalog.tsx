"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Cover from "./Cover";
import { useI18n } from "../I18nProvider";
import {
  COURSES, FORMATS, LEVELS, STATUSES, TOPICS,
  type Course, type Format, type Level, type Status, type Topic,
} from "@/lib/courses";

const ALL = "__all__";

/** Progress lives in localStorage, so it can only be read after mount. */
function useProgress(): Record<string, number> {
  const [map, setMap] = useState<Record<string, number>>({});
  useEffect(() => {
    const read = () => {
      let p: Record<string, unknown> = {};
      let seen = 0;
      try {
        p = JSON.parse(localStorage.getItem("ae.progress") || "{}");
        seen = (localStorage.getItem("tch.seen") || "").split(",").filter(Boolean).length;
      } catch { /* private browsing: everything reads as 0 */ }
      const next: Record<string, number> = {};
      for (const c of COURSES) next[c.id] = Math.min(100, Math.max(0, c.progress(p, seen)));
      setMap(next);
    };
    read();
    window.addEventListener("focus", read);
    return () => window.removeEventListener("focus", read);
  }, []);
  return map;
}

function Select({
  label, value, onChange, options, render,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; render: (o: string) => string;
}) {
  const id = `f-${label.replace(/\s+/g, "")}`;
  return (
    <div className="filt">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value={ALL}>{render(ALL)}</option>
        {options.map((o) => <option key={o} value={o}>{render(o)}</option>)}
      </select>
    </div>
  );
}

export default function Catalog({ locale }: { locale: string }) {
  const { t } = useI18n();
  const progress = useProgress();

  const [level, setLevel] = useState<string>(ALL);
  const [format, setFormat] = useState<string>(ALL);
  const [topic, setTopic] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);

  const shown = useMemo(
    () => COURSES.filter((c) =>
      (level === ALL || c.level === (level as Level)) &&
      (format === ALL || c.format === (format as Format)) &&
      (topic === ALL || c.topic === (topic as Topic)) &&
      (status === ALL || c.status === (status as Status))),
    [level, format, topic, status]);

  const dirty = [level, format, topic, status].some((v) => v !== ALL);

  function cta(c: Course): string {
    const pct = progress[c.id] ?? 0;
    if (pct >= 100) return t("cat.review");
    if (pct > 0) return t("cat.resume");
    return t("cat.start");
  }

  return (
    <div className="shellwrap">
      <section className="sect" style={{ paddingBottom: 18 }}>
        <h1 style={{ fontSize: "clamp(26px,4vw,38px)" }}>{t("cat.title")}</h1>
        <p className="lede" style={{ margin: "10px 0 0", maxWidth: "62ch" }}>{t("cat.lede")}</p>
      </section>

      <div className="filters" role="group" aria-label={t("cat.title")}>
        <Select label={t("cat.filterLevel")} value={level} onChange={setLevel}
          options={LEVELS} render={(o) => (o === ALL ? t("cat.all") : t(`level.${o}`))} />
        <Select label={t("cat.filterFormat")} value={format} onChange={setFormat}
          options={FORMATS} render={(o) => (o === ALL ? t("cat.all") : t(`format.${o}`))} />
        <Select label={t("cat.filterTopic")} value={topic} onChange={setTopic}
          options={TOPICS} render={(o) => (o === ALL ? t("cat.all") : t(`topic.${o}`))} />
        <Select label={t("cat.filterStatus")} value={status} onChange={setStatus}
          options={STATUSES} render={(o) => (o === ALL ? t("cat.all") : t(`status.${o}`))} />
        <div className="filt-meta">
          <span aria-live="polite">{shown.length} {t("cat.results")}</span>
          {dirty && (
            <button type="button" className="iconbtn" onClick={() => {
              setLevel(ALL); setFormat(ALL); setTopic(ALL); setStatus(ALL);
            }}>{t("cat.reset")}</button>
          )}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="langnote">{t("cat.none")}</p>
      ) : (
        <ul className="ccards">
          {shown.map((c) => {
            const pct = progress[c.id] ?? 0;
            const soon = c.status === "soon";
            const href = c.external ? c.href : `/${locale}${c.href}`;
            const inner = (
              <>
                <Cover id={c.id} hue={c.hue} />
                <div className="cbody">
                  <div className="cmeta">
                    <span className="ctag" style={{ color: c.hue, borderColor: c.hue }}>
                      {t(`topic.${c.topic}`)}
                    </span>
                    <span>{t(`level.${c.level}`)}</span>
                    <span>·</span>
                    <span>{c.minutes} {t("cat.minutes")}</span>
                  </div>
                  <h2>{t(`c.${c.id}.title`)}</h2>
                  <p>{t(`c.${c.id}.blurb`)}</p>
                  {c.external && <p className="tracknote">↗ {t("track.3.note")}</p>}
                  <div className="cfoot">
                    {soon ? (
                      <span className="pill neutral">{t("cat.soonBadge")}</span>
                    ) : (
                      <>
                        <div className="cprog" title={`${pct}% ${t("cat.progress")}`}>
                          <div className="cbar"><span style={{ width: `${pct}%`, background: c.hue }} /></div>
                          <span className="cpct">{pct}%</span>
                        </div>
                        <span className="cgo" style={{ color: c.hue }}>
                          {cta(c)} <span className="arrow">→</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </>
            );
            return (
              <li key={c.id} className={"ccard" + (soon ? " soon" : "")}>
                {soon ? <div className="cinner">{inner}</div>
                  : c.external
                    ? <a className="cinner" href={href} target="_blank" rel="noopener noreferrer">{inner}</a>
                    : <Link className="cinner" href={href}>{inner}</Link>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
