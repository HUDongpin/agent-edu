"use client";

import { useState } from "react";
import { isCourseKitEvidenceReceipt } from "@/lib/course-kit/evidence-receipt";
import {
  courseKitCapstoneDraftKey,
  courseKitCapstoneVersionKey,
  isCourseKitCapstoneArtifactComplete,
  isCourseKitCapstoneComplete,
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
  useCourseKitProgress,
} from "./progress-store";
import styles from "./CourseKit.module.css";

type MaterialisedCapstone = CourseKitMaterialisedCourse["capstone"];

function storedArtifactDraft(value: unknown): string {
  return typeof value === "string" ? value.slice(0, 2000) : "";
}

function AuditIdList({ ids }: { readonly ids: readonly string[] }) {
  return ids.map((id, index) => (
    <span key={id}>
      {index > 0 ? ", " : null}
      <code lang="en" dir="ltr">{id}</code>
    </span>
  ));
}

export function CourseCapstone({
  capstone,
  config,
  labels,
  requireStructuredReceipts = true,
}: {
  readonly capstone: MaterialisedCapstone;
  readonly config: CourseKitProgressClientConfig;
  readonly labels: CourseKitUiCopy;
  readonly requireStructuredReceipts?: boolean;
}) {
  const { record } = useCourseKitProgress(config);
  const currentVersion =
    record[courseKitCapstoneVersionKey(config.courseId)] === capstone.version;
  const complete = isCourseKitCapstoneComplete(record, config);
  const [attested, setAttested] = useState(false);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const modulesComplete = config.moduleSlugs.every((moduleSlug) =>
    isCourseKitModuleComplete(record, config, moduleSlug)
  );
  const quizComplete = isCourseKitQuizComplete(record, config);
  const coursePrerequisitesComplete = modulesComplete && quizComplete;
  const artifactsComplete = capstone.artifacts.every((artifact) =>
    isCourseKitCapstoneArtifactComplete(record, config, artifact.id)
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
      <aside className={styles.capstoneEvidenceContract}>
        <h3>{labels.capstoneEvidenceContract}</h3>
        <p>
          <a href={capstone.evidenceContract.schemaPath} download>
            {labels.downloadArtifactSchema}
          </a>
          {" · "}
          <a href={capstone.evidenceContract.validatorPath} download>
            {labels.downloadValidator}
          </a>
        </p>
        <p>
          <strong>{labels.validatorCommand}:</strong>{" "}
          <code lang="en" dir="ltr">
            {capstone.evidenceContract.validatorCommand}
          </code>
        </p>
        <p>
          <code lang="en" dir="ltr">{capstone.evidenceContract.validatorId}</code>
        </p>
      </aside>
      {capstone.responsibleAiRubric.length ? (
        <section
          className={styles.responsibleAiGate}
          aria-labelledby={`${config.courseId}-responsible-ai-gate`}
        >
          <h3 id={`${config.courseId}-responsible-ai-gate`}>
            {labels.responsibleAiGate}
          </h3>
          {capstone.responsibleAiGate ? (
            <p>
              <code lang="en" dir="ltr">
                {capstone.responsibleAiGate.version}
              </code>
            </p>
          ) : null}
          <ul>
            {capstone.responsibleAiRubric.map((criterion, index) => {
              const mapping = capstone.responsibleAiGate?.criteria[index];
              return (
                <li key={mapping?.id ?? criterion} data-responsible-ai-criterion={mapping?.id}>
                  <span>{criterion}</span>
                  {mapping ? (
                    <small>
                      <code lang="en" dir="ltr">{mapping.id}</code>
                      {" · "}
                      {labels.responsibleAiAssessmentIds}: {" "}
                      <AuditIdList ids={mapping.questionIds} />
                      {" · "}
                      {labels.responsibleAiArtifactIds}: {" "}
                      <AuditIdList ids={mapping.artifactIds} />
                    </small>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      <fieldset>
        <legend>{labels.capstoneArtifacts}</legend>
        <div className={styles.artifactChecklist}>
          {capstone.artifacts.map((artifact) => {
            const checked = isCourseKitCapstoneArtifactComplete(
              record,
              config,
              artifact.id,
            );
            const draft = currentVersion
              ? storedArtifactDraft(
                  record[
                    courseKitCapstoneDraftKey(config.courseId, artifact.id)
                  ],
                )
              : "";
            const hasEvidenceNote = requireStructuredReceipts
              ? isCourseKitEvidenceReceipt(draft, {
                  kind: "capstone-artifact",
                  courseId: config.courseId,
                  courseVersion: config.courseVersion,
                  artifactId: artifact.id,
                  validatorId: config.evidenceValidatorId,
                  validatorCommandPrefix: config.evidenceValidatorCommandPrefix,
                })
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
                  <span>{labels.artifactDraftLabel}</span>
                  <textarea
                    value={draft}
                    disabled={complete}
                    maxLength={2000}
                    placeholder={labels.artifactDraftPlaceholder}
                    onChange={(event) => {
                      setPersisted(
                        setCourseKitCapstoneDraft(
                          config,
                          artifact.id,
                          event.currentTarget.value,
                        ),
                      );
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
          disabled={
            !coursePrerequisitesComplete
            || !artifactsComplete
            || (!attested && !complete)
            || complete
          }
          onClick={() => setPersisted(setCourseKitCapstoneComplete(config))}
        >
          {complete ? labels.capstoneComplete : labels.markCapstoneComplete}
        </button>
        <p role="status" aria-live="polite">
          {complete
            ? labels.capstoneComplete
            : !coursePrerequisitesComplete
              ? labels.completeCourseFirst
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
