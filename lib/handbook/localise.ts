/**
 * Put a locale's handbook strings into the verified markup, at build time.
 *
 * The swap used to happen in the browser: the page was served in English and
 * JavaScript rewrote the rail labels after mount. That is invisible to a
 * crawler, so /zh-Hans/handbook/ was indexed as an English page — on a site
 * whose whole reason for per-locale URLs is being indexable. Doing it here
 * means the exported file for each locale already reads in that language, and
 * so does the copy a reader without JavaScript gets.
 *
 * Only text is replaced, never structure. The offsets come from
 * `segments.mjs`, which hands back the exact byte range of each text run;
 * everything between those ranges — ids, classes, styles, comments, the
 * elements themselves — is copied through untouched. That is what keeps
 * `markup.ts` byte-for-byte and the 210 DOM queries in `behaviour.ts`
 * resolving against a Japanese page as well as an English one.
 *
 * A locale with no table under messages/handbook/ simply keeps the English
 * prose: drop `fr.json` in that folder and the French handbook goes live, with
 * no code change anywhere.
 */
import MARKUP from "./markup";
import { escapeText, walkHandbook } from "./segments.mjs";
import { getMessages, isLocale, type Messages } from "@/lib/i18n";

/** One locale's article prose: the flat file `extract-handbook.mjs` writes. */
export type HandbookTable = Record<string, string>;

export interface LocalisedHandbook {
  /** The markup, with this locale's text spliced in. */
  html: string;
  /**
   * Whether the articles read as this language throughout.
   *
   * Only true for a complete table, because this is what decides the
   * direction the prose is laid out in. A half-finished Arabic file that
   * flipped the page to RTL would lay the English paragraphs it had not
   * reached yet out right-to-left — full stops on the wrong side, diagram
   * captions running off the edge. Whatever the table does have is still
   * spliced in; it is only the flip that waits.
   */
  localised: boolean;
}

/* Walked once per build process, not once per page: the markup is a constant
   and the walk is the same 560 answers every time. */
const SEGMENTS = walkHandbook(MARKUP);
const BODY_KEYS = SEGMENTS.filter((s) => s.kind === "body").map((s) => s.key);

/** A locale's article prose, or null when nobody has translated it yet. */
async function getTable(locale: string): Promise<HandbookTable | null> {
  if (!isLocale(locale)) return null;
  try {
    return (await import(`@/messages/handbook/${locale}.json`)).default as HandbookTable;
  } catch {
    return null; // no file for this language yet — the English prose stands
  }
}

/**
 * Splice the dictionaries into the markup.
 *
 * A value identical to the English source is skipped rather than re-inserted,
 * so the English export stays byte-identical to `markup.ts` apart from the
 * data-i18n elements — one of which, the closing call into the lab, has always
 * been empty in the source and only ever filled by script.
 */
export function applyHandbook(
  html: string,
  messages: Messages,
  table: HandbookTable | null,
): string {
  const out: string[] = [];
  let cursor = 0;
  for (const seg of SEGMENTS) {
    const value = seg.kind === "i18n" ? messages[seg.key] : table?.[seg.key];
    if (value == null || value === seg.text) continue;
    if (seg.start < cursor) throw new Error(`localise: segments overlap at ${seg.key}`);
    out.push(html.slice(cursor, seg.start), escapeText(value));
    cursor = seg.end;
  }
  out.push(html.slice(cursor));
  return out.join("");
}

/** The handbook markup for one locale, ready to be rendered. */
export async function localiseHandbook(locale: string): Promise<LocalisedHandbook> {
  const messages = await getMessages(locale);
  const table = await getTable(locale);

  /* Loud at build time, silent for readers: a half-finished table renders
     mixed language, and the person who can fix that is watching this log. */
  const missing = table ? BODY_KEYS.filter((k) => table[k] == null).length : BODY_KEYS.length;
  if (table && missing) {
    console.warn(
      `handbook: messages/handbook/${locale}.json is missing ${missing} of ` +
      `${BODY_KEYS.length} strings — those paragraphs export in English, and ` +
      `the page keeps the English text direction until the file is complete.`,
    );
  }

  return { html: applyHandbook(MARKUP, messages, table), localised: table != null && missing === 0 };
}
