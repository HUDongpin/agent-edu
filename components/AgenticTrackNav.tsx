"use client";

import Link from "next/link";
import { useI18n } from "./I18nProvider";

const TRACKS = [
  { id: "handbook", href: "/handbook/", titleKey: "track.1.title" },
  { id: "lab", href: "/lab/", titleKey: "track.2.title" },
  { id: "build", href: "/build/", titleKey: "track.3.title" },
] as const;

export default function AgenticTrackNav({
  locale,
  current,
}: {
  locale: string;
  current: (typeof TRACKS)[number]["id"];
}) {
  const { t } = useI18n();
  const index = TRACKS.findIndex((track) => track.id === current);
  if (index < 0) throw new Error(`Unknown Agentic Engineering track: ${current}`);
  const previous = index > 0 ? TRACKS[index - 1] : null;
  const next = index < TRACKS.length - 1 ? TRACKS[index + 1] : null;
  const currentTrack = TRACKS[index];
  const hrefFor = (href: string) => `/${locale}${href}`;

  return (
    <nav className="agentic-track-nav" aria-label={t("c.agentic.title")} data-course-lesson-nav>
      <ol className="agentic-track-breadcrumb">
        <li><Link href={`/${locale}/courses/`}>{t("nav.courses")}</Link></li>
        <li><Link href={`/${locale}/handbook/`}>{t("c.agentic.title")}</Link></li>
        <li aria-current="page">{t(currentTrack.titleKey)}</li>
      </ol>
      <div className="agentic-track-pager">
        {previous ? (
          <Link href={hrefFor(previous.href)} rel="prev">
            <span aria-hidden="true">←</span>{t(previous.titleKey)}
          </Link>
        ) : <span />}
        {next ? (
          <Link href={hrefFor(next.href)} rel="next">
            {t(next.titleKey)}<span aria-hidden="true">→</span>
          </Link>
        ) : <span />}
      </div>
    </nav>
  );
}
