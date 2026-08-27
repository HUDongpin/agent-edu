from pathlib import Path
import sys

import numpy as np

# Keep the pure truth module importable when Manim loads this file by path.
SCENE_DIRECTORY = Path(__file__).resolve().parent
if str(SCENE_DIRECTORY) not in sys.path:
    sys.path.insert(0, str(SCENE_DIRECTORY))

from manim import *
from math_truth import format_slope, function, secant_state

# The CLI's -r option changes pixels but does not recalculate the logical frame.
# Set the logical width before Manim instantiates the scene camera.
config.frame_width = config.frame_height * config.pixel_width / config.pixel_height


class SecantToTangent(Scene):
    def construct(self):
        vertical = config.pixel_height > config.pixel_width
        axes = Axes(
            x_range=[-3, 3, 1],
            y_range=[0, 9, 1],
            x_length=3.8 if vertical else 7,
            y_length=3.5 if vertical else 4.5,
            tips=False,
        )
        if vertical:
            axes.shift(UP * 0.6)
        graph = axes.plot(function, x_range=[-3, 3], color=BLUE)
        h = ValueTracker(2.0)
        a = 1.0

        def state():
            return secant_state(a, h.get_value())

        fixed_point = Dot(axes.c2p(*state().fixed_point), color=YELLOW)
        moving_point = Dot(axes.c2p(*state().moving_point), color=TEAL)
        moving_point.add_updater(
            lambda point: point.move_to(axes.c2p(*state().moving_point))
        )
        def secant_line():
            fixed = np.array(axes.c2p(*state().fixed_point))
            moving = np.array(axes.c2p(*state().moving_point))
            direction = moving - fixed
            length = np.linalg.norm(direction)
            unit_direction = direction / length
            extension = max(0.5, (3.6 - length) / 2)
            return Line(
                fixed - unit_direction * extension,
                moving + unit_direction * extension,
                color=WHITE,
            )

        secant = always_redraw(secant_line)

        def slope_readout():
            readout = VGroup(
                Text("h", font_size=22),
                Text(f"{h.get_value():.2f}", font_size=22),
                Text("secant slope", font_size=22),
                Text(format_slope(a, h.get_value()), font_size=22),
            ).arrange(RIGHT)
            return (
                readout.next_to(axes, DOWN, buff=0.25)
                if vertical
                else readout.to_corner(UR)
            )

        slope = always_redraw(slope_readout)

        self.play(Create(axes), Create(graph))
        self.play(FadeIn(fixed_point, moving_point), Create(secant), FadeIn(slope))
        self.play(h.animate.set_value(0.08), run_time=4, rate_func=smooth)
        limit_statement = Text(
            "h -> 0+; slope -> 2"
            if vertical
            else "motion: h -> 0+; algebra: slope -> 2",
            font_size=22 if vertical else 24,
        ).to_edge(DOWN, buff=0.45)
        if vertical and limit_statement.width > config.frame_width - 0.6:
            limit_statement.scale_to_fit_width(config.frame_width - 0.6)
        self.play(FadeIn(limit_statement))
        self.wait(0.5)
