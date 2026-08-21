import type { NextConfig } from "next";

/**
 * Static export on purpose.
 *
 * Nothing on this site needs a server: the handbook is scripted, and the lab
 * talks to the model provider straight from the browser with the reader's own
 * key. Exporting to plain files keeps hosting free, keeps GitHub Pages working
 * as a mirror. Browser, hosting, analytics and provider trust boundaries still
 * exist and are documented; static export only removes an application backend.
 *
 * `output: "export"` is applied to builds only. In `next dev` it makes the
 * router eagerly pre-generate every dynamic path and log a spurious
 * "missing param" error for /[locale] on every start — noise that would
 * happily hide a real error. Builds are unaffected: `next build` runs with
 * NODE_ENV=production and exports the routes in config/route-manifest.json.
 */
const isBuild = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  ...(isBuild ? { output: "export" as const } : {}),
  typescript: {
    // Vercel deliberately omits course/, browser tests and secret scanners
    // from the website upload. Keep the production type-check scoped to the
    // code that is actually deployed; the full repository remains covered by
    // `npx tsc --noEmit` in CI.
    tsconfigPath: isBuild ? "tsconfig.build.json" : "tsconfig.json",
  },
  experimental: { globalNotFound: true },
  trailingSlash: true,           // so /es/handbook/ resolves on plain file hosts
  images: { unoptimized: true }, // no image server in a static export
};

export default nextConfig;
