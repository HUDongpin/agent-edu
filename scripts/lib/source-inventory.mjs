import { execFileSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

// Dependencies and files produced during build are not part of the uploaded
// source contract. Vercel does not upload .git, so scanners must not depend on
// repository metadata being present after the source bundle is unpacked.
const FALLBACK_EXCLUDED_ROOTS = new Set([
  ".git",
  ".next",
  ".vercel",
  "blob-report",
  "browser-evidence",
  "build",
  "coverage",
  "node_modules",
  "out",
  "output",
  "playwright-report",
  "test-results",
  "tmp",
]);

function normalized(root, absolute) {
  return relative(root, absolute).split(sep).join("/");
}

function walkUploadedSource(root) {
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name);
      const path = normalized(root, absolute);
      const topLevel = path.split("/", 1)[0];
      if (entry.isDirectory()) {
        if (!path.includes("/") && FALLBACK_EXCLUDED_ROOTS.has(topLevel)) continue;
        visit(absolute);
      } else {
        // Keep non-regular entries in the inventory. The consuming security
        // scanner will reject them instead of following a symlink.
        files.push(path);
      }
    }
  };
  visit(root);
  return files.sort();
}

export function sourceInventory(options = {}) {
  const root = resolve(options.root ?? process.cwd());
  if (!existsSync(root)) throw new Error(`source root does not exist: ${root}`);

  try {
    const raw = execFileSync(
      "git",
      ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
      {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    return {
      mode: "git",
      files: raw
        .split("\0")
        .filter(Boolean)
        .filter((file) => existsSync(join(root, file)))
        .sort(),
    };
  } catch {
    return {
      mode: "uploaded-source",
      files: walkUploadedSource(root),
    };
  }
}
