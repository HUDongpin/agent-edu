import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "output/**",
    ".playwright-cli/**",
    "playwright-report/**",
    "test-results/**",
    ".claude/**",
    "build/**",
    "next-env.d.ts",
    "examples/**/.next/**",
    "examples/**/out/**",
    "examples/**/node_modules/**",
    "examples/**/next-env.d.ts",
    // Generated third-party bundles; authored video-pilot scripts stay linted.
    "video-pilot/**/assets/vendor/**",
  ]),
]);

export default eslintConfig;
