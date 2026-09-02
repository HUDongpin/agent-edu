"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  CREATOR_OPS_CAPSTONE_CHECKS_KEY,
  CREATOR_OPS_PROGRESS_EVENT,
  CREATOR_OPS_PROGRESS_RESET_EVENT,
  CREATOR_OPS_QUIZ_BEST_KEY,
  CREATOR_OPS_QUIZ_PASSED_KEY,
  creatorOpsArtifactEvidenceKey,
  creatorOpsCheckpointKey,
  creatorOpsCheckpointPassedKey,
  creatorOpsModuleProgressKey,
  creatorOpsProgressPercent,
  gradeCreatorOpsAssessment,
  hasCreatorOpsCapstonePrerequisites,
  isCreatorOpsCapstoneComplete,
  isCreatorOpsModuleComplete,
  isMeaningfulCreatorOpsArtifactDraft,
  nextCreatorOpsStep,
  recordCreatorOpsAssessment,
  recordCreatorOpsCapstone,
  reconcileCreatorOpsModuleCompletion,
  type CreatorOpsCheckpointCopy,
  type CreatorOpsCourseCopy,
  type CreatorOpsModuleSlug,
  type CreatorOpsPracticeCopy,
} from "@/staging/course-src/creator-ops/lib";
import {
  isCreatorOpsProgressStorageEvent,
  isCreatorOpsStorageAvailable,
  readCreatorOpsProgress,
  updateCreatorOpsProgress,
} from "./progress-store";
import styles from "./CreatorOpsCourse.module.css";

type Labels = Readonly<Record<string, string>>;
type NavigationLike = {
  addEventListener: (type: "navigate", listener: EventListener) => void;
  removeEventListener: (type: "navigate", listener: EventListener) => void;
};
type NavigateEventLike = Event & { navigationType?: string };

export interface CreatorOpsNavigationItem {
  readonly slug: CreatorOpsModuleSlug;
  readonly order: number;
  readonly title: string;
}

function label(labels: Labels, key: string, fallback: string): string {
  return labels[key]?.trim() || fallback;
}

const subscribeToNoopExternalStore = () => () => {};
const EMPTY_PROGRESS: Record<string, unknown> = Object.freeze({});

function useCreatorOpsProgress() {
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  useEffect(() => {
    const refresh = () => setRecord(readCreatorOpsProgress());
    const onStorage = (event: StorageEvent) => {
      if (isCreatorOpsProgressStorageEvent(event)) refresh();
    };
    refresh();
    window.addEventListener(CREATOR_OPS_PROGRESS_EVENT, refresh);
    window.addEventListener(CREATOR_OPS_PROGRESS_RESET_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(CREATOR_OPS_PROGRESS_EVENT, refresh);
      window.removeEventListener(CREATOR_OPS_PROGRESS_RESET_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return {
    ready: record !== null,
    record: record ?? EMPTY_PROGRESS,
  };
}

function persistenceMessage(labels: Labels, persisted: boolean | null): string {
  if (persisted === null) return "";
  return persisted
    ? label(labels, "savedLocally", "Progress is saved in this browser; artifact text is not stored.")
    : label(labels, "memoryOnly", "Private mode: this receipt lasts for the current tab only.");
}

export function CourseFragmentFocusManager() {
  const originsRef = useRef(new Map<string, HTMLAnchorElement>());
  const activeHashRef = useRef("");

  useEffect(() => {
    let frame = 0;
    const targetFor = (hash: string) => {
      if (!hash.startsWith("#")) return null;
      try {
        return document.getElementById(decodeURIComponent(hash.slice(1)));
      } catch {
        return null;
      }
    };
    const focusTarget = (hash: string, preventScroll: boolean) => {
      const target = targetFor(hash);
      if (!target) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => target.focus({ preventScroll }));
    };
    const onHashChange = () => {
      const previousHash = activeHashRef.current;
      const nextHash = window.location.hash;
      activeHashRef.current = nextHash;
      if (nextHash) {
        focusTarget(nextHash, false);
        return;
      }
      const previousTarget = targetFor(previousHash);
      const origin = originsRef.current.get(previousHash);
      if (document.activeElement === previousTarget && origin?.isConnected) {
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(() => origin.focus({ preventScroll: false }));
      }
    };
    const onTargetClick = (event: MouseEvent) => {
      if (
        !(event.target instanceof Element)
        || event.defaultPrevented
        || event.button !== 0
        || event.metaKey
        || event.ctrlKey
        || event.shiftKey
        || event.altKey
      ) return;
      const anchor = event.target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const targetUrl = new URL(anchor.href, window.location.href);
      if (
        targetUrl.origin !== window.location.origin
        || targetUrl.pathname !== window.location.pathname
        || !targetUrl.hash
        || !targetFor(targetUrl.hash)
      ) return;
      originsRef.current.set(targetUrl.hash, anchor);
      activeHashRef.current = targetUrl.hash;
      focusTarget(targetUrl.hash, false);
    };

    activeHashRef.current = window.location.hash;
    if (activeHashRef.current) focusTarget(activeHashRef.current, true);
    window.addEventListener("hashchange", onHashChange);
    document.addEventListener("click", onTargetClick, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", onHashChange);
      document.removeEventListener("click", onTargetClick, true);
    };
  }, []);

  return null;
}

function useActionStatusFocus() {
  const statusRef = useRef<HTMLElement>(null);
  const frameRef = useRef(0);
  useEffect(() => () => window.cancelAnimationFrame(frameRef.current), []);
  const focusStatus = () => {
    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() => {
      statusRef.current?.focus({ preventScroll: false });
    });
  };
  return { focusStatus, statusRef };
}

export function CoursePrimaryAction({
  locale,
  modules,
  labels,
  startLabel,
  resumeLabel,
}: {
  locale: string;
  modules: readonly CreatorOpsNavigationItem[];
  labels: Labels;
  startLabel: string;
  resumeLabel: string;
}) {
  const { ready, record } = useCreatorOpsProgress();
  const step = nextCreatorOpsStep(record);
  const firstModule = modules[0];
  const currentModule = step.kind === "module"
    ? modules.find((module) => module.slug === step.slug) ?? firstModule
    : null;
  const hasStarted = Object.keys(record).some(
    (key) => key.startsWith("creator-ops.") && key !== "creator-ops.progress.version",
  );
  const href = !ready || step.kind === "module"
    ? `/${locale}/creator-ops/${(currentModule ?? firstModule).slug}/`
    : step.kind === "assessment"
      ? "#final-assessment"
      : step.kind === "capstone"
        ? "#capstone"
        : "#curriculum";
  const actionLabel = !ready || step.kind === "module"
    ? hasStarted ? resumeLabel : startLabel
    : step.kind === "assessment"
      ? label(labels, "finalAssessment", "Final assessment")
      : step.kind === "capstone"
        ? label(labels, "capstone", "Capstone")
        : label(labels, "reviewCourse", "Review the course");
  const compactActionLabel = !ready || step.kind === "module"
    ? hasStarted
      ? label(labels, "resume", "Resume")
      : label(labels, "start", "Start")
    : actionLabel;
  const detail = currentModule
    ? `${label(labels, "module", "Module")} ${currentModule.order}: ${currentModule.title}`
    : step.kind === "complete"
      ? label(labels, "completed", "Completed")
      : "";

  return (
    <div className={styles.primaryActionGroup} aria-live="polite">
      <Link
        className={styles.primaryAction}
        href={href}
        aria-label={actionLabel}
        data-testid="creator-ops-primary-action"
      >
        <span className={styles.actionLabelLong}>{actionLabel}</span>
        <span className={styles.actionLabelShort}>{compactActionLabel}</span>
        <span aria-hidden="true">→</span>
      </Link>
      {detail ? <span className={styles.nextActionDetail}>{detail}</span> : null}
    </div>
  );
}

export function CourseProgress({
  locale,
  modules,
  labels,
}: {
  locale: string;
  modules: readonly CreatorOpsNavigationItem[];
  labels: Labels;
}) {
  const { ready, record } = useCreatorOpsProgress();
  const percent = creatorOpsProgressPercent(record);
  const completedModules = modules.filter((module) =>
    isCreatorOpsModuleComplete(record, module.slug),
  ).length;
  const nextStep = nextCreatorOpsStep(record);
  const assessmentComplete = record[CREATOR_OPS_QUIZ_PASSED_KEY] === true;
  const capstoneComplete = isCreatorOpsCapstoneComplete(record);
  const storageReady = useSyncExternalStore(
    subscribeToNoopExternalStore,
    isCreatorOpsStorageAvailable,
    () => false,
  );
  return (
    <section
      className={styles.progressPanel}
      aria-labelledby="creator-ops-progress-title"
      aria-busy={!ready}
      data-testid="creator-ops-progress"
    >
      <div className={styles.progressHeader}>
        <div>
          <p className={styles.sectionLabel}>{label(labels, "progress", "Course progress")}</p>
          <h2 id="creator-ops-progress-title">{ready ? `${percent}%` : "…"}</h2>
        </div>
        <span>{!ready
          ? label(labels, "progressLoading", "Loading saved progress…")
          : storageReady !== false
            ? label(labels, "savedLocally", "Progress is saved in this browser; artifact text is not stored.")
            : label(labels, "memoryOnly", "Private mode: progress lasts for this tab only.")}</span>
      </div>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label={label(labels, "progress", "Course progress")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={ready ? percent : 0}
        aria-valuetext={ready ? `${percent}%` : label(labels, "progressLoading", "Loading saved progress…")}
      >
        <span style={{ transform: `scaleX(${percent / 100})` }} />
      </div>
      <div className={styles.milestoneLegend}>
        <span data-complete={completedModules === modules.length || undefined}>
          {completedModules}/{modules.length} {label(labels, "modules", "modules")}
        </span>
        <span data-complete={assessmentComplete || undefined}>
          <span>{label(labels, "finalAssessment", "Final assessment")}</span>
          <strong>{assessmentComplete
            ? `✓ ${label(labels, "completed", "Completed")}`
            : `○ ${label(labels, "notCompleted", "Not completed")}`}</strong>
        </span>
        <span data-complete={capstoneComplete || undefined}>
          <span>{label(labels, "capstone", "Capstone")}</span>
          <strong>{capstoneComplete
            ? `✓ ${label(labels, "completed", "Completed")}`
            : `○ ${label(labels, "notCompleted", "Not completed")}`}</strong>
        </span>
      </div>
      <ol className={styles.progressModules} aria-label={label(labels, "modules", "Modules")}>
        {modules.map((module) => {
          const complete = isCreatorOpsModuleComplete(record, module.slug);
          const next = nextStep.kind === "module" && nextStep.slug === module.slug;
          return (
            <li key={module.slug}>
              <Link
                href={`/${locale}/creator-ops/${module.slug}/`}
                data-complete={complete || undefined}
                data-next={next || undefined}
                aria-label={`${label(labels, "module", "Module")} ${module.order}: ${module.title}${complete ? `, ${label(labels, "completed", "Completed")}` : ""}`}
              >
                <span>{String(module.order).padStart(2, "0")}</span>
                <strong>{complete ? "✓" : next ? "→" : ""}</strong>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function ModuleNavigator({
  locale,
  currentSlug,
  modules,
  labels,
}: {
  locale: string;
  currentSlug: CreatorOpsModuleSlug;
  modules: readonly CreatorOpsNavigationItem[];
  labels: Labels;
}) {
  const { record } = useCreatorOpsProgress();
  const railRef = useRef<HTMLDivElement>(null);
  const currentRef = useRef<HTMLAnchorElement>(null);
  const current = modules.find((module) => module.slug === currentSlug) ?? modules[0];

  useEffect(() => {
    const rail = railRef.current;
    const item = currentRef.current;
    if (!rail || !item) return;
    rail.scrollLeft = Math.max(
      0,
      item.offsetLeft - ((rail.clientWidth - item.offsetWidth) / 2),
    );
  }, [currentSlug]);

  return (
    <nav
      className={styles.moduleNavigator}
      aria-label={label(labels, "modules", "Modules")}
      data-testid="creator-ops-module-navigator"
    >
      <div className={styles.moduleNavigatorContext}>
        <Link href={`/${locale}/creator-ops/`}>
          ← {label(labels, "courseOverview", "Course overview")}
        </Link>
        <span>{label(labels, "module", "Module")} {current.order}/{modules.length}</span>
        <strong>{current.title}</strong>
      </div>
      <div className={styles.moduleRail} ref={railRef} data-testid="creator-ops-module-rail">
        {modules.map((candidate) => {
          const complete = isCreatorOpsModuleComplete(record, candidate.slug);
          const isCurrent = candidate.slug === currentSlug;
          return (
            <Link
              key={candidate.slug}
              ref={isCurrent ? currentRef : undefined}
              href={`/${locale}/creator-ops/${candidate.slug}/`}
              aria-current={isCurrent ? "page" : undefined}
              aria-label={`${label(labels, "module", "Module")} ${candidate.order}: ${candidate.title}${complete ? `, ${label(labels, "completed", "Completed")}` : ""}`}
              data-complete={complete || undefined}
            >
              <span>{String(candidate.order).padStart(2, "0")}</span>
              {complete ? <strong aria-hidden="true">✓</strong> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function PracticeWorkbench({
  slug,
  practice,
  labels,
}: {
  slug: CreatorOpsModuleSlug;
  practice: CreatorOpsPracticeCopy;
  labels: Labels;
}) {
  const { record: progress } = useCreatorOpsProgress();
  const evidenceKey = creatorOpsArtifactEvidenceKey(slug);
  const [draft, setDraft] = useState("");
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [exportStatus, setExportStatus] = useState("");
  const [exported, setExported] = useState(false);
  const { focusStatus, statusRef } = useActionStatusFocus();
  const meaningful = isMeaningfulCreatorOpsArtifactDraft(draft, practice.template);
  const draftChanged = draft.trim().length > 0;
  const saved = progress[evidenceKey] === true;
  const helpId = `${slug}-practice-help`;
  const draftId = `${slug}-artifact-draft`;
  const privacyId = `${slug}-artifact-privacy`;

  useEffect(() => {
    if (!draftChanged || exported) return;
    const warning = label(labels, "unsavedDraft", "Your private draft will be lost. Leave anyway?");
    const confirmLeave = () => window.confirm(warning);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const interceptNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || anchor.target === "_blank") return;
      if (!confirmLeave()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const navigation = (window as Window & { navigation?: NavigationLike }).navigation;
    const interceptTraversal: EventListener = (event) => {
      const navigationEvent = event as NavigateEventLike;
      if (navigationEvent.navigationType === "traverse" && !confirmLeave()) {
        event.preventDefault();
      }
    };
    const legacyCurrentHref = window.location.href;
    const legacyCurrentState = typeof window.history.state === "object" && window.history.state !== null
      ? window.history.state
      : {};
    const legacyGuardId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const legacySentinelState = {
      ...legacyCurrentState,
      __creatorOpsDraftGuard: legacyGuardId,
    };
    let legacySentinelPresent = false;
    let bypassLegacyTraversal = false;
    const armLegacySentinel = () => {
      window.history.pushState(legacySentinelState, "", legacyCurrentHref);
      legacySentinelPresent = true;
    };
    const interceptLegacyTraversal = (event: PopStateEvent) => {
      if (bypassLegacyTraversal || !legacySentinelPresent) return;
      legacySentinelPresent = false;
      if (!confirmLeave()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        armLegacySentinel();
        return;
      }
      bypassLegacyTraversal = true;
      window.setTimeout(() => window.history.back(), 0);
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", interceptNavigation, true);
    if (navigation) navigation.addEventListener("navigate", interceptTraversal);
    else {
      window.addEventListener("popstate", interceptLegacyTraversal);
      armLegacySentinel();
    }
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", interceptNavigation, true);
      if (navigation) navigation.removeEventListener("navigate", interceptTraversal);
      else {
        window.removeEventListener("popstate", interceptLegacyTraversal);
        if (
          legacySentinelPresent
          && window.location.href === legacyCurrentHref
          && window.history.state?.__creatorOpsDraftGuard === legacyGuardId
        ) {
          window.history.back();
        }
      }
    };
  }, [draftChanged, exported, labels]);

  return (
    <div className={styles.workbench}>
      <div className={styles.workbenchHeader}>
        <div>
          <p className={styles.sectionLabel}>{label(labels, "workbench", "Artifact workbench")}</p>
          <label htmlFor={draftId}>{practice.artifact}</label>
        </div>
        <span data-complete={saved || undefined}>
          {saved ? label(labels, "evidenceSaved", "Completion receipt recorded") : label(labels, "artifact", "Artifact")}
        </span>
      </div>
      <p className={styles.workbenchIntro} id={privacyId}>
        {label(labels, "workbenchHelp", "Draft from a blank workspace. The browser stores only a completion receipt, never your draft.")}
      </p>
      <textarea
        id={draftId}
        name={draftId}
        autoComplete="off"
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setPersisted(null);
          setExportStatus("");
          setExported(false);
        }}
        aria-describedby={`${privacyId} ${helpId}`}
        placeholder={label(labels, "draftPlaceholder", "Example: define the objective, evidence, owner, review gate, and stop rule…")}
        spellCheck
      />
      <details className={styles.templateReference}>
        <summary>{label(labels, "templateReference", "Reference template (not counted as your work)")}</summary>
        <pre>{practice.template}</pre>
      </details>
      <div className={styles.workbenchFooter}>
        <p id={helpId}>
          {!meaningful
            ? label(labels, "draftTooShort", "Add at least three substantive lines and 120 characters before saving evidence.")
            : !exported
              ? label(labels, "exportBeforeReceipt", "Copy or download the completed draft before recording the self-attestation.")
              : practice.reviewGate}
        </p>
        <div className={styles.workbenchActions}>
          <button
            type="button"
            disabled={!draftChanged}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(draft);
                setExported(true);
                setExportStatus(label(labels, "draftCopied", "Draft copied to the clipboard."));
              } catch {
                setExportStatus(label(labels, "copyFailed", "Clipboard access failed. Download the draft instead."));
              }
            }}
          >
            {label(labels, "copyDraft", "Copy draft")}
          </button>
          <button
            type="button"
            disabled={!draftChanged}
            onClick={() => {
              const url = URL.createObjectURL(new Blob([draft], { type: "text/markdown;charset=utf-8" }));
              const download = document.createElement("a");
              download.href = url;
              download.download = practice.downloadFilename;
              document.body.appendChild(download);
              download.click();
              download.remove();
              window.setTimeout(() => URL.revokeObjectURL(url), 0);
              setExported(true);
              setExportStatus(label(labels, "draftDownloaded", "Draft downloaded to your device."));
            }}
          >
            {label(labels, "downloadDraft", "Download draft")}
          </button>
          <button
            type="button"
            disabled={!meaningful || !exported || saved}
            onClick={() => {
              if (!meaningful) return;
              const result = updateCreatorOpsProgress((record) => {
                record[evidenceKey] = true;
                record[creatorOpsModuleProgressKey(slug)] = false;
              });
              setPersisted(result);
              focusStatus();
            }}
          >
            {saved ? label(labels, "evidenceSaved", "Completion receipt recorded") : label(labels, "saveEvidence", "Record completion receipt (draft is not saved)")}
          </button>
        </div>
      </div>
      <small
        ref={statusRef}
        className={styles.actionStatus}
        role="status"
        aria-live="polite"
        tabIndex={-1}
        data-testid="creator-ops-artifact-status"
      >
        {[exportStatus, persistenceMessage(labels, persisted)].filter(Boolean).join(" ")}
      </small>
      <small>{label(labels, "receiptBoundary", "This completion receipt is a local self-attestation, not an artifact-quality certification.")}</small>
    </div>
  );
}

export function ModuleCheckpoint({
  slug,
  checkpoint,
  labels,
}: {
  slug: CreatorOpsModuleSlug;
  checkpoint: CreatorOpsCheckpointCopy;
  labels: Labels;
}) {
  const { ready: progressReady, record: progress } = useCreatorOpsProgress();
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const passed = progress[creatorOpsCheckpointPassedKey(slug)] === true;
  const storedChoice = progress[creatorOpsCheckpointKey(slug)];
  const restoredChoice = progressReady
    && typeof storedChoice === "number"
    && storedChoice >= 0
    && storedChoice < checkpoint.options.length
    ? storedChoice
    : null;
  const selectedChoice = choice ?? restoredChoice;
  const correct = selectedChoice === checkpoint.correctIndex;

  return (
    <section
      id={`${slug}-checkpoint`}
      className={styles.checkpoint}
      aria-labelledby={`${slug}-checkpoint-title`}
      aria-busy={!progressReady}
    >
      <p className={styles.sectionLabel}>{label(labels, "checkpoint", "Knowledge check")}</p>
      <h2 id={`${slug}-checkpoint-title`}>{checkpoint.question}</h2>
      <fieldset>
        <legend className="sr-only">{checkpoint.question}</legend>
        {checkpoint.options.map((option, index) => (
          <label key={option} data-selected={selectedChoice === index || undefined}>
            <input
              type="radio"
              name={`${slug}-checkpoint`}
              value={index}
              checked={selectedChoice === index}
              onChange={() => {
                setChoice(index);
                setChecked(false);
                setPersisted(null);
              }}
            />
            <span aria-hidden="true">{String.fromCharCode(65 + index)}</span>
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
      {passed && !checked ? (
        <p className={styles.checkpointReceipt} role="status">
          {label(labels, "checkpointPassedEarlier", "Your earlier passing checkpoint remains recorded.")}
        </p>
      ) : null}
      <button
        type="button"
        disabled={selectedChoice === null}
        onClick={() => {
          if (selectedChoice === null) return;
          setChecked(true);
          const result = updateCreatorOpsProgress((record) => {
            record[creatorOpsCheckpointKey(slug)] = selectedChoice;
            if (correct) record[creatorOpsCheckpointPassedKey(slug)] = true;
          });
          setPersisted(result);
        }}
      >
        {label(labels, "checkAnswer", "Check answer")}
      </button>
      {checked ? (
        <div className={styles.feedback} data-correct={correct || undefined} role="status" aria-live="polite">
          <strong>{correct
            ? label(labels, "correct", "Correct")
            : label(labels, "tryAgain", "Reconsider the boundary")}</strong>
          <p>{checkpoint.explanation}</p>
          <small>
            {!correct && passed
              ? `${label(labels, "checkpointAlreadyPassed", "Your earlier passing receipt remains recorded; this attempt is incorrect.")} `
              : ""}
            {persistenceMessage(labels, persisted)}
          </small>
        </div>
      ) : null}
    </section>
  );
}

export function ModuleCompletion({
  slug,
  labels,
}: {
  slug: CreatorOpsModuleSlug;
  labels: Labels;
}) {
  const { ready: progressReady, record: progress } = useCreatorOpsProgress();
  const evidenceReady = progress[creatorOpsArtifactEvidenceKey(slug)] === true;
  const checkpointReady = progress[creatorOpsCheckpointPassedKey(slug)] === true;
  const complete = isCreatorOpsModuleComplete(progress, slug);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const { focusStatus, statusRef } = useActionStatusFocus();
  return (
    <section
      id={`${slug}-completion`}
      className={styles.completionPanel}
      data-complete={complete || undefined}
      aria-busy={!progressReady}
    >
      <div>
        <p className={styles.sectionLabel}>{complete
          ? label(labels, "completed", "Completed")
          : label(labels, "markComplete", "Mark module complete")}</p>
        <p>{complete
          ? label(labels, "moduleReceipt", "This module now counts toward Course 16 progress.")
          : !progressReady
            ? label(labels, "progressLoading", "Loading saved progress…")
            : evidenceReady && checkpointReady
            ? label(labels, "completionReady", "Both requirements are met. Record the module receipt when you are ready.")
            : label(labels, "completionNeeds", "Save the practice evidence and pass the checkpoint first.")}</p>
      </div>
      <button
        type="button"
        disabled={!progressReady || !evidenceReady || !checkpointReady || complete}
        onClick={() => {
          const result = updateCreatorOpsProgress((record) => {
            reconcileCreatorOpsModuleCompletion(record, slug);
          });
          setPersisted(result);
          focusStatus();
        }}
      >
        {complete ? label(labels, "completed", "Completed") : label(labels, "markComplete", "Mark module complete")}
      </button>
      <small
        ref={statusRef}
        className={styles.actionStatus}
        role="status"
        aria-live="polite"
        tabIndex={-1}
        data-testid="creator-ops-completion-status"
      >
        {persistenceMessage(labels, persisted)}
      </small>
    </section>
  );
}

export function FinalAssessment({
  assessment,
  labels,
  moduleLinks,
  locale,
}: {
  assessment: CreatorOpsCourseCopy["finalAssessment"];
  labels: Labels;
  moduleLinks: readonly CreatorOpsNavigationItem[];
  locale: string;
}) {
  const { record: progress } = useCreatorOpsProgress();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<ReturnType<typeof gradeCreatorOpsAssessment> | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [preservedPass, setPreservedPass] = useState(false);
  const best = typeof progress[CREATOR_OPS_QUIZ_BEST_KEY] === "number"
    ? progress[CREATOR_OPS_QUIZ_BEST_KEY] as number
    : 0;
  const answeredCount = Object.keys(answers).length;

  return (
    <section
      id="final-assessment"
      tabIndex={-1}
      className={styles.assessment}
      aria-labelledby="creator-ops-final-title"
      data-testid="creator-ops-assessment"
    >
      <header>
        <p className={styles.sectionLabel}>{label(labels, "finalAssessment", "Final assessment")}</p>
        <h2 id="creator-ops-final-title">{assessment.title}</h2>
        <p>{assessment.summary}</p>
        <span>{label(labels, "bestScore", "Best score")}: {best}%</span>
      </header>
      <ol className={styles.assessmentQuestions}>
        {assessment.questions.map((question, questionIndex) => {
          const selected = answers[question.id];
          const questionCorrect = selected === question.correctIndex;
          const moduleLink = moduleLinks[questionIndex];
          return (
            <li key={question.id} data-correct={result && questionCorrect || undefined}>
              <fieldset>
                <legend><span>{String(questionIndex + 1).padStart(2, "0")}</span>{question.question}</legend>
                {question.options.map((option, optionIndex) => (
                  <label
                    key={option}
                    data-selected={selected === optionIndex || undefined}
                    data-correct-answer={result && optionIndex === question.correctIndex || undefined}
                    data-incorrect-selection={result && selected === optionIndex && !questionCorrect || undefined}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={selected === optionIndex}
                      onChange={() => {
                        setAnswers((current) => ({ ...current, [question.id]: optionIndex }));
                        setResult(null);
                        setPreservedPass(false);
                        setPersisted(null);
                      }}
                    />
                    <span>{option}</span>
                    {result && optionIndex === question.correctIndex ? (
                      <strong className={styles.answerStatus} data-correct>
                        {label(labels, "correctAnswer", "Correct answer")}
                      </strong>
                    ) : result && selected === optionIndex ? (
                      <strong className={styles.answerStatus} data-incorrect>
                        {label(labels, "incorrectSelection", "Your answer · Incorrect")}
                      </strong>
                    ) : null}
                  </label>
                ))}
              </fieldset>
              {result ? (
                <div
                  className={styles.questionFeedback}
                  data-correct={questionCorrect || undefined}
                  data-testid="creator-ops-question-feedback"
                >
                  <strong>{questionCorrect
                    ? label(labels, "correct", "Correct")
                    : label(labels, "tryAgain", "Review this answer")}</strong>
                  <p>{question.explanation}</p>
                  {moduleLink ? (
                    <Link href={`/${locale}/creator-ops/${moduleLink.slug}/`}>
                      {label(labels, "reviewModule", "Review")} {question.moduleTitle} →
                    </Link>
                  ) : <span>{question.moduleTitle}</span>}
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
      <div className={styles.assessmentSubmit}>
        <p className={styles.assessmentProgress} aria-live="polite">
          {answeredCount}/{assessment.questions.length} {label(labels, "answered", "answered")}
        </p>
        <button
          type="button"
          disabled={answeredCount !== assessment.questions.length}
          onClick={() => {
            const graded = gradeCreatorOpsAssessment(assessment.questions, answers);
            setPreservedPass(
              !graded.passed && progress[CREATOR_OPS_QUIZ_PASSED_KEY] === true,
            );
            setResult(graded);
            setPersisted(updateCreatorOpsProgress((record) => {
              recordCreatorOpsAssessment(record, graded.percent);
            }));
          }}
        >
          {label(labels, "submitAssessment", "Grade assessment")}
        </button>
        {result ? (
          <div className={styles.assessmentResult} data-passed={result.passed || undefined} role="status" aria-live="polite">
            <strong>{result.correct}/{result.total} · {result.percent}%</strong>
            <span>{result.passed
              ? label(labels, "assessmentPassed", "You passed the operating-system review.")
              : preservedPass
                ? label(labels, "assessmentEarlierPass", "This attempt did not pass. Your earlier pass and best score remain valid.")
                : label(labels, "assessmentRetry", "Review the evidence and authority boundaries, then try again.")}</span>
            <small>{persistenceMessage(labels, persisted)}</small>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function CapstoneChecklist({
  capstone,
  labels,
}: {
  capstone: CreatorOpsCourseCopy["capstone"];
  labels: Labels;
}) {
  const { ready: progressReady, record: progress } = useCreatorOpsProgress();
  const stored = progress[CREATOR_OPS_CAPSTONE_CHECKS_KEY];
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const { focusStatus, statusRef } = useActionStatusFocus();
  const restoredChecks = Array.isArray(stored) && stored.length === capstone.artifacts.length
    ? stored.map((value) => value === true)
    : null;
  const checks = restoredChecks
    ?? Array.from({ length: capstone.artifacts.length }, () => false);

  const prerequisitesReady = hasCreatorOpsCapstonePrerequisites(progress);
  const complete = isCreatorOpsCapstoneComplete(progress);
  const ready = progressReady && prerequisitesReady && checks.every(Boolean) && !complete;
  return (
    <section
      id="capstone-checklist"
      className={styles.capstoneChecklist}
      aria-labelledby="creator-ops-capstone-checklist"
      aria-busy={!progressReady}
      data-complete={complete || undefined}
      data-testid="creator-ops-capstone"
    >
      <p className={styles.sectionLabel}>{label(labels, "capstone", "30-day simulation capstone")}</p>
      <h2 id="creator-ops-capstone-checklist">
        {label(labels, "capstoneChecklist", "Capstone evidence checklist")}
      </h2>
      <p>{capstone.summary}</p>
      {!progressReady ? (
        <p>{label(labels, "progressLoading", "Loading saved progress…")}</p>
      ) : !prerequisitesReady ? (
        <p>{label(labels, "capstonePrerequisite", "Complete all modules and pass the final assessment before recording the capstone milestone.")}</p>
      ) : null}
      <div className={styles.checkGrid}>
        {capstone.artifacts.map((artifact, index) => (
          <label key={artifact} data-checked={checks[index] || undefined}>
            <input
              type="checkbox"
              checked={checks[index]}
              disabled={complete || !progressReady}
              onChange={(event) => {
                const next = [...checks];
                next[index] = event.target.checked;
                setPersisted(updateCreatorOpsProgress((record) => {
                  record[CREATOR_OPS_CAPSTONE_CHECKS_KEY] = next;
                }));
              }}
            />
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{artifact}</strong>
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={!ready || complete}
        onClick={() => {
          setPersisted(updateCreatorOpsProgress((record) => {
            recordCreatorOpsCapstone(record, checks);
          }));
          focusStatus();
        }}
      >
        {complete
          ? label(labels, "capstoneComplete", "Capstone completion recorded")
          : label(labels, "markCapstone", "Record capstone completion")}
      </button>
      <p className={styles.capstoneStatement}>{capstone.completionStatement}</p>
      <small
        ref={statusRef}
        className={styles.actionStatus}
        role="status"
        aria-live="polite"
        tabIndex={-1}
        data-testid="creator-ops-capstone-status"
      >
        {persistenceMessage(labels, persisted)}
      </small>
    </section>
  );
}
