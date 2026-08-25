import type { ReactNode } from "react";

export type LearningIconName =
  | "book"
  | "message"
  | "workflow"
  | "code"
  | "research"
  | "shield"
  | "route"
  | "practice"
  | "evidence"
  | "privacy"
  | "purpose"
  | "method";

export default function LearningIcon({
  name,
  size = 24,
}: {
  name: LearningIconName;
  size?: number;
}) {
  const paths: Record<LearningIconName, ReactNode> = {
    book: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5Z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5Z" />
      </>
    ),
    message: (
      <>
        <path d="M20 15a3 3 0 0 1-3 3H9l-5 3v-6a3 3 0 0 1-1-2.2V7a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3Z" />
        <path d="M7.5 9h9M7.5 13h5" />
      </>
    ),
    workflow: (
      <>
        <rect x="3" y="3" width="6" height="6" rx="2" />
        <rect x="15" y="15" width="6" height="6" rx="2" />
        <path d="M9 6h3a4 4 0 0 1 4 4v1M15 9l2 2-2 2M15 18h-3a4 4 0 0 1-4-4v-1M9 15l-2-2 2-2" />
      </>
    ),
    code: (
      <>
        <path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" />
        <rect x="2.5" y="3" width="19" height="18" rx="3" />
      </>
    ),
    research: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m15.5 15.5 5 5M8 8h5M8 11h3" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6Z" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </>
    ),
    route: (
      <>
        <circle cx="5" cy="18" r="2" />
        <circle cx="19" cy="6" r="2" />
        <path d="M7 18h3a3 3 0 0 0 3-3V9a3 3 0 0 1 3-3h1" />
      </>
    ),
    practice: (
      <>
        <path d="M9 3h6l1 3h3v15H5V6h3Z" />
        <path d="M9 3v4h6V3M8.5 12l2 2 5-5" />
      </>
    ),
    evidence: (
      <>
        <path d="M4 4h16v16H4Z" />
        <path d="M8 16v-3M12 16V9M16 16v-6M8 7h5" />
      </>
    ),
    privacy: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="3" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
    purpose: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
        <path d="m15 9 5-5M16 4h4v4" />
      </>
    ),
    method: (
      <>
        <path d="M9 3h6l1 3h3v15H5V6h3Z" />
        <path d="m8.5 13 2.2 2.2 4.8-5" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}
