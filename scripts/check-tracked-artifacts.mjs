import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { sourceInventory } from "./lib/source-inventory.mjs";

/**
 * These paths are deterministic build/test/render output, never release
 * evidence. Keep the rules root-anchored where possible so a legitimate
 * course fixture cannot be rejected merely because a directory has a common
 * name such as `output`.
 */
const FORBIDDEN = [
  ["dependency-tree", /(^|\/)node_modules\//],
  ["next-build", /^(?:\.next|out|build|coverage)\//],
  ["temporary-output", /^tmp\//],
  ["legacy-output-root", /^outputs\//],
  ["browser-run", /^(?:playwright-report|test-results|blob-report|browser-evidence)\//],
  ["playwright-private", /^\.playwright-(?:cli|raw|private|evidence-contract-safe|evidence-contract-private)\//],
  ["os-metadata", /(^|\/)\.DS_Store$/],
];

export function artifactFindings(files) {
  return files.flatMap((file) =>
    FORBIDDEN.filter(([, pattern]) => pattern.test(file)).map(([id]) => ({ id, file })),
  );
}

export function checkTrackedArtifacts(options = {}) {
  const root = resolve(options.root ?? process.cwd());
  const inventory = sourceInventory({ root });
  const files = inventory.files;
  const findings = artifactFindings(files);
  if (findings.length) {
    console.error("tracked-artifacts: FAIL — generated output is tracked");
    for (const finding of findings) console.error(`  ${finding.id}: ${finding.file}`);
    throw new Error(`${findings.length} generated artifact(s) are tracked`);
  }
  console.log(`tracked-artifacts: ${files.length} ${inventory.mode} files checked; PASS`);
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  try {
    checkTrackedArtifacts();
  } catch (error) {
    if (!(error instanceof Error) || !/generated artifact/.test(error.message)) {
      console.error("tracked-artifacts: scanner error — " + (error instanceof Error ? error.message : String(error)));
    }
    process.exitCode = 1;
  }
}
