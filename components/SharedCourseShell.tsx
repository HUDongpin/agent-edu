"use client";

import type { ReactNode } from "react";

/**
 * Compatibility slot for the legacy Handbook, whose widget host must remain
 * a Client Component. The real CourseShell is constructed by the parent
 * Server Component and passed through this slot as already-rendered RSC
 * output; this wrapper imports no registry, messages, or course metadata.
 */
export default function SharedCourseShell({ children }: { readonly children: ReactNode }) {
  return children;
}
