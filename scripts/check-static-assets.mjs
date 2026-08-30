import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const KIB = 1024;
const MIB = 1024 * KIB;
const TEN_PERCENT = 1.1;

function baselineWithTenPercentHeadroom(baseline) {
  return { baseline, limit: Math.ceil(baseline * TEN_PERCENT) };
}

// Audited against the optimized 2026-08-26 Node 24 / Next 16.3.1 export at
// codex/platform-release-hardening. These are uncompressed emitted bytes, not
// transfer sizes. Updating one of these post-optimization baselines is a review
// event: record the new clean build rather than increasing a percentage cap.
export const BUDGETS = {
  nextStaticBytes: baselineWithTenPercentHeadroom(4_811_694),
  javascriptBytes: baselineWithTenPercentHeadroom(4_261_292),
  cssBytes: baselineWithTenPercentHeadroom(550_402),
  largestNextStaticBytes: baselineWithTenPercentHeadroom(234_172),
  emittedPublicBytes: baselineWithTenPercentHeadroom(14_813_973),
  largestPublicMediaBytes: { baseline: 495_549, limit: 500 * KIB },
  largestHtmlRscBytes: { baseline: 383_772, limit: 500 * KIB },
  largestSitemapShardBytes: { baseline: 21_785, limit: 500 * KIB },
  routePayloadBytes: {
    baseline: 345_648_063,
    limitForRouteCount: (routeCount) => routeCount * 550 * KIB,
  },
  totalExportBytes: {
    baseline: 365_273_730,
    limitForRouteCount: (routeCount) => 64 * MIB + routeCount * 600 * KIB,
  },
};

// Media-only totals below public/courses/<course-id>/ in the same audited
// export. A new course media directory deliberately has no implicit allowance.
// It must be optimized, measured, and added here in a reviewed change.
export const COURSE_MEDIA_BASELINES = {
  "agent-orchestration": 0,
  // These three audited source totals stay dormant while the courses are
  // blocked. They make a reviewed registry state flip possible without an
  // unrelated "unknown media course" failure; the same 500 KiB per-file and
  // 10% per-course limits still apply once a course is published.
  claude: 4_938_362,
  "claude-income": 781_058,
  codex: 3_239_504,
  cursor: 5_128_836,
  github: 2_017_148,
  grok: 3_639_853,
  "make-money-with-codex": 1_430_484,
  mcp: 2_035_856,
  prompts: 1_830_206,
  rag: 1_256_370,
  "software-engineering": 281_734,
};

const PUBLIC_MEDIA_EXTENSIONS = new Set([
  ".avif", ".gif", ".jpeg", ".jpg", ".m4a", ".mov", ".mp3", ".mp4",
  ".ogg", ".png", ".svg", ".wav", ".webm", ".webp",
]);

const BLOCKED_CLIENT_SENTINELS = [
  { courseId: "codex", id: "blocked-gate-reason-codex", value: "capture-evidence-required" },
  { courseId: "claude", id: "blocked-gate-reason-claude", value: "publication-permission-required" },
  { courseId: "cursor", id: "blocked-gate-reason-cursor", value: "publication-rights-evidence-required" },
  { courseId: "codex", id: "blocked-curriculum-codex", value: "practice-meet-codex" },
  { courseId: "claude", id: "blocked-curriculum-claude", value: "practice-choose-your-surface" },
  { courseId: "cursor", id: "blocked-curriculum-cursor", value: "practice-orient-privacy" },
  {
    courseId: "codex",
    id: "blocked-body-codex",
    value: "The surface does not change the responsibility model",
  },
  {
    courseId: "claude",
    id: "blocked-body-claude",
    value: "Claude is a family of working surfaces",
  },
  {
    courseId: "cursor",
    id: "blocked-body-cursor",
    value: "Privacy Mode is not local-only mode",
  },
];

function kindFor(path) {
  const extension = extname(path).toLowerCase();
  if ([".js", ".mjs"].includes(extension)) return "javascript";
  if (extension === ".css") return "css";
  if ([".html", ".htm"].includes(extension)) return "html";
  if ([".rsc", ".txt"].includes(extension)) return "rsc";
  if ([".woff", ".woff2", ".ttf", ".otf"].includes(extension)) return "font";
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg"].includes(extension)) {
    return "image";
  }
  return extension.slice(1) || "other";
}

function regularFilesBelow(root) {
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile()) {
        const info = lstatSync(absolute);
        if (!info.isFile() || info.isSymbolicLink()) {
          throw new Error(`non-regular export asset: ${absolute}`);
        }
        files.push({ absolute, bytes: info.size });
      } else {
        throw new Error(`non-regular export asset: ${absolute}`);
      }
    }
  };
  visit(root);
  return files;
}

function loadBlockedCourseIds(projectRoot) {
  const registryPath = join(projectRoot, "config", "course-release-surface.json");
  if (!existsSync(registryPath)) {
    throw new Error("course release registry is missing");
  }
  const registry = JSON.parse(readFileSync(registryPath, "utf8"));
  if (!Array.isArray(registry.courses)) {
    throw new Error("course release registry has an invalid shape");
  }
  const blockedIds = registry.courses
    .filter((course) => course.state === "blocked")
    .map((course) => course.id);
  return new Set(blockedIds);
}

function blockedCourseIdForPath(path, blockedIds) {
  const courseId = /^courses\/([^/]+)\//.exec(path)?.[1];
  return courseId && blockedIds.has(courseId) ? courseId : null;
}

function normalizedPath(projectRoot, absolute, buildId) {
  return relative(projectRoot, absolute).split(sep).join("/")
    .replace(`out/_next/static/${buildId}/`, "out/_next/static/<build-id>/");
}

function evaluatedBudget(name, actual, routeCount) {
  const budget = BUDGETS[name];
  const limit = budget.limitForRouteCount
    ? budget.limitForRouteCount(routeCount)
    : budget.limit;
  return {
    baseline: budget.baseline,
    limit,
    headroomBytes: limit - budget.baseline,
    headroomPercent: Number((((limit / budget.baseline) - 1) * 100).toFixed(1)),
    actual,
    pass: actual <= limit,
  };
}

function isPublicMedia(file) {
  return PUBLIC_MEDIA_EXTENSIONS.has(extname(file.outRelative).toLowerCase());
}

function courseIdForMedia(file) {
  if (file.category !== "emitted-public" || !isPublicMedia(file)) return null;
  return /^courses\/([^/]+)\//.exec(file.outRelative)?.[1] ?? null;
}

function total(files, predicate = () => true) {
  return files.filter(predicate).reduce((sum, file) => sum + file.bytes, 0);
}

function largest(files) {
  return files.length === 0 ? 0 : Math.max(...files.map((file) => file.bytes));
}

export function checkStaticAssets(options = {}) {
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const out = join(projectRoot, "out");
  const staticRoot = join(out, "_next", "static");
  const publicRoot = join(projectRoot, "public");
  const prerenderPath = join(projectRoot, ".next", "prerender-manifest.json");
  const buildIdPath = join(projectRoot, ".next", "BUILD_ID");
  if (
    !existsSync(out) ||
    !existsSync(staticRoot) ||
    !existsSync(publicRoot) ||
    !existsSync(prerenderPath) ||
    !existsSync(buildIdPath)
  ) {
    throw new Error("fresh build output is missing; run npm run build before npm run assets:check");
  }

  const prerender = JSON.parse(readFileSync(prerenderPath, "utf8"));
  if (!prerender.routes || Object.keys(prerender.routes).length === 0) {
    throw new Error("the Next prerender manifest has no routes");
  }
  const generatedRouteCount = Object.keys(prerender.routes).length;

  const buildId = readFileSync(buildIdPath, "utf8").trim();
  if (!buildId || buildId.includes("/") || buildId.includes("\\")) {
    throw new Error("the Next build ID is missing or invalid");
  }

  const blockedCourseIds = loadBlockedCourseIds(projectRoot);
  const publicFiles = regularFilesBelow(publicRoot).map((file) => ({
    ...file,
    relative: relative(publicRoot, file.absolute).split(sep).join("/"),
  }));
  const excludedBlockedSourceAssets = publicFiles.filter((file) => (
    blockedCourseIdForPath(file.relative, blockedCourseIds)
  ));
  const publicByRelativePath = new Map(publicFiles
    .filter((file) => !blockedCourseIdForPath(file.relative, blockedCourseIds))
    .map((file) => [file.relative, file]));
  const allFiles = regularFilesBelow(out).map((file) => {
    const outRelative = relative(out, file.absolute).split(sep).join("/");
    const blockedCourseId = blockedCourseIdForPath(outRelative, blockedCourseIds);
    if (blockedCourseId) {
      throw new Error(`blocked course asset was emitted: out/${outRelative}`);
    }
    const category = outRelative.startsWith("_next/static/")
      ? "next-static"
      : publicByRelativePath.has(outRelative)
        ? "emitted-public"
        : "route-payload";
    return {
      path: normalizedPath(projectRoot, file.absolute, buildId),
      bytes: file.bytes,
      kind: kindFor(file.absolute),
      category,
      outRelative,
    };
  });
  if (allFiles.length === 0) throw new Error("out contains no files");

  for (const file of allFiles) {
    if (!["javascript", "html", "rsc"].includes(file.kind)) continue;
    const bytes = readFileSync(join(out, file.outRelative));
    for (const courseId of blockedCourseIds) {
      if (bytes.includes(Buffer.from(`/courses/${courseId}/`))) {
        throw new Error(
          `blocked course media path entered the public export: ${courseId} in out/${file.outRelative}`,
        );
      }
    }
    for (const sentinel of BLOCKED_CLIENT_SENTINELS) {
      if (!blockedCourseIds.has(sentinel.courseId)) continue;
      if (bytes.includes(Buffer.from(sentinel.value))) {
        throw new Error(
          `blocked course internals entered the public export: ${sentinel.id} in out/${file.outRelative}`,
        );
      }
    }
  }

  const byOutRelative = new Map(allFiles.map((file) => [file.outRelative, file]));
  for (const [path, source] of publicByRelativePath) {
    const emitted = byOutRelative.get(path);
    if (!emitted) throw new Error(`public asset was not emitted: public/${path}`);
    if (
      emitted.bytes !== source.bytes ||
      !readFileSync(join(out, path)).equals(readFileSync(source.absolute))
    ) {
      throw new Error(`emitted public asset contents drifted: public/${path}`);
    }
  }

  const nextStatic = allFiles.filter((file) => file.category === "next-static");
  const emittedPublic = allFiles.filter((file) => file.category === "emitted-public");
  const routePayloads = allFiles.filter((file) => file.category === "route-payload");
  const publicMedia = emittedPublic.filter(isPublicMedia);
  const htmlRscPayloads = routePayloads.filter((file) => ["html", "rsc"].includes(file.kind));
  const sitemapShards = routePayloads.filter((file) => (
    file.kind === "xml" && file.outRelative.startsWith("sitemaps/")
  ));
  if (nextStatic.length === 0) throw new Error("out/_next/static contains no files");
  if (routePayloads.length === 0) throw new Error("out contains no route payloads");
  if (htmlRscPayloads.length === 0) throw new Error("out contains no HTML/RSC route payloads");
  if (sitemapShards.length === 0) {
    throw new Error("out contains no split sitemap shards below out/sitemaps");
  }

  const courseMediaActuals = Object.fromEntries(
    [...emittedPublic.reduce((totals, file) => {
      const courseId = courseIdForMedia(file);
      if (courseId) totals.set(courseId, (totals.get(courseId) ?? 0) + file.bytes);
      return totals;
    }, new Map())].sort(([left], [right]) => left.localeCompare(right)),
  );
  const unknownCourseMedia = Object.keys(courseMediaActuals)
    .filter((courseId) => !(courseId in COURSE_MEDIA_BASELINES));
  const courseMediaBudgets = Object.fromEntries(
    Object.entries(COURSE_MEDIA_BASELINES).map(([courseId, baseline]) => {
      const limit = Math.ceil(baseline * TEN_PERCENT);
      const actual = courseMediaActuals[courseId] ?? 0;
      return [courseId, {
        baseline,
        limit,
        headroomBytes: limit - baseline,
        headroomPercent: baseline === 0 ? 0 : 10,
        actual,
        pass: actual <= limit,
      }];
    }),
  );

  const actuals = {
    nextStaticBytes: total(nextStatic),
    javascriptBytes: total(nextStatic, (file) => file.kind === "javascript"),
    cssBytes: total(nextStatic, (file) => file.kind === "css"),
    largestNextStaticBytes: largest(nextStatic),
    emittedPublicBytes: total(emittedPublic),
    largestPublicMediaBytes: largest(publicMedia),
    largestHtmlRscBytes: largest(htmlRscPayloads),
    largestSitemapShardBytes: largest(sitemapShards),
    routePayloadBytes: total(routePayloads),
    totalExportBytes: total(allFiles),
  };
  const budgets = Object.fromEntries(
    Object.entries(actuals).map(([name, actual]) => [
      name,
      evaluatedBudget(name, actual, generatedRouteCount),
    ]),
  );
  const passed = (
    Object.values(budgets).every((budget) => budget.pass) &&
    Object.values(courseMediaBudgets).every((budget) => budget.pass) &&
    unknownCourseMedia.length === 0
  );

  const inventory = {
    schemaVersion: 3,
    source: "out",
    buildIdNormalized: true,
    generatedRouteCount,
    categories: {
      nextStatic: { fileCount: nextStatic.length, bytes: actuals.nextStaticBytes },
      emittedPublic: { fileCount: emittedPublic.length, bytes: actuals.emittedPublicBytes },
      routePayloads: { fileCount: routePayloads.length, bytes: actuals.routePayloadBytes },
      htmlRscPayloads: { fileCount: htmlRscPayloads.length, bytes: total(htmlRscPayloads) },
      sitemapShards: { fileCount: sitemapShards.length, bytes: total(sitemapShards) },
      publicMedia: { fileCount: publicMedia.length, bytes: total(publicMedia) },
      excludedBlockedSourceAssets: {
        fileCount: excludedBlockedSourceAssets.length,
        bytes: total(excludedBlockedSourceAssets),
      },
    },
    summary: {
      fileCount: allFiles.length,
      ...actuals,
    },
    budgets,
    courseMediaBudgets,
    unknownCourseMedia,
    files: allFiles
      .map((file) => ({
        path: file.path,
        bytes: file.bytes,
        kind: file.kind,
        category: file.category,
      }))
      .sort((left, right) => left.path.localeCompare(right.path)),
    passed,
  };
  if (!passed) {
    const failed = Object.entries(budgets)
      .filter(([, budget]) => !budget.pass)
      .map(([name, budget]) => `${name} ${budget.actual} > ${budget.limit}`);
    failed.push(...Object.entries(courseMediaBudgets)
      .filter(([, budget]) => !budget.pass)
      .map(([courseId, budget]) => (
        `courseMediaBytes.${courseId} ${budget.actual} > ${budget.limit}`
      )));
    failed.push(...unknownCourseMedia.map((courseId) => (
      `courseMediaBytes.${courseId} has no audited baseline`
    )));
    throw new Error(`static asset budget exceeded: ${failed.join(", ")}`);
  }
  if (options.emit !== false) {
    const output = resolve(
      options.output ?? join(projectRoot, "tmp", "release", "static-asset-inventory.json"),
    );
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, `${JSON.stringify(inventory, null, 2)}\n`, { mode: 0o600 });
    console.log(
      `assets: PASS — ${generatedRouteCount} routes, ${allFiles.length} files, `
      + `${actuals.totalExportBytes} bytes; inventory ${output}`,
    );
  }
  return inventory;
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  try {
    checkStaticAssets();
  } catch (error) {
    console.error(`assets: FAIL — ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
