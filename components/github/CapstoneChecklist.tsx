"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GITHUB_CAPSTONE_DRAFT_KEY,
  clearInvalidGithubCapstoneDraft,
  clearGithubCapstoneDraft,
  decodeGithubCapstoneDraft,
  setGithubCapstoneDraft,
  type GithubCapstoneDraftContext,
  type GithubCourseCopy,
} from "@/lib/github";
import GithubText from "./GithubText";
import {
  GITHUB_CAPSTONE_STORAGE_KEY,
  GITHUB_RESET_EVENT,
  updateCourseProgress,
} from "./progress-store";
import useGithubProgress, {
  useGithubStorageAvailable,
} from "./useGithubProgress";
import base from "@/components/codex/CodexCourse.module.css";
import styles from "./GithubCourse.module.css";

export const GITHUB_CAPSTONE_ARTIFACT_SET_VERSION =
  "github-capstone-artifacts-2026-08-30-v1";
const CAPSTONE_ERROR_ID = "github-capstone-validation-error";

export default function CapstoneChecklist({
  copy,
  labels,
  locale,
}: {
  copy: GithubCourseCopy["capstone"];
  labels: GithubCourseCopy["ui"];
  locale: string;
}) {
  const progress = useGithubProgress();
  const storageAvailable = useGithubStorageAvailable();
  const alreadyComplete = progress[GITHUB_CAPSTONE_STORAGE_KEY] === true;
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      copy.artifacts.map((artifact) => [artifact.id, alreadyComplete]),
    ),
  );
  const [attempted, setAttempted] = useState(false);
  const [draftStatus, setDraftStatus] = useState("");
  const [draftChoiceMade, setDraftChoiceMade] = useState(false);
  const capstoneAnchor = useRef<HTMLElement>(null);
  const validationFeedback = useRef<HTMLParagraphElement>(null);
  const completionFeedback = useRef<HTMLParagraphElement>(null);
  const focusAfterCompletion = useRef(false);
  const numberFormat = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const allChecked = useMemo(
    () => copy.artifacts.every((artifact) => checked[artifact.id]),
    [checked, copy.artifacts],
  );
  const complete =
    alreadyComplete || progress[GITHUB_CAPSTONE_STORAGE_KEY] === true;
  const draftContext = useMemo<GithubCapstoneDraftContext>(
    () => ({
      artifactSetVersion: GITHUB_CAPSTONE_ARTIFACT_SET_VERSION,
      artifactIds: copy.artifacts.map((artifact) => artifact.id),
    }),
    [copy.artifacts],
  );
  const storedDraftValue = progress[GITHUB_CAPSTONE_DRAFT_KEY];
  const hasStoredDraft = Object.hasOwn(progress, GITHUB_CAPSTONE_DRAFT_KEY);
  const resumableDraft = useMemo(
    () => decodeGithubCapstoneDraft(storedDraftValue, draftContext),
    [draftContext, storedDraftValue],
  );
  const hasCheckedDraft = Object.values(checked).some(Boolean);

  useEffect(() => {
    if (!complete || !focusAfterCompletion.current) return;
    focusAfterCompletion.current = false;
    const frame = window.requestAnimationFrame(() =>
      completionFeedback.current?.focus()
    );
    return () => window.cancelAnimationFrame(frame);
  }, [complete]);

  useEffect(() => {
    if (complete || !hasStoredDraft || resumableDraft) return;
    updateCourseProgress((record) => {
      clearInvalidGithubCapstoneDraft(record, draftContext);
    });
  }, [complete, draftContext, hasStoredDraft, resumableDraft]);

  useEffect(() => {
    const resetDraft = () => {
      setChecked(
        Object.fromEntries(copy.artifacts.map((artifact) => [artifact.id, false])),
      );
      setAttempted(false);
      setDraftStatus("");
      setDraftChoiceMade(false);
    };
    window.addEventListener(GITHUB_RESET_EVENT, resetDraft);
    return () => window.removeEventListener(GITHUB_RESET_EVENT, resetDraft);
  }, [copy.artifacts]);

  useEffect(() => {
    const focusHashTarget = () => {
      if (window.location.hash !== "#github-capstone") return;
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          capstoneAnchor.current?.focus({ preventScroll: true });
          capstoneAnchor.current?.scrollIntoView({ block: "start" });
        });
      });
    };
    focusHashTarget();
    window.addEventListener("hashchange", focusHashTarget);
    return () => window.removeEventListener("hashchange", focusHashTarget);
  }, []);

  function persistChecked(nextChecked: Record<string, boolean>) {
    const checkedArtifactIds = copy.artifacts
      .filter((artifact) => nextChecked[artifact.id])
      .map((artifact) => artifact.id);
    updateCourseProgress((record) => {
      if (checkedArtifactIds.length === 0) {
        clearGithubCapstoneDraft(record);
        return;
      }
      setGithubCapstoneDraft(record, { checkedArtifactIds }, draftContext);
    });
  }

  function resumeDraft() {
    if (!resumableDraft) return;
    const checkedIds = new Set(resumableDraft.checkedArtifactIds);
    setChecked(
      Object.fromEntries(
        copy.artifacts.map((artifact) => [artifact.id, checkedIds.has(artifact.id)]),
      ),
    );
    setAttempted(false);
    setDraftStatus(labels.capstoneDraftRestored);
    setDraftChoiceMade(true);
  }

  function discardDraft() {
    updateCourseProgress((record) => {
      clearGithubCapstoneDraft(record);
    });
    setChecked(
      Object.fromEntries(copy.artifacts.map((artifact) => [artifact.id, false])),
    );
    setAttempted(false);
    setDraftStatus(labels.capstoneDraftDiscarded);
    setDraftChoiceMade(true);
  }

  return (
    <section
      className={`${base.capstoneSection} ${styles.focusTarget}`}
      aria-labelledby="github-capstone-title"
      id="github-capstone"
      ref={capstoneAnchor}
      tabIndex={-1}
      data-testid="github-capstone"
    >
      <header className={base.capstoneHeader}>
        <div>
          <p className={base.kicker}>{labels.capstonePath}</p>
          <h2 id="github-capstone-title">
            <GithubText text={copy.title} />
          </h2>
          <p>
            <GithubText text={copy.summary} />
          </p>
        </div>
        <output className={base.capstoneScore} aria-live="polite">
          <strong>
            {numberFormat.format(
              complete
                ? copy.artifacts.length
                : Object.values(checked).filter(Boolean).length,
            )}
            /{numberFormat.format(copy.artifacts.length)}
          </strong>
          <span>{labels.capstoneArtifacts}</span>
        </output>
      </header>

      <p className={base.capstoneScenario}>
        <GithubText text={copy.scenario} />
      </p>
      <ol className={base.capstoneSteps}>
        {copy.steps.map((step) => (
          <li key={step}>
            <GithubText text={step} />
          </li>
        ))}
      </ol>

      {!storageAvailable ? (
        <p className={base.storageWarning} role="status">
          {labels.storageUnavailable}{" "}
          {hasCheckedDraft && !complete ? labels.draftStorageWarning : null}
        </p>
      ) : null}

      {draftStatus || (hasStoredDraft && !resumableDraft) ? (
        <p className={styles.draftStatus} role="status">
          {draftStatus || labels.draftInvalid}
        </p>
      ) : null}

      {!complete && resumableDraft && !draftChoiceMade ? (
        <div className={styles.draftPrompt}>
          <p>{labels.capstoneDraftAvailable}</p>
          <div className={styles.draftActions}>
            <button
              className={`${base.primaryAction} ${styles.courseAction}`}
              type="button"
              onClick={resumeDraft}
            >
              {labels.resumeCapstoneDraft}
            </button>
            <button
              className={`${base.secondaryAction} ${styles.courseAction}`}
              type="button"
              onClick={discardDraft}
            >
              {labels.discardCapstoneDraft}
            </button>
          </div>
        </div>
      ) : null}

      {!resumableDraft || draftChoiceMade || complete ? <form
        className={base.capstoneForm}
        onSubmit={(event) => {
          event.preventDefault();
          setAttempted(true);
          if (!allChecked) {
            window.requestAnimationFrame(() => validationFeedback.current?.focus());
            return;
          }
          focusAfterCompletion.current = true;
          updateCourseProgress((record) => {
            record[GITHUB_CAPSTONE_STORAGE_KEY] = true;
            clearGithubCapstoneDraft(record);
          });
        }}
      >
        <fieldset
          className={base.capstoneChecklist}
          disabled={complete}
          aria-invalid={attempted && !allChecked ? "true" : undefined}
          aria-describedby={
            attempted && !allChecked ? CAPSTONE_ERROR_ID : undefined
          }
        >
          <legend>{labels.capstoneArtifacts}</legend>
          {copy.artifacts.map((artifact) => (
            <label key={artifact.id}>
              <input
                type="checkbox"
                value={artifact.id}
                checked={complete || Boolean(checked[artifact.id])}
                onChange={(event) => {
                  const nextChecked = {
                    ...checked,
                    [artifact.id]: event.target.checked,
                  };
                  setChecked(nextChecked);
                  setDraftChoiceMade(true);
                  setAttempted(false);
                  setDraftStatus("");
                  persistChecked(nextChecked);
                }}
              />
              <span>
                <strong>
                  <GithubText text={artifact.title} />
                </strong>
                <small>
                  <GithubText text={artifact.description} />
                </small>
              </span>
            </label>
          ))}
        </fieldset>

        {complete ? (
          <p
            className={`${base.capstonePass} ${styles.focusTarget}`}
            ref={completionFeedback}
            role="status"
            tabIndex={-1}
          >
            {labels.capstoneComplete}
          </p>
        ) : attempted ? (
          <p
            className={`${base.capstoneRetry} ${styles.focusTarget}`}
            id={CAPSTONE_ERROR_ID}
            ref={validationFeedback}
            role="alert"
            tabIndex={-1}
          >
            {labels.capstoneIncomplete}
          </p>
        ) : null}

        {!complete ? (
          <button
            className={`${base.primaryAction} ${styles.courseAction}`}
            type="submit"
          >
            {labels.completeCapstone}
          </button>
        ) : null}
      </form> : null}

      <p className={styles.capstoneNotice}>
        <GithubText text={copy.completion} />
      </p>
    </section>
  );
}
