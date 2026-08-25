# Course 10 MCP asset notice

Course text, original interface code, the CourseOps reference implementation, and tests are licensed with the aicourse.top repository under its MIT license. To the extent separately copyrightable, the course-authored selection, privacy crop, and surrounding presentation of the two host terminal captures are also offered under MIT. The visible Gemini CLI and Codex CLI interface/output remains subject to each upstream work's Apache-2.0 license and provider trademark terms; it is not relicensed under MIT. The six third-party MCP Inspector figures remain separate CC BY 4.0 works and are **not** relicensed under MIT.

Evidence snapshot: 2026-08-24. The complete machine-checkable figure register—including immutable upstream paths, upstream and local SHA-256 values, derivative hashes, dimensions, transformations, capture recipes, privacy review, rights status, and release eligibility—is `public/courses/mcp/figure-manifest.json`.

## Model Context Protocol Inspector figures

Published master files:

- `inspector-settings.png`
- `inspector-tools.png`
- `inspector-resources.png`
- `inspector-prompts.png`
- `inspector-protocol.png`
- `inspector-apps.png`

Creator and attribution: © Model Context Protocol, a Series of LF Projects, LLC, and Model Context Protocol documentation contributors.

Source page: https://modelcontextprotocol.io/docs/2026-07-28/tools/inspector/web

Immutable source revision: https://github.com/modelcontextprotocol/modelcontextprotocol/commit/e24f0099b60f7c00e165a0faa02a72029d2fa654

Exact repository paths: `docs/images/inspector/web-server-settings.png`, `web-tools.png`, `web-resources.png`, `web-prompts.png`, `web-protocol.png`, and `web-apps.png` at revision `e24f0099b60f7c00e165a0faa02a72029d2fa654`.

License: Creative Commons Attribution 4.0 International, https://creativecommons.org/licenses/by/4.0/

License-scope evidence: the repository license at the immutable revision states that documentation contributions, excluding specifications, are licensed under CC BY 4.0: https://github.com/modelcontextprotocol/modelcontextprotocol/blob/e24f0099b60f7c00e165a0faa02a72029d2fa654/LICENSE

All six published PNG masters are byte-for-byte copies of their immutable upstream documentation assets. Files ending in `-1600.webp` and `-960.webp` are resized, lossy responsive derivatives created by `scripts/build-mcp-figure-derivatives.mjs` with Sharp 0.35.3 and the exact parameters recorded in `figure-manifest.json`. Course captions and legacy-warning panels are separate additions outside the image pixels.

The settings, resources, and protocol captures include legacy-era controls or messages. Course captions identify those limitations and do not present the visible legacy envelope as a current MCP 2026-07-28 template.

Privacy review passed: the figures contain synthetic demonstration data and loopback URLs only. No people, personal accounts, credentials, secrets, private records, or user identifiers are visible. Responsive WebP outputs retain no EXIF or XMP metadata.

## Course-authored Google Gemini CLI capture

Published files: `gemini-cli-mcp-inventory.png`, `gemini-cli-mcp-inventory-1600.webp`, and `gemini-cli-mcp-inventory-960.webp`.

This is a real course-authored terminal capture of `@google/gemini-cli@0.56.0`, not a redistributed Google codelab image. The capture shows the first-party `gemini mcp` management interface and status for synthetic local server configurations. It is limited to host inventory and live connection-status evidence; Gemini CLI 0.56.0 uses a legacy-era MCP SDK path, so the figure does not establish MCP 2026-07-28 compatibility.

- Exact release: https://github.com/google-gemini/gemini-cli/releases/tag/v0.56.0
- Immutable source revision: `b6e23a7dc29eb15fede4bbe646d91869e948b45a`
- Client license: Apache-2.0, https://github.com/google-gemini/gemini-cli/blob/b6e23a7dc29eb15fede4bbe646d91869e948b45a/LICENSE
- Local readable Apache-2.0 license copy: `public/courses/mcp/licenses/APACHE-2.0.txt`
- NOTICE finding: the complete repository tree at pinned revision `b6e23a7dc29eb15fede4bbe646d91869e948b45a` contains no `NOTICE` or `NOTICE.*` file; reviewed 2026-08-24.
- Google educational screenshot and brand guidance: https://about.google/brand-resource-center/guidance/
- Full capture recipe, integrity values, and version boundary: `evidence/course-audits/mcp-host-ui-capture-provenance.md`

The published master is a disclosed privacy crop that removes only black desktop margin and Terminal window chrome containing the local user name; Gemini CLI output pixels are otherwise unchanged. The raw full-window master is retained outside `public/` and protected from accidental staging. The figure's `reviewed-course-capture` status means it passed this project's internal rights and privacy review; it does not mean that Google approved it. Google and Gemini marks belong to Google. No endorsement is implied.

## Course-authored OpenAI Codex CLI 0.149.1 capture

Published files: `codex-cli-mcp-configuration.png`, `codex-cli-mcp-configuration-1600.webp`, and `codex-cli-mcp-configuration-960.webp`.

This is a real course-authored terminal capture of `@openai/codex@0.149.1`, not a proprietary ChatGPT account screenshot. It shows a synthetic MCP server’s effective configuration and the visibly under-development `mcp_2026_07_28` feature. `codex mcp get` reads configuration and does not initialize a server, so the figure is not described as a successful connection or handshake.

- Exact release: https://github.com/openai/codex/releases/tag/rust-v0.149.1
- Immutable source revision: `ff29a44391deccde0aba0f8390337d7f3c319ea4`
- Client license: Apache-2.0, https://github.com/openai/codex/blob/ff29a44391deccde0aba0f8390337d7f3c319ea4/LICENSE
- Local readable Apache-2.0 license copy: `public/courses/mcp/licenses/APACHE-2.0.txt`
- Upstream NOTICE: https://github.com/openai/codex/blob/ff29a44391deccde0aba0f8390337d7f3c319ea4/NOTICE
- Local NOTICE copy: `public/courses/mcp/licenses/CODEX-NOTICE.txt`
- Full capture recipe, integrity values, and feature boundary: `evidence/course-audits/mcp-host-ui-capture-provenance.md`

Applicable attribution from the pinned upstream NOTICE is preserved locally:

> OpenAI Codex<br>
> Copyright 2025 OpenAI<br>
> This product includes code derived from Ratatui, licensed under the MIT License.<br>
> Copyright (c) 2016-2022 Florian Dehau<br>
> Copyright (c) 2023-2025 The Ratatui Developers

The published master is a disclosed privacy crop that removes only black desktop margin and Terminal window chrome containing the local user name; Codex CLI output pixels are otherwise unchanged. Codex masks the synthetic protocol-marker value in its own output. The raw full-window master is retained outside `public/` and protected from accidental staging. The figure's `reviewed-course-capture` status means it passed this project's internal rights and privacy review; it does not mean that OpenAI approved it. OpenAI and Codex marks belong to OpenAI. No affiliation or endorsement is implied.

## Images reviewed and withheld

Two Google Gemini CLI codelab screenshots and two OpenAI developer-documentation design images were reviewed but are **not distributed** with the course:

- Google: the general codelab text license does not establish image reuse. Google’s site policy excludes image, audio, and video material from the general CC BY grant unless specifically noted, and no figure-specific grant was found: https://developers.google.com/terms/site-policies
- OpenAI: the source page does not publish an open image-reuse license. The candidate images also contained third-party likeness, map, product, or biographical content whose downstream rights were not established.

The Google, Claude, and OpenAI pages remain linked factual and pedagogical sources. Excluding those four documentation-image binaries does not remove their documented workflows or the independently captured Gemini and Codex terminal UI from the course.

No affiliation or endorsement by the Model Context Protocol project, LF Projects, Anthropic, Google, OpenAI, GitHub, or any other provider is implied. Product names, logos, and trademarks remain the property of their respective owners; no standalone trademark rights are claimed.
