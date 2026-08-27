"use client";

import { useSyncExternalStore } from "react";
import { Analytics } from "@vercel/analytics/next";

/**
 * Keep the exported application byte-for-byte independent of build-host
 * markers. Analytics is enabled at runtime only on the public site or a Vercel
 * preview; local/static browser audits therefore do not request a production
 * endpoint, while the same client bundle is reviewed for every deployment.
 */
export default function ProductionAnalytics() {
  const enabled = useSyncExternalStore(
    () => () => {},
    () => {
      const hostname = window.location.hostname.toLocaleLowerCase("en-US");
      return hostname === "aicourse.top" || hostname.endsWith(".vercel.app");
    },
    () => false,
  );

  return enabled ? <Analytics /> : null;
}
