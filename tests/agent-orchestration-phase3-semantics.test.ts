import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { AGENT_ORCHESTRATION_EN_COPY } from "../lib/agent-orchestration/copy/en";
import { AGENT_ORCHESTRATION_ZH_HANS_COPY } from "../lib/agent-orchestration/copy/zh-Hans";

const ROOT = process.cwd();
const EN_UI: Readonly<Record<string, string>> = AGENT_ORCHESTRATION_EN_COPY.ui;
const ZH_UI: Readonly<Record<string, string>> =
  AGENT_ORCHESTRATION_ZH_HANS_COPY.ui;

function source(path: string): string {
  return readFileSync(`${ROOT}/${path}`, "utf8");
}

function sourceFile(path: string): ts.SourceFile {
  return ts.createSourceFile(
    path,
    source(path),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
}

function jsxAttribute(
  node: ts.JsxOpeningLikeElement,
  name: string,
): ts.JsxAttribute | undefined {
  return node.attributes.properties.find(
    (property): property is ts.JsxAttribute =>
      ts.isJsxAttribute(property) && property.name.getText() === name,
  );
}

function visit(
  node: ts.Node,
  callback: (candidate: ts.Node) => void,
): void {
  callback(node);
  ts.forEachChild(node, (child) => visit(child, callback));
}

test("assessment choices expose visible semantic selection and result markers", () => {
  const assessment = source(
    "components/agent-orchestration/AssessmentInteractions.tsx",
  );
  assert.match(
    assessment,
    /data-testid="agent-orchestration-assessment-option-marker"/u,
  );
  for (const key of [
    "assessmentOptionSelected",
    "assessmentOptionSelectedCorrect",
    "assessmentOptionCorrect",
    "assessmentOptionSelectedMissed",
  ]) {
    assert.match(assessment, new RegExp(`"${key}"`, "u"));
    assert.equal(typeof EN_UI[key], "string");
    assert.equal(typeof ZH_UI[key], "string");
  }
});

test("runtime semantics ledger uses native table elements without ARIA table emulation", () => {
  const map = source("components/agent-orchestration/OrchestrationMap.tsx");
  assert.match(map, /<table\b/u);
  assert.match(map, /<thead>/u);
  assert.match(map, /<tbody>/u);
  assert.match(map, /<th\s+scope="col"/u);
  assert.match(map, /<th\s+scope="row"/u);
  assert.match(map, /<td\b/u);
  assert.doesNotMatch(
    map,
    /role="(?:table|row|cell|columnheader|grid|gridcell)"/u,
  );
});

test("every Course 15 breadcrumb landmark has the localized breadcrumb name", () => {
  for (const path of [
    "components/agent-orchestration/CourseDashboard.tsx",
    "components/agent-orchestration/ModuleView.tsx",
    "components/agent-orchestration/CourseStaticPageShell.tsx",
  ]) {
    const ast = sourceFile(path);
    const breadcrumbs: ts.JsxOpeningLikeElement[] = [];
    visit(ast, (node) => {
      if (!ts.isJsxOpeningElement(node) && !ts.isJsxSelfClosingElement(node)) {
        return;
      }
      if (node.tagName.getText(ast) !== "nav") return;
      const className = jsxAttribute(node, "className")?.initializer?.getText(ast);
      if (className?.includes("topBreadcrumb")) breadcrumbs.push(node);
    });
    assert.equal(breadcrumbs.length, 1, path);
    const ariaLabel = jsxAttribute(
      breadcrumbs[0]!,
      "aria-label",
    )?.initializer?.getText(ast);
    assert.match(ariaLabel ?? "", /"breadcrumb"/u, path);
    assert.doesNotMatch(ariaLabel ?? "", /"courseMap"/u, path);
  }
  assert.equal(EN_UI.breadcrumb, "Breadcrumb");
  assert.equal(ZH_UI.breadcrumb, "面包屑导航");
});

test("every new-tab source link retains rel protection and discloses the behavior", () => {
  const path = "components/agent-orchestration/ModuleView.tsx";
  const ast = sourceFile(path);
  const externalLinks: ts.JsxElement[] = [];
  visit(ast, (node) => {
    if (!ts.isJsxElement(node) || node.openingElement.tagName.getText(ast) !== "a") {
      return;
    }
    const target = jsxAttribute(
      node.openingElement,
      "target",
    )?.initializer?.getText(ast);
    if (target === '"_blank"') externalLinks.push(node);
  });
  assert.equal(externalLinks.length, 4);
  for (const link of externalLinks) {
    const rel = jsxAttribute(link.openingElement, "rel")?.initializer?.getText(ast);
    assert.equal(rel, '"noopener noreferrer"');
    assert.ok(jsxAttribute(link.openingElement, "aria-label"));
    assert.match(link.getText(ast), /aria-hidden="true">↗<\/span>/u);
  }
  assert.equal(
    EN_UI.opensInNewTab,
    "opens in a new tab",
  );
  assert.equal(
    ZH_UI.opensInNewTab,
    "在新标签页打开",
  );
});

test("terminal pager and reset confirmation copy are native-locale complete", () => {
  const moduleView = source("components/agent-orchestration/ModuleView.tsx");
  assert.match(moduleView, /"returnToCourse"/u);
  assert.match(moduleView, /module\.copy\.meta|course\.copy\.meta\.title/u);
  assert.equal(
    EN_UI.returnToCourse,
    "Return to course overview",
  );
  assert.equal(
    ZH_UI.returnToCourse,
    "返回课程概览",
  );

  const resetCopy = {
    cancelReset: ["Cancel", "取消"],
    resetConfirmationOpen: [
      "Reset confirmation is open for {seconds} seconds. Confirm now or cancel.",
      "重置确认将在 {seconds} 秒内有效。请立即确认或取消。",
    ],
    resetCancelled: [
      "Reset cancelled. No progress was changed.",
      "已取消重置。学习进度未发生更改。",
    ],
    resetExpired: [
      "Reset confirmation expired. No progress was changed.",
      "重置确认已过期。学习进度未发生更改。",
    ],
  } as const;
  for (const [key, [english, chinese]] of Object.entries(resetCopy)) {
    assert.equal(EN_UI[key], english, key);
    assert.equal(ZH_UI[key], chinese, key);
  }
});
