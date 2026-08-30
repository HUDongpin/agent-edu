import assert from "node:assert/strict";
import test from "node:test";
import {
  SOFTWARE_ENGINEERING_CAPSTONE,
  SOFTWARE_ENGINEERING_FINAL_ASSESSMENT,
  SOFTWARE_ENGINEERING_QUESTION_BANK,
  hasSoftwareEngineeringAssessmentDraftActivity,
  hasSoftwareEngineeringCapstoneDraftActivity,
  parseSoftwareEngineeringAssessmentDraft,
  parseSoftwareEngineeringCapstoneDraft,
} from "../lib/software-engineering";

test("Course 8 assessment drafts are versioned and bound to the current balanced bank", () => {
  const questionIds = SOFTWARE_ENGINEERING_QUESTION_BANK
    .filter((_question, index) => index % 5 < 3)
    .map((question) => question.id);
  const valid = {
    version: 1,
    bankVersion: SOFTWARE_ENGINEERING_FINAL_ASSESSMENT.bankVersion,
    questionIds,
    questionIndex: 1,
    selectedIndex: 2,
    answerSelections: { [questionIds[0]]: 0 },
  } as const;

  assert.deepEqual(
    parseSoftwareEngineeringAssessmentDraft(
      valid,
      SOFTWARE_ENGINEERING_QUESTION_BANK,
      SOFTWARE_ENGINEERING_FINAL_ASSESSMENT,
    ),
    valid,
  );
  assert.equal(hasSoftwareEngineeringAssessmentDraftActivity(valid), true);
  assert.equal(
    parseSoftwareEngineeringAssessmentDraft(
      { ...valid, bankVersion: "stale" },
      SOFTWARE_ENGINEERING_QUESTION_BANK,
      SOFTWARE_ENGINEERING_FINAL_ASSESSMENT,
    ),
    null,
  );
  assert.equal(hasSoftwareEngineeringAssessmentDraftActivity({ ...valid, bankVersion: "stale" }), false);
  assert.equal(
    parseSoftwareEngineeringAssessmentDraft(
      { ...valid, questionIds: [...questionIds.slice(0, -1), questionIds[0]] },
      SOFTWARE_ENGINEERING_QUESTION_BANK,
      SOFTWARE_ENGINEERING_FINAL_ASSESSMENT,
    ),
    null,
  );
  assert.equal(
    parseSoftwareEngineeringAssessmentDraft(
      { ...valid, answerSelections: { q25: 9 } },
      SOFTWARE_ENGINEERING_QUESTION_BANK,
      SOFTWARE_ENGINEERING_FINAL_ASSESSMENT,
    ),
    null,
  );
});

test("Course 8 capstone drafts reject stale schemas and unknown evidence ids", () => {
  const valid = {
    version: 1,
    capstoneSchemaVersion: SOFTWARE_ENGINEERING_CAPSTONE.schemaVersion,
    artifactIds: [SOFTWARE_ENGINEERING_CAPSTONE.artifactIds[0]],
    reviewedGateIds: [SOFTWARE_ENGINEERING_CAPSTONE.releaseGates[0].id],
    score: 80,
    decision: "do-not-release",
    safetyBoundaryAttested: true,
  } as const;

  assert.deepEqual(
    parseSoftwareEngineeringCapstoneDraft(valid, SOFTWARE_ENGINEERING_CAPSTONE),
    valid,
  );
  assert.equal(hasSoftwareEngineeringCapstoneDraftActivity(valid), true);
  assert.equal(
    parseSoftwareEngineeringCapstoneDraft(
      { ...valid, capstoneSchemaVersion: "stale" },
      SOFTWARE_ENGINEERING_CAPSTONE,
    ),
    null,
  );
  assert.equal(hasSoftwareEngineeringCapstoneDraftActivity({ ...valid, artifactIds: [] }), true);
  assert.equal(hasSoftwareEngineeringCapstoneDraftActivity({
    ...valid,
    artifactIds: [],
    reviewedGateIds: [],
    score: null,
    decision: "",
    safetyBoundaryAttested: false,
  }), false);
  assert.equal(
    parseSoftwareEngineeringCapstoneDraft(
      { ...valid, artifactIds: ["invented-artifact"] },
      SOFTWARE_ENGINEERING_CAPSTONE,
    ),
    null,
  );
  assert.equal(
    parseSoftwareEngineeringCapstoneDraft(
      { ...valid, reviewedGateIds: ["invented-gate"] },
      SOFTWARE_ENGINEERING_CAPSTONE,
    ),
    null,
  );
});
