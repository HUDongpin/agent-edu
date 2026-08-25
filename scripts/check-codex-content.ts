#!/usr/bin/env node

import { validateBundledCodexContent } from "../lib/codex/validate";

try {
  const issues = await validateBundledCodexContent();
  process.stdout.write(JSON.stringify({ issues }));
} catch (error) {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(message);
  process.exit(1);
}
