import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { gzipSync } from "node:zlib";

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

/**
 * Text responses are compressed, because a reader's browser receives them
 * compressed and a harness that measured otherwise would be measuring a site
 * nobody is served.
 *
 * scripts/measure-lab-vitals.mjs records transferSize per navigation, and
 * under a throttled network profile that number is most of the wait. Serving
 * 880 kB uncompressed where production serves a quarter of that would have
 * made every throttled figure pessimistic by a factor of three, and would
 * have hidden exactly the work that makes a payload smaller.
 *
 * gzip rather than brotli, and cached rather than recomputed: the first is so
 * a response never costs enough CPU to perturb the timings it is being used
 * to measure, the second so only the first request for a file pays even that.
 * Production serves brotli, which is some 15-20% smaller again, so a figure
 * from here is a slight over-estimate of what ships. That direction is the
 * safe one for a number being watched for growth.
 */
const COMPRESSIBLE = new Set([".css", ".html", ".js", ".json", ".svg", ".txt", ".xml"]);
const MIN_COMPRESS_BYTES = 1024;
const gzipCache = new Map();

function gzipFor(file) {
  if (!gzipCache.has(file)) gzipCache.set(file, gzipSync(readFileSync(file), { level: 6 }));
  return gzipCache.get(file);
}

function acceptsGzip(request) {
  const header = request.headers["accept-encoding"];
  return typeof header === "string" && /\bgzip\b/i.test(header);
}

const TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
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
  const extension = extname(body);
  const compress = COMPRESSIBLE.has(extension)
    && acceptsGzip(request)
    && statSync(body).size >= MIN_COMPRESS_BYTES;

  const headers = {
    "Cache-Control": CACHE_CONTROL,
    "Content-Type": TYPES[extension] ?? "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
    /* Declared whenever the body could have been compressed, so a cache
       keyed on this header behaves the same as the one in front of the real
       site — including for the client that did not ask for it. */
    ...(COMPRESSIBLE.has(extension) ? { Vary: "Accept-Encoding" } : {}),
  };

  if (!compress) {
    response.writeHead(status, headers);
    if (request.method === "HEAD") response.end();
    else createReadStream(body).pipe(response);
    return;
  }

  const encoded = gzipFor(body);
  response.writeHead(status, {
    ...headers,
    "Content-Encoding": "gzip",
    "Content-Length": String(encoded.length),
  });
  if (request.method === "HEAD") response.end();
  else response.end(encoded);
});

server.listen(PORT, HOST, () => {
  console.log("static server ready on http://" + HOST + ":" + PORT);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
