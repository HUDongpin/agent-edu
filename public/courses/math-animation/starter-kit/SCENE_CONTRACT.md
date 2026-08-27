# Scene contract: secant becomes tangent

## Mathematical truth

- Function: `f: [-3, 3] -> R`, `f(x) = x^2`.
- Fixed x-coordinate: `a = 1`; `P = (a, f(a)) = (1, 1)`.
- Moving point: `Q_h = (a+h, f(a+h))`, where positive `h` decreases from `2` to `0.08` and `h` never equals `0`.
- Secant slope: `m_h = (f(a+h) - f(a)) / h = 2a + h` for every nearby `h != 0`.
- The motion depicts `h -> 0+`. Because the identity also holds for `h < 0`, the algebra establishes the two-sided limit `lim(h -> 0) m_h = 2a`.

## Scene grammar

1. Establish axes, curve, and fixed point.
2. Introduce the moving point and secant line.
3. Decrease `h` while the point, line, and numeric slope update from the same tracker.
4. Freeze at `h = 0.08`, label the motion as `h -> 0+`, then state in the narration or transcript that the algebra establishes the two-sided limit.

## Acceptance checks

- Render and review the responsive scene separately at 16:9 and 9:16; do not treat a center crop of the landscape MP4 as portrait acceptance.
- Labels remain inside the safe area of each separately rendered aspect ratio.
- The displayed slope equals `2a+h` within `0.01` at every sampled checkpoint.
- The scene and invariant test both consume `secant_state`; the test compares its analytic slope, point-derived line slope, and formatted readout.
- The same two point objects persist through the change.
- The renderer never evaluates the secant expression at `h = 0`.
- A still sequence and transcript communicate the same conclusion when continuous motion is reduced.
- The final release records the engine revision, environment, render command, frame paths, media probe, and rights status.
- The automated invariant does not inspect pixels; a human or visual test must review the five exported keyframes for binding, clipping, and legibility.
