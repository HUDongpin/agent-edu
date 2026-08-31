#!/usr/bin/env node

import { writeFileSync } from "node:fs";

import {
  COURSE20_EXPORT_MANIFEST_PATH,
  createCourse20ExportState,
} from "./agentic-video-editing-export-state.mjs";

const exportState = createCourse20ExportState();
if (!exportState.sourcePrecedesExport) {
  throw new Error(
    `Refusing to bless a stale Course 20 export: source=${exportState.sourceNewestMtime} export=${exportState.exportOldestMtime}`,
  );
}

const generatedAt = new Date();
if (generatedAt.getTime() < Date.parse(exportState.exportNewestMtime)) {
  throw new Error(
    `Refusing to timestamp Course 20 before its newest export file: export=${exportState.exportNewestMtime} now=${generatedAt.toISOString()}`,
  );
}

const state = {
  ...exportState,
  generatedAt: generatedAt.toISOString(),
};

writeFileSync(
  COURSE20_EXPORT_MANIFEST_PATH,
  `${JSON.stringify(state, null, 2)}\n`,
  "utf8",
);

process.stdout.write(
  `Course 20 schema-${state.schema} export manifest written: ${state.routeCount} routes, ${state.assetFileCount} page assets, ${state.exportFileCount} full-export files; source ${state.sourceHash.slice(0, 12)}, HTML ${state.exportHtmlHash.slice(0, 12)}, assets ${state.assetHash.slice(0, 12)}, full export ${state.exportHash.slice(0, 12)}.\n`,
);
