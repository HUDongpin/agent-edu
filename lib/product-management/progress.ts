import { PRODUCT_MANAGEMENT_COURSE_MANIFEST } from "./manifest";
import type { ProductManagementModuleSlug } from "./types";

export const PRODUCT_MANAGEMENT_PROGRESS_PREFIX = "product-management.";
export const PRODUCT_MANAGEMENT_PROGRESS_VERSION = PRODUCT_MANAGEMENT_COURSE_MANIFEST.version;
export const PRODUCT_MANAGEMENT_PROGRESS_VERSION_KEY = "product-management.progress.version";
export const PRODUCT_MANAGEMENT_PROGRESS_EVENT = "product-management:progress-change";
export const PRODUCT_MANAGEMENT_PROGRESS_RESET_EVENT = "product-management:progress-reset";
export const PRODUCT_MANAGEMENT_QUIZ_BEST_KEY = "product-management.quiz.best";
export const PRODUCT_MANAGEMENT_QUIZ_PASSED_KEY = "product-management.quiz.passed";
export const PRODUCT_MANAGEMENT_CAPSTONE_KEY = "product-management.capstone.v1";
export const PRODUCT_MANAGEMENT_PROGRESS_MILESTONES =
  PRODUCT_MANAGEMENT_COURSE_MANIFEST.modules.length + 2;

export function productManagementModuleProgressKey(
  slug: ProductManagementModuleSlug,
): string {
  return `product-management.module.${slug}.complete`;
}

export function productManagementCheckpointKey(
  slug: ProductManagementModuleSlug,
): string {
  return `product-management.module.${slug}.checkpoint`;
}

export function isCurrentProductManagementProgress(
  progress: Record<string, unknown>,
): boolean {
  return progress[PRODUCT_MANAGEMENT_PROGRESS_VERSION_KEY]
    === PRODUCT_MANAGEMENT_PROGRESS_VERSION;
}

export function productManagementProgressPercent(
  progress: Record<string, unknown>,
): number {
  if (!isCurrentProductManagementProgress(progress)) return 0;
  const modules = PRODUCT_MANAGEMENT_COURSE_MANIFEST.modules.filter(
    (module) => progress[productManagementModuleProgressKey(module.slug)] === true,
  ).length;
  const quiz = progress[PRODUCT_MANAGEMENT_QUIZ_PASSED_KEY] === true ? 1 : 0;
  const capstone = progress[PRODUCT_MANAGEMENT_CAPSTONE_KEY] === true ? 1 : 0;
  return Math.round(
    ((modules + quiz + capstone) / PRODUCT_MANAGEMENT_PROGRESS_MILESTONES) * 100,
  );
}
