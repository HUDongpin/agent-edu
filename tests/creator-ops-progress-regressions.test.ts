import assert from "node:assert/strict";
import test from "node:test";

import {
  CREATOR_OPS_PROGRESS_VERSION,
  CREATOR_OPS_PROGRESS_VERSION_KEY,
  creatorOpsArtifactEvidenceKey,
  creatorOpsCheckpointPassedKey,
  creatorOpsModuleProgressKey,
  nextCreatorOpsStep,
  normalizeCreatorOpsProgress,
} from "../staging/course-src/creator-ops/lib/progress";
import {
  CREATOR_OPS_CAPSTONE_KEY,
  CREATOR_OPS_QUIZ_PASSED_KEY,
} from "../staging/course-src/creator-ops/lib/progress";
import { CREATOR_OPS_MODULE_SLUGS } from "../staging/course-src/creator-ops/lib/types";

test("a progress-schema v1 receipt survives an ordinary course patch version", () => {
  const slug = CREATOR_OPS_MODULE_SLUGS[0];
  const artifactKey = creatorOpsArtifactEvidenceKey(slug);
  const checkpointKey = creatorOpsCheckpointPassedKey(slug);
  const completionKey = creatorOpsModuleProgressKey(slug);
  const normalized = normalizeCreatorOpsProgress({
    [CREATOR_OPS_PROGRESS_VERSION_KEY]: "1.0.1:progress-v1",
    [artifactKey]: true,
    [checkpointKey]: true,
    [completionKey]: true,
    "another-course.lesson": true,
  });

  assert.equal(normalized[artifactKey], true);
  assert.equal(normalized[checkpointKey], true);
  assert.equal(normalized[completionKey], true);
  assert.equal(normalized["another-course.lesson"], true);
  assert.equal(
    normalized[CREATOR_OPS_PROGRESS_VERSION_KEY],
    CREATOR_OPS_PROGRESS_VERSION,
  );
});

test("the new client writes a marker that an already-open deployed client accepts", () => {
  const slug = CREATOR_OPS_MODULE_SLUGS[0];
  const completionKey = creatorOpsModuleProgressKey(slug);
  const upgraded = normalizeCreatorOpsProgress({
    [CREATOR_OPS_PROGRESS_VERSION_KEY]: "1.0.1:progress-v1",
    [completionKey]: true,
  });

  // This mirrors the exact marker check used by the deployed 1.0.2 client.
  const deployedClientRecord = { ...upgraded };
  if (deployedClientRecord[CREATOR_OPS_PROGRESS_VERSION_KEY] !== "1.0.2:progress-v1") {
    for (const key of Object.keys(deployedClientRecord)) {
      if (key.startsWith("creator-ops.")) delete deployedClientRecord[key];
    }
  }

  assert.equal(
    upgraded[CREATOR_OPS_PROGRESS_VERSION_KEY],
    "1.0.2:progress-v1",
  );
  assert.equal(deployedClientRecord[completionKey], true);
});

test("an incompatible progress schema clears only Course 16 fields", () => {
  const slug = CREATOR_OPS_MODULE_SLUGS[0];
  const completionKey = creatorOpsModuleProgressKey(slug);
  const normalized = normalizeCreatorOpsProgress({
    [CREATOR_OPS_PROGRESS_VERSION_KEY]: "progress-v2",
    [completionKey]: true,
    "another-course.lesson": true,
  });

  assert.equal(normalized[completionKey], undefined);
  assert.equal(normalized["another-course.lesson"], true);
  assert.equal(
    normalized[CREATOR_OPS_PROGRESS_VERSION_KEY],
    CREATOR_OPS_PROGRESS_VERSION,
  );
});

test("next-step derivation advances from modules to assessment and capstone", () => {
  const progress: Record<string, unknown> = {
    [CREATOR_OPS_PROGRESS_VERSION_KEY]: CREATOR_OPS_PROGRESS_VERSION,
  };

  assert.deepEqual(nextCreatorOpsStep(progress), {
    kind: "module",
    slug: CREATOR_OPS_MODULE_SLUGS[0],
  });

  for (const slug of CREATOR_OPS_MODULE_SLUGS.slice(0, 2)) {
    progress[creatorOpsArtifactEvidenceKey(slug)] = true;
    progress[creatorOpsCheckpointPassedKey(slug)] = true;
    progress[creatorOpsModuleProgressKey(slug)] = true;
  }
  assert.deepEqual(nextCreatorOpsStep(progress), {
    kind: "module",
    slug: CREATOR_OPS_MODULE_SLUGS[2],
  });

  for (const slug of CREATOR_OPS_MODULE_SLUGS) {
    progress[creatorOpsArtifactEvidenceKey(slug)] = true;
    progress[creatorOpsCheckpointPassedKey(slug)] = true;
    progress[creatorOpsModuleProgressKey(slug)] = true;
  }
  assert.deepEqual(nextCreatorOpsStep(progress), { kind: "assessment" });

  progress[CREATOR_OPS_QUIZ_PASSED_KEY] = true;
  assert.deepEqual(nextCreatorOpsStep(progress), { kind: "capstone" });

  progress[CREATOR_OPS_CAPSTONE_KEY] = true;
  assert.deepEqual(nextCreatorOpsStep(progress), { kind: "complete" });
});
