"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  exportProgressBackup,
  readProgressBackupFile,
  restoreProgressBackup,
} from "@/lib/progress-backup";
import { PUBLISHED_CATALOG_COURSES } from "@/lib/public-courses";
import { withPublicCourseReturnLocale } from "@/lib/public-release-surface";
import { useI18n } from "../I18nProvider";
import {
  createPublishedProgressAdapters,
  type ProgressStoreAdapter,
  type ProgressSummaryState,
  type PublishedProgressCourseId,
} from "../progress-adapters";
import {
  PROGRESS_RECENCY_EVENT,
  readProgressRecency,
  sortCourseIdsByRecentActivity,
  type ProgressActivity,
} from "../progress-recency";
import {
  inspectProgressPersistence,
  resetEveryCourseProgress,
} from "../progress-reset";

type LearningState = ProgressSummaryState;
type FeedbackTone = "success" | "warning" | "error";

type LearningCourse = {
  readonly id: PublishedProgressCourseId;
  readonly titleKey: string;
  readonly state: LearningState;
  readonly percent: number | null;
  readonly nextHref: string | null;
};

type Feedback = {
  readonly message: string;
  readonly tone: FeedbackTone;
};

const titleKeyById = new Map(
  PUBLISHED_CATALOG_COURSES.map(({ course }) => [course.id, course.titleKey] as const),
);

function readCourse(adapter: ProgressStoreAdapter, locale: string): LearningCourse {
  const titleKey = titleKeyById.get(adapter.courseId) ?? `c.${adapter.courseId}.title`;
  try {
    const progress = adapter.readSummary();
    if (progress.state === "unavailable" || !progress.nextHref) {
      return {
        id: adapter.courseId,
        titleKey,
        state: "unavailable",
        percent: null,
        nextHref: null,
      };
    }
    return {
      id: adapter.courseId,
      titleKey,
      ...progress,
      nextHref: withPublicCourseReturnLocale(progress.nextHref, locale),
    };
  } catch {
    return {
      id: adapter.courseId,
      titleKey,
      state: "unavailable",
      percent: null,
      nextHref: null,
    };
  }
}

function LearningCard({ course }: { readonly course: LearningCourse }) {
  const { t } = useI18n();
  const action = course.state === "completed"
    ? t("learning.review")
    : course.state === "not-started"
      ? t("learning.start")
      : t("learning.resume");
  const status = course.state === "completed"
    ? t("learning.completed")
    : course.state === "not-started"
      ? t("courseShell.progressNotStarted")
      : t("learning.inProgress");

  return (
    <article className="learning-course-card" data-learning-state={course.state}>
      <div className="learning-course-heading">
        <h3>{t(course.titleKey)}</h3>
        <span>{status}</span>
      </div>
      {course.percent !== null ? (
        <div
          className="progbar"
          role="progressbar"
          aria-label={`${t(course.titleKey)}: ${t("cat.progress")}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={course.percent}
        >
          <span style={{ width: `${course.percent}%` }} />
        </div>
      ) : null}
      <div className="learning-course-footer">
        <span>{course.percent === null ? "—" : `${course.percent}%`}</span>
        {course.nextHref ? (
          <Link className="btn primary learning-course-action" href={course.nextHref}>
            {action}<span className="arrow" aria-hidden="true">→</span>
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function LearningSection({
  id,
  title,
  description,
  empty,
  courses,
  featured = false,
}: {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly empty: string;
  readonly courses: readonly LearningCourse[];
  readonly featured?: boolean;
}) {
  return (
    <section
      className={featured ? "learning-group learning-group-featured" : "learning-group"}
      aria-labelledby={id}
    >
      <h2 id={id}>{title}</h2>
      {description ? <p className="learning-group-description">{description}</p> : null}
      {courses.length ? (
        <div className="learning-course-grid">
          {courses.map((course) => <LearningCard key={course.id} course={course} />)}
        </div>
      ) : (
        <p className="learning-group-empty">{empty}</p>
      )}
    </section>
  );
}

function downloadJson(text: string): void {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `aicourse-progress-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
}

function browserLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export default function MyLearning({ locale }: { readonly locale: string }) {
  const { t } = useI18n();
  const adapters = useMemo(() => createPublishedProgressAdapters(locale), [locale]);
  const fileInput = useRef<HTMLInputElement>(null);
  const [courses, setCourses] = useState<readonly LearningCourse[] | null>(null);
  const [activity, setActivity] = useState<ProgressActivity>({});
  const [recencyPersistent, setRecencyPersistent] = useState(true);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState<"export" | "import" | "reset" | null>(null);

  const read = useCallback(() => {
    const recency = readProgressRecency();
    setActivity(recency.activity);
    setRecencyPersistent(recency.persistence === "persistent");
    setCourses(adapters.map((adapter) => readCourse(adapter, locale)));
  }, [adapters, locale]);

  useEffect(() => {
    const initialRead = window.requestAnimationFrame(read);
    const listeners = adapters.map((adapter) => {
      const listener = () => read();
      window.addEventListener(adapter.progressEvent, listener);
      return { event: adapter.progressEvent, listener };
    });
    window.addEventListener(PROGRESS_RECENCY_EVENT, read);
    window.addEventListener("storage", read);
    window.addEventListener("focus", read);
    return () => {
      window.cancelAnimationFrame(initialRead);
      for (const { event, listener } of listeners) window.removeEventListener(event, listener);
      window.removeEventListener(PROGRESS_RECENCY_EVENT, read);
      window.removeEventListener("storage", read);
      window.removeEventListener("focus", read);
    };
  }, [adapters, read]);

  const sorted = useMemo(() => {
    if (!courses) return [];
    const orderedIds = sortCourseIdsByRecentActivity(
      courses.map((course) => course.id),
      activity,
    );
    const rank = new Map(orderedIds.map((courseId, index) => [courseId, index]));
    return [...courses].sort((left, right) =>
      (rank.get(left.id) ?? Number.MAX_SAFE_INTEGER)
      - (rank.get(right.id) ?? Number.MAX_SAFE_INTEGER));
  }, [activity, courses]);

  const allInProgress = sorted.filter((course) => course.state === "in-progress");
  const allCompleted = sorted.filter((course) => course.state === "completed");
  const continueCourses = allInProgress.length
    ? allInProgress.slice(0, 1)
    : allCompleted.slice(0, 1);
  const inProgress = allInProgress.slice(1);
  const completed = allInProgress.length ? allCompleted : allCompleted.slice(1);
  const suggested = sorted.filter((course) => course.state === "not-started").slice(0, 3);
  const unavailable = sorted.filter((course) => course.state === "unavailable");

  const publishProgressEvents = useCallback(() => {
    for (const adapter of adapters) window.dispatchEvent(new Event(adapter.progressEvent));
    window.dispatchEvent(new Event(PROGRESS_RECENCY_EVENT));
    read();
  }, [adapters, read]);

  const handleExport = () => {
    setBusy("export");
    setFeedback(null);
    const storage = browserLocalStorage();
    if (!storage) {
      setFeedback({ message: t("learning.storageUnavailable"), tone: "error" });
      setBusy(null);
      return;
    }
    const result = exportProgressBackup(storage);
    if (result.ok) {
      downloadJson(result.text);
      setFeedback({ message: t("learning.exportSuccess"), tone: "success" });
    } else if (result.reason === "too-large") {
      setFeedback({ message: t("learning.exportTooLarge"), tone: "error" });
    } else if (result.reason === "invalid-record") {
      setFeedback({ message: t("learning.exportInvalid"), tone: "error" });
    } else {
      setFeedback({ message: t("learning.storageUnavailable"), tone: "error" });
    }
    setBusy(null);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;

    setBusy("import");
    setFeedback(null);
    const parsed = await readProgressBackupFile(file);
    if (!parsed.ok) {
      const message = parsed.reason === "too-large"
        ? t("learning.importTooLarge")
        : parsed.reason === "read-failed"
          ? t("learning.importReadFailed")
          : t("learning.importInvalid");
      setFeedback({ message, tone: "error" });
      setBusy(null);
      return;
    }

    if (!window.confirm(t("learning.importConfirm"))) {
      setBusy(null);
      return;
    }

    const storage = browserLocalStorage();
    if (!storage) {
      setFeedback({ message: t("learning.importWriteFailed"), tone: "warning" });
      setBusy(null);
      return;
    }
    const restored = restoreProgressBackup(storage, parsed.backup);
    if (restored.ok) {
      publishProgressEvents();
      setFeedback({ message: t("learning.importSuccess"), tone: "success" });
    } else if (restored.reason === "write-failed") {
      setFeedback({ message: t("learning.importWriteFailed"), tone: "warning" });
    } else {
      setFeedback({ message: t("learning.importRollbackFailed"), tone: "error" });
    }
    setBusy(null);
  };

  const handleReset = async () => {
    if (!window.confirm(t("progress.resetConfirm"))) return;
    setBusy("reset");
    setFeedback(null);
    const result = await resetEveryCourseProgress();
    read();
    setFeedback({
      message: result.persistent
        ? result.quarantinedStores.length
          ? t("progress.resetQuarantined")
          : t("progress.resetComplete")
        : t("progress.resetSessionOnly"),
      tone: result.persistent ? "success" : "warning",
    });
    setBusy(null);
  };

  const handleStorageRetry = () => {
    const persistence = inspectProgressPersistence();
    read();
    setFeedback({
      message: persistence.persistent
        ? t("learning.storageRecovered")
        : t("learning.storageStillUnavailable"),
      tone: persistence.persistent ? "success" : "warning",
    });
  };

  return (
    <div className="learning-dashboard" aria-busy={courses === null || busy !== null}>
      {unavailable.length || !recencyPersistent ? (
        <div className="langnote learning-storage-warning" role="status" aria-live="polite">
          <p>{t("learning.storageUnavailable")}</p>
          <button className="btn" type="button" onClick={handleStorageRetry} disabled={busy !== null}>
            {t("learning.retryStorage")}
          </button>
        </div>
      ) : null}

      {courses === null ? (
        <div className="learning-loading" aria-hidden="true" />
      ) : (
        <div className="learning-groups">
          <LearningSection
            id="learning-continue-title"
            title={t("learning.continue")}
            empty={t("learning.emptyContinue")}
            courses={continueCourses}
            featured
          />
          <LearningSection
            id="learning-in-progress-title"
            title={t("learning.inProgress")}
            empty={t("learning.emptyInProgress")}
            courses={inProgress}
          />
          <LearningSection
            id="learning-completed-title"
            title={t("learning.completed")}
            empty={t("learning.emptyCompleted")}
            courses={completed}
          />
          <LearningSection
            id="learning-suggested-title"
            title={t("learning.suggested")}
            description={t("learning.suggestedBody")}
            empty={t("learning.emptySuggested")}
            courses={suggested}
          />
        </div>
      )}

      <aside className="learning-local-note">
        <p>{t("learning.localNote")}</p>
        <Link href={`/${locale}/privacy/`}>{t("privacy.title")}</Link>
      </aside>

      <section className="learning-backup-panel" aria-labelledby="learning-backup-title">
        <div>
          <h2 id="learning-backup-title">{t("learning.backupTitle")}</h2>
          <p>{t("learning.backupBody")}</p>
        </div>
        <div className="learning-backup-actions">
          <button className="btn" type="button" onClick={handleExport} disabled={busy !== null}>
            {t("learning.export")}
          </button>
          <button
            className="btn danger"
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={busy !== null}
          >
            {t("learning.import")}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            onChange={(event) => void handleImport(event)}
            hidden
          />
        </div>
      </section>

      <section className="learning-reset-panel" aria-labelledby="learning-reset-title">
        <div>
          <h2 id="learning-reset-title">{t("learning.resetTitle")}</h2>
          <p>{t("learning.resetBody")}</p>
        </div>
        <button
          className="btn danger"
          type="button"
          onClick={() => void handleReset()}
          disabled={busy !== null}
        >
          {t("learning.reset")}
        </button>
      </section>

      {feedback ? (
        <p
          className="learning-feedback"
          data-tone={feedback.tone}
          role={feedback.tone === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
