#!/usr/bin/env node

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  assertReleaseArtifactsCurrent,
  projectAuthoredCourseRouteWrappers as projectAuthoredCourseRouteWrappersV3,
  projectCourseReleaseSurface,
  projectPublicCourseSurface as projectPublicCourseSurfaceV3,
  syncCourseReleaseArtifacts,
  validateCourseReleaseManifest,
} from "./lib/course-release-manifest.mjs";

export {
  assertReleaseArtifactsCurrent,
  projectCourseReleaseSurface,
  validateCourseReleaseManifest,
};

export function projectPublicCourseSurface(manifest, source) {
  return projectPublicCourseSurfaceV3(manifest, source);
}

export function projectAuthoredCourseRouteWrappers(manifest, projectRoot = process.cwd()) {
  return projectAuthoredCourseRouteWrappersV3(manifest, projectRoot);
}

export function syncPublicCourseSurface(options = {}) {
  return syncCourseReleaseArtifacts(options);
}

const invoked = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  try {
    const result = syncPublicCourseSurface({ check: process.argv.includes("--check") });
    console.log(
      `release manifest projections: ${result.changed ? "updated" : "current"} — `
      + result.sourceSha256,
    );
  } catch (error) {
    console.error(
      `release manifest projections: FAIL — ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}
