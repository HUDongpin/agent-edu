import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  LOCALES,
  NATIVE_REVIEW_LOCALES,
  checkReleaseReadiness,
  evaluateReleaseReadiness,
  findSensitiveEvidence,
  formatReadinessReport,
  redactSensitiveText,
  validateMessageCatalogs,
  validateReleaseReadiness,
} from "../scripts/check-release-readiness.mjs";

type Evidence = {
  status: "pending" | "pass" | "fail";
  checkedAt: string | null;
  evidenceRefs: string[];
  note: string;
};

type LooseConfig = Record<string, any>;
type CatalogFixture = Record<string, Record<string, Record<string, string>>>;

const PASS_AT = "2026-08-21T10:00:00.000Z";
const productionConfig = JSON.parse(
  readFileSync("config/release-readiness.json", "utf8"),
) as LooseConfig;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function passEvidence(record: Evidence, ref = "review-record:fixture"): void {
  record.status = "pass";
  record.checkedAt = PASS_AT;
  record.evidenceRefs = [ref];
}

function passingConfig(): LooseConfig {
  const config = clone(productionConfig);
  config.status = "pass";
  config.localization.sameAsEnglishAllowlist = [{
    catalog: "widgets",
    key: "tech.name",
    locales: [...NATIVE_REVIEW_LOCALES],
    reason: "DeepSeek is a Provider product name and remains unchanged.",
  }];

  for (const record of Object.values(config.gates.nativeReviews.reviews) as Evidence[]) {
    passEvidence(record);
  }
  config.gates.nativeReviews.status = "pass";

  for (const item of config.gates.arabicRtlMatrix.cases as Array<{ result: Evidence }>) {
    passEvidence(item.result, "matrix-record:fixture");
  }
  config.gates.arabicRtlMatrix.status = "pass";

  for (const record of Object.values(config.gates.providerCanary.steps) as Evidence[]) {
    passEvidence(record, "canary-record:fixture");
  }
  for (const record of Object.values(config.gates.providerCanary.reconciliations) as Evidence[]) {
    passEvidence(record, "billing-record:fixture");
  }
  config.gates.providerCanary.status = "pass";

  for (const record of Object.values(config.gates.vercelPreviewCsp.stages) as Evidence[]) {
    passEvidence(record, "csp-record:fixture");
  }
  config.gates.vercelPreviewCsp.status = "pass";

  passEvidence(config.gates.githubReadiness.requiredChecks, "github-run:required-checks-fixture");
  for (const run of config.gates.githubReadiness.stableRuns as Array<{ result: Evidence }>) {
    passEvidence(run.result, "github-run:fixture");
  }
  config.gates.githubReadiness.status = "pass";
  return config;
}

function integerPluralCategories(locale: string): Set<string> {
  const rules = new Intl.PluralRules(locale);
  const categories = new Set(["other"]);
  for (let value = 0; value <= 200; value += 1) categories.add(rules.select(value));
  return categories;
}

function passingCatalogs(): CatalogFixture {
  const catalogs: CatalogFixture = {
    site: { en: { welcome: "Welcome {name}" } },
    handbook: { en: { guide: "Read the guide" } },
    widgets: {
      en: {
        "count.one": "{n} item",
        "count.other": "{n} items",
        "tech.name": "DeepSeek",
      },
    },
  };

  for (const locale of NATIVE_REVIEW_LOCALES) {
    catalogs.site[locale] = { welcome: `${locale} welcome {name}` };
    catalogs.handbook[locale] = { guide: `${locale} guide` };
    catalogs.widgets[locale] = { "tech.name": "DeepSeek" };
    for (const category of integerPluralCategories(locale)) {
      catalogs.widgets[locale][`count.${category}`] = `${locale} ${category} {n}`;
    }
  }
  return catalogs;
}

test("the committed release config is schema-valid and honestly pending", () => {
  assert.equal(productionConfig.status, "pending");
  assert.deepEqual(validateReleaseReadiness(productionConfig), []);

  const result = checkReleaseReadiness();
  assert.equal(result.ready, false);
  assert.equal(result.configIssues.length, 0);
  assert.equal(result.evidence.every((group) => group.status === "pending"), true);
});

test("fully signed fixture evidence and complete locale fixtures pass", () => {
  const result = evaluateReleaseReadiness({
    config: passingConfig(),
    catalogs: passingCatalogs(),
  });

  assert.equal(result.ready, true);
  assert.deepEqual(result.configIssues, []);
  assert.deepEqual(result.messageIssues, []);
  assert.match(formatReadinessReport(result), /release readiness: PASS/);
});

test("valid pending evidence blocks release without becoming a schema error", () => {
  const config = clone(productionConfig);
  config.localization.sameAsEnglishAllowlist = passingConfig().localization.sameAsEnglishAllowlist;
  const result = evaluateReleaseReadiness({ config, catalogs: passingCatalogs() });

  assert.equal(result.ready, false);
  assert.deepEqual(result.configIssues, []);
  assert.match(formatReadinessReport(result), /8 pending, 0 failed, 8 required/);
});

test("dates, evidence references, and aggregate statuses fail closed", () => {
  const config = passingConfig();
  const review = config.gates.nativeReviews.reviews.ar as Evidence;
  review.checkedAt = "21 August 2026";
  review.evidenceRefs = ["https://preview.example.test/path?signature=hidden"];
  (review as Evidence & { apiKey: string }).apiKey = "short-sensitive-value";
  config.gates.nativeReviews.status = "pending";

  const issues = validateReleaseReadiness(config);
  assert.ok(issues.some((issue) => issue.code === "schema-date"));
  assert.ok(issues.some((issue) => issue.code === "schema-evidence"));
  assert.ok(issues.some((issue) => issue.code === "schema-aggregate"));
  assert.ok(issues.some((issue) => issue.code === "schema-keys"));
  assert.ok(issues.some((issue) => issue.code === "sensitive-url-with-query"));
  assert.ok(issues.some((issue) => issue.code === "sensitive-sensitive-field"));
  assert.equal(JSON.stringify(issues).includes("signature=hidden"), false);
  assert.equal(JSON.stringify(issues).includes("short-sensitive-value"), false);
});

test("message validation catches missing keys, placeholders, and plural forms", () => {
  const catalogs = passingCatalogs();
  delete catalogs.site.ar.welcome;
  catalogs.handbook.fr.guide = "fr guide {unexpected}";
  delete catalogs.widgets.ar["count.few"];

  const result = validateMessageCatalogs(
    catalogs,
    passingConfig().localization.sameAsEnglishAllowlist,
  );
  assert.ok(result.issues.some((issue) => issue.code === "catalog-missing" && issue.path.includes("site.ar")));
  assert.ok(result.issues.some((issue) => issue.code === "catalog-placeholder" && issue.path.includes("handbook.fr")));
  assert.ok(result.issues.some((issue) => issue.code === "catalog-missing" && issue.path.includes("count.few")));
});

test("English-identical technical terms require a narrow explicit allowlist", () => {
  const catalogs = passingCatalogs();
  const without = validateMessageCatalogs(catalogs, []);
  assert.equal(
    without.issues.filter((issue) => issue.code === "catalog-unexplained-english").length,
    NATIVE_REVIEW_LOCALES.length,
  );

  const withAllowlist = validateMessageCatalogs(
    catalogs,
    passingConfig().localization.sameAsEnglishAllowlist,
  );
  assert.deepEqual(withAllowlist.issues, []);
});

test("stale or overbroad identical-text exceptions are rejected", () => {
  const catalogs = passingCatalogs();
  catalogs.widgets.de["tech.name"] = "Anbietername";
  const result = validateMessageCatalogs(
    catalogs,
    passingConfig().localization.sameAsEnglishAllowlist,
  );
  assert.ok(result.issues.some((issue) => issue.code === "catalog-allowlist-stale"));
});

test("sensitive evidence detection and reports never echo matched values", () => {
  const credential = ["sk", "-", "Z".repeat(28)].join("");
  const signedUrl = ["https://preview.example.test/path", "?sig=", "private-value"].join("");
  const value = {
    note: credential,
    preview: signedUrl,
    providerResponse: { hidden: true },
  };

  const findings = findSensitiveEvidence(value);
  assert.ok(findings.some((finding) => finding.code === "provider-key"));
  assert.ok(findings.some((finding) => finding.code === "url-with-query"));
  assert.ok(findings.some((finding) => finding.code === "sensitive-field"));
  assert.equal(JSON.stringify(findings).includes(credential), false);
  assert.equal(JSON.stringify(findings).includes("private-value"), false);

  const redacted = redactSensitiveText(`${credential} ${signedUrl}`);
  assert.equal(redacted.includes(credential), false);
  assert.equal(redacted.includes("private-value"), false);
  assert.match(redacted, /\[REDACTED\]/);
});

test("the locale fixture covers the exact nine-language contract", () => {
  assert.deepEqual(LOCALES, ["en", "zh-Hans", "zh-Hant", "ar", "de", "es", "fr", "ja", "ko"]);
  assert.equal(Object.keys(passingCatalogs().site).length, LOCALES.length);
});
