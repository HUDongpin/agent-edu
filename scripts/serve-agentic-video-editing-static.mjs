#!/usr/bin/env node

/**
 * Minimal static-export server for Course 22 browser acceptance.
 *
 * It deliberately has no SPA fallback: a missing exported route must remain a
 * 404 so Playwright cannot mistake a development-server response for a valid
 * deployable page.
 */

import { createServer } from "node:http";
import { lstat, readFile, realpath } from "node:fs/promises";
import { extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const OUTPUT_ROOT = resolve(PROJECT_ROOT, "out");
const HOST = process.env.AGENTIC_VIDEO_EDITING_PLAYWRIGHT_HOST ?? "127.0.0.1";
const PORT = Number(process.env.AGENTIC_VIDEO_EDITING_PLAYWRIGHT_PORT ?? "4174");

const CONTENT_TYPES = new Map([
  [".avif", "image/avif"],
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
]);

function isWithin(root, candidate) {
  const pathFromRoot = relative(root, candidate);
  return pathFromRoot === "" || (!pathFromRoot.startsWith(`..${sep}`) && pathFromRoot !== ".." && !isAbsolute(pathFromRoot));
}

async function exportedFile(rootRealPath, pathname) {
  const decoded = decodeURIComponent(pathname);
  if (decoded.includes("\0")) return null;
  const candidate = resolve(rootRealPath, decoded.replace(/^\/+/, ""));
  if (!isWithin(rootRealPath, candidate)) return null;

  let entry = candidate;
  let entryStat;
  try {
    entryStat = await lstat(entry);
  } catch {
    return null;
  }
  if (entryStat.isSymbolicLink()) return null;
  if (entryStat.isDirectory()) entry = join(entry, "index.html");

  try {
    const entryRealPath = await realpath(entry);
    if (!isWithin(rootRealPath, entryRealPath)) return null;
    const fileStat = await lstat(entryRealPath);
    return fileStat.isFile() && !fileStat.isSymbolicLink() ? entryRealPath : null;
  } catch {
    return null;
  }
}

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65_535) {
  throw new Error(`Invalid AGENTIC_VIDEO_EDITING_PLAYWRIGHT_PORT: ${String(PORT)}`);
}

const outputRootRealPath = await realpath(OUTPUT_ROOT).catch(() => null);
if (!outputRootRealPath) {
  throw new Error(`Static export is missing at ${OUTPUT_ROOT}; run next build before browser acceptance.`);
}

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" });
    response.end("Method not allowed\n");
    return;
  }

  try {
    const requestUrl = new URL(request.url ?? "/", `http://${HOST}:${PORT}`);
    const file = await exportedFile(outputRootRealPath, requestUrl.pathname);
    if (!file) {
      response.writeHead(404, { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found\n");
      return;
    }
    const body = await readFile(file);
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Length": String(body.byteLength),
      "Content-Type": CONTENT_TYPES.get(extname(file).toLowerCase()) ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(400, { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" });
    response.end("Bad request\n");
  }
});

server.listen(PORT, HOST, () => {
  process.stdout.write(`Course 22 static export server listening on http://${HOST}:${PORT}\n`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => server.close(() => process.exit(0)));
}
