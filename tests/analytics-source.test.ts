import assert from "node:assert/strict";
import test from "node:test";
import { analyzeSource, scanAnalyticsSources } from "../scripts/check-analytics.mjs";

const allowedLayout = `
import { Analytics } from "@vercel/analytics/next";
export default function Layout() {
  return <Analytics />;
}
`;

function ids(source: string, file = "components/Example.tsx"): string[] {
  return analyzeSource(file, source).map((finding: { id: string }) => finding.id);
}

test("the existing Vercel Analytics page-view component is the only allowlisted integration", () => {
  assert.deepEqual(analyzeSource("app/[locale]/layout.tsx", allowedLayout), []);

  const expandedImport = allowedLayout.replace(
    "{ Analytics }",
    "{ Analytics, track }",
  );
  assert.ok(
    ids(expandedImport, "app/[locale]/layout.tsx").includes(
      "vercel-analytics-import-not-allowlisted",
    ),
  );

  const configuredComponent = allowedLayout.replace("<Analytics />", "<Analytics debug />");
  assert.ok(
    ids(configuredComponent, "app/[locale]/layout.tsx").includes(
      "vercel-analytics-component-not-allowlisted",
    ),
  );

  assert.ok(
    ids('import { Analytics } from "@vercel/analytics/next";\n<Analytics />;').includes(
      "vercel-analytics-import-not-allowlisted",
    ),
  );
});

test("custom analytics calls, browser beacons, event endpoints, and SDKs are rejected", () => {
  assert.ok(ids('analytics.track("lesson_opened", { section: 1 });').includes("custom-analytics-track"));
  assert.ok(
    ids('navigator.sendBeacon("/metrics", JSON.stringify({ count: 1 }));').includes(
      "browser-beacon",
    ),
  );
  assert.ok(ids('navigator["sendBeacon"]("/metrics", "1");').includes("browser-beacon"));
  assert.ok(ids('client["track"]("lesson_opened");').includes("custom-analytics-track"));
  assert.ok(
    ids('fetch("/_vercel/insights/event", { method: "POST" });').includes(
      "custom-event-endpoint",
    ),
  );
  assert.ok(
    ids('import posthog from "posthog-js";\nposthog.capture("open");').includes(
      "analytics-sdk-import",
    ),
  );
  assert.ok(
    ids('const moduleName = "@vercel/analytics/next";').includes("analytics-sdk-reference"),
  );
  assert.ok(
    ids('const source = "https://www.googletagmanager.com/gtm.js?id=GTM-TEST";').includes(
      "analytics-sdk-url",
    ),
  );
  assert.ok(ids('gtag("event", "lesson_opened");').includes("custom-analytics-call"));
});

test("sensitive analytics payload vocabulary is reported without returning source values", () => {
  const findings = analyzeSource(
    "components/Unsafe.tsx",
    'analytics.track("saved", { prompt, reply, apiKey, billingPlan });',
  );
  assert.ok(
    findings.some(
      (finding: { id: string }) => finding.id === "analytics-sensitive-payload",
    ),
  );
  assert.equal(JSON.stringify(findings).includes("apiKey"), false);
  assert.equal(JSON.stringify(findings).includes("billingPlan"), false);
});

test("analytics prose, sensitive product logic, and unrelated progress functions do not trip the gate", () => {
  const source = `
    // Documentation may mention analytics.track() or navigator.sendBeacon().
    const area = "analytics";
    const prompt = getPrompt();
    function trackProgress(step: number) { return step + 1; }
    trackProgress(prompt.length);
  `;
  assert.deepEqual(ids(source), []);
});

test("unparseable source fails closed as a safe category instead of crashing the scanner", () => {
  assert.ok(ids("const = ;").includes("source-parse-error"));
});

test("the repository source tree satisfies the source-only analytics policy", () => {
  const result = scanAnalyticsSources(process.cwd());
  assert.ok(result.files.includes("app/[locale]/layout.tsx"));
  assert.deepEqual(result.findings, []);
});
