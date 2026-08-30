"use client";

import { useEffect, useRef } from "react";
import {
  CLAUDE_CAPSTONE_CRITICAL_CLEAR_KEY,
  CLAUDE_CAPSTONE_PROGRESS_KEY,
  claudeCapstoneArtifactProgressKey,
  claudeCapstoneRubricProgressKey,
  getClaudeCapstoneRubricScore,
  isClaudeCapstoneSelfAuditPassed,
  type ClaudeCapstoneArtifactId,
  type ClaudeCapstoneRubricId,
  type ClaudeCourseCopy,
} from "@/lib/claude";
import { updateCourseProgress } from "./progress-store";
import useCourseProgress, { useCourseStorageAvailable } from "./useCourseProgress";
import styles from "./ClaudeCourse.module.css";

const STARTER_DOWNLOAD = "/courses/claude/claude-capstone-brief.md";

type Config = {
  readonly schemaVersion: string;
  readonly artifactIds: readonly ClaudeCapstoneArtifactId[];
  readonly rubric: readonly { readonly id: ClaudeCapstoneRubricId; readonly weight: number }[];
  readonly passingScore: number;
  readonly progressKey: string;
};

export default function CapstonePortfolio({
  config,
  copy,
  labels,
}: {
  config: Config;
  copy: ClaudeCourseCopy["capstone"];
  labels: ClaudeCourseCopy["ui"];
}) {
  const progress = useCourseProgress();
  const storageAvailable = useCourseStorageAvailable();
  const completionHeading = useRef<HTMLHeadingElement>(null);
  const completed = isClaudeCapstoneSelfAuditPassed(progress);
  const completedArtifacts = config.artifactIds.filter(
    (id) => progress[claudeCapstoneArtifactProgressKey(id)] === true,
  );
  const rubricScore = getClaudeCapstoneRubricScore(progress);
  const criticalClear = progress[CLAUDE_CAPSTONE_CRITICAL_CLEAR_KEY] === true;
  const ready = completedArtifacts.length === config.artifactIds.length
    && rubricScore >= config.passingScore
    && criticalClear;

  useEffect(() => {
    if (completed) completionHeading.current?.focus();
  }, [completed]);

  return (
    <section
      className={styles.capstoneSection}
      aria-labelledby="claude-capstone-title"
      data-testid="claude-capstone"
    >
      <header className={styles.capstoneHeader}>
        <div>
          <p className={styles.kicker}>{labels.capstonePath}</p>
          <h2 id="claude-capstone-title">{copy.title}</h2>
          <p>{copy.summary}</p>
        </div>
      </header>

      <p className={styles.capstoneScenario}>{copy.scenario}</p>

      <ol className={styles.capstoneSteps}>
        {copy.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}
      </ol>

      <div className={styles.fixtureDownload}>
        <div>
          <strong>{labels.downloadStarter}</strong>
          <p>{labels.receiptInstructions}</p>
        </div>
        <a className={styles.primaryAction} href={STARTER_DOWNLOAD} download>
          {labels.downloadStarter}
        </a>
      </div>

      <div className={styles.requiredChecks}>
        <strong>{labels.capstoneArtifacts}</strong>
        <ul className={styles.portfolioChecklist}>
          {config.artifactIds.map((id) => {
            const item = copy.artifacts[id];
            const checked = progress[claudeCapstoneArtifactProgressKey(id)] === true;
            return (
              <li key={id}>
                <label>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={completed}
                    onChange={(event) => {
                      updateCourseProgress((record) => {
                        record[claudeCapstoneArtifactProgressKey(id)] = event.target.checked;
                        delete record[CLAUDE_CAPSTONE_PROGRESS_KEY];
                      });
                    }}
                  />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={styles.rubricList}>
        <h3>{labels.rubric}</h3>
        <ul>
          {config.rubric.map((criterion) => {
            const item = copy.rubric[criterion.id];
            const scoreKey = claudeCapstoneRubricProgressKey(criterion.id);
            const storedScore = progress[scoreKey];
            const score = typeof storedScore === "number"
              && Number.isInteger(storedScore)
              && storedScore >= 0
              && storedScore <= criterion.weight
              ? storedScore
              : 0;
            return (
              <li key={criterion.id}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{labels.weight}: {criterion.weight}</span>
                </div>
                <p>{item.description}</p>
                <label className={styles.rubricScore}>
                  <span>{labels.score}</span>
                  <input
                    type="number"
                    min={0}
                    max={criterion.weight}
                    step={1}
                    value={score}
                    disabled={completed}
                    aria-label={`${labels.score}: ${item.title}`}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      const bounded = Number.isFinite(value)
                        ? Math.max(0, Math.min(criterion.weight, Math.trunc(value)))
                        : 0;
                      updateCourseProgress((record) => {
                        record[scoreKey] = bounded;
                        delete record[CLAUDE_CAPSTONE_PROGRESS_KEY];
                      });
                    }}
                  />
                  <span>/ {criterion.weight}</span>
                </label>
              </li>
            );
          })}
        </ul>
        <p><strong>{labels.score}: {rubricScore}/100 · {labels.passingScore}: {config.passingScore}/100.</strong></p>
        <label className={styles.criticalAttestation}>
          <input
            type="checkbox"
            data-testid="claude-capstone-critical-attestation"
            checked={criticalClear}
            disabled={completed}
            onChange={(event) => {
              updateCourseProgress((record) => {
                record[CLAUDE_CAPSTONE_CRITICAL_CLEAR_KEY] = event.target.checked;
                delete record[CLAUDE_CAPSTONE_PROGRESS_KEY];
              });
            }}
          />
          <span>{copy.pass}</span>
        </label>
        <p>{copy.retry}</p>
      </div>

      {!storageAvailable ? (
        <p className={styles.storageWarning} role="status">{labels.storageUnavailable}</p>
      ) : null}

      {!completed ? (
        <button
          className={styles.primaryAction}
          type="button"
          disabled={!ready}
          onClick={() => {
            updateCourseProgress((record) => {
              record[CLAUDE_CAPSTONE_PROGRESS_KEY] = true;
            });
          }}
        >
          {ready ? labels.recordCompletion : `${completedArtifacts.length}/${config.artifactIds.length} · ${labels.requiredChecksLabel}`}
        </button>
      ) : (
        <article
          className={styles.receipt}
          aria-labelledby="claude-portfolio-record-title"
          data-testid="claude-capstone-record"
          data-schema-version={config.schemaVersion}
        >
          <div className={styles.receiptHeading}>
            <div>
              <p>{labels.capstoneReceipt}</p>
              <h3 id="claude-portfolio-record-title" ref={completionHeading} tabIndex={-1}>
                {labels.receiptValid}
              </h3>
            </div>
            <strong>{labels.completed}</strong>
          </div>
          <p>{copy.completion}</p>
          <small>{labels.receiptInstructions} {labels.browserStorageNote}</small>
          <button className={styles.secondaryAction} type="button" onClick={() => window.print()}>
            {labels.printReceipt}
          </button>
        </article>
      )}
    </section>
  );
}
