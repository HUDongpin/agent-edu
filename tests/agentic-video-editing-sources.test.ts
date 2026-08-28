import assert from "node:assert/strict";
import test from "node:test";

import {
  AGENTIC_VIDEO_EDITING_SOURCES,
  validateAgenticVideoEditingSourceProvenance,
  type AgenticVideoEditingSourceRecord,
} from "../lib/agentic-video-editing";

function mutableSources(): Array<Record<string, unknown>> {
  return structuredClone(AGENTIC_VIDEO_EDITING_SOURCES) as unknown as Array<Record<string, unknown>>;
}

function validateMutation(sources: Array<Record<string, unknown>>): string[] {
  return validateAgenticVideoEditingSourceProvenance(
    sources as unknown as readonly AgenticVideoEditingSourceRecord[],
  );
}

test("Course 22 source provenance is internally closed", () => {
  assert.deepEqual(validateAgenticVideoEditingSourceProvenance(), []);
});

test("IPTC VMH 1.7 uses the official Rec_1.7 artifact rather than the rolling landing page", () => {
  const iptc = AGENTIC_VIDEO_EDITING_SOURCES.find((source) => source.id === "iptc-vmh-1-7");
  assert.ok(iptc);
  assert.equal(
    iptc.url,
    "https://www.iptc.org/std/videometadatahub/recommendation/IPTC-VideoMetadataHub-props-Rec_1.7.html",
  );
  assert.equal(iptc.immutableRef?.kind, "versioned-url");
  assert.equal(iptc.immutableRef?.url, iptc.url);
  assert.doesNotMatch(iptc.url, /\/standards\/video-metadata-hub\/recommendation\/$/u);

  const sources = mutableSources();
  const mutated = sources.find((source) => source.id === "iptc-vmh-1-7")!;
  const rollingUrl = "https://iptc.org/standards/video-metadata-hub/recommendation/";
  mutated.url = rollingUrl;
  mutated.claimEvidenceUrls = [rollingUrl];
  mutated.immutableRef = {
    kind: "versioned-url",
    value: "Video Metadata Hub Recommendation 1.7",
    url: rollingUrl,
  };
  assert.ok(validateMutation(sources).some((error) => (
    error.includes("iptc-vmh-1-7") && error.includes("version-specific URL")
  )));
});

test("X post evidence stays separate from Mosaic policy evidence", () => {
  const post = AGENTIC_VIDEO_EDITING_SOURCES.find((source) => source.id === "x-mosaic-slack");
  assert.ok(post?.kind === "x-post");
  assert.deepEqual(post.policyBoundarySourceIds, ["mosaic-legal-policy"]);
  assert.ok(post.claimEvidenceUrls.every((url) => (
    new URL(url).hostname === "x.com" || new URL(url).hostname === "publish.x.com"
  )));

  const policy = AGENTIC_VIDEO_EDITING_SOURCES.find((source) => source.id === "mosaic-legal-policy");
  assert.ok(policy?.kind === "legal-policy");
  assert.equal(policy.immutableRef, undefined);

  const sources = mutableSources();
  const mutated = sources.find((source) => source.id === "x-mosaic-slack")!;
  mutated.claimEvidenceUrls = [
    ...(mutated.claimEvidenceUrls as string[]),
    "https://mosaic.so/legal",
  ];
  assert.ok(validateMutation(sources).some((error) => (
    error.includes("x-mosaic-slack") && error.includes("must not mix")
  )));
});

test("legal policy records expose jurisdiction, applicability, recheck, and non-advice status", () => {
  const policy = AGENTIC_VIDEO_EDITING_SOURCES.find((source) => source.id === "mosaic-legal-policy");
  assert.ok(policy?.kind === "legal-policy");
  assert.equal(policy.applicabilityStatus, "requires-project-specific-review");
  assert.equal(policy.legalAdviceStatus, "not-legal-advice-qualified-review-required");
  assert.ok(policy.jurisdiction.length >= 30);
  assert.ok(policy.applicability.length >= 30);
  assert.ok(policy.recheckTrigger.length >= 30);
  assert.match(policy.boundary, /not legal advice/iu);
  assert.match(policy.boundaryZhHans, /(?:非法律意见|不构成法律意见)/u);

  const sources = mutableSources();
  const mutated = sources.find((source) => source.id === "mosaic-legal-policy")!;
  mutated.jurisdiction = "unspecified";
  mutated.legalAdviceStatus = "advice";
  mutated.boundary = "This page may change.";
  assert.ok(validateMutation(sources).filter((error) => error.includes("mosaic-legal-policy")).length >= 2);
});

test("immutableRef is reserved for genuinely pinned evidence", () => {
  for (const source of AGENTIC_VIDEO_EDITING_SOURCES) {
    const pinned = ["release-pinned", "commit-pinned-at-cutoff", "version-pinned-standard"]
      .includes(source.stability);
    assert.equal(Boolean(source.immutableRef), pinned, source.id);
  }

  const sources = mutableSources();
  const currentDocs = sources.find((source) => source.id === "mosaic-api-docs")!;
  currentDocs.immutableRef = {
    kind: "versioned-url",
    value: "accessed 2026-08-28",
    url: currentDocs.url,
  };
  assert.ok(validateMutation(sources).some((error) => (
    error.includes("mosaic-api-docs") && error.includes("must not claim")
  )));
});
