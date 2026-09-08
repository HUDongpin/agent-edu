"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  readLearningState,
  readLearningStateOnServer,
  selectCourseProgress,
  subscribeLearningState,
} from "@/lib/progress";
import { useI18n } from "../I18nProvider";

/**
 * The call on a track card, in the reader's own tense.
 *
 * The three cards were a static array with the primary call and the "start
 * here" flag hard-coded to Part 1, so they never consulted the record. A
 * learner three days and seven sections in landed on a page identical to the
 * one they saw first, telling them to start at the top.
 *
 * The catalogue had already solved this from the same store, choosing between
 * start, resume, finish and review — all four already translated — so this
 * borrows the answer rather than inventing one.
 *
 * `readLearningStateOnServer` returns the empty record, so the server renders
 * exactly today's wording and the static export and every crawler still see
 * the first-visit page. Only a reader with a record sees anything else.
 */
export default function TrackCta({
  courseId, href, fallback,
}: {
  courseId: string;
  href: string;
  /** The card's own cta key, used until the record says otherwise. */
  fallback: string;
}) {
  const { t } = useI18n();
  const state = useSyncExternalStore(
    subscribeLearningState,
    readLearningState,
    readLearningStateOnServer,
  );
  const progress = selectCourseProgress(state, courseId);

  const started = progress.kind === "external"
    ? progress.declaredComplete
    : progress.kind === "tracked" && progress.status !== "not-started";

  const label = !started
    ? t(fallback)
    : progress.kind === "external"
      ? t("cat.review")
      : t(`cat.${progress.action}`);

  return (
    <Link className="btn" href={href}>
      {label}<span className="arrow">→</span>
    </Link>
  );
}
