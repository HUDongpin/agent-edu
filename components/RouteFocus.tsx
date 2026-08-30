"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// The locale layout can remount during an in-app cross-language navigation.
// Module state survives that remount, while a real document load evaluates a
// fresh browser bundle and correctly keeps native initial focus behaviour.
let lastCommittedPathname: string | null = null;

function routeFragmentTarget(): HTMLElement | null {
  const hash = window.location.hash;
  if (!hash || hash === "#") return null;
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
}

function focusRouteDestination() {
  const target = routeFragmentTarget() ?? document.querySelector<HTMLElement>("main h1");
  if (!target) return;
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: "start", behavior: "instant" as ScrollBehavior });
}

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

    const frame = window.requestAnimationFrame(focusRouteDestination);
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    let frame = 0;
    const focusFragment = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(focusRouteDestination);
    };
    window.addEventListener("hashchange", focusFragment);
    window.addEventListener("popstate", focusFragment);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", focusFragment);
      window.removeEventListener("popstate", focusFragment);
    };
  }, []);

  return null;
}
