import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import ts from "typescript";

const numbered = (count) => Array.from({ length: count }, (_, index) => String(index + 1));

const HOME_DYNAMIC_KEYS = [
  ...numbered(3).map((number) => `home.promise${number}`),
  ...numbered(4).flatMap((number) => [`home.proof${number}`, `home.proof${number}d`]),
  ...numbered(6).flatMap((number) => [`home.topic${number}`, `home.topic${number}d`]),
  ...["agentic", "codex", "claude", "github", "prompts"].flatMap((course) =>
    numbered(3).map((number) => `home.${course}Point${number}`),
  ),
  ...numbered(3).flatMap((number) =>
    ["", "d", "For", "a", "b", "c", "Cta"].map(
      (suffix) => `home.path${number}${suffix}`,
    ),
  ),
  ...numbered(3).flatMap((number) => [`home.method${number}`, `home.method${number}d`]),
  ...numbered(5).flatMap((number) => [`home.q${number}`, `home.a${number}`]),
];

const ABOUT_DYNAMIC_KEYS = [
  ...["peter", "hwang", "tu", "yu"].flatMap((person) =>
    ["role", "aff", "bio"].map((field) => `ab.p.${person}.${field}`),
  ),
  ...[
    "tel", "analytics", "aied", "appdev", "mobile", "game", "flipped",
    "genai", "digital", "edm", "network", "ena", "qe", "discourse", "software",
  ].map((area) => `area.${area}`),
];

const CATALOG_DYNAMIC_KEYS = [
  ...numbered(21).map((number) => `cat.course${number}`),
  ...["beginner", "intermediate", "advanced"].map((level) => `level.${level}`),
  ...["available", "soon"].map((status) => `status.${status}`),
];

const LAB_DYNAMIC_KEYS = [
  ...numbered(3).flatMap((number) => [`lab.setup.s${number}`, `lab.setup.s${number}d`]),
  "lab.draft.clear-failed",
  "lab.draft.unavailable",
  "lab.kind.judge",
  "lab.kind.rule",
];

const HANDBOOK_DYNAMIC_KEYS = [
  "hb.start",
  "hb.code",
  "hb.prompt",
  "hb.context",
  "hb.loop",
  "hb.graph",
  "hb.harness",
  "hb.evals",
  "hb.security",
  "hb.compare",
  "hb.play",
];

/**
 * Message keys with real callers whose names are assembled at runtime.
 * Each group names the source owner and why literal-call discovery cannot see it.
 */
export const MAIN_MESSAGE_DYNAMIC_OWNER_GROUPS = Object.freeze([
  {
    owner: "app/[locale]/page.tsx",
    purpose: "Homepage cards, paths, methods, proofs and FAQ rows interpolate numeric keys.",
    keys: Object.freeze(HOME_DYNAMIC_KEYS),
  },
  {
    owner: "app/[locale]/about/page.tsx + lib/team.ts",
    purpose: "Person IDs, biography fields and research-area IDs compose localized keys.",
    keys: Object.freeze(ABOUT_DYNAMIC_KEYS),
  },
  {
    owner: "components/courses/Catalog.tsx + lib/courses.ts",
    purpose: "Course display numbers, levels and availability values compose catalogue keys.",
    keys: Object.freeze(CATALOG_DYNAMIC_KEYS),
  },
  {
    owner: "components/lab/KeyBar.tsx + components/lab/Lab.tsx",
    purpose: "Setup steps, draft failure states and case kinds select keys from runtime state.",
    keys: Object.freeze(LAB_DYNAMIC_KEYS),
  },
  {
    owner: "lib/handbook/markup.ts + lib/handbook/localise.ts",
    purpose: "Handbook navigation keys are embedded in escaped data-i18n attributes.",
    keys: Object.freeze(HANDBOOK_DYNAMIC_KEYS),
  },
]);

/** No unused main-message key is intentionally reserved at present. */
export const RESERVED_MAIN_MESSAGE_KEYS = Object.freeze([]);

function walk(directory, files = []) {
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path, files);
    else if (entry.isFile() && /\.[jt]sx?$/.test(entry.name)) files.push(path);
  }
  return files;
}

function resolveImport(projectRoot, from, specifier) {
  if (!specifier.startsWith("@/") && !specifier.startsWith(".")) return null;
  const base = specifier.startsWith("@/")
    ? join(projectRoot, specifier.slice(2))
    : resolve(dirname(from), specifier);
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ]) {
    if (existsSync(candidate) && lstatSync(candidate).isFile()) return candidate;
  }
  return null;
}

export function reachableMainMessageSources(projectRoot) {
  const queue = walk(join(projectRoot, "app"));
  const seen = new Set();
  while (queue.length) {
    const path = queue.shift();
    if (!path || seen.has(path)) continue;
    seen.add(path);
    const source = readFileSync(path, "utf8");
    const sourceFile = ts.createSourceFile(
      path,
      source,
      ts.ScriptTarget.Latest,
      true,
      path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    sourceFile.forEachChild(function visit(node) {
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
        && node.moduleSpecifier
        && ts.isStringLiteralLike(node.moduleSpecifier)
      ) {
        const imported = resolveImport(projectRoot, path, node.moduleSpecifier.text);
        if (imported && !seen.has(imported)) queue.push(imported);
      }
      ts.forEachChild(node, visit);
    });
  }
  return [...seen].sort();
}

export function collectLiteralMainMessageReferences(projectRoot, messageKeys) {
  const keys = new Set(messageKeys);
  const referenced = new Set();
  for (const path of reachableMainMessageSources(projectRoot)) {
    const source = readFileSync(path, "utf8");
    const sourceFile = ts.createSourceFile(
      path,
      source,
      ts.ScriptTarget.Latest,
      true,
      path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    function visit(node) {
      if (ts.isStringLiteralLike(node) && keys.has(node.text)) referenced.add(node.text);
      if (
        ts.isJsxAttribute(node)
        && node.name.getText(sourceFile) === "data-i18n"
        && node.initializer
        && ts.isStringLiteralLike(node.initializer)
        && keys.has(node.initializer.text)
      ) {
        referenced.add(node.initializer.text);
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
  }
  return referenced;
}

export function validateDynamicMainMessageOwners(groups = MAIN_MESSAGE_DYNAMIC_OWNER_GROUPS) {
  const issues = [];
  const owners = new Map();
  for (const group of groups) {
    if (!group.owner?.trim()) issues.push("Dynamic owner group is missing owner.");
    if (!group.purpose?.trim()) issues.push(`${group.owner || "Dynamic owner group"} is missing purpose.`);
    if (!Array.isArray(group.keys) || group.keys.length === 0) {
      issues.push(`${group.owner || "Dynamic owner group"} has no keys.`);
      continue;
    }
    for (const key of group.keys) {
      if (owners.has(key)) issues.push(`${key} has more than one dynamic owner.`);
      owners.set(key, group.owner);
    }
  }
  return { issues, owners };
}

export function validateReservedMainMessageKeys(records = RESERVED_MAIN_MESSAGE_KEYS) {
  const issues = [];
  const keys = new Set();
  for (const record of records) {
    if (!record.key?.trim()) issues.push("Reserved main-message record is missing key.");
    else if (keys.has(record.key)) issues.push(`${record.key} is reserved more than once.`);
    else keys.add(record.key);
    if (!record.owner?.trim()) issues.push(`${record.key || "Reserved key"} is missing owner.`);
    if (!record.purpose?.trim()) issues.push(`${record.key || "Reserved key"} is missing purpose.`);
    if (!record.removalCondition?.trim()) {
      issues.push(`${record.key || "Reserved key"} is missing a removal condition.`);
    }
  }
  return { issues, keys };
}

export function findUnownedMainMessageKeys({
  messageKeys,
  literalReferences,
  dynamicOwners,
  reservedKeys,
}) {
  return [...messageKeys]
    .filter((key) =>
      !literalReferences.has(key)
      && !dynamicOwners.has(key)
      && !reservedKeys.has(key),
    )
    .sort();
}
