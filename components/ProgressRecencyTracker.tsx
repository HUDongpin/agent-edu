"use client";

import { useEffect } from "react";
import { PUBLIC_PUBLISHED_COURSE_SURFACES } from "@/lib/public-release-surface";
import type { PublishedProgressCourseId } from "@/lib/public-progress-contract";
import { recordProgressActivity } from "./progress-recency";

/**
 * Persist only the course id and a local timestamp when the owning progress
 * store dispatches its canonical same-tab event. No content or drafts enter
 * this ordering ledger.
 */
export default function ProgressRecencyTracker() {
  useEffect(() => {
    const listeners = PUBLIC_PUBLISHED_COURSE_SURFACES.map((surface) => {
      if (!surface.progressEvent) throw new Error(`${surface.id}: missing public progress event`);
      const listener = () => recordProgressActivity(surface.id as PublishedProgressCourseId);
      window.addEventListener(surface.progressEvent, listener);
      return { event: surface.progressEvent, listener };
    });
    return () => {
      for (const { event, listener } of listeners) window.removeEventListener(event, listener);
    };
  }, []);

  return null;
}
