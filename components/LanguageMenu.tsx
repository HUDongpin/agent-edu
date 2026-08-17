"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LOCALES, LOCALE_CODES, metaFor } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";

/**
 * Switching language changes the URL, not just the rendering — that is the
 * point of the migration. /es/handbook/ is a real page a search engine can
 * index, and a reader can share.
 */
export default function LanguageMenu({ coverage }: { coverage: Record<string, number> }) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  function switchTo(code: string) {
    // swap only the locale segment, so you stay on the page you were reading
    const rest = pathname.split("/").filter(Boolean);
    if (LOCALE_CODES.includes(rest[0])) rest.shift();
    try {
      localStorage.setItem("ae.lang", code);
    } catch {
      /* private browsing */
    }
    setOpen(false);
    router.push(`/${code}/${rest.join("/")}${rest.length ? "/" : ""}`);
  }

  return (
    <div className="langwrap" ref={wrap}>
      <button
        className="iconbtn"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("nav.lang")}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">🌐</span>
        <span id="aeLangNow">{metaFor(locale).native}</span>
      </button>
      {open && (
        <div className="langmenu" role="menu">
          {LOCALES.map((l) => {
            const pct = coverage[l.code] ?? 100;
            return (
              <button
                key={l.code}
                type="button"
                role="menuitem"
                lang={l.code}
                aria-current={l.code === locale}
                onClick={() => switchTo(l.code)}
              >
                <span className="flag" aria-hidden="true">{l.flag}</span>
                <span>{l.native}</span>
                <span className="en">{pct === 100 ? l.name : `${l.name} · ${pct}%`}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
