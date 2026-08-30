#!/usr/bin/env node

/**
 * Repeatable, production-export browser gate for Course 16.
 *
 * This intentionally uses Playwright's browser library as a plain executable
 * check rather than introducing a persistent @playwright/test spec suite.
 */
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, relative, resolve, sep } from "node:path";
import { chromium, firefox, webkit } from "playwright";

const ROOT = process.cwd();
const OUTPUT_ROOT = resolve(ROOT, "out");
const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const failures = [];
const checks = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function contentType(path) {
  return ({
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".webmanifest": "application/manifest+json",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
  })[extname(path).toLowerCase()] ?? "application/octet-stream";
}

function exportedFileFor(requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(requestUrl, "http://127.0.0.1").pathname);
  } catch {
    return null;
  }
  let path = resolve(OUTPUT_ROOT, `.${pathname}`);
  const relativePath = relative(OUTPUT_ROOT, path);
  if (relativePath === ".." || relativePath.startsWith(`..${sep}`)) return null;
  if (existsSync(path) && statSync(path).isDirectory()) path = resolve(path, "index.html");
  return existsSync(path) && statSync(path).isFile() ? path : null;
}

async function startExportServer() {
  const server = createServer((request, response) => {
    const path = exportedFileFor(request.url ?? "/");
    if (!path) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": contentType(path),
    });
    if (request.method === "HEAD") response.end();
    else response.end(readFileSync(path));
  });
  await new Promise((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Static export server did not bind a TCP port");
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolvePromise, rejectPromise) => {
      server.close((error) => error ? rejectPromise(error) : resolvePromise());
    }),
  };
}

function observeRuntime(page) {
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  return { pageErrors, consoleErrors };
}

function assertCleanRuntime(runtime, label) {
  assert(runtime.pageErrors.length === 0, `${label}: page errors: ${runtime.pageErrors.join(" | ")}`);
  assert(runtime.consoleErrors.length === 0, `${label}: console errors: ${runtime.consoleErrors.join(" | ")}`);
}

async function runAxe(page, label) {
  await page.addScriptTag({ content: axeSource });
  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    });
    return result.violations.map((violation) => `${violation.id}: ${violation.help}`);
  });
  assert(violations.length === 0, `${label}: axe violations: ${violations.join(" | ")}`);
}

async function assertFocusedActionStatus(page, testId, label) {
  const status = page.getByTestId(testId);
  await status.waitFor({ state: "visible" });
  await page.waitForFunction((id) => {
    const element = document.querySelector(`[data-testid="${id}"]`);
    const rect = element?.getBoundingClientRect();
    return document.activeElement === element
      && Boolean(rect && rect.bottom > 0 && rect.top < innerHeight);
  }, testId);
  const evidence = await status.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      active: document.activeElement === element,
      bottom: rect.bottom,
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      top: rect.top,
    };
  });
  assert(evidence.active, `${label}: focus did not move to the completion status`);
  assert(
    evidence.outlineStyle !== "none" && evidence.outlineWidth >= 2,
    `${label}: completion status lacks a visible focus indicator`,
  );
  assert(
    evidence.bottom > 0 && evidence.top < await page.evaluate(() => innerHeight),
    `${label}: focused completion status is outside the viewport`,
  );
}

async function runCheck(label, callback) {
  try {
    await callback();
    checks.push(label);
  } catch (error) {
    failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function readDownload(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

async function triggerHistoryDialog(page, accept) {
  const dialogPromise = page.waitForEvent("dialog", { timeout: 5_000 });
  await page.evaluate(() => window.history.back());
  const dialog = await dialogPromise;
  const message = dialog.message();
  if (accept) await dialog.accept();
  else await dialog.dismiss();
  assert(message.includes("离开"), `unexpected draft-loss dialog: ${message}`);
}

const genuineDraft = [
  "目标：针对一个真实受众任务建立可验证的经营目标，并明确本周只改变一项决策。",
  "证据：记录三个相互独立的公开信号、来源、日期、观察与推断，同时排除私密数据和未经授权的采集。",
  "门禁：事实、版权、品牌与平台权限必须由指定人员复核；自动发布默认关闭，失败时停止、回滚并留下更正记录。",
  "测量：用明确的分子、分母和时间窗口评估价值，同时监测投诉、纠错率、成本与不确定性。",
].join("\n");

if (!existsSync(resolve(OUTPUT_ROOT, "zh-Hans", "creator-ops", "index.html"))) {
  console.error("FAIL Course 16 browser audit: out/ is missing or stale; run `next build` first.");
  process.exit(1);
}

const server = await startExportServer();
const browser = await chromium.launch({ headless: true });
const overviewUrl = `${server.baseUrl}/zh-Hans/creator-ops/`;
const englishOverviewUrl = `${server.baseUrl}/en/creator-ops/`;
const moduleOneUrl = `${server.baseUrl}/zh-Hans/creator-ops/outcomes-operating-system/`;
const moduleTwoUrl = `${server.baseUrl}/zh-Hans/creator-ops/audience-signal-radar/`;
const moduleTenUrl = `${server.baseUrl}/zh-Hans/creator-ops/evaluation-governance-capstone/`;
const capstoneUrl = overviewUrl;
const routeLocales = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"];
const moduleSlugs = [
  "outcomes-operating-system",
  "audience-signal-radar",
  "evidence-research-packet",
  "editorial-agent-architecture",
  "writing-brand-fact-gates",
  "multimodal-asset-pipeline",
  "repurpose-content-assets",
  "human-approved-distribution",
  "community-analytics-loop",
  "evaluation-governance-capstone",
];

try {
  await runCheck("responsive, focus, reduced motion, and axe", async () => {
    const context = await browser.newContext({
      reducedMotion: "reduce",
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const runtime = observeRuntime(page);
    await page.goto(overviewUrl, { waitUntil: "networkidle" });
    assert(await page.locator("h1").count() === 1, "overview must expose exactly one h1");
    const responsive = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    }));
    assert(responsive.overflow <= 0, `390px overview overflows by ${responsive.overflow}px`);
    assert(responsive.scrollBehavior === "auto", `reduced motion scroll behavior is ${responsive.scrollBehavior}`);
    let focusEvidence = null;
    for (let index = 0; index < 20 && !focusEvidence; index += 1) {
      await page.keyboard.press("Tab");
      const candidate = await page.evaluate(() => {
        const element = document.activeElement;
        if (!(element instanceof HTMLElement) || element === document.body) return null;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          height: rect.height,
          outlineStyle: style.outlineStyle,
          outlineWidth: Number.parseFloat(style.outlineWidth),
          top: rect.top,
          width: rect.width,
        };
      });
      if (
        candidate
        && candidate.outlineStyle !== "none"
        && candidate.outlineWidth >= 2
        && candidate.width > 0
        && candidate.height > 0
      ) {
        focusEvidence = candidate;
      }
    }
    assert(focusEvidence, "Tab did not reach an interactive element");
    assert(focusEvidence.outlineStyle !== "none" && focusEvidence.outlineWidth >= 2, "keyboard focus lacks a visible outline");
    assert(focusEvidence.width > 0 && focusEvidence.height > 0 && focusEvidence.top < 844, "focused control is outside the viewport");
    const transitionDurations = await page.locator('[data-testid="creator-ops-course"] a[href*="/creator-ops/"]').first().evaluate((element) => (
      getComputedStyle(element).transitionDuration.split(",").map((value) => value.trim())
    ));
    const durationMs = transitionDurations.map((value) => value.endsWith("ms")
      ? Number.parseFloat(value)
      : Number.parseFloat(value) * 1_000);
    assert(durationMs.every((value) => value <= 0.011), `reduced-motion transition durations are ${transitionDurations.join(", ")}`);
    await runAxe(page, "Chinese overview");
    await page.goto(moduleOneUrl, { waitUntil: "networkidle" });
    await runAxe(page, "Chinese module");
    assert(
      await page.getByTestId("creator-ops-module-sources-title").evaluate((element) => element.tagName === "H2"),
      "the collapsed module source register does not retain an h2 in the document hierarchy",
    );
    const moduleNames = await page.locator('nav[aria-label="模块"] a[aria-label^="模块 "]').evaluateAll((links) => (
      links.map((link) => link.getAttribute("aria-label") ?? "")
    ));
    assert(moduleNames.length === 10, `module rail exposes ${moduleNames.length} links instead of 10`);
    moduleNames.forEach((name, index) => {
      assert(name.startsWith(`模块 ${index + 1}: `) && name.length > 8, `incomplete module accessible name: ${name}`);
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(moduleTenUrl, { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const rail = document.querySelector('[data-testid="creator-ops-module-rail"]');
      const current = rail?.querySelector('[aria-current="page"]');
      if (!(rail instanceof HTMLElement) || !(current instanceof HTMLElement)) return false;
      const railRect = rail.getBoundingClientRect();
      const currentRect = current.getBoundingClientRect();
      return currentRect.left >= railRect.left - 1 && currentRect.right <= railRect.right + 1;
    });
    const activeModuleVisible = await page.evaluate(() => {
      const rail = document.querySelector('[data-testid="creator-ops-module-rail"]');
      const current = rail?.querySelector('[aria-current="page"]');
      if (!(rail instanceof HTMLElement) || !(current instanceof HTMLElement)) return false;
      const railRect = rail.getBoundingClientRect();
      const currentRect = current.getBoundingClientRect();
      return currentRect.left >= railRect.left - 1 && currentRect.right <= railRect.right + 1;
    });
    assert(activeModuleVisible, "mobile Module 10 navigation leaves the current module offscreen");
    const navigator = page.getByTestId("creator-ops-module-navigator");
    await navigator.scrollIntoViewIfNeeded();
    const stickyLayers = await page.evaluate(() => {
      const header = document.querySelector("header.topbar");
      const navigation = document.querySelector('[data-testid="creator-ops-module-navigator"]');
      if (!(header instanceof HTMLElement) || !(navigation instanceof HTMLElement)) return null;
      return {
        headerBottom: header.getBoundingClientRect().bottom,
        navigationTop: navigation.getBoundingClientRect().top,
      };
    });
    assert(
      stickyLayers && stickyLayers.navigationTop >= stickyLayers.headerBottom,
      `sticky module navigation overlaps the platform header (${JSON.stringify(stickyLayers)})`,
    );
    const mobileModuleTargetHeights = await page.locator(
      '[data-testid="creator-ops-module-navigator"] > div a, nav[aria-label="本页导航"] a',
    ).evaluateAll((targets) => targets.map((target) => target.getBoundingClientRect().height));
    assert(
      mobileModuleTargetHeights.length >= 7 && mobileModuleTargetHeights.every((height) => height >= 44),
      `mobile module navigation exposes undersized targets (${mobileModuleTargetHeights.join(", ")})`,
    );
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.reload({ waitUntil: "networkidle" });
    assert(
      await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme.includes("dark")),
      "dark mode does not set the native-control color scheme",
    );
    await runAxe(page, "dark Chinese Module 10");
    for (const width of [320, 390, 768, 1_440]) {
      await page.setViewportSize({ width, height: width === 320 ? 568 : width === 390 ? 844 : 900 });
      for (const [label, url] of [["overview", overviewUrl], ["English overview", englishOverviewUrl], ["module", moduleOneUrl], ["last module", moduleTenUrl]]) {
        await page.goto(url, { waitUntil: "networkidle" });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert(overflow <= 0, `${width}px ${label} overflows by ${overflow}px`);
        if (width === 320 && label.toLocaleLowerCase().includes("overview")) {
          const actionBox = await page.getByTestId("creator-ops-primary-action").boundingBox();
          assert(
            actionBox && actionBox.y + actionBox.height <= 568,
            `320px ${label} first viewport hides the primary course action (${JSON.stringify(actionBox)})`,
          );
          assert(actionBox.height <= 60, `320px primary action wraps to ${actionBox.height}px`);
        }
        if (width === 390 && label === "overview") {
          const offlineLabBox = await page.getByRole("link", { name: /打开确定性的离线实验包/ }).boundingBox();
          assert(
            offlineLabBox && offlineLabBox.height >= 44,
            `mobile overview offline-lab target is ${offlineLabBox?.height ?? 0}px tall`,
          );
        }
      }
    }
    assertCleanRuntime(runtime, "responsive/a11y context");
    await context.close();
  });

  await runCheck("truthful start, resume, assessment, capstone, and completed actions", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const runtime = observeRuntime(page);
    await page.goto(overviewUrl, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    const primaryAction = page.getByTestId("creator-ops-primary-action");
    assert(await primaryAction.textContent().then((text) => text?.includes("从运营契约开始")), "fresh course does not expose the start action");
    assert((await primaryAction.getAttribute("href"))?.endsWith("/outcomes-operating-system/"), "fresh course does not start at Module 1");

    await page.evaluate(() => {
      const record = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      record["creator-ops.module.outcomes-operating-system.artifact"] = true;
      record["creator-ops.module.outcomes-operating-system.checkpoint.passed"] = true;
      record["creator-ops.module.outcomes-operating-system.complete"] = true;
      localStorage.setItem("ae.progress", JSON.stringify(record));
    });
    await page.reload({ waitUntil: "networkidle" });
    assert(await primaryAction.textContent().then((text) => text?.includes("继续构建创作者运营系统")), "partial course does not expose the resume action");
    assert((await primaryAction.getAttribute("href"))?.endsWith("/audience-signal-radar/"), "partial course does not resume at the first incomplete module");

    await page.evaluate(({ slugs }) => {
      const record = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      for (const slug of slugs) {
        record[`creator-ops.module.${slug}.artifact`] = true;
        record[`creator-ops.module.${slug}.checkpoint.passed`] = true;
        record[`creator-ops.module.${slug}.complete`] = true;
      }
      localStorage.setItem("ae.progress", JSON.stringify(record));
    }, { slugs: moduleSlugs });
    await page.reload({ waitUntil: "networkidle" });
    assert((await primaryAction.getAttribute("href")) === "#final-assessment", "completed modules do not hand off to the final assessment");
    await primaryAction.focus();
    await primaryAction.evaluate((action) => {
      action.addEventListener("click", (event) => event.preventDefault(), { once: true });
      action.dispatchEvent(new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
        metaKey: true,
      }));
    });
    await page.waitForTimeout(50);
    assert(
      await primaryAction.evaluate((action) => document.activeElement === action),
      "modified assessment click unexpectedly moves focus in the current tab",
    );
    await primaryAction.click();
    await page.waitForURL(/#final-assessment$/u);
    await page.waitForFunction(() => document.activeElement?.getAttribute("data-testid") === "creator-ops-assessment");
    await page.evaluate(() => history.back());
    await page.waitForURL((url) => !url.hash);
    await page.waitForFunction(() => {
      const active = document.activeElement;
      const rect = active?.getBoundingClientRect();
      return active?.getAttribute("data-testid") === "creator-ops-primary-action"
        && Boolean(rect && rect.bottom > 0 && rect.top < innerHeight);
    });

    await page.evaluate(() => {
      const record = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      record["creator-ops.quiz.passed"] = true;
      localStorage.setItem("ae.progress", JSON.stringify(record));
    });
    await page.reload({ waitUntil: "networkidle" });
    assert((await primaryAction.getAttribute("href")) === "#capstone", "passed assessment does not hand off to the capstone");
    await primaryAction.click();
    await page.waitForURL(/#capstone$/u);
    await page.waitForFunction(() => document.activeElement?.id === "capstone");
    await page.evaluate(() => history.back());
    await page.waitForURL((url) => !url.hash);
    await page.waitForFunction(() => {
      const active = document.activeElement;
      const rect = active?.getBoundingClientRect();
      return active?.getAttribute("data-testid") === "creator-ops-primary-action"
        && Boolean(rect && rect.bottom > 0 && rect.top < innerHeight);
    });

    await page.evaluate(() => {
      const record = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      record["creator-ops.capstone.v1"] = true;
      localStorage.setItem("ae.progress", JSON.stringify(record));
    });
    await page.reload({ waitUntil: "networkidle" });
    assert((await primaryAction.getAttribute("href")) === "#curriculum", "completed course does not offer a review path");
    assert(await primaryAction.textContent().then((text) => text?.includes("复习课程")), "completed course action is not labeled as review");
    await primaryAction.click();
    await page.waitForURL(/#curriculum$/u);
    await page.waitForFunction(() => document.activeElement?.id === "curriculum");
    await page.evaluate(() => history.back());
    await page.waitForURL((url) => !url.hash);
    await page.waitForFunction(() => {
      const active = document.activeElement;
      const rect = active?.getBoundingClientRect();
      return active?.getAttribute("data-testid") === "creator-ops-primary-action"
        && Boolean(rect && rect.bottom > 0 && rect.top < innerHeight);
    });
    assertCleanRuntime(runtime, "course-action context");
    await context.close();
  });

  await runCheck("artifact privacy, template pressure test, and download", async () => {
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    const runtime = observeRuntime(page);
    await page.goto(moduleOneUrl, { waitUntil: "networkidle" });
    const textarea = page.locator("textarea");
    assert(await textarea.inputValue() === "", "artifact workbench must start blank");
    assert(await textarea.getAttribute("name") === "outcomes-operating-system-artifact-draft", "artifact workbench lacks a meaningful field name");
    assert(await textarea.getAttribute("autocomplete") === "off", "artifact workbench does not disable non-auth autocomplete");
    assert((await textarea.getAttribute("placeholder"))?.endsWith("…"), "artifact workbench placeholder is not an example ending with an ellipsis");
    const template = await page.locator("details pre").textContent();
    assert(Boolean(template), "reference template is missing");
    const saveReceipt = page.getByRole("button", { name: /自我声明完成/ });
    await textarea.fill(`${template}x`);
    assert(await saveReceipt.isDisabled(), "reference template plus one character unlocked a receipt");
    const copyPastePadding = "\n无关填充：菠萝彗星天鹅绒大理石灯笼石英。这段文字没有回答任何字段，也不能证明学习者完成了原创工作。";
    await textarea.fill(`${template}${copyPastePadding}`);
    assert(await saveReceipt.isDisabled(), "complete reference template plus copy-paste padding unlocked a receipt");
    await textarea.fill(genuineDraft);
    assert(await saveReceipt.isDisabled(), "a meaningful but unexported artifact unlocked a self-attestation");
    const beforeSaveStorage = await page.evaluate(() => JSON.stringify({ ...localStorage }));
    assert(!beforeSaveStorage.includes(genuineDraft), "private artifact leaked into localStorage before receipt");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "下载草稿" }).click();
    const download = await downloadPromise;
    assert(download.suggestedFilename() === "operating-contract.md", `download filename is ${download.suggestedFilename()}`);
    assert(await readDownload(download) === genuineDraft, "downloaded artifact differs from the private draft");
    assert(!(await saveReceipt.isDisabled()), "exported substantive work did not unlock the self-attestation");
    await saveReceipt.focus();
    await saveReceipt.press("Enter");
    await assertFocusedActionStatus(page, "creator-ops-artifact-status", "artifact receipt");
    const afterSaveStorage = await page.evaluate(() => JSON.stringify({ ...localStorage }));
    assert(!afterSaveStorage.includes(genuineDraft), "private artifact leaked into localStorage after receipt");
    assert(afterSaveStorage.includes("creator-ops.module.outcomes-operating-system.artifact"), "artifact receipt was not stored");
    assertCleanRuntime(runtime, "artifact context");
    await context.close();
  });

  await runCheck("completion actions preserve keyboard focus", async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const runtime = observeRuntime(page);
    await page.goto(moduleOneUrl, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      const record = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      record["creator-ops.module.outcomes-operating-system.artifact"] = true;
      record["creator-ops.module.outcomes-operating-system.checkpoint.passed"] = true;
      record["creator-ops.module.outcomes-operating-system.complete"] = false;
      localStorage.setItem("ae.progress", JSON.stringify(record));
    });
    await page.reload({ waitUntil: "networkidle" });
    const completion = page.getByRole("button", { name: "标记模块已完成" });
    await completion.scrollIntoViewIfNeeded();
    await completion.focus();
    await completion.press("Enter");
    await assertFocusedActionStatus(page, "creator-ops-completion-status", "module completion");
    assertCleanRuntime(runtime, "completion-focus context");
    await context.close();
  });

  await runCheck("nine route locales hydrate with bounded content language", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const runtime = observeRuntime(page);
    for (const locale of routeLocales) {
      await page.goto(`${server.baseUrl}/${locale}/creator-ops/`, { waitUntil: "networkidle" });
      const observed = await page.evaluate(() => {
        const course = document.querySelector('[data-testid="creator-ops-course"]');
        const catalogCrumb = course?.querySelector('nav[aria-label] a[href$="/courses/"]');
        return {
          breadcrumbDir: catalogCrumb?.getAttribute("dir"),
          breadcrumbLang: catalogCrumb?.getAttribute("lang"),
          contentDir: course?.getAttribute("dir"),
          contentLang: course?.getAttribute("lang"),
          h1: document.querySelectorAll("h1").length,
          outerDir: document.documentElement.dir,
          outerLang: document.documentElement.lang,
          overflow: document.documentElement.scrollWidth - window.innerWidth,
        };
      });
      assert(observed.h1 === 1, `${locale}: overview must expose exactly one h1`);
      assert(observed.outerLang === locale, `${locale}: outer lang is ${observed.outerLang}`);
      assert(observed.outerDir === (locale === "ar" ? "rtl" : "ltr"), `${locale}: outer dir is ${observed.outerDir}`);
      assert(observed.contentLang === (locale === "zh-Hans" ? "zh-Hans" : "en"), `${locale}: content lang is ${observed.contentLang}`);
      assert(observed.contentDir === "ltr", `${locale}: reviewed course content dir is ${observed.contentDir}`);
      assert(observed.breadcrumbLang === locale, `${locale}: catalog breadcrumb lang is ${observed.breadcrumbLang}`);
      assert(observed.breadcrumbDir === (locale === "ar" ? "rtl" : "ltr"), `${locale}: catalog breadcrumb dir is ${observed.breadcrumbDir}`);
      assert(observed.overflow <= 0, `${locale}: overview overflows by ${observed.overflow}px`);
    }
    assertCleanRuntime(runtime, "nine-locale hydration context");
    await context.close();
  });

  await runCheck("offline lab resources are discoverable, reachable, and inert", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const runtime = observeRuntime(page);
    const linkedResources = new Set();
    for (const slug of [
      "audience-signal-radar",
      "evidence-research-packet",
      "writing-brand-fact-gates",
      "human-approved-distribution",
      "community-analytics-loop",
      "evaluation-governance-capstone",
    ]) {
      await page.goto(`${server.baseUrl}/zh-Hans/creator-ops/${slug}/`, { waitUntil: "networkidle" });
      const links = await page.locator('a[href^="/courses/creator-ops/lab/"]').evaluateAll((anchors) => (
        anchors.map((anchor) => anchor.getAttribute("href")).filter(Boolean)
      ));
      assert(links.length > 0, `${slug}: offline lab links are missing`);
      links.forEach((href) => linkedResources.add(href));
    }
    for (const href of linkedResources) {
      const response = await context.request.get(`${server.baseUrl}${href}`);
      assert(response.status() === 200, `${href}: static lab response is ${response.status()}`);
      const body = await response.text();
      assert(body.length > 20, `${href}: static lab response is empty`);
      assert(!/https?:\/\//iu.test(body), `${href}: offline lab contains a remote HTTP(S) dependency`);
    }
    assert(linkedResources.has("/courses/creator-ops/lab/manifest.sha256"), "lab integrity manifest is not discoverable");
    assert(linkedResources.has("/courses/creator-ops/lab/mock-publish-scenarios.json"), "mock publish scenarios are not discoverable");
    assertCleanRuntime(runtime, "offline-lab context");
    await context.close();
  });

  await runCheck("composite practice exports one honest Markdown package", async () => {
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    const runtime = observeRuntime(page);
    await page.goto(moduleTwoUrl, { waitUntil: "networkidle" });
    await page.locator("textarea").fill(genuineDraft);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "下载草稿" }).click();
    const download = await downloadPromise;
    assert(
      download.suggestedFilename() === "signal-radar-and-editorial-queue.md",
      `composite practice filename is ${download.suggestedFilename()}`,
    );
    assert(await readDownload(download) === genuineDraft, "composite Markdown package differs from the draft");
    assertCleanRuntime(runtime, "composite-export context");
    await context.close();
  });

  await runCheck("Module 10 handoff and assessment feedback", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const runtime = observeRuntime(page);
    await page.goto(moduleTenUrl, { waitUntil: "networkidle" });
    const assessmentLink = page.getByRole("link", { name: /课程终测/ });
    assert(
      (await assessmentLink.getAttribute("href"))?.endsWith("/creator-ops/#final-assessment"),
      "Module 10 pager does not deep-link to the final assessment",
    );
    await assessmentLink.click();
    await page.waitForURL(/#final-assessment$/u);
    await page.waitForFunction(() => document.activeElement?.getAttribute("data-testid") === "creator-ops-assessment");
    const assessment = page.getByTestId("creator-ops-assessment");
    await page.setViewportSize({ width: 1_440, height: 900 });
    const assessmentHeaderLayout = await assessment.locator("header").evaluate((header) => {
      const summary = header.querySelector("p:not([class*='sectionLabel'])");
      const label = header.querySelector("p[class*='sectionLabel']");
      return {
        headerHeight: header.getBoundingClientRect().height,
        labelWidth: label?.getBoundingClientRect().width ?? 0,
        summaryWidth: summary?.getBoundingClientRect().width ?? 0,
      };
    });
    assert(assessmentHeaderLayout.headerHeight < 700, `assessment header is ${assessmentHeaderLayout.headerHeight}px tall`);
    assert(assessmentHeaderLayout.labelWidth >= 120, `assessment label column is ${assessmentHeaderLayout.labelWidth}px wide`);
    assert(assessmentHeaderLayout.summaryWidth >= 400, `assessment summary is only ${assessmentHeaderLayout.summaryWidth}px wide`);
    const questionGroups = assessment.locator("fieldset");
    assert(await questionGroups.count() === 10, "final assessment does not expose 10 question groups");
    for (let index = 0; index < 10; index += 1) {
      await questionGroups.nth(index).locator('input[type="radio"]').first().check();
    }
    assert(await assessment.getByText("10/10 题已作答", { exact: true }).isVisible(), "assessment does not report answer completion");
    await assessment.getByRole("button", { name: "提交评分" }).click();
    assert(
      await assessment.getByTestId("creator-ops-question-feedback").count() === 10,
      "graded assessment does not explain every question",
    );
    assert(
      await assessment.getByText("正确答案", { exact: true }).count() === 10,
      "graded assessment does not expose the correct answer in text for every question",
    );
    await page.setViewportSize({ width: 320, height: 568 });
    const gradedAnswerLayout = await assessment.locator(
      'label[data-correct-answer], label[data-incorrect-selection]',
    ).evaluateAll((labels) => labels.map((answer) => {
      const option = answer.querySelector(":scope > span");
      return {
        answerWidth: answer.getBoundingClientRect().width,
        optionWidth: option?.getBoundingClientRect().width ?? 0,
      };
    }));
    assert(
      gradedAnswerLayout.every(({ answerWidth, optionWidth }) => optionWidth >= Math.min(120, answerWidth * 0.55)),
      `320px graded-answer badges squeeze option text (${JSON.stringify(gradedAnswerLayout)})`,
    );
    assert(
      await assessment.getByRole("link", { name: /复习/u }).count() > 0,
      "assessment feedback does not link back to relevant modules",
    );
    await runAxe(page, "graded Chinese assessment");
    assertCleanRuntime(runtime, "assessment-feedback context");
    await context.close();
  });

  await runCheck("capstone fails closed until modules and assessment are complete", async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const runtime = observeRuntime(page);
    await page.goto(capstoneUrl, { waitUntil: "networkidle" });
    const prerequisite = "完成十个模块并通过课程终测后，才可记录综合项目里程碑。";
    assert(await page.getByText(prerequisite, { exact: true }).isVisible(), "capstone prerequisite boundary is missing");
    const checkboxes = page.locator('input[type="checkbox"]');
    assert(await checkboxes.count() === 10, `capstone exposes ${await checkboxes.count()} checks instead of 10`);
    for (let index = 0; index < 10; index += 1) await checkboxes.nth(index).check();
    const markCapstone = page.getByRole("button", { name: "自我声明综合项目已完成" });
    assert(await markCapstone.isDisabled(), "ten self-checks bypassed module and assessment prerequisites");
    const draftChecks = await page.evaluate(() => {
      const record = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      return record["creator-ops.capstone.checks"];
    });
    assert(Array.isArray(draftChecks) && draftChecks.length === 10 && draftChecks.every(Boolean), "partial capstone checklist was not persisted");
    await page.reload({ waitUntil: "networkidle" });
    assert(await page.locator('input[type="checkbox"]:checked').count() === 10, "persisted capstone checklist did not restore after reload");
    await page.evaluate(() => {
      const record = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      for (const key of Object.keys(record)) {
        if (key.startsWith("creator-ops.")) delete record[key];
      }
      localStorage.setItem("ae.progress", JSON.stringify(record));
      window.dispatchEvent(new CustomEvent("creator-ops:progress-reset"));
    });
    await page.waitForFunction(() => (
      document.querySelectorAll('#capstone-checklist input[type="checkbox"]:checked').length === 0
    ));
    assert(await page.locator('#capstone-checklist input[type="checkbox"]:checked').count() === 0, "course reset leaves stale capstone checks onscreen");

    await page.evaluate(({ slugs }) => {
      const existing = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      const progressVersion = existing["creator-ops.progress.version"];
      if (
        typeof progressVersion !== "string"
        || (progressVersion !== "progress-v1" && !progressVersion.endsWith(":progress-v1"))
      ) {
        throw new Error("Course 16 did not publish a valid progress-version marker");
      }
      const record = {
        "creator-ops.progress.version": progressVersion,
        "creator-ops.quiz.passed": true,
      };
      for (const slug of slugs) {
        record[`creator-ops.module.${slug}.artifact`] = true;
        record[`creator-ops.module.${slug}.checkpoint.passed`] = true;
        record[`creator-ops.module.${slug}.complete`] = true;
      }
      localStorage.setItem("ae.progress", JSON.stringify(record));
    }, { slugs: moduleSlugs });
    await page.reload({ waitUntil: "networkidle" });
    const restoredChecks = page.locator('input[type="checkbox"]');
    for (let index = 0; index < 10; index += 1) await restoredChecks.nth(index).check();
    const enabledCapstone = page.getByRole("button", { name: "自我声明综合项目已完成" });
    assert(!(await enabledCapstone.isDisabled()), "valid prerequisites plus ten checks did not unlock capstone self-attestation");
    await enabledCapstone.focus();
    await enabledCapstone.press("Enter");
    await assertFocusedActionStatus(page, "creator-ops-capstone-status", "capstone completion");
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    assert(stored["creator-ops.capstone.v1"] === true, "valid capstone completion was not recorded");
    const completedCapstone = page.getByRole("button", { name: "综合项目自我声明已记录" });
    assert(await completedCapstone.isDisabled(), "completed capstone remains resubmittable");
    assertCleanRuntime(runtime, "capstone-prerequisite context");
    await context.close();
  });

  await runCheck("historical pass does not mask a wrong retry", async () => {
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    const runtime = observeRuntime(page);
    await page.goto(moduleOneUrl, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      const record = JSON.parse(localStorage.getItem("ae.progress") || "{}");
      record["creator-ops.module.outcomes-operating-system.artifact"] = true;
      record["creator-ops.module.outcomes-operating-system.checkpoint.passed"] = true;
      record["creator-ops.module.outcomes-operating-system.complete"] = true;
      localStorage.setItem("ae.progress", JSON.stringify(record));
    });
    await page.reload({ waitUntil: "networkidle" });
    assert(
      await page.getByText("已完成", { exact: true }).first().isVisible(),
      "completed module fixture did not restore before the retry",
    );
    const radios = page.locator('input[type="radio"]');
    const checkAnswer = page.getByRole("button", { name: "检查答案" });
    await radios.nth(0).check();
    await checkAnswer.click();
    assert(await page.getByText("重新审视边界", { exact: true }).isVisible(), "wrong retry was reported as correct");
    assert(
      await page.locator('[role="status"]').filter({ hasText: "此前的通过回执仍会保留；但本次作答不正确。" }).isVisible(),
      "wrong retry does not distinguish current feedback from historical pass",
    );
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ae.progress") || "{}"));
    assert(
      stored["creator-ops.module.outcomes-operating-system.complete"] === true,
      "wrong retry demoted a previously completed module",
    );
    assertCleanRuntime(runtime, "checkpoint context");
    await context.close();
  });

  await runCheck("storage denial stays hydrated and memory-only", async () => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      const denied = () => { throw new DOMException("Storage denied by Course 16 audit", "SecurityError"); };
      Object.defineProperty(window, "localStorage", { configurable: true, get: denied });
      Object.defineProperty(window, "sessionStorage", { configurable: true, get: denied });
    });
    const page = await context.newPage();
    const runtime = observeRuntime(page);
    await page.goto(moduleOneUrl, { waitUntil: "networkidle" });
    assert(await page.locator("h1").count() === 1, "storage denial removed the module h1");
    await page.locator("textarea").fill(genuineDraft);
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "下载草稿" }).click();
    await downloadPromise;
    await page.getByRole("button", { name: /自我声明完成/ }).click();
    assert(
      await page.locator('[role="status"]')
        .filter({ hasText: "隐私模式：该完成收据仅在当前标签页保留。" })
        .isVisible(),
      "storage denial did not expose the memory-only receipt boundary",
    );
    assertCleanRuntime(runtime, "storage-denied context");
    await context.close();
  });

  for (const [engineName, launcher] of [["Firefox", firefox], ["WebKit", webkit]]) {
    await runCheck(`${engineName} ten-module responsive journey`, async () => {
      const engineBrowser = await launcher.launch({ headless: true });
      try {
        const context = await engineBrowser.newContext({ viewport: { width: 390, height: 844 } });
        const page = await context.newPage();
        const runtime = observeRuntime(page);
        await page.goto(overviewUrl, { waitUntil: "networkidle" });
        assert(await page.locator("h1").count() === 1, `${engineName}: overview h1 is missing`);
        for (const slug of moduleSlugs) {
          await page.goto(`${server.baseUrl}/zh-Hans/creator-ops/${slug}/`, { waitUntil: "networkidle" });
          assert(await page.locator("h1").count() === 1, `${engineName} ${slug}: h1 is missing`);
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          assert(overflow <= 0, `${engineName} ${slug}: page overflows by ${overflow}px`);
          await page.waitForFunction(() => {
            const rail = document.querySelector('[data-testid="creator-ops-module-rail"]');
            const current = rail?.querySelector('[aria-current="page"]');
            if (!(rail instanceof HTMLElement) || !(current instanceof HTMLElement)) return false;
            const railRect = rail.getBoundingClientRect();
            const currentRect = current.getBoundingClientRect();
            return currentRect.left >= railRect.left - 1 && currentRect.right <= railRect.right + 1;
          });
        }
        await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
        await page.reload({ waitUntil: "networkidle" });
        await runAxe(page, `${engineName} dark Module 10`);
        assertCleanRuntime(runtime, `${engineName} journey context`);
        await context.close();
      } finally {
        await engineBrowser.close();
      }
    });
  }

  for (const legacy of [false, true]) {
    await runCheck(`${legacy ? "legacy sentinel" : "Navigation API"} draft traversal guard`, async () => {
      const context = await browser.newContext();
      if (legacy) {
        await context.addInitScript(() => {
          Object.defineProperty(window, "navigation", { configurable: true, value: undefined });
        });
      }
      const page = await context.newPage();
      const runtime = observeRuntime(page);
      await page.goto(moduleOneUrl, { waitUntil: "networkidle" });
      await page.locator('nav[aria-label="模块"] a[href*="audience-signal-radar"]').click();
      await page.waitForURL(moduleTwoUrl);
      const navigationType = await page.evaluate(() => typeof window.navigation);
      assert(
        legacy ? navigationType === "undefined" : navigationType === "object",
        `${legacy ? "legacy" : "modern"} path observed window.navigation=${navigationType}`,
      );
      const textarea = page.locator("textarea");
      await textarea.fill(genuineDraft);
      await page.waitForTimeout(150);
      await triggerHistoryDialog(page, false);
      await page.waitForTimeout(150);
      assert(page.url() === moduleTwoUrl, `dismissed traversal changed URL to ${page.url()}`);
      assert(await textarea.inputValue() === genuineDraft, "dismissed traversal lost the private draft");
      await triggerHistoryDialog(page, true);
      await page.waitForURL(moduleOneUrl);
      assertCleanRuntime(runtime, legacy ? "legacy traversal context" : "modern traversal context");
      await context.close();
    });
  }
} finally {
  await browser.close();
  await server.close();
}

if (failures.length > 0) {
  console.error(`FAIL Course 16 browser audit (${failures.length} findings)`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("PASS Course 16 production-export browser audit");
checks.forEach((check) => console.log(`- ${check}`));
