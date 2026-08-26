import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildPreviewPlan,
  previewRequestHeaders,
  validateTrustedOidcToken,
  validatePreviewTarget,
} from "../scripts/verify-vercel-preview.mjs";

const SHA = "1234567890abcdef1234567890abcdef12345678";
const surface = JSON.parse(readFileSync("config/course-release-surface.json", "utf8"));
const manifest = JSON.parse(readFileSync("config/route-manifest.json", "utf8"));

test("the Preview plan closes over every registry route and every negative locale surface", () => {
  const plan = buildPreviewPlan(surface, manifest);
  assert.equal(plan.publicPaths.length, 735);
  assert.equal(plan.htmlContracts.size, 732);
  assert.equal(plan.expectedSitemapUrls.length, 732);
  assert.equal(plan.consumerPaths.size, 18);
  assert.ok(plan.publicPaths.includes("/en/prompts/"));
  assert.ok(plan.negativePaths.includes("/ar/prompts/"));
  assert.ok(plan.negativePaths.includes("/ar/codex/"));
  assert.equal(plan.negativePaths.includes("/en/prompts/"), false);
  assert.equal(plan.publicPaths.some((path: string) => path.includes("/codex/")), false);
});

test("Preview target validation accepts one clean deployment origin and rejects ambiguous input", () => {
  assert.deepEqual(validatePreviewTarget({
    previewUrl: "https://agent-edu-git-example.vercel.app",
    deploymentId: "dpl_examplePreview123",
    commitSha: SHA,
  }), {
    previewOrigin: "https://agent-edu-git-example.vercel.app",
    deploymentId: "dpl_examplePreview123",
    commitSha: SHA,
  });
  assert.throws(() => validatePreviewTarget({
    previewUrl: "https://agent-edu-git-example.vercel.app/?token=hidden",
    deploymentId: "dpl_examplePreview123",
    commitSha: SHA,
  }), /must not contain/);
  assert.throws(() => validatePreviewTarget({
    previewUrl: "https://example.com",
    deploymentId: "dpl_examplePreview123",
    commitSha: SHA,
  }), /vercel\.app/);
  assert.throws(() => validatePreviewTarget({
    previewUrl: "https://agent-edu-git-example.vercel.app",
    deploymentId: "bad id",
    commitSha: SHA,
  }), /deployment ID/);
});

test("Preview OIDC access stays header-only and fails closed on malformed tokens", () => {
  const token = "header_value.payload_value.signature_value";
  assert.equal(validateTrustedOidcToken(undefined), undefined);
  assert.equal(validateTrustedOidcToken(token), token);
  assert.deepEqual(previewRequestHeaders(undefined), {
    "user-agent": "agent-edu-preview-verifier/1",
  });
  assert.deepEqual(previewRequestHeaders(token), {
    "user-agent": "agent-edu-preview-verifier/1",
    "x-vercel-trusted-oidc-idp-token": token,
  });
  assert.throws(
    () => validateTrustedOidcToken("not-a-jwt"),
    /invalid format/,
  );
  assert.throws(
    () => validateTrustedOidcToken("header.payload.signature\n"),
    /invalid format/,
  );
});
