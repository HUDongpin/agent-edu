/** Immutable public paths and digests for Course 20's original synthetic fixture. */
export const DEEP_LEARNING_FIXTURE = {
  schemaVersion: "course-fixture-contract.v2",
  version: "2026.08.28-v2",
  basePath: "/courses/deep-learning",
  fixtures: [
    {
      fixtureId: "ae-deep-learning-foundation-mlp-v1",
      role: "foundation-reference",
      path: "/courses/deep-learning/fixtures/neural-training-fixture-v1.json",
      sha256: "c5e38f16eeb4eab44693f483f06100808848f918251c3932ca574439194deb78",
    },
    {
      fixtureId: "ae-deep-learning-visual-patterns-v2",
      role: "visual-module-evidence",
      path: "/courses/deep-learning/fixtures/visual-patterns-v2.json",
      sha256: "728d92ed2e7805fa838414f374249650caaf197baa9874d0c947f64fdb4f7f73",
    },
    {
      fixtureId: "ae-deep-learning-sequences-v2",
      role: "sequence-attention-transformer-evidence",
      path: "/courses/deep-learning/fixtures/sequences-v2.json",
      sha256: "c0d509ceeb0718d22a7667e9eacb5480fe370ebc157eeeedd1d174a2566f964f",
    },
  ],
  fixture: {
    path: "/courses/deep-learning/fixtures/neural-training-fixture-v1.json",
    sha256: "c5e38f16eeb4eab44693f483f06100808848f918251c3932ca574439194deb78",
  },
  schema: {
    path: "/courses/deep-learning/fixtures/neural-training-fixture-v1.schema.json",
    sha256: "9ace10751c0758db4a11ad1f3b65b702cf54330ed0b7b916ccce16376cee8787",
  },
  optionalFrameworkReference: {
    package: "torch",
    version: "2.13.0",
    pythonAbi: "cp311",
    platformTag: "macosx_14_0_arm64",
    wheelSha256: "e76f9bcecc52b8ff711239a2f7547d5353df95878ab232f0773c1d95928b92f8",
    requiredForFoundationReference: false,
    boundary:
      "This wheel digest binds only the CPython 3.11 macOS 14 arm64 artifact; other operating systems, architectures, Python ABIs, CPU wheels, and accelerator wheels require their own hashes.",
  },
  noticePath: "/courses/deep-learning/NOTICE.md",
  provenancePath: "/courses/deep-learning/provenance.json",
  checksumsPath: "/courses/deep-learning/checksums.sha256",
  synthetic: true,
  containsPersonalData: false,
  claimBoundary:
    "The three fixtures support foundation, visual, sequence, masking, adaptation-accounting, and reproducibility mechanics only; they cannot support claims about real-world accuracy, people, safety, or deployment readiness.",
} as const;
