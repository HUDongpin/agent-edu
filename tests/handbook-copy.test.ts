import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  makeCopy,
  trustedMarkup,
  type TrustedMarkup,
} from "../lib/handbook/copy";

test("C.h escapes every ordinary interpolation before it reaches innerHTML", () => {
  const C = makeCopy("en", {
    message: "Hello, **{name}** — {detail}",
  });
  const payload = '<img src=x onerror="globalThis.pwned=1"> & \'owned\'';

  const html = C.h("message", { name: payload, detail: payload });

  assert.equal(
    html,
    "Hello, <strong>&lt;img src=x onerror=&quot;globalThis.pwned=1&quot;&gt; &amp; &#39;owned&#39;</strong>" +
      " — &lt;img src=x onerror=&quot;globalThis.pwned=1&quot;&gt; &amp; &#39;owned&#39;",
  );
  assert.doesNotMatch(html, /<img\b/i);
});

test("ordinary strings cannot opt out of C.h escaping", () => {
  const C = makeCopy("en", { message: "Use {code}" });

  assert.equal(C.h("message", { code: "<code>if</code>" }), "Use &lt;code&gt;if&lt;/code&gt;");
  assert.equal(C.t("message", { code: "<code>if</code>" }), "Use <code>if</code>");
});

test("explicit constant code and internal-link markup remains intact", () => {
  const C = makeCopy("en", {
    code: "Use {code}",
    link: "Continue to {link}.",
  });
  const unsafeTranslatedLabel = '<img src=x onerror="alert(1)"> Part 3';

  assert.equal(
    C.h("code", { code: trustedMarkup`<code>expect(x).toBe(y)</code>` }),
    "Use <code>expect(x).toBe(y)</code>",
  );
  assert.equal(
    C.h("link", {
      link: trustedMarkup`<a href="../build/">${unsafeTranslatedLabel}</a>`,
    }),
    "Continue to <a href=\"../build/\">&lt;img src=x onerror=&quot;alert(1)&quot;&gt; Part 3</a>.",
  );
});

test("trustedMarkup is a template-only, element-text-only escape hatch", () => {
  const callAsFunction = trustedMarkup as unknown as (value: string) => TrustedMarkup;

  assert.throws(
    () => callAsFunction("<img src=x onerror=alert(1)>"),
    /must be used as a template tag/,
  );
  assert.throws(
    () => trustedMarkup`<a href="${"javascript:alert(1)"}">unsafe</a>`,
    /unsupported trusted markup template/,
  );
  assert.throws(
    () => trustedMarkup`<img src=x onerror="alert(1)">`,
    /unsupported trusted markup template/,
  );
});


const WIDGET_LOCALES = ["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"] as const;
const widgetMessages = (locale: string): Record<string, string> =>
  JSON.parse(readFileSync(`messages/widgets/${locale}.json`, "utf8"));
const widgetSafeRead = (locale: string): Record<string, string> =>
  JSON.parse(readFileSync(`messages/handbook/${locale}.json`, "utf8"));

test("the security widget stops presenting the label as a general defence", () => {
  /* The widget decides the outcome from the label alone, so a verdict phrased as
     an unconditional success taught that labelling untrusted text makes you
     immune — three paragraphs below prose saying no prompt reliably prevents
     this. The copy now credits the attack it actually stopped. */
  const english = widgetMessages("en")["w.security.verdict.handled"];
  assert.doesNotMatch(english, /Handled correctly/);
  assert.match(english, /not every attack/);

  for (const locale of WIDGET_LOCALES) {
    const verdict = widgetMessages(locale)["w.security.verdict.handled"];
    assert.ok(verdict && verdict.includes("✅"), `${locale}: verdict must still read as a pass`);
    if (locale !== "en") {
      assert.notEqual(verdict, english, `${locale}: verdict was left in English`);
    }
  }
});

test("reader-facing attributes are extractable, and translated in every locale", async () => {
  /* segments.mjs captured only `id` and `data-i18n` from a tag, so no attribute
     value was ever extractable. Seventeen diagram descriptions stayed English in
     all nine locales while the gate reported 542 of 542 — it was counting the
     strings that had keys, and these had none. A blind Arabic reader got an
     Arabic page whose every illustration was described in English. */
  const { walkHandbook } = await import("../lib/handbook/segments.mjs");
  const markup = (await import("../lib/handbook/markup")).default;

  const attrs = walkHandbook(markup).filter((s: { kind: string }) => s.kind === "attr");
  assert.ok(attrs.length >= 26, `expected the attribute segments, got ${attrs.length}`);
  // The diagram descriptions are the point: long, and read aloud in place of a picture.
  assert.ok(
    attrs.filter((s: { text: string }) => s.text.length > 120).length >= 17,
    "the long diagram descriptions must be among them",
  );

  const en = widgetSafeRead("en");
  for (const locale of WIDGET_LOCALES) {
    const table = widgetSafeRead(locale);
    for (const seg of attrs) {
      const value = table[seg.key];
      assert.ok(value, `${locale}: ${seg.key} is missing`);
      if (locale !== "en" && seg.text.length > 120) {
        assert.notEqual(value, en[seg.key], `${locale}: ${seg.key} was left in English`);
      }
    }
  }
});

test("a translated attribute cannot break the tag it sits in", async () => {
  /* escapeText leaves a quote alone, which is right between tags and fatal
     inside one: a value carrying " would close the attribute and spill the rest
     of the sentence into the tag as garbage attributes. */
  const { escapeAttr } = await import("../lib/handbook/segments.mjs");
  assert.equal(escapeAttr('say "hi" & <go>'), "say &quot;hi&quot; &amp; &lt;go&gt;");
  assert.doesNotMatch(escapeAttr('a " b'), /(?<!&quot;)"/);
});

test("the Handbook hands forward from every section, without touching the frozen markup", async () => {
  /* The frozen markup carries exactly one link to the Lab and one to Part 3
     across all eleven sections, and both sit in §09 — one section before §10,
     which is where the record calls the Handbook finished and which offered no
     way forward at all. The offer arrived before the ending and was never
     repeated. */
  const markup = (await import("../lib/handbook/markup")).default;
  const forward = (path: string) => (markup.match(new RegExp(path, "g")) ?? []).length;
  assert.equal(forward("\\.\\./lab/"), 1, "the markup still hands forward exactly once");
  assert.equal(forward("\\.\\./build/"), 1);

  /* So the repeat lives in the wrapper React owns, outside every ported file. */
  const wrapper = readFileSync("components/handbook/Handbook.tsx", "utf8");
  assert.match(wrapper, /<Next \/>/);
  const band = readFileSync("components/handbook/Next.tsx", "utf8");
  assert.match(band, /\/lab\/`/);
  assert.match(band, /\/build\/`/);
  // Reuses the track calls rather than minting new ones.
  assert.match(band, /t\("track\.2\.cta"\)/);
  assert.match(band, /t\("track\.3\.cta"\)/);
  // Server and first visit get the quieter line, so nothing depends on script.
  assert.match(band, /readLearningStateOnServer/);
  assert.match(band, /finished \? t\("handbook\.nextDone"\) : t\("handbook\.nextLede"\)/);

  const site = (locale: string): Record<string, string> =>
    JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));
  for (const locale of WIDGET_LOCALES) {
    for (const key of ["handbook.nextLabel", "handbook.nextLede", "handbook.nextDone"]) {
      assert.ok(site(locale)[key]?.trim(), `${locale}: ${key} missing`);
    }
  }
});
