/**
 * Stop a course entry point before a missing dependency becomes a stack trace.
 *
 * Static imports are linked before any module body runs, so a sibling
 * `import "./cafe/llm"` still throws ERR_MODULE_NOT_FOUND when
 * `@anthropic-ai/sdk` is absent — the check never gets a turn. Entry points
 * import this file (node built-ins only) and call `loadLlm()` / `loadEvalset()`,
 * which check and then dynamically import.
 *
 * `COURSE_DEP_CHECK` replaces the directory list. Tests set it. Learners do not.
 *
 * If tsx itself is missing, `npx tsx` offers to install it before this file
 * can run. Decline that prompt and run `npm ci` from the repo root. The course
 * README says the same thing.
 */
import { existsSync } from "node:fs";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export const DEPENDENCY_MESSAGE = [
  "Dependencies are not installed. From the repo root run: npm ci",
  "依赖还没安装。请在仓库根目录运行：npm ci",
].join("\n");

/** Directories that must exist before a course entry point loads the SDK. */
export function dependencyPaths(): string[] {
  const override = process.env.COURSE_DEP_CHECK;
  if (override) return override.split(delimiter).filter((part) => part.length > 0);
  return [
    join(ROOT, "node_modules", "@anthropic-ai", "sdk"),
    join(ROOT, "node_modules", "tsx"),
  ];
}

export function missingDependencies(paths: readonly string[] = dependencyPaths()): string[] {
  return paths.filter((path) => !existsSync(path));
}

export function assertDependencies(): void {
  if (missingDependencies().length === 0) return;
  console.error(DEPENDENCY_MESSAGE);
  process.exit(1);
}

/** Dependency check, then the module that imports `@anthropic-ai/sdk`. */
export async function loadLlm(): Promise<typeof import("./cafe/llm")> {
  assertDependencies();
  return import("./cafe/llm");
}

/** Dependency check, then the eval runner. It reaches the SDK through `llm.ts`. */
export async function loadEvalset(): Promise<typeof import("./cafe/evalset")> {
  assertDependencies();
  return import("./cafe/evalset");
}
