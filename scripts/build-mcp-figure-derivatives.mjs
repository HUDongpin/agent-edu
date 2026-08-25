#!/usr/bin/env node

import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIGURE_ROOT = resolve(ROOT, "public/courses/mcp/figures");
const FIGURES = [
  "inspector-settings",
  "inspector-tools",
  "inspector-resources",
  "inspector-prompts",
  "inspector-protocol",
  "inspector-apps",
  "gemini-cli-mcp-inventory",
  "codex-cli-mcp-configuration",
];
const WIDTHS = [1600, 960];

for (const id of FIGURES) {
  const input = ["png", "jpg"].map((extension) => resolve(FIGURE_ROOT, `${id}.${extension}`)).find(existsSync);
  if (!input) throw new Error(`${id}: source master is missing`);
  for (const width of WIDTHS) {
    const output = resolve(FIGURE_ROOT, `${id}-${width}.webp`);
    await sharp(input)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, effort: 6, smartSubsample: true })
      .toFile(output);
    console.log(`${id}: wrote ${width}px WebP with sharp ${sharp.versions.sharp}`);
  }
}
