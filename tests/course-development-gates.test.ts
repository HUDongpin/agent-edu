import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { deriveCourseDevelopmentGatePlan } from "../scripts/run-course-development-gates.mjs";

test("ordinary build development gates derive every authored course from the registry", () => {
  const contract = JSON.parse(readFileSync("config/course-release-surface.json", "utf8"));
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  const plan: Array<{
    courseId: string;
    state: string;
    developmentGate: string;
  }> = deriveCourseDevelopmentGatePlan(contract, packageJson);
  assert.deepEqual(
    plan.map((entry) => entry.courseId),
    contract.courses.filter((course: { state: string }) => course.state !== "roadmap")
      .map((course: { id: string }) => course.id),
  );
  assert.ok(plan.every((entry) => !entry.developmentGate.endsWith(":release")));
  assert.ok(plan.some((entry) => entry.courseId === "codex" && entry.state === "blocked"));

  const packageScripts = packageJson.scripts;
  assert.match(packageScripts.build, /npm run courses:check:development/);
  assert.match(packageScripts["verify:source"], /npm run courses:check:development/);
});
