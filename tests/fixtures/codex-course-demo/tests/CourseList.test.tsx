import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { afterEach } from "node:test";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CourseList from "../components/CourseList";
import { COURSES, filterCourses, type Filter } from "../lib/courses";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

afterEach(cleanup);

test("all leaves the course list intact", () => {
  assert.deepEqual(filterCourses(COURSES, "all"), COURSES);
});

test("complete returns only completed courses", () => {
  assert.deepEqual(
    filterCourses(COURSES, "complete").map((course) => course.id),
    [1, 4],
  );
});

test("incomplete returns only unfinished courses", () => {
  assert.deepEqual(
    filterCourses(COURSES, "incomplete" as Filter).map((course) => course.id),
    [2, 3],
  );
});

test("the Incomplete control keeps native keyboard button behaviour for pointer, Enter, and Space", async () => {
  const source = await readFile(path.join(ROOT, "components/CourseList.tsx"), "utf8");
  assert.match(source, /label:\s*["']Incomplete["']/);
  assert.match(source, /<button\b/);
  assert.match(source, /type=["']button["']/);
  assert.match(source, /aria-pressed=/);
  assert.match(source, /role=["']group["']/);
  assert.match(source, /aria-label=["']Filter courses["']/);
  assert.doesNotMatch(source, /<(?:div|span)[^>]+onClick=/);
  assert.doesNotMatch(source, /onKeyDown=.*preventDefault/);

  const user = userEvent.setup();
  render(<CourseList />);
  const group = screen.getByRole("group", { name: "Filter courses" });
  const all = within(group).getByRole("button", { name: "All" });
  const incomplete = within(group).getByRole("button", { name: "Incomplete" });

  assert.equal(incomplete.getAttribute("type"), "button");
  assert.equal(incomplete.getAttribute("aria-pressed"), "false");

  await user.click(incomplete);
  assert.equal(incomplete.getAttribute("aria-pressed"), "true");
  assert.equal(screen.queryByText("Agentic Engineering"), null);
  assert.ok(screen.getByText("How to Use Codex"));
  assert.ok(screen.getByText("Evaluation in Practice"));

  await user.click(all);
  incomplete.focus();
  await user.keyboard("{Enter}");
  assert.equal(incomplete.getAttribute("aria-pressed"), "true");

  await user.click(all);
  incomplete.focus();
  await user.keyboard(" ");
  assert.equal(incomplete.getAttribute("aria-pressed"), "true");
});

test("the original routes remain in place", async () => {
  await Promise.all([
    readFile(path.join(ROOT, "app/page.tsx")),
    readFile(path.join(ROOT, "app/courses/page.tsx")),
  ]);
});
