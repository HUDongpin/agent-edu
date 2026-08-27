import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { assertReleaseArtifactsCurrent } from "./sync-course-public-surface.mjs";

const PROJECT = resolve(process.cwd());
const MANIFEST_PATH = join(PROJECT, "config", "route-manifest.json");
const PRERENDER_PATH = join(PROJECT, ".next", "prerender-manifest.json");
const OUT = join(PROJECT, "out");
const SITE_ORIGIN = "https://aicourse.top";
const SITEMAP_SHARD_LIMIT = 500 * 1024;

function sortedUnique(values, label) {
  const sorted = [...values].sort();
  const duplicates = sorted.filter((value, index) => value === sorted[index - 1]);
  if (duplicates.length) {
    throw new Error(label + " contains duplicate entries: " + [...new Set(duplicates)].join(", "));
  }
  return sorted;
}

function localizedRoute(locale, page) {
  return "/" + locale + (page ? "/" + page.replace(/\/$/, "") : "");
}

function canonicalUrl(route) {
  return SITE_ORIGIN + (route === "/" ? "/" : route.replace(/\/$/, "") + "/");
}

function seoContracts(releaseSurface) {
  const contracts = new Map();
  const addRoutes = ({ contentLocales, primaryLocale, routes, courseId = null }) => {
    for (const locale of contentLocales) {
      for (const page of routes) {
        const route = localizedRoute(locale, page);
        if (contracts.has(route)) throw new Error("duplicate SEO route contract: " + route);
        contracts.set(route, {
          route,
          page,
          locale,
          contentLocales,
          primaryLocale,
          courseId,
        });
      }
    }
  };

  const corePrimaryLocale = releaseSurface.siteLocales?.includes("en")
    ? "en"
    : releaseSurface.core.contentLocales[0];
  addRoutes({
    contentLocales: releaseSurface.core.contentLocales,
    primaryLocale: corePrimaryLocale,
    routes: releaseSurface.core.routes,
  });
  for (const course of releaseSurface.courses.filter((item) => item.state === "published")) {
    addRoutes({
      contentLocales: course.contentLocales,
      primaryLocale: course.primaryLocale,
      routes: course.routes,
      courseId: course.id,
    });
  }
  return contracts;
}

export function expandManifest(manifest, releaseSurface) {
  if (manifest?.version !== 2) throw new Error("route manifest version must be 2");
  if (releaseSurface?.schemaVersion !== 3) {
    throw new Error("course release surface schemaVersion must be 3");
  }

  const localized = [
    ...releaseSurface.core.contentLocales.flatMap((locale) =>
      releaseSurface.core.routes.map((page) => localizedRoute(locale, page)),
    ),
    ...releaseSurface.courses
      .filter((course) => course.state === "published")
      .flatMap((course) =>
        course.contentLocales.flatMap((locale) =>
          course.routes.map((page) => localizedRoute(locale, page)),
        ),
      ),
  ];
  return {
    prerenderRoutes: sortedUnique(
      [...manifest.staticRoutes, ...localized, ...manifest.internalRoutes],
      "prerender route list",
    ),
    publicRoutes: sortedUnique([...manifest.staticRoutes, ...localized], "public route list"),
    requiredArtifacts: sortedUnique(manifest.requiredArtifacts, "required artifact list"),
    requiredArtifactText: manifest.requiredArtifactText ?? {},
  };
}

export function diffSets(expected, actual) {
  const wanted = new Set(expected);
  const found = new Set(actual);
  return {
    missing: expected.filter((item) => !found.has(item)),
    extra: actual.filter((item) => !wanted.has(item)),
  };
}

function artifactFor(route) {
  if (route === "/") return "out/index.html";
  if (route.endsWith(".txt") || route.endsWith(".xml")) return "out" + route;
  return "out" + route + "/index.html";
}

function routeArtifacts(dir, requiredArtifacts = []) {
  const found = [];
  const required = new Set(requiredArtifacts);
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "_next") walk(full);
        continue;
      }
      const rel = relative(PROJECT, full).split(sep).join("/");
      if (
        entry.name === "index.html" ||
        rel === "out/404.html" ||
        rel === "out/robots.txt" ||
        rel === "out/sitemap.xml" ||
        required.has(rel)
      ) {
        found.push(rel);
      }
    }
  };
  walk(dir);
  return sortedUnique(found, "built route artifact list");
}

function failDiff(label, diff, source = "config/route-manifest.json") {
  if (!diff.missing.length && !diff.extra.length) return;
  const lines = [label + " does not match " + source + "."];
  if (diff.missing.length) lines.push("Missing: " + diff.missing.join(", "));
  if (diff.extra.length) lines.push("Unexpected: " + diff.extra.join(", "));
  throw new Error(lines.join("\n"));
}

function decodeXml(value) {
  return value.replace(
    /&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi,
    (entity) => {
      const named = entity.toLowerCase();
      if (named === "&amp;") return "&";
      if (named === "&lt;") return "<";
      if (named === "&gt;") return ">";
      if (named === "&quot;") return '"';
      if (named === "&apos;") return "'";
      const hex = /^&#x([\da-f]+);$/i.exec(entity);
      if (hex) return String.fromCodePoint(Number.parseInt(hex[1], 16));
      const decimal = /^&#(\d+);$/.exec(entity);
      return decimal ? String.fromCodePoint(Number.parseInt(decimal[1], 10)) : entity;
    },
  );
}

function xmlLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)]
    .map((match) => decodeXml(match[1].trim()));
}

function xmlUrlEntries(xml, shardLabel) {
  return [...xml.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/gi)].map((match, index) => {
    const body = match[1];
    const locs = xmlLocs(body);
    if (locs.length !== 1) {
      throw new Error(
        shardLabel + " url entry " + (index + 1) + " must contain exactly one <loc>; found " +
        locs.length,
      );
    }
    const alternates = [];
    for (const link of body.matchAll(/<(?:[A-Za-z0-9_-]+:)?link\b[^>]*>/gi)) {
      const attributes = elementAttributes(link[0]);
      if (!(attributes.rel ?? "").toLowerCase().split(/\s+/).includes("alternate")) continue;
      if (!attributes.hreflang || !attributes.href) {
        throw new Error(
          shardLabel + " url entry " + (index + 1) +
          " contains an alternate without hreflang and href",
        );
      }
      alternates.push({ hreflang: attributes.hreflang, href: attributes.href });
    }
    return { loc: locs[0], alternates };
  });
}

function expectedAlternateMap(contract) {
  const expected = new Map(
    contract.contentLocales.map((locale) => [
      locale,
      canonicalUrl(localizedRoute(locale, contract.page)),
    ]),
  );
  expected.set(
    "x-default",
    canonicalUrl(localizedRoute(contract.primaryLocale, contract.page)),
  );
  return expected;
}

export function assertAlternateContract(alternates, contract, label) {
  const actual = new Map();
  for (const alternate of alternates) {
    if (actual.has(alternate.hreflang)) {
      throw new Error(label + " contains duplicate hreflang=" + alternate.hreflang);
    }
    actual.set(alternate.hreflang, alternate.href);
  }
  const expected = expectedAlternateMap(contract);
  failDiff(
    label + " hreflang keys",
    diffSets([...expected.keys()].sort(), [...actual.keys()].sort()),
    "the registry-derived content locale contract",
  );
  for (const [locale, expectedUrl] of expected) {
    if (actual.get(locale) !== expectedUrl) {
      throw new Error(
        label + " hreflang=" + locale + " mismatch: expected " + expectedUrl +
        ", found " + String(actual.get(locale)),
      );
    }
  }
}

function sitemapShardPath(urlValue) {
  let url;
  try {
    url = new URL(urlValue);
  } catch {
    throw new Error("sitemap index contains an invalid URL: " + urlValue);
  }
  if (url.origin !== SITE_ORIGIN || url.search || url.hash) {
    throw new Error("sitemap shard URL must be a query-free " + SITE_ORIGIN + " URL: " + urlValue);
  }
  const match = url.pathname.match(/^\/sitemaps\/([A-Za-z0-9-]+\.xml)$/);
  if (!match) throw new Error("sitemap index contains an invalid shard path: " + urlValue);
  return join(OUT, "sitemaps", match[1]);
}

function auditSitemaps(contracts) {
  const indexPath = join(OUT, "sitemap.xml");
  const indexXml = readFileSync(indexPath, "utf8");
  if (!/<sitemapindex\b/.test(indexXml) || /<urlset\b/.test(indexXml)) {
    throw new Error("out/sitemap.xml must be a sitemap index");
  }

  const shardUrls = sortedUnique(xmlLocs(indexXml), "sitemap index shard URL list");
  if (!shardUrls.length) throw new Error("sitemap index does not reference any shards");
  const indexedShardPaths = shardUrls.map(sitemapShardPath);
  const actualShardPaths = readdirSync(join(OUT, "sitemaps"), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".xml"))
    .map((entry) => join(OUT, "sitemaps", entry.name))
    .sort();
  failDiff(
    "Sitemap index shards",
    diffSets(indexedShardPaths.slice().sort(), actualShardPaths),
    "out/sitemaps/",
  );

  const contractsByUrl = new Map(
    [...contracts.values()].map((contract) => [canonicalUrl(contract.route), contract]),
  );
  const publicUrls = [];
  for (const shardPath of indexedShardPaths) {
    const shardLabel = relative(PROJECT, shardPath).split(sep).join("/");
    const size = statSync(shardPath).size;
    if (size > SITEMAP_SHARD_LIMIT) {
      throw new Error(
        shardLabel + " is " + size + " bytes; sitemap shards must be <= " +
        SITEMAP_SHARD_LIMIT + " bytes (500 KiB)",
      );
    }
    const xml = readFileSync(shardPath, "utf8");
    if (!/<urlset\b/.test(xml) || /<sitemapindex\b/.test(xml)) {
      throw new Error(shardLabel + " must be a sitemap urlset shard");
    }
    const entries = xmlUrlEntries(xml, shardLabel);
    if (!entries.length) throw new Error(shardLabel + " contains no public URLs");
    for (const entry of entries) {
      const urlValue = entry.loc;
      let url;
      try {
        url = new URL(urlValue);
      } catch {
        throw new Error(shardLabel + " contains an invalid URL: " + urlValue);
      }
      if (url.origin !== SITE_ORIGIN || url.search || url.hash || !url.pathname.endsWith("/")) {
        throw new Error(
          shardLabel + " contains a non-canonical public URL: " + urlValue,
        );
      }
      const contract = contractsByUrl.get(urlValue);
      if (!contract) {
        throw new Error(shardLabel + " names a URL without a registry SEO contract: " + urlValue);
      }
      assertAlternateContract(
        entry.alternates,
        contract,
        shardLabel + " <url> " + urlValue,
      );
    }
    publicUrls.push(...entries.map((entry) => entry.loc));
  }

  const expectedUrls = [...contracts.keys()].map(canonicalUrl);
  failDiff(
    "Sitemap public URLs",
    diffSets(
      sortedUnique(expectedUrls, "expected sitemap URL list"),
      sortedUnique(publicUrls, "sitemap public URL list"),
    ),
    "registry-derived localized routes",
  );
  return { shardCount: shardUrls.length, urlCount: publicUrls.length };
}

function linkElements(html) {
  return [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => {
    const attributes = {};
    for (const attribute of match[0].matchAll(
      /([A-Za-z_:][A-Za-z0-9_:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g,
    )) {
      attributes[attribute[1].toLowerCase()] = attribute[2] ?? attribute[3] ?? "";
    }
    return attributes;
  });
}

function elementAttributes(tag) {
  const attributes = {};
  for (const attribute of tag.matchAll(
    /([A-Za-z_:][A-Za-z0-9_:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g,
  )) {
    attributes[attribute[1].toLowerCase()] = decodeXml(attribute[2] ?? attribute[3] ?? "");
  }
  return attributes;
}

export function internalPagePath(value) {
  if (!value || value.startsWith("#") || /^(?:mailto|tel|javascript):/i.test(value)) return null;
  let url;
  try {
    url = new URL(value, SITE_ORIGIN);
  } catch {
    throw new Error("public consumer contains an invalid URL: " + value);
  }
  if (url.origin !== SITE_ORIGIN) return null;
  if (/\.[A-Za-z0-9]{1,8}$/.test(url.pathname) || url.pathname.startsWith("/_next/")) return null;
  return url.pathname === "/" ? "/" : url.pathname.replace(/\/+$/, "");
}

function jsonLdBlocks(html, artifact) {
  const values = [];
  for (const match of html.matchAll(
    /<script\b[^>]*type=(?:"application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      values.push(JSON.parse(match[1]));
    } catch (error) {
      throw new Error(
        artifact + " contains invalid JSON-LD: " +
        (error instanceof Error ? error.message : String(error)),
      );
    }
  }
  return values;
}

export function collectJsonLdUrls(value, found = []) {
  if (!value || typeof value !== "object") return found;
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLdUrls(item, found);
    return found;
  }
  for (const [key, child] of Object.entries(value)) {
    if ((key === "url" || key === "@id" || key === "item") && typeof child === "string") {
      found.push(child);
    }
    else collectJsonLdUrls(child, found);
  }
  return found;
}

function expectedCourseDashboardPaths(releaseSurface, shellLocale) {
  return releaseSurface.courses
    .filter((course) => course.state === "published")
    .map((course) => localizedRoute(
      course.contentLocales.includes(shellLocale) ? shellLocale : course.primaryLocale,
      course.routes[0],
    ));
}

function blockedRoutePrefixes(releaseSurface) {
  return new Set(
    releaseSurface.courses
      .filter((course) => course.state === "blocked")
      .flatMap((course) => course.routes.map((route) => route.split("/")[0])),
  );
}

function isBlockedRoute(pathname, releaseSurface, prefixes = blockedRoutePrefixes(releaseSurface)) {
  const [locale, prefix] = pathname.split("/").filter(Boolean);
  return releaseSurface.siteLocales.includes(locale) && prefixes.has(prefix);
}

function assertAllowedFromLocale(value, releaseSurface, artifact) {
  const url = new URL(value, SITE_ORIGIN);
  if (url.origin !== SITE_ORIGIN || !url.searchParams.has("fromLocale")) return;
  const fromLocales = url.searchParams.getAll("fromLocale");
  if (fromLocales.length !== 1 || !releaseSurface.siteLocales.includes(fromLocales[0])) {
    throw new Error(
      artifact + " contains a fromLocale query outside the nine-locale allowlist: " + value,
    );
  }
}

function auditPublicConsumers(releaseSurface, publicRoutes) {
  const allowed = new Set(publicRoutes.map((route) =>
    route === "/" ? "/" : route.replace(/\/+$/, ""),
  ));
  const blockedPrefixes = blockedRoutePrefixes(releaseSurface);
  let checkedLinks = 0;

  for (const locale of releaseSurface.siteLocales) {
    const consumerRoutes = [localizedRoute(locale, ""), localizedRoute(locale, "courses/")];
    const expectedDashboards = expectedCourseDashboardPaths(releaseSurface, locale);
    for (const route of consumerRoutes) {
      const artifact = artifactFor(route);
      const html = readFileSync(join(PROJECT, artifact), "utf8");
      const hrefs = [...html.matchAll(/<a\b[^>]*>/gi)]
        .map((match) => elementAttributes(match[0]).href)
        .filter(Boolean);
      const linkedPages = new Set();
      for (const href of hrefs) {
        assertAllowedFromLocale(href, releaseSurface, artifact);
        const pathname = internalPagePath(href);
        if (!pathname) continue;
        checkedLinks += 1;
        linkedPages.add(pathname);
        if (!allowed.has(pathname)) {
          throw new Error(artifact + " links to an undeclared public route: " + href);
        }
        if (isBlockedRoute(pathname, releaseSurface, blockedPrefixes)) {
          throw new Error(artifact + " exposes blocked course route: " + href);
        }
      }
      const missingDashboards = expectedDashboards.filter((path) => !linkedPages.has(path));
      if (missingDashboards.length) {
        throw new Error(
          artifact + " does not expose every published course dashboard through its shared footer: " +
          missingDashboards.join(", "),
        );
      }
    }
  }
  return { checkedLinks };
}

function auditHtmlSeo(contracts, releaseSurface, publicRoutes) {
  const allowed = new Set(publicRoutes.map((route) =>
    route === "/" ? "/" : route.replace(/\/+$/, ""),
  ));
  const blockedPrefixes = blockedRoutePrefixes(releaseSurface);
  let checkedJsonLdUrls = 0;

  for (const contract of contracts.values()) {
    const artifact = join(PROJECT, artifactFor(contract.route));
    const html = readFileSync(artifact, "utf8");
    const links = linkElements(html);
    const canonicals = links.filter((link) =>
      (link.rel ?? "").toLowerCase().split(/\s+/).includes("canonical"),
    );
    if (canonicals.length !== 1) {
      throw new Error(
        artifactFor(contract.route) + " must contain exactly one canonical link; found " +
        canonicals.length,
      );
    }
    const expectedCanonical = canonicalUrl(contract.route);
    if (canonicals[0].href !== expectedCanonical) {
      throw new Error(
        artifactFor(contract.route) + " canonical mismatch: expected " + expectedCanonical +
        ", found " + String(canonicals[0].href),
      );
    }

    const alternates = links.filter((link) =>
      (link.rel ?? "").toLowerCase().split(/\s+/).includes("alternate") && link.hreflang,
    );
    const alternateMap = new Map();
    for (const alternate of alternates) {
      if (alternateMap.has(alternate.hreflang)) {
        throw new Error(
          artifactFor(contract.route) + " contains duplicate hreflang=" + alternate.hreflang,
        );
      }
      alternateMap.set(alternate.hreflang, alternate.href);
    }

    assertAlternateContract(
      [...alternateMap].map(([hreflang, href]) => ({ hreflang, href })),
      contract,
      artifactFor(contract.route),
    );

    for (const block of jsonLdBlocks(html, artifactFor(contract.route))) {
      for (const value of collectJsonLdUrls(block)) {
        const jsonLdUrl = new URL(value, SITE_ORIGIN);
        if (jsonLdUrl.origin === SITE_ORIGIN && jsonLdUrl.search) {
          throw new Error(
            artifactFor(contract.route) + " JSON-LD URL must ignore navigation queries: " + value,
          );
        }
        const pathname = internalPagePath(value);
        if (!pathname) continue;
        checkedJsonLdUrls += 1;
        if (!allowed.has(pathname)) {
          throw new Error(
            artifactFor(contract.route) + " JSON-LD names an undeclared public route: " + value,
          );
        }
        if (isBlockedRoute(pathname, releaseSurface, blockedPrefixes)) {
          throw new Error(
            artifactFor(contract.route) + " JSON-LD exposes blocked course route: " + value,
          );
        }
      }
    }
  }
  return { checkedJsonLdUrls };
}

export function checkRoutes() {
  const { releaseSurface } = assertReleaseArtifactsCurrent({ projectRoot: PROJECT });

  if (!existsSync(PRERENDER_PATH) || !existsSync(OUT)) {
    throw new Error("build output is missing; run npm run build before npm run routes:check");
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  if (manifest.releaseSurface !== "config/course-release-surface.json") {
    throw new Error(
      "route manifest releaseSurface must name the generated canonical projection",
    );
  }
  const expected = expandManifest(manifest, releaseSurface);
  const contracts = seoContracts(releaseSurface);
  if (contracts.size !== expected.publicRoutes.length - manifest.staticRoutes.length) {
    throw new Error(
      "SEO contract count does not match localized route count: " + contracts.size + " versus " +
      (expected.publicRoutes.length - manifest.staticRoutes.length),
    );
  }
  const prerender = JSON.parse(readFileSync(PRERENDER_PATH, "utf8"));
  const actualRoutes = sortedUnique(Object.keys(prerender.routes ?? {}), "Next prerender route list");
  failDiff("Next prerender routes", diffSets(expected.prerenderRoutes, actualRoutes));

  const expectedArtifacts = sortedUnique(
    [...expected.publicRoutes.map(artifactFor), ...expected.requiredArtifacts],
    "expected route artifact list",
  );
  failDiff("Static route artifacts", diffSets(expectedArtifacts, routeArtifacts(OUT, expected.requiredArtifacts)));

  for (const [artifact, markers] of Object.entries(expected.requiredArtifactText)) {
    if (!expectedArtifacts.includes(artifact)) {
      throw new Error("requiredArtifactText names an undeclared artifact: " + artifact);
    }
    const html = readFileSync(join(PROJECT, artifact), "utf8");
    const missing = markers.filter((marker) => !html.includes(marker));
    if (missing.length) {
      throw new Error(artifact + " is missing required recovery/handoff marker(s): " + missing.join(", "));
    }
  }

  const sitemap = auditSitemaps(contracts);
  const seo = auditHtmlSeo(contracts, releaseSurface, expected.publicRoutes);
  const consumers = auditPublicConsumers(releaseSurface, expected.publicRoutes);

  console.log(
    "routes: " + expected.publicRoutes.length + " public + " +
    manifest.internalRoutes.length + " internal = " + expected.prerenderRoutes.length + "; " +
    expectedArtifacts.length + " route artifacts; " + sitemap.urlCount + " sitemap URLs in " +
    sitemap.shardCount + " <=500 KiB shards; canonical/hreflang verified; " +
    consumers.checkedLinks + " home/catalog/footer links and " +
    seo.checkedJsonLdUrls + " JSON-LD URLs across every public contract closed over the registry",
  );
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  try {
    checkRoutes();
  } catch (error) {
    console.error("routes: FAIL — " + (error instanceof Error ? error.message : String(error)));
    process.exitCode = 1;
  }
}
