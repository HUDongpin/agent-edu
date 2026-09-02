import assert from "node:assert/strict";
import test from "node:test";
import {
  CODEX_LOCALES,
  loadCodexCopy,
  validateCodexCopy,
  type CodexLocale,
} from "../lib/codex";
import {
  formatCodexTemplate,
  formatCodexUtcMediumDate,
  formatCodexVisibleInteger,
  formatCodexVisiblePercent,
} from "../lib/codex/format";

const UI_TEMPLATE_SIGNATURES = {
  courseOutlineSummaryTemplate: ["current", "title", "total"],
  finalQuizIntro: ["passingCorrectAnswers", "questionCount", "questionsPerUnit"],
  passRequirement: ["passingCorrectAnswers", "questionCount"],
  questionProgressTemplate: ["current", "total"],
  scoreSummaryTemplate: ["score", "total"],
  bestScoreTemplate: ["score", "total"],
  supportingSourceTemplate: ["number", "title"],
  verifiedOnTemplate: ["date"],
  pendingFigureAltTemplate: ["alt", "status"],
  passingScoreTemplate: ["score"],
  rubricWeightTemplate: ["weight"],
  completionPercentTemplate: ["percent"],
  sourceRepositoryMetaTemplate: ["license", "licenseLabel", "stars"],
  scrollableCodeTemplate: ["language"],
  scrollableComparison: [],
} as const;

const REQUIRED_UI_KEYS = [
  "courseOutlineSummaryTemplate",
  "currentLesson",
  "completedLesson",
  "recommendedNextLesson",
  "markIncomplete",
  "continueQuiz",
  "retakeQuiz",
  "quizInProgress",
  "priorPassPreserved",
  "quizDraftRestored",
  "receiptDraftRestored",
  "resetSessionOnly",
  "supportingSourceTemplate",
  "verifiedOnTemplate",
  "pendingFigureAltTemplate",
  "passingScoreTemplate",
  "rubricWeightTemplate",
  "completionPercentTemplate",
  "sourceRepositoryMetaTemplate",
  "scrollableCodeTemplate",
  "scrollableComparison",
] as const;

function placeholderSignature(value: string): readonly string[] {
  return [...value.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)]
    .map((match) => match[1])
    .sort();
}

test("Codex templates support localized ordering and preserve unknown placeholders", () => {
  assert.equal(
    formatCodexTemplate("{title} · {current}/{total}", {
      current: "٢",
      title: "عنوان",
      total: "١٢",
    }),
    "عنوان · ٢/١٢",
  );
  assert.equal(formatCodexTemplate("{known} {unknown}", { known: "ready" }), "ready {unknown}");
});

test("all nine Codex bundles expose the expanded UI contract with exact placeholder parity", async () => {
  const english = await loadCodexCopy("en");
  const englishUiKeys = Object.keys(english.ui).sort();

  for (const locale of CODEX_LOCALES) {
    const copy = await loadCodexCopy(locale);
    assert.deepEqual(Object.keys(copy.ui).sort(), englishUiKeys, locale);
    for (const key of REQUIRED_UI_KEYS) {
      assert.equal(typeof copy.ui[key], "string", `${locale}.${key}`);
      assert.ok(copy.ui[key].trim(), `${locale}.${key}`);
    }
    for (const [key, signature] of Object.entries(UI_TEMPLATE_SIGNATURES)) {
      const value = copy.ui[key as keyof typeof copy.ui];
      assert.equal(typeof value, "string", `${locale}.${key}`);
      assert.deepEqual(placeholderSignature(value), [...signature], `${locale}.${key}`);
    }
    assert.doesNotMatch(
      copy.meta.sourceNote,
      /\b20\d{2}\b/u,
      `${locale}.meta.sourceNote must not duplicate the authoritative manifest date`,
    );
    assert.deepEqual(
      validateCodexCopy(locale, copy, locale === "en" ? undefined : english),
      [],
      locale,
    );
  }
});

test("Codex visible integers and percentages are deterministic for every locale", () => {
  const expectedIntegers: Record<CodexLocale, string> = {
    en: "1204",
    es: "1204",
    fr: "1204",
    de: "1204",
    "zh-Hans": "1204",
    "zh-Hant": "1204",
    ja: "1204",
    ko: "1204",
    ar: "١٢٠٤",
  };
  const expectedPercentages: Record<CodexLocale, string> = {
    en: "93%",
    es: "93\u00a0%",
    fr: "93\u00a0%",
    de: "93\u00a0%",
    "zh-Hans": "93%",
    "zh-Hant": "93%",
    ja: "93%",
    ko: "93%",
    ar: "٩٣٪",
  };

  for (const locale of CODEX_LOCALES) {
    assert.equal(formatCodexVisibleInteger(1204, locale), expectedIntegers[locale], locale);
    assert.equal(formatCodexVisiblePercent(93, locale), expectedPercentages[locale], locale);
  }
  assert.throws(() => formatCodexVisibleInteger(1.5, "en"), /safe integer/);
  assert.throws(() => formatCodexVisiblePercent(-1, "en"), /between 0 and 100/);
  assert.throws(() => formatCodexVisiblePercent(101, "en"), /between 0 and 100/);
  assert.throws(() => formatCodexVisiblePercent(50.5, "en"), /integer/);
});

test("Codex visible dates are UTC-bound and locale appropriate while the machine value stays ASCII", () => {
  const machineDate = "2026-08-24";
  const expected: Record<CodexLocale, string> = {
    en: "Aug 24, 2026",
    es: "24 ago 2026",
    fr: "24 août 2026",
    de: "24.08.2026",
    "zh-Hans": "2026年8月24日",
    "zh-Hant": "2026年8月24日",
    ja: "2026/08/24",
    ko: "2026. 8. 24.",
    ar: "٢٤‏/٠٨‏/٢٠٢٦",
  };

  for (const locale of CODEX_LOCALES) {
    assert.equal(formatCodexUtcMediumDate(machineDate, locale), expected[locale], locale);
  }
  assert.equal(machineDate, "2026-08-24");
  assert.throws(() => formatCodexUtcMediumDate("2026-02-30", "en"), /calendar date/);
  assert.throws(() => formatCodexUtcMediumDate("08/24/2026", "en"), /YYYY-MM-DD/);
});
