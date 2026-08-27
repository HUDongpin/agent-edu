"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Icon from "./Icon";

/**
 * The narrow-screen menu.
 *
 * It used to open and then only close again if you clicked a link inside it:
 * Escape did nothing, tapping the page behind it did nothing, and focus stayed
 * wherever it was. Those are the two things everyone tries first.
 */
export default function MobileNav({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const menuId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const close = () => {
      openRef.current = false;
      setOpen(false);
    };
    const away = (e: MouseEvent) => {
      if (openRef.current && !wrap.current?.contains(e.target as Node)) close();
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !openRef.current) return;
      close();
      toggle.current?.focus();   // never strand focus inside a closed menu
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, []);

  return (
    <div className="navwrap" ref={wrap}>
      <button
        ref={toggle}
        className="iconbtn navtoggle"
        type="button"
        aria-controls={menuId}
        aria-expanded={open}
        aria-label={label}
        onClick={() => {
          const next = !openRef.current;
          openRef.current = next;
          setOpen(next);
        }}
      >
        <Icon name={open ? "close" : "menu"} />
      </button>
      <nav
        id={menuId}
        className={"mainnav" + (open ? " open" : "")}
        aria-label={label}
        onClick={() => {
          openRef.current = false;
          setOpen(false);
        }}
      >
        {children}
      </nav>
    </div>
  );
}
