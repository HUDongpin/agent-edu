import type { ReactNode } from "react";

export type IconName = "menu" | "close" | "globe" | "sun" | "moon" | "system";

function glyph(name: IconName): ReactNode {
  switch (name) {
    case "menu":
      return <path d="M4 7h16M4 12h16M4 17h16" />;
    case "close":
      return <path d="m6 6 12 12M18 6 6 18" />;
    case "globe":
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.35 2.47 3.55 5.47 3.55 9S14.35 18.53 12 21c-2.35-2.47-3.55-5.47-3.55-9S9.65 5.47 12 3Z" />
        </>
      );
    case "sun":
      return (
        <>
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
        </>
      );
    case "moon":
      return <path d="M20.4 14.45A8.5 8.5 0 0 1 9.55 3.6 8.5 8.5 0 1 0 20.4 14.45Z" />;
    case "system":
      return (
        <>
          <rect x="3" y="3" width="18" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </>
      );
  }
}

/** Decorative outline icons for controls that already expose accessible labels. */
export default function Icon({
  name,
  size = 20,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {glyph(name)}
    </svg>
  );
}
