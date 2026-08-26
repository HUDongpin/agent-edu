import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PUBLISHED_COURSE_SURFACES } from "../lib/release-surface";

const dashboardByCourse = new Map<string, string>([
  ["agentic", "components/handbook/Handbook.tsx"],
  ["grok", "components/grok/CourseDashboard.tsx"],
  ["github", "components/github/CourseDashboard.tsx"],
  ["prompts", "components/prompts/CourseDashboard.tsx"],
  ["software-engineering", "components/software-engineering/CourseDashboard.tsx"],
  ["rag", "components/rag/CourseDashboard.tsx"],
  ["mcp", "components/mcp/CourseDashboard.tsx"],
  ["make-money-with-codex", "components/make-money-with-codex/CourseDashboard.tsx"],
  ["claude-income", "components/claude-income/CourseDashboard.tsx"],
  ["ai-tutor", "components/ai-tutor/CourseDashboard.tsx"],
  ["product-management", "components/product-management/CourseDashboard.tsx"],
  ["agent-orchestration", "components/agent-orchestration/CourseDashboard.tsx"],
]);

const journeyByCourse = new Map<string, string>([
  ["agentic", "components/handbook/CourseJourney.tsx"],
  ["grok", "components/grok/CourseProgress.tsx"],
  ["github", "components/github/CourseProgress.tsx"],
  ["prompts", "components/prompts/PromptInteractions.tsx"],
  ["software-engineering", "components/software-engineering/CourseProgress.tsx"],
  ["rag", "components/rag/RagInteractions.tsx"],
  ["mcp", "components/mcp/CourseProgress.tsx"],
  ["make-money-with-codex", "components/make-money-with-codex/CourseProgress.tsx"],
  ["claude-income", "components/claude-income/DashboardProgress.tsx"],
  ["ai-tutor", "components/ai-tutor/Interactions.tsx"],
  ["product-management", "components/product-management/Interactions.tsx"],
  ["agent-orchestration", "components/agent-orchestration/Interactions.tsx"],
]);

test("every published dashboard mounts the registry-derived shared course shell", () => {
  assert.equal(dashboardByCourse.size, PUBLISHED_COURSE_SURFACES.length);
  for (const course of PUBLISHED_COURSE_SURFACES) {
    const path = dashboardByCourse.get(course.id);
    assert.ok(path, course.id);
    const source = readFileSync(path, "utf8");
    assert.match(source, new RegExp(`<SharedCourseShell\\s+courseId=["']${course.id}["']`), path);
  }

  const shell = readFileSync("components/SharedCourseShell.tsx", "utf8");
  for (const field of [
    "data-course-publication-state",
    "data-course-level",
    "data-course-minutes",
    "data-course-content-language",
    "data-course-progress-storage",
    "local-progress",
  ]) assert.match(shell, new RegExp(field), field);
  assert.match(shell, /PUBLISHED_CATALOG_COURSES\.find/);
});

test("every published dashboard exposes exactly one designated journey CTA implementation", () => {
  assert.equal(journeyByCourse.size, PUBLISHED_COURSE_SURFACES.length);
  for (const course of PUBLISHED_COURSE_SURFACES) {
    const path = journeyByCourse.get(course.id);
    assert.ok(path, course.id);
    const source = readFileSync(path, "utf8");
    assert.equal(
      source.match(/data-course-journey-action/g)?.length,
      1,
      `${course.id}: ${path}`,
    );
  }
});

test("every published course exposes a shared previous/next lesson navigation marker", () => {
  const lessonViews = [
    "components/AgenticTrackNav.tsx",
    "components/grok/LessonView.tsx",
    "components/github/LessonView.tsx",
    "components/prompts/LessonView.tsx",
    "components/software-engineering/LessonView.tsx",
    "components/rag/LessonView.tsx",
    "components/mcp/LessonView.tsx",
    "components/make-money-with-codex/LessonView.tsx",
    "components/claude-income/LessonView.tsx",
    "components/ai-tutor/ModuleView.tsx",
    "components/product-management/ModuleView.tsx",
    "components/agent-orchestration/ModuleView.tsx",
  ];
  assert.equal(lessonViews.length, PUBLISHED_COURSE_SURFACES.length);
  for (const path of lessonViews) {
    assert.equal(readFileSync(path, "utf8").match(/data-course-lesson-nav/g)?.length, 1, path);
  }
});

test("teacher duration radios own three real tabpanels while print keeps every plan", () => {
  const source = readFileSync("components/teachers/TeacherGuide.tsx", "utf8");
  const styles = readFileSync("components/teachers/TeacherGuide.module.css", "utf8");
  assert.match(source, /aria-controls=[\s\S]*?-plan-/);
  assert.match(source, /role:\s*"tabpanel"/);
  assert.match(source, /"aria-labelledby":[\s\S]*?-option-/);
  assert.match(source, /hidden:\s*plan\.minutes\s*!==\s*selected/);
  assert.match(source, /plans\.map\(\(plan\)\s*=>\s*renderTimeline\(plan\)\)/);
  assert.match(styles, /\.selectedOnly\s+\.plan\[hidden\]\s*{\s*display:\s*none;/);
});

test("shared course catalogue breadcrumb keeps a 44px logical touch target", () => {
  const styles = readFileSync("app/globals.css", "utf8");
  const rule = styles.match(/\.shared-course-breadcrumb\s+a\s*{([^}]*)}/)?.[1] ?? "";
  assert.match(rule, /min-block-size:\s*44px/);
  assert.match(rule, /min-inline-size:\s*44px/);
});
