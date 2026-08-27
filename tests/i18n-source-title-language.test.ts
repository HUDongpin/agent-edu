import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const SOURCE_COMPONENTS = [
  "components/agent-orchestration/ModuleView.tsx",
  "components/claude/FinalQuiz.tsx",
  "components/claude/LessonView.tsx",
  "components/codex/FinalQuiz.tsx",
  "components/codex/LessonView.tsx",
  "components/cursor/FinalQuiz.tsx",
  "components/cursor/LessonKnowledgeCheck.tsx",
  "components/cursor/LessonView.tsx",
  "components/github/FinalQuiz.tsx",
  "components/github/LessonView.tsx",
  "components/grok/FinalQuiz.tsx",
  "components/grok/LessonView.tsx",
  "components/mcp/LessonView.tsx",
  "components/rag/LessonView.tsx",
];

function literalAttribute(node: ts.JsxAttributes, name: string, value: string) {
  return node.properties.some((property) => (
    ts.isJsxAttribute(property)
    && ts.isIdentifier(property.name)
    && property.name.text === name
    && property.initializer
    && ts.isStringLiteral(property.initializer)
    && property.initializer.text === value
  ));
}

function attributesOf(node: ts.Node) {
  if (ts.isJsxElement(node)) return node.openingElement.attributes;
  if (ts.isJsxSelfClosingElement(node)) return node.attributes;
  return null;
}

function isRenderedSourceTitle(node: ts.Node) {
  if (!(ts.isPropertyAccessExpression(node)
    && ts.isIdentifier(node.expression)
    && node.expression.text === "source"
    && node.name.text === "title"
    && node.parent
    && node.parent.getSourceFile() === node.getSourceFile())) return false;
  let current: ts.Node | undefined = node.parent;
  while (current && !ts.isFunctionLike(current)) {
    if (ts.isJsxExpression(current)) return true;
    current = current.parent;
  }
  return false;
}

test("shared official source titles expose an explicit English LTR boundary", () => {
  const issues: string[] = [];

  for (const path of SOURCE_COMPONENTS) {
    const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node: ts.Node) => {
      if (isRenderedSourceTitle(node)) {
        let current: ts.Node | undefined = node.parent;
        let bounded = false;
        while (current && !ts.isFunctionLike(current)) {
          const attributes = attributesOf(current);
          if (attributes && literalAttribute(attributes, "lang", "en") && literalAttribute(attributes, "dir", "ltr")) {
            bounded = true;
            break;
          }
          current = current.parent;
        }
        if (!bounded) {
          const position = source.getLineAndCharacterOfPosition(node.getStart(source));
          issues.push(`${path}:${position.line + 1}`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }

  assert.deepEqual(issues, [], `source titles without lang=en dir=ltr: ${issues.join(", ")}`);
});
