import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "public", "courses", "mcp", "MCP_CAPSTONE_EVIDENCE_PACK.md");
const OUTPUT = join(ROOT, "public", "courses", "mcp", "capstone");
const TARGETS = {
  es: "es",
  fr: "fr",
  de: "de",
  "zh-Hans": "zh-CN",
  "zh-Hant": "zh-TW",
  ja: "ja",
  ko: "ko",
  ar: "ar",
};

const FIXED = [
  "Model Context Protocol",
  "Streamable HTTP",
  "MCP Inspector",
  "CourseOps",
  "JSON-RPC",
  "HTTP+SSE",
  "MRTR",
  "OAuth",
  "MCP",
  "SDK",
];

function protect(text) {
  const values = [];
  const mask = (value) => {
    const index = values.length;
    values.push(value);
    const label = String(index).padStart(4, "0");
    return `<span id="x${label}">x${label}</span>`;
  };
  let masked = text;
  masked = masked.replace(/`[^`]+`|https?:\/\/[^\s)]+|\b[a-z][A-Za-z0-9_-]*\/[a-z][A-Za-z0-9_-]*\b|\b(?:Mcp-[A-Za-z-]+|_meta|resultType|readOnlyHint)\b|\b20\d{2}-\d{2}-\d{2}(?:-v\d+)?\b/g, (value) => mask(value));
  for (const term of [...FIXED].sort((a, b) => b.length - a.length)) {
    masked = masked.replaceAll(term, () => mask(term));
  }
  return { masked, values };
}

function restore(text, values) {
  const counts = Array.from({ length: values.length }, () => 0);
  const tagPattern = /<span\b[^>]*\bid\s*=\s*["']?x(\d{4})["']?[^>]*>[\s\S]*?<\/span\s*>/giu;
  const restored = text.replace(tagPattern, (match, rawIndex) => {
    const index = Number(rawIndex);
    if (!Number.isInteger(index) || index < 0 || index >= values.length) throw new Error(`Translator introduced unknown protected token ${rawIndex}`);
    counts[index] += 1;
    return values[index];
  });
  counts.forEach((count, index) => {
    if (count !== 1) throw new Error(`Translator changed protected token ${String(index).padStart(4, "0")}`);
  });
  if (/<\/?span\b[^>]*\bid\s*=\s*["']?x\d{4}/iu.test(restored)) throw new Error(`Unrestored translation token in: ${restored}`);
  return restored.replace(/[\u202A-\u202E\u2066-\u2069]/g, "");
}

function hasTranslatableText(masked) {
  const withoutProtectedValues = masked.replace(
    /<span\b[^>]*\bid\s*=\s*["']?x\d{4}["']?[^>]*>[\s\S]*?<\/span\s*>/giu,
    "",
  );
  return /[A-Za-z]/u.test(withoutProtectedValues);
}

async function translateProtectedFragments(item, target) {
  const tagPattern = /<span id="x(\d{4})">x\d{4}<\/span>/gu;
  const parts = [];
  let cursor = 0;
  for (const match of item.masked.matchAll(tagPattern)) {
    if (match.index > cursor) parts.push({ text: item.masked.slice(cursor, match.index) });
    const valueIndex = Number(match[1]);
    if (!Number.isInteger(valueIndex) || valueIndex < 0 || valueIndex >= item.values.length) throw new Error(`Invalid canonical protected token ${match[1]}`);
    parts.push({ valueIndex });
    cursor = match.index + match[0].length;
  }
  if (cursor < item.masked.length) parts.push({ text: item.masked.slice(cursor) });

  const translatable = parts
    .map((part, partIndex) => ({ part, partIndex }))
    .filter(({ part }) => "text" in part && /[A-Za-z]/u.test(part.text))
    .map(({ part, partIndex }) => ({
      partIndex,
      leading: part.text.match(/^\s*/u)?.[0] ?? "",
      trailing: part.text.match(/\s*$/u)?.[0] ?? "",
      source: part.text.trim(),
    }));

  if (translatable.length) {
    const params = new URLSearchParams({ client: "dict-chrome-ex", sl: "en", tl: target });
    translatable.forEach((entry) => params.append("q", entry.source));
    let lastError;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const response = await fetch(`https://clients5.google.com/translate_a/t?${params}`, { headers: { "User-Agent": "Mozilla/5.0" } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data) || data.length !== translatable.length || data.some((value) => !String(value).trim())) throw new Error("Fragment translation response is incomplete");
        translatable.forEach((entry, index) => {
          parts[entry.partIndex].text = `${entry.leading}${String(data[index]).replace(/[\u202A-\u202E\u2066-\u2069]/g, "")}${entry.trailing}`;
        });
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, 500 * (2 ** attempt)));
      }
    }
    if (lastError) throw lastError;
  }

  return parts.map((part) => (
    "valueIndex" in part ? item.values[part.valueIndex] : part.text
  )).join("");
}

function markdownSegments(markdown) {
  const segments = [];
  const lines = markdown.split("\n");
  const templates = lines.map((line) => {
    if (!line.trim() || /^\s*\|?\s*:?-{3,}/.test(line)) return { literal: line };
    if (line.startsWith("|")) {
      const cells = line.split("|");
      return {
        table: cells.map((cell) => {
          const leading = cell.match(/^\s*/)?.[0] ?? "";
          const trailing = cell.match(/\s*$/)?.[0] ?? "";
          const core = cell.trim();
          if (!core || /^\d+$/.test(core)) return { literal: cell };
          const index = segments.push(core) - 1;
          return { index, leading, trailing };
        }),
      };
    }
    const match = line.match(/^(\s*(?:#{1,6}|[-*]|\d+\.)\s+)(.*?)(\s*)$/);
    if (match) {
      const index = segments.push(match[2]) - 1;
      return { index, prefix: match[1], suffix: match[3] };
    }
    const trailing = line.match(/\s*$/)?.[0] ?? "";
    const index = segments.push(line.trim()) - 1;
    return { index, prefix: line.match(/^\s*/)?.[0] ?? "", suffix: trailing };
  });
  return { segments, templates };
}

function rebuildMarkdown(templates, translated) {
  return templates.map((template) => {
    if ("literal" in template) return template.literal;
    if ("table" in template) {
      return template.table.map((cell) => (
        "literal" in cell ? cell.literal : `${cell.leading}${translated[cell.index]}${cell.trailing}`
      )).join("|");
    }
    return `${template.prefix}${translated[template.index]}${template.suffix}`;
  }).join("\n");
}

async function translateBatch(items, target) {
  const protectedItems = items.map(protect);
  const activeIndexes = protectedItems
    .map((item, index) => (hasTranslatableText(item.masked) ? index : -1))
    .filter((index) => index >= 0);
  const output = protectedItems.map((item) => restore(item.masked, item.values));
  if (!activeIndexes.length) return output;
  const params = new URLSearchParams({ client: "dict-chrome-ex", sl: "en", tl: target });
  activeIndexes.forEach((index) => params.append("q", protectedItems[index].masked));
  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(`https://clients5.google.com/translate_a/t?${params}`, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data) || data.length !== activeIndexes.length || data.some((value) => !String(value).trim())) throw new Error("Translation response is incomplete");
      for (let translatedIndex = 0; translatedIndex < activeIndexes.length; translatedIndex += 1) {
        const itemIndex = activeIndexes[translatedIndex];
        try {
          output[itemIndex] = restore(String(data[translatedIndex]), protectedItems[itemIndex].values);
        } catch {
          process.stderr.write("\ncapstone segment: using protected-fragment fallback\n");
          output[itemIndex] = await translateProtectedFragments(protectedItems[itemIndex], target);
        }
      }
      return output;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (2 ** attempt)));
    }
  }
  throw lastError;
}

async function translateAll(segments, target) {
  const output = [];
  for (let index = 0; index < segments.length;) {
    const batch = [];
    let size = 0;
    while (index < segments.length && batch.length < 20) {
      const next = segments[index];
      const encoded = encodeURIComponent(next).length;
      if (batch.length && size + encoded > 5500) break;
      batch.push(next);
      size += encoded;
      index += 1;
    }
    output.push(...await translateBatch(batch, target));
  }
  return output;
}

await mkdir(OUTPUT, { recursive: true });
const source = await readFile(SOURCE, "utf8");
const { segments, templates } = markdownSegments(source);

for (const locale of ["en", ...Object.keys(TARGETS)]) {
  const copy = JSON.parse(await readFile(join(ROOT, "messages", "mcp", `${locale}.json`), "utf8"));
  const translated = locale === "en" ? segments : await translateAll(segments, TARGETS[locale]);
  let markdown = rebuildMarkdown(templates, translated);
  const lines = markdown.split("\n");
  lines.splice(1, 0, "", `> ${copy.meta.localeNote}`);
  markdown = `${lines.join("\n").trimEnd()}\n`;
  await writeFile(join(OUTPUT, `MCP_CAPSTONE_EVIDENCE_PACK-${locale}.md`), markdown, "utf8");
  console.log(`Wrote ${locale} capstone evidence pack`);
}
