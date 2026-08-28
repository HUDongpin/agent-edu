import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";

import ts from "typescript";

function readSource(path) {
  if (!existsSync(path)) throw new Error(`Missing CourseKit contract source: ${path}`);
  return readFileSync(path, "utf8");
}

function sourceFile(path) {
  return ts.createSourceFile(
    path,
    readSource(path),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function unwrap(node) {
  if (
    ts.isAsExpression(node)
    || ts.isSatisfiesExpression(node)
    || ts.isParenthesizedExpression(node)
    || ts.isTypeAssertionExpression(node)
  ) {
    return unwrap(node.expression);
  }
  return node;
}

function variableInitializer(file, name) {
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
        if (!declaration.initializer) throw new Error(`${name} has no initializer in ${file.fileName}`);
        return unwrap(declaration.initializer);
      }
    }
  }
  throw new Error(`Cannot find ${name} in ${file.fileName}`);
}

function stringArray(file, name) {
  const initializer = variableInitializer(file, name);
  if (!ts.isArrayLiteralExpression(initializer)) {
    throw new Error(`${name} must be a literal array in ${file.fileName}`);
  }
  return initializer.elements.map((element, index) => {
    const value = unwrap(element);
    if (!ts.isStringLiteralLike(value)) {
      throw new Error(`${name}[${index}] must be a string literal in ${file.fileName}`);
    }
    return value.text;
  });
}

function identifierArray(file, name) {
  const initializer = variableInitializer(file, name);
  if (!ts.isArrayLiteralExpression(initializer)) {
    throw new Error(`${name} must be a literal array in ${file.fileName}`);
  }
  return initializer.elements.map((element, index) => {
    const value = unwrap(element);
    if (!ts.isIdentifier(value)) {
      throw new Error(`${name}[${index}] must be an imported identifier in ${file.fileName}`);
    }
    return value.text;
  });
}

function importMap(file) {
  const imports = new Map();
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteralLike(statement.moduleSpecifier)) continue;
    const clause = statement.importClause;
    if (!clause) continue;
    if (clause.name) imports.set(clause.name.text, statement.moduleSpecifier.text);
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const element of clause.namedBindings.elements) {
        imports.set(element.name.text, statement.moduleSpecifier.text);
      }
    }
  }
  return imports;
}

function resolveTypeScriptImport(fromPath, specifier) {
  if (!specifier.startsWith(".")) {
    throw new Error(`CourseKit registry imports must be local: ${specifier}`);
  }
  const base = resolve(dirname(fromPath), specifier);
  const candidates = extname(base)
    ? [base]
    : [`${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")];
  const match = candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
  if (!match) throw new Error(`Cannot resolve ${specifier} from ${fromPath}`);
  return match;
}

function objectProperty(object, name) {
  if (!ts.isObjectLiteralExpression(object)) {
    throw new Error(`Expected an object literal while reading ${name}`);
  }
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) continue;
    const propertyName = property.name;
    const text = ts.isIdentifier(propertyName) || ts.isStringLiteralLike(propertyName)
      ? propertyName.text
      : "";
    if (text === name) return unwrap(property.initializer);
  }
  throw new Error(`Missing property ${name}`);
}

function literalString(node, label) {
  const value = unwrap(node);
  if (!ts.isStringLiteralLike(value)) throw new Error(`${label} must be a string literal`);
  return value.text;
}

function localModuleObject(file, node, label, seen = new Set()) {
  const value = unwrap(node);
  if (ts.isObjectLiteralExpression(value)) return value;
  if (ts.isCallExpression(value) && value.arguments.length === 1) {
    return localModuleObject(file, value.arguments[0], `${label} call argument`, seen);
  }
  if (ts.isElementAccessExpression(value)
      && ts.isIdentifier(unwrap(value.expression))) {
    const registryName = unwrap(value.expression).text;
    if (seen.has(registryName)) {
      throw new Error(`${label} contains a circular local module registry reference`);
    }
    const indexNode = unwrap(value.argumentExpression);
    if (!ts.isNumericLiteral(indexNode)) {
      throw new Error(`${label} local module registry index must be a numeric literal`);
    }
    const index = Number(indexNode.text);
    const registry = variableInitializer(file, registryName);
    if (!ts.isArrayLiteralExpression(registry)
        || !Number.isInteger(index)
        || index < 0
        || index >= registry.elements.length) {
      throw new Error(`${label} references an invalid local module registry index`);
    }
    const nextSeen = new Set(seen);
    nextSeen.add(registryName);
    return localModuleObject(
      file,
      registry.elements[index],
      `${label} -> ${registryName}[${index}]`,
      nextSeen,
    );
  }
  throw new Error(`${label} must resolve to a local literal module object`);
}

function courseDefinitionObject(file, exportName) {
  const initializer = variableInitializer(file, exportName);
  if (!ts.isCallExpression(initializer) || initializer.arguments.length !== 1) {
    throw new Error(`${exportName} must call buildCourseKitDefinition once in ${file.fileName}`);
  }
  const callee = unwrap(initializer.expression);
  if (!ts.isIdentifier(callee) || callee.text !== "buildCourseKitDefinition") {
    throw new Error(`${exportName} must use the shared buildCourseKitDefinition contract in ${file.fileName}`);
  }
  const argument = unwrap(initializer.arguments[0]);
  if (!ts.isObjectLiteralExpression(argument)) {
    throw new Error(`${exportName} must pass a literal contract object in ${file.fileName}`);
  }
  return argument;
}

function courseCopyLocales(definitionObject) {
  const copy = objectProperty(definitionObject, "courseCopy");
  if (!ts.isObjectLiteralExpression(copy)) throw new Error("courseCopy must be an object literal");
  return copy.properties.flatMap((property) => {
    if (!ts.isPropertyAssignment(property) && !ts.isShorthandPropertyAssignment(property)) return [];
    const name = property.name;
    if (!ts.isIdentifier(name) && !ts.isStringLiteralLike(name)) return [];
    return [name.text === "zhHans" ? "zh-Hans" : name.text];
  });
}

function moduleSlugs(path, exportName) {
  const file = sourceFile(path);
  const initializer = variableInitializer(file, exportName);
  if (!ts.isArrayLiteralExpression(initializer)) {
    throw new Error(`${exportName} must be a literal module array in ${path}`);
  }
  return initializer.elements.map((element, index) => {
    const moduleObject = localModuleObject(
      file,
      element,
      `${exportName}[${index}]`,
    );
    return literalString(objectProperty(moduleObject, "slug"), `${exportName}[${index}].slug`);
  });
}

function assertUnique(values, label) {
  if (!values.length) throw new Error(`${label} cannot be empty`);
  if (new Set(values).size !== values.length) throw new Error(`${label} contains duplicates`);
}

/**
 * Statically reads the shared CourseKit registry and constants. This does not
 * execute course authoring code, so the i18n audit remains reproducible and a
 * broken registry cannot silently disappear from route coverage.
 */
export function discoverCourseKitContract(root) {
  const typesPath = join(root, "lib", "course-kit", "types.ts");
  const registryPath = join(root, "lib", "course-kit", "registry.ts");
  const types = sourceFile(typesPath);
  const registry = sourceFile(registryPath);
  const shellLocales = stringArray(types, "COURSE_KIT_LOCALES");
  const contentLocales = stringArray(types, "COURSE_KIT_CONTENT_LOCALES");
  const courseIds = stringArray(types, "COURSE_KIT_COURSE_IDS");
  const registryDefinitions = identifierArray(registry, "COURSE_KIT_DEFINITIONS");
  const registryImports = importMap(registry);

  assertUnique(shellLocales, "COURSE_KIT_LOCALES");
  assertUnique(contentLocales, "COURSE_KIT_CONTENT_LOCALES");
  assertUnique(courseIds, "COURSE_KIT_COURSE_IDS");
  assertUnique(registryDefinitions, "COURSE_KIT_DEFINITIONS");

  const courses = registryDefinitions.map((exportName) => {
    const registrySpecifier = registryImports.get(exportName);
    if (!registrySpecifier) {
      throw new Error(`${exportName} must be imported directly by ${registryPath}`);
    }
    const registryImportPath = resolveTypeScriptImport(registryPath, registrySpecifier);
    const courseDirectory = dirname(registryImportPath);
    const definitionPath = join(courseDirectory, "definition.ts");
    const definition = sourceFile(definitionPath);
    const definitionObject = courseDefinitionObject(definition, exportName);
    const manifest = objectProperty(definitionObject, "manifest");
    const id = literalString(objectProperty(manifest, "id"), `${exportName}.manifest.id`);
    const modulesReference = objectProperty(definitionObject, "modules");
    if (!ts.isIdentifier(modulesReference)) {
      throw new Error(`${exportName}.modules must reference an imported literal module registry`);
    }
    const definitionImports = importMap(definition);
    const modulesSpecifier = definitionImports.get(modulesReference.text);
    if (!modulesSpecifier) {
      throw new Error(`${modulesReference.text} must be imported by ${definitionPath}`);
    }
    const modulesPath = resolveTypeScriptImport(definitionPath, modulesSpecifier);
    const units = moduleSlugs(modulesPath, modulesReference.text);
    const copyLocales = courseCopyLocales(definitionObject);
    assertUnique(units, `${id} module slugs`);
    assertUnique(copyLocales, `${id} courseCopy locales`);
    if (JSON.stringify(copyLocales) !== JSON.stringify(contentLocales)) {
      throw new Error(`${id} courseCopy locales ${copyLocales.join(",")} do not match COURSE_KIT_CONTENT_LOCALES ${contentLocales.join(",")}`);
    }
    return {
      name: id,
      exportName,
      path: definitionPath,
      loadPath: definitionPath,
      routeParam: "module",
      units,
      lessons: [],
      modules: units,
      locales: shellLocales,
      translatedLocales: contentLocales,
      quizzes: [],
      figures: [],
      practices: [],
      metadataContract: "course-kit",
      validatorPath: join(root, "scripts", "check-course-kit-release.mjs"),
      registryPath,
      modulesPath,
    };
  });

  const registryIds = courses.map((course) => course.name);
  if (JSON.stringify(registryIds) !== JSON.stringify(courseIds)) {
    throw new Error(`COURSE_KIT_DEFINITIONS ids ${registryIds.join(",")} do not match COURSE_KIT_COURSE_IDS ${courseIds.join(",")}`);
  }

  return {
    sources: { typesPath, registryPath },
    shellLocales,
    contentLocales,
    courseIds,
    courses,
  };
}

export function courseKitSharedContractIssues(root) {
  const metadataPath = join(root, "components", "course-kit", "CourseRoute.tsx");
  const localePath = join(root, "lib", "course-kit", "locale.ts");
  const dashboardPath = join(root, "components", "course-kit", "CourseDashboard.tsx");
  const modulePath = join(root, "components", "course-kit", "ModuleView.tsx");
  const sources = {
    metadata: readSource(metadataPath),
    locale: readSource(localePath),
    dashboard: readSource(dashboardPath),
    module: readSource(modulePath),
  };
  const required = [
    ["metadata-helper", sources.metadata, /export function courseKitMetadata\s*\(/],
    ["metadata-content-locales", sources.metadata, /availableLocales:\s*COURSE_KIT_CONTENT_LOCALES/],
    ["metadata-canonical-content", sources.metadata, /canonicalLocale:\s*course\.locale\.canonicalLocale/],
    ["json-ld-content-language", sources.metadata, /inLanguage:\s*course\.locale\.contentLocale/],
    ["fallback-canonical-locale", sources.locale, /canonicalLocale:\s*contentLocale/],
    ["fallback-ltr-content", sources.locale, /contentDirection:\s*["']ltr["']/],
    ["dashboard-content-lang", sources.dashboard, /lang=\{course\.locale\.contentLocale\}/],
    ["dashboard-content-dir", sources.dashboard, /dir=\{course\.locale\.contentDirection\}/],
    ["module-content-lang", sources.module, /lang=\{course\.locale\.contentLocale\}/],
    ["module-content-dir", sources.module, /dir=\{course\.locale\.contentDirection\}/],
  ];
  return required
    .filter(([, source, pattern]) => !pattern.test(source))
    .map(([id]) => String(id));
}

export function courseKitRouteContractIssues(routeSource, sharedIssues = []) {
  const issues = [...sharedIssues];
  if (!/\breturn\s+courseKitMetadata\s*\(/.test(routeSource)) issues.push("route-course-kit-metadata-call");
  return [...new Set(issues)];
}

export function coursePolicyForRoute(route, courseMap, defaultLocale = "en") {
  const [, routeLocale = "", courseName = ""] = /^\/([^/]+)\/([^/]+)(?:\/|$)/.exec(route) ?? [];
  const course = courseMap.get(courseName);
  if (!course?.translatedLocales?.length) return null;
  const contentLocale = course.contentLocaleMode === "fixed-default"
    ? defaultLocale
    : course.translatedLocales.includes(routeLocale)
      ? routeLocale
      : defaultLocale;
  const canonicalLocale = course.canonicalLocaleMode === "route-locale"
    ? routeLocale
    : contentLocale;
  return {
    course,
    routeLocale,
    contentLocale,
    canonicalRoute: route.replace(`/${routeLocale}/`, `/${canonicalLocale}/`),
    hreflangLocales: course.translatedLocales,
  };
}

/**
 * Validate every declared JSON-LD content language without assuming that a
 * catalog ItemList has one language. Ordinary pages remain uniform: every
 * nested `inLanguage` must equal the materialized page content locale. On the
 * localized course catalog, each Course/LearningResource must instead carry a
 * local, exported URL; that target route's audited course policy determines
 * the expected language. Missing, foreign or unknown targets fail closed.
 */
export function jsonLdLanguageIssues(value, {
  pageRoute,
  pageContentLocale,
  courseMap,
  defaultLocale = "en",
  site,
  siteLocales,
  knownRoutes,
}) {
  const issues = [];
  const catalogMatch = /^\/([^/]+)\/courses\/$/.exec(pageRoute);
  const mixedCatalog = Boolean(catalogMatch && siteLocales.includes(catalogMatch[1]));
  let siteOrigin = "";
  try {
    siteOrigin = new URL(site).origin;
  } catch {
    return [{
      path: "$",
      reason: "site-url-invalid",
      observed: String(site),
      expected: "absolute site origin",
      targetRoute: pageRoute,
    }];
  }

  const targetExpectation = (item, path) => {
    if (!mixedCatalog) return { expected: pageContentLocale, targetRoute: pageRoute };
    if (typeof item.url !== "string" || !item.url.trim()) {
      issues.push({
        path,
        reason: "target-url-missing",
        observed: item.inLanguage,
        expected: "local exported URL",
        targetRoute: "",
      });
      return null;
    }
    let target;
    try {
      target = new URL(item.url);
    } catch {
      issues.push({
        path,
        reason: "target-url-invalid",
        observed: item.url,
        expected: `${siteOrigin}/<locale>/<route>/`,
        targetRoute: "",
      });
      return null;
    }
    if (target.origin !== siteOrigin || target.search) {
      issues.push({
        path,
        reason: "target-url-not-local",
        observed: item.url,
        expected: `${siteOrigin}/<locale>/<route>/`,
        targetRoute: target.pathname,
      });
      return null;
    }
    const targetRoute = target.pathname;
    if (knownRoutes && !knownRoutes.has(targetRoute)) {
      issues.push({
        path,
        reason: "target-route-unknown",
        observed: item.url,
        expected: "a route in the frozen export inventory",
        targetRoute,
      });
      return null;
    }
    const targetLocale = /^\/([^/]+)(?:\/|$)/.exec(targetRoute)?.[1] ?? "";
    if (!siteLocales.includes(targetLocale)) {
      issues.push({
        path,
        reason: "target-locale-unknown",
        observed: targetLocale,
        expected: siteLocales.join(","),
        targetRoute,
      });
      return null;
    }
    const policy = coursePolicyForRoute(targetRoute, courseMap, defaultLocale);
    return { expected: policy?.contentLocale ?? targetLocale, targetRoute };
  };

  const visit = (item, path = "$") => {
    if (!item || typeof item !== "object") return;
    if (Array.isArray(item)) {
      item.forEach((child, index) => visit(child, `${path}[${index}]`));
      return;
    }
    const languageBearingCatalogItem = mixedCatalog
      && (item["@type"] === "Course" || item["@type"] === "LearningResource");
    if (languageBearingCatalogItem && !("inLanguage" in item)) {
      issues.push({
        path,
        reason: "language-missing",
        observed: "missing",
        expected: "an explicit content language",
        targetRoute: typeof item.url === "string" ? item.url : "",
      });
    } else if ("inLanguage" in item && typeof item.inLanguage !== "string") {
      issues.push({
        path,
        reason: "language-value-invalid",
        observed: typeof item.inLanguage,
        expected: "a BCP-47 language string",
        targetRoute: typeof item.url === "string" ? item.url : pageRoute,
      });
    } else if (typeof item.inLanguage === "string") {
      const expectation = targetExpectation(item, path);
      if (expectation && item.inLanguage !== expectation.expected) {
        issues.push({
          path,
          reason: "language-mismatch",
          observed: item.inLanguage,
          expected: expectation.expected,
          targetRoute: expectation.targetRoute,
        });
      }
    }
    for (const [key, child] of Object.entries(item)) visit(child, `${path}.${key}`);
  };
  visit(value);
  return issues;
}

export function courseKitSeoPages(courses) {
  return courses
    .filter((course) => course.metadataContract === "course-kit")
    .flatMap((course) => [
      `${course.name}/`,
      ...course.modules.map((slug) => `${course.name}/${slug}/`),
    ]);
}

export function isAllowedFrameworkExportRoute(route) {
  return route === "/404.html" || route === "/404/" || route === "/_not-found/";
}
