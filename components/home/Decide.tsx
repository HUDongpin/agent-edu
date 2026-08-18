/**
 * The whole subject, in two pictures.
 *
 * The home page states the idea — "every program is a list of steps, the only
 * question is who picks them" — and then asks the reader to take four hours on
 * the strength of it. Someone who has never written code has no image to hang
 * that sentence on, so the diagrams supply one: the same run of steps, decided
 * two different ways.
 *
 * They use the handbook's own colour vocabulary (blue = a person fixed this in
 * advance, amber = a model chose it while the program was running) so the
 * picture a reader meets here is the picture they meet again on every diagram
 * in Part 1.
 *
 * The only glyphs are numerals and a question mark. The page around them is
 * translated into nine languages; words baked into an SVG would not be, and a
 * caption in the wrong language is worse than no caption.
 */

const W = 54;   // step box width
const H = 32;   // step box height

function Defs() {
  return (
    <defs>
      <marker id="dc-tip" viewBox="0 0 8 8" refX="7.5" refY="4"
        markerWidth="5" markerHeight="5" orient="auto-start-reverse">
        <path d="M0 .5 L8 4 L0 7.5 z" fill="context-stroke" />
      </marker>
    </defs>
  );
}

/** Four steps, every one of them chosen before the program ever ran. */
export function FixedSteps() {
  const xs = [6, 76, 146, 216];
  return (
    <svg viewBox="0 0 288 80" className="dcsvg" role="img" aria-hidden="true">
      <Defs />
      {xs.map((x, i) => (
        <g key={x}>
          <rect x={x} y={24} width={W} height={H} rx={7} className="dc-box h" />
          <text x={x + W / 2} y={45} className="dc-t">{i + 1}</text>
          {i < xs.length - 1 && (
            <path d={`M${x + W} 40 h9`} className="dc-edge" markerEnd="url(#dc-tip)" fill="none" />
          )}
        </g>
      ))}
    </svg>
  );
}

/** The same run, except step two is left open until the moment it happens. */
export function ModelStep() {
  return (
    <svg viewBox="0 0 288 80" className="dcsvg" role="img" aria-hidden="true">
      <Defs />

      <rect x={6} y={24} width={W} height={H} rx={7} className="dc-box h" />
      <text x={33} y={45} className="dc-t">1</text>
      <path d="M60 40 h9" className="dc-edge" markerEnd="url(#dc-tip)" fill="none" />

      {/* the moment the choice is actually made */}
      <rect x={76} y={20} width={44} height={40} rx={7} className="dc-box m" />
      <text x={98} y={48} className="dc-t m big">?</text>

      {/* three futures fan out; only one of them happens */}
      <path d="M120 40 C133 40 133 11 142 11" className="dc-edge ghost" markerEnd="url(#dc-tip)" fill="none" />
      <path d="M120 40 h22" className="dc-edge" markerEnd="url(#dc-tip)" fill="none" />
      <path d="M120 40 C133 40 133 69 142 69" className="dc-edge ghost" markerEnd="url(#dc-tip)" fill="none" />

      <rect x={148} y={2} width={W} height={18} rx={6} className="dc-box ghost" />
      <rect x={148} y={31} width={W} height={18} rx={6} className="dc-box m" />
      <text x={175} y={45} className="dc-t m">2</text>
      <rect x={148} y={60} width={W} height={18} rx={6} className="dc-box ghost" />

      <path d="M202 40 h9" className="dc-edge" markerEnd="url(#dc-tip)" fill="none" />
      <rect x={216} y={24} width={W} height={H} rx={7} className="dc-box h" />
      <text x={243} y={45} className="dc-t">3</text>
    </svg>
  );
}
