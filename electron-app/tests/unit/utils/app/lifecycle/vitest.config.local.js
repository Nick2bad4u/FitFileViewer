import os from "node:os";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    // Ensure paths (include/exclude) resolve from the electron-app root
    root: path.resolve(process.cwd(), "electron-app"),
    test: {
        environment: "jsdom",
        globals: true,
        include: ["**/*.test.{js,ts}"],
        pool: "threads",
        setupFiles: [],
        globalSetup: [],
        expect: { requireAssertions: false },
        coverage: {
            provider: "v8",
            all: false,
            include: ["**/*.js", "**/*.ts"],
            exclude: ["tests/**", "**/*.d.ts", "libs/**", "coverage/**", "node_modules/**"],
            reporter: ["text", "json", "html", "lcov"],
            clean: true,
            cleanOnRerun: true,
            reportsDirectory: path.join(os.tmpdir(), "ffv-vitest-coverage"),
            thresholds: {
                global: { branches: 0, functions: 0, lines: 0, statements: 0 },
            },
        },
    },
});
