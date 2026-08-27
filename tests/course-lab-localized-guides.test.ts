import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

const ROOT = resolve(import.meta.dirname, "..");

const CONTRACTS = [
  ["responsible-ai", "ResponsibleAiStudio.tsx", "lab-provenance.v1.json"],
  ["ai-python-data", "AiPythonDataLab.tsx", "provenance.v1.json"],
  ["machine-learning", "MachineLearningLab.tsx", "provenance.v1.json"],
  ["deep-learning", "DeepLearningLab.tsx", "provenance.json"],
  ["production-ai", "ProductionAiLab.tsx", "provenance.json"],
] as const;

function sha256(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("Course 16 and 18-21 publish hash-bound Simplified Chinese run guides", () => {
  for (const [courseId, componentName, provenanceName] of CONTRACTS) {
    const courseDirectory = join(ROOT, "public/courses", courseId);
    const english = readFileSync(join(courseDirectory, "lab/README.md"));
    const simplifiedChinese = readFileSync(join(courseDirectory, "lab/README.zh-Hans.md"));
    assert.ok(english.length > 0, `${courseId} English guide is empty`);
    assert.match(simplifiedChinese.toString("utf8"), /[\u3400-\u9fff]/u);

    const provenance = JSON.parse(
      readFileSync(join(courseDirectory, provenanceName), "utf8"),
    ) as {
      resources?: Array<{ path: string; sha256: string; origin?: string; role?: string }>;
      files?: Array<{ path: string; sha256: string; origin?: string; role?: string }>;
    };
    const record = [...(provenance.resources ?? []), ...(provenance.files ?? [])]
      .find((item) => item.path === "lab/README.zh-Hans.md");
    assert.ok(record, `${courseId} Chinese guide is absent from provenance`);
    assert.equal(record.sha256, sha256(simplifiedChinese));
    assert.match(`${record.origin ?? ""} ${record.role ?? ""}`, /review remains pending/i);

    const component = readFileSync(
      join(ROOT, "components", courseId, componentName),
      "utf8",
    );
    assert.match(component, /locale === "zh-Hans"/);
    assert.match(component, /README\.zh-Hans\.md/);
    assert.match(component, /README\.md/);
  }
});

test("localized guides preserve the executable command and no-deploy boundaries", () => {
  const commandByCourse = new Map([
    ["responsible-ai", "validate.py"],
    ["ai-python-data", "run_notebook.py"],
    ["machine-learning", "run_pipeline.py"],
    ["deep-learning", "run_experiment.py"],
    ["production-ai", "run_capstone.py"],
  ]);
  for (const [courseId] of CONTRACTS) {
    const guide = readFileSync(
      join(ROOT, "public/courses", courseId, "lab/README.zh-Hans.md"),
      "utf8",
    );
    assert.ok(guide.includes(commandByCourse.get(courseId) ?? "missing-command"));
    assert.match(guide, /no-deploy|不授权真实部署/);
  }
});
