# Course 10 host UI capture provenance

Evidence snapshot: 2026-08-24 (Asia/Taipei)

This record covers the two course-authored terminal figures published alongside the six first-party MCP Inspector documentation figures. It deliberately distinguishes configuration UI, live connection status, and wire evidence. Neither host figure is described as a successful MCP 2026-07-28 handshake.

## Shared capture controls

- Runner: macOS 26.5.2 arm64; Node.js 24.15.0; Terminal 2.15 build 470.2; Basic light profile; 118 × 34 PTY.
- Data: synthetic server names and synthetic CourseOps data only.
- Capture: a real PTY-backed Terminal window captured with the operating-system screenshot API after the commands completed.
- Published transformation: a deterministic Sharp crop removes the black desktop margin and Terminal title bar containing the local user name. Terminal output pixels are not reconstructed, annotated, composited, blurred, or edited.
- Metadata: the published PNGs contain no EXIF or XMP. Responsive 1600 px and 960 px WebP derivatives use Sharp 0.35.3, width-only resizing without enlargement, quality 82, effort 6, and smart subsampling.
- Reproduction: `scripts/build-mcp-host-captures.mjs` verifies the retained raw-master hash and dimensions before creating each privacy master. `scripts/build-mcp-figure-derivatives.mjs` creates the responsive files.
- Storage boundary: full raw captures remain outside `public/` at the archival references recorded in `figure-manifest.json`; the repository ignore rule prevents accidental publication of the capture workspace.
- Rights layers: to the extent separately copyrightable, the course-authored capture selection, privacy crop, and surrounding presentation are offered under the repository's MIT license. Visible Gemini CLI and Codex CLI interface/output remains subject to the respective upstream Apache-2.0 work and provider trademark terms. A readable license copy is distributed at `public/courses/mcp/licenses/APACHE-2.0.txt`.
- Review meaning: `reviewed-course-capture` is an internal publication, provenance, privacy, and rights-review status. It is not provider approval, affiliation, or endorsement.

## Google Gemini CLI 0.56.0

Evidence class: `live-connection-status`, limited to the host’s management-command and status UI.

Pinned client:

- Package: `@google/gemini-cli@0.56.0`
- Release: https://github.com/google-gemini/gemini-cli/releases/tag/v0.56.0
- Commit: `b6e23a7dc29eb15fede4bbe646d91869e948b45a`
- npm tarball: https://registry.npmjs.org/@google/gemini-cli/-/gemini-cli-0.56.0.tgz
- npm integrity: `sha512-q4oBfb/Oh/HNLMYBOJMp88/QQ8hLffnB0ykoVThi6A5isbGHJ/ylWLMosMGqukKY0Q1Jv/XRDpb46Q1BV+zQqw==`
- Apache-2.0 license: https://github.com/google-gemini/gemini-cli/blob/b6e23a7dc29eb15fede4bbe646d91869e948b45a/LICENSE
- NOTICE finding: no `NOTICE` or `NOTICE.*` file exists in the complete repository tree at pinned revision `b6e23a7dc29eb15fede4bbe646d91869e948b45a`; reviewed 2026-08-24.

Pinned synthetic reference server:

- Package: `@modelcontextprotocol/server-everything@2026.8.18`
- npm tarball: https://registry.npmjs.org/@modelcontextprotocol/server-everything/-/server-everything-2026.8.18.tgz
- npm integrity: `sha512-sBW2l6uMa9ii78QixTKjXgNSv/Ad6LB8cTGBApJMytHe+VCufLQyME55JbLl/0+fcLmcx93wsZ6ce+0aOF8YXA==`
- npm SHA-1: `e06a80de7783be298f27b69f5a03a05e7d3b586f`
- Resolution boundary: the artifact declares `@modelcontextprotocol/sdk` as `^1.30.0` and ships no lockfile. Re-running the same pinned server command later can therefore resolve a different transitive SDK. The course does not redistribute this server, and the figure is not labeled a byte-for-byte future-reproducible dependency environment.

Sanitized configuration:

```json
{
  "mcpServers": {
    "everything-reference": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-everything@2026.8.18"],
      "timeout": 20000
    },
    "courseops-modern": {
      "command": "node",
      "args": ["../../../tests/fixtures/mcp-courseops/src/server.mjs"],
      "timeout": 10000
    }
  }
}
```

The configuration SHA-256 is `e987376881a34d73eafdf51c705c73fd8bf5e06a4d44dd953e0e5d5f8f97443c`. A separate synthetic system setting disabled folder-trust prompting for this isolated capture; its SHA-256 is `7b0daa3b06899872a701f9cb0d03bda3da16b64ad769e662e5c36bf342af807d`. `GEMINI_API_KEY` contained the literal non-secret placeholder `COURSE_CAPTURE_NOT_A_SECRET`; `mcp list` did not make a model request and no value appears in the figure.

Commands:

```sh
npx -y @google/gemini-cli@0.56.0 --version
GEMINI_CLI_SYSTEM_SETTINGS_PATH=<synthetic-system-settings> GEMINI_API_KEY=<non-secret-synthetic-placeholder> npx -y @google/gemini-cli@0.56.0 mcp --help
GEMINI_CLI_SYSTEM_SETTINGS_PATH=<synthetic-system-settings> GEMINI_API_KEY=<non-secret-synthetic-placeholder> npx -y @google/gemini-cli@0.56.0 mcp list
```

The pinned Everything reference server reported Connected. The course’s modern-only CourseOps fixture reported Disconnected. The image does not assign a root cause: a status line is a starting point for a versioned trace. Gemini CLI 0.56.0 uses a legacy-era MCP SDK path, so the Connected line is not evidence of MCP 2026-07-28 compatibility.

Hashes and transformation:

- Captured: `2026-08-24T12:10:58+08:00`
- Raw 1916 × 1274 PNG SHA-256: `496cc4e2d00321c4bb60de9e8a57c7730c36097beeb13fdd5098de083ff8dbc1`
- Extract: `left=112, top=140, width=1692, height=952`
- Published PNG SHA-256: `b0e6bc2c964f005691e1dea2d1a5200b085edc5440c66e07da1749efeda29489`
- 1600 × 900 WebP SHA-256: `ba56cdaa0e29938b11ecca0f6716165ff98c912e6046fcd079dd2c2d83a3f84f`
- 960 × 540 WebP SHA-256: `0b06fdbbb5e3618bed6c0a2a243103c12a520deee796f3fcbe1d204d545564bd`

Rights boundary: this is a course-authored capture of first-party open-source client output, not a republished Google codelab screenshot. Google’s official brand guidance covers educational product screenshots; the source client is Apache-2.0. Gemini CLI output pixels are unchanged; the disclosed crop removes only non-product operating-system chrome. Internal release review is not Google authorization. Google and Gemini marks belong to Google, and no endorsement is implied.

## OpenAI Codex CLI 0.149.1

Evidence class: `configuration-ui`. `codex mcp get` reads effective local configuration and does not initialize the server.

Pinned client:

- Package: `@openai/codex@0.149.1`
- Release: https://github.com/openai/codex/releases/tag/rust-v0.149.1
- Commit: `ff29a44391deccde0aba0f8390337d7f3c319ea4`
- npm tarball: https://registry.npmjs.org/@openai/codex/-/codex-0.149.1.tgz
- npm integrity: `sha512-6q5pbcpFbJbqOpkubSDBwXmktQ55aD8eUzGzBF1zASob2DjwhBKDSNGtdZKalfrNJUdTDTPDMmzCXEXs5tMBYA==`
- Apache-2.0 license: https://github.com/openai/codex/blob/ff29a44391deccde0aba0f8390337d7f3c319ea4/LICENSE
- NOTICE: https://github.com/openai/codex/blob/ff29a44391deccde0aba0f8390337d7f3c319ea4/NOTICE
- Local license and NOTICE: `public/courses/mcp/licenses/APACHE-2.0.txt` and `public/courses/mcp/licenses/CODEX-NOTICE.txt`

Installed executable-origin evidence, verified read-only on 2026-08-24:

- `command -v codex`: `<npm-global-bin>/codex`
- Symlink target: `../lib/node_modules/@openai/codex/bin/codex.js`
- Node entrypoint SHA-256: `134063e133f0b4244fa3b251acf973d4fe4b4aeeacbdc135211bf480f59f1477`
- Resolved platform package: `@openai/codex@0.149.1-darwin-arm64`
- Platform tarball: https://registry.npmjs.org/@openai/codex/-/codex-0.149.1-darwin-arm64.tgz
- Platform integrity: `sha512-6X84kTCbnTgPIJ2EdcPsrvwS0Wxsqpa+bCswGmRf4BjhcQ5nPMnBC6yCAaCMj+vrbXQHj+L6sa9FaR4QkmA1qw==`
- Platform npm SHA-1: `824db75c200eb9aa0225d1dbb61e4fc2f2c8a123`
- Native executable relative path: `node_modules/@openai/codex-darwin-arm64/vendor/aarch64-apple-darwin/bin/codex`
- Native executable SHA-256: `f0d8762236594359b60cfbe17f4c7e945a3ce8d1c91e74778838c968d250fb6c`
- Native executable size: 220,552,944 bytes
- Observed version: `codex-cli 0.149.1`

This same-day installation-origin check corroborates the recorded package path and version. Because the executable-origin check was not separately timestamped at the exact capture instant, it is not presented as cryptographic proof that no installation change occurred between capture and verification. A future recapture can close that final boundary by hashing the resolved native executable immediately before invoking it.

Commands:

```sh
codex --version
codex -c features.mcp_2026_07_28=true features list | grep '^mcp_2026_07_28'
codex \
  -c features.mcp_2026_07_28=true \
  -c 'mcp_servers.courseops_modern.command="node"' \
  -c 'mcp_servers.courseops_modern.args=["tests/fixtures/mcp-courseops/src/server.mjs"]' \
  -c 'mcp_servers.courseops_modern.env={CODEX_MCP_PROTOCOL_VERSION="2026-07-28"}' \
  -c 'mcp_servers.courseops_modern.enabled_tools=["course.get_lesson","course.record_evidence"]' \
  -c 'mcp_servers.courseops_modern.disabled_tools=["course.record_evidence"]' \
  mcp get courseops_modern
```

The command-line overrides constructed a one-command synthetic view without reading, merging, writing, or displaying the user’s persistent MCP server configuration. Codex masked the marker value in its own output. The figure visibly records the feature as `under development true`; in 0.149.1 it is disabled by default. A real modern stdio connection requires both client feature enablement and the per-server `CODEX_MCP_PROTOCOL_VERSION=2026-07-28` marker.

Hashes and transformation:

- Captured: `2026-08-24T12:14:41+08:00`
- Raw 1828 × 1186 PNG SHA-256: `5ef73ea8658e98792a85e12946e37acafedab8431777bd93249f71b74a97f64a`
- Extract: `left=68, top=114, width=1692, height=952`
- Published PNG SHA-256: `d2be69914c0dccfc39761554f4635f2a42fd360991cede0273fa6141644fe95c`
- 1600 × 900 WebP SHA-256: `232dc1d5416253feb06075a4853a54195ebca1d9320d66b81ca2bcd15e276f2f`
- 960 × 540 WebP SHA-256: `7a9f30690bb80f294ed8fde7b4bb5cd2244990abc700cab88beafd470aebc2a2`

Rights boundary: this is a course-authored capture of first-party Apache-2.0 Codex CLI output and preserves the applicable upstream NOTICE text locally. It is not a proprietary ChatGPT account screenshot. Codex CLI output pixels are unchanged; the disclosed crop removes only non-product operating-system chrome. Internal release review is not OpenAI authorization. OpenAI and Codex marks belong to OpenAI, and no affiliation or endorsement is implied.

## Withheld assets remain withheld

The two older Gemini codelab images and two OpenAI developer-documentation design images remain outside `public/` and retain `not-distributed` status in the manifest. The new captures do not relabel or substitute those binaries.
