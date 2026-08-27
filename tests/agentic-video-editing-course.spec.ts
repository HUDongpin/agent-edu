import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  AGENTIC_VIDEO_EDITING_EN_COPY,
  AGENTIC_VIDEO_EDITING_MODULE_SLUGS,
} from "../lib/agentic-video-editing";

const DASHBOARD = "/en/agentic-video-editing/";
const PUBLIC_FILES = [
  "creative-brief.fixture.json",
  "media-manifest.fixture.json",
  "edit-plan.schema.json",
  "qc-checklist.md",
  "NOTICE.md",
] as const;

test.describe("Course 20 dashboard, sources, and public contracts", () => {
  test("English and Simplified Chinese editions render the reviewed course", async ({ page }) => {
    for (const [locale, heading] of [
      ["en", "Agentic Video Editing: From Intent to a Verified Cut"],
      ["zh-Hans", "如何使用智能体进行视频剪辑：从创作意图到经过验证的成片"],
    ] as const) {
      const response = await page.goto(`/${locale}/agentic-video-editing/`);
      expect(response?.status()).toBe(200);
      const dashboard = page.getByTestId("agentic-video-editing-course-dashboard");
      await expect(dashboard).toBeVisible();
      await expect(dashboard.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expect(dashboard.locator("details")).toHaveCount(25);
      await expect(dashboard.getByRole("link", { name: /Download|下载/ })).toHaveCount(6);
    }
  });

  test("all ten independent module routes render and expose evidence, practice, and a checkpoint", async ({ page }) => {
    for (const slug of AGENTIC_VIDEO_EDITING_MODULE_SLUGS) {
      const response = await page.goto(`/en/agentic-video-editing/${slug}/`);
      expect(response?.status(), slug).toBe(200);
      const modulePage = page.getByTestId(`agentic-video-editing-module-${slug}`);
      await expect(modulePage, slug).toBeVisible();
      await expect(modulePage.locator("#module-sources li").first(), slug).toBeVisible();
      await expect(modulePage.locator("#module-practice textarea"), slug).toBeVisible();
      await expect(modulePage.locator(`#checkpoint-${slug}`), slug).toBeVisible();
    }
  });

  test("source register uses reader-facing labels and discloses truncated X text", async ({ page }) => {
    await page.goto(DASHBOARD);
    const body = page.locator("body");
    await expect(body).not.toContainText("execution-engine");
    await expect(body).not.toContainText("oembed-truncated-repository-corroborated");
    await expect(body).not.toContainText("x-official-oembed");
    const videoUse = page.locator("details").filter({ hasText: "Introducing Video Use" });
    await videoUse.getByText("Introducing Video Use", { exact: true }).click();
    await expect(videoUse.getByText("Visible post text is truncated", { exact: false })).toBeVisible();
    await expect(videoUse.getByText("Official X oEmbed", { exact: false })).toBeVisible();
  });

  test("public learning files match the published SHA-256 ledger", async ({ request }) => {
    const provenanceResponse = await request.get("/courses/agentic-video-editing/fixtures.provenance.json");
    expect(provenanceResponse.status()).toBe(200);
    const provenance = await provenanceResponse.json() as {
      fixtureSetVersion: string;
      files: { path: string; sha256: string }[];
    };
    expect(provenance.fixtureSetVersion).toBe("1.1.0");
    expect(provenance.files.map((record) => record.path)).toEqual(PUBLIC_FILES);
    for (const record of provenance.files) {
      const response = await request.get(`/courses/agentic-video-editing/${record.path}`);
      expect(response.status(), record.path).toBe(200);
      expect(createHash("sha256").update(await response.body()).digest("hex"), record.path)
        .toBe(record.sha256);
    }
  });

  test("Course JSON-LD closes over ten modules and 750 minutes", async ({ page }) => {
    await page.goto(DASHBOARD);
    const nodes = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => scripts.flatMap((script) => {
      const value = JSON.parse(script.textContent ?? "{}") as Record<string, unknown>;
      return Array.isArray(value["@graph"]) ? value["@graph"] as Record<string, unknown>[] : [value];
    }));
    const course = nodes.find((node) => node["@type"] === "Course") as {
      courseCode: string;
      hasCourseInstance: { courseWorkload: string };
      hasPart: unknown[];
    } | undefined;
    expect(course?.courseCode).toBe("20");
    expect(course?.hasCourseInstance.courseWorkload).toBe("PT750M");
    expect(course?.hasPart).toHaveLength(10);
  });

  test("static export acceptance preserves a missing-route 404", async ({ request }) => {
    const response = await request.get("/en/agentic-video-editing/not-a-real-module/");
    expect(response.status()).toBe(404);
  });
});

test.describe("Course 20 interactive safety contracts", () => {
  test("Cut Plan Lab passes a safe text fixture but never grants execution or release authority", async ({ page }) => {
    await page.goto("/en/agentic-video-editing/declarative-edit-plan/");
    await page.getByRole("button", { name: "Generate and run contract gate" }).click();
    const receipt = page.getByRole("status").filter({ hasText: "Plan passes the course semantic gate" });
    await expect(receipt).toBeVisible();
    await expect(receipt).toContainText('"schemaVersion": "aicourse.agentic-video-editing.edit-plan.v2"');
    await expect(receipt).toContainText('"status": "blocked"');
    await expect(receipt).toContainText('"allowPublish": false');
    await expect(receipt).not.toContainText("releaseDecision");
    await expect(receipt).not.toContainText("approvals");

    await page.getByRole("checkbox", { name: /Unverified archive insert/ }).check();
    await page.getByRole("button", { name: "Generate and run contract gate" }).click();
    await expect(page.getByRole("listitem").filter({ hasText: /rights are unresolved/ })).toBeVisible();
  });

  test("a failed repeat attempt is not presented as a current pass", async ({ page }) => {
    await page.goto(DASHBOARD);
    const assessment = page.locator("#agentic-video-editing-assessment");
    const questions = assessment.locator("fieldset");
    await expect(questions).toHaveCount(10);
    for (const [index, question] of AGENTIC_VIDEO_EDITING_EN_COPY.finalAssessment.questions.entries()) {
      await questions.nth(index).locator('input[type="radio"]').nth(question.correctIndex).check();
    }
    await assessment.getByRole("button", { name: "Score assessment" }).click();
    await expect(assessment.getByText("Assessment passed", { exact: true })).toBeVisible();

    const critical = AGENTIC_VIDEO_EDITING_EN_COPY.finalAssessment.questions.findIndex((question) => question.critical);
    const correctIndex = AGENTIC_VIDEO_EDITING_EN_COPY.finalAssessment.questions[critical].correctIndex;
    await questions.nth(critical).locator('input[type="radio"]').nth((correctIndex + 1) % 4).check();
    await assessment.getByRole("button", { name: "Score assessment" }).click();
    const currentResult = assessment.locator('[role="status"]');
    await expect(currentResult).toContainText("Review the feedback and try again.");
    await expect(currentResult).toContainText("Your earlier passing record remains saved; this attempt did not pass.");
    await expect(currentResult).toContainText("A critical control question is still incorrect.");
    await expect(currentResult).not.toHaveAttribute("data-passed", "true");
  });

  test("mobile layout keeps controls labelled and avoids page-level horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/zh-Hans/agentic-video-editing/declarative-edit-plan/");
    await expect(page.getByLabel("目标时长（秒）")).toBeVisible();
    await expect(page.getByRole("button", { name: "生成并运行合同门" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    const unlabeledControls = await page.locator("input, textarea, button, select").evaluateAll((controls) => controls.filter((control) => {
      const element = control as HTMLElement;
      const id = element.id;
      const hasLabel = Boolean(
        element.getAttribute("aria-label")
        || element.getAttribute("aria-labelledby")
        || element.closest("label")
        || (id && document.querySelector(`label[for="${CSS.escape(id)}"]`))
        || element.textContent?.trim(),
      );
      return !hasLabel;
    }).length);
    expect(unlabeledControls).toBe(0);
  });
});
