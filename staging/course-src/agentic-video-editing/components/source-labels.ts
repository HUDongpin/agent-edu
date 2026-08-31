import type {
  AgenticVideoEditingSourceRecord,
  AgenticVideoEditingSourceRole,
  AgenticVideoEditingUiKey,
} from "@/staging/course-src/agentic-video-editing";

type Labels = Readonly<Record<string, string>>;

function label(labels: Labels, key: AgenticVideoEditingUiKey, fallback: string): string {
  const value = labels[key];
  return value && value.trim() ? value : fallback;
}

export function sourceRoleLabel(
  role: AgenticVideoEditingSourceRole,
  labels: Labels,
): string {
  const roleLabels: Record<AgenticVideoEditingSourceRole, readonly [AgenticVideoEditingUiKey, string]> = {
    "execution-engine": ["roleExecutionEngine", "Execution engine"],
    "analysis-component": ["roleAnalysisComponent", "Analysis component"],
    "deterministic-automation": ["roleDeterministicAutomation", "Rule-based automation"],
    "timeline-contract": ["roleTimelineContract", "Timeline contract"],
    "agent-architecture": ["roleAgentArchitecture", "Agent architecture"],
    "agent-tool-surface": ["roleAgentToolSurface", "Agent tool surface"],
    "quality-control": ["roleQualityControl", "Quality control"],
    "field-signal": ["roleFieldSignal", "Field signal"],
    "protocol-specification": ["roleProtocolSpecification", "Protocol specification"],
    "security-guidance": ["roleSecurityGuidance", "Security guidance"],
    "accessibility-standard": ["roleAccessibilityStandard", "Accessibility standard"],
    "audio-standard": ["roleAudioStandard", "Audio standard"],
    "color-management": ["roleColorManagement", "Color management"],
    "editorial-guidance": ["roleEditorialGuidance", "Editorial guidance"],
    "legal-guidance": ["roleLegalGuidance", "Jurisdiction-specific guidance"],
    "media-provenance": ["roleMediaProvenance", "Media provenance"],
  };
  const [key, fallback] = roleLabels[role];
  return label(labels, key, fallback);
}

export function xVerificationLabel(
  source: Extract<AgenticVideoEditingSourceRecord, { kind: "x-post" }>,
  labels: Labels,
): string {
  const completeness = source.textCompleteness === "oembed-complete"
    ? label(labels, "oembedComplete", "Complete visible post text")
    : label(labels, "oembedTruncated", "Visible post text is truncated");
  return `${completeness} · ${label(labels, "officialXOembed", "Official X oEmbed")}`;
}
