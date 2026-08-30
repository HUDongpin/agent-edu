# CourseOps MCP 2026-07-28 reference

This dependency-free Node.js **wire fixture** is a runnable companion to aicourse.top Course 10. It deliberately targets the stateless, handshake-free MCP `2026-07-28` message model rather than silently falling back to an earlier era. It complements—not replaces—the lesson's pinned Tier 1 SDK implementation exercise.

It includes:

- a newline-delimited stdio server with `server/discover`;
- per-request protocol, client-capability, and optional client-identity metadata validation;
- `tools/list`, `tools/call`, `resources/list`, `resources/read`, `prompts/list`, and `prompts/get`;
- complete results, mandatory `ttlMs`/`cacheScope` hints on every implemented cacheable discovery/list/read result, structured tool output, a dry-run write, an optimistic-revision precondition, and a normal tool-execution error;
- a tiny policy-aware client, synthetic fixture, lockfile, and automated tests.

Run it with Node.js 22 or newer:

```sh
npm test
npm run client
```

`npm run client` prints five newline-delimited JSON-RPC responses: discovery, tool inventory, one read, one expected revision conflict, and one resource read. The expected sequence has IDs 1–5; every successful result carries `resultType: "complete"` and self-reported server identity in result `_meta`, while ID 4 carries `isError: true` with `REVISION_CONFLICT`. No secrets, network access, production files, `initialize`, protocol sessions, or `Mcp-Session-Id` are used.

For Inspector, run `node src/server.mjs` as a stdio command and pin the protocol era to Modern `2026-07-28`. First compare `server/discover` and `tools/list`; then call `course.get_status`, and test `course.set_status` with `dryRun: true` before any applied fixture write.

This is a compact protocol fixture, not a general-purpose SDK implementation. Production software should use a current Tier 1 SDK where practical, pin it, run the official conformance scenarios, and add real authentication, authorization, observability, resource limits, and deployment hardening.
