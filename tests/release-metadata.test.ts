import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  generateReleaseMetadata,
  releaseMetadata,
  resolveReleaseCommit,
} from "../scripts/generate-release-metadata.mjs";

const SHA = "1234567890abcdef1234567890abcdef12345678";

test("release metadata binds the Vercel commit, deployment ID, and unique URL", () => {
  const metadata = releaseMetadata({
    env: {
      VERCEL_GIT_COMMIT_SHA: SHA,
      VERCEL_ENV: "preview",
      VERCEL_DEPLOYMENT_ID: "dpl_examplePreview123",
      VERCEL_URL: "agent-edu-example.vercel.app",
    },
  });
  assert.deepEqual(metadata, {
    schema: "agent-edu.release-build.v1",
    commitSha: SHA,
    environment: "preview",
    deploymentId: "dpl_examplePreview123",
    deploymentUrl: "https://agent-edu-example.vercel.app",
  });
});

test("invalid environment commit metadata fails closed instead of falling back", () => {
  assert.throws(
    () => resolveReleaseCommit({ env: { VERCEL_GIT_COMMIT_SHA: "not-a-sha" } }),
    /VERCEL_GIT_COMMIT_SHA/,
  );
});

test("the generated well-known record is deterministic and machine-readable", () => {
  const projectRoot = mkdtempSync(join(tmpdir(), "agent-edu-release-meta-"));
  const { output } = generateReleaseMetadata({
    projectRoot,
    commitSha: SHA,
    env: {},
  });
  assert.equal(output, join(projectRoot, "out/.well-known/release.json"));
  assert.deepEqual(JSON.parse(readFileSync(output, "utf8")), {
    schema: "agent-edu.release-build.v1",
    commitSha: SHA,
    environment: "local",
    deploymentId: null,
    deploymentUrl: null,
  });
});

test("Preview metadata fails closed when Vercel does not expose deployment bindings", () => {
  assert.throws(() => releaseMetadata({
    env: { VERCEL_GIT_COMMIT_SHA: SHA, VERCEL_ENV: "preview" },
  }), /VERCEL_DEPLOYMENT_ID and VERCEL_URL/);
});

test("production metadata also requires exact deployment bindings", () => {
  assert.deepEqual(releaseMetadata({
    env: {
      VERCEL_GIT_COMMIT_SHA: SHA,
      VERCEL_ENV: "production",
      VERCEL_DEPLOYMENT_ID: "dpl_exampleProduction123",
      VERCEL_URL: "agent-edu-production-example.vercel.app",
    },
  }), {
    schema: "agent-edu.release-build.v1",
    commitSha: SHA,
    environment: "production",
    deploymentId: "dpl_exampleProduction123",
    deploymentUrl: "https://agent-edu-production-example.vercel.app",
  });
  assert.throws(() => releaseMetadata({
    env: { VERCEL_GIT_COMMIT_SHA: SHA, VERCEL_ENV: "production" },
  }), /Production builds require VERCEL_DEPLOYMENT_ID and VERCEL_URL/);
});

test("the official Vercel development environment remains explicit", () => {
  assert.deepEqual(releaseMetadata({
    commitSha: SHA,
    env: { VERCEL_ENV: "development" },
  }), {
    schema: "agent-edu.release-build.v1",
    commitSha: SHA,
    environment: "development",
    deploymentId: null,
    deploymentUrl: null,
  });
});
