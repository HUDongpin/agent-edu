import { createHash } from "node:crypto";
import {
  lstatSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

export const FORBIDDEN_PACKAGE_MANAGER_SIDECARS = [
  ".npmrc",
  "npm-shrinkwrap.json",
  "yarn.lock",
  ".yarnrc",
  ".yarnrc.yml",
  ".yarn",
  ".pnp.cjs",
  ".pnp.js",
  ".pnp.loader.mjs",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  ".pnpmfile.cjs",
  ".pnpmfile.js",
  "bun.lock",
  "bun.lockb",
  "bunfig.toml",
];

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  return value;
}

export function canonicalJsonSha256(value) {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex");
}

export function packageFilesMatchBaseline(root, fixture) {
  try {
    const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const packageLock = JSON.parse(readFileSync(join(root, "package-lock.json"), "utf8"));
    return canonicalJsonSha256(packageJson) === fixture.packageJsonSha256 &&
      canonicalJsonSha256(packageLock) === fixture.packageLockSha256 &&
      FORBIDDEN_PACKAGE_MANAGER_SIDECARS.every((entry) => {
        try {
          lstatSync(join(root, entry));
          return false;
        } catch (error) {
          if (error?.code === "ENOENT") return true;
          throw error;
        }
      });
  } catch {
    return false;
  }
}

export function frozenFileMatchesBaseline(root, relativePath, expectedSha256) {
  try {
    const target = join(root, relativePath);
    const stat = lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink()) return false;
    return createHash("sha256").update(readFileSync(target)).digest("hex") === expectedSha256;
  } catch {
    return false;
  }
}

export function clearReceipt(receiptFile) {
  rmSync(receiptFile, { force: true });
}

export function writeReceiptAtomically(receiptFile, receipt) {
  const temporaryFile = `${receiptFile}.tmp`;
  try {
    rmSync(temporaryFile, { force: true });
    writeFileSync(temporaryFile, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
    renameSync(temporaryFile, receiptFile);
  } catch (error) {
    rmSync(temporaryFile, { force: true });
    throw error;
  }
}
