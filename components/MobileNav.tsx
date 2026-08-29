"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/**
 * The narrow-screen menu.
 *
 * It used to open and then only close again if you clicked a link inside it:
 * Escape did nothing, tapping the page behind it did nothing, and focus stayed
 * wherever it was. Those are the two things everyone tries first.
 */
export default function MobileNav({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
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

  return (
    <div className="navwrap" ref={wrap}>
      <button
        ref={toggle}
        className="iconbtn navtoggle"
        type="button"
        aria-controls={navId}
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">{open ? "✕" : "☰"}</span>
      </button>
      <nav
        id={navId}
        className={"mainnav" + (open ? " open" : "")}
        aria-label={label}
        onClick={() => setOpen(false)}
      >
        {children}
      </nav>
    </div>
  );
}
