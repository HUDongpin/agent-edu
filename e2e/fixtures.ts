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

/**
 * The three chunks the evidence scanner accepts, and nothing else.
 *
 * WebKit writes `sRGB` and a 68-byte `eXIf` into every PNG it encodes; Chromium
 * writes neither. scripts/check-artifacts.mjs refuses any ancillary chunk on
 * purpose — its comment names eXIf as one of the things that must not carry
 * provenance past the manifest — so WebKit evidence was rejected as
 * png-chunk-unsupported, and the upload step is gated on that scan passing.
 * Stripping here rather than tolerating there keeps the refusal absolute: the
 * scanner still decodes every row and still demands every pixel be #e5e7eb, so
 * a strip that damaged the image would fail its pixel check rather than pass
 * quietly. Chunks are copied whole, CRC included, so nothing is re-encoded.
 */
function keepOnlyCriticalPngChunks(png: Buffer): Buffer {
  const keep = new Set(["IHDR", "IDAT", "IEND"]);
  const out: Buffer[] = [png.subarray(0, 8)];
  let offset = 8;
  while (offset + 12 <= png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString("ascii");
    const end = offset + 12 + length;
    if (end > png.length) break;
    if (keep.has(type)) out.push(png.subarray(offset, end));
    offset = end;
    if (type === "IEND") break;
  }
  return Buffer.concat(out);
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
    // `scale: "css"` so the surface is captured in CSS pixels rather than
    // device pixels. devices["Desktop Safari"] carries deviceScaleFactor 2, so
    // the 1440×900 case in compat.spec.ts rasterised to 2880×1800 in WebKit —
    // past the 2048 bound in scripts/check-artifacts.mjs, which then refused to
    // decode it as png-shape-unsupported. The scan fails closed and the upload
    // step is gated on it passing, so a WebKit failure produced a red job and
    // no evidence at all: the one engine whose failures nobody could look at.
    // Bounding the raster here keeps that limit intact and makes the evidence
    // identical whatever engine produced it, which is what a contract wants.
    const screenshot = keepOnlyCriticalPngChunks(
      await page.locator(`#${REDACTION_SURFACE_ID}`).screenshot({
        animations: "disabled",
        caret: "hide",
        type: "png",
        scale: "css",
      }),
    );
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
