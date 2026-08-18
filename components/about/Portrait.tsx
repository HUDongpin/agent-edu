/**
 * A generated monogram, used instead of a photograph.
 *
 * Two reasons, both deliberate: hotlinking a headshot would add an external
 * request to a site whose whole claim is that it makes none, and re-hosting
 * someone else's portrait is not ours to do. The mark echoes the logo's
 * summit motif so the page still looks designed rather than unfinished.
 */
export default function Portrait({
  initials, hue, size = 84,
}: { initials: string; hue: string; size?: number }) {
  return (
    <div className="portrait" style={{ width: size, height: size, color: hue }} aria-hidden="true">
      <svg viewBox="0 0 84 84">
        <circle cx="42" cy="42" r="41" fill="currentColor" opacity=".12" />
        <circle cx="42" cy="42" r="41" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".4" />
        <path d="M20 74 L42 24 L64 74" fill="none" stroke="currentColor" strokeWidth="2"
          opacity=".22" strokeLinecap="round" strokeLinejoin="round" />
        <text x="42" y="42" textAnchor="middle" dominantBaseline="central"
          fontSize="29" fontWeight="700" fill="currentColor"
          fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
          {initials}
        </text>
      </svg>
    </div>
  );
}
