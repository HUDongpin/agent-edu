/**
 * One walk of the handbook markup, shared by the extractor and the build.
 *
 * Plain ESM rather than TypeScript on purpose: `scripts/extract-handbook.mjs`
 * runs under bare node with no loader, and `lib/handbook/localise.ts` runs
 * inside the Next build. Both have to agree on every key down to the last
 * digit, so there is exactly one copy of this code and neither side owns it.
 *
 * What it does: find the text runs in the markup and give each one a stable
 * key. It never rewrites, reorders or re-indents anything else. The caller
 * gets byte offsets into the original string and splices values in; every id,
 * class, attribute, comment and structural element is left exactly where the
 * verified build put it, which is what keeps `markup.ts` byte-for-byte and
 * the 210 DOM queries in `behaviour.ts` resolving.
 *
 * Three kinds of run come back:
 *
 *   body — a translatable text node. Keyed `hb.body.<container>.<ordinal>`,
 *          where <container> is the nearest ancestor carrying an id (`doc`
 *          when there is none: the masthead and rail sit outside #hbmain) and
 *          <ordinal> counts text nodes inside that container, in document
 *          order, from 01. Ordinals are stable because the markup is frozen.
 *
 *   i18n — the inside of an element marked data-i18n. Those strings already
 *          live in messages/*.json under their own key; this is the same
 *          substitution the browser used to do after mount, done at build
 *          time so a crawler sees it.
 *
 *   attr — reader-facing title, placeholder and aria-label values. These are
 *          part of the handbook table too: leaving them in English makes a
 *          visually translated page English again for a screen-reader user.
 *
 * @typedef {object} Segment
 * @property {"body"|"i18n"|"attr"} kind
 * @property {string} key    key in the relevant dictionary
 * @property {string} text   the English source, entities decoded
 * @property {number} start  offset of the first byte this key owns
 * @property {number} end    offset just past the last byte this key owns
 */

/** Elements that never have a closing tag, so never open a scope. */
const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

/** Elements whose contents are not markup and are never translated. */
const RAW = new Set(["script", "style", "textarea"]);

/** The handbook uses none of these today; decoding stays honest anyway. */
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0" };

/** Keys are dot-separated, so an id with a dot in it would split the key. */
const SAFE_ID = /^[A-Za-z0-9_-]+$/;
const TRANSLATABLE_ATTRS = new Set(["aria-label", "placeholder", "title"]);

/**
 * Turn HTML source text into the string a reader sees.
 *
 * Unknown named entities throw rather than passing through: silently shipping
 * `&hellip;` into a translator's file would come back as a literal `&hellip;`
 * on the page, and it is one line to add it here instead.
 *
 * @param {string} s
 * @param {number} at offset in the document, for the error message
 * @returns {string}
 */
export function decodeText(s, at = 0) {
  if (!s.includes("&")) return s;
  return s.replace(/&(#[Xx][0-9A-Fa-f]+|#[0-9]+|[A-Za-z][A-Za-z0-9]*);/g, (whole, body) => {
    if (body[0] === "#") {
      const hex = body[1] === "x" || body[1] === "X";
      const cp = parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10);
      if (!Number.isInteger(cp) || cp < 0 || cp > 0x10ffff) {
        throw new Error(`segments: bad character reference ${whole} at offset ${at}`);
      }
      return String.fromCodePoint(cp);
    }
    const c = NAMED[body];
    if (c === undefined) {
      throw new Error(
        `segments: unknown HTML entity ${whole} at offset ${at} — add it to NAMED in lib/handbook/segments.mjs`,
      );
    }
    return c;
  });
}

/**
 * Make a translated string safe to splice back into the markup.
 *
 * A translator writing `R&D` or `a < b` cannot break the document, and cannot
 * inject an element that `behaviour.ts` would then trip over.
 *
 * @param {string} s
 * @returns {string}
 */
export function escapeText(s) {
  return String(s).replace(/[&<>]/g, (c) => (c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"));
}

/** Attribute values keep the source tag's quotes, so escape both quote kinds
 *  as well as the text-node characters. */
export function escapeAttribute(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

/** Text worth translating: something is there, and some of it is a letter. */
function translatable(s) {
  return /\p{L}/u.test(s);
}

/**
 * Read one start tag.
 *
 * @param {string} html
 * @param {number} lt offset of the "<"
 * @returns {{name: string, id: string|null, i18n: string|null, attrs: Array<{name: string, value: string, start: number, end: number}>, end: number, selfClosing: boolean}}
 */
function readTag(html, lt) {
  const m = /^<([A-Za-z][^\s/>]*)/.exec(html.slice(lt, lt + 64));
  if (!m) throw new Error(`segments: malformed tag at offset ${lt}`);
  const name = m[1].toLowerCase();
  let i = lt + m[0].length;
  let id = null;
  let i18n = null;
  const attrs = [];
  let selfClosing = false;

  for (;;) {
    while (i < html.length && /\s/.test(html[i])) i++;
    if (i >= html.length) throw new Error(`segments: unterminated tag <${name}> at offset ${lt}`);
    if (html[i] === ">") { i++; break; }
    if (html[i] === "/" && html[i + 1] === ">") { selfClosing = true; i += 2; break; }

    const nameStart = i;
    while (i < html.length && !/[\s=/>]/.test(html[i])) i++;
    const attr = html.slice(nameStart, i).toLowerCase();
    while (i < html.length && /\s/.test(html[i])) i++;

    let value = "";
    let valueStart = i;
    let valueEnd = i;
    if (html[i] === "=") {
      i++;
      while (i < html.length && /\s/.test(html[i])) i++;
      const q = html[i];
      if (q === '"' || q === "'") {
        const close = html.indexOf(q, i + 1);
        if (close === -1) throw new Error(`segments: unterminated attribute ${attr} at offset ${i}`);
        valueStart = i + 1;
        valueEnd = close;
        value = html.slice(i + 1, close);
        i = close + 1;
      } else {
        const vs = i;
        while (i < html.length && !/[\s>]/.test(html[i])) i++;
        valueStart = vs;
        valueEnd = i;
        value = html.slice(vs, i);
      }
    }
    attrs.push({ name: attr, value, start: valueStart, end: valueEnd });
    if (attr === "id") id = value.trim() || null;
    else if (attr === "data-i18n") i18n = value.trim() || null;
  }
  return { name, id, i18n, attrs, end: i, selfClosing };
}

/**
 * Walk the markup and return every run a translation may replace.
 *
 * Ascending, non-overlapping, in document order — the caller may splice from
 * the front with a single cursor.
 *
 * @param {string} html
 * @returns {Segment[]}
 */
export function walkHandbook(html) {
  /** @type {Segment[]} */
  const segments = [];
  /** @type {{name: string, id: string|null, i18n: {key: string, start: number}|null}[]} */
  const stack = [];
  /** @type {Map<string, number>} */
  const counts = new Map();
  const seen = new Set();
  let i18nDepth = 0;
  let i = 0;

  const container = () => {
    for (let s = stack.length - 1; s >= 0; s--) if (stack[s].id) return stack[s].id;
    return "doc";
  };

  const takeText = (start, end) => {
    if (i18nDepth > 0) return;              // owned by messages/*.json
    const raw = html.slice(start, end);
    const lead = raw.length - raw.trimStart().length;
    const core = raw.trim();
    if (!core) return;
    const text = decodeText(core, start + lead);
    if (!translatable(text)) return;        // "00", "·", "→", bare numbers
    const id = container();
    if (!SAFE_ID.test(id)) {
      throw new Error(`segments: id "${id}" cannot be part of a dotted key`);
    }
    const ordinal = (counts.get(id) ?? 0) + 1;
    counts.set(id, ordinal);
    const key = `hb.body.${id}.${String(ordinal).padStart(2, "0")}`;
    if (seen.has(key)) throw new Error(`segments: duplicate key ${key} — is an id repeated?`);
    seen.add(key);
    segments.push({ kind: "body", key, text, start: start + lead, end: start + lead + core.length });
  };

  const takeAttributes = (tag) => {
    const owner = tag.id ?? container();
    if (!SAFE_ID.test(owner)) {
      throw new Error(`segments: id "${owner}" cannot be part of a dotted key`);
    }
    for (const attr of tag.attrs) {
      if (!TRANSLATABLE_ATTRS.has(attr.name) || !translatable(decodeText(attr.value, attr.start))) continue;
      const bucket = `attr:${owner}:${attr.name}`;
      const ordinal = (counts.get(bucket) ?? 0) + 1;
      counts.set(bucket, ordinal);
      const key = `hb.attr.${owner}.${attr.name}.${String(ordinal).padStart(2, "0")}`;
      if (seen.has(key)) throw new Error(`segments: duplicate key ${key}`);
      seen.add(key);
      segments.push({
        kind: "attr",
        key,
        text: decodeText(attr.value, attr.start),
        start: attr.start,
        end: attr.end,
      });
    }
  };

  while (i < html.length) {
    const lt = html.indexOf("<", i);
    if (lt === -1) { takeText(i, html.length); break; }
    if (lt > i) takeText(i, lt);

    if (html.startsWith("<!--", lt)) {
      const end = html.indexOf("-->", lt + 4);
      if (end === -1) throw new Error(`segments: unterminated comment at offset ${lt}`);
      i = end + 3;
      continue;
    }
    if (html.startsWith("<!", lt) || html.startsWith("<?", lt)) {
      const end = html.indexOf(">", lt);
      if (end === -1) throw new Error(`segments: unterminated declaration at offset ${lt}`);
      i = end + 1;
      continue;
    }
    if (html.startsWith("</", lt)) {
      const end = html.indexOf(">", lt);
      if (end === -1) throw new Error(`segments: unterminated end tag at offset ${lt}`);
      const name = html.slice(lt + 2, end).trim().toLowerCase();
      const at = stack.map((f) => f.name).lastIndexOf(name);
      if (at === -1) throw new Error(`segments: </${name}> at offset ${lt} closes nothing`);
      if (at !== stack.length - 1) {
        throw new Error(
          `segments: </${name}> at offset ${lt} leaves <${stack[stack.length - 1].name}> unclosed`,
        );
      }
      const frame = stack.pop();
      if (frame.i18n) {
        i18nDepth--;
        segments.push({
          kind: "i18n",
          key: frame.i18n.key,
          text: decodeText(html.slice(frame.i18n.start, lt), frame.i18n.start),
          start: frame.i18n.start,
          end: lt,
        });
      }
      i = end + 1;
      continue;
    }

    const tag = readTag(html, lt);
    takeAttributes(tag);
    if (RAW.has(tag.name) && !tag.selfClosing) {
      const close = html.toLowerCase().indexOf(`</${tag.name}`, tag.end);
      if (close === -1) throw new Error(`segments: unterminated <${tag.name}> at offset ${lt}`);
      const gt = html.indexOf(">", close);
      i = gt + 1;
      continue;
    }
    if (VOID.has(tag.name) || tag.selfClosing) {
      if (tag.i18n) {
        throw new Error(`segments: data-i18n on empty element <${tag.name}> at offset ${lt}`);
      }
      i = tag.end;
      continue;
    }
    if (tag.i18n) i18nDepth++;
    stack.push({
      name: tag.name,
      id: tag.id,
      i18n: tag.i18n ? { key: tag.i18n, start: tag.end } : null,
    });
    i = tag.end;
  }

  if (stack.length) {
    throw new Error(`segments: ${stack.map((f) => `<${f.name}>`).join("")} never closed`);
  }
  return segments.sort((a, b) => a.start - b.start);
}
