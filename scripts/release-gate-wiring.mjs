/**
 * Expand the deterministic `npm run` graph used by the repository build
 * scripts and locate course release gates relative to `next build`.
 *
 * Course-specific checkers may be invoked either directly or by the unified
 * fail-closed course-platform gate. Expanding nested scripts keeps that
 * contract honest for `build:release`, which delegates its compilation step to
 * `npm run build`, without requiring every course name to be duplicated in the
 * top-level command string.
 */

const COMMAND_TOKEN = /\bnpm\s+run\s+([A-Za-z0-9:_-]+)\b|\bnext\s+build\b|scripts\/check-course-platform-release\.mjs\b/g;

function unifiedGateIsExecutable(command, index) {
  const segmentStart = Math.max(command.lastIndexOf("&&", index), command.lastIndexOf(";", index)) + 1;
  const andEnd = command.indexOf("&&", index);
  const semicolonEnd = command.indexOf(";", index);
  const candidates = [andEnd, semicolonEnd].filter((value) => value >= 0);
  const segmentEnd = candidates.length ? Math.min(...candidates) : command.length;
  return !command.slice(segmentStart, segmentEnd).includes("--structural-only");
}

function expandCommand(command, scripts, stack) {
  const events = [];
  for (const match of String(command).matchAll(COMMAND_TOKEN)) {
    const npmScript = match[1];
    if (npmScript) {
      events.push({ type: "script", name: npmScript });
      if (!stack.includes(npmScript) && typeof scripts[npmScript] === "string") {
        events.push(...expandCommand(scripts[npmScript], scripts, [...stack, npmScript]));
      }
      continue;
    }
    if (match[0].includes("next")) {
      events.push({ type: "next-build" });
      continue;
    }
    events.push({
      type: unifiedGateIsExecutable(String(command), match.index ?? 0)
        ? "unified-course-gate"
        : "unified-structural-only",
    });
  }
  return events;
}

export function inspectReleaseGateWiring(
  scripts,
  rootScript,
  releaseGate,
  staticGate = null,
) {
  const command = scripts?.[rootScript];
  const events = typeof command === "string"
    ? expandCommand(command, scripts, [rootScript])
    : [];
  const nextBuildIndex = events.findIndex((event) => event.type === "next-build");
  const releaseGateIndex = events.findIndex((event) => (
    (event.type === "script" && event.name === releaseGate)
    || event.type === "unified-course-gate"
  ));
  const staticGateIndex = staticGate
    ? events.findIndex((event) => event.type === "script" && event.name === staticGate)
    : -1;

  return {
    events,
    nextBuildIndex,
    releaseGateIndex,
    staticGateIndex,
    releaseBeforeBuild: nextBuildIndex >= 0
      && releaseGateIndex >= 0
      && releaseGateIndex < nextBuildIndex,
    staticAfterBuild: !staticGate || (
      nextBuildIndex >= 0
      && staticGateIndex > nextBuildIndex
    ),
  };
}

function commandTokens(command) {
  return String(command).match(/"(?:\\.|[^"\\])*"|'[^']*'|[^\s]+/g)?.map((token) => {
    if ((token.startsWith('"') && token.endsWith('"'))
      || (token.startsWith("'") && token.endsWith("'"))) {
      return token.slice(1, -1);
    }
    return token;
  }) ?? [];
}

/**
 * Inspect one package-script entry that launches an isolated course spec.
 *
 * A substring check is not enough here: the previously accepted
 * `playwright test tests/<course>.spec.ts` command used the repository root
 * config whose testDir is `e2e/`, so Playwright exited with "No tests found".
 * This contract requires the course selector and private port to be shell
 * assignments, the spec to be an actual Playwright argument, and the isolated
 * tests/ config to be passed through --config.
 */
export function inspectCoursePlaywrightWiring(command, {
  courseId,
  specPath,
  configPath,
  port,
}) {
  const tokens = commandTokens(command);
  const errors = [];
  const controlOperator = String(command).match(/&&|\|\||[;&|]/)?.[0];
  if (controlOperator) errors.push(`contains shell control operator ${controlOperator}`);

  const firstCommandToken = tokens.findIndex((token) => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(token));
  const usesNpx = tokens[firstCommandToken] === "npx";
  const playwrightIndex = usesNpx ? firstCommandToken + 1 : firstCommandToken;
  const directPlaywrightInvocation = firstCommandToken >= 0
    && tokens[playwrightIndex] === "playwright"
    && tokens[playwrightIndex + 1] === "test";
  if (!directPlaywrightInvocation) errors.push("does not directly invoke playwright test");

  const assignments = firstCommandToken < 0 ? tokens : tokens.slice(0, firstCommandToken);
  const expectedCourseAssignment = `COURSE_TEST_ID=${courseId}`;
  const expectedPortAssignment = `COURSE_TEST_PORT=${port}`;
  if (assignments.filter((token) => token === expectedCourseAssignment).length !== 1) {
    errors.push(`must set ${expectedCourseAssignment} exactly once`);
  }
  if (assignments.filter((token) => token === expectedPortAssignment).length !== 1) {
    errors.push(`must set ${expectedPortAssignment} exactly once`);
  }

  const argumentsAfterTest = directPlaywrightInvocation
    ? tokens.slice(playwrightIndex + 2)
    : [];
  if (argumentsAfterTest.filter((token) => token === specPath).length !== 1) {
    errors.push(`must select ${specPath} exactly once`);
  }

  const configValues = [];
  for (let index = 0; index < argumentsAfterTest.length; index += 1) {
    const token = argumentsAfterTest[index];
    if (token === "--config") {
      configValues.push(argumentsAfterTest[index + 1] ?? "");
      index += 1;
    } else if (token.startsWith("--config=")) {
      configValues.push(token.slice("--config=".length));
    }
  }
  if (configValues.length !== 1 || configValues[0] !== configPath) {
    errors.push(`must use --config ${configPath} exactly once`);
  }

  return {
    tokens,
    directPlaywrightInvocation,
    courseAssignment: assignments.includes(expectedCourseAssignment),
    portAssignment: assignments.includes(expectedPortAssignment),
    specSelected: argumentsAfterTest.includes(specPath),
    configSelected: configValues.length === 1 && configValues[0] === configPath,
    errors,
    valid: errors.length === 0,
  };
}
