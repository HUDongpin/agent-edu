import assert from "node:assert/strict";
import test from "node:test";

import { containsUnresolvedReleaseMarker } from "../scripts/check-course-static-export.mjs";

test("static export marker detection does not reject ordinary Spanish prose", () => {
  assert.equal(containsUnresolvedReleaseMarker("Todo el contenido está disponible."), false);
  assert.equal(containsUnresolvedReleaseMarker("Revise todo antes de continuar."), false);
});

test("static export marker detection remains fail-closed for explicit markers", () => {
  assert.equal(containsUnresolvedReleaseMarker("TODO: write this module"), true);
  assert.equal(containsUnresolvedReleaseMarker("Status: TBD"), true);
  assert.equal(containsUnresolvedReleaseMarker("state=capture-required"), true);
});
