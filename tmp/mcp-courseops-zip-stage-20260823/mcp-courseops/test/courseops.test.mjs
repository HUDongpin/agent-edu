import assert from "node:assert/strict";
import test from "node:test";
import { handleForTest, resetFixture } from "../src/server.mjs";

const meta = {
  "io.modelcontextprotocol/protocolVersion": "2026-07-28",
  "io.modelcontextprotocol/clientInfo": { name: "courseops-test", version: "1.0.0" },
  "io.modelcontextprotocol/clientCapabilities": {},
};
const request = (id, method, params = {}) => ({ jsonrpc: "2.0", id, method, params: { ...params, _meta: meta } });

test.beforeEach(resetFixture);

test("discovers a stateless 2026-07-28 server", () => {
  const response = handleForTest(request(1, "server/discover"));
  assert.equal(response.result.resultType, "complete");
  assert.deepEqual(response.result.supportedVersions, ["2026-07-28"]);
  assert.deepEqual(Object.keys(response.result.capabilities), ["tools", "resources", "prompts"]);
  assert.equal(response.result.serverInfo, undefined);
  assert.deepEqual(response.result._meta["io.modelcontextprotocol/serverInfo"], {
    name: "aicourse-courseops",
    version: "1.0.0",
  });
});

test("rejects a missing per-request capability envelope", () => {
  const missingVersion = handleForTest({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  assert.equal(missingVersion.error.code, -32602);

  const missingCapabilities = handleForTest({ jsonrpc: "2.0", id: 3, method: "tools/list", params: { _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28" } } });
  assert.equal(missingCapabilities.error.code, -32602);

  const arrayCapabilities = handleForTest({
    jsonrpc: "2.0",
    id: 31,
    method: "tools/list",
    params: { _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": [] } },
  });
  assert.equal(arrayCapabilities.error.code, -32602);

  const malformedClientInfo = handleForTest({
    jsonrpc: "2.0",
    id: 32,
    method: "tools/list",
    params: { _meta: { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {}, "io.modelcontextprotocol/clientInfo": { name: "courseops-test" } } },
  });
  assert.equal(malformedClientInfo.error.code, -32602);

  const wrongVersion = handleForTest({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/list",
    params: { _meta: { "io.modelcontextprotocol/protocolVersion": "2025-11-25", "io.modelcontextprotocol/clientCapabilities": {} } },
  });
  assert.equal(wrongVersion.error.code, -32022);
  assert.deepEqual(wrongVersion.error.data.supportedVersions, ["2026-07-28"]);
});

test("rejects null, fractional, object, and boolean request IDs", () => {
  for (const id of [null, 1.5, {}, true]) {
    const response = handleForTest({ jsonrpc: "2.0", id, method: "tools/list", params: { _meta: meta } });
    assert.equal(response.error.code, -32600);
    assert.equal(response.id, null);
  }
});

test("returns machine-checkable normal and conflict tool results", () => {
  const read = handleForTest(request(3, "tools/call", { name: "course.get_status", arguments: {} }));
  assert.equal(read.result.resultType, "complete");
  assert.equal(read.result.structuredContent.status, "draft");
  assert.equal(read.result.isError, false);
  assert.deepEqual(read.result._meta["io.modelcontextprotocol/serverInfo"], {
    name: "aicourse-courseops",
    version: "1.0.0",
  });

  const conflict = handleForTest(request(4, "tools/call", { name: "course.set_status", arguments: { status: "review", expectedRevision: 99, dryRun: true } }));
  assert.equal(conflict.result.isError, true);
  assert.equal(conflict.result.structuredContent.code, "REVISION_CONFLICT");
});

test("enforces declared tool schemas instead of ignoring extra or mistyped fields", () => {
  const extraRead = handleForTest(request(9, "tools/call", { name: "course.get_status", arguments: { surprise: true } }));
  assert.equal(extraRead.result.isError, true);
  assert.equal(extraRead.result.structuredContent.code, "INVALID_ARGUMENTS");

  const mistypedWrite = handleForTest(request(10, "tools/call", { name: "course.set_status", arguments: { status: "review", expectedRevision: 3, dryRun: "yes" } }));
  assert.equal(mistypedWrite.result.isError, true);
  assert.equal(mistypedWrite.result.structuredContent.code, "INVALID_ARGUMENTS");

  const extraWrite = handleForTest(request(11, "tools/call", { name: "course.set_status", arguments: { status: "review", expectedRevision: 3, dryRun: true, force: true } }));
  assert.equal(extraWrite.result.isError, true);
});

test("produces no JSON-RPC response for a valid notification", () => {
  const notification = { jsonrpc: "2.0", method: "notifications/cancelled", params: { requestId: 99, _meta: meta } };
  assert.equal(handleForTest(notification), null);

  const missingMethod = handleForTest({ jsonrpc: "2.0", params: { _meta: meta } });
  assert.equal(missingMethod.error.code, -32600);
  assert.equal(missingMethod.id, null);

  const wrongJsonRpcVersion = handleForTest({ jsonrpc: "1.0", method: "notifications/cancelled", params: { requestId: 99, _meta: meta } });
  assert.equal(wrongJsonRpcVersion.error.code, -32600);
  assert.equal(wrongJsonRpcVersion.id, null);
});

test("keeps dry run reversible and applies only an exact-revision write", () => {
  const dryRun = handleForTest(request(5, "tools/call", { name: "course.set_status", arguments: { status: "review", expectedRevision: 3, dryRun: true } }));
  assert.equal(dryRun.result.structuredContent.dryRun, true);
  assert.equal(handleForTest(request(6, "tools/call", { name: "course.get_status", arguments: {} })).result.structuredContent.status, "draft");

  const applied = handleForTest(request(7, "tools/call", { name: "course.set_status", arguments: { status: "review", expectedRevision: 3, dryRun: false } }));
  assert.equal(applied.result.structuredContent.revision, 4);
  assert.equal(handleForTest(request(8, "tools/call", { name: "course.get_status", arguments: {} })).result.structuredContent.status, "review");
});
