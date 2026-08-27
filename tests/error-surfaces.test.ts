import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { LOCALE_CODES } from "../lib/i18n";
import {
  ERROR_LOCALES,
  GLOBAL_ERROR_COPY,
  errorDirection,
  errorLocaleFromPathname,
} from "../lib/error-copy";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MESSAGE_KEYS = [
  "error.notFoundEyebrow",
  "error.notFoundTitle",
  "error.notFoundBody",
  "error.unexpectedEyebrow",
  "error.unexpectedTitle",
  "error.unexpectedBody",
  "error.reference",
] as const;

function source(path: string): string {
  return readFileSync(resolve(ROOT, path), "utf8");
}

test("localized recovery copy covers the exact nine-locale shell contract", () => {
  assert.deepEqual(ERROR_LOCALES, LOCALE_CODES);
  const english = JSON.parse(source("messages/en.json")) as Record<string, string>;

  for (const locale of ERROR_LOCALES) {
    const messages = JSON.parse(source(`messages/${locale}.json`)) as Record<string, string>;

    for (const key of MESSAGE_KEYS) {
      assert.equal(typeof messages[key], "string", `${locale} is missing ${key}`);
      assert.ok(messages[key]?.trim(), `${locale} has an empty ${key}`);
      if (locale !== "en") {
        assert.notEqual(messages[key], english[key], `${locale} silently falls back for ${key}`);
      }
    }

    assert.deepEqual(GLOBAL_ERROR_COPY[locale], {
      eyebrow: messages["error.unexpectedEyebrow"],
      title: messages["error.unexpectedTitle"],
      body: messages["error.unexpectedBody"],
      retry: messages["ui.retry"],
      home: messages["nav.home"],
      courses: messages["nav.courses"],
      reference: messages["error.reference"],
    });
  }
});

test("global recovery derives a safe locale and direction from static paths", () => {
  assert.equal(errorLocaleFromPathname("/zh-Hans/courses/"), "zh-Hans");
  assert.equal(errorLocaleFromPathname("/ar/responsible-ai/"), "ar");
  assert.equal(errorLocaleFromPathname("/unknown/path/"), "en");
  assert.equal(errorLocaleFromPathname("/"), "en");
  assert.equal(errorDirection("ar"), "rtl");
  assert.equal(errorDirection("en"), "ltr");
});

test("Next.js special files preserve error-boundary, landmark and focus contracts", () => {
  const notFound = source("app/[locale]/not-found.tsx");
  const localeError = source("app/[locale]/error.tsx");
  const globalError = source("app/global-error.tsx");
  const surface = source("components/ErrorSurface.tsx");

  assert.match(notFound, /^"use client";/);
  assert.match(notFound, /useI18n\(\)/);
  assert.doesNotMatch(notFound, /<main\b/);

  assert.match(localeError, /^"use client";/);
  assert.match(localeError, /retry:\s*\(\)\s*=>\s*void/);
  assert.match(localeError, /onRetry=\{retry\}/);
  assert.doesNotMatch(localeError, /error\.message/);
  assert.doesNotMatch(localeError, /<main\b/);

  assert.match(globalError, /^"use client";/);
  assert.match(globalError, /import "\.\/globals\.css"/);
  assert.match(globalError, /<html\b/);
  assert.match(globalError, /<body>/);
  assert.match(globalError, /<main\b/);
  assert.match(globalError, /window\.location\.pathname/);
  assert.doesNotMatch(globalError, /useI18n|I18nProvider/);

  assert.match(surface, /useRef<HTMLHeadingElement>\(null\)/);
  assert.match(surface, /headingRef\.current\?\.focus\(\)/);
  assert.match(surface, /tabIndex=\{-1\}/);
  assert.match(surface, /role=\{alert \? "alert" : undefined\}/);
  assert.match(surface, /type="button"/);
  assert.match(surface, /href=\{homeHref\}/);
});
