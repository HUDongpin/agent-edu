"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The main nav, marking which page you are on.
 *
 * This has to be a client component: a static export has no request context,
 * so the only way to know the current route is to read it in the browser.
 * The marker is aria-current — "page" for a direct match and "location" for a
 * course parent — with the visual treatment hung off the same attribute, so
 * the highlight and the screen-reader announcement can never disagree.
 */
export default function NavLinks({
  items,
}: {
  items: { href: string; label: string; currentFor?: string[] }[];
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
        const parentLocation = !active && n.currentFor?.some((path) => {
          const prefix = path.endsWith("/") ? path : `${path}/`;
          return here === prefix || here.startsWith(prefix);
        });
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : parentLocation ? "location" : undefined}
          >
            {n.label}
          </Link>
        );
      })}
    </>
  );
}
