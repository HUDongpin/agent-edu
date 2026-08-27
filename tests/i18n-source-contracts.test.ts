import assert from "node:assert/strict";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import ts from "typescript";

import { reachableMainMessageSources } from "../scripts/i18n-main-message-ownership.mjs";
import {
  SOURCE_LITERAL_EXPECTATIONS,
  createSourceLiteralPolicy,
  discoverProductManagementFallbackSourceContract,
  sourceLiteralDecision,
} from "../scripts/i18n-source-contracts.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VISIBLE_ATTRIBUTES = new Set([
  "aria-label",
  "aria-description",
  "title",
  "placeholder",
  "alt",
  "label",
  "caption",
]);

function parse(path: string, source = readFileSync(path, "utf8")): ts.SourceFile {
  return ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

function literalText(node: ts.Node): string | null {
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (
    ts.isJsxExpression(node)
    && node.expression
    && (ts.isStringLiteralLike(node.expression) || ts.isNoSubstitutionTemplateLiteral(node.expression))
  ) {
    return node.expression.text;
  }
  return null;
}

function isNaturalLanguage(value: string): boolean {
  return /\p{L}/u.test(value) && value.trim().length >= 2;
}

function cloneFixture(paths: readonly string[]): string {
  const fixture = mkdtempSync(join(tmpdir(), "aicourse-i18n-source-"));
  for (const path of paths) {
    const destination = join(fixture, path);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(join(ROOT, path), destination);
  }
  return fixture;
}

function firstJsxText(sourceFile: ts.SourceFile, value: string): ts.JsxText {
  let result: ts.JsxText | undefined;
  function visit(node: ts.Node) {
    if (!result && ts.isJsxText(node) && node.text.trim().replace(/\s+/g, " ") === value) {
      result = node;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  if (!result) throw new Error("Cannot find JSX text: " + value);
  return result;
}

test("the reviewed fallback and technical source inventory is exact", () => {
  const policy = createSourceLiteralPolicy(ROOT);
  const counts = { fallbackJsx: 0, fallbackAttributes: 0, technicalJsx: 0 };
  const rejected: string[] = [];

  for (const path of reachableMainMessageSources(ROOT)) {
    const relativePath = relative(ROOT, path).split(sep).join("/");
    if (!/^(?:app\/\[locale\]|components\/)/.test(relativePath) || !/\.[jt]sx?$/.test(path)) {
      continue;
    }
    const sourceFile = parse(path);
    function visit(node: ts.Node) {
      let category: "jsx" | "attribute" | null = null;
      let text: string | null = null;
      if (ts.isJsxText(node) && isNaturalLanguage(node.text.trim())) {
        category = "jsx";
        text = node.text.trim().replace(/\s+/g, " ");
      } else if (
        ts.isJsxAttribute(node)
        && VISIBLE_ATTRIBUTES.has(node.name.getText(sourceFile))
      ) {
        text = node.initializer ? literalText(node.initializer) : null;
        if (text && isNaturalLanguage(text)) category = "attribute";
      }
      if (category && text) {
        const decision = sourceLiteralDecision(policy, {
          relativePath,
          sourceFile,
          node,
          text,
        });
        if (!decision) {
          rejected.push(relativePath + ":" + text);
        } else if (decision.disposition === "accepted_technical_literal") {
          assert.equal(category, "jsx", relativePath + " technical literal context");
          counts.technicalJsx += 1;
        } else if (category === "jsx") {
          counts.fallbackJsx += 1;
        } else {
          counts.fallbackAttributes += 1;
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
  }

  assert.deepEqual(rejected, []);
  assert.deepEqual(counts, {
    fallbackJsx: SOURCE_LITERAL_EXPECTATIONS.fallbackJsx,
    fallbackAttributes: SOURCE_LITERAL_EXPECTATIONS.fallbackAttributes,
    technicalJsx: SOURCE_LITERAL_EXPECTATIONS.technicalJsx,
  });
});

test("technical literals require an exact file, value and JSX context", () => {
  const policy = createSourceLiteralPolicy(ROOT);
  const brandPath = "app/[locale]/build/page.tsx";
  const acceptedBrandFile = parse(brandPath, "export default function X(){return <h3>DeepSeek</h3>}");
  const acceptedBrand = sourceLiteralDecision(policy, {
    relativePath: brandPath,
    sourceFile: acceptedBrandFile,
    node: firstJsxText(acceptedBrandFile, "DeepSeek"),
    text: "DeepSeek",
  });
  assert.equal(acceptedBrand?.disposition, "accepted_technical_literal");

  const wrongContextFile = parse(brandPath, "export default function X(){return <p>DeepSeek</p>}");
  assert.equal(sourceLiteralDecision(policy, {
    relativePath: brandPath,
    sourceFile: wrongContextFile,
    node: firstJsxText(wrongContextFile, "DeepSeek"),
    text: "DeepSeek",
  }), null);

  const commandPath = "components/deep-learning/DeepLearningLab.tsx";
  const acceptedCommandFile = parse(
    commandPath,
    "export default function X(){return <code>python3 run_experiment.py --output-dir work</code>}",
  );
  assert.equal(sourceLiteralDecision(policy, {
    relativePath: commandPath,
    sourceFile: acceptedCommandFile,
    node: firstJsxText(acceptedCommandFile, "python3 run_experiment.py --output-dir work"),
    text: "python3 run_experiment.py --output-dir work",
  })?.disposition, "accepted_technical_literal");

  const proseInCodeFile = parse(
    commandPath,
    "export default function X(){return <code>Click here to continue</code>}",
  );
  assert.equal(sourceLiteralDecision(policy, {
    relativePath: commandPath,
    sourceFile: proseInCodeFile,
    node: firstJsxText(proseInCodeFile, "Click here to continue"),
    text: "Click here to continue",
  }), null);
});

test("lang=en and dir=ltr do not create a blanket fallback exception", () => {
  const policy = createSourceLiteralPolicy(ROOT);
  const relativePath = "components/unreviewed/FakeCourse.tsx";
  const sourceFile = parse(
    relativePath,
    'export default function X(){return <div lang="en" dir="ltr">Continue setup</div>}',
  );
  assert.equal(sourceLiteralDecision(policy, {
    relativePath,
    sourceFile,
    node: firstJsxText(sourceFile, "Continue setup"),
    text: "Continue setup",
  }), null);
});

test("Product Management fallback discovery fails closed on language, direction and sitemap mutations", () => {
  const paths = [
    "lib/product-management/load.ts",
    "components/product-management/CourseDashboard.tsx",
    "components/product-management/ModuleView.tsx",
    "app/[locale]/product-management/page.tsx",
    "app/[locale]/product-management/[module]/page.tsx",
    "app/sitemap.ts",
  ] as const;

  assert.doesNotThrow(() => discoverProductManagementFallbackSourceContract(ROOT));

  const directionFixture = cloneFixture(paths);
  try {
    const loadPath = join(directionFixture, "lib/product-management/load.ts");
    writeFileSync(
      loadPath,
      readFileSync(loadPath, "utf8").replace('direction: "ltr",', 'direction: "rtl",'),
    );
    assert.throws(
      () => discoverProductManagementFallbackSourceContract(directionFixture),
      /content direction must be ltr/,
    );
  } finally {
    rmSync(directionFixture, { recursive: true, force: true });
  }

  const sitemapFixture = cloneFixture(paths);
  try {
    const sitemapPath = join(sitemapFixture, "app/sitemap.ts");
    writeFileSync(
      sitemapPath,
      readFileSync(sitemapPath, "utf8").replace(
        "? PRODUCT_MANAGEMENT_TRANSLATED_LOCALES",
        "? PRODUCT_MANAGEMENT_LOCALES",
      ),
    );
    assert.throws(
      () => discoverProductManagementFallbackSourceContract(sitemapFixture),
      /reviewed-content-locales/,
    );
  } finally {
    rmSync(sitemapFixture, { recursive: true, force: true });
  }
});
