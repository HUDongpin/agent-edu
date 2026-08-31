import type {
  AgenticVideoEditingArtifactContract,
  AgenticVideoEditingArtifactId,
  AgenticVideoEditingModuleSlug,
} from "./types";

export const AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS = [
  {
    id: "creative-brief-responsibility-map",
    moduleSlug: "agentic-editing-contract",
    filename: "creative-brief.json",
    format: "json",
    schemaId: "aicourse.course20.creative-brief.v2",
    validatorId: "course20.creative-brief.semantic.v2",
    requiredForCapstone: true,
    requiredForModuleCompletion: true,
    dependsOn: [],
  },
  {
    id: "media-manifest-provenance-quarantine",
    moduleSlug: "media-ingest-provenance",
    filename: "media-manifest.yaml",
    format: "yaml",
    schemaId: "aicourse.course20.media-manifest.v2",
    validatorId: "course20.media-manifest.semantic.v2",
    requiredForCapstone: true,
    requiredForModuleCompletion: true,
    dependsOn: ["creative-brief-responsibility-map"],
  },
  {
    id: "evidence-index-transcript-shots",
    moduleSlug: "transcripts-shots-index",
    filename: "evidence-index.json",
    format: "json",
    schemaId: "aicourse.course20.evidence-index.v2",
    validatorId: "course20.evidence-index.semantic.v2",
    requiredForCapstone: true,
    requiredForModuleCompletion: true,
    dependsOn: ["media-manifest-provenance-quarantine"],
  },
  {
    id: "candidate-segments-system-card",
    moduleSlug: "semantic-analysis-director",
    filename: "candidate-segments.json",
    format: "json",
    schemaId: "aicourse.course20.candidate-segments.v2",
    validatorId: "course20.candidate-segments.semantic.v2",
    requiredForCapstone: true,
    requiredForModuleCompletion: true,
    dependsOn: [
      "creative-brief-responsibility-map",
      "evidence-index-transcript-shots",
    ],
  },
  {
    id: "edit-plan-v3-validation-approval",
    moduleSlug: "declarative-edit-plan",
    filename: "edit-plan.v3.json",
    format: "json",
    schemaId: "aicourse.agentic-video-editing.edit-plan.v3",
    validatorId: "course20.edit-plan-v3.production-semantic.v2",
    requiredForCapstone: true,
    requiredForModuleCompletion: true,
    dependsOn: [
      "media-manifest-provenance-quarantine",
      "evidence-index-transcript-shots",
      "candidate-segments-system-card",
    ],
  },
  {
    id: "plan-diff-independent-approval",
    moduleSlug: "declarative-edit-plan",
    filename: "plan-approval.json",
    format: "json",
    schemaId: "aicourse.course20.plan-approval.v1",
    validatorId: "course20.plan-diff-independent-approval.semantic.v1",
    requiredForCapstone: true,
    requiredForModuleCompletion: true,
    dependsOn: ["edit-plan-v3-validation-approval"],
  },
  {
    id: "tool-policy-adversarial-recovery",
    moduleSlug: "agent-tools-mcp",
    filename: "tool-policy.json",
    format: "json",
    schemaId: "aicourse.course20.tool-policy.v2",
    validatorId: "course20.tool-policy-adversarial.semantic.v2",
    requiredForCapstone: true,
    requiredForModuleCompletion: true,
    dependsOn: [
      "edit-plan-v3-validation-approval",
      "plan-diff-independent-approval",
    ],
  },
  {
    id: "delivery-matrix-accessibility",
    moduleSlug: "captions-audio-formats",
    filename: "delivery-matrix.yaml",
    format: "yaml",
    schemaId: "aicourse.course20.delivery-matrix.v2",
    validatorId: "course20.delivery-accessibility.semantic.v2",
    requiredForCapstone: false,
    requiredForModuleCompletion: true,
    dependsOn: [
      "edit-plan-v3-validation-approval",
      "tool-policy-adversarial-recovery",
    ],
  },
  {
    id: "render-receipt-output-probe",
    moduleSlug: "deterministic-rendering",
    filename: "render-receipt.json",
    format: "json",
    schemaId: "aicourse.course20.render-receipt.v2",
    validatorId: "course20.render-receipt.semantic.v2",
    requiredForCapstone: true,
    requiredForModuleCompletion: true,
    dependsOn: [
      "media-manifest-provenance-quarantine",
      "edit-plan-v3-validation-approval",
      "plan-diff-independent-approval",
      "delivery-matrix-accessibility",
      "tool-policy-adversarial-recovery",
    ],
  },
  {
    id: "candidate-media-reference",
    moduleSlug: "deterministic-rendering",
    filename: "candidate-media.reference.json",
    format: "media",
    schemaId: "aicourse.course20.media-reference.v2",
    validatorId: "course20.local-media-reference.semantic.v2",
    requiredForCapstone: true,
    requiredForModuleCompletion: true,
    dependsOn: [
      "delivery-matrix-accessibility",
      "render-receipt-output-probe",
    ],
  },
  {
    id: "verification-repair-approval",
    moduleSlug: "verification-human-review",
    filename: "verification-report.json",
    format: "json",
    schemaId: "aicourse.course20.verification-report.v2",
    validatorId: "course20.verification-repair.semantic.v2",
    requiredForCapstone: true,
    requiredForModuleCompletion: true,
    dependsOn: [
      "media-manifest-provenance-quarantine",
      "edit-plan-v3-validation-approval",
      "plan-diff-independent-approval",
      "delivery-matrix-accessibility",
      "render-receipt-output-probe",
      "candidate-media-reference",
    ],
  },
  {
    id: "release-package-runbook-recovery",
    moduleSlug: "production-capstone",
    filename: "release-package.manifest.json",
    format: "directory-manifest",
    schemaId: "aicourse.course20.release-package.v2",
    validatorId: "course20.release-package-closure.semantic.v2",
    requiredForCapstone: true,
    requiredForModuleCompletion: true,
    dependsOn: [
      "creative-brief-responsibility-map",
      "media-manifest-provenance-quarantine",
      "evidence-index-transcript-shots",
      "candidate-segments-system-card",
      "edit-plan-v3-validation-approval",
      "plan-diff-independent-approval",
      "delivery-matrix-accessibility",
      "tool-policy-adversarial-recovery",
      "render-receipt-output-probe",
      "candidate-media-reference",
      "verification-repair-approval",
    ],
  },
  {
    id: "release-decision-postmortem",
    moduleSlug: "production-capstone",
    filename: "release-decision.json",
    format: "json",
    schemaId: "aicourse.course20.release-decision.v2",
    validatorId: "course20.release-decision.semantic.v2",
    requiredForCapstone: true,
    requiredForModuleCompletion: false,
    dependsOn: [
      "candidate-media-reference",
      "verification-repair-approval",
      "release-package-runbook-recovery",
    ],
  },
] as const satisfies readonly AgenticVideoEditingArtifactContract[];

export const AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACT_BY_ID = new Map<
  AgenticVideoEditingArtifactId,
  AgenticVideoEditingArtifactContract
>(AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS.map((contract) => [
  contract.id,
  contract,
]));

export function getAgenticVideoEditingArtifactContract(
  artifactId: AgenticVideoEditingArtifactId,
): AgenticVideoEditingArtifactContract {
  const contract = AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACT_BY_ID.get(artifactId);
  if (!contract) throw new Error(`Unknown Course 20 artifact contract: ${artifactId}`);
  return contract;
}

export function getAgenticVideoEditingModuleArtifactContracts(
  slug: AgenticVideoEditingModuleSlug,
): readonly AgenticVideoEditingArtifactContract[] {
  return AGENTIC_VIDEO_EDITING_ARTIFACT_CONTRACTS.filter(
    (contract) => contract.moduleSlug === slug,
  );
}
