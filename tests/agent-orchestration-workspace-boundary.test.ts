import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";
import ts from "typescript";

const ROOT = process.cwd();
const ENTRY = "components/agent-orchestration/CourseWorkspacePortability.tsx";

function resolveClientModule(fromPath: string, specifier: string): string | null {
  const base = specifier.startsWith("@/")
    ? join(ROOT, specifier.slice(2))
    : specifier.startsWith(".")
      ? resolve(dirname(fromPath), specifier)
      : null;
  if (!base) return null;
  return [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.json`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ].find((candidate) => existsSync(candidate)) ?? null;
}

function runtimeSpecifiers(path: string): readonly string[] {
  if (path.endsWith(".json")) return [];
  const source = readFileSync(path, "utf8");
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const specifiers: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const clause = node.importClause;
      const runtime = !clause
        || (!clause.isTypeOnly && (
          Boolean(clause.name)
          || !clause.namedBindings
          || ts.isNamespaceImport(clause.namedBindings)
          || clause.namedBindings.elements.some((element) => !element.isTypeOnly)
        ));
      if (runtime) specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isExportDeclaration(node)
      && !node.isTypeOnly
      && node.moduleSpecifier
      && ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node)
      && node.expression.kind === ts.SyntaxKind.ImportKeyword
      && node.arguments.length === 1
      && ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return specifiers;
}

function clientDependencyGraph(entry: string): readonly string[] {
  const pending = [join(ROOT, entry)];
  const visited = new Set<string>();
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    for (const specifier of runtimeSpecifiers(current)) {
      const dependency = resolveClientModule(current, specifier);
      if (dependency && !visited.has(dependency)) pending.push(dependency);
    }
  }
  return [...visited].map((path) => relative(ROOT, path)).sort();
}

test("Course 15 workspace client stays bounded and imports no course corpus", () => {
  const graph = clientDependencyGraph(ENTRY);
  const forbidden = graph.filter((path) =>
    /lib\/agent-orchestration\/(?:manifest|sources|copy\/|index\.ts)/u.test(path),
  );
  assert.deepEqual(forbidden, [], graph.join("\n"));
  const sourceBytes = graph.reduce((total, path) => {
    const absolute = join(ROOT, path);
    return existsSync(absolute)
      ? total + Buffer.byteLength(readFileSync(absolute, "utf8"))
      : total;
  }, 0);
  assert.ok(
    sourceBytes < 250_000,
    `Course 15 workspace client graph is ${sourceBytes} bytes`,
  );
});
