import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // These three files were ported from the verified single-file build. Keep
  // them in the lint graph, but exempt only the legacy idioms the port needs.
  {
    files: [
      "lib/flowchart.ts",
      "lib/handbook/behaviour.ts",
      "lib/handbook/markup.ts",
    ],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "prefer-const": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Not active site source. Course stages have their own checker and are
    // type-checked by the production build.
    ".claude/**",
    "legacy/**",
    "course/**",
  ]),
]);

export default eslintConfig;
