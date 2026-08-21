import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const LOCALES = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"];
const BUILD_TRUTH_KEYS = ["c.build.blurb", "build.lede", "build.beforeTime"];

test("Part 3 names nine guided stages 0–8 and a distinct Stage 9 transfer project", () => {
  const stageFolders = readdirSync("course", { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^stage\d+-/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  assert.deepEqual(stageFolders.map((name) => Number(/^stage(\d+)-/.exec(name)?.[1])), [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
  ]);
  assert.match(readFileSync("course/check.ts", "utf8"), /course\/check\.ts <0-8>/);
  for (const artifact of ["README.md", "artifact-template.md", "eval-template.json", "RUBRIC.md"]) {
    assert.equal(
      readdirSync("course/stage9-project").includes(artifact),
      true,
      `Stage 9 transfer artifact missing: ${artifact}`,
    );
  }

  for (const locale of LOCALES) {
    const catalog = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8")) as Record<string, string>;
    for (const key of BUILD_TRUTH_KEYS) {
      const value = catalog[key];
      assert.equal(typeof value, "string", `${locale}:${key} must exist`);
      assert.match(value, /0[^\d]{0,3}8[\s\S]*9/, `${locale}:${key} must distinguish 0–8 from 9`);
    }
  }

  const rootReadme = readFileSync("README.md", "utf8");
  const courseReadme = readFileSync("course/README.md", "utf8");
  assert.match(rootReadme, /nine guided TypeScript stages \(0–8\).*Stage 9 transfer project/);
  assert.match(courseReadme, /nine guided stages \(0–8\), then a Stage 9 transfer project/);
  assert.match(courseReadme, /## The nine guided stages \(0–8\)/);
});
