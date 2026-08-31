import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Course 15 resume targets dedicated assessment and capstone routes", () => {
  const interactions = readFileSync(
    "components/agent-orchestration/Interactions.tsx",
    "utf8",
  );
  assert.match(
    interactions,
    /`\/\$\{locale\}\/agent-orchestration\/assessment\/`/u,
  );
  assert.match(
    interactions,
    /`\/\$\{locale\}\/agent-orchestration\/capstone\/`/u,
  );
  assert.doesNotMatch(interactions, /#agent-orchestration-(?:assessment|capstone-title)/u);
});
