import {
  AGENTIC_VIDEO_EDITING_COURSE_MANIFEST,
  agenticVideoEditingArtifactKey,
  agenticVideoEditingCheckpointKey,
  agenticVideoEditingModuleProgressKey,
  areCourse20ArtifactSubmissionsCurrent,
  createCourse20ArtifactSubmission,
  createCourse20ModuleReceipt,
  course20ReceiptFingerprint,
  getAgenticVideoEditingArtifactContract,
  getCourse20ArtifactSubmission,
  getCourse20ArtifactSubmissions,
  getCourse20PrimaryArtifactIdForModule,
  isCourse20CheckpointReceipt,
  isCourse20ModuleCurrent,
  markCourse20ArtifactDescendantsStale,
  type AgenticVideoEditingArtifactId,
  type AgenticVideoEditingModuleSlug,
  type Course20ArtifactSubmission,
  type Course20LearningPath,
} from "@/staging/course-src/agentic-video-editing";
import {
  readAgenticVideoEditingProgress,
  writeAgenticVideoEditingProgress,
} from "@/components/agentic-video-editing/progress-store";
export {
  AGENTIC_VIDEO_EDITING_CORRUPT_BACKUP_KEY,
  AGENTIC_VIDEO_EDITING_PROGRESS_PROBE_KEY,
  AGENTIC_VIDEO_EDITING_PROGRESS_STORAGE_KEY,
  AGENTIC_VIDEO_EDITING_SESSION_PROBE_KEY,
  clearAgenticVideoEditingSessionScratch,
  isAgenticVideoEditingPersistenceAvailable,
  isAgenticVideoEditingProgressStorageEvent,
  isAgenticVideoEditingStorageAvailable,
  observeAgenticVideoEditingProgressStorageEvent,
  readAgenticVideoEditingProgress,
  resetAgenticVideoEditingProgress,
  resetAgenticVideoEditingProgressAfterGlobalReset,
  updateAgenticVideoEditingProgress,
  writeAgenticVideoEditingProgress,
} from "@/components/agentic-video-editing/progress-store";
export type {
  AgenticVideoEditingProgressRecord,
} from "@/components/agentic-video-editing/progress-store";

export async function saveAgenticVideoEditingArtifact({
  artifactId: requestedArtifactId,
  slug,
  path,
  contentText,
  expectedPreviousFingerprint,
  reviewDecision,
}: {
  artifactId?: AgenticVideoEditingArtifactId;
  slug?: AgenticVideoEditingModuleSlug;
  path: Course20LearningPath;
  contentText: string;
  expectedPreviousFingerprint: string | null;
  reviewDecision?: {
    decision: "approved" | "blocked" | "not-required";
    reviewerRole: string;
  };
}): Promise<{
  submission: Course20ArtifactSubmission;
  persisted: boolean;
  conflicted: boolean;
}> {
  const artifactId = requestedArtifactId
    ?? (slug ? getCourse20PrimaryArtifactIdForModule(slug) : null);
  if (!artifactId) throw new Error("artifactId or module slug is required.");
  const contract = getAgenticVideoEditingArtifactContract(artifactId);
  const basis = readAgenticVideoEditingProgress();
  const previous = getCourse20ArtifactSubmission(basis, artifactId, path);
  const basisDependencies = getCourse20ArtifactSubmissions(basis, path);
  const submission = await createCourse20ArtifactSubmission({
    artifactId,
    slug: contract.moduleSlug,
    path,
    contentText,
    previous,
    dependencySubmissions: basisDependencies,
    reviewDecision,
  });

  const commit = (): {
    submission: Course20ArtifactSubmission;
    persisted: boolean;
    conflicted: boolean;
  } => {
    // Bind the save to the submission that the editor was actually drafted
    // against, not whichever revision happens to exist when the click handler
    // starts. Re-read under the same-origin artifact lock and fail closed if
    // that editor basis or any dependency changed. Never auto-rebase a stale
    // draft over a newer revision.
    const current = readAgenticVideoEditingProgress();
    const latestArtifact = getCourse20ArtifactSubmission(
      current,
      artifactId,
      path,
    );
    const latestArtifactFingerprint = latestArtifact
      ? course20ReceiptFingerprint(latestArtifact)
      : null;
    if (expectedPreviousFingerprint !== latestArtifactFingerprint) {
      return { submission, persisted: false, conflicted: true };
    }
    const currentDependencies = getCourse20ArtifactSubmissions(current, path);
    const dependencyChanged = contract.dependsOn.some((dependencyId) => (
      submission.dependencyArtifactHashes[dependencyId]
        !== currentDependencies[dependencyId]?.semanticSha256
    ));
    const currentSubmission: Course20ArtifactSubmission = dependencyChanged
      ? {
        ...submission,
        validationReceipt: {
          status: "stale",
          issues: [
            ...submission.validationReceipt.issues,
            {
              code: "dependency.changed-during-save",
              path: "dependencyArtifactHashes",
              message: "An upstream production-relevant hash changed during validation. Re-run against the current artifacts.",
            },
          ],
        },
        receipt: {
          ...submission.receipt,
          status: "blocked",
          issues: [
            ...submission.receipt.issues,
            "dependency.changed-during-save: re-run validation against current upstream hashes.",
          ],
        },
      }
      : submission;
    current[agenticVideoEditingArtifactKey(artifactId, path)] =
      currentSubmission;
    if (contract.requiredForModuleCompletion) {
      delete current[agenticVideoEditingModuleProgressKey(
        contract.moduleSlug,
        path,
      )];
    }
    markCourse20ArtifactDescendantsStale(
      current,
      path,
      artifactId,
      previous?.semanticSha256 ?? "",
      currentSubmission.semanticSha256,
    );
    return {
      submission: currentSubmission,
      persisted: writeAgenticVideoEditingProgress(current),
      conflicted: false,
    };
  };

  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  return locks
    ? locks.request(
      `aicourse-course20-artifact:${path}:${artifactId}`,
      { mode: "exclusive" },
      commit,
    )
    : commit();
}

export function completeAgenticVideoEditingModule(
  slug: AgenticVideoEditingModuleSlug,
  path: Course20LearningPath,
): boolean {
  const record = readAgenticVideoEditingProgress();
  const moduleRecord = AGENTIC_VIDEO_EDITING_COURSE_MANIFEST.modules.find(
    (candidate) => candidate.slug === slug,
  );
  if (!moduleRecord) return false;
  const prerequisitesComplete = moduleRecord.requires.every(
    (requiredSlug) => isCourse20ModuleCurrent(
      record,
      requiredSlug,
      path,
    ),
  );
  const checkpointPassed = isCourse20CheckpointReceipt(
    record[agenticVideoEditingCheckpointKey(slug)],
    slug,
  );
  const artifactsReady = areCourse20ArtifactSubmissionsCurrent(
    record,
    moduleRecord.artifactIds,
    path,
  );
  if (!prerequisitesComplete || !checkpointPassed || !artifactsReady) {
    return false;
  }
  const receipt = createCourse20ModuleReceipt(record, slug, path);
  if (!receipt) return false;
  record[agenticVideoEditingModuleProgressKey(slug, path)] = receipt;
  return writeAgenticVideoEditingProgress(record);
}
