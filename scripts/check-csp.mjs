import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const CSP_HEADER_BY_STAGE = Object.freeze({
  "report-only": "Content-Security-Policy-Report-Only",
  enforced: "Content-Security-Policy",
});

export const CANONICAL_CSP_DIRECTIVES = Object.freeze([
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://api.deepseek.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
]);

export const CANONICAL_CSP_POLICY = CANONICAL_CSP_DIRECTIVES.join("; ") + ";";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sameKeys(value, expected) {
  if (!isObject(value)) return false;
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

export function findCspHeaders(vercelConfig) {
  const found = [];
  if (!isObject(vercelConfig) || !Array.isArray(vercelConfig.headers)) return found;

  for (const [ruleIndex, rule] of vercelConfig.headers.entries()) {
    if (!isObject(rule) || !Array.isArray(rule.headers)) continue;
    for (const [headerIndex, header] of rule.headers.entries()) {
      if (!isObject(header) || typeof header.key !== "string") continue;
      const key = header.key.toLowerCase();
      if (key === "content-security-policy" || key === "content-security-policy-report-only") {
        found.push({ rule, header, ruleIndex, headerIndex });
      }
    }
  }
  return found;
}

function policyFindings(policy, where) {
  const issues = [];
  if (typeof policy !== "string") return [where + " must be a string"];
  if (policy !== CANONICAL_CSP_POLICY) {
    issues.push(where + " must exactly match the reviewed baseline egress policy");
  }
  if (policy.includes("'unsafe-eval'")) {
    issues.push(where + " must not contain 'unsafe-eval'");
  }

  const directives = policy
    .split(";")
    .map((directive) => directive.trim())
    .filter(Boolean);
  if (new Set(directives.map((directive) => directive.split(/\s+/, 1)[0])).size !== directives.length) {
    issues.push(where + " must not contain duplicate directives");
  }

  const inlineDirectives = directives
    .filter((directive) => directive.split(/\s+/).includes("'unsafe-inline'"))
    .map((directive) => directive.split(/\s+/, 1)[0]);
  if (
    inlineDirectives.length !== 2
    || inlineDirectives[0] !== "script-src"
    || inlineDirectives[1] !== "style-src"
  ) {
    issues.push(
      where + " may use 'unsafe-inline' only in script-src and style-src, as explicitly reviewed",
    );
  }
  if (directives.some((directive) => directive.split(/\s+/).includes("*"))) {
    issues.push(where + " must not contain wildcard sources");
  }
  return issues;
}

export function cspFindings(stageConfig, vercelConfig) {
  const issues = [];
  if (!sameKeys(stageConfig, ["version", "stage", "policy"])) {
    issues.push("config/csp-stage.json must contain exactly version, stage, and policy");
  }
  if (stageConfig?.version !== 1) {
    issues.push("config/csp-stage.json version must be 1");
  }

  const stage = stageConfig?.stage;
  if (!Object.hasOwn(CSP_HEADER_BY_STAGE, stage)) {
    issues.push("config/csp-stage.json stage must be report-only or enforced");
  }
  issues.push(...policyFindings(stageConfig?.policy, "config/csp-stage.json policy"));

  const cspHeaders = findCspHeaders(vercelConfig);
  if (cspHeaders.length !== 1) {
    issues.push("vercel.json must contain exactly one CSP header across all header rules");
    return issues;
  }

  const [{ rule, header }] = cspHeaders;
  if (rule.source !== "/(.*)") {
    issues.push("the CSP header must apply to the global /(.*) Vercel source");
  }
  if (Object.hasOwn(CSP_HEADER_BY_STAGE, stage) && header.key !== CSP_HEADER_BY_STAGE[stage]) {
    issues.push("vercel.json CSP header key does not match config/csp-stage.json stage");
  }
  issues.push(...policyFindings(header.value, "vercel.json CSP header value"));
  if (typeof stageConfig?.policy === "string" && header.value !== stageConfig.policy) {
    issues.push("config/csp-stage.json and vercel.json must carry the same policy value");
  }
  return issues;
}

export function assertCspConfiguration(stageConfig, vercelConfig) {
  const issues = cspFindings(stageConfig, vercelConfig);
  if (issues.length) throw new Error(issues.join("\n"));
}

export function checkCsp(project = process.cwd()) {
  const root = resolve(project);
  const stageConfig = JSON.parse(readFileSync(join(root, "config", "csp-stage.json"), "utf8"));
  const vercelConfig = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
  assertCspConfiguration(stageConfig, vercelConfig);
  console.log(
    "csp: " + stageConfig.stage + " stage; one global " + CSP_HEADER_BY_STAGE[stageConfig.stage] +
      " header; reviewed baseline policy verified",
  );
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  try {
    checkCsp();
  } catch (error) {
    console.error("csp: FAIL — " + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  }
}
