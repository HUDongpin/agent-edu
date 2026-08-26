"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The main nav, marking which page you are on.
 *
 * This has to be a client component: a static export has no request context,
 * so the only way to know the current route is to read it in the browser.
 * The marker is aria-current="page" — the same attribute assistive tech
 * announces — with the visual treatment hung off it, so the highlight and the
 * screen-reader label can never disagree.
 */
export default function NavLinks({
  items,
}: {
  items: {
    href: string;
    label: string;
    /** Route prefixes that belong to this top-level section. */
    activePrefixes?: readonly string[];
    /** Use an exact pathname match instead of prefix matching. */
    exact?: boolean;
  }[];
}) {
  const pathname = usePathname() || "/";
  const here = pathname.endsWith("/") ? pathname : `${pathname}/`;

  const normalize = (value: string) => {
    const path = value.split(/[?#]/, 1)[0] || "/";
    return path.endsWith("/") ? path : `${path}/`;
  };

  return (
    <>
      {items.map((n) => {
        const target = normalize(n.href);
        // The locale root is only "current" on an exact match, otherwise every
        // page would light up Home as well as itself.
        const segments = target.split("/").filter(Boolean).length;
        const candidates = n.activePrefixes?.map(normalize) ?? [target];
        const active = n.exact || segments <= 1
          ? candidates.some((candidate) => here === candidate)
          : candidates.some((candidate) => here.startsWith(candidate));
        return (
          <Link
            key={n.href}
            href={n.href}
            tabIndex={0}
            aria-current={active ? "page" : undefined}
          >
            {n.label}
          </Link>
        );
      })}
    </>
  );
}
