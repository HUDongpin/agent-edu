/**
 * Course covers, generated rather than drawn.
 *
 * Six SVG motifs keyed to the course id, tinted with that course's hue. Two of
 * them — `tools` and `cost` — belong to courses that are specified in
 * `docs/course-briefs/` but not yet built, and are kept so their catalogue rows
 * can return without anyone opening a drawing tool. No
 * image files: they stay crisp at any size, weigh nothing, follow the theme,
 * and a new course gets a cover without anyone opening a design tool. Each
 * motif echoes what the course is actually about, so they are distinguishable
 * at a glance rather than decorative noise.
 */
export default function Cover({ id, hue }: { id: string; hue: string }) {
  const motif: Record<string, React.ReactNode> = {
    // steps descending — "a list of steps"
    handbook: (
      <>
        <rect x="24" y="96" width="46" height="14" rx="4" fill="currentColor" opacity=".28" />
        <rect x="24" y="74" width="76" height="14" rx="4" fill="currentColor" opacity=".46" />
        <rect x="24" y="52" width="106" height="14" rx="4" fill="currentColor" opacity=".66" />
        <rect x="24" y="30" width="136" height="14" rx="4" fill="currentColor" />
      </>
    ),
    // a rising bar chart — "watch the number move"
    lab: (
      <>
        <rect x="26" y="80" width="22" height="30" rx="4" fill="currentColor" opacity=".3" />
        <rect x="56" y="62" width="22" height="48" rx="4" fill="currentColor" opacity=".5" />
        <rect x="86" y="44" width="22" height="66" rx="4" fill="currentColor" opacity=".72" />
        <rect x="116" y="26" width="22" height="84" rx="4" fill="currentColor" />
        <path d="M28 74 L67 56 L97 38 L127 22" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" opacity=".55" strokeDasharray="5 5" />
      </>
    ),
    // a loop with a node — the agent loop
    build: (
      <>
        <path d="M50 40 h60 a26 26 0 0 1 0 52 h-60 a26 26 0 0 1 0-52 z"
          fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
        <circle cx="50" cy="66" r="11" fill="currentColor" />
        <circle cx="110" cy="66" r="7" fill="currentColor" opacity=".5" />
      </>
    ),
    // interlocking blocks — tools
    tools: (
      <>
        <rect x="30" y="36" width="52" height="40" rx="7" fill="currentColor" opacity=".75" />
        <rect x="92" y="60" width="52" height="40" rx="7" fill="currentColor" opacity=".45" />
        <path d="M82 56 h10 v20 h-10 z" fill="currentColor" opacity=".9" />
      </>
    ),
    // a falling stack — cost coming down
    cost: (
      <>
        <rect x="28" y="30" width="26" height="80" rx="5" fill="currentColor" />
        <rect x="64" y="52" width="26" height="58" rx="5" fill="currentColor" opacity=".66" />
        <rect x="100" y="74" width="26" height="36" rx="5" fill="currentColor" opacity=".42" />
        <rect x="136" y="90" width="26" height="20" rx="5" fill="currentColor" opacity=".26" />
      </>
    ),
    // a gate in a path — human in the loop
    hitl: (
      <>
        <path d="M24 68 h44" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        <path d="M122 68 h44" stroke="currentColor" strokeWidth="8" strokeLinecap="round" opacity=".45" />
        <rect x="80" y="36" width="30" height="64" rx="8" fill="currentColor" />
        <circle cx="95" cy="58" r="6" fill="var(--card)" />
      </>
    ),
  };

  return (
    <div className="cover" style={{ color: hue }} aria-hidden="true">
      <svg viewBox="0 0 190 140" preserveAspectRatio="xMidYMid meet">
        {motif[id] ?? motif.handbook}
      </svg>
    </div>
  );
}
