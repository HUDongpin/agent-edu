#!/usr/bin/env node

/**
 * Audit, serve, and browser-test the Course 10 static export without relying on
 * Next.js runtime behavior. Playwright arguments after this script are passed
 * through, for example: `node scripts/test-mcp-export.mjs --project=chromium`.
 */

import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT_ROOT = join(ROOT, "out");
const HOST = "127.0.0.1";
const CONTENT_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
  [".zip", "application/zip"],
]);

function isInsideExport(path) {
  return path === OUT_ROOT || path.startsWith(`${OUT_ROOT}${sep}`);
}

async function fileIfPresent(path) {
  const metadata = await stat(path).catch(() => null);
  return metadata?.isFile() ? path : null;
}

async function resolveRequestFile(pathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decodedPath.includes("\0")) return null;

  let candidate = resolve(OUT_ROOT, `.${decodedPath}`);
  if (!isInsideExport(candidate)) return null;
  const metadata = await stat(candidate).catch(() => null);
  if (metadata?.isDirectory()) candidate = join(candidate, "index.html");

  const direct = await fileIfPresent(candidate);
  if (direct) return direct;
  if (!extname(candidate)) {
    const html = await fileIfPresent(`${candidate}.html`);
    if (html) return html;
    const index = await fileIfPresent(join(candidate, "index.html"));
    if (index) return index;
  }
  return null;
}

async function handleRequest(request, response) {
  const method = request.method ?? "GET";
  if (method !== "GET" && method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }
  const pathname = new URL(request.url ?? "/", `http://${HOST}`).pathname;
  const path = await resolveRequestFile(pathname);
  if (!path) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found\n");
    return;
  }
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": CONTENT_TYPES.get(extname(path).toLowerCase()) ?? "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
  if (method === "HEAD") {
    response.end();
    return;
  }
  const stream = createReadStream(path);
  stream.once("error", () => response.destroy());
  stream.pipe(response);
}

function spawnAndWait(command, args, options = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: "inherit", ...options });
    child.once("error", rejectRun);
    child.once("exit", (code, signal) => {
      if (signal) rejectRun(new Error(`${command} terminated by ${signal}`));
      else resolveRun(code ?? 1);
    });
  });
}

async function auditExport() {
  const code = await spawnAndWait(process.execPath, [join(ROOT, "scripts/audit-mcp-export.mjs")]);
  if (code !== 0) throw new Error("MCP static-export audit failed; browser tests were not started");
}

function playwrightCommand() {
  const local = join(ROOT, "node_modules/.bin", process.platform === "win32" ? "playwright.cmd" : "playwright");
  if (existsSync(local)) return { command: local, prefix: [] };
  return {
    command: process.platform === "win32" ? "npx.cmd" : "npx",
    prefix: ["--no-install", "playwright"],
  };
}

async function runPlaywright(baseURL) {
  const passthrough = process.argv.slice(2);
  const runner = playwrightCommand();
  return spawnAndWait(
    runner.command,
    [
      ...runner.prefix,
      "test",
      "--config",
      "tests/mcp-playwright.config.ts",
      "--workers=1",
      ...passthrough,
    ],
    { env: { ...process.env, MCP_BASE_URL: baseURL } },
  );
}

async function main() {
  const exportMetadata = await stat(OUT_ROOT).catch(() => null);
  if (!exportMetadata?.isDirectory()) {
    throw new Error("out/ is missing; run next build before MCP exported-site tests");
  }
  await auditExport();

  const server = createServer((request, response) => {
    handleRequest(request, response).catch(() => {
      if (!response.headersSent) response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Internal server error\n");
    });
  });
  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, HOST, resolveListen);
  });

  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("could not determine static-server address");
    const baseURL = `http://${HOST}:${address.port}`;
    process.stdout.write(`Testing the audited static MCP export at ${baseURL}\n`);
    const code = await runPlaywright(baseURL);
    if (code !== 0) process.exitCode = code;
  } finally {
    await new Promise((resolveClose, rejectClose) => {
      server.close((error) => (error ? rejectClose(error) : resolveClose()));
    });
  }
}

main().catch((error) => {
  process.stderr.write(`MCP export browser tests could not run: ${error.message}\n`);
  process.exitCode = 1;
});
