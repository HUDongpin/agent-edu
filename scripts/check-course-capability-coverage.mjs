#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseReference(value) {
  const [courseId, ...rest] = value.split(":");
  return { courseId, target: rest.join(":") };
}

export function evaluateCapabilityCoverage({
  coverage,
  moduleIdsByCourse,
  assessmentIds,
  artifactIdsByCourse,
}) {
  const issues = [];
  for (const retirement of coverage) {
    if (!retirement.requiredCapabilities.length) {
      issues.push(`${retirement.legacyId} has no required capability list.`);
    }
    if (new Set(retirement.requiredCapabilities).size !== retirement.requiredCapabilities.length) {
      issues.push(`${retirement.legacyId} repeats a required capability.`);
    }
    for (const placement of retirement.modules) {
      const available = moduleIdsByCourse.get(placement.courseId);
      if (!available) {
        issues.push(`${retirement.legacyId} references unknown course ${placement.courseId}.`);
        continue;
      }
      for (const slug of placement.slugs) {
        if (!available.has(slug)) {
          issues.push(`${retirement.legacyId} references missing ${placement.courseId}/${slug}.`);
        }
      }
    }
    for (const assessmentId of retirement.assessmentIds) {
      const reference = parseReference(assessmentId);
      if (!reference.target) {
        if (!assessmentIds.has(assessmentId)) {
          issues.push(`${retirement.legacyId} references missing assessment ${assessmentId}.`);
        }
        continue;
      }
      const [moduleSlug, kind] = reference.target.split(":");
      if (kind === "checkpoint") {
        if (!moduleIdsByCourse.get(reference.courseId)?.has(moduleSlug)) {
          issues.push(`${retirement.legacyId} references missing checkpoint ${assessmentId}.`);
        }
      } else if (!assessmentIds.has(reference.target)) {
        issues.push(`${retirement.legacyId} references missing assessment ${assessmentId}.`);
      }
    }
    for (const capstoneRef of retirement.capstoneRefs) {
      const reference = parseReference(capstoneRef);
      const isModule = moduleIdsByCourse.get(reference.courseId)?.has(reference.target) === true;
      const isArtifact = artifactIdsByCourse.get(reference.courseId)?.has(reference.target) === true;
      if (!isModule && !isArtifact) {
        issues.push(`${retirement.legacyId} references missing capstone evidence ${capstoneRef}.`);
      }
    }
    if (!retirement.appliedEvidence.length
        || retirement.appliedEvidence.some((description) => description.trim().length < 24)) {
      issues.push(`${retirement.legacyId} lacks substantive applied-evidence descriptions.`);
    }
  }
  return issues;
}

export async function checkCourseCapabilityCoverage(projectRoot = ROOT) {
  const root = resolve(projectRoot);
  const cache = `capability-coverage=${Date.now()}`;
  const [coverageModule, coursesModule, mcpModule, orchestrationModule, courseKitRegistry] = await Promise.all([
    import(`${pathToFileURL(join(root, "lib/course-capability-coverage.ts")).href}?${cache}`),
    import(`${pathToFileURL(join(root, "lib/courses.ts")).href}?${cache}`),
    import(`${pathToFileURL(join(root, "lib/mcp/index.ts")).href}?${cache}`),
    import(`${pathToFileURL(join(root, "lib/agent-orchestration/index.ts")).href}?${cache}`),
    import(`${pathToFileURL(join(root, "lib/course-kit/registry.ts")).href}?${cache}`),
  ]);

  const moduleIdsByCourse = new Map([
    ["mcp", new Set(mcpModule.MCP_LESSONS.map((lesson) => lesson.slug))],
    [
      "agent-orchestration",
      new Set(orchestrationModule.AGENT_ORCHESTRATION_COURSE_MANIFEST.modules.map((moduleManifest) => moduleManifest.slug)),
    ],
    ...courseKitRegistry.COURSE_KIT_DEFINITIONS.map((definition) => [
      definition.manifest.id,
      new Set(definition.manifest.modules.map((moduleManifest) => moduleManifest.slug)),
    ]),
  ]);
  const assessmentIds = new Set([
    ...mcpModule.MCP_FINAL_ASSESSMENT.map((question) => question.id),
    ...courseKitRegistry.COURSE_KIT_DEFINITIONS.flatMap((definition) => (
      definition.quiz.questions.map((question) => question.id)
    )),
  ]);
  const artifactIdsByCourse = new Map(
    courseKitRegistry.COURSE_KIT_DEFINITIONS.map((definition) => [
      definition.manifest.id,
      new Set(definition.capstone.artifacts.map((artifact) => artifact.id)),
    ]),
  );

  const issues = evaluateCapabilityCoverage({
    coverage: coverageModule.RETIRED_MODULE_COVERAGE,
    moduleIdsByCourse,
    assessmentIds,
    artifactIdsByCourse,
  });
  if (coursesModule.UPCOMING_MODULES.length !== 0) {
    issues.push("UPCOMING_MODULES must stay empty after legacy capability retirement.");
  }

  const scopedPaths = [
    "lib/courses.ts",
    "components/courses/Catalog.tsx",
    "components/courses/Cover.tsx",
  ];
  const scopedText = scopedPaths
    .filter((path) => existsSync(join(root, path)))
    .map((path) => readFileSync(join(root, path), "utf8"))
    .join("\n");
  for (const ghost of ["ai-teaching", 'id: "tools"', 'id: "cost"', 'id: "hitl"']) {
    if (scopedText.includes(ghost)) issues.push(`Retired or ghost catalogue ID remains: ${ghost}.`);
  }
  if (/href:\s*["']#["']/.test(scopedText)) {
    issues.push("A catalogue placeholder still uses href '#'.");
  }

  return {
    ok: issues.length === 0,
    retiredIds: coverageModule.RETIRED_MODULE_COVERAGE.map((item) => item.legacyId),
    capabilityCount: coverageModule.RETIRED_MODULE_COVERAGE.reduce(
      (sum, item) => sum + item.requiredCapabilities.length,
      0,
    ),
    issues,
  };
}

const invoked = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  const result = await checkCourseCapabilityCoverage();
  if (process.argv.includes("--json")) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`retired capability coverage: ${result.ok ? "PASS" : "FAIL"}`);
    console.log(`${result.capabilityCount} required capabilities cover ${result.retiredIds.join(", ")}`);
    for (const issue of result.issues) console.log(`  ${issue}`);
  }
  if (!result.ok) process.exitCode = 1;
}
