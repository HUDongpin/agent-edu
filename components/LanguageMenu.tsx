"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LOCALES, LOCALE_CODES, metaFor } from "@/lib/i18n";
import { useI18n } from "./I18nProvider";

/**
 * Switching language changes the URL, not just the rendering — that is the
 * point of the migration. /es/handbook/ is a real page a search engine can
 * index, and a reader can share.
 *
 * The menu is driven from the keyboard as well as the mouse: opening it moves
 * focus onto the language you are already on, the arrow keys walk the list,
 * and Escape puts focus back on the button. Nine languages is a long list to
 * reach with Tab alone.
 */
export default function LanguageMenu({ coverage }: { coverage: Record<string, number> }) {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname() || "/";

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    // Land on the language already in use, not on the top of the list.
    const items = list.current?.querySelectorAll<HTMLButtonElement>("button");
    const at = Math.max(0, LOCALE_CODES.indexOf(locale));
    items?.[at]?.focus();
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open, locale]);

  function walk(e: React.KeyboardEvent) {
    const items = [...(list.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
    if (!items.length) return;
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    let to = -1;
    if (e.key === "ArrowDown") to = at < 0 || at === items.length - 1 ? 0 : at + 1;
    else if (e.key === "ArrowUp") to = at <= 0 ? items.length - 1 : at - 1;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = items.length - 1;
    if (to < 0) return;
    e.preventDefault();
    items[to].focus();
  }

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
        ref={trigger}
        className="iconbtn"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t("nav.lang")}: ${metaFor(locale).native}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">🌐</span>
        <span id="aeLangNow">{metaFor(locale).native}</span>
      </button>
      {open && (
        <div className="langmenu" role="menu" ref={list} onKeyDown={walk}>
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
