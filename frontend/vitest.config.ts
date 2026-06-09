import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["lib/**/*.test.{ts,tsx}", "components/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      // Gate scoped to the modules under test. Grow this list as new code gets
      // its tests — that is how the "test everything" rule is enforced here.
      include: ["lib/api.ts", "lib/auth.ts", "lib/theme.ts", "components/StatusBadge.tsx"],
      reporter: ["text", "html"],
      thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
    },
  },
});
