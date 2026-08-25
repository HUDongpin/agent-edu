import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { extname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = resolve(process.cwd());
const LEDGER_PATH = join(ROOT, "evidence/media-masters/optimization-ledger.json");
const LIMIT = 500_000;
const MEDIA_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif"]);

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function pngDimensions(buffer, label) {
  if (buffer.length < 24 || buffer.toString("hex", 0, 8) !== "89504e470d0a1a0a") {
    throw new Error(`${label} is not a PNG`);
  }
  return `${buffer.readUInt32BE(16)}x${buffer.readUInt32BE(20)}`;
}

function regularFilesBelow(root) {
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) {
        const info = lstatSync(absolute);
        if (!info.isFile() || info.isSymbolicLink()) throw new Error(`non-regular media: ${absolute}`);
        files.push({ absolute, bytes: info.size });
      }
    }
  };
  visit(root);
  return files;
}

export function checkMediaOptimization() {
  if (!existsSync(LEDGER_PATH)) throw new Error("media optimization ledger is missing");
  const ledger = JSON.parse(readFileSync(LEDGER_PATH, "utf8"));
  if (ledger.schemaVersion !== 1 || ledger.publicLimitBytes !== LIMIT || !Array.isArray(ledger.records)) {
    throw new Error("media optimization ledger schema is invalid");
  }

  const seen = new Set();
  for (const record of ledger.records) {
    if (!record || typeof record.publicPath !== "string" || seen.has(record.publicPath)) {
      throw new Error("media optimization ledger has a missing or duplicate publicPath");
    }
    seen.add(record.publicPath);
    const sourcePath = join(ROOT, "evidence/media-masters", record.publicPath);
    const publicPath = join(ROOT, "public", record.publicPath);
    for (const [kind, path] of [["source", sourcePath], ["public", publicPath]]) {
      if (!existsSync(path) || !lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) {
        throw new Error(`${kind} media is missing or non-regular: ${record.publicPath}`);
      }
    }
    const source = readFileSync(sourcePath);
    const published = readFileSync(publicPath);
    if (source.length !== record.sourceBytes || sha256(source) !== record.sourceSha256) {
      throw new Error(`source evidence drifted: ${record.publicPath}`);
    }
    if (published.length !== record.publicBytes || sha256(published) !== record.publicSha256) {
      throw new Error(`public fallback drifted: ${record.publicPath}`);
    }
    if (
      pngDimensions(source, record.publicPath) !== record.sourceDimensions
      || pngDimensions(published, record.publicPath) !== record.publicDimensions
    ) {
      throw new Error(`media dimensions drifted: ${record.publicPath}`);
    }
    if (published.length > LIMIT) throw new Error(`public fallback exceeds ${LIMIT} bytes: ${record.publicPath}`);
  }

  const masterRoot = join(ROOT, "evidence/media-masters/courses");
  const masters = regularFilesBelow(masterRoot)
    .map(({ absolute }) => relative(join(ROOT, "evidence/media-masters"), absolute).split(sep).join("/"));
  const unbound = masters.filter((path) => !seen.has(path));
  if (unbound.length) throw new Error(`unbound media master(s): ${unbound.join(", ")}`);

  const oversized = regularFilesBelow(join(ROOT, "public"))
    .filter(({ absolute, bytes }) => MEDIA_EXTENSIONS.has(extname(absolute).toLowerCase()) && bytes > LIMIT)
    .map(({ absolute, bytes }) => `${relative(join(ROOT, "public"), absolute)} (${bytes})`);
  if (oversized.length) throw new Error(`public media exceeds ${LIMIT} bytes: ${oversized.join(", ")}`);

  console.log(`media-optimization: ${ledger.records.length} source/public pairs bound; public media <= ${LIMIT} bytes; PASS`);
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  try {
    checkMediaOptimization();
  } catch (error) {
    console.error(`media-optimization: FAIL — ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
