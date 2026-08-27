const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
  "meta", "param", "source", "track", "wbr",
]);

const BLOCK_ELEMENTS = new Set([
  "address", "article", "aside", "blockquote", "br", "dd", "details",
  "dialog", "div", "dl", "dt", "fieldset", "figcaption", "figure",
  "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header",
  "hr", "li", "main", "nav", "ol", "p", "pre", "section", "summary",
  "table", "tbody", "td", "tfoot", "th", "thead", "tr", "ul",
]);

const ENGLISH_MARKERS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "been", "before", "between",
  "but", "by", "can", "do", "does", "for", "from", "get", "has", "have",
  "how", "if", "in", "into", "is", "it", "its", "not", "of", "on", "or",
  "our", "should", "that", "the", "their", "then", "this", "through", "to",
  "use", "using", "was", "we", "what", "when", "where", "which", "with",
  "without", "you", "your",
]);

const TARGET_MARKERS = {
  de: new Set([
    "als", "am", "auf", "aus", "bei", "das", "dem", "den", "der", "des",
    "die", "durch", "ein", "eine", "einem", "einen", "einer", "für", "im",
    "in", "ist", "mit", "nicht", "oder", "sie", "sind", "und", "von", "vor",
    "was", "wenn", "wie", "wir", "zu", "zum", "zur",
  ]),
  es: new Set([
    "al", "como", "con", "de", "del", "el", "en", "es", "esta", "este",
    "la", "las", "los", "no", "o", "para", "por", "que", "se", "sin",
    "son", "su", "sus", "tu", "tus", "un", "una", "unos", "unas", "y",
  ]),
  fr: new Set([
    "au", "aux", "avec", "ce", "ces", "comme", "dans", "de", "des", "du",
    "en", "est", "et", "la", "le", "les", "ne", "ou", "par", "pas", "pour",
    "que", "qui", "sans", "se", "son", "sont", "sur", "un", "une", "votre",
  ]),
};

function tagName(tag) {
  return /^<\/?\s*([A-Za-z][\w:-]*)/.exec(tag)?.[1]?.toLowerCase() ?? "";
}

function explicitLanguage(tag) {
  const value = /\blang\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
  return (value?.[1] ?? value?.[2] ?? "").trim().toLowerCase();
}

/**
 * Remove subtrees whose author explicitly declared a different content
 * language. The scanner is linear and deliberately understands only the HTML
 * structure needed by the static-export audit; malformed markup is left
 * visible unless it is already inside a declared-language subtree.
 */
export function stripExplicitLanguageSubtrees(markup, language = "en") {
  const wanted = language.toLowerCase();
  const stack = [];
  const tokenPattern = /<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>/g;
  let cursor = 0;
  let result = "";

  for (const match of markup.matchAll(tokenPattern)) {
    const token = match[0];
    const index = match.index ?? cursor;
    const suppressed = stack.some((entry) => entry.suppressed);
    if (!suppressed) result += markup.slice(cursor, index);

    if (token.startsWith("<!--")) {
      cursor = index + token.length;
      continue;
    }

    const name = tagName(token);
    const closing = /^<\//.test(token);
    const selfClosing = /\/\s*>$/.test(token) || VOID_ELEMENTS.has(name);

    if (closing) {
      const closingWasSuppressed = suppressed;
      let found = -1;
      for (let position = stack.length - 1; position >= 0; position -= 1) {
        if (stack[position].name === name) {
          found = position;
          break;
        }
      }
      if (found >= 0) stack.splice(found);
      if (!closingWasSuppressed) result += token;
    } else {
      const declared = explicitLanguage(token);
      const declaresWanted = declared === wanted || declared.startsWith(`${wanted}-`);
      const entrySuppressed = suppressed || declaresWanted;
      if (!entrySuppressed) result += token;
      if (!selfClosing) stack.push({ name, suppressed: entrySuppressed });
    }

    cursor = index + token.length;
  }

  if (!stack.some((entry) => entry.suppressed)) result += markup.slice(cursor);
  return result;
}

function decodeHtmlText(value) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function visibleChunks(markup) {
  const withoutDeclaredEnglish = stripExplicitLanguageSubtrees(markup, "en");
  const withBoundaries = withoutDeclaredEnglish.replace(/<\/?([A-Za-z][\w:-]*)\b[^>]*>/g, (tag, name) => (
    BLOCK_ELEMENTS.has(String(name).toLowerCase()) ? "\n" : " "
  ));
  return decodeHtmlText(withBoundaries)
    .split(/[\n\r]+|(?<=[.!?;:。！？；：])\s+/u)
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function latinWords(value) {
  return value.toLocaleLowerCase("en").match(/\p{Script=Latin}[\p{Script=Latin}\p{M}'’]*(?:-\p{Script=Latin}[\p{Script=Latin}\p{M}'’]*)*/gu) ?? [];
}

function markerScore(words, markers) {
  return words.reduce((score, word) => score + (markers.has(word.replace(/[’']/g, "")) ? 1 : 0), 0);
}

export function classifyLatinLanguage(value, locale) {
  const words = latinWords(value);
  const englishScore = markerScore(words, ENGLISH_MARKERS);
  const targetMarkers = TARGET_MARKERS[locale];
  const targetScore = targetMarkers ? markerScore(words, targetMarkers) : 0;

  if (targetMarkers && targetScore >= 2 && targetScore >= englishScore) {
    return { classification: "target", words: words.length, englishScore, targetScore };
  }
  if (englishScore >= 2 && englishScore >= targetScore + 2) {
    return { classification: "english", words: words.length, englishScore, targetScore };
  }
  return { classification: "ambiguous", words: words.length, englishScore, targetScore };
}

/**
 * Return only long Latin-script runs. For German, Spanish, and French, a run
 * must contain stronger English than target-language evidence to be called an
 * English leak. Ambiguous runs remain separately reviewable; they are never
 * promoted to PASS by this heuristic.
 */
export function renderedLanguageCandidates(markup, locale, limit = 5) {
  const english = [];
  const ambiguous = [];
  const runPattern = /(?:\p{Script=Latin}[\p{Script=Latin}\p{M}'’]*(?:-\p{Script=Latin}[\p{Script=Latin}\p{M}'’]*)*(?:[\s,.:;!?()[\]{}“”"'’—–/+·-]+|$)){6,}/gu;

  for (const chunk of visibleChunks(markup)) {
    for (const match of chunk.matchAll(runPattern)) {
      const excerpt = match[0].replace(/\s+/g, " ").trim();
      const classification = classifyLatinLanguage(excerpt, locale);
      if (classification.words < 6) continue;

      if (TARGET_MARKERS[locale]) {
        if (classification.classification === "english" && english.length < limit) {
          english.push({ excerpt, ...classification });
        } else if (classification.classification === "ambiguous" && ambiguous.length < limit) {
          ambiguous.push({ excerpt, ...classification });
        }
      } else if ((classification.englishScore >= 2 || classification.words >= 8) && english.length < limit) {
        english.push({ excerpt, ...classification, classification: "english" });
      } else if (ambiguous.length < limit) {
        ambiguous.push({ excerpt, ...classification });
      }
    }
  }

  return { english, ambiguous };
}
