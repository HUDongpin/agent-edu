"use client";

import type { KeyboardEvent } from "react";

const ARROW_SCROLL_STEP = 48;

export default function KeyboardScrollableCode({
  labelledBy,
  value,
}: {
  labelledBy: string;
  value: string;
}) {
  const scrollWithArrowKeys = (event: KeyboardEvent<HTMLPreElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    const region = event.currentTarget;
    if (region.scrollWidth <= region.clientWidth) return;

    const direction = event.key === "ArrowRight" ? 1 : -1;
    const maximum = region.scrollWidth - region.clientWidth;
    const next = Math.min(maximum, Math.max(0, region.scrollLeft + direction * ARROW_SCROLL_STEP));
    if (next === region.scrollLeft) return;

    event.preventDefault();
    region.scrollLeft = next;
  };

  return (
    <pre
      dir="ltr"
      tabIndex={0}
      aria-labelledby={labelledBy}
      translate="no"
      onKeyDown={scrollWithArrowKeys}
    >
      <code>{value}</code>
    </pre>
  );
}
