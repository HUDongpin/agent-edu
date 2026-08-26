import { expect, test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import { PLAYWRIGHT_TEST_ORIGIN } from "../tests/playwright-test-url";
import {
  curatedProject,
  toCuratedConsoleType,
  toCuratedRequestMethod,
  toCuratedResourceType,
  writeCuratedEvidenceBundle,
} from "./curated-evidence";
import type {
  CuratedConsoleCounts,
  CuratedOriginClass,
  CuratedTraceEvent,
  CuratedTraceEventInput,
} from "./curated-evidence";
import {
  createUniformRedactionPng,
  stripPngAncillaryChunks,
} from "./png-sanitizer";

const REDACTION_SURFACE_ID = "agent-edu-browser-evidence-redaction-surface";

/**
 * Every browser test starts with the paid Provider blocked. Tests that need a
 * Provider response must register a narrower route explicitly; Playwright runs
 * the most recently registered matching route first. This makes an omitted
 * mock fail closed instead of reaching the live service.
 */
export const test = base.extend<{ _curatedEvidence: void }>({
  _curatedEvidence: [async ({ context, page, browserName }, use, testInfo) => {
    let unmockedProviderRequests = 0;
    await context.route("https://api.deepseek.com/**", (route) => {
      unmockedProviderRequests += 1;
      return route.abort("blockedbyclient");
    });
    const consoleCounts: CuratedConsoleCounts = Object.create(null) as CuratedConsoleCounts;
    let pageErrorCount = 0;
    const trace: CuratedTraceEvent[] = [];
    let sequence = 0;
    const addTrace = (event: CuratedTraceEventInput) => {
      if (trace.length < 500) trace.push({ sequence: ++sequence, ...event });
    };

    const observedPages = new WeakSet<Page>();
    const observePage = (observedPage: Page) => {
      if (observedPages.has(observedPage)) return;
      observedPages.add(observedPage);
      observedPage.on("console", (message) => {
        const type = toCuratedConsoleType(message.type());
        if (!type) return;
        consoleCounts[type] = (consoleCounts[type] ?? 0) + 1;
      });
      observedPage.on("pageerror", () => { pageErrorCount += 1; });
      observedPage.on("framenavigated", (frame) => {
        if (frame === observedPage.mainFrame()) addTrace({ event: "main-frame-navigation" });
      });
    };
    observePage(page);
    context.on("page", observePage);
    context.on("request", (request) => {
      const origin = new URL(request.url()).origin;
      const originClass: CuratedOriginClass = origin === PLAYWRIGHT_TEST_ORIGIN
        ? "local"
        : origin === "https://api.deepseek.com" ? "provider" : "external";
      const method = toCuratedRequestMethod(request.method());
      const resourceType = toCuratedResourceType(request.resourceType());
      if (!method || !resourceType) return;
      addTrace({
        event: "request",
        method,
        resourceType,
        originClass,
      });
    });
    context.on("response", (response) => {
      addTrace({ event: "response", status: response.status() });
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

    // Capture only a fixed, text-free surface. The scanner independently
    // decodes every PNG row and requires every pixel to be exactly #e5e7eb,
    // so the manifest label cannot authorize an ordinary page screenshot.
    let screenshot: Buffer;
    try {
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
      const rawScreenshot = await page.locator(`#${REDACTION_SURFACE_ID}`).screenshot({
        animations: "disabled",
        caret: "hide",
        scale: "css",
        type: "png",
      });
      screenshot = stripPngAncillaryChunks(rawScreenshot);
    } catch {
      screenshot = createUniformRedactionPng();
    }
    const project = curatedProject(testInfo.project.name);
    if (project.browserName !== browserName) {
      throw new Error("curated evidence browser project did not match its fixture");
    }
    writeCuratedEvidenceBundle({
      testId: testInfo.testId,
      ...project,
      screenshot,
      trace,
      consoleCounts,
      pageErrorCount,
    });
    if (providerFailure) throw providerFailure;
  }, { auto: true }],
});

export { expect };
