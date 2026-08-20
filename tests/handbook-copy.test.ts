import assert from "node:assert/strict";
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
