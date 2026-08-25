"use client";

import { useMemo, useState } from "react";
import type { GithubCourseCopy } from "@/lib/github";
import GithubText from "./GithubText";
import {
  GITHUB_CAPSTONE_STORAGE_KEY,
  updateCourseProgress,
} from "./progress-store";
import useGithubProgress, {
  useGithubStorageAvailable,
} from "./useGithubProgress";
import base from "@/components/codex/CodexCourse.module.css";
import styles from "./GithubCourse.module.css";

export default function CapstoneChecklist({
  copy,
  labels,
}: {
  copy: GithubCourseCopy["capstone"];
  labels: GithubCourseCopy["ui"];
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
  const allChecked = useMemo(
    () => copy.artifacts.every((artifact) => checked[artifact.id]),
    [checked, copy.artifacts],
  );
  const complete =
    alreadyComplete || progress[GITHUB_CAPSTONE_STORAGE_KEY] === true;

  return (
    <section
      className={base.capstoneSection}
      aria-labelledby="github-capstone-title"
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
            {complete ? 8 : Object.values(checked).filter(Boolean).length}/8
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
          {labels.storageUnavailable}
        </p>
      ) : null}

      <form
        className={base.capstoneForm}
        onSubmit={(event) => {
          event.preventDefault();
          setAttempted(true);
          if (!allChecked) return;
          updateCourseProgress((record) => {
            record[GITHUB_CAPSTONE_STORAGE_KEY] = true;
          });
        }}
      >
        <fieldset className={base.capstoneChecklist} disabled={complete}>
          <legend>{labels.capstoneArtifacts}</legend>
          {copy.artifacts.map((artifact) => (
            <label key={artifact.id}>
              <input
                type="checkbox"
                checked={complete || Boolean(checked[artifact.id])}
                onChange={(event) => {
                  setChecked((current) => ({
                    ...current,
                    [artifact.id]: event.target.checked,
                  }));
                  setAttempted(false);
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
          <p className={base.capstonePass} role="status">
            {labels.capstoneComplete}
          </p>
        ) : attempted ? (
          <p className={base.capstoneRetry} role="status">
            {labels.capstoneIncomplete}
          </p>
        ) : null}

        {!complete ? (
          <button className={base.primaryAction} type="submit">
            {labels.completeCapstone}
          </button>
        ) : null}
      </form>

      <p className={styles.capstoneNotice}>
        <GithubText text={copy.completion} />
      </p>
    </section>
  );
}
