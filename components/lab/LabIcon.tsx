import type { SVGProps } from "react";

export type LabIconName =
  | "blocks"
  | "chart"
  | "check"
  | "external"
  | "key"
  | "lock"
  | "message"
  | "minus"
  | "phone"
  | "plus"
  | "warning";

type LabIconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  name: LabIconName;
};

/** A small, consistent outline icon set for the Lab's instructional UI. */
export default function LabIcon({ name, className = "", ...props }: LabIconProps) {
  return (
    <svg
      {...props}
      aria-hidden="true"
      className={`lab-icon ${className}`.trim()}
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {name === "key" && (
        <>
          <circle cx="7.5" cy="15.5" r="4.5" />
          <path d="m10.7 12.3 8-8M16 7l2 2M13.5 9.5l2 2" />
        </>
      )}
      {name === "check" && <path d="m5 12.5 4.2 4.2L19 7" />}
      {name === "lock" && (
        <>
          <rect height="10" rx="2" width="16" x="4" y="11" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </>
      )}
      {name === "phone" && (
        <path d="M21 16.4v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.7 2 2 0 0 1 3.1 1.5h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L7 9.5a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" />
      )}
      {name === "blocks" && (
        <>
          <rect height="7" rx="1.5" width="7" x="3" y="4" />
          <rect height="7" rx="1.5" width="7" x="14" y="4" />
          <rect height="7" rx="1.5" width="7" x="8.5" y="15" />
        </>
      )}
      {name === "message" && (
        <path d="M21 12a8 8 0 0 1-8 8H5l-3 2 1.2-4.5A9 9 0 1 1 21 12Z" />
      )}
      {name === "chart" && (
        <>
          <path d="M4 20V10M10 20V5M16 20v-8M3 20h18" />
          <path d="m4 7 5-3 5 4 6-5" />
        </>
      )}
      {name === "warning" && (
        <>
          <path d="M10.3 3.7 2.1 18a2 2 0 0 0 1.7 3h16.4a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4M12 17h.01" />
        </>
      )}
      {name === "plus" && <path d="M12 5v14M5 12h14" />}
      {name === "minus" && <path d="M5 12h14" />}
      {name === "external" && (
        <>
          <path d="M15 4h5v5M10 14 20 4" />
          <path d="M20 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6" />
        </>
      )}
    </svg>
  );
}
