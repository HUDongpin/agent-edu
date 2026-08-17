"use client";

import { createContext, useContext } from "react";
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

/** Client components read strings through this; server ones use translator(). */
export function useI18n() {
  return useContext(Ctx);
}
