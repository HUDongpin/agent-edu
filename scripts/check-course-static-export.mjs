#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function walk(directory, files = []) {
  if (!existsSync(directory)) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path, files);
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function routeFile(out, locale, page) {
  return join(out, locale, page, "index.html");
}

function canonicalFromHtml(html) {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return match?.[1] ?? null;
}

function jsonLdTypes(html) {
  const types = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(match[1]);
      if (typeof data?.["@type"] === "string") types.push(data["@type"]);
    } catch {
      types.push("__invalid__");
    }
  }
  return types;
}

export function containsUnresolvedReleaseMarker(html) {
  // TODO and TBD are repository conventions for explicit, uppercase
  // development markers. Case-insensitive matching turns ordinary Spanish
  // prose such as "Todo el contenido" into a false release failure.
  return /\bcapture-required\b|\bTODO\b|\bTBD\b/.test(html);
}

export async function checkCourseStaticExport(projectRoot = ROOT) {
  const root = resolve(projectRoot);
  const out = join(root, "out");
  if (!existsSync(out)) throw new Error("out/ is missing; run npm run build first.");
  const cache = `course-static-export=${Date.now()}`;
  const [i18n, seo, courses, registry, sitemapModule] = await Promise.all([
    import(`${pathToFileURL(join(root, "lib/i18n.ts")).href}?${cache}`),
    import(`${pathToFileURL(join(root, "lib/seo.ts")).href}?${cache}`),
    import(`${pathToFileURL(join(root, "lib/courses.ts")).href}?${cache}`),
    import(`${pathToFileURL(join(root, "lib/course-kit/registry.ts")).href}?${cache}`),
    import(`${pathToFileURL(join(root, "app/sitemap.ts")).href}?${cache}`),
  ]);
  const issues = [];
  const expectedLocalizedRoutes = i18n.LOCALE_CODES.flatMap((locale) => (
    seo.PAGES.map((page) => ({ locale, page, file: routeFile(out, locale, page) }))
  ));
  for (const route of expectedLocalizedRoutes) {
    if (!existsSync(route.file)) {
      issues.push(`missing exported route /${route.locale}/${route.page}`);
    } else if (statSync(route.file).size < 100) {
      issues.push(`empty exported route /${route.locale}/${route.page}`);
    }
  }

  const pageSet = new Set(seo.PAGES);
  for (const course of courses.TOP_LEVEL_COURSES) {
    if (String(course.href).includes("#")) continue;
    const base = String(course.href).replace(/^\//, "");
    const expectedPages = [base, ...course.moduleIds.map((moduleId) => `${base}${moduleId}/`)];
    for (const page of expectedPages) {
      if (!pageSet.has(page)) issues.push(`${course.id} route is absent from dynamic SEO inventory: ${page}`);
    }
  }

  let courseKitRouteCount = 0;
  for (const definition of registry.COURSE_KIT_DEFINITIONS) {
    const courseId = definition.manifest.id;
    const pages = [
      `${courseId}/`,
      ...definition.manifest.modules.map((moduleManifest) => `${courseId}/${moduleManifest.slug}/`),
    ];
    for (const locale of i18n.LOCALE_CODES) {
      const fallback = !definition.manifest.contentLocales.includes(locale);
      for (const [pageIndex, page] of pages.entries()) {
        courseKitRouteCount += 1;
        const path = routeFile(out, locale, page);
        if (!existsSync(path)) continue;
        const html = readFileSync(path, "utf8");
        const canonicalLocale = fallback ? "en" : locale;
        const expectedCanonical = seo.urlFor(canonicalLocale, page);
        const observedCanonical = canonicalFromHtml(html);
        if (observedCanonical !== expectedCanonical) {
          issues.push(`canonical drift /${locale}/${page}: ${observedCanonical ?? "missing"}`);
        }
        const expectedJsonLdType = pageIndex === 0 ? "Course" : "LearningResource";
        const types = jsonLdTypes(html);
        if (!types.includes(expectedJsonLdType)) {
          issues.push(`/${locale}/${page} lacks ${expectedJsonLdType} JSON-LD.`);
        }
        if (types.includes("__invalid__")) issues.push(`/${locale}/${page} contains invalid JSON-LD.`);
        if (fallback) {
          if (!new RegExp(`data-course-kit=["']${courseId}["']`).test(html)
              || !/lang=["']en["'][^>]*dir=["']ltr["']/.test(html)) {
            issues.push(`/${locale}/${page} does not expose an English LTR course-content boundary.`);
          }
        }
        if (/<(?:iframe|img|video|audio|source)\b[^>]*(?:src|poster)=["'][^"']*https?:\/\//i.test(html)) {
          issues.push(`/${locale}/${page} contains remotely embedded media.`);
        }
        if (/href=["']#["']/.test(html)) issues.push(`/${locale}/${page} contains href '#'.`);
        if (containsUnresolvedReleaseMarker(html)) {
          issues.push(`/${locale}/${page} contains an unresolved release marker.`);
        }
      }
    }
  }

  const publicCourseKitFiles = registry.COURSE_KIT_DEFINITIONS.flatMap((definition) => {
    const base = join(root, "public/courses", definition.manifest.id);
    return walk(base).map((path) => relative(join(root, "public"), path).split(sep).join("/"));
  });
  for (const path of publicCourseKitFiles) {
    const emitted = join(out, path);
    if (!existsSync(emitted)) issues.push(`public asset was not emitted: ${path}`);
  }

  const expectedSitemap = await sitemapModule.default();
  const sitemapPath = join(out, "sitemap.xml");
  if (!existsSync(sitemapPath)) {
    issues.push("out/sitemap.xml is missing.");
  } else {
    const sitemapText = readFileSync(sitemapPath, "utf8");
    const entryCount = (sitemapText.match(/<url>/g) ?? []).length;
    if (entryCount !== expectedSitemap.length) {
      issues.push(`sitemap entry count drift: expected ${expectedSitemap.length}, found ${entryCount}.`);
    }
    for (const entry of expectedSitemap) {
      if (!sitemapText.includes(entry.url)) issues.push(`sitemap omits ${entry.url}.`);
    }
  }

  const htmlFiles = walk(out).filter((path) => path.endsWith(".html"));
  return {
    ok: issues.length === 0,
    counts: {
      locales: i18n.LOCALE_CODES.length,
      pagesPerLocale: seo.PAGES.length,
      expectedLocalizedRoutes: expectedLocalizedRoutes.length,
      availableCourses: courses.TOP_LEVEL_COURSES.length,
      courseKitRoutes: courseKitRouteCount,
      courseKitAssets: publicCourseKitFiles.length,
      exportedHtmlFiles: htmlFiles.length,
      sitemapEntries: expectedSitemap.length,
    },
    issues,
  };
}

const invoked = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invoked) {
  try {
    const result = await checkCourseStaticExport();
    if (process.argv.includes("--json")) console.log(JSON.stringify(result, null, 2));
    else {
      console.log(`course static export: ${result.ok ? "PASS" : "FAIL"}`);
      console.log(
        `${result.counts.availableCourses} courses; ${result.counts.expectedLocalizedRoutes} locale routes; ${result.counts.sitemapEntries} sitemap entries`,
      );
      for (const issue of result.issues) console.log(`  ${issue}`);
    }
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    console.error(`course static export: FAIL — ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
