#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  assertAlternateContract,
  collectJsonLdUrls,
  diffSets,
  expandManifest,
  internalPagePath,
} from "./check-routes.mjs";
import { contentFindings } from "./check-secrets.mjs";
import { assertReleaseArtifactsCurrent } from "./sync-course-public-surface.mjs";

const SITE_ORIGIN = "https://aicourse.top";
const GIT_SHA = /^[0-9a-f]{40}$/;
const DEPLOYMENT_ID = /^dpl_[A-Za-z0-9]{8,124}$/;
const MAX_SITEMAP_BYTES = 500 * 1024;
const MAX_FAILURES = 250;
const DEFAULT_CONCURRENCY = 12;
const TRUSTED_OIDC_TOKEN = /^[A-Za-z0-9_-]{2,4096}\.[A-Za-z0-9_-]{2,4096}\.[A-Za-z0-9_-]{2,4096}$/;

function localizedPath(locale, route) {
  const page = route.replace(/^\/+|\/+$/g, "");
  return page ? `/${locale}/${page}/` : `/${locale}/`;
}

function requestPath(route) {
  if (route === "/" || /\.[A-Za-z0-9]{1,8}$/.test(route)) return route;
  return `${route.replace(/\/+$/, "")}/`;
}

function normalizedPagePath(value) {
  return value === "/" ? "/" : value.replace(/\/+$/, "");
}

function canonicalUrl(pathname) {
  return `${SITE_ORIGIN}${requestPath(pathname)}`;
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function seoContracts(releaseSurface) {
  const contracts = new Map();
  const add = ({ courseId = null, contentLocales, primaryLocale, routes }) => {
    for (const locale of contentLocales) {
      for (const route of routes) {
        const path = localizedPath(locale, route);
        contracts.set(path, {
          courseId,
          contentLocales,
          primaryLocale,
          locale,
          page: route,
          route: normalizedPagePath(path),
        });
      }
    }
  };
  add({
    contentLocales: releaseSurface.core.contentLocales,
    primaryLocale: releaseSurface.core.contentLocales.includes("en")
      ? "en"
      : releaseSurface.core.contentLocales[0],
    routes: releaseSurface.core.routes,
  });
  for (const course of releaseSurface.courses.filter((record) => record.state === "published")) {
    add(course);
  }
  return contracts;
}

export function buildPreviewPlan(releaseSurface, routeManifest) {
  const expanded = expandManifest(routeManifest, releaseSurface);
  const contracts = seoContracts(releaseSurface);
  const publicPaths = sortedUnique(expanded.publicRoutes.map(requestPath));
  const publicPagePaths = new Set(expanded.publicRoutes.map(normalizedPagePath));
  const blocked = releaseSurface.courses.filter((course) => course.state === "blocked");
  const published = releaseSurface.courses.filter((course) => course.state === "published");
  const blockedPrefixes = new Set(
    blocked.flatMap((course) => course.routes.map((route) => route.split("/")[0])),
  );
  const blockedPaths = blocked.flatMap((course) =>
    releaseSurface.siteLocales.flatMap((locale) =>
      course.routes.map((route) => localizedPath(locale, route)),
    ),
  );
  const unsupportedPaths = published.flatMap((course) =>
    releaseSurface.siteLocales
      .filter((locale) => !course.contentLocales.includes(locale))
      .flatMap((locale) => course.routes.map((route) => localizedPath(locale, route))),
  );
  const consumerPaths = sortedUnique(
    releaseSurface.siteLocales.flatMap((locale) => [
      localizedPath(locale, ""),
      localizedPath(locale, "courses/"),
    ]),
  );
  const expectedDashboardsByLocale = new Map(
    releaseSurface.siteLocales.map((locale) => [
      locale,
      published.map((course) => localizedPath(
        course.contentLocales.includes(locale) ? locale : course.primaryLocale,
        course.routes[0],
      )),
    ]),
  );
  return {
    publicPaths,
    publicPagePaths,
    htmlContracts: contracts,
    negativePaths: sortedUnique([...blockedPaths, ...unsupportedPaths]),
    blockedPaths: new Set(blockedPaths.map(normalizedPagePath)),
    blockedPrefixes,
    consumerPaths: new Set(consumerPaths),
    expectedDashboardsByLocale,
    expectedSitemapUrls: sortedUnique([...contracts.keys()].map(canonicalUrl)),
    siteLocales: new Set(releaseSurface.siteLocales),
  };
}

export function validatePreviewTarget({ previewUrl, deploymentId, commitSha }, options = {}) {
  if (!GIT_SHA.test(commitSha)) throw new Error("commit SHA must be 40 lowercase hexadecimal characters");
  if (!DEPLOYMENT_ID.test(deploymentId)) throw new Error("deployment ID has an invalid format");
  let url;
  try {
    url = new URL(previewUrl);
  } catch {
    throw new Error("Preview URL is invalid");
  }
  const localhostAllowed = options.allowLocalhost === true
    && url.protocol === "http:"
    && ["127.0.0.1", "localhost"].includes(url.hostname);
  if (!localhostAllowed && (url.protocol !== "https:" || !url.hostname.endsWith(".vercel.app"))) {
    throw new Error("Preview URL must be one HTTPS vercel.app origin");
  }
  if (url.username || url.password || url.search || url.hash || !["", "/"].includes(url.pathname)) {
    throw new Error("Preview URL must not contain credentials, a path, query, or fragment");
  }
  return { previewOrigin: url.origin, deploymentId, commitSha };
}

export function validateTrustedOidcToken(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !TRUSTED_OIDC_TOKEN.test(value)) {
    throw new Error("VERCEL_TRUSTED_OIDC_TOKEN has an invalid format");
  }
  return value;
}

export function previewRequestHeaders(trustedOidcToken) {
  const headers = { "user-agent": "agent-edu-preview-verifier/1" };
  if (trustedOidcToken) headers["x-vercel-trusted-oidc-idp-token"] = trustedOidcToken;
  return headers;
}

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function attributes(tag) {
  const values = {};
  for (const match of tag.matchAll(
    /([A-Za-z_:][A-Za-z0-9_:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g,
  )) {
    values[match[1].toLowerCase()] = decodeXml(match[2] ?? match[3] ?? "");
  }
  return values;
}

function htmlLinks(html, element = "link") {
  return [...html.matchAll(new RegExp(`<${element}\\b[^>]*>`, "gi"))]
    .map((match) => attributes(match[0]));
}

function jsonLdBlocks(html) {
  const blocks = [];
  for (const match of html.matchAll(
    /<script\b[^>]*type=(?:"application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    blocks.push(JSON.parse(match[1]));
  }
  return blocks;
}

function sitemapLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)]
    .map((match) => decodeXml(match[1].trim()));
}

function addFailure(report, code, path, detail = undefined) {
  if (report.failures.length >= MAX_FAILURES) return;
  report.failures.push(detail === undefined ? { code, path } : { code, path, detail });
}

function checkHeaders(response, path, report) {
  const headers = response.headers;
  if ((headers.get("x-content-type-options") ?? "").toLowerCase() !== "nosniff") {
    addFailure(report, "header-nosniff", path);
  }
  if (!(headers.get("referrer-policy") ?? "").toLowerCase().split(/\s*,\s*/).includes("no-referrer")) {
    addFailure(report, "header-referrer-policy", path);
  }
  if ((headers.get("x-frame-options") ?? "").toUpperCase() !== "DENY") {
    addFailure(report, "header-frame-protection", path);
  }
  const csp = headers.get("content-security-policy-report-only") ?? "";
  for (const directive of ["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'"]) {
    if (!csp.includes(directive)) addFailure(report, "header-csp-report-only", path, directive);
  }
}

function checkHtmlSeo(html, contract, path, plan, report) {
  const links = htmlLinks(html);
  const canonicals = links.filter((link) =>
    (link.rel ?? "").toLowerCase().split(/\s+/).includes("canonical"),
  );
  const expectedCanonical = canonicalUrl(contract.route);
  if (canonicals.length !== 1 || canonicals[0].href !== expectedCanonical) {
    addFailure(report, "seo-canonical", path);
  }
  const alternates = links
    .filter((link) => (link.rel ?? "").toLowerCase().split(/\s+/).includes("alternate") && link.hreflang)
    .map((link) => ({ hreflang: link.hreflang, href: link.href }));
  try {
    assertAlternateContract(alternates, contract, path);
  } catch {
    addFailure(report, "seo-hreflang", path);
  }
  let blocks;
  try {
    blocks = jsonLdBlocks(html);
  } catch {
    addFailure(report, "seo-jsonld-invalid", path);
    return;
  }
  for (const block of blocks) {
    for (const value of collectJsonLdUrls(block)) {
      let url;
      try {
        url = new URL(value, SITE_ORIGIN);
      } catch {
        addFailure(report, "seo-jsonld-url", path);
        continue;
      }
      if (url.origin !== SITE_ORIGIN) continue;
      if (url.search) addFailure(report, "seo-jsonld-query", path);
      const pathname = internalPagePath(value);
      if (pathname && !plan.publicPagePaths.has(pathname)) {
        addFailure(report, "seo-jsonld-undeclared", path);
      }
      if (pathname && plan.blockedPaths.has(pathname)) {
        addFailure(report, "seo-jsonld-blocked", path);
      }
    }
  }
}

function checkPublicConsumer(html, path, plan, report) {
  const locale = path.split("/").filter(Boolean)[0];
  const linkedPages = new Set();
  for (const link of htmlLinks(html, "a")) {
    if (!link.href) continue;
    let url;
    try {
      url = new URL(link.href, SITE_ORIGIN);
    } catch {
      addFailure(report, "consumer-invalid-url", path);
      continue;
    }
    if (url.origin !== SITE_ORIGIN) continue;
    if (url.searchParams.has("fromLocale")) {
      const values = url.searchParams.getAll("fromLocale");
      if (values.length !== 1 || !plan.siteLocales.has(values[0])) {
        addFailure(report, "consumer-from-locale", path);
      }
    }
    const pathname = internalPagePath(link.href);
    if (!pathname) continue;
    linkedPages.add(pathname);
    if (!plan.publicPagePaths.has(pathname)) addFailure(report, "consumer-undeclared-route", path);
    const [, prefix] = pathname.split("/").filter(Boolean);
    if (plan.blockedPrefixes.has(prefix)) addFailure(report, "consumer-blocked-route", path);
  }
  for (const dashboard of plan.expectedDashboardsByLocale.get(locale) ?? []) {
    if (!linkedPages.has(normalizedPagePath(dashboard))) {
      addFailure(report, "consumer-missing-dashboard", path, normalizedPagePath(dashboard));
    }
  }
}

async function fetchResponse(fetchImpl, url, headers, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, {
        redirect: "manual",
        headers,
      });
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === attempts) return response;
    } catch (error) {
      if (attempt === attempts) throw error;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 250));
  }
  throw new Error("unreachable fetch retry state");
}

async function mapLimit(items, limit, callback) {
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      await callback(current);
    }
  });
  await Promise.all(workers);
}

async function verifyBrowserConsole(paths, previewOrigin, report, concurrency, trustedOidcToken) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    await mapLimit(paths, Math.min(concurrency, 4), async (path) => {
      const page = await browser.newPage({
        serviceWorkers: "block",
        extraHTTPHeaders: trustedOidcToken
          ? { "x-vercel-trusted-oidc-idp-token": trustedOidcToken }
          : undefined,
      });
      let consoleErrors = 0;
      let pageErrors = 0;
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors += 1;
      });
      page.on("pageerror", () => {
        pageErrors += 1;
      });
      try {
        const response = await page.goto(`${previewOrigin}${path}`, {
          waitUntil: "load",
          timeout: 30_000,
        });
        if (response?.status() !== 200) addFailure(report, "browser-status", path);
        await page.waitForTimeout(50);
        if (consoleErrors > 0) addFailure(report, "browser-console-error", path, consoleErrors);
        if (pageErrors > 0) addFailure(report, "browser-page-error", path, pageErrors);
      } catch {
        addFailure(report, "browser-navigation", path);
      } finally {
        await page.close();
      }
      report.checks.browserDocuments += 1;
    });
  } finally {
    await browser.close();
  }
}

export async function verifyVercelPreview(options) {
  const target = validatePreviewTarget(options, { allowLocalhost: options.allowLocalhost });
  const trustedOidcToken = validateTrustedOidcToken(options.trustedOidcToken);
  const requestHeaders = previewRequestHeaders(trustedOidcToken);
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const releaseArtifacts = assertReleaseArtifactsCurrent({ projectRoot });
  const releaseSurface = options.releaseSurface ?? releaseArtifacts.releaseSurface;
  const routeManifest = options.routeManifest ?? JSON.parse(readFileSync(
    resolve(projectRoot, "config/route-manifest.json"),
    "utf8",
  ));
  const plan = buildPreviewPlan(releaseSurface, routeManifest);
  const fetchImpl = options.fetchImpl ?? fetch;
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32) {
    throw new Error("concurrency must be an integer from 1 through 32");
  }
  const report = {
    schema: "agent-edu.vercel-preview-verification.v1",
    status: "pending",
    checkedAt: new Date().toISOString(),
    target: {
      previewUrl: target.previewOrigin,
      deploymentId: target.deploymentId,
      commitSha: target.commitSha,
    },
    checks: {
      releaseMetadata: 0,
      publicRoutes: 0,
      negativeRoutes: 0,
      seoDocuments: 0,
      consumerDocuments: 0,
      sitemapShards: 0,
      sitemapUrls: 0,
      sensitiveDocuments: 0,
      browserDocuments: 0,
    },
    failures: [],
  };

  try {
    const checkoutCommit = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (checkoutCommit !== target.commitSha) {
      addFailure(report, "checkout-commit-binding", "[repository]");
    }
  } catch {
    addFailure(report, "checkout-commit-binding", "[repository]");
  }

  try {
    const metadataPath = "/.well-known/release.json";
    const metadataResponse = await fetchResponse(
      fetchImpl,
      `${target.previewOrigin}${metadataPath}`,
      requestHeaders,
    );
    if (metadataResponse.status !== 200) {
      addFailure(report, "release-metadata-status", metadataPath, metadataResponse.status);
    } else {
      checkHeaders(metadataResponse, metadataPath, report);
      let metadata;
      try {
        metadata = await metadataResponse.json();
      } catch {
        addFailure(report, "release-metadata-json", metadataPath);
      }
      if (
        metadata?.schema !== "agent-edu.release-build.v1"
        || metadata?.commitSha !== target.commitSha
        || metadata?.environment !== "preview"
        || metadata?.deploymentId !== target.deploymentId
        || metadata?.deploymentUrl !== target.previewOrigin
      ) {
        addFailure(report, "release-metadata-binding", metadataPath);
      }
    }
    report.checks.releaseMetadata = 1;

    await mapLimit(plan.publicPaths, concurrency, async (path) => {
      let response;
      try {
        response = await fetchResponse(fetchImpl, `${target.previewOrigin}${path}`, requestHeaders);
      } catch {
        addFailure(report, "public-route-network", path);
        return;
      }
      if (response.status !== 200) {
        addFailure(report, "public-route-status", path, response.status);
        return;
      }
      checkHeaders(response, path, report);
      const contract = plan.htmlContracts.get(path);
      if (contract || plan.consumerPaths.has(path)) {
        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("text/html")) addFailure(report, "public-route-content-type", path);
        const html = await response.text();
        const secretFindings = contentFindings(html);
        for (const finding of secretFindings) addFailure(report, `sensitive-${finding.id}`, path);
        report.checks.sensitiveDocuments += 1;
        if (contract) {
          checkHtmlSeo(html, contract, path, plan, report);
          report.checks.seoDocuments += 1;
        }
        if (plan.consumerPaths.has(path)) {
          checkPublicConsumer(html, path, plan, report);
          report.checks.consumerDocuments += 1;
        }
      } else {
        await response.arrayBuffer();
      }
      report.checks.publicRoutes += 1;
    });

    await mapLimit(plan.negativePaths, concurrency, async (path) => {
      let response;
      try {
        response = await fetchResponse(fetchImpl, `${target.previewOrigin}${path}`, requestHeaders);
      } catch {
        addFailure(report, "negative-route-network", path);
        return;
      }
      if (response.status !== 404) addFailure(report, "negative-route-status", path, response.status);
      await response.arrayBuffer();
      report.checks.negativeRoutes += 1;
    });

    const sitemapResponse = await fetchResponse(
      fetchImpl,
      `${target.previewOrigin}/sitemap.xml`,
      requestHeaders,
    );
    const sitemapIndex = await sitemapResponse.text();
    if (Buffer.byteLength(sitemapIndex) > MAX_SITEMAP_BYTES) {
      addFailure(report, "sitemap-index-budget", "/sitemap.xml");
    }
    const shardUrls = sitemapLocs(sitemapIndex);
    const sitemapUrls = [];
    await mapLimit(shardUrls, concurrency, async (shardUrl) => {
      let parsed;
      try {
        parsed = new URL(shardUrl);
      } catch {
        addFailure(report, "sitemap-shard-url", "/sitemap.xml");
        return;
      }
      if (parsed.origin !== SITE_ORIGIN || !/^\/sitemaps\/[A-Za-z0-9._-]+\.xml$/.test(parsed.pathname)) {
        addFailure(report, "sitemap-shard-url", "/sitemap.xml");
        return;
      }
      const response = await fetchResponse(
        fetchImpl,
        `${target.previewOrigin}${parsed.pathname}`,
        requestHeaders,
      );
      if (response.status !== 200) addFailure(report, "sitemap-shard-status", parsed.pathname, response.status);
      const xml = await response.text();
      if (Buffer.byteLength(xml) > MAX_SITEMAP_BYTES) addFailure(report, "sitemap-shard-budget", parsed.pathname);
      sitemapUrls.push(...sitemapLocs(xml));
      report.checks.sitemapShards += 1;
    });
    const sitemapDiff = diffSets(plan.expectedSitemapUrls, sortedUnique(sitemapUrls));
    if (sitemapDiff.missing.length) addFailure(report, "sitemap-missing-urls", "/sitemap.xml", sitemapDiff.missing.length);
    if (sitemapDiff.extra.length) addFailure(report, "sitemap-extra-urls", "/sitemap.xml", sitemapDiff.extra.length);
    report.checks.sitemapUrls = sitemapUrls.length;

    if (options.browserConsole === true) {
      await verifyBrowserConsole(
        [...plan.htmlContracts.keys()],
        target.previewOrigin,
        report,
        concurrency,
        trustedOidcToken,
      );
    }
  } catch {
    addFailure(report, "verifier-internal", "[sanitized]");
  }
  report.status = report.failures.length === 0 ? "pass" : "fail";
  return report;
}

export function writePreviewReport(report, output, options = {}) {
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const allowedRoot = resolve(projectRoot, "tmp/release");
  const target = resolve(projectRoot, output ?? "tmp/release/vercel-preview-verification.json");
  if (target !== allowedRoot && !target.startsWith(`${allowedRoot}${sep}`)) {
    throw new Error("Preview report output must remain below tmp/release");
  }
  const body = `${JSON.stringify(report, null, 2)}\n`;
  if (contentFindings(body).length) throw new Error("sanitized Preview report matched a secret rule");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, body, { mode: 0o600 });
  return target;
}

function parseArguments(argv) {
  const values = { browserConsole: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--browser-console") {
      values.browserConsole = true;
      continue;
    }
    if (!["--url", "--deployment-id", "--commit", "--output", "--concurrency"].includes(arg)) {
      throw new Error("unknown Preview verifier argument");
    }
    const value = argv[index + 1];
    if (!value) throw new Error("Preview verifier argument is missing a value");
    index += 1;
    if (arg === "--url") values.previewUrl = value;
    if (arg === "--deployment-id") values.deploymentId = value;
    if (arg === "--commit") values.commitSha = value;
    if (arg === "--output") values.output = value;
    if (arg === "--concurrency") values.concurrency = Number(value);
  }
  if (!values.previewUrl || !values.deploymentId || !values.commitSha) {
    throw new Error("--url, --deployment-id, and --commit are required");
  }
  return values;
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  try {
    const options = {
      ...parseArguments(process.argv.slice(2)),
      trustedOidcToken: process.env.VERCEL_TRUSTED_OIDC_TOKEN,
    };
    const report = await verifyVercelPreview(options);
    const output = writePreviewReport(report, options.output);
    console.log(
      `Vercel Preview: ${report.status.toUpperCase()} — ${report.checks.publicRoutes} public, `
      + `${report.checks.negativeRoutes} blocked/unsupported, ${report.checks.sitemapUrls} sitemap, `
      + `${report.checks.browserDocuments} browser-console documents; report ${output}`,
    );
    if (report.status !== "pass") process.exitCode = 1;
  } catch (error) {
    console.error(`Vercel Preview: FAIL — ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
