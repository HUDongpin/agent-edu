import type {
  AgenticVideoEditingCriticalControlId,
  AgenticVideoEditingFinalQuestionCopy,
  AgenticVideoEditingModuleSlug,
  AgenticVideoEditingCheckpointCopy,
} from "./types";

export const COURSE20_ASSESSMENT_CONTRACT_VERSION =
  "aicourse.course20.assessment.v1.2.0" as const;

export type Course20AssessmentLocale = "en" | "zh-Hans";
export type Course20OptionIds = readonly [string, string, string, string];

export interface Course20CheckpointBlueprint {
  readonly questionId: `checkpoint:${AgenticVideoEditingModuleSlug}`;
  readonly moduleSlug: AgenticVideoEditingModuleSlug;
  readonly optionIds: Course20OptionIds;
  readonly correctOptionId: string;
}

export interface Course20FinalQuestionBlueprint {
  readonly questionId: `q${number}`;
  readonly moduleSlug: AgenticVideoEditingModuleSlug;
  readonly objectiveId: string;
  readonly optionIds: Course20OptionIds;
  readonly correctOptionId: string;
  readonly critical: boolean;
  readonly criticalControlId?: AgenticVideoEditingCriticalControlId;
  readonly sourceIds: readonly [string, ...string[]];
}

/**
 * FNV-1a/32 is used as a deterministic editorial-change detector, not as a
 * credential or adversarial signature. Receipts also bind the versioned
 * blueprint; server-signed certification is explicitly outside this course.
 */
export function fingerprintCourse20AssessmentValue(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function fingerprintCourse20QuestionCopy(
  question: AgenticVideoEditingCheckpointCopy,
): string {
  return fingerprintCourse20AssessmentValue({
    question: question.question,
    explanation: question.explanation,
    orderedOptionLabels: question.options.map((option) => option.label),
    orderedOptionFeedback: question.options.map((option) => option.feedback),
  });
}

export const COURSE20_CHECKPOINT_BLUEPRINTS = {
  "agentic-editing-contract": {
    questionId: "checkpoint:agentic-editing-contract",
    moduleSlug: "agentic-editing-contract",
    optionIds: ["render-final-cuts", "define-observable-contract", "add-transitions", "delegate-brand-position"],
    correctOptionId: "define-observable-contract",
  },
  "media-ingest-provenance": {
    questionId: "checkpoint:media-ingest-provenance",
    moduleSlug: "media-ingest-provenance",
    optionIds: ["playable-means-usable", "publish-then-wait", "quarantine-unknown-rights", "delete-provenance"],
    correctOptionId: "quarantine-unknown-rights",
  },
  "transcripts-shots-index": {
    questionId: "checkpoint:transcripts-shots-index",
    moduleSlug: "transcripts-shots-index",
    optionIds: ["guess-common-name", "preserve-uncertainty-verify-source", "delete-interview", "trust-completed-transcript"],
    correctOptionId: "preserve-uncertainty-verify-source",
  },
  "semantic-analysis-director": {
    questionId: "checkpoint:semantic-analysis-director",
    moduleSlug: "semantic-analysis-director",
    optionIds: ["frame-accurate-fact", "candidate-verify-source-evidence", "publication-approval", "license-proof"],
    correctOptionId: "candidate-verify-source-evidence",
  },
  "declarative-edit-plan": {
    questionId: "checkpoint:declarative-edit-plan",
    moduleSlug: "declarative-edit-plan",
    optionIds: ["truth-judging-model", "social-publisher", "timeline-interchange-not-renderer", "music-rights-database"],
    correctOptionId: "timeline-interchange-not-renderer",
  },
  "agent-tools-mcp": {
    questionId: "checkpoint:agent-tools-mcp",
    moduleSlug: "agent-tools-mcp",
    optionIds: ["professional-taste", "callable-tools-under-authority", "all-actions-undoable", "vendor-endorsement"],
    correctOptionId: "callable-tools-under-authority",
  },
  "captions-audio-formats": {
    questionId: "checkpoint:captions-audio-formats",
    moduleSlug: "captions-audio-formats",
    optionIds: ["one-center-crop", "horizontal-pass-auto-approves", "per-segment-plan-and-independent-review", "delete-cropped-records"],
    correctOptionId: "per-segment-plan-and-independent-review",
  },
  "deterministic-rendering": {
    questionId: "checkpoint:deterministic-rendering",
    moduleSlug: "deterministic-rendering",
    optionIds: ["licensed-output", "effective-story", "process-completed-needs-review", "publish-authority"],
    correctOptionId: "process-completed-needs-review",
  },
  "verification-human-review": {
    questionId: "checkpoint:verification-human-review",
    moduleSlug: "verification-human-review",
    optionIds: ["retry-forever", "lower-standard", "stop-preserve-escalate", "publish-anyway"],
    correctOptionId: "stop-preserve-escalate",
  },
  "production-capstone": {
    questionId: "checkpoint:production-capstone",
    moduleSlug: "production-capstone",
    optionIds: ["last-model", "any-file-viewer", "named-human-exact-version", "render-engine"],
    correctOptionId: "named-human-exact-version",
  },
} as const satisfies Readonly<Record<
  AgenticVideoEditingModuleSlug,
  Course20CheckpointBlueprint
>>;

export const COURSE20_FINAL_ASSESSMENT_BLUEPRINTS = {
  q1: {
    questionId: "q1",
    moduleSlug: "agentic-editing-contract",
    objectiveId: "objective-brief-and-authority",
    optionIds: ["execute-intent-publish", "prompt-render-publish", "intent-evidence-plan-authority-execute-verify-decide", "evidence-publish-plan"],
    correctOptionId: "intent-evidence-plan-authority-execute-verify-decide",
    critical: false,
    sourceIds: ["video-use", "videodb-director", "bbc-editorial-accuracy"],
  },
  q2: {
    questionId: "q2",
    moduleSlug: "media-ingest-provenance",
    objectiveId: "objective-ingest-rights-untrusted-media",
    optionIds: ["fast-internet", "delete-local-copy", "desktop-implies-local", "declared-path-authority-retention-permission"],
    correctOptionId: "declared-path-authority-retention-permission",
    critical: true,
    criticalControlId: "rights-privacy-input-authority",
    sourceIds: ["ffmpeg", "ffprobe-docs", "c2pa-spec", "usco-ai-study"],
  },
  q3: {
    questionId: "q3",
    moduleSlug: "transcripts-shots-index",
    objectiveId: "objective-timecoded-evidence",
    optionIds: ["decimal-seconds-rounded", "integer-source-clocks-vfr-lineage-time-map", "exclude-mixed-rate", "asr-timestamps-as-media-clock"],
    correctOptionId: "integer-source-clocks-vfr-lineage-time-map",
    critical: false,
    sourceIds: ["whisper", "whisperx", "pyscenedetect", "ffmpeg", "ffprobe-docs"],
  },
  q4: {
    questionId: "q4",
    moduleSlug: "semantic-analysis-director",
    objectiveId: "objective-editing-grammar-candidates",
    optionIds: ["model-timestamp-is-fact", "candidate-with-evidence-ambiguity-escalation", "candidate-is-approval", "candidate-proves-rights"],
    correctOptionId: "candidate-with-evidence-ambiguity-escalation",
    critical: false,
    sourceIds: ["video-use", "videodb-director", "adobe-j-l-cuts", "bbc-editorial-accuracy"],
  },
  q5: {
    questionId: "q5",
    moduleSlug: "declarative-edit-plan",
    objectiveId: "objective-production-edit-plan-v3",
    optionIds: ["filename-decimal-seconds", "nle-export-as-canonical-plan", "typed-operations-hashes-clocks-evidence-rights-approval", "prompt-as-edit-plan"],
    correctOptionId: "typed-operations-hashes-clocks-evidence-rights-approval",
    critical: false,
    sourceIds: ["opentimelineio", "opentimelineio-docs", "ffprobe-docs", "video-edit-cli"],
  },
  q6: {
    questionId: "q6",
    moduleSlug: "agent-tools-mcp",
    objectiveId: "objective-least-privilege-indirect-injection",
    optionIds: ["follow-media-instructions", "approved-policy-controls-authority", "tool-output-can-read-secrets", "mcp-implies-safety"],
    correctOptionId: "approved-policy-controls-authority",
    critical: true,
    criticalControlId: "agent-tool-authority-indirect-injection",
    sourceIds: ["model-context-protocol-spec", "owasp-prompt-injection", "owasp-excessive-agency", "davinci-resolve-mcp"],
  },
  q7: {
    questionId: "q7",
    moduleSlug: "captions-audio-formats",
    objectiveId: "objective-delivery-accessibility-contract",
    optionIds: ["duration-dimensions-only", "delivery-accessibility-contract-complete", "burn-in-discard-sidecar", "visual-metric-only"],
    correctOptionId: "delivery-accessibility-contract-complete",
    critical: true,
    criticalControlId: "delivery-semantic-caption-variant",
    sourceIds: ["wcag-2-2-captions", "w3c-media-planning", "w3c-visual-description", "itu-bs-1770", "ebu-r128", "aces-docs", "ffmpeg"],
  },
  q8: {
    questionId: "q8",
    moduleSlug: "deterministic-rendering",
    objectiveId: "objective-controlled-receipt-backed-render",
    optionIds: ["exit-zero-proves-release", "receipt-binds-plan-policy-input-output", "render-proves-rights", "stderr-can-be-hidden"],
    correctOptionId: "receipt-binds-plan-policy-input-output",
    critical: false,
    sourceIds: ["ffmpeg", "ffprobe-docs", "remotion", "remotion-skills"],
  },
  q9: {
    questionId: "q9",
    moduleSlug: "verification-human-review",
    objectiveId: "objective-multilayer-qc-repair-regression",
    optionIds: ["route-repair-rerender-reverify-regress-escalate", "retry-unbounded", "relax-safe-zone", "delete-failed-report"],
    correctOptionId: "route-repair-rerender-reverify-regress-escalate",
    critical: false,
    sourceIds: ["vmaf", "ffmpeg", "wcag-2-2-captions", "w3c-visual-description", "itu-bs-1770", "ebu-r128", "aces-docs", "bbc-editorial-accuracy"],
  },
  q10: {
    questionId: "q10",
    moduleSlug: "production-capstone",
    objectiveId: "objective-packaging-recovery-release-handoff",
    optionIds: ["agent-silent", "render-finished", "named-human-exact-version-decision", "file-uploaded"],
    correctOptionId: "named-human-exact-version-decision",
    critical: true,
    criticalControlId: "final-release-authority",
    sourceIds: ["opentimelineio", "ffmpeg", "c2pa-spec", "eu-ai-act-article-50", "usco-ai-study", "bbc-editorial-accuracy"],
  },
} as const satisfies Readonly<Record<string, Course20FinalQuestionBlueprint>>;

export const COURSE20_APPROVED_EDITORIAL_FINGERPRINTS = {
  checkpoints: {
    en: {
      "agentic-editing-contract": "70e57da6",
      "media-ingest-provenance": "b66f382c",
      "transcripts-shots-index": "63c1a9e4",
      "semantic-analysis-director": "99d6fbbb",
      "declarative-edit-plan": "390fb6d8",
      "agent-tools-mcp": "e11c724c",
      "captions-audio-formats": "f48943b2",
      "deterministic-rendering": "77b92241",
      "verification-human-review": "1aff0973",
      "production-capstone": "113ade8b",
    },
    "zh-Hans": {
      "agentic-editing-contract": "763533df",
      "media-ingest-provenance": "008159d9",
      "transcripts-shots-index": "ec4aad07",
      "semantic-analysis-director": "81c4f2d4",
      "declarative-edit-plan": "957894c5",
      "agent-tools-mcp": "7c5bf138",
      "captions-audio-formats": "5dec84db",
      "deterministic-rendering": "1bc972d7",
      "verification-human-review": "00aafde4",
      "production-capstone": "9afe3ead",
    },
  },
  final: {
    en: {
      q1: "0e43e461",
      q2: "a732b279",
      q3: "884f2146",
      q4: "fcce67c3",
      q5: "31b0a262",
      q6: "28c67352",
      q7: "cbabd969",
      q8: "620b9655",
      q9: "2b3fc534",
      q10: "3364ade4",
    },
    "zh-Hans": {
      q1: "be79e7f3",
      q2: "2824c838",
      q3: "d99e3206",
      q4: "4b00c98f",
      q5: "a0515e58",
      q6: "bee25d33",
      q7: "86f14c65",
      q8: "4c254055",
      q9: "08557b5d",
      q10: "ffa48520",
    },
  },
} as const;

export const COURSE20_ASSESSMENT_BLUEPRINT_FINGERPRINT =
  fingerprintCourse20AssessmentValue({
    version: COURSE20_ASSESSMENT_CONTRACT_VERSION,
    checkpoints: COURSE20_CHECKPOINT_BLUEPRINTS,
    final: COURSE20_FINAL_ASSESSMENT_BLUEPRINTS,
    editorial: COURSE20_APPROVED_EDITORIAL_FINGERPRINTS,
    questionCount: 10,
    passPercent: 80,
  });

export function getCourse20CheckpointBlueprint(
  slug: AgenticVideoEditingModuleSlug,
): Course20CheckpointBlueprint {
  return COURSE20_CHECKPOINT_BLUEPRINTS[slug];
}

export function getCourse20FinalQuestionBlueprint(
  questionId: string,
): Course20FinalQuestionBlueprint | undefined {
  return COURSE20_FINAL_ASSESSMENT_BLUEPRINTS[
    questionId as keyof typeof COURSE20_FINAL_ASSESSMENT_BLUEPRINTS
  ];
}

export function scoreCourse20FinalAssessment(
  questions: readonly AgenticVideoEditingFinalQuestionCopy[],
  answers: Readonly<Record<string, string>>,
): {
  readonly correct: number;
  readonly score: number;
  readonly criticalMiss: boolean;
  readonly passed: boolean;
} {
  const blueprints = questions.map((question) => {
    const blueprint = getCourse20FinalQuestionBlueprint(question.id);
    if (!blueprint) throw new Error(`Unknown Course 20 question: ${question.id}`);
    return blueprint;
  });
  const correct = blueprints.filter(
    (blueprint) => answers[blueprint.questionId] === blueprint.correctOptionId,
  ).length;
  const score = Math.round((correct / blueprints.length) * 100);
  const criticalMiss = blueprints.some(
    (blueprint) => blueprint.critical
      && answers[blueprint.questionId] !== blueprint.correctOptionId,
  );
  return { correct, score, criticalMiss, passed: score >= 80 && !criticalMiss };
}
