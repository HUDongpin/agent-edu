const RAG_SCENARIO_IDS = new Map([
  ["lab.scenarios[0].id", "paraphrase"],
  ["lab.scenarios[1].id", "identifier"],
  ["lab.scenarios[2].id", "conflict"],
]);

const RAG_CHECKPOINT_SOURCE_IDS = new Map([
  ["lessons.advanced-patterns.checkpoint.sourceId", "microsoft-graphrag"],
  ["lessons.choose-rag.checkpoint.sourceId", "google-rag-engine-overview"],
  ["lessons.corpus-contract.checkpoint.sourceId", "owasp-rag-security"],
  ["lessons.embeddings-and-indexes.checkpoint.sourceId", "google-rag-engine-overview"],
  ["lessons.evaluate-rag.checkpoint.sourceId", "openai-evaluation-guide"],
  ["lessons.ground-and-cite.checkpoint.sourceId", "anthropic-citations"],
  ["lessons.parse-and-chunk.checkpoint.sourceId", "google-parse-chunk"],
  ["lessons.production-capstone.checkpoint.sourceId", "google-rag-reference-architecture"],
  ["lessons.rerank-and-assemble.checkpoint.sourceId", "anthropic-context-engineering"],
  ["lessons.retrieval-engineering.checkpoint.sourceId", "anthropic-contextual-retrieval"],
  ["lessons.secure-and-refresh.checkpoint.sourceId", "owasp-rag-security"],
  ["lessons.trace-the-pipeline.checkpoint.sourceId", "langchain-rag-from-scratch"],
]);

const RAG_FIGURE_TECHNICAL_LITERALS = new Map([
  ["lessons.choose-rag.figure.transcript[5]", "RAG"],
  ["lessons.evaluate-rag.figure.transcript[4]", "Recall at K"],
  ["lessons.ground-and-cite.figure.transcript[0]", "ANTHROPIC"],
  ["lessons.ground-and-cite.figure.transcript[3]", "Claude 3 Haiku"],
  ["lessons.parse-and-chunk.figure.transcript[7]", "Top K"],
  ["lessons.production-capstone.figure.transcript[3]", "remote-work-policy.md"],
  ["lessons.production-capstone.figure.transcript[4]", "leave-and-time-off-policy.md"],
  ["lessons.trace-the-pipeline.figure.transcript[2]", "LLM"],
  ["lessons.trace-the-pipeline.figure.transcript[3]", "gpt-5"],
]);

const CURSOR_PATH_FIXTURES = new Map([
  ["quiz.q13.options.a", ".cursor/accessibility.mdc"],
  ["quiz.q13.options.b", ".cursor/rules/accessibility.mdc"],
  ["quiz.q13.options.c", ".cursor/rules/notes.md"],
  ["quiz.q13.options.d", "rules.txt"],
]);

const MAKE_MONEY_AVAILABILITY = new Map([
  ["availability.contentLanguage", "en"],
  ["availability.localizedScope", "navigation-and-titles"],
  ["availability.reviewStatus", "pending-independent-native-review"],
]);

const MCP_PROTECTED_CONCEPT_LITERALS = new Map([
  ["concepts.dcr.label", "Dynamic Client Registration"],
]);

function exactMapDecision(domain, key, value, expected, id, reason) {
  if (!expected.has(key) || expected.get(key) !== value) return null;
  return { id, domain, key, value, reason, expectedLanguage: "en", expectedDirection: "ltr" };
}

function isValidIsoCalendarDate(value) {
  const match = /^(20\d{2})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

/**
 * Machine-readable values that are intentionally stable across locale files.
 * Every rule is bound to an exact domain, exact schema path, and either an
 * exact closed value or a strict non-natural-language format. Moving the same
 * value into a title, instruction, description, or other prose field must not
 * match this policy.
 */
export function structuredLiteralDecision(domain, key, value) {
  if (typeof value !== "string") return null;

  if (domain === "rag") {
    return exactMapDecision(
      domain,
      key,
      value,
      RAG_SCENARIO_IDS,
      "rag-scenario-id-v1",
      "Stable internal scenario identifier validated by the RAG course schema.",
    ) ?? exactMapDecision(
      domain,
      key,
      value,
      RAG_CHECKPOINT_SOURCE_IDS,
      "rag-checkpoint-source-id-v1",
      "Stable source-registry identifier; it is not learner-facing prose.",
    ) ?? exactMapDecision(
      domain,
      key,
      value,
      RAG_FIGURE_TECHNICAL_LITERALS,
      "rag-figure-technical-literal-v1",
      "Exact product/model name, file fixture, protocol abbreviation, or formal RAG metric label represented by the figure transcript.",
    );
  }

  if (domain === "cursor") {
    return exactMapDecision(
      domain,
      key,
      value,
      CURSOR_PATH_FIXTURES,
      "cursor-q13-path-fixtures-v1",
      "Exact LTR path fixture used to assess Cursor rule-file placement.",
    );
  }

  if (domain === "make-money-with-codex") {
    return exactMapDecision(
      domain,
      key,
      value,
      MAKE_MONEY_AVAILABILITY,
      "make-money-availability-enum-v1",
      "Closed machine-readable availability metadata, not learner-facing copy.",
    );
  }

  if (domain === "mcp" && key === "_meta.sourceLocale" && value === "en") {
    return {
      id: "mcp-source-locale-v1",
      domain,
      key,
      value,
      reason: "Machine-readable source-locale enum.",
      expectedLanguage: "en",
      expectedDirection: "ltr",
    };
  }

  if (domain === "mcp") {
    const protectedConcept = exactMapDecision(
      domain,
      key,
      value,
      MCP_PROTECTED_CONCEPT_LITERALS,
      "mcp-protected-concept-literal-v1",
      "Exact protocol concept name explicitly preserved by the MCP locale generator's fixed-term contract.",
    );
    if (protectedConcept) return protectedConcept;
  }

  if (domain === "mcp" && key === "ui.dashboardProtocolTemplate" && value === "MCP {version}") {
    return {
      id: "mcp-protocol-template-v1",
      domain,
      key,
      value,
      reason: "Protocol initialism plus the required version placeholder.",
      expectedLanguage: "zxx",
      expectedDirection: "ltr",
    };
  }

  if (domain === "mcp" && key === "_meta.generatedOn" && isValidIsoCalendarDate(value)) {
    return {
      id: "mcp-generated-date-v1",
      domain,
      key,
      value,
      reason: "Machine-readable ISO date bound to the generated locale bundle.",
      expectedLanguage: "zxx",
      expectedDirection: "ltr",
    };
  }

  return null;
}

export const STRUCTURED_LITERAL_CONTRACT_COUNTS = Object.freeze({
  ragScenarioIds: RAG_SCENARIO_IDS.size,
  ragCheckpointSourceIds: RAG_CHECKPOINT_SOURCE_IDS.size,
  ragFigureTechnicalLiterals: RAG_FIGURE_TECHNICAL_LITERALS.size,
  cursorPathFixtures: CURSOR_PATH_FIXTURES.size,
  makeMoneyAvailabilityEnums: MAKE_MONEY_AVAILABILITY.size,
  mcpProtectedConceptLiterals: MCP_PROTECTED_CONCEPT_LITERALS.size,
  mcpMetadataAndProtocolFields: 3,
});
