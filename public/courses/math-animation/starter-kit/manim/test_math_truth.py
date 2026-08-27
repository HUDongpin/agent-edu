from math import isclose

from math_truth import CHECKPOINTS, format_slope, secant_state


# Positive checkpoints match the depicted motion; negative samples verify the two-sided algebra.
for checkpoint in (*CHECKPOINTS, -0.08, -0.5, -1.0):
    state = secant_state(1.0, checkpoint)
    line_slope = (
        (state.moving_point[1] - state.fixed_point[1])
        / (state.moving_point[0] - state.fixed_point[0])
    )
    displayed_value = float(format_slope(1.0, checkpoint))
    expected = 2.0 + checkpoint
    assert isclose(state.slope, expected, abs_tol=1e-9), (
        checkpoint,
        state.slope,
        expected,
    )
    assert isclose(line_slope, state.slope, abs_tol=1e-9)
    assert isclose(displayed_value, state.slope, abs_tol=0.01)

print("mathematical invariant: pass")
