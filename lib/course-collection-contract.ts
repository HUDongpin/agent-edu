/**
 * Fail-closed helpers for every view of the authoritative course registry.
 *
 * Presentation and executable progress metadata can live outside the JSON
 * registry, but their course membership cannot. These helpers reject duplicate,
 * missing, or extra ids before a Map could silently overwrite one record.
 */

function duplicateIds(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates].sort();
}

export function assertUniqueCourseIds(ids: readonly string[], label: string): void {
  const duplicates = duplicateIds(ids);
  if (duplicates.length) {
    throw new Error(`${label} contains duplicate course ids: ${duplicates.join(", ")}`);
  }
}

export function assertExactCourseIdSet(
  expectedIds: readonly string[],
  actualIds: readonly string[],
  label: string,
): void {
  assertUniqueCourseIds(expectedIds, "course registry");
  assertUniqueCourseIds(actualIds, label);

  const expected = new Set(expectedIds);
  const actual = new Set(actualIds);
  const missing = expectedIds.filter((id) => !actual.has(id));
  const extra = actualIds.filter((id) => !expected.has(id));
  if (missing.length || extra.length) {
    const details = [
      missing.length ? `missing: ${missing.join(", ")}` : null,
      extra.length ? `extra: ${extra.join(", ")}` : null,
    ].filter(Boolean).join("; ");
    throw new Error(`${label} must match the course registry exactly (${details})`);
  }
}

export function registryOrderedCourseRecords<T extends { readonly id: string }>(
  registryIds: readonly string[],
  records: readonly T[],
  label: string,
): T[] {
  const recordIds = records.map((record) => record.id);
  assertExactCourseIdSet(registryIds, recordIds, label);
  const byId = new Map(records.map((record) => [record.id, record] as const));
  return registryIds.map((id) => {
    const record = byId.get(id);
    if (!record) throw new Error(`${label} is missing course id ${id}`);
    return record;
  });
}
