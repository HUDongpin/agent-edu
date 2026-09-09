/**
 * Drop the duplicate route payload from the export.
 *
 * Next writes each route's flight payload twice: `index.txt`, and a byte-for-
 * byte copy at `__next._full.txt`. On this site that was 2.7 MB of each — 65
 * pairs, a sixth of everything deployed.
 *
 * Only one of them is ever fetched. Recorded against the built export, in
 * Chromium, over cold loads, prefetched navigation, an unprefetched click,
 * back, forward and a locale switch:
 *
 *   __next._tree.txt                         prefetch, per route
 *   __next.$d$locale.<route>.__PAGE__.txt    prefetch, per route
 *   index.txt                                a navigation that was not
 *                                            prefetched — which the handbook
 *                                            now is, see Shell.tsx
 *   __next._full.txt                         never, in any of them
 *
 * So `index.txt` is load-bearing and stays. This removes the copy.
 *
 * The invariant is checked rather than assumed. `__next._full.txt` is deleted
 * only where it is identical to the `index.txt` beside it; anything else and
 * this stops without removing a file, because a copy that has stopped being a
 * copy is Next telling us the two payloads have come to mean different things.
 * If that happens, delete this script rather than teaching it an exception.
 *
 * Worst case if the evidence above is ever wrong: a soft navigation becomes a
 * full page load. Nothing 404s to a reader, because no page links to these.
 */
import { readdirSync, readFileSync, statSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "out");
const COPY = "__next._full.txt";
const CANONICAL = "index.txt";

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.name === COPY) yield path;
  }
}

try {
  statSync(OUT);
} catch {
  console.log("prune-export: no out/ — nothing to do");
  process.exit(0);
}

/* Every pair is compared before any file is removed. Deleting as we went
   would leave the export half-pruned on the one run where the invariant is
   what fails, which is the run that most needs the tree left as it was. */
const removable = [];
const kept = [];
for (const copy of walk(OUT)) {
  const canonical = join(dirname(copy), CANONICAL);
  let same = false;
  try {
    same = readFileSync(copy).equals(readFileSync(canonical));
  } catch {
    same = false;
  }
  if (same) removable.push(copy);
  else kept.push(copy.slice(ROOT.length + 1));
}

if (kept.length) {
  console.error(
    `\nprune-export: ${kept.length} ${COPY} file(s) are not a copy of the ` +
    `${CANONICAL} beside them:\n`,
  );
  for (const k of kept) console.error(`  ${k}`);
  console.error(
    `\n  Nothing was removed. The two payloads have come to differ, so the\n` +
    `  assumption this script rests on no longer holds — read the note at the\n` +
    `  top of scripts/prune-export.mjs before changing anything.\n`,
  );
  process.exit(1);
}

let bytes = 0;
for (const copy of removable) {
  bytes += statSync(copy).size;
  unlinkSync(copy);
}

console.log(
  `prune-export: removed ${removable.length} duplicate route payload(s), ` +
  `${(bytes / 1024 / 1024).toFixed(1)} MB`,
);
