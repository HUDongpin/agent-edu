#!/usr/bin/env node

/**
 * Minimal dependency-free server for the audited Next.js static export.
 * Intended for Playwright webServer commands, not production hosting.
 */

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCourse18ExportState } from "./ai-teaching-export-state.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT_ROOT = join(ROOT, "out");

function argument(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

const host = argument("host", "127.0.0.1");
const port = Number(argument("port", "3118"));

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error(`Invalid --port value: ${String(port)}`);
}

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
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
    return (
      (await fileIfPresent(`${candidate}.html`)) ??
      (await fileIfPresent(join(candidate, "index.html")))
    );
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

  const pathname = new URL(request.url ?? "/", `http://${host}`).pathname;
  const path = await resolveRequestFile(pathname);
  if (!path) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found\n");
    return;
  }

  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": contentTypes.get(extname(path).toLowerCase()) ?? "application/octet-stream",
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

const exportMetadata = await stat(OUT_ROOT).catch(() => null);
if (!exportMetadata?.isDirectory()) {
  throw new Error("out/ is missing; build the static export before browser tests");
}
const exportStateErrors = validateCourse18ExportState();
if (exportStateErrors.length > 0) {
  throw new Error(
    `Course 18 static export is stale or unverified:\n- ${exportStateErrors.join("\n- ")}`,
  );
}

const server = createServer((request, response) => {
  handleRequest(request, response).catch(() => {
    if (!response.headersSent) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    }
    response.end("Internal server error\n");
  });
});

server.listen(port, host, () => {
  process.stdout.write(`Serving static export at http://${host}:${port}\n`);
});
