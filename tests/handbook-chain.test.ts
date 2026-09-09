/**
 * The Handbook's forward chain.
 *
 * Section 00 tells the reader to work straight through, and the primary button
 * at the foot of each panel is how they do it. Those destinations are three
 * strings among 542, and nothing read them: graph and harness both pointed at
 * `compare`, so an obedient reader went 05 → 09 and never met the harness, the
 * eval or the injection — the last of which the project's own teaching notes
 * call the moment of the whole lesson. The rail still said 8/11 seen.
 *
 * That is the same failure mode `prose:check` and `handbook:check` already
 * guard elsewhere: content that is data, drifting silently while still reading
 * perfectly. So walk the chain instead of trusting it, and tie it to
 * HANDBOOK_SECTION_IDS, which is the order the progress record counts against.
 */
import assert from "node:assert/strict";
import test from "node:test";
import handbookMarkup from "../lib/handbook/markup";
import { HANDBOOK_SECTION_IDS } from "../lib/progress";

type Nav = { back: string | null; next: string | null };

/** The panel's own extent, so a panel without a nav cannot borrow the next one's. */
function panelOf(id: string): string {
  const start = handbookMarkup.indexOf(`id="p-${id}"`);
  assert.notEqual(start, -1, `no panel markup for section '${id}'`);
  const after = handbookMarkup.indexOf('class="panel"', start + 1);
  return handbookMarkup.slice(start, after === -1 ? undefined : after);
}

function navOf(id: string): Nav {
  const panel = panelOf(id);
  const at = panel.indexOf('class="section-nav"');
  if (at === -1) return { back: null, next: null };
  const block = panel.slice(at);
  const end = block.indexOf("</div>");
  const buttons = [...block.slice(0, end === -1 ? undefined : end)
    .matchAll(/data-goto="(\w+)"[^>]*>([^<]*)</g)];
  return {
    back: buttons.find((b) => b[2].includes("←"))?.[1] ?? null,
    next: buttons.find((b) => b[2].includes("→"))?.[1] ?? null,
  };
}

test("following the primary button from the first section reaches every section, in order", () => {
  const walked: string[] = [];
  let at: string | null = HANDBOOK_SECTION_IDS[0];
  const seen = new Set<string>();

  while (at && !seen.has(at)) {
    seen.add(at);
    walked.push(at);
    at = navOf(at).next;
  }

  assert.equal(at, null, `the forward chain loops back to '${at}' instead of ending`);
  assert.deepEqual(
    walked,
    [...HANDBOOK_SECTION_IDS],
    "the forward chain no longer visits every section in order — a reader " +
      "following the primary button would skip the ones that are missing",
  );
});

test("every section's back button mirrors the forward chain", () => {
  for (let i = 0; i < HANDBOOK_SECTION_IDS.length; i++) {
    const id = HANDBOOK_SECTION_IDS[i];
    const { back } = navOf(id);
    const expected = i === 0 ? null : HANDBOOK_SECTION_IDS[i - 1];
    assert.equal(
      back,
      expected,
      `section '${id}' goes back to '${back}', but '${expected}' precedes it`,
    );
  }
});

test("no section's forward button points at itself or skips ahead", () => {
  for (let i = 0; i < HANDBOOK_SECTION_IDS.length; i++) {
    const id = HANDBOOK_SECTION_IDS[i];
    const { next } = navOf(id);
    if (next === null) {
      assert.equal(
        i,
        HANDBOOK_SECTION_IDS.length - 1,
        `section '${id}' has no forward button but is not the last section`,
      );
      continue;
    }
    assert.notEqual(next, id, `section '${id}' points its forward button at itself`);
    assert.equal(
      next,
      HANDBOOK_SECTION_IDS[i + 1],
      `section '${id}' jumps forward to '${next}', skipping ` +
        `'${HANDBOOK_SECTION_IDS[i + 1]}'`,
    );
  }
});

test("the sections the chain must not skip are the ones it used to", () => {
  /* A regression guard naming the actual defect, so a future edit that
     reintroduces it fails with the reason rather than a diff of two arrays. */
  for (const id of ["harness", "evals", "security"] as const) {
    const reachable = HANDBOOK_SECTION_IDS.some((from) => navOf(from).next === id);
    assert.ok(
      reachable,
      `nothing's forward button reaches '${id}', so working straight through ` +
        "skips it — this is the defect the chain test exists to catch",
    );
  }
});
