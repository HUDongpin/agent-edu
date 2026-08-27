"""Pure mathematical state shared by the scene and its invariant test."""

from dataclasses import dataclass


CHECKPOINTS = (2.0, 1.0, 0.5, 0.1, 0.08)


def function(x: float) -> float:
    return x**2


def secant_slope(a: float, h: float) -> float:
    if h == 0:
        raise ValueError("h must stay non-zero in the secant scene")
    return (function(a + h) - function(a)) / h


@dataclass(frozen=True)
class SecantState:
    fixed_point: tuple[float, float]
    moving_point: tuple[float, float]
    slope: float


def secant_state(a: float, h: float) -> SecantState:
    """Return the two points and their slope from one checked state."""
    slope = secant_slope(a, h)
    return SecantState(
        fixed_point=(a, function(a)),
        moving_point=(a + h, function(a + h)),
        slope=slope,
    )


def format_slope(a: float, h: float) -> str:
    """Match the two-decimal readout rendered by the scene."""
    return f"{secant_state(a, h).slope:.2f}"
