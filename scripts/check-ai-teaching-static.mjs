#!/usr/bin/env node

/** Validate the exported Course 18 surface after `next build`. */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  COURSE18_EXPORT_LOCALES as LOCALES,
  COURSE18_EXPORT_MANIFEST_SCHEMA as MANIFEST_SCHEMA,
  COURSE18_EXPORT_MODULES as MODULES,
  compareCourse18ExportIntegrity,
  createCourse18FileIntegritySnapshot,
  validateCourse18ExportState,
} from "./ai-teaching-export-state.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");

function integrityFixtureErrors() {
  const errors = [];
  const baselineRecords = [
    { path: "en/ai-teaching/index.html", bytes: Buffer.from("<main>same HTML</main>") },
    { path: "_next/static/chunks/course.js", bytes: Buffer.from("const value = 1;") },
    { path: "_next/static/css/course.css", bytes: Buffer.from("main{color:#111}") },
  ];
  const baseline = createCourse18FileIntegritySnapshot(baselineRecords);
  const baselineState = {
    exportHash: baseline.hash,
    exportFileCount: baseline.fileCount,
    exportFiles: baseline.files,
  };
  const htmlHash = createCourse18FileIntegritySnapshot(
    baselineRecords.filter((record) => record.path.endsWith(".html")),
  ).hash;

  for (const [label, target, bytes] of [
    ["JavaScript", "_next/static/chunks/course.js", Buffer.from("const value = 2;")],
    ["CSS", "_next/static/css/course.css", Buffer.from("main{color:#112}")],
  ]) {
    const changedRecords = baselineRecords.map((record) =>
      record.path === target ? { ...record, bytes } : record,
    );
    const changed = createCourse18FileIntegritySnapshot(changedRecords);
    const changedHtmlHash = createCourse18FileIntegritySnapshot(
      changedRecords.filter((record) => record.path.endsWith(".html")),
    ).hash;
    if (changedHtmlHash !== htmlHash) {
      errors.push(`integrity fixture: ${label} drift unexpectedly changed the HTML fixture hash`);
    }
    const driftErrors = compareCourse18ExportIntegrity(baselineState, {
      exportHash: changed.hash,
      exportFileCount: changed.fileCount,
      exportFiles: changed.files,
    });
    if (!driftErrors.some((error) => error.includes("exportHash"))) {
      errors.push(`integrity fixture: one-byte ${label} drift was not rejected by the full-export hash`);
    }
  }

  for (const [label, changedRecords] of [
    ["missing file", baselineRecords.slice(0, -1)],
    [
      "extra file",
      [...baselineRecords, { path: "_next/static/chunks/extra.js", bytes: Buffer.from("extra") }],
    ],
  ]) {
    const changed = createCourse18FileIntegritySnapshot(changedRecords);
    const driftErrors = compareCourse18ExportIntegrity(baselineState, {
      exportHash: changed.hash,
      exportFileCount: changed.fileCount,
      exportFiles: changed.files,
    });
    if (
      !driftErrors.some((error) => error.includes("exportFileCount"))
      || !driftErrors.some((error) => error.includes("inventory"))
    ) {
      errors.push(`integrity fixture: ${label} was not rejected by count and inventory`);
    }
  }

  return errors;
}

const errors = [...integrityFixtureErrors(), ...validateCourse18ExportState()];

for (const locale of LOCALES) {
  for (const slug of ["", ...MODULES]) {
    const relative = join(locale, "ai-teaching", slug, "index.html");
    const path = join(OUT, relative);
    if (!existsSync(path)) {
      errors.push(`${relative}: missing static HTML`);
      continue;
    }
    const html = readFileSync(path, "utf8");
    const route = `ai-teaching/${slug ? `${slug}/` : ""}`;
    const canonicalLocale = locale === "zh-Hans" ? "zh-Hans" : "en";
    const tokens = [
      `<html lang="${locale}"`,
      `<link rel="canonical" href="https://aicourse.top/${canonicalLocale}/${route}"`,
      `<link rel="alternate" hrefLang="en" href="https://aicourse.top/en/${route}"`,
      `<link rel="alternate" hrefLang="zh-Hans" href="https://aicourse.top/zh-Hans/${route}"`,
      slug
        ? `data-testid="ai-teaching-module-${slug}"`
        : 'data-testid="ai-teaching-course"',
    ];
    for (const token of tokens) {
      if (!html.includes(token)) errors.push(`${relative}: missing ${token}`);
    }
    if (locale !== "en" && locale !== "zh-Hans" && !html.includes("Language fallback")) {
      errors.push(`${relative}: unreviewed locale does not disclose English fallback`);
    }
    if (html.includes("[object Object]") || html.includes(">undefined<")) {
      errors.push(`${relative}: contains a serialization placeholder`);
    }
  }
}

if (errors.length) {
  process.stderr.write(`Course 18 static export failed (${errors.length}):\n- ${errors.join("\n- ")}\n`);
  process.exit(1);
}

process.stdout.write(
  `Course 18 static export passed: ${LOCALES.length * (MODULES.length + 1)} fresh HTML routes plus a schema-${MANIFEST_SCHEMA} full-export file inventory; reviewed hreflang en/zh-Hans; explicit fallback elsewhere.\n`,
);
