"use client";

import { useEffect } from "react";

const DISCLOSURE_SELECTOR = "details[data-course3-disclosure]";

/**
 * Browsers fire beforeprint/afterprint around their print dialog. Open only
 * the Course 3 disclosures that were closed, then restore exactly that set.
 * This keeps screen disclosure native and server-rendered while preventing a
 * printout from silently dropping reference material in engines that do not
 * yet expose the ::details-content print hook.
 */
export default function Course3PrintDisclosures() {
  useEffect(() => {
    const openedForPrint = new Set<HTMLDetailsElement>();
    const openDisclosures = () => {
      for (const disclosure of document.querySelectorAll<HTMLDetailsElement>(DISCLOSURE_SELECTOR)) {
        if (!disclosure.open) {
          disclosure.open = true;
          openedForPrint.add(disclosure);
        }
      }
    };
    const restoreDisclosures = () => {
      for (const disclosure of openedForPrint) {
        if (disclosure.isConnected) disclosure.open = false;
      }
      openedForPrint.clear();
    };

    window.addEventListener("beforeprint", openDisclosures);
    window.addEventListener("afterprint", restoreDisclosures);
    return () => {
      window.removeEventListener("beforeprint", openDisclosures);
      window.removeEventListener("afterprint", restoreDisclosures);
      restoreDisclosures();
    };
  }, []);

  return null;
}
