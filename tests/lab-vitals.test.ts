import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertLabVitalsReport,
  fingerprintEntries,
  LAB_VITALS_ROUTES,
  LAB_VITALS_SCHEMA,
  median,
  parseCliArgs,
  summarizeSamples,
} from "../scripts/measure-lab-vitals.mjs";

test("lab-vitals median and mode summary retain zero CLS without inventing metrics", () => {
  assert.equal(median([8, 2, 4]), 4);
  assert.equal(median([1, 3, 7, 9]), 5);
  assert.deepEqual(summarizeSamples([
    { iteration: 1, lcpMs: 220.12, cls: 0, inpMs: 32 },
    { iteration: 2, lcpMs: 210.14, cls: 0.00123, inpMs: 24 },
    { iteration: 3, lcpMs: 230.16, cls: 0, inpMs: 40 },
  ]), { lcpMs: 220.1, cls: 0, inpMs: 32 });
  assert.throws(
    () => summarizeSamples([{ iteration: 1, lcpMs: 200, cls: 0, inpMs: null }]),
    /no finite inpMs/,
  );
});

test("lab-vitals CLI defaults to three samples and validates bounded inputs", () => {
  const defaults = parseCliArgs([]);
  assert.equal(defaults.samples, 3);
  assert.equal(defaults.headless, true);
  assert.deepEqual(parseCliArgs(["--samples=1", "--port=4317", "--headed"]), {
    samples: 1,
    port: 4317,
    headless: false,
    help: false,
  });
  assert.throws(() => parseCliArgs(["--samples=0"]), /positive integer/);
  assert.throws(() => parseCliArgs(["--unknown"]), /unknown argument/);
});

test("static export fingerprint is order-independent and binds paths, bytes, count, and size", () => {
  const first = fingerprintEntries([
    { path: "z.txt", content: Buffer.from("last") },
    { path: "a/index.html", content: Buffer.from("first") },
  ]);
  const reordered = fingerprintEntries([
    { path: "a/index.html", content: Buffer.from("first") },
    { path: "z.txt", content: Buffer.from("last") },
  ]);
  const changed = fingerprintEntries([
    { path: "a/index.html", content: Buffer.from("changed") },
    { path: "z.txt", content: Buffer.from("last") },
  ]);
  assert.deepEqual(first, reordered);
  assert.equal(first.algorithm, "sha256");
  assert.match(first.digest, /^[0-9a-f]{64}$/);
  assert.equal(first.fileCount, 2);
  assert.equal(first.totalBytes, 9);
  assert.notEqual(first.digest, changed.digest);
});

test("lab-vitals schema requires six routes, cold and warm raw samples, and finite medians", () => {
  const sample = {
    iteration: 1,
    status: 200,
    cacheControl: "public, max-age=3600",
    interaction: "controlled click",
    interactionEvents: 1,
    inpSource: "first-input",
    lcpMs: 200,
    cls: 0,
    inpMs: 24,
  };
  const report = {
    schema: LAB_VITALS_SCHEMA,
    evidenceKind: "synthetic-lab",
    source: { commitSha: "a".repeat(40), dirty: false },
    artifact: {
      nextBuildId: "test-build-id",
      export: {
        algorithm: "sha256",
        digest: "b".repeat(64),
        fileCount: 448,
        totalBytes: 1_000_000,
      },
    },
    runtime: {
      node: "v20.0.0",
      platform: "linux",
      browser: { name: "chromium", version: "1", headless: true },
    },
    conditions: { samplesPerMode: 1 },
    routes: LAB_VITALS_ROUTES.map((route) => ({
      id: route.id,
      path: route.path,
      expectedStatus: route.expectedStatus,
      modes: {
        cold: {
          samples: [{ ...sample, status: route.expectedStatus }],
          medians: { lcpMs: 200, cls: 0, inpMs: 24 },
        },
        warm: {
          samples: [{ ...sample, status: route.expectedStatus }],
          medians: { lcpMs: 180, cls: 0, inpMs: 24 },
        },
      },
    })),
  };
  assert.equal(assertLabVitalsReport(report, 1), report);

  const missingInp = structuredClone(report);
  missingInp.routes[0].modes.cold.medians.inpMs = Number.NaN;
  assert.throws(() => assertLabVitalsReport(missingInp, 1), /finite median inpMs/);

  const missingExport = structuredClone(report);
  missingExport.artifact.export.digest = "not-a-sha256";
  assert.throws(() => assertLabVitalsReport(missingExport, 1), /export fingerprint/);
});

test("lab-vitals source contract covers the approved route matrix and never calls missing INP zero", () => {
  assert.deepEqual(
    LAB_VITALS_ROUTES.map(({ id, path, expectedStatus }) => ({ id, path, expectedStatus })),
    [
      { id: "home", path: "/en/", expectedStatus: 200 },
      { id: "handbook", path: "/en/handbook/", expectedStatus: 200 },
      { id: "lab", path: "/en/lab/", expectedStatus: 200 },
      { id: "build", path: "/en/build/", expectedStatus: 200 },
      { id: "teach", path: "/en/teach/", expectedStatus: 200 },
      { id: "404", path: "/missing-lab-vitals/", expectedStatus: 404 },
    ],
  );
});
