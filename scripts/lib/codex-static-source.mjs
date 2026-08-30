import ts from "typescript";

function sourceKind(sourcePath) {
  return sourcePath.endsWith(".tsx") || sourcePath.endsWith(".jsx")
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS;
}

function parseSource(source, sourcePath) {
  const sourceFile = ts.createSourceFile(
    sourcePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    sourceKind(sourcePath),
  );
  const diagnostics = sourceFile.parseDiagnostics ?? [];
  if (diagnostics.length > 0) {
    const diagnostic = diagnostics[0];
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
    throw new Error(`TypeScript parse error: ${message}`);
  }
  return sourceFile;
}

function unwrap(node) {
  let current = node;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isNonNullExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function errorAt(sourceFile, node, message) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return new Error(`${message} at ${line + 1}:${character + 1}`);
}

function staticPropertyName(sourceFile, node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text;
  }
  throw errorAt(sourceFile, node, "computed property names are not statically accepted");
}

function collectDeclarations(sourceFile) {
  const declarations = new Map();
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const isConst = Boolean(statement.declarationList.flags & ts.NodeFlags.Const);
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name)) continue;
      const name = declaration.name.text;
      if (declarations.has(name)) {
        throw errorAt(sourceFile, declaration.name, `duplicate top-level declaration ${name}`);
      }
      declarations.set(name, { declaration, isConst });
    }
  }
  return declarations;
}

/**
 * Resolve one top-level const as inert JSON-like data.
 *
 * This deliberately interprets a narrow TypeScript AST whitelist instead of
 * executing project source. Calls, property access, imports, spreads,
 * computed keys, interpolated templates, and non-const dependencies fail
 * closed. A missing top-level declaration returns undefined so callers can
 * try an explicitly named fallback export.
 */
export function resolveStaticConst(source, name, sourcePath = "<source>") {
  const sourceFile = parseSource(source, sourcePath);
  const declarations = collectDeclarations(sourceFile);
  const cache = new Map();
  const resolving = new Set();

  function resolveIdentifier(identifier, referenceNode) {
    const entry = declarations.get(identifier);
    if (!entry) throw new Error(`unresolved identifier ${identifier}`);
    if (!entry.isConst) throw new Error(`identifier ${identifier} is not declared with const`);
    if (!entry.declaration.initializer) {
      throw errorAt(sourceFile, entry.declaration, `const ${identifier} has no initializer`);
    }
    if (resolving.has(identifier)) throw new Error(`cyclic identifier ${identifier}`);
    if (
      referenceNode &&
      entry.declaration.getStart(sourceFile) > referenceNode.getStart(sourceFile)
    ) {
      throw errorAt(
        sourceFile,
        referenceNode,
        `forward reference to const ${identifier} is not statically accepted`,
      );
    }
    if (cache.has(identifier)) return cache.get(identifier);

    resolving.add(identifier);
    try {
      const value = materialize(entry.declaration.initializer);
      cache.set(identifier, value);
      return value;
    } finally {
      resolving.delete(identifier);
    }
  }

  function materialize(node) {
    const valueNode = unwrap(node);

    if (ts.isStringLiteral(valueNode) || ts.isNoSubstitutionTemplateLiteral(valueNode)) {
      return valueNode.text;
    }
    if (ts.isNumericLiteral(valueNode)) {
      const value = Number(valueNode.text);
      if (!Number.isFinite(value)) {
        throw errorAt(sourceFile, valueNode, "non-finite numbers are not statically accepted");
      }
      return value;
    }
    if (valueNode.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (valueNode.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (valueNode.kind === ts.SyntaxKind.NullKeyword) return null;
    if (ts.isPrefixUnaryExpression(valueNode) && valueNode.operator === ts.SyntaxKind.MinusToken) {
      const operand = unwrap(valueNode.operand);
      if (!ts.isNumericLiteral(operand)) {
        throw errorAt(sourceFile, valueNode, "only numeric negative literals are statically accepted");
      }
      const value = -Number(operand.text);
      if (!Number.isFinite(value)) {
        throw errorAt(sourceFile, valueNode, "non-finite numbers are not statically accepted");
      }
      return value;
    }
    if (ts.isIdentifier(valueNode)) return resolveIdentifier(valueNode.text, valueNode);

    if (ts.isArrayLiteralExpression(valueNode)) {
      return valueNode.elements.map((element) => {
        if (ts.isSpreadElement(element)) {
          throw errorAt(sourceFile, element, "array spreads are not statically accepted");
        }
        if (ts.isOmittedExpression(element)) {
          throw errorAt(sourceFile, element, "sparse arrays are not statically accepted");
        }
        return materialize(element);
      });
    }

    if (ts.isObjectLiteralExpression(valueNode)) {
      const result = {};
      for (const property of valueNode.properties) {
        let key;
        let value;
        if (ts.isPropertyAssignment(property)) {
          key = staticPropertyName(sourceFile, property.name);
          value = materialize(property.initializer);
        } else if (ts.isShorthandPropertyAssignment(property)) {
          if (property.objectAssignmentInitializer) {
            throw errorAt(sourceFile, property, "shorthand defaults are not statically accepted");
          }
          key = property.name.text;
          value = resolveIdentifier(key, property.name);
        } else {
          throw errorAt(
            sourceFile,
            property,
            `unsupported object member ${ts.SyntaxKind[property.kind]}`,
          );
        }
        if (Object.prototype.hasOwnProperty.call(result, key)) {
          throw errorAt(sourceFile, property, `duplicate object property ${key}`);
        }
        Object.defineProperty(result, key, {
          configurable: true,
          enumerable: true,
          value,
          writable: true,
        });
      }
      return result;
    }

    throw errorAt(
      sourceFile,
      valueNode,
      `unsupported static expression ${ts.SyntaxKind[valueNode.kind]}`,
    );
  }

  if (!declarations.has(name)) return undefined;
  return resolveIdentifier(name, undefined);
}
