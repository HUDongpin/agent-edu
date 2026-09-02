import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Course 15 resume targets dedicated assessment and capstone routes", () => {
  const courseProgress = readFileSync(
    "components/agent-orchestration/CourseProgress.tsx",
    "utf8",
  );
  assert.match(
    courseProgress,
    /`\/\$\{locale\}\/agent-orchestration\/assessment\/`/u,
  );
  assert.match(
    courseProgress,
    /`\/\$\{locale\}\/agent-orchestration\/capstone\/`/u,
  );
  assert.doesNotMatch(courseProgress, /#agent-orchestration-(?:assessment|capstone-title)/u);
});
