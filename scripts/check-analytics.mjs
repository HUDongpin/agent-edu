import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const SOURCE_ROOTS = ["app", "components", "lib"];
const SOURCE_EXTENSIONS = new Set([".cjs", ".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const ALLOWED_FILE = "app/[locale]/layout.tsx";
const ALLOWED_MODULE = "@vercel/analytics/next";

const ANALYTICS_PACKAGE_NAMES = new Set([
  "@vercel/speed-insights",
  "analytics-node",
  "fathom-client",
  "mixpanel",
  "mixpanel-browser",
  "plausible-tracker",
  "posthog-js",
  "react-ga",
  "react-ga4",
  "umami",
]);

const DIRECT_ANALYTICS_CALLS = new Set([
  "analyticsEvent",
  "captureEvent",
  "gtag",
  "logEvent",
  "plausible",
  "recordEvent",
  "sendAnalytics",
  "track",
  "trackEvent",
]);

const ANALYTICS_RECEIVERS = new Set([
  "analytics",
  "amplitude",
  "dataLayer",
  "fathom",
  "insights",
  "matomo",
  "metrics",
  "mixpanel",
  "plausible",
  "posthog",
  "segment",
  "telemetry",
]);

const ANALYTICS_RECEIVER_METHODS = new Set([
  "capture",
  "event",
  "identify",
  "log",
  "page",
  "pageview",
  "push",
  "record",
  "send",
]);

const SENSITIVE_PAYLOAD_WORDS = new Set([
  "apikey",
  "authorization",
  "bearer",
  "billing",
  "card",
  "completion",
  "content",
  "conversation",
  "cost",
  "invoice",
  "key",
  "message",
  "payment",
  "prompt",
  "reply",
  "response",
  "secret",
  "token",
]);

const SDK_URL_PATTERNS = [
  /(?:^|\.)google-analytics\.com(?:\/|$)/i,
  /(?:^|\.)googletagmanager\.com\/(?:gtag\/js|gtm\.js)(?:[?#]|$)/i,
  /(?:^|\.)cdn\.segment\.com\/analytics\.js(?:\/|[?#]|$)/i,
  /(?:^|\.)cdn\.mxpnl\.com(?:\/|$)/i,
  /(?:^|\.)plausible\.io\/js\/script(?:\.|\/|[?#]|$)/i,
  /(?:^|\.)posthog\.com\/static\/(?:array|recorder)\.js(?:[?#]|$)/i,
  /^\/_vercel\/(?:insights|speed-insights)\/(?:script\.js|view)(?:[?#]|$)/i,
  /\/matomo\.js(?:[?#]|$)/i,
];

function normalisePath(file) {
  return file.replaceAll("\\", "/");
}

function lineFor(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function scriptKind(file) {
  switch (extname(file).toLowerCase()) {
    case ".tsx":
      return ts.ScriptKind.TSX;
    case ".jsx":
      return ts.ScriptKind.JSX;
    case ".js":
    case ".cjs":
    case ".mjs":
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.TS;
  }
}

function isAnalyticsModule(specifier) {
  const lower = specifier.toLowerCase();
  if (lower === ALLOWED_MODULE) return true;
  if (ANALYTICS_PACKAGE_NAMES.has(lower)) return true;
  if (lower.startsWith("@vercel/speed-insights/")) return true;
  if (lower.startsWith("@segment/analytics")) return true;
  if (/^@amplitude\/analytics(?:-|\/|$)/.test(lower)) return true;
  if (/(?:^|[\/@._-])(?:analytics?|telemetry|tracking)(?:$|[\/@._-])/.test(lower)) return true;
  return /(?:^|[\/@._-])(?:amplitude|matomo|mixpanel|plausible|posthog)(?:$|[\/@._-])/.test(lower);
}

function isExplicitAnalyticsModuleReference(value) {
  const lower = value.toLowerCase();
  return (
    lower === ALLOWED_MODULE ||
    ANALYTICS_PACKAGE_NAMES.has(lower) ||
    lower.startsWith("@vercel/analytics/") ||
    lower.startsWith("@vercel/speed-insights/") ||
    lower.startsWith("@segment/analytics") ||
    /^@amplitude\/analytics(?:-|\/|$)/.test(lower)
  );
}

function isExactAllowedImport(file, node) {
  if (file !== ALLOWED_FILE || node.moduleSpecifier.text !== ALLOWED_MODULE) return false;
  const clause = node.importClause;
  if (!clause || clause.isTypeOnly || clause.name) return false;
  if (!clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) return false;
  if (clause.namedBindings.elements.length !== 1) return false;
  const element = clause.namedBindings.elements[0];
  return !element.isTypeOnly && !element.propertyName && element.name.text === "Analytics";
}

function isExactAllowedComponent(file, node) {
  return (
    file === ALLOWED_FILE &&
    ts.isJsxSelfClosingElement(node) &&
    ts.isIdentifier(node.tagName) &&
    node.tagName.text === "Analytics" &&
    node.attributes.properties.length === 0
  );
}

function dottedName(node) {
  if (ts.isIdentifier(node)) return node.text;
  if (ts.isPropertyAccessExpression(node)) {
    const left = dottedName(node.expression);
    return left ? `${left}.${node.name.text}` : node.name.text;
  }
  if (
    ts.isElementAccessExpression(node) &&
    node.argumentExpression &&
    ts.isStringLiteralLike(node.argumentExpression)
  ) {
    const left = dottedName(node.expression);
    return left ? `${left}.${node.argumentExpression.text}` : node.argumentExpression.text;
  }
  return "";
}

function receiverName(node) {
  const dotted = dottedName(node);
  return dotted.split(".").at(-1) ?? "";
}

function accessedName(node) {
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  if (ts.isElementAccessExpression(node) && node.argumentExpression) {
    return ts.isStringLiteralLike(node.argumentExpression) ? node.argumentExpression.text : "";
  }
  return "";
}

function eventEndpoint(value) {
  let path = value;
  try {
    path = new URL(value).pathname;
  } catch {
    path = value.split(/[?#]/, 1)[0];
  }
  return (
    /^\/_vercel\/insights\/event\/?$/i.test(path) ||
    /^\/_vercel\/speed-insights\/vitals\/?$/i.test(path) ||
    /^\/api\/(?:analytics?|events?|telemetry|collect)(?:\/|$)/i.test(path)
  );
}

function analyticsSdkUrl(value) {
  let candidate = value;
  try {
    const url = new URL(value);
    candidate = `${url.hostname}${url.pathname}`;
  } catch {
    // Relative strings are checked as-is; only high-confidence SDK paths match.
  }
  return SDK_URL_PATTERNS.some((pattern) => pattern.test(candidate));
}

function words(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function sensitiveWord(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) {
    return words(node.text).find((word) => SENSITIVE_PAYLOAD_WORDS.has(word));
  }
  return undefined;
}

function isModuleSpecifier(node) {
  const parent = node.parent;
  return (
    (ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) &&
    parent.moduleSpecifier === node
  );
}

function isAnalyticsIdentifierContext(node) {
  const parent = node.parent;
  return (
    ts.isImportSpecifier(parent) ||
    (ts.isJsxSelfClosingElement(parent) && parent.tagName === node) ||
    (ts.isJsxOpeningElement(parent) && parent.tagName === node) ||
    (ts.isJsxClosingElement(parent) && parent.tagName === node)
  );
}

function pathRule(file) {
  const parts = normalisePath(file).split("/");
  const stem = parts.at(-1)?.split(".", 1)[0].toLowerCase();
  if (["analytics", "telemetry", "tracking"].includes(stem ?? "")) {
    return "custom-analytics-module";
  }
  const api = parts.indexOf("api");
  const endpoint = api >= 0
    ? parts
        .slice(api + 1)
        .find((part) => !part.startsWith("(") && !part.startsWith("@"))
        ?.toLowerCase()
    : undefined;
  if (parts[0] === "app" && ["analytic", "analytics", "collect", "event", "events", "telemetry"].includes(endpoint ?? "")) {
    return "custom-event-route";
  }
  return undefined;
}

function callRule(node) {
  const expression = node.expression;
  if (ts.isIdentifier(expression) && DIRECT_ANALYTICS_CALLS.has(expression.text)) {
    return expression.text === "track" ? "custom-analytics-track" : "custom-analytics-call";
  }
  if (!ts.isPropertyAccessExpression(expression) && !ts.isElementAccessExpression(expression)) {
    return undefined;
  }
  const method = accessedName(expression);
  if (method === "sendBeacon") return "browser-beacon";
  if (method === "track") return "custom-analytics-track";
  if (DIRECT_ANALYTICS_CALLS.has(method)) return "custom-analytics-call";
  const receiver = receiverName(expression.expression);
  if (ANALYTICS_RECEIVERS.has(receiver) && ANALYTICS_RECEIVER_METHODS.has(method)) {
    return "custom-analytics-call";
  }
  return undefined;
}

function isDynamicModuleCall(node) {
  return (
    node.expression.kind === ts.SyntaxKind.ImportKeyword ||
    (ts.isIdentifier(node.expression) && node.expression.text === "require")
  );
}

function dedupeFindings(findings) {
  const seen = new Set();
  return findings.filter((finding) => {
    const key = `${finding.file}:${finding.line}:${finding.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function analyzeSource(file, text) {
  const normalFile = normalisePath(file);
  const sourceFile = ts.createSourceFile(
    normalFile,
    text,
    ts.ScriptTarget.Latest,
    true,
    scriptKind(normalFile),
  );
  const findings = [];
  const prohibitedNodes = [];
  const sensitiveNodes = [];
  let allowedImports = 0;
  let allowedComponents = 0;

  const add = (id, node = sourceFile) => {
    findings.push({ file: normalFile, line: lineFor(sourceFile, node), id });
  };
  const prohibit = (id, node) => {
    add(id, node);
    prohibitedNodes.push(node);
  };

  const fileRule = pathRule(normalFile);
  if (fileRule) prohibit(fileRule, sourceFile);

  for (const diagnostic of sourceFile.parseDiagnostics ?? []) {
    const node = diagnostic.start === undefined ? sourceFile : sourceFile.getTokenAtPosition(diagnostic.start);
    add("source-parse-error", node);
  }

  const visit = (node) => {
    const sensitive = sensitiveWord(node);
    if (sensitive) sensitiveNodes.push(node);

    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      if (isAnalyticsModule(specifier)) {
        if (isExactAllowedImport(normalFile, node)) {
          allowedImports += 1;
        } else {
          prohibit(
            specifier === ALLOWED_MODULE
              ? "vercel-analytics-import-not-allowlisted"
              : "analytics-sdk-import",
            node,
          );
        }
      }
    }

    if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      if (isAnalyticsModule(node.moduleSpecifier.text)) prohibit("analytics-sdk-export", node);
    }

    if (ts.isCallExpression(node)) {
      const rule = callRule(node);
      if (rule) prohibit(rule, node);

      if (isDynamicModuleCall(node)) {
        const moduleNode = node.arguments[0];
        if (moduleNode && ts.isStringLiteralLike(moduleNode) && isAnalyticsModule(moduleNode.text)) {
          prohibit("analytics-sdk-dynamic-import", node);
        }
      }
    }

    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      if (ts.isIdentifier(node.tagName) && node.tagName.text === "Analytics") {
        if (isExactAllowedComponent(normalFile, node)) {
          allowedComponents += 1;
        } else {
          prohibit("vercel-analytics-component-not-allowlisted", node);
        }
      }
    }

    if (ts.isIdentifier(node) && node.text === "Analytics" && !isAnalyticsIdentifierContext(node)) {
      prohibit("vercel-analytics-symbol-not-allowlisted", node);
    }

    if (ts.isStringLiteralLike(node) && !isModuleSpecifier(node)) {
      if (isExplicitAnalyticsModuleReference(node.text)) prohibit("analytics-sdk-reference", node);
      if (eventEndpoint(node.text)) prohibit("custom-event-endpoint", node);
      if (analyticsSdkUrl(node.text)) prohibit("analytics-sdk-url", node);
    }

    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  if (normalFile === ALLOWED_FILE) {
    if (allowedImports !== 1) add("allowlisted-analytics-import-count", sourceFile);
    if (allowedComponents !== 1) add("allowlisted-analytics-component-count", sourceFile);
  }

  if (prohibitedNodes.length && sensitiveNodes.length) {
    add("analytics-sensitive-payload", sensitiveNodes[0]);
  }

  return dedupeFindings(findings).sort(
    (a, b) => a.line - b.line || a.id.localeCompare(b.id),
  );
}

function walkSources(root, directory, files) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    const relativeFile = normalisePath(relative(root, absolute));
    if (entry.isSymbolicLink()) throw new Error(`source symlink is not allowed: ${relativeFile}`);
    if (entry.isDirectory()) {
      walkSources(root, absolute, files);
    } else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      files.push(relativeFile);
    }
  }
}

export function collectSourceFiles(root = process.cwd()) {
  const absoluteRoot = resolve(root);
  const files = [];
  for (const sourceRoot of SOURCE_ROOTS) {
    const directory = resolve(absoluteRoot, sourceRoot);
    const stat = lstatSync(directory);
    if (!stat.isDirectory()) throw new Error(`${sourceRoot} is not a source directory`);
    walkSources(absoluteRoot, directory, files);
  }
  return files.sort();
}

export function scanAnalyticsSources(root = process.cwd()) {
  const files = collectSourceFiles(root);
  const findings = files.flatMap((file) =>
    analyzeSource(file, readFileSync(resolve(root, file), "utf8")),
  );
  if (!files.includes(ALLOWED_FILE)) {
    findings.push({ file: ALLOWED_FILE, line: 1, id: "allowlisted-analytics-layout-missing" });
  }
  return { files, findings: dedupeFindings(findings) };
}

export function checkAnalytics(root = process.cwd()) {
  const { files, findings } = scanAnalyticsSources(root);
  if (findings.length) {
    console.error("analytics: FAIL — source policy findings");
    for (const finding of findings) {
      console.error(`  ${finding.id}: ${finding.file}:${finding.line}`);
    }
    throw new Error(`${findings.length} analytics source finding(s)`);
  }
  console.log(
    `analytics: ${files.length} source files checked; source-only Vercel Analytics allowlist passed`,
  );
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  try {
    checkAnalytics();
  } catch (error) {
    if (!(error instanceof Error) || !/analytics source finding/.test(error.message)) {
      console.error(
        "analytics: scanner error — " + (error instanceof Error ? error.message : String(error)),
      );
    }
    process.exitCode = 1;
  }
}
