import assert from "node:assert/strict";
import test from "node:test";
import type { Request } from "@playwright/test";
import {
  documentUrl,
  isExpectedNextPrefetchCancellation,
  isExpectedWebKitRscPrefetchPageError,
  isNextLinkPrefetchRequest,
} from "./next-prefetch-test-helpers";
import { PLAYWRIGHT_TEST_ORIGIN } from "./playwright-test-url";

const ORIGIN = PLAYWRIGHT_TEST_ORIGIN;
const linked = new Set([documentUrl(`${ORIGIN}/en/teach/`)]);

function fakeRequest({
  url = `${ORIGIN}/en/teach/__next._tree.txt?_rsc=fixture`,
  method = "GET",
  resourceType = "fetch",
  headers = {
    rsc: "1",
    "next-router-prefetch": "1",
    "next-router-segment-prefetch": "/_tree",
  },
}: {
  url?: string;
  method?: string;
  resourceType?: string;
  headers?: Record<string, string>;
} = {}): Request {
  return {
    url: () => url,
    method: () => method,
    resourceType: () => resourceType,
    headers: () => headers,
  } as unknown as Request;
}

test("Next prefetch classifier accepts only exact same-origin RSC GETs and rendered HEAD probes", () => {
  assert.equal(isNextLinkPrefetchRequest(fakeRequest(), ORIGIN, linked), true);
  assert.equal(isNextLinkPrefetchRequest(fakeRequest({
    url: `${ORIGIN}/en/teach/`,
    method: "HEAD",
    headers: {},
  }), ORIGIN, linked), true);

  const rejected = [
    fakeRequest({ url: "https://example.com/__next._tree.txt?_rsc=fixture" }),
    fakeRequest({ method: "POST" }),
    fakeRequest({ resourceType: "xhr" }),
    fakeRequest({ url: `${ORIGIN}/en/teach/?probe=1`, method: "HEAD", headers: {} }),
    fakeRequest({ url: `${ORIGIN}/en/about/`, method: "HEAD", headers: {} }),
    fakeRequest({ headers: { rsc: "1", "next-router-prefetch": "1" } }),
    fakeRequest({ headers: {
      rsc: "1",
      "next-router-segment-prefetch": "/_tree",
    } }),
  ];
  for (const request of rejected) {
    assert.equal(isNextLinkPrefetchRequest(request, ORIGIN, linked), false, request.url());
  }
});

test("only exact Next cancellation signals are classified as expected", () => {
  for (const reason of ["net::ERR_ABORTED", "NS_BINDING_ABORTED", "Load request cancelled"]) {
    assert.equal(isExpectedNextPrefetchCancellation(reason), true, reason);
  }
  for (const reason of ["net::ERR_FAILED", "Load request cancelled by application", "CORS error"]) {
    assert.equal(isExpectedNextPrefetchCancellation(reason), false, reason);
  }

  const rscUrl = `${ORIGIN}/en/teach/__next._tree.txt?_rsc=fixture`;
  const expectedError = new Error(`Fetch API cannot load ${rscUrl} due to access control checks.`);
  assert.equal(isExpectedWebKitRscPrefetchPageError(expectedError, ORIGIN, new Set([rscUrl])), true);
  assert.equal(isExpectedWebKitRscPrefetchPageError(expectedError, ORIGIN, new Set()), false);
  assert.equal(isExpectedWebKitRscPrefetchPageError(
    new Error("Minified React error #418"),
    ORIGIN,
    new Set([rscUrl]),
  ), false);
  assert.equal(isExpectedWebKitRscPrefetchPageError(
    new Error("Fetch API cannot load https://example.com/data due to access control checks."),
    ORIGIN,
    new Set(["https://example.com/data"]),
  ), false);
});
