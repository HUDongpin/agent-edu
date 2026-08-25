import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test as base } from "@playwright/test";

const EVIDENCE_SCHEMA = "agent-edu.curated-browser-evidence.v1";
const SANITIZER_POLICY = "uniform-redaction-surface-v2";
const REDACTION_SURFACE_ID = "agent-edu-browser-evidence-redaction-surface";

function sha256(bytes: Buffer | string) {
  return createHash("sha256").update(bytes).digest("hex");
}

function writeJson(path: string, value: unknown) {
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
  writeFileSync(path, bytes, { mode: 0o600 });
  return { bytes: bytes.length, sha256: sha256(bytes) };
}

/**
 * Every browser test starts with the paid Provider blocked. Tests that need a
 * Provider response must register a narrower route explicitly; Playwright runs
 * the most recently registered matching route first. This makes an omitted
 * mock fail closed instead of reaching the live service.
 */
export const test = base.extend<{ _curatedEvidence: void }>({
  _curatedEvidence: [async ({ page, browserName }, use, testInfo) => {
    let unmockedProviderRequests = 0;
    await page.route("https://api.deepseek.com/**", (route) => {
      unmockedProviderRequests += 1;
      return route.abort("blockedbyclient");
    });
    const consoleCounts: Record<string, number> = Object.create(null) as Record<string, number>;
    let pageErrorCount = 0;
    const trace: Array<Record<string, number | string>> = [];
    let sequence = 0;
    const addTrace = (event: Record<string, number | string>) => {
      if (trace.length < 500) trace.push({ sequence: ++sequence, ...event });
    };

    page.on("console", (message) => {
      const type = message.type();
      consoleCounts[type] = (consoleCounts[type] ?? 0) + 1;
    });
    page.on("pageerror", () => { pageErrorCount += 1; });
    page.on("request", (request) => {
      const origin = new URL(request.url()).origin;
      const originClass = origin === "http://127.0.0.1:4173"
        ? "local"
        : origin === "https://api.deepseek.com" ? "provider" : "external";
      addTrace({
        event: "request",
        method: request.method(),
        resourceType: request.resourceType(),
        originClass,
      });
    });
    page.on("response", (response) => {
      addTrace({ event: "response", status: response.status() });
    });
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) addTrace({ event: "main-frame-navigation" });
    });

    await use();
    let providerFailure: unknown;
    try {
      expect(
        unmockedProviderRequests,
        "every Provider request must be handled by an explicit test mock",
      ).toBe(0);
    } catch (error) {
      providerFailure = error;
    }
    if (testInfo.status === testInfo.expectedStatus && !providerFailure) return;

    const evidenceId = sha256(testInfo.testId).slice(0, 20);
    const directory = resolve("browser-evidence", `safe-failure-${evidenceId}`);
    mkdirSync(directory, { recursive: true, mode: 0o700 });

    // Capture only a fixed, text-free surface. The scanner independently
    // decodes every PNG row and requires every pixel to be exactly #e5e7eb,
    // so the manifest label cannot authorize an ordinary page screenshot.
    await page.evaluate((surfaceId) => {
      document.getElementById(surfaceId)?.remove();
      const surface = document.createElement("div");
      surface.id = surfaceId;
      surface.setAttribute("aria-hidden", "true");
      Object.assign(surface.style, {
        position: "fixed",
        inset: "0",
        zIndex: "2147483647",
        margin: "0",
        padding: "0",
        border: "0",
        outline: "0",
        background: "rgb(229, 231, 235)",
      });
      document.documentElement.appendChild(surface);
    }, REDACTION_SURFACE_ID);
    const screenshot = await page.locator(`#${REDACTION_SURFACE_ID}`).screenshot({
      animations: "disabled",
      caret: "hide",
      type: "png",
    });
    const screenshotPath = resolve(directory, "screenshot.png");
    writeFileSync(screenshotPath, screenshot, { mode: 0o600 });
    const traceFile = writeJson(resolve(directory, "trace.json"), {
      schemaVersion: EVIDENCE_SCHEMA,
      tracePolicy: "structural-metadata-only-no-url-query-header-body-text",
      screenshots: false,
      sources: false,
      attachments: false,
      events: trace,
    });
    const consoleFile = writeJson(resolve(directory, "console.json"), {
      schemaVersion: EVIDENCE_SCHEMA,
      consolePolicy: "counts-only-no-console-or-error-text",
      counts: Object.fromEntries(Object.entries(consoleCounts).sort()),
      pageErrorCount,
    });
    const screenshotFile = { bytes: screenshot.length, sha256: sha256(screenshot) };
    writeJson(resolve(directory, "manifest.json"), {
      schemaVersion: EVIDENCE_SCHEMA,
      kind: "curated-safe-browser-failure",
      provenance: {
        sanitizerPolicy: SANITIZER_POLICY,
        fixturePolicy: "public-fixed-safe-smoke-only",
        testIdSha256: sha256(testInfo.testId),
        browserName,
        projectName: testInfo.project.name,
        commitSha: /^[0-9a-f]{40}$/i.test(process.env.GITHUB_SHA ?? "")
          ? process.env.GITHUB_SHA
          : "local-uncommitted",
      },
      files: {
        "console.json": { contentType: "application/json", ...consoleFile },
        "screenshot.png": {
          contentType: "image/png",
          sanitization: SANITIZER_POLICY,
          ...screenshotFile,
        },
        "trace.json": { contentType: "application/json", ...traceFile },
      },
    });
    if (providerFailure) throw providerFailure;
  }, { auto: true }],
});

export { expect };
