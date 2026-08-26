import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import LocaleError from "../app/[locale]/error";
import { I18nProvider } from "../components/I18nProvider";
import messages from "../messages/en.json";

const LOCALE_ERROR_PATH = "app/[locale]/error.tsx";
const GLOBAL_ERROR_PATH = "app/global-error.tsx";

const FORBIDDEN_ERROR_READS = [
  /error\s*\.\s*message/,
  /error\s*\.\s*stack/,
  /error\s*\.\s*digest/,
  /JSON\s*\.\s*stringify\s*\(\s*error\b/,
  /localStorage/,
  /sessionStorage/,
];

test("locale error renders a semantic recovery surface without leaking the error", () => {
  const sentinel = "SENSITIVE_PROVIDER_BODY_PROMPT_CREDENTIAL_SENTINEL";
  const error = Object.assign(new Error(sentinel), { digest: sentinel });
  const child = React.createElement(LocaleError, { error, reset() {} });
  const providerProps: React.ComponentProps<typeof I18nProvider> = {
    locale: "en",
    messages,
    children: child,
  };
  const markup = renderToStaticMarkup(
    React.createElement(I18nProvider, providerProps),
  );

  assert.doesNotMatch(markup, new RegExp(sentinel));
  assert.match(markup, /role="alert"/);
  assert.match(markup, /aria-labelledby="locale-error-title"/);
  assert.match(markup, /data-testid="locale-error"/);
  assert.match(markup, />Try again<\/button>/);
  assert.match(markup, /href="\/en\/?"/);
});

test("locale and global error sources never consume raw error or browser storage data", () => {
  for (const path of [LOCALE_ERROR_PATH, GLOBAL_ERROR_PATH]) {
    const source = readFileSync(path, "utf8");
    for (const forbidden of FORBIDDEN_ERROR_READS) {
      assert.doesNotMatch(source, forbidden, `${path} must not expose ${forbidden}`);
    }
    assert.match(source, /role="alert"/, `${path} must announce the failure`);
    assert.match(source, /aria-labelledby=/, `${path} must label the recovery region`);
    assert.match(source, /reset/, `${path} must provide a retry action`);
  }

  const globalSource = readFileSync(GLOBAL_ERROR_PATH, "utf8");
  assert.match(globalSource, /export default function GlobalError\(\{\s*reset,\s*\}/);
  assert.match(globalSource, /<html lang=\{locale\} dir=\{locale === "ar" \? "rtl" : "ltr"\}/);
  assert.match(globalSource, /data-testid="global-error"/);
});
