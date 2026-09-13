import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/vitest.setup.ts"],
    hookTimeout: 30000,
    testTimeout: 20000,
    pool: "forks",
  },
});
