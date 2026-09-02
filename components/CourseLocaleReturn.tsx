"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  PUBLIC_PUBLISHED_COURSE_SURFACES,
  PUBLIC_SITE_LOCALES,
  type PublicContentLocale as ContentLocale,
} from "@/lib/public-release-surface";
import { useI18n } from "./I18nProvider";

function sourceLocaleFor(pathname: string, search: string): ContentLocale | null {
  const requested = new URLSearchParams(search).get("fromLocale");
  if (!requested || !PUBLIC_SITE_LOCALES.includes(requested as ContentLocale)) return null;

  const [, currentLocale, ...segments] = pathname.split("/");
  if (!currentLocale || requested === currentLocale) return null;
  const root = `/${segments.filter(Boolean)[0] ?? ""}/`;
  const publishedCoursePage = PUBLIC_PUBLISHED_COURSE_SURFACES.some(
    (course) => course.href === root,
  );
  return publishedCoursePage ? requested as ContentLocale : null;
}

/**
 * A cross-language course link keeps the learner's catalogue locale in a
 * validated query parameter. It never affects canonical metadata; it only
 * renders this explicit way back to the original language catalogue.
 */
export default function CourseLocaleReturn() {
  const { t } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const search = searchParams.toString();
  const sourceLocale = useMemo(
    () => sourceLocaleFor(pathname, search),
    [pathname, search],
  );

  useEffect(() => {
    if (!sourceLocale) return;

    const [, currentLocale, courseRoot] = pathname.split("/");
    if (!currentLocale || !courseRoot) return;
    const coursePrefix = `/${currentLocale}/${courseRoot}/`;

    const preserveReturnLocale = (event: MouseEvent) => {
      if (
        event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
      ) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.origin !== window.location.origin
        || !destination.pathname.startsWith(coursePrefix)
        || destination.searchParams.has("fromLocale")
      ) return;

      destination.searchParams.set("fromLocale", sourceLocale);
      event.preventDefault();
      event.stopPropagation();
      router.push(`${destination.pathname}${destination.search}${destination.hash}`);
    };

    document.addEventListener("click", preserveReturnLocale, true);
    return () => document.removeEventListener("click", preserveReturnLocale, true);
  }, [pathname, router, sourceLocale]);

  if (!sourceLocale) return null;
  return (
    <aside className="course-locale-return">
      <Link href={`/${sourceLocale}/courses/`}>
        <span aria-hidden="true">←</span>{t("course.returnCatalog")}
      </Link>
    </aside>
  );
}
