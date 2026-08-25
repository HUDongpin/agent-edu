"use client";

import { useState } from "react";
import { isCourseKitEvidenceReceipt } from "@/lib/course-kit/evidence-receipt";
import {
  courseKitCapstoneArtifactKey,
  courseKitCapstoneCompleteKey,
  courseKitCapstoneDraftKey,
  courseKitCapstoneVersionKey,
} from "@/lib/course-kit/progress";
import type {
  CourseKitMaterialisedCourse,
  CourseKitProgressClientConfig,
  CourseKitUiCopy,
} from "@/lib/course-kit/types";
import {
  setCourseKitCapstoneArtifact,
  setCourseKitCapstoneComplete,
  setCourseKitCapstoneDraft,
  useCourseKitProgress,
} from "./progress-store";
import styles from "./CourseKit.module.css";

type MaterialisedCapstone = CourseKitMaterialisedCourse["capstone"];

function storedArtifactDraft(value: unknown): string {
  return typeof value === "string" ? value.slice(0, 2000) : "";
}

export function CourseCapstone({
  capstone,
  config,
  labels,
  requireStructuredReceipts = false,
}: {
  readonly capstone: MaterialisedCapstone;
  readonly config: CourseKitProgressClientConfig;
  readonly labels: CourseKitUiCopy;
  readonly requireStructuredReceipts?: boolean;
}) {
  const { record } = useCourseKitProgress(config);
  const currentVersion =
    record[courseKitCapstoneVersionKey(config.courseId)] === capstone.version;
  const complete =
    currentVersion &&
    record[courseKitCapstoneCompleteKey(config.courseId)] === true;
  const [attested, setAttested] = useState(false);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const artifactsComplete = capstone.artifacts.every(
    (artifact) =>
      currentVersion &&
      record[courseKitCapstoneArtifactKey(config.courseId, artifact.id)] ===
        true,
  );

  return (
    <section
      className={styles.capstone}
      id="capstone"
      aria-labelledby={`${config.courseId}-capstone-title`}
    >
      <header className={styles.sectionIntro}>
        <p className={styles.eyebrow}>{labels.capstone}</p>
        <h2 id={`${config.courseId}-capstone-title`}>{capstone.title}</h2>
        <p>{capstone.intro}</p>
      </header>
      <ol className={styles.capstoneInstructions}>
        {capstone.instructions.map((instruction) => (
          <li key={instruction}>{instruction}</li>
        ))}
      </ol>
      <fieldset>
        <legend>{labels.capstoneArtifacts}</legend>
        <div className={styles.artifactChecklist}>
          {capstone.artifacts.map((artifact) => {
            const checked =
              currentVersion &&
              record[
                courseKitCapstoneArtifactKey(config.courseId, artifact.id)
              ] === true;
            const draft = currentVersion
              ? storedArtifactDraft(
                  record[
                    courseKitCapstoneDraftKey(config.courseId, artifact.id)
                  ],
                )
              : "";
            const hasEvidenceNote = requireStructuredReceipts
              ? isCourseKitEvidenceReceipt(draft)
              : Boolean(draft.trim());
            return (
              <div className={styles.artifactItem} key={artifact.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!hasEvidenceNote || complete}
                    onChange={(event) => {
                      setPersisted(
                        setCourseKitCapstoneArtifact(
                          config,
                          artifact.id,
                          event.currentTarget.checked,
                        ),
                      );
                    }}
                  />
                  <span>
                    <strong>{artifact.title}</strong>
                    <small>{artifact.description}</small>
                  </span>
                </label>
                <label className={styles.artifactDraft}>
                  <span>
                    {requireStructuredReceipts
                      ? labels.evidenceReceiptLabel
                      : labels.artifactDraftLabel}
                  </span>
                  <textarea
                    value={draft}
                    disabled={complete}
                    maxLength={2000}
                    placeholder={
                      requireStructuredReceipts
                        ? labels.evidenceReceiptPlaceholder
                        : labels.artifactDraftPlaceholder
                    }
                    onChange={(event) => {
                      const draftPersisted = setCourseKitCapstoneDraft(
                        config,
                        artifact.id,
                        event.currentTarget.value,
                      );
                      const completionPersisted = requireStructuredReceipts && checked
                        ? setCourseKitCapstoneArtifact(config, artifact.id, false)
                        : true;
                      setPersisted(draftPersisted && completionPersisted);
                    }}
                  />
                  <small>
                    {requireStructuredReceipts
                      ? labels.artifactReceiptHelp
                      : labels.artifactDraftHelp}
                  </small>
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>
      <label className={styles.attestation}>
        <input
          type="checkbox"
          checked={attested || complete}
          disabled={complete}
          onChange={(event) => setAttested(event.currentTarget.checked)}
        />
        <span>{capstone.attestation || labels.capstoneAttestation}</span>
      </label>
      <div className={styles.capstoneActions}>
        <button
          type="button"
          disabled={!artifactsComplete || (!attested && !complete) || complete}
          onClick={() => setPersisted(setCourseKitCapstoneComplete(config))}
        >
          {complete ? labels.capstoneComplete : labels.markCapstoneComplete}
        </button>
        <p role="status" aria-live="polite">
          {complete
            ? labels.capstoneComplete
            : artifactsComplete && attested
              ? persisted === false
                ? labels.savedInMemory
                : labels.browserStorageNote
              : labels.completeArtifactsFirst}
        </p>
      </div>
    </section>
  );
}
