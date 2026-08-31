import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import Ajv2020 from "ajv/dist/2020.js";
import type { AnySchema } from "ajv";
import {
  buildCutPlanLabPlan,
  CUT_PLAN_LAB_FIXTURE,
  validateCutPlanLabPlan,
  validateSelectionPlanV2Semantics,
} from "../staging/course-src/agentic-video-editing/cut-plan-lab";
import {
  createCourse20ArtifactStarter,
  validateCourse20ArtifactContent,
  type Course20ArtifactValidationContext,
} from "../staging/course-src/agentic-video-editing/contracts";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const HASH_C = "c".repeat(64);
const EDIT_PLAN_ARTIFACT_ID = "edit-plan-v3-validation-approval" as const;

function loadSchema(relativePath: string): AnySchema {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), "utf8"));
}

function compileSchema(relativePath: string) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(loadSchema(relativePath));
  return { ajv, validate };
}

function buildTeachingPlan() {
  const selected = CUT_PLAN_LAB_FIXTURE.filter((clip) => clip.id !== "archive");
  return buildCutPlanLabPlan(
    selected,
    Object.fromEntries(selected.map((clip) => [clip.id, clip.defaultReason])),
    50,
  );
}

const productionValidationContext = {
  dependencySubmissions: Object.fromEntries([
    "media-manifest-provenance-quarantine",
    "evidence-index-transcript-shots",
    "candidate-segments-system-card",
  ].map((artifactId) => [artifactId, {
    contentText: createCourse20ArtifactStarter(
      artifactId as
        | "media-manifest-provenance-quarantine"
        | "evidence-index-transcript-shots"
        | "candidate-segments-system-card",
    ),
    validationReceipt: { status: "valid" },
  }])),
  reviewDecision: {
    decision: "approved",
    reviewerRole: "independent test editor",
    boundArtifactSha256: HASH_A,
  },
} as unknown as Course20ArtifactValidationContext;

function buildSemanticProductionPlan() {
  return JSON.parse(createCourse20ArtifactStarter(EDIT_PLAN_ARTIFACT_ID));
}

function validateSemanticProductionPlan(plan: unknown) {
  return validateCourse20ArtifactContent(
    EDIT_PLAN_ARTIFACT_ID,
    JSON.stringify(plan),
    productionValidationContext,
  );
}

function issueCodes(plan: unknown): string[] {
  return validateSemanticProductionPlan(plan).issues.map((issue) => issue.code);
}

function exactTimelineFrames(
  sourceFrames: number,
  sourceRate: { numerator: number; denominator: number },
  timelineRate = { numerator: 30, denominator: 1 },
): number | null {
  const numerator = sourceFrames * sourceRate.denominator * timelineRate.numerator;
  const denominator = sourceRate.numerator * timelineRate.denominator;
  if (!Number.isSafeInteger(numerator)
    || !Number.isSafeInteger(denominator)
    || denominator < 1
    || numerator % denominator !== 0) return null;
  return numerator / denominator;
}

test("browser teaching contract stays selection-only v2 and blocked", () => {
  const teaching = buildTeachingPlan();
  const selectionSchema = compileSchema(
    "../staging/course-assets/agentic-video-editing/edit-plan.schema.json",
  );
  const productionSchema = compileSchema(
    "../staging/course-assets/agentic-video-editing/edit-plan-v3.schema.json",
  );

  assert.deepEqual(validateCutPlanLabPlan(teaching), []);
  assert.deepEqual(validateSelectionPlanV2Semantics(teaching), []);
  assert.equal(selectionSchema.validate(teaching), true,
    selectionSchema.ajv.errorsText(selectionSchema.validate.errors));
  assert.equal(productionSchema.validate(teaching), false,
    "a blocked teaching selection may not impersonate a production Edit Plan v3");
  assert.equal(teaching.schemaVersion, "aicourse.agentic-video-editing.selection-plan.v2");
  assert.equal(teaching.status, "blocked");
  assert.ok(teaching.timeline.clips.every((clip) => clip.kind === "select"));
  assert.equal("operations" in teaching.timeline, false);
  assert.equal("compileContract" in teaching, false);
  assert.equal("executionPolicy" in teaching, false);
  assert.equal("publicationDecision" in teaching, false);
});

test("one production v3 starter passes both the public schema and semantic validator", () => {
  const selectionSchema = compileSchema(
    "../staging/course-assets/agentic-video-editing/edit-plan.schema.json",
  );
  const productionSchema = compileSchema(
    "../staging/course-assets/agentic-video-editing/edit-plan-v3.schema.json",
  );
  const production = buildSemanticProductionPlan();

  assert.equal(productionSchema.validate(production), true,
    productionSchema.ajv.errorsText(productionSchema.validate.errors));
  assert.equal(validateSemanticProductionPlan(production).status, "valid");
  assert.equal(selectionSchema.validate(production), false,
    "production Edit Plan v3 may not impersonate the browser teaching fixture");
  assert.deepEqual(
    [...new Set(production.operations.map(
      (operation: { type: string }) => operation.type,
    ))].sort(),
    ["audio", "caption", "clip", "crop", "title", "transition"],
  );
  assert.equal(production.inputs.every(
    (input: { audio: { sampleRate: number } }) => input.audio.sampleRate === 48_000,
  ), true);
});

test("production semantic validator accepts exact 23.976, 25, and 29.97 rational clocks", () => {
  const cases = [
    { label: "23.976", rate: { numerator: 24_000, denominator: 1_001 }, sourceFrames: 800, timelineFrames: 1_001 },
    { label: "25", rate: { numerator: 25, denominator: 1 }, sourceFrames: 50, timelineFrames: 60 },
    { label: "29.97", rate: { numerator: 30_000, denominator: 1_001 }, sourceFrames: 1_000, timelineFrames: 1_001 },
  ];
  for (const current of cases) {
    const plan = buildSemanticProductionPlan();
    plan.inputs[0].clock.rationalRate = current.rate;
    assert.equal(validateSemanticProductionPlan(plan).status, "valid", current.label);
    assert.equal(
      exactTimelineFrames(current.sourceFrames, current.rate),
      current.timelineFrames,
      current.label,
    );
  }

  assert.equal(exactTimelineFrames(1, { numerator: 25, denominator: 1 }), null,
    "non-integral conversions must not be rounded silently");
  const invalid = buildSemanticProductionPlan();
  invalid.inputs[0].clock.rationalRate.denominator = 0;
  assert.ok(issueCodes(invalid).includes("clock.invalid-rational"));
});

test("VFR requires both PTS lineage and a conform receipt", () => {
  const missing = buildSemanticProductionPlan();
  missing.inputs[0].clock.cadence = "VFR";
  delete missing.inputs[0].clock.ptsReceiptSha256;
  delete missing.inputs[0].clock.conformReceiptSha256;
  const missingResult = validateSemanticProductionPlan(missing);
  assert.equal(missingResult.status, "blocked");
  assert.ok(missingResult.issues.some((issue) => issue.path.endsWith("ptsReceiptSha256")));
  assert.ok(missingResult.issues.some((issue) => issue.path.endsWith("conformReceiptSha256")));

  const conformed = structuredClone(missing);
  conformed.inputs[0].clock.ptsReceiptSha256 = HASH_B;
  conformed.inputs[0].clock.conformReceiptSha256 = HASH_C;
  assert.equal(validateSemanticProductionPlan(conformed).status, "valid");
});

test("48 kHz is valid and other production audio rates fail closed", () => {
  const valid = buildSemanticProductionPlan();
  assert.equal(valid.inputs[0].audio.sampleRate, 48_000);
  assert.equal(validateSemanticProductionPlan(valid).status, "valid");

  const invalidInput = structuredClone(valid);
  invalidInput.inputs[0].audio.sampleRate = 44_100;
  assert.ok(issueCodes(invalidInput).includes("audio.sample-rate"));

  const invalidOperation = structuredClone(valid);
  invalidOperation.operations.find((operation: { type: string }) => operation.type === "audio").sampleRate = 44_100;
  assert.ok(issueCodes(invalidOperation).includes("audio.sample-rate"));
});

test("production semantic validator covers all six supported operation families", () => {
  const plan = buildSemanticProductionPlan();
  assert.equal(validateSemanticProductionPlan(plan).status, "valid");
  assert.deepEqual(
    [...new Set(plan.operations.map((operation: { type: string }) => operation.type))].sort(),
    ["audio", "caption", "clip", "crop", "title", "transition"],
  );

  const unknown = structuredClone(plan);
  unknown.operations[0].type = "speed-change";
  assert.ok(issueCodes(unknown).includes("operation.unknown-type"));
});

test("production semantic validator rejects identity, evidence, bounds, hash, path, rights, and ambiguity drift", () => {
  const mutations: Array<{
    name: string;
    code: string;
    mutate: (plan: ReturnType<typeof buildSemanticProductionPlan>) => void;
  }> = [
    {
      name: "duplicate operation IDs",
      code: "identity.duplicate-id",
      mutate: (plan) => {
        plan.operations[1].operationId = plan.operations[0].operationId;
      },
    },
    {
      name: "missing clip evidence",
      code: "operation.evidence",
      mutate: (plan) => { plan.operations[0].evidenceIds = []; },
    },
    {
      name: "source range out of bounds",
      code: "operation.source-out-of-bounds",
      mutate: (plan) => { plan.operations[0].sourceStartFrame = 3_500; },
    },
    {
      name: "timeline range out of bounds",
      code: "timeline.out-of-bounds",
      mutate: (plan) => { plan.operations[2].timelineStartFrame = 1_499; },
    },
    {
      name: "invalid content hash",
      code: "receipt.sha256",
      mutate: (plan) => { plan.inputs[0].sha256 = "not-a-sha256"; },
    },
    {
      name: "path traversal",
      code: "security.path-escape",
      mutate: (plan) => { plan.inputs[0].path = "../../private/source.mp4"; },
    },
    {
      name: "unknown rights decision",
      code: "rights.reference-missing",
      mutate: (plan) => { plan.operations[0].rightsDecisionId = "rights-missing"; },
    },
    {
      name: "unresolved ambiguity",
      code: "ambiguity.unresolved",
      mutate: (plan) => {
        plan.operations[0].ambiguities = [{
          kind: "speaker intent",
          evidence: "review-note-1",
          status: "open",
          owner: "editor",
          resolutionRequirement: "Resolve before execution.",
        }];
      },
    },
    {
      name: "overlapping primary clips",
      code: "timeline.clip-overlap",
      mutate: (plan) => {
        const duplicate = structuredClone(plan.operations[0]);
        duplicate.operationId = "clip-overlap";
        duplicate.timelineStartFrame = 500;
        duplicate.durationFrames = 100;
        plan.operations.push(duplicate);
      },
    },
  ];

  for (const current of mutations) {
    const plan = buildSemanticProductionPlan();
    current.mutate(plan);
    assert.ok(issueCodes(plan).includes(current.code), current.name);
  }
});

test("independent approval is outside the production Edit Plan body", () => {
  const plan = buildSemanticProductionPlan();
  const planResult = validateCourse20ArtifactContent(
    EDIT_PLAN_ARTIFACT_ID,
    JSON.stringify(plan),
    { dependencySubmissions: productionValidationContext.dependencySubmissions },
  );
  assert.ok(!planResult.issues.some(
    (issue) => issue.code === "review.plan-approval-required",
  ));

  plan.approval = { decision: "approved" };
  const embeddedPlan = validateCourse20ArtifactContent(
    EDIT_PLAN_ARTIFACT_ID,
    JSON.stringify(plan),
    { dependencySubmissions: productionValidationContext.dependencySubmissions },
  );
  assert.ok(!embeddedPlan.issues.some(
    (issue) => issue.code === "review.plan-approval-required",
  ));

  const approvalArtifactId = "plan-diff-independent-approval" as const;
  const approvalText = createCourse20ArtifactStarter(approvalArtifactId);
  const approvalDependencies = {
    [EDIT_PLAN_ARTIFACT_ID]: {
      validationReceipt: { status: "valid" },
    },
  } as unknown as Course20ArtifactValidationContext["dependencySubmissions"];
  const withoutApproval = validateCourse20ArtifactContent(
    approvalArtifactId,
    approvalText,
    { dependencySubmissions: approvalDependencies },
  );
  assert.ok(withoutApproval.issues.some(
    (issue) => issue.code === "review.plan-approval-required",
  ));
  const withApproval = validateCourse20ArtifactContent(
    approvalArtifactId,
    approvalText,
    {
      dependencySubmissions: approvalDependencies,
      reviewDecision: {
        decision: "approved",
        reviewerRole: "independent test editor",
        boundArtifactSha256: HASH_A,
      },
    },
  );
  assert.ok(!withApproval.issues.some(
    (issue) => issue.code === "review.plan-approval-required",
  ));
});
