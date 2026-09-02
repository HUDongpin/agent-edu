import { expect, test, type Page } from "@playwright/test";
import axe from "axe-core";
import {
  agenticTeachingArtifactRubricFingerprint,
  agenticTeachingCheckpointBlueprintId,
  getAgenticTeachingArtifactRubric,
  getAgenticTeachingCheckpointContract,
  getAgenticTeachingFinalQuizQuestionContract,
} from "../lib/ai-teaching/contracts";
import { AGENTIC_TEACHING_COPY_EN } from "../lib/ai-teaching/copy/en";
import { AGENTIC_TEACHING_COPY_ZH_HANS } from "../lib/ai-teaching/copy/zh-Hans";
import {
  AGENTIC_TEACHING_CAPSTONE_KEY,
  AGENTIC_TEACHING_QUIZ_BLUEPRINT,
  agenticTeachingCapstonePrerequisiteFingerprint,
  createAgenticTeachingCapstoneReceipt,
} from "../lib/ai-teaching/progress";
import {
  AGENTIC_TEACHING_MODULE_SLUGS,
  type AgenticTeachingContentLocale,
  type AgenticTeachingModuleSlug,
  type AgenticTeachingQuizQuestion,
} from "../lib/ai-teaching/types";

const PROGRESS_KEY = "ae.progress";
const COURSE_VERSION = "2026.08.26";
const MODULE_SLUG = "agentic-teaching-boundaries";
const ARTIFACT_KEY = `agenticTeaching.artifact.${MODULE_SLUG}`;
const CHECKPOINT_KEY = `agenticTeaching.checkpoint.${MODULE_SLUG}`;
const MODULE_KEY = `agenticTeaching.module.${MODULE_SLUG}`;
const QUIZ_KEY = "agenticTeaching.quiz.v2";

const englishArtifact = [
  "Purpose: bounded coaching after a learner attempt.",
  "Agent action: prepare one editable hint at a time from approved material.",
  "Human authority: the educator decides release, exceptions and escalation.",
  "Stop condition: conflicting sources, a crisis signal or an unauthorised action.",
  "Learning evidence: a new no-AI transfer task and an educator-read failure sample.",
].join("\n");

const chineseArtifact = [
  "任务边界：学习者先独立尝试，再由系统提供逐级提示；不代替教师作判断。",
  "人类责任人：任课教师负责来源、教学适切性、异常升级与最终发布。",
  "允许自主度：只生成可编辑建议，不发送、不评分、不改记录。",
  "停止条件：来源冲突、危机语义、越权工具调用或连续误解时立即停止并升级。",
  "无 AI 迁移证据：换用新材料与新题，在没有系统帮助时独立解释、应用并由教师检查。",
  "补充证据：保留合成测试输入、教师修改、拒绝理由、安全失败样本与回滚记录，且不输入真实学生个人资料；另记录一次教师拒绝建议的原因、一次无 AI 对照结果和下一次复核日期。",
].join("\n");

function oneModuleRecord() {
  const checkpoint = getAgenticTeachingCheckpointContract(MODULE_SLUG, "en");
  return {
    [ARTIFACT_KEY]: {
      schema: 2,
      courseVersion: COURSE_VERSION,
      revisionId: "browser-revision-en-a",
      contentLocale: "en",
      text: englishArtifact,
    },
    [CHECKPOINT_KEY]: {
      schema: 2,
      courseVersion: COURSE_VERSION,
      blueprintId: agenticTeachingCheckpointBlueprintId(MODULE_SLUG, "en"),
      contentLocale: "en",
      selectedOptionId: checkpoint.correctOptionId,
      passed: true,
    },
    [MODULE_KEY]: {
      schema: 2,
      courseVersion: COURSE_VERSION,
      artifactRevisionId: "browser-revision-en-a",
      artifactContentLocale: "en",
      artifactRubricFingerprint: agenticTeachingArtifactRubricFingerprint(
        MODULE_SLUG,
        "en",
      ),
      checkpointBlueprintId: agenticTeachingCheckpointBlueprintId(
        MODULE_SLUG,
        "en",
      ),
      completed: true,
    },
  };
}

function validArtifactText(
  slug: AgenticTeachingModuleSlug,
  locale: AgenticTeachingContentLocale = "en",
) {
  const rubric = getAgenticTeachingArtifactRubric(slug, locale);
  const evidence = locale === "zh-Hans"
    ? "本字段包含去标识样例、具名教师审批、停止条件以及无 AI 新任务，并保留人工质量判断。"
    : "This field includes a de-identified example, named educator approval, a stop condition and a novel no-AI task, with quality still judged by a person.";
  let value = rubric.requiredLabels
    .map((label, index) => `${label} ${evidence} Item ${index + 1}.`)
    .join("\n");
  while (value.length < rubric.minimumCharacters + 40) value += `\n${evidence}`;
  return value;
}

function completedModuleRecord(
  slug: AgenticTeachingModuleSlug,
  revisionId: string,
  locale: AgenticTeachingContentLocale = "en",
) {
  const checkpoint = getAgenticTeachingCheckpointContract(slug, locale);
  const checkpointBlueprintId = agenticTeachingCheckpointBlueprintId(
    slug,
    locale,
  );
  return {
    [`agenticTeaching.artifact.${slug}`]: {
      schema: 2,
      courseVersion: COURSE_VERSION,
      revisionId,
      contentLocale: locale,
      text: validArtifactText(slug, locale),
    },
    [`agenticTeaching.checkpoint.${slug}`]: {
      schema: 2,
      courseVersion: COURSE_VERSION,
      blueprintId: checkpointBlueprintId,
      contentLocale: locale,
      selectedOptionId: checkpoint.correctOptionId,
      passed: true,
    },
    [`agenticTeaching.module.${slug}`]: {
      schema: 2,
      courseVersion: COURSE_VERSION,
      artifactRevisionId: revisionId,
      artifactContentLocale: locale,
      artifactRubricFingerprint: agenticTeachingArtifactRubricFingerprint(
        slug,
        locale,
      ),
      checkpointBlueprintId,
      completed: true,
    },
  };
}

function allModulesRecord() {
  const entries = AGENTIC_TEACHING_MODULE_SLUGS.flatMap((slug) =>
    Object.entries(completedModuleRecord(slug, `browser-${slug}-a`)),
  );
  return Object.fromEntries(entries);
}

function passingQuizReceipt() {
  return {
    schema: 2,
    courseVersion: COURSE_VERSION,
    blueprintId: AGENTIC_TEACHING_QUIZ_BLUEPRINT,
    score: 10,
    questionCount: 12,
    requiredCorrect: 10,
    criticalPassed: true,
    passed: true,
  };
}

function allPrerequisitesRecord() {
  return {
    ...allModulesRecord(),
    [QUIZ_KEY]: passingQuizReceipt(),
  };
}

function completedCourseRecord() {
  const progress = allPrerequisitesRecord();
  const fingerprint = agenticTeachingCapstonePrerequisiteFingerprint(progress);
  expect(fingerprint).toBeTruthy();
  const receipt = createAgenticTeachingCapstoneReceipt(progress, fingerprint);
  expect(receipt).toBeTruthy();
  return { ...progress, [AGENTIC_TEACHING_CAPSTONE_KEY]: receipt };
}

async function setProgress(page: Page, progress: Record<string, unknown>) {
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, JSON.stringify(value)),
    [PROGRESS_KEY, progress] as const,
  );
  await page.reload();
}

async function answerFinalQuiz(
  page: Page,
  questions: readonly AgenticTeachingQuizQuestion[],
  wrongQuestionIds: ReadonlySet<string> = new Set(),
) {
  for (const question of questions) {
    const contract = getAgenticTeachingFinalQuizQuestionContract(question.id);
    const selectedOptionId = wrongQuestionIds.has(question.id)
      ? contract.optionIds.find(
          (optionId) => optionId !== contract.correctOptionId,
        )
      : contract.correctOptionId;
    expect(selectedOptionId).toBeTruthy();
    await page
      .getByTestId(`final-quiz-question-${question.id}`)
      .locator(`input[type="radio"][value="${selectedOptionId}"]`)
      .check();
  }
}

async function runAxe(page: Page) {
  await page.addScriptTag({ content: axe.source });
  return page.evaluate(async () => {
    const result = await (window as unknown as {
      axe: { run: () => Promise<{ violations: Array<{ id: string; impact: string | null }> }> };
    }).axe.run();
    return result.violations.filter((violation) =>
      violation.impact === "critical" || violation.impact === "serious",
    );
  });
}

function isWebKitLoopbackPrefetchDiagnostic(
  browserName: string,
  message: string,
): boolean {
  return browserName === "webkit" &&
    /^\/127\.0\.0\.1:\d+\/.+ due to access control checks\.$/.test(message);
}

test("reviewed routes reflow at 320px and have no serious axe violations", async ({ page, browserName }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => {
    // During this test's intentionally rapid loopback navigation, WebKit
    // reports cancelled Next.js production link-prefetches as page errors.
    // Requested pages still return 200 and real navigation remains covered by
    // every browser flow below, so classify only that exact local diagnostic.
    if (!isWebKitLoopbackPrefetchDiagnostic(browserName, error.message)) {
      runtimeErrors.push(error.message);
    }
  });
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });

  await page.setViewportSize({ width: 320, height: 900 });
  for (const path of [
    "/en/ai-teaching/",
    `/en/ai-teaching/${MODULE_SLUG}/`,
    "/zh-Hans/ai-teaching/",
    `/zh-Hans/ai-teaching/${MODULE_SLUG}/`,
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('[data-testid="ai-teaching-course"], [data-testid^="ai-teaching-module-"]')).toBeVisible();
    const reflow = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(reflow.scrollWidth, `${path} overflowed at 320px`).toBeLessThanOrEqual(
      reflow.clientWidth,
    );
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/en/ai-teaching/");
  expect(await runAxe(page)).toEqual([]);

  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  expect(await runAxe(page)).toEqual([]);

  const primaryActionMetaContrast = await page
    .locator('[data-testid="ai-teaching-course"] > header a small')
    .evaluate((meta) => {
      const parseRgb = (value: string) => {
        const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
        if (!channels || channels.length !== 3) {
          throw new Error(`Unsupported computed color: ${value}`);
        }
        return channels;
      };
      const luminance = (channels: number[]) => {
        const linear = channels.map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.04045
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
      };
      const foregroundStyle = getComputedStyle(meta);
      const action = meta.closest("a");
      if (!action) throw new Error("Primary action ancestor is missing");
      const foreground = parseRgb(foregroundStyle.color);
      const background = parseRgb(getComputedStyle(action).backgroundColor);
      const opacity = Number.parseFloat(foregroundStyle.opacity);
      const composited = foreground.map(
        (channel, index) => channel * opacity + background[index] * (1 - opacity),
      );
      const lighter = Math.max(luminance(composited), luminance(background));
      const darker = Math.min(luminance(composited), luminance(background));
      return (lighter + 0.05) / (darker + 0.05);
    });
  expect(primaryActionMetaContrast).toBeGreaterThanOrEqual(4.5);

  const sourceSummary = page.locator("#course-sources > details > summary");
  await sourceSummary.focus();
  const disclosureFocus = await sourceSummary.evaluate((summary) => {
    const disclosure = summary.parentElement;
    if (!disclosure) throw new Error("Source disclosure container is missing");
    const style = getComputedStyle(disclosure);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
    };
  });
  expect(disclosureFocus.outlineStyle).not.toBe("none");
  expect(disclosureFocus.outlineWidth).toBeGreaterThanOrEqual(3);
  expect(runtimeErrors).toEqual([]);
});

test("primary navigation follows validated progress and exposes module states", async ({ page }) => {
  const primaryAction = () => page.locator('[data-testid="ai-teaching-course"] > header').getByRole("link").first();
  const moduleCard = (slug: AgenticTeachingModuleSlug) =>
    page.locator(`#course-map a[href="/en/ai-teaching/${slug}/"]`);

  await page.goto("/en/ai-teaching/");
  await expect(primaryAction()).toContainText(AGENTIC_TEACHING_COPY_EN.ui.start);
  await expect(primaryAction()).toHaveAttribute(
    "href",
    `/en/ai-teaching/${AGENTIC_TEACHING_MODULE_SLUGS[0]}/`,
  );
  await expect(moduleCard(AGENTIC_TEACHING_MODULE_SLUGS[0])).toHaveAttribute(
    "data-state",
    "next",
  );

  await setProgress(page, oneModuleRecord());
  await expect(primaryAction()).toContainText(AGENTIC_TEACHING_COPY_EN.ui.resume);
  await expect(primaryAction()).toHaveAttribute(
    "href",
    `/en/ai-teaching/${AGENTIC_TEACHING_MODULE_SLUGS[1]}/`,
  );
  await expect(moduleCard(AGENTIC_TEACHING_MODULE_SLUGS[0])).toHaveAttribute(
    "data-state",
    "completed",
  );
  await expect(moduleCard(AGENTIC_TEACHING_MODULE_SLUGS[1])).toHaveAttribute(
    "data-state",
    "next",
  );

  await setProgress(page, {
    "agenticTeaching.quiz.passed": true,
    "agenticTeaching.capstone.v1": true,
  });
  await expect(primaryAction()).toContainText(AGENTIC_TEACHING_COPY_EN.ui.start);

  await setProgress(page, allModulesRecord());
  await expect(primaryAction()).toHaveAttribute("href", "#final-assessment");
  await setProgress(page, allPrerequisitesRecord());
  await expect(primaryAction()).toHaveAttribute("href", "#capstone");
  await setProgress(page, completedCourseRecord());
  await expect(primaryAction()).toHaveAttribute("href", "#course-map");
});

test("real quiz submission persists exactly 10/12, renders explanations and rejects legacy Booleans", async ({ page }) => {
  await page.goto("/en/ai-teaching/");
  const intentionallyWrong = new Set([
    "q07-multi-agent",
    "q10-tutor-copilot",
  ]);
  await answerFinalQuiz(
    page,
    AGENTIC_TEACHING_COPY_EN.quiz.questions,
    intentionallyWrong,
  );
  await page.getByTestId("final-quiz-submit").click();

  const retainedQuestionId = "q07-multi-agent";
  const retainedContract = getAgenticTeachingFinalQuizQuestionContract(
    retainedQuestionId,
  );
  const retainedWrongOptionId = retainedContract.optionIds.find(
    (optionId) => optionId !== retainedContract.correctOptionId,
  );
  expect(retainedWrongOptionId).toBeTruthy();
  await expect(
    page.getByTestId(`final-quiz-question-${retainedQuestionId}`)
      .locator(`input[value="${retainedWrongOptionId}"]`),
  ).toBeChecked();
  await expect(
    page.getByTestId(`final-quiz-question-${retainedQuestionId}`)
      .locator(`input[value="${retainedContract.correctOptionId}"]`),
  ).not.toBeChecked();

  const assessment = page.locator(
    'section[aria-labelledby="agentic-teaching-final-title"]',
  );
  await expect(assessment).toContainText("10/12");
  await expect(assessment).not.toContainText("12/12 · 10/12");
  await expect(assessment).toContainText(
    AGENTIC_TEACHING_COPY_EN.ui.assessmentPassed,
  );
  await expect(
    page.getByTestId("final-quiz-explanation-q07-multi-agent"),
  ).toContainText(
    AGENTIC_TEACHING_COPY_EN.quiz.questions.find(
      (question) => question.id === "q07-multi-agent",
    )!.explanation,
  );
  await expect(page.locator('section[aria-label="Private course progress"]').first()).toContainText("1/12");
  await expect(page.getByTestId("final-quiz-submit")).toBeDisabled();

  const storedReceipt = await page.evaluate(([progressKey, quizKey]) => {
    const progress = JSON.parse(localStorage.getItem(progressKey) ?? "{}");
    return progress[quizKey] ?? null;
  }, [PROGRESS_KEY, QUIZ_KEY] as const);
  expect(storedReceipt).toMatchObject({
    blueprintId: AGENTIC_TEACHING_QUIZ_BLUEPRINT,
    score: 10,
    questionCount: 12,
    requiredCorrect: 10,
    criticalPassed: true,
    passed: true,
  });

  await page.reload();
  await expect(assessment).toContainText("10/12");
  await expect(page.locator('section[aria-label="Private course progress"]').first()).toContainText("1/12");

  await setProgress(page, {
    "agenticTeaching.quiz.passed": true,
    "agenticTeaching.capstone.v1": true,
  });
  await expect(assessment).not.toContainText("12/12");
  await expect(page.locator('section[aria-label="Private course progress"]').first()).toContainText("0/12");
});

test("a critical wrong answer fails closed at 11/12 and shows the Chinese explanation", async ({ page }) => {
  await page.goto("/zh-Hans/ai-teaching/");
  await answerFinalQuiz(
    page,
    AGENTIC_TEACHING_COPY_ZH_HANS.quiz.questions,
    new Set(["q01-capability-boundary"]),
  );
  await page.getByTestId("final-quiz-submit").click();

  const assessment = page.locator(
    'section[aria-labelledby="agentic-teaching-final-title"]',
  );
  await expect(assessment).toContainText("11/12 · 10/12");
  await expect(assessment).toContainText(
    AGENTIC_TEACHING_COPY_ZH_HANS.ui.assessmentNotPassed,
  );
  const explanation = page.getByTestId(
    "final-quiz-explanation-q01-capability-boundary",
  );
  await expect(explanation).toContainText(AGENTIC_TEACHING_COPY_ZH_HANS.ui.incorrect);
  await expect(explanation).toContainText(
    AGENTIC_TEACHING_COPY_ZH_HANS.quiz.questions[0].explanation,
  );
  const storedReceipt = await page.evaluate(([progressKey, quizKey]) => {
    const progress = JSON.parse(localStorage.getItem(progressKey) ?? "{}");
    return progress[quizKey] ?? null;
  }, [PROGRESS_KEY, QUIZ_KEY] as const);
  expect(storedReceipt).toBeNull();
  await expect(page.locator('section[aria-label="课程进度"]').first()).toContainText("0/12");
});

test("a cross-tab passing receipt replaces stale failed answers with the answer key", async ({ page }) => {
  await page.goto("/en/ai-teaching/");
  const failedQuestion = AGENTIC_TEACHING_COPY_EN.quiz.questions[0];
  const failedContract = getAgenticTeachingFinalQuizQuestionContract(
    failedQuestion.id,
  );
  const wrongOptionId = failedContract.optionIds.find(
    (optionId) => optionId !== failedContract.correctOptionId,
  );
  expect(wrongOptionId).toBeTruthy();
  await answerFinalQuiz(
    page,
    AGENTIC_TEACHING_COPY_EN.quiz.questions,
    new Set([failedQuestion.id]),
  );
  await page.getByTestId("final-quiz-submit").click();
  await expect(
    page.getByTestId(`final-quiz-question-${failedQuestion.id}`)
      .locator(`input[value="${wrongOptionId}"]`),
  ).toBeChecked();

  const otherPage = await page.context().newPage();
  await otherPage.goto("/en/ai-teaching/");
  await otherPage.evaluate(
    ([progressKey, quizKey, receipt]) => {
      const current = JSON.parse(localStorage.getItem(progressKey) ?? "{}");
      localStorage.setItem(
        progressKey,
        JSON.stringify({ ...current, [quizKey]: receipt }),
      );
    },
    [PROGRESS_KEY, QUIZ_KEY, passingQuizReceipt()] as const,
  );

  const assessment = page.locator(
    'section[aria-labelledby="agentic-teaching-final-title"]',
  );
  await expect(assessment).toContainText(
    AGENTIC_TEACHING_COPY_EN.ui.assessmentPassed,
  );
  await expect(page.getByTestId("final-quiz-submit")).toBeDisabled();
  await expect(
    page.getByTestId(`final-quiz-question-${failedQuestion.id}`)
      .locator(`input[value="${failedContract.correctOptionId}"]`),
  ).toBeChecked();
  await expect(
    page.getByTestId(`final-quiz-question-${failedQuestion.id}`)
      .locator(`input[value="${wrongOptionId}"]`),
  ).not.toBeChecked();
  await otherPage.close();
});

test("language navigation preserves a receipt; an explicit new-language save invalidates it", async ({ page }) => {
  await page.goto(`/en/ai-teaching/${MODULE_SLUG}/`);
  await setProgress(page, oneModuleRecord());
  await expect(page.getByRole("button", { name: "Module recorded" })).toBeDisabled();
  await expect(page.locator('section[aria-label="Private course progress"]').first()).toContainText("1/12");

  await page.goto(`/zh-Hans/ai-teaching/${MODULE_SLUG}/`);
  await expect(page.getByRole("button", { name: "本模块已记录完成" })).toBeDisabled();
  await expect(page.getByText(/另一已审校语言模板/)).toBeVisible();
  await expect(page.locator('section[aria-label="课程进度"]').first()).toContainText("1/12");

  const notebook = page.getByRole("textbox", { name: "智能体边界卡" });
  await notebook.fill(chineseArtifact);
  await page.getByRole("button", { name: "保存产出物" }).click();
  await expect(page.getByRole("button", { name: "记录模块完成" })).toBeEnabled();
  await expect(page.locator('section[aria-label="课程进度"]').first()).toContainText("0/12");
});

test("grading remains a stop path even when authority is draft-only", async ({ page }) => {
  await page.goto("/en/ai-teaching/");
  const pilot = page.locator("section").filter({
    has: page.locator("#pilot-canvas-title"),
  });
  await pilot.getByLabel("Task").selectOption("grade");
  await pilot.getByLabel("Agent authority").selectOption("draft");
  await expect(pilot).toContainText("Stop: do not delegate a high-impact judgement");
  await expect(pilot).toContainText("make the academic judgement first");
  await expect(pilot).toContainText("editable evidence summary or feedback draft");
});

test("capstone attestation is bound to the current cross-tab evidence snapshot", async ({ page }) => {
  await page.goto("/en/ai-teaching/");
  await setProgress(page, allPrerequisitesRecord());

  const capstone = page.locator(
    'section[aria-labelledby="agentic-teaching-capstone-title"]',
  );
  const attestation = capstone.locator('input[type="checkbox"]:not([disabled])');
  const complete = capstone.getByRole("button", {
    name: "Record capstone self-check",
  });
  await expect(attestation).toHaveCount(1);
  await attestation.check();
  await expect(complete).toBeEnabled();
  await complete.click();
  await expect(
    page.locator('section[aria-label="Private course progress"]').first(),
  ).toContainText("12/12");

  const changedRevision = "browser-boundaries-cross-tab-b";
  const replacement = completedModuleRecord(
    MODULE_SLUG,
    changedRevision,
  );
  const otherPage = await page.context().newPage();
  await otherPage.goto("/en/ai-teaching/");
  await otherPage.evaluate(
    ([key, patch]) => {
      const current = JSON.parse(localStorage.getItem(key) ?? "{}");
      localStorage.setItem(key, JSON.stringify({ ...current, ...patch }));
    },
    [PROGRESS_KEY, replacement] as const,
  );

  await expect(
    page.locator('section[aria-label="Private course progress"]').first(),
  ).toContainText("11/12");
  const renewedAttestation = capstone.locator(
    'input[type="checkbox"]:not([disabled])',
  );
  await expect(renewedAttestation).toHaveCount(1);
  await expect(renewedAttestation).not.toBeChecked();
  await expect(complete).toBeDisabled();
  await renewedAttestation.check();
  await expect(complete).toBeEnabled();
  await complete.click();
  await expect(
    page.locator('section[aria-label="Private course progress"]').first(),
  ).toContainText("12/12");
  await otherPage.close();
});
