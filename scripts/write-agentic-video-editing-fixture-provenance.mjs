#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_ROOT = join(
  REPOSITORY_ROOT,
  "staging/course-assets/agentic-video-editing",
);
const OUTPUT_PATH = join(PUBLIC_ROOT, "fixtures.provenance.json");

const files = [
  ["NOTICE.md", "text/markdown", "Project-authored rights, media, runtime, learner-media, and do-not-publish boundary."],
  ["artifact-fixtures.v1.json", "application/json", "Legacy fixture-name adapter retained only as inert beta-migration evidence; completion uses stable v2 artifact IDs and semantic validators."],
  ["artifact-submission.schema.json", "application/schema+json", "Artifact envelope, receipt, semantic hash, dependency, and review-decision contract."],
  ["creative-brief.fixture.json", "application/json", "Project-authored creative brief fixture."],
  ["delivery-contract.schema.json", "application/schema+json", "Destination, caption, audio, crop, accessibility, and color delivery matrix schema."],
  ["edit-plan.schema.json", "application/schema+json", "Blocked selection-only browser teaching plan v2."],
  ["edit-plan-v3.schema.json", "application/schema+json", "Tool-neutral production Edit Plan v3 schema."],
  ["lab/fixture-manifest.v1.json", "application/json", "Nested hash closure for the original audiovisual fixture, frozen media, lab contracts, and failure ledger."],
  ["media-manifest.fixture.json", "application/json", "JSON view of the v2 first-party frozen-media intake record."],
  ["media-manifest.fixture.yaml", "application/yaml", "Canonical editable YAML v2 first-party frozen-media intake record."],
  ["qc-checklist.md", "text/markdown", "Bilingual technical, semantic, editorial, audio, caption, color, accessibility, rights/privacy, destination, and release review guidance."],
];

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

const manifest = {
  schemaVersion: "aicourse.public-fixtures.provenance.v2",
  courseId: "agentic-video-editing",
  courseVersion: "1.2.0",
  fixtureSetVersion: "1.2.0",
  verifiedOn: "2026-08-28",
  selfHashExcluded: true,
  rights: {
    basis: "project-authored-original-fixture",
    repositoryLicense: "MIT",
    containsThirdPartyCode: false,
    containsThirdPartyMedia: false,
    containsPersonalData: false,
    containsPrivateInput: false,
    containsModelOutput: false,
    shipsFrozenReferenceMedia: true,
  },
  scope: {
    browserNetworkAllowed: false,
    browserMediaUploadAllowed: false,
    authorizesLearnerMediaUse: false,
    authorizesExecution: false,
    authorizesPublication: false,
    syntheticFixtureDecision: "do-not-publish",
    unknownRightsDefault: "block",
  },
  files: files.map(([path, mediaType, purpose]) => {
    const absolutePath = join(PUBLIC_ROOT, path);
    return {
      path,
      sha256: sha256(absolutePath),
      byteLength: readFileSync(absolutePath).byteLength,
      mediaType,
      origin: "project-authored-original-fixture",
      purpose,
    };
  }),
  integrityNote: "This manifest intentionally excludes its own bytes. SHA-256 proves equality to this reviewed fixture snapshot; it does not prove truth, rights, consent, accessibility, editorial quality, or release authority. The nested lab manifest closes the frozen media set.",
};

writeFileSync(OUTPUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`, {
  encoding: "utf8",
  flag: "w",
});
console.log(`Wrote ${OUTPUT_PATH}`);
