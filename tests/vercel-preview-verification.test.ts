import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  assertCleanExactCheckout,
  assertTargetCspStage,
  buildPreviewPlan,
  cspHeaderFindings,
  deploymentMetadataPairFindings,
  deploymentMetadataMatches,
  isExpectedReportOnlyCspDiagnostic,
  inspectReleaseMetadataResponse,
  parseArguments,
  previewRequestHeaders,
  releaseMetadataTextFindings,
  routeOriginBoundRequest,
  securityHeaderFindings,
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
  assert.equal(deploymentMetadataMatches({
    schema: "agent-edu.release-build.v1",
    commitSha: SHA,
    environment: "production",
    deploymentId: "dpl_exampleProduction123",
    deploymentUrl: "https://agent-edu-production-example.vercel.app",
    unexpected: true,
  }, production), false);
});

test("release metadata rejects extra keys and scans raw text before parsing", () => {
  const target = validateDeploymentTarget({
    url: "https://agent-edu-git-example.vercel.app",
    deploymentId: "dpl_examplePreview123",
    commitSha: SHA,
    environment: "preview",
    cspStage: "report-only",
  });
  const providerKey = ["sk", "-", "A".repeat(28)].join("");
  const inspected = releaseMetadataTextFindings(JSON.stringify({
    schema: "agent-edu.release-build.v1",
    commitSha: SHA,
    environment: "preview",
    deploymentId: "dpl_examplePreview123",
    deploymentUrl: "https://agent-edu-git-example.vercel.app",
    extra: providerKey,
  }), target);
  assert.ok(inspected.findings.some((finding) => finding.startsWith("sensitive-")));
  assert.ok(inspected.findings.includes("release-metadata-binding"));
  assert.equal(inspected.findings.join("\n").includes(providerKey), false);
});

test("release metadata response is bounded, typed, and byte-canonical", async () => {
  const target = validateDeploymentTarget({
    url: "https://agent-edu-git-example.vercel.app",
    deploymentId: "dpl_examplePreview123",
    commitSha: SHA,
    environment: "preview",
    cspStage: "report-only",
  });
  const metadata = {
    schema: "agent-edu.release-build.v1",
    commitSha: SHA,
    environment: "preview",
    deploymentId: "dpl_examplePreview123",
    deploymentUrl: "https://agent-edu-git-example.vercel.app",
  };
  const canonical = `${JSON.stringify(metadata, null, 2)}\n`;
  assert.deepEqual(await inspectReleaseMetadataResponse(new Response(canonical, {
    headers: { "content-type": "application/json; charset=utf-8" },
  }), target), { metadata, findings: [] });
  assert.ok((await inspectReleaseMetadataResponse(new Response(JSON.stringify(metadata), {
    headers: { "content-type": "text/plain" },
  }), target)).findings.includes("release-metadata-content-type"));
  assert.ok((await inspectReleaseMetadataResponse(new Response("", {
    headers: {
      "content-type": "application/json",
      "content-length": String(16 * 1024 + 1),
    },
  }), target)).findings.includes("release-metadata-size"));
});

test("CSP header verification is exact for report-only and enforced stages", () => {
  const policy = JSON.parse(readFileSync("config/csp-stage.json", "utf8")).policy;
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
  assert.deepEqual(cspHeaderFindings(new Headers(), "enforced"), [
    { code: "header-csp-enforced", detail: "reviewed-baseline-mismatch" },
  ]);
  for (const unsafePolicy of [
    `${policy} script-src * 'unsafe-eval';`,
    policy.replace("connect-src 'self' https://api.deepseek.com", "connect-src *"),
    `default-src *; ${policy}`,
  ]) {
    assert.deepEqual(cspHeaderFindings(new Headers({
      "content-security-policy": unsafePolicy,
    }), "enforced"), [
      { code: "header-csp-enforced", detail: "reviewed-baseline-mismatch" },
    ]);
  }
});

test("browser OIDC routing adds the token only to the verified origin and contains redirects", async () => {
  const makeRoute = (url: string, initialHeaders: Record<string, string> = {}) => {
    const calls: Array<{ method: string; options: unknown }> = [];
    const response = { status: () => 200 };
    return {
      calls,
      route: {
        request: () => ({ url: () => url, headers: () => initialHeaders }),
        fetch: async (options: unknown) => {
          calls.push({ method: "fetch", options });
          return response;
        },
        fulfill: async (options: unknown) => calls.push({ method: "fulfill", options }),
        continue: async (options: unknown) => calls.push({ method: "continue", options }),
      },
    };
  };
  const token = "header_value.payload_value.signature_value";
  const deploymentOrigin = "https://agent-edu-git-example.vercel.app";
  const sameOrigin = makeRoute(`${deploymentOrigin}/en/`);
  await routeOriginBoundRequest(sameOrigin.route, deploymentOrigin, token);
  assert.equal(sameOrigin.calls[0].method, "fetch");
  assert.deepEqual(sameOrigin.calls[0].options, {
    headers: {
      "x-vercel-trusted-oidc-idp-token": token,
    },
    maxRedirects: 0,
  });
  assert.equal(sameOrigin.calls[1].method, "fulfill");

  const crossOrigin = makeRoute("https://third-party.example/image.png", {
    "x-vercel-trusted-oidc-idp-token": token,
  });
  await routeOriginBoundRequest(crossOrigin.route, deploymentOrigin, token);
  assert.deepEqual(crossOrigin.calls, [{ method: "continue", options: { headers: {} } }]);
});

test("production metadata must agree across the custom and unique deployment origins", () => {
  const target = validateDeploymentTarget({
    url: "https://aicourse.top",
    deploymentId: "dpl_exampleProduction123",
    commitSha: SHA,
    environment: "production",
    cspStage: "enforced",
    metadataDeploymentUrl: "https://agent-edu-production-example.vercel.app",
  });
  const metadata = {
    schema: "agent-edu.release-build.v1",
    commitSha: SHA,
    environment: "production",
    deploymentId: "dpl_exampleProduction123",
    deploymentUrl: "https://agent-edu-production-example.vercel.app",
  };
  assert.deepEqual(deploymentMetadataPairFindings(metadata, structuredClone(metadata), target), []);
  assert.deepEqual(deploymentMetadataPairFindings(metadata, undefined, target), [
    "unique-deployment-metadata-missing",
  ]);
  assert.deepEqual(deploymentMetadataPairFindings(metadata, {
    ...metadata,
    deploymentId: "dpl_otherProduction123",
  }, target), [
    "unique-deployment-metadata-binding",
    "production-metadata-origins-diverge",
  ]);
});

test("CLI singleton arguments reject attempts to override the production alias", () => {
  assert.throws(() => parseArguments([
    "--environment", "production",
    "--csp-stage", "enforced",
    "--url", "https://aicourse.top",
    "--deployment-id", "dpl_exampleProduction123",
    "--commit", SHA,
    "--metadata-deployment-url", "https://agent-edu-production-example.vercel.app",
    "--environment", "preview",
  ]), /duplicate deployment verifier argument: --environment/);
});

test("same-SHA verification rejects dirty release inputs before deriving a route plan", () => {
  const cleanExec = (_command: string, args: readonly string[]) => args[0] === "rev-parse" ? `${SHA}\n` : "";
  assert.doesNotThrow(() => assertCleanExactCheckout({
    projectRoot: "/fixture",
    commitSha: SHA,
    execFile: cleanExec,
  }));
  const dirtyExec = (_command: string, args: readonly string[]) => args[0] === "rev-parse"
    ? `${SHA}\n`
    : " M config/course-release-manifest.json\n?? config/route-manifest.json\n";
  assert.throws(() => assertCleanExactCheckout({
    projectRoot: "/fixture",
    commitSha: SHA,
    execFile: dirtyExec,
  }), /checkout must be clean/);
});

test("deployment verifier stage must equal the validated clean-checkout CSP stage", () => {
  const stageConfig = JSON.parse(readFileSync("config/csp-stage.json", "utf8"));
  const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8"));
  assert.doesNotThrow(() => assertTargetCspStage(stageConfig, vercelConfig, "report-only"));
  assert.throws(
    () => assertTargetCspStage(stageConfig, vercelConfig, "enforced"),
    /does not match the clean checkout stage report-only/,
  );
});

test("security headers require the exact no-referrer baseline", () => {
  const policy = JSON.parse(readFileSync("config/csp-stage.json", "utf8")).policy;
  const baseline = {
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "x-frame-options": "DENY",
    "content-security-policy": policy,
  };
  assert.deepEqual(securityHeaderFindings(new Headers(baseline), "enforced"), []);
  for (const unsafe of ["no-referrer, unsafe-url", "unsafe-url, no-referrer"]) {
    assert.deepEqual(
      securityHeaderFindings(new Headers({ ...baseline, "referrer-policy": unsafe }), "enforced"),
      [{ code: "header-referrer-policy" }],
    );
  }
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

test("production verification cannot skip the browser-console matrix", async () => {
  await assert.rejects(() => verifyVercelPreview({
    previewUrl: "https://aicourse.top",
    deploymentId: "dpl_exampleProduction123",
    commitSha: SHA,
    environment: "production",
    cspStage: "enforced",
    metadataDeploymentUrl: "https://agent-edu-production-example.vercel.app",
  }), /requires the full browser-console matrix/);
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
