import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import {
  ALL_REVIEW_CATALOG_LOCALES,
  NATIVE_REVIEW_CATALOGS,
  NATIVE_REVIEW_INVENTORY_PATH,
  NATIVE_REVIEW_LOCALES,
  buildNativeReviewInventory,
  checkNativeReviewInventory,
  expectedNativeReviewFiles,
  writeNativeReviewInventory,
} from "../scripts/native-review-inventory.mjs";

type ReleaseTarget = {
  candidateCommitSha: string;
  workflowDefinitionSha: string;
};

function git(root: string, ...args: string[]): string {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function catalogPath(catalog: string, locale: string): string {
  const directory = NATIVE_REVIEW_CATALOGS.find((item) => item.id === catalog)?.directory;
  assert.ok(directory);
  return `${directory}/${locale}.json`;
}

function createProject(): {
  root: string;
  releaseTarget: ReleaseTarget;
} {
  const root = mkdtempSync(join(tmpdir(), "agent-edu-native-review-inventory-"));
  mkdirSync(join(root, ".github/workflows"), { recursive: true });
  writeFileSync(join(root, ".github/workflows/ci.yml"), "name: fixture\non: [push]\n");

  for (const descriptor of NATIVE_REVIEW_CATALOGS) {
    for (const locale of ALL_REVIEW_CATALOG_LOCALES) {
      writeJson(join(root, descriptor.directory, `${locale}.json`), {
        "fixture.first": `${descriptor.id}-${locale}-one`,
        "fixture.second": `${descriptor.id}-${locale}-two`,
        "fixture.third": `${descriptor.id}-${locale}-three`,
      });
    }
  }

  git(root, "init", "-q");
  git(root, "config", "user.name", "Native Review Fixture");
  git(root, "config", "user.email", "fixture@example.invalid");
  git(root, "add", ".github", "messages");
  git(root, "commit", "-qm", "fixture candidate");
  const candidateCommitSha = git(root, "rev-parse", "HEAD");
  const workflowDefinitionSha = git(
    root,
    "rev-parse",
    `${candidateCommitSha}:.github/workflows/ci.yml`,
  );
  return {
    root,
    releaseTarget: { candidateCommitSha, workflowDefinitionSha },
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

test("generation is deterministic and freezes the exact 8 x 3 candidate catalog inventory", () => {
  const fixture = createProject();
  const first = buildNativeReviewInventory({
    projectRoot: fixture.root,
    releaseTarget: fixture.releaseTarget,
  });
  const second = buildNativeReviewInventory({
    projectRoot: fixture.root,
    releaseTarget: fixture.releaseTarget,
  });

  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(first).includes("generatedAt"), false);
  assert.deepEqual(first.locales, NATIVE_REVIEW_LOCALES);
  assert.deepEqual(first.catalogTypes, NATIVE_REVIEW_CATALOGS.map(({ id }) => id));
  assert.deepEqual(
    first.files.map(({ catalog, locale, path }) => ({ catalog, locale, path })),
    expectedNativeReviewFiles(),
  );
  assert.equal(first.files.length, 24);
  assert.equal(first.files.every(({ keyCount }) => keyCount === 3), true);
  assert.deepEqual(first.target, {
    candidateCommitSha: fixture.releaseTarget.candidateCommitSha,
    workflowDefinitionPath: ".github/workflows/ci.yml",
    workflowDefinitionSha: fixture.releaseTarget.workflowDefinitionSha,
  });
  assert.deepEqual(first.gateEffect, {
    nativeReviewStatusesChanged: false,
    humanSignaturesPresent: false,
    releaseAuthorized: false,
  });

  const written = writeNativeReviewInventory({
    projectRoot: fixture.root,
    releaseTarget: fixture.releaseTarget,
  });
  assert.deepEqual(written, first);
  assert.deepEqual(
    JSON.parse(readFileSync(join(fixture.root, NATIVE_REVIEW_INVENTORY_PATH), "utf8")),
    first,
  );
  assert.deepEqual(checkNativeReviewInventory({
    projectRoot: fixture.root,
    releaseTarget: fixture.releaseTarget,
  }).issues, []);
});

test("freshness checking rejects digest, key-count, missing, and extra-file drift", () => {
  const fixture = createProject();
  const inventory = buildNativeReviewInventory({
    projectRoot: fixture.root,
    releaseTarget: fixture.releaseTarget,
  });

  const firstPath = join(fixture.root, catalogPath("site", "zh-Hans"));
  writeJson(firstPath, {
    "fixture.first": "changed-with-the-same-key-count",
    "fixture.second": "site-zh-Hans-two",
    "fixture.third": "site-zh-Hans-three",
  });
  let result = checkNativeReviewInventory({
    projectRoot: fixture.root,
    releaseTarget: fixture.releaseTarget,
    inventory,
  });
  assert.ok(result.issues.some((issue) => issue.code === "native-inventory-working-digest"));

  git(fixture.root, "checkout", "--", catalogPath("site", "zh-Hans"));
  const staleCount = clone(inventory);
  staleCount.files[0].keyCount += 1;
  result = checkNativeReviewInventory({
    projectRoot: fixture.root,
    releaseTarget: fixture.releaseTarget,
    inventory: staleCount,
  });
  assert.ok(result.issues.some((issue) => issue.code === "native-inventory-candidate-key-count"));

  rmSync(firstPath);
  result = checkNativeReviewInventory({
    projectRoot: fixture.root,
    releaseTarget: fixture.releaseTarget,
    inventory,
  });
  assert.ok(result.issues.some((issue) => issue.code === "native-inventory-working-file"));

  git(fixture.root, "checkout", "--", catalogPath("site", "zh-Hans"));
  writeJson(join(fixture.root, "messages/it.json"), { unexpected: "locale" });
  result = checkNativeReviewInventory({
    projectRoot: fixture.root,
    releaseTarget: fixture.releaseTarget,
    inventory,
  });
  assert.ok(result.issues.some((issue) => issue.code === "native-inventory-working-file-set"));

  const extraEntry = clone(inventory);
  extraEntry.files.push({
    catalog: "site",
    locale: "it",
    path: "messages/it.json",
    keyCount: 1,
    sha256: "0".repeat(64),
  });
  result = checkNativeReviewInventory({
    projectRoot: fixture.root,
    releaseTarget: fixture.releaseTarget,
    inventory: extraEntry,
  });
  assert.ok(result.issues.some((issue) => issue.code === "native-inventory-file-set"));
});

test("candidate and workflow bindings are derived from Git and fail closed", () => {
  const fixture = createProject();
  const inventory = buildNativeReviewInventory({
    projectRoot: fixture.root,
    releaseTarget: fixture.releaseTarget,
  });

  const wrongInventoryTarget = clone(inventory);
  wrongInventoryTarget.target.candidateCommitSha = "1".repeat(40);
  let result = checkNativeReviewInventory({
    projectRoot: fixture.root,
    releaseTarget: fixture.releaseTarget,
    inventory: wrongInventoryTarget,
  });
  assert.ok(result.issues.some((issue) => issue.code === "native-inventory-target-binding"));

  result = checkNativeReviewInventory({
    projectRoot: fixture.root,
    releaseTarget: {
      ...fixture.releaseTarget,
      workflowDefinitionSha: "2".repeat(40),
    },
    inventory,
  });
  assert.ok(result.issues.some((issue) => issue.code === "native-inventory-workflow-binding"));

  writeFileSync(join(fixture.root, ".github/workflows/ci.yml"), "name: changed\non: [push]\n");
  git(fixture.root, "add", ".github/workflows/ci.yml");
  git(fixture.root, "commit", "-qm", "change workflow");
  const newCandidate = git(fixture.root, "rev-parse", "HEAD");
  const newWorkflow = git(fixture.root, "rev-parse", `${newCandidate}:.github/workflows/ci.yml`);
  result = checkNativeReviewInventory({
    projectRoot: fixture.root,
    releaseTarget: {
      candidateCommitSha: newCandidate,
      workflowDefinitionSha: newWorkflow,
    },
    inventory,
  });
  assert.ok(result.issues.some((issue) => issue.code === "native-inventory-target-binding"));
  assert.ok(result.issues.some((issue) => issue.code === "native-inventory-workflow-binding"));
});

test("fixed-path loading rejects symlinks and reports tampered private values without echoing them", () => {
  const fixture = createProject();
  const inventory = buildNativeReviewInventory({
    projectRoot: fixture.root,
    releaseTarget: fixture.releaseTarget,
  });
  const privateValue = ["sk", "-", "P".repeat(28)].join("");
  const tampered = clone(inventory) as typeof inventory & { authorization?: string };
  tampered.files[0].path = `../../private/${privateValue}`;
  tampered.authorization = `Bearer ${privateValue}`;
  let result = checkNativeReviewInventory({
    projectRoot: fixture.root,
    releaseTarget: fixture.releaseTarget,
    inventory: tampered,
  });
  const rendered = JSON.stringify(result.issues);
  assert.ok(result.issues.some((issue) => issue.code === "native-inventory-privacy"));
  assert.ok(result.issues.some((issue) => issue.code === "native-inventory-path"));
  assert.equal(rendered.includes(privateValue), false);

  const inventoryPath = join(fixture.root, NATIVE_REVIEW_INVENTORY_PATH);
  mkdirSync(dirname(inventoryPath), { recursive: true });
  const outside = join(fixture.root, "outside.json");
  writeJson(outside, inventory);
  symlinkSync(outside, inventoryPath);
  result = checkNativeReviewInventory({
    projectRoot: fixture.root,
    releaseTarget: fixture.releaseTarget,
  });
  assert.ok(result.issues.some((issue) => issue.code === "native-inventory-file"));

  const writeFixture = createProject();
  const outsideDirectory = mkdtempSync(join(tmpdir(), "agent-edu-native-review-outside-"));
  mkdirSync(join(writeFixture.root, "docs/release"), { recursive: true });
  symlinkSync(outsideDirectory, join(writeFixture.root, "docs/release/evidence"));
  assert.throws(() => writeNativeReviewInventory({
    projectRoot: writeFixture.root,
    releaseTarget: writeFixture.releaseTarget,
  }), /escaped|symlink/u);
  assert.equal(existsSync(join(outsideDirectory, "native-review-catalog-inventory.json")), false);
});
