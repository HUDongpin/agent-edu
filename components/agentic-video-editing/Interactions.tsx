"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_COUNT,
  AGENTIC_VIDEO_EDITING_CAPSTONE_ATTESTED_KEY,
  AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_IDS,
  AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_KEY,
  AGENTIC_VIDEO_EDITING_CAPSTONE_KEY,
  AGENTIC_VIDEO_EDITING_COURSE_MANIFEST,
  AGENTIC_VIDEO_EDITING_PROGRESS_EVENT,
  AGENTIC_VIDEO_EDITING_PREFLIGHT_KEY,
  AGENTIC_VIDEO_EDITING_PREFLIGHT_RECEIPT_SCHEMA,
  AGENTIC_VIDEO_EDITING_FIXTURE_LEDGER_SHA256,
  AGENTIC_VIDEO_EDITING_CUT_PLAN_LAB_RECEIPT_KEY,
  AGENTIC_VIDEO_EDITING_PROGRESS_MODULE_SLUGS,
  AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONES,
  AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX,
  AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY,
  AGENTIC_VIDEO_EDITING_PROJECT_ID,
  AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_BEST_PASSED_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_FORM_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_PASSED_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_SCORE_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_VERSION_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_FORM,
  AGENTIC_VIDEO_EDITING_QUIZ_VERSION,
  CUT_PLAN_LAB_FIXTURE,
  agenticVideoEditingArtifactKey,
  agenticVideoEditingArtifactReceiptKey,
  agenticVideoEditingCheckpointKey,
  buildCutPlanLabPlan,
  isAgenticVideoEditingCapstoneComplete,
  isAgenticVideoEditingCapstoneEvidenceComplete,
  isAgenticVideoEditingModuleReceiptComplete,
  isAgenticVideoEditingPreflightReceipt,
  isAgenticVideoEditingQuizPassed,
  isCurrentAgenticVideoEditingProgress,
  parseAgenticVideoEditingModuleReceipt,
  validateCutPlanLabPlan,
  type AgenticVideoEditingCheckpointCopy,
  type AgenticVideoEditingCapstoneEvidenceV2,
  type AgenticVideoEditingCourseCopy,
  type AgenticVideoEditingFinalQuestionCopy,
  type AgenticVideoEditingModuleSlug,
  type AgenticVideoEditingModuleManifest,
  type AgenticVideoEditingPracticeCopy,
  type CutPlanLabIssue,
} from "@/lib/agentic-video-editing";
import {
  isAgenticVideoEditingStorageAvailable,
  readAgenticVideoEditingProgress,
  resetAgenticVideoEditingProgress,
  updateAgenticVideoEditingProgress,
  type AgenticVideoEditingProgressRecord,
} from "./progress-store";
import styles from "./AgenticVideoEditingCourse.module.css";

type Labels = AgenticVideoEditingCourseCopy["ui"];

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
  window.addEventListener(AGENTIC_VIDEO_EDITING_PROGRESS_EVENT, notify);
  window.addEventListener("storage", notify);
  window.addEventListener("focus", notify);
  return () => {
    window.removeEventListener(AGENTIC_VIDEO_EDITING_PROGRESS_EVENT, notify);
    window.removeEventListener("storage", notify);
    window.removeEventListener("focus", notify);
  };
}

function progressSnapshot(): string {
  return JSON.stringify(readAgenticVideoEditingProgress());
}

function useCourseProgress(): {
  progress: AgenticVideoEditingProgressRecord;
  storageAvailable: boolean;
} {
  const serialized = useSyncExternalStore(subscribe, progressSnapshot, () => "{}");
  const storageAvailable = useSyncExternalStore(
    subscribe,
    isAgenticVideoEditingStorageAvailable,
    () => true,
  );
  let progress: AgenticVideoEditingProgressRecord = {};
  try {
    const parsed: unknown = JSON.parse(serialized);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      progress = isCurrentAgenticVideoEditingProgress(
        parsed as AgenticVideoEditingProgressRecord,
      ) ? parsed as AgenticVideoEditingProgressRecord : {};
    }
  } catch {
    progress = {};
  }
  return { progress, storageAvailable };
}

function StorageWarning({ labels }: { labels: Labels }) {
  return (
    <p className={styles.storageWarning} role="status">
      {label(labels, "storageUnavailable", "Browser storage is unavailable.")}
    </p>
  );
}

export function PreflightGate({ labels }: { labels: Labels }) {
  const { progress, storageAvailable } = useCourseProgress();
  const complete = isAgenticVideoEditingPreflightReceipt(
    progress[AGENTIC_VIDEO_EDITING_PREFLIGHT_KEY],
  );
  return (
    <section className={styles.moduleCompletion} aria-labelledby="agentic-video-preflight-title">
      <div>
        <p className={styles.eyebrow}>{label(labels, "preflight", "Preflight")}</p>
        <h2 id="agentic-video-preflight-title">
          {label(labels, "preflightTitle", "Verify the offline fixture boundary")}
        </h2>
        <p>{label(
          labels,
          "preflightHelp",
          "Bind the hash-pinned original fixture ledger, keep execution offline, and confirm that no real credential belongs in any course field.",
        )}</p>
        {!storageAvailable ? <StorageWarning labels={labels} /> : null}
      </div>
      <button
        className={complete ? styles.completeButton : styles.primaryButton}
        type="button"
        disabled={complete}
        onClick={() => updateAgenticVideoEditingProgress((record) => {
          record[AGENTIC_VIDEO_EDITING_PREFLIGHT_KEY] = JSON.stringify({
            schemaVersion: AGENTIC_VIDEO_EDITING_PREFLIGHT_RECEIPT_SCHEMA,
            courseId: "agentic-video-editing",
            courseVersion: "2.0.0",
            projectId: AGENTIC_VIDEO_EDITING_PROJECT_ID,
            fixtureLedgerSha256: AGENTIC_VIDEO_EDITING_FIXTURE_LEDGER_SHA256,
            lane: "audit-only",
            directories: {
              input: "fixtures/read-only/",
              work: "work/course22/",
              cache: "work/course22/cache/",
              receipts: "work/course22/receipts/",
              output: "work/course22/output/",
            },
            contractFormats: ["json", "yaml"],
            clockProbeConfirmed: true,
            secretInjection: "host-secret-store-or-environment",
            uploadDataPath: "offline-fixture-no-upload",
            offline: true,
            noSecrets: true,
            validatedAt: "2026-08-28T00:00:00+08:00",
          });
        })}
      >
        {complete ? label(labels, "complete", "Complete") : label(labels, "runPreflight", "Record preflight")}
      </button>
    </section>
  );
}

export function CourseProgress({
  modules,
  labels,
  startLabel,
  resumeLabel,
}: {
  modules: readonly { slug: AgenticVideoEditingModuleSlug; href: string; title: string }[];
  labels: Labels;
  startLabel: string;
  resumeLabel: string;
}) {
  const { progress, storageAvailable } = useCourseProgress();
  const [resetMessage, setResetMessage] = useState("");
  const statusRef = useRef<HTMLParagraphElement>(null);
  const state = useMemo(() => {
    const preflightComplete = isAgenticVideoEditingPreflightReceipt(
      progress[AGENTIC_VIDEO_EDITING_PREFLIGHT_KEY],
    );
    const completedModules = modules.filter(
      (module) => module.slug !== "production-capstone"
        && isAgenticVideoEditingModuleReceiptComplete(progress, module.slug),
    ).length;
    const assessmentPassed = isAgenticVideoEditingQuizPassed(progress);
    const capstoneComplete = isAgenticVideoEditingCapstoneComplete(progress);
    const completed = Number(preflightComplete)
      + completedModules
      + Number(assessmentPassed)
      + Number(capstoneComplete);
    const nextModule = modules.find(
      (module) => module.slug !== "production-capstone"
        && !isAgenticVideoEditingModuleReceiptComplete(progress, module.slug),
    );
    const nextHref = nextModule?.href
      ?? (!assessmentPassed
        ? "#agentic-video-editing-assessment"
        : !capstoneComplete
          ? `/${modules[0]?.href.split("/").filter(Boolean)[0] ?? "en"}/agentic-video-editing/production-capstone/`
          : null);
    return {
      completed,
      preflightComplete,
      completedModules,
      assessmentPassed,
      capstoneComplete,
      nextModule,
      nextHref,
      percent: Math.round((completed / AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONES) * 100),
    };
  }, [modules, progress]);
  const hasProgress = Object.keys(progress).some(
    (key) => key.startsWith(AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX)
      && key !== AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY,
  );

  useEffect(() => {
    if (resetMessage) statusRef.current?.focus();
  }, [resetMessage]);

  return (
    <section className={styles.progressPanel} aria-labelledby="agentic-video-progress-title">
      <header className={styles.progressHeader}>
        <div>
          <p className={styles.eyebrow}>{label(labels, "progressLedger", "Local progress")}</p>
          <h2 id="agentic-video-progress-title">{label(labels, "courseProgress", "Course progress")}</h2>
          <p>{label(labels, "browserStorageNote", "Saved locally in this browser.")}</p>
          <p>{label(
            labels,
            "progressEvidenceBoundary",
            "This percentage reflects structurally consistent local records, not verified command execution, competence, reviewer identity, or release authority.",
          )}</p>
        </div>
        <output className={styles.progressReadout} aria-live="polite">
          <strong>{state.percent}%</strong>
          <span>{interpolate(label(labels, "progressPosition", "{complete} of {total}"), {
            complete: state.completed,
            total: AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONES,
          })}</span>
        </output>
      </header>
      {!storageAvailable ? <StorageWarning labels={labels} /> : null}
      <progress
        className={styles.progressBar}
        max={AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONES}
        value={state.completed}
        aria-labelledby="agentic-video-progress-title"
      >{state.percent}%</progress>
      <dl className={styles.progressFacts}>
        <div><dt>{label(labels, "preflight", "Preflight")}</dt><dd>{state.preflightComplete ? label(labels, "complete", "Complete") : label(labels, "pending", "Pending")}</dd></div>
        <div><dt>{label(labels, "modules", "Guided modules")}</dt><dd>{state.completedModules} / {AGENTIC_VIDEO_EDITING_PROGRESS_MODULE_SLUGS.length}</dd></div>
        <div><dt>{label(labels, "finalAssessment", "Assessment")}</dt><dd>{state.assessmentPassed ? label(labels, "complete", "Complete") : label(labels, "pending", "Pending")}</dd></div>
        <div><dt>{label(labels, "capstone", "Capstone")}</dt><dd>{state.capstoneComplete ? label(labels, "complete", "Complete") : label(labels, "pending", "Pending")}</dd></div>
      </dl>
      <div className={styles.buttonRow}>
        {state.nextHref ? (
          <Link className={styles.primaryButton} href={state.nextHref}>
            {hasProgress ? resumeLabel : startLabel}<span aria-hidden="true">→</span>
          </Link>
        ) : <p className={styles.completionCallout}>{label(labels, "courseComplete", "Course complete")}</p>}
        <button
          className={styles.secondaryButton}
          type="button"
          disabled={!hasProgress}
          onClick={() => {
            if (!window.confirm(label(labels, "resetConfirm", "Reset course progress?"))) return;
            const persisted = resetAgenticVideoEditingProgress();
            setResetMessage(persisted
              ? label(labels, "resetDone", "Progress reset.")
              : label(labels, "resetDoneMemory", "Session progress reset."));
          }}
        >{label(labels, "resetProgress", "Reset course")}</button>
      </div>
      {state.nextModule ? (
        <p className={styles.nextUp}><strong>{label(labels, "nextUp", "Next")}</strong><span>{state.nextModule.title}</span></p>
      ) : null}
      <p className={resetMessage ? styles.statusMessage : styles.srOnly} role="status" tabIndex={-1} ref={statusRef}>{resetMessage}</p>
    </section>
  );
}

export function ArtifactWorkbench({
  module,
  practice,
  labels,
}: {
  module: AgenticVideoEditingModuleManifest;
  practice: AgenticVideoEditingPracticeCopy;
  labels: Labels;
}) {
  const slug = module.slug;
  const { progress, storageAvailable } = useCourseProgress();
  const key = agenticVideoEditingArtifactKey(slug);
  const receiptKey = agenticVideoEditingArtifactReceiptKey(slug);
  const persisted = typeof progress[key] === "string" ? String(progress[key]) : "";
  const [draftState, setDraftState] = useState(() => ({
    persistedBasis: persisted,
    value: persisted || practice.template,
  }));
  const draft = draftState.persistedBasis === persisted
    ? draftState.value
    : persisted || practice.template;
  const [announcement, setAnnouncement] = useState("");
  const persistedReceipt = typeof progress[receiptKey] === "string"
    ? String(progress[receiptKey])
    : "";
  const [receiptDraft, setReceiptDraft] = useState(persistedReceipt);
  const receiptValid = parseAgenticVideoEditingModuleReceipt(receiptDraft, module) !== null;
  const id = useId();

  return (
    <div className={styles.artifactWorkbench}>
      <div className={styles.workbenchTopline}>
        <div>
          <p className={styles.eyebrow}>{label(labels, "artifact", "Artifact")}</p>
          <h3>{practice.artifact}</h3>
        </div>
        <span>{label(labels, "draftNotCompletion", "Draft storage does not count as completion; only validator receipts do.")}</span>
      </div>
      <label htmlFor={id}>{label(labels, "artifactLabel", "Editable artifact")}</label>
      <p id={`${id}-hint`} className={styles.fieldHint}>{label(labels, "artifactHint", "Adapt the starter with evidence.")}</p>
      <textarea
        id={id}
        aria-describedby={`${id}-hint`}
        rows={15}
        value={draft}
        onChange={(event) => setDraftState({
          persistedBasis: persisted,
          value: event.target.value,
        })}
      />
      <label htmlFor={`${id}-receipt`}>
        {label(labels, "validatorReceipt", "Field-valid validator receipt")}
      </label>
      <p id={`${id}-receipt-hint`} className={styles.fieldHint}>
        <code lang="en" dir="ltr">{module.validatorCommand} · {module.validatorId}</code>. {label(
          labels,
          "browserReceiptBoundary",
          "The browser checks receipt structure and lineage only; it does not rerun the validator command.",
        )}
      </p>
      <textarea
        id={`${id}-receipt`}
        lang="en"
        dir="ltr"
        aria-describedby={`${id}-receipt-hint`}
        rows={10}
        value={receiptDraft}
        placeholder={`[{"schemaVersion":"aicourse.agentic-video-editing.module-receipt.v2","moduleSlug":"${slug}"}]`}
        onChange={(event) => setReceiptDraft(event.target.value)}
      />
      {!storageAvailable ? <StorageWarning labels={labels} /> : null}
      <div className={styles.buttonRow}>
        <button
          className={styles.primaryButton}
          type="button"
          onClick={() => {
            const didPersist = updateAgenticVideoEditingProgress((record) => {
              record[key] = draft;
            });
            setAnnouncement(didPersist
              ? label(labels, "artifactSaved", "Artifact saved locally.")
              : label(labels, "resetDoneMemory", "Saved for this tab."));
          }}
        >{label(labels, "saveArtifact", "Save artifact")}</button>
        <button
          className={styles.secondaryButton}
          type="button"
          disabled={!receiptValid}
          onClick={() => {
            const didPersist = updateAgenticVideoEditingProgress((record) => {
              record[receiptKey] = receiptDraft;
            });
            setAnnouncement(didPersist
              ? label(labels, "receiptSaved", "Validated receipt saved locally.")
              : label(labels, "resetDoneMemory", "Saved for this tab."));
          }}
        >{label(labels, "saveReceipt", "Save validator receipt")}</button>
        <span className={styles.fieldHint}>{practice.reviewGate}</span>
      </div>
      <p className={announcement ? styles.statusMessage : styles.srOnly} role="status">{announcement}</p>
    </div>
  );
}

export function ModuleCheckpoint({
  slug,
  checkpoint,
  labels,
}: {
  slug: AgenticVideoEditingModuleSlug;
  checkpoint: AgenticVideoEditingCheckpointCopy;
  labels: Labels;
}) {
  const { progress } = useCourseProgress();
  const key = agenticVideoEditingCheckpointKey(slug);
  const alreadyPassed = progress[key] === true;
  const [selected, setSelected] = useState<number | null>(null);
  const [resultState, setResultState] = useState<{
    persistedBasis: boolean;
    value: "idle" | "correct" | "incorrect";
  }>(() => ({
    persistedBasis: alreadyPassed,
    value: alreadyPassed ? "correct" : "idle",
  }));
  const result = resultState.persistedBasis === alreadyPassed
    ? resultState.value
    : alreadyPassed ? "correct" : "idle";

  return (
    <section className={styles.checkpoint} aria-labelledby={`checkpoint-${slug}`}>
      <p className={styles.eyebrow}>{label(labels, "checkpoint", "Checkpoint")}</p>
      <h2 id={`checkpoint-${slug}`}>{checkpoint.question}</h2>
      <fieldset>
        <legend className={styles.srOnly}>{checkpoint.question}</legend>
        {checkpoint.options.map((option, index) => (
          <label key={option} className={styles.answerOption} data-selected={selected === index || undefined}>
            <input
              type="radio"
              name={`checkpoint-${slug}`}
              checked={selected === index}
              onChange={() => {
                setSelected(index);
                setResultState({ persistedBasis: alreadyPassed, value: "idle" });
              }}
            />
            <span>{String.fromCharCode(65 + index)}</span>
            <strong>{option}</strong>
          </label>
        ))}
      </fieldset>
      <button
        className={styles.primaryButton}
        type="button"
        disabled={selected === null}
        onClick={() => {
          if (selected === checkpoint.correctIndex) {
            updateAgenticVideoEditingProgress((record) => { record[key] = true; });
            setResultState({ persistedBasis: true, value: "correct" });
          } else {
            setResultState({ persistedBasis: alreadyPassed, value: "incorrect" });
          }
        }}
      >{label(labels, "checkAnswer", "Check answer")}</button>
      {result !== "idle" ? (
        <div className={styles.feedback} data-correct={result === "correct" || undefined} role="status">
          <strong>{result === "correct" ? label(labels, "correct", "Correct") : label(labels, "incorrect", "Not yet")}</strong>
          <p>{checkpoint.explanation}</p>
        </div>
      ) : null}
    </section>
  );
}

export function ModuleCompletion({
  module,
  labels,
}: {
  module: AgenticVideoEditingModuleManifest;
  labels: Labels;
}) {
  const slug = module.slug;
  const { progress, storageAvailable } = useCourseProgress();
  const checkpointPassed = progress[agenticVideoEditingCheckpointKey(slug)] === true;
  const preflightPassed = isAgenticVideoEditingPreflightReceipt(
    progress[AGENTIC_VIDEO_EDITING_PREFLIGHT_KEY],
  );
  const prerequisitesPassed = module.prerequisiteModuleSlugs.every(
    (prerequisite) => isAgenticVideoEditingModuleReceiptComplete(progress, prerequisite),
  );
  const artifactReady = isAgenticVideoEditingModuleReceiptComplete(progress, slug);
  const quizReady = slug !== "production-capstone"
    || isAgenticVideoEditingQuizPassed(progress);
  const ready = preflightPassed
    && prerequisitesPassed
    && checkpointPassed
    && artifactReady
    && quizReady;
  const complete = slug === "production-capstone"
    ? isAgenticVideoEditingCapstoneComplete(progress)
    : ready;

  return (
    <section className={styles.moduleCompletion} aria-labelledby={`completion-${slug}`}>
      <div>
        <p className={styles.eyebrow}>{label(labels, "moduleRecord", "Module record")}</p>
        <h2 id={`completion-${slug}`}>{complete ? label(labels, "moduleComplete", "Module complete") : label(labels, "moduleIncomplete", "Complete the evidence gate")}</h2>
        <p>{label(labels, "completionInstruction", "Pass the checkpoint and save an artifact.")}</p>
        <ul>
          <li data-complete={checkpointPassed || undefined}><span aria-hidden="true">{checkpointPassed ? "✓" : "○"}</span>{checkpointPassed ? label(labels, "checkpointRequirement", "Checkpoint passed") : label(labels, "checkpointPending", "Checkpoint pending")}</li>
          <li data-complete={preflightPassed || undefined}><span aria-hidden="true">{preflightPassed ? "✓" : "○"}</span>{label(labels, "preflight", "Preflight")}</li>
          <li data-complete={prerequisitesPassed || undefined}><span aria-hidden="true">{prerequisitesPassed ? "✓" : "○"}</span>{label(labels, "lineage", "Prerequisite lineage")}</li>
          <li data-complete={artifactReady || undefined}><span aria-hidden="true">{artifactReady ? "✓" : "○"}</span>{artifactReady ? label(labels, "artifactRequirement", "Field-valid receipt saved") : label(labels, "artifactPending", "Validator receipt pending")}</li>
          {slug === "production-capstone" ? <li data-complete={quizReady || undefined}><span aria-hidden="true">{quizReady ? "✓" : "○"}</span>{label(labels, "readinessQuiz", "Readiness quiz")}</li> : null}
        </ul>
        {!storageAvailable ? <StorageWarning labels={labels} /> : null}
      </div>
      <button
        className={complete ? styles.completeButton : styles.primaryButton}
        type="button"
        disabled
      >{complete
          ? label(labels, "complete", "Complete")
          : ready
            ? label(labels, "receiptReady", "Receipt valid; close in capstone gate")
            : label(labels, "validationPending", "Validation pending")}</button>
    </section>
  );
}

export function FinalAssessment({
  questions,
  passPercent,
  title,
  summary,
  labels,
}: {
  questions: readonly AgenticVideoEditingFinalQuestionCopy[];
  passPercent: number;
  title: string;
  summary: string;
  labels: Labels;
}) {
  const { progress } = useCourseProgress();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean; criticalMiss: boolean } | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const priorBestPassed = progress[AGENTIC_VIDEO_EDITING_QUIZ_BEST_PASSED_KEY] === true;
  const persistedResult = progress[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_VERSION_KEY]
      === AGENTIC_VIDEO_EDITING_QUIZ_VERSION
    && progress[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_FORM_KEY]
      === AGENTIC_VIDEO_EDITING_QUIZ_FORM
    && typeof progress[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_SCORE_KEY] === "number"
    && typeof progress[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_PASSED_KEY] === "boolean"
    ? {
        score: Number(progress[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_SCORE_KEY]),
        passed: progress[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_PASSED_KEY] === true,
        criticalMiss: null,
      }
    : null;
  const visibleResult = result ?? persistedResult;

  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  return (
    <section className={styles.assessment} id="agentic-video-editing-assessment" aria-labelledby="agentic-video-assessment-title">
      <header className={styles.sectionHeader}>
        <p className={styles.eyebrow}>{label(labels, "finalAssessment", "Final assessment")}</p>
        <h2 id="agentic-video-assessment-title">{title}</h2>
        <p>{summary}</p>
        <p className={styles.gateNote}>{interpolate(label(labels, "assessmentPass", "Pass: {percent}%"), { percent: passPercent })}</p>
      </header>
      <div className={styles.questionList}>
        {questions.map((question, questionIndex) => (
          <fieldset key={question.id} className={styles.assessmentQuestion}>
            <legend><span>{String(questionIndex + 1).padStart(2, "0")}</span>{question.question}</legend>
            {question.options.map((option, optionIndex) => (
              <label key={option}>
                <input
                  type="radio"
                  name={`assessment-${question.id}`}
                  checked={answers[question.id] === optionIndex}
                  onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                />
                <span>{String.fromCharCode(65 + optionIndex)}</span>{option}
              </label>
            ))}
          </fieldset>
        ))}
      </div>
      <button
        className={styles.primaryButton}
        type="button"
        disabled={Object.keys(answers).length !== questions.length}
        onClick={() => {
          const correct = questions.filter((question) => answers[question.id] === question.correctIndex).length;
          const score = Math.round((correct / questions.length) * 100);
          const criticalMiss = questions.some(
            (question) => question.critical && answers[question.id] !== question.correctIndex,
          );
          const passed = score >= passPercent && !criticalMiss;
          updateAgenticVideoEditingProgress((record) => {
            record[AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY] = Math.max(
              typeof record[AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY] === "number"
                ? Number(record[AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY]) : 0,
              score,
            );
            record[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_SCORE_KEY] = score;
            record[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_PASSED_KEY] = passed;
            record[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_VERSION_KEY] =
              AGENTIC_VIDEO_EDITING_QUIZ_VERSION;
            record[AGENTIC_VIDEO_EDITING_QUIZ_CURRENT_FORM_KEY] =
              AGENTIC_VIDEO_EDITING_QUIZ_FORM;
            if (passed) record[AGENTIC_VIDEO_EDITING_QUIZ_BEST_PASSED_KEY] = true;
          });
          setResult({ score, passed, criticalMiss });
        }}
      >{label(labels, "submitAssessment", "Score assessment")}</button>
      {visibleResult ? (
        <div className={styles.assessmentResult} data-passed={visibleResult.passed || undefined} role="status" tabIndex={-1} ref={resultRef}>
          <strong>{label(labels, "score", "Score")}: {visibleResult.score}%</strong>
          <p>{visibleResult.passed ? label(labels, "assessmentPassed", "Assessment passed") : label(labels, "assessmentRetry", "Try again")}</p>
          <p>{label(labels, "currentAttempt", "Current attempt")}: {visibleResult.passed
            ? label(labels, "complete", "Passed")
            : label(labels, "pending", "Not passed")}</p>
          <p>{label(labels, "historicalBestPass", "Historical best pass")}: {priorBestPassed || visibleResult.passed
            ? label(labels, "complete", "Recorded")
            : label(labels, "pending", "None")}</p>
          {!visibleResult.passed && priorBestPassed ? (
            <p>{label(labels, "earlierPassRetained", "Your earlier passing record remains saved; this attempt did not pass.")}</p>
          ) : null}
          {visibleResult.criticalMiss === true ? <p>{label(labels, "criticalMiss", "A critical question is incorrect.")}</p> : null}
          {result && !result.passed ? (
            <ol>
              {questions.map((question) => answers[question.id] !== question.correctIndex ? (
                <li key={question.id}><strong>{question.moduleTitle}</strong><span>{question.explanation}</span></li>
              ) : null)}
            </ol>
          ) : null}
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
  artifacts: readonly { readonly artifactId: string; readonly label: string }[];
  statement: string;
  labels: Labels;
}) {
  const { progress, storageAvailable } = useCourseProgress();
  const persistedEvidence = Array.isArray(progress[AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_KEY])
    ? progress[AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_KEY] as unknown[]
    : [];
  const externalEvidence = AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_IDS.map(
    (artifactId) => {
      const baseArtifactId = artifactId.replace(/^capstone-/u, "");
      const evidenceModule = artifactId === "release-decision"
        ? AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
          (moduleManifest) => moduleManifest.slug === "production-capstone",
        )!
        : AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
          (moduleManifest) => (moduleManifest.producesArtifactIds as readonly string[])
            .includes(baseArtifactId),
        )!;
      const candidate = persistedEvidence.find(
        (value) => value && typeof value === "object"
          && (value as { artifactId?: unknown }).artifactId === artifactId,
      ) as Partial<AgenticVideoEditingCapstoneEvidenceV2> | undefined;
      return {
        artifactId,
        locator: typeof candidate?.locator === "string" ? candidate.locator : "",
        sha256: typeof candidate?.sha256 === "string" ? candidate.sha256 : "",
        reviewState: candidate?.reviewState === "reviewed-blocked"
          ? "reviewed-blocked" as const
          : "reviewed-pass" as const,
        reviewerId: typeof candidate?.reviewerId === "string" ? candidate.reviewerId : "",
        reviewedAt: typeof candidate?.reviewedAt === "string" ? candidate.reviewedAt : "",
        learnerProjectId: typeof candidate?.learnerProjectId === "string"
          ? candidate.learnerProjectId
          : "",
        artifactSchemaId: evidenceModule.artifactSchemaId,
        validatorId: evidenceModule.validatorId,
      };
    },
  );
  const externalAttested = progress[AGENTIC_VIDEO_EDITING_CAPSTONE_ATTESTED_KEY] === true;
  const capstoneModule = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
    (module) => module.slug === "production-capstone",
  )!;
  const capstoneReceiptValue = progress[
    agenticVideoEditingArtifactReceiptKey("production-capstone")
  ];
  const capstoneReceipt = parseAgenticVideoEditingModuleReceipt(
    capstoneReceiptValue,
    capstoneModule,
  );
  const quizPassed = isAgenticVideoEditingQuizPassed(progress);
  const externalBasis = JSON.stringify({
    evidence: externalEvidence,
    attested: externalAttested,
  });
  const [draft, setDraft] = useState(() => ({
    persistedBasis: externalBasis,
    evidence: externalEvidence,
    attested: externalAttested,
  }));
  const evidence = draft.persistedBasis === externalBasis
    ? draft.evidence
    : externalEvidence;
  const attested = draft.persistedBasis === externalBasis
    ? draft.attested
    : externalAttested;
  const complete = isAgenticVideoEditingCapstoneComplete(progress);
  const hasHistoricalCompletion = typeof progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY]
    === "string";
  const capstoneState = complete
    ? "completed"
    : hasHistoricalCompletion
      ? "stale"
      : "draft";
  const evidenceReady = isAgenticVideoEditingCapstoneEvidenceComplete(
    progress,
    evidence,
    capstoneReceiptValue,
  );
  const ready = evidence.length === AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_COUNT
    && evidenceReady
    && attested
    && quizPassed
    && capstoneReceipt !== null;

  const persist = (
    nextEvidence: readonly AgenticVideoEditingCapstoneEvidenceV2[],
    nextAttested: boolean,
  ) => {
    updateAgenticVideoEditingProgress((record) => {
      record[AGENTIC_VIDEO_EDITING_CAPSTONE_EVIDENCE_KEY] = nextEvidence;
      record[AGENTIC_VIDEO_EDITING_CAPSTONE_ATTESTED_KEY] = nextAttested;
    });
  };

  return (
    <section className={styles.capstone} id="agentic-video-editing-capstone" data-state={capstoneState} aria-labelledby="agentic-video-capstone-title">
      <header className={styles.sectionHeader}>
        <p className={styles.eyebrow}>{label(labels, "capstone", "Capstone")}</p>
        <h2 id="agentic-video-capstone-title">{label(labels, "capstoneInstruction", "Point to each artifact.")}</h2>
        <p role="status">{capstoneState === "completed"
          ? label(labels, "capstoneStateCompleted", "Completed: current v2 receipt and evidence records are structurally consistent for version and lineage.")
          : capstoneState === "stale"
            ? label(labels, "capstoneStateStale", "Stale: historical completion is retained but does not count for the current evidence state.")
            : label(labels, "capstoneStateDraft", "Draft: current v2 requirements are not yet complete.")}</p>
      </header>
      <ol className={styles.capstoneList}>
        {artifacts.map((artifact, index) => (
          <li key={artifact.artifactId}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{artifact.label}</strong>
            <small lang="en" dir="ltr">{artifact.artifactId}</small>
            <small lang="en" dir="ltr">{evidence[index]?.artifactSchemaId}</small>
            <small lang="en" dir="ltr">{evidence[index]?.validatorId}</small>
            <label>
              {label(labels, "artifactLocator", "Artifact locator")}
              <input
                type="text"
                value={evidence[index]?.locator ?? ""}
                onChange={(event) => {
                  const next = evidence.map((record, recordIndex) => recordIndex === index
                    ? { ...record, locator: event.target.value }
                    : record);
                  setDraft({
                    persistedBasis: JSON.stringify({ evidence: next, attested }),
                    evidence: next,
                    attested,
                  });
                  persist(next, attested);
                }}
              />
            </label>
            <label>
              {label(labels, "learnerProjectId", "Learner capstone project ID")}
              <input
                type="text"
                value={evidence[index]?.learnerProjectId ?? ""}
                onChange={(event) => {
                  const next = evidence.map((record, recordIndex) => recordIndex === index
                    ? { ...record, learnerProjectId: event.target.value }
                    : record);
                  setDraft({
                    persistedBasis: JSON.stringify({ evidence: next, attested }),
                    evidence: next,
                    attested,
                  });
                  persist(next, attested);
                }}
              />
            </label>
            <label>
              {label(labels, "artifactSha256", "Artifact SHA-256")}
              <input
                type="text"
                lang="en"
                dir="ltr"
                spellCheck={false}
                value={evidence[index]?.sha256 ?? ""}
                onChange={(event) => {
                  const next = evidence.map((record, recordIndex) => recordIndex === index
                    ? { ...record, sha256: event.target.value.trim().toLowerCase() }
                    : record);
                  setDraft({
                    persistedBasis: JSON.stringify({ evidence: next, attested }),
                    evidence: next,
                    attested,
                  });
                  persist(next, attested);
                }}
              />
            </label>
            <label>
              {label(labels, "reviewState", "Review state")}
              <select
                value={evidence[index]?.reviewState ?? "reviewed-pass"}
                onChange={(event) => {
                  const reviewState = event.target.value === "reviewed-blocked"
                    ? "reviewed-blocked" as const
                    : "reviewed-pass" as const;
                  const next = evidence.map((record, recordIndex) => recordIndex === index
                    ? { ...record, reviewState }
                    : record);
                  setDraft({
                    persistedBasis: JSON.stringify({ evidence: next, attested }),
                    evidence: next,
                    attested,
                  });
                  persist(next, attested);
                }}
              >
                <option value="reviewed-pass">{label(labels, "reviewedPass", "Reviewed: pass")}</option>
                <option value="reviewed-blocked">{label(labels, "reviewedBlocked", "Reviewed: blocked")}</option>
              </select>
            </label>
            <label>
              {label(labels, "reviewerId", "Named human reviewer")}
              <input
                type="text"
                value={evidence[index]?.reviewerId ?? ""}
                onChange={(event) => {
                  const next = evidence.map((record, recordIndex) => recordIndex === index
                    ? { ...record, reviewerId: event.target.value }
                    : record);
                  setDraft({
                    persistedBasis: JSON.stringify({ evidence: next, attested }),
                    evidence: next,
                    attested,
                  });
                  persist(next, attested);
                }}
              />
            </label>
            <label>
              {label(labels, "reviewedAt", "Reviewed at (ISO 8601 with offset)")}
              <input
                type="text"
                placeholder={label(labels, "timestampExample", "2026-08-28T00:00:00+08:00")}
                value={evidence[index]?.reviewedAt ?? ""}
                onChange={(event) => {
                  const next = evidence.map((record, recordIndex) => recordIndex === index
                    ? { ...record, reviewedAt: event.target.value }
                    : record);
                  setDraft({
                    persistedBasis: JSON.stringify({ evidence: next, attested }),
                    evidence: next,
                    attested,
                  });
                  persist(next, attested);
                }}
              />
            </label>
          </li>
        ))}
      </ol>
      <label className={styles.attestation}>
        <input
          type="checkbox"
          checked={attested}
          onChange={(event) => {
            const nextAttested = event.target.checked;
            setDraft({
              persistedBasis: JSON.stringify({ evidence, attested: nextAttested }),
              evidence,
              attested: nextAttested,
            });
            persist(evidence, nextAttested);
          }}
        />
        <span>{statement}</span>
      </label>
      <ul>
        <li data-complete={quizPassed || undefined}>
          {quizPassed ? "✓" : "○"} {label(labels, "readinessQuiz", "Readiness quiz passed")}
        </li>
        <li data-complete={Boolean(capstoneReceipt) || undefined}>
          {capstoneReceipt ? "✓" : "○"} {label(labels, "capstoneReceipt", "M10 field-valid, hash-bound receipt")}
        </li>
        <li data-complete={evidenceReady || undefined}>
          {evidenceReady ? "✓" : "○"} {label(labels, "capstoneEvidence", "12 locator-, hash-, and review-bound artifact records")}
        </li>
      </ul>
      {!storageAvailable ? <StorageWarning labels={labels} /> : null}
      <button
        className={complete ? styles.completeButton : styles.primaryButton}
        type="button"
        disabled={!ready || complete}
        onClick={() => updateAgenticVideoEditingProgress((record) => {
          if (typeof capstoneReceiptValue === "string") {
            record[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY] = capstoneReceiptValue;
          }
        })}
      >{complete ? label(labels, "capstoneComplete", "Capstone complete") : label(labels, "markComplete", "Mark complete")}</button>
    </section>
  );
}

export function CutPlanLab({ locale }: { locale: "en" | "zh-Hans" }) {
  const zh = locale === "zh-Hans";
  const { storageAvailable } = useCourseProgress();
  const [selected, setSelected] = useState<Record<string, boolean>>({ hook: true, context: true, method: true, close: true });
  const [reasons, setReasons] = useState<Record<string, string>>(
    Object.fromEntries(CUT_PLAN_LAB_FIXTURE.map((clip) => [clip.id, zh ? clip.defaultReasonZhHans : clip.defaultReason])),
  );
  const [target, setTarget] = useState(50);
  const [receipt, setReceipt] = useState<{
    json: string;
    receiptJson: string;
    issues: CutPlanLabIssue[];
  } | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const selectedClips = CUT_PLAN_LAB_FIXTURE.filter((clip) => selected[clip.id]);
  const duration = selectedClips.reduce((sum, clip) => sum + clip.sourceOutSeconds - clip.sourceInSeconds, 0);
  const issueText = (issue: CutPlanLabIssue): string => {
    const clip = CUT_PLAN_LAB_FIXTURE.find((candidate) => `op-keep-${candidate.id}` === issue.subject);
    const subject = clip ? (zh ? clip.labelZhHans : clip.label) : issue.subject;
    const messages: Record<CutPlanLabIssue["code"], readonly [string, string]> = {
      "fixture-boundary": ["Teaching-fixture plans must remain blocked and non-publishing.", "教学 fixture 计划必须保持阻断且不能发布。"],
      "minimum-clips": ["Select at least three clips.", "至少选择三个片段。"],
      "target-range": ["Target duration must be 45–60 seconds.", "目标时长必须在 45–60 秒。"],
      "duration-range": ["Selected duration must be 45–60 seconds.", "所选总时长必须在 45–60 秒。"],
      "target-delta": ["Selected duration differs from target by more than five seconds.", "当前时长与目标相差超过 5 秒。"],
      "rights-unresolved": [`${subject}: rights are unresolved.`, `${subject}：权利未解决。`],
      "reason-short": [`${subject}: rationale is too short.`, `${subject}：理由过短。`],
      "duplicate-operation-id": ["Operation IDs must be unique.", "Operation ID 必须唯一。"],
      "source-missing": [`${subject}: source input is missing.`, `${subject}：找不到源输入。`],
      "source-range-invalid": [`${subject}: source range is invalid.`, `${subject}：源区间无效。`],
      "source-range-out-of-bounds": [`${subject}: source range exceeds the declared fixture duration.`, `${subject}：源区间超出声明的 fixture 时长。`],
      "timeline-discontinuity": [`${subject}: timeline arithmetic is discontinuous.`, `${subject}：时间线算术不连续。`],
      "expected-duration-mismatch": ["Expected duration does not match the operation sum.", "预期时长与 operation 合计不一致。"],
      "fixture-timebase": ["The teaching fixture must use its declared 30 fps timebase.", "教学 fixture 必须使用声明的 30 fps 时间基准。"],
      "fixture-tolerance": ["The teaching fixture tolerance must remain exactly five seconds.", "教学 fixture 的容差必须保持为恰好 5 秒。"],
      "fixture-input": ["The synthetic input identity or declared duration was changed.", "合成输入的身份或声明时长被改动。"],
      "fixture-operation": [`${subject}: operation fields no longer match the declared text fixture.`, `${subject}：operation 字段不再匹配声明的文本 fixture。`],
      "evidence-unresolved": [`${subject}: evidence does not resolve to the declared fixture span.`, `${subject}：证据无法定位到声明的 fixture 区间。`],
      "unsafe-output-directory": ["Output directory fails the lexical containment rule.", "输出目录未通过词法范围限制。"],
      "unsafe-execution-policy": ["The dry-run, read-only, offline, stop, or non-publishing policy was weakened.", "dry-run、只读、离线、停止或禁止发布策略被削弱。"],
      "candidate-set-ref": ["The M5 plan must bind the exact M4 candidate-set artifact and selected lane.", "M5 计划必须绑定准确的 M4 候选集产物与所选 lane。"],
      "completion-fields-open": ["Every required edit-plan field must be closed before the field-level completion record can pass.", "字段级完成记录通过前，所有必填 edit-plan 字段都必须闭合。"],
      "unresolved-ambiguity": [`${subject}: ambiguity is unresolved.`, `${subject}：歧义尚未解决。`],
      "human-review-disabled": [`${subject}: required human review was disabled.`, `${subject}：必须的人审被关闭。`],
    };
    return messages[issue.code][zh ? 1 : 0];
  };
  const copyLabText = async (value: string, kind: "plan" | "receipt") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage(kind === "plan"
        ? (zh ? "已复制 blocked plan。" : "Blocked plan copied.")
        : (zh ? "已复制验证凭据。" : "Validation receipt copied."));
    } catch (error) {
      setCopyMessage(zh
        ? `复制失败：${error instanceof Error ? error.message : String(error)}`
        : `Copy failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <section className={styles.cutPlanLab} aria-labelledby="cut-plan-lab-title">
      <header>
        <p className={styles.eyebrow}>{zh ? "离线合同实验" : "Offline contract lab"}</p>
        <h2 id="cut-plan-lab-title">{zh ? "Cut Plan Lab：先验证计划，再渲染" : "Cut Plan Lab: validate before rendering"}</h2>
        <p>{zh ? "这是独立于 Harbor House 简报的原创文本 fixture；不会上传媒体、调用模型或执行 FFmpeg。M4 的三条分析 lane 保留在 candidate-segments 产物中；本 M5 实验只绑定一个已哈希候选集引用，再生成可下载的 blocked edit-plan v2 并运行跨字段语义检查。真实执行仍须另做 hash、realpath、权利与人审。" : "This original text fixture is separate from the Harbor House brief; it uploads no media, calls no model, and runs no FFmpeg. M4's three analysis lanes stay in the candidate-segments artifact; this M5 lab binds one hashed candidate-set reference, then generates a downloadable blocked edit-plan v2 and runs cross-field semantic checks. Real execution still needs hash, realpath, rights, and human review."}</p>
      </header>
      <div className={styles.labTarget}>
        <label htmlFor="cut-plan-target">{zh ? "目标时长（秒）" : "Target duration (seconds)"}</label>
        <input id="cut-plan-target" type="number" min={45} max={60} value={target} onChange={(event) => {
          const nextTarget = Number(event.target.value);
          setTarget(Number.isFinite(nextTarget) ? nextTarget : 45);
          setReceipt(null);
        }} />
        <output aria-live="polite">{zh ? "当前选择" : "Selected"}: {duration.toFixed(1)}s</output>
      </div>
      <div className={styles.clipList}>
        {CUT_PLAN_LAB_FIXTURE.map((clip, index) => (
          <article key={clip.id} data-selected={selected[clip.id] || undefined}>
            <label className={styles.clipToggle}>
              <input type="checkbox" checked={selected[clip.id] ?? false} onChange={(event) => {
                setSelected((current) => ({ ...current, [clip.id]: event.target.checked }));
                setReceipt(null);
              }} />
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{zh ? clip.labelZhHans : clip.label}</strong>
            </label>
            <dl>
              <div><dt>{zh ? "源区间" : "Source"}</dt><dd>{clip.sourceInSeconds.toFixed(1)}–{clip.sourceOutSeconds.toFixed(1)}s</dd></div>
              <div><dt>{zh ? "权利信号" : "Rights signal"}</dt><dd data-rights={clip.rightsState}>{clip.rightsState === "simulated-cleared" ? (zh ? "模拟已清权（无媒体）" : "simulated cleared (no media)") : (zh ? "未知" : "unknown")}</dd></div>
            </dl>
            <label>
              <span>{zh ? "保留理由" : "Keep rationale"}</span>
              <input type="text" value={reasons[clip.id] ?? ""} onChange={(event) => {
                setReasons((current) => ({ ...current, [clip.id]: event.target.value }));
                setReceipt(null);
              }} />
            </label>
          </article>
        ))}
      </div>
      <button className={styles.primaryButton} type="button" onClick={async () => {
        const plan = buildCutPlanLabPlan(selectedClips, reasons, target);
        const issues = validateCutPlanLabPlan(plan);
        const json = JSON.stringify(plan, null, 2);
        const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(json));
        const planSha256 = Array.from(new Uint8Array(digest))
          .map((byte) => byte.toString(16).padStart(2, "0"))
          .join("");
        const receiptJson = JSON.stringify({
          schemaVersion: "aicourse.agentic-video-editing.cut-plan-lab-receipt.v2",
          courseVersion: "2.0.0",
          fixtureId: plan.fixtureId,
          planSha256,
          status: issues.length ? "blocked" : "validated-teaching-fixture",
          issueCodes: issues.map((issue) => issue.code),
          persistedAt: new Date().toISOString(),
        }, null, 2);
        setReceipt({ json, receiptJson, issues });
        updateAgenticVideoEditingProgress((record) => {
          record[AGENTIC_VIDEO_EDITING_CUT_PLAN_LAB_RECEIPT_KEY] = receiptJson;
        });
      }}>{zh ? "生成并运行合同门" : "Generate and run contract gate"}</button>
      {receipt ? (
        <div className={styles.labReceipt} data-passed={!receipt.issues.length || undefined} role="status">
          <strong>{receipt.issues.length ? (zh ? "语义门发现阻断项" : "Semantic gate found blockers") : (zh ? "计划通过课程语义门" : "Plan passes the course semantic gate")}</strong>
          {receipt.issues.length ? <ul>{receipt.issues.map((issue, index) => <li key={`${issue.code}-${issue.subject ?? index}`}>{issueText(issue)}</li>)}</ul> : <p>{zh ? "计划仍固定为 blocked：它没有真实媒体/hash，也不是编辑、渲染或发布批准。" : "The plan remains blocked: it has no real media or hashes and is not edit, render, or release approval."}</p>}
          <pre tabIndex={0}><code lang="en" dir="ltr">{receipt.json}</code></pre>
          <div className={styles.buttonRow}>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => void copyLabText(receipt.json, "plan")}
            >{zh ? "复制计划" : "Copy plan"}</button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => void copyLabText(receipt.receiptJson, "receipt")}
            >{zh ? "复制凭据" : "Copy receipt"}</button>
            <a
              className={styles.secondaryButton}
              download="course22-edit-plan.v2.json"
              href={`data:application/json;charset=utf-8,${encodeURIComponent(receipt.json)}`}
            >{zh ? "下载计划" : "Download plan"}</a>
            <a
              className={styles.secondaryButton}
              download="course22-cut-plan-receipt.v2.json"
              href={`data:application/json;charset=utf-8,${encodeURIComponent(receipt.receiptJson)}`}
            >{zh ? "下载凭据" : "Download receipt"}</a>
          </div>
          <p>{storageAvailable
            ? (zh ? "凭据已保存到本浏览器的 Course22 命名空间。" : "Receipt persisted in this browser's Course 22 namespace.")
            : (zh ? "浏览器存储不可用；请下载凭据。" : "Browser storage is unavailable; download the receipt.")}</p>
          <p className={copyMessage ? styles.statusMessage : styles.srOnly} role="status">{copyMessage}</p>
        </div>
      ) : null}
    </section>
  );
}
