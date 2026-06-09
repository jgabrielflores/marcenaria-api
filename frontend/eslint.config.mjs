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
    "build/**",
    "next-env.d.ts",
    // Generated test-coverage report — never lint it.
    "coverage/**",
  ]),
  {
    rules: {
      // setState-in-effect is used intentionally to read browser-only state on mount
      // (e.g. the ?verified flag). Downgraded to a warning; revisit per-component later.
      "react-hooks/set-state-in-effect": "warn",
      // Allow underscore-prefixed args/vars to signal "intentionally unused".
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]);

export default eslintConfig;
