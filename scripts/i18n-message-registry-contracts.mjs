/**
 * Compare a top-level localized message registry with a TypeScript ID set.
 * Some courses localize quiz/figure copy inside lesson-owned structures (or
 * render it from the typed course bundle) and therefore have no top-level
 * registry for those fields. Absence is not drift; a present registry must be
 * an object and must match exactly.
 */
export function compareMessageRegistryIds(copy, field, expectedIds) {
  if (!copy || typeof copy !== "object" || Array.isArray(copy)) {
    return { applicable: false, validShape: false, observed: [], missing: [], extra: [] };
  }
  if (!Object.prototype.hasOwnProperty.call(copy, field)) {
    return { applicable: false, validShape: true, observed: [], missing: [], extra: [] };
  }
  const registry = copy[field];
  if (!registry || typeof registry !== "object" || Array.isArray(registry)) {
    return {
      applicable: true,
      validShape: false,
      observed: [],
      missing: [...expectedIds],
      extra: [],
    };
  }
  const observed = Object.keys(registry);
  return {
    applicable: true,
    validShape: true,
    observed,
    missing: expectedIds.filter((id) => !observed.includes(id)),
    extra: observed.filter((id) => !expectedIds.includes(id)),
  };
}
