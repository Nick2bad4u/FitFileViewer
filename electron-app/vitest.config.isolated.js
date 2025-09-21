import os from "node:os";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    cacheDir: "node_modules/.vite-isolated",
    test: {
        // Target only the appActions test to avoid loading the full suite
        include: [
            "tests/unit/utils/app/lifecycle/appActions.test.ts",
        ],
        exclude: [],
        // Keep the environment minimal to avoid jsdom/setup complexity
        environment: "node",
        globals: true,
        setupFiles: [],
        // Avoid forks; use a single thread for determinism
        pool: "threads",
        poolOptions: {
            threads: {
                isolate: true,
                maxThreads: 1,
                minThreads: 1,
                singleThread: true,
                useAtomics: false,
            },
        },
        reporters: ["dot", "html"],
        watch: false,
        coverage: {
            all: false,
            clean: true,
            cleanOnRerun: true,
            allowExternal: false,
            include: [
                "utils/app/lifecycle/appActions.js",
            ],
            exclude: [
                "**/tests/**",
                "**/__mocks__/**",
                "**/*.d.ts",
                "coverage/**",
            ],
            provider: "v8",
            reporter: ["text", "html", "json", "lcov"],
            reportOnFailure: true,
            reportsDirectory: (() => {
                const cwd = process.cwd();
                const isWin = process.platform === "win32";
                const inDropbox = /\\dropbox\\/i.test(cwd) || /\/dropbox\//i.test(cwd);
                if (process.env.VITEST_COVERAGE_DIR) return process.env.VITEST_COVERAGE_DIR;
                if (isWin && inDropbox) return path.join(os.tmpdir(), "ffv-vitest-coverage");
                return "./coverage";
            })(),
            thresholds: {
                autoUpdate: false,
                global: {
                    branches: 0,
                    functions: 0,
                    lines: 0,
                    statements: 0,
                },
            },
        },
    },
});
