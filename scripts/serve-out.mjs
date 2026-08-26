import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";

const ROOT = resolve(process.cwd(), "out");
const HOST = "127.0.0.1";
const PORT = Number(process.env.AGENT_EDU_TEST_PORT || 4173);
const CACHE_MODE = process.env.AGENT_EDU_TEST_CACHE || "no-store";

if (CACHE_MODE !== "no-store" && CACHE_MODE !== "warmable") {
  console.error("static server: AGENT_EDU_TEST_CACHE must be no-store or warmable");
  process.exit(1);
}

const CACHE_CONTROL = CACHE_MODE === "warmable"
  ? "public, max-age=3600"
  : "no-store";

const TYPES = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".sha256": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8",
  ".zip": "application/zip",
};

function resolveRequest(rawUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(rawUrl || "/", "http://" + HOST).pathname);
  } catch {
    return null;
  }
  if (pathname.includes("\0")) return null;
  const target = resolve(ROOT, "." + pathname);
  if (target !== ROOT && !target.startsWith(ROOT + sep)) return null;

  const candidates = pathname.endsWith("/")
    ? [join(target, "index.html")]
    : [target, target + ".html", join(target, "index.html")];
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile()) ?? null;
}

if (!existsSync(ROOT)) {
  console.error("static server: out/ is missing; run npm run build first");
  process.exit(1);
}

const server = createServer((request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end();
    return;
  }

  const file = resolveRequest(request.url);
  const body = file ?? join(ROOT, "404.html");
  const status = file ? 200 : 404;
  response.writeHead(status, {
    "Cache-Control": CACHE_CONTROL,
    "Content-Type": TYPES[extname(body)] ?? "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
  if (request.method === "HEAD") response.end();
  else createReadStream(body).pipe(response);
});

server.listen(PORT, HOST, () => {
  console.log("static server ready on http://" + HOST + ":" + PORT);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
