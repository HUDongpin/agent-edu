# Static asset baseline review — `342ab475`

## Decision

Refresh the explicit static-export baselines to the reproducible optimized
output of content candidate
`342ab475252b28084baf1c517e73a1cd58b452d7`, while retaining the existing 10%
aggregate regression formula and the 500 KiB individual-file caps.

This is a baseline review, not a release approval or a claim that the current
payload is optimal. Physical-device, representative-network, and field Core Web
Vitals evidence remain separate and pending under
`docs/release/performance-verification.md`.

## Reproduction contract

- Date: 2026-08-31, Asia/Taipei.
- Source: clean detached worktrees at exact SHA `342ab475`.
- Runtime: Node `v24.15.0`.
- Framework: Next.js `16.3.1`, Turbopack production build.
- Dependency input: the repository's current lock-matched `node_modules` tree,
  cloned independently into each worktree; no external worktree symlink.
- Command: `npm run build`, including 21/21 development course gates, blocked
  export pruning, sitemap generation, Agent Orchestration static audit, MCP
  export audit, and release metadata generation.
- Both builds generated 741 routes, 740 HTML files after export, 62 sitemap
  shards, and 4,817 final files.
- Both builds bound release metadata to the exact source SHA.

The two final summaries were byte-for-byte equal:

| Measure | Build A | Build B |
|---|---:|---:|
| `_next/static` bytes | 5,318,714 | 5,318,714 |
| JavaScript bytes | 4,627,427 | 4,627,427 |
| CSS bytes | 691,287 | 691,287 |
| Largest `_next/static` file | 234,172 | 234,172 |
| Emitted public bytes | 14,814,031 | 14,814,031 |
| Largest public media file | 495,549 | 495,549 |
| Route payload bytes | 402,827,884 | 402,827,884 |
| Largest HTML/RSC payload | 414,577 | 414,577 |
| Largest sitemap shard | 21,785 | 21,785 |
| Complete export bytes | 422,960,629 | 422,960,629 |

The 13 CSS chunk paths, byte lengths, and SHA-256 digests were also identical:

| Bytes | SHA-256 |
|---:|---|
| 4,936 | `33a7765ffbb3dac197127ed9c4ebfbb35e5965b3cf452f5ba3049943659a2f7c` |
| 52,135 | `9b7a794c18c3c17c7cce1cd0c2081622f48e44c92ed09afcfd0cbdef62c4be3c` |
| 8,082 | `146c8f50a4da0cac52b59900008554c93b99561b2e9129ff72b2037414ddf113` |
| 102,885 | `baf01a22b175eaef3585238cdeb0807a30710db53a5bdd717920f53ee5c1fab0` |
| 43,368 | `f4b3ee03d0ed8e58d79cfc94c4419281ddda18a8a1ce8bcd52b896c46b95baa7` |
| 52,967 | `70d60ea3cfe23270533d64272f1b1f90826b1a2b14ef2d55a8d980b0a11ff5a6` |
| 61,303 | `f42787a9edd5bffeba33792b90dd06f704037494852dfa2dd555a1e7b31513c2` |
| 86,215 | `f8f6c2809b8735d73014565aba037eb168b24a4325cf6fc65ee363216cfe223b` |
| 55,710 | `4a50c2717f280af7ee5588e9214650ad8d61619d69845eaa74f47f0a00289c44` |
| 52,326 | `49399a7b3a8367266cb105c9f184168f5e776f4de736a1d54ed5500167fdcf1c` |
| 119,033 | `af609f6258d556548d2d611abe9eb2b59fa9d2c5c8d0ed6bea7cfcb0c6f2f215` |
| 10,921 | `4d42935560c9da6a4e85f0ae7d3011faedb5f6bbcf4daa83ad0343b3d0acf9f7` |
| 41,406 | `c1ed1445242ef264c96bc3002a0e64f2301974d56a8a3127a6489dffa81b495a` |

## Optimization before refresh

The old CSS baseline was not refreshed at the first failure. The audit first
compared clean `origin/codex/platform-release-v1@0d6a86e7` (563,008 CSS bytes)
with the cumulative integration output and accounted for the growth by course
surface. It found no byte-identical chunks, duplicated CSS-module prefixes, or
orphan CSS chunks.

It did find one release-state ownership defect: ten published GitHub components
imported the blocked Codex stylesheet. The repair introduced a GitHub-owned
foundation and a manifest-derived test that rejects published-to-non-published
stylesheet imports. It removed the Codex prefix from all 117 GitHub pages and
reduced their route chunk by 12,165 bytes, from 64,491 to 52,326.

Trackable completion was then moved onto the existing lazy public progress
adapter graph, reducing that feature's static JavaScript delta from about
24.9 KiB to about 13.1 KiB with no CSS source increase.

After those repairs, preserving the previous cap would still require a broad
multi-course style rollback rather than a narrow defect fix. The remaining
growth corresponds to implemented course surfaces, so the optimized,
reproducible output becomes the new explicit baseline.

## Route CSS distribution

Each CSS request was compressed independently with Node zlib using gzip level 9
and Brotli quality 11. The two builds produced identical distributions across
740 exported HTML files:

| Encoding | Min | Median | Mean | P90 | Max |
|---|---:|---:|---:|---:|---:|
| Raw | 119,033 | 172,000 | 173,224 | 205,248 | 221,918 |
| gzip-9 | 22,516 | 29,993 | 30,197 | 34,362 | 36,190 |
| Brotli-11 | 19,202 | 25,600 | 25,750 | 29,241 | 30,425 |

These are reproducible local compression estimates, not observed production
transfer sizes.

## Remaining performance work

- The global stylesheet still makes Handbook-only rules available to unrelated
  routes. A route-owned split may improve render-blocking bytes but requires
  browser coverage of interaction states.
- The AI Tutor, Prompts, and RAG merged chunk contains route-specific unused
  rules. Benchmarking Next.js `experimental.cssChunking: "graph"` is a separate
  per-route performance experiment; splitting chunks does not itself reduce the
  total emitted CSS budget.
- Largest-route and compressed-route regression checks should be considered in
  addition to the existing total-output budget.
- Final-candidate synthetic measurements, physical-device/network checks, and
  field CWV remain pending and cannot be inferred from this inventory.

## Boundary

This review changes no course publication state, human-review status,
deployment configuration, or production alias. In particular, Course 20 and
the other seven blocked courses remain non-public and their release gates keep
failing closed for their recorded blockers.
