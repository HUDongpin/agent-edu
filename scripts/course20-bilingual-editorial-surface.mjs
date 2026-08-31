import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

import {
  ROOT,
  createCourse20FileIntegritySnapshot,
} from "./agentic-video-editing-export-state.mjs";

export const COURSE20_BILINGUAL_EDITORIAL_SURFACE_SCHEMA =
  "aicourse.course20.bilingual-editorial-surface.v1";

// This intentionally errs on the conservative side. It covers every direct
// Course 20 route, component, content/contract source, downloadable starter-kit
// byte, and local-lab byte, plus the shared catalogue/SEO and EN/zh-Hans message
// files that can change how the course is presented publicly.
export const COURSE20_BILINGUAL_EDITORIAL_ROOTS = Object.freeze([
  "app/[locale]/_blocked/agentic-video-editing",
  "app/[locale]/courses/page.tsx",
  "staging/course-src/agentic-video-editing",
  "examples/agentic-video-editing-lab",
  "staging/course-assets/agentic-video-editing",
  "lib/courses.ts",
  "lib/seo.ts",
  "messages/en.json",
  "messages/zh-Hans.json",
]);

export const COURSE20_HUMAN_REVIEW_SCOPE = Object.freeze([
  "English course copy",
  "Simplified Chinese course copy",
  "semantic option binding",
  "assessment contract",
  "complete Course 20 bilingual editorial source inventory",
]);

export const COURSE20_HUMAN_SIGNOFF_STATUS =
  "passed-human-editorial-signoff";
export const COURSE20_HUMAN_SIGNOFF_IDENTITY_BASIS =
  "current-task-owner-user-attestation";
export const COURSE20_HUMAN_SIGNOFF_IDENTITY_BOUNDARY =
  "This repository records the current task owner's attestation; it does not independently verify civil identity.";
export const COURSE20_HUMAN_SIGNOFF_DECISION =
  "human-editorial-signoff-complete; branch-implementation-may-proceed-to-integration-review; commit-push-merge-deploy-not-authorized";

function isWithin(root, candidate) {
  const fromRoot = relative(root, candidate);
  return fromRoot === ""
    || (!fromRoot.startsWith(`..${sep}`)
      && fromRoot !== ".."
      && !isAbsolute(fromRoot));
}

function collectRegularFiles(relativePath) {
  const absolutePath = resolve(ROOT, relativePath);
  if (!isWithin(ROOT, absolutePath)) {
    throw new Error(`Course 20 bilingual editorial path escapes the repository: ${relativePath}`);
  }
  const metadata = lstatSync(absolutePath);
  if (metadata.isSymbolicLink()) {
    throw new Error(`Course 20 bilingual editorial inventory rejects symlinks: ${relativePath}`);
  }
  if (metadata.isFile()) return [absolutePath];
  if (!metadata.isDirectory()) {
    throw new Error(`Course 20 bilingual editorial inventory contains a non-file entry: ${relativePath}`);
  }
  return readdirSync(absolutePath, { withFileTypes: true })
    .filter((entry) => entry.name !== ".DS_Store")
    .sort((left, right) => left.name.localeCompare(right.name, "en"))
    .flatMap((entry) => collectRegularFiles(join(relativePath, entry.name)));
}

export function createCourse20BilingualEditorialSnapshot() {
  const absoluteFiles = COURSE20_BILINGUAL_EDITORIAL_ROOTS
    .flatMap(collectRegularFiles);
  const relativeFiles = absoluteFiles.map((path) => relative(ROOT, path));
  if (new Set(relativeFiles).size !== relativeFiles.length) {
    throw new Error("Course 20 bilingual editorial roots overlap or contain duplicate files");
  }
  const snapshot = createCourse20FileIntegritySnapshot(
    absoluteFiles.map((path) => ({
      path: relative(ROOT, path),
      bytes: readFileSync(path),
    })),
  );
  return {
    schemaVersion: COURSE20_BILINGUAL_EDITORIAL_SURFACE_SCHEMA,
    digestAlgorithm: "sha256-path-length-byte-length-framed-file-bytes",
    roots: [...COURSE20_BILINGUAL_EDITORIAL_ROOTS],
    fileCount: snapshot.fileCount,
    files: snapshot.files,
    fileHashes: snapshot.fileHashes,
    sha256: snapshot.hash,
  };
}

export function createCourse20HumanSignoffFingerprint(signoff) {
  const payload = {
    status: signoff.status,
    reviewerName: signoff.reviewerName,
    reviewerRole: signoff.reviewerRole,
    identityBasis: signoff.identityBasis,
    identityVerificationBoundary: signoff.identityVerificationBoundary,
    reviewScope: signoff.reviewScope,
    reviewedEnglishSha256: signoff.reviewedEnglishSha256,
    reviewedZhHansSha256: signoff.reviewedZhHansSha256,
    reviewedBindingCodeSha256: signoff.reviewedBindingCodeSha256,
    reviewedAssessmentContractSha256:
      signoff.reviewedAssessmentContractSha256,
    reviewedEditorialSurfaceSchemaVersion:
      signoff.reviewedEditorialSurfaceSchemaVersion,
    reviewedEditorialSurfaceSha256:
      signoff.reviewedEditorialSurfaceSha256,
    reviewedEditorialFileCount: signoff.reviewedEditorialFileCount,
    signedAt: signoff.signedAt,
    attestationSource: signoff.attestationSource,
    changeInvalidationPolicy: signoff.changeInvalidationPolicy,
    blockingForPublicProductionPromotion:
      signoff.blockingForPublicProductionPromotion,
  };
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}
