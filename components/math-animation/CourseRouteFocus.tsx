"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const COURSE_HEADING_SELECTOR = "h1[data-course19-heading]";

function isFullyVisible(target: HTMLElement) {
  const { top, right, bottom, left, width, height } = target.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

  return (
    width > 0 &&
    height > 0 &&
    top >= 0 &&
    left >= 0 &&
    right <= viewportWidth &&
    bottom <= viewportHeight
  );
}

export default function CourseRouteFocus() {
  const pathname = usePathname();
  const hasMounted = useRef(false);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      previousPathname.current = pathname;
      return;
    }

    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    const frame = window.requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>(COURSE_HEADING_SELECTOR);
      if (!heading) return;

      if (isFullyVisible(heading)) {
        heading.focus({ preventScroll: true });
        return;
      }

      heading.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
