/**
 * Enhanced Vitest Configuration for 100% Test Coverage
 * FitFileViewer Electron Application
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        clearMocks: true,
        coverage: {
            exclude: [
                "node_modules/**",
                "libs/**",
                "tests/**",
                "*.config.js",
                "**/*.d.ts",
                "coverage/**",
                "build/**",
                "dist/**",
            ],
            include: [
                "utils/**/*.js",
                "*.js",
                "!main.js", // Main process tested separately
            ],
            provider: "v8",
            reporter: ["text", "html", "json", "lcov"],
            reportsDirectory: "./coverage",
            // Set aggressive thresholds for 100% coverage
            thresholds: {
                "fitParser.js": {
                    branches: 100,
                    functions: 100,
                    lines: 100,
                    statements: 100,
                },
                global: {
                    branches: 100,
                    functions: 100,
                    lines: 100,
                    statements: 100,
                },
                "main-ui.js": {
                    branches: 100,
                    functions: 100,
                    lines: 100,
                    statements: 100,
                },
                "preload.js": {
                    branches: 100,
                    functions: 100,
                    lines: 100,
                    statements: 100,
                },
                "renderer.js": {
                    branches: 100,
                    functions: 100,
                    lines: 100,
                    statements: 100,
                },
                "utils/**/*.js": {
                    branches: 100,
                    functions: 100,
                    lines: 100,
                    statements: 100,
                },
            },
        },
        environment: "jsdom",
        exclude: [
            "libs/**",
            "../libs/**",
            "**/libs/**",
            "**/node_modules/**",
            "node_modules/table/node_modules/json-schema-traverse/spec/index.spec.js",
        ],
        globals: true,
        maxConcurrency: 10,
        mockReset: true,
        // Concurrent test execution
        pool: "threads",
        restoreMocks: true,
        setupFiles: ["./tests/setupVitest.js"],
        // Timeout for complex tests
        testTimeout: 15_000,
    },
});
