#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const GIT_SHA = /^[0-9a-f]{40}$/;
const DEPLOYMENT_ID = /^dpl_[A-Za-z0-9]{8,124}$/;

function deploymentUrl(value) {
  if (value === undefined || value === "") return null;
  if (typeof value !== "string" || !/^[A-Za-z0-9.-]+\.vercel\.app$/.test(value)) {
    throw new Error("VERCEL_URL must be one bare vercel.app hostname");
  }
  return `https://${value}`;
}

export function resolveReleaseCommit(options = {}) {
  const env = options.env ?? process.env;
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  for (const key of ["VERCEL_GIT_COMMIT_SHA", "GITHUB_SHA"]) {
    const value = env[key];
    if (typeof value !== "string" || value.length === 0) continue;
    if (!GIT_SHA.test(value)) throw new Error(`${key} must be one lowercase 40-character Git SHA`);
    return value;
  }
  const value = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  if (!GIT_SHA.test(value)) throw new Error("git rev-parse HEAD did not return a release commit SHA");
  return value;
}

export function releaseMetadata(options = {}) {
  const env = options.env ?? process.env;
  const commitSha = options.commitSha ?? resolveReleaseCommit(options);
  if (!GIT_SHA.test(commitSha)) throw new Error("release metadata commit must be a lowercase Git SHA");
  const environment = typeof env.VERCEL_ENV === "string" && env.VERCEL_ENV.length > 0
    ? env.VERCEL_ENV
    : "local";
  if (!["local", "preview", "production"].includes(environment)) {
    throw new Error("VERCEL_ENV must be local, preview, or production");
  }
  const deploymentId = env.VERCEL_DEPLOYMENT_ID || null;
  if (deploymentId !== null && !DEPLOYMENT_ID.test(deploymentId)) {
    throw new Error("VERCEL_DEPLOYMENT_ID must be one Vercel deployment ID");
  }
  const boundDeploymentUrl = deploymentUrl(env.VERCEL_URL);
  if (["preview", "production"].includes(environment) && (!deploymentId || !boundDeploymentUrl)) {
    const label = environment === "preview" ? "Preview" : "Production";
    throw new Error(`${label} builds require VERCEL_DEPLOYMENT_ID and VERCEL_URL`);
  }
  return {
    schema: "agent-edu.release-build.v1",
    commitSha,
    environment,
    deploymentId,
    deploymentUrl: boundDeploymentUrl,
  };
}

export function generateReleaseMetadata(options = {}) {
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const output = resolve(
    projectRoot,
    options.output ?? join("out", ".well-known", "release.json"),
  );
  const metadata = releaseMetadata({ ...options, projectRoot });
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(metadata, null, 2)}\n`, { mode: 0o644 });
  console.log(`release metadata: ${metadata.commitSha} -> ${output}`);
  return { metadata, output };
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  try {
    generateReleaseMetadata();
  } catch (error) {
    console.error(`release metadata: FAIL — ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
