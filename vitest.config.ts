import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Unit + component test harness. Pure-TS modules and React islands are tested
 * here; .astro components are exercised by `pnpm build`. The `@/*` alias and
 * automatic JSX runtime mirror tsconfig.json so imports resolve identically.
 */
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
  },
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
