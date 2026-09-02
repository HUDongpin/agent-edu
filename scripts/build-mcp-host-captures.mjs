#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_ROOT = resolve(process.env.MCP_CAPTURE_SOURCE_ROOT || resolve(ROOT, "tmp/mcp-ui-evidence"));
const OUTPUT_ROOT = resolve(ROOT, "public/courses/mcp/figures");

const CAPTURES = [
  {
    id: "gemini-cli-mcp-inventory",
    source: "gemini-cli-mcp-ui.png",
    sourceSha256: "496cc4e2d00321c4bb60de9e8a57c7730c36097beeb13fdd5098de083ff8dbc1",
    sourceDimensions: { width: 1916, height: 1274 },
    crop: { left: 112, top: 140, width: 1692, height: 952 },
  },
  {
    id: "codex-cli-mcp-configuration",
    source: "codex-cli-mcp-ui.png",
    sourceSha256: "5ef73ea8658e98792a85e12946e37acafedab8431777bd93249f71b74a97f64a",
    sourceDimensions: { width: 1828, height: 1186 },
    crop: { left: 68, top: 114, width: 1692, height: 952 },
  },
];

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

for (const capture of CAPTURES) {
  const input = resolve(SOURCE_ROOT, capture.source);
  const bytes = await readFile(input);
  if (sha256(bytes) !== capture.sourceSha256) throw new Error(`${capture.id}: raw capture SHA-256 mismatch`);
  const metadata = await sharp(bytes).metadata();
  if (metadata.width !== capture.sourceDimensions.width || metadata.height !== capture.sourceDimensions.height) {
    throw new Error(`${capture.id}: raw capture dimensions mismatch`);
  }

  const output = resolve(OUTPUT_ROOT, `${capture.id}.png`);
  await sharp(bytes).extract(capture.crop).png().toFile(output);
  const outputBytes = await readFile(output);
  const outputMetadata = await sharp(outputBytes).metadata();
  if (outputMetadata.exif || outputMetadata.xmp) throw new Error(`${capture.id}: privacy master retained EXIF or XMP metadata`);
  console.log(`${capture.id}: ${outputMetadata.width}x${outputMetadata.height} ${sha256(outputBytes)}`);
}
