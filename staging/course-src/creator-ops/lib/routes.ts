import type { CreatorOpsModuleSlug } from "./types";

/** Internal route vocabulary; it does not register a public Next.js route. */
export function creatorOpsModulePage(module: CreatorOpsModuleSlug): string {
  return `creator-ops/${module}/`;
}
