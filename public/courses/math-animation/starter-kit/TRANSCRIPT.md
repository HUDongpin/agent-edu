# Static equivalent: secant becomes tangent

The curve is `f(x) = x²`. A fixed point remains at `(1, 1)`. A second point sits at `(1 + h, (1 + h)²)`, where positive `h` starts at `2` and decreases to `0.08` without ever becoming zero. The rendered motion therefore depicts the right-hand approach `h -> 0+`.

The line through the two points is a secant. Its slope is:

```text
((1 + h)² - 1²) / h = 2 + h
```

As `h` becomes smaller, the moving point approaches the fixed point and the secant line approaches the tangent direction. The sampled slopes are:

| h | secant slope |
|---:|---:|
| 2.00 | 4.00 |
| 1.00 | 3.00 |
| 0.50 | 2.50 |
| 0.10 | 2.10 |
| 0.08 | 2.08 |

Only after those observations does the scene state the conclusion. The identity `m_h = 2 + h` holds for every nearby nonzero `h`, including negative `h`, so the algebra establishes the two-sided limit `m_h -> 2` as `h -> 0`. The positive-only motion does not by itself establish that two-sided claim, and the animation never substitutes `h = 0` into the secant expression.

This text and the table preserve the mathematical conclusion without requiring continuous motion. They do not replace the separate keyframe, crop, contrast, or screen-reader review required before release.
