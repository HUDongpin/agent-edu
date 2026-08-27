export const CUT_PLAN_LAB_FPS = 30;
export const CUT_PLAN_LAB_SOURCE_DURATION_FRAMES = 3_660;

export const CUT_PLAN_LAB_FIXTURE = [
  { id: "hook", label: "Opening promise", labelZhHans: "开场承诺", sourceInSeconds: 12.4, sourceOutSeconds: 20.4, rightsState: "simulated-cleared" as const, defaultReason: "States the central promise in the speaker's own words.", defaultReasonZhHans: "用讲者自己的原话提出核心承诺，同时不扩大原始主张。" },
  { id: "context", label: "Why the problem matters", labelZhHans: "问题为何重要", sourceInSeconds: 34.2, sourceOutSeconds: 46.2, rightsState: "simulated-cleared" as const, defaultReason: "Supplies the minimum context needed to avoid a misleading claim.", defaultReasonZhHans: "补足避免主张被误解所需的最少语境，并保留关键限定。" },
  { id: "archive", label: "Unverified archive insert", labelZhHans: "未核验的档案插入", sourceInSeconds: 50, sourceOutSeconds: 61.5, rightsState: "unknown" as const, defaultReason: "Visually resembles the topic, but source rights are unresolved.", defaultReasonZhHans: "画面看似符合主题，但来源权利仍未解决，必须保持阻断。" },
  { id: "method", label: "How the method works", labelZhHans: "方法如何运作", sourceInSeconds: 74.1, sourceOutSeconds: 88.1, rightsState: "simulated-cleared" as const, defaultReason: "Explains the mechanism instead of adding an unsupported result claim.", defaultReasonZhHans: "解释实际机制，不加入来源没有支持的结果或效果主张。" },
  { id: "close", label: "Accountable close", labelZhHans: "可追责的结尾", sourceInSeconds: 109, sourceOutSeconds: 122, rightsState: "simulated-cleared" as const, defaultReason: "Closes with the intended action and preserves the named limitation.", defaultReasonZhHans: "以预定行动收束，同时明确保留已经说明的限制条件。" },
] as const;

export type CutPlanLabClip = (typeof CUT_PLAN_LAB_FIXTURE)[number];

export type CutPlanLabIssueCode =
  | "fixture-boundary"
  | "minimum-clips"
  | "target-range"
  | "duration-range"
  | "target-delta"
  | "rights-unresolved"
  | "reason-short"
  | "duplicate-operation-id"
  | "source-missing"
  | "source-range-invalid"
  | "source-range-out-of-bounds"
  | "timeline-discontinuity"
  | "expected-duration-mismatch"
  | "fixture-timebase"
  | "fixture-tolerance"
  | "fixture-input"
  | "fixture-operation"
  | "evidence-unresolved"
  | "unsafe-output-directory"
  | "unsafe-execution-policy"
  | "unresolved-ambiguity"
  | "human-review-disabled";

export interface CutPlanLabIssue {
  readonly code: CutPlanLabIssueCode;
  readonly subject?: string;
}

export interface CutPlanLabPlan {
  readonly schemaVersion: "aicourse.agentic-video-editing.edit-plan.v2";
  readonly planId: string;
  readonly fixtureId: "course20-cut-plan-lab-v2";
  readonly planMode: "teaching-fixture";
  readonly status: "blocked";
  readonly inputs: readonly [{
    readonly inputKind: "synthetic-text-fixture";
    readonly mediaId: "fixture-interview-a";
    readonly expectedSha256: null;
    readonly manifestDecision: "fixture-only-no-source-media";
    readonly rightsDecision: "not-applicable-no-source-media";
    readonly probeReceiptSha256: null;
    readonly expectedDurationFrames: number;
  }];
  readonly timeline: {
    readonly timebase: {
      readonly framesPerSecondNumerator: number;
      readonly framesPerSecondDenominator: 1;
    };
    readonly operations: readonly {
      readonly operationId: string;
      readonly kind: "select";
      readonly trackId: "video-main";
      readonly sourceMediaId: "fixture-interview-a";
      readonly sourceFrames: {
        readonly startInclusive: number;
        readonly durationFrames: number;
      };
      readonly timelineStartFrame: number;
      readonly reason: string;
      readonly evidence: readonly [{
        readonly kind: "brief-requirement";
        readonly artifactId: "course20-cut-plan-lab";
        readonly artifactSha256: null;
        readonly locator: string;
        readonly evidenceMode: "teaching-fixture";
      }];
      readonly confidence: 1;
      readonly ambiguity: "none-declared" | "rights";
      readonly rightsState: "simulated-cleared" | "unknown";
      readonly requiresHumanReview: true;
    }[];
    readonly targetDurationFrames: number;
    readonly durationToleranceFrames: number;
    readonly expectedDurationFrames: number;
  };
  readonly executionPolicy: {
    readonly dryRunRequired: true;
    readonly overwriteOriginals: false;
    readonly allowNetwork: false;
    readonly allowPublish: false;
    readonly outputDirectory: "edits/course20-lab/";
    readonly stopOnInputHashMismatch: true;
    readonly stopOnUnresolvedAmbiguity: true;
  };
}

function secondsToFrames(seconds: number): number {
  return Math.round(seconds * CUT_PLAN_LAB_FPS);
}

export function buildCutPlanLabPlan(
  clips: readonly CutPlanLabClip[],
  reasons: Readonly<Record<string, string>>,
  targetSeconds: number,
): CutPlanLabPlan {
  let timelineStartFrame = 0;
  const operations = clips.map((clip) => {
    const startInclusive = secondsToFrames(clip.sourceInSeconds);
    const durationFrames = secondsToFrames(clip.sourceOutSeconds) - startInclusive;
    const operation = {
      operationId: `op-keep-${clip.id}`,
      kind: "select" as const,
      trackId: "video-main" as const,
      sourceMediaId: "fixture-interview-a" as const,
      sourceFrames: { startInclusive, durationFrames },
      timelineStartFrame,
      reason: reasons[clip.id] ?? "",
      evidence: [{
        kind: "brief-requirement" as const,
        artifactId: "course20-cut-plan-lab" as const,
        artifactSha256: null,
        locator: `fixture:${clip.id}:${clip.sourceInSeconds}-${clip.sourceOutSeconds}s`,
        evidenceMode: "teaching-fixture" as const,
      }] as const,
      confidence: 1 as const,
      ambiguity: clip.rightsState === "unknown" ? "rights" as const : "none-declared" as const,
      rightsState: clip.rightsState,
      requiresHumanReview: true as const,
    };
    timelineStartFrame += durationFrames;
    return operation;
  });

  return {
    schemaVersion: "aicourse.agentic-video-editing.edit-plan.v2",
    planId: "course20-lab-plan-v2",
    fixtureId: "course20-cut-plan-lab-v2",
    planMode: "teaching-fixture",
    status: "blocked",
    inputs: [{
      inputKind: "synthetic-text-fixture",
      mediaId: "fixture-interview-a",
      expectedSha256: null,
      manifestDecision: "fixture-only-no-source-media",
      rightsDecision: "not-applicable-no-source-media",
      probeReceiptSha256: null,
      expectedDurationFrames: CUT_PLAN_LAB_SOURCE_DURATION_FRAMES,
    }],
    timeline: {
      timebase: {
        framesPerSecondNumerator: CUT_PLAN_LAB_FPS,
        framesPerSecondDenominator: 1,
      },
      operations,
      targetDurationFrames: secondsToFrames(targetSeconds),
      durationToleranceFrames: secondsToFrames(5),
      expectedDurationFrames: timelineStartFrame,
    },
    executionPolicy: {
      dryRunRequired: true,
      overwriteOriginals: false,
      allowNetwork: false,
      allowPublish: false,
      outputDirectory: "edits/course20-lab/",
      stopOnInputHashMismatch: true,
      stopOnUnresolvedAmbiguity: true,
    },
  };
}

const SAFE_OUTPUT_DIRECTORY = /^edits\/(?:[a-z0-9][a-z0-9-]{0,63}\/){1,6}$/u;
const CUT_PLAN_LAB_TOLERANCE_FRAMES = secondsToFrames(5);
const CUT_PLAN_LAB_CLIPS_BY_OPERATION_ID = new Map<string, CutPlanLabClip>(
  CUT_PLAN_LAB_FIXTURE.map((clip) => [`op-keep-${clip.id}`, clip] as const),
);

export function validateCutPlanLabPlan(plan: CutPlanLabPlan): CutPlanLabIssue[] {
  const issues: CutPlanLabIssue[] = [];
  if (plan.planMode !== "teaching-fixture" || plan.status !== "blocked"
    || plan.fixtureId !== "course20-cut-plan-lab-v2"
    || plan.executionPolicy.allowPublish !== false) {
    issues.push({ code: "fixture-boundary" });
  }
  if (!SAFE_OUTPUT_DIRECTORY.test(plan.executionPolicy.outputDirectory)) {
    issues.push({ code: "unsafe-output-directory" });
  }
  if (plan.executionPolicy.dryRunRequired !== true
    || plan.executionPolicy.overwriteOriginals !== false
    || plan.executionPolicy.allowNetwork !== false
    || plan.executionPolicy.allowPublish !== false
    || plan.executionPolicy.stopOnInputHashMismatch !== true
    || plan.executionPolicy.stopOnUnresolvedAmbiguity !== true) {
    issues.push({ code: "unsafe-execution-policy" });
  }
  const operations = plan.timeline.operations;
  if (plan.timeline.timebase.framesPerSecondNumerator !== CUT_PLAN_LAB_FPS
    || plan.timeline.timebase.framesPerSecondDenominator !== 1) {
    issues.push({ code: "fixture-timebase" });
  }
  if (plan.timeline.durationToleranceFrames !== CUT_PLAN_LAB_TOLERANCE_FRAMES) {
    issues.push({ code: "fixture-tolerance" });
  }
  const fixtureInput = plan.inputs.length === 1 ? plan.inputs[0] : undefined;
  if (!fixtureInput
    || fixtureInput.inputKind !== "synthetic-text-fixture"
    || fixtureInput.mediaId !== "fixture-interview-a"
    || fixtureInput.expectedSha256 !== null
    || fixtureInput.manifestDecision !== "fixture-only-no-source-media"
    || fixtureInput.rightsDecision !== "not-applicable-no-source-media"
    || fixtureInput.probeReceiptSha256 !== null
    || fixtureInput.expectedDurationFrames !== CUT_PLAN_LAB_SOURCE_DURATION_FRAMES) {
    issues.push({ code: "fixture-input" });
  }
  if (operations.length < 3) issues.push({ code: "minimum-clips" });
  if (plan.timeline.targetDurationFrames < secondsToFrames(45)
    || plan.timeline.targetDurationFrames > secondsToFrames(60)) {
    issues.push({ code: "target-range" });
  }
  const durationFrames = operations.reduce((sum, operation) => sum + operation.sourceFrames.durationFrames, 0);
  if (durationFrames < secondsToFrames(45) || durationFrames > secondsToFrames(60)) {
    issues.push({ code: "duration-range" });
  }
  if (Math.abs(durationFrames - plan.timeline.targetDurationFrames) > plan.timeline.durationToleranceFrames) {
    issues.push({ code: "target-delta" });
  }
  const operationIds = operations.map((operation) => operation.operationId);
  if (new Set(operationIds).size !== operationIds.length) {
    issues.push({ code: "duplicate-operation-id" });
  }
  const inputs = new Map(plan.inputs.map((input) => [input.mediaId, input]));
  let expectedTimelineStart = 0;
  for (const operation of operations) {
    const input = inputs.get(operation.sourceMediaId);
    if (!input) {
      issues.push({ code: "source-missing", subject: operation.operationId });
    } else if (operation.sourceFrames.startInclusive < 0 || operation.sourceFrames.durationFrames < 1) {
      issues.push({ code: "source-range-invalid", subject: operation.operationId });
    } else if (operation.sourceFrames.startInclusive + operation.sourceFrames.durationFrames > input.expectedDurationFrames) {
      issues.push({ code: "source-range-out-of-bounds", subject: operation.operationId });
    }
    const fixtureClip = CUT_PLAN_LAB_CLIPS_BY_OPERATION_ID.get(operation.operationId);
    if (!fixtureClip
      || operation.kind !== "select"
      || operation.trackId !== "video-main"
      || operation.sourceMediaId !== "fixture-interview-a"
      || operation.sourceFrames.startInclusive !== (fixtureClip ? secondsToFrames(fixtureClip.sourceInSeconds) : -1)
      || operation.sourceFrames.durationFrames !== (fixtureClip
        ? secondsToFrames(fixtureClip.sourceOutSeconds) - secondsToFrames(fixtureClip.sourceInSeconds)
        : -1)
      || operation.confidence !== 1
      || operation.rightsState !== fixtureClip?.rightsState
      || operation.ambiguity !== (fixtureClip?.rightsState === "unknown" ? "rights" : "none-declared")) {
      issues.push({ code: "fixture-operation", subject: operation.operationId });
    }
    const evidence = operation.evidence;
    const expectedLocator = fixtureClip
      ? `fixture:${fixtureClip.id}:${fixtureClip.sourceInSeconds}-${fixtureClip.sourceOutSeconds}s`
      : "";
    if (evidence.length !== 1
      || evidence[0]?.kind !== "brief-requirement"
      || evidence[0]?.artifactId !== "course20-cut-plan-lab"
      || evidence[0]?.artifactSha256 !== null
      || evidence[0]?.locator !== expectedLocator
      || evidence[0]?.evidenceMode !== "teaching-fixture") {
      issues.push({ code: "evidence-unresolved", subject: operation.operationId });
    }
    if (operation.timelineStartFrame !== expectedTimelineStart) {
      issues.push({ code: "timeline-discontinuity", subject: operation.operationId });
    }
    expectedTimelineStart += operation.sourceFrames.durationFrames;
    if (operation.rightsState !== "simulated-cleared") {
      issues.push({ code: "rights-unresolved", subject: operation.operationId });
    }
    if (operation.ambiguity !== "none-declared") {
      issues.push({ code: "unresolved-ambiguity", subject: operation.operationId });
    }
    if (operation.requiresHumanReview !== true) {
      issues.push({ code: "human-review-disabled", subject: operation.operationId });
    }
    if (operation.reason.trim().length < 20) {
      issues.push({ code: "reason-short", subject: operation.operationId });
    }
  }
  if (expectedTimelineStart !== plan.timeline.expectedDurationFrames) {
    issues.push({ code: "expected-duration-mismatch" });
  }
  return issues;
}
