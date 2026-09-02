import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import type { GithubUiCopy } from "../lib/github/types";

const MESSAGE_DIRECTORY = "messages/github";
const EXPECTED_LOCALES = [
  "ar",
  "de",
  "en",
  "es",
  "fr",
  "ja",
  "ko",
  "zh-Hans",
  "zh-Hant",
] as const;

const PHASE_ONE_UI_KEYS = [
  "lessonPositionTemplate",
  "quizDraftAvailable",
  "resumeQuizDraft",
  "discardQuizDraft",
  "quizDraftRestored",
  "quizDraftDiscarded",
  "capstoneDraftAvailable",
  "resumeCapstoneDraft",
  "discardCapstoneDraft",
  "capstoneDraftRestored",
  "capstoneDraftDiscarded",
  "draftInvalid",
  "draftStorageWarning",
] as const satisfies readonly (keyof GithubUiCopy)[];

const PHASE_TWO_UI_KEYS = [
  "openFigureFullSize",
  "resetNotSaved",
] as const satisfies readonly (keyof GithubUiCopy)[];

type MessageFile = {
  readonly ui: Record<string, unknown>;
};

function readUi(locale: (typeof EXPECTED_LOCALES)[number]): Record<string, unknown> {
  const parsed = JSON.parse(
    readFileSync(`${MESSAGE_DIRECTORY}/${locale}.json`, "utf8"),
  ) as MessageFile;
  return parsed.ui;
}

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{[a-z]+\}/gu)].map(([token]) => token).sort();
}

test("Course 6 Phase 1 copy contract is complete in all nine locales", () => {
  assert.deepEqual(
    readdirSync(MESSAGE_DIRECTORY)
      .filter((name) => name.endsWith(".json"))
      .map((name) => name.replace(/\.json$/u, ""))
      .sort(),
    [...EXPECTED_LOCALES].sort(),
  );

  for (const locale of EXPECTED_LOCALES) {
    const ui = readUi(locale);
    for (const key of PHASE_ONE_UI_KEYS) {
      assert.equal(typeof ui[key], "string", `${locale}.ui.${key} must be a string`);
      assert.notEqual((ui[key] as string).trim(), "", `${locale}.ui.${key} must not be blank`);
    }
  }
});

test("Course 6 Phase 1 templates preserve only the approved placeholders", () => {
  for (const locale of EXPECTED_LOCALES) {
    const ui = readUi(locale);
    assert.deepEqual(
      placeholders(ui.lessonPositionTemplate as string),
      ["{current}", "{total}"],
      `${locale}.ui.lessonPositionTemplate placeholders`,
    );
    for (const key of PHASE_ONE_UI_KEYS.filter((candidate) => candidate !== "lessonPositionTemplate")) {
      assert.deepEqual(placeholders(ui[key] as string), [], `${locale}.ui.${key} placeholders`);
    }
  }
});

test("Course 6 Phase 1 actions and storage warning state the English learner contract", () => {
  const ui = readUi("en");
  assert.equal(ui.resumeQuizDraft, "Resume unfinished assessment");
  assert.equal(ui.discardQuizDraft, "Discard unfinished assessment");
  assert.equal(ui.resumeCapstoneDraft, "Resume capstone draft");
  assert.equal(ui.discardCapstoneDraft, "Discard capstone draft");

  const warning = (ui.draftStorageWarning as string).toLowerCase();
  assert.match(warning, /reload/);
  assert.match(warning, /leaving/);
  assert.match(warning, /discards unfinished work/);
});

test("Course 6 Phase 1 copy is translated rather than copied from English", () => {
  const english = readUi("en");
  for (const locale of EXPECTED_LOCALES.filter((candidate) => candidate !== "en")) {
    const localized = readUi(locale);
    for (const key of PHASE_ONE_UI_KEYS) {
      assert.notEqual(localized[key], english[key], `${locale}.ui.${key} must be localized`);
    }
  }
});

test("Course 6 Phase 2 action and reset-failure copy is complete and localized", () => {
  const english = readUi("en");
  for (const locale of EXPECTED_LOCALES) {
    const ui = readUi(locale);
    for (const key of PHASE_TWO_UI_KEYS) {
      assert.equal(typeof ui[key], "string", `${locale}.ui.${key} must be a string`);
      assert.notEqual((ui[key] as string).trim(), "", `${locale}.ui.${key} must not be blank`);
      assert.deepEqual(placeholders(ui[key] as string), [], `${locale}.ui.${key} placeholders`);
      if (locale !== "en") {
        assert.notEqual(ui[key], english[key], `${locale}.ui.${key} must be localized`);
      }
    }
  }
});
