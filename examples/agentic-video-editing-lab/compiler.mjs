import {
  assert,
  EXPECTED_OUTPUT_FRAMES,
  PROJECT_SPEC_ID,
  QUARANTINED_SEGMENT_ID,
  SAFE_SEGMENT_IDS,
  SOURCE_DURATION_FRAMES,
  SOURCE_DURATION_SECONDS,
} from "./lab-core.mjs";

const COMPILE_INPUTS = ["plan", "delivery-contract", "asset-ledger", "tool-policy"];
const FIXTURE_INPUT_IDS = ["source-30-cfr"];

export function validateEditPlanV3ForFixture(plan) {
  assert(plan?.schemaVersion === "aicourse.agentic-video-editing.edit-plan.v3", "Only edit-plan v3 may compile.");
  assert(plan.projectSpecId === PROJECT_SPEC_ID, "Plan project identity drifted.");
  assert(plan.status === "frozen-for-synthetic-fixture-execution", "Plan is not frozen for fixture execution.");
  assert(JSON.stringify(plan.compileContract?.requires) === JSON.stringify(COMPILE_INPUTS), "Four-input compile contract drifted.");
  assert(plan.publicationDecision === "do-not-publish", "Plan escalated publication authority.");
  assert(plan.unresolvedCriticalBlockers?.length === 0, "Plan contains unresolved critical blockers.");
  assert(plan.inputs?.length === 1, "The canonical synthetic v3 plan requires one 122-second conformed input.");
  assert(JSON.stringify(plan.inputs.map((input) => input.mediaId)) === JSON.stringify(FIXTURE_INPUT_IDS),
    "The fixture input identity/order tuple drifted.");
  for (const input of plan.inputs) {
    assert(input.assetLedgerId === input.mediaId
      && input.path === `source/${input.mediaId}.mp4`, `${input.mediaId} is not bound to its exact fixture ledger/path tuple.`);
    assert(input.clock?.rationalRate?.numerator === 30 && input.clock.rationalRate.denominator === 1,
      `${input.mediaId} is not a 30/1 conformed editing input.`);
    assert(input.clock.cadence === "CFR" && input.clock.durationFrames === SOURCE_DURATION_FRAMES,
      `${input.mediaId} has an unsupported editing clock.`);
    assert(input.audio?.sampleRate === 48000
      && input.audio.durationSamples === SOURCE_DURATION_SECONDS * 48000,
    `${input.mediaId} lacks the 122-second 48 kHz sample contract.`);
    assert(typeof input.path === "string" && input.path.startsWith("source/"), `${input.mediaId} path is not workspace-relative.`);
  }
  for (const decision of plan.rightsDecisions ?? []) {
    assert(decision.modelUploadPermission === false, `${decision.rightsDecisionId} enabled model upload.`);
    assert(decision.reviewer?.name && decision.reviewedAt, `${decision.rightsDecisionId} lacks named review evidence.`);
  }
  assert(JSON.stringify((plan.rightsDecisions ?? []).map((decision) => decision.assetLedgerId)) === JSON.stringify(FIXTURE_INPUT_IDS),
    "Fixture rights decisions no longer bind the exact canonical input.");
  const clips = plan.operations
    .filter((operation) => operation.type === "clip")
    .sort((left, right) => left.timelineStartFrame - right.timelineStartFrame);
  assert(JSON.stringify(clips.map((clip) => clip.candidateSegmentId)) === JSON.stringify(SAFE_SEGMENT_IDS),
    "Canonical candidate-segment order drifted.");
  assert(!clips.some((clip) => clip.candidateSegmentId === QUARANTINED_SEGMENT_ID),
    "Unknown-rights archive entered the executable plan.");
  for (const clip of clips) {
    for (const dimension of ["localization", "transcript", "semanticFit"]) {
      const estimate = clip.confidence?.[dimension];
      assert(typeof estimate?.value === "number" && estimate.value >= 0 && estimate.value <= 1,
        `${clip.operationId} ${dimension} confidence value is invalid.`);
      assert(typeof estimate.method === "string" && estimate.method.trim().length >= 10,
        `${clip.operationId} ${dimension} confidence lacks an estimation method.`);
      assert(["calibrated", "uncalibrated", "not-applicable"].includes(estimate.calibrationStatus),
        `${clip.operationId} ${dimension} confidence lacks calibration status.`);
    }
  }
  assert(clips.every((clip) => clip.ambiguities.every((ambiguity) => ambiguity.status !== "open")),
    "An unresolved ambiguity entered compilation.");
  let expectedStart = 0;
  for (const clip of clips) {
    assert(clip.timelineStartFrame === expectedStart, "Clip timeline is discontinuous.");
    expectedStart += clip.durationFrames;
  }
  assert(expectedStart === EXPECTED_OUTPUT_FRAMES && plan.timeline.durationFrames === EXPECTED_OUTPUT_FRAMES,
    "Synthetic output duration drifted.");
  const operationTypes = new Set(plan.operations.map((operation) => operation.type));
  for (const type of ["clip", "caption", "title", "audio", "crop", "transition"]) {
    assert(operationTypes.has(type), `Plan does not exercise ${type} operations.`);
  }
  const expectedOperationCounts = { clip: 4, caption: 4, title: 1, audio: 1, crop: 1, transition: 3 };
  for (const [type, count] of Object.entries(expectedOperationCounts)) {
    assert(plan.operations.filter((operation) => operation.type === type).length === count,
      `Synthetic fixture requires exactly ${count} ${type} operation${count === 1 ? "" : "s"}.`);
  }
  const audioOperation = plan.operations.find((operation) => operation.type === "audio");
  assert(audioOperation?.mode === "replacement",
    "Synthetic fixture audio must explicitly replace implicit render audio with the approved 48 kHz track.");
  return { clips, operationTypes: [...operationTypes] };
}

export function compileEditPlanV3ToFilterGraph(plan, delivery) {
  const { clips } = validateEditPlanV3ForFixture(plan);
  const inputIndex = new Map(plan.inputs.map((input, index) => [input.mediaId, index]));
  const filters = [];
  for (const [index, clip] of clips.entries()) {
    const sourceIndex = inputIndex.get(clip.sourceMediaId);
    assert(Number.isInteger(sourceIndex), `No FFmpeg input for ${clip.sourceMediaId}.`);
    const startSeconds = clip.sourceStartFrame / 30;
    const endSeconds = (clip.sourceStartFrame + clip.durationFrames) / 30;
    filters.push(`[${sourceIndex}:v]trim=start_frame=${clip.sourceStartFrame}:end_frame=${clip.sourceStartFrame + clip.durationFrames},setpts=PTS-STARTPTS[v${index}]`);
    filters.push(`[${sourceIndex}:a]atrim=start=${startSeconds.toFixed(6)}:end=${endSeconds.toFixed(6)},asetpts=PTS-STARTPTS,aresample=48000[a${index}]`);
  }
  filters.push(`${clips.map((_, index) => `[v${index}]`).join("")}concat=n=${clips.length}:v=1:a=0[vcat]`);
  filters.push(`${clips.map((_, index) => `[a${index}]`).join("")}concat=n=${clips.length}:v=0:a=1[acat]`);
  const crop = delivery.portraitComposition.sourceCrop;
  filters.push(`[vcat]crop=w=${crop.width}:h=${crop.height}:x=${crop.x}:y=${crop.y},scale=${delivery.candidate.width}:${delivery.candidate.height}:flags=lanczos,setsar=1,fps=30,format=yuv420p[vout]`);
  filters.push("[acat]aresample=48000:first_pts=0[aout]");
  return filters.join(";");
}

/**
 * Thin v3 adapter retained as the stable lab/compiler seam. Exact hashes for
 * plan, delivery, asset ledger, and tool policy are validated by the external
 * compile receipt in render.mjs, after the plan bytes exist.
 */
export function compileEditPlanV3({ plan, delivery }) {
  return {
    schemaVersion: "aicourse.agentic-video-editing.ffmpeg-compile-adapter.v1",
    projectSpecId: PROJECT_SPEC_ID,
    requiredInputs: COMPILE_INPUTS,
    filterGraph: compileEditPlanV3ToFilterGraph(plan, delivery),
    shell: false,
    network: false,
    overwrite: false,
    publicationDecision: "do-not-publish",
  };
}
