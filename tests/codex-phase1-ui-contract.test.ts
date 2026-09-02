import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("Course 2 uses one progress-aware outline for desktop and compact mobile navigation", () => {
  assert.equal(existsSync("components/codex/CourseOutline.tsx"), true);
  const lesson = read("components/codex/LessonView.tsx");
  const outline = read("components/codex/CourseOutline.tsx");
  const lessonStates = read("components/codex/useCodexLessonStates.ts");
  assert.match(lesson, /<CourseOutline/u);
  assert.doesNotMatch(lesson, /<aside className=\{styles\.lessonRail\}>/u);
  assert.match(outline, /<details/u);
  assert.match(outline, /aria-current=\{[^}]*"page"/u);
  assert.match(outline, /useCodexLessonStates/u);
  assert.match(lessonStates, /lessonProgressKey/u);
  assert.match(outline, /completedLesson/u);
  assert.match(outline, /recommendedNextLesson/u);
  assert.match(outline, /scrollTop/u);
});

test("Course 2 completion is a truthful reversible action", () => {
  const completion = read("components/codex/LessonCompletion.tsx");
  assert.match(completion, /markIncomplete/u);
  assert.match(completion, /delete progress\[key\]/u);
  assert.match(completion, /complete \? labels\.markIncomplete : labels\.markComplete/u);
  assert.doesNotMatch(completion, /aria-pressed/u);
  assert.doesNotMatch(completion, /aria-disabled=\{complete/u);
});

test("Course 2 reset reports persistence failure instead of unconditional success", () => {
  const progress = read("components/codex/CourseProgress.tsx");
  assert.match(progress, /const reset = resetCodexProgress\(\)/u);
  assert.match(progress, /reset\.persisted/u);
  assert.match(progress, /resetSessionOnly/u);
});

test("Course 2 capstone protects and clears its session draft", () => {
  const capstone = read("components/codex/CapstoneReceipt.tsx");
  assert.match(capstone, /CODEX_CAPSTONE_DRAFT_STORAGE_KEY/u);
  assert.match(capstone, /sessionStorage/u);
  assert.match(capstone, /CODEX_PROGRESS_RESET_EVENT/u);
  assert.match(capstone, /name="codex-capstone-receipt"/u);
  assert.match(capstone, /beforeunload/u);
  assert.match(capstone, /receiptDraftRestored/u);
});

test("Course 2 interaction and narrow-layout CSS meets the approved floor", () => {
  const styles = read("components/codex/CodexCourse.module.css");
  assert.match(styles, /\.primaryAction,[\s\S]*?min-block-size:\s*44px/u);
  assert.doesNotMatch(styles, /\.figurePending\s*\{[^}]*min-block-size:\s*190px/u);
  assert.match(styles, /\.lessonRailMobile/u);
  assert.match(styles, /\.lessonRailMobile\s+summary[\s\S]*?min-block-size:\s*(?:44|48)px/u);
  assert.match(styles, /touch-action:\s*manipulation/u);
});

test("Course 2 hides both the current mobile crumb and its separator", () => {
  const styles = read("components/codex/CodexCourse.module.css");
  assert.match(
    styles,
    /\.breadcrumbs\s*>\s*span:nth-child\(2\)[\s\S]*?\.breadcrumbs\s*>\s*span:last-child[\s\S]*?display:\s*none/u,
  );
});
