"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The narrow-screen menu.
 *
 * It used to open and then only close again if you clicked a link inside it:
 * Escape did nothing, tapping the page behind it did nothing, and focus stayed
 * wherever it was. Those are the two things everyone tries first.
 *
 * Click-away used to leave focus on a link that `.mainnav` then hides with
 * `display:none`, which is how a keyboard reader ends up nowhere. Escape
 * already put focus back on the toggle; click-away now does the same, unless
 * the press landed on another control that takes focus itself — matching the
 * language menu.
 */
export default function MobileNav({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) {
        setOpen(false);
        // Same rule as LanguageMenu: a press on a control focuses that control;
        // a press on the page would focus the body after this listener returns
        // and undo a focus() call made here, so stop that and restore the toggle.
        const node = e.target instanceof Element ? e.target : (e.target as Node).parentElement;
        const hit = node?.closest("a,button,input,select,textarea,summary,[tabindex]:not([tabindex='-1'])");
        const takesFocus = hit instanceof HTMLElement
          && !hit.hasAttribute("disabled")
          && hit.getAttribute("aria-disabled") !== "true";
        if (takesFocus) return;
        e.preventDefault();
        toggle.current?.focus();
      }
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();   // never strand focus inside a closed menu
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  // The toggle comes before the links so Tab goes from it straight into the
  // open menu (the menu is positioned absolutely, and the toggle is hidden on
  // wide screens, so the order moves nothing on screen). Focus leaving the
  // wrapper closes it.
  return (
    <div
      className="navwrap"
      ref={wrap}
      onBlur={(e) => {
        if (open && !wrap.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={toggle}
        className="iconbtn navtoggle"
        type="button"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">{open ? "✕" : "☰"}</span>
      </button>
      <nav
        className={"mainnav" + (open ? " open" : "")}
        aria-label={label}
        onClick={() => setOpen(false)}
      >
        {children}
      </nav>
    </div>
  );
}
