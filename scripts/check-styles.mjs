#!/usr/bin/env node

/**
 * Small, deterministic stylesheet gate for the deployed application surface.
 *
 * This is intentionally not a second browser or a home-grown CSS validator.
 * It catches the regressions that otherwise turn into silent visual failures:
 * truncated files, missing local imports, and removal of the shared focus,
 * reduced-motion, shell, or recovery rules that browser tests rely on.
 */
import { existsSync, lstatSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { sourceInventory } from "./lib/source-inventory.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const GLOBALS = resolve(ROOT, "app/globals.css");
const PAIRS = new Map([["{", "}"], ["(", ")"], ["[", "]"]]);
const CLOSERS = new Set(PAIRS.values());

function repoPath(path) {
  return relative(ROOT, path).split(sep).join("/");
}

function trackedCssFiles() {
  const files = sourceInventory({ root: ROOT }).files;

  return files
    .filter((path) => /^(?:app|components)\/.+\.css$/i.test(path))
    .map((path) => resolve(ROOT, path))
    .sort();
}

function scanDelimiters(source, label) {
  const masked = [...source];
  const stack = [];
  let state = "normal";
  let line = 1;
  let column = 0;

  const mask = (index) => {
    if (masked[index] !== "\n" && masked[index] !== "\r") masked[index] = " ";
  };

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    column += 1;

    if (state === "comment") {
      mask(index);
      if (char === "*" && next === "/") {
        mask(index + 1);
        index += 1;
        column += 1;
        state = "normal";
      }
    } else if (state === "single" || state === "double") {
      mask(index);
      if (char === "\\") {
        if (index + 1 < source.length) {
          mask(index + 1);
          index += 1;
          column += 1;
        }
      } else if ((state === "single" && char === "'") || (state === "double" && char === '"')) {
        state = "normal";
      }
    } else if (char === "/" && next === "*") {
      mask(index);
      mask(index + 1);
      index += 1;
      column += 1;
      state = "comment";
    } else if (char === "'" || char === '"') {
      mask(index);
      state = char === "'" ? "single" : "double";
    } else if (char === "\\") {
      if (index + 1 < source.length) {
        mask(index + 1);
        index += 1;
        column += 1;
      }
    } else if (PAIRS.has(char)) {
      stack.push({ char, line, column });
    } else if (CLOSERS.has(char)) {
      const opening = stack.pop();
      if (!opening || PAIRS.get(opening.char) !== char) {
        throw new SyntaxError(`${label}:${line}:${column}: unexpected ${char}`);
      }
    }

    if (char === "\n") {
      line += 1;
      column = 0;
    }
  }

  if (state === "comment") throw new SyntaxError(`${label}: unterminated comment`);
  if (state === "single" || state === "double") throw new SyntaxError(`${label}: unterminated string`);
  if (stack.length) {
    const opening = stack.at(-1);
    throw new SyntaxError(`${label}:${opening.line}:${opening.column}: unclosed ${opening.char}`);
  }

  return masked.join("");
}

function withoutComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\r\n]/g, " "));
}

function selectorSet(masked) {
  const selectors = new Set();
  let start = 0;
  for (let index = 0; index < masked.length; index += 1) {
    const char = masked[index];
    if (char === "{") {
      const header = masked.slice(start, index).trim();
      if (header && !header.startsWith("@")) {
        for (const selector of header.split(",")) {
          const normalized = selector.replace(/\s+/g, " ").trim();
          if (normalized) selectors.add(normalized);
        }
      }
      start = index + 1;
    } else if (char === ";" || char === "}") {
      start = index + 1;
    }
  }
  return selectors;
}

function localImports(source, fromPath) {
  const imports = [];
  const visible = withoutComments(source);
  const pattern = /@import\s+(?:url\(\s*)?(?:(["'])(.*?)\1|([^\s"');]+))\s*\)?[^;]*;/gi;
  for (const match of visible.matchAll(pattern)) {
    const specifier = (match[2] ?? match[3] ?? "").split(/[?#]/, 1)[0];
    if (!specifier || /^[a-z][a-z\d+.-]*:/i.test(specifier) || specifier.startsWith("//")) continue;
    if (!specifier.startsWith(".") && !specifier.startsWith("/")) continue;
    const target = specifier.startsWith("/")
      ? resolve(ROOT, "public", specifier.slice(1))
      : resolve(dirname(fromPath), specifier);
    imports.push({ specifier, target });
  }
  return imports;
}

function blockFor(masked, source, headerPattern) {
  const match = headerPattern.exec(masked);
  if (!match) return null;
  const opening = masked.indexOf("{", match.index + match[0].length);
  if (opening < 0) return null;
  let depth = 1;
  for (let index = opening + 1; index < masked.length; index += 1) {
    if (masked[index] === "{") depth += 1;
    else if (masked[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(opening + 1, index);
  }
  return null;
}

function hexCustomProperty(source, property) {
  const match = source.match(new RegExp(`--${property}\\s*:\\s*(#[0-9a-f]{6})\\s*;`, "i"));
  return match?.[1] ?? null;
}

function relativeLuminance(hex) {
  const channels = hex.slice(1).match(/.{2}/g).map((channel) => Number.parseInt(channel, 16) / 255);
  const linear = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(first, second) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05)
    / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

function requireTextContrast(issues, label, foreground, backgrounds, minimum = 4.5) {
  if (!foreground || backgrounds.some((background) => !background)) {
    issues.push(`${label}: unable to resolve the declared contrast tokens`);
    return;
  }
  for (const background of backgrounds) {
    const ratio = contrastRatio(foreground, background);
    if (ratio < minimum) {
      issues.push(`${label}: ${foreground} on ${background} is ${ratio.toFixed(3)}:1; expected at least ${minimum}:1`);
    }
  }
}

function runScannerSelfTest() {
  scanDelimiters(
    'a[data-label="}"]{content:"[not syntax]";transform:translate(calc(1px + 2px));/* } ] */}',
    "styles:self-test",
  );
  let rejected = false;
  try {
    scanDelimiters("a{color:red", "styles:self-test");
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error("styles:self-test: unbalanced input was accepted");
}

runScannerSelfTest();

const issues = [];
const files = trackedCssFiles();
const sources = new Map();
let importCount = 0;
let globalsMasked = "";
let globalsSource = "";

if (!files.includes(GLOBALS)) issues.push("app/globals.css is not part of the tracked application stylesheet surface");

for (const path of files) {
  const label = repoPath(path);
  const source = readFileSync(path, "utf8");
  sources.set(label, source);
  try {
    const masked = scanDelimiters(source, label);
    if (path === GLOBALS) {
      globalsMasked = masked;
      globalsSource = source;
    }
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
  }

  for (const imported of localImports(source, path)) {
    importCount += 1;
    const escapesRoot = isAbsolute(imported.target)
      && (relative(ROOT, imported.target).startsWith(`..${sep}`) || relative(ROOT, imported.target) === "..");
    if (escapesRoot) {
      issues.push(`${label}: local @import escapes the repository: ${imported.specifier}`);
    } else if (!existsSync(imported.target) || !lstatSync(imported.target).isFile()) {
      issues.push(`${label}: unresolved local @import: ${imported.specifier}`);
    }
  }
}

const claudeIncomeCss = sources.get("components/claude-income/ClaudeIncomeCourse.module.css");
const agentOrchestrationCss = sources.get("components/agent-orchestration/AgentOrchestrationCourse.module.css");
if (claudeIncomeCss && globalsSource) {
  requireTextContrast(
    issues,
    "Claude Income light-theme metadata",
    hexCustomProperty(claudeIncomeCss, "ci-faint"),
    [
      hexCustomProperty(claudeIncomeCss, "ci-paper"),
      hexCustomProperty(claudeIncomeCss, "ci-surface"),
      hexCustomProperty(globalsSource, "bg"),
      hexCustomProperty(globalsSource, "bg-2"),
    ],
  );
}
if (agentOrchestrationCss && globalsSource) {
  if (!/--ao-gold\s*:\s*var\(--gold\)\s*;/i.test(agentOrchestrationCss)) {
    issues.push("Agent Orchestration text gold must resolve through the contrast-safe --gold token");
  } else {
    requireTextContrast(
      issues,
      "Agent Orchestration light-theme gold metadata",
      hexCustomProperty(globalsSource, "gold"),
      [
        hexCustomProperty(globalsSource, "bg"),
        hexCustomProperty(globalsSource, "bg-2"),
        hexCustomProperty(globalsSource, "card"),
      ],
    );
  }
}

if (globalsMasked) {
  const selectors = selectorSet(globalsMasked);
  const sentinels = [
    "body",
    ".topbar",
    ".sitefoot",
    ".btn",
    ".recovery404",
    ".recovery-surface",
    ".recovery-panel",
    ".recovery-detail",
    ".recovery-actions",
  ];
  const focusSelectors = [
    ".skip:focus",
    ".btn:focus-visible",
    ".recovery404 a:focus-visible",
    ".recovery-actions a:focus-visible",
    ".recovery-actions button:focus-visible",
  ];

  for (const selector of sentinels) {
    if (!selectors.has(selector)) issues.push(`app/globals.css: missing independent sentinel selector ${selector}`);
  }
  for (const selector of focusSelectors) {
    if (!selectors.has(selector)) issues.push(`app/globals.css: missing focus selector ${selector}`);
  }

  const reducedMotion = blockFor(
    globalsMasked,
    globalsSource,
    /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/i,
  );
  if (!reducedMotion) {
    issues.push("app/globals.css: missing prefers-reduced-motion: reduce block");
  } else {
    for (const property of ["animation-duration", "transition-duration", "scroll-behavior"]) {
      if (!new RegExp(`${property}\\s*:`, "i").test(reducedMotion)) {
        issues.push(`app/globals.css: reduced-motion block is missing ${property}`);
      }
    }
  }
}

if (issues.length) {
  console.error(`styles: FAIL (${issues.length} problem${issues.length === 1 ? "" : "s"})`);
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log(
  `styles: PASS (${files.length} application stylesheets, ${importCount} resolved local imports, `
  + "balanced delimiters and required recovery/accessibility selectors)",
);
