/**
 * Server-only: the scope table and the function that applies it.
 *
 * Deliberately not in `lib/i18n.ts`. That module is imported at run time by
 * LanguageMenu, a client component, so anything living in it can be pulled
 * into the browser bundle — and shipping the scope manifest to the browser to
 * save shipping the dictionary would be a joke at its own expense. Nothing
 * here is ever imported from a "use client" file.
 */
import SCOPES from "@/config/i18n-scopes.json";
import type { Messages } from "@/lib/i18n";

interface ScopeSpec {
  keys: string[];
  prefixes: string[];
}

/**
 * The slice of the dictionary one scope sends to the browser.
 *
 * A server component resolves its strings before the HTML is written, so it
 * reads the whole table and costs nothing. A *client* component reads through
 * React context, and everything in that context crosses the server/client
 * boundary — into the flight payload inlined in the page, and again into the
 * `.txt` payload a <Link> prefetches. Handing it all 427 keys put 35 kB of
 * JSON into every page so that six of them could be read; Arabic paid 51 kB.
 *
 * `config/i18n-scopes.json` says which keys each scope can actually reach. It
 * is generated from the import graph by `scripts/extract-i18n-scopes.mjs` and
 * `npm run i18n:check` fails when it has drifted, because a key that is
 * missing here does not throw — it renders as itself, and a reader sees
 * `nav.theme` where the button's label should be.
 */
export function scopeMessages(messages: Messages, scope: string): Messages {
  const spec = (SCOPES as Record<string, ScopeSpec>)[scope];
  if (!spec) throw new Error(`unknown i18n scope: ${scope}`);
  const out: Messages = {};
  for (const key of spec.keys) {
    if (messages[key] != null) out[key] = messages[key];
  }
  if (spec.prefixes.length) {
    for (const key of Object.keys(messages)) {
      if (spec.prefixes.some((p) => key.startsWith(p))) out[key] = messages[key];
    }
  }
  return out;
}
