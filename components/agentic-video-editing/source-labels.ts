import type {
  AgenticVideoEditingSourceRecord,
  AgenticVideoEditingSourceRole,
} from "@/lib/agentic-video-editing";

type Labels = Readonly<Record<string, string>>;

function label(labels: Labels, key: string, fallback: string): string {
  const value = labels[key];
  return value && value.trim() ? value : fallback;
}

export function sourceRoleLabel(
  role: AgenticVideoEditingSourceRole,
  labels: Labels,
): string {
  const roleLabels: Record<AgenticVideoEditingSourceRole, readonly [string, string]> = {
    "execution-engine": ["roleExecutionEngine", "Execution engine"],
    "analysis-component": ["roleAnalysisComponent", "Analysis component"],
    "code-directed-workflow": ["roleCodeDirectedWorkflow", "Code-directed workflow"],
    "timeline-contract": ["roleTimelineContract", "Timeline contract"],
    "agent-architecture": ["roleAgentArchitecture", "Agent architecture"],
    "agent-tool-surface": ["roleAgentToolSurface", "Agent tool surface"],
    "quality-control": ["roleQualityControl", "Quality control"],
    "field-signal": ["roleFieldSignal", "Field signal"],
    "protocol-contract": ["roleAgentToolSurface", "Protocol contract"],
    "accessibility-standard": ["roleQualityControl", "Accessibility standard"],
    "provenance-standard": ["roleTimelineContract", "Provenance standard"],
  };
  const [key, fallback] = roleLabels[role];
  return label(labels, key, fallback);
}

export function sourceKindLabel(
  source: AgenticVideoEditingSourceRecord,
  labels: Labels,
): string {
  switch (source.kind) {
    case "github-repository":
      return label(labels, "githubRepository", "GitHub repository");
    case "x-post":
      return label(labels, "xPost", "Dated X field signal");
    case "official-documentation":
      return label(labels, "officialDocumentation", "Official documentation");
    case "open-standard":
      return label(labels, "openStandard", "Open standard");
    case "legal-policy":
      return label(labels, "legalPolicy", "Legal or provider policy");
    case "community-issue":
      return label(labels, "communityIssue", "Unverified community issue");
  }
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
