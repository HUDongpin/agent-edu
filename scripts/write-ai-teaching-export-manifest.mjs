#!/usr/bin/env node

import { writeFileSync } from "node:fs";

import {
  COURSE18_EXPORT_MANIFEST_PATH,
  createCourse18ExportState,
} from "./ai-teaching-export-state.mjs";

const exportState = createCourse18ExportState();
if (!exportState.sourcePrecedesExport) {
  throw new Error(
    `Refusing to bless a stale Course 18 export: source=${exportState.sourceNewestMtime} export=${exportState.exportOldestMtime}`,
  );
}

const state = {
  ...exportState,
  generatedAt: new Date().toISOString(),
};

writeFileSync(
  COURSE18_EXPORT_MANIFEST_PATH,
  `${JSON.stringify(state, null, 2)}\n`,
  "utf8",
);

process.stdout.write(
  `Course 18 export manifest written: ${state.routeCount} routes, ${state.exportFileCount} files, source ${state.sourceHash.slice(0, 12)}, HTML ${state.exportHtmlHash.slice(0, 12)}, full export ${state.exportHash.slice(0, 12)}.\n`,
);
