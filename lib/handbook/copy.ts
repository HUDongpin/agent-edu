/**
 * The handbook widgets' own strings.
 *
 * The article prose is spliced into the markup at build time (see
 * `localise.ts`). This is the other half: the text the 22 widget modules
 * write at run time — verdicts, banners, counters, the step log — which a
 * build-time splice cannot reach because none of it exists until a reader
 * presses something.
 *
 * Why a message with placeholders rather than a translated literal
 * ---------------------------------------------------------------
 * `behaviour.ts` assembled these readouts by concatenation:
 *
 *     '📈 ' + rules.length + ' rules now. Each new phrasing needs its own…'
 *     DS.spent.calls + ' call(s) · ' + DS.spent.in + ' in / ' + …
 *
 * Handing a translator ` rules now. Each new phrasing…` and ` call(s) · `
 * as separate strings only works if every language puts the pieces in the
 * English order, and none of them do. `components/Rich.tsx` already made
 * this argument for the Lab and settled on a contract; this is the same
 * contract, for a sink that is a DOM string rather than JSX.
 *
 * The contract, which is all a translator needs to know
 * ----------------------------------------------------
 *   {name}      a value the page drops in — keep it, move it where the
 *               sentence needs it, do not translate the name inside it
 *   **bold**    becomes bold
 *   *italic*    becomes italic
 *
 * Deliberately nothing else. A message is plain text: it never contains
 * HTML, so a translator cannot break the page and never has to think about
 * markup. The elements around it stay in `behaviour.ts` where they were.
 *
 * Values are substituted verbatim, exactly as `+` did — call sites keep the
 * `esc()` calls they already had, and `scripts/check-widgets.mjs` fails the
 * build if an unescaped expression reaches an HTML sink.
 */
import { isLocale } from "@/lib/i18n";

/** One locale's widget strings: the flat file under messages/widgets/. */
export type WidgetTable = Record<string, string>;

/** Values dropped into a message's {placeholders}. */
export type Vars = Record<string, string | number>;

export interface Copy {
  /** A message as plain text, for a textContent sink. */
  t(key: string, vars?: Vars): string;
  /** A message as HTML, for an innerHTML sink. Markers become elements. */
  h(key: string, vars?: Vars): string;
  /**
   * The key for a count, to hand to `t` or `h`: `C.t(C.p(k, n), {n})`.
   *
   * Picking the key rather than rendering the message keeps the choice of
   * sink in one place. A plural that rendered its own HTML would be escaped
   * on the way into a textContent element, and `R&D` would reach a reader
   * as `R&amp;D` — right by accident today, wrong the day someone writes an
   * ampersand into a counter.
   */
  p(key: string, n: number): string;
}

/* Only `&<>` — a message is element content, never an attribute value, and
   escaping quotes as well would show &quot; to a reader in the one place
   these strings actually land. */
function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"));
}

const MARK = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;

/** `**bold**` and `*italic*` become elements. Runs after escaping, so a
 *  translator's `<` is already inert and only these two markers survive. */
function marks(s: string): string {
  return s.replace(MARK, (whole, b: string, i: string) =>
    b !== undefined ? `<strong>${b}</strong>` : `<em>${i}</em>`);
}

/** Substitute {name}. An unknown name is left visible rather than blanked —
 *  a readout reading `{total}` is a bug report; an empty one is a mystery. */
function fill(s: string, vars?: Vars): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole);
}

/**
 * Bind a table to a locale.
 *
 * A missing key falls back to its own name, which is loud in the one place
 * it can appear — nothing here is a flowing paragraph, so a key that slipped
 * through shows up as itself rather than silently rendering the wrong length
 * of text.
 */
export function makeCopy(locale: string, table: WidgetTable): Copy {
  const plurals = (() => {
    try {
      return new Intl.PluralRules(locale);
    } catch {
      return new Intl.PluralRules("en");
    }
  })();

  const raw = (key: string) => table[key] ?? key;

  const t = (key: string, vars?: Vars) => fill(raw(key), vars);
  const h = (key: string, vars?: Vars) => fill(marks(esc(raw(key))), vars);

  /* CLDR categories, so Arabic gets its six and Japanese its one. A table
     that only supplies `.other` is complete for Chinese, Japanese and Korean
     and still legible everywhere else. */
  const p = (key: string, n: number) => {
    const cat = plurals.select(n);
    return table[`${key}.${cat}`] != null ? `${key}.${cat}` : `${key}.other`;
  };

  return { t, h, p };
}

/**
 * One locale's widget strings, merged over English.
 *
 * Per-key rather than all-or-nothing, unlike the article prose: these are
 * separate readouts in separate elements, not one flowing paragraph, so an
 * untranslated verdict beside a translated counter reads as a gap rather
 * than as a sentence that changes language halfway through. Dropping
 * `fr.json` into messages/widgets/ turns French on with no code change.
 */
export async function loadWidgetCopy(locale: string): Promise<WidgetTable> {
  const en = (await import("@/messages/widgets/en.json")).default as WidgetTable;
  if (locale === "en" || !isLocale(locale)) return en;
  try {
    const own = (await import(`@/messages/widgets/${locale}.json`)).default as WidgetTable;
    return { ...en, ...own };
  } catch {
    return en; // nobody has translated this language yet
  }
}
