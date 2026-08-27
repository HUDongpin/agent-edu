import type { NextConfig } from "next";
import { createRequire } from "node:module";

// Next 16's legacy TypeScript config loader compiles this source in memory.
// Anchor relative config dependencies to the config filename explicitly so the
// documented `next build [directory]` command is independent of the shell cwd.
const requireFromConfig = createRequire(
  typeof __filename === "string" ? __filename : import.meta.url,
);
const { deterministicBuildId } = requireFromConfig(
  "./lib/deterministic-build-id.cjs",
) as { deterministicBuildId: () => string };

/**
 * Static export on purpose.
 *
 * Nothing on this site needs a server: the handbook is scripted, and the lab
 * talks to the model provider straight from the browser with the reader's own
 * key. Exporting to plain files keeps hosting free, keeps GitHub Pages working
 * as a mirror, and means there is no runtime that can go down or leak a key.
 *
 * `output: "export"` is applied to builds only. In `next dev` it makes the
 * router eagerly pre-generate every dynamic path and log a spurious
 * "missing param" error for /[locale] on every start — noise that would
 * happily hide a real error. Builds are unaffected: `next build` runs with
 * NODE_ENV=production and still exports every statically declared route.
 */
const isBuild = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  ...(isBuild ? { output: "export" as const } : {}),
  // The default random ID makes identical source trees emit different files.
  // Hashing public build inputs also avoids a permanent ID and stale manifests.
  generateBuildId: async () => deterministicBuildId(),
  trailingSlash: true,           // so /es/handbook/ resolves on plain file hosts
  images: { unoptimized: true }, // no image server in a static export
};

export default nextConfig;
