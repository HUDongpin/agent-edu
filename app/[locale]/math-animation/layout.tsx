import type { ReactNode } from "react";
import CourseRouteFocus from "@/components/math-animation/CourseRouteFocus";

export default function MathAnimationLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <CourseRouteFocus />
      {children}
    </>
  );
}
