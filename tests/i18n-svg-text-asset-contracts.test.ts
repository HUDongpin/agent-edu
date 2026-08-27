import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  inspectSvgTextAssetContracts,
  SVG_TEXT_ASSET_CLASSIFICATIONS,
  SVG_TEXT_ASSET_CONTRACT_PATH,
} from "../scripts/i18n-svg-text-asset-contracts.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE_LOCALES = [
  "en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar",
] as const;

type ContractManifest = {
  schemaVersion: string;
  siteLocales: string[];
  evidenceSets: Record<string, string[]>;
  assets: Array<{
    path: string;
    sha256: string;
    classification: string;
    visibleTextInventory: string[];
    localeBehavior: { explicitLanguageAnnotation: boolean };
    localizedAlternative: { status: string };
    reviewStatus: { state: string; reviewer: null; reviewedOn: null };
  }>;
};

function manifest(): ContractManifest {
  return JSON.parse(readFileSync(join(ROOT, SVG_TEXT_ASSET_CONTRACT_PATH), "utf8"));
}

function inspect(value = manifest()) {
  return inspectSvgTextAssetContracts(ROOT, [...SITE_LOCALES], value);
}

test("the 198 SVG text findings are bound to 14 exact path-and-hash asset contracts", () => {
  const result = inspect();
  assert.deepEqual(result.issues, []);
  assert.equal(result.decisions.size, 14);
  assert.deepEqual(
    [...new Set([...result.decisions.values()].map((decision) => decision.classification))],
    SVG_TEXT_ASSET_CLASSIFICATIONS,
  );
  assert.equal(
    [...result.decisions.values()].reduce((sum, decision) => sum + decision.naturalLanguageTextCount, 0),
    198,
  );
  assert.equal(
    [...result.decisions.values()].reduce((sum, decision) => sum + decision.visibleTextCount, 0),
    202,
  );
  assert.deepEqual(
    [...result.decisions.values()].reduce<Record<string, number>>((counts, decision) => {
      counts[decision.classification] = (counts[decision.classification] ?? 0) + 1;
      return counts;
    }, {}),
    {
      "brand-mark": 1,
      "course-original-diagram": 12,
      "third-party-or-derived-diagram": 1,
    },
  );
});

test("only the exact brand mark is mechanically accepted; all open media-language reviews remain blocking", () => {
  const result = inspect();
  const accepted = [...result.decisions.values()].filter((decision) => decision.state === "PASS");
  const blocked = [...result.decisions.values()].filter((decision) => decision.state === "FAIL");

  assert.deepEqual(accepted.map((decision) => decision.path), ["public/logo-lockup.svg"]);
  assert.equal(accepted[0].naturalLanguageTextCount, 2);
  assert.equal(blocked.length, 13);
  assert.equal(blocked.reduce((sum, decision) => sum + decision.naturalLanguageTextCount, 0), 196);
  assert.equal(
    result.decisions.get("public/courses/rag/figures/anthropic-knowledge-wiki-architecture.svg")?.state,
    "FAIL",
  );
  assert.equal(
    result.decisions.get("public/courses/rag/figures/anthropic-knowledge-wiki-architecture.svg")?.naturalLanguageTextCount,
    39,
  );

  for (const asset of manifest().assets) {
    assert.equal(asset.reviewStatus.reviewer, null);
    assert.equal(asset.reviewStatus.reviewedOn, null);
  }
});

test("a digest or visible-text inventory mutation invalidates the exact asset decision", () => {
  const digestMutation = manifest();
  digestMutation.assets[0].sha256 = "0".repeat(64);
  const digestResult = inspect(digestMutation);
  assert.equal(digestResult.decisions.has("public/logo-lockup.svg"), false);
  assert.ok(digestResult.issues.some((entry) => entry.path.endsWith(".sha256") && entry.message.includes("Digest mismatch")));

  const inventoryMutation = manifest();
  const claude = inventoryMutation.assets.find((asset) => asset.classification === "course-original-diagram")!;
  claude.visibleTextInventory = claude.visibleTextInventory.slice(1);
  const inventoryResult = inspect(inventoryMutation);
  assert.equal(inventoryResult.decisions.has(claude.path), false);
  assert.ok(inventoryResult.issues.some((entry) => entry.path.endsWith(".visibleTextInventory") && entry.message.includes("drift")));
});

test("directory globs and invalid evidence sets cannot act as SVG exceptions", () => {
  const pathMutation = manifest();
  pathMutation.assets[0].path = "public/**/*.svg";
  const pathResult = inspect(pathMutation);
  assert.equal(pathResult.decisions.size, 13);
  assert.ok(pathResult.issues.some((entry) => entry.path.endsWith(".path") && entry.message.includes("without wildcards")));

  const evidenceMutation = manifest();
  evidenceMutation.evidenceSets["brand-rights-and-provenance"][0] = "public/**/NOTICE.md";
  const evidenceResult = inspect(evidenceMutation);
  assert.equal(evidenceResult.decisions.has("public/logo-lockup.svg"), false);
  assert.ok(evidenceResult.issues.some((entry) => entry.message.includes("without wildcards")));
  assert.ok(evidenceResult.issues.some((entry) => entry.message.includes("Referenced evidence set is invalid")));
});

test("manifest-only status changes cannot mechanically approve instructional or third-party SVG text", () => {
  const thirdPartyMutation = manifest();
  const rag = thirdPartyMutation.assets.find((asset) => asset.classification === "third-party-or-derived-diagram")!;
  rag.reviewStatus.state = "mechanically-verified";
  const ragResult = inspect(thirdPartyMutation);
  assert.equal(ragResult.decisions.has(rag.path), false);
  assert.ok(ragResult.issues.some((entry) => entry.message.includes("Third-party visible-language media requires")));

  const originalMutation = manifest();
  const original = originalMutation.assets.find((asset) => asset.classification === "course-original-diagram")!;
  original.reviewStatus.state = "mechanically-verified";
  original.localeBehavior.explicitLanguageAnnotation = true;
  original.localizedAlternative.status = "localized-transcript";
  const originalResult = inspect(originalMutation);
  assert.equal(originalResult.decisions.has(original.path), false);
  assert.ok(originalResult.issues.some((entry) => entry.message.includes("does not match the SVG root")));
  assert.ok(originalResult.issues.some((entry) => entry.message.includes("localized-alt-and-caption")));
});
