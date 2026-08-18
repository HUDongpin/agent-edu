/* eslint-disable @next/next/no-img-element */

/**
 * A portrait, or a generated monogram when there is no photograph.
 *
 * Photos are self-hosted in /public/team rather than hotlinked, so the page
 * still makes no third-party request. Only the people whose portraits are
 * published on the project's own sites have one; the rest fall back to a
 * monogram that echoes the logo's summit motif, so a missing photo reads as
 * a design choice rather than a broken image.
 *
 * `object-position` is per-person because a portrait cropped to a circle
 * needs to be centred on the face, not on the middle of the frame.
 */
export default function Portrait({
  initials, hue, size = 84, photo, focus,
}: {
  initials: string; hue: string; size?: number;
  photo?: string; focus?: string;
}) {
  if (photo) {
    return (
      <div className="portrait photo" style={{ width: size, height: size, color: hue }}>
        <img src={photo} alt="" width={size} height={size} loading="lazy" decoding="async"
          style={{ objectPosition: focus ?? "center 30%" }} />
      </div>
    );
  }
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
