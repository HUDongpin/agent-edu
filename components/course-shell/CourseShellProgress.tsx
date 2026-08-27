"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PublicCourseId } from "@/lib/public-release-surface";
import {
  loadPublishedProgressAdapters,
  useProgressAdaptersImporter,
} from "../ProgressAdaptersProvider";

type ProgressState = "pending" | "not-started" | "in-progress" | "completed" | "unavailable";

export interface CourseShellProgressSnapshot {
  readonly state: ProgressState;
  readonly percent: number | null;
  readonly nextHref: string | null;
}

export interface CourseShellProgressLabels {
  readonly progress: string;
  readonly pending: string;
  readonly unavailable: string;
  readonly notStarted: string;
  readonly inProgress: string;
  readonly completed: string;
  readonly start: string;
  readonly resume: string;
  readonly review: string;
}

interface AdapterSummary {
  readonly state: unknown;
  readonly percent: unknown;
  readonly nextHref: unknown;
}

interface ProgressAdapter {
  readonly courseId: string;
  readonly progressEvent: string;
  readSummary(): AdapterSummary;
}

interface ProgressAdapterModule {
  createPublishedProgressAdapters(locale: string): readonly ProgressAdapter[];
}

export type CourseShellProgressImporter = () => Promise<unknown>;

interface ProgressConnection {
  readonly event: string;
  read(): CourseShellProgressSnapshot;
}

export const PENDING_COURSE_SHELL_PROGRESS: CourseShellProgressSnapshot = Object.freeze({
  state: "pending",
  percent: null,
  nextHref: null,
});

export const UNAVAILABLE_COURSE_SHELL_PROGRESS: CourseShellProgressSnapshot = Object.freeze({
  state: "unavailable",
  percent: null,
  nextHref: null,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAdapterModule(value: unknown): value is ProgressAdapterModule {
  return isRecord(value) && typeof value.createPublishedProgressAdapters === "function";
}

function snapshotFromAdapter(adapter: ProgressAdapter): CourseShellProgressSnapshot {
  try {
    const summary = adapter.readSummary();
    if (
      !isRecord(summary)
      || (
        summary.state !== "not-started"
        && summary.state !== "in-progress"
        && summary.state !== "completed"
      )
      || typeof summary.percent !== "number"
      || !Number.isInteger(summary.percent)
      || summary.percent < 0
      || summary.percent > 100
      || typeof summary.nextHref !== "string"
      || !summary.nextHref.startsWith("/")
    ) return UNAVAILABLE_COURSE_SHELL_PROGRESS;

    return {
      state: summary.state,
      percent: summary.percent,
      nextHref: summary.nextHref,
    };
  } catch {
    return UNAVAILABLE_COURSE_SHELL_PROGRESS;
  }
}

async function connectCourseShellProgress(
  courseId: PublicCourseId,
  locale: string,
  importer: CourseShellProgressImporter,
): Promise<ProgressConnection | null> {
  try {
    const adapterModule = await importer();
    if (!isAdapterModule(adapterModule)) return null;
    const adapters = adapterModule.createPublishedProgressAdapters(locale);
    if (!Array.isArray(adapters)) return null;
    const adapter = adapters.find((candidate) => candidate.courseId === courseId);
    if (!adapter || typeof adapter.progressEvent !== "string" || !adapter.progressEvent) {
      return null;
    }
    return {
      event: adapter.progressEvent,
      read: () => snapshotFromAdapter(adapter),
    };
  } catch {
    return null;
  }
}

export async function loadCourseShellProgress(
  courseId: PublicCourseId,
  locale: string,
  importer: CourseShellProgressImporter = loadPublishedProgressAdapters,
): Promise<CourseShellProgressSnapshot> {
  const connection = await connectCourseShellProgress(courseId, locale, importer);
  return connection?.read() ?? UNAVAILABLE_COURSE_SHELL_PROGRESS;
}

function progressLabel(
  snapshot: CourseShellProgressSnapshot,
  labels: CourseShellProgressLabels,
): string {
  if (snapshot.state === "pending") return labels.pending;
  if (snapshot.state === "unavailable") return labels.unavailable;
  if (snapshot.state === "not-started") return labels.notStarted;
  if (snapshot.state === "completed") return labels.completed;
  return labels.inProgress;
}

function actionLabel(
  snapshot: CourseShellProgressSnapshot,
  labels: CourseShellProgressLabels,
): string {
  if (snapshot.state === "completed") return labels.review;
  if (snapshot.state === "not-started") return labels.start;
  return labels.resume;
}

export default function CourseShellProgress({
  courseId,
  locale,
  labels,
}: {
  readonly courseId: PublicCourseId;
  readonly locale: string;
  readonly labels: CourseShellProgressLabels;
}) {
  const importProgressAdapters = useProgressAdaptersImporter();
  const [snapshot, setSnapshot] = useState<CourseShellProgressSnapshot>(
    PENDING_COURSE_SHELL_PROGRESS,
  );

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    void connectCourseShellProgress(
      courseId,
      locale,
      importProgressAdapters,
    ).then((connection) => {
      if (disposed) return;
      if (!connection) {
        setSnapshot(UNAVAILABLE_COURSE_SHELL_PROGRESS);
        return;
      }
      const update = () => setSnapshot(connection.read());
      update();
      window.addEventListener(connection.event, update);
      window.addEventListener("storage", update);
      window.addEventListener("focus", update);
      cleanup = () => {
        window.removeEventListener(connection.event, update);
        window.removeEventListener("storage", update);
        window.removeEventListener("focus", update);
      };
    }).catch(() => {
      if (!disposed) setSnapshot(UNAVAILABLE_COURSE_SHELL_PROGRESS);
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [courseId, importProgressAdapters, locale]);

  const label = progressLabel(snapshot, labels);
  const interactive = snapshot.state !== "pending" && snapshot.state !== "unavailable";

  return (
    <div
      className="course-shell-progress"
      data-course-shell-field="progress"
      data-course-progress-state={snapshot.state}
      aria-busy={snapshot.state === "pending"}
    >
      <div className="course-shell-progress-heading">
        <strong>{labels.progress}</strong>
        <span role="status" aria-live="polite">{label}</span>
      </div>
      {interactive && snapshot.percent !== null ? (
        <div
          className="progbar"
          role="progressbar"
          aria-label={`${labels.progress}: ${label}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={snapshot.percent}
        >
          <span style={{ width: `${snapshot.percent}%` }} />
        </div>
      ) : null}
      {interactive && snapshot.nextHref ? (
        <Link className="btn primary course-shell-action" href={snapshot.nextHref}>
          {actionLabel(snapshot, labels)}
          <span className="arrow" aria-hidden="true">→</span>
        </Link>
      ) : null}
    </div>
  );
}
