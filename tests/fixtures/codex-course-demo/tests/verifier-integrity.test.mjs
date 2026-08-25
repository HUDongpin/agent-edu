import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  clearReceipt,
  FORBIDDEN_PACKAGE_MANAGER_SIDECARS,
  frozenFileMatchesBaseline,
  packageFilesMatchBaseline,
  writeReceiptAtomically,
} from "../scripts/verifier-integrity.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE = JSON.parse(readFileSync(join(ROOT, "course-fixture.json"), "utf8"));
const PACKAGE_JSON = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const PACKAGE_LOCK = JSON.parse(readFileSync(join(ROOT, "package-lock.json"), "utf8"));
const PACKAGE_MANAGER_SIDECAR_CASES = [
  ["npm sidecars", [".npmrc", "npm-shrinkwrap.json"]],
  ["Yarn sidecars", ["yarn.lock", ".yarnrc", ".yarnrc.yml", ".yarn", ".pnp.cjs", ".pnp.js", ".pnp.loader.mjs"]],
  ["pnpm sidecars", ["pnpm-lock.yaml", "pnpm-workspace.yaml", ".pnpmfile.cjs", ".pnpmfile.js"]],
  ["Bun sidecars", ["bun.lock", "bun.lockb", "bunfig.toml"]],
];

function withPackageFiles(run) {
  const root = mkdtempSync(join(tmpdir(), "aicourse-codex-integrity-"));
  try {
    writeFileSync(join(root, "package.json"), `${JSON.stringify(PACKAGE_JSON, null, 2)}\n`);
    writeFileSync(join(root, "package-lock.json"), `${JSON.stringify(PACKAGE_LOCK, null, 2)}\n`);
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("the complete package and lock manifests match the immutable baseline", () => {
  assert.equal(packageFilesMatchBaseline(ROOT, FIXTURE), true);
});

test("dependency and supply-chain changes cannot produce noNewDependencies=true", async (t) => {
  const cases = [
    ["optional dependency", (pkg) => { pkg.optionalDependencies = { picocolors: "1.1.1" }; }],
    ["override", (pkg) => { pkg.overrides = { react: "19.2.8" }; }],
    ["install lifecycle script", (pkg) => { pkg.scripts.postinstall = "node install.mjs"; }],
  ];

  for (const [name, mutate] of cases) {
    await t.test(name, () => withPackageFiles((root) => {
      const pkg = structuredClone(PACKAGE_JSON);
      mutate(pkg);
      writeFileSync(join(root, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`);
      assert.equal(packageFilesMatchBaseline(root, FIXTURE), false);
    }));
  }

  await t.test("unexpected lockfile entry", () => withPackageFiles((root) => {
    const lock = structuredClone(PACKAGE_LOCK);
    lock.packages["node_modules/unapproved-package"] = {
      version: "1.0.0",
      resolved: "https://registry.npmjs.org/unapproved-package/-/unapproved-package-1.0.0.tgz",
      integrity: "sha512-not-a-real-package",
    };
    writeFileSync(join(root, "package-lock.json"), `${JSON.stringify(lock, null, 2)}\n`);
    assert.equal(packageFilesMatchBaseline(root, FIXTURE), false);
  }));
});

test("package-manager sidecars cannot produce noNewDependencies=true", async (t) => {
  const expectedSidecars = PACKAGE_MANAGER_SIDECAR_CASES.flatMap(([, entries]) => entries);
  assert.deepEqual(FORBIDDEN_PACKAGE_MANAGER_SIDECARS, expectedSidecars);

  for (const [manager, entries] of PACKAGE_MANAGER_SIDECAR_CASES) {
    await t.test(manager, async (managerTest) => {
      for (const entry of entries) {
        await managerTest.test(entry, () => withPackageFiles((root) => {
          const target = join(root, entry);
          if (entry === ".yarn") {
            mkdirSync(target);
          } else {
            writeFileSync(target, "unapproved package-manager configuration\n");
          }
          assert.equal(packageFilesMatchBaseline(root, FIXTURE), false);
        }));
      }
    });
  }
});

test("the supplied acceptance test must match its frozen byte hash", () => {
  const root = mkdtempSync(join(tmpdir(), "aicourse-codex-frozen-test-"));
  const relativePath = "tests/CourseList.test.tsx";
  const target = join(root, relativePath);
  const baseline = "frozen acceptance test\n";
  try {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, baseline);
    const expectedSha256 = createHash("sha256").update(baseline).digest("hex");
    assert.equal(frozenFileMatchesBaseline(root, relativePath, expectedSha256), true);

    writeFileSync(target, "weakened acceptance test\n");
    assert.equal(frozenFileMatchesBaseline(root, relativePath, expectedSha256), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a new verification clears stale evidence and publishes a pass atomically", () => {
  const root = mkdtempSync(join(tmpdir(), "aicourse-codex-receipt-"));
  const receiptFile = join(root, "course-receipt.json");
  try {
    writeFileSync(receiptFile, "stale passing receipt\n");
    clearReceipt(receiptFile);
    assert.equal(existsSync(receiptFile), false);

    const receipt = { schema: "aicourse.codex.capstone.v1", checks: { tests: true } };
    writeReceiptAtomically(receiptFile, receipt);
    assert.deepEqual(JSON.parse(readFileSync(receiptFile, "utf8")), receipt);
    assert.equal(existsSync(`${receiptFile}.tmp`), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
