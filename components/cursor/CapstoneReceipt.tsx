"use client";

import { useEffect, useRef, useState } from "react";
import {
  CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY,
  CURSOR_CAPSTONE_META_PROGRESS_KEY,
  CURSOR_CAPSTONE_PROGRESS_META,
  CURSOR_CAPSTONE_PROGRESS_KEY,
  createCursorCapstoneProgressAssessment,
  getCursorCapstoneProgressAssessment,
  isCursorCapstoneProgressPassed,
  validateCursorCapstoneReceipt,
  type CursorCapstoneReceiptValidationCode,
  type CursorCourseCopy,
} from "@/lib/cursor";
import { applyCursorProgressPatch } from "./progress-store";
import {
  CURSOR_ASSESSMENT_DRAFT_RESET_EVENT,
  CURSOR_CAPSTONE_DRAFT_STORAGE_KEY,
  CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY,
  clearMemoryDraft,
  clearSessionDraft,
  readMemoryDraft,
  readSessionDraft,
  writeMemoryDraft,
  writeSessionDraft,
} from "./session-draft-store";
import useCourseProgress, { useCourseStorageAvailable } from "./useCourseProgress";
import styles from "./CursorCourse.module.css";

const STARTER_DOWNLOAD = "/courses/cursor/aicourse-cursor-demo-v1.zip";
const STARTER_CHECKSUM = "/courses/cursor/aicourse-cursor-demo-v1.sha256";
const CAPSTONE_DRAFT_SCHEMA_VERSION = 1;

type Config = {
  readonly receiptSchema: string;
  readonly receiptVersion: string;
  readonly fixtureVersion: string;
  readonly fixtureSha256: string;
  readonly archiveSha256: string;
  readonly requiredChecks: readonly string[];
  readonly artifactIds: readonly string[];
  readonly rubric: readonly { readonly id: string; readonly weight: number }[];
  readonly passingScore: number;
};

type CapstoneAssessmentDraft = {
  readonly schemaVersion: typeof CAPSTONE_DRAFT_SCHEMA_VERSION;
  readonly receiptSchema: string;
  readonly receiptVersion: string;
  readonly fixtureVersion: string;
  readonly fixtureSha256: string;
  readonly archiveSha256: string;
  readonly artifactIds: readonly string[];
  readonly rubricIds: readonly string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

function isUniqueStringSubset(value: unknown, allowed: ReadonlySet<string>): value is string[] {
  return Array.isArray(value)
    && value.every((item) => typeof item === "string" && allowed.has(item))
    && new Set(value).size === value.length;
}

function isValidCapstoneDraft(value: unknown, config: Config): value is CapstoneAssessmentDraft {
  if (!isRecord(value) || !hasExactKeys(value, [
    "schemaVersion",
    "receiptSchema",
    "receiptVersion",
    "fixtureVersion",
    "fixtureSha256",
    "archiveSha256",
    "artifactIds",
    "rubricIds",
  ])) return false;

  return value.schemaVersion === CAPSTONE_DRAFT_SCHEMA_VERSION
    && value.receiptSchema === config.receiptSchema
    && value.receiptVersion === config.receiptVersion
    && value.fixtureVersion === config.fixtureVersion
    && value.fixtureSha256 === config.fixtureSha256
    && value.archiveSha256 === config.archiveSha256
    && isUniqueStringSubset(value.artifactIds, new Set(config.artifactIds))
    && isUniqueStringSubset(value.rubricIds, new Set(config.rubric.map((item) => item.id)));
}

function isInternalNavigationClick(event: MouseEvent): boolean {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }
  if (!(event.target instanceof Element)) return false;

  // The shared language menu uses a button followed by a full document load.
  // Re-selecting the current locale only closes the menu and must not prompt
  // the learner to discard a receipt that is staying on the same document.
  const languageItem = event.target.closest<HTMLElement>('.langmenu [role="menuitem"]');
  if (languageItem) return languageItem.lang !== document.documentElement.lang;

  const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
  if (!anchor
    || anchor.hasAttribute("download")
    || (anchor.target && anchor.target !== "_self")) {
    return false;
  }

  const destination = new URL(anchor.href, window.location.href);
  if (destination.origin !== window.location.origin) return false;
  const current = new URL(window.location.href);
  const sameDocument = destination.pathname === current.pathname
    && destination.search === current.search;
  return !sameDocument;
}

function validationMessage(
  code: CursorCapstoneReceiptValidationCode,
  labels: CursorCourseCopy["ui"],
): string {
  switch (code) {
    case "valid":
      return labels.receiptValid;
    case "invalid-json":
      return labels.receiptInvalidJson;
    case "wrong-schema":
      return labels.receiptWrongSchema;
    case "wrong-version":
      return labels.receiptWrongVersion;
    case "wrong-hash":
      return labels.receiptWrongHash;
    case "incomplete":
      return labels.receiptIncomplete;
  }
}

export default function CapstoneReceipt({
  config,
  copy,
  labels,
}: {
  config: Config;
  copy: CursorCourseCopy["capstone"];
  labels: CursorCourseCopy["ui"];
}) {
  const progress = useCourseProgress();
  const storageAvailable = useCourseStorageAvailable();
  const [input, setInput] = useState(() => {
    return readMemoryDraft(CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY) ?? "";
  });
  const [validationCode, setValidationCode] = useState<CursorCapstoneReceiptValidationCode | null>(null);
  const [artifactChecks, setArtifactChecks] = useState<Record<string, boolean>>({});
  const [rubricChecks, setRubricChecks] = useState<Record<string, boolean>>({});
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [draftStorageAvailable, setDraftStorageAvailable] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [progressCommitFailed, setProgressCommitFailed] = useState(false);
  const draftResetGeneration = useRef(0);
  const verifiedHeading = useRef<HTMLHeadingElement>(null);
  const errorMessage = useRef<HTMLParagraphElement>(null);
  const allowNextUnload = useRef(false);
  const verificationInFlight = useRef(false);
  const completedAssessment = getCursorCapstoneProgressAssessment(progress);
  const completed = isCursorCapstoneProgressPassed(progress);
  const staleCompletion = progress[CURSOR_CAPSTONE_PROGRESS_KEY] === true && !completed;
  const artifactPacketReady = config.artifactIds.every((id) => (
    completed
      ? completedAssessment?.artifactIds.includes(id) === true
      : artifactChecks[id] === true
  ));
  const rubricScore = completedAssessment
    ? completedAssessment.score
    : config.rubric.reduce((score, item) => score + (rubricChecks[item.id] ? item.weight : 0), 0);
  const criticalRubricReady = completed
    ? completedAssessment?.rubricIds.includes("safety") === true
      && completedAssessment.rubricIds.includes("verification")
    : rubricChecks.safety === true && rubricChecks.verification === true;
  const selfAuditPassed = artifactPacketReady
    && rubricScore >= config.passingScore
    && criticalRubricReady;
  const hasReceiptText = input.length > 0;
  const hasChecklistDraft = Object.values(artifactChecks).some(Boolean)
    || Object.values(rubricChecks).some(Boolean);

  useEffect(() => {
    const hydrationGeneration = draftResetGeneration.current;
    if (completed) {
      clearSessionDraft(CURSOR_CAPSTONE_DRAFT_STORAGE_KEY);
      const hydrationTimer = window.setTimeout(() => setDraftHydrated(true), 0);
      return () => window.clearTimeout(hydrationTimer);
    }

    const draft = readSessionDraft(
      CURSOR_CAPSTONE_DRAFT_STORAGE_KEY,
      (value): value is CapstoneAssessmentDraft => isValidCapstoneDraft(value, config),
    );
    const hydrationTimer = window.setTimeout(() => {
      if (draft && hydrationGeneration === draftResetGeneration.current) {
        setArtifactChecks(Object.fromEntries(draft.artifactIds.map((id) => [id, true])));
        setRubricChecks(Object.fromEntries(draft.rubricIds.map((id) => [id, true])));
      }
      setDraftHydrated(true);
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, [completed, config]);

  useEffect(() => {
    const resetAssessment = () => {
      draftResetGeneration.current += 1;
      setInput("");
      setValidationCode(null);
      setArtifactChecks({});
      setRubricChecks({});
      setDraftHydrated(true);
      setDraftStorageAvailable(true);
      setIsVerifying(false);
      setProgressCommitFailed(false);
      allowNextUnload.current = false;
      verificationInFlight.current = false;
    };
    window.addEventListener(CURSOR_ASSESSMENT_DRAFT_RESET_EVENT, resetAssessment);
    return () => window.removeEventListener(CURSOR_ASSESSMENT_DRAFT_RESET_EVENT, resetAssessment);
  }, []);

  useEffect(() => {
    if (!draftHydrated) return;
    let persisted = true;
    if (completed) {
      persisted = clearSessionDraft(CURSOR_CAPSTONE_DRAFT_STORAGE_KEY).persisted;
    } else {
      const artifactIds = config.artifactIds.filter((id) => artifactChecks[id] === true);
      const rubricIds = config.rubric
        .filter((item) => rubricChecks[item.id] === true)
        .map((item) => item.id);
      if (!artifactIds.length && !rubricIds.length) {
        persisted = clearSessionDraft(CURSOR_CAPSTONE_DRAFT_STORAGE_KEY).persisted;
      } else {
        // Only public checklist IDs enter session storage. Receipt text, paths,
        // logs, and command output remain exclusively in component memory.
        persisted = writeSessionDraft(CURSOR_CAPSTONE_DRAFT_STORAGE_KEY, {
          schemaVersion: CAPSTONE_DRAFT_SCHEMA_VERSION,
          receiptSchema: config.receiptSchema,
          receiptVersion: config.receiptVersion,
          fixtureVersion: config.fixtureVersion,
          fixtureSha256: config.fixtureSha256,
          archiveSha256: config.archiveSha256,
          artifactIds,
          rubricIds,
        } satisfies CapstoneAssessmentDraft).persisted;
      }
    }
    const availabilityTimer = window.setTimeout(() => setDraftStorageAvailable(persisted), 0);
    return () => window.clearTimeout(availabilityTimer);
  }, [artifactChecks, completed, config, draftHydrated, rubricChecks]);

  useEffect(() => {
    if (draftStorageAvailable || !hasChecklistDraft) return;
    const guardFullUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guardFullUnload);
    return () => window.removeEventListener("beforeunload", guardFullUnload);
  }, [draftStorageAvailable, hasChecklistDraft]);

  useEffect(() => {
    if (!hasReceiptText) return;

    const guardFullUnload = (event: BeforeUnloadEvent) => {
      if (allowNextUnload.current) return;
      event.preventDefault();
      // Browsers intentionally replace custom beforeunload copy with a
      // browser-owned message; internal links use the localized copy below.
      event.returnValue = "";
    };
    const guardInternalNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || !isInternalNavigationClick(event)) return;
      if (window.confirm(labels.discardDraftConfirm)) {
        clearMemoryDraft(CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY);
        allowNextUnload.current = true;
        window.setTimeout(() => {
          allowNextUnload.current = false;
        }, 0);
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    };

    window.addEventListener("beforeunload", guardFullUnload);
    document.addEventListener("click", guardInternalNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", guardFullUnload);
      document.removeEventListener("click", guardInternalNavigation, true);
    };
  }, [hasReceiptText, labels.discardDraftConfirm]);

  useEffect(() => {
    if (validationCode === "valid" && completed) verifiedHeading.current?.focus();
    else if (validationCode) errorMessage.current?.focus();
  }, [completed, validationCode]);

  return (
    <section
      className={`${styles.capstoneSection} ${styles.lessonAnchor}`}
      id="cursor-lesson-capstone"
      aria-labelledby="cursor-capstone-title"
      data-testid="cursor-capstone"
      tabIndex={-1}
    >
      <header className={styles.capstoneHeader}>
        <div>
          <p className={styles.kicker}>{labels.capstonePath}</p>
          <h2 id="cursor-capstone-title">{copy.title}</h2>
          <p>{copy.summary}</p>
        </div>
        <div className={styles.capstoneScore} aria-label={labels.score} data-testid="cursor-capstone-score">
          <strong>{rubricScore}</strong>
          <span>{labels.score} / 100</span>
        </div>
      </header>

      <p className={styles.capstoneScenario}>{copy.scenario}</p>

      <ol className={styles.capstoneSteps}>
        {copy.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}
      </ol>

      <div className={styles.capstoneForm} data-testid="cursor-capstone-assessment">
        <p className={styles.capstoneRetry}>{labels.learnerSelfAssessment}</p>
        <fieldset className={styles.capstoneChecklist} data-testid="cursor-capstone-artifacts">
          <legend>{labels.capstoneArtifacts}</legend>
          {config.artifactIds.map((id) => {
            const artifact = copy.artifacts[id];
            return (
              <label key={id}>
                <input
                  type="checkbox"
                  checked={completed
                    ? completedAssessment?.artifactIds.includes(id) === true
                    : artifactChecks[id] === true}
                  disabled={completed}
                  onChange={(event) => setArtifactChecks((current) => ({
                    ...current,
                    [id]: event.target.checked,
                  }))}
                />
                <span>
                  <strong>{artifact.title}</strong>
                  <small>{artifact.description}</small>
                </span>
              </label>
            );
          })}
        </fieldset>

        <fieldset className={styles.capstoneChecklist} data-testid="cursor-capstone-rubric">
          <legend>{labels.rubric}</legend>
          {config.rubric.map((item) => {
            const criterion = copy.rubric[item.id];
            return (
              <label key={item.id}>
                <input
                  type="checkbox"
                  checked={completed
                    ? completedAssessment?.rubricIds.includes(item.id) === true
                    : rubricChecks[item.id] === true}
                  disabled={completed}
                  onChange={(event) => setRubricChecks((current) => ({
                    ...current,
                    [item.id]: event.target.checked,
                  }))}
                />
                <span>
                  <strong>{criterion.title}</strong>
                  <small>{criterion.description}</small>
                </span>
              </label>
            );
          })}
        </fieldset>

        <p className={selfAuditPassed ? styles.capstonePass : styles.capstoneRetry} role="status">
          {selfAuditPassed ? copy.pass : copy.retry}
        </p>
      </div>

      <div className={styles.fixtureDownload}>
        <div>
          <strong>{labels.downloadStarter}</strong>
          <p>{labels.receiptInstructions}</p>
        </div>
        <div className={styles.fixtureActions}>
          <a className={styles.primaryAction} href={STARTER_DOWNLOAD} download data-course-action>
            {labels.downloadStarter}
          </a>
          <a className={styles.secondaryAction} href={STARTER_CHECKSUM} download data-course-action>
            {labels.downloadChecksum}
          </a>
        </div>
      </div>

      <dl className={styles.receiptRequirements}>
        <div>
          <dt>{labels.receiptSchemaLabel}</dt>
          <dd dir="ltr">{config.receiptSchema}</dd>
        </div>
        <div>
          <dt>{labels.fixtureVersionLabel}</dt>
          <dd dir="ltr">{config.fixtureVersion}</dd>
        </div>
        <div className={styles.hashRequirement}>
          <dt>{labels.archiveHashLabel}</dt>
          <dd className={styles.fixtureHash} dir="ltr">{config.archiveSha256}</dd>
        </div>
        <div className={styles.hashRequirement}>
          <dt>{labels.fixtureHashLabel}</dt>
          <dd className={styles.fixtureHash} dir="ltr">{config.fixtureSha256}</dd>
        </div>
      </dl>

      <div className={styles.requiredChecks}>
        <strong>{labels.requiredChecksLabel}</strong>
        <ul>
          {config.requiredChecks.map((check) => <li key={check}><code dir="ltr">{check}</code></li>)}
        </ul>
      </div>

      {!storageAvailable || (!draftStorageAvailable && hasChecklistDraft) || progressCommitFailed ? (
        <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p>
      ) : null}

      {staleCompletion ? (
        <p className={styles.storageWarning} role="status">
          {labels.savedCompletionMismatch}
        </p>
      ) : null}

      {!completed ? (
        <form
          className={styles.receiptVerifier}
          aria-busy={isVerifying}
          onSubmit={async (event) => {
            event.preventDefault();
            if (!selfAuditPassed || verificationInFlight.current) return;
            const validation = validateCursorCapstoneReceipt(input);
            if (!validation.valid) {
              setValidationCode(validation.code);
              return;
            }
            verificationInFlight.current = true;
            setIsVerifying(true);
            setProgressCommitFailed(false);
            try {
              const result = await applyCursorProgressPatch({
                set: {
                  // Store the completion Boolean plus public contract constants.
                  // Receipt text, paths, command output, and logs never enter browser storage.
                  [CURSOR_CAPSTONE_PROGRESS_KEY]: true,
                  // The companion prevents an old completion from being relabelled
                  // as a newer fixture check.
                  [CURSOR_CAPSTONE_META_PROGRESS_KEY]: { ...CURSOR_CAPSTONE_PROGRESS_META },
                  // Public self-assessment IDs preserve the learner's actual
                  // 80-or-higher rubric result instead of reconstructing 100/100.
                  [CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY]: createCursorCapstoneProgressAssessment(
                    artifactChecks,
                    rubricChecks,
                  ),
                },
              });
              clearSessionDraft(CURSOR_CAPSTONE_DRAFT_STORAGE_KEY);
              setValidationCode("valid");
              // Preserve the pasted receipt in component memory when persistence is denied so
              // an ephemeral completion never destroys the learner's only copy.
              if (result.persisted) {
                clearMemoryDraft(CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY);
                setInput("");
              }
            } catch {
              setProgressCommitFailed(true);
            } finally {
              verificationInFlight.current = false;
              setIsVerifying(false);
            }
          }}
        >
          <label htmlFor="cursor-capstone-receipt-input">{labels.pasteReceipt}</label>
          <textarea
            id="cursor-capstone-receipt-input"
            data-testid="cursor-capstone-receipt-input"
            dir="ltr"
            rows={12}
            value={input}
            disabled={!selfAuditPassed}
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => {
              const nextInput = event.target.value;
              setInput(nextInput);
              if (nextInput) writeMemoryDraft(CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY, nextInput);
              else clearMemoryDraft(CURSOR_CAPSTONE_RECEIPT_MEMORY_KEY);
              if (validationCode) setValidationCode(null);
            }}
          />
          {hasReceiptText ? (
            <p className={styles.storageWarning} role="status">
              {labels.draftNotSaved}
            </p>
          ) : null}
          {validationCode && validationCode !== "valid" ? (
            <p
              className={styles.receiptError}
              ref={errorMessage}
              role="alert"
              tabIndex={-1}
            >
              {validationMessage(validationCode, labels)}
            </p>
          ) : null}
          <button
            className={styles.primaryAction}
            type="submit"
            disabled={!selfAuditPassed || !input.trim() || isVerifying}
            data-course-action
          >
            {labels.verifyReceipt}
          </button>
        </form>
      ) : null}

      {completed ? (
        <article
          className={styles.receipt}
          aria-labelledby="cursor-receipt-title"
          data-testid="cursor-capstone-receipt"
          data-schema={config.receiptSchema}
          data-fixture-version={config.fixtureVersion}
          data-fixture-sha256={config.fixtureSha256}
          data-self-assessment-score={completedAssessment?.score}
        >
          <div className={styles.receiptHeading}>
            <div>
              <p>{labels.capstoneReceipt}</p>
              <h3 id="cursor-receipt-title" ref={verifiedHeading} tabIndex={-1}>
                {labels.receiptValid}
              </h3>
            </div>
            <strong>{labels.completed}</strong>
          </div>
          <dl>
            <div><dt>{labels.receiptSchemaLabel}</dt><dd dir="ltr">{config.receiptSchema}</dd></div>
            <div><dt>{labels.fixtureVersionLabel}</dt><dd dir="ltr">{config.fixtureVersion}</dd></div>
            <div><dt>{labels.status}</dt><dd>{labels.completed}</dd></div>
            <div>
              <dt>{labels.fixtureHashLabel}</dt>
              <dd className={styles.fixtureHash} dir="ltr">{config.fixtureSha256}</dd>
            </div>
          </dl>
          <p>{copy.completion}</p>
          {hasReceiptText ? (
            <div className={styles.receiptRecovery}>
              <p className={styles.storageWarning} role="status">{labels.draftNotSaved}</p>
              <label htmlFor="cursor-capstone-receipt-input">{labels.pasteReceipt}</label>
              <textarea
                id="cursor-capstone-receipt-input"
                data-testid="cursor-capstone-receipt-input"
                dir="ltr"
                rows={8}
                value={input}
                readOnly
                spellCheck={false}
              />
            </div>
          ) : null}
          <small>{storageAvailable ? labels.browserStorageNote : labels.storageUnavailable}</small>
          <button
            className={styles.secondaryAction}
            type="button"
            onClick={() => window.print()}
            data-course-action
          >
            {labels.printReceipt}
          </button>
        </article>
      ) : null}
    </section>
  );
}
