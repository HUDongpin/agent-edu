import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildPreviewPlan,
  cspHeaderFindings,
  deploymentMetadataMatches,
  isExpectedReportOnlyCspDiagnostic,
  previewRequestHeaders,
  validateDeploymentTarget,
  validateTrustedOidcToken,
  validatePreviewTarget,
  verifyVercelPreview,
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

test("deployment target validation distinguishes Preview CSP stages from the canonical production origin", () => {
  assert.deepEqual(validateDeploymentTarget({
    url: "https://agent-edu-git-example.vercel.app",
    deploymentId: "dpl_examplePreview123",
    commitSha: SHA,
    environment: "preview",
    cspStage: "enforced",
  }), {
    origin: "https://agent-edu-git-example.vercel.app",
    deploymentId: "dpl_examplePreview123",
    commitSha: SHA,
    environment: "preview",
    cspStage: "enforced",
    metadataDeploymentUrl: "https://agent-edu-git-example.vercel.app",
  });

  const production = validateDeploymentTarget({
    url: "https://aicourse.top",
    deploymentId: "dpl_exampleProduction123",
    commitSha: SHA,
    environment: "production",
    cspStage: "enforced",
    metadataDeploymentUrl: "https://agent-edu-production-example.vercel.app",
  });
  assert.equal(production.origin, "https://aicourse.top");
  assert.equal(production.metadataDeploymentUrl, "https://agent-edu-production-example.vercel.app");
  assert.throws(() => validateDeploymentTarget({
    url: "https://aicourse.top",
    deploymentId: "dpl_exampleProduction123",
    commitSha: SHA,
    environment: "production",
    cspStage: "report-only",
    metadataDeploymentUrl: "https://agent-edu-production-example.vercel.app",
  }), /production verification requires enforced CSP/);
  assert.throws(() => validateDeploymentTarget({
    url: "https://www.aicourse.top",
    deploymentId: "dpl_exampleProduction123",
    commitSha: SHA,
    environment: "production",
    cspStage: "enforced",
    metadataDeploymentUrl: "https://agent-edu-production-example.vercel.app",
  }), /canonical production origin/);
});

test("deployment metadata binds Preview and production aliases to the exact deployment", () => {
  const preview = validateDeploymentTarget({
    url: "https://agent-edu-git-example.vercel.app",
    deploymentId: "dpl_examplePreview123",
    commitSha: SHA,
    environment: "preview",
    cspStage: "report-only",
  });
  assert.equal(deploymentMetadataMatches({
    schema: "agent-edu.release-build.v1",
    commitSha: SHA,
    environment: "preview",
    deploymentId: "dpl_examplePreview123",
    deploymentUrl: "https://agent-edu-git-example.vercel.app",
  }, preview), true);

  const production = validateDeploymentTarget({
    url: "https://aicourse.top",
    deploymentId: "dpl_exampleProduction123",
    commitSha: SHA,
    environment: "production",
    cspStage: "enforced",
    metadataDeploymentUrl: "https://agent-edu-production-example.vercel.app",
  });
  assert.equal(deploymentMetadataMatches({
    schema: "agent-edu.release-build.v1",
    commitSha: SHA,
    environment: "production",
    deploymentId: "dpl_exampleProduction123",
    deploymentUrl: "https://agent-edu-production-example.vercel.app",
  }, production), true);
  assert.equal(deploymentMetadataMatches({
    schema: "agent-edu.release-build.v1",
    commitSha: SHA,
    environment: "production",
    deploymentId: "dpl_otherProduction123",
    deploymentUrl: "https://agent-edu-production-example.vercel.app",
  }, production), false);
});

test("CSP header verification is exact for report-only and enforced stages", () => {
  const policy = "default-src 'self'; frame-ancestors 'none'; object-src 'none';";
  assert.deepEqual(cspHeaderFindings(new Headers({
    "content-security-policy-report-only": policy,
  }), "report-only"), []);
  assert.deepEqual(cspHeaderFindings(new Headers({
    "content-security-policy": policy,
  }), "enforced"), []);
  assert.deepEqual(
    cspHeaderFindings(new Headers({
      "content-security-policy": policy,
      "content-security-policy-report-only": policy,
    }), "enforced"),
    [{ code: "header-csp-stage-conflict", detail: "content-security-policy-report-only" }],
  );
  assert.equal(
    cspHeaderFindings(new Headers(), "enforced").filter((finding) => finding.code === "header-csp-enforced").length,
    3,
  );
});

test("production verification refuses to transmit a Preview OIDC token", async () => {
  await assert.rejects(() => verifyVercelPreview({
    previewUrl: "https://aicourse.top",
    deploymentId: "dpl_exampleProduction123",
    commitSha: SHA,
    environment: "production",
    cspStage: "enforced",
    metadataDeploymentUrl: "https://agent-edu-production-example.vercel.app",
    trustedOidcToken: "header_value.payload_value.signature_value",
  }), /must not transmit a Preview OIDC token/);
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

test("Preview browser-console verification narrowly classifies the reviewed report-only CSP diagnostic", () => {
  const expected = "The Content Security Policy directive 'upgrade-insecure-requests' is ignored when delivered in a report-only policy.";
  assert.equal(isExpectedReportOnlyCspDiagnostic({
    type: () => "error",
    text: () => expected,
  }), true);
  assert.equal(isExpectedReportOnlyCspDiagnostic({
    type: () => "warning",
    text: () => expected,
  }), false);
  assert.equal(isExpectedReportOnlyCspDiagnostic({
    type: () => "error",
    text: () => `${expected} unexpected suffix`,
  }), false);
});

test("the deployment commands freeze Preview CSP stage and production verification explicitly", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  assert.match(workflow, /csp_stage:[\s\S]*?default:\s*report-only[\s\S]*?enforced/);
  assert.match(workflow, /--environment preview[\s\S]*--csp-stage "\$CSP_STAGE"/);
  assert.equal(
    packageJson.scripts["production:verify"],
    "node scripts/verify-vercel-preview.mjs --environment production --csp-stage enforced",
  );
});
