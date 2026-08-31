# Course 19 research brief: mathematical animation with Codex and Claude

Snapshot date: 2026-08-26
Course route: `/[locale]/math-animation/`
Decision owner: aicourse.top Course 19

## Executive decision

Course 19 should not distribute attention evenly across every animation repository. It should teach one reliable core, two bounded alternative tracks, and a verification method learners can reuse after versions change.

1. Use [Manim Community](https://github.com/ManimCommunity/manim) v0.21.0 as the default mathematical animation engine.
2. Use [Manim Slides](https://github.com/jeertmans/manim-slides) v5.6.0 and [Manim Voiceover](https://github.com/ManimCommunity/manim-voiceover) v0.4.0 only after a core scene renders and passes mathematical checks.
3. Use [Motion Canvas](https://github.com/motion-canvas/motion-canvas) 3.17.2 as the TypeScript and browser-preview comparison track, with its release and dependency warnings visible.
4. Use [Remotion](https://github.com/remotion-dev/remotion) v4.0.517 as an optional post-production and Agent-native comparison track, subject to its custom-license gate.
5. Use [ManimGL](https://github.com/3b1b/manim) as an advanced source-reading track. Never mix its imports, commands, or APIs with Manim Community.
6. Use [Mafs](https://github.com/stevenpetryk/mafs) and [JSXGraph](https://github.com/jsxgraph/jsxgraph) as interactive companions, not as evidence of a complete narrated-video pipeline.

The course's own reproducible scene, tests, keyframes, and release receipt carry the final credibility. GitHub establishes implementation, version, maintenance, and rights facts. Official documentation establishes current product workflows. X posts establish only that creators or maintainers publicly announced or attempted a workflow.

## Research question and evidence hierarchy

The research question was not "Which repository has the most stars?" It was:

> Which repositories let a learner use Codex or Claude to produce a mathematically meaningful animation, inspect the result, repeat the render, and release it with clear rights and failure boundaries?

Evidence was ranked as follows:

1. Local smoke command and inspected output at a recorded package or repository revision. When a scaffold package version differs from a repository evidence pin, both are disclosed separately.
2. Repository code, immutable commit, release, license, tests, and CI state.
3. Official project, OpenAI, Anthropic, W3C, and FFmpeg documentation.
4. X posts as dated workflow or community-practice signals.
5. Engineering synthesis, explicitly labeled as a course recommendation rather than a source fact.

Stars were recorded as adoption context only. They were not used as proof of effectiveness or mathematical quality.

## Repository evaluation rubric

The course UI uses a 100-point fit rubric:

| Dimension | Maximum |
|---|---:|
| Mathematical semantics | 20 |
| Deterministic timeline | 15 |
| Agent-readable project structure | 15 |
| Iteration and preview | 10 |
| Render and export | 10 |
| Maintenance | 10 |
| License clarity | 10 |
| Accessibility affordances | 5 |
| Ecosystem | 5 |

The score measures fitness for this course contract. It does not claim a universal ranking. Extension and companion repositories remain extensions and companions even when they score well.

## Evaluated repository matrix

| Repository | Pinned evidence | Course score | Role | Local or documentary result | Controlling boundary |
|---|---|---:|---|---|---|
| [Manim Community](https://github.com/ManimCommunity/manim) | v0.21.0; `1dc796e9652273950d9863b35746c7329888e384` | 95 | Core | Rendered H.264 MP4, 854x480, 15 fps, 3.000 s | MathTex test blocked honestly because `latex` was absent; project warns of a major refactor |
| [ManimGL](https://github.com/3b1b/manim) | v1.7.2; `9d57bcf9edea2486f214e190931de2a5537f23c1` | 87 | Advanced | Rendered H.264 MP4, 854x480, 30 fps, 2.000 s | Incompatible with Manim Community; release cadence is slower than main activity |
| [Manim Slides](https://github.com/jeertmans/manim-slides) | v5.6.0; `1549ef4ffdf9b145875178519a471eedd8f273ae` | 84 | Extension | Rendered three slides plus MP4 and 868 KB offline one-file RevealJS HTML | Requires an underlying Manim engine; PPTX is experimental and PDF is static |
| [Motion Canvas](https://github.com/motion-canvas/motion-canvas) | scaffold 3.17.2; `7b91435c301d530351dcf5ebb91dd139c002e405` | 81 | Advanced | Included synchronized scene type-checked and built 1084 modules in a fresh official scaffold; editor served HTTP 200 | No final video export was claimed; current main monorepo build failed and dependency advisories were present |
| [Remotion](https://github.com/remotion-dev/remotion) | v4.0.517; `7aee2f4b3d5c05c77761f2dc6ec5aeac701dcce8` | 80 | Extension | Lint, type check, bundle, and 60-frame H.264 plus AAC render passed | Custom Remotion License; not a semantic mathematics engine |
| [Manim Voiceover](https://github.com/ManimCommunity/manim-voiceover) | v0.4.0; `3dc0d95d2f1d9d0937872b3dd68c7b38c4dfc96a` | 77 | Extension | Package and `VoiceoverScene` imported successfully | SoX absent; paid or credentialed TTS was deliberately not called; project is alpha |
| [JSXGraph](https://github.com/jsxgraph/jsxgraph) | v1.13.2; `02b2fd492dcc4249d0ab5d24b98d427788f2ab1e` | 70 | Companion | Repository, release, browser capabilities, keyboard-facing claims, and dual license inspected | No authored video timeline or native media encoding |
| [Mafs](https://github.com/stevenpetryk/mafs) | v0.21.0; `e74a3ef465f4ddc98704814d2ae18b73a6cd9dae` | 65 | Companion | Package, React/Node ranges, TypeScript, unit, Playwright, and visual-test surfaces inspected | Interactive React component library, not a video renderer; maintenance is older |
| [Remotion Agent Skills](https://github.com/remotion-dev/skills) | `7c5c10caa5294d01b168a08c9648b4deef717274` | 35 | Extension guidance | Support list and official skills documentation cross-checked | No standalone license found; link or install after review, do not redistribute here |

### GitHub adoption and activity snapshot

These changing GitHub fields were captured on 2026-08-26 through GitHub's primary repository, commit, and release metadata. Stars are adoption context, not evidence of effectiveness, mathematical correctness, maintenance quality, or license suitability. The snapshot stores dates and adoption/release fields, but it did not persist each default-branch head SHA or an exact capture timestamp; current heads may therefore drift. The immutable evidence pins in the evaluation matrix, not today's branch heads, control reproducibility.

| Repository | Stars on snapshot | Default-branch head date | Latest release on snapshot | Release published |
|---|---:|---|---|---|
| Manim Community | 40,459 | 2026-08-25 | v0.21.0 | 2026-08-10 |
| ManimGL | 92,037 | 2026-08-18 | v1.7.2 | 2024-12-13 |
| Manim Slides | 920 | 2026-08-21 | v5.6.0 | 2026-04-15 |
| Manim Voiceover | 314 | 2026-06-15 | v0.4.0 | 2026-06-14 |
| Motion Canvas | 19,005 | 2026-07-02 | v3.17.2 | 2024-12-14 |
| Remotion | 57,328 | 2026-08-25 | v4.0.517 | 2026-08-25 |
| Remotion Agent Skills | 4,409 | 2026-08-25 | No GitHub release | — |
| Mafs | 3,427 | 2025-03-30 | v0.21.0 | 2024-10-20 |
| JSXGraph | 1,427 | 2026-08-17 | v1.13.2 | 2026-08-17 |

### Capability and dependency trace

The table below separates an executable result from a repository capability claim. “Documentary only” means the pinned repository, package contract, release, or official documentation was inspected, but this audit did not install the package or produce runtime media from it.

| Repository | Install and dependency evidence | Output evidence | Mathematical representation and typesetting | Interaction or presentation | Agent maintenance surface | Evidence level and primary anchor |
|---|---|---|---|---|---|---|
| Manim Community | Isolated Python 3.12 editable install at the pin; initial native setup was blocked by missing `pkg-config`/Cairo discovery, then supplied in the isolated test environment; Cairo, Pango, and FFmpeg were exercised | Local 854×480, 15 fps H.264 MP4 render; still and other formats are repository/documentation capabilities | Semantic Python objects for equations, graphs, geometry, and transforms; Pango `Text` rendered; separate `MathTex` check was blocked by absent `latex` | CLI preview/render and deterministic scene timeline; presentation requires an extension | Python scene files, tests, config, pinned docs, and small render commands are legible to coding agents | **LOCAL_RENDER + LOCAL_BLOCK**; [pin](https://github.com/ManimCommunity/manim/commit/1dc796e9652273950d9863b35746c7329888e384), [text guide](https://docs.manim.community/en/stable/guides/using_text.html) |
| ManimGL | Isolated Python 3.12 editable install at the pin; OpenGL/FFmpeg path exercised | Local 854×480, 30 fps H.264 MP4 render | Rich mathematical scene vocabulary and TeX-oriented production lineage; formula toolchain was not separately stress-tested in this audit | Interactive development, presenter mode, camera control, and OpenGL workflow are repository capabilities | Python source is agent-readable, but historical production scenes and Manim Community APIs must never be mixed | **LOCAL_RENDER**; [pin](https://github.com/3b1b/manim/commit/9d57bcf9edea2486f214e190931de2a5537f23c1), [release](https://github.com/3b1b/manim/releases/tag/v1.7.2) |
| Manim Slides | Installed with the tested Manim environment at v5.6.0; underlying Manim remains a required dependency | Local three-slide render, JSON/MP4 artifacts, and 868 KB one-file offline RevealJS HTML; PPTX is experimental and PDF is a static fallback that loses animation, so neither is claimed as locally validated here | Inherits the selected Manim engine’s mathematical objects and formula toolchain | Slide boundaries, presenter control, RevealJS conversion, and sharing are the extension’s purpose | Explicit CLI render/convert steps are auditable, but compatibility must be pinned to the chosen Manim family; PowerPoint and LibreOffice compatibility remain uncertain | **LOCAL_RENDER**; [pin](https://github.com/jeertmans/manim-slides/commit/1549ef4ffdf9b145875178519a471eedd8f273ae), [fixed sharing docs](https://github.com/jeertmans/manim-slides/blob/1549ef4ffdf9b145875178519a471eedd8f273ae/docs/source/reference/sharing.md) |
| Manim Voiceover | v0.4.0 installed/imported in the tested Manim environment; `VoiceoverScene` import passed; missing SoX warning preserved; no credentialed provider call | No narrated media claimed; timing, recordings, generated speech, and word alignment are repository capabilities | Inherits the underlying Manim scene; it does not add mathematical semantics | Adds narration timing and optional word alignment to a scene | Code is inspectable, but provider credentials, cost, consent, capture, transcription, and voice rights make agent automation high-risk | **LOCAL_VALIDATE + LOCAL_BLOCK**; [pin](https://github.com/ManimCommunity/manim-voiceover/commit/3dc0d95d2f1d9d0937872b3dd68c7b38c4dfc96a), [release](https://github.com/ManimCommunity/manim-voiceover/releases/tag/v0.4.0) |
| Motion Canvas | Fresh official 3.17.2 scaffold installed; included TSX scene passed `tsc --noEmit` and a Vite build of 1084 modules; dependency advisories preserved; current main monorepo separately failed `2d:build` | Browser editor returned HTTP 200 and production bundle passed; no final video export claimed | Typed signals and vector nodes synchronize geometry; MathJax-based LaTeX node is documented, while the included unit-circle scene deliberately used geometry rather than formula rendering | Browser editor, deterministic generator timeline, and interactive preview are first-class | TypeScript, explicit signals, and build checks suit agents; release drift and dependency health require a lock and audit | **LOCAL_VALIDATE + LOCAL_BLOCK**; [pin](https://github.com/motion-canvas/motion-canvas/commit/7b91435c301d530351dcf5ebb91dd139c002e405), [rendering guide](https://motioncanvas.io/docs/rendering/) |
| Remotion | Fresh v4.0.517 scaffold installed; lint, TypeScript, bundle, and render passed; first render downloaded a 93.5 MB browser binary | Local 60-frame 1280×720, 30 fps H.264 + AAC MP4 | No semantic mathematics layer; equations, geometry, and invariants must be supplied by application code or another engine | Studio preview, frame-addressed React composition, Player embedding, audio/captions, and aspect variants | React/TypeScript and official agent guidance are strong, but mathematical correctness and the custom commercial-license gate remain external | **LOCAL_RENDER**; [release](https://github.com/remotion-dev/remotion/releases/tag/v4.0.517), [encoding docs](https://www.remotion.dev/docs/encoding) |
| Remotion Agent Skills | Not installed or copied; pinned README/support list and official skills documentation were reviewed; no standalone license was found | No renderer and no media output; it is workflow guidance | No mathematical semantics or typesetting | Guides agent use of Remotion rather than providing a presentation surface | Highly agent-readable instructions, but every script, dependency, network action, path, and right must be reviewed before installation | **DOCUMENTARY_ONLY + GITHUB_PRIMARY + OFFICIAL_DOCS**; [pin](https://github.com/remotion-dev/skills/tree/7c5c10caa5294d01b168a08c9648b4deef717274), [official skills page](https://www.remotion.dev/docs/ai/skills) |
| Mafs | No install or runtime render in this audit; pinned package metadata, React/Node ranges, TypeScript, unit, Playwright, and visual-test surfaces were inspected | Interactive React mathematics view; no authored timeline or video encoder | Coordinates, plots, vectors, and mathematical interactions; a formula typesetting pipeline was not locally validated | Learner-controlled gestures and plots are its strongest role | Typed components and browser tests are agent-friendly; the older release/activity snapshot lowers upgrade confidence | **DOCUMENTARY_ONLY + GITHUB_PRIMARY**; [pin](https://github.com/stevenpetryk/mafs/commit/e74a3ef465f4ddc98704814d2ae18b73a6cd9dae), [release](https://github.com/stevenpetryk/mafs/releases/tag/v0.21.0) |
| JSXGraph | No install or runtime render in this audit; pinned release, browser capability, keyboard-facing claims, and dual-license path were inspected | SVG/Canvas browser mathematics; no authored video timeline or native media encoding | Dynamic geometry, functions, charts, and 2D/3D views; formula typesetting was not locally validated | Touch and keyboard-facing interactive construction are documented strengths | Mature JavaScript surface is usable by agents, but a separate capture/composition system and explicit MIT-or-LGPL-3.0-or-later choice are required | **DOCUMENTARY_ONLY + GITHUB_PRIMARY**; [release](https://github.com/jsxgraph/jsxgraph/releases/tag/v1.13.2), [license anchor](https://github.com/jsxgraph/jsxgraph/blob/02b2fd492dcc4249d0ab5d24b98d427788f2ab1e/README.md#license) |

### Score reconstruction

The score vector order is: mathematical semantics (20), deterministic timeline (15), agent-readable structure (15), iteration/preview (10), render/export (10), maintenance (10), license clarity (10), accessibility affordances (5), ecosystem (5). The numbers are an explicit course-team judgment based on the evidence above; they are not a benchmark or an automated measurement. A third party can reproduce each total by summing the nine visible components and can challenge any component against the linked pin and stated smoke boundary.

| Repository | Nine-component vector | Sum | Dominant scoring reason |
|---|---|---:|---|
| Manim Community | 20 + 15 + 14 + 8 + 10 + 10 + 10 + 3 + 5 | 95 | Best semantic mathematics and verified render; native setup and accessibility need work |
| ManimGL | 20 + 15 + 10 + 9 + 10 + 7 + 10 + 2 + 4 | 87 | Deep production vocabulary and verified render; compatibility/cadence and accessibility penalties |
| Manim Slides | 16 + 13 + 11 + 10 + 9 + 9 + 10 + 3 + 3 | 84 | Strong verified presentation extension, but inherits rather than supplies the math engine |
| Motion Canvas | 14 + 15 + 13 + 10 + 8 + 5 + 10 + 2 + 4 | 81 | Excellent typed timeline and preview; no final export claim and current dependency/build concerns |
| Remotion | 8 + 15 + 15 + 10 + 10 + 10 + 4 + 3 + 5 | 80 | Excellent agent-readable production pipeline; weak native math semantics and custom-license penalty |
| Manim Voiceover | 14 + 12 + 12 + 6 + 8 + 8 + 10 + 4 + 3 | 77 | Useful narration extension; provider/SoX/rights surface and no narrated smoke reduce confidence |
| JSXGraph | 17 + 4 + 10 + 10 + 2 + 10 + 9 + 4 + 4 | 70 | Strong maintained interactive mathematics; lacks an authored video timeline/export |
| Mafs | 15 + 3 + 13 + 10 + 2 + 5 + 10 + 4 + 3 | 65 | Strong typed interactive companion; no video pipeline and older maintenance snapshot |
| Remotion Agent Skills | 2 + 4 + 15 + 0 + 0 + 8 + 2 + 1 + 3 | 35 | Strong agent instructions only; no renderer, no math semantics, and no standalone license found |

Additional candidates were evaluated for course-placement decisions:

- [Matplotlib](https://github.com/matplotlib/matplotlib): strong for numerical simulations and data-driven animation, but weaker for authored transformations and camera narrative. Use in a "when not to use Manim" note.
- [p5.js](https://github.com/processing/p5.js): active and accessible for creative coding, but lacks mathematical object semantics and a first-party professional video pipeline.
- [MathBox](https://github.com/unconed/mathbox): expressive WebGL mathematics, but last repository and release activity observed in 2023. Keep as historical 3D reference.
- [Mathemagical.js](https://github.com/Mathemagical-Community/Mathemagical.js): aligned purpose, but no release, very small adoption, and no recent activity. Exclude as a course dependency.

## Reproducible smoke evidence

Test environment:

```text
macOS 26.5.2 arm64
Node v24.15.0
npm 11.12.1
uv 0.11.18
Python 3.12.13 via uv
FFmpeg 8.1.1
Initially absent: pkg-config, LaTeX, Typst, SoX
```

### Manim Community v0.21.0

```bash
uv venv --python 3.12 .venv-ce
uv pip install --python .venv-ce/bin/python -e ./manim-ce
.venv-ce/bin/manim -ql --disable_caching \
  --media_dir smoke-ce manim-ce/example_scenes/basic.py SquareToCircle
```

Observed result: exit 0; three animations; H.264; 854x480; 15 fps; 3.000 s; SHA-256 `dc763b0c67fd79470ca790bd31190e37c66241026ae1fbbe865ae7ae9e927a2f`.

The first install attempt failed because `pkg-config` and Cairo discovery were absent. The test environment supplied those dependencies without changing the user's global project. A MathTex still-image test then failed with `FileNotFoundError` for `latex`. This is preserved as a native-dependency boundary, not hidden as a generic Manim failure.

### ManimGL v1.7.2

```bash
uv venv --python 3.12 .venv-gl
uv pip install --python .venv-gl/bin/python -e ./manimgl
.venv-gl/bin/manimgl smoke_manimgl.py SmokeCircle -w -l --video_dir smoke-gl
```

Observed result: exit 0; H.264; 854x480; 30 fps; 2.000 s; SHA-256 `07b7d135237d25b3daf7ced27475b9b01fa984cd1c00f454d0c449a0b86f1f42`.

### Manim Slides v5.6.0

```bash
.venv-ce/bin/manim-slides render -ql --disable_caching \
  --media_dir smoke-slides manim-slides/example.py BasicExample
.venv-ce/bin/manim-slides convert --one-file --offline \
  BasicExample smoke-slides.html
```

Observed result: exit 0; three slides; JSON and MP4 produced; one-file offline RevealJS HTML produced at 868 KB.

### Manim Voiceover v0.4.0

```bash
.venv-ce/bin/python -c \
  "from importlib.metadata import version; print(version('manim-voiceover')); from manim_voiceover import VoiceoverScene; print('VoiceoverScene import OK')"
```

Observed result: exit 0 and import success, with a warning that SoX was not found. No cloud TTS request was sent because a smoke test should not create a paid or credentialed external action.

### Motion Canvas

The official TypeScript scaffold at 3.17.2 completed `npm install`, `tsc`, Vite production build, and an HTTP 200 editor response. The course's included unit-circle, projection, and sine-trace scene was then copied into a fresh 3.17.2 scaffold and independently passed `npx tsc --noEmit` plus a Vite build that transformed 1084 modules. The scaffold reported dependency advisories. The current main monorepo installed but reported 130 advisories and failed `2d:build` because `rollup` was not available through the tested package path. The course therefore says "scene and scaffold validated", not "video rendered".

### Remotion v4.0.517

```bash
npx create-video@4.0.517 --yes --blank --no-tailwind remotion-smoke
cd remotion-smoke
npm install
npm run lint
npm run build
npx remotion render MyComp smoke-remotion.mp4
```

Observed result: the scaffold resolved to package v4.0.517; install, ESLint, TypeScript, bundle, and render all exited successfully. Final media: H.264 plus AAC; 1280x720; 30 fps; 60 frames; 2.048 s; SHA-256 `56c1fd7000a6c38e37f7783f6eb5a7dd73d9186be2a6590eb076a8b6a4b9cb2e`. The repository commit `7aee2f4b…` is the immutable source-evidence pin; it is not presented as the exact checkout used by the package scaffold.

The first render downloaded a 93.5 MB Chrome Headless Shell. The course must expose that network and disk side effect in the environment contract.

## X-post evidence and safe wording

The following post text, account, date, and media metadata were independently cross-checked through X oEmbed and syndication data:

| Post | What the post can support | What it cannot support |
|---|---|---|
| [Remotion Agent Skills announcement](https://x.com/Remotion/status/2013626968386765291), 2026-01-20 | Remotion publicly announced an Agent Skills and Claude Code workflow, including an installation command | Mathematical-animation effectiveness, universal agent compatibility, or a license grant |
| [Min Choi neural-network Manim example](https://x.com/minchoi/status/1770105075043647495), 2024-03-19 | The creator publicly claimed to use Claude 3 to generate a Manim neural-network explanation | Mathematical accuracy, reproducibility, full model authorship, or native Anthropic integration |
| [Alvaro Cintas Pythagorean example](https://x.com/dr_cintas/status/1767569938217087199), 2024-03-12 | The creator publicly claimed to ask Claude 3 for a Pythagorean-theorem animation and attached a result | Source-code reproducibility or correctness |
| [Dhruv thread and math examples](https://x.com/_dhruvvvvv_/status/1770019681749049840), 2024-03-19 | Creator-claimed Claude 3 animation attempts involving a sphere theorem, distance formula, and Riemann sums | Official Anthropic Manim support, correctness, or stable current behavior |
| [Tobi Lütke /manim_video example](https://x.com/tobi/status/2041719844920283326), 2026-04-08 | A cross-agent example of packaging a Manim workflow as a reusable skill | A capability claim about Codex or Claude; it used Hermes Agent |

Safe course wording:

> These posts record creators using Claude to generate or direct Manim code. This course reproduces and verifies the workflow in a controlled project. It does not treat social-media demonstrations as proof of mathematical correctness or repeatability.

Rejected wording:

> Claude has native Manim support.

No supporting Anthropic product documentation was found for that statement.

## Codex and Claude workflow findings

[OpenAI's current Codex guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md) supports a repository-grounded pattern that combines project instructions with scoped work, review, and verification. The course maps this to implementation, invariant tests, render commands, and artifact handoff. It does not claim that OpenAI officially integrates Manim.

[Claude Code Quickstart](https://code.claude.com/docs/en/quickstart) and [Best Practices](https://code.claude.com/docs/en/best-practices) support concrete tasks, an explore-plan-implement loop, and giving Claude a way to verify work through tests, builds, or screenshots. [Claude Code memory](https://code.claude.com/docs/en/memory) supports repository-level `CLAUDE.md` context. [Claude Code Skills](https://code.claude.com/docs/en/skills) supports packaging domain instructions, scripts, and resources as a reusable skill.

The recommended role split is therefore an engineering design, not a benchmark:

- Codex-first path: repository inspection, implementation, invariant tests, rendering, diff review, and evidence handoff.
- Claude-first review: storyboard ambiguity, learner interpretation, narration, keyframe critique, and independent verification requests.
- Swapped path: allowed, provided implementation and review remain separate and use the same scene contract.

## Rights and security decisions

- Manim Community, ManimGL, Manim Slides, Manim Voiceover, Motion Canvas, and Mafs were observed under MIT terms at their pinned sources; Manim Community carries separate notices for 3Blue1Brown LLC and Manim Community Developers.
- JSXGraph is available under either MIT or LGPL-3.0-or-later; one path must be selected and documented.
- Remotion uses a custom license. It must not be described as universally MIT or unconditionally free for every commercial organization.
- No standalone license was found in the pinned Remotion Skills repository. The course links to it and may teach an install-and-audit workflow, but does not copy its package.
- The pinned 3Blue1Brown videos repository carries a root CC BY-NC-SA 4.0 license file. The course only links to its `CLAUDE.md` as an instruction example and does not reuse code, video, logo, or visual identity; any reuse requires a separate scope and license-compliance review.
- X media is not embedded or redistributed.
- Third-party skills are executable workflow inputs. Review `SKILL.md`, scripts, dependencies, network access, shell commands, output paths, and license before installation.
- API keys, TTS credentials, cookies, tokens, and signed URLs must never be written into scene code, prompts, logs, or course progress.

## Course contract produced by the research

The course uses twelve modules and four phases:

1. Define outcome and output.
2. Evaluate repositories.
3. Write a scene contract and storyboard.
4. Reproduce the first Manim Community scene.
5. Preserve transformation and camera continuity.
6. Synchronize equations, graphs, and geometry.
7. Run the Codex implementation loop.
8. Run the Claude direction and review loop.
9. Compare the Motion Canvas browser track.
10. Add optional voice, slides, or Remotion composition.
11. Run mathematical, visual, accessibility, media, and rights QA.
12. Release an independently reviewed capstone pack.

The final capstone cannot reach 100 percent through page visits or completion clicks. Every module requires a passed checkpoint, artifact receipt, and verification receipt. The final assessment requires at least 80 percent. The capstone requires six evidence groups and a substantive independent-review record.

## Revalidation triggers

Re-run the source and smoke audit when any of the following changes:

- Manim Community, ManimGL, plugin, Motion Canvas, or Remotion pin.
- Python, Node, FFmpeg, LaTeX, Typst, SoX, browser, or operating system.
- GitHub license, repository default branch, release channel, or CI state.
- Codex or Claude product documentation used for a user-facing workflow claim.
- A linked X post is deleted, edited through a replacement post, or loses accessible metadata.
- Course code changes the example scene, invariant, render command, keyframe set, transcript, or export format.

## Bottom line

Manim Community is the default because it combines mathematical semantics, deterministic scene code, an inspectable CLI, broad export, active maintenance, clear MIT terms, and an explicit notice trail. The best use of Codex and Claude is not a one-shot request for a polished video. It is a bounded loop in which the agents share a scene contract, produce separate implementation and review evidence, and stop when mathematical or release proof is missing.
