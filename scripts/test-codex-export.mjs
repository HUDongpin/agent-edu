import { createReadStream } from "node:fs";
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

  const directFile = await fileIfPresent(candidate);
  if (directFile) return directFile;

  if (!extname(candidate)) {
    const htmlFile = await fileIfPresent(`${candidate}.html`);
    if (htmlFile) return htmlFile;

    const indexFile = await fileIfPresent(join(candidate, "index.html"));
    if (indexFile) return indexFile;
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
  });

  if (method === "HEAD") {
    response.end();
    return;
  }

  const stream = createReadStream(path);
  stream.on("error", () => response.destroy());
  stream.pipe(response);
}

function runCodexPlaywright(baseURL) {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const passthrough = process.argv.slice(2);

  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(
      npmCommand,
      ["run", "test:codex", "--", "--workers=1", ...passthrough],
      {
        cwd: ROOT,
        env: { ...process.env, PLAYWRIGHT_BASE_URL: baseURL },
        stdio: "inherit",
      },
    );

    child.once("error", rejectRun);
    child.once("exit", (code, signal) => {
      if (signal) {
        rejectRun(new Error(`Playwright terminated by ${signal}`));
        return;
      }
      resolveRun(code ?? 1);
    });
  });
}

async function main() {
  const exportMetadata = await stat(OUT_ROOT).catch(() => null);
  if (!exportMetadata?.isDirectory()) {
    throw new Error("out/ is missing; run next build before the exported-site browser tests");
  }

  const server = createServer((request, response) => {
    handleRequest(request, response).catch(() => {
      if (!response.headersSent) {
        response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      }
      response.end("Internal server error\n");
    });
  });

  await new Promise((resolveListen, rejectListen) => {
    server.once("error", rejectListen);
    server.listen(0, HOST, resolveListen);
  });

  try {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("could not determine the exported-site test server address");
    }

    const baseURL = `http://${HOST}:${address.port}`;
    process.stdout.write(`Testing the static Codex export at ${baseURL}\n`);
    const exitCode = await runCodexPlaywright(baseURL);
    if (exitCode !== 0) process.exitCode = exitCode;
  } finally {
    await new Promise((resolveClose, rejectClose) => {
      server.close((error) => (error ? rejectClose(error) : resolveClose()));
    });
  }
}

main().catch((error) => {
  process.stderr.write(`Codex export browser tests could not run: ${error.message}\n`);
  process.exitCode = 1;
});
