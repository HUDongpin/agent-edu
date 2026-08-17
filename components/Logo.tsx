/**
 * The mark: the letter A as a mountain — "AI" and "the top" in one shape —
 * crowned by the PedaNova star.
 *
 * The A is `currentColor` so each surface picks the right depth of brand blue.
 * PedaNova's light blue is only 1.68:1 on white, so the light theme uses the
 * same hue deepened (see --logo-a in globals.css); dark gets the exact colour.
 * The star keeps its own two tones in both themes.
 */
export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="6.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 43.5 L24 15.5 L39.5 43.5" />
        <path d="M16 33 H32" />
      </g>
      <path
        d="M24.00 1.30C25.21 4.58 27.46 7.19 30.30 8.60C27.46 10.01 25.21 12.62 24.00 15.90C22.79 12.62 20.54 10.01 17.70 8.60C20.54 7.19 22.79 4.58 24.00 1.30Z"
        fill="#F7C948"
      />
      <path
        d="M24.00 5.68C24.44 7.14 25.26 8.09 26.52 8.60C25.26 9.11 24.44 10.06 24.00 11.52C23.56 10.06 22.74 9.11 21.48 8.60C22.74 8.09 23.56 7.14 24.00 5.68Z"
        fill="#90D0F5"
      />
    </svg>
  );
}
