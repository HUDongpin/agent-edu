function duplicateIds(ids) {
  const seen = new Set();
  const duplicates = new Set();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  return [...duplicates].sort();
}

function compareIds(label, expectedIds, actualIds, errors) {
  const expectedDuplicates = duplicateIds(expectedIds);
  const actualDuplicates = duplicateIds(actualIds);
  if (expectedDuplicates.length) {
    errors.push(`release registry has duplicate ${label} ids: ${expectedDuplicates.join(", ")}`);
  }
  if (actualDuplicates.length) {
    errors.push(`implemented ${label} ids are duplicated: ${actualDuplicates.join(", ")}`);
  }

  const expected = new Set(expectedIds);
  const actual = new Set(actualIds);
  const missing = [...expected].filter((id) => !actual.has(id)).sort();
  const extra = [...actual].filter((id) => !expected.has(id)).sort();
  if (missing.length || extra.length) {
    errors.push(
      `${label} ids differ from the release registry`
      + `${missing.length ? `; missing: ${missing.join(", ")}` : ""}`
      + `${extra.length ? `; extra: ${extra.join(", ")}` : ""}`,
    );
  }
}

/**
 * Compare executable progress adapters with the authoritative release registry.
 *
 * The registry owns adapter membership, publication membership, the repaint
 * event and the primary storage record. Executable adapters may declare extra
 * probe, legacy and quarantine keys, but they must include that primary key.
 */
export function progressRegistryIntegrationErrors(
  contract,
  allAdapters,
  publishedAdapters,
) {
  const errors = [];
  if (!contract || !Array.isArray(contract.courses)) {
    return ["release registry courses are missing"];
  }

  const registryIds = contract.courses.map((course) => course?.id);
  const duplicateRegistryIds = duplicateIds(registryIds);
  if (duplicateRegistryIds.length) {
    errors.push(`release registry has duplicate course ids: ${duplicateRegistryIds.join(", ")}`);
  }

  const progressCourses = contract.courses.filter((course) => course?.progress !== null);
  const expectedAdapterIds = progressCourses.map((course) => course.id);
  const expectedPublishedIds = contract.courses
    .filter((course) => course?.state === "published")
    .map((course) => course.id);

  compareIds(
    "progress adapter",
    expectedAdapterIds,
    allAdapters.map((adapter) => adapter.courseId),
    errors,
  );
  compareIds(
    "published progress adapter",
    expectedPublishedIds,
    publishedAdapters.map((adapter) => adapter.courseId),
    errors,
  );

  const adaptersById = new Map(allAdapters.map((adapter) => [adapter.courseId, adapter]));
  const eventOwners = new Map();
  for (const course of progressCourses) {
    if (!course || typeof course.id !== "string") continue;
    const event = course.progress?.event;
    const storageKey = course.progress?.storageKey;
    if (typeof event !== "string" || !event.trim()) {
      errors.push(`${course.id}: registry progress event is missing`);
      continue;
    }
    if (typeof storageKey !== "string" || !storageKey.trim()) {
      errors.push(`${course.id}: registry progress storageKey is missing`);
      continue;
    }

    const priorOwner = eventOwners.get(event);
    if (priorOwner) {
      errors.push(`${course.id}: registry progress event ${event} is already owned by ${priorOwner}`);
    } else {
      eventOwners.set(event, course.id);
    }

    const adapter = adaptersById.get(course.id);
    if (!adapter) continue;
    if (adapter.progressEvent !== event) {
      errors.push(
        `${course.id}: adapter event ${adapter.progressEvent ?? "missing"} differs from `
        + `registry event ${event}`,
      );
    }
    if (!Array.isArray(adapter.storageKeys) || !adapter.storageKeys.includes(storageKey)) {
      errors.push(
        `${course.id}: adapter storageKeys do not include registry primary key ${storageKey}`,
      );
    }
  }

  for (const course of contract.courses) {
    if (course?.state === "published" && course.progress === null) {
      errors.push(`${course.id}: published registry course has no progress contract`);
    }
  }

  return errors;
}
