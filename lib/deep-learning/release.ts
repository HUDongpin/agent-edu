/** Automated checks cannot satisfy the named-human language review gate. */
export const DEEP_LEARNING_RELEASE = {
  status: "HOLD",
  reason: "human-en-and-zh-hans-review-pending",
  automatedChecksCanApproveRelease: false,
} as const;
