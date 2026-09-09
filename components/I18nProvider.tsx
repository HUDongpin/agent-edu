"use client";

import { createContext, useContext, useMemo } from "react";
import type { Messages } from "@/lib/i18n";

const Ctx = createContext<{ t: (k: string) => string; locale: string }>({
  t: (k) => k,
  locale: "en",
});

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Messages;
  children: React.ReactNode;
}) {
  const t = (k: string) => messages[k] ?? k;
  return <Ctx.Provider value={{ t, locale }}>{children}</Ctx.Provider>;
}

/**
 * One route's own strings, on top of the chrome's.
 *
 * The layout provides what the header and footer read — six keys — because
 * everything in this context is serialised into the page for hydration and
 * into the payload a <Link> prefetches, so what the provider holds is what
 * every reader downloads. A route that needs more adds it here, and only on
 * that route: see `scopeMessages` and `config/i18n-scopes.json`.
 *
 * Lookup falls through to the parent, so a scope carries what is particular
 * to it and never repeats the chrome. There is no third level today; nesting
 * another would work and would compose the same way.
 */
export function I18nScope({
  messages,
  children,
}: {
  messages: Messages;
  children: React.ReactNode;
}) {
  const parent = useContext(Ctx);
  const value = useMemo(
    () => ({
      locale: parent.locale,
      t: (k: string) => messages[k] ?? parent.t(k),
    }),
    [messages, parent],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Client components read strings through this; server ones use translator(). */
export function useI18n() {
  return useContext(Ctx);
}
