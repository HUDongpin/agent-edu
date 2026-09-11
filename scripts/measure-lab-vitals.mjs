import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { platform, arch } from "node:os";
import process from "node:process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

export const LAB_VITALS_SCHEMA = "agent-edu.synthetic-lab-vitals.v2";

/**
 * v1 had no network dimension, and one v1 report is archived evidence
 * (docs/release/evidence/lab-vitals-a586b44.json). It is a record of a run
 * that happened, so it keeps validating rather than being rewritten to a
 * shape it was never measured in.
 */
export const LAB_VITALS_SCHEMAS_ACCEPTED = Object.freeze([
  "agent-edu.synthetic-lab-vitals.v1",
  LAB_VITALS_SCHEMA,
]);

/**
 * The network conditions each profile emulates.
 *
 * Until now this harness ran with no network emulation at all, which measures
 * parse and main-thread cost honestly and transfer cost not at all — so the
 * work that makes a document smaller was invisible to it. The two profiles
 * separate those: `none` is what v1 measured, `slow-4g` is what a reader on a
 * phone actually waits for.
 *
 * The slow-4g numbers are Lighthouse's mobile defaults, chosen because the 4x
 * CPU slowdown this harness already applies is the other half of that same
 * profile. Throughput is bytes per second, which is what CDP wants; the
 * kbit/s figures are the ones the profile is normally quoted in.
 */
export const NETWORK_PROFILES = Object.freeze({
  "none": Object.freeze({
    id: "none",
    emulated: false,
    label: "no network emulation",
  }),
  "slow-4g": Object.freeze({
    id: "slow-4g",
    emulated: true,
    label: "Lighthouse mobile: 1.6 Mbit/s down, 750 kbit/s up, 150 ms RTT",
    downloadKbps: 1600,
    uploadKbps: 750,
    latencyMs: 150,
    downloadBytesPerSecond: (1600 * 1000) / 8,
    uploadBytesPerSecond: (750 * 1000) / 8,
  }),
});

export const NETWORK_PROFILE_IDS = Object.freeze(Object.keys(NETWORK_PROFILES));

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
  const summary = {
    lcpMs: round(median(samples.map((sample) => sample.lcpMs)), 1),
    cls: round(median(samples.map((sample) => sample.cls)), 4),
    inpMs: round(median(samples.map((sample) => sample.inpMs)), 1),
  };
  /* Transfer is summarised only when every sample carries it. A v1 sample set
     has no transferBytes and must not be given an invented one — the same
     reason a missing INP is an error here rather than a zero. */
  if (samples.every((sample) => Number.isFinite(sample.transferBytes))) {
    summary.transferBytes = Math.round(median(samples.map((sample) => sample.transferBytes)));
  }
  return summary;
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
    /* Both by default: the pair is the point. One profile alone cannot show
       whether a slower route is slower to parse or slower to arrive. */
    networks: [...NETWORK_PROFILE_IDS],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument === "--headed") options.headless = false;
    else if (argument === "--samples") options.samples = Number(argv[++index]);
    else if (argument.startsWith("--samples=")) options.samples = Number(argument.slice(10));
    else if (argument === "--port") options.port = Number(argv[++index]);
    else if (argument.startsWith("--port=")) options.port = Number(argument.slice(7));
    else if (argument === "--network") options.networks = parseNetworks(argv[++index]);
    else if (argument.startsWith("--network=")) options.networks = parseNetworks(argument.slice(10));
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

function parseNetworks(value) {
  const ids = String(value ?? "").split(",").map((id) => id.trim()).filter(Boolean);
  if (ids.length === 0) {
    throw new Error(`--network needs at least one of: ${NETWORK_PROFILE_IDS.join(", ")}`);
  }
  for (const id of ids) {
    if (!Object.hasOwn(NETWORK_PROFILES, id)) {
      throw new Error(`unknown network profile "${id}"; known: ${NETWORK_PROFILE_IDS.join(", ")}`);
    }
  }
  if (new Set(ids).size !== ids.length) throw new Error("--network lists a profile twice");
  /* Measured in the declared order, so a report always reads none first. */
  return NETWORK_PROFILE_IDS.filter((id) => ids.includes(id));
}

export function assertLabVitalsReport(report, expectedSamples = 3) {
  if (!LAB_VITALS_SCHEMAS_ACCEPTED.includes(report?.schema) || report?.evidenceKind !== "synthetic-lab") {
    throw new Error("lab-vitals report is missing its schema or synthetic-lab evidence label");
  }
  /* v1 measured one implicit set of conditions and keyed the results `modes`;
     v2 measures one set per network profile and keys them by profile id. The
     per-sample checks below are identical either way — only the shape that
     holds them differs, and only an archived v1 report still uses the old
     one. */
  const isV1 = report.schema === "agent-edu.synthetic-lab-vitals.v1";
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
  let measuredProfiles = ["none"];
  if (!isV1) {
    const declared = report?.conditions?.networkProfiles;
    if (!Array.isArray(declared) || declared.length === 0) {
      throw new Error("lab-vitals report declares no network profiles");
    }
    for (const profile of declared) {
      if (!Object.hasOwn(NETWORK_PROFILES, profile?.id ?? "")) {
        throw new Error(`lab-vitals report declares unknown network profile ${JSON.stringify(profile?.id)}`);
      }
      if (profile.emulated && !(profile.downloadBytesPerSecond > 0 && profile.latencyMs >= 0)) {
        throw new Error(`lab-vitals profile ${profile.id} claims emulation without stating its conditions`);
      }
    }
    measuredProfiles = declared.map((profile) => profile.id);
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
    for (const profileId of measuredProfiles) {
      const holder = isV1 ? route.modes : route.profiles?.[profileId];
      if (!holder) {
        throw new Error(`${route.id} has no results for network profile ${profileId}`);
      }
      for (const mode of ["cold", "warm"]) {
        const where = isV1 ? `${route.id}/${mode}` : `${route.id}/${profileId}/${mode}`;
        const result = holder[mode];
        if (result?.samples?.length !== expectedSamples) {
          throw new Error(`${where} has the wrong number of raw samples`);
        }
        for (const sample of result.samples) {
          if (sample.status !== requiredRoute.expectedStatus || sample.cacheControl !== SERVER_CACHE_CONTROL) {
            throw new Error(`${where} has invalid response metadata`);
          }
          if (sample.interactionEvents < 1 || !["event", "first-input"].includes(sample.inpSource)) {
            throw new Error(`${where} has no observed interaction timing source`);
          }
          for (const metric of ["lcpMs", "cls", "inpMs"]) {
            if (!Number.isFinite(sample[metric])) {
              throw new Error(`${where} has no finite raw ${metric}`);
            }
          }
          /* Transfer is the metric the network profiles exist to expose, so
             v2 requires it. A cold sample that transferred nothing did not
             measure a load. */
          if (!isV1) {
            if (!Number.isFinite(sample.transferBytes)) {
              throw new Error(`${where} has no finite raw transferBytes`);
            }
            if (mode === "cold" && sample.transferBytes < 1) {
              throw new Error(`${where} transferred no bytes with the cache disabled`);
            }
          }
        }
        const requiredMedians = isV1 ? ["lcpMs", "cls", "inpMs"] : ["lcpMs", "cls", "inpMs", "transferBytes"];
        for (const metric of requiredMedians) {
          if (!Number.isFinite(result?.medians?.[metric])) {
            throw new Error(`${where} has no finite median ${metric}`);
          }
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
    "Usage: npm run vitals:lab -- [--samples=N] [--port=N] [--network=LIST] [--headed]",
    "",
    "Requires a fresh static out/ directory. The default is 3 cold and 3 warm",
    "samples for each required route, on each network profile.",
    "",
    `  --network  comma-separated, from: ${NETWORK_PROFILE_IDS.join(", ")} (default: all)`,
    "",
    "  none     no emulation. Measures parse and main-thread cost, and is what",
    "           schema v1 reported. Transfer cost is invisible to it.",
    "  slow-4g  1.6 Mbit/s down, 750 kbit/s up, 150 ms RTT — Lighthouse's mobile",
    "           defaults, the other half of the 4x CPU slowdown already applied.",
    "",
    "Both are run by default because the pair is what carries the information:",
    "a route slower on one and not the other is slow for a different reason.",
    "Every sample also records transferBytes, which is what makes a smaller",
    "payload visible to this harness at all.",
    "",
    "JSON is written to stdout; diagnostics go to stderr.",
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

/* Four checks 100 ms apart, as before; what a check has to see is what changed. */
const SETTLE_CHECKS = 4;
const SETTLE_INTERVAL_MS = 100;
const SETTLE_DEADLINE_MS = 30_000;
const IDLE_PROBE_TIMEOUT_MS = 5_000;

/** How many requests the page has started, and which are still on the wire. */
function trackRequests(cdp) {
  const requests = { started: 0, inFlight: new Set() };
  cdp.on("Network.requestWillBeSent", ({ requestId }) => {
    requests.started += 1;
    requests.inFlight.add(requestId);
  });
  const finished = ({ requestId }) => requests.inFlight.delete(requestId);
  cdp.on("Network.loadingFinished", finished);
  cdp.on("Network.loadingFailed", finished);
  return requests;
}

/**
 * One check of the settle loop, as a running count of quiet checks.
 *
 * A check is quiet only when the page had nothing left to run, no request is
 * in flight, and none has started since the check before. Each clause is
 * there for a page the other two would call settled: one still hydrating is
 * busy and fetching nothing, one on a slow network has a request out and
 * nothing new arriving, and one that started and finished a request between
 * two checks shows neither.
 */
export function countQuietChecks(quietSoFar, previous, check) {
  const quiet = previous !== null
    && check.idle
    && check.inFlight === 0
    && check.started === previous.started;
  return quiet ? quietSoFar + 1 : 0;
}

/* Resolves in the page's next idle period, once everything already queued has
   run. Sent over CDP as source text, so it must not close over anything. */
function idleProbe(timeoutMs) {
  return new Promise((resolve) => {
    requestIdleCallback((deadline) => resolve(!deadline.didTimeout), { timeout: timeoutMs });
  });
}

/**
 * Wait until the page has finished everything it will do without input.
 *
 * Resource Timing holding still for 400 ms is not that on a slow CPU: a page
 * busy hydrating is not fetching either, so it passes, and the prefetches its
 * links schedule once mounted arrive after the figure was read. A check here
 * waits for an idle callback first, so time the page spends working does not
 * count as quiet. Hydration, the IntersectionObserver callback and the
 * prefetch it issues run as unbroken main-thread work, except for the one
 * frame between React's commit and the observer's callback, and four checks
 * 100 ms apart cannot all fall inside one frame.
 *
 * The probe goes over the CDP session that reports the requests, so every
 * request the page started before going idle has been counted by the time it
 * returns. On another session that ordering is not guaranteed.
 */
async function waitForSettledPage(cdp, requests, label) {
  const deadline = Date.now() + SETTLE_DEADLINE_MS;
  let previous = null;
  let check = null;
  let quiet = 0;
  while (Date.now() < deadline) {
    const { result, exceptionDetails } = await cdp.send("Runtime.evaluate", {
      expression: `(${idleProbe})(${IDLE_PROBE_TIMEOUT_MS})`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (exceptionDetails) {
      throw new Error(`${label} could not probe the page for idle time: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
    }
    check = { idle: result.value === true, inFlight: requests.inFlight.size, started: requests.started };
    quiet = countQuietChecks(quiet, previous, check);
    if (quiet >= SETTLE_CHECKS) return;
    previous = check;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, SETTLE_INTERVAL_MS));
  }
  throw new Error(
    `${label} never stopped fetching; its transfer figure would be whatever had arrived by the time it was read ` +
    `(last check: ${check?.inFlight ?? "no"} request(s) in flight, main thread ${check?.idle ? "idle" : "busy"})`,
  );
}

async function collectSample(browser, baseUrl, route, cacheMode, iteration, viewport, profile) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript(installVitalsObserver);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const requests = trackRequests(cdp);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: cacheMode === "cold" });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_SLOWDOWN_MULTIPLIER });
  if (profile.emulated) {
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: profile.downloadBytesPerSecond,
      uploadThroughput: profile.uploadBytesPerSecond,
      latency: profile.latencyMs,
    });
  }

  try {
    if (cacheMode === "warm") {
      const prime = await page.goto(`${baseUrl}${route.path}`, { waitUntil: "networkidle" });
      if (prime?.status() !== route.expectedStatus) {
        throw new Error(`${route.id}/${profile.id}/warm prime returned ${prime?.status() ?? "no response"}; expected ${route.expectedStatus}`);
      }
    }

    const response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: "networkidle" });
    const status = response?.status();
    if (status !== route.expectedStatus) {
      throw new Error(`${route.id}/${profile.id}/${cacheMode} returned ${status ?? "no response"}; expected ${route.expectedStatus}`);
    }
    const cacheControl = await response.headerValue("cache-control");
    if (cacheControl !== SERVER_CACHE_CONTROL) {
      throw new Error(`${route.id}/${profile.id}/${cacheMode} returned unexpected Cache-Control ${JSON.stringify(cacheControl)}`);
    }

    const target = page.locator(route.selector).first();
    await target.waitFor({ state: "visible" });

    /* The transfer figure is read here, before the interaction, from the page
     * as it loaded.
     *
     * A <Link> prefetches once React has mounted it and it is within 200 px
     * of the viewport, so the figure is decided by which links the page has
     * seen. Reading it after the interaction made that a race twice over,
     * both reproduced on home with the CPU slowed 12x:
     *
     *  - Playwright scrolls the target into view and clicks in separate
     *    steps. When a frame renders between them, the FAQ is in view with
     *    its answer still closed, About and Teach are inside the margin, and
     *    their 12.9 kB arrives in full, in part or not at all before the
     *    opened answer pushes them out again.
     *  - When hydration finishes after that scroll, the hero's links are
     *    mounted out of view and never prefetch, and home transfers 8 kB of
     *    payload instead of 53.
     *
     * Neither is cured by waiting longer after the click, because both change
     * the page being measured rather than how much of it has arrived. Before
     * the interaction nothing has scrolled: the figure is what a reader who
     * arrives and does nothing loads, and the click, now on a page that has
     * finished hydrating, is left to the timings it is there for. */
    await waitForSettledPage(cdp, requests, `${route.id}/${profile.id}/${cacheMode}`);

    /* What this navigation actually pulled over the wire, after content
       encoding: the document plus every subresource. Read from Resource
       Timing rather than counted from CDP events so it is the browser's own
       accounting, and so a warm sample honestly reports the ~0 it served
       from cache instead of the bytes it would have fetched.
    
       Split by kind, because the total alone is a poor gate. Shared
       JavaScript is most of a route and rarely moves, so a change that
       doubles the document hides inside it as a couple of percent — which is
       exactly the size of the regression this is meant to catch. Broken out,
       the document is its own number and doubling it is unmissable. */
    const transfer = await page.evaluate(() => {
      const kindOf = (url) => {
        const path = new URL(url, location.href).pathname;
        if (path.endsWith(".js")) return "script";
        if (path.endsWith(".css")) return "stylesheet";
        if (path.endsWith(".txt")) return "payload";
        return "other";
      };
      const byKind = { document: 0, script: 0, stylesheet: 0, payload: 0, other: 0 };
      const navigation = performance.getEntriesByType("navigation")[0];
      if (Number.isFinite(navigation?.transferSize)) byKind.document += navigation.transferSize;
      for (const entry of performance.getEntriesByType("resource")) {
        if (Number.isFinite(entry.transferSize)) byKind[kindOf(entry.name)] += entry.transferSize;
      }
      const total = Object.values(byKind).reduce((sum, value) => sum + value, 0);
      return { total, byKind };
    });
    const transferBytes = transfer.total;

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
      throw new Error(`${route.id}/${profile.id}/${cacheMode} browser lacks required LCP, CLS, or Event Timing support`);
    }
    if (!Number.isFinite(metrics.lcpMs)) {
      throw new Error(`${route.id}/${profile.id}/${cacheMode} did not produce LCP`);
    }
    if (!Number.isFinite(metrics.cls)) {
      throw new Error(`${route.id}/${profile.id}/${cacheMode} did not produce CLS`);
    }
    if (!Number.isFinite(metrics.inpMs) || metrics.interactionEvents < 1) {
      throw new Error(`${route.id}/${profile.id}/${cacheMode} did not produce a trusted Event Timing interaction; INP is unavailable, not zero`);
    }

    if (!Number.isFinite(transferBytes)) {
      throw new Error(`${route.id}/${profile.id}/${cacheMode} produced no Resource Timing transfer total`);
    }

    return {
      iteration,
      status,
      cacheControl,
      interaction: route.interaction,
      transferBytes,
      transferByKind: transfer.byKind,
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
      const profiles = {};
      for (const networkId of options.networks) {
        const profile = NETWORK_PROFILES[networkId];
        const modes = {};
        for (const cacheMode of ["cold", "warm"]) {
          const samples = [];
          for (let iteration = 1; iteration <= options.samples; iteration += 1) {
            process.stderr.write(
              `lab-vitals: ${route.id} ${networkId} ${cacheMode} ${iteration}/${options.samples}\n`,
            );
            samples.push(await collectSample(
              browser,
              baseUrl,
              route,
              cacheMode,
              iteration,
              DEFAULT_VIEWPORT,
              profile,
            ));
          }
          modes[cacheMode] = { samples, medians: summarizeSamples(samples) };
        }
        profiles[networkId] = modes;
      }
      routes.push({
        id: route.id,
        path: route.path,
        expectedStatus: route.expectedStatus,
        interaction: route.interaction,
        profiles,
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
        networkProfiles: options.networks.map((id) => NETWORK_PROFILES[id]),
        /* Kept from v1, where it was the string "none", so a reader of either
           schema can see at a glance what was emulated. */
        networkEmulation: options.networks.join(", "),
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
