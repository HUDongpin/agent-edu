import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CANONICAL_CSP_POLICY,
  CSP_HEADER_BY_STAGE,
  assertCspConfiguration,
  cspFindings,
} from "../scripts/check-csp.mjs";
import { transitionCspStage } from "../scripts/set-csp-stage.mjs";

type Stage = keyof typeof CSP_HEADER_BY_STAGE;

function fixture(stage: Stage) {
  return {
    stageConfig: { version: 1, stage, policy: CANONICAL_CSP_POLICY },
    vercelConfig: {
      headers: [
        {
          source: "/(.*)",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: CSP_HEADER_BY_STAGE[stage], value: CANONICAL_CSP_POLICY },
          ],
        },
      ],
    },
  };
}

test("both CSP stages validate against the same reviewed baseline policy", () => {
  for (const stage of ["report-only", "enforced"] as const) {
    const { stageConfig, vercelConfig } = fixture(stage);
    assert.doesNotThrow(() => assertCspConfiguration(stageConfig, vercelConfig));
  }
  assert.doesNotMatch(CANONICAL_CSP_POLICY, /'unsafe-eval'/);
  assert.equal(CANONICAL_CSP_POLICY.match(/'unsafe-inline'/g)?.length, 2);
});

/* The committed stage is enforced, and falling back to report-only is a
   regression rather than a setting. Report-only never protected anyone here:
   a static export has no endpoint to receive reports and none was configured,
   so the browser evaluated the policy, found violations, told nobody, and
   blocked nothing. e2e/compat.spec.ts is what replaced the missing collector —
   it applies this policy to eight built routes in all three engines and fails
   on a violation, which is the evidence the report-only stage was supposed to
   produce and never could. */
test("the committed configuration is valid and enforces", () => {
  const stageConfig = JSON.parse(readFileSync("config/csp-stage.json", "utf8"));
  const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8"));
  assert.equal(stageConfig.stage, "enforced");
  assert.equal(
    vercelConfig.headers
      .flatMap((rule: { headers: { key: string }[] }) => rule.headers)
      .filter((header: { key: string }) => /^content-security-policy/i.test(header.key))
      .map((header: { key: string }) => header.key)
      .join(","),
    CSP_HEADER_BY_STAGE.enforced,
  );
  assert.doesNotThrow(() => assertCspConfiguration(stageConfig, vercelConfig));
});

test("the checker rejects simultaneous report-only and enforced headers", () => {
  const { stageConfig, vercelConfig } = fixture("report-only");
  vercelConfig.headers[0].headers.push({
    key: CSP_HEADER_BY_STAGE.enforced,
    value: CANONICAL_CSP_POLICY,
  });
  assert.match(
    cspFindings(stageConfig, vercelConfig).join("\n"),
    /exactly one CSP header/,
  );
});

test("the checker rejects policy weakening even when both files agree", () => {
  const { stageConfig, vercelConfig } = fixture("report-only");
  const weakened = CANONICAL_CSP_POLICY.replace(
    "script-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' *",
  );
  stageConfig.policy = weakened;
  vercelConfig.headers[0].headers[1].value = weakened;
  const findings = cspFindings(stageConfig, vercelConfig).join("\n");
  assert.match(findings, /exactly match the reviewed baseline/);
  assert.match(findings, /must not contain 'unsafe-eval'/);
  assert.match(findings, /must not contain wildcard sources/);
});

test("stage transition changes only stage and CSP header key", () => {
  const before = fixture("report-only");
  const next = transitionCspStage(before.stageConfig, before.vercelConfig, "enforced");
  assert.equal(next.stageConfig.stage, "enforced");
  assert.equal(next.vercelConfig.headers[0].headers[1].key, CSP_HEADER_BY_STAGE.enforced);
  assert.equal(next.stageConfig.policy, before.stageConfig.policy);
  assert.equal(next.vercelConfig.headers[0].headers[1].value, before.stageConfig.policy);

  const normalizedStage = structuredClone(next.stageConfig);
  normalizedStage.stage = before.stageConfig.stage;
  assert.deepEqual(normalizedStage, before.stageConfig);
  const normalizedVercel = structuredClone(next.vercelConfig);
  normalizedVercel.headers[0].headers[1].key = CSP_HEADER_BY_STAGE["report-only"];
  assert.deepEqual(normalizedVercel, before.vercelConfig);
});

test("stage transition refuses an unreviewed preimage", () => {
  const { stageConfig, vercelConfig } = fixture("report-only");
  stageConfig.policy += " worker-src *;";
  vercelConfig.headers[0].headers[1].value = stageConfig.policy;
  assert.throws(
    () => transitionCspStage(stageConfig, vercelConfig, "enforced"),
    /reviewed baseline/,
  );
});
