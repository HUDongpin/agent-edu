"use client";

import { useEffect, useRef } from "react";
import FC, { type FCSpec, type FCHandle } from "@/lib/flowchart";

/**
 * A thin React wrapper over the imperative engine.
 *
 * React owns the <svg> element; the engine fills it. That split is on
 * purpose — it keeps the drawing code identical to the version that was
 * verified, while still letting the diagram sit in a component tree.
 */
export default function Flowchart({
  spec,
  caption,
  onReady,
}: {
  spec: FCSpec;
  caption?: string;
  onReady?: (h: FCHandle) => void;
}) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";           // redraw cleanly on spec change
    const handle = FC.draw(ref.current, spec);
    onReady?.(handle);
    // onReady is intentionally excluded: callers pass inline closures, and
    // re-running the draw on every render would throw away widget state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec]);

  return (
    <figure className="fcwrap">
      <svg ref={ref} viewBox={spec.viewBox} role="img" aria-label={caption ?? "diagram"} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
