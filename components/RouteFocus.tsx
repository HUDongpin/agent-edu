"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// The locale layout can remount during an in-app cross-language navigation.
// Module state survives that remount, while a real document load evaluates a
// fresh browser bundle and correctly keeps native initial focus behaviour.
let lastCommittedPathname: string | null = null;

/**
 * A client-side route change does not reload the document, so browser focus
 * otherwise remains in the old navigation link. Move it to the new page's
 * primary heading once Next has committed the route. Initial page loads keep
 * the browser's native focus behaviour.
 */
export default function RouteFocus() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const previousPathname = lastCommittedPathname;
    lastCommittedPathname = pathname;
    if (previousPathname === null || pathname === previousPathname) return;

    const frame = window.requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>("main h1");
      if (!heading) return;
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: false });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
