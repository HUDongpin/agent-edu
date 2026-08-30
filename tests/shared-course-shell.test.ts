import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PUBLISHED_COURSE_SURFACES } from "../lib/release-surface";
import {
  PENDING_COURSE_SHELL_PROGRESS,
  loadCourseShellProgress,
  shouldTransferCourseShellFocus,
} from "../components/course-shell/CourseShellProgress";

const serverDashboardByCourse = new Map<string, string>([
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
  ["grok", "components/grok/CourseHeroAction.tsx"],
  ["github", "components/github/CourseProgress.tsx"],
  ["prompts", "components/prompts/PromptInteractions.tsx"],
  ["software-engineering", "components/software-engineering/CourseProgress.tsx"],
  ["rag", "components/course-shell/CourseShellProgress.tsx"],
  ["mcp", "components/mcp/CourseProgress.tsx"],
  ["make-money-with-codex", "components/make-money-with-codex/CourseProgress.tsx"],
  ["claude-income", "components/claude-income/DashboardProgress.tsx"],
  ["ai-tutor", "components/ai-tutor/Interactions.tsx"],
  ["product-management", "components/product-management/Interactions.tsx"],
  ["agent-orchestration", "components/agent-orchestration/Interactions.tsx"],
]);

test("eleven published dashboards mount the server CourseShell entry", () => {
  const serverCourses = PUBLISHED_COURSE_SURFACES.filter((course) => course.id !== "agentic");
  assert.equal(serverDashboardByCourse.size, 11);
  assert.equal(serverDashboardByCourse.size, serverCourses.length);
  for (const course of serverCourses) {
    const path = serverDashboardByCourse.get(course.id);
    assert.ok(path, course.id);
    const source = readFileSync(path, "utf8");
    assert.match(source, /from\s+["']\.\.\/course-shell\/CourseShell["']/u, path);
    assert.match(source, new RegExp(`<CourseShell\\s+courseId=["']${course.id}["']`), path);
    assert.doesNotMatch(source, /^\s*["']use client["']/u, path);
  }

  const shell = readFileSync("components/course-shell/CourseShell.tsx", "utf8");
  assert.match(shell, /^import\s+["']server-only["'];/u);
  assert.doesNotMatch(shell, /^\s*["']use client["']/u);
  assert.match(shell, /<section/u, "the core overview is content, not complementary aside content");
  assert.doesNotMatch(shell, /<aside/u);
  for (const field of [
    "data-course-publication-state",
    "data-course-level",
    "data-course-minutes",
    "data-course-content-language",
    "data-course-progress-storage",
    "local-progress",
  ]) assert.match(shell, new RegExp(field), field);
  assert.match(shell, /PUBLISHED_CATALOG_COURSES\.find/);
  assert.match(shell, /getMessages\(locale\)/);
  assert.match(shell, /metaFor\(contentLocale\)\.native/);
  assert.doesNotMatch(shell, /new\s+Intl\.DisplayNames/);
  for (const contract of [
    "courseShell.overview",
    "courseShell.status",
    "courseShell.difficulty",
    "courseShell.duration",
    "courseShell.contentLanguage",
    "courseShell.fallbackNotice",
    "courseShell.prerequisites",
    "courseShell.outcome",
    "courseShell.artifact",
    "courseShell.syllabus",
    "courseShell.syllabusSummary",
    "courseShell.localNote",
  ]) assert.match(shell, new RegExp(contract.replace(".", "\\.")), contract);
});

test("Handbook keeps a client-compatible RSC slot without importing server metadata", () => {
  const handbook = readFileSync("components/handbook/Handbook.tsx", "utf8");
  const compatibilitySlot = readFileSync("components/SharedCourseShell.tsx", "utf8");
  const page = readFileSync("app/[locale]/handbook/page.tsx", "utf8");

  assert.match(handbook, /^["']use client["'];/u);
  assert.match(handbook, /<SharedCourseShell>\{courseShell\}<\/SharedCourseShell>/u);
  assert.match(compatibilitySlot, /^["']use client["'];/u);
  assert.match(compatibilitySlot, /return children/u);
  assert.doesNotMatch(compatibilitySlot, /public-courses|public-release-surface|getMessages|useI18n/u);
  assert.match(page, /from\s+["']@\/components\/course-shell\/CourseShell["']/u);
  assert.match(page, /courseShell=\{<CourseShell courseId=["']agentic["'] locale=\{locale\} \/>\}/u);
});

test("CourseShell progress starts pending and fails closed for every loader boundary", async () => {
  assert.deepEqual(PENDING_COURSE_SHELL_PROGRESS, {
    state: "pending",
    percent: null,
    nextHref: null,
  });

  const unavailable = { state: "unavailable", percent: null, nextHref: null };
  assert.deepEqual(await loadCourseShellProgress("grok", "en", async () => {
    throw new Error("chunk rejected");
  }), unavailable);
  assert.deepEqual(await loadCourseShellProgress("grok", "en", async () => ({})), unavailable);
  assert.deepEqual(await loadCourseShellProgress("grok", "en", async () => ({
    createPublishedProgressAdapters: () => [],
  })), unavailable);
  assert.deepEqual(await loadCourseShellProgress("grok", "en", async () => ({
    createPublishedProgressAdapters: () => [{
      courseId: "grok",
      progressEvent: "grok:progress",
      readSummary: () => { throw new Error("adapter read failed"); },
    }],
  })), unavailable);

  assert.deepEqual(await loadCourseShellProgress("grok", "en", async () => ({
    createPublishedProgressAdapters: () => [{
      courseId: "grok",
      progressEvent: "grok:progress",
      readSummary: () => ({ state: "in-progress", percent: 42, nextHref: "/en/grok/next/" }),
    }],
  })), { state: "in-progress", percent: 42, nextHref: "/en/grok/next/" });
});

test("CourseShell transfers fragment focus only for an unmodified primary activation", () => {
  const activation = {
    altKey: false,
    button: 0,
    ctrlKey: false,
    currentTarget: { target: "" },
    defaultPrevented: false,
    metaKey: false,
    shiftKey: false,
  };
  assert.equal(shouldTransferCourseShellFocus(activation), true);
  assert.equal(shouldTransferCourseShellFocus({ ...activation, defaultPrevented: true }), false);
  assert.equal(shouldTransferCourseShellFocus({ ...activation, button: 1 }), false);
  assert.equal(shouldTransferCourseShellFocus({ ...activation, ctrlKey: true }), false);
  assert.equal(shouldTransferCourseShellFocus({ ...activation, metaKey: true }), false);
  assert.equal(shouldTransferCourseShellFocus({ ...activation, shiftKey: true }), false);
  assert.equal(shouldTransferCourseShellFocus({ ...activation, altKey: true }), false);
  assert.equal(shouldTransferCourseShellFocus({
    ...activation,
    currentTarget: { target: "_blank" },
  }), false);
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
