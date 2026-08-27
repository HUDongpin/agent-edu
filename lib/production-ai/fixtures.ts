/** Immutable public paths and digests for Course 21's original dual-system fixture. */
export const PRODUCTION_AI_FIXTURE = {
  schemaVersion: "course-fixture-contract.v1",
  version: "2026.08.26-v1",
  basePath: "/courses/production-ai",
  fixture: {
    path: "/courses/production-ai/fixtures/dual-system-operations-v1.json",
    sha256: "b9b7ca41eee3e4eb4d5af572da8904ba7253747d312df15e8c5b0d5a8d9a0cab",
  },
  schema: {
    path: "/courses/production-ai/fixtures/dual-system-operations-v1.schema.json",
    sha256: "627c18674f70eea6915354fd8a444419a7ca2ee0cfd440b8f6392a0610d88028",
  },
  noticePath: "/courses/production-ai/NOTICE.md",
  provenancePath: "/courses/production-ai/provenance.json",
  checksumsPath: "/courses/production-ai/checksums.sha256",
  synthetic: true,
  containsPersonalData: false,
  containsRealCredentials: false,
  claimBoundary:
    "The fixture supports bounded operations-control exercises only; it cannot establish real-world reliability, security, compliance, model quality, or deployment readiness.",
} as const;
