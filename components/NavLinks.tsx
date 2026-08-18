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
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname() || "/";
  const here = pathname.endsWith("/") ? pathname : `${pathname}/`;

  return (
    <>
      {items.map((n) => {
        const target = n.href.endsWith("/") ? n.href : `${n.href}/`;
        // The locale root is only "current" on an exact match, otherwise every
        // page would light up Home as well as itself.
        const segments = target.split("/").filter(Boolean).length;
        const active = segments <= 1 ? here === target : here.startsWith(target);
        return (
          <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined}>
            {n.label}
          </Link>
        );
      })}
    </>
  );
}
