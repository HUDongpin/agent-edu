"use client";

import { useEffect, useRef } from "react";
import FC from "@/lib/flowchart";

/** The numbered "method strip" that opens each section. */
export default function Strip({
  steps,
  caption,
}: {
  steps: [string, string][];
  caption?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = "";
      FC.strip(ref.current, steps, caption);
    }
  }, [steps, caption]);
  return <div ref={ref} />;
}
