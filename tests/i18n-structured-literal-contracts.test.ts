import assert from "node:assert/strict";
import test from "node:test";

import {
  STRUCTURED_LITERAL_CONTRACT_COUNTS,
  structuredLiteralDecision,
} from "../scripts/i18n-structured-literal-contracts.mjs";

test("structured locale literals are accepted only at exact schema paths", () => {
  assert.equal(structuredLiteralDecision("rag", "lab.scenarios[0].id", "paraphrase")?.id, "rag-scenario-id-v1");
  assert.equal(
    structuredLiteralDecision("rag", "lessons.choose-rag.checkpoint.sourceId", "google-rag-engine-overview")?.id,
    "rag-checkpoint-source-id-v1",
  );
  assert.equal(
    structuredLiteralDecision("rag", "lessons.production-capstone.figure.transcript[3]", "remote-work-policy.md")?.id,
    "rag-figure-technical-literal-v1",
  );
  assert.equal(structuredLiteralDecision("rag", "lessons.choose-rag.figure.transcript[5]", "RAG")?.id, "rag-figure-technical-literal-v1");
  assert.equal(structuredLiteralDecision("rag", "lessons.trace-the-pipeline.figure.transcript[2]", "LLM")?.id, "rag-figure-technical-literal-v1");
  assert.equal(structuredLiteralDecision("rag", "lessons.evaluate-rag.figure.transcript[4]", "Recall at K")?.id, "rag-figure-technical-literal-v1");
  assert.equal(structuredLiteralDecision("rag", "lessons.parse-and-chunk.figure.transcript[7]", "Top K")?.id, "rag-figure-technical-literal-v1");
  assert.equal(structuredLiteralDecision("cursor", "quiz.q13.options.a", ".cursor/accessibility.mdc")?.id, "cursor-q13-path-fixtures-v1");
  assert.equal(structuredLiteralDecision("make-money-with-codex", "availability.contentLanguage", "en")?.id, "make-money-availability-enum-v1");
  assert.equal(structuredLiteralDecision("mcp", "_meta.sourceLocale", "en")?.id, "mcp-source-locale-v1");
  assert.equal(structuredLiteralDecision("mcp", "_meta.generatedOn", "2026-08-26")?.id, "mcp-generated-date-v1");
  assert.equal(structuredLiteralDecision("mcp", "_meta.generatedOn", "2028-02-29")?.id, "mcp-generated-date-v1");
  assert.equal(structuredLiteralDecision("mcp", "ui.dashboardProtocolTemplate", "MCP {version}")?.id, "mcp-protocol-template-v1");
  assert.equal(structuredLiteralDecision("mcp", "concepts.dcr.label", "Dynamic Client Registration")?.id, "mcp-protected-concept-literal-v1");
});

test("natural-language fields cannot inherit a machine-literal decision", () => {
  assert.equal(structuredLiteralDecision("rag", "lessons.choose-rag.title", "google-rag-engine-overview"), null);
  assert.equal(structuredLiteralDecision("cursor", "quiz.q13.prompt", ".cursor/accessibility.mdc"), null);
  assert.equal(structuredLiteralDecision("make-money-with-codex", "ui.reviewStatus", "pending-independent-native-review"), null);
  assert.equal(structuredLiteralDecision("mcp", "ui.generatedOn", "2026-08-26"), null);
  assert.equal(structuredLiteralDecision("mcp", "ui.dashboardTitle", "MCP {version}"), null);
  assert.equal(structuredLiteralDecision("mcp", "meta.summary", "Dynamic Client Registration"), null);
  assert.equal(structuredLiteralDecision("rag", "lessons.choose-rag.title", "RAG"), null);
  assert.equal(structuredLiteralDecision("rag", "lessons.evaluate-rag.title", "Recall at K"), null);
});

test("closed values and formats fail when their exact contract drifts", () => {
  assert.equal(structuredLiteralDecision("rag", "lab.scenarios[0].id", "write the answer in English"), null);
  assert.equal(structuredLiteralDecision("rag", "lessons.choose-rag.checkpoint.sourceId", "new-unreviewed-source"), null);
  assert.equal(structuredLiteralDecision("cursor", "quiz.q13.options.a", ".cursor/rules/unreviewed.mdc"), null);
  assert.equal(structuredLiteralDecision("make-money-with-codex", "availability.contentLanguage", "English content"), null);
  assert.equal(structuredLiteralDecision("mcp", "_meta.generatedOn", "26 August 2026"), null);
  assert.equal(structuredLiteralDecision("mcp", "_meta.generatedOn", "2026-13-40"), null);
  assert.equal(structuredLiteralDecision("mcp", "_meta.generatedOn", "2026-02-29"), null);
  assert.equal(structuredLiteralDecision("mcp", "_meta.generatedOn", "2026-04-31"), null);
  assert.equal(structuredLiteralDecision("mcp", "ui.dashboardProtocolTemplate", "MCP version"), null);
  assert.equal(structuredLiteralDecision("mcp", "concepts.dcr.label", "DCR"), null);
  assert.equal(structuredLiteralDecision("rag", "lessons.production-capstone.figure.transcript[3]", "Read the remote work policy"), null);
  assert.equal(structuredLiteralDecision("rag", "lessons.choose-rag.figure.transcript[5]", "Retrieval-Augmented Generation"), null);
  assert.equal(structuredLiteralDecision("rag", "lessons.trace-the-pipeline.figure.transcript[2]", "large language model"), null);
  assert.equal(structuredLiteralDecision("rag", "lessons.evaluate-rag.figure.transcript[4]", "Recall@K"), null);
  assert.equal(structuredLiteralDecision("rag", "lessons.parse-and-chunk.figure.transcript[7]", "Top-K"), null);
});

test("contract inventory remains deliberately small and reviewable", () => {
  assert.deepEqual(STRUCTURED_LITERAL_CONTRACT_COUNTS, {
    ragScenarioIds: 3,
    ragCheckpointSourceIds: 12,
    ragFigureTechnicalLiterals: 9,
    cursorPathFixtures: 4,
    makeMoneyAvailabilityEnums: 3,
    mcpProtectedConceptLiterals: 1,
    mcpMetadataAndProtocolFields: 3,
  });
});
