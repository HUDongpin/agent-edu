import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { platform, arch } from "node:os";
import process from "node:process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

export const LAB_VITALS_SCHEMA = "agent-edu.synthetic-lab-vitals.v1";

export const LAB_VITALS_ROUTES = Object.freeze([
  { id: "home", path: "/en/", expectedStatus: 200, selector: ".faq summary", interaction: "open first FAQ" },
  { id: "handbook", path: "/en/handbook/", expectedStatus: 200, selector: "#tab-code", interaction: "select Handbook code tab" },
  { id: "lab", path: "/en/lab/", expectedStatus: 200, selector: '.steps [role="tab"]:nth-child(2)', interaction: "select Lab rules stage" },
  { id: "build", path: "/en/build/", expectedStatus: 200, selector: ".themebtn", interaction: "toggle theme while viewing Build" },
  { id: "teach", path: "/en/teach/", expectedStatus: 200, selector: ".themebtn", interaction: "toggle theme while viewing Teach" },
  { id: "404", path: "/missing-lab-vitals/", expectedStatus: 404, selector: '.recovery404 a[href="/en/"]', interaction: "activate English recovery link" },
]);

const DEFAULT_VIEWPORT = Object.freeze({ width: 390, height: 844 });
const SERVER_CACHE_CONTROL = "public, max-age=3600";
const CPU_SLOWDOWN_MULTIPLIER = 4;

export function median(values) {
  if (!Array.isArray(values) || values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("median requires one or more finite numbers");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function summarizeSamples(samples) {
  if (!Array.isArray(samples) || samples.length === 0) {
    throw new Error("cannot summarize an empty lab-vitals sample set");
  }
  for (const sample of samples) {
    for (const metric of ["lcpMs", "cls", "inpMs"]) {
      if (!Number.isFinite(sample[metric])) {
        throw new Error(`sample ${sample.iteration ?? "?"} has no finite ${metric}`);
      }
    }
  }
  return {
    lcpMs: round(median(samples.map((sample) => sample.lcpMs)), 1),
    cls: round(median(samples.map((sample) => sample.cls)), 4),
    inpMs: round(median(samples.map((sample) => sample.inpMs)), 1),
  };
}

export function fingerprintEntries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error("static export fingerprint requires at least one file");
  }
  const sorted = [...entries].sort((left, right) => left.path.localeCompare(right.path, "en"));
  const hash = createHash("sha256");
  let totalBytes = 0;
  let previousPath = null;
  for (const entry of sorted) {
    if (!entry.path || entry.path === previousPath || !(entry.content instanceof Uint8Array)) {
      throw new Error("static export fingerprint entries need unique paths and byte content");
    }
    const content = Buffer.from(entry.content);
    const pathBytes = Buffer.byteLength(entry.path);
    hash.update(`file\0${pathBytes}\0${entry.path}\0${content.length}\0`);
    hash.update(content);
    hash.update("\0");
    totalBytes += content.length;
    previousPath = entry.path;
  }
  return {
    algorithm: "sha256",
    digest: hash.digest("hex"),
    fileCount: sorted.length,
    totalBytes,
  };
}

export function fingerprintStaticExport(
  rootDir = resolve("out"),
  buildIdPath = resolve(".next/BUILD_ID"),
) {
  if (!existsSync(rootDir) || !lstatSync(rootDir).isDirectory()) {
    throw new Error("out/ is missing; run npm run build from the frozen candidate first");
  }
  if (!existsSync(buildIdPath) || !lstatSync(buildIdPath).isFile()) {
    throw new Error(".next/BUILD_ID is missing; run npm run build from the frozen candidate first");
  }
  const nextBuildId = readFileSync(buildIdPath, "utf8").trim();
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(nextBuildId)) {
    throw new Error(".next/BUILD_ID is empty or malformed");
  }

  const files = [];
  function walk(directory, prefix = "") {
    const children = readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name, "en"));
    for (const child of children) {
      const relativePath = prefix ? `${prefix}/${child.name}` : child.name;
      const absolutePath = resolve(directory, child.name);
      if (child.isSymbolicLink()) {
        throw new Error(`out/ contains unsupported symbolic link: ${relativePath}`);
      }
      if (child.isDirectory()) walk(absolutePath, relativePath);
      else if (child.isFile()) files.push({ path: relativePath, content: readFileSync(absolutePath) });
      else throw new Error(`out/ contains unsupported entry: ${relativePath}`);
    }
  }
  walk(rootDir);
  return { nextBuildId, export: fingerprintEntries(files) };
}

export function parseCliArgs(argv) {
  const options = {
    samples: 3,
    port: Number(process.env.AGENT_EDU_VITALS_PORT || 4174),
    headless: true,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--headed") options.headless = false;
    else if (argument === "--samples") options.samples = Number(argv[++index]);
    else if (argument.startsWith("--samples=")) options.samples = Number(argument.slice(10));
    else if (argument === "--port") options.port = Number(argv[++index]);
    else if (argument.startsWith("--port=")) options.port = Number(argument.slice(7));
    else throw new Error(`unknown argument: ${argument}`);
  }
  if (!Number.isInteger(options.samples) || options.samples < 1) {
    throw new Error("--samples must be a positive integer (the release protocol requires at least 3)");
  }
  if (!Number.isInteger(options.port) || options.port < 1024 || options.port > 65535) {
    throw new Error("--port must be an integer from 1024 through 65535");
  }
  return options;
}

export function assertLabVitalsReport(report, expectedSamples = 3) {
  if (report?.schema !== LAB_VITALS_SCHEMA || report?.evidenceKind !== "synthetic-lab") {
    throw new Error("lab-vitals report is missing its schema or synthetic-lab evidence label");
  }
  if (!/^[0-9a-f]{40}$/.test(report?.source?.commitSha ?? "")) {
    throw new Error("lab-vitals report has no full source commit SHA");
  }
  if (report?.conditions?.samplesPerMode !== expectedSamples) {
    throw new Error("lab-vitals report sample-count metadata does not match the run");
  }
  if (!report?.runtime?.browser?.version || !report?.runtime?.node || !report?.runtime?.platform) {
    throw new Error("lab-vitals report is missing runtime/browser/platform metadata");
  }
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(report?.artifact?.nextBuildId ?? "")) {
    throw new Error("lab-vitals report is missing the measured Next build ID");
  }
  const exportFingerprint = report?.artifact?.export;
  if (
    exportFingerprint?.algorithm !== "sha256"
    || !/^[0-9a-f]{64}$/.test(exportFingerprint?.digest ?? "")
    || !Number.isInteger(exportFingerprint?.fileCount)
    || exportFingerprint.fileCount < 1
    || !Number.isInteger(exportFingerprint?.totalBytes)
    || exportFingerprint.totalBytes < 1
  ) {
    throw new Error("lab-vitals report is missing a valid out/ export fingerprint");
  }
  if (report?.routes?.length !== LAB_VITALS_ROUTES.length) {
    throw new Error("lab-vitals report does not cover the required route matrix");
  }
  for (let routeIndex = 0; routeIndex < report.routes.length; routeIndex += 1) {
    const route = report.routes[routeIndex];
    const requiredRoute = LAB_VITALS_ROUTES[routeIndex];
    if (
      route.id !== requiredRoute.id
      || route.path !== requiredRoute.path
      || route.expectedStatus !== requiredRoute.expectedStatus
    ) {
      throw new Error(`lab-vitals report route ${routeIndex + 1} does not match the required matrix`);
    }
    for (const mode of ["cold", "warm"]) {
      const result = route.modes?.[mode];
      if (result?.samples?.length !== expectedSamples) {
        throw new Error(`${route.id}/${mode} has the wrong number of raw samples`);
      }
      for (const sample of result.samples) {
        if (sample.status !== requiredRoute.expectedStatus || sample.cacheControl !== SERVER_CACHE_CONTROL) {
          throw new Error(`${route.id}/${mode} has invalid response metadata`);
        }
        if (sample.interactionEvents < 1 || !["event", "first-input"].includes(sample.inpSource)) {
          throw new Error(`${route.id}/${mode} has no observed interaction timing source`);
        }
        for (const metric of ["lcpMs", "cls", "inpMs"]) {
          if (!Number.isFinite(sample[metric])) {
            throw new Error(`${route.id}/${mode} has no finite raw ${metric}`);
          }
        }
      }
      for (const metric of ["lcpMs", "cls", "inpMs"]) {
        if (!Number.isFinite(result?.medians?.[metric])) {
          throw new Error(`${route.id}/${mode} has no finite median ${metric}`);
        }
      }
    }
  }
  return report;
}

function round(value, decimals) {
  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
}

function usage() {
  return [
    "Usage: npm run vitals:lab -- [--samples=N] [--port=N] [--headed]",
    "",
    "Requires a fresh static out/ directory. The default is 3 cold and 3 warm",
    "samples for each required route. JSON is written to stdout; diagnostics go to stderr.",
  ].join("\n");
}

function sourceMetadata() {
  const commitSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const dirty = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim().length > 0;
  const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8"));
  return { commitSha, dirty, nextVersion: packageJson.dependencies.next };
}

async function startStaticServer(port) {
  const child = spawn(process.execPath, ["scripts/serve-out.mjs"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      AGENT_EDU_TEST_PORT: String(port),
      AGENT_EDU_TEST_CACHE: "warmable",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += String(chunk); });
  child.stderr.on("data", (chunk) => { output += String(chunk); });
  const baseUrl = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`static server exited before readiness: ${output.trim()}`);
    }
    try {
      const response = await fetch(`${baseUrl}/en/`, { method: "HEAD" });
      if (response.status === 200) return { child, baseUrl };
    } catch {
      // The bounded readiness loop is the only retry in this local harness.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  child.kill("SIGTERM");
  throw new Error(`static server did not become ready within 15 seconds: ${output.trim()}`);
}

async function stopStaticServer(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolvePromise) => child.once("exit", resolvePromise)),
    new Promise((resolvePromise) => setTimeout(resolvePromise, 3_000)),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

function installVitalsObserver() {
  const supported = PerformanceObserver.supportedEntryTypes;
  const state = {
    supported: {
      lcp: supported.includes("largest-contentful-paint"),
      cls: supported.includes("layout-shift"),
      inp: supported.includes("event") && supported.includes("first-input"),
    },
    lcpMs: null,
    cls: 0,
    inpMs: null,
    inpSource: null,
    interactionEvents: 0,
  };
  Object.defineProperty(window, "__agentEduLabVitals", {
    value: state,
    configurable: false,
    enumerable: false,
    writable: false,
  });

  if (state.supported.lcp) {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) state.lcpMs = entry.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  }
  if (state.supported.cls) {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) state.cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  }
  if (state.supported.inp) {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        state.interactionEvents += 1;
        state.inpMs = Math.max(state.inpMs ?? 0, entry.duration);
        state.inpSource = "first-input";
      }
    }).observe({ type: "first-input", buffered: true });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.interactionId > 0) {
          state.interactionEvents += 1;
          state.inpMs = Math.max(state.inpMs ?? 0, entry.duration);
          state.inpSource = "event";
        }
      }
    }).observe({ type: "event", buffered: true, durationThreshold: 16 });
  }
}

async function collectSample(browser, baseUrl, route, cacheMode, iteration, viewport) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(installVitalsObserver);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: cacheMode === "cold" });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_SLOWDOWN_MULTIPLIER });

  try {
    if (cacheMode === "warm") {
      const prime = await page.goto(`${baseUrl}${route.path}`, { waitUntil: "networkidle" });
      if (prime?.status() !== route.expectedStatus) {
        throw new Error(`${route.id}/warm prime returned ${prime?.status() ?? "no response"}; expected ${route.expectedStatus}`);
      }
    }

    const response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: "networkidle" });
    const status = response?.status();
    if (status !== route.expectedStatus) {
      throw new Error(`${route.id}/${cacheMode} returned ${status ?? "no response"}; expected ${route.expectedStatus}`);
    }
    const cacheControl = await response.headerValue("cache-control");
    if (cacheControl !== SERVER_CACHE_CONTROL) {
      throw new Error(`${route.id}/${cacheMode} returned unexpected Cache-Control ${JSON.stringify(cacheControl)}`);
    }

    const target = page.locator(route.selector).first();
    await target.waitFor({ state: "visible" });
    const tagName = await target.evaluate((element) => element.tagName);
    if (tagName === "A") {
      await target.evaluate((element) => {
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noopener");
      });
    }
    await target.click();
    await page.waitForTimeout(500);

    const metrics = await page.evaluate(() => window.__agentEduLabVitals);
    if (!metrics?.supported?.lcp || !metrics.supported.cls || !metrics.supported.inp) {
      throw new Error(`${route.id}/${cacheMode} browser lacks required LCP, CLS, or Event Timing support`);
    }
    if (!Number.isFinite(metrics.lcpMs)) {
      throw new Error(`${route.id}/${cacheMode} did not produce LCP`);
    }
    if (!Number.isFinite(metrics.cls)) {
      throw new Error(`${route.id}/${cacheMode} did not produce CLS`);
    }
    if (!Number.isFinite(metrics.inpMs) || metrics.interactionEvents < 1) {
      throw new Error(`${route.id}/${cacheMode} did not produce a trusted Event Timing interaction; INP is unavailable, not zero`);
    }

    return {
      iteration,
      status,
      cacheControl,
      interaction: route.interaction,
      interactionEvents: metrics.interactionEvents,
      inpSource: metrics.inpSource,
      lcpMs: round(metrics.lcpMs, 1),
      cls: round(metrics.cls, 4),
      inpMs: round(metrics.inpMs, 1),
    };
  } finally {
    await context.close();
  }
}

export async function runLabVitals(options) {
  const source = sourceMetadata();
  const artifact = fingerprintStaticExport();
  const { child, baseUrl } = await startStaticServer(options.port);
  let browser;
  try {
    browser = await chromium.launch({ headless: options.headless });
    const routes = [];
    for (const route of LAB_VITALS_ROUTES) {
      const modes = {};
      for (const cacheMode of ["cold", "warm"]) {
        const samples = [];
        for (let iteration = 1; iteration <= options.samples; iteration += 1) {
          process.stderr.write(`lab-vitals: ${route.id} ${cacheMode} ${iteration}/${options.samples}\n`);
          samples.push(await collectSample(
            browser,
            baseUrl,
            route,
            cacheMode,
            iteration,
            DEFAULT_VIEWPORT,
          ));
        }
        modes[cacheMode] = { samples, medians: summarizeSamples(samples) };
      }
      routes.push({
        id: route.id,
        path: route.path,
        expectedStatus: route.expectedStatus,
        interaction: route.interaction,
        modes,
      });
    }
    const report = {
      schema: LAB_VITALS_SCHEMA,
      evidenceKind: "synthetic-lab",
      generatedAtUtc: new Date().toISOString(),
      source: { commitSha: source.commitSha, dirty: source.dirty },
      artifact,
      runtime: {
        node: process.version,
        next: source.nextVersion,
        platform: platform(),
        arch: arch(),
        browser: { name: "chromium", version: browser.version(), headless: options.headless },
      },
      conditions: {
        viewport: DEFAULT_VIEWPORT,
        samplesPerMode: options.samples,
        cache: {
          serverHeader: SERVER_CACHE_CONTROL,
          cold: "Chromium cache disabled with CDP",
          warm: "Chromium cache enabled and route primed once before measurement",
        },
        networkEmulation: "none",
        cpuSlowdownMultiplier: CPU_SLOWDOWN_MULTIPLIER,
        thresholds: "none; this harness verifies measurement and schema only",
      },
      routes,
    };
    return assertLabVitalsReport(report, options.samples);
  } finally {
    if (browser) await browser.close();
    await stopStaticServer(child);
  }
}

async function main() {
  try {
    const options = parseCliArgs(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(`${usage()}\n`);
      return;
    }
    const report = await runLabVitals(options);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`lab-vitals: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
