# Course 19 research provenance

Snapshot date: 2026-08-26

This sidecar records where the research claims came from, how they were checked, and which claims remain inference. It is intentionally separate from the learner-facing course.

## Evidence classes

- `LOCAL_RENDER`: command completed and produced media that was probed.
- `LOCAL_VALIDATE`: installation, import, type check, build, or HTTP preview completed without a final video claim.
- `LOCAL_BLOCK`: a named local check failed and the boundary is preserved.
- `GITHUB_PRIMARY`: repository, immutable commit, release, license, code, test, or CI evidence.
- `OFFICIAL_DOCS`: first-party project, OpenAI, Anthropic, W3C, or FFmpeg documentation.
- `X_VERIFIED_TEXT`: account, text, date, and attachment metadata cross-checked through X-provided oEmbed and syndication data.
- `ENGINEERING_SYNTHESIS`: course-team inference from the evidence, never presented as a source's own claim.
- `DOCUMENTARY_ONLY`: pinned repository or first-party documentation was inspected without installing or executing the package.

## Repository provenance

Repository adoption/activity fields were read on 2026-08-26 from GitHub's primary REST metadata for each repository, its pinned/default-branch-head commit, and its latest release endpoint. The captured fields are stored in `public/courses/math-animation/repository-lock.json` and mirrored by the typed course evaluation. They are point-in-time metadata; stars can change, and a missing GitHub release does not mean a repository lacks commits or tags. Exact default-branch head SHAs and capture times were not retained in the snapshot, so immutable evidence pins—not current heads—control reproducibility.

| ID | Primary URL | Immutable anchor | Evidence classes | Verification note |
|---|---|---|---|---|
| `github-manim-ce` | https://github.com/ManimCommunity/manim | `1dc796e9652273950d9863b35746c7329888e384`, release v0.21.0 | LOCAL_RENDER, LOCAL_BLOCK, GITHUB_PRIMARY, OFFICIAL_DOCS | Minimal MP4 rendered; MathTex was separately blocked by absent `latex`; both MIT notice files and the refactor warning were checked |
| `github-manimgl` | https://github.com/3b1b/manim | `9d57bcf9edea2486f214e190931de2a5537f23c1`, release v1.7.2 | LOCAL_RENDER, GITHUB_PRIMARY | Minimal MP4 rendered; incompatibility language checked in repository README |
| `github-manim-slides` | https://github.com/jeertmans/manim-slides | `1549ef4ffdf9b145875178519a471eedd8f273ae`, release v5.6.0 | LOCAL_RENDER, GITHUB_PRIMARY, OFFICIAL_DOCS | Slide MP4, JSON, and offline one-file RevealJS HTML produced |
| `github-manim-voiceover` | https://github.com/ManimCommunity/manim-voiceover | `3dc0d95d2f1d9d0937872b3dd68c7b38c4dfc96a`, release v0.4.0 | LOCAL_VALIDATE, LOCAL_BLOCK, GITHUB_PRIMARY | Package and class imported; SoX warning preserved; no credentialed provider call made |
| `github-motion-canvas` | https://github.com/motion-canvas/motion-canvas | `7b91435c301d530351dcf5ebb91dd139c002e405`; scaffold 3.17.2 | LOCAL_VALIDATE, LOCAL_BLOCK, GITHUB_PRIMARY, OFFICIAL_DOCS | Scaffold type check, Vite build, and HTTP preview passed; included synchronized scene independently passed scaffold type check and build; no video claimed; main monorepo build and advisories recorded |
| `github-remotion` | https://github.com/remotion-dev/remotion | evidence pin `7aee2f4b3d5c05c77761f2dc6ec5aeac701dcce8`; scaffold package v4.0.517 | LOCAL_RENDER, GITHUB_PRIMARY, OFFICIAL_DOCS | v4.0.517 scaffold lint, type check, bundle, render, and ffprobe passed; the repository pin controls source/license evidence and is not claimed as the scaffold checkout |
| `github-remotion-skills` | https://github.com/remotion-dev/skills | `7c5c10caa5294d01b168a08c9648b4deef717274` | DOCUMENTARY_ONLY, GITHUB_PRIMARY, OFFICIAL_DOCS | Current support list cross-checked; no standalone LICENSE found; package not redistributed |
| `github-mafs` | https://github.com/stevenpetryk/mafs | `e74a3ef465f4ddc98704814d2ae18b73a6cd9dae`, release v0.21.0 | DOCUMENTARY_ONLY, GITHUB_PRIMARY | Package and test surfaces inspected; no native video-render claim |
| `github-jsxgraph` | https://github.com/jsxgraph/jsxgraph | `02b2fd492dcc4249d0ab5d24b98d427788f2ab1e`, release v1.13.2 | DOCUMENTARY_ONLY, GITHUB_PRIMARY | Browser mathematics, keyboard-facing claims, maintenance, and dual license checked |
| `github-3b1b-videos-claude` | https://github.com/3b1b/videos/blob/master/CLAUDE.md; https://github.com/3b1b/videos/blob/674b966fbb6cf0307590d27744d186165e8b6a76/LICENSE.txt | `674b966fbb6cf0307590d27744d186165e8b6a76` | GITHUB_PRIMARY | Exact project guidance and pinned root CC BY-NC-SA 4.0 license read; link-only, with no code or media redistributed |

## Official workflow provenance

| ID | URL set | Evidence class | Claim boundary |
|---|---|---|---|
| `openai-codex-use-cases` | https://learn.chatgpt.com/docs/agent-configuration/agents-md; https://learn.chatgpt.com/docs/agent-configuration/subagents; https://learn.chatgpt.com/docs/code-review; https://learn.chatgpt.com/docs/build-skills; https://learn.chatgpt.com/docs/environments/git-worktrees; https://learn.chatgpt.com/use-cases/iterate-on-difficult-problems | OFFICIAL_DOCS | Repository workflow only; no native Manim integration claim |
| `openai-model-guidance` | https://developers.openai.com/api/docs/guides/latest-model | OFFICIAL_DOCS | Current prompting guidance only; deterministic project tests remain required |
| `anthropic-claude-code-overview` | https://code.claude.com/docs/en/quickstart; https://code.claude.com/docs/en/best-practices; https://code.claude.com/docs/en/sub-agents | OFFICIAL_DOCS | Claude Code workflow and independent review; no native Manim feature claim |
| `anthropic-claude-memory` | https://code.claude.com/docs/en/memory; https://code.claude.com/docs/en/skills; https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills | OFFICIAL_DOCS | Project context and reusable skills; natural-language instructions are not enforcement |
| `w3c-animation-interactions` | https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html; https://www.w3.org/TR/mediaqueries-5/ | OFFICIAL_DOCS | WCAG 2.2 SC 2.3.3 is Level AAA and its Understanding page is informative; reduced motion only, not a complete accessibility audit |
| `ffmpeg-general` | https://www.ffmpeg.org/general.html; https://ffmpeg.org/ffprobe.html | OFFICIAL_DOCS, LOCAL_VALIDATE | File and stream inspection only, not mathematical or pedagogical proof |

## X provenance

| ID | Direct post | Published | Verification | Safe claim |
|---|---|---|---|---|
| `x-remotion-agent-skills` | https://x.com/Remotion/status/2013626968386765291 | 2026-01-20 UTC | X oEmbed plus syndication JSON; current skills README cross-check | Remotion announced a Claude Code Agent Skills workflow and install command |
| `x-minchoi-claude-manim` | https://x.com/minchoi/status/1770105075043647495 | 2024-03-19 UTC | X oEmbed plus syndication JSON | Creator claimed to use Claude 3 for a Manim neural-network explanation |
| `x-cintas-claude-pythagoras` | https://x.com/dr_cintas/status/1767569938217087199 | 2024-03-12 UTC | X oEmbed plus syndication JSON | Creator claimed to ask Claude 3 for a Pythagorean-theorem animation |
| `x-dhruv-math-animation-thread` | https://x.com/_dhruvvvvv_/status/1770019681749049840 plus three linked posts | 2024-03-19 UTC | Four posts checked through X oEmbed plus syndication JSON | Creator posted Claude 3 math-animation attempts involving a sphere theorem, distance formula, and Riemann sums |
| `x-tobi-manim-skill` | https://x.com/tobi/status/2041719844920283326 | 2026-04-08 UTC | X oEmbed plus syndication JSON | Cross-agent example of a reusable `/manim_video` skill in Hermes Agent |

X video media hosts timed out repeatedly during independent verification, so video frames were not treated as source evidence. Post text and media metadata establish only what the author publicly stated and attached.

## Inference register

The following are explicit `ENGINEERING_SYNTHESIS`:

- Manim Community is the best default for this course.
- Codex is assigned implementation and repository evidence while Claude is assigned story and frame review.
- The roles are swappable and are not a model benchmark.
- Course fit scores and verdicts.
- A render, test, screenshot, and X post answer different evidence questions.
- Motion Canvas should remain an advanced comparison until release and dependency health improve.
- Remotion should remain an optional production layer until the adopter's license context is reviewed.

## Rights provenance

- Original deterministic hero poster: `public/courses/math-animation/posters/unit-circle-sine-keyframes.svg`
- Creation date: 2026-08-26
- Creation method: self-contained deterministic SVG; no generative image tool, raster input, remote resource, script, or third-party visual asset
- SHA-256: `d194cbae12680e5014c82177239e5b0f179707be7290b4cc8bb373e8b64a8f98`
- Geometry contract: the same `θ = π/4` derives the unit-circle point, shared sine-value projection, graph point, vertical timeline projection, and timeline marker; the graph is computed from 129 uniformly spaced samples over `[0, 2π]` with equal positive and negative amplitudes
- Interactive unit-circle preview: original React and SVG implementation; no third-party image or copied project UI
- Course example code: original instructional examples written for this course; external repositories are linked, not vendored
- X media: linked only, never downloaded, embedded, or redistributed

## Reproduction boundary

The temporary research clones, virtual environments, package installs, and smoke outputs were isolated outside the user's repository. After evidence extraction, approximately 3.3 GB of those temporary files were moved to the macOS Trash and were not copied into the course. The course stores commands, observed results, hashes, and boundaries rather than bulky third-party artifacts.
