import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { resolveStaticConst } from "../scripts/lib/codex-static-source.mjs";

test("the Course 2 checker is wired to inert AST resolution", () => {
  const checker = readFileSync(
    new URL("../scripts/check-codex-course.mjs", import.meta.url),
    "utf8",
  );

  assert.match(checker, /import \{ resolveStaticConst \} from "\.\/lib\/codex-static-source\.mjs";/);
  assert.match(checker, /return resolveStaticConst\(source, name, rel\(sourcePath\)\);/);
  assert.doesNotMatch(checker, /node:vm|runInNewContext|\bvm\./);
});

test("resolves the shared privacy checklist while preserving capture-required status", () => {
  const source = `
    const privacyChecklist = ["inspect final pixels", "bind review to hash"] as const;
    const RAW_CODEX_FIGURES = [
      {
        id: "fig-01",
        status: "capture-required",
        privacyChecklist,
      },
    ] as const satisfies readonly unknown[];
  `;

  assert.deepEqual(resolveStaticConst(source, "RAW_CODEX_FIGURES", "fixture.ts"), [
    {
      id: "fig-01",
      status: "capture-required",
      privacyChecklist: ["inspect final pixels", "bind review to hash"],
    },
  ]);
});

test("resolves all 24 current figures from the real shared-checklist manifest", () => {
  const sourcePath = new URL("../lib/codex/figures.ts", import.meta.url);
  const figures = resolveStaticConst(
    readFileSync(sourcePath, "utf8"),
    "RAW_CODEX_FIGURES",
    "lib/codex/figures.ts",
  );

  assert.ok(Array.isArray(figures));
  assert.equal(figures.length, 24);
  assert.deepEqual(figures.map((figure) => figure.id),
    Array.from({ length: 24 }, (_, index) => `fig-${String(index + 1).padStart(2, "0")}`));
  assert.ok(figures.every((figure) => Array.isArray(figure.privacyChecklist)));
  assert.ok(figures.every((figure) => figure.privacyChecklist.length === 13));
});

test("rejects executable referenced constants without running them", () => {
  const marker = "__codexStaticSourceExecuted";
  const globalRecord = globalThis as unknown as Record<string, unknown>;
  Object.defineProperty(globalThis, marker, {
    configurable: true,
    value: false,
    writable: true,
  });
  const source = `
    const privacyChecklist = (() => {
      globalThis.${marker} = true;
      return ["executed"];
    })();
    const RAW_CODEX_FIGURES = [{ id: "fig-01", privacyChecklist }];
  `;

  try {
    assert.throws(
      () => resolveStaticConst(source, "RAW_CODEX_FIGURES", "dynamic.ts"),
      /unsupported static expression CallExpression/,
    );
    assert.equal(globalRecord[marker], false);
  } finally {
    delete globalRecord[marker];
  }
});

test("rejects a computed export instead of scanning forward to another literal", () => {
  const source = `
    const RAW_CODEX_FIGURES = makeFigures();
    const unrelated = [];
  `;

  assert.throws(
    () => resolveStaticConst(source, "RAW_CODEX_FIGURES", "forward-scan.ts"),
    /unsupported static expression CallExpression/,
  );
});

test("rejects unresolved, cyclic, spread, and computed data", () => {
  const invalid = [
    ["const RAW = missing;", /unresolved identifier missing/],
    ["let mutable = []; const RAW = mutable;", /identifier mutable is not declared with const/],
    ["const RAW = undefined;", /unresolved identifier undefined/],
    ["const first = first; const RAW = first;", /cyclic identifier first/],
    ["const RAW = [later]; const later = 'x';", /forward reference to const later/],
    [
      "const A = [B]; const B = ['b']; const C = B; const RAW = [C, A];",
      /forward reference to const B/,
    ],
    ["const values = []; const RAW = [...values];", /array spreads are not statically accepted/],
    ["const key = 'id'; const RAW = [{ [key]: 'fig-01' }];", /computed property names are not statically accepted/],
  ] as const;

  for (const [source, pattern] of invalid) {
    assert.throws(() => resolveStaticConst(source, "RAW", "invalid.ts"), pattern);
  }
});
