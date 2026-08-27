import assert from "node:assert/strict";
import test from "node:test";
import { courseLabCommand } from "../scripts/check-course-labs.mjs";

const IDS = [
  "responsible-ai",
  "ai-research",
  "ai-python-data",
  "machine-learning",
  "deep-learning",
  "production-ai",
] as const;

test("every Course 16-21 release has an executable clean-run and destructive-test command", () => {
  for (const courseId of IDS) {
    const profile = courseLabCommand(courseId, "/project");
    assert.ok(profile.command);
    assert.ok(profile.args.length);
    if (courseId === "ai-python-data" || courseId === "machine-learning") {
      assert.equal(profile.command, process.execPath);
      assert.ok(profile.args.includes("tests/course18-19-labs.test.ts"));
      assert.ok(profile.args.includes(`--test-name-pattern=${courseId}`));
    } else {
      assert.equal(profile.command, "python3");
      assert.match(profile.args[0], new RegExp(`${courseId}/lab/test_lab\\.py$`));
    }
  }
});

test("an unregistered course cannot inherit another course's executable verdict", () => {
  assert.throws(
    () => courseLabCommand("invented-course", "/project"),
    /No executable lab test registered/,
  );
});
