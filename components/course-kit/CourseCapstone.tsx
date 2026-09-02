"use client";

import { useState } from "react";
import Link from "next/link";
import {
  createCourseKitEvidenceReceiptTemplate,
  validateCourseKitEvidenceReceipt,
} from "@/lib/course-kit/evidence-receipt";
import {
  courseKitCapstoneArtifactKey,
  courseKitCapstoneCompleteKey,
  courseKitCapstoneDraftKey,
  courseKitCapstoneVersionKey,
  isCourseKitModuleComplete,
  isCourseKitQuizComplete,
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
  setCourseKitCapstoneIncomplete,
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
  requirePrerequisites = false,
  sourcesHref,
  sourceTitles,
  showIntro = true,
}: {
  readonly capstone: MaterialisedCapstone;
  readonly config: CourseKitProgressClientConfig;
  readonly labels: CourseKitUiCopy;
  readonly requireStructuredReceipts?: boolean;
  readonly requirePrerequisites?: boolean;
  readonly sourcesHref?: string;
  readonly sourceTitles?: Readonly<Record<string, string>>;
  readonly showIntro?: boolean;
}) {
  const { record } = useCourseKitProgress(config);
  const currentVersion =
    record[courseKitCapstoneVersionKey(config.courseId)] === capstone.version;
  const [attested, setAttested] = useState(false);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const artifactsComplete = capstone.artifacts.every(
    (artifact) => {
      if (!currentVersion
        || record[courseKitCapstoneArtifactKey(config.courseId, artifact.id)] !== true) {
        return false;
      }
      const draft = storedArtifactDraft(
        record[courseKitCapstoneDraftKey(config.courseId, artifact.id)],
      );
      return requireStructuredReceipts
        ? validateCourseKitEvidenceReceipt(draft, {
            expectedArtifactPath:
              `outputs/${config.courseId}/${artifact.id}.json`,
          }).valid
        : Boolean(draft.trim());
    },
  );
  const complete =
    currentVersion &&
    artifactsComplete &&
    record[courseKitCapstoneCompleteKey(config.courseId)] === true;
  const prerequisitesComplete = !requirePrerequisites || (
    config.moduleSlugs.every((moduleSlug) =>
      isCourseKitModuleComplete(record, config, moduleSlug)
    ) && isCourseKitQuizComplete(record, config)
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
        {showIntro ? <p>{capstone.intro}</p> : null}
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
            const draft = currentVersion
              ? storedArtifactDraft(
                  record[
                    courseKitCapstoneDraftKey(config.courseId, artifact.id)
                  ],
                )
              : "";
            const expectedReceiptPath =
              `outputs/${config.courseId}/${artifact.id}.json`;
            const receiptValidation = validateCourseKitEvidenceReceipt(draft, {
              expectedArtifactPath: expectedReceiptPath,
            });
            const hasEvidenceNote = requireStructuredReceipts
              ? receiptValidation.valid
              : Boolean(draft.trim());
            const checked =
              currentVersion &&
              hasEvidenceNote &&
              record[
                courseKitCapstoneArtifactKey(config.courseId, artifact.id)
              ] === true;
            const draftId = `${config.courseId}-${artifact.id}-draft`;
            const draftHelpId = `${draftId}-help`;
            const draftStatusId = `${draftId}-status`;
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
                    <em>{labels.evidenceModeLabels[artifact.evidenceMode]}</em>
                    <strong>{artifact.title}</strong>
                    <small>{artifact.description}</small>
                  </span>
                </label>
                {sourcesHref && artifact.sourceIds.length ? (
                  <nav className={styles.artifactSources} aria-label={labels.sources}>
                    {artifact.sourceIds.map((sourceId) => (
                      <Link href={`${sourcesHref}#source-${sourceId}`} key={sourceId}>
                        {sourceTitles?.[sourceId] ?? `${labels.source}: ${sourceId}`}
                      </Link>
                    ))}
                  </nav>
                ) : null}
                <label className={styles.artifactDraft}>
                  <span>
                    {requireStructuredReceipts
                      ? labels.evidenceReceiptLabel
                      : labels.artifactDraftLabel}
                  </span>
                  <textarea
                    id={draftId}
                    name={`${config.courseId}-${artifact.id}-evidence-receipt`}
                    value={draft}
                    disabled={complete}
                    maxLength={2000}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    dir="ltr"
                    aria-invalid={
                      requireStructuredReceipts && draft && !receiptValidation.valid
                        ? true
                        : undefined
                    }
                    aria-describedby={`${draftHelpId} ${draftStatusId}`}
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
                  <small id={draftHelpId}>
                    {requireStructuredReceipts
                      ? (
                          <>
                            {labels.artifactReceiptHelp}{" "}
                            <code>{expectedReceiptPath}</code>
                          </>
                        )
                      : labels.artifactDraftHelp}
                  </small>
                  <small
                    id={draftStatusId}
                    className={styles.receiptValidation}
                    data-valid={receiptValidation.valid || undefined}
                    aria-live="polite"
                  >
                    {requireStructuredReceipts && draft
                      ? receiptValidation.valid
                        ? labels.evidenceReceiptValid
                        : labels.evidenceReceiptInvalid
                      : ""}
                  </small>
                </label>
                {requireStructuredReceipts && !complete && !draft ? (
                  <button
                    type="button"
                    className={styles.receiptTemplateButton}
                    onClick={() => setPersisted(setCourseKitCapstoneDraft(
                      config,
                      artifact.id,
                      createCourseKitEvidenceReceiptTemplate(
                        expectedReceiptPath,
                      ),
                    ))}
                  >
                    {labels.insertEvidenceReceiptTemplate}
                  </button>
                ) : null}
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
          disabled={
            !complete && (
              !prerequisitesComplete || !artifactsComplete || !attested
            )
          }
          onClick={() => setPersisted(
            complete
              ? setCourseKitCapstoneIncomplete(config)
              : setCourseKitCapstoneComplete(config)
          )}
        >
          {complete ? labels.reopenCapstone : labels.markCapstoneComplete}
        </button>
        <p role="status" aria-live="polite">
          {complete
            ? labels.capstoneComplete
            : !prerequisitesComplete
              ? labels.completeCourseBeforeCapstone
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
