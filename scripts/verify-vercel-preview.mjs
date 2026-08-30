#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import {
  assertAlternateContract,
  collectJsonLdUrls,
  diffSets,
  expandManifest,
  internalPagePath,
} from "./check-routes.mjs";
import { contentFindings } from "./check-secrets.mjs";
import {
  assertCspConfiguration,
  CANONICAL_CSP_POLICY,
  CSP_HEADER_BY_STAGE,
} from "./check-csp.mjs";
import { assertReleaseArtifactsCurrent } from "./sync-course-public-surface.mjs";

const SITE_ORIGIN = "https://aicourse.top";
const GIT_SHA = /^[0-9a-f]{40}$/;
const DEPLOYMENT_ID = /^dpl_[A-Za-z0-9]{8,124}$/;
const MAX_SITEMAP_BYTES = 500 * 1024;
const MAX_RELEASE_METADATA_BYTES = 16 * 1024;
const MAX_FAILURES = 250;
const DEFAULT_CONCURRENCY = 12;
const TRUSTED_OIDC_TOKEN = /^[A-Za-z0-9_-]{2,4096}\.[A-Za-z0-9_-]{2,4096}\.[A-Za-z0-9_-]{2,4096}$/;
const REPORT_ONLY_CSP_DIAGNOSTIC = "The Content Security Policy directive 'upgrade-insecure-requests' is ignored when delivered in a report-only policy.";
const DEPLOYMENT_ENVIRONMENTS = new Set(["preview", "production"]);

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

/**
 * @param {{
 *   projectRoot: string,
 *   commitSha: string,
 *   execFile?: (
 *     file: string,
 *     args: readonly string[],
 *     options: import("node:child_process").ExecFileSyncOptionsWithStringEncoding,
 *   ) => string,
 * }} options
 */
export function assertCleanExactCheckout({ projectRoot, commitSha, execFile }) {
  const runExecFile = execFile ?? execFileSync;
  const checkoutCommit = runExecFile("git", ["rev-parse", "HEAD"], {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  if (checkoutCommit !== commitSha) {
    throw new Error("checkout HEAD does not match the deployment commit");
  }
  const status = runExecFile("git", ["status", "--porcelain=v1", "--untracked-files=all"], {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
  if (status !== "") {
    throw new Error("checkout must be clean before deriving the release verification plan");
  }
}

export function assertTargetCspStage(stageConfig, vercelConfig, targetStage) {
  assertCspConfiguration(stageConfig, vercelConfig);
  if (stageConfig.stage !== targetStage) {
    throw new Error(
      `deployment verifier CSP stage ${targetStage} does not match the clean checkout stage ${stageConfig.stage}`,
    );
  }
}

function assertCheckoutCspStage(projectRoot, targetStage) {
  const stageConfig = JSON.parse(readFileSync(
    join(projectRoot, "config", "csp-stage.json"),
    "utf8",
  ));
  const vercelConfig = JSON.parse(readFileSync(join(projectRoot, "vercel.json"), "utf8"));
  assertTargetCspStage(stageConfig, vercelConfig, targetStage);
}

/**
 * @param {{
 *   url: string,
 *   deploymentId: string,
 *   commitSha: string,
 *   environment?: "preview" | "production",
 *   cspStage?: "report-only" | "enforced",
 *   metadataDeploymentUrl?: string,
 * }} input
 * @param {{ allowLocalhost?: boolean }} [options]
 */
export function validateDeploymentTarget({
  url: targetUrl,
  deploymentId,
  commitSha,
  environment = "preview",
  cspStage = "report-only",
  metadataDeploymentUrl,
}, options = {}) {
  if (!GIT_SHA.test(commitSha)) throw new Error("commit SHA must be 40 lowercase hexadecimal characters");
  if (!DEPLOYMENT_ID.test(deploymentId)) throw new Error("deployment ID has an invalid format");
  if (!DEPLOYMENT_ENVIRONMENTS.has(environment)) {
    throw new Error("deployment environment must be preview or production");
  }
  if (!Object.hasOwn(CSP_HEADER_BY_STAGE, cspStage)) {
    throw new Error("CSP stage must be report-only or enforced");
  }
  if (environment === "production" && cspStage !== "enforced") {
    throw new Error("production verification requires enforced CSP");
  }
  let url;
  try {
    url = new URL(targetUrl);
  } catch {
    throw new Error("deployment URL is invalid");
  }
  const localhostAllowed = environment === "preview"
    && options.allowLocalhost === true
    && url.protocol === "http:"
    && ["127.0.0.1", "localhost"].includes(url.hostname);
  if (
    environment === "preview"
    && !localhostAllowed
    && (url.protocol !== "https:" || !url.hostname.endsWith(".vercel.app"))
  ) {
    throw new Error("Preview URL must be one HTTPS vercel.app origin");
  }
  if (environment === "production" && url.origin !== SITE_ORIGIN) {
    throw new Error(`production URL must be the canonical production origin ${SITE_ORIGIN}`);
  }
  if (url.username || url.password || url.search || url.hash || !["", "/"].includes(url.pathname)) {
    throw new Error("deployment URL must not contain credentials, a path, query, or fragment");
  }
  const expectedMetadataUrl = metadataDeploymentUrl ?? (environment === "preview" ? url.origin : null);
  if (typeof expectedMetadataUrl !== "string") {
    throw new Error("production verification requires the unique metadata deployment URL");
  }
  let metadataUrl;
  try {
    metadataUrl = new URL(expectedMetadataUrl);
  } catch {
    throw new Error("metadata deployment URL is invalid");
  }
  const metadataUrlHasExtraParts = metadataUrl.username
    || metadataUrl.password
    || metadataUrl.search
    || metadataUrl.hash
    || !["", "/"].includes(metadataUrl.pathname);
  const validMetadataOrigin = localhostAllowed
    ? metadataUrl.origin === url.origin
    : metadataUrl.protocol === "https:" && metadataUrl.hostname.endsWith(".vercel.app");
  if (!validMetadataOrigin || metadataUrlHasExtraParts) {
    throw new Error("metadata deployment URL must be one clean HTTPS vercel.app origin");
  }
  if (environment === "preview" && !localhostAllowed && metadataUrl.origin !== url.origin) {
    throw new Error("Preview metadata deployment URL must equal the verified Preview origin");
  }
  return {
    origin: url.origin,
    deploymentId,
    commitSha,
    environment,
    cspStage,
    metadataDeploymentUrl: metadataUrl.origin,
  };
}

export function validatePreviewTarget({ previewUrl, deploymentId, commitSha }, options = {}) {
  const target = validateDeploymentTarget({
    url: previewUrl,
    deploymentId,
    commitSha,
    environment: "preview",
    cspStage: "report-only",
  }, options);
  return {
    previewOrigin: target.origin,
    deploymentId: target.deploymentId,
    commitSha: target.commitSha,
  };
}

export function deploymentMetadataMatches(metadata, target) {
  const expectedKeys = ["commitSha", "deploymentId", "deploymentUrl", "environment", "schema"];
  return metadata !== null
    && typeof metadata === "object"
    && !Array.isArray(metadata)
    && Object.keys(metadata).sort().join("\n") === expectedKeys.join("\n")
    && metadata?.schema === "agent-edu.release-build.v1"
    && metadata?.commitSha === target.commitSha
    && metadata?.environment === target.environment
    && metadata?.deploymentId === target.deploymentId
    && metadata?.deploymentUrl === target.metadataDeploymentUrl;
}

export function releaseMetadataTextFindings(text, target) {
  const findings = contentFindings(text).map((finding) => `sensitive-${finding.id}`);
  let metadata;
  try {
    metadata = JSON.parse(text);
  } catch {
    findings.push("release-metadata-json");
    return { metadata: undefined, findings };
  }
  if (text !== `${JSON.stringify(metadata, null, 2)}\n`) {
    findings.push("release-metadata-canonical");
  }
  if (!deploymentMetadataMatches(metadata, target)) findings.push("release-metadata-binding");
  return { metadata, findings };
}

export async function inspectReleaseMetadataResponse(response, target) {
  const findings = [];
  const contentType = (response.headers.get("content-type") ?? "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (contentType !== "application/json") findings.push("release-metadata-content-type");

  const declaredLength = response.headers.get("content-length");
  if (declaredLength !== null) {
    if (!/^(0|[1-9][0-9]*)$/.test(declaredLength)) {
      findings.push("release-metadata-content-length");
    } else if (Number(declaredLength) > MAX_RELEASE_METADATA_BYTES) {
      findings.push("release-metadata-size");
      await response.body?.cancel();
      return { metadata: undefined, findings };
    }
  }

  const text = await response.text();
  if (Buffer.byteLength(text) > MAX_RELEASE_METADATA_BYTES) {
    findings.push("release-metadata-size");
    return { metadata: undefined, findings };
  }
  const inspected = releaseMetadataTextFindings(text, target);
  return { metadata: inspected.metadata, findings: [...findings, ...inspected.findings] };
}

export function deploymentMetadataPairFindings(customMetadata, uniqueMetadata, target) {
  if (uniqueMetadata === undefined) return ["unique-deployment-metadata-missing"];
  const findings = [];
  if (!deploymentMetadataMatches(customMetadata, target)) {
    findings.push("custom-domain-metadata-binding");
  }
  if (!deploymentMetadataMatches(uniqueMetadata, target)) {
    findings.push("unique-deployment-metadata-binding");
  }
  const fields = ["schema", "commitSha", "environment", "deploymentId", "deploymentUrl"];
  if (fields.some((field) => customMetadata?.[field] !== uniqueMetadata?.[field])) {
    findings.push("production-metadata-origins-diverge");
  }
  return findings;
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

export function cspHeaderFindings(headers, cspStage) {
  if (!Object.hasOwn(CSP_HEADER_BY_STAGE, cspStage)) {
    throw new Error("CSP stage must be report-only or enforced");
  }
  const findings = [];
  const expectedHeader = CSP_HEADER_BY_STAGE[cspStage];
  const oppositeHeader = cspStage === "report-only"
    ? CSP_HEADER_BY_STAGE.enforced
    : CSP_HEADER_BY_STAGE["report-only"];
  const csp = headers.get(expectedHeader) ?? "";
  if (csp !== CANONICAL_CSP_POLICY) {
    findings.push({ code: `header-csp-${cspStage}`, detail: "reviewed-baseline-mismatch" });
  }
  if ((headers.get(oppositeHeader) ?? "").trim() !== "") {
    findings.push({ code: "header-csp-stage-conflict", detail: oppositeHeader.toLowerCase() });
  }
  return findings;
}

export function securityHeaderFindings(headers, cspStage) {
  const findings = [];
  if ((headers.get("x-content-type-options") ?? "").trim().toLowerCase() !== "nosniff") {
    findings.push({ code: "header-nosniff" });
  }
  if ((headers.get("referrer-policy") ?? "").trim().toLowerCase() !== "no-referrer") {
    findings.push({ code: "header-referrer-policy" });
  }
  if ((headers.get("x-frame-options") ?? "").trim().toUpperCase() !== "DENY") {
    findings.push({ code: "header-frame-protection" });
  }
  findings.push(...cspHeaderFindings(headers, cspStage));
  return findings;
}

function checkHeaders(response, path, report, cspStage) {
  const headers = response.headers;
  for (const finding of securityHeaderFindings(headers, cspStage)) {
    addFailure(report, finding.code, path, "detail" in finding ? finding.detail : undefined);
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

export function isExpectedReportOnlyCspDiagnostic(message) {
  return message.type() === "error" && message.text() === REPORT_ONLY_CSP_DIAGNOSTIC;
}

export async function routeOriginBoundRequest(route, deploymentOrigin, trustedOidcToken) {
  const request = route.request();
  const headers = { ...request.headers() };
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === "x-vercel-trusted-oidc-idp-token") delete headers[key];
  }
  let requestOrigin;
  try {
    requestOrigin = new URL(request.url()).origin;
  } catch {
    await route.continue({ headers });
    return;
  }
  if (trustedOidcToken && requestOrigin === deploymentOrigin) {
    headers["x-vercel-trusted-oidc-idp-token"] = trustedOidcToken;
    const response = await route.fetch({ headers, maxRedirects: 0 });
    await route.fulfill({ response });
    return;
  }
  await route.continue({ headers });
}

async function verifyBrowserConsole(
  paths,
  deploymentOrigin,
  report,
  concurrency,
  trustedOidcToken,
  cspStage,
) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    await mapLimit(paths, Math.min(concurrency, 4), async (path) => {
      const page = await browser.newPage({
        serviceWorkers: "block",
      });
      if (trustedOidcToken) {
        await page.route("**/*", (route) => routeOriginBoundRequest(
          route,
          deploymentOrigin,
          trustedOidcToken,
        ));
      }
      let consoleErrors = 0;
      let pageErrors = 0;
      let reportOnlyCspDiagnostics = 0;
      page.on("console", (message) => {
        if (isExpectedReportOnlyCspDiagnostic(message)) {
          reportOnlyCspDiagnostics += 1;
        } else if (message.type() === "error") {
          consoleErrors += 1;
        }
      });
      page.on("pageerror", () => {
        pageErrors += 1;
      });
      try {
        const response = await page.goto(`${deploymentOrigin}${path}`, {
          waitUntil: "load",
          timeout: 30_000,
        });
        if (response?.status() !== 200) addFailure(report, "browser-status", path);
        await page.waitForTimeout(50);
        const reportOnlyPolicy = response?.headers()["content-security-policy-report-only"] ?? "";
        if (
          cspStage === "report-only"
          && reportOnlyCspDiagnostics > 0
          && reportOnlyPolicy.includes("upgrade-insecure-requests")
        ) {
          report.checks.classifiedReportOnlyCspDiagnostics += reportOnlyCspDiagnostics;
        } else {
          // The exact browser diagnostic is expected only when the verified
          // response actually carries the reviewed report-only directive.
          consoleErrors += reportOnlyCspDiagnostics;
        }
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
  const target = validateDeploymentTarget({
    url: options.previewUrl,
    deploymentId: options.deploymentId,
    commitSha: options.commitSha,
    environment: options.environment ?? "preview",
    cspStage: options.cspStage ?? "report-only",
    metadataDeploymentUrl: options.metadataDeploymentUrl,
  }, { allowLocalhost: options.allowLocalhost });
  const trustedOidcToken = validateTrustedOidcToken(options.trustedOidcToken);
  if (target.environment === "production" && trustedOidcToken) {
    throw new Error("production verification must not transmit a Preview OIDC token");
  }
  if (target.environment === "production" && options.browserConsole !== true) {
    throw new Error("production verification requires the full browser-console matrix");
  }
  const requestHeaders = previewRequestHeaders(trustedOidcToken);
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  assertCleanExactCheckout({ projectRoot, commitSha: target.commitSha });
  assertCheckoutCspStage(projectRoot, target.cspStage);
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
    schema: "agent-edu.vercel-deployment-verification.v2",
    status: "pending",
    checkedAt: new Date().toISOString(),
    target: {
      url: target.origin,
      deploymentId: target.deploymentId,
      commitSha: target.commitSha,
      environment: target.environment,
      cspStage: target.cspStage,
      metadataDeploymentUrl: target.metadataDeploymentUrl,
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
      classifiedReportOnlyCspDiagnostics: 0,
    },
    failures: [],
  };

  try {
    const metadataPath = "/.well-known/release.json";
    let customMetadata;
    const metadataResponse = await fetchResponse(
      fetchImpl,
      `${target.origin}${metadataPath}`,
      requestHeaders,
    );
    if (metadataResponse.status !== 200) {
      addFailure(report, "release-metadata-status", metadataPath, metadataResponse.status);
    } else {
      checkHeaders(metadataResponse, metadataPath, report, target.cspStage);
      const inspected = await inspectReleaseMetadataResponse(metadataResponse, target);
      customMetadata = inspected.metadata;
      for (const code of inspected.findings) {
        addFailure(report, code, metadataPath);
      }
    }
    report.checks.releaseMetadata = 1;
    if (target.environment === "production") {
      let uniqueMetadata;
      const uniqueMetadataResponse = await fetchResponse(
        fetchImpl,
        `${target.metadataDeploymentUrl}${metadataPath}`,
        previewRequestHeaders(undefined),
      );
      if (uniqueMetadataResponse.status !== 200) {
        addFailure(
          report,
          "unique-release-metadata-status",
          metadataPath,
          uniqueMetadataResponse.status,
        );
      } else {
        checkHeaders(uniqueMetadataResponse, metadataPath, report, target.cspStage);
        const inspected = await inspectReleaseMetadataResponse(uniqueMetadataResponse, target);
        uniqueMetadata = inspected.metadata;
        for (const code of inspected.findings) {
          const uniqueCode = code === "release-metadata-json"
            ? "unique-release-metadata-json"
            : code === "release-metadata-binding"
              ? "unique-release-metadata-binding"
              : code;
          addFailure(report, uniqueCode, metadataPath);
        }
      }
      for (const code of deploymentMetadataPairFindings(customMetadata, uniqueMetadata, target)) {
        addFailure(report, code, metadataPath);
      }
      report.checks.releaseMetadata = 2;
    }

    await mapLimit(plan.publicPaths, concurrency, async (path) => {
      let response;
      try {
        response = await fetchResponse(fetchImpl, `${target.origin}${path}`, requestHeaders);
      } catch {
        addFailure(report, "public-route-network", path);
        return;
      }
      if (response.status !== 200) {
        addFailure(report, "public-route-status", path, response.status);
        return;
      }
      checkHeaders(response, path, report, target.cspStage);
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
        response = await fetchResponse(fetchImpl, `${target.origin}${path}`, requestHeaders);
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
      `${target.origin}/sitemap.xml`,
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
        `${target.origin}${parsed.pathname}`,
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
        target.origin,
        report,
        concurrency,
        trustedOidcToken,
        target.cspStage,
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
  const defaultOutput = report?.target?.environment === "production"
    ? "tmp/release/vercel-production-verification.json"
    : "tmp/release/vercel-preview-verification.json";
  const target = resolve(projectRoot, output ?? defaultOutput);
  if (target !== allowedRoot && !target.startsWith(`${allowedRoot}${sep}`)) {
    throw new Error("Preview report output must remain below tmp/release");
  }
  const body = `${JSON.stringify(report, null, 2)}\n`;
  if (contentFindings(body).length) throw new Error("sanitized Preview report matched a secret rule");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, body, { mode: 0o600 });
  return target;
}

export function parseArguments(argv) {
  const values = {
    browserConsole: false,
    environment: "preview",
    cspStage: "report-only",
  };
  const seen = new Set();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (seen.has(arg)) throw new Error(`duplicate deployment verifier argument: ${arg}`);
    seen.add(arg);
    if (arg === "--browser-console") {
      values.browserConsole = true;
      continue;
    }
    if (![
      "--url",
      "--deployment-id",
      "--commit",
      "--environment",
      "--csp-stage",
      "--metadata-deployment-url",
      "--output",
      "--concurrency",
    ].includes(arg)) {
      throw new Error("unknown deployment verifier argument");
    }
    const value = argv[index + 1];
    if (!value) throw new Error("deployment verifier argument is missing a value");
    index += 1;
    if (arg === "--url") values.previewUrl = value;
    if (arg === "--deployment-id") values.deploymentId = value;
    if (arg === "--commit") values.commitSha = value;
    if (arg === "--environment") values.environment = value;
    if (arg === "--csp-stage") values.cspStage = value;
    if (arg === "--metadata-deployment-url") values.metadataDeploymentUrl = value;
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
      `Vercel ${report.target.environment}: ${report.status.toUpperCase()} — ${report.checks.publicRoutes} public, `
      + `${report.checks.negativeRoutes} blocked/unsupported, ${report.checks.sitemapUrls} sitemap, `
      + `${report.checks.browserDocuments} browser-console documents, `
      + `${report.checks.classifiedReportOnlyCspDiagnostics} classified report-only CSP diagnostics; `
      + `report ${output}`,
    );
    if (report.status !== "pass") process.exitCode = 1;
  } catch (error) {
    console.error(`Vercel deployment: FAIL — ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
