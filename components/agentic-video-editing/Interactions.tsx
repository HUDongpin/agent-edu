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
  AGENTIC_VIDEO_EDITING_CAPSTONE_CHECKS_KEY,
  AGENTIC_VIDEO_EDITING_CAPSTONE_KEY,
  AGENTIC_VIDEO_EDITING_PROGRESS_EVENT,
  AGENTIC_VIDEO_EDITING_PROGRESS_MILESTONES,
  AGENTIC_VIDEO_EDITING_PROGRESS_PREFIX,
  AGENTIC_VIDEO_EDITING_PROGRESS_VERSION_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_BEST_KEY,
  AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY,
  CUT_PLAN_LAB_FIXTURE,
  agenticVideoEditingArtifactKey,
  agenticVideoEditingCheckpointKey,
  agenticVideoEditingModuleProgressKey,
  buildCutPlanLabPlan,
  isCurrentAgenticVideoEditingProgress,
  validateCutPlanLabPlan,
  type AgenticVideoEditingCheckpointCopy,
  type AgenticVideoEditingCourseCopy,
  type AgenticVideoEditingFinalQuestionCopy,
  type AgenticVideoEditingModuleSlug,
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

const CAPSTONE_ATTESTED_KEY = "agentic-video-editing.capstone.attested";
const MINIMUM_ARTIFACT_CHARACTERS = 80;
const MINIMUM_CHANGED_ARTIFACT_LINES = 3;
const MINIMUM_CHANGED_ARTIFACT_CHARACTERS = 40;

function artifactEvidence(
  value: string,
  template: string,
): { substantiveCharacters: number; changedLines: number; ready: boolean } {
  const starterLines = new Set(
    template.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean),
  );
  const changed = value
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line && !starterLines.has(line));
  const substantiveCharacters = value.replace(/\s/gu, "").length;
  const changedCharacters = changed.join("").replace(/\s/gu, "").length;
  return {
    substantiveCharacters,
    changedLines: changed.length,
    ready: substantiveCharacters >= MINIMUM_ARTIFACT_CHARACTERS
      && changed.length >= MINIMUM_CHANGED_ARTIFACT_LINES
      && changedCharacters >= MINIMUM_CHANGED_ARTIFACT_CHARACTERS,
  };
}

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
    const completedModules = modules.filter(
      (module) => progress[agenticVideoEditingModuleProgressKey(module.slug)] === true,
    ).length;
    const assessmentPassed = progress[AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY] === true;
    const capstoneComplete = progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY] === true;
    const completed = completedModules + Number(assessmentPassed) + Number(capstoneComplete);
    const nextModule = modules.find(
      (module) => progress[agenticVideoEditingModuleProgressKey(module.slug)] !== true,
    );
    const nextHref = nextModule?.href
      ?? (!assessmentPassed
        ? "#agentic-video-editing-assessment"
        : !capstoneComplete
          ? "#agentic-video-editing-capstone"
          : null);
    return {
      completed,
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
        <div><dt>{label(labels, "modules", "Modules")}</dt><dd>{state.completedModules} / {modules.length}</dd></div>
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
  slug,
  practice,
  labels,
}: {
  slug: AgenticVideoEditingModuleSlug;
  practice: AgenticVideoEditingPracticeCopy;
  labels: Labels;
}) {
  const { progress, storageAvailable } = useCourseProgress();
  const key = agenticVideoEditingArtifactKey(slug);
  const persisted = typeof progress[key] === "string" ? String(progress[key]) : "";
  const [draftState, setDraftState] = useState(() => ({
    persistedBasis: persisted,
    value: persisted || practice.template,
  }));
  const draft = draftState.persistedBasis === persisted
    ? draftState.value
    : persisted || practice.template;
  const [announcement, setAnnouncement] = useState("");
  const id = useId();
  const evidence = artifactEvidence(draft, practice.template);

  return (
    <div className={styles.artifactWorkbench}>
      <div className={styles.workbenchTopline}>
        <div>
          <p className={styles.eyebrow}>{label(labels, "artifact", "Artifact")}</p>
          <h3>{practice.artifact}</h3>
        </div>
        <span>{evidence.substantiveCharacters} / {MINIMUM_ARTIFACT_CHARACTERS}+ · {evidence.changedLines} / {MINIMUM_CHANGED_ARTIFACT_LINES} {label(labels, "changedLines", "changed lines")}</span>
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
      {!storageAvailable ? <StorageWarning labels={labels} /> : null}
      <div className={styles.buttonRow}>
        <button
          className={styles.primaryButton}
          type="button"
          disabled={!evidence.ready}
          onClick={() => {
            const didPersist = updateAgenticVideoEditingProgress((record) => {
              record[key] = draft;
            });
            setAnnouncement(didPersist
              ? label(labels, "artifactSaved", "Artifact saved locally.")
              : label(labels, "resetDoneMemory", "Saved for this tab."));
          }}
        >{label(labels, "saveArtifact", "Save artifact")}</button>
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
  slug,
  template,
  labels,
}: {
  slug: AgenticVideoEditingModuleSlug;
  template: string;
  labels: Labels;
}) {
  const { progress, storageAvailable } = useCourseProgress();
  const completeKey = agenticVideoEditingModuleProgressKey(slug);
  const checkpointPassed = progress[agenticVideoEditingCheckpointKey(slug)] === true;
  const artifact = progress[agenticVideoEditingArtifactKey(slug)];
  const artifactReady = typeof artifact === "string"
    && artifactEvidence(artifact, template).ready;
  const complete = progress[completeKey] === true;
  const ready = checkpointPassed && artifactReady;

  return (
    <section className={styles.moduleCompletion} aria-labelledby={`completion-${slug}`}>
      <div>
        <p className={styles.eyebrow}>{label(labels, "moduleRecord", "Module record")}</p>
        <h2 id={`completion-${slug}`}>{complete ? label(labels, "moduleComplete", "Module complete") : label(labels, "moduleIncomplete", "Complete the evidence gate")}</h2>
        <p>{label(labels, "completionInstruction", "Pass the checkpoint and save an artifact.")}</p>
        <ul>
          <li data-complete={checkpointPassed || undefined}><span aria-hidden="true">{checkpointPassed ? "✓" : "○"}</span>{checkpointPassed ? label(labels, "checkpointRequirement", "Checkpoint passed") : label(labels, "checkpointPending", "Checkpoint pending")}</li>
          <li data-complete={artifactReady || undefined}><span aria-hidden="true">{artifactReady ? "✓" : "○"}</span>{artifactReady ? label(labels, "artifactRequirement", "Artifact saved") : label(labels, "artifactPending", "Artifact pending")}</li>
        </ul>
        {!storageAvailable ? <StorageWarning labels={labels} /> : null}
      </div>
      <button
        className={complete ? styles.completeButton : styles.primaryButton}
        type="button"
        disabled={!ready || complete}
        onClick={() => updateAgenticVideoEditingProgress((record) => { record[completeKey] = true; })}
      >{complete ? label(labels, "complete", "Complete") : label(labels, "markComplete", "Mark complete")}</button>
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
  const alreadyPassed = progress[AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY] === true;

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
            if (passed) record[AGENTIC_VIDEO_EDITING_QUIZ_PASSED_KEY] = true;
          });
          setResult({ score, passed, criticalMiss });
        }}
      >{label(labels, "submitAssessment", "Score assessment")}</button>
      {result ? (
        <div className={styles.assessmentResult} data-passed={result.passed || undefined} role="status" tabIndex={-1} ref={resultRef}>
          <strong>{label(labels, "score", "Score")}: {result.score}%</strong>
          <p>{result.passed ? label(labels, "assessmentPassed", "Assessment passed") : label(labels, "assessmentRetry", "Try again")}</p>
          {!result.passed && alreadyPassed ? (
            <p>{label(labels, "earlierPassRetained", "Your earlier passing record remains saved; this attempt did not pass.")}</p>
          ) : null}
          {result.criticalMiss ? <p>{label(labels, "criticalMiss", "A critical question is incorrect.")}</p> : null}
          {!result.passed ? (
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
  artifacts: readonly string[];
  statement: string;
  labels: Labels;
}) {
  const { progress, storageAvailable } = useCourseProgress();
  const persistedChecks = Array.isArray(progress[AGENTIC_VIDEO_EDITING_CAPSTONE_CHECKS_KEY])
    ? (progress[AGENTIC_VIDEO_EDITING_CAPSTONE_CHECKS_KEY] as unknown[]).map(Boolean).slice(0, artifacts.length)
    : [];
  const externalChecks = artifacts.map((_, index) => persistedChecks[index] ?? false);
  const externalAttested = progress[CAPSTONE_ATTESTED_KEY] === true;
  const externalBasis = JSON.stringify({
    checks: externalChecks,
    attested: externalAttested,
  });
  const [draft, setDraft] = useState(() => ({
    persistedBasis: externalBasis,
    checks: externalChecks,
    attested: externalAttested,
  }));
  const checks = draft.persistedBasis === externalBasis
    ? draft.checks
    : externalChecks;
  const attested = draft.persistedBasis === externalBasis
    ? draft.attested
    : externalAttested;
  const complete = progress[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY] === true;
  const ready = checks.length === AGENTIC_VIDEO_EDITING_CAPSTONE_ARTIFACT_COUNT
    && checks.every(Boolean) && attested;

  const persist = (nextChecks: boolean[], nextAttested: boolean) => {
    updateAgenticVideoEditingProgress((record) => {
      record[AGENTIC_VIDEO_EDITING_CAPSTONE_CHECKS_KEY] = nextChecks;
      record[CAPSTONE_ATTESTED_KEY] = nextAttested;
      if (!(nextChecks.every(Boolean) && nextAttested)) {
        delete record[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY];
      }
    });
  };

  return (
    <section className={styles.capstone} id="agentic-video-editing-capstone" aria-labelledby="agentic-video-capstone-title">
      <header className={styles.sectionHeader}>
        <p className={styles.eyebrow}>{label(labels, "capstone", "Capstone")}</p>
        <h2 id="agentic-video-capstone-title">{label(labels, "capstoneInstruction", "Point to each artifact.")}</h2>
      </header>
      <ol className={styles.capstoneList}>
        {artifacts.map((artifact, index) => (
          <li key={artifact}>
            <label>
              <input
                type="checkbox"
                checked={checks[index] ?? false}
                onChange={(event) => {
                  const next = [...checks];
                  next[index] = event.target.checked;
                  setDraft({
                    persistedBasis: JSON.stringify({ checks: next, attested }),
                    checks: next,
                    attested,
                  });
                  persist(next, attested);
                }}
              />
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{artifact}</strong>
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
              persistedBasis: JSON.stringify({ checks, attested: nextAttested }),
              checks,
              attested: nextAttested,
            });
            persist(checks, nextAttested);
          }}
        />
        <span>{statement}</span>
      </label>
      {!storageAvailable ? <StorageWarning labels={labels} /> : null}
      <button
        className={complete ? styles.completeButton : styles.primaryButton}
        type="button"
        disabled={!ready || complete}
        onClick={() => updateAgenticVideoEditingProgress((record) => {
          record[AGENTIC_VIDEO_EDITING_CAPSTONE_KEY] = true;
        })}
      >{complete ? label(labels, "capstoneComplete", "Capstone complete") : label(labels, "markComplete", "Mark complete")}</button>
    </section>
  );
}

export function CutPlanLab({ locale }: { locale: "en" | "zh-Hans" }) {
  const zh = locale === "zh-Hans";
  const [selected, setSelected] = useState<Record<string, boolean>>({ hook: true, context: true, method: true, close: true });
  const [reasons, setReasons] = useState<Record<string, string>>(
    Object.fromEntries(CUT_PLAN_LAB_FIXTURE.map((clip) => [clip.id, zh ? clip.defaultReasonZhHans : clip.defaultReason])),
  );
  const [target, setTarget] = useState(50);
  const [receipt, setReceipt] = useState<{ json: string; issues: CutPlanLabIssue[] } | null>(null);
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
      "unresolved-ambiguity": [`${subject}: ambiguity is unresolved.`, `${subject}：歧义尚未解决。`],
      "human-review-disabled": [`${subject}: required human review was disabled.`, `${subject}：必须的人审被关闭。`],
    };
    return messages[issue.code][zh ? 1 : 0];
  };

  return (
    <section className={styles.cutPlanLab} aria-labelledby="cut-plan-lab-title">
      <header>
        <p className={styles.eyebrow}>{zh ? "离线合同实验" : "Offline contract lab"}</p>
        <h2 id="cut-plan-lab-title">{zh ? "Cut Plan Lab：先验证计划，再渲染" : "Cut Plan Lab: validate before rendering"}</h2>
        <p>{zh ? "这是独立于 Harbor House 简报的原创文本 fixture；不会上传媒体、调用模型或执行 FFmpeg。它生成下载版 edit-plan v2 形状的阻断计划，再运行跨字段语义检查；真实执行仍须另做 hash、realpath、权利与人审。" : "This original text fixture is separate from the Harbor House brief; it uploads no media, calls no model, and runs no FFmpeg. It generates a blocked plan shaped like the downloadable edit-plan v2 contract, then runs cross-field semantic checks; real execution still needs hash, realpath, rights, and human review."}</p>
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
      <button className={styles.primaryButton} type="button" onClick={() => {
        const plan = buildCutPlanLabPlan(selectedClips, reasons, target);
        const issues = validateCutPlanLabPlan(plan);
        setReceipt({ json: JSON.stringify(plan, null, 2), issues });
      }}>{zh ? "生成并运行合同门" : "Generate and run contract gate"}</button>
      {receipt ? (
        <div className={styles.labReceipt} data-passed={!receipt.issues.length || undefined} role="status">
          <strong>{receipt.issues.length ? (zh ? "语义门发现阻断项" : "Semantic gate found blockers") : (zh ? "计划通过课程语义门" : "Plan passes the course semantic gate")}</strong>
          {receipt.issues.length ? <ul>{receipt.issues.map((issue, index) => <li key={`${issue.code}-${issue.subject ?? index}`}>{issueText(issue)}</li>)}</ul> : <p>{zh ? "计划仍固定为 blocked：它没有真实媒体/hash，也不是编辑、渲染或发布批准。" : "The plan remains blocked: it has no real media or hashes and is not edit, render, or release approval."}</p>}
          <pre tabIndex={0}><code>{receipt.json}</code></pre>
        </div>
      ) : null}
    </section>
  );
}
