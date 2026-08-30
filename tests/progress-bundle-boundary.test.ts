import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";
import ts from "typescript";
import {
  CLAUDE_CAPSTONE,
} from "../lib/claude/capstone";
import { CLAUDE_FINAL_QUIZ } from "../lib/claude/quiz";
import { CLAUDE_LESSON_SLUGS } from "../lib/claude/types";
import { CODEX_CAPSTONE_RECEIPT_VERSION } from "../lib/codex/capstone";
import { CODEX_FINAL_QUIZ } from "../lib/codex/quiz";
import { CODEX_LESSON_SLUGS } from "../lib/codex/types";
import { CURSOR_CAPSTONE } from "../lib/cursor/capstone";
import {
  CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY,
  CURSOR_CAPSTONE_META_PROGRESS_KEY,
  CURSOR_CAPSTONE_PROGRESS_KEY,
  CURSOR_CAPSTONE_PROGRESS_META,
  CURSOR_PROGRESS_EVENT as AUTHORITATIVE_CURSOR_PROGRESS_EVENT,
  CURSOR_PROGRESS_LOCK_NAME as AUTHORITATIVE_CURSOR_PROGRESS_LOCK_NAME,
  CURSOR_PROGRESS_PREFIX as AUTHORITATIVE_CURSOR_PROGRESS_PREFIX,
  CURSOR_PROGRESS_STORAGE_KEY as AUTHORITATIVE_CURSOR_PROGRESS_STORAGE_KEY,
} from "../lib/cursor/progress";
import { CURSOR_FINAL_QUIZ } from "../lib/cursor/quiz";
import { CURSOR_LESSON_SLUGS } from "../lib/cursor/types";
import { AGENT_ORCHESTRATION_EN_COPY } from "../lib/agent-orchestration/copy/en";
import { AGENT_ORCHESTRATION_ZH_HANS_COPY } from "../lib/agent-orchestration/copy/zh-Hans";
import { AGENT_ORCHESTRATION_COURSE_MANIFEST } from "../lib/agent-orchestration/manifest";
import { AGENT_ORCHESTRATION_PRACTICE_TEMPLATES } from "../lib/agent-orchestration/practice-templates";
import {
  AGENT_ORCHESTRATION_PROGRESS_EVENT,
  AGENT_ORCHESTRATION_PROGRESS_PREFIX,
  AGENT_ORCHESTRATION_PROGRESS_VERSION,
  AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY,
} from "../lib/agent-orchestration/progress";
import { AI_TUTOR_COURSE_MANIFEST } from "../lib/ai-tutor/manifest";
import {
  AI_TUTOR_PROGRESS_EVENT,
  AI_TUTOR_PROGRESS_PREFIX,
  AI_TUTOR_PROGRESS_VERSION,
  AI_TUTOR_PROGRESS_VERSION_KEY,
} from "../lib/ai-tutor/progress";
import { CLAUDE_INCOME_CAPSTONE } from "../lib/claude-income/capstone";
import { CLAUDE_INCOME_COURSE } from "../lib/claude-income/curriculum";
import { CLAUDE_INCOME_FINAL_QUIZ } from "../lib/claude-income/quiz";
import { GITHUB_FINAL_QUIZ } from "../lib/github/quiz";
import { GITHUB_LESSON_SLUGS } from "../lib/github/types";
import { GROK_LESSON_SLUGS } from "../lib/grok/types";
import {
  MAKE_MONEY_WITH_CODEX_CAPSTONE_ITEM_COUNT,
  MAKE_MONEY_WITH_CODEX_COURSE_VERSION,
  MAKE_MONEY_WITH_CODEX_LESSON_SLUGS,
  MAKE_MONEY_WITH_CODEX_PROGRESS_VERSION_KEY,
  MAKE_MONEY_WITH_CODEX_QUIZ_IDS,
  MAKE_MONEY_WITH_CODEX_QUIZ_VERSION,
} from "../lib/make-money-with-codex/types";
import { MCP_LESSONS } from "../lib/mcp/course";
import { MCP_ASSESSMENT_VERSION } from "../lib/mcp/types";
import { PRODUCT_MANAGEMENT_COURSE_MANIFEST } from "../lib/product-management/manifest";
import {
  PRODUCT_MANAGEMENT_PROGRESS_EVENT,
  PRODUCT_MANAGEMENT_PROGRESS_PREFIX,
  PRODUCT_MANAGEMENT_PROGRESS_VERSION,
  PRODUCT_MANAGEMENT_PROGRESS_VERSION_KEY,
} from "../lib/product-management/progress";
import { PROMPT_LESSON_SLUGS } from "../lib/prompts/types";
import {
  AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS,
  AGENT_ORCHESTRATION_PROGRESS_SCHEMA,
  AI_TUTOR_PROGRESS_MODULE_SLUGS,
  AI_TUTOR_PROGRESS_SCHEMA,
  CLAUDE_PROGRESS_LESSON_SLUGS,
  CLAUDE_PROGRESS_SCHEMA,
  CLAUDE_INCOME_PROGRESS_CAPSTONE_KEY,
  CLAUDE_INCOME_PROGRESS_LESSON_SLUGS,
  CLAUDE_INCOME_PROGRESS_QUIZ,
  CODEX_PROGRESS_LESSON_SLUGS,
  CODEX_PROGRESS_SCHEMA,
  CURSOR_PROGRESS_EVENT,
  CURSOR_PROGRESS_LESSON_SLUGS,
  CURSOR_PROGRESS_LOCK_NAME,
  CURSOR_PROGRESS_PREFIX,
  CURSOR_PROGRESS_SCHEMA,
  CURSOR_PROGRESS_STORAGE_KEY,
  GITHUB_PROGRESS_LESSON_SLUGS,
  GITHUB_PROGRESS_QUIZ,
  GROK_PROGRESS_LESSON_SLUGS,
  MAKE_MONEY_PROGRESS_LESSON_SLUGS,
  MAKE_MONEY_PROGRESS_SCHEMA,
  MCP_PROGRESS_ASSESSMENT_VERSION,
  MCP_PROGRESS_LESSON_SLUGS,
  PRODUCT_MANAGEMENT_PROGRESS_MODULE_SLUGS,
  PRODUCT_MANAGEMENT_PROGRESS_SCHEMA,
  PROMPT_PROGRESS_LESSON_SLUGS,
  RAG_PROGRESS_LESSON_SLUGS,
  SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE,
  SOFTWARE_ENGINEERING_PROGRESS_LESSON_SLUGS,
  SOFTWARE_ENGINEERING_PROGRESS_QUIZ,
} from "../lib/progress-topology";
import { RAG_LESSON_SLUGS } from "../lib/rag/types";
import {
  SOFTWARE_ENGINEERING_CAPSTONE_ARTIFACT_IDS,
  SOFTWARE_ENGINEERING_CAPSTONE_PASSING_SCORE,
  SOFTWARE_ENGINEERING_CAPSTONE_RELEASE_GATES,
  SOFTWARE_ENGINEERING_CAPSTONE_SCHEMA_VERSION,
  SOFTWARE_ENGINEERING_CAPSTONE_TOTAL_POINTS,
  SOFTWARE_ENGINEERING_RELEASE_DECISIONS,
} from "../lib/software-engineering/capstone";
import {
  SOFTWARE_ENGINEERING_FINAL_QUIZ,
} from "../lib/software-engineering/quiz";
import { SOFTWARE_ENGINEERING_LESSON_SLUGS } from "../lib/software-engineering/types";

const ROOT = process.cwd();

function resolveClientModule(fromPath: string, specifier: string): string | null {
  const base = specifier.startsWith("@/")
    ? join(ROOT, specifier.slice(2))
    : specifier.startsWith(".")
      ? resolve(dirname(fromPath), specifier)
      : null;
  if (!base) return null;
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.json`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
  ];
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

function runtimeSpecifiers(path: string): readonly string[] {
  if (path.endsWith(".json")) return [];
  const source = readFileSync(path, "utf8");
  const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const specifiers: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const clause = node.importClause;
      const hasRuntimeBinding = !clause
        || (!clause.isTypeOnly && (
          Boolean(clause.name)
          || !clause.namedBindings
          || ts.isNamespaceImport(clause.namedBindings)
          || clause.namedBindings.elements.some((element) => !element.isTypeOnly)
        ));
      if (hasRuntimeBinding) specifiers.push(node.moduleSpecifier.text);
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
  while (pending.length) {
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

test("lightweight progress topology exactly mirrors course route and schema contracts", () => {
  assert.deepEqual(CODEX_PROGRESS_LESSON_SLUGS, CODEX_LESSON_SLUGS);
  assert.deepEqual(CLAUDE_PROGRESS_LESSON_SLUGS, CLAUDE_LESSON_SLUGS);
  assert.deepEqual(CURSOR_PROGRESS_LESSON_SLUGS, CURSOR_LESSON_SLUGS);
  assert.deepEqual(GROK_PROGRESS_LESSON_SLUGS, GROK_LESSON_SLUGS);
  assert.deepEqual(GITHUB_PROGRESS_LESSON_SLUGS, GITHUB_LESSON_SLUGS);
  assert.deepEqual(PROMPT_PROGRESS_LESSON_SLUGS, PROMPT_LESSON_SLUGS);
  assert.deepEqual(
    SOFTWARE_ENGINEERING_PROGRESS_LESSON_SLUGS,
    SOFTWARE_ENGINEERING_LESSON_SLUGS,
  );
  assert.deepEqual(RAG_PROGRESS_LESSON_SLUGS, RAG_LESSON_SLUGS);
  assert.deepEqual(MCP_PROGRESS_LESSON_SLUGS, MCP_LESSONS.map((lesson) => lesson.slug));
  assert.equal(MCP_PROGRESS_ASSESSMENT_VERSION, MCP_ASSESSMENT_VERSION);
  assert.deepEqual(MAKE_MONEY_PROGRESS_LESSON_SLUGS, MAKE_MONEY_WITH_CODEX_LESSON_SLUGS);
  assert.deepEqual(
    CLAUDE_INCOME_PROGRESS_LESSON_SLUGS,
    CLAUDE_INCOME_COURSE.lessons.map((lesson) => lesson.slug),
  );
  assert.deepEqual(
    AI_TUTOR_PROGRESS_MODULE_SLUGS,
    AI_TUTOR_COURSE_MANIFEST.modules.map((module) => module.slug),
  );
  assert.deepEqual(
    PRODUCT_MANAGEMENT_PROGRESS_MODULE_SLUGS,
    PRODUCT_MANAGEMENT_COURSE_MANIFEST.modules.map((module) => module.slug),
  );
  assert.deepEqual(
    AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS,
    AGENT_ORCHESTRATION_COURSE_MANIFEST.modules.map((module) => module.slug),
  );

  assert.deepEqual(GITHUB_PROGRESS_QUIZ, {
    bankVersion: GITHUB_FINAL_QUIZ.bankVersion,
    bestStorageKey: GITHUB_FINAL_QUIZ.bestScoreStorageKey,
    passedStorageKey: GITHUB_FINAL_QUIZ.passedStorageKey,
    versionStorageKey: GITHUB_FINAL_QUIZ.versionStorageKey,
  });
  assert.deepEqual(CODEX_PROGRESS_SCHEMA.quiz, {
    bankVersion: CODEX_FINAL_QUIZ.bankVersion,
    questionCount: CODEX_FINAL_QUIZ.questionCount,
    passingCorrectAnswers: CODEX_FINAL_QUIZ.passingCorrectAnswers,
    bestScoreKey: CODEX_FINAL_QUIZ.bestScoreStorageKey,
    passedKey: CODEX_FINAL_QUIZ.passedStorageKey,
    versionKey: CODEX_FINAL_QUIZ.versionStorageKey,
  });
  assert.equal(CODEX_PROGRESS_SCHEMA.capstoneKey, `codex.capstone.v${CODEX_CAPSTONE_RECEIPT_VERSION}`);
  assert.deepEqual(CLAUDE_PROGRESS_SCHEMA.quiz, {
    bankVersion: CLAUDE_FINAL_QUIZ.bankVersion,
    questionCount: CLAUDE_FINAL_QUIZ.questionCount,
    passingCorrectAnswers: CLAUDE_FINAL_QUIZ.passingCorrectAnswers,
    bestScoreKey: CLAUDE_FINAL_QUIZ.bestScoreStorageKey,
    passedKey: CLAUDE_FINAL_QUIZ.passedStorageKey,
    versionKey: CLAUDE_FINAL_QUIZ.versionStorageKey,
  });
  assert.deepEqual(CLAUDE_PROGRESS_SCHEMA.capstone, {
    progressKey: CLAUDE_CAPSTONE.progressKey,
    criticalClearKey: CLAUDE_CAPSTONE.criticalClearKey,
    artifactIds: CLAUDE_CAPSTONE.artifactIds,
    rubric: CLAUDE_CAPSTONE.rubric,
    passingScore: CLAUDE_CAPSTONE.passingScore,
  });
  assert.deepEqual({
    storageKey: CURSOR_PROGRESS_STORAGE_KEY,
    prefix: CURSOR_PROGRESS_PREFIX,
    progressEvent: CURSOR_PROGRESS_EVENT,
    lockName: CURSOR_PROGRESS_LOCK_NAME,
  }, {
    storageKey: AUTHORITATIVE_CURSOR_PROGRESS_STORAGE_KEY,
    prefix: AUTHORITATIVE_CURSOR_PROGRESS_PREFIX,
    progressEvent: AUTHORITATIVE_CURSOR_PROGRESS_EVENT,
    lockName: AUTHORITATIVE_CURSOR_PROGRESS_LOCK_NAME,
  });
  assert.deepEqual(CURSOR_PROGRESS_SCHEMA.quiz, {
    bankVersion: CURSOR_FINAL_QUIZ.bankVersion,
    questionCount: CURSOR_FINAL_QUIZ.questionCount,
    passingCorrectAnswers: CURSOR_FINAL_QUIZ.passingCorrectAnswers,
    bestScoreKey: CURSOR_FINAL_QUIZ.bestScoreStorageKey,
    passedKey: CURSOR_FINAL_QUIZ.passedStorageKey,
    versionKey: CURSOR_FINAL_QUIZ.versionStorageKey,
  });
  assert.deepEqual(CURSOR_PROGRESS_SCHEMA.capstone, {
    progressKey: CURSOR_CAPSTONE_PROGRESS_KEY,
    metadataKey: CURSOR_CAPSTONE_META_PROGRESS_KEY,
    assessmentKey: CURSOR_CAPSTONE_ASSESSMENT_PROGRESS_KEY,
    metadata: CURSOR_CAPSTONE_PROGRESS_META,
    artifactIds: CURSOR_CAPSTONE.artifactIds,
    rubric: CURSOR_CAPSTONE.rubric,
    requiredRubricIds: ["safety", "verification"],
    passingScore: CURSOR_CAPSTONE.passingScore,
  });
  assert.deepEqual(SOFTWARE_ENGINEERING_PROGRESS_QUIZ, {
    bankVersion: SOFTWARE_ENGINEERING_FINAL_QUIZ.bankVersion,
    questionCount: SOFTWARE_ENGINEERING_FINAL_QUIZ.questionCount,
    passingCorrectAnswers: SOFTWARE_ENGINEERING_FINAL_QUIZ.passingCorrectAnswers,
    bestScoreStorageKey: SOFTWARE_ENGINEERING_FINAL_QUIZ.bestScoreStorageKey,
    passedStorageKey: SOFTWARE_ENGINEERING_FINAL_QUIZ.passedStorageKey,
    versionStorageKey: SOFTWARE_ENGINEERING_FINAL_QUIZ.versionStorageKey,
  });
  assert.deepEqual(SOFTWARE_ENGINEERING_PROGRESS_CAPSTONE, {
    schemaVersion: SOFTWARE_ENGINEERING_CAPSTONE_SCHEMA_VERSION,
    artifactIds: SOFTWARE_ENGINEERING_CAPSTONE_ARTIFACT_IDS,
    releaseGateIds: SOFTWARE_ENGINEERING_CAPSTONE_RELEASE_GATES.map((gate) => gate.id),
    passingScore: SOFTWARE_ENGINEERING_CAPSTONE_PASSING_SCORE,
    totalPoints: SOFTWARE_ENGINEERING_CAPSTONE_TOTAL_POINTS,
    releaseDecisions: SOFTWARE_ENGINEERING_RELEASE_DECISIONS,
  });
  assert.deepEqual(MAKE_MONEY_PROGRESS_SCHEMA, {
    courseVersion: MAKE_MONEY_WITH_CODEX_COURSE_VERSION,
    courseVersionKey: MAKE_MONEY_WITH_CODEX_PROGRESS_VERSION_KEY,
    quizVersion: MAKE_MONEY_WITH_CODEX_QUIZ_VERSION,
    quizQuestionCount: MAKE_MONEY_WITH_CODEX_QUIZ_IDS.length,
    capstoneItemCount: MAKE_MONEY_WITH_CODEX_CAPSTONE_ITEM_COUNT,
  });
  assert.deepEqual(CLAUDE_INCOME_PROGRESS_QUIZ, {
    bankVersion: CLAUDE_INCOME_FINAL_QUIZ.bankVersion,
    passedStorageKey: CLAUDE_INCOME_FINAL_QUIZ.passedStorageKey,
    versionStorageKey: CLAUDE_INCOME_FINAL_QUIZ.versionStorageKey,
  });
  assert.equal(
    CLAUDE_INCOME_PROGRESS_CAPSTONE_KEY,
    CLAUDE_INCOME_CAPSTONE.passedStorageKey,
  );
  assert.deepEqual(
    {
      prefix: AI_TUTOR_PROGRESS_SCHEMA.prefix,
      version: AI_TUTOR_PROGRESS_SCHEMA.version,
      versionKey: AI_TUTOR_PROGRESS_SCHEMA.versionKey,
      progressEvent: AI_TUTOR_PROGRESS_SCHEMA.progressEvent,
    },
    {
      prefix: AI_TUTOR_PROGRESS_PREFIX,
      version: AI_TUTOR_PROGRESS_VERSION,
      versionKey: AI_TUTOR_PROGRESS_VERSION_KEY,
      progressEvent: AI_TUTOR_PROGRESS_EVENT,
    },
  );
  assert.deepEqual(
    {
      prefix: PRODUCT_MANAGEMENT_PROGRESS_SCHEMA.prefix,
      version: PRODUCT_MANAGEMENT_PROGRESS_SCHEMA.version,
      versionKey: PRODUCT_MANAGEMENT_PROGRESS_SCHEMA.versionKey,
      progressEvent: PRODUCT_MANAGEMENT_PROGRESS_SCHEMA.progressEvent,
    },
    {
      prefix: PRODUCT_MANAGEMENT_PROGRESS_PREFIX,
      version: PRODUCT_MANAGEMENT_PROGRESS_VERSION,
      versionKey: PRODUCT_MANAGEMENT_PROGRESS_VERSION_KEY,
      progressEvent: PRODUCT_MANAGEMENT_PROGRESS_EVENT,
    },
  );
  assert.deepEqual(
    {
      prefix: AGENT_ORCHESTRATION_PROGRESS_SCHEMA.prefix,
      version: AGENT_ORCHESTRATION_PROGRESS_SCHEMA.version,
      versionKey: AGENT_ORCHESTRATION_PROGRESS_SCHEMA.versionKey,
      progressEvent: AGENT_ORCHESTRATION_PROGRESS_SCHEMA.progressEvent,
    },
    {
      prefix: AGENT_ORCHESTRATION_PROGRESS_PREFIX,
      version: AGENT_ORCHESTRATION_PROGRESS_VERSION,
      versionKey: AGENT_ORCHESTRATION_PROGRESS_VERSION_KEY,
      progressEvent: AGENT_ORCHESTRATION_PROGRESS_EVENT,
    },
  );
});

test("public progress client graph has no transitive course-content dependency", () => {
  const topology = readFileSync(join(ROOT, "lib/progress-topology.ts"), "utf8");
  assert.doesNotMatch(topology, /^import\s/m);

  const clientFiles = [
    "components/progress-adapters.ts",
    "components/codex/progress-store.ts",
    "components/claude/progress-store.ts",
    "components/cursor/progress-store.ts",
    "components/grok/progress-store.ts",
    "components/github/progress-store.ts",
    "components/prompts/progress-store.ts",
    "components/software-engineering/progress-store.ts",
    "components/rag/progress-store.ts",
    "components/mcp/progress-store.ts",
    "components/make-money-with-codex/progress-store.ts",
    "components/claude-income/progress-store.ts",
    "components/ai-tutor/progress-store.ts",
    "components/product-management/progress-store.ts",
    "components/agent-orchestration/progress-store.ts",
  ];
  const forbiddenRuntimeImports = [
    /from\s+["']@\/lib\/(?:codex|claude|cursor|github|prompts|software-engineering|rag|mcp|make-money-with-codex|claude-income|ai-tutor|product-management|agent-orchestration)["']/,
    /from\s+["'][^"']*\/(?:manifest|course|curriculum|quiz|capstone|sources|figures|copy\/[^"']+)["']/,
  ];
  for (const relativePath of clientFiles) {
    const source = readFileSync(join(ROOT, relativePath), "utf8")
      .replace(/import\s+type\s+[\s\S]*?from\s+["'][^"']+["'];?/gu, "");
    for (const pattern of forbiddenRuntimeImports) {
      assert.doesNotMatch(source, pattern, relativePath);
    }
  }

  const graph = clientDependencyGraph("components/progress-adapters.ts");
  const courseLibrary = /^lib\/(?:codex|claude|cursor|grok|github|prompts|software-engineering|rag|mcp|make-money-with-codex|claude-income|ai-tutor|product-management|agent-orchestration)\//u;
  const allowedCourseRuntime = new Set([
    "lib/grok/progress.ts",
    "lib/prompts/progress-keys.ts",
  ]);
  const leakedCourseFiles = graph.filter(
    (path) => courseLibrary.test(path) && !allowedCourseRuntime.has(path),
  );
  assert.deepEqual(leakedCourseFiles, [], graph.join("\n"));
  assert.ok(graph.includes("lib/progress-topology.ts"));
  assert.ok(graph.includes("config/course-public-surface.json"));
});

test("agent orchestration browser templates exactly mirror authoritative copy", () => {
  assert.deepEqual(
    Object.keys(AGENT_ORCHESTRATION_PRACTICE_TEMPLATES),
    AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS,
  );
  for (const slug of AGENT_ORCHESTRATION_PROGRESS_MODULE_SLUGS) {
    assert.deepEqual(AGENT_ORCHESTRATION_PRACTICE_TEMPLATES[slug], {
      en: AGENT_ORCHESTRATION_EN_COPY.modules[slug].practice.template,
      "zh-Hans": AGENT_ORCHESTRATION_ZH_HANS_COPY.modules[slug].practice.template,
    });
  }
});

test("agent orchestration interactions do not ship the full course corpus", () => {
  const graph = clientDependencyGraph(
    "components/agent-orchestration/Interactions.tsx",
  );
  const forbidden = graph.filter((path) =>
    /lib\/agent-orchestration\/(?:manifest|sources|copy\/|index\.ts)/u.test(path),
  );
  assert.deepEqual(forbidden, [], graph.join("\n"));

  const localSourceBytes = graph.reduce((total, path) => {
    const absolute = join(ROOT, path);
    return existsSync(absolute)
      ? total + Buffer.byteLength(readFileSync(absolute, "utf8"))
      : total;
  }, 0);
  assert.ok(
    localSourceBytes < 250_000,
    `Agent Orchestration interactive graph is ${localSourceBytes} bytes`,
  );
});
