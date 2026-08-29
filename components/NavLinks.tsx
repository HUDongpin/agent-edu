"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The main nav, marking which page you are on.
 *
 * This has to be a client component: a static export has no request context,
 * so the only way to know the current route is to read it in the browser.
 * The marker is aria-current — "page" for a direct match and "location" for a
 * parent section — with the visual treatment hung off the same attribute, so
 * the highlight and the screen-reader announcement can never disagree.
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
        const directMatch = n.exact || segments <= 1
          ? here === target
          : here.startsWith(target);
        const parentLocation = !directMatch && n.activePrefixes
          ?.map(normalize)
          .some((candidate) => here === candidate || here.startsWith(candidate));
        return (
          <Link
            key={n.href}
            href={n.href}
            tabIndex={0}
            aria-current={directMatch ? "page" : parentLocation ? "location" : undefined}
          >
            {n.label}
          </Link>
        );
      })}
    </>
  );
}
