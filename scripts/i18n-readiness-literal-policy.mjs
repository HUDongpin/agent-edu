const DEFAULT_CATALOG_DOMAINS = Object.freeze({
  site: "main",
  handbook: "handbook",
  widgets: "widgets",
});

const DEFAULT_TARGET_LOCALES = Object.freeze([
  "zh-Hans",
  "zh-Hant",
  "ar",
  "de",
  "es",
  "fr",
  "ja",
  "ko",
]);

const EXACT_ENTRY_KEYS = ["catalog", "key", "locales", "reason"];
const MESSAGE_KEY = /^[A-Za-z0-9_.-]+$/;

function sameMembers(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && [...actual].sort().join("\u0000") === [...expected].sort().join("\u0000");
}

function recordId(catalog, locale, key) {
  return `release-readiness:${catalog}:${locale}:${key}`;
}

/**
 * Turn the existing release-readiness same-as-English policy into an exact,
 * auditable matcher for the broader i18n report. The matcher accepts only an
 * exact catalog/domain, locale, key, and currently identical source/target
 * value. It also records use so stale policy entries remain release failures.
 */
export function createReadinessLiteralPolicy(
  entries,
  {
    catalogDomains = DEFAULT_CATALOG_DOMAINS,
    targetLocales = DEFAULT_TARGET_LOCALES,
  } = {},
) {
  const issues = [];
  const records = new Map();
  const matched = new Set();
  const allowedLocales = new Set(targetLocales);

  if (!Array.isArray(entries)) {
    issues.push({
      code: "invalid-policy",
      path: "localization.sameAsEnglishAllowlist",
      message: "must be an array",
    });
    entries = [];
  }

  entries.forEach((entry, index) => {
    const path = `localization.sameAsEnglishAllowlist[${index}]`;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      issues.push({ code: "invalid-entry", path, message: "must be an object" });
      return;
    }
    if (!sameMembers(Object.keys(entry), EXACT_ENTRY_KEYS)) {
      issues.push({
        code: "invalid-entry-keys",
        path,
        message: `must contain exactly ${EXACT_ENTRY_KEYS.join(", ")}`,
      });
      return;
    }
    const domain = catalogDomains[entry.catalog];
    if (!domain) {
      issues.push({ code: "invalid-catalog", path: `${path}.catalog`, message: "must name a configured catalog" });
      return;
    }
    if (typeof entry.key !== "string" || !MESSAGE_KEY.test(entry.key)) {
      issues.push({ code: "invalid-key", path: `${path}.key`, message: "must be one exact message key" });
      return;
    }
    if (
      !Array.isArray(entry.locales)
      || entry.locales.length === 0
      || entry.locales.some((locale) => !allowedLocales.has(locale))
      || new Set(entry.locales).size !== entry.locales.length
    ) {
      issues.push({
        code: "invalid-locales",
        path: `${path}.locales`,
        message: "must contain unique configured non-English locales",
      });
      return;
    }
    if (typeof entry.reason !== "string" || entry.reason.trim().length < 8 || entry.reason.length > 180) {
      issues.push({
        code: "invalid-reason",
        path: `${path}.reason`,
        message: "must contain a concise reason of 8 to 180 characters",
      });
      return;
    }

    for (const locale of entry.locales) {
      const id = recordId(entry.catalog, locale, entry.key);
      if (records.has(id)) {
        issues.push({ code: "duplicate-entry", path, message: `duplicates ${id}` });
        continue;
      }
      records.set(id, {
        id,
        catalog: entry.catalog,
        domain,
        locale,
        key: entry.key,
        reason: entry.reason,
      });
    }
  });

  return {
    issues,
    size: records.size,
    decision(domain, locale, key, sourceValue, targetValue) {
      if (
        typeof sourceValue !== "string"
        || typeof targetValue !== "string"
        || sourceValue !== targetValue
      ) return null;
      const record = [...records.values()].find((candidate) => (
        candidate.domain === domain
        && candidate.locale === locale
        && candidate.key === key
      ));
      if (!record) return null;
      matched.add(record.id);
      return {
        ...record,
        value: targetValue,
        expectedLanguage: "zxx-or-project-term",
        expectedDirection: "ltr",
      };
    },
    finalize() {
      return [...records.values()]
        .filter((record) => !matched.has(record.id))
        .map((record) => ({
          code: "stale-entry",
          path: record.id,
          message: "must point to a currently identical source and locale value",
        }));
    },
  };
}

export const READINESS_LITERAL_CATALOG_DOMAINS = DEFAULT_CATALOG_DOMAINS;
