#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  COURSE20_HUMAN_SIGNOFF_STATUS,
  createCourse20BilingualEditorialSnapshot,
} from "./course20-bilingual-editorial-surface.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const receiptPath = join(
  repositoryRoot,
  "evidence/course-audits/course20-bilingual-review-receipt-2026-08-28.json",
);
const files = {
  englishCopy: "staging/course-src/agentic-video-editing/copy/en.ts",
  zhHansCopy: "staging/course-src/agentic-video-editing/copy/zh-Hans.ts",
  bindingCode: "staging/course-src/agentic-video-editing/copy/bind-options.ts",
  assessmentContract: "staging/course-src/agentic-video-editing/assessment-contract.ts",
};

function sha256File(relativePath) {
  return createHash("sha256")
    .update(readFileSync(join(repositoryRoot, relativePath)))
    .digest("hex");
}

const previous = JSON.parse(readFileSync(receiptPath, "utf8"));
const machineFiles = Object.fromEntries(Object.entries(files).map(([id, path]) => [
  id,
  { path, sha256: sha256File(path) },
]));
const editorialSurface = createCourse20BilingualEditorialSnapshot();
const reviewedHashFields = {
  englishCopy: "reviewedEnglishSha256",
  zhHansCopy: "reviewedZhHansSha256",
  bindingCode: "reviewedBindingCodeSha256",
  assessmentContract: "reviewedAssessmentContractSha256",
};
const previousSignoff = previous.humanEditorialSignoff ?? {};
const signedHashesRemainCurrent = Object.entries(reviewedHashFields).every(
  ([fileId, hashField]) => previousSignoff[hashField] === machineFiles[fileId].sha256,
)
  && previousSignoff.reviewedEditorialSurfaceSchemaVersion
    === editorialSurface.schemaVersion
  && previousSignoff.reviewedEditorialSurfaceSha256 === editorialSurface.sha256
  && previousSignoff.reviewedEditorialFileCount === editorialSurface.fileCount;
const signoffBecameStale = previousSignoff.status
  === COURSE20_HUMAN_SIGNOFF_STATUS && !signedHashesRemainCurrent;
const humanEditorialSignoff = signoffBecameStale
  ? {
      ...previousSignoff,
      status: "stale-human-editorial-signoff",
      staleDetectedAt: new Date().toISOString(),
      staleReason: "At least one exact reviewed source hash no longer matches the current source bytes.",
      blockingForPublicProductionPromotion: true,
    }
  : previousSignoff;
const receipt = {
  ...previous,
  schemaVersion: "aicourse.course20.bilingual-review-receipt.v2",
  courseVersion: "1.2.0",
  reviewedOn: "2026-08-28",
  machineParity: {
    status: "pass",
    method: "manifest, concept ID, claim ID, artifact ID, module dependency, assessment answer, critical-control, and capstone-order parity gates",
    digestAlgorithm: "sha256-file-bytes",
    files: machineFiles,
    editorialSurface,
  },
  humanEditorialSignoff,
  decision: signoffBecameStale
    ? "human-editorial-signoff-stale; production-promotion-blocked"
    : previous.decision,
};

writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, {
  encoding: "utf8",
  flag: "w",
  mode: 0o644,
});
if (humanEditorialSignoff.status === COURSE20_HUMAN_SIGNOFF_STATUS
  && signedHashesRemainCurrent) {
  console.log(`PASS Course 20 bilingual receipt (${editorialSurface.fileCount} exact editorial files; ${Object.keys(files).length} canonical role hashes)`);
} else {
  console.error("BLOCKED Course 20 bilingual receipt: the human signoff is absent or stale for the current editorial surface.");
  process.exitCode = 1;
}
