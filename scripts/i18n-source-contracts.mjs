import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

import ts from "typescript";

import {
  discoverClaudeIncomeContract,
  discoverMakeMoneyWithCodexFallbackContract,
  discoverPromptsFallbackContract,
  discoverSoftwareEngineeringFallbackContract,
} from "./i18n-published-course-contracts.mjs";

const SITE_LOCALES = [
  "en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar",
];

function read(path) {
  if (!existsSync(path)) throw new Error(`Missing i18n source-contract input: ${path}`);
  return readFileSync(path, "utf8");
}

function parse(path) {
  return ts.createSourceFile(
    path,
    read(path),
    ts.ScriptTarget.Latest,
    true,
    path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

function unwrap(node) {
  if (
    ts.isAsExpression(node)
    || ts.isSatisfiesExpression(node)
    || ts.isParenthesizedExpression(node)
    || ts.isTypeAssertionExpression(node)
  ) return unwrap(node.expression);
  return node;
}

function initializer(file, name) {
  const matches = [];
  function visit(node) {
    if (ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.name.text === name
      && node.initializer) matches.push(unwrap(node.initializer));
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) throw new Error("Found more than one " + name + " in " + file.fileName);
  throw new Error(`Cannot find ${name} in ${file.fileName}`);
}

function objectProperty(object, name) {
  if (!ts.isObjectLiteralExpression(object)) throw new Error("Expected object while reading " + name);
  for (const candidate of object.properties) {
    if (!ts.isPropertyAssignment(candidate)) continue;
    if ((ts.isIdentifier(candidate.name) || ts.isStringLiteralLike(candidate.name)) && candidate.name.text === name) {
      return unwrap(candidate.initializer);
    }
  }
  throw new Error("Missing property " + name);
}

function stringLiteral(node, label) {
  const value = unwrap(node);
  if (!ts.isStringLiteralLike(value)) throw new Error(label + " must be a string literal");
  return value.text;
}

function requireTokens(source, requirements, label) {
  const missing = requirements.filter(([, token]) => !source.includes(token)).map(([id]) => id);
  if (missing.length) throw new Error(`${label}: ${missing.join(", ")}`);
}

function exactSet(actual, expected, label) {
  const left = [...new Set(actual)].sort();
  const right = [...new Set(expected)].sort();
  if (JSON.stringify(left) !== JSON.stringify(right)) {
    throw new Error(`${label}: expected ${right.join(",")}; observed ${left.join(",")}`);
  }
}

export function discoverProductManagementFallbackSourceContract(root) {
  const loadPath = join(root, "lib", "product-management", "load.ts");
  const dashboardPath = join(root, "components", "product-management", "CourseDashboard.tsx");
  const modulePath = join(root, "components", "product-management", "ModuleView.tsx");
  const dashboardRoute = join(root, "app", "[locale]", "product-management", "page.tsx");
  const moduleRoute = join(root, "app", "[locale]", "product-management", "[module]", "page.tsx");
  const sitemapPath = join(root, "app", "sitemap.ts");
  const loadFile = parse(loadPath);
  const bundles = initializer(loadFile, "PRODUCT_MANAGEMENT_COPY_BUNDLES");
  if (!ts.isObjectLiteralExpression(bundles)) throw new Error("Product Management copy bundles must be a literal object");
  const bundleKeys = bundles.properties.flatMap((entry) => {
    if (!ts.isPropertyAssignment(entry)) return [];
    if (ts.isIdentifier(entry.name) || ts.isStringLiteralLike(entry.name)) return [entry.name.text];
    return [];
  });
  exactSet(bundleKeys, ["en"], "Product Management native content-locale contract drift");
  const englishEntry = bundles.properties.find((entry) =>
    ts.isPropertyAssignment(entry)
    && (ts.isIdentifier(entry.name) || ts.isStringLiteralLike(entry.name))
    && entry.name.text === "en"
  );
  if (!englishEntry || !ts.isPropertyAssignment(englishEntry)) {
    throw new Error("Product Management English copy bundle is missing");
  }
  const englishBundle = unwrap(englishEntry.initializer);
  if (stringLiteral(objectProperty(englishBundle, "contentLocale"), "Product Management content locale") !== "en") {
    throw new Error("Product Management content locale must be en");
  }
  if (stringLiteral(objectProperty(englishBundle, "direction"), "Product Management content direction") !== "ltr") {
    throw new Error("Product Management content direction must be ltr");
  }
  requireTokens(read(dashboardPath), [
    ["dashboard-content-language", "lang={course.contentLocale}"],
    ["dashboard-content-direction", "dir={course.contentDirection}"],
    ["dashboard-language-notice", "course.copy.meta.englishOnly"],
  ], "Product Management dashboard content contract is incomplete");
  requireTokens(read(modulePath), [
    ["module-content-language", "lang={course.contentLocale}"],
    ["module-content-direction", "dir={course.contentDirection}"],
    ["module-language-notice", "course.copy.meta.englishOnly"],
  ], "Product Management module content contract is incomplete");
  for (const [label, source] of [["dashboard route", read(dashboardRoute)], ["module route", read(moduleRoute)]]) {
    requireTokens(source, [
      ["native-locale-metadata", "availableLocales: PRODUCT_MANAGEMENT_TRANSLATED_LOCALES"],
      ["content-canonical", "canonicalLocale: course.contentLocale"],
      ["json-content-language", "inLanguage: course.contentLocale"],
    ], `Product Management ${label} contract is incomplete`);
  }
  requireTokens(read(dashboardRoute), [
    ["all-localized-shells", "PRODUCT_MANAGEMENT_LOCALES.map((locale) => ({ locale }))"],
  ], "Product Management dashboard route contract is incomplete");
  requireTokens(read(sitemapPath), [
    ["content-locale-pages", 'page === "product-management/" || page.startsWith("product-management/")'],
    ["reviewed-content-locales", "? PRODUCT_MANAGEMENT_TRANSLATED_LOCALES"],
  ], "Product Management sitemap contract is incomplete");
  return { rootFiles: [dashboardPath, modulePath] };
}

function resolveRelativeImport(from, specifier) {
  if (!specifier.startsWith(".")) return null;
  const base = resolve(dirname(from), specifier);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function componentGraph(rootFiles, allowedDirectory) {
  const queue = [...rootFiles];
  const seen = new Set();
  const allowed = resolve(allowedDirectory) + sep;
  while (queue.length) {
    const path = queue.shift();
    if (!path || seen.has(path)) continue;
    seen.add(path);
    const file = parse(path);
    file.forEachChild(function visit(node) {
      if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
        const next = resolveRelativeImport(path, node.moduleSpecifier.text);
        if (next && /\.[jt]sx?$/.test(next) && resolve(next).startsWith(allowed) && !seen.has(next)) queue.push(next);
      }
      ts.forEachChild(node, visit);
    });
  }
  return seen;
}

function jsxAttributes(node) {
  if (ts.isJsxElement(node)) return node.openingElement.attributes.properties;
  if (ts.isJsxSelfClosingElement(node)) return node.attributes.properties;
  if (ts.isJsxOpeningElement(node)) return node.attributes.properties;
  return [];
}

function literalAttribute(node, name, wanted) {
  return jsxAttributes(node).some((attribute) => (
    ts.isJsxAttribute(attribute)
    && attribute.name.getText() === name
    && attribute.initializer
    && ((ts.isStringLiteralLike(attribute.initializer) && attribute.initializer.text === wanted)
      || (ts.isJsxExpression(attribute.initializer)
        && attribute.initializer.expression
        && ts.isStringLiteralLike(attribute.initializer.expression)
        && attribute.initializer.expression.text === wanted))
  ));
}

function insideElement(node, names) {
  let cursor = node;
  while (cursor) {
    const tag = ts.isJsxElement(cursor)
      ? cursor.openingElement.tagName.getText()
      : ts.isJsxSelfClosingElement(cursor)
        ? cursor.tagName.getText()
        : ts.isJsxOpeningElement(cursor)
          ? cursor.tagName.getText()
          : "";
    if (names.has(tag)) return true;
    cursor = cursor.parent;
  }
  return false;
}

function insideElementWith(node, name, attribute, value) {
  let cursor = node;
  while (cursor) {
    const tag = ts.isJsxElement(cursor)
      ? cursor.openingElement.tagName.getText()
      : ts.isJsxSelfClosingElement(cursor)
        ? cursor.tagName.getText()
        : ts.isJsxOpeningElement(cursor)
          ? cursor.tagName.getText()
          : "";
    if (tag === name && literalAttribute(cursor, attribute, value)) return true;
    cursor = cursor.parent;
  }
  return false;
}

function insideClass(node, className) {
  let cursor = node;
  while (cursor) {
    if ((ts.isJsxElement(cursor) || ts.isJsxSelfClosingElement(cursor) || ts.isJsxOpeningElement(cursor))
      && jsxAttributes(cursor).some((attribute) => (
        ts.isJsxAttribute(attribute)
        && attribute.name.getText() === "className"
        && attribute.initializer
        && attribute.initializer.getText().includes(className)
      ))) return true;
    cursor = cursor.parent;
  }
  return false;
}

const TECHNICAL_CODE_FILES = new Set([
  "app/[locale]/build/page.tsx",
  "components/ai-python-data/AiPythonDataLab.tsx",
  "components/machine-learning/MachineLearningLab.tsx",
  "components/deep-learning/DeepLearningLab.tsx",
  "components/production-ai/ProductionAiLab.tsx",
]);

const EXACT_TECHNICAL_LITERALS = new Map([
  ["app/[locale]/build/page.tsx", new Map([
    ["DeepSeek", (node) => insideElement(node, new Set(["h3"]))],
    ["Claude", (node) => insideElement(node, new Set(["h3"]))],
  ])],
  ["components/Shell.tsx", new Map([
    ["aicourse", (node) => insideClass(node, "wm")],
    [".top", (node) => insideClass(node, "wm")],
    ["aicourse.top", (node) => insideClass(node, "wm")],
    ["HU Dongpin", (node) => insideElement(node, new Set(["a"]))],
  ])],
  ["components/mcp/CourseDashboard.tsx", new Map([
    ["SPEC", (node) => insideClass(node, "specStamp")],
    ["figure-manifest.json", (node) => insideElement(node, new Set(["a"]))],
    ["NOTICE.md", (node) => insideElement(node, new Set(["a"]))],
    ["APACHE-2.0.txt", (node) => insideElement(node, new Set(["a"]))],
    ["CODEX-NOTICE.txt", (node) => insideElement(node, new Set(["a"]))],
  ])],
  ["components/mcp/InteractiveLab.tsx", new Map([
    ["stdio", (node) => insideElementWith(node, "div", "aria-hidden", "true")],
    ["Streamable HTTP", (node) => insideElementWith(node, "div", "aria-hidden", "true")],
  ])],
  ["components/mcp/LessonView.tsx", new Map([
    ["MCP", (node) => insideElementWith(node, "p", "dir", "ltr")],
  ])],
  ["components/codex/CourseFigure.tsx", new Map([
    ["Codex", (node) => insideElementWith(node, "small", "dir", "ltr")],
  ])],
  ["components/github/CourseFigure.tsx", new Map([
    ["GitHub Docs © GitHub, Inc. · CC BY 4.0 ·", (node) => insideElementWith(node, "span", "dir", "ltr")],
  ])],
]);

function isTechnicalCodeLiteral(relativePath, node, text) {
  if (!TECHNICAL_CODE_FILES.has(relativePath) || !insideElement(node, new Set(["code", "pre"]))) return false;
  const value = text.trim().replace(/\s+/g, " ");
  if (relativePath === "components/deep-learning/DeepLearningLab.tsx") {
    const exactV2Fragments = new Set([
      "module.*.v2",
      "reference-validator.v1",
      "validator.v2",
      "aicourse.deep-learning.module.&lt;module-slug&gt;.v2",
      "python3 run_modules.py --all --output-dir work/modules",
      "python3 validate_reference.py --package work/reference/submission.generated.json",
      "python3 validate_capstone.py --package work/learner-final.json",
      "python3 validate_module.py --module",
      "--package work/modules/",
      ".json --receipt work/receipts/",
      ".json",
    ]);
    if (exactV2Fragments.has(value)
      || /^aicourse\.deep-learning\.(?:module\.\*|reference-validator|validator)\.v\d+$/.test(value)) {
      return true;
    }
  }
  return /^aicourse\.(?:ai-python-data|machine-learning|deep-learning|production-ai)\.validator\.v1$/.test(value)
    || /^python3 (?:run_notebook|run_pipeline|run_experiment|run_capstone|validate|test_lab)\.py(?: --(?:output-dir work|package work\/submission\.generated\.json))?$/.test(value)
    || value === "--offline"
    || value === "export DEEPSEEK_API_KEY=your_key_here";
}

export function createSourceLiteralPolicy(root, siteLocales = SITE_LOCALES) {
  const claudeIncome = discoverClaudeIncomeContract(root, siteLocales);
  const prompts = discoverPromptsFallbackContract(root, siteLocales);
  const makeMoney = discoverMakeMoneyWithCodexFallbackContract(root, siteLocales);
  const software = discoverSoftwareEngineeringFallbackContract(root, siteLocales);
  const product = discoverProductManagementFallbackSourceContract(root);

  const fullyEnglishFiles = new Set([
    ...componentGraph(
      [
        join(root, "components", "claude-income", "CourseDashboard.tsx"),
        join(root, "components", "claude-income", "LessonView.tsx"),
      ],
      join(root, "components", "claude-income"),
    ),
    ...componentGraph(
      [
        join(root, "components", "prompts", "CourseDashboard.tsx"),
        join(root, "components", "prompts", "LessonView.tsx"),
      ],
      join(root, "components", "prompts"),
    ),
    ...componentGraph(product.rootFiles, join(root, "components", "product-management")),
    ...componentGraph(
      [
        join(root, "components", "make-money-with-codex", "CourseDashboard.tsx"),
        join(root, "components", "make-money-with-codex", "LessonView.tsx"),
      ],
      join(root, "components", "make-money-with-codex"),
    ),
    ...componentGraph(
      [
        join(root, "components", "software-engineering", "CourseDashboard.tsx"),
        join(root, "components", "software-engineering", "LessonView.tsx"),
      ],
      join(root, "components", "software-engineering"),
    ),
  ].map((path) => relative(root, path).split(sep).join("/")));

  if (
    claudeIncome.translatedLocales.join(",") !== "en"
    || prompts.contentLocales.join(",") !== "en"
    || makeMoney.contentLocales.join(",") !== "en"
    || software.contentLocales.join(",") !== "en"
  ) {
    throw new Error("English fallback source policy received a non-English content contract");
  }

  return Object.freeze({ root, fullyEnglishFiles });
}

export function sourceLiteralDecision(policy, { relativePath, sourceFile, node, text }) {
  if (policy.fullyEnglishFiles.has(relativePath)) {
    return { disposition: "accepted_explicit_fallback", reason: "english-ltr-content-contract" };
  }
  if (isTechnicalCodeLiteral(relativePath, node, text)) {
    return { disposition: "accepted_technical_literal", reason: "code-command-or-schema" };
  }
  const normalized = text.trim().replace(/\s+/g, " ");
  const context = EXACT_TECHNICAL_LITERALS.get(relativePath)?.get(normalized);
  if (context?.(node, sourceFile)) {
    return { disposition: "accepted_technical_literal", reason: "exact-brand-protocol-file-or-rights-token" };
  }
  return null;
}

export const SOURCE_LITERAL_EXPECTATIONS = Object.freeze({
  fallbackJsx: 315,
  fallbackAttributes: 24,
  technicalJsx: 46,
});
