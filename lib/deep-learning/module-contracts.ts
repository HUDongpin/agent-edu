export const DEEP_LEARNING_MODULE_ARTIFACT_SCHEMA_ID =
  "aicourse.deep-learning.module-artifact.v2" as const;

export const DEEP_LEARNING_MODULE_RECEIPT_SCHEMA_VERSION =
  "aicourse.module-evidence-receipt.v2" as const;

const validator = (slug: string) => ({
  artifactSchemaId: DEEP_LEARNING_MODULE_ARTIFACT_SCHEMA_ID,
  validatorId: `aicourse.deep-learning.module.${slug}.v2` as const,
  validatorCommand:
    `python3 public/courses/deep-learning/lab/validate_module.py --module ${slug} --package <module-artifact.json>` as const,
  completionMode: "validated-artifact" as const,
});

/**
 * Course-local executable DAG. Shared CourseKit fields are repeated on the module
 * seeds; fixtureIds and receiptSchemaVersion make the offline implementation
 * boundary explicit without broadening the shared schema.
 */
export const DEEP_LEARNING_MODULE_CONTRACTS = [
  {
    slug: "tensors-computational-graphs",
    prerequisiteModuleSlugs: [],
    producesArtifactIds: ["tensor-graph-ledger"],
    consumesArtifactIds: [],
    fixtureIds: ["ae-deep-learning-foundation-mlp-v1"],
    ...validator("tensors-computational-graphs"),
  },
  {
    slug: "backpropagation-autodiff",
    prerequisiteModuleSlugs: ["tensors-computational-graphs"],
    producesArtifactIds: ["gradient-check-report"],
    consumesArtifactIds: ["tensor-graph-ledger"],
    fixtureIds: ["ae-deep-learning-foundation-mlp-v1"],
    ...validator("backpropagation-autodiff"),
  },
  {
    slug: "training-loops-debugging",
    prerequisiteModuleSlugs: ["backpropagation-autodiff"],
    producesArtifactIds: ["training-state-receipt"],
    consumesArtifactIds: ["gradient-check-report"],
    fixtureIds: ["ae-deep-learning-foundation-mlp-v1"],
    ...validator("training-loops-debugging"),
  },
  {
    slug: "optimisation-initialisation-normalisation-regularisation",
    prerequisiteModuleSlugs: ["training-loops-debugging"],
    producesArtifactIds: ["optimisation-ablation-report"],
    consumesArtifactIds: ["training-state-receipt"],
    fixtureIds: ["ae-deep-learning-foundation-mlp-v1"],
    ...validator("optimisation-initialisation-normalisation-regularisation"),
  },
  {
    slug: "cnns-visual-representations",
    prerequisiteModuleSlugs: [
      "training-loops-debugging",
      "optimisation-initialisation-normalisation-regularisation",
    ],
    producesArtifactIds: ["visual-baseline-audit"],
    consumesArtifactIds: ["training-state-receipt", "optimisation-ablation-report"],
    fixtureIds: ["ae-deep-learning-visual-patterns-v2"],
    ...validator("cnns-visual-representations"),
  },
  {
    slug: "transfer-learning",
    prerequisiteModuleSlugs: ["cnns-visual-representations"],
    producesArtifactIds: ["transfer-strategy-ledger"],
    consumesArtifactIds: ["visual-baseline-audit"],
    fixtureIds: ["ae-deep-learning-visual-patterns-v2"],
    ...validator("transfer-learning"),
  },
  {
    slug: "sequence-models-rnns-lstms",
    prerequisiteModuleSlugs: [
      "training-loops-debugging",
      "optimisation-initialisation-normalisation-regularisation",
    ],
    producesArtifactIds: ["sequence-state-mask-audit"],
    consumesArtifactIds: ["training-state-receipt", "optimisation-ablation-report"],
    fixtureIds: ["ae-deep-learning-sequences-v2"],
    ...validator("sequence-models-rnns-lstms"),
  },
  {
    slug: "attention",
    prerequisiteModuleSlugs: ["sequence-models-rnns-lstms"],
    producesArtifactIds: ["attention-mask-worksheet"],
    consumesArtifactIds: ["sequence-state-mask-audit"],
    fixtureIds: ["ae-deep-learning-sequences-v2"],
    ...validator("attention"),
  },
  {
    slug: "transformer-encoder-decoder",
    prerequisiteModuleSlugs: ["attention"],
    producesArtifactIds: ["transformer-leakage-test"],
    consumesArtifactIds: ["attention-mask-worksheet", "training-state-receipt"],
    fixtureIds: ["ae-deep-learning-sequences-v2"],
    ...validator("transformer-encoder-decoder"),
  },
  {
    slug: "tokenisation-pretraining",
    prerequisiteModuleSlugs: [
      "sequence-models-rnns-lstms",
      "transformer-encoder-decoder",
    ],
    producesArtifactIds: ["tokenisation-provenance-audit"],
    consumesArtifactIds: ["sequence-state-mask-audit", "transformer-leakage-test"],
    fixtureIds: ["ae-deep-learning-sequences-v2"],
    ...validator("tokenisation-pretraining"),
  },
  {
    slug: "fine-tuning-parameter-efficient-adaptation",
    prerequisiteModuleSlugs: [
      "transfer-learning",
      "transformer-encoder-decoder",
      "tokenisation-pretraining",
    ],
    producesArtifactIds: ["adaptation-lifecycle-audit"],
    consumesArtifactIds: [
      "transfer-strategy-ledger",
      "transformer-leakage-test",
      "tokenisation-provenance-audit",
    ],
    fixtureIds: [
      "ae-deep-learning-visual-patterns-v2",
      "ae-deep-learning-sequences-v2",
    ],
    ...validator("fine-tuning-parameter-efficient-adaptation"),
  },
  {
    slug: "robustness-evaluation-training-card-capstone",
    prerequisiteModuleSlugs: [
      "tensors-computational-graphs",
      "backpropagation-autodiff",
      "training-loops-debugging",
      "optimisation-initialisation-normalisation-regularisation",
      "cnns-visual-representations",
      "transfer-learning",
      "sequence-models-rnns-lstms",
      "attention",
      "transformer-encoder-decoder",
      "tokenisation-pretraining",
      "fine-tuning-parameter-efficient-adaptation",
    ],
    producesArtifactIds: ["learner-final-dossier"],
    consumesArtifactIds: [
      "tensor-graph-ledger",
      "gradient-check-report",
      "training-state-receipt",
      "optimisation-ablation-report",
      "visual-baseline-audit",
      "transfer-strategy-ledger",
      "sequence-state-mask-audit",
      "attention-mask-worksheet",
      "transformer-leakage-test",
      "tokenisation-provenance-audit",
      "adaptation-lifecycle-audit",
    ],
    fixtureIds: [
      "ae-deep-learning-foundation-mlp-v1",
      "ae-deep-learning-visual-patterns-v2",
      "ae-deep-learning-sequences-v2",
    ],
    ...validator("robustness-evaluation-training-card-capstone"),
  },
] as const;

export type DeepLearningModuleContract =
  (typeof DEEP_LEARNING_MODULE_CONTRACTS)[number];

export const DEEP_LEARNING_MODULE_CONTRACT_BY_SLUG = Object.fromEntries(
  DEEP_LEARNING_MODULE_CONTRACTS.map((contract) => [contract.slug, contract]),
) as Readonly<Record<DeepLearningModuleContract["slug"], DeepLearningModuleContract>>;

export type DeepLearningClaimClass =
  | "source-grounded"
  | "instructional-synthesis"
  | "course-policy"
  | "version-watch";

/**
 * Section evidence-mode and reading-set contract.
 *
 * These source IDs are narrower than the module register, but they are not
 * atomic claim mappings and must never be inherited as support for a whole
 * paragraph. `claims.ts` owns the exact claim -> source -> URL -> locator
 * publication contract.
 */
export const DEEP_LEARNING_SECTION_READING_CONTRACT_BY_SLUG = {
  "tensors-computational-graphs": {
    concept: { claimClass: "source-grounded", sourceIds: ["dl01-pytorch-tensors-autograd-2-13"] },
    method: { claimClass: "instructional-synthesis", sourceIds: ["dl01-pytorch-tensors-autograd-2-13"] },
    boundary: { claimClass: "source-grounded", sourceIds: ["dl01-pytorch-tensors-autograd-2-13"] },
  },
  "backpropagation-autodiff": {
    concept: { claimClass: "source-grounded", sourceIds: ["dl01-pytorch-tensors-autograd-2-13", "dl02-backpropagation"] },
    method: { claimClass: "instructional-synthesis", sourceIds: ["dl02-pytorch-gradcheck-2-13"] },
    boundary: { claimClass: "source-grounded", sourceIds: ["dl02-backpropagation", "dl02-pytorch-gradcheck-2-13"] },
  },
  "training-loops-debugging": {
    concept: { claimClass: "source-grounded", sourceIds: ["dl03-pytorch-training-state-2-13"] },
    method: { claimClass: "instructional-synthesis", sourceIds: ["dl03-pytorch-training-state-2-13"] },
    boundary: { claimClass: "source-grounded", sourceIds: ["dl03-pytorch-training-state-2-13"] },
  },
  "optimisation-initialisation-normalisation-regularisation": {
    concept: { claimClass: "source-grounded", sourceIds: ["dl04-pytorch-optim-2-13", "dl04-adam-paper", "dl04-adamw-paper", "dl04-pytorch-initialisation-2-13", "dl04-batch-normalization-paper", "dl04-dropout-paper"] },
    method: { claimClass: "instructional-synthesis", sourceIds: ["dl04-pytorch-optim-2-13", "dl04-pytorch-initialisation-2-13", "dl04-batch-normalization-paper", "dl04-dropout-paper"] },
    boundary: { claimClass: "source-grounded", sourceIds: ["dl04-adam-paper", "dl04-adamw-paper", "dl04-batch-normalization-paper", "dl04-dropout-paper"] },
  },
  "cnns-visual-representations": {
    concept: { claimClass: "source-grounded", sourceIds: ["dl05-convolutional-document-recognition-paper", "dl05-resnet-paper"] },
    method: { claimClass: "instructional-synthesis", sourceIds: ["dl05-convolutional-document-recognition-paper", "dl05-resnet-paper"] },
    boundary: { claimClass: "course-policy", sourceIds: ["dl05-convolutional-document-recognition-paper", "dl05-resnet-paper"] },
  },
  "transfer-learning": {
    concept: { claimClass: "source-grounded", sourceIds: ["dl06-pytorch-transfer-snapshot-d445c1f"] },
    method: { claimClass: "instructional-synthesis", sourceIds: ["dl06-pytorch-transfer-snapshot-d445c1f"] },
    boundary: { claimClass: "course-policy", sourceIds: ["dl06-pytorch-transfer-snapshot-d445c1f"] },
  },
  "sequence-models-rnns-lstms": {
    concept: { claimClass: "source-grounded", sourceIds: ["dl07-lstm-paper", "dl07-pytorch-lstm-2-13", "dl07-pytorch-packed-sequence-2-13"] },
    method: { claimClass: "instructional-synthesis", sourceIds: ["dl07-pytorch-lstm-2-13", "dl07-pytorch-packed-sequence-2-13"] },
    boundary: { claimClass: "course-policy", sourceIds: ["dl07-lstm-paper"] },
  },
  attention: {
    concept: { claimClass: "source-grounded", sourceIds: ["dl08-bahdanau-attention-paper", "dl09-transformer-paper"] },
    method: { claimClass: "instructional-synthesis", sourceIds: ["dl08-bahdanau-attention-paper", "dl09-pytorch-transformer-2-13"] },
    boundary: { claimClass: "source-grounded", sourceIds: ["dl08-attention-not-explanation-paper", "dl08-attention-not-not-explanation-paper"] },
  },
  "transformer-encoder-decoder": {
    concept: { claimClass: "source-grounded", sourceIds: ["dl09-transformer-paper"] },
    method: { claimClass: "version-watch", sourceIds: ["dl09-pytorch-transformer-2-13"] },
    boundary: { claimClass: "source-grounded", sourceIds: ["dl09-transformer-paper", "dl09-pytorch-transformer-2-13"] },
  },
  "tokenisation-pretraining": {
    concept: { claimClass: "source-grounded", sourceIds: ["dl10-sentencepiece-paper", "dl10-bert-paper"] },
    method: { claimClass: "instructional-synthesis", sourceIds: ["dl10-sentencepiece-paper", "dl10-bert-paper"] },
    boundary: { claimClass: "source-grounded", sourceIds: ["dl10-sentencepiece-paper", "dl10-bert-paper"] },
  },
  "fine-tuning-parameter-efficient-adaptation": {
    concept: { claimClass: "source-grounded", sourceIds: ["dl11-lora-paper", "dl11-peft-v0-20-0"] },
    method: { claimClass: "version-watch", sourceIds: ["dl11-peft-v0-20-0"] },
    boundary: { claimClass: "course-policy", sourceIds: ["dl11-lora-paper", "dl11-peft-v0-20-0"] },
  },
  "robustness-evaluation-training-card-capstone": {
    concept: { claimClass: "source-grounded", sourceIds: ["dl13-robustness", "dl12-calibration-paper", "ra12-model-cards"] },
    method: { claimClass: "course-policy", sourceIds: ["ra12-model-cards"] },
    boundary: { claimClass: "course-policy", sourceIds: ["dl13-robustness", "ra12-model-cards"] },
  },
} as const satisfies Readonly<Record<
  DeepLearningModuleContract["slug"],
  Readonly<Record<"concept" | "method" | "boundary", {
    readonly claimClass: DeepLearningClaimClass;
    readonly sourceIds: readonly string[];
  }>>
>>;
