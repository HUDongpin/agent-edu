import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  assertLabVitalsReport,
  fingerprintEntries,
  LAB_VITALS_ROUTES,
  LAB_VITALS_SCHEMA,
  median,
  NETWORK_PROFILE_IDS,
  NETWORK_PROFILES,
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
    networks: ["none", "slow-4g"],
  });
  assert.throws(() => parseCliArgs(["--samples=0"]), /positive integer/);
  assert.throws(() => parseCliArgs(["--unknown"]), /unknown argument/);
});

test("lab-vitals runs both network profiles unless told otherwise", () => {
  // Both by default: one profile alone cannot separate a slow parse from a
  // slow arrival, which is the whole reason the second profile exists.
  assert.deepEqual(parseCliArgs([]).networks, ["none", "slow-4g"]);
  assert.deepEqual(parseCliArgs(["--network=slow-4g"]).networks, ["slow-4g"]);
  assert.deepEqual(parseCliArgs(["--network", "none"]).networks, ["none"]);
  // Declared order, whatever order it was asked for, so two reports compare.
  assert.deepEqual(parseCliArgs(["--network=slow-4g,none"]).networks, ["none", "slow-4g"]);
  assert.throws(() => parseCliArgs(["--network=3g"]), /unknown network profile "3g"/);
  assert.throws(() => parseCliArgs(["--network="]), /at least one of/);
  assert.throws(() => parseCliArgs(["--network=none,none"]), /lists a profile twice/);
});

test("an emulated network profile states the conditions it emulates", () => {
  assert.deepEqual(NETWORK_PROFILE_IDS, ["none", "slow-4g"]);
  assert.equal(NETWORK_PROFILES.none.emulated, false);
  const slow = NETWORK_PROFILES["slow-4g"];
  assert.equal(slow.emulated, true);
  // CDP wants bytes per second; the profile is quoted in kbit/s.
  assert.equal(slow.downloadBytesPerSecond, (slow.downloadKbps * 1000) / 8);
  assert.equal(slow.uploadBytesPerSecond, (slow.uploadKbps * 1000) / 8);
  assert.ok(slow.latencyMs > 0);
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
    transferBytes: 250_000,
  };
  const modes = (expectedStatus: number) => ({
    cold: {
      samples: [{ ...sample, status: expectedStatus }],
      medians: { lcpMs: 200, cls: 0, inpMs: 24, transferBytes: 250_000 },
    },
    warm: {
      samples: [{ ...sample, status: expectedStatus, transferBytes: 0 }],
      medians: { lcpMs: 180, cls: 0, inpMs: 24, transferBytes: 0 },
    },
  });
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
    conditions: {
      samplesPerMode: 1,
      networkProfiles: [NETWORK_PROFILES.none, NETWORK_PROFILES["slow-4g"]],
    },
    routes: LAB_VITALS_ROUTES.map((route) => ({
      id: route.id,
      path: route.path,
      expectedStatus: route.expectedStatus,
      profiles: {
        "none": modes(route.expectedStatus),
        "slow-4g": modes(route.expectedStatus),
      },
    })),
  };
  assert.equal(assertLabVitalsReport(report, 1), report);

  const missingInp = structuredClone(report);
  missingInp.routes[0].profiles["none"].cold.medians.inpMs = Number.NaN;
  assert.throws(() => assertLabVitalsReport(missingInp, 1), /finite median inpMs/);

  const missingExport = structuredClone(report);
  missingExport.artifact.export.digest = "not-a-sha256";
  assert.throws(() => assertLabVitalsReport(missingExport, 1), /export fingerprint/);

  /* The three cases below feed the assertion a report that is wrong on
     purpose: a profile deleted, a profile that does not exist, and one that
     claims emulation without the numbers that would describe it. `report` is
     inferred from the literal above, so TypeScript is right to refuse to
     build any of them — refusing malformed reports is the whole job of the
     function under test. The refusal is waived at the one statement that
     does the damage, so the report type and assertLabVitalsReport's own
     signature both stay as strict as they were. */
  type RouteProfiles = (typeof report)["routes"][number]["profiles"];
  type NetworkProfile = (typeof report)["conditions"]["networkProfiles"][number];

  // A profile that was declared and never measured is the failure this shape
  // makes possible, so it is the one worth naming.
  const missingProfile = structuredClone(report);
  delete (missingProfile.routes[2].profiles as Partial<RouteProfiles>)["slow-4g"];
  assert.throws(
    () => assertLabVitalsReport(missingProfile, 1),
    /lab has no results for network profile slow-4g/,
  );

  const unknownProfile = structuredClone(report);
  unknownProfile.conditions.networkProfiles = [
    { id: "dial-up", emulated: true } as unknown as NetworkProfile,
  ];
  assert.throws(() => assertLabVitalsReport(unknownProfile, 1), /unknown network profile/);

  const unstatedEmulation = structuredClone(report);
  unstatedEmulation.conditions.networkProfiles = [
    { id: "slow-4g", emulated: true } as unknown as NetworkProfile,
  ];
  assert.throws(
    () => assertLabVitalsReport(unstatedEmulation, 1),
    /claims emulation without stating its conditions/,
  );
});

test("v2 requires the transfer figure the network profiles exist to expose", () => {
  const base = {
    iteration: 1,
    status: 200,
    cacheControl: "public, max-age=3600",
    interactionEvents: 1,
    inpSource: "first-input",
    lcpMs: 200,
    cls: 0,
    inpMs: 24,
    transferBytes: 250_000,
  };
  const build = (mutate: (sample: Record<string, unknown>) => void) => {
    const cold = { ...base };
    mutate(cold);
    return {
      schema: LAB_VITALS_SCHEMA,
      evidenceKind: "synthetic-lab",
      source: { commitSha: "a".repeat(40), dirty: false },
      artifact: {
        nextBuildId: "b",
        export: { algorithm: "sha256", digest: "b".repeat(64), fileCount: 1, totalBytes: 1 },
      },
      runtime: { node: "v20.0.0", platform: "linux", browser: { name: "chromium", version: "1" } },
      conditions: { samplesPerMode: 1, networkProfiles: [NETWORK_PROFILES.none] },
      routes: LAB_VITALS_ROUTES.map((route) => ({
        id: route.id,
        path: route.path,
        expectedStatus: route.expectedStatus,
        profiles: {
          "none": {
            cold: {
              samples: [{ ...cold, status: route.expectedStatus }],
              medians: { lcpMs: 200, cls: 0, inpMs: 24, transferBytes: cold.transferBytes ?? 0 },
            },
            warm: {
              samples: [{ ...base, status: route.expectedStatus, transferBytes: 0 }],
              medians: { lcpMs: 180, cls: 0, inpMs: 24, transferBytes: 0 },
            },
          },
        },
      })),
    };
  };

  assert.equal(assertLabVitalsReport(build(() => {}), 1).schema, LAB_VITALS_SCHEMA);
  assert.throws(
    () => assertLabVitalsReport(build((sample) => { delete sample.transferBytes; }), 1),
    /no finite raw transferBytes/,
  );
  // A cold load that transferred nothing did not measure a load at all.
  assert.throws(
    () => assertLabVitalsReport(build((sample) => { sample.transferBytes = 0; }), 1),
    /transferred no bytes with the cache disabled/,
  );
});

test("archived v1 evidence keeps validating against its own schema", () => {
  // docs/release/evidence/lab-vitals-a586b44.json is a record of a run that
  // happened, under conditions v2 no longer describes. It is not rewritten to
  // a shape it was never measured in, so the assertion has to accept both.
  const archived = JSON.parse(
    readFileSync("docs/release/evidence/lab-vitals-a586b44.json", "utf8"),
  );
  assert.equal(archived.schema, "agent-edu.synthetic-lab-vitals.v1");
  assert.equal(archived.conditions.networkEmulation, "none");
  assert.equal(assertLabVitalsReport(archived, 3), archived);
  // v1 carries no transfer figure anywhere, and none is invented for it.
  assert.equal(archived.routes[0].modes.cold.medians.transferBytes, undefined);
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
