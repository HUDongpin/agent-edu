export type TabOrientation = "horizontal" | "vertical";

export const HANDBOOK_WIDE_BREAKPOINT = 980;
export const HANDBOOK_WIDE_QUERY = `(min-width: ${HANDBOOK_WIDE_BREAKPOINT}px)`;

export function handbookOrientation(width: number): TabOrientation {
  return width >= HANDBOOK_WIDE_BREAKPOINT ? "vertical" : "horizontal";
}

export function tabTargetIndex(
  key: string,
  current: number,
  count: number,
  orientation: TabOrientation,
  rtl = false,
): number | null {
  if (count < 1) return null;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;

  let delta = 0;
  if (orientation === "vertical") {
    if (key === "ArrowDown") delta = 1;
    else if (key === "ArrowUp") delta = -1;
  } else if (key === "ArrowRight") {
    delta = rtl ? -1 : 1;
  } else if (key === "ArrowLeft") {
    delta = rtl ? 1 : -1;
  }

  return delta === 0 ? null : (current + delta + count) % count;
}
