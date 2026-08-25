#!/usr/bin/env node

/**
 * Browser evidence collector for the translation release gate.
 *
 * Browser interaction is intentionally delegated to Playwright CLI.  This
 * controller discovers built routes, starts an isolated read-only server,
 * generates run-code functions in output/, and normalises the evidence.  It
 * does not add or execute a Playwright test spec.
 */
import { createHash } from "node:crypto";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const option = (name, fallback = null) => argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const targetOption = option("target", "local-candidate");
const productionBase = option("production", "https://aicourse.top").replace(/\/$/, "");
const maxRoutes = Number(option("max-routes", "0")) || Infinity;
const requestedSnapshot = option("snapshot-id");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const posix = (value) => value.split(sep).join("/");

function atomicWrite(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, value);
  renameSync(temporary, path);
}

function walk(directory, predicate = () => true) {
  if (!existsSync(directory)) return [];
  const files = [];
  const visit = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && predicate(path)) files.push(path);
    }
  };
  visit(directory);
  return files.sort();
}

function latestReleaseReport() {
  const reports = walk(join(ROOT, "output", "i18n-audit"), (path) => path.endsWith(`${sep}report.json`));
  const candidates = reports.map((path) => {
    try {
      return { path, report: JSON.parse(readFileSync(path, "utf8")), mtime: statSync(path).mtimeMs };
    } catch {
      return null;
    }
  }).filter(Boolean);
  if (requestedSnapshot) return candidates.find((candidate) => candidate.report.snapshotId === requestedSnapshot) ?? null;
  return candidates.sort((a, b) => b.mtime - a.mtime)[0] ?? null;
}

const release = latestReleaseReport();
if (!release) {
  process.stderr.write("No matching release report. Run npm run i18n:check:release -- --json first, or pass --snapshot-id=<id>.\n");
  process.exit(2);
}
const snapshotId = release.report.snapshotId;
const OUTPUT = join(ROOT, "output", "playwright", snapshotId);
const GENERATED = join(OUTPUT, "generated");
const CONFIGS = join(OUTPUT, "configs");
mkdirSync(GENERATED, { recursive: true });
mkdirSync(CONFIGS, { recursive: true });

const findings = [];
const finding = (value) => findings.push({
  target: value.target ?? "local-candidate",
  locale: value.locale ?? "*",
  route: value.route ?? "",
  state: value.state,
  category: value.category,
  observed: String(value.observed ?? ""),
  evidence: value.evidence ?? "",
});

const locales = release.report.discovered?.locales?.map((locale) => locale.code) ?? [];
const directions = Object.fromEntries((release.report.discovered?.locales ?? []).map((locale) => [locale.code, locale.dir]));
const outRoot = join(ROOT, "out");
const htmlFiles = walk(outRoot, (path) => extname(path) === ".html");
function htmlRoute(path) {
  const value = posix(relative(outRoot, path));
  if (value === "index.html") return "/";
  if (value.endsWith("/index.html")) return `/${value.slice(0, -"index.html".length)}`;
  return `/${value}`;
}
const builtRoutes = htmlFiles.map(htmlRoute).sort();
const expectedRoutes = release.report.discovered?.expectedRoutes ?? [];
const representativeFirst = ["/en/", "/en/handbook/", "/zh-Hans/handbook/", "/ar/handbook/"].filter((route) => builtRoutes.includes(route) || expectedRoutes.includes(route));
const routes = [...new Set([...representativeFirst, ...builtRoutes, ...expectedRoutes])].slice(0, maxRoutes);

const sourceFiles = ["app", "components", "lib", "messages"].flatMap((directory) => walk(join(ROOT, directory), (path) => /\.(?:ts|tsx|js|jsx|json)$/.test(path)));
const newestSource = sourceFiles.length ? Math.max(...sourceFiles.map((path) => statSync(path).mtimeMs)) : 0;
const newestHtml = htmlFiles.length ? Math.max(...htmlFiles.map((path) => statSync(path).mtimeMs)) : 0;
const artifactManifest = walk(outRoot).map((path) => ({ path: posix(relative(outRoot, path)), bytes: statSync(path).size, sha256: sha256(readFileSync(path)) }));

const routeManifest = {
  snapshotId,
  generatedAt: new Date().toISOString(),
  builtRoutes,
  expectedRoutes,
  auditRoutes: routes,
  artifactHash: sha256(JSON.stringify(artifactManifest)),
  sourceNewestAt: newestSource ? new Date(newestSource).toISOString() : null,
  exportNewestAt: newestHtml ? new Date(newestHtml).toISOString() : null,
};
atomicWrite(join(OUTPUT, "route-manifest.json"), JSON.stringify(routeManifest, null, 2) + "\n");
atomicWrite(join(OUTPUT, "artifact-sha256.json"), JSON.stringify({ snapshotId, files: artifactManifest }, null, 2) + "\n");

const stale = !htmlFiles.length || newestSource > newestHtml;
if (stale && targetOption !== "production") {
  finding({ state: "NOT_ASSESSABLE", category: htmlFiles.length ? "static-export-stale" : "static-export-missing", observed: `source=${routeManifest.sourceNewestAt} export=${routeManifest.exportNewestAt}`, evidence: "The browser audit refuses to crawl an artifact that predates its source inputs." });
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".zip": "application/zip",
};

function staticServer() {
  const server = createServer((request, response) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url ?? "/", "http://127.0.0.1").pathname);
    } catch {
      response.writeHead(400).end("Bad request");
      return;
    }
    const relativePath = pathname.replace(/^\/+/, "");
    const candidates = pathname.endsWith("/")
      ? [join(outRoot, relativePath, "index.html")]
      : [join(outRoot, relativePath), join(outRoot, relativePath, "index.html")];
    const path = candidates.find((candidate) => candidate.startsWith(outRoot) && existsSync(candidate) && statSync(candidate).isFile());
    if (path) {
      response.writeHead(200, { "content-type": mime[extname(path)] ?? "application/octet-stream", "cache-control": "no-store" });
      createReadStream(path).pipe(response);
      return;
    }
    const notFound = [join(outRoot, "404.html"), join(outRoot, "404", "index.html")].find(existsSync);
    response.writeHead(404, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    if (notFound) createReadStream(notFound).pipe(response);
    else response.end("Not found");
  });
  return new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolvePromise(server));
  });
}

function cliPath() {
  const configured = process.env.PLAYWRIGHT_CLI_WRAPPER;
  const bundled = join(homedir(), ".codex", "skills", "playwright", "scripts", "playwright_cli.sh");
  if (configured && existsSync(configured)) return configured;
  if (existsSync(bundled)) return bundled;
  return null;
}
const CLI = cliPath();

function runCli(args, { raw = false } = {}) {
  if (!CLI) return Promise.reject(new Error("Playwright CLI wrapper not found"));
  return new Promise((resolvePromise, reject) => {
    const child = spawn(CLI, args, { cwd: OUTPUT, stdio: ["ignore", "pipe", "pipe"] });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", reject);
    child.once("close", (code) => {
      const out = Buffer.concat(stdout).toString("utf8").trim();
      const err = Buffer.concat(stderr).toString("utf8").trim();
      if (code !== 0) reject(new Error(`playwright-cli exited ${code}: ${err || out}`));
      else if (!raw) resolvePromise(out);
      else {
        try { resolvePromise(JSON.parse(out)); }
        catch (error) { reject(new Error(`playwright-cli did not return JSON: ${error.message}\n${out.slice(0, 2000)}`)); }
      }
    });
  });
}

function routeId(route) {
  return route === "/" ? "root" : route.replace(/^\//, "").replace(/\/$/, "").replace(/[^A-Za-z0-9._-]+/g, "__") || "root";
}

function buildAuditFunction({ baseUrl, routeList, target, javaScriptEnabled }) {
  const evidenceRoots = Object.fromEntries(routeList.map((route) => {
    const locale = route.split("/")[1];
    const group = locales.includes(locale) ? locale : "global";
    const directory = join(OUTPUT, target, group, routeId(route));
    mkdirSync(join(directory, "screenshots"), { recursive: true });
    return [route, posix(directory)];
  }));
  return `async page => {
    const routes = ${JSON.stringify(routeList)};
    const base = ${JSON.stringify(baseUrl)};
    const expectedLocales = ${JSON.stringify(locales)};
    const directions = ${JSON.stringify(directions)};
    const evidenceRoots = ${JSON.stringify(evidenceRoots)};
    const results = [];
    for (const route of routes) {
      const consoleEntries = [];
      const pageErrors = [];
      const requestFailures = [];
      const onConsole = message => {
        if (["error", "warning"].includes(message.type())) consoleEntries.push({ type: message.type(), text: message.text(), location: message.location() });
      };
      const onPageError = error => pageErrors.push({ name: error.name, message: error.message, stack: error.stack || null });
      const onRequestFailed = request => requestFailures.push({ url: request.url(), method: request.method(), failure: request.failure()?.errorText || null });
      page.on("console", onConsole);
      page.on("pageerror", onPageError);
      page.on("requestfailed", onRequestFailed);
      try {
        const requestedUrl = base + route;
        // Cancel delayed redirects/prefetch left by the preceding root or
        // error page before beginning the next independently-scored route.
        if (page.url() !== "about:blank") await page.goto("about:blank", { waitUntil: "load" });
        const response = await page.goto(requestedUrl, { waitUntil: "load", timeout: 30000 });
        if (route === "/") {
          await page.waitForTimeout(1500);
          await page.waitForLoadState("load");
        }
        if (${JSON.stringify(javaScriptEnabled)}) {
          await page.evaluate(async () => {
            if (document.fonts?.ready) await document.fonts.ready;
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          });
        }
        const semantic = await page.evaluate(({ expectedLocales, directions }) => {
          const normalize = value => String(value || "").replace(/\\s+/g, " ").trim();
          const selector = element => {
            if (element.id) return "#" + CSS.escape(element.id);
            const parts = [];
            let current = element;
            while (current && current.nodeType === 1 && parts.length < 6) {
              let part = current.localName;
              if (current.parentElement) {
                const siblings = [...current.parentElement.children].filter(item => item.localName === current.localName);
                if (siblings.length > 1) part += ":nth-of-type(" + (siblings.indexOf(current) + 1) + ")";
              }
              parts.unshift(part);
              current = current.parentElement;
            }
            return parts.join(" > ");
          };
          const textSegments = [];
          const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            const node = walker.currentNode;
            const parent = node.parentElement;
            if (!parent || ["SCRIPT", "STYLE", "TEMPLATE"].includes(parent.tagName)) continue;
            const text = normalize(node.nodeValue);
            if (!text) continue;
            textSegments.push({ selector: selector(parent), text, lang: parent.closest("[lang]")?.getAttribute("lang") || document.documentElement.lang, dir: getComputedStyle(parent).direction });
          }
          const attributes = [];
          for (const element of document.querySelectorAll("[aria-label],[aria-description],[title],[placeholder],[alt]")) {
            for (const name of ["aria-label", "aria-description", "title", "placeholder", "alt"]) if (element.hasAttribute(name)) attributes.push({ selector: selector(element), name, value: element.getAttribute(name) || "", lang: element.closest("[lang]")?.getAttribute("lang") || document.documentElement.lang, dir: getComputedStyle(element).direction });
          }
          const controls = [...document.querySelectorAll("button,a[href],input,select,textarea,[role],img,svg[role=img]")];
          const emptyControls = controls.filter(element => {
            if (element.matches("[aria-hidden=true],[role=presentation],[role=none]")) return false;
            if (element.tagName === "IMG") return !element.getAttribute("alt");
            const labelledBy = (element.getAttribute("aria-labelledby") || "").split(/\\s+/).filter(Boolean).map(id => document.getElementById(id)?.textContent || "").join(" ");
            const name = normalize(element.getAttribute("aria-label") || labelledBy || element.getAttribute("title") || element.getAttribute("placeholder") || element.textContent || (element instanceof HTMLInputElement ? element.value : ""));
            return !name;
          }).slice(0, 100).map(selector);
          const brokenLabelledBy = [...document.querySelectorAll("[aria-labelledby]")].filter(element => (element.getAttribute("aria-labelledby") || "").split(/\\s+/).some(id => id && !document.getElementById(id))).map(selector);
          const idCounts = {};
          for (const element of document.querySelectorAll("[id]")) idCounts[element.id] = (idCounts[element.id] || 0) + 1;
          const duplicateIds = Object.entries(idCounts).filter(([, count]) => count > 1).map(([id, count]) => ({ id, count }));
          const rawKeyPattern = /\\b(?:ui|nav|course|hb|w)\\.[A-Za-z0-9_.-]{2,}\\b|\\b(?:undefined|null)\\b/g;
          const rawKeys = [...new Set([...textSegments.map(item => item.text), ...attributes.map(item => item.value)].flatMap(value => value.match(rawKeyPattern) || []))];
          const metadata = {
            title: document.title,
            description: document.querySelector('meta[name="description"]')?.content || "",
            canonical: document.querySelector('link[rel="canonical"]')?.href || "",
            hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(link => ({ lang: link.hreflang, href: link.href })),
            openGraph: Object.fromEntries([...document.querySelectorAll('meta[property^="og:"]')].map(meta => [meta.getAttribute("property"), meta.content])),
            twitter: Object.fromEntries([...document.querySelectorAll('meta[name^="twitter:"]')].map(meta => [meta.name, meta.content])),
            jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map(script => { try { return { ok: true, value: JSON.parse(script.textContent || "") }; } catch (error) { return { ok: false, error: error.message, raw: script.textContent || "" }; } }),
          };
          const locale = location.pathname.split("/")[1];
          return {
            locale: expectedLocales.includes(locale) ? locale : null,
            lang: document.documentElement.lang,
            dir: document.documentElement.dir,
            expectedDir: directions[locale] || null,
            metadata,
            textSegments,
            attributes,
            emptyControls,
            brokenLabelledBy,
            duplicateIds,
            rawKeys,
            svgText: [...document.querySelectorAll("svg text")].map(element => normalize(element.textContent)).filter(Boolean),
            noscript: [...document.querySelectorAll("noscript")].map(element => element.innerHTML),
            mainTextLength: normalize(document.querySelector("main")?.textContent || document.body?.textContent).length,
            brokenImages: [...document.images].filter(image => image.complete && image.naturalWidth === 0).map(selector),
          };
        }, { expectedLocales, directions });
        const geometry = [];
        for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 1000 }]) {
          await page.setViewportSize(viewport);
          const value = await page.evaluate(() => {
            const normalize = value => String(value || "").replace(/\\s+/g, " ").trim();
          const clipped = [];
          for (const element of document.querySelectorAll("body *")) {
            const style = getComputedStyle(element);
            const text = normalize(element.textContent);
            if (!text || element.children.length > 8) continue;
            const rect = element.getBoundingClientRect();
            const assistiveOffscreen = style.position === "absolute" && (rect.right < 0 || rect.bottom < 0 || style.clip !== "auto" || style.clipPath !== "none");
            if (assistiveOffscreen) continue;
              const horizontal = element.scrollWidth > element.clientWidth + 1;
              const vertical = element.scrollHeight > element.clientHeight + 1;
              const clips = [style.overflow, style.overflowX, style.overflowY].some(value => ["hidden", "clip"].includes(value)) || style.textOverflow === "ellipsis" || style.webkitLineClamp !== "none";
              if ((horizontal || vertical) && clips) clipped.push({ tag: element.tagName.toLowerCase(), id: element.id, className: String(element.className || "").slice(0, 120), text: text.slice(0, 160), horizontal, vertical });
              if (clipped.length >= 100) break;
            }
            return { documentOverflow: document.documentElement.scrollWidth > innerWidth + 1, scrollWidth: document.documentElement.scrollWidth, innerWidth, clipped };
          });
          geometry.push({ viewport, ...value });
        }
        const accessibility = await page.locator("body").ariaSnapshot();
        const representative = semantic.locale === "ar" || ["/en/", "/de/handbook/", "/fr/handbook/", "/zh-Hans/handbook/", "/zh-Hant/handbook/", "/ja/handbook/", "/ko/handbook/"].includes(route);
        if (representative) await page.screenshot({ path: evidenceRoots[route] + "/screenshots/1440x1000-light.png", fullPage: true });
        results.push({ requestedUrl, finalUrl: page.url(), status: response?.status() ?? null, responseUrl: response?.url() ?? null, semantic, geometry, accessibility, consoleEntries, pageErrors, requestFailures });
      } catch (error) {
        results.push({ requestedUrl: base + route, finalUrl: page.url(), status: null, fatal: { name: error.name, message: error.message, stack: error.stack || null }, consoleEntries, pageErrors, requestFailures });
      } finally {
        page.off("console", onConsole);
        page.off("pageerror", onPageError);
        page.off("requestfailed", onRequestFailed);
      }
    }
    return { target: ${JSON.stringify(target)}, javaScriptEnabled: ${JSON.stringify(javaScriptEnabled)}, results };
  }`;
}

function configFor(name, javaScriptEnabled) {
  const path = join(CONFIGS, `${name}.json`);
  const config = {
    browser: {
      browserName: "chromium",
      isolated: true,
      contextOptions: { viewport: { width: 1440, height: 1000 }, javaScriptEnabled, colorScheme: "light" },
    },
    outputDir: posix(join(OUTPUT, "cli", name)),
    outputMode: "file",
    console: { level: "debug" },
    timeouts: { action: 10000, navigation: 30000 },
    codegen: "none",
  };
  atomicWrite(path, JSON.stringify(config, null, 2) + "\n");
  return path;
}

async function crawl({ target, baseUrl, routeList, javaScriptEnabled }) {
  const mode = javaScriptEnabled ? "js" : "nojs";
  const session = `i18n-${snapshotId.slice(-8)}-${target.replace(/[^a-z]/g, "")}-${mode}`;
  const config = configFor(`${target}-${mode}`, javaScriptEnabled);
  const functionPath = join(GENERATED, `${target}-${mode}.fn.js`);
  atomicWrite(functionPath, buildAuditFunction({ baseUrl, routeList, target, javaScriptEnabled }));
  try {
    // The desktop workspace already supplies the Chrome channel.  Explicitly
    // select it so the audit does not silently depend on a separately
    // downloaded Playwright Chromium bundle.
    await runCli([`--session=${session}`, "open", "about:blank", "--browser=chrome", `--config=${config}`]);
    return await runCli([`--session=${session}`, "--raw", "run-code", `--filename=${functionPath}`], { raw: true });
  } finally {
    try { await runCli([`--session=${session}`, "close"]); } catch { /* Preserve the primary error. */ }
  }
}

function persistCrawl(crawlResult) {
  for (const result of crawlResult.results ?? []) {
    const route = new URL(result.requestedUrl).pathname;
    const locale = route.split("/")[1];
    const group = locales.includes(locale) ? locale : "global";
    const directory = join(OUTPUT, crawlResult.target, group, routeId(route));
    mkdirSync(directory, { recursive: true });
    const accessibility = result.accessibility ?? "";
    const semantic = { ...result };
    delete semantic.accessibility;
    atomicWrite(join(directory, `${crawlResult.javaScriptEnabled ? "js" : "nojs"}-semantic.json`), JSON.stringify(semantic, null, 2) + "\n");
    atomicWrite(join(directory, `${crawlResult.javaScriptEnabled ? "js" : "nojs"}-accessibility.yml`), `${accessibility}\n`);

    if (result.fatal) finding({ target: crawlResult.target, locale, route, state: "NOT_ASSESSABLE", category: "navigation-or-collection-failed", observed: result.fatal.message, evidence: posix(relative(ROOT, directory)) });
    else {
      if (result.status !== 200 && !route.includes("__i18n_missing__")) finding({ target: crawlResult.target, locale, route, state: "FAIL", category: "unexpected-http-status", observed: result.status, evidence: posix(relative(ROOT, directory)) });
      if (result.semantic?.locale && result.semantic.lang !== result.semantic.locale) finding({ target: crawlResult.target, locale, route, state: "FAIL", category: "html-lang-mismatch", observed: result.semantic.lang, evidence: posix(relative(ROOT, directory)) });
      if (result.semantic?.expectedDir && result.semantic.dir !== result.semantic.expectedDir) finding({ target: crawlResult.target, locale, route, state: "FAIL", category: "html-dir-mismatch", observed: result.semantic.dir, evidence: posix(relative(ROOT, directory)) });
      if (!result.semantic?.metadata?.canonical && result.semantic?.locale) finding({ target: crawlResult.target, locale, route, state: "FAIL", category: "canonical-missing", evidence: posix(relative(ROOT, directory)) });
      const hreflangs = new Set(result.semantic?.metadata?.hreflang?.map((entry) => entry.lang) ?? []);
      if (result.semantic?.locale) for (const required of [...locales, "x-default"]) if (!hreflangs.has(required)) finding({ target: crawlResult.target, locale, route, state: "FAIL", category: "hreflang-missing", observed: required, evidence: posix(relative(ROOT, directory)) });
      for (const [category, values] of [["raw-key", result.semantic?.rawKeys], ["empty-accessible-name", result.semantic?.emptyControls], ["broken-aria-labelledby", result.semantic?.brokenLabelledBy], ["duplicate-id", result.semantic?.duplicateIds], ["broken-image", result.semantic?.brokenImages]]) {
        if (values?.length) finding({ target: crawlResult.target, locale, route, state: "FAIL", category, observed: JSON.stringify(values).slice(0, 1500), evidence: posix(relative(ROOT, directory)) });
      }
      if ((result.semantic?.mainTextLength ?? 0) < 20) finding({ target: crawlResult.target, locale, route, state: "FAIL", category: "empty-main-content", observed: result.semantic?.mainTextLength, evidence: posix(relative(ROOT, directory)) });
      const requestFailures = (result.requestFailures ?? []).filter((failure) => {
        if (failure.method === "HEAD" && failure.failure === "net::ERR_ABORTED") return false;
        if (!crawlResult.javaScriptEnabled && failure.failure === "csp" && /\.js(?:\?|$)/.test(failure.url)) return false;
        return true;
      });
      const consoleEntries = route.includes("__i18n_missing__") && result.status === 404 ? [] : (result.consoleEntries ?? []);
      if (consoleEntries.length || result.pageErrors?.length || requestFailures.length) finding({ target: crawlResult.target, locale, route, state: "FAIL", category: "console-page-or-network-error", observed: JSON.stringify({ console: consoleEntries, pageErrors: result.pageErrors, requestFailures }).slice(0, 3000), evidence: posix(relative(ROOT, directory)) });
      const geometryFailures = result.geometry?.filter((entry) => entry.documentOverflow || entry.clipped?.length) ?? [];
      if (geometryFailures.length) finding({ target: crawlResult.target, locale, route, state: "FAIL", category: "overflow-or-clipping", observed: JSON.stringify(geometryFailures).slice(0, 3000), evidence: posix(relative(ROOT, directory)) });
    }
  }
}

let server = null;
const crawls = [];
try {
  if (!CLI) finding({ state: "NOT_ASSESSABLE", category: "playwright-cli-unavailable", evidence: "Set PLAYWRIGHT_CLI_WRAPPER or install the bundled playwright skill." });
  if (CLI && (!stale || targetOption === "production")) {
    let localBase = null;
    if (["local-candidate", "both"].includes(targetOption)) {
      server = await staticServer();
      const address = server.address();
      localBase = `http://127.0.0.1:${address.port}`;
      const localRoutes = [...new Set([...routes, "/__i18n_missing__/"])];
      for (const javaScriptEnabled of [true, false]) {
        const result = await crawl({ target: "local-candidate", baseUrl: localBase, routeList: localRoutes, javaScriptEnabled });
        crawls.push(result);
        persistCrawl(result);
      }
    }
    if (["production", "both"].includes(targetOption)) {
      const productionRoutes = [...new Set([...routes, "/__i18n_missing__/"])];
      for (const javaScriptEnabled of [true, false]) {
        const result = await crawl({ target: "production", baseUrl: productionBase, routeList: productionRoutes, javaScriptEnabled });
        crawls.push(result);
        persistCrawl(result);
      }
    }
  }
} catch (error) {
  finding({ target: targetOption === "production" ? "production" : "local-candidate", state: "NOT_ASSESSABLE", category: "playwright-cli-audit-failed", observed: error instanceof Error ? error.message : String(error) });
} finally {
  if (server) await new Promise((resolvePromise) => server.close(resolvePromise));
}

// These states need deliberate interaction/stubbing.  A crawl cannot silently
// promote their absence to PASS; each remains an explicit release dependency.
const requiredDynamicStates = {
  shell: ["desktop-navigation", "mobile-navigation", "language-route-preservation", "theme-light-dark", "progress-reset", "localized-404-error"],
  handbook: ["11-sections", "22-widgets", "correct-incorrect", "retry", "counters-plurals", "horizontal-scroll", "flowchart-accessibility"],
  lab: ["four-stages", "empty", "loading", "success", "no-key", "401", "402", "429", "network-failure", "malformed-json", "provider-error"],
  courses: ["dashboard", "all-lessons", "storage-read-denial", "storage-write-denial", "quiz-correct-incorrect", "pass-fail-retry", "reset", "receipt-invalid-valid", "download-print"],
};
if (crawls.length) finding({ target: targetOption === "both" ? "local-candidate+production" : targetOption, state: "NOT_ASSESSABLE", category: "dynamic-state-evidence-pending", observed: Object.values(requiredDynamicStates).flat().length, evidence: "Semantic route crawl completed, but deliberate state transitions and network-stub flows require recorded evidence before PASS." });

// Pair exact English/target segments by route family + selector.  Exact long
// matches are definite fallback candidates; short/specialist copy stays in the
// human review CSV rather than being guessed here.
for (const crawlResult of crawls.filter((item) => item.javaScriptEnabled)) {
  const byPath = new Map((crawlResult.results ?? []).filter((result) => result.semantic?.locale).map((result) => [new URL(result.requestedUrl).pathname, result]));
  for (const [path, result] of byPath) {
    const locale = result.semantic.locale;
    if (locale === "en") continue;
    const englishPath = path.replace(`/${locale}/`, "/en/");
    const english = byPath.get(englishPath);
    if (!english) continue;
    const englishSegments = new Map((english.semantic.textSegments ?? []).map((segment) => [segment.selector, segment.text]));
    for (const segment of result.semantic.textSegments ?? []) {
      const source = englishSegments.get(segment.selector);
      if (source && source === segment.text && /(?:\b[A-Za-z][A-Za-z'-]*\b[\s,.:;!?—–-]*){4,}/.test(source) && source.length >= 20) finding({ target: crawlResult.target, locale, route: path, state: "FAIL", category: "exact-english-rendered-fallback", observed: source.slice(0, 500), evidence: segment.selector });
    }
  }
}

const status = findings.some((item) => item.state === "NOT_ASSESSABLE") ? "NOT_ASSESSABLE" : findings.some((item) => item.state === "FAIL") ? "FAIL" : "PASS";
const report = {
  schemaVersion: 1,
  snapshotId,
  generatedAt: new Date().toISOString(),
  status,
  target: targetOption,
  cli: CLI,
  routeManifest,
  crawls: crawls.map((crawl) => ({ target: crawl.target, javaScriptEnabled: crawl.javaScriptEnabled, routeCount: crawl.results?.length ?? 0 })),
  requiredDynamicStates,
  findings,
};
atomicWrite(join(OUTPUT, "browser-report.json"), JSON.stringify(report, null, 2) + "\n");
const markdown = [
  "# Browser translation audit",
  "",
  `- Snapshot: \`${snapshotId}\``,
  `- Status: **${status}**`,
  `- Target: ${targetOption}`,
  `- Routes in manifest: ${routes.length}`,
  `- Crawls completed: ${crawls.length}`,
  `- Findings: ${findings.length}`,
  "",
  "## Findings",
  "",
  ...(findings.length ? findings.slice(0, 300).map((item) => `- [${item.state}] ${item.target} ${item.route} ${item.category}: ${item.observed}`) : ["- None."]),
  "",
  status === "PASS" ? "Browser evidence is complete for this snapshot." : "Browser evidence is incomplete or failing; the release must remain NOT READY.",
  "",
].join("\n");
atomicWrite(join(OUTPUT, "browser-summary.md"), markdown);
process.stdout.write(`${JSON.stringify({ status, snapshotId, reportPath: posix(relative(ROOT, join(OUTPUT, "browser-report.json"))), summaryPath: posix(relative(ROOT, join(OUTPUT, "browser-summary.md"))), findings: findings.length })}\n`);
process.exitCode = status === "PASS" ? 0 : 1;
