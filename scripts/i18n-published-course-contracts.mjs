import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import ts from "typescript";

function read(path) {
  if (!existsSync(path)) throw new Error(`Missing published course contract source: ${path}`);
  return readFileSync(path, "utf8");
}

function parse(path) {
  return ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function unwrap(node) {
  if (
    ts.isAsExpression(node)
    || ts.isSatisfiesExpression(node)
    || ts.isParenthesizedExpression(node)
    || ts.isTypeAssertionExpression(node)
  ) return unwrap(node.expression);
  return node;
}

function initializer(file, name) {
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name && declaration.initializer) {
        return unwrap(declaration.initializer);
      }
    }
  }
  throw new Error(`Cannot find ${name} in ${file.fileName}`);
}

function property(object, name) {
  if (!ts.isObjectLiteralExpression(object)) throw new Error(`Expected an object while reading ${name}`);
  for (const candidate of object.properties) {
    if (!ts.isPropertyAssignment(candidate)) continue;
    const key = candidate.name;
    if ((ts.isIdentifier(key) || ts.isStringLiteralLike(key)) && key.text === name) {
      return unwrap(candidate.initializer);
    }
  }
  throw new Error(`Missing property ${name}`);
}

function literal(value, label) {
  const node = unwrap(value);
  if (!ts.isStringLiteralLike(node)) throw new Error(`${label} must be a string literal`);
  return node.text;
}

function stringArray(path, name) {
  const file = parse(path);
  const value = initializer(file, name);
  if (!ts.isArrayLiteralExpression(value)) throw new Error(`${name} must be a literal array in ${path}`);
  return value.elements.map((element, index) => literal(element, `${name}[${index}]`));
}

function objectArrayProperty(path, name, key) {
  const file = parse(path);
  const value = initializer(file, name);
  if (!ts.isArrayLiteralExpression(value)) throw new Error(`${name} must be a literal array in ${path}`);
  return value.elements.map((element, index) => literal(property(unwrap(element), key), `${name}[${index}].${key}`));
}

function literalConst(path, name) {
  return literal(initializer(parse(path), name), name);
}

function requireTokens(source, requirements) {
  return requirements.filter(([, pattern]) => !pattern.test(source)).map(([id]) => id);
}

function assertUnique(values, label) {
  if (!values.length) throw new Error(`${label} cannot be empty`);
  if (new Set(values).size !== values.length) throw new Error(`${label} contains duplicates`);
}

function assertNoIssues(issues, label) {
  if (issues.length) throw new Error(`${label}: ${issues.join(", ")}`);
}

export function discoverClaudeIncomeContract(root, siteLocales) {
  const directory = join(root, "lib", "claude-income");
  const curriculumPath = join(directory, "curriculum.ts");
  const typesPath = join(directory, "types.ts");
  const indexPath = join(directory, "index.ts");
  const seoPath = join(directory, "seo.ts");
  const dashboardRoutePath = join(root, "app", "[locale]", "claude-income", "page.tsx");
  const lessonRoutePath = join(root, "app", "[locale]", "claude-income", "[lesson]", "page.tsx");
  const sitemapPath = join(root, "app", "sitemap.ts");
  const dashboardComponentPath = join(root, "components", "claude-income", "CourseDashboard.tsx");
  const lessonComponentPath = join(root, "components", "claude-income", "LessonView.tsx");
  const units = objectArrayProperty(curriculumPath, "CLAUDE_INCOME_LESSONS", "slug");
  const contentLocale = literalConst(typesPath, "CLAUDE_INCOME_CONTENT_LANGUAGE");
  const issues = [
    ...requireTokens(read(indexPath), [
      ["shell-locales-from-site-registry", /CLAUDE_INCOME_LOCALES\s*=\s*\[\.\.\.LOCALE_CODES\]/],
      ["lesson-slugs-from-course", /CLAUDE_INCOME_LESSON_SLUGS\s*=\s*CLAUDE_INCOME_COURSE\.lessons\.map/],
    ]),
    ...requireTokens(read(curriculumPath), [
      ["course-id", /id:\s*["']claude-income["']/],
      ["course-lessons", /lessons:\s*CLAUDE_INCOME_LESSONS/],
      ["course-content-language", /contentLanguage:\s*["']en["']/],
    ]),
    ...requireTokens(read(dashboardRoutePath), [
      ["dashboard-static-shells", /CLAUDE_INCOME_LOCALES\.map\(\(locale\)\s*=>\s*\(\{\s*locale\s*\}\)\)/],
      ["dashboard-metadata-helper", /return\s+claudeIncomeSeoFor\s*\(/],
      ["dashboard-json-language", /inLanguage:\s*["']en["']/],
    ]),
    ...requireTokens(read(lessonRoutePath), [
      ["lesson-static-params", /CLAUDE_INCOME_LESSON_SLUGS\.map\(\(lesson\)\s*=>\s*\(\{\s*lesson\s*\}\)\)/],
      ["lesson-metadata-helper", /return\s+claudeIncomeSeoFor\s*\(/],
      ["lesson-json-language", /inLanguage:\s*["']en["']/],
    ]),
    ...requireTokens(read(seoPath), [
      ["locale-canonical", /canonical:\s*claudeIncomeUrlFor\(locale,\s*slug\)/],
      ["english-hreflang", /en:\s*claudeIncomeUrlFor\(["']en["'],\s*slug\)/],
      ["default-hreflang", /languages\[["']x-default["']\]\s*=\s*claudeIncomeUrlFor\(DEFAULT_LOCALE,\s*slug\)/],
    ]),
    ...requireTokens(read(sitemapPath), [
      ["english-only-sitemap", /page\s*===\s*["']claude-income\/["'][\s\S]*?page\.startsWith\(["']claude-income\/["']\)[\s\S]*?\?\s*\[DEFAULT_LOCALE\]/],
    ]),
    ...requireTokens(read(dashboardComponentPath), [
      ["dashboard-english-lang", /lang=["']en["']/],
      ["dashboard-ltr-dir", /dir=["']ltr["']/],
    ]),
    ...requireTokens(read(lessonComponentPath), [
      ["lesson-english-lang", /lang=["']en["']/],
      ["lesson-ltr-dir", /dir=["']ltr["']/],
    ]),
  ];
  assertUnique(units, "Claude Income lesson slugs");
  if (contentLocale !== "en") issues.push("content-language-not-en");
  if (JSON.stringify(siteLocales) !== JSON.stringify(["en", "es", "fr", "de", "zh-Hans", "zh-Hant", "ja", "ko", "ar"])) {
    issues.push("site-locale-contract-unexpected");
  }
  assertNoIssues(issues, "Claude Income discovery contract is incomplete");
  return {
    name: "claude-income",
    path: curriculumPath,
    loadPath: curriculumPath,
    routeParam: "lesson",
    units,
    lessons: units,
    modules: [],
    locales: [...siteLocales],
    translatedLocales: [contentLocale],
    quizzes: [],
    figures: [],
    practices: [],
    metadataContract: "claude-income",
    contentLocaleMode: "fixed-default",
    canonicalLocaleMode: "route-locale",
    copyPaths: { en: curriculumPath },
    validatorPath: join(root, "scripts", "check-claude-income-course.mjs"),
  };
}

export function discoverMcpContract(root, siteLocales) {
  const directory = join(root, "lib", "mcp");
  const typesPath = join(directory, "types.ts");
  const coursePath = join(directory, "course.ts");
  const figuresPath = join(directory, "figures.ts");
  const loadPath = join(directory, "load.ts");
  const dashboardRoutePath = join(root, "app", "[locale]", "mcp", "page.tsx");
  const lessonRoutePath = join(root, "app", "[locale]", "mcp", "[lesson]", "page.tsx");
  const sitemapPath = join(root, "app", "sitemap.ts");
  const courseLocales = stringArray(typesPath, "MCP_LOCALES");
  const units = objectArrayProperty(coursePath, "MCP_LESSONS", "slug");
  const figures = objectArrayProperty(figuresPath, "MCP_FIGURES", "id");
  const issues = [
    ...requireTokens(read(dashboardRoutePath), [
      ["dashboard-static-shells", /MCP_LOCALES\.map\(\(locale\)\s*=>\s*\(\{\s*locale\s*\}\)\)/],
      ["dashboard-native-hreflang", /availableLocales:\s*MCP_LOCALES/],
      ["dashboard-locale-canonical", /canonicalLocale:\s*locale/],
      ["dashboard-json-language", /inLanguage:\s*course\.contentLocale/],
    ]),
    ...requireTokens(read(lessonRoutePath), [
      ["lesson-static-params", /MCP_LESSONS\.map\(\(lesson\)\s*=>\s*\(\{\s*lesson:\s*lesson\.slug\s*\}\)\)/],
      ["lesson-native-hreflang", /availableLocales:\s*MCP_LOCALES/],
      ["lesson-locale-canonical", /canonicalLocale:\s*locale/],
      ["lesson-json-language", /inLanguage:\s*course\.contentLocale/],
    ]),
    ...requireTokens(read(loadPath), [
      ["materialized-content-locale", /contentLocale:\s*locale/],
      ["arabic-content-direction", /contentDirection:\s*locale\s*===\s*["']ar["']\s*\?\s*["']rtl["']\s*:\s*["']ltr["']/],
    ]),
    ...requireTokens(read(sitemapPath), [
      ["mcp-sitemap-locales", /page\s*===\s*["']mcp\/["'][\s\S]*?page\.startsWith\(["']mcp\/["']\)[\s\S]*?\?\s*MCP_LOCALES/],
    ]),
  ];
  assertUnique(courseLocales, "MCP locales");
  assertUnique(units, "MCP lesson slugs");
  assertUnique(figures, "MCP figure ids");
  if (JSON.stringify(courseLocales) !== JSON.stringify(siteLocales)) issues.push("mcp-site-locale-drift");
  assertNoIssues(issues, "MCP discovery contract is incomplete");
  return {
    name: "mcp",
    path: coursePath,
    loadPath,
    routeParam: "lesson",
    units,
    lessons: units,
    modules: [],
    locales: courseLocales,
    translatedLocales: courseLocales,
    quizzes: [],
    figures,
    practices: [],
    metadataContract: "mcp",
    contentLocaleMode: "route-locale",
    canonicalLocaleMode: "route-locale",
    validatorPath: join(root, "scripts", "check-mcp-course.mjs"),
  };
}

export function discoverPromptsFallbackContract(root, siteLocales) {
  const typesPath = join(root, "lib", "prompts", "types.ts");
  const loadPath = join(root, "lib", "prompts", "load.ts");
  const dashboardRoutePath = join(root, "app", "[locale]", "prompts", "page.tsx");
  const lessonRoutePath = join(root, "app", "[locale]", "prompts", "[lesson]", "page.tsx");
  const sitemapPath = join(root, "app", "sitemap.ts");
  const dashboardComponentPath = join(root, "components", "prompts", "CourseDashboard.tsx");
  const lessonComponentPath = join(root, "components", "prompts", "LessonView.tsx");
  const shellLocales = stringArray(typesPath, "PROMPT_LOCALES");
  const units = stringArray(typesPath, "PROMPT_LESSON_SLUGS");
  const issues = [
    ...requireTokens(read(loadPath), [
      ["english-content-locale", /contentLocale:\s*["']en["']/],
    ]),
    ...requireTokens(read(dashboardRoutePath), [
      ["dashboard-static-shells", /PROMPT_LOCALES\.map\(\(locale\)\s*=>\s*\(\{\s*locale\s*\}\)\)/],
      ["dashboard-english-hreflang", /availableLocales:\s*\[["']en["']\]/],
      ["dashboard-english-canonical", /canonicalLocale:\s*["']en["']/],
      ["dashboard-json-language", /inLanguage:\s*["']en["']/],
    ]),
    ...requireTokens(read(lessonRoutePath), [
      ["lesson-static-params", /PROMPT_LESSON_SLUGS\.map\(\(lesson\)\s*=>\s*\(\{\s*lesson\s*\}\)\)/],
      ["lesson-english-hreflang", /availableLocales:\s*\[["']en["']\]/],
      ["lesson-english-canonical", /canonicalLocale:\s*["']en["']/],
      ["lesson-json-language", /inLanguage:\s*["']en["']/],
    ]),
    ...requireTokens(read(sitemapPath), [
      ["prompts-english-only-sitemap", /page\s*===\s*["']prompts\/["'][\s\S]*?page\.startsWith\(["']prompts\/["']\)[\s\S]*?\?\s*\[DEFAULT_LOCALE\]/],
    ]),
    ...requireTokens(read(dashboardComponentPath), [
      ["dashboard-english-lang", /lang=["']en["']/],
      ["dashboard-ltr-dir", /dir=["']ltr["']/],
    ]),
    ...requireTokens(read(lessonComponentPath), [
      ["lesson-english-lang", /lang=["']en["']/],
      ["lesson-ltr-dir", /dir=["']ltr["']/],
    ]),
  ];
  if (JSON.stringify(shellLocales) !== JSON.stringify(siteLocales)) issues.push("prompts-site-locale-drift");
  assertUnique(units, "Prompt lesson slugs");
  assertNoIssues(issues, "Prompts English fallback contract is incomplete");
  return {
    domain: "prompts",
    shellLocales,
    contentLocales: ["en"],
    fallbackLocale: "en",
    units,
    contentLocaleMode: "fixed-default",
    canonicalLocaleMode: "content-locale",
  };
}

export function discoverMakeMoneyWithCodexFallbackContract(root, siteLocales) {
  const directory = join(root, "lib", "make-money-with-codex");
  const typesPath = join(directory, "types.ts");
  const loadPath = join(directory, "load.ts");
  const dashboardRoutePath = join(root, "app", "[locale]", "make-money-with-codex", "page.tsx");
  const lessonRoutePath = join(root, "app", "[locale]", "make-money-with-codex", "[lesson]", "page.tsx");
  const dashboardComponentPath = join(root, "components", "make-money-with-codex", "CourseDashboard.tsx");
  const lessonComponentPath = join(root, "components", "make-money-with-codex", "LessonView.tsx");
  const sitemapPath = join(root, "app", "sitemap.ts");
  const shellLocales = stringArray(typesPath, "MAKE_MONEY_WITH_CODEX_LOCALES");
  const units = stringArray(typesPath, "MAKE_MONEY_WITH_CODEX_LESSON_SLUGS");
  const issues = [
    ...requireTokens(read(typesPath), [
      ["typed-english-content-language", /contentLanguage:\s*["']en["']/],
    ]),
    ...requireTokens(read(loadPath), [
      ["all-shell-copy-loaders", /COPY_LOADERS:\s*Record<CodexIncomeLocale,/],
    ]),
    ...requireTokens(read(dashboardRoutePath), [
      ["dashboard-static-shells", /MAKE_MONEY_WITH_CODEX_LOCALES\.map\(\(locale\)\s*=>\s*\(\{\s*locale\s*\}\)\)/],
      ["dashboard-english-hreflang", /availableLocales:\s*\[["']en["']\]/],
      ["dashboard-english-canonical", /canonicalLocale:\s*["']en["']/],
      ["dashboard-json-language", /inLanguage:\s*["']en["']/],
      ["dashboard-english-structured-url", /urlFor\(contentLocale,\s*["']make-money-with-codex\/["']\)/],
    ]),
    ...requireTokens(read(lessonRoutePath), [
      ["lesson-static-params", /MAKE_MONEY_WITH_CODEX_LESSON_SLUGS\.map\(\(lesson\)\s*=>\s*\(\{\s*lesson\s*\}\)\)/],
      ["lesson-english-hreflang", /availableLocales:\s*\[["']en["']\]/],
      ["lesson-english-canonical", /canonicalLocale:\s*["']en["']/],
      ["lesson-json-language", /inLanguage:\s*["']en["']/],
      ["lesson-english-structured-url", /urlFor\(contentLocale,\s*makeMoneyWithCodexLessonPage\(lesson\)\)/],
    ]),
    ...requireTokens(read(sitemapPath), [
      ["english-only-sitemap", /page\s*===\s*["']make-money-with-codex\/["'][\s\S]*?page\.startsWith\(["']make-money-with-codex\/["']\)[\s\S]*?\?\s*\[DEFAULT_LOCALE\]/],
    ]),
    ...requireTokens(read(dashboardComponentPath), [
      ["dashboard-english-ltr-root", /className=\{`\$\{styles\.coursePage\}\s+en-content`\}\s+dir=["']ltr["']/],
      ["dashboard-english-body", /lang=["']en["']/],
      ["dashboard-localized-language-notice", /copy\.meta\.languageNotice/],
    ]),
    ...requireTokens(read(lessonComponentPath), [
      ["lesson-english-ltr-root", /className=\{`\$\{styles\.lessonPage\}\s+en-content`\}\s+dir=["']ltr["']/],
      ["lesson-english-body", /lang=["']en["']/],
      ["lesson-localized-language-notice", /copy\.meta\.languageNotice/],
    ]),
  ];
  if (JSON.stringify(shellLocales) !== JSON.stringify(siteLocales)) issues.push("site-locale-contract-drift");
  assertUnique(units, "Make Money with Codex lesson slugs");
  assertNoIssues(issues, "Make Money with Codex fallback contract is incomplete");
  return {
    domain: "make-money-with-codex",
    shellLocales,
    contentLocales: ["en"],
    hreflangLocales: ["en"],
    fallbackLocale: "en",
    units,
    contentLocaleMode: "fixed-default",
    canonicalLocaleMode: "content-locale",
  };
}

export function discoverSoftwareEngineeringFallbackContract(root, siteLocales) {
  const directory = join(root, "lib", "software-engineering");
  const typesPath = join(directory, "types.ts");
  const loadPath = join(directory, "load.ts");
  const dashboardRoutePath = join(root, "app", "[locale]", "software-engineering", "page.tsx");
  const lessonRoutePath = join(root, "app", "[locale]", "software-engineering", "[lesson]", "page.tsx");
  const dashboardComponentPath = join(root, "components", "software-engineering", "CourseDashboard.tsx");
  const lessonComponentPath = join(root, "components", "software-engineering", "LessonView.tsx");
  const sitemapPath = join(root, "app", "sitemap.ts");
  const shellLocales = stringArray(typesPath, "SOFTWARE_ENGINEERING_LOCALES");
  const units = stringArray(typesPath, "SOFTWARE_ENGINEERING_LESSON_SLUGS");
  const issues = [
    ...requireTokens(read(typesPath), [
      ["typed-english-content-language", /contentLocale:\s*["']en["']/],
    ]),
    ...requireTokens(read(loadPath), [
      ["all-shell-copy-loaders", /COPY_LOADERS:\s*Record<SoftwareEngineeringLocale,/],
      ["materialized-english-content", /contentLocale:\s*["']en["']/],
    ]),
    ...requireTokens(read(dashboardRoutePath), [
      ["dashboard-static-shells", /SOFTWARE_ENGINEERING_LOCALES\.map\(\(locale\)\s*=>\s*\(\{\s*locale\s*\}\)\)/],
      ["dashboard-shell-hreflang", /availableLocales:\s*SOFTWARE_ENGINEERING_LOCALES/],
      ["dashboard-route-canonical", /canonicalLocale:\s*locale/],
      ["dashboard-json-language", /inLanguage:\s*["']en["']/],
      ["dashboard-route-structured-url", /urlFor\(locale,\s*["']software-engineering\/["']\)/],
    ]),
    ...requireTokens(read(lessonRoutePath), [
      ["lesson-static-params", /SOFTWARE_ENGINEERING_LESSON_SLUGS\.map\(\(lesson\)\s*=>\s*\(\{\s*lesson\s*\}\)\)/],
      ["lesson-shell-hreflang", /availableLocales:\s*SOFTWARE_ENGINEERING_LOCALES/],
      ["lesson-route-canonical", /canonicalLocale:\s*locale/],
      ["lesson-json-language", /inLanguage:\s*["']en["']/],
      ["lesson-route-structured-url", /urlFor\(locale,\s*page\)/],
    ]),
    ...requireTokens(read(sitemapPath), [
      ["all-shell-sitemap", /page\s*===\s*["']software-engineering\/["'][\s\S]*?page\.startsWith\(["']software-engineering\/["']\)[\s\S]*?\?\s*SOFTWARE_ENGINEERING_LOCALES/],
    ]),
    ...requireTokens(read(dashboardComponentPath), [
      ["dashboard-fallback-notice", /course\.locale\s*!==\s*["']en["'][\s\S]*?course\.copy\.meta\.languageNotice/],
      ["dashboard-english-ltr-content", /lang=["']en["']\s+dir=["']ltr["']/],
    ]),
    ...requireTokens(read(lessonComponentPath), [
      ["lesson-fallback-notice", /course\.locale\s*!==\s*["']en["'][\s\S]*?course\.copy\.meta\.languageNotice/],
      ["lesson-english-ltr-content", /lang=["']en["']\s+dir=["']ltr["']/],
    ]),
  ];
  if (JSON.stringify(shellLocales) !== JSON.stringify(siteLocales)) issues.push("site-locale-contract-drift");
  assertUnique(units, "Software Engineering lesson slugs");
  assertNoIssues(issues, "Software Engineering fallback contract is incomplete");
  return {
    domain: "software-engineering",
    shellLocales,
    contentLocales: ["en"],
    hreflangLocales: shellLocales,
    fallbackLocale: "en",
    units,
    contentLocaleMode: "fixed-default",
    canonicalLocaleMode: "route-locale",
  };
}

export function isCourseCloneLeak(courseName, key, value) {
  if (typeof value !== "string") return false;
  if (/^(?:sources?|references?|citations?)(?:\.|$)/i.test(key) || /(?:url|publisher|officialSource|sourceTitle)$/i.test(key)) return false;
  if (/\bCourse\s*2\b/i.test(value)) return true;
  if (!/\bCodex\b/i.test(value)) return false;
  if (courseName === "make-money-with-codex") return false;
  if (
    courseName === "mcp"
    && (/\bMCP\b/i.test(value) || /(?:host-integration|host-support|codex-cli-mcp|openai-codex-mcp)/i.test(key))
  ) return false;
  return true;
}

export function findRawMessageKey(visibleText) {
  return /(?<![\p{L}\p{N}_.-])(?:ui|nav|course|hb|w)\.[A-Za-z0-9_.-]{2,}/u.exec(visibleText)?.[0] ?? "";
}
