import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { devices, expect, test, type Page } from "@playwright/test";
import axe from "axe-core";

const DASHBOARD = "/zh-Hans/agentic-quant-trading/";
const ASSESSMENT = `${DASHBOARD}assessment/`;
const CAPSTONE = `${DASHBOARD}capstone/`;
const SOURCES = `${DASHBOARD}sources/`;
const COURSE_VERSION = "2026.08.26-v3";
const QUIZ_VERSION = "2026.08.26-quiz-v4-module-twelve-contextual-seed-1118";
const CAPSTONE_VERSION = "2026.08.26-capstone-v3-protected-approval";
const COURSE_PREFIX = "agentic-quant-trading.";
const MODULE_SLUGS = [
  "scope-safety-autonomy",
  "market-data-time-contracts",
  "agent-architecture-authority",
  "hypotheses-experiment-ledger",
  "features-labels-text-signals",
  "backtest-leakage-costs",
  "evaluation-uncertainty-overfitting",
  "multi-agent-debate-verification",
  "portfolio-risk-deterministic-gates",
  "paper-execution-reconciliation",
  "monitoring-kill-switch-incidents",
  "capstone-auditable-paper-desk",
] as const;
const FIRST_MODULE = `${DASHBOARD}${MODULE_SLUGS[0]}/`;
const LAB_MODULE = `${DASHBOARD}${MODULE_SLUGS[5]}/`;
const LAST_MODULE = `${DASHBOARD}${MODULE_SLUGS.at(-1)}/`;
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

function validReceipt(moduleSlug: string): string {
  return JSON.stringify({
    schemaVersion: "aicourse.evidence-receipt.v1",
    artifactPath: `outputs/agentic-quant-trading/${moduleSlug}.json`,
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
  });
}

function progressWithCompletedModules(
  completedModules: readonly string[],
): Record<string, unknown> {
  const record: Record<string, unknown> = {
    [`${COURSE_PREFIX}progress.version`]: COURSE_VERSION,
  };
  for (const moduleSlug of completedModules) {
    record[`${COURSE_PREFIX}module.${moduleSlug}.checkpoint`] = {
      choice: 0,
      correct: true,
    };
    record[`${COURSE_PREFIX}module.${moduleSlug}.receipt`] = validReceipt(moduleSlug);
    record[`${COURSE_PREFIX}module.${moduleSlug}.complete`] = true;
  }
  return record;
}

async function seedProgressBeforeNavigation(
  page: Page,
  completedModules: readonly string[],
) {
  const progress = progressWithCompletedModules(completedModules);
  await page.addInitScript((record) => {
    window.localStorage.setItem("ae.progress", JSON.stringify(record));
  }, progress);
}

async function replaceProgress(
  page: Page,
  completedModules: readonly string[],
) {
  const progress = progressWithCompletedModules(completedModules);
  await page.evaluate((record) => {
    window.localStorage.setItem("ae.progress", JSON.stringify(record));
  }, progress);
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

test("聚焦课程总览提供独立终点路由，并从有效进度恢复到下一未完成模块", async ({
  page,
}) => {
  await seedProgressBeforeNavigation(page, MODULE_SLUGS.slice(0, 2));
  const runtimeErrors = collectRuntimeErrors(page);
  const response = await page.goto(DASHBOARD);
  expect(response?.status()).toBe(200);

  const root = page.locator('[data-course-kit="agentic-quant-trading"]');
  await expect(root).toHaveAttribute("data-course-number", "17");
  await expect(root.getByRole("heading", { level: 1, name: "智能体赋能量化交易" }))
    .toBeVisible();
  await expect(root.getByText("第 17 门课程 · 先构建控制，再部署智能体", { exact: true }))
    .toBeVisible();
  await expect(root.getByText("780 分钟", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "课程", exact: true }).first())
    .toHaveAttribute("aria-current", "page");

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

  const resume = root.getByRole("link", {
    name: /^继续构建可审计模拟研究台:/,
  });
  await expect(resume).toHaveAttribute(
    "href",
    `${DASHBOARD}${MODULE_SLUGS[2]}/`,
  );
  for (const moduleSlug of MODULE_SLUGS.slice(0, 2)) {
    const completedLink = curriculum.locator(`a[href="${DASHBOARD}${moduleSlug}/"]`);
    await expect(completedLink.locator('[data-complete="true"]')).toHaveCount(1);
    await expect(completedLink).toContainText("已完成");
  }
  const nextLink = curriculum.locator(
    `a[href="${DASHBOARD}${MODULE_SLUGS[2]}/"]`,
  );
  await expect(nextLink.locator('[data-next="true"]')).toHaveCount(1);
  await expect(nextLink).toContainText("继续课程");

  const finishLine = root.locator(
    'section[aria-labelledby="agentic-quant-trading-finish-line-title"]',
  );
  await expect(finishLine.locator(`a[href="${ASSESSMENT}"]`)).toHaveCount(1);
  await expect(finishLine.locator(`a[href="${CAPSTONE}"]`)).toHaveCount(1);
  await expect(finishLine.locator(`a[href="${SOURCES}"]`)).toHaveCount(1);
  await expect(finishLine.getByText("期末测验", { exact: true })).toBeVisible();
  await expect(finishLine.getByText("结课项目", { exact: true })).toBeVisible();
  await expect(finishLine.getByText("证据登记表", { exact: true })).toBeVisible();

  await expect(root.locator("#evidence-lab")).toHaveCount(0);
  await expect(root.locator("#final-assessment")).toHaveCount(0);
  await expect(root.locator("#capstone")).toHaveCount(0);
  await expect(root.locator('[id^="source-"]')).toHaveCount(0);

  await page.evaluate(async () => document.fonts.ready);
  const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(pageHeight).toBeLessThan(14_000);

  await runAxe(page, "Course 17 focused Chinese dashboard");
  await page.screenshot({
    path: resolve(SCREENSHOT_DIR, "course17-zh-desktop.png"),
    fullPage: true,
  });
  expect(runtimeErrors).toEqual([]);
});

test("390px 聚焦总览无页面级横向溢出", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto(DASHBOARD);
  expect(response?.status()).toBe(200);
  await page.locator(
    'section[aria-labelledby="agentic-quant-trading-curriculum-title"]',
  ).scrollIntoViewIfNeeded();

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
  }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1);

  await page.screenshot({
    path: resolve(SCREENSHOT_DIR, "course17-zh-mobile-390.png"),
    fullPage: true,
  });
  expect(runtimeErrors).toEqual([]);
});

test("关键响应式边界在 860、640、540 与 380px 两侧保持稳定", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  const cases = [
    { width: 861, path: LAB_MODULE, mobileMap: false },
    { width: 860, path: LAB_MODULE, mobileMap: true },
    { width: 641, path: DASHBOARD },
    { width: 640, path: DASHBOARD },
    { width: 541, path: `${LAB_MODULE}#evidence-lab` },
    { width: 540, path: `${LAB_MODULE}#evidence-lab` },
    { width: 381, path: DASHBOARD, wordmark: true },
    { width: 380, path: DASHBOARD, wordmark: false },
  ] as const;

  for (const scenario of cases) {
    await page.setViewportSize({ width: scenario.width, height: 900 });
    const target = new URL(scenario.path, "http://course17.test");
    target.searchParams.set("breakpoint", String(scenario.width));
    const response = await page.goto(`${target.pathname}${target.search}${target.hash}`);
    expect(response?.status(), `${scenario.width}px ${scenario.path}`).toBe(200);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      html: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    expect(dimensions.html, `${scenario.width}px html overflow`)
      .toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(dimensions.body, `${scenario.width}px body overflow`)
      .toBeLessThanOrEqual(dimensions.viewport + 1);

    if ("mobileMap" in scenario) {
      const map = page.locator('[data-course-module="backtest-leakage-costs"] details').first();
      if (scenario.mobileMap) await expect(map).toBeVisible();
      else await expect(map).toBeHidden();
    }
    if ("wordmark" in scenario) {
      const wordmark = page.locator(".logo .wm");
      const fontSize = await wordmark.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).fontSize)
      );
      if (scenario.wordmark) expect(fontSize).toBeGreaterThan(0);
      else expect(fontSize).toBe(0);
    }
  }

  expect(runtimeErrors).toEqual([]);
});

test("iPhone 13 触控环境可展开包含 14 个目的地的模块 6 课程地图", async ({
  baseURL,
  browser,
}) => {
  if (!baseURL) throw new Error("Course 17 mobile regression requires a base URL");
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    baseURL,
  });
  const mobilePage = await context.newPage();
  const runtimeErrors = collectRuntimeErrors(mobilePage);

  try {
    const response = await mobilePage.goto(LAB_MODULE);
    expect(response?.status()).toBe(200);
    const root = mobilePage.locator('[data-course-module="backtest-leakage-costs"]');
    await expect(root).toHaveCount(1);

    const deviceSignals = await mobilePage.evaluate(() => ({
      coarsePointer: window.matchMedia("(pointer: coarse)").matches,
      hoverNone: window.matchMedia("(hover: none)").matches,
      maxTouchPoints: navigator.maxTouchPoints,
      mobileUserAgent: /Mobile/.test(navigator.userAgent),
      iphoneUserAgent: /iPhone/.test(navigator.userAgent),
    }));
    expect(deviceSignals.maxTouchPoints).toBeGreaterThan(0);
    expect(deviceSignals.mobileUserAgent).toBe(true);
    expect(deviceSignals.iphoneUserAgent).toBe(true);
    expect(deviceSignals.coarsePointer).toBe(true);
    expect(deviceSignals.hoverNone).toBe(true);

    const courseMap = root.locator("details").filter({ hasText: "打开课程地图" });
    await expect(courseMap).toHaveCount(1);
    const mapToggle = courseMap.locator("summary");
    await expect(mapToggle).toBeVisible();
    await mapToggle.tap();
    await expect(courseMap).toHaveAttribute("open", "");

    const journeyHrefs = await courseMap.locator("nav a").evaluateAll((links) =>
      links.map((link) => link.getAttribute("href")).filter(Boolean) as string[]
    );
    const expectedHrefs = [
      ...MODULE_SLUGS.map((moduleSlug) => `${DASHBOARD}${moduleSlug}/`),
      ASSESSMENT,
      CAPSTONE,
    ];
    expect(journeyHrefs).toHaveLength(14);
    expect([...new Set(journeyHrefs)].sort()).toEqual(expectedHrefs.sort());

    const dimensions = await mobilePage.evaluate(() => ({
      body: document.body.scrollWidth,
      page: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1);

    await mobilePage.screenshot({
      path: resolve(SCREENSHOT_DIR, "course17-iphone13-module6-map.png"),
    });
    expect(runtimeErrors).toEqual([]);
  } finally {
    await context.close();
  }
});

test("模块 6 是证据闸门的唯一规范工作台，并区分未验证导出与结课模板", async ({
  context,
  page,
  request,
}) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const response = await page.goto(LAB_MODULE);
  expect(response?.status()).toBe(200);

  const root = page.locator('[data-course-module="backtest-leakage-costs"]');
  const lab = root.locator("#evidence-lab");
  await expect(lab.getByRole("heading", {
    level: 2,
    name: "把审计主张与可执行证据分开",
  })).toBeVisible();

  const claims = lab
    .getByRole("group", { name: "尚未验证的证据与边界主张" })
    .getByRole("checkbox");
  await expect(claims).toHaveCount(5);
  for (let index = 0; index < 5; index += 1) await claims.nth(index).check();
  await expect(lab.getByRole("status").filter({ hasText: "说明性检查表已完成" }))
    .toBeVisible();
  await expect(lab.getByText("绩效指标：不可计算", { exact: true })).toBeVisible();
  await expect(lab).toContainText("Sharpe Ratio、最大回撤、换手率或成本后表现");

  const downloads = lab.locator('a[download][href^="/courses/agentic-quant-trading/"]');
  await expect(downloads).toHaveCount(6);
  for (const href of await downloads.evaluateAll((links) => (
    links.map((link) => link.getAttribute("href")).filter(Boolean) as string[]
  ))) {
    const asset = await request.get(href);
    expect(asset.status(), href).toBe(200);
  }
  await expect(lab.getByText(
    "预期：status=pass、7/7 项有边界断言通过、network_client_code_present=false、network_isolation_verified=false。",
    { exact: true },
  )).toBeVisible();

  await lab.getByRole("button", {
    name: "复制未验证检查表（不能用于结课）",
  }).click();
  await expect(lab.getByText("说明性收据已复制", { exact: true })).toBeVisible();
  const checklistExport = JSON.parse(
    await page.evaluate(() => navigator.clipboard.readText()),
  ) as Record<string, unknown>;
  expect(checklistExport.schema).toBe("aicourse.quant-evidence-gate-receipt.v2");
  expect(checklistExport.authorises_replay).toBe(false);
  expect(checklistExport.authorises_market_action).toBe(false);
  expect(checklistExport.schemaVersion).toBeUndefined();

  await lab.getByRole("button", { name: "复制结课收据模板" }).click();
  await expect(lab.getByText(
    "结课收据模板已复制；使用前请替换每个占位内容。",
    { exact: true },
  )).toBeVisible();
  const completionTemplate = JSON.parse(
    await page.evaluate(() => navigator.clipboard.readText()),
  ) as Record<string, unknown>;
  expect(completionTemplate.schemaVersion).toBe("aicourse.evidence-receipt.v1");
  expect(completionTemplate.sha256).toBe("REPLACE_WITH_64_HEX_CHARACTERS");

  await runAxe(page, "Course 17 canonical Module 6 evidence lab");
  expect(runtimeErrors).toEqual([]);
});

test("12 个模块渲染的每一个页内来源链接都有唯一目标", async ({ page }) => {
  test.slow();
  const runtimeErrors = collectRuntimeErrors(page);

  for (const moduleSlug of MODULE_SLUGS) {
    const response = await page.goto(`${DASHBOARD}${moduleSlug}/`);
    expect(response?.status(), moduleSlug).toBe(200);
    const root = page.locator(`[data-course-module="${moduleSlug}"]`);
    await expect(root).toHaveCount(1);
    const hrefs = await root.locator('a[href^="#source-"]').evaluateAll((links) =>
      links.map((link) => link.getAttribute("href")).filter(Boolean) as string[]
    );
    expect(hrefs.length, `${moduleSlug} should render source locators`).toBeGreaterThan(0);

    const targets = await page.evaluate((sourceHrefs) => sourceHrefs.map((href) => ({
      href,
      count: document.querySelectorAll(`[id="${CSS.escape(href.slice(1))}"]`).length,
    })), hrefs);
    expect(
      targets.filter((target) => target.count !== 1),
      `${moduleSlug} missing or duplicated a rendered source target`,
    ).toEqual([]);
  }

  expect(runtimeErrors).toEqual([]);
});

test("首模块收据错误可操作、有效收据解锁完成，并可重新打开", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  const response = await page.goto(FIRST_MODULE);
  expect(response?.status()).toBe(200);
  await page.evaluate(() => window.localStorage.removeItem("ae.progress"));
  await page.reload();

  const root = page.locator('[data-course-module="scope-safety-autonomy"]');
  const checkpoint = root.locator(
    'section[aria-labelledby="scope-safety-autonomy-checkpoint-title"]',
  );
  const completeButton = root.getByRole("button", {
    name: "标记模块为已完成",
    exact: true,
  });
  await expect(completeButton).toBeDisabled();
  await checkpoint.locator('input[type="radio"]').nth(2).check();
  await checkpoint.getByRole("button", { name: "检查答案" }).click();
  await expect(checkpoint.getByRole("status")).toContainText("回答正确。");

  const receipt = root.getByLabel("结构化证据收据");
  await receipt.fill(
    '{"schemaVersion":"aicourse.evidence-receipt.v1","artifactPath":"https://broker.example/order.json"}',
  );
  await expect(receipt).toHaveAttribute("aria-invalid", "true");
  await expect(root.getByText(
    "这不是有效的结课收据。请使用 aicourse.evidence-receipt.v1 schema，并提供安全的相对路径、64 位 SHA-256、通过的校验命令与 ISO 日期、具名人工审核者及决定，以及至少一项局限。",
    { exact: true },
  )).toBeVisible();
  await expect(completeButton).toBeDisabled();

  await receipt.fill(validReceipt(MODULE_SLUGS[1]));
  await expect(receipt).toHaveAttribute("aria-invalid", "true");
  await expect(completeButton).toBeDisabled();

  await receipt.fill(validReceipt(MODULE_SLUGS[0]));
  await expect(receipt).not.toHaveAttribute("aria-invalid", "true");
  await expect(root.getByText(
    "收据结构完整；其中主张仍须由收据中具名的人工审核者核验。",
    { exact: true },
  )).toBeVisible();
  await expect(completeButton).toBeEnabled();
  await completeButton.click();

  const reopenButton = root.getByRole("button", { name: "重新打开模块" });
  await expect(reopenButton).toBeEnabled();
  await expect(receipt).toBeDisabled();
  await expect(root.locator('section[aria-label="已完成"]')).toHaveCount(1);

  await checkpoint.locator('input[type="radio"]').first().check();
  await checkpoint.getByRole("button", { name: "检查答案" }).click();
  await expect(checkpoint.getByRole("status")).toContainText("尚未答对。");
  await expect(reopenButton).toHaveCount(0);
  await expect(root.getByRole("button", {
    name: "标记模块为已完成",
    exact: true,
  })).toBeDisabled();
  await expect(receipt).toBeEnabled();
  await expect(root.locator('section[aria-label="标记模块为已完成"]')).toHaveCount(1);

  await checkpoint.locator('input[type="radio"]').nth(2).check();
  await checkpoint.getByRole("button", { name: "检查答案" }).click();
  await expect(checkpoint.getByRole("status")).toContainText("回答正确。");
  await expect(completeButton).toBeEnabled();
  await completeButton.click();
  await expect(reopenButton).toBeEnabled();
  await runAxe(page, "Course 17 completed module with structured receipt");
  await page.screenshot({
    path: resolve(SCREENSHOT_DIR, "course17-module-receipt-gate.png"),
    fullPage: true,
  });

  await reopenButton.click();
  await expect(completeButton).toBeVisible();
  await expect(receipt).toBeEnabled();
  await expect(root.locator('section[aria-label="标记模块为已完成"]')).toHaveCount(1);
  expect(runtimeErrors).toEqual([]);
});

test("模块 12 进入独立测验；先决条件关闭提交，解锁后聚焦首个未答题", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  const response = await page.goto(LAST_MODULE);
  expect(response?.status()).toBe(200);

  const lastModule = page.locator('[data-course-module="capstone-auditable-paper-desk"]');
  const assessmentLink = lastModule.locator('a[rel="next"]');
  await expect(assessmentLink).toHaveAttribute("href", ASSESSMENT);
  await expect(assessmentLink).toContainText("期末测验");
  await assessmentLink.click();
  await expect(page).toHaveURL(new RegExp(`${ASSESSMENT.replaceAll("/", "\\/")}$`));

  let assessment = page.locator('[data-course-section="assessment"]');
  await expect(assessment.getByRole("heading", { level: 1, name: "期末测验" }))
    .toBeVisible();
  await expect(assessment.getByRole("status").filter({
    hasText: "请先完成全部课程模块，再提交期末测验。",
  })).toBeVisible();
  await expect(assessment.getByRole("button", { name: "提交测验" })).toBeDisabled();
  await expect(assessment.locator('#final-assessment input[type="radio"]').first())
    .toBeDisabled();

  await replaceProgress(page, MODULE_SLUGS);
  await page.reload();
  assessment = page.locator('[data-course-section="assessment"]');
  const submit = assessment.getByRole("button", { name: "提交测验" });
  await expect(submit).toBeEnabled();
  await expect(assessment.getByText(
    "请先完成全部课程模块，再提交期末测验。",
    { exact: true },
  )).toHaveCount(0);

  const firstQuestion = assessment.locator("#final-assessment fieldset");
  await firstQuestion.locator('input[type="radio"]').first().check();
  await assessment.getByRole("button", { name: "下一题" }).click();
  await expect(assessment.getByRole("button", {
    name: /第 1\/12 题.*已作答/,
  })).toHaveAttribute("data-answered", "true");
  await submit.click();

  const firstUnanswered = assessment.locator("#final-assessment fieldset");
  await expect(firstUnanswered).toBeFocused();
  await expect(firstUnanswered.getByRole("alert")).toHaveText(
    "提交前请回答本次抽取的全部题目。",
  );
  await expect(assessment.getByRole("button", {
    name: /第 2\/12 题.*未作答/,
  })).toHaveAttribute("aria-current", "step");
  expect(runtimeErrors).toEqual([]);
});

test("测验导航在评分后用文字语义和非颜色符号标记每题结果", async ({ page }) => {
  await seedProgressBeforeNavigation(page, MODULE_SLUGS);
  const runtimeErrors = collectRuntimeErrors(page);
  const response = await page.goto(ASSESSMENT);
  expect(response?.status()).toBe(200);

  const assessment = page.locator('[data-course-section="assessment"]');
  const nextQuestion = assessment.getByRole("button", { name: "下一题" });
  for (let index = 0; index < 12; index += 1) {
    await assessment.locator("#final-assessment fieldset input[type=radio]").first().check();
    if (index < 11) await nextQuestion.click();
  }
  await assessment.getByRole("button", { name: "提交测验" }).click();

  const navigator = assessment.getByRole("navigation", { name: "期末测验" });
  const questionButtons = navigator.getByRole("button");
  await expect(questionButtons).toHaveCount(12);
  for (let index = 0; index < 12; index += 1) {
    const questionButton = questionButtons.nth(index);
    const correct = await questionButton.getAttribute("data-correct") === "true";
    const incorrect = await questionButton.getAttribute("data-incorrect") === "true";
    expect(correct || incorrect, `question ${index + 1} should have a graded state`).toBe(true);
    expect(correct && incorrect, `question ${index + 1} cannot have two graded states`).toBe(false);
    await expect(questionButton).toHaveAccessibleName(
      `第 ${index + 1}/12 题: ${correct ? "回答正确。" : "尚未答对。"}`,
    );
    await expect(questionButton).toContainText(correct ? "✓" : "×");
  }

  await runAxe(page, "Course 17 graded assessment navigator");
  expect(runtimeErrors).toEqual([]);
});

test("独立结课项目与紧凑证据登记路由可达，来源按需展开", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  const capstoneResponse = await page.goto(CAPSTONE);
  expect(capstoneResponse?.status()).toBe(200);

  const capstone = page.locator('[data-course-section="capstone"]');
  await expect(capstone.getByRole("heading", { level: 1, name: "结课项目" }))
    .toBeVisible();
  await expect(capstone.getByRole("status").filter({
    hasText: "请先完成全部课程模块并通过期末测验，再完成结课项目。",
  })).toBeVisible();
  await expect(capstone.getByRole("button", { name: "标记结课项目为已完成" }))
    .toBeDisabled();

  const evidenceLink = capstone.locator('a[href^="/zh-Hans/agentic-quant-trading/sources/#source-"]')
    .first();
  const evidenceHref = await evidenceLink.getAttribute("href");
  expect(evidenceHref).toBeTruthy();
  await evidenceLink.click();
  await expect(page).toHaveURL(new RegExp(`${evidenceHref?.replaceAll("/", "\\/")}$`));
  const evidenceTargetId = evidenceHref?.split("#").at(-1);
  const evidenceTarget = page.locator(`#${evidenceTargetId}`);
  await expect(evidenceTarget.locator("details")).toHaveAttribute("open", "");
  await expect(evidenceTarget.locator("summary")).toBeFocused();

  await page.goBack();
  await expect(page).toHaveURL(new RegExp(`${CAPSTONE.replaceAll("/", "\\/")}$`));

  const sourcesLink = capstone.locator('a[rel="next"]');
  await expect(sourcesLink).toHaveAttribute("href", SOURCES);
  await expect(sourcesLink).toContainText("下一步");
  await expect(sourcesLink).not.toContainText("下一模块");
  await sourcesLink.click();
  await expect(page).toHaveURL(new RegExp(`${SOURCES.replaceAll("/", "\\/")}$`));

  const sources = page.locator('[data-course-section="sources"]');
  await expect(sources.getByRole("heading", { level: 1, name: "证据登记表" }))
    .toBeVisible();
  await expect(sources.getByRole("heading", { level: 2, name: "来源", exact: true }))
    .toBeVisible();
  const register = sources.locator(
    'section[aria-labelledby="agentic-quant-trading-sources-title"]',
  );
  const disclosures = register.locator("ol > li > details");
  expect(await disclosures.count()).toBeGreaterThan(0);
  await expect(register.locator("ol > li:not(:has(details))")).toHaveCount(0);

  const firstDisclosure = disclosures.first();
  await expect(firstDisclosure).not.toHaveAttribute("open", "");
  await firstDisclosure.locator("summary").click();
  await expect(firstDisclosure).toHaveAttribute("open", "");
  await expect(firstDisclosure.getByRole("link").first()).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("结课收据必须绑定当前产物，旧的跨产物勾选状态会失效", async ({ page }) => {
  const progress = progressWithCompletedModules(MODULE_SLUGS);
  progress[`${COURSE_PREFIX}quiz.version`] = QUIZ_VERSION;
  progress[`${COURSE_PREFIX}quiz.best`] = 12;
  progress[`${COURSE_PREFIX}quiz.passed`] = true;
  progress[`${COURSE_PREFIX}capstone.version`] = CAPSTONE_VERSION;
  progress[`${COURSE_PREFIX}capstone.mandate-authority.draft`] =
    validReceipt("data-signal-lineage");
  progress[`${COURSE_PREFIX}capstone.mandate-authority.complete`] = true;
  await page.addInitScript((record) => {
    window.localStorage.setItem("ae.progress", JSON.stringify(record));
  }, progress);

  const runtimeErrors = collectRuntimeErrors(page);
  const response = await page.goto(CAPSTONE);
  expect(response?.status()).toBe(200);

  const capstone = page.locator('[data-course-section="capstone"]');
  const firstReceipt = capstone.locator("#agentic-quant-trading-mandate-authority-draft");
  const firstArtifact = capstone.locator('#capstone input[type="checkbox"]').first();
  const completeButton = capstone.getByRole("button", {
    name: "标记结课项目为已完成",
  });

  await expect(firstReceipt).toHaveAttribute("aria-invalid", "true");
  await expect(firstArtifact).not.toBeChecked();
  await expect(firstArtifact).toBeDisabled();
  await expect(completeButton).toBeDisabled();

  await firstReceipt.fill(validReceipt("mandate-authority"));
  await expect(firstReceipt).not.toHaveAttribute("aria-invalid", "true");
  await expect(firstArtifact).toBeEnabled();
  await firstArtifact.check();
  await expect(firstArtifact).toBeChecked();
  await expect(completeButton).toBeDisabled();
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
  await page.getByRole("button", { name: "Dismiss language notice" }).click();
  await expect(page.getByText("Content language: en", { exact: true })).toHaveCount(0);
  expect(runtimeErrors).toEqual([]);
});

test("显式主题选择跨刷新保留，键盘焦点环满足非文本对比度", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await page.emulateMedia({ colorScheme: "dark" });
  const response = await page.goto(DASHBOARD);
  expect(response?.status()).toBe(200);

  const themeToggle = page.getByRole("button", { name: "切换到浅色主题" });
  await expect(themeToggle).toBeVisible();
  await themeToggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(() => window.localStorage.getItem("ae.theme"))).toBe("light");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("button", { name: "切换到深色主题" })).toBeVisible();

  const start = page.getByRole("link", { name: /^从模拟研究台授权开始:/ });
  await start.focus();
  await expect(start).toBeFocused();
  const focus = await start.evaluate((element) => {
    const parseRgb = (value: string) => {
      const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return channels.slice(0, 3);
    };
    const luminance = (channels: number[]) => {
      const linear = channels.map((channel) => {
        const value = channel / 255;
        return value <= 0.04045
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const style = getComputedStyle(element);
    let ancestor: Element | null = element.parentElement;
    let adjacent = "rgb(255, 255, 255)";
    while (ancestor) {
      const background = getComputedStyle(ancestor).backgroundColor;
      if (!background.endsWith(", 0)") && background !== "rgba(0, 0, 0, 0)") {
        adjacent = background;
        break;
      }
      ancestor = ancestor.parentElement;
    }
    const first = luminance(parseRgb(style.outlineColor));
    const second = luminance(parseRgb(adjacent));
    return {
      contrast: (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05),
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
    };
  });
  expect(focus.outlineStyle).toBe("solid");
  expect(focus.outlineWidth).toBeGreaterThanOrEqual(3);
  expect(focus.contrast).toBeGreaterThanOrEqual(3);
  expect(runtimeErrors).toEqual([]);
});

test("阿拉伯语 RTL 外壳中的英语回退开关选中后，滑块仍完整留在轨道内", async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  const response = await page.goto(
    `/ar/agentic-quant-trading/${MODULE_SLUGS[5]}/`,
  );
  expect(response?.status()).toBe(200);

  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  const root = page.locator('[data-course-kit="agentic-quant-trading"]');
  await expect(root).toHaveAttribute("lang", "en");
  await expect(root).toHaveAttribute("dir", "ltr");
  await expect(page.getByText("Content language: en", { exact: true })).toBeVisible();

  const firstClaim = root
    .getByRole("group", { name: "Unverified evidence and boundary claims" })
    .getByRole("checkbox")
    .first();
  await firstClaim.check();
  const bounds = await firstClaim.evaluate((input) => {
    const track = input.nextElementSibling;
    if (!(track instanceof HTMLElement)) throw new Error("Switch track is missing");
    const trackRect = track.getBoundingClientRect();
    const trackStyle = getComputedStyle(track);
    const thumbStyle = getComputedStyle(track, "::after");
    const transform = thumbStyle.transform === "none"
      ? new DOMMatrixReadOnly()
      : new DOMMatrixReadOnly(thumbStyle.transform);
    const thumbWidth = Number.parseFloat(thumbStyle.width);
    const leftInset = Number.parseFloat(thumbStyle.left);
    const rightInset = Number.parseFloat(thumbStyle.right);
    const borderLeft = Number.parseFloat(trackStyle.borderLeftWidth);
    const borderRight = Number.parseFloat(trackStyle.borderRightWidth);
    const thumbLeft = Number.isFinite(leftInset)
      ? trackRect.left + borderLeft + leftInset + transform.m41
      : trackRect.right - borderRight - rightInset - thumbWidth + transform.m41;
    return {
      direction: getComputedStyle(input.closest("label") as HTMLElement).direction,
      trackLeft: trackRect.left,
      trackRight: trackRect.right,
      thumbLeft,
      thumbRight: thumbLeft + thumbWidth,
    };
  });
  expect(bounds.direction).toBe("ltr");
  expect(bounds.thumbLeft).toBeGreaterThanOrEqual(bounds.trackLeft - 0.5);
  expect(bounds.thumbRight).toBeLessThanOrEqual(bounds.trackRight + 0.5);

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    page: document.documentElement.scrollWidth,
  }));
  expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1);
  await runAxe(page, "Course 17 Arabic shell with checked English fallback switch");
  await page.screenshot({
    path: resolve(SCREENSHOT_DIR, "course17-ar-dark-fallback.png"),
  });
  expect(runtimeErrors).toEqual([]);
});

test("课程目录公开 Course 17，未知模块严格返回 404", async ({ page }) => {
  const response = await page.goto("/zh-Hans/courses/");
  expect(response?.status()).toBe(200);
  const card = page.locator("#agentic-quant-trading");
  await expect(card).toHaveCount(1);
  await expect(card.getByText("课程十七", { exact: true })).toBeVisible();
  await expect(card.getByRole("heading", { level: 2, name: "智能体赋能量化交易" }))
    .toBeVisible();
  await expect(card.locator('[data-course-cover="agentic-quant-trading"]')).toHaveCount(1);
  await expect(card.locator("a.cinner")).toHaveAttribute(
    "href",
    "/zh-Hans/agentic-quant-trading/",
  );

  const missing = await page.goto(
    "/zh-Hans/agentic-quant-trading/not-a-course-module/",
  );
  expect(missing?.status()).toBe(404);
  await expect(page.locator('[data-course-kit="agentic-quant-trading"]')).toHaveCount(0);
});
