import readline from "node:readline";
import { fileURLToPath } from "node:url";
import courseFixture from "../fixtures/course.json" with { type: "json" };

const PROTOCOL_VERSION = "2026-07-28";
const SERVER_INFO = { name: "aicourse-courseops", version: "1.0.0" };
let course = structuredClone(courseFixture);

function error(id, code, message, data) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message, ...(data ? { data } : {}) } };
}

function complete(id, result) {
  const resultMeta = result?._meta && typeof result._meta === "object" && !Array.isArray(result._meta)
    ? result._meta
    : {};
  return {
    jsonrpc: "2.0",
    id,
    result: {
      ...result,
      resultType: "complete",
      _meta: {
        ...resultMeta,
        "io.modelcontextprotocol/serverInfo": SERVER_INFO,
      },
    },
  };
}

function validateEnvelope(message) {
  if (message?.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return error(message?.id, -32600, "Invalid Request");
  }
  if (
    Object.hasOwn(message, "id")
    && !(typeof message.id === "string" || Number.isSafeInteger(message.id))
  ) {
    return error(null, -32600, "Invalid Request: request id must be a string or integer");
  }
  const meta = message.params?._meta;
  if (!meta || !Object.hasOwn(meta, "io.modelcontextprotocol/protocolVersion")) {
    return error(message.id, -32602, "Invalid params: protocolVersion metadata is required");
  }
  if (meta["io.modelcontextprotocol/protocolVersion"] !== PROTOCOL_VERSION) {
    return error(message.id, -32022, "UnsupportedProtocolVersionError", { supportedVersions: [PROTOCOL_VERSION] });
  }
  const clientCapabilities = meta["io.modelcontextprotocol/clientCapabilities"];
  if (!clientCapabilities || typeof clientCapabilities !== "object" || Array.isArray(clientCapabilities)) {
    return error(message.id, -32602, "Invalid params: clientCapabilities metadata is required");
  }
  const clientInfo = meta["io.modelcontextprotocol/clientInfo"];
  if (
    clientInfo !== undefined
    && (
      !clientInfo
      || typeof clientInfo !== "object"
      || Array.isArray(clientInfo)
      || typeof clientInfo.name !== "string"
      || typeof clientInfo.version !== "string"
    )
  ) {
    return error(message.id, -32602, "Invalid params: clientInfo must include string name and version fields");
  }
  return null;
}

function toolResult(id, structuredContent, text, isError = false) {
  return complete(id, {
    content: [{ type: "text", text }],
    structuredContent,
    isError,
  });
}

function handle(message) {
  const isJsonRpcObject = message !== null && typeof message === "object" && !Array.isArray(message);
  const hasId = isJsonRpcObject && Object.hasOwn(message, "id");
  const notification = isJsonRpcObject
    && message.jsonrpc === "2.0"
    && typeof message.method === "string"
    && !hasId;
  const invalid = validateEnvelope(message);
  if (invalid) return notification ? null : invalid;
  if (notification) return null;

  const args = message.params?.arguments ?? {};
  switch (message.method) {
    case "server/discover":
      return complete(message.id, {
        supportedVersions: [PROTOCOL_VERSION],
        capabilities: { tools: {}, resources: {}, prompts: {} },
        instructions: "Synthetic CourseOps data only. Writes default to dry-run and require an exact revision.",
        _meta: { "io.modelcontextprotocol/serverInfo": SERVER_INFO },
      });
    case "tools/list":
      return complete(message.id, {
        ttlMs: 60_000,
        cacheScope: "public",
        tools: [
          {
            name: "course.get_status",
            title: "Get course status",
            description: "Return the synthetic course status and revision. Does not write.",
            inputSchema: { $schema: "https://json-schema.org/draft/2020-12/schema", type: "object", properties: {}, additionalProperties: false },
            outputSchema: {
              $schema: "https://json-schema.org/draft/2020-12/schema",
              type: "object",
              properties: { id: { type: "string" }, status: { type: "string" }, revision: { type: "integer" } },
              required: ["id", "status", "revision"],
              additionalProperties: false
            },
            annotations: { readOnlyHint: true, idempotentHint: true },
          },
          {
            name: "course.set_status",
            title: "Set course status",
            description: "Preview or apply one synthetic status change when expectedRevision matches.",
            inputSchema: {
              $schema: "https://json-schema.org/draft/2020-12/schema",
              type: "object",
              properties: {
                status: { type: "string", enum: ["draft", "review", "published"] },
                expectedRevision: { type: "integer", minimum: 1 },
                dryRun: { type: "boolean", default: true }
              },
              required: ["status", "expectedRevision"],
              additionalProperties: false
            },
            annotations: { destructiveHint: true, idempotentHint: false },
          }
        ],
      });
    case "tools/call": {
      if (message.params?.name === "course.get_status") {
        if (Object.keys(args).length !== 0) {
          return toolResult(message.id, { code: "INVALID_ARGUMENTS" }, "course.get_status accepts no arguments.", true);
        }
        const value = { id: course.id, status: course.status, revision: course.revision };
        return toolResult(message.id, value, `${value.id} is ${value.status} at revision ${value.revision}.`);
      }
      if (message.params?.name !== "course.set_status") {
        return error(message.id, -32602, "Invalid params: unknown tool");
      }
      const unknown = Object.keys(args).filter((key) => !["status", "expectedRevision", "dryRun"].includes(key));
      if (
        unknown.length > 0
        || !["draft", "review", "published"].includes(args.status)
        || !Number.isInteger(args.expectedRevision)
        || (args.dryRun !== undefined && typeof args.dryRun !== "boolean")
      ) {
        return toolResult(message.id, { code: "INVALID_ARGUMENTS" }, "status and integer expectedRevision are required.", true);
      }
      if (args.expectedRevision !== course.revision) {
        return toolResult(message.id, { code: "REVISION_CONFLICT", currentRevision: course.revision }, `Revision conflict: current revision is ${course.revision}.`, true);
      }
      const preview = { before: course.status, after: args.status, revision: course.revision, dryRun: args.dryRun !== false };
      if (args.dryRun !== false) return toolResult(message.id, preview, `Dry run: ${course.status} → ${args.status}; no change applied.`);
      course = { ...course, status: args.status, revision: course.revision + 1 };
      return toolResult(message.id, { ...preview, revision: course.revision }, `Applied status ${course.status}; revision is now ${course.revision}.`);
    }
    case "resources/list":
      return complete(message.id, {
        ttlMs: 60_000,
        cacheScope: "public",
        resources: [{ uri: "courseops://courses/mcp-10", name: course.title, title: course.title, mimeType: "application/json" }],
      });
    case "resources/read":
      if (message.params?.uri !== "courseops://courses/mcp-10") return error(message.id, -32602, "Invalid params: unknown resource URI");
      return complete(message.id, {
        ttlMs: 0,
        cacheScope: "private",
        contents: [{ uri: "courseops://courses/mcp-10", mimeType: "application/json", text: JSON.stringify(course) }],
      });
    case "prompts/list":
      return complete(message.id, {
        ttlMs: 60_000,
        cacheScope: "public",
        prompts: [{ name: "course.review", title: "Review course evidence", description: "Prepare a bounded review request.", arguments: [{ name: "focus", required: true }] }],
      });
    case "prompts/get":
      if (message.params?.name !== "course.review" || typeof message.params?.arguments?.focus !== "string") {
        return error(message.id, -32602, "Invalid params: course.review requires focus");
      }
      return complete(message.id, {
        description: "A user-selected course review template.",
        messages: [{ role: "user", content: { type: "text", text: `Review the synthetic MCP course evidence for ${message.params.arguments.focus}. Cite artifacts and state limitations.` } }],
      });
    default:
      return error(message.id, -32601, "Method not found");
  }
}

export function resetFixture() {
  course = structuredClone(courseFixture);
}

export function handleForTest(message) {
  return handle(message);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  lines.on("line", (line) => {
    try {
      const response = handle(JSON.parse(line));
      if (response) process.stdout.write(`${JSON.stringify(response)}\n`);
    } catch {
      process.stdout.write(`${JSON.stringify(error(null, -32700, "Parse error"))}\n`);
    }
  });
}
