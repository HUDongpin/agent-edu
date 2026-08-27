import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

import { renderedLanguageCandidates } from "../scripts/i18n-rendered-language.mjs";

const CODE_SURFACES = [
  "app/[locale]/build/page.tsx",
  "components/course-kit/CourseLabPack.tsx",
  "components/github/LessonView.tsx",
  "components/mcp/InteractiveLab.tsx",
  "components/mcp/LessonView.tsx",
] as const;

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

function openingElement(node: ts.Node) {
  if (ts.isJsxElement(node)) return node.openingElement;
  if (ts.isJsxSelfClosingElement(node)) return node;
  return null;
}

function tagName(node: ts.JsxOpeningLikeElement) {
  return ts.isIdentifier(node.tagName) ? node.tagName.text : "";
}

test("English code and protocol literals declare their own LTR language boundary", () => {
  const issues: string[] = [];

  for (const path of CODE_SURFACES) {
    const source = ts.createSourceFile(
      path,
      readFileSync(path, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    const visit = (node: ts.Node) => {
      const opening = openingElement(node);
      const name = opening ? tagName(opening) : "";
      if (opening && (name === "code" || name === "option")) {
        const hasLanguage = literalAttribute(opening.attributes, "lang", "en");
        const hasDirection = literalAttribute(opening.attributes, "dir", "ltr");
        if (!hasLanguage || !hasDirection) {
          const position = source.getLineAndCharacterOfPosition(opening.getStart(source));
          issues.push(`${path}:${position.line + 1}:${name}`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }

  assert.deepEqual(issues, [], `technical literals without lang=en dir=ltr: ${issues.join(", ")}`);
});

test("a literal boundary does not hide an adjacent untranslated prose leak", () => {
  const markup = [
    "<section>",
    '<code lang="en" dir="ltr">python validate.py --package example.json</code>',
    "<p>You should verify the original source before you publish the final claim.</p>",
    "</section>",
  ].join("");

  const result = renderedLanguageCandidates(markup, "zh-Hans");
  assert.equal(result.english.length, 1);
  assert.match(result.english[0].excerpt, /verify the original source/);
});
