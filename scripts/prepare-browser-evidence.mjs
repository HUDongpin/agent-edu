import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function prepareBrowserEvidence() {
  const root = resolve("browser-evidence");
  rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: true, mode: 0o700 });
}

export default function globalSetup() {
  prepareBrowserEvidence();
}

if (
  process.argv[1]
  && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
) {
  prepareBrowserEvidence();
}
