import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const MAX_ERRORS = 8;
const MAX_WARNINGS = 31;

async function main() {
  const eslint = new ESLint({ cwd: ROOT });
  const results = await eslint.lintFiles(["."]);
  const totals = results.reduce(
    (summary, result) => ({
      errors: summary.errors + result.errorCount,
      warnings: summary.warnings + result.warningCount,
    }),
    { errors: 0, warnings: 0 },
  );

  const summary =
    `Codex lint baseline: ${totals.errors} error(s) (maximum ${MAX_ERRORS}), `
    + `${totals.warnings} warning(s) (maximum ${MAX_WARNINGS}).\n`;

  if (totals.errors <= MAX_ERRORS && totals.warnings <= MAX_WARNINGS) {
    process.stdout.write(summary);
    return;
  }

  const formatter = await eslint.loadFormatter("stylish");
  const failingResults = results.filter(
    (result) => result.errorCount > 0 || result.warningCount > 0,
  );
  const details = formatter.format(failingResults);

  process.stderr.write(summary);
  if (details) process.stderr.write(`${details}\n`);
  process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`Codex lint baseline could not run: ${error.message}\n`);
  process.exitCode = 1;
});
