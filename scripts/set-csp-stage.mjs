import { readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  CSP_HEADER_BY_STAGE,
  assertCspConfiguration,
  findCspHeaders,
} from "./check-csp.mjs";

function isStage(value) {
  return Object.hasOwn(CSP_HEADER_BY_STAGE, value);
}

export function transitionCspStage(stageConfig, vercelConfig, targetStage) {
  if (!isStage(targetStage)) {
    throw new Error("target stage must be report-only or enforced");
  }
  assertCspConfiguration(stageConfig, vercelConfig);

  const nextStageConfig = structuredClone(stageConfig);
  const nextVercelConfig = structuredClone(vercelConfig);
  nextStageConfig.stage = targetStage;
  const [csp] = findCspHeaders(nextVercelConfig);
  csp.header.key = CSP_HEADER_BY_STAGE[targetStage];

  assertCspConfiguration(nextStageConfig, nextVercelConfig);
  if (nextStageConfig.policy !== stageConfig.policy || csp.header.value !== stageConfig.policy) {
    throw new Error("stage transition attempted to change the reviewed policy");
  }
  return { stageConfig: nextStageConfig, vercelConfig: nextVercelConfig };
}

function writeJsonReplacement(path, value) {
  const temporary = path + ".tmp-" + process.pid;
  try {
    writeFileSync(temporary, JSON.stringify(value, null, 2) + "\n", { encoding: "utf8", flag: "wx" });
    renameSync(temporary, path);
  } finally {
    try {
      unlinkSync(temporary);
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("ENOENT")) throw error;
    }
  }
}

export function setCspStage(targetStage, project = process.cwd()) {
  const root = resolve(project);
  const stagePath = join(root, "config", "csp-stage.json");
  const vercelPath = join(root, "vercel.json");
  const stageConfig = JSON.parse(readFileSync(stagePath, "utf8"));
  const vercelConfig = JSON.parse(readFileSync(vercelPath, "utf8"));
  const next = transitionCspStage(stageConfig, vercelConfig, targetStage);

  if (stageConfig.stage === targetStage) {
    console.log("csp: already at " + targetStage + "; configuration verified; no files changed");
    return;
  }

  writeJsonReplacement(vercelPath, next.vercelConfig);
  writeJsonReplacement(stagePath, next.stageConfig);
  console.log(
    "csp: moved local deployment configuration from " + stageConfig.stage + " to " + targetStage +
      "; external response-header verification remains pending",
  );
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  try {
    if (process.argv.length !== 3) throw new Error("usage: npm run csp:set -- report-only|enforced");
    setCspStage(process.argv[2]);
  } catch (error) {
    console.error("csp:set: FAIL — " + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  }
}
