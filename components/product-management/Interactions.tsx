"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  PRODUCT_MANAGEMENT_CAPSTONE_KEY,
  PRODUCT_MANAGEMENT_PROGRESS_EVENT,
  PRODUCT_MANAGEMENT_PROGRESS_MILESTONES,
  PRODUCT_MANAGEMENT_PROGRESS_PREFIX,
  PRODUCT_MANAGEMENT_PROGRESS_RESET_EVENT,
  PRODUCT_MANAGEMENT_PROGRESS_VERSION_KEY,
  PRODUCT_MANAGEMENT_QUIZ_BEST_KEY,
  PRODUCT_MANAGEMENT_QUIZ_PASSED_KEY,
  isCurrentProductManagementProgress,
  productManagementCheckpointKey,
  productManagementModuleProgressKey,
  type ProductManagementCheckpointCopy,
  type ProductManagementCourseCopy,
  type ProductManagementFinalQuestionCopy,
  type ProductManagementModuleSlug,
  type ProductManagementPracticeCopy,
} from "@/lib/product-management";
import {
  isProductManagementStorageAvailable,
  readProductManagementProgress,
  resetProductManagementProgress,
  updateProductManagementProgress,
  type ProductManagementProgressRecord,
} from "./progress-store";
import styles from "./ProductManagementCourse.module.css";

type Labels = ProductManagementCourseCopy["ui"];

const CAPSTONE_ITEM_PREFIX = "product-management.capstone.item.";
const CAPSTONE_ATTESTED_KEY = "product-management.capstone.attested";
const ARTIFACT_PREFIX = "product-management.artifact.";
const RICE_KEY = "product-management.calculator.rice";

function label(labels: Labels, key: string, fallback: string): string {
  const value = labels[key];
  return value && value.trim() ? value : fallback;
}

function interpolate(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function subscribe(notify: () => void): () => void {
  window.addEventListener(PRODUCT_MANAGEMENT_PROGRESS_EVENT, notify);
  window.addEventListener("storage", notify);
  window.addEventListener("focus", notify);
  return () => {
    window.removeEventListener(PRODUCT_MANAGEMENT_PROGRESS_EVENT, notify);
    window.removeEventListener("storage", notify);
    window.removeEventListener("focus", notify);
  };
}

function progressSnapshot(): string {
  return JSON.stringify(readProductManagementProgress());
}

function useProductManagementProgress(): {
  progress: ProductManagementProgressRecord;
  storageAvailable: boolean;
} {
  const serialized = useSyncExternalStore(subscribe, progressSnapshot, () => "{}");
  const storageAvailable = useSyncExternalStore(
    subscribe,
    isProductManagementStorageAvailable,
    () => true,
  );
  let progress: ProductManagementProgressRecord = {};

  try {
    const parsed: unknown = JSON.parse(serialized);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const candidate = parsed as ProductManagementProgressRecord;
      progress = isCurrentProductManagementProgress(candidate)
        ? candidate
        : Object.fromEntries(
            Object.entries(candidate).filter(
              ([key]) => !key.startsWith(PRODUCT_MANAGEMENT_PROGRESS_PREFIX),
            ),
          );
    }
  } catch {
    progress = {};
  }

  return { progress, storageAvailable };
}

function StorageWarning({ labels }: { labels: Labels }) {
  return (
    <p className={styles.storageWarning} role="status">
      {label(
        labels,
        "storageUnavailable",
        "Browser storage is unavailable. Progress will last only for this tab.",
      )}
    </p>
  );
}

export function CourseProgress({
  modules,
  labels,
  startLabel,
  resumeLabel,
}: {
  modules: readonly {
    slug: ProductManagementModuleSlug;
    href: string;
    title: string;
  }[];
  labels: Labels;
  startLabel: string;
  resumeLabel: string;
}) {
  const { progress, storageAvailable } = useProductManagementProgress();
  const [resetMessage, setResetMessage] = useState("");
  const resetStatusRef = useRef<HTMLParagraphElement>(null);

  const state = useMemo(() => {
    const completedModules = modules.filter(
      (module) => progress[productManagementModuleProgressKey(module.slug)] === true,
    ).length;
    const assessmentPassed = progress[PRODUCT_MANAGEMENT_QUIZ_PASSED_KEY] === true;
    const capstoneComplete = progress[PRODUCT_MANAGEMENT_CAPSTONE_KEY] === true;
    const completedMilestones = completedModules
      + Number(assessmentPassed)
      + Number(capstoneComplete);
    const nextModule = modules.find(
      (module) => progress[productManagementModuleProgressKey(module.slug)] !== true,
    );
    const nextHref = nextModule?.href
      ?? (!assessmentPassed
        ? "#product-management-final-assessment"
        : !capstoneComplete
          ? "#product-management-capstone"
          : null);

    return {
      assessmentPassed,
      capstoneComplete,
      completedMilestones,
      completedModules,
      nextHref,
      nextTitle: nextModule?.title,
      percent: Math.round(
        (completedMilestones / PRODUCT_MANAGEMENT_PROGRESS_MILESTONES) * 100,
      ),
    };
  }, [modules, progress]);

  const hasProgress = Object.keys(progress).some(
    (key) => key.startsWith(PRODUCT_MANAGEMENT_PROGRESS_PREFIX)
      && key !== PRODUCT_MANAGEMENT_PROGRESS_VERSION_KEY,
  );

  useEffect(() => {
    if (resetMessage) resetStatusRef.current?.focus();
  }, [resetMessage]);

  return (
    <section
      className={styles.progressPanel}
      aria-labelledby="product-management-progress-title"
    >
      <header className={styles.progressHeader}>
        <div>
          <p className={styles.sectionLabel}>
            {label(labels, "progressLedger", "Learning ledger")}
          </p>
          <h2 id="product-management-progress-title">
            {label(labels, "courseProgress", "Your course record")}
          </h2>
          <p>
            {label(
              labels,
              "browserStorageNote",
              "Saved locally in this browser. No account or upload is required.",
            )}
          </p>
        </div>
        <output className={styles.progressValue} aria-live="polite">
          <strong>{state.percent}%</strong>
          <span>
            {interpolate(
              label(labels, "progressPosition", "{complete} of {total} milestones"),
              {
                complete: state.completedMilestones,
                total: PRODUCT_MANAGEMENT_PROGRESS_MILESTONES,
              },
            )}
          </span>
        </output>
      </header>

      {!storageAvailable ? <StorageWarning labels={labels} /> : null}

      <progress
        className={styles.progressBar}
        max={PRODUCT_MANAGEMENT_PROGRESS_MILESTONES}
        value={state.completedMilestones}
        aria-labelledby="product-management-progress-title"
      >
        {state.percent}%
      </progress>

      <dl className={styles.progressMilestones}>
        <div>
          <dt>{label(labels, "modules", "Modules")}</dt>
          <dd>{state.completedModules} / {modules.length}</dd>
        </div>
        <div>
          <dt>{label(labels, "finalAssessment", "Assessment")}</dt>
          <dd>
            {state.assessmentPassed
              ? label(labels, "complete", "Complete")
              : label(labels, "pending", "Pending")}
          </dd>
        </div>
        <div>
          <dt>{label(labels, "capstone", "Capstone")}</dt>
          <dd>
            {state.capstoneComplete
              ? label(labels, "complete", "Complete")
              : label(labels, "pending", "Pending")}
          </dd>
        </div>
      </dl>

      <div className={styles.actionRow}>
        {state.nextHref ? (
          <Link className={styles.primaryButton} href={state.nextHref}>
            {hasProgress ? resumeLabel : startLabel}
            <span aria-hidden="true">→</span>
          </Link>
        ) : (
          <p className={styles.completionNote} role="status">
            {label(labels, "courseComplete", "Course record complete")}
          </p>
        )}
        <button
          className={styles.secondaryButton}
          type="button"
          disabled={!hasProgress}
          onClick={() => {
            if (!window.confirm(label(
              labels,
              "resetConfirm",
              "Reset module progress, assessment results, artifacts, and capstone work?",
            ))) return;
            const persisted = resetProductManagementProgress();
            setResetMessage(persisted
              ? label(labels, "resetDone", "Course progress reset.")
              : label(
                  labels,
                  "resetDoneMemory",
                  "Session progress reset. Browser storage remains unavailable.",
                ));
          }}
        >
          {label(labels, "resetProgress", "Reset course")}
        </button>
      </div>

      {state.nextTitle ? (
        <p className={styles.nextUp}>
          <strong>{label(labels, "nextUp", "Next")}</strong>
          <span>{state.nextTitle}</span>
        </p>
      ) : null}

      <p
        className={resetMessage ? styles.resetStatus : styles.srOnly}
        ref={resetStatusRef}
        role="status"
        tabIndex={-1}
      >
        {resetMessage}
      </p>
    </section>
  );
}

export function ModuleCompletion({
  slug,
  labels,
}: {
  slug: ProductManagementModuleSlug;
  labels: Labels;
}) {
  const { progress, storageAvailable } = useProductManagementProgress();
  const key = productManagementModuleProgressKey(slug);
  const complete = progress[key] === true;
  const checkpointComplete = progress[productManagementCheckpointKey(slug)] === true;
  const savedArtifact = progress[artifactKey(slug)];
  const artifactComplete = typeof savedArtifact === "string"
    && savedArtifact.trim().length > 0;
  const readyToComplete = checkpointComplete && artifactComplete;
  const [announcement, setAnnouncement] = useState("");
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (announcement) statusRef.current?.focus();
  }, [announcement]);

  return (
    <section className={styles.moduleCompletion} aria-labelledby={`completion-${slug}`}>
      <div>
        <p className={styles.sectionLabel}>
          {label(labels, "moduleRecord", "Module record")}
        </p>
        <h2 id={`completion-${slug}`}>
          {complete
            ? label(labels, "moduleComplete", "Module complete")
            : label(labels, "moduleIncomplete", "Ready to close this module?")}
        </h2>
        <p>
          {label(
            labels,
            "completionInstruction",
            "Pass the checkpoint and save a non-empty practice artifact to unlock completion.",
          )}
        </p>
        <ul className={styles.completionRequirements} aria-label="Completion requirements">
          <li data-complete={checkpointComplete || undefined}>
            <span aria-hidden="true">{checkpointComplete ? "✓" : "○"}</span>
            {checkpointComplete
              ? label(labels, "checkpointRequirement", "Checkpoint passed")
              : label(labels, "checkpointPending", "Checkpoint not yet passed")}
          </li>
          <li data-complete={artifactComplete || undefined}>
            <span aria-hidden="true">{artifactComplete ? "✓" : "○"}</span>
            {artifactComplete
              ? label(labels, "artifactRequirement", "Non-empty artifact saved")
              : label(labels, "artifactPending", "Non-empty artifact not yet saved")}
          </li>
        </ul>
        {!storageAvailable ? <StorageWarning labels={labels} /> : null}
      </div>
      <button
        className={complete ? styles.completeButton : styles.primaryButton}
        type="button"
        disabled={complete || !readyToComplete}
        onClick={() => {
          if (complete || !readyToComplete) return;
          updateProductManagementProgress((record) => {
            record[key] = true;
          });
          setAnnouncement(label(labels, "moduleComplete", "Module complete"));
        }}
      >
        {complete
          ? label(labels, "markedModuleComplete", "Recorded as complete")
          : label(labels, "markModuleComplete", "Mark module complete")}
      </button>
      <p
        className={styles.srOnly}
        ref={statusRef}
        role="status"
        tabIndex={-1}
      >
        {announcement}
      </p>
    </section>
  );
}

export function ModuleCheckpoint({
  slug,
  checkpoint,
  labels,
}: {
  slug: ProductManagementModuleSlug;
  checkpoint: ProductManagementCheckpointCopy;
  labels: Labels;
}) {
  const { progress } = useProductManagementProgress();
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const firstOptionRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const retrying = useRef(false);
  const correct = selected === checkpoint.correctIndex;
  const recorded = progress[productManagementCheckpointKey(slug)] === true;
  const titleId = `product-management-checkpoint-${slug}`;

  useEffect(() => {
    if (checked) feedbackRef.current?.focus();
    else if (retrying.current) {
      retrying.current = false;
      firstOptionRef.current?.focus();
    }
  }, [checked]);

  return (
    <section className={styles.checkpoint} aria-labelledby={titleId}>
      <p className={styles.sectionLabel}>
        {label(labels, "checkpoint", "Decision checkpoint")}
      </p>
      <h2 id={titleId}>{checkpoint.question}</h2>
      {recorded ? (
        <p className={styles.savedFlag} role="status">
          {label(labels, "checkpointRecorded", "Correct answer recorded")}
        </p>
      ) : null}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (selected === null) return;
          setChecked(true);
          if (selected === checkpoint.correctIndex) {
            updateProductManagementProgress((record) => {
              record[productManagementCheckpointKey(slug)] = true;
            });
          }
        }}
      >
        <fieldset>
          <legend className={styles.srOnly}>{checkpoint.question}</legend>
          <div className={styles.optionList}>
            {checkpoint.options.map((option, index) => {
              const className = checked && index === checkpoint.correctIndex
                ? styles.correctOption
                : checked && index === selected
                  ? styles.incorrectOption
                  : styles.option;
              return (
                <label className={className} key={`${index}-${option}`}>
                  <input
                    ref={index === 0 ? firstOptionRef : undefined}
                    type="radio"
                    name={`${titleId}-answer`}
                    value={index}
                    checked={selected === index}
                    disabled={checked}
                    onChange={() => setSelected(index)}
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {!checked ? (
          <button
            className={styles.primaryButton}
            type="submit"
            disabled={selected === null}
          >
            {label(labels, "checkAnswer", "Check decision")}
          </button>
        ) : (
          <div
            className={correct ? styles.correctFeedback : styles.incorrectFeedback}
            ref={feedbackRef}
            role="status"
            tabIndex={-1}
          >
            <strong>
              {correct
                ? label(labels, "correct", "Sound judgment")
                : label(labels, "incorrect", "Reconsider the evidence")}
            </strong>
            <p>{checkpoint.explanation}</p>
            {!correct ? (
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => {
                  retrying.current = true;
                  setSelected(null);
                  setChecked(false);
                }}
              >
                {label(labels, "retryCheckpoint", "Try again")}
              </button>
            ) : null}
          </div>
        )}
      </form>
    </section>
  );
}

function artifactKey(slug: ProductManagementModuleSlug): string {
  return `${ARTIFACT_PREFIX}${slug}.draft`;
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Copy command failed");
}

export function ArtifactWorkbench({
  slug,
  practice,
  labels,
}: {
  slug: ProductManagementModuleSlug;
  practice: ProductManagementPracticeCopy;
  labels: Labels;
}) {
  const { progress, storageAvailable } = useProductManagementProgress();
  const key = artifactKey(slug);
  const storedDraft = typeof progress[key] === "string" ? progress[key] as string : null;
  const [draft, setDraft] = useState(practice.template);
  const [status, setStatus] = useState("");
  const lastStored = useRef<string | null | undefined>(undefined);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (lastStored.current === storedDraft) return;
    lastStored.current = storedDraft;
    setDraft(storedDraft ?? practice.template);
  }, [practice.template, storedDraft]);

  useEffect(() => {
    if (status) statusRef.current?.focus();
  }, [status]);

  function announce(message: string): void {
    setStatus("");
    window.setTimeout(() => setStatus(message), 0);
  }

  return (
    <section className={styles.artifactWorkbench} aria-labelledby={`artifact-${slug}-title`}>
      <header>
        <div>
          <p className={styles.sectionLabel}>
            {label(labels, "artifactWorkbench", "Decision notebook")}
          </p>
          <h3 id={`artifact-${slug}-title`}>{practice.artifact}</h3>
        </div>
        <span className={storedDraft === null ? styles.unsavedState : styles.savedState}>
          {storedDraft === null
            ? label(labels, "templateState", "Template")
            : label(labels, "savedLocally", "Saved locally")}
        </span>
      </header>

      <label className={styles.editorLabel} htmlFor={`artifact-${slug}-editor`}>
        {label(labels, "artifactDraft", "Working draft")}
      </label>
      <textarea
        id={`artifact-${slug}-editor`}
        className={styles.artifactEditor}
        value={draft}
        spellCheck="true"
        onChange={(event) => setDraft(event.target.value)}
      />
      <p className={styles.editorHint}>
        {label(
          labels,
          "artifactStorageNote",
          "Save stores this draft only in your browser. Copy or download it before switching devices.",
        )}
      </p>
      {!storageAvailable ? <StorageWarning labels={labels} /> : null}

      <div className={styles.artifactActions}>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={() => {
            const emptyDraft = draft.trim().length === 0;
            const persisted = updateProductManagementProgress((record) => {
              if (emptyDraft) {
                delete record[key];
                delete record[productManagementModuleProgressKey(slug)];
              } else {
                record[key] = draft;
              }
            });
            if (emptyDraft) {
              announce(label(
                labels,
                "emptyArtifactRemoved",
                "Empty draft was not saved. The module is open again.",
              ));
            } else {
              announce(persisted
                ? label(labels, "artifactSaved", "Draft saved in this browser.")
                : label(labels, "artifactSavedMemory", "Draft saved for this tab."));
            }
          }}
        >
          {label(labels, "saveArtifact", "Save draft")}
        </button>
        <button
          className={styles.secondaryButton}
          type="button"
          onClick={async () => {
            try {
              await copyText(draft);
              announce(label(labels, "artifactCopied", "Draft copied."));
            } catch {
              announce(label(labels, "artifactCopyFailed", "Copy failed. Select the text manually."));
            }
          }}
        >
          {label(labels, "copyTemplate", "Copy")}
        </button>
        <button
          className={styles.secondaryButton}
          type="button"
          onClick={() => {
            const blob = new Blob([draft], { type: "text/markdown;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `${slug}-artifact.md`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
            announce(label(labels, "artifactDownloaded", "Markdown file downloaded."));
          }}
        >
          {label(labels, "downloadTemplate", "Download .md")}
        </button>
        <button
          className={styles.textButton}
          type="button"
          onClick={() => {
            if (!window.confirm(label(
              labels,
              "restoreTemplateConfirm",
              "Replace this draft with the original template?",
            ))) return;
            updateProductManagementProgress((record) => {
              delete record[key];
              delete record[productManagementModuleProgressKey(slug)];
            });
            setDraft(practice.template);
            announce(label(labels, "templateRestored", "Original template restored."));
          }}
        >
          {label(labels, "restoreTemplate", "Restore template")}
        </button>
      </div>

      <p
        className={status ? styles.artifactStatus : styles.srOnly}
        ref={statusRef}
        role="status"
        tabIndex={-1}
      >
        {status}
      </p>
    </section>
  );
}

export type ProductManagementAssessmentQuestion = ProductManagementFinalQuestionCopy;

export function FinalAssessment({
  questions,
  passPercent,
  title,
  summary,
  labels,
}: {
  questions: readonly ProductManagementAssessmentQuestion[];
  passPercent: number;
  title: string;
  summary: string;
  labels: Labels;
}) {
  const { progress, storageAvailable } = useProductManagementProgress();
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<{
    correct: number;
    percent: number;
    passed: boolean;
  } | null>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const current = questions[index];
  const correct = current ? selected === current.correctIndex : false;
  const savedBest = typeof progress[PRODUCT_MANAGEMENT_QUIZ_BEST_KEY] === "number"
    ? progress[PRODUCT_MANAGEMENT_QUIZ_BEST_KEY] as number
    : 0;
  const best = Math.max(savedBest, result?.percent ?? 0);
  const alreadyPassed = progress[PRODUCT_MANAGEMENT_QUIZ_PASSED_KEY] === true;

  useEffect(() => {
    function resetAttempt() {
      setActive(false);
      setIndex(0);
      setSelected(null);
      setChecked(false);
      setAnswers({});
      setResult(null);
    }
    window.addEventListener(PRODUCT_MANAGEMENT_PROGRESS_RESET_EVENT, resetAttempt);
    return () => window.removeEventListener(PRODUCT_MANAGEMENT_PROGRESS_RESET_EVENT, resetAttempt);
  }, []);

  useEffect(() => {
    if (!active) return;
    if (result) resultRef.current?.focus();
    else if (checked) feedbackRef.current?.focus();
    else questionRef.current?.focus();
  }, [active, checked, index, result]);

  function begin(): void {
    setActive(true);
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setAnswers({});
    setResult(null);
  }

  function advance(): void {
    if (!current || selected === null) return;
    const nextAnswers = { ...answers, [current.id]: correct };
    if (index < questions.length - 1) {
      setAnswers(nextAnswers);
      setIndex((value) => value + 1);
      setSelected(null);
      setChecked(false);
      return;
    }

    const correctCount = Object.values(nextAnswers).filter(Boolean).length;
    const percent = questions.length
      ? Math.round((correctCount / questions.length) * 100)
      : 0;
    const passed = percent >= passPercent;
    setAnswers(nextAnswers);
    setResult({ correct: correctCount, percent, passed });
    updateProductManagementProgress((record) => {
      const priorBest = typeof record[PRODUCT_MANAGEMENT_QUIZ_BEST_KEY] === "number"
        ? record[PRODUCT_MANAGEMENT_QUIZ_BEST_KEY] as number
        : 0;
      record[PRODUCT_MANAGEMENT_QUIZ_BEST_KEY] = Math.max(priorBest, percent);
      if (passed) record[PRODUCT_MANAGEMENT_QUIZ_PASSED_KEY] = true;
    });
  }

  if (!questions.length) return null;

  return (
    <section
      className={styles.finalAssessment}
      id="product-management-final-assessment"
      aria-labelledby="product-management-final-assessment-title"
      tabIndex={-1}
    >
      <header className={styles.assessmentHeader}>
        <div>
          <p className={styles.sectionLabel}>
            {label(labels, "finalAssessment", "Final assessment")}
          </p>
          <h2 id="product-management-final-assessment-title">{title}</h2>
          <p>{summary}</p>
        </div>
        <div className={styles.passRule}>
          <strong>{passPercent}%</strong>
          <span>{label(labels, "passRule", "required to pass")}</span>
        </div>
      </header>

      {!storageAvailable ? <StorageWarning labels={labels} /> : null}
      {alreadyPassed ? (
        <p className={styles.savedFlag} role="status">
          {label(labels, "assessmentRecorded", "Passing result recorded")}
        </p>
      ) : null}

      {!active ? (
        <div className={styles.assessmentStart}>
          <button className={styles.primaryButton} type="button" onClick={begin}>
            {label(labels, "startAssessment", "Start assessment")}
          </button>
          <span>
            {interpolate(
              label(labels, "bestScorePosition", "Best score: {best}%"),
              { best },
            )}
          </span>
        </div>
      ) : result ? (
        <div
          className={result.passed ? styles.correctFeedback : styles.incorrectFeedback}
          ref={resultRef}
          role="status"
          tabIndex={-1}
        >
          <strong>
            {result.passed
              ? label(labels, "assessmentPassed", "Assessment passed")
              : label(labels, "assessmentNotPassed", "Assessment not yet passed")}
          </strong>
          <p>
            {interpolate(
              label(
                labels,
                "scorePosition",
                "{correct} of {total} correct. Score: {percent}%. Best: {best}%.",
              ),
              {
                best,
                correct: result.correct,
                percent: result.percent,
                total: questions.length,
              },
            )}
          </p>
          <button className={styles.secondaryButton} type="button" onClick={begin}>
            {label(labels, "retryAssessment", "Try another attempt")}
          </button>
        </div>
      ) : current ? (
        <div className={styles.assessmentQuestion}>
          <p className={styles.questionPosition}>
            {interpolate(
              label(
                labels,
                "questionPosition",
                "Question {current} of {total}. From {moduleTitle}.",
              ),
              {
                current: index + 1,
                moduleTitle: current.moduleTitle,
                total: questions.length,
              },
            )}
          </p>
          <h3 ref={questionRef} tabIndex={-1}>{current.question}</h3>
          <fieldset>
            <legend className={styles.srOnly}>{current.question}</legend>
            <div className={styles.optionList}>
              {current.options.map((option, optionIndex) => {
                const className = checked && optionIndex === current.correctIndex
                  ? styles.correctOption
                  : checked && optionIndex === selected
                    ? styles.incorrectOption
                    : styles.option;
                return (
                  <label className={className} key={`${optionIndex}-${option}`}>
                    <input
                      type="radio"
                      name={`assessment-${current.id}`}
                      value={optionIndex}
                      checked={selected === optionIndex}
                      disabled={checked}
                      onChange={() => setSelected(optionIndex)}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {!checked ? (
            <button
              className={styles.primaryButton}
              type="button"
              disabled={selected === null}
              onClick={() => setChecked(true)}
            >
              {label(labels, "checkAnswer", "Check decision")}
            </button>
          ) : (
            <div
              className={correct ? styles.correctFeedback : styles.incorrectFeedback}
              ref={feedbackRef}
              role="status"
              tabIndex={-1}
            >
              <strong>
                {correct
                  ? label(labels, "correct", "Sound judgment")
                  : label(labels, "incorrect", "Reconsider the evidence")}
              </strong>
              <p>{current.explanation}</p>
              <button className={styles.primaryButton} type="button" onClick={advance}>
                {index === questions.length - 1
                  ? label(labels, "finishAssessment", "Finish assessment")
                  : label(labels, "nextQuestion", "Next question")}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

export function CapstoneChecklist({
  artifacts,
  statement,
  labels,
}: {
  artifacts: readonly string[];
  statement: string;
  labels: Labels;
}) {
  const { progress, storageAvailable } = useProductManagementProgress();
  const alreadyComplete = progress[PRODUCT_MANAGEMENT_CAPSTONE_KEY] === true;
  const checked = artifacts.map(
    (_, index) => progress[`${CAPSTONE_ITEM_PREFIX}${index}`] === true,
  );
  const attested = progress[CAPSTONE_ATTESTED_KEY] === true;
  const allReady = checked.every(Boolean) && attested;

  return (
    <section
      className={styles.capstoneChecklist}
      id="product-management-capstone"
      aria-labelledby="product-management-capstone-checklist-title"
      tabIndex={-1}
    >
      <header>
        <p className={styles.sectionLabel}>
          {label(labels, "capstoneChecklist", "Release review")}
        </p>
        <h3 id="product-management-capstone-checklist-title">
          {label(labels, "capstoneArtifacts", "Capstone evidence checklist")}
        </h3>
        <p>
          {label(
            labels,
            "capstoneInstructions",
            "Check an item only when the artifact exists and another person could review the underlying evidence.",
          )}
        </p>
      </header>

      {!storageAvailable ? <StorageWarning labels={labels} /> : null}

      <div className={styles.capstoneItems}>
        {artifacts.map((artifact, index) => (
          <label className={styles.capstoneItem} key={artifact}>
            <input
              type="checkbox"
              checked={checked[index]}
              disabled={alreadyComplete}
              onChange={(event) => {
                updateProductManagementProgress((record) => {
                  record[`${CAPSTONE_ITEM_PREFIX}${index}`] = event.target.checked;
                });
              }}
            />
            <span className={styles.capstoneItemNumber}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{artifact}</span>
          </label>
        ))}
      </div>

      <label className={styles.attestation}>
        <input
          type="checkbox"
          checked={attested}
          disabled={alreadyComplete}
          onChange={(event) => {
            updateProductManagementProgress((record) => {
              record[CAPSTONE_ATTESTED_KEY] = event.target.checked;
            });
          }}
        />
        <span>{statement}</span>
      </label>

      <div className={styles.actionRow}>
        <button
          className={alreadyComplete ? styles.completeButton : styles.primaryButton}
          type="button"
          disabled={!allReady || alreadyComplete}
          onClick={() => {
            updateProductManagementProgress((record) => {
              record[PRODUCT_MANAGEMENT_CAPSTONE_KEY] = true;
            });
          }}
        >
          {alreadyComplete
            ? label(labels, "capstoneComplete", "Capstone recorded")
            : label(labels, "markCapstoneComplete", "Record capstone review")}
        </button>
        <span className={styles.checklistCount} aria-live="polite">
          {checked.filter(Boolean).length} / {artifacts.length}
        </span>
      </div>

      {alreadyComplete ? (
        <p className={styles.correctFeedback} role="status">
          <strong>{label(labels, "capstoneComplete", "Capstone recorded")}</strong>
        </p>
      ) : null}
    </section>
  );
}

type RiceValues = {
  reach: string;
  impact: string;
  confidence: string;
  effort: string;
};

const EMPTY_RICE: RiceValues = {
  reach: "",
  impact: "",
  confidence: "",
  effort: "",
};

function isRiceValues(value: unknown): value is RiceValues {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return ["reach", "impact", "confidence", "effort"].every(
    (key) => typeof candidate[key] === "string",
  );
}

export function RiceCalculator({ labels }: { labels: Labels }) {
  const { progress } = useProductManagementProgress();
  const values = isRiceValues(progress[RICE_KEY])
    ? progress[RICE_KEY]
    : EMPTY_RICE;

  const reach = Number(values.reach);
  const impact = Number(values.impact);
  const confidence = Number(values.confidence);
  const effort = Number(values.effort);
  const valid = [reach, impact, confidence, effort].every(Number.isFinite)
    && reach >= 0
    && impact >= 0
    && confidence >= 0
    && confidence <= 100
    && effort > 0
    && Object.values(values).every((value) => value.trim() !== "");
  const score = valid ? (reach * impact * (confidence / 100)) / effort : null;

  function updateField(field: keyof RiceValues, value: string): void {
    const next = { ...values, [field]: value };
    updateProductManagementProgress((record) => {
      record[RICE_KEY] = next;
    });
  }

  return (
    <section className={styles.riceCalculator} aria-labelledby="rice-calculator-title">
      <header>
        <p className={styles.sectionLabel}>
          {label(labels, "decisionTool", "Decision tool")}
        </p>
        <h2 id="rice-calculator-title">
          {label(labels, "riceCalculator", "RICE assumption calculator")}
        </h2>
        <p>
          {label(
            labels,
            "riceBoundary",
            "Compare candidates only when they share the same goal, reach population and time period, impact scale, and effort unit. Then discuss evidence, dependencies, risk, and opportunity cost.",
          )}
        </p>
      </header>
      <div className={styles.riceFields}>
        <label>
          <span>{label(labels, "reach", "Reach")}</span>
          <small>{label(labels, "reachHint", "Same population and time period for every candidate")}</small>
          <input
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={values.reach}
            onChange={(event) => updateField("reach", event.target.value)}
          />
        </label>
        <label>
          <span>{label(labels, "impact", "Impact")}</span>
          <small>{label(labels, "impactHint", "Relative impact per person")}</small>
          <input
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={values.impact}
            onChange={(event) => updateField("impact", event.target.value)}
          />
        </label>
        <label>
          <span>{label(labels, "confidence", "Confidence")}</span>
          <small>{label(labels, "confidenceHint", "Evidence confidence, 0 to 100%")}</small>
          <input
            type="number"
            min="0"
            max="100"
            step="any"
            inputMode="decimal"
            value={values.confidence}
            onChange={(event) => updateField("confidence", event.target.value)}
          />
        </label>
        <label>
          <span>{label(labels, "effort", "Effort")}</span>
          <small>{label(labels, "effortHint", "Total team effort in one shared unit, such as person-months")}</small>
          <input
            type="number"
            min="0.01"
            step="any"
            inputMode="decimal"
            value={values.effort}
            onChange={(event) => updateField("effort", event.target.value)}
          />
        </label>
      </div>
      <div className={styles.riceResult}>
        <span>({label(labels, "reach", "Reach")} × {label(labels, "impact", "Impact")} × ({label(labels, "confidence", "Confidence")}% ÷ 100)) ÷ {label(labels, "effort", "Effort")}</span>
        <output aria-live="polite">
          {score === null
            ? label(labels, "enterAssumptions", "Enter assumptions")
            : new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(score)}
        </output>
        <button
          className={styles.textButton}
          type="button"
          disabled={!Object.values(values).some(Boolean)}
          onClick={() => {
            updateProductManagementProgress((record) => {
              delete record[RICE_KEY];
            });
          }}
        >
          {label(labels, "clearCalculator", "Clear assumptions")}
        </button>
      </div>
    </section>
  );
}
