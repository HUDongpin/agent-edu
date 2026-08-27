# Course 19 starter kit

This kit contains original course examples. It does not vendor Manim, Motion Canvas, Remotion, or any third-party skill.

## Kit contents

- [`SCENE_CONTRACT.md`](./SCENE_CONTRACT.md): mathematical truth, scene grammar, and acceptance checks.
- [`SOURCE_SNAPSHOT.json`](./SOURCE_SNAPSHOT.json): self-contained immutable engine pins and third-party rights boundaries.
- [`LICENSE`](./LICENSE): the MIT license carried with these original course examples.
- [`AGENTS.md`](./AGENTS.md) and [`CLAUDE.md`](./CLAUDE.md): bounded project instructions for the two coding agents.
- [`manim/math_truth.py`](./manim/math_truth.py): pure secant state shared by the scene and its test.
- [`manim/scene.py`](./manim/scene.py): a Manim Community scene that keeps `h` non-zero, reads its geometry and displayed value from the shared state, and reveals the limit only after the visual change.
- [`manim/test_math_truth.py`](./manim/test_math_truth.py): eight deterministic state checks (five positive checkpoints and three negative samples) of the analytic slope, line geometry, and formatted readout.
- [`motion-canvas/unit-circle.tsx`](./motion-canvas/unit-circle.tsx): one signal synchronizing a unit-circle point, projection, and sine trace.
- [`TRANSCRIPT.md`](./TRANSCRIPT.md): the static mathematical equivalent for reduced-motion and non-visual review.
- [`export.sh`](./export.sh): H.264 normalization, five sampled keyframes, and an `ffprobe` receipt for a rendered MP4.

The course overview also offers this directory as one downloadable ZIP, so a static host does not need to expose directory browsing.

## Core Manim Community smoke path

The research render used the source repository at an immutable commit because the package registry and GitHub release pages did not present an identical version story during the snapshot.

```bash
git clone --filter=blob:none https://github.com/ManimCommunity/manim.git vendor/manim
git -C vendor/manim checkout 1dc796e9652273950d9863b35746c7329888e384
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python -e vendor/manim
.venv/bin/manim -ql --disable_caching manim/scene.py SecantToTangent
.venv/bin/python manim/test_math_truth.py
sh export.sh media/videos/scene/480p15/SecantToTangent.mp4 output/landscape

# Render the responsive scene separately for a portrait deliverable.
.venv/bin/manim -ql -r 480,854 --disable_caching manim/scene.py SecantToTangent
sh export.sh media/videos/scene/854p15/SecantToTangent.mp4 output/portrait
```

Requirements outside Python may include Cairo, Pango, FFmpeg, and `pkg-config`. The included scene uses Pango-backed `Text` for its words and numeric readout, so this first smoke path does not require LaTeX. Add formula rendering only after the environment report confirms LaTeX or Typst. The pure test verifies the state consumed by the scene; it does not inspect rendered pixels. Review the five files under each output directory to confirm that the visible point, line, and readout stay aligned. Portrait is a separate responsive render, not a center-crop claim about the landscape MP4.

## Agent sequence

1. Read `SCENE_CONTRACT.md`.
2. Read `AGENTS.md` or `CLAUDE.md`.
3. Run the invariant test before editing.
4. Render low quality.
5. Export and inspect five sampled frames.
6. Change only one scene beat at a time.
7. Re-run the invariant, render, media probe, crop, accessibility, and rights checks.

## Motion Canvas comparison

`motion-canvas/unit-circle.tsx` is an original scene fragment for the 3.17.2 comparison track. On 2026-08-26, the included file was copied into a fresh official scaffold and passed `npx tsc --noEmit` plus the Vite production build, which transformed 1084 modules. Create your own fresh project, audit its generated lock file and advisories, then repeat those checks. No final Motion Canvas video export is claimed.

See `SOURCE_SNAPSHOT.json` for the dependencies used by this kit and `LICENSE` for the permission carried with the original examples. The hosted course also publishes a broader nine-repository lock and source notice beside the download.
