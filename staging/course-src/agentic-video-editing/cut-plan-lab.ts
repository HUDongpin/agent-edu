export const CUT_PLAN_LAB_FPS = 30;
export const CUT_PLAN_LAB_SOURCE_DURATION_FRAMES = 3_660;
export const COURSE20_SYNTHETIC_PRACTICUM_PROJECT_ID =
  "course20-synthetic-practicum-v2" as const;
export const COURSE20_VERIFIED_CUT_PROJECT_SPEC_ID =
  "course20-verified-cut-v2" as const;

export const CUT_PLAN_LAB_FIXTURE = [
  { id: "hook", label: "Opening promise", labelZhHans: "开场承诺", sourceInSeconds: 12.4, sourceOutSeconds: 20.4, rightsState: "simulated-cleared" as const, defaultReason: "States the central promise in the speaker's own words.", defaultReasonZhHans: "用讲者自己的原话提出核心承诺，同时不扩大原始主张。" },
  { id: "context", label: "Why the problem matters", labelZhHans: "问题为何重要", sourceInSeconds: 34.2, sourceOutSeconds: 46.2, rightsState: "simulated-cleared" as const, defaultReason: "Supplies the minimum context needed to avoid a misleading claim.", defaultReasonZhHans: "补足避免主张被误解所需的最少语境，并保留关键限定。" },
  { id: "archive", label: "Unverified archive insert", labelZhHans: "未核验的档案插入", sourceInSeconds: 50, sourceOutSeconds: 61.5, rightsState: "unknown" as const, defaultReason: "Visually resembles the topic, but source rights are unresolved.", defaultReasonZhHans: "画面看似符合主题，但来源权利仍未解决，必须保持阻断。" },
  { id: "method", label: "How the method works", labelZhHans: "方法如何运作", sourceInSeconds: 74.1, sourceOutSeconds: 88.1, rightsState: "simulated-cleared" as const, defaultReason: "Explains the mechanism instead of adding an unsupported result claim.", defaultReasonZhHans: "解释实际机制，不加入来源没有支持的结果或效果主张。" },
  { id: "close", label: "Accountable close", labelZhHans: "可追责的结尾", sourceInSeconds: 109, sourceOutSeconds: 122, rightsState: "simulated-cleared" as const, defaultReason: "Closes with the intended action and preserves the named limitation.", defaultReasonZhHans: "以预定行动收束，同时明确保留已经说明的限制条件。" },
] as const;

export type CutPlanLabClip = (typeof CUT_PLAN_LAB_FIXTURE)[number];
export type CutPlanLabIssueCode =
  | "fixture-boundary" | "minimum-clips" | "target-range" | "duration-range"
  | "target-delta" | "rights-unresolved" | "reason-short" | "duplicate-clip-id"
  | "source-missing" | "source-range-invalid" | "source-range-out-of-bounds"
  | "timeline-discontinuity" | "non-integral-timebase-conversion"
  | "expected-duration-mismatch" | "fixture-timebase" | "fixture-tolerance"
  | "fixture-input" | "fixture-clip" | "evidence-unresolved"
  | "unresolved-ambiguity" | "human-review-disabled" | "review-state-blocked"
  | "vfr-not-conformed" | "conform-receipt-missing";

export interface CutPlanLabIssue {
  readonly code: CutPlanLabIssueCode;
  readonly subject?: string;
}

export interface RationalTimebase {
  readonly framesPerSecondNumerator: number;
  readonly framesPerSecondDenominator: number;
}

interface SemanticInput {
  readonly mediaId: string;
  readonly sourceTimebase: RationalTimebase;
  readonly clockMode: "cfr-native-frames" | "cfr-conformed-proxy";
  readonly expectedDurationFrames: number;
  readonly conformReceipt?: Readonly<Record<string, unknown>>;
}

interface SemanticClip {
  readonly clipId: string;
  readonly kind: "select";
  readonly sourceMediaId: string;
  readonly sourceFrames: { readonly startInclusive: number; readonly durationFrames: number };
  readonly timelineStartFrame: number;
  readonly gapBeforeFrames: number;
  readonly reason: string;
  readonly evidenceReferences: readonly {
    readonly kind: "brief-requirement" | "transcript-span" | "shot-boundary" | "visual-observation" | "human-note";
    readonly artifactId: string;
    readonly artifactSha256: string | null;
    readonly locator: string;
    readonly evidenceMode: "source-record" | "teaching-fixture";
  }[];
  readonly ambiguity: "none-declared" | "timing" | "speaker-attribution" | "meaning" | "rights" | "privacy" | "creative-intent";
  readonly rightsState: "approved-for-declared-use" | "simulated-cleared" | "unknown";
  readonly requiresHumanReview: true;
  readonly reviewState: "pending" | "approved" | "blocked";
}

export interface SelectionPlanV2SemanticShape {
  readonly planMode: "production" | "teaching-fixture";
  readonly status: "draft" | "ready-for-human-review" | "blocked";
  readonly fixtureId?: string;
  readonly inputs: readonly SemanticInput[];
  readonly timeline: {
    readonly trackId: "video-main";
    readonly timebase: RationalTimebase;
    readonly clips: readonly SemanticClip[];
    readonly targetDurationFrames: number;
    readonly durationToleranceFrames: number;
    readonly expectedDurationFrames: number;
  };
}

export interface CutPlanLabPlan extends SelectionPlanV2SemanticShape {
  readonly schemaVersion: "aicourse.agentic-video-editing.selection-plan.v2";
  readonly planId: "course20-lab-selection-plan-v2";
  readonly projectSpecId: typeof COURSE20_VERIFIED_CUT_PROJECT_SPEC_ID;
  readonly projectId: typeof COURSE20_SYNTHETIC_PRACTICUM_PROJECT_ID;
  readonly fixtureId: "course20-selection-plan-lab-v2";
  readonly planMode: "teaching-fixture";
  readonly status: "blocked";
  readonly inputs: readonly [{
    readonly inputKind: "synthetic-text-fixture";
    readonly mediaId: "source-30-cfr";
    readonly inputSha256: null;
    readonly probeReceiptSha256: null;
    readonly rightsDecision: "not-applicable-no-source-media";
    readonly sourceTimebase: { readonly framesPerSecondNumerator: 30; readonly framesPerSecondDenominator: 1 };
    readonly clockMode: "cfr-native-frames";
    readonly expectedDurationFrames: number;
  }];
  readonly timeline: SelectionPlanV2SemanticShape["timeline"] & {
    readonly trackId: "video-main";
    readonly timebase: { readonly framesPerSecondNumerator: 30; readonly framesPerSecondDenominator: 1 };
  };
}

function secondsToFrames(seconds: number): number {
  return Math.round(seconds * CUT_PLAN_LAB_FPS);
}

function convertSourceToTimelineFrames(sourceFrames: number, source: RationalTimebase, timeline: RationalTimebase): number | null {
  const numerator = sourceFrames * source.framesPerSecondDenominator * timeline.framesPerSecondNumerator;
  const denominator = source.framesPerSecondNumerator * timeline.framesPerSecondDenominator;
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator)
    || denominator < 1 || numerator % denominator !== 0) return null;
  return numerator / denominator;
}

export function buildCutPlanLabPlan(
  clips: readonly CutPlanLabClip[],
  reasons: Readonly<Record<string, string>>,
  targetSeconds: number,
): CutPlanLabPlan {
  let timelineStartFrame = 0;
  const timelineClips = clips.map((clip) => {
    const startInclusive = secondsToFrames(clip.sourceInSeconds);
    const durationFrames = secondsToFrames(clip.sourceOutSeconds) - startInclusive;
    const item = {
      clipId: `clip-keep-${clip.id}`,
      kind: "select" as const,
      sourceMediaId: "source-30-cfr",
      sourceFrames: { startInclusive, durationFrames },
      timelineStartFrame,
      gapBeforeFrames: 0,
      reason: reasons[clip.id] ?? "",
      evidenceReferences: [{
        kind: "brief-requirement" as const,
        artifactId: "course20-cut-plan-lab",
        artifactSha256: null,
        locator: `fixture:${clip.id}:${clip.sourceInSeconds}-${clip.sourceOutSeconds}s`,
        evidenceMode: "teaching-fixture" as const,
      }],
      ambiguity: clip.rightsState === "unknown" ? "rights" as const : "none-declared" as const,
      rightsState: clip.rightsState,
      requiresHumanReview: true as const,
      reviewState: clip.rightsState === "unknown" ? "blocked" as const : "approved" as const,
    };
    timelineStartFrame += durationFrames;
    return item;
  });
  return {
    schemaVersion: "aicourse.agentic-video-editing.selection-plan.v2",
    planId: "course20-lab-selection-plan-v2",
    projectSpecId: COURSE20_VERIFIED_CUT_PROJECT_SPEC_ID,
    projectId: COURSE20_SYNTHETIC_PRACTICUM_PROJECT_ID,
    fixtureId: "course20-selection-plan-lab-v2",
    planMode: "teaching-fixture",
    status: "blocked",
    inputs: [{
      inputKind: "synthetic-text-fixture",
      mediaId: "source-30-cfr",
      inputSha256: null,
      probeReceiptSha256: null,
      rightsDecision: "not-applicable-no-source-media",
      sourceTimebase: { framesPerSecondNumerator: 30, framesPerSecondDenominator: 1 },
      clockMode: "cfr-native-frames",
      expectedDurationFrames: CUT_PLAN_LAB_SOURCE_DURATION_FRAMES,
    }],
    timeline: {
      trackId: "video-main",
      timebase: { framesPerSecondNumerator: 30, framesPerSecondDenominator: 1 },
      clips: timelineClips,
      targetDurationFrames: secondsToFrames(targetSeconds),
      durationToleranceFrames: secondsToFrames(5),
      expectedDurationFrames: timelineStartFrame,
    },
  };
}

export function validateSelectionPlanV2Semantics(plan: SelectionPlanV2SemanticShape): CutPlanLabIssue[] {
  const issues: CutPlanLabIssue[] = [];
  const inputs = new Map(plan.inputs.map((input) => [input.mediaId, input]));
  const ids = plan.timeline.clips.map((clip) => clip.clipId);
  if (new Set(ids).size !== ids.length) issues.push({ code: "duplicate-clip-id" });
  for (const input of plan.inputs) {
    if ((input as { clockMode?: string }).clockMode === "vfr-native-timestamps") issues.push({ code: "vfr-not-conformed", subject: input.mediaId });
    if (input.clockMode === "cfr-conformed-proxy" && !input.conformReceipt) issues.push({ code: "conform-receipt-missing", subject: input.mediaId });
  }
  let expectedStart = 0;
  for (const clip of plan.timeline.clips) {
    const input = inputs.get(clip.sourceMediaId);
    if (!input) {
      issues.push({ code: "source-missing", subject: clip.clipId });
      continue;
    }
    if (clip.sourceFrames.startInclusive < 0 || clip.sourceFrames.durationFrames < 1) issues.push({ code: "source-range-invalid", subject: clip.clipId });
    else if (clip.sourceFrames.startInclusive + clip.sourceFrames.durationFrames > input.expectedDurationFrames) issues.push({ code: "source-range-out-of-bounds", subject: clip.clipId });
    const timelineFrames = convertSourceToTimelineFrames(clip.sourceFrames.durationFrames, input.sourceTimebase, plan.timeline.timebase);
    if (timelineFrames === null) {
      issues.push({ code: "non-integral-timebase-conversion", subject: clip.clipId });
      continue;
    }
    expectedStart += clip.gapBeforeFrames;
    if (clip.timelineStartFrame !== expectedStart) issues.push({ code: "timeline-discontinuity", subject: clip.clipId });
    expectedStart += timelineFrames;
    if (!["approved-for-declared-use", "simulated-cleared"].includes(clip.rightsState)) issues.push({ code: "rights-unresolved", subject: clip.clipId });
    if (clip.ambiguity !== "none-declared") issues.push({ code: "unresolved-ambiguity", subject: clip.clipId });
    if (clip.requiresHumanReview !== true) issues.push({ code: "human-review-disabled", subject: clip.clipId });
    if (clip.reviewState === "blocked") issues.push({ code: "review-state-blocked", subject: clip.clipId });
    if (clip.reason.trim().length < 20) issues.push({ code: "reason-short", subject: clip.clipId });
  }
  if (expectedStart !== plan.timeline.expectedDurationFrames) issues.push({ code: "expected-duration-mismatch" });
  return issues;
}

const FIXTURE_BY_CLIP_ID = new Map<string, CutPlanLabClip>(
  CUT_PLAN_LAB_FIXTURE.map((clip) => [`clip-keep-${clip.id}`, clip] as const),
);

export function validateCutPlanLabPlan(plan: CutPlanLabPlan): CutPlanLabIssue[] {
  const issues = validateSelectionPlanV2Semantics(plan);
  if (plan.planMode !== "teaching-fixture" || plan.status !== "blocked" || plan.fixtureId !== "course20-selection-plan-lab-v2") issues.push({ code: "fixture-boundary" });
  if (plan.timeline.trackId !== "video-main" || plan.timeline.timebase.framesPerSecondNumerator !== 30 || plan.timeline.timebase.framesPerSecondDenominator !== 1) issues.push({ code: "fixture-timebase" });
  if (plan.timeline.durationToleranceFrames !== secondsToFrames(5)) issues.push({ code: "fixture-tolerance" });
  const input = plan.inputs.length === 1 ? plan.inputs[0] : undefined;
  if (!input || input.mediaId !== "source-30-cfr" || input.inputSha256 !== null || input.probeReceiptSha256 !== null
    || input.rightsDecision !== "not-applicable-no-source-media" || input.clockMode !== "cfr-native-frames"
    || input.expectedDurationFrames !== CUT_PLAN_LAB_SOURCE_DURATION_FRAMES) issues.push({ code: "fixture-input" });
  if (plan.timeline.clips.length < 3) issues.push({ code: "minimum-clips" });
  if (plan.timeline.targetDurationFrames < secondsToFrames(45) || plan.timeline.targetDurationFrames > secondsToFrames(60)) issues.push({ code: "target-range" });
  const duration = plan.timeline.clips.reduce((sum, clip) => sum + clip.sourceFrames.durationFrames + clip.gapBeforeFrames, 0);
  if (duration < secondsToFrames(45) || duration > secondsToFrames(60)) issues.push({ code: "duration-range" });
  if (Math.abs(duration - plan.timeline.targetDurationFrames) > plan.timeline.durationToleranceFrames) issues.push({ code: "target-delta" });
  for (const clip of plan.timeline.clips) {
    const fixture = FIXTURE_BY_CLIP_ID.get(clip.clipId);
    if (!fixture || clip.kind !== "select" || clip.sourceMediaId !== "source-30-cfr"
      || clip.sourceFrames.startInclusive !== (fixture ? secondsToFrames(fixture.sourceInSeconds) : -1)
      || clip.sourceFrames.durationFrames !== (fixture ? secondsToFrames(fixture.sourceOutSeconds) - secondsToFrames(fixture.sourceInSeconds) : -1)
      || clip.gapBeforeFrames !== 0 || clip.rightsState !== fixture?.rightsState
      || clip.reviewState !== (fixture?.rightsState === "unknown" ? "blocked" : "approved")) issues.push({ code: "fixture-clip", subject: clip.clipId });
    const evidence = clip.evidenceReferences[0];
    const expectedLocator = fixture ? `fixture:${fixture.id}:${fixture.sourceInSeconds}-${fixture.sourceOutSeconds}s` : "";
    if (clip.evidenceReferences.length !== 1 || evidence?.artifactId !== "course20-cut-plan-lab"
      || evidence?.artifactSha256 !== null || evidence?.locator !== expectedLocator || evidence?.evidenceMode !== "teaching-fixture") issues.push({ code: "evidence-unresolved", subject: clip.clipId });
  }
  return issues;
}
