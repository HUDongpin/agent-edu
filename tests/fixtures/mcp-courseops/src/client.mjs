import { spawn } from "node:child_process";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const server = spawn(process.execPath, [fileURLToPath(new URL("./server.mjs", import.meta.url))], {
  stdio: ["pipe", "pipe", "inherit"],
});
const output = readline.createInterface({ input: server.stdout, crlfDelay: Infinity });
const pending = [];
output.on("line", (line) => pending.shift()?.(JSON.parse(line)));

const meta = {
  "io.modelcontextprotocol/protocolVersion": "2026-07-28",
  "io.modelcontextprotocol/clientInfo": { name: "courseops-reference-client", version: "1.0.0" },
  "io.modelcontextprotocol/clientCapabilities": {},
};
let id = 0;

function request(method, params = {}) {
  id += 1;
  return new Promise((resolve) => {
    pending.push(resolve);
    server.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params: { ...params, _meta: meta } })}\n`);
  });
}

const trace = [];
trace.push(await request("server/discover"));
trace.push(await request("tools/list"));
trace.push(await request("tools/call", { name: "course.get_status", arguments: {} }));
trace.push(await request("tools/call", { name: "course.set_status", arguments: { status: "review", expectedRevision: 999, dryRun: true } }));
trace.push(await request("resources/read", { uri: "courseops://courses/mcp-10" }));

if (trace[0].result?.supportedVersions?.[0] !== "2026-07-28") throw new Error("Discovery version assertion failed");
if (trace[2].result?.structuredContent?.status !== "draft") throw new Error("Read tool assertion failed");
if (trace[3].result?.isError !== true || trace[3].result?.structuredContent?.code !== "REVISION_CONFLICT") throw new Error("Expected-failure assertion failed");

for (const response of trace) process.stdout.write(`${JSON.stringify(response)}\n`);
server.stdin.end();
await new Promise((resolve, reject) => {
  server.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`Server exited ${code}`)));
});
