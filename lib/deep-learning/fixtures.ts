/** Immutable public paths and digests for Course 20's original synthetic fixture. */
export const DEEP_LEARNING_FIXTURE = {
  schemaVersion: "course-fixture-contract.v1",
  version: "2026.08.26-v1",
  basePath: "/courses/deep-learning",
  fixture: {
    path: "/courses/deep-learning/fixtures/neural-training-fixture-v1.json",
    sha256: "70a3a7c10ef24a15df050434f34350e7283eba1be145ee2bedb5cb34e7d5cb6a",
  },
  schema: {
    path: "/courses/deep-learning/fixtures/neural-training-fixture-v1.schema.json",
    sha256: "cfd032a6bed0f5c97d138aabdb16d813b72251bd565c76ae883790182b1029f8",
  },
  noticePath: "/courses/deep-learning/NOTICE.md",
  provenancePath: "/courses/deep-learning/provenance.json",
  checksumsPath: "/courses/deep-learning/checksums.sha256",
  synthetic: true,
  containsPersonalData: false,
  claimBoundary:
    "The fixture supports mechanics and reproducibility exercises only; it cannot support claims about real-world accuracy, people, safety, or deployment readiness.",
} as const;
