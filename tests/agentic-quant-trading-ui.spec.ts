import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import axe from "axe-core";

const DASHBOARD = "/zh-Hans/agentic-quant-trading/";
const FIRST_MODULE = `${DASHBOARD}scope-safety-autonomy/`;
const SCREENSHOT_DIR = resolve("output/playwright");

mkdirSync(SCREENSHOT_DIR, { recursive: true });

function collectRuntimeErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  return errors;
}

async function runAxe(page: Page, label: string) {
  await page.locator("main").waitFor();
  await page.evaluate(async () => document.fonts.ready);
  await page.addScriptTag({ content: axe.source });
  const violations = await page.evaluate(async () => {
    const axeApi = (window as unknown as {
      axe: {
        run: (
          root: Document,
          options: Readonly<Record<string, unknown>>,
        ) => Promise<{
          violations: readonly {
            id: string;
            impact: string | null;
            nodes: readonly {
              target: readonly string[];
              html: string;
              failureSummary?: string;
            }[];
          }[];
        }>;
      };
    }).axe;
    const result = await axeApi.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      },
      resultTypes: ["violations"],
    });
    return result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.map((node) => ({
        target: node.target,
        html: node.html,
        failureSummary: node.failureSummary,
      })),
    }));
  });
  expect(violations, label).toEqual([]);
}

test("中文桌面课程页、证据闸门与六个本地下载形成完整主路径", async ({ page, request }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  const response = await page.goto(DASHBOARD);
  expect(response?.status()).toBe(200);

  const root = page.locator('[data-course-kit="agentic-quant-trading"]');
  await expect(root).toHaveAttribute("data-course-number", "17");
  await expect(root.getByRole("heading", { level: 1, name: "智能体赋能量化交易" })).toBeVisible();
  await expect(root.getByText("第 17 门课程 · 先构建控制，再部署智能体", { exact: true })).toBeVisible();
  await expect(root.getByText("780 分钟", { exact: true })).toBeVisible();

  const duplicateIds = await page.evaluate(() => {
    const counts = new Map<string, number>();
    for (const element of document.querySelectorAll<HTMLElement>("[id]")) {
      counts.set(element.id, (counts.get(element.id) || 0) + 1);
    }
    return [...counts.entries()].filter(([, count]) => count > 1);
  });
  expect(duplicateIds).toEqual([]);

  const curriculum = root.locator(
    'section[aria-labelledby="agentic-quant-trading-curriculum-title"]',
  );
  await expect(curriculum.locator("ol > li > a")).toHaveCount(12);
  await expect(root.locator('section[aria-labelledby^="phase-agentic-quant-trading-"]'))
    .toHaveCount(4);

  const lab = root.getByRole("region", { name: "绩效指标不可计算说明" });
  await expect(root.getByRole("heading", { level: 2, name: "把审计主张与可执行证据分开" }))
    .toBeVisible();
  await expect(lab).toHaveAttribute("tabindex", "0");
  const claims = root
    .getByRole("group", { name: "尚未验证的证据与边界主张" })
    .getByRole("checkbox");
  await expect(claims).toHaveCount(5);
  for (let index = 0; index < 5; index += 1) await claims.nth(index).check();
  await expect(root.getByRole("status").filter({ hasText: "说明性检查表已完成" })).toBeVisible();
  await expect(lab.getByText("绩效指标：不可计算", { exact: true })).toBeVisible();
  await expect(lab).toContainText("Sharpe Ratio、最大回撤、换手率或成本后表现");

  const downloads = root.locator('a[download][href^="/courses/agentic-quant-trading/"]');
  await expect(downloads).toHaveCount(6);
  for (const href of await downloads.evaluateAll((links) => (
    links.map((link) => link.getAttribute("href")).filter(Boolean) as string[]
  ))) {
    const asset = await request.get(href);
    expect(asset.status(), href).toBe(200);
  }
  await expect(root.getByText("预期：status=pass、7/7 项有边界断言通过、network_client_code_present=false、network_isolation_verified=false。", { exact: true }))
    .toBeVisible();

  await runAxe(page, "Course 17 Chinese dashboard");
  await page.screenshot({ path: resolve(SCREENSHOT_DIR, "course17-zh-desktop.png"), fullPage: true });
  expect(runtimeErrors).toEqual([]);
});

test("390px 移动端无页面级横向溢出，证据表保留键盘可滚动边界", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto(DASHBOARD);
  expect(response?.status()).toBe(200);
  await page.locator('section[aria-labelledby="agentic-quant-trading-curriculum-title"]').scrollIntoViewIfNeeded();

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
  }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1);
  await expect(page.getByRole("region", { name: "绩效指标不可计算说明" }))
    .toHaveAttribute("tabindex", "0");

  await page.screenshot({ path: resolve(SCREENSHOT_DIR, "course17-zh-mobile-390.png"), fullPage: true });
  expect(runtimeErrors).toEqual([]);
});

test("模块完成必须先答对知识检查并提交可审计的人工证据收据", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  const response = await page.goto(FIRST_MODULE);
  expect(response?.status()).toBe(200);
  await page.evaluate(() => window.localStorage.removeItem("ae.progress"));
  await page.reload();

  const checkpoint = page.locator(
    'section[aria-labelledby="scope-safety-autonomy-checkpoint-title"]',
  );
  await checkpoint.locator('input[type="radio"]').nth(2).check();
  await checkpoint.getByRole("button", { name: "检查答案" }).click();
  await expect(checkpoint.getByRole("status")).toContainText("回答正确。");

  const completion = page.locator('section[aria-label="已完成"]');
  const completeButton = completion.getByRole("button", { name: "标记模块为已完成" });
  await expect(completeButton).toBeDisabled();
  await expect(completion.getByText("请先添加有效的结构化证据收据，再将模块标记为完成。"))
    .toBeVisible();

  const receipt = completion.getByLabel("结构化证据收据");
  await receipt.fill('{"schemaVersion":"aicourse.evidence-receipt.v1","artifactPath":"https://broker.example/order.json"}');
  await expect(completeButton).toBeDisabled();

  await receipt.fill(JSON.stringify({
    schemaVersion: "aicourse.evidence-receipt.v1",
    artifactPath: "outputs/course17/module-01.json",
    sha256: "a".repeat(64),
    validator: {
      command: "python3 fixture-contract-self-test.py --self-test",
      status: "pass",
      checkedOn: "2026-08-26",
    },
    reviewer: {
      name: "Named Human Reviewer",
      role: "Course evidence reviewer",
      human: true,
      decision: "accept-with-limitations",
    },
    limitations: ["Synthetic local replay only; no market action is authorised."],
  }));
  await expect(completeButton).toBeEnabled();
  await completeButton.click();
  await expect(completion.getByRole("button", { name: "已完成" })).toBeDisabled();

  await runAxe(page, "Course 17 completed module with structured receipt");
  await page.screenshot({ path: resolve(SCREENSHOT_DIR, "course17-module-receipt-gate.png"), fullPage: true });
  expect(runtimeErrors).toEqual([]);
});

test("法语路由明确显示英语正文回退，不把未审校内容伪装成本地化", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  const response = await page.goto("/fr/agentic-quant-trading/");
  expect(response?.status()).toBe(200);
  const root = page.locator('[data-course-kit="agentic-quant-trading"]');
  await expect(root).toHaveAttribute("lang", "en");
  await expect(root).toHaveAttribute("dir", "ltr");
  await expect(page.getByText("Content language: en", { exact: true })).toBeVisible();
  await expect(page.getByText(/Other locales use the English fallback/)).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("阿拉伯语 RTL 外壳、英语 LTR 正文、深色与减少动效模式保持可访问", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  const response = await page.goto("/ar/agentic-quant-trading/");
  expect(response?.status()).toBe(200);

  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const root = page.locator('[data-course-kit="agentic-quant-trading"]');
  await expect(root).toHaveAttribute("lang", "en");
  await expect(root).toHaveAttribute("dir", "ltr");
  await expect(page.getByText("Content language: en", { exact: true })).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
  }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1);
  await runAxe(page, "Course 17 Arabic shell with English fallback in dark mode");
  await page.screenshot({ path: resolve(SCREENSHOT_DIR, "course17-ar-dark-fallback.png") });
  expect(runtimeErrors).toEqual([]);
});

test("课程目录公开 Course 17，未知模块严格返回 404", async ({ page }) => {
  const response = await page.goto("/zh-Hans/courses/");
  expect(response?.status()).toBe(200);
  const card = page.locator("#agentic-quant-trading");
  await expect(card).toHaveCount(1);
  await expect(card.getByText("课程十七", { exact: true })).toBeVisible();
  await expect(card.getByRole("heading", { level: 2, name: "智能体赋能量化交易" })).toBeVisible();
  await expect(card.locator('[data-course-cover="agentic-quant-trading"]')).toHaveCount(1);
  await expect(card.locator("a.cinner")).toHaveAttribute(
    "href",
    "/zh-Hans/agentic-quant-trading/",
  );

  const missing = await page.goto("/zh-Hans/agentic-quant-trading/not-a-course-module/");
  expect(missing?.status()).toBe(404);
  await expect(page.locator('[data-course-kit="agentic-quant-trading"]')).toHaveCount(0);
});
