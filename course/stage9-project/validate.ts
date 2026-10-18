/**
 * Check that an eval file has the shape of eval-template.json.
 *
 *   npx tsx course/stage9-project/validate.ts
 *   npx tsx course/stage9-project/validate.ts course/stage9-project/eval-template.json
 *
 * The shipped template is a shape, with three placeholder cases, so that path
 * only has to have three. Any other file is the learner's, and needs five:
 * the first hour asks for an ordinary case, a boundary, a hostile one, and
 * two more. Placeholders do not have to be rewritten for this check to pass.
 */
import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL(".", import.meta.url));
export const TEMPLATE_PATH = resolve(HERE, "eval-template.json");
export const LEARNER_MIN_CASES = 5;
export const TEMPLATE_MIN_CASES = 3;
export const RISKS = ["reversible", "review-required", "irreversible"] as const;

export type Risk = (typeof RISKS)[number];
export type Issue = { readonly path: string; readonly message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRisk(value: unknown): value is Risk {
  return typeof value === "string" && (RISKS as readonly string[]).includes(value);
}

/** Absolute path, so a relative argument from the repo root matches the template. */
export function minimumFor(file: string): number {
  const absolute = isAbsolute(file) ? resolve(file) : resolve(process.cwd(), file);
  return absolute === TEMPLATE_PATH ? TEMPLATE_MIN_CASES : LEARNER_MIN_CASES;
}

export function validateEvalDocument(value: unknown, minimumCases: number): Issue[] {
  if (!isRecord(value)) return [{ path: "", message: "the file must be a JSON object" }];
  const issues: Issue[] = [];
  if (typeof value.version !== "number" || !Number.isFinite(value.version)) {
    issues.push({ path: "version", message: "version must be a number" });
  }
  if (typeof value.systemUnderTest !== "string") {
    issues.push({ path: "systemUnderTest", message: "systemUnderTest must be a string" });
  }
  if (typeof value.scoringRule !== "string") {
    issues.push({ path: "scoringRule", message: "scoringRule must be a string" });
  }
  if (!Array.isArray(value.cases)) {
    issues.push({ path: "cases", message: "cases must be an array" });
  } else {
    if (value.cases.length < minimumCases) {
      issues.push({
        path: "cases",
        message: `needs at least ${minimumCases} cases, found ${value.cases.length}`,
      });
    }
    value.cases.forEach((item, index) => {
      const where = `cases[${index}]`;
      if (!isRecord(item)) {
        issues.push({ path: where, message: "each case must be an object" });
        return;
      }
      for (const key of ["id", "input", "expectedEvidence"] as const) {
        if (typeof item[key] !== "string" || item[key].trim() === "") {
          issues.push({ path: `${where}.${key}`, message: `${key} must be a non-empty string` });
        }
      }
      if (!isRisk(item.risk)) {
        issues.push({
          path: `${where}.risk`,
          message: `risk must be one of ${RISKS.join(", ")}`,
        });
      }
    });
  }
  if (!Array.isArray(value.runs)) {
    issues.push({ path: "runs", message: "runs must be an array" });
  }
  return issues;
}

function main(): void {
  const arg = process.argv[2];
  const file = arg ? (isAbsolute(arg) ? resolve(arg) : resolve(process.cwd(), arg)) : TEMPLATE_PATH;
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`FAIL  ${file}\n  ${message}`);
    process.exit(1);
  }
  const minimum = minimumFor(file);
  const issues = validateEvalDocument(parsed, minimum);
  if (issues.length) {
    console.error(`FAIL  ${file}`);
    for (const issue of issues) {
      console.error(`  ${issue.path ? `${issue.path}: ` : ""}${issue.message}`);
    }
    process.exit(1);
  }
  const count = (parsed as { cases: unknown[] }).cases.length;
  console.log(`PASS  ${count} cases in ${file}`);
  if (minimum === TEMPLATE_MIN_CASES) {
    console.log(
      `NOTE  a learner file needs at least ${LEARNER_MIN_CASES} cases. ` +
      "This template is the shape, not the finished set.",
    );
  }
}

if (import.meta.filename === process.argv[1]) main();
