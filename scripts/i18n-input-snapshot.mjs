const GENERATED_PLATFORM_MATRIX = /^outputs\/course-platform-matrix\.\d{4}-\d{2}-\d{2}\.json$/;
const GENERATED_OR_TOOL_DIRECTORY = /^(?:node_modules|\.git|\.next|out|output|\.playwright-cli|playwright-report|test-results)(?:\/|$)/;

/**
 * Decide which workspace paths define an i18n content snapshot. The dated
 * course-platform matrix is a report about that snapshot, so including it
 * would create a self-invalidating cycle every time its evidence path changes.
 * Other files under outputs/ remain inputs because research, rights, and
 * provenance records there are release evidence rather than generated status.
 */
export function isI18nSnapshotInput(path) {
  const normalized = String(path).replaceAll("\\", "/");
  return !GENERATED_OR_TOOL_DIRECTORY.test(normalized)
    && !GENERATED_PLATFORM_MATRIX.test(normalized);
}
