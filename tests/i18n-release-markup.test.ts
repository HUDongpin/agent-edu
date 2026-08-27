import assert from "node:assert/strict";
import test from "node:test";

import {
  findSerializedEmptyText,
  stripHtmlComments,
} from "../scripts/i18n-release-markup.mjs";

test("serialized empty-text audit detects null and undefined across comments", () => {
  assert.equal(findSerializedEmptyText("<p><!-- before --> undefined <!-- after --></p>"), "undefined");
  assert.equal(findSerializedEmptyText("<p>nu<!-- split -->ll</p>"), "null");
  assert.equal(findSerializedEmptyText("<p>null result</p>"), "");
});

test("HTML comment stripping handles unclosed comments conservatively", () => {
  assert.equal(stripHtmlComments("before<!-- hidden -->after"), "beforeafter");
  assert.equal(stripHtmlComments("before<!-- unclosed"), "before");
});

test("serialized empty-text audit remains linear on comment-heavy export markup", () => {
  const commentHeavyMarkup = `<main>${"><!-- flight boundary --> ".repeat(20_000)}value</main>`;
  assert.equal(findSerializedEmptyText(commentHeavyMarkup), "");
});
