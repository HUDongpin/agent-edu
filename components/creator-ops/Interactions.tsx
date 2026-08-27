"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  CREATOR_OPS_CAPSTONE_CHECKS_KEY,
  CREATOR_OPS_PROGRESS_EVENT,
  CREATOR_OPS_PROGRESS_RESET_EVENT,
  CREATOR_OPS_QUIZ_BEST_KEY,
  creatorOpsArtifactEvidenceKey,
  creatorOpsCheckpointKey,
  creatorOpsCheckpointPassedKey,
  creatorOpsModuleProgressKey,
  creatorOpsProgressPercent,
  gradeCreatorOpsAssessment,
  hasCreatorOpsCapstonePrerequisites,
  isCreatorOpsModuleComplete,
  isMeaningfulCreatorOpsArtifactDraft,
  recordCreatorOpsAssessment,
  recordCreatorOpsCapstone,
  reconcileCreatorOpsModuleCompletion,
  type CreatorOpsCheckpointCopy,
  type CreatorOpsCourseCopy,
  type CreatorOpsModuleSlug,
  type CreatorOpsPracticeCopy,
} from "@/lib/creator-ops";
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

function label(labels: Labels, key: string, fallback: string): string {
  return labels[key]?.trim() || fallback;
}

const subscribeToNoopExternalStore = () => () => {};

function useCreatorOpsProgress() {
  const [record, setRecord] = useState<Record<string, unknown>>({});
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
  return record;
}

function persistenceMessage(labels: Labels, persisted: boolean | null): string {
  if (persisted === null) return "";
  return persisted
    ? label(labels, "savedLocally", "Progress is saved in this browser; artifact text is not stored.")
    : label(labels, "memoryOnly", "Private mode: this receipt lasts for the current tab only.");
}

export function CourseProgress({ labels }: { labels: Labels }) {
  const record = useCreatorOpsProgress();
  const percent = creatorOpsProgressPercent(record);
  const storageReady = useSyncExternalStore(
    subscribeToNoopExternalStore,
    isCreatorOpsStorageAvailable,
    () => false,
  );
  return (
    <section className={styles.progressPanel} aria-labelledby="creator-ops-progress-title">
      <div className={styles.progressHeader}>
        <div>
          <p className={styles.sectionLabel}>{label(labels, "progress", "Course progress")}</p>
          <h2 id="creator-ops-progress-title">{percent}%</h2>
        </div>
        <span>{storageReady !== false
          ? label(labels, "savedLocally", "Progress is saved in this browser; artifact text is not stored.")
          : label(labels, "memoryOnly", "Private mode: progress lasts for this tab only.")}</span>
      </div>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label={label(labels, "progress", "Course progress")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <div className={styles.milestoneLegend}>
        <span>10 {label(labels, "modules", "modules")}</span>
        <span>1 {label(labels, "finalAssessment", "final assessment")}</span>
        <span>1 {label(labels, "capstone", "capstone")}</span>
      </div>
    </section>
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
  const progress = useCreatorOpsProgress();
  const evidenceKey = creatorOpsArtifactEvidenceKey(slug);
  const [draft, setDraft] = useState("");
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [exportStatus, setExportStatus] = useState("");
  const [exported, setExported] = useState(false);
  const meaningful = isMeaningfulCreatorOpsArtifactDraft(draft, practice.template);
  const draftChanged = draft.trim().length > 0;
  const saved = progress[evidenceKey] === true;
  const helpId = `${slug}-practice-help`;

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
          <strong>{practice.artifact}</strong>
        </div>
        <span data-complete={saved || undefined}>
          {saved ? label(labels, "evidenceSaved", "Completion receipt recorded") : label(labels, "artifact", "Artifact")}
        </span>
      </div>
      <textarea
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
          setPersisted(null);
          setExportStatus("");
          setExported(false);
        }}
        aria-label={`${practice.artifact} ${label(labels, "workbench", "workbench")}`}
        aria-describedby={helpId}
        placeholder={label(labels, "draftPlaceholder", "Draft your artifact here, then copy or download it before leaving.")}
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
            }}
          >
            {saved ? label(labels, "evidenceSaved", "Completion receipt recorded") : label(labels, "saveEvidence", "Record completion receipt (draft is not saved)")}
          </button>
        </div>
      </div>
      <small role="status" aria-live="polite">
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
  const progress = useCreatorOpsProgress();
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const passed = progress[creatorOpsCheckpointPassedKey(slug)] === true;
  const correct = choice === checkpoint.correctIndex;

  return (
    <section className={styles.checkpoint} aria-labelledby={`${slug}-checkpoint-title`}>
      <p className={styles.sectionLabel}>{label(labels, "checkpoint", "Knowledge check")}</p>
      <h2 id={`${slug}-checkpoint-title`}>{checkpoint.question}</h2>
      <fieldset>
        <legend className="sr-only">{checkpoint.question}</legend>
        {checkpoint.options.map((option, index) => (
          <label key={option} data-selected={choice === index || undefined}>
            <input
              type="radio"
              name={`${slug}-checkpoint`}
              value={index}
              checked={choice === index}
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
      <button
        type="button"
        disabled={choice === null}
        onClick={() => {
          if (choice === null) return;
          setChecked(true);
          const result = updateCreatorOpsProgress((record) => {
            record[creatorOpsCheckpointKey(slug)] = choice;
            if (correct) record[creatorOpsCheckpointPassedKey(slug)] = true;
            record[creatorOpsModuleProgressKey(slug)] = false;
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
  const progress = useCreatorOpsProgress();
  const evidenceReady = progress[creatorOpsArtifactEvidenceKey(slug)] === true;
  const checkpointReady = progress[creatorOpsCheckpointPassedKey(slug)] === true;
  const complete = isCreatorOpsModuleComplete(progress, slug);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  return (
    <section className={styles.completionPanel} data-complete={complete || undefined}>
      <div>
        <p className={styles.sectionLabel}>{complete
          ? label(labels, "completed", "Completed")
          : label(labels, "markComplete", "Mark module complete")}</p>
        <p>{complete
          ? label(labels, "moduleReceipt", "This module now counts toward Course 16 progress.")
          : evidenceReady && checkpointReady
            ? label(labels, "completionReady", "Both requirements are met. Record the module receipt when you are ready.")
            : label(labels, "completionNeeds", "Save the practice evidence and pass the checkpoint first.")}</p>
      </div>
      <button
        type="button"
        disabled={!evidenceReady || !checkpointReady || complete}
        onClick={() => {
          const result = updateCreatorOpsProgress((record) => {
            reconcileCreatorOpsModuleCompletion(record, slug);
          });
          setPersisted(result);
        }}
      >
        {complete ? label(labels, "completed", "Completed") : label(labels, "markComplete", "Mark module complete")}
      </button>
      <small role="status" aria-live="polite">{persistenceMessage(labels, persisted)}</small>
    </section>
  );
}

export function FinalAssessment({
  assessment,
  labels,
}: {
  assessment: CreatorOpsCourseCopy["finalAssessment"];
  labels: Labels;
}) {
  const progress = useCreatorOpsProgress();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<ReturnType<typeof gradeCreatorOpsAssessment> | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const best = typeof progress[CREATOR_OPS_QUIZ_BEST_KEY] === "number"
    ? progress[CREATOR_OPS_QUIZ_BEST_KEY] as number
    : 0;

  return (
    <section className={styles.assessment} aria-labelledby="creator-ops-final-title">
      <header>
        <p className={styles.sectionLabel}>{label(labels, "finalAssessment", "Final assessment")}</p>
        <h2 id="creator-ops-final-title">{assessment.title}</h2>
        <p>{assessment.summary}</p>
        <span>{label(labels, "bestScore", "Best score")}: {best}%</span>
      </header>
      <ol className={styles.assessmentQuestions}>
        {assessment.questions.map((question, questionIndex) => (
          <li key={question.id}>
            <fieldset>
              <legend><span>{String(questionIndex + 1).padStart(2, "0")}</span>{question.question}</legend>
              {question.options.map((option, optionIndex) => (
                <label key={option} data-selected={answers[question.id] === optionIndex || undefined}>
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === optionIndex}
                    onChange={() => {
                      setAnswers((current) => ({ ...current, [question.id]: optionIndex }));
                      setResult(null);
                      setPersisted(null);
                    }}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </fieldset>
          </li>
        ))}
      </ol>
      <div className={styles.assessmentSubmit}>
        <button
          type="button"
          disabled={Object.keys(answers).length !== assessment.questions.length}
          onClick={() => {
            const graded = gradeCreatorOpsAssessment(assessment.questions, answers);
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
  const progress = useCreatorOpsProgress();
  const stored = progress[CREATOR_OPS_CAPSTONE_CHECKS_KEY];
  const [draftChecks, setDraftChecks] = useState<boolean[] | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const restoredChecks = Array.isArray(stored) && stored.length === capstone.artifacts.length
    ? stored.map((value) => value === true)
    : null;
  const checks = draftChecks
    ?? restoredChecks
    ?? Array.from({ length: capstone.artifacts.length }, () => false);

  const prerequisitesReady = hasCreatorOpsCapstonePrerequisites(progress);
  const ready = prerequisitesReady && checks.every(Boolean);
  return (
    <section className={styles.capstoneChecklist} aria-labelledby="creator-ops-capstone-checklist">
      <p className={styles.sectionLabel}>{label(labels, "capstone", "30-day simulation capstone")}</p>
      <h2 id="creator-ops-capstone-checklist">
        {label(labels, "capstoneChecklist", "Capstone evidence checklist")}
      </h2>
      <p>{capstone.summary}</p>
      {!prerequisitesReady ? (
        <p>{label(labels, "capstonePrerequisite", "Complete all modules and pass the final assessment before recording the capstone milestone.")}</p>
      ) : null}
      <div className={styles.checkGrid}>
        {capstone.artifacts.map((artifact, index) => (
          <label key={artifact} data-checked={checks[index] || undefined}>
            <input
              type="checkbox"
              checked={checks[index]}
              onChange={(event) => {
                const next = [...checks];
                next[index] = event.target.checked;
                setDraftChecks(next);
                setPersisted(null);
              }}
            />
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{artifact}</strong>
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={!ready}
        onClick={() => {
          setPersisted(updateCreatorOpsProgress((record) => {
            recordCreatorOpsCapstone(record, checks);
          }));
        }}
      >
        {label(labels, "markCapstone", "Record capstone completion")}
      </button>
      <p className={styles.capstoneStatement}>{capstone.completionStatement}</p>
      <small role="status" aria-live="polite">{persistenceMessage(labels, persisted)}</small>
    </section>
  );
}
