import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import CourseList from "../components/CourseList";
import {
  COURSES,
  filterCourses,
  transitionFilter,
  type Filter,
} from "../lib/courses";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("all leaves the course list intact", () => {
  assert.deepEqual(filterCourses(COURSES, "all"), COURSES);
});

test("complete returns only completed courses", () => {
  assert.deepEqual(
    filterCourses(COURSES, "complete").map((course) => course.id),
    [1, 4],
  );
});

test("keyboard-contract: selecting Incomplete applies the pure filter transition", () => {
  const selected = transitionFilter("all", "incomplete" as Filter);
  assert.equal(selected, "incomplete");
  assert.deepEqual(
    filterCourses(COURSES, selected).map((course) => course.id),
    [2, 3],
  );
});

test("keyboard-contract: Incomplete renders as the selected native button", () => {
  const markup = renderToStaticMarkup(<CourseList initialFilter={"incomplete" as Filter} />);
  const incomplete = markup.match(/<button\b([^>]*)>Incomplete<\/button>/);
  const all = markup.match(/<button\b([^>]*)>All<\/button>/);

  assert.ok(incomplete, "rendered output must include the Incomplete control");
  assert.ok(all, "rendered output must include the All control");
  assert.match(incomplete[1], /\btype="button"/);
  assert.match(incomplete[1], /\baria-pressed="true"/);
  assert.match(all[1], /\baria-pressed="false"/);
  assert.match(markup, /<div\b[^>]*\brole="group"[^>]*\baria-label="Filter courses"/);
});

test("the original routes remain in place", async () => {
  await Promise.all([
    readFile(path.join(ROOT, "app/page.tsx")),
    readFile(path.join(ROOT, "app/courses/page.tsx")),
  ]);
});
