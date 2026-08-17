import type { ReactNode } from "react";
import "./globals.css";

/**
 * The root layout exists only to satisfy Next's app router; every real
 * decision (lang, dir, metadata) is made in app/[locale]/layout.tsx, because
 * all of them depend on which language the reader chose.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
