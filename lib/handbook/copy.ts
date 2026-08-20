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
 * Values passed to `h()` are escaped here, at the last boundary before an
 * HTML sink. Callers cannot accidentally turn translated or state-derived
 * text into markup. The four places that deliberately insert an element use
 * the explicit `trustedMarkup` template tag; even there, every interpolation
 * is escaped and may only appear in element content.
 */
import { isLocale } from "@/lib/i18n";

/** One locale's widget strings: the flat file under messages/widgets/. */
export type WidgetTable = Record<string, string>;

/** Values dropped into a message's {placeholders}. */
export type Vars = Record<string, string | number>;

const TRUSTED_MARKUP: unique symbol = Symbol("handbook.trusted-markup");

/**
 * HTML deliberately authored in this module's call sites.
 *
 * The private symbol makes the type opaque: a string, translation value or
 * object literal cannot be passed to `h()` as markup by accident. Construct
 * it with the `trustedMarkup` template tag so the markup is visible in source
 * review. Dynamic values in that template remain plain text and are escaped.
 */
export interface TrustedMarkup {
  readonly [TRUSTED_MARKUP]: true;
  readonly html: string;
}

/** Values dropped into a message that will be assigned to innerHTML. */
export type HtmlVars = Record<string, string | number | TrustedMarkup>;

export interface Copy {
  /** A message as plain text, for a textContent sink. */
  t(key: string, vars?: Vars): string;
  /** A message as HTML, for an innerHTML sink. Markers become elements. */
  h(key: string, vars?: HtmlVars): string;
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

/** Escape plain data at an HTML boundary. Entities decode back to the same
 * visible characters when the result is assigned to innerHTML. */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    if (c === "&") return "&amp;";
    if (c === "<") return "&lt;";
    if (c === ">") return "&gt;";
    if (c === '"') return "&quot;";
    return "&#39;";
  });
}

/**
 * Explicitly author a small piece of trusted markup.
 *
 * This is a tag rather than a function on purpose: the HTML skeleton must be
 * a source literal. Its allowlist is intentionally limited to constant code
 * and the two internal course links used by the Handbook. Link labels are
 * always escaped as plain text.
 */
export function trustedMarkup(
  strings: TemplateStringsArray,
  ...values: Array<string | number>
): TrustedMarkup {
  if (
    !Array.isArray(strings) ||
    !Object.prototype.hasOwnProperty.call(strings, "raw") ||
    strings.length !== values.length + 1
  ) {
    throw new TypeError("trustedMarkup must be used as a template tag");
  }

  const shape = strings.join("\u0000");
  const constantCode = values.length === 0 && /^<code>[^<>]*<\/code>$/.test(shape);
  const internalLink =
    values.length === 1 && /^<a href="\.\.\/(?:build|lab)\/">\u0000<\/a>$/.test(shape);
  if (!constantCode && !internalLink) {
    throw new TypeError("unsupported trusted markup template");
  }

  let html = strings[0];
  let sourcePrefix = strings[0];
  for (let i = 0; i < values.length; i += 1) {
    if (sourcePrefix.lastIndexOf("<") > sourcePrefix.lastIndexOf(">")) {
      throw new TypeError("trustedMarkup interpolation must be element text");
    }
    html += escapeHtml(String(values[i])) + strings[i + 1];
    sourcePrefix += strings[i + 1];
  }

  return Object.freeze({ [TRUSTED_MARKUP]: true as const, html });
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

/** The innerHTML variant: plain values are inert; only the opaque wrapper may
 * contribute markup. Unknown placeholders remain visible just like `fill`. */
function fillHtml(s: string, vars?: HtmlVars): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (whole, name: string) => {
    if (!(name in vars)) return whole;
    const value = vars[name];
    return typeof value === "object" && value !== null && value[TRUSTED_MARKUP] === true
      ? value.html
      : escapeHtml(String(value));
  });
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
  const h = (key: string, vars?: HtmlVars) => fillHtml(marks(escapeHtml(raw(key))), vars);

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
