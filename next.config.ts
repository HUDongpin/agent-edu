import type { NextConfig } from "next";

/**
 * Static export on purpose.
 *
 * Nothing on this site needs a server: the handbook is scripted, and the lab
 * talks to the model provider straight from the browser with the reader's own
 * key. Exporting to plain files keeps hosting free, keeps GitHub Pages working
 * as a mirror, and means there is no runtime that can go down or leak a key.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,           // so /es/handbook/ resolves on plain file hosts
  images: { unoptimized: true }, // no image server in a static export
};

export default nextConfig;
