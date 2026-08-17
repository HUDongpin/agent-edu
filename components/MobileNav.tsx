"use client";

import { useState, type ReactNode } from "react";

export default function MobileNav({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <nav className={"mainnav" + (open ? " open" : "")} onClick={() => setOpen(false)}>
        {children}
      </nav>
      <button
        className="iconbtn navtoggle"
        type="button"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
      >
        ☰
      </button>
    </>
  );
}
