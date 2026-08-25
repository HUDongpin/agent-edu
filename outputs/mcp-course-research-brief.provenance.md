# MCP Course 10 provenance ledger

Observed/accessed on 2026-08-23 or 2026-08-24 as recorded per source. The complete 71-record machine-readable source ledger lives in `lib/mcp/sources.ts`; the 12-record high-risk claim map lives in `lib/mcp/claims.ts`; the eight-figure registry lives in `lib/mcp/figures.ts`; and asset-level provenance, privacy, rights, and derivative hashes live in `public/courses/mcp/figure-manifest.json`.

## Normative protocol sources

- MCP 2026-07-28 overview: https://modelcontextprotocol.io/specification/2026-07-28/basic
- Changelog: https://modelcontextprotocol.io/specification/2026-07-28/changelog
- Versioning: https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning
- Discovery: https://modelcontextprotocol.io/specification/2026-07-28/server/discover
- Tools: https://modelcontextprotocol.io/specification/2026-07-28/server/tools
- Resources: https://modelcontextprotocol.io/specification/2026-07-28/server/resources
- Prompts: https://modelcontextprotocol.io/specification/2026-07-28/server/prompts
- Elicitation: https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation
- MRTR: https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr
- Transports: https://modelcontextprotocol.io/specification/2026-07-28/basic/transports
- Streamable HTTP: https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http
- Subscriptions: https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions
- Progress: https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/progress
- Cancellation: https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/cancellation
- Authorization: https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization
- Schema: https://modelcontextprotocol.io/specification/2026-07-28/schema
- Deprecated features: https://modelcontextprotocol.io/specification/2026-07-28/deprecated

## Academy and current product sources

- Claude Academy introduction: https://academy.claude.com/courses/introduction-to-model-context-protocol
- Claude Academy advanced topics: https://academy.claude.com/courses/model-context-protocol-advanced-topics
- Claude Code MCP: https://code.claude.com/docs/en/mcp
- Claude Desktop local MCP: https://support.claude.com/en/articles/10949351-getting-started-with-local-mcp-servers-on-claude-desktop
- Claude remote custom connectors: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
- OpenAI Academy MCP for Builders: https://academy.openai.com/public/clubs/builders-etkn1/resources/mcp-for-builders
- OpenAI Codex MCP: https://learn.chatgpt.com/docs/extend/mcp
- OpenAI Responses API MCP: https://developers.openai.com/api/docs/guides/tools-connectors-mcp
- OpenAI Apps UI: https://developers.openai.com/plugins/build/chatgpt-ui
- Gemini CLI MCP documentation: https://geminicli.com/docs/tools/mcp-server/
- Google Gemini CLI codelab: https://codelabs.developers.google.com/genai-for-dev-cli-dev-use-cases#17
- Google GitHub MCP codelab: https://codelabs.developers.google.com/gemini-cli-code-analysis#7

## Practitioner records

- https://github.com/github/github-mcp-server/issues/1683
- https://github.com/github/github-mcp-server/issues/1314
- https://github.com/github/github-mcp-server/discussions/1802
- https://github.com/54yyyu/zotero-mcp/issues/283
- https://github.com/aaronsb/obsidian-mcp-plugin/issues/268
- https://github.com/kagent-dev/kagent/issues/1272
- https://github.com/bruchris/canvas-lms-mcp/issues/124

These records support only bounded, record-specific observations. Status, popularity, or one report does not establish prevalence.

## Figure originals

| ID | Original | Evidence class | Publisher | SHA-256 |
|---|---|---|---|---|
| inspector-settings | `inspector-settings.png` | Direct MCP UI, legacy controls visible | Model Context Protocol | `74662c86b620e80d89e090ef54c1c208e9eca2d7c1aa8f2da10ef8bbdc2b717e` |
| inspector-tools | `inspector-tools.png` | Direct MCP UI | Model Context Protocol | `8426d6390853b5663bb445df8e0d5dc48435fc02d6885d5b2d294853b4bedae6` |
| inspector-resources | `inspector-resources.png` | Direct MCP UI, legacy subscription UI visible | Model Context Protocol | `868247257b143b800ee446b41fc7ce45fca31ae0673b4ed4f29ca1712c745078` |
| inspector-prompts | `inspector-prompts.png` | Direct MCP UI | Model Context Protocol | `f1395e4719c303365269e135e59a03c673753270a8587560e4145955de258cb6` |
| inspector-protocol | `inspector-protocol.png` | Direct MCP UI, legacy trace | Model Context Protocol | `7abdc6df52d3dc9e28d6d91183507c2adab06971e8ce6d9e72dfd031146973b3` |
| inspector-apps | `inspector-apps.png` | Direct MCP UI | Model Context Protocol | `2a436610093a2c11e229fd8fa3bc8126dbed715b1b02e694f940a911ba91a04a` |
| gemini-cli-mcp-inventory | `gemini-cli-mcp-inventory.png` | Live host inventory/status, legacy-era boundary | Google Gemini CLI 0.56.0 | `b0e6bc2c964f005691e1dea2d1a5200b085edc5440c66e07da1749efeda29489` |
| codex-cli-mcp-configuration | `codex-cli-mcp-configuration.png` | Configuration UI, not a live connection | OpenAI Codex CLI 0.149.1 | `d2be69914c0dccfc39761554f4635f2a42fd360991cede0273fa6141644fe95c` |

The six Inspector masters are byte-for-byte copies from the immutable MCP documentation revision and remain separately attributed under CC BY 4.0. The two provider-host masters are course-authored, direct PTY terminal captures made with synthetic data; their deterministic privacy crops remove only window chrome and the local user name. Neither host capture is represented as a successful 2026-07-28 handshake. The full derivative hash ledger, immutable upstream URLs, license and NOTICE evidence, raw-master hashes retained outside `public/`, privacy review, exact transformation recipes, protocol-evidence classes, and four withheld Google/OpenAI candidate records are in `public/courses/mcp/figure-manifest.json` and `outputs/mcp-host-ui-capture-provenance.md`.

## Local artifacts

- Course source: `lib/mcp/`
- Course UI: `components/mcp/`
- Routes: `app/[locale]/mcp/`
- Nine complete long-form locale bundles: `messages/mcp/`
- Figure assets and asset notice: `public/courses/mcp/`
- Nine localized capstone templates: `public/courses/mcp/capstone/`
- Runnable reference: `examples/mcp-courseops/`
- Release validator: `scripts/check-mcp-course.mjs`
- Static-export auditor and browser harness: `scripts/audit-mcp-export.mjs`, `scripts/test-mcp-export.mjs`, and `tests/mcp-course.spec.ts`
- Browser release evidence: `outputs/mcp-browser-qa.md` and `output/playwright/mcp-course/`
