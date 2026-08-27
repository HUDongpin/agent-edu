#!/usr/bin/env node

import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { assertReleaseArtifactsCurrent } from "./sync-course-public-surface.mjs";

const SITE = "https://aicourse.top";
const MAX_SHARD_BYTES = 500 * 1024;
const LAST_MODIFIED = "2026-08-26";

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function localizedUrl(locale, route) {
  const normalized = route.replace(/^\/+|\/+$/g, "");
  return normalized ? `${SITE}/${locale}/${normalized}/` : `${SITE}/${locale}/`;
}

function urlset(entries) {
  const rows = entries.map(({ loc, alternates, primaryLocale }) => {
    const links = [
      ...alternates.map(({ locale, href }) =>
        `    <xhtml:link rel="alternate" hreflang="${escapeXml(locale)}" href="${escapeXml(href)}" />`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(
        alternates.find((entry) => entry.locale === primaryLocale)?.href ?? loc,
      )}" />`,
    ].join("\n");
    return [
      "  <url>",
      `    <loc>${escapeXml(loc)}</loc>`,
      `    <lastmod>${LAST_MODIFIED}</lastmod>`,
      links,
      "  </url>",
    ].join("\n");
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n`
    + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" `
    + `xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows}\n</urlset>\n`;
}

function sitemapIndex(names) {
  const rows = names.map((name) => [
    "  <sitemap>",
    `    <loc>${SITE}/sitemaps/${escapeXml(name)}</loc>`,
    `    <lastmod>${LAST_MODIFIED}</lastmod>`,
    "  </sitemap>",
  ].join("\n")).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n`
    + `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</sitemapindex>\n`;
}

function routeEntries(locales, routes, targetLocale, primaryLocale) {
  return routes.map((route) => ({
    loc: localizedUrl(targetLocale, route),
    primaryLocale,
    alternates: locales.map((locale) => ({ locale, href: localizedUrl(locale, route) })),
  }));
}

export function expectedSitemapUrlCount(contract) {
  if (contract?.schemaVersion !== 3) {
    throw new Error("course release surface schemaVersion must be 3");
  }
  const coreCount = contract.core.contentLocales.length * contract.core.routes.length;
  const publishedCourseCount = contract.courses
    .filter((course) => course.state === "published")
    .reduce(
      (sum, course) => sum + course.contentLocales.length * course.routes.length,
      0,
    );
  return coreCount + publishedCourseCount;
}

export function generateSitemaps(options = {}) {
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const out = join(projectRoot, "out");
  if (!existsSync(out)) throw new Error("out/ is missing; run next build first");
  const { releaseSurface: contract } = assertReleaseArtifactsCurrent({ projectRoot });
  const shardRoot = join(out, "sitemaps");
  rmSync(shardRoot, { recursive: true, force: true });
  mkdirSync(shardRoot, { recursive: true });

  const shards = [];
  const writeShard = (name, entries) => {
    const body = urlset(entries);
    const bytes = Buffer.byteLength(body);
    if (bytes > MAX_SHARD_BYTES) {
      throw new Error(`${name} is ${bytes} bytes; maximum is ${MAX_SHARD_BYTES}`);
    }
    writeFileSync(join(shardRoot, name), body);
    shards.push({ name, urlCount: entries.length, bytes });
  };

  for (const locale of contract.core.contentLocales) {
    writeShard(
      `core-${locale}.xml`,
      routeEntries(
        contract.core.contentLocales,
        contract.core.routes,
        locale,
        contract.core.contentLocales[0],
      ),
    );
  }
  for (const course of contract.courses.filter((record) => record.state === "published")) {
    for (const locale of course.contentLocales) {
      writeShard(
        `course-${course.id}-${locale}.xml`,
        routeEntries(course.contentLocales, course.routes, locale, course.primaryLocale),
      );
    }
  }

  const index = sitemapIndex(shards.map((shard) => shard.name));
  if (Buffer.byteLength(index) > MAX_SHARD_BYTES) {
    throw new Error(`sitemap index exceeds ${MAX_SHARD_BYTES} bytes`);
  }
  writeFileSync(join(out, "sitemap.xml"), index);

  const urlCount = shards.reduce((sum, shard) => sum + shard.urlCount, 0);
  const expectedUrlCount = expectedSitemapUrlCount(contract);
  if (urlCount !== expectedUrlCount) {
    throw new Error(
      `registry requires ${expectedUrlCount} URLs; generated ${urlCount}`,
    );
  }
  console.log(
    `sitemaps: ${shards.length} shards, ${urlCount} canonical URLs, `
    + `${Math.max(...shards.map((shard) => shard.bytes))} byte largest shard`,
  );
  return { shards, urlCount, expectedUrlCount, indexBytes: Buffer.byteLength(index) };
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  try {
    generateSitemaps();
  } catch (error) {
    console.error(`sitemaps: FAIL — ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
